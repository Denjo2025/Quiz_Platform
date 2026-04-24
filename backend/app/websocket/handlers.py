import asyncio
import logging
import re
import time
from typing import Optional

from fastapi import WebSocket, WebSocketDisconnect

from app.websocket import events
from app.websocket.game_state import GameRoom, PlayerState, active_rooms
from app.websocket.manager import (
    broadcast_to_all,
    broadcast_to_players,
    send_to_host,
    send_to_player,
)
from app.utils.scoring import calculate_score

logger = logging.getLogger(__name__)

_NICKNAME_RE = re.compile(r'^[A-Za-z0-9 _\-]{1,20}$')


async def _schedule_question_end(room: GameRoom, delay: float) -> None:
    """Auto-end question after time delay (or if game not in progress, cancel)."""
    await asyncio.sleep(delay)
    room.question_timer_task = None
    if room.status == "in_progress" and room.current_question_index >= 0:
        logger.info(f"[Q_TIMER] Time's up for question {room.current_question_index}")
        await send_question_end(room)


def _sanitize(text: str) -> str:
    """Strip HTML tags from text."""
    return re.sub(r'<[^>]+>', '', text).strip()


def _get_leaderboard(room: GameRoom, limit: int = 10) -> list:
    sorted_players = sorted(room.players.values(), key=lambda p: p.score, reverse=True)
    return [
        {"rank": i + 1, "nickname": p.nickname, "score": p.score}
        for i, p in enumerate(sorted_players[:limit])
    ]


async def _schedule_room_cleanup(room_code: str, delay: int = 60) -> None:
    """Remove the room from active_rooms AND database after game ends."""
    logger.info(f"[CLEANUP] Starting cleanup for room {room_code} in {delay}s")
    await asyncio.sleep(delay)
    
    # Remove from memory
    room = active_rooms.pop(room_code, None)
    logger.info(f"[CLEANUP] Removed from memory: {room is not None}")
    
    # Delete from database - with error handling
    from app.database import SessionLocal
    from app.models.room import Room
    
    db = SessionLocal()
    try:
        room = db.query(Room).filter(Room.room_code == room_code).first()
        if room:
            db.delete(room)
            db.commit()
            logger.info(f"[CLEANUP] Room {room_code} deleted from database")
        else:
            logger.warning(f"[CLEANUP] Room {room_code} not found in database")
    except Exception as e:
        logger.error(f"[CLEANUP] Error deleting room {room_code}: {e}")
        db.rollback()
    finally:
        db.close()
    
    logger.info(f"[CLEANUP] Room {room_code} cleanup complete.")


async def handle_host_disconnect(room: GameRoom) -> None:
    """Broadcast host_disconnected and schedule game end after 60 s."""
    await broadcast_to_players(
        room,
        {"type": events.HOST_DISCONNECTED, "payload": {"message": "Host disconnected. Game may resume shortly."}}
    )

    async def _end_after_timeout():
        await asyncio.sleep(60)
        if room.room_code in active_rooms and active_rooms[room.room_code].host_websocket is None:
            await _end_game(room)

    room.host_disconnect_task = asyncio.create_task(_end_after_timeout())


async def _end_game(room: GameRoom) -> None:
    """Finalize game, broadcast results, schedule cleanup."""
    room.status = "finished"
    final_lb = _get_leaderboard(room, limit=len(room.players))
    await broadcast_to_all(room, {"type": events.GAME_END, "payload": {"final_leaderboard": final_lb}})
    # Schedule cleanup in 60 seconds (room deleted from memory + database)
    room.cleanup_task = asyncio.create_task(_schedule_room_cleanup(room.room_code, 60))
    logger.info(f"Game ended in room {room.room_code}")


