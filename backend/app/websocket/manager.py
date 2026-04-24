import asyncio
import json
import logging
from typing import Optional
from fastapi import WebSocket
from app.websocket.game_state import GameRoom, active_rooms

logger = logging.getLogger(__name__)


async def _safe_send(ws: WebSocket, message: dict) -> bool:
    """Send a message to a single WebSocket, returning False on failure."""
    try:
        await ws.send_json(message)
        return True
    except Exception as e:
        logger.warning(f"Failed to send to websocket: {e}")
        return False


async def broadcast_to_players(room: GameRoom, message: dict) -> None:
    """Broadcast a message to all players in a room, tolerating individual failures."""
    tasks = [_safe_send(player.websocket, message) for player in room.players.values()]
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)


async def send_to_host(room: GameRoom, message: dict) -> None:
    """Send a message to the host only."""
    if room.host_websocket:
        await _safe_send(room.host_websocket, message)


async def send_to_player(room: GameRoom, nickname: str, message: dict) -> None:
    """Send a message to a specific player."""
    player = room.players.get(nickname)
    if player:
        await _safe_send(player.websocket, message)


async def broadcast_to_all(room: GameRoom, message: dict) -> None:
    """Broadcast to both host and all players."""
    msg_type = message.get("type", "unknown")
    logger.info(f"[BROADCAST] {msg_type} to host={bool(room.host_websocket)}")
    tasks = []
    if room.host_websocket:
        tasks.append(_safe_send(room.host_websocket, message))
    for player in room.players.values():
        if player.websocket:
            logger.info(f"[BROADCAST] {msg_type} to player {player.nickname}")
            tasks.append(_safe_send(player.websocket, message))
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)
