import asyncio
import logging
import re
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.auth_service import decode_token
from app.services.room_service import finish_room
from app.websocket.game_state import active_rooms, GameRoom, PlayerState
from app.websocket import events
from app.websocket.manager import broadcast_to_players, send_to_host, broadcast_to_all
from app.websocket.handlers import (
    dispatch_host_message,
    dispatch_player_message,
    handle_host_disconnect,
    _sanitize,
    _NICKNAME_RE,
    send_current_question,
)

router = APIRouter(tags=["websocket"])
logger = logging.getLogger(__name__)


@router.websocket("/ws/host/{room_code}")
async def host_websocket(websocket: WebSocket, room_code: str, token: str = Query(...)):
    room_code = room_code.upper()
    await websocket.accept()

    # Validate JWT
    payload = decode_token(token)
    if not payload:
        await websocket.send_json({"type": events.ERROR, "payload": {"message": "Invalid or expired token"}})
        await websocket.close(code=4001)
        return

    host_id = int(payload.get("sub", 0))

    # Find room
    room = active_rooms.get(room_code)
    if not room:
        await websocket.send_json({"type": events.ERROR, "payload": {"message": "Room not found"}})
        await websocket.close(code=4004)
        return

    # Cancel pending host disconnect task if reconnecting
    if room.host_disconnect_task and not room.host_disconnect_task.done():
        room.host_disconnect_task.cancel()
        room.host_disconnect_task = None
        logger.info(f"Host reconnected to room {room_code}, disconnect task cancelled")

    room.host_websocket = websocket
    logger.info(f"Host connected to room {room_code}")

    # Send current room state to host
    await websocket.send_json({
        "type": "host_connected",
        "payload": {
            "room_code": room_code,
            "quiz_title": room.quiz_title,
            "player_count": len(room.players),
            "players": [p.nickname for p in room.players.values()],
            "status": room.status,
        },
    })

    # Always send current question if exists
    if room.current_question_index >= 0:
        from app.websocket.handlers import send_current_question_to_host
        # Small delay to ensure connection is ready
        await asyncio.sleep(0.1)
        await send_current_question_to_host(room)

    try:
        while True:
            data = await websocket.receive_json()
            await dispatch_host_message(room, data)
    except WebSocketDisconnect:
        logger.info(f"Host disconnected from room {room_code}")
        room.host_websocket = None
        if room.status == "in_progress":
            await handle_host_disconnect(room)
    except Exception as e:
        logger.error(f"Host WebSocket error in room {room_code}: {e}")
        room.host_websocket = None


@router.websocket("/ws/player/{room_code}")
async def player_websocket(websocket: WebSocket, room_code: str):
    room_code = room_code.upper()
    await websocket.accept()

    # Find room
    room = active_rooms.get(room_code)
    if not room:
        await websocket.send_json({"type": events.ERROR, "payload": {"message": "Room not found"}})
        await websocket.close(code=4004)
        return

    # Wait for player_join message to get nickname
    try:
        join_data = await asyncio.wait_for(websocket.receive_json(), timeout=15.0)
    except asyncio.TimeoutError:
        await websocket.send_json({"type": events.ERROR, "payload": {"message": "Join timeout"}})
        await websocket.close(code=4008)
        return
    except Exception:
        await websocket.close()
        return

    if join_data.get("type") != events.PLAYER_JOIN:
        await websocket.send_json({"type": events.ERROR, "payload": {"message": "Expected player_join message"}})
        await websocket.close(code=4002)
        return

    raw_nickname = join_data.get("payload", {}).get("nickname", "")
    nickname = _sanitize(raw_nickname)[:20]

    # Validate nickname format
    if not nickname or not _NICKNAME_RE.match(nickname):
        await websocket.send_json({
            "type": events.ERROR,
            "payload": {"message": "Invalid nickname. Use 1-20 alphanumeric characters."}
        })
        await websocket.close(code=4002)
        return

    # Check if this nickname already exists in room
    existing_player = room.players.get(nickname)
    game_in_progress = room.status not in ("waiting", "countdown")

    # If same nickname is trying to join, always allow (handles navigation from lobby to game)
    # OR if game is in progress, allow reconnection (player was removed but game started)
    if existing_player:
        logger.info(f"Replacing existing connection for '{nickname}' in room {room_code}")
        # Preserve existing score and seen questions when reconnecting
        room.players[nickname] = PlayerState(
            nickname=nickname,
            websocket=websocket,
            score=existing_player.score,
            current_answer=existing_player.current_answer,
            answer_time=existing_player.answer_time,
            answer_text=existing_player.answer_text,
            seen_questions=existing_player.seen_questions,
        )
    elif game_in_progress:
        logger.info(f"Reconnecting player '{nickname}' to room {room_code} (game in progress)")
        # Check if there was a disconnected player we can restore
        if nickname not in room.players:
            room.players[nickname] = PlayerState(
                nickname=nickname,
                websocket=websocket,
                seen_questions=set(),
            )
    else:
        # New player joining before game starts
        room.players[nickname] = PlayerState(nickname=nickname, websocket=websocket)
        logger.info(f"Player '{nickname}' joined room {room_code}")

    # Sync current question state to reconnecting player (if game in progress)
    if room.status == "in_progress" and room.current_question_index >= 0:
        from app.websocket.handlers import send_current_question
        await send_current_question(room, nickname)

    # Confirm to the player
    await websocket.send_json({
        "type": events.ROOM_JOINED,
        "payload": {
            "room_code": room_code,
            "quiz_title": room.quiz_title,
            "players": [p.nickname for p in room.players.values() if p.websocket],
        },
    })

    # Broadcast to everyone that a player joined
    await broadcast_to_all(room, {
        "type": events.PLAYER_JOINED,
        "payload": {"nickname": nickname, "player_count": len(room.players)},
    })

    try:
        while True:
            data = await websocket.receive_json()
            await dispatch_player_message(room, nickname, data)
    except WebSocketDisconnect:
        logger.info(f"Player '{nickname}' disconnected from room {room_code}")
    except Exception as e:
        logger.error(f"Player WebSocket error '{nickname}' in room {room_code}: {e}")
    finally:
        if nickname in room.players:
            # Only remove if game hasn't started yet. Keep during game for reconnection
            if room.status == "waiting":
                room.players.pop(nickname, None)
                await broadcast_to_all(room, {
                    "type": events.PLAYER_LEFT,
                    "payload": {"nickname": nickname, "player_count": len(room.players)},
                })
            # During game, set websocket to None but keep player data
            elif room.status == "in_progress":
                room.players[nickname].websocket = None
                logger.info(f"Player '{nickname}' disconnected but kept in room for reconnection")
