from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.schemas import APIResponse
from app.services.cleanup_service import cleanup_service
from app.database import SessionLocal
from app.middleware.vault_middleware import require_unlocked_vault
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cleanup", tags=["cleanup"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class MergeRequest(BaseModel):
    memory_ids: List[int]
    merge_title: Optional[str] = None


@router.get("/duplicates", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def detect_duplicates(db: Session = Depends(get_db)):
    """Detect duplicate memories"""
    try:
        groups = cleanup_service.detect_duplicates(db)
        
        return APIResponse(
            success=True,
            data={
                'groups': groups,
                'total_groups': len(groups)
            }
        )
        
    except Exception as e:
        logger.error(f"Duplicate detection error: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Failed to detect duplicates', 'details': str(e)}
        )


@router.post("/merge", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def merge_memories(req: MergeRequest, db: Session = Depends(get_db)):
    """Merge multiple memories into one"""
    try:
        if len(req.memory_ids) < 2:
            return APIResponse(
                success=False,
                error={'message': 'At least 2 memories required for merge'}
            )
        
        merged_memory = cleanup_service.merge_memories(db, req.memory_ids, req.merge_title)
        
        if not merged_memory:
            return APIResponse(
                success=False,
                error={'message': 'Failed to merge memories'}
            )
        
        return APIResponse(
            success=True,
            data={
                'id': merged_memory.id,
                'title': merged_memory.title,
                'merged_count': len(req.memory_ids),
                'message': f'Merged {len(req.memory_ids)} memories successfully'
            }
        )
        
    except Exception as e:
        logger.error(f"Memory merge error: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Failed to merge memories', 'details': str(e)}
        )


@router.post("/enhance/{memory_id}", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def enhance_memory(memory_id: int, db: Session = Depends(get_db)):
    """Auto-enhance a memory"""
    try:
        enhanced_memory = cleanup_service.enhance_memory(db, memory_id, use_ai=False)
        
        if not enhanced_memory:
            return APIResponse(
                success=False,
                error={'message': 'Memory not found or enhancement failed'}
            )
        
        return APIResponse(
            success=True,
            data={
                'id': enhanced_memory.id,
                'title': enhanced_memory.title,
                'message': 'Memory enhanced successfully'
            }
        )
        
    except Exception as e:
        logger.error(f"Memory enhancement error: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Failed to enhance memory', 'details': str(e)}
        )
