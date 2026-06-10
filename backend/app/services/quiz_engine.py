import random
from typing import Optional

from sqlalchemy.orm import Session

from app.models.question import Difficulty, Question

DIFFICULTY_WEIGHTS = {
    Difficulty.EASY: 0.4,
    Difficulty.MEDIUM: 0.4,
    Difficulty.HARD: 0.2,
}


def select_questions(
    db: Session,
    topic_id: str,
    count: int = 10,
    difficulty: Optional[str] = None,
    question_type: Optional[str] = None,
) -> list[Question]:
    base_query = db.query(Question).filter(
        Question.topic_id == topic_id,
        Question.is_published == True,
    )

    if question_type:
        base_query = base_query.filter(Question.type == question_type)

    if difficulty:
        # Single-difficulty mode — no weighting needed
        pool = base_query.filter(Question.difficulty == difficulty).all()
        random.shuffle(pool)
        return pool[:count]

    # Weighted selection across all difficulties
    selected: list[Question] = []
    for diff, weight in DIFFICULTY_WEIGHTS.items():
        n = round(count * weight)
        if n == 0:
            continue
        pool = base_query.filter(Question.difficulty == diff).all()
        selected.extend(random.sample(pool, min(n, len(pool))))

    # Top up to `count` from any remaining questions if weighted selection fell short
    if len(selected) < count:
        selected_ids = {q.id for q in selected}
        remaining = base_query.filter(Question.id.notin_(selected_ids)).all()
        random.shuffle(remaining)
        selected.extend(remaining[: count - len(selected)])

    random.shuffle(selected)
    return selected[:count]


def calculate_score(items) -> tuple[int, int]:
    total = sum(item.question.points for item in items)
    earned = sum(item.question.points for item in items if item.is_correct)
    return earned, total
