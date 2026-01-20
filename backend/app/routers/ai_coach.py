from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.schemas import APIResponse
from app.database import SessionLocal
from app.middleware.vault_middleware import require_unlocked_vault
from app import models
from datetime import datetime
import logging
import re

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class CoachRequest(BaseModel):
    message: str
    month: Optional[str] = None


@router.post("/coach", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def ai_coach(req: CoachRequest, db: Session = Depends(get_db)):
    """AI Coach with memory context"""
    try:
        # Get relevant memories
        memories = []
        if req.month:
            memories = db.query(models.Memory).filter(
                models.Memory.is_deleted == False,
                models.Memory.timestamp.like(f"{req.month}%")
            ).order_by(models.Memory.created_at.desc()).limit(10).all()
        else:
            memories = db.query(models.Memory).filter(
                models.Memory.is_deleted == False
            ).order_by(models.Memory.created_at.desc()).limit(10).all()
        
        # AUTO mode coaching (rule-based)
        memory_summary = [f"{m.title}: {m.note[:100]}..." for m in memories]
        
        # Simple pattern-based coaching
        message_lower = req.message.lower()
        
        if 'help' in message_lower or 'advice' in message_lower:
            reply = f"Based on your recent {len(memories)} memories, I notice you've been documenting your journey. Here are some personalized suggestions:"
            action_plan = [
                "Continue journaling daily for best insights",
                "Review your weekly patterns",
                "Set specific goals for next week"
            ]
        elif 'goal' in message_lower or 'achieve' in message_lower:
            reply = "Let's work on turning your aspirations into actionable goals!"
            action_plan = [
                "Break down big goals into small steps",
                "Schedule time for goal-related tasks",
                "Track progress weekly"
            ]
        elif 'mood' in message_lower or 'feeling' in message_lower:
            moods = [m.mood for m in memories if m.mood]
            mood_summary = ", ".join(set(moods[:5]))
            reply = f"Your recent moods have been: {mood_summary}. Remember, it's normal to have ups and downs."
            action_plan = [
                "Practice gratitude daily",
                "Identify mood triggers",
                "Engage in activities you enjoy"
            ]
        else:
            reply = f"I've reviewed your recent memories. You have {len(memories)} entries recently. What would you like to focus on?"
            action_plan = [
                "Ask me about goals, moods, or patterns",
                "Review your weekly summary",
                "Set new intentions"
            ]
        
        memory_refs = [m.id for m in memories[:5]]
        
        return APIResponse(
            success=True,
            data={
                'reply': reply,
                'action_plan': action_plan,
                'memory_refs': memory_refs
            }
        )
        
    except Exception as e:
        logger.error(f"AI Coach error: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Coach unavailable', 'details': str(e)}
        )
