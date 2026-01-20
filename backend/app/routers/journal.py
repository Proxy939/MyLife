from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.schemas import APIResponse
from app.services.journal_service import journal_service
from app.database import SessionLocal
from app.middleware.vault_middleware import require_unlocked_vault
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/journal", tags=["journal"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/prompt", response_model=APIResponse[dict])
def get_daily_prompt(date: Optional[str] = Query(None, regex="^\\d{4}-\\d{2}-\\d{2}$")):
    """Get daily journaling prompt"""
    try:
        prompt_data = journal_service.get_daily_prompt(date)
        
        return APIResponse(
            success=True,
            data=prompt_data
        )
        
    except Exception as e:
        logger.error(f"Error getting prompt: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Failed to get daily prompt', 'details': str(e)}
        )


@router.post("/auto-draft", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def create_auto_draft(
    date: Optional[str] = Query(None, regex="^\\d{4}-\\d{2}-\\d{2}$"),
    db: Session = Depends(get_db)
):
    """Create automatic daily log draft"""
    try:
        memory = journal_service.create_auto_draft(db, date)
        
        if not memory:
            return APIResponse(
                success=False,
                error={'message': 'Failed to create auto-draft'}
            )
        
        return APIResponse(
            success=True,
            data={
                'id': memory.id,
                'title': memory.title,
                'date': memory.timestamp[:10] if memory.timestamp else None,
                'message': 'Daily log created successfully'
            }
        )
        
    except Exception as e:
        logger.error(f"Error creating auto-draft: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Failed to create auto-draft', 'details': str(e)}
        )


@router.get("/weekly-review", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def get_weekly_review(
    week_start: str = Query(..., regex="^\\d{4}-\\d{2}-\\d{2}$"),
    db: Session = Depends(get_db)
):
    """Get weekly review summary"""
    try:
        review = journal_service.get_weekly_review(db, week_start)
        
        return APIResponse(
            success=True,
            data=review
        )
        
    except Exception as e:
        logger.error(f"Error generating weekly review: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Failed to generate weekly review', 'details': str(e)}
        )
