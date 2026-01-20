from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas import APIResponse
from app.services.version_service import version_service, audit_service
from app.database import SessionLocal
from app.middleware.vault_middleware import require_unlocked_vault
from app import models
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trash", tags=["trash"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def get_trash(db: Session = Depends(get_db)):
    """Get all deleted memories"""
    try:
        deleted_memories = db.query(models.Memory).filter(
            models.Memory.is_deleted == True
        ).order_by(models.Memory.deleted_at.desc()).all()
        
        results = []
        for mem in deleted_memories:
            results.append({
                'id': mem.id,
                'title': mem.title,
                'note': mem.note[:200],
                'tags': mem.tags,
                'mood': mem.mood,
                'deleted_at': mem.deleted_at,
                'created_at': mem.created_at.isoformat() if mem.created_at else None
            })
        
        return APIResponse(
            success=True,
            data={'trash': results, 'count': len(results)}
        )
        
    except Exception as e:
        logger.error(f"Get trash error: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Failed to get trash', 'details': str(e)}
        )


@router.post("/restore/{memory_id}", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def restore_from_trash(memory_id: int, db: Session = Depends(get_db)):
    """Restore a deleted memory"""
    try:
        memory = db.query(models.Memory).filter(models.Memory.id == memory_id).first()
        
        if not memory:
            return APIResponse(
                success=False,
                error={'message': 'Memory not found'}
            )
        
        if not memory.is_deleted:
            return APIResponse(
                success=False,
                error={'message': 'Memory is not in trash'}
            )
        
        # Restore
        memory.is_deleted = False
        memory.deleted_at = None
        db.commit()
        
        # Create version
        version_service.create_version(db, memory, 'restored')
        
        # Audit log
        audit_service.log(db, 'restore', 'memory', f"Restored memory '{memory.title}'", memory.id)
        
        return APIResponse(
            success=True,
            data={'id': memory.id, 'message': 'Memory restored successfully'}
        )
        
    except Exception as e:
        logger.error(f"Restore error: {e}")
        db.rollback()
        return APIResponse(
            success=False,
            error={'message': 'Failed to restore memory', 'details': str(e)}
        )


@router.delete("/permanent-delete/{memory_id}", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def permanent_delete(memory_id: int, db: Session = Depends(get_db)):
    """Permanently delete a memory (cannot be undone)"""
    try:
        memory = db.query(models.Memory).filter(models.Memory.id == memory_id).first()
        
        if not memory:
            return APIResponse(
                success=False,
                error={'message': 'Memory not found'}
            )
        
        if not memory.is_deleted:
            return APIResponse(
                success=False,
                error={'message': 'Memory must be in trash before permanent deletion'}
            )
        
        mem_title = memory.title
        
        # Delete versions
        db.query(models.MemoryVersion).filter(
            models.MemoryVersion.memory_id == memory_id
        ).delete()
        
        # Delete memory
        db.delete(memory)
        db.commit()
        
        # Audit log
        audit_service.log(db, 'permanent_delete', 'memory', f"Permanently deleted memory '{mem_title}'", memory_id)
        
        return APIResponse(
            success=True,
            data={'message': 'Memory permanently deleted'}
        )
        
    except Exception as e:
        logger.error(f"Permanent delete error: {e}")
        db.rollback()
        return APIResponse(
            success=False,
            error={'message': 'Failed to permanently delete memory', 'details': str(e)}
        )
