from sqlalchemy.orm import Session
from sqlalchemy import extract
from collections import Counter
from datetime import datetime
from .. import models, schemas, crud
from .ai_router import ai_router_service

def generate_monthly_recap(db: Session, month: str) -> schemas.MonthlyRecapResponse:
    # 1. Fetch memories for the month
    try:
        target_date = datetime.strptime(month, "%Y-%m")
    except ValueError:
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

    # 2. Base Statistics (shared)
    highlights = [m.title for m in memories[:3]]
    moods = [m.mood for m in memories if m.mood]
    mood_hint = "neutral"
    if moods:
        mood_hint = Counter(moods).most_common(1)[0][0]

    # 3. Generate Summary
    summary = ""
    settings = crud.get_settings(db)
    
    # Try OpenAI if enabled
    if settings.ai_provider == "openai" and settings.openai_enabled:
        try:
            summary = ai_router_service.generate_recap_openai(memories)
        except Exception as e:
            print(f"OpenAI Recap failed: {e}")
            # Fallback to Auto logic below
            pass
            
    # Auto Mode Logic (Fallback or Default)
    if not summary:
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
        
        if settings.ai_provider == "openai":
            summary += " (Fallback Auto Mode)"

    return schemas.MonthlyRecapResponse(
        month=month,
        total_memories=total_memories,
        highlights=highlights,
        mood_hint=mood_hint,
        summary=summary
    )
