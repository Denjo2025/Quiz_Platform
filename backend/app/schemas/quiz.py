from typing import Optional, List
from pydantic import BaseModel, field_validator


class AnswerOption(BaseModel):
    text: str
    is_correct: bool
    image_url: Optional[str] = None


class QuestionCreate(BaseModel):
    text: str
    image_url: Optional[str] = None
    time_limit_seconds: int = 20
    points: int = 1000
    answers: List[AnswerOption]
    order_index: int = 0

    @field_validator("time_limit_seconds")
    @classmethod
    def validate_time_limit(cls, v):
        if v not in [10, 20, 30, 60]:
            raise ValueError("time_limit_seconds must be one of: 10, 20, 30, 60")
        return v

    @field_validator("answers")
    @classmethod
    def validate_answers(cls, v):
        if len(v) < 2 or len(v) > 4:
            raise ValueError("Must have 2 to 4 answer options")
        correct_count = sum(1 for a in v if a.is_correct)
        if correct_count != 1:
            raise ValueError("Exactly one answer must be marked correct")
        return v


class QuestionUpdate(QuestionCreate):
    pass


class QuestionResponse(BaseModel):
    id: int
    quiz_id: int
    order_index: int
    text: str
    image_url: Optional[str] = None
    time_limit_seconds: int
    points: int
    answers: List[AnswerOption]

    model_config = {"from_attributes": True}


class QuizCreate(BaseModel):
    title: str
    description: Optional[str] = None


class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class QuizResponse(BaseModel):
    id: int
    host_id: int
    title: str
    description: Optional[str] = None
    questions: List[QuestionResponse] = []

    model_config = {"from_attributes": True}


class QuizListResponse(BaseModel):
    id: int
    host_id: int
    title: str
    description: Optional[str] = None
    question_count: int = 0

    model_config = {"from_attributes": True}


class ReorderRequest(BaseModel):
    question_ids: List[int]
