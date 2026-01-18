from sqlalchemy.orm import Session
from sqlalchemy import extract
from collections import Counter
from datetime import datetime
from .. import models, schemas, crud

def generate_monthly_recap(db: Session, month: str) -> schemas.MonthlyRecapResponse:
    # 1. Fetch memories for the month
    try:
        target_date = datetime.strptime(month, "%Y-%m")
    except ValueError:
        # Fallback or error, but let's assume valid
        return schemas.MonthlyRecapResponse(
            month=month, total_memories=0, highlights=[], mood_hint="unknown", summary="Invalid date format."
        )

    memories = db.query(models.Memory).filter(
        extract('year', models.Memory.created_at) == target_date.year,
        extract('month', models.Memory.created_at) == target_date.month
    ).order_by(models.Memory.created_at.desc()).all()

    total_memories = len(memories)
    
    if total_memories == 0:
        return schemas.MonthlyRecapResponse(
            month=month,
            total_memories=0,
            highlights=[],
            mood_hint="neutral",
            summary="No memories found for this month."
        )

    # 2. Logic for AUTO mode (Rule-based)
    
    # Highlights: Top 3 most recent titles (already sorted desc by creaed_at)
    highlights = [m.title for m in memories[:3]]

    # Mood Hint: Most frequent mood
    moods = [m.mood for m in memories if m.mood]
    mood_hint = "neutral"
    if moods:
        mood_hint = Counter(moods).most_common(1)[0][0]

    # Summary: Count + Top Tags
    all_tags = []
    for m in memories:
        if m.tags:
            tags_list = [t.strip() for t in m.tags.split(",") if t.strip()]
            all_tags.extend(tags_list)
    
    top_tags = [tag for tag, count in Counter(all_tags).most_common(3)]
    tags_str = ", ".join(top_tags)
    
    summary = f"You recorded {total_memories} memories this month."
    if top_tags:
        summary += f" Key themes were: {tags_str}."
    else:
        summary += " It was a quiet month."

    return schemas.MonthlyRecapResponse(
        month=month,
        total_memories=total_memories,
        highlights=highlights,
        mood_hint=mood_hint,
        summary=summary
    )