async def _broadcast_question(room: GameRoom) -> None:
    """Send current question to all connected clients (without correct answer)."""
    q_index = room.current_question_index
    question = room.questions[q_index]
    logger.info(f"[BROADCAST_Q] Question {q_index}: {question.get('text', '')[:50]}")
    room.question_start_time = time.time()
    room.answer_counts = {}
    for player in room.players.values():
        player.current_answer = None
        player.answer_time = None

    safe_answers = [{"text": a["text"], "image_url": a.get("image_url")} for a in question["answers"]]

    payload = {
        "question_index": q_index,
        "total_questions": len(room.questions),
        "text": question["text"],
        "image_url": question.get("image_url"),
        "answers": safe_answers,
        "time_limit": question["time_limit_seconds"],
    }
    logger.info(f"[BROADCAST_Q] Sending question_start with {len(safe_answers)} answers")
    await broadcast_to_all(room, {"type": events.QUESTION_START, "payload": payload})
    
    # Reset the scored flag so next question can be scored
    room._question_scored = False
    logger.info(f"[BROADCAST_Q] Reset score flag for q={q_index}")
    
    # Auto-end question after time limit
    time_limit = question.get("time_limit_seconds", 30)
    room.question_timer_task = asyncio.create_task(_schedule_question_end(room, time_limit))


async def send_current_question(room: GameRoom, nickname: str) -> None:
    """Send current question state to a reconnecting player."""
    if room.status != "in_progress" or room.current_question_index < 0:
        return

    q_index = room.current_question_index
    question = room.questions[q_index]

    # Get player's current state
    player = room.players.get(nickname)
    already_answered = player and player.current_answer is not None
    current_score = player.score if player else 0

    # Get correct answer index for result display
    correct_index = next(
        (i for i, a in enumerate(question["answers"]) if a.get("is_correct")), None
    )

    # Build answer options - hide if already answered to prevent cheating
    if already_answered:
        # Player already answered - show question but mark as answered, no answers visible
        answers_to_send = []
    else:
        # Player hasn't answered - show full question with answers
        answers_to_send = [{"text": a["text"], "image_url": a.get("image_url")} for a in question["answers"]]

    payload = {
        "question_index": q_index,
        "total_questions": len(room.questions),
        "text": question["text"],
        "image_url": question.get("image_url"),
        "answers": answers_to_send,
        "time_limit": question["time_limit_seconds"],
    }
    logger.info(f"[SYNC] Sending question {q_index} to reconnector '{nickname}' already_answered={already_answered}")
    await send_to_player(room, nickname, {"type": events.QUESTION_START, "payload": payload})
    
    # If player already answered, send their result immediately
    if already_answered and player:
        is_correct = player.current_answer == correct_index
        await send_to_player(room, nickname, {
            "type": events.ANSWER_RESULT,
            "payload": {
                "correct": is_correct,
                "points_earned": 0,  # Already scored
                "total_score": current_score,
                "correct_answer_index": correct_index,
            }
        })


async def send_current_question_to_host(room: GameRoom) -> None:
    """Send current question to host (for reconnections)."""
    if room.current_question_index < 0:
        return

    q_index = room.current_question_index
    question = room.questions[q_index]

    # Get answer stats for this question
    answered_count = sum(1 for p in room.players.values() if p.current_answer is not None)
    
    # Get the correct answer index for scoring display
    correct_index = next(
        (i for i, a in enumerate(question["answers"]) if a.get("is_correct")), None
    )

    # Send full question with answers to host (host should see everything)
    payload = {
        "question_index": q_index,
        "total_questions": len(room.questions),
        "text": question["text"],
        "image_url": question.get("image_url"),
        "answers": [{"text": a["text"], "image_url": a.get("image_url")} for a in question["answers"]],
        "time_limit": question["time_limit_seconds"],
    }
    logger.info(f"[SYNC] Sending question {q_index} to host")
    await send_to_host(room, {"type": events.QUESTION_START, "payload": payload})
    await send_to_host(room, {
        "type": events.ANSWER_RECEIVED,
        "payload": {"answers_received": answered_count, "total_players": len(room.players)},
    })


# ─────────────────────────────── HOST HANDLERS ────────────────────────────────

