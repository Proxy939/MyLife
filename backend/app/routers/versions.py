from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.schemas import APIResponse
from app.services.version_service import version_service, audit_service
from app.database import SessionLocal
from app.middleware.vault_middleware import require_unlocked_vault
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/versions", tags=["versions"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/memory/{memory_id}", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def get_memory_versions(memory_id: int, db: Session = Depends(get_db)):
    """Get all versions for a memory"""
    try:
        versions = version_service.get_versions(db, memory_id)
        
        return APIResponse(
            success=True,
            data={'versions': versions, 'count': len(versions)}
        )
        
    except Exception as e:
        logger.error(f"Get versions error: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Failed to get versions', 'details': str(e)}
        )


@router.post("/restore/{memory_id}/{version_id}", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def restore_version(memory_id: int, version_id: int, db: Session = Depends(get_db)):
    """Restore a memory to a specific version"""
    try:
        success = version_service.restore_version(db, memory_id, version_id)
        
        if success:
            audit_service.log(db, 'restore_version', 'memory', f"Restored memory {memory_id} to version {version_id}", memory_id)
            
            return APIResponse(
                success=True,
                data={'message': 'Memory restored to previous version'}
            )
        else:
            return APIResponse(
                success=False,
                error={'message': 'Failed to restore version'}
            )
            
    except Exception as e:
        logger.error(f"Restore version error: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Failed to restore version', 'details': str(e)}
        )


@router.get("/audit", response_model=APIResponse[dict])
def get_audit_log(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Get audit log"""
    try:
        logs = audit_service.get_logs(db, limit)
        
        return APIResponse(
            success=True,
            data={'logs': logs, 'count': len(logs)}
        )
        
    except Exception as e:
        logger.error(f"Get audit log error: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Failed to get audit log', 'details': str(e)}
        )
