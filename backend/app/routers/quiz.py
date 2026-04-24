from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.quiz import Quiz, Question
from app.schemas.quiz import (
    QuizCreate, QuizUpdate, QuizResponse, QuizListResponse,
    QuestionCreate, QuestionUpdate, QuestionResponse, ReorderRequest,
)
from app.services.auth_service import get_current_user
from app.services import quiz_service

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])


def _get_quiz_or_404(quiz_id: int, db: Session, current_user: User) -> Quiz:
    quiz = quiz_service.get_quiz(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return quiz


@router.get("", response_model=List[QuizListResponse])
def list_quizzes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quizzes = quiz_service.get_quizzes_by_host(db, current_user.id)
    return [
        QuizListResponse(
            id=q.id,
            host_id=q.host_id,
            title=q.title,
            description=q.description,
            question_count=len(q.questions),
        )
        for q in quizzes
    ]


@router.post("", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
def create_quiz(
    data: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quiz = quiz_service.create_quiz(db, data, current_user.id)
    return quiz


@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_quiz_or_404(quiz_id, db, current_user)


@router.put("/{quiz_id}", response_model=QuizResponse)
def update_quiz(
    quiz_id: int,
    data: QuizUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quiz = _get_quiz_or_404(quiz_id, db, current_user)
    return quiz_service.update_quiz(db, quiz, data)


@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quiz = _get_quiz_or_404(quiz_id, db, current_user)
    quiz_service.delete_quiz(db, quiz)


@router.post("/{quiz_id}/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def add_question(
    quiz_id: int,
    data: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_quiz_or_404(quiz_id, db, current_user)
    return quiz_service.add_question(db, quiz_id, data)


@router.put("/{quiz_id}/questions/{question_id}", response_model=QuestionResponse)
def update_question(
    quiz_id: int,
    question_id: int,
    data: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_quiz_or_404(quiz_id, db, current_user)
    question = quiz_service.get_question(db, question_id)
    if not question or question.quiz_id != quiz_id:
        raise HTTPException(status_code=404, detail="Question not found")
    return quiz_service.update_question(db, question, data)


@router.delete("/{quiz_id}/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    quiz_id: int,
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_quiz_or_404(quiz_id, db, current_user)
    question = quiz_service.get_question(db, question_id)
    if not question or question.quiz_id != quiz_id:
        raise HTTPException(status_code=404, detail="Question not found")
    quiz_service.delete_question(db, question)


@router.put("/{quiz_id}/questions/reorder", response_model=List[QuestionResponse])
def reorder_questions(
    quiz_id: int,
    data: ReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_quiz_or_404(quiz_id, db, current_user)
    return quiz_service.reorder_questions(db, quiz_id, data.question_ids)
