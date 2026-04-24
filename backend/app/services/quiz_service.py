from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.quiz import Quiz, Question
from app.schemas.quiz import QuizCreate, QuizUpdate, QuestionCreate, QuestionUpdate


def get_quizzes_by_host(db: Session, host_id: int) -> List[Quiz]:
    return db.query(Quiz).filter(Quiz.host_id == host_id).all()


def get_quiz(db: Session, quiz_id: int) -> Optional[Quiz]:
    return db.query(Quiz).filter(Quiz.id == quiz_id).first()


def create_quiz(db: Session, data: QuizCreate, host_id: int) -> Quiz:
    quiz = Quiz(title=data.title, description=data.description, host_id=host_id)
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz


def update_quiz(db: Session, quiz: Quiz, data: QuizUpdate) -> Quiz:
    if data.title is not None:
        quiz.title = data.title
    if data.description is not None:
        quiz.description = data.description
    db.commit()
    db.refresh(quiz)
    return quiz


def delete_quiz(db: Session, quiz: Quiz) -> None:
    db.delete(quiz)
    db.commit()


def add_question(db: Session, quiz_id: int, data: QuestionCreate) -> Question:
    q = Question(
        quiz_id=quiz_id,
        order_index=data.order_index,
        text=data.text,
        image_url=data.image_url,
        time_limit_seconds=data.time_limit_seconds,
        points=data.points,
        answers=[a.model_dump() for a in data.answers],
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


def update_question(db: Session, question: Question, data: QuestionUpdate) -> Question:
    question.text = data.text
    question.image_url = data.image_url
    question.time_limit_seconds = data.time_limit_seconds
    question.points = data.points
    question.order_index = data.order_index
    question.answers = [a.model_dump() for a in data.answers]
    db.commit()
    db.refresh(question)
    return question


def delete_question(db: Session, question: Question) -> None:
    db.delete(question)
    db.commit()


def get_question(db: Session, question_id: int) -> Optional[Question]:
    return db.query(Question).filter(Question.id == question_id).first()


def reorder_questions(db: Session, quiz_id: int, question_ids: List[int]) -> List[Question]:
    questions = db.query(Question).filter(
        Question.quiz_id == quiz_id,
        Question.id.in_(question_ids)
    ).all()
    id_to_question = {q.id: q for q in questions}
    for index, qid in enumerate(question_ids):
        if qid in id_to_question:
            id_to_question[qid].order_index = index
    db.commit()
    return sorted(questions, key=lambda q: q.order_index)
