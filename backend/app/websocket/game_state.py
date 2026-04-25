import asyncio
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional
from fastapi import WebSocket


@dataclass
class PlayerState:
    nickname: str
    websocket: WebSocket
    score: int = 0
    current_answer: Optional[int] = None   # index of chosen answer
    answer_time: Optional[float] = None    # seconds taken to answer
    answer_text: Optional[str] = None      # text answer for text-answer questions
    seen_questions: set = field(default_factory=set)  # indices of questions already seen


@dataclass
class GameRoom:
    room_code: str
    quiz_id: int
    host_websocket: Optional[WebSocket]
    questions: List[dict]                          # preloaded question data
    players: Dict[str, PlayerState] = field(default_factory=dict)  # keyed by nickname
    status: str = "waiting"                        # waiting | in_progress | finished
    current_question_index: int = -1
    question_start_time: Optional[float] = None
    answer_counts: Dict[int, int] = field(default_factory=dict)
    host_disconnect_task: Optional[asyncio.Task] = None
    cleanup_task: Optional[asyncio.Task] = None
    question_timer_task: Optional[asyncio.Task] = None
    quiz_title: str = ""
    created_at: float = field(default_factory=time.time)  # timestamp when room was created


# Global in-memory store for all active rooms
active_rooms: Dict[str, GameRoom] = {}
