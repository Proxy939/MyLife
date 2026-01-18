from sqlalchemy.orm import Session
from sqlalchemy import extract
from collections import Counter
from datetime import datetime, timedelta
from .. import models, crud
from .ai_router import ai_router_service

class InsightsService:
    def get_insights(self, db: Session, month: str = None):
        # 1. Fetch Data
        query = db.query(models.Memory)
        
        if month:
            try:
                target_date = datetime.strptime(month, "%Y-%m")
                query = query.filter(
                    extract('year', models.Memory.created_at) == target_date.year,
                    extract('month', models.Memory.created_at) == target_date.month
                )
            except ValueError:
                pass # Ignore invalid month
        else:
            # Default to last 30 days
            cutoff = datetime.now() - timedelta(days=30)
            query = query.filter(models.Memory.created_at >= cutoff)
            
        memories = query.order_by(models.Memory.created_at.desc()).all()
        
        total = len(memories)
        if total == 0:
            return {
                "summary": "No data available for this period.",
                "patterns": [],
                "suggestions": ["Start writing to unlock insights!"],
                "focus_tags": [],
                "mood_breakdown": {}
            }

        # 2. Calculate Stats (Deterministic)
        moods = [m.mood for m in memories if m.mood]
        mood_breakdown = dict(Counter(moods))
        
        all_tags = []
        for m in memories:
            if m.tags:
                all_tags.extend([t.strip() for t in m.tags.split(',') if t.strip()])
        
        tag_counts = Counter(all_tags).most_common(5)
        focus_tags = [{"tag": t, "count": c} for t, c in tag_counts]
        
        top_mood = Counter(moods).most_common(1)[0][0] if moods else "neutral"

        # 3. Rule-Based Insights (Default/Fallback)
        summary = f"You created {total} memories. Your dominant mood was '{top_mood}'."
        patterns = [
            f"You seem to focus on: {', '.join([t[0] for t in tag_counts[:3]])}."
        ]
        suggestions = [
            "Keep extracting tags to see better patterns.",
            "Reflect more on what makes you happy."
        ]
        
        # 4. AI Enhancement
        settings = crud.get_settings(db)
        ai_result = None
        
        try:
            if settings.ai_provider == 'openai' and settings.openai_enabled:
                ai_result = ai_router_service.analyze_insights(memories, 'openai', None)
            elif settings.ai_provider == 'local' and settings.local_model != 'none':
                ai_result = ai_router_service.analyze_insights(memories, 'local', settings.local_model)
        except Exception:
            pass # Fallback to rules

        # Merge AI Results
        if ai_result:
            if ai_result.get("summary"): summary = ai_result["summary"]
            if ai_result.get("patterns"): patterns = ai_result["patterns"]
            if ai_result.get("suggestions"): suggestions = ai_result["suggestions"]

        return {
            "summary": summary,
            "patterns": patterns,
            "suggestions": suggestions,
            "focus_tags": focus_tags,
            "mood_breakdown": mood_breakdown
        }

insights_service = InsightsService()