async def on_host_start_game(room: GameRoom) -> None:
    logger.info(f"[START_GAME] Room {room.room_code} status: {room.status}")
    if room.status not in ("waiting", "countdown"):
        logger.warning(f"[START_GAME] Cannot start - status is {room.status}, not 'waiting' or 'countdown'")
        await send_to_host(room, {"type": events.ERROR, "payload": {"message": "Game already started or finished."}})
        return
    
    # Count players with active connections
    connected_players = [p for p in room.players.values() if p.websocket is not None]
    logger.info(f"[START_GAME] Players check: total={len(room.players)}, connected={len(connected_players)}")
    
    if not connected_players:
        await send_to_host(room, {"type": events.ERROR, "payload": {"message": "Need at least one player to start."}})
        return
    if not room.questions:
        await send_to_host(room, {"type": events.ERROR, "payload": {"message": "No questions in this quiz!"}})
        return

    logger.info(f"[START_GAME] Room {room.room_code} has {len(room.questions)} questions, {len(room.players)} players")
    # Keep status "waiting" during countdown so players can still join
    await broadcast_to_all(room, {"type": events.GAME_STARTING, "payload": {"countdown": 3}})
    await asyncio.sleep(3)
    
    # Now set status to in_progress AFTER countdown
    room.status = "in_progress"
    room.current_question_index = 0
    logger.info(f"[START_GAME] Broadcasting question 0")
    await _broadcast_question(room)


async def on_host_next_question(room: GameRoom) -> None:
    if room.status != "in_progress":
        return
    if room.question_timer_task and not room.question_timer_task.done():
        room.question_timer_task.cancel()
        room.question_timer_task = None
    room.current_question_index += 1

    if room.current_question_index >= len(room.questions):
        await _end_game(room)
    else:
        await _broadcast_question(room)


async def on_host_end_question(room: GameRoom) -> None:
    """End the current question early (when all answered or time's up)."""
    if room.status != "in_progress":
        return
    if room.question_timer_task and not room.question_timer_task.done():
        room.question_timer_task.cancel()
        room.question_timer_task = None
    await send_question_end(room)


async def on_host_end_game(room: GameRoom) -> None:
    await _end_game(room)


# ─────────────────────────────── PLAYER HANDLERS ──────────────────────────────

async def on_player_answer(room: GameRoom, nickname: str, answer_index: int) -> None:
    player = room.players.get(nickname)
    if not player:
        return
    if room.status != "in_progress":
        return
    if player.current_answer is not None:
        return  # Already answered — ignore duplicate

    # Record the answer - use max to prevent negative/zero times
    raw_time_taken = time.time() - (room.question_start_time or time.time())
    time_taken = max(raw_time_taken, 0.001)  # Prevent zero/negative time
    player.current_answer = answer_index
    player.answer_time = time_taken

    # Tally answer count
    room.answer_counts[answer_index] = room.answer_counts.get(answer_index, 0) + 1

    # Notify player their answer was received (NOT the result yet)
    await send_to_player(room, nickname, {
        "type": events.ANSWER_RECEIVED,
        "payload": {"message": "Answer received! Waiting for others..."}
    })

    # Check if all have answered - end question immediately if all answered
    total = len(room.players)
    answered = sum(1 for p in room.players.values() if p.current_answer is not None)
    if answered >= total:
        logger.info(f"[PLAYER_ANSWER] All {total} players answered, ending question early")
        # Cancel the timer task if running
        if room.question_timer_task and not room.question_timer_task.done():
            room.question_timer_task.cancel()
            room.question_timer_task = None
        # Send question end immediately
        await send_question_end(room)

    # Notify host of answer count
    answered_count = sum(1 for p in room.players.values() if p.current_answer is not None)
    await send_to_host(room, {
        "type": events.ANSWER_RECEIVED,
        "payload": {
            "answers_received": answered_count,
            "total_players": len(room.players),
        },
    })

    # If all players answered, notify host
    if answered_count == len(room.players):
        await send_to_host(room, {
            "type": events.ALL_ANSWERED,
            "payload": {"message": "All players have answered."},
        })


