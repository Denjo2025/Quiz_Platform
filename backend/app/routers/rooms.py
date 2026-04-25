import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.quiz import Quiz
from app.schemas.room import RoomCreate, RoomResponse, RoomInfo
from app.services.auth_service import get_current_user
from app.services.room_service import create_room, get_room_by_code
from app.websocket.game_state import active_rooms

router = APIRouter(prefix="/api/rooms", tags=["rooms"])
logger = logging.getLogger(__name__)

_room_creation_log = {}

def _check_rate_limit(host_id: int) -> None:
    import time
    now = time.time()
    window = 3600  # 1 hour
    max_rooms = 10
    timestamps = _room_creation_log.get(host_id, [])
    timestamps = [t for t in timestamps if now - t < window]
    if len(timestamps) >= max_rooms:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded: max {max_rooms} rooms per hour"
        )
    timestamps.append(now)
    _room_creation_log[host_id] = timestamps


@router.post("/", response_model=RoomResponse, status_code=201)
def create_game_room(
    data: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.info(f"[CREATE_ROOM] user_id={current_user.id}")
    _check_rate_limit(current_user.id)
    quiz = db.query(Quiz).filter(Quiz.id == data.quiz_id, Quiz.host_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found or not owned by you")
    if not quiz.questions:
        raise HTTPException(status_code=400, detail="Quiz must have at least one question")

    room = create_room(db, data.quiz_id, current_user.id)

    # Preload questions into active_rooms immediately
    from app.websocket.game_state import GameRoom
    preloaded_questions = []
    for q in sorted(quiz.questions, key=lambda x: x.order_index):
        preloaded_questions.append({
            "id": q.id,
            "text": q.text,
            "image_url": q.image_url,
            "time_limit_seconds": q.time_limit_seconds,
            "points": q.points,
            "answers": q.answers,
            "order_index": q.order_index,
            "is_text_answer": q.is_text_answer,
        })
    logger.info(f"[ROOM_CREATE] Quiz {quiz.title}: {len(preloaded_questions)} questions preloaded")
    for i, q in enumerate(preloaded_questions):
        logger.info(f"[ROOM_CREATE] Q{i+1}: is_text_answer={q.get('is_text_answer')}")

    active_rooms[room.room_code] = GameRoom(
        room_code=room.room_code,
        quiz_id=data.quiz_id,
        host_websocket=None,
        questions=preloaded_questions,
        quiz_title=quiz.title,
    )
    logger.info(f"Room {room.room_code} created for quiz '{quiz.title}'")
    return room


@router.get("/debug-state/{room_code}")
def debug_room_state(room_code: str):
    from app.websocket.game_state import active_rooms
    room = active_rooms.get(room_code.upper())
    if not room:
        return {"error": "Room not found"}
    return {
        "status": room.status,
        "questions_count": len(room.questions),
        "current_question_index": room.current_question_index,
        "questions": room.questions[:1] if room.questions else [],
    }


@router.get("/{room_code}", response_model=RoomInfo)
def get_room_info(room_code: str, db: Session = Depends(get_db)):
    room_code = room_code.upper()
    game_room = active_rooms.get(room_code)
    if game_room:
        db_room = db.query(Quiz).filter(Quiz.id == game_room.quiz_id).first()
        quiz_title = game_room.quiz_title if game_room.quiz_title else (db_room.title if db_room else "Unknown")
        return RoomInfo(
            room_code=room_code,
            quiz_title=quiz_title,
            status=game_room.status,
            player_count=len(game_room.players),
        )
    db_room = get_room_by_code(db, room_code)
    if not db_room:
        raise HTTPException(status_code=404, detail="Room not found")
    quiz = db.query(Quiz).filter(Quiz.id == db_room.quiz_id).first()
    return RoomInfo(
        room_code=room_code,
        quiz_title=quiz.title if quiz else "Unknown",
        status=db_room.status,
        player_count=0,
    )


@router.post("/{room_code}/end")
def end_room_game(room_code: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """End a game and clean up the room immediately."""
    room_code = room_code.upper()
    game_room = active_rooms.get(room_code)
    
    # Cancel any pending cleanup tasks
    if game_room and game_room.cleanup_task:
        game_room.cleanup_task.cancel()
    
    # Delete from database
    from app.services.room_service import delete_room
    try:
        delete_room(db, room_code)
        db.commit()
        logger.info(f"Room {room_code} deleted from database via API")
    except Exception as e:
        logger.error(f"Error deleting room {room_code}: {e}")
        db.rollback()
    
    # Remove from memory
    active_rooms.pop(room_code, None)
    
    return {"message": "Game ended and room cleaned up"}
