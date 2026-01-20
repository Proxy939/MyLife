from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.schemas import APIResponse
from app.database import SessionLocal
from app.middleware.vault_middleware import require_unlocked_vault
from app import models
from datetime import datetime
import logging
import re

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/goals", tags=["goals"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class GoalCreate(BaseModel):
    title: str
    description: str = ""
    source_memory_id: Optional[int] = None


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


@router.get("", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def get_goals(db: Session = Depends(get_db)):
    """Get all goals"""
    try:
        goals = db.query(models.Goal).order_by(
            models.Goal.created_at.desc()
        ).all()
        
        results = [{
            'id': g.id,
            'title': g.title,
            'description': g.description,
            'status': g.status,
            'source_memory_id': g.source_memory_id,
            'created_at': g.created_at.isoformat() if g.created_at else None,
            'completed_at': g.completed_at
        } for g in goals]
        
        return APIResponse(
            success=True,
            data={'goals': results, 'count': len(results)}
        )
        
    except Exception as e:
        logger.error(f"Get goals error: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Failed to get goals', 'details': str(e)}
        )


@router.post("", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def create_goal(goal: GoalCreate, db: Session = Depends(get_db)):
    """Create a new goal"""
    try:
        new_goal = models.Goal(
            title=goal.title,
            description=goal.description,
            source_memory_id=goal.source_memory_id
        )
        
        db.add(new_goal)
        db.commit()
        db.refresh(new_goal)
        
        return APIResponse(
            success=True,
            data={'id': new_goal.id, 'message': 'Goal created successfully'}
        )
        
    except Exception as e:
        logger.error(f"Create goal error: {e}")
        db.rollback()
        return APIResponse(
            success=False,
            error={'message': 'Failed to create goal', 'details': str(e)}
        )


@router.put("/{goal_id}", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def update_goal(goal_id: int, goal: GoalUpdate, db: Session = Depends(get_db)):
    """Update a goal"""
    try:
        db_goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
        
        if not db_goal:
            return APIResponse(
                success=False,
                error={'message': 'Goal not found'}
            )
        
        if goal.title:
            db_goal.title = goal.title
        if goal.description is not None:
            db_goal.description = goal.description
        if goal.status:
            db_goal.status = goal.status
            if goal.status == 'completed' and not db_goal.completed_at:
                db_goal.completed_at = datetime.now().isoformat()
        
        db.commit()
        
        return APIResponse(
            success=True,
            data={'message': 'Goal updated successfully'}
        )
        
    except Exception as e:
        logger.error(f"Update goal error: {e}")
        db.rollback()
        return APIResponse(
            success=False,
            error={'message': 'Failed to update goal', 'details': str(e)}
        )


@router.delete("/{goal_id}", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    """Delete a goal"""
    try:
        db_goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
        
        if not db_goal:
            return APIResponse(
                success=False,
                error={'message': 'Goal not found'}
            )
        
        db.delete(db_goal)
        db.commit()
        
        return APIResponse(
            success=True,
            data={'message': 'Goal deleted successfully'}
        )
        
    except Exception as e:
        logger.error(f"Delete goal error: {e}")
        db.rollback()
        return APIResponse(
            success=False,
            error={'message': 'Failed to delete goal', 'details': str(e)}
        )


@router.post("/extract", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def extract_goals(
    month: Optional[str] = Query(None, regex="^\\d{4}-\\d{2}$"),
    db: Session = Depends(get_db)
):
    """Extract goals from memories using AUTO mode patterns"""
    try:
        # Get memories for the month
        query = db.query(models.Memory).filter(models.Memory.is_deleted == False)
        
        if month:
            query = query.filter(models.Memory.timestamp.like(f"{month}%"))
        
        memories = query.order_by(models.Memory.created_at.desc()).limit(50).all()
        
        # Goal extraction patterns
        patterns = [
            r'(?:I want to|I will|I plan to|My goal is to)\s+(.+?)(?:\.|$)',
            r'(?:Goal|Target|Objective):\s*(.+?)(?:\.|$)',
            r'(?:Need to|Must|Should)\s+(.+?)(?:\.|$)'
        ]
        
        extracted_goals = []
        
        for memory in memories:
            text = f"{memory.title} {memory.note}"
            
            for pattern in patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                for match in matches:
                    goal_text = match.strip()[:200]  # Limit length
                    if len(goal_text) > 10:  # Minimum length
                        # Check if similar goal already exists
                        existing = db.query(models.Goal).filter(
                            models.Goal.title.like(f"%{goal_text[:30]}%")
                        ).first()
                        
                        if not existing:
                            new_goal = models.Goal(
                                title=goal_text,
                                description=f"Extracted from: {memory.title}",
                                source_memory_id=memory.id
                            )
                            db.add(new_goal)
                            extracted_goals.append(goal_text)
        
        db.commit()
        
        return APIResponse(
            success=True,
            data={
                'extracted_count': len(extracted_goals),
                'goals': extracted_goals[:10]  # Show first 10
            }
        )
        
    except Exception as e:
        logger.error(f"Extract goals error: {e}")
        db.rollback()
        return APIResponse(
            success=False,
            error={'message': 'Failed to extract goals', 'details': str(e)}
        )
