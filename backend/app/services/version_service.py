from sqlalchemy.orm import Session
from app import models
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class VersionService:
    
    def create_version(
        self,
        db: Session,
        memory: models.Memory,
        action: str
    ) -> models.MemoryVersion:
        """Create a version snapshot of a memory"""
        try:
            # Get current version count
            version_count = db.query(models.MemoryVersion).filter(
                models.MemoryVersion.memory_id == memory.id
            ).count()
            
            version = models.MemoryVersion(
                memory_id=memory.id,
                version_no=version_count + 1,
                snapshot_title=memory.title,
                snapshot_note=memory.note,
                snapshot_tags=memory.tags or "",
                snapshot_mood=memory.mood or "neutral",
                snapshot_photos=memory.photos or "[]",
                action=action
            )
            
            db.add(version)
            db.commit()
            db.refresh(version)
            
            logger.info(f"Created version {version.version_no} for memory {memory.id} (action: {action})")
            return version
            
        except Exception as e:
            logger.error(f"Error creating version: {e}")
            db.rollback()
            return None
    
    def get_versions(self, db: Session, memory_id: int):
        """Get all versions for a memory"""
        try:
            versions = db.query(models.MemoryVersion).filter(
                models.MemoryVersion.memory_id == memory_id
            ).order_by(models.MemoryVersion.version_no.desc()).all()
            
            return [{
                'id': v.id,
                'version_no': v.version_no,
                'title': v.snapshot_title,
                'note': v.snapshot_note,
                'tags': v.snapshot_tags,
                'mood': v.snapshot_mood,
                'photos': v.snapshot_photos,
                'action': v.action,
                'created_at': v.created_at.isoformat() if v.created_at else None
            } for v in versions]
            
        except Exception as e:
            logger.error(f"Error getting versions: {e}")
            return []
    
    def restore_version(self, db: Session, memory_id: int, version_id: int) -> bool:
        """Restore a memory to a specific version"""
        try:
            memory = db.query(models.Memory).filter(models.Memory.id == memory_id).first()
            version = db.query(models.MemoryVersion).filter(models.MemoryVersion.id == version_id).first()
            
            if not memory or not version:
                return False
            
            if version.memory_id != memory_id:
                logger.error(f"Version {version_id} does not belong to memory {memory_id}")
                return False
            
            # Restore from snapshot
            memory.title = version.snapshot_title
            memory.note = version.snapshot_note
            memory.tags = version.snapshot_tags
            memory.mood = version.snapshot_mood
            memory.photos = version.snapshot_photos
            
            db.commit()
            
            # Create new version for restore action
            self.create_version(db, memory, f"restored_from_v{version.version_no}")
            
            logger.info(f"Restored memory {memory_id} to version {version.version_no}")
            return True
            
        except Exception as e:
            logger.error(f"Error restoring version: {e}")
            db.rollback()
            return False


class AuditService:
    
    def log(
        self,
        db: Session,
        action_type: str,
        entity_type: str,
        message: str,
        entity_id: int = None
    ):
        """Create audit log entry"""
        try:
            log_entry = models.AuditLog(
                action_type=action_type,
                entity_type=entity_type,
                entity_id=entity_id,
                message=message
            )
            
            db.add(log_entry)
            db.commit()
            
        except Exception as e:
            logger.error(f"Error creating audit log: {e}")
            db.rollback()
    
    def get_logs(self, db: Session, limit: int = 100):
        """Get recent audit logs"""
        try:
            logs = db.query(models.AuditLog).order_by(
                models.AuditLog.created_at.desc()
            ).limit(limit).all()
            
            return [{
                'id': log.id,
                'action_type': log.action_type,
                'entity_type': log.entity_type,
                'entity_id': log.entity_id,
                'message': log.message,
                'created_at': log.created_at.isoformat() if log.created_at else None
            } for log in logs]
            
        except Exception as e:
            logger.error(f"Error getting audit logs: {e}")
            return []


# Global instances
version_service = VersionService()
audit_service = AuditService()
