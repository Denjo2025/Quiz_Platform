from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RoomCreate(BaseModel):
    quiz_id: int


class RoomResponse(BaseModel):
    id: int
    room_code: str
    quiz_id: Optional[int]
    host_id: int
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class RoomInfo(BaseModel):
    room_code: str
    quiz_title: str
    status: str
    player_count: int
