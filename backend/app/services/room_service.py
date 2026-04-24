import random
import string
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.room import Room
from app.models.quiz import Quiz

logger = logging.getLogger(__name__)


def generate_room_code(db: Session) -> str:
    """Generate a unique 6-character alphanumeric uppercase code."""
    chars = string.ascii_uppercase + string.digits
    for _ in range(20):
        code = "".join(random.choices(chars, k=6))
        existing = db.query(Room).filter(Room.room_code == code).first()
        if not existing:
            return code
    raise RuntimeError("Could not generate a unique room code after 20 attempts")


def create_room(db: Session, quiz_id: int, host_id: int) -> Room:
    code = generate_room_code(db)
    room = Room(room_code=code, quiz_id=quiz_id, host_id=host_id, status="waiting")
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


def get_room_by_code(db: Session, room_code: str):
    return db.query(Room).filter(Room.room_code == room_code).first()


def finish_room(db: Session, room_code: str) -> None:
    room = db.query(Room).filter(Room.room_code == room_code).first()
    if room:
        room.status = "finished"
        room.finished_at = datetime.utcnow()
        db.commit()


def delete_room(db: Session, room_code: str) -> None:
    """Delete a room from the database."""
    room = db.query(Room).filter(Room.room_code == room_code).first()
    if room:
        db.delete(room)
        db.commit()
        logger.info(f"Room {room_code} deleted from database")