async def send_question_end(room: GameRoom) -> None:
    """Send question end stats and leaderboard to all."""
    # Prevent duplicate processing - if no current question or already processed
    if room.current_question_index < 0:
        logger.info("[QUESTION_END] No active question, skipping")
        return
    
    # Check if already scored this question
    current_q = room.current_question_index
    is_scored = getattr(room, '_question_scored', False)
    logger.info(f"[QUESTION_END] Checking q={current_q}, is_scored={is_scored}")
    
    if is_scored:
        logger.info(f"[QUESTION_END] ALREADY SCORED q={current_q}, SKIPPING")
        return
    
    # Mark as scored before updating scores
    room._question_scored = True
    logger.info(f"[QUESTION_END] Processing question {current_q}")
    
    question = room.questions[room.current_question_index]
    correct_index = next(
        (i for i, a in enumerate(question["answers"]) if a.get("is_correct")), None
    )
    logger.info(f"[DEBUG] correct_index={correct_index}, answers={[(i, a.get('text'), a.get('is_correct')) for i, a in enumerate(question['answers'])]}")
    total_answers = len(question["answers"])
    answer_stats = [
        {"index": i, "count": room.answer_counts.get(i, 0)}
        for i in range(total_answers)
    ]
    
    # FIRST: Update scores for all players who answered
    # Log current scores before updating
    logger.info(f"[SCORE_DEBUG] Before update - Scores: {[(p.nickname, p.score) for p in room.players.values()]}")
    
    for player in room.players.values():
        if player.current_answer is not None:
            is_correct = player.current_answer == correct_index
            
            # Only give points if answer is correct (NOT for wrong answers)
            points_earned = 0
            if is_correct:
                points_earned = calculate_score(
                    question.get("points", 1000),
                    float(question["time_limit_seconds"]),
                    player.answer_time or 0,
                )
                player.score += points_earned
                logger.info(f"[SCORE] {player.nickname}: correct={is_correct}, earned={points_earned}, total={player.score}")
            else:
                logger.info(f"[SCORE] {player.nickname}: WRONG answer (got {player.current_answer}, expected {correct_index}), earned=0, total={player.score}")
            
            await send_to_player(room, player.nickname, {
                "type": events.ANSWER_RESULT,
                "payload": {
                    "correct": is_correct,
                    "points_earned": points_earned,
                    "total_score": player.score,
                    "correct_answer_index": correct_index,
                },
            })
        else:
            # Player didn't answer (no answer received)
            logger.info(f"[SCORE] {player.nickname}: NO ANSWER, earned=0, total={player.score}")
            await send_to_player(room, player.nickname, {
                "type": events.ANSWER_RESULT,
                "payload": {
                    "correct": False,
                    "points_earned": 0,
                    "total_score": player.score,
                    "correct_answer_index": correct_index,
                },
            })
    
    # SECOND: Generate leaderboard AFTER scores are updated
    leaderboard = _get_leaderboard(room, limit=10)
    
    logger.info(f"[QUESTION_END] Broadcasting to all - host={bool(room.host_websocket)}, players={len([p for p in room.players.values() if p.websocket])}")
    
    # Broadcast question end to all
    await broadcast_to_all(room, {
        "type": events.QUESTION_END,
        "payload": {
            "correct_answer_index": correct_index,
            "answer_stats": answer_stats,
            "leaderboard": leaderboard,
        },
    })
    
    logger.info(f"[QUESTION_END] Broadcast complete")


# ─────────────────────────────── DISPATCH ─────────────────────────────────────

async def dispatch_host_message(room: GameRoom, message: dict) -> None:
    msg_type = message.get("type")
    if msg_type == events.HOST_START_GAME:
        await on_host_start_game(room)
    elif msg_type == events.HOST_NEXT_QUESTION:
        # First send question_end for the current question
        if room.status == "in_progress" and room.current_question_index >= 0:
            await send_question_end(room)
            await asyncio.sleep(0.5)
        await on_host_next_question(room)
    elif msg_type == events.HOST_END_QUESTION:
        # End current question early (all answered or time up)
        await on_host_end_question(room)
    elif msg_type == events.HOST_END_GAME:
        await on_host_end_game(room)
    else:
        logger.debug(f"Unknown host message type: {msg_type}")


async def dispatch_player_message(room: GameRoom, nickname: str, message: dict) -> None:
    msg_type = message.get("type")
    payload = message.get("payload", {})
    if msg_type == events.PLAYER_ANSWER:
        answer_index = payload.get("answer_index")
        if isinstance(answer_index, int):
            await on_player_answer(room, nickname, answer_index)
    else:
        logger.debug(f"Unknown player message type: {msg_type}")
