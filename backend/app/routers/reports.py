from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.schemas import APIResponse
from app.database import SessionLocal
from app.middleware.vault_middleware import require_unlocked_vault
from app import models
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["reports"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/weekly", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def get_weekly_report(
    week_start: str = Query(..., regex="^\\d{4}-\\d{2}-\\d{2}$"),
    db: Session = Depends(get_db)
):
    """Generate weekly life report"""
    try:
        start_date = datetime.strptime(week_start, "%Y-%m-%d")
        end_date = start_date + timedelta(days=7)
        
        # Get memories for the week
        memories = db.query(models.Memory).filter(
            models.Memory.is_deleted == False,
            models.Memory.timestamp >= start_date.isoformat(),
            models.Memory.timestamp < end_date.isoformat()
        ).all()
        
        if not memories:
            return APIResponse(
                success=True,
                data={
                    'week_start': week_start,
                    'summary': 'No data for this week',
                    'total_memories': 0,
                    'highlights': [],
                    'mood_breakdown': {},
                    'top_tags': [],
                    'suggestions': []
                }
            )
        
        # Calculate stats
        total_memories = len(memories)
        
        # Mood breakdown
        mood_counts = {}
        for mem in memories:
            if mem.mood:
                mood_counts[mem.mood] = mood_counts.get(mem.mood, 0) + 1
        
        # Top tags
        tag_counts = {}
        for mem in memories:
            if mem.tags:
                tags = [t.strip() for t in mem.tags.split(',')]
                for tag in tags:
                    if tag:
                        tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        top_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        top_tags = [{'tag': tag, 'count': count} for tag, count in top_tags]
        
        # Highlights
        highlights = []
        for mem in memories:
            if mem.photos or (mem.note and len(mem.note) > 100):
                highlights.append({
                    'id': mem.id,
                    'title': mem.title,
                    'date': mem.timestamp[:10] if mem.timestamp else None
                })
        highlights = highlights[:5]
        
        # Summary
        dominant_mood = max(mood_counts.items(), key=lambda x: x[1])[0] if mood_counts else 'neutral'
        summary = f"This week you created {total_memories} memories. Your dominant mood was {dominant_mood}."
        
        # Suggestions
        suggestions = [
            "Continue your consistent journaling habit",
            "Reflect on this week's highlights",
            "Set intentions for next week"
        ]
        
        if 'sad' in mood_counts or 'anxious' in mood_counts:
            suggestions.append("Consider self-care activities to boost your mood")
        
        return APIResponse(
            success=True,
            data={
                'week_start': week_start,
                'week_end': end_date.strftime("%Y-%m-%d"),
                'summary': summary,
                'total_memories': total_memories,
                'highlights': highlights,
                'mood_breakdown': mood_counts,
                'top_tags': top_tags,
                'suggestions': suggestions
            }
        )
        
    except Exception as e:
        logger.error(f"Weekly report error: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Failed to generate weekly report', 'details': str(e)}
        )


@router.get("/yearly", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def get_yearly_report(
    year: int = Query(..., ge=2000, le=2100),
    db: Session = Depends(get_db)
):
    """Generate yearly life report"""
    try:
        # Get memories for the year
        memories = db.query(models.Memory).filter(
            models.Memory.is_deleted == False,
            models.Memory.timestamp.like(f"{year}%")
        ).all()
        
        if not memories:
            return APIResponse(
                success=True,
                data={
                    'year': year,
                    'summary': 'No data for this year',
                    'total_memories': 0,
                    'top_tags': [],
                    'best_month': None,
                    'hardest_month': None,
                    'growth_insights': []
                }
            )
        
        total_memories = len(memories)
        
        # Top tags
        tag_counts = {}
        for mem in memories:
            if mem.tags:
                tags = [t.strip() for t in mem.tags.split(',')]
                for tag in tags:
                    if tag:
                        tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        top_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        top_tags = [{'tag': tag, 'count': count} for tag, count in top_tags]
        
        # Monthly analysis
        month_stats = {}
        for mem in memories:
            if mem.timestamp:
                month = mem.timestamp[:7]  # YYYY-MM
                if month not in month_stats:
                    month_stats[month] = {'count': 0, 'happy': 0, 'sad': 0}
                month_stats[month]['count'] += 1
                if mem.mood == 'happy' or mem.mood == 'grateful' or mem.mood == 'excited':
                    month_stats[month]['happy'] += 1
                if mem.mood == 'sad' or mem.mood == 'anxious' or mem.mood == 'angry':
                    month_stats[month]['sad'] += 1
        
        # Best and hardest months
        best_month = max(month_stats.items(), key=lambda x: x[1]['happy'])[0] if month_stats else None
        hardest_month = max(month_stats.items(), key=lambda x: x[1]['sad'])[0] if month_stats else None
        
        # Growth insights
        growth_insights = [
            f"You captured {total_memories} memories this year",
            f"Most active theme: {top_tags[0]['tag']}" if top_tags else "Start tagging memories for insights",
            f"Best month: {best_month}" if best_month else "Track moods consistently",
            "Keep documenting your journey for deeper insights"
        ]
        
        summary = f"{year} was a year of {total_memories} documented moments. Your journey continues to unfold."
        
        return APIResponse(
            success=True,
            data={
                'year': year,
                'summary': summary,
                'total_memories': total_memories,
                'top_tags': top_tags,
                'best_month': best_month,
                'hardest_month': hardest_month,
                'growth_insights': growth_insights,
                'monthly_breakdown': month_stats
            }
        )
        
    except Exception as e:
        logger.error(f"Yearly report error: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Failed to generate yearly report', 'details': str(e)}
        )
