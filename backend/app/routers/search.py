from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.schemas import APIResponse
from app.services.fts_service import fts_search_service
from app.database import SessionLocal
from app.middleware.vault_middleware import require_unlocked_vault
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/search", tags=["search"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def fast_search(
    q: str = Query(..., min_length=1, description="Search query"),
    month: Optional[str] = Query(None, regex="^\\d{4}-\\d{2}$", description="Filter by month (YYYY-MM)"),
    mood: Optional[str] = Query(None, description="Filter by mood"),
    limit: int = Query(20, ge=1, le=100, description="Result limit"),
    db: Session = Depends(get_db)
):
    """Fast keyword search using FTS5"""
    try:
        results = fts_search_service.search(db, q, month, mood, limit)
        
        return APIResponse(
            success=True,
            data={
                'results': results,
                'count': len(results),
                'query': q
            }
        )
        
    except Exception as e:
        logger.error(f"Fast search error: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Search failed', 'details': str(e)}
        )


@router.post("/rebuild-index", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def rebuild_fts_index(db: Session = Depends(get_db)):
    """Rebuild FTS index (admin endpoint)"""
    try:
        # Ensure FTS table exists
        fts_search_service.create_fts_table(db)
        
        # Rebuild index
        success = fts_search_service.rebuild_fts_index(db)
        
        if success:
            return APIResponse(
                success=True,
                data={'message': 'FTS index rebuilt successfully'}
            )
        else:
            return APIResponse(
                success=False,
                error={'message': 'Failed to rebuild FTS index'}
            )
            
    except Exception as e:
        logger.error(f"Rebuild index error: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Failed to rebuild index', 'details': str(e)}
        )
