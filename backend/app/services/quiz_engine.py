import random

from sqlalchemy.orm import Session

from app.models.question import Difficulty, Question

DIFFICULTY_WEIGHTS = {
    Difficulty.EASY: 0.4,
    Difficulty.MEDIUM: 0.4,
    Difficulty.HARD: 0.2,
}


def select_questions(db: Session, topic_id: str, count: int = 10) -> list[Question]:
    questions_by_diff: dict[Difficulty, list[Question]] = {}

    for diff in Difficulty:
        questions_by_diff[diff] = (
            db.query(Question)
            .filter(
                Question.topic_id == topic_id,
                Question.is_published == True,
                Question.difficulty == diff,
            )
            .all()
        )

    selected: list[Question] = []
    for diff, weight in DIFFICULTY_WEIGHTS.items():
        n = max(1, round(count * weight))
        pool = questions_by_diff[diff]
        selected.extend(random.sample(pool, min(n, len(pool))))

    random.shuffle(selected)
    return selected[:count]


def calculate_score(items) -> tuple[int, int]:
    total = sum(item.question.points for item in items)
    earned = sum(item.question.points for item in items if item.is_correct)
    return earned, total
