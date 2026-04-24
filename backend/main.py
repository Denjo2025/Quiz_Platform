import logging
import os
import asyncio
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.routers import auth, quiz, rooms, upload
from app.routers.websocket_router import router as ws_router
from app.websocket.game_state import active_rooms

# Import all models so Alembic can see them
import app.models  # noqa: F401

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

WAITING_ROOM_TIMEOUT = 3600  # 1 hour in seconds


async def _cleanup_stale_waiting_rooms():
    """Background task to delete waiting rooms older than 1 hour."""
    while True:
        await asyncio.sleep(300)  # Check every 5 minutes
        try:
            now = time.time()
            stale_codes = []
            for room_code, room in active_rooms.items():
                if room.status == "waiting":
                    age = now - room.created_at
                    if age > WAITING_ROOM_TIMEOUT:
                        stale_codes.append(room_code)
            
            for room_code in stale_codes:
                room = active_rooms.pop(room_code, None)
                logger.info(f"[STALE_CLEANUP] Removed waiting room {room_code}")
                
                # Also delete from database
                from app.models.room import Room
                db = SessionLocal()
                try:
                    db_room = db.query(Room).filter(Room.room_code == room_code).first()
                    if db_room:
                        db.delete(db_room)
                        db.commit()
                        logger.info(f"[STALE_CLEANUP] Deleted room {room_code} from database")
                except Exception as e:
                    logger.error(f"[STALE_CLEANUP] Error deleting {room_code}: {e}")
                    db.rollback()
                finally:
                    db.close()
        except Exception as e:
            logger.error(f"[STALE_CLEANUP] Error in cleanup task: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure uploads directory exists
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    logger.info("Quiz Platform backend starting up...")
    
    # Create tables on startup
    try:
        from app.database import Base, engine
        from app.models import User, Quiz, Question, Room
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
    
    # Start background task to cleanup stale waiting rooms
    cleanup_task = asyncio.create_task(_cleanup_stale_waiting_rooms())
    
    yield
    
    # Cancel cleanup task on shutdown
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    logger.info("Quiz Platform backend shutting down...")


app = FastAPI(
    title="Quiz Platform API",
    description="Real-time multiplayer quiz platform (Kahoot-style)",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — specific origin is required when allow_credentials=True
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:2520",
        "http://127.0.0.1:2520",
        "https://qusapp.vercel.app",
        "https://quiz-platform-6whj.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

# Mount static files for uploaded images
upload_path = Path(settings.UPLOAD_DIR)
upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=str(upload_path)), name="uploads")

# Include REST routers
app.include_router(auth.router)
app.include_router(quiz.router)
app.include_router(rooms.router)
app.include_router(upload.router)

# Include WebSocket router
app.include_router(ws_router)


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}
