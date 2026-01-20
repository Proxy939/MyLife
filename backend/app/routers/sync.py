from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.schemas import APIResponse
from app.services.sync_service import sync_service
from app.services.google_drive_service import get_drive_service
from app.database import SessionLocal
from app.middleware.vault_middleware import require_unlocked_vault
from pathlib import Path
import logging
import tempfile
import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sync", tags=["sync"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ConflictResolveRequest(BaseModel):
    strategy: str  # keep_local, use_remote, merge
    remote_snapshot_path: str = None


@router.get("/status", response_model=APIResponse[dict])
def get_sync_status(db: Session = Depends(get_db)):
    """Get sync status and device info"""
    try:
        sync_state = sync_service.get_or_create_sync_state(db)
        drive_svc = get_drive_service()
        drive_status = drive_svc.get_status()
        
        return APIResponse(
            success=True,
            data={
                'device_id': sync_state.device_id,
                'last_push_at': sync_state.last_push_at,
                'last_pull_at': sync_state.last_pull_at,
                'last_sync_hash': sync_state.last_sync_hash,
                'last_error': sync_state.last_error,
                'drive_connected': drive_status.get('connected', False),
                'drive_last_backup': drive_status.get('last_backup_name')
            }
        )
        
    except Exception as e:
        logger.error(f"Sync status error: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Failed to get sync status', 'details': str(e)}
        )


@router.post("/snapshot/export", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def export_snapshot(db: Session = Depends(get_db)):
    """Export encrypted snapshot package"""
    try:
        result = sync_service.export_snapshot(db)
        
        if result['success']:
            return APIResponse(
                success=True,
                data={
                    'snapshot_path': result['snapshot_path'],
                    'sync_hash': result['sync_hash'],
                    'size_mb': result['size_mb'],
                    'message': 'Snapshot exported successfully'
                }
            )
        else:
            return APIResponse(
                success=False,
                error={'message': result.get('error', 'Export failed')}
            )
            
    except Exception as e:
        logger.error(f"Export snapshot error: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Failed to export snapshot', 'details': str(e)}
        )


@router.post("/snapshot/import", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
async def import_snapshot(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Import encrypted snapshot and detect conflicts"""
    try:
        # Save uploaded file to temp location
        temp_dir = Path(tempfile.gettempdir())
        temp_file = temp_dir / f"import_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
        
        with open(temp_file, 'wb') as f:
            content = await file.read()
            f.write(content)
        
        # Import snapshot
        result = sync_service.import_snapshot(db, str(temp_file))
        
        # Cleanup
        if temp_file.exists():
            temp_file.unlink()
        
        if result['success']:
            return APIResponse(
                success=True,
                data={
                    'message': result['message'],
                    'sync_hash': result.get('sync_hash')
                }
            )
        elif result.get('conflict'):
            return APIResponse(
                success=False,
                error={
                    'message': result['message'],
                    'conflict': True,
                    'local_hash': result['local_hash'],
                    'remote_hash': result['remote_hash']
                }
            )
        else:
            return APIResponse(
                success=False,
                error={'message': result.get('error', 'Import failed')}
            )
            
    except Exception as e:
        logger.error(f"Import snapshot error: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Failed to import snapshot', 'details': str(e)}
        )


@router.get("/conflicts", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def get_conflicts(db: Session = Depends(get_db)):
    """Get list of sync conflicts"""
    try:
        conflicts = sync_service.detect_conflicts(db)
        
        return APIResponse(
            success=True,
            data={
                'conflicts': conflicts,
                'count': len(conflicts)
            }
        )
        
    except Exception as e:
        logger.error(f"Get conflicts error: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Failed to get conflicts', 'details': str(e)}
        )


@router.post("/conflicts/resolve", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def resolve_conflict(req: ConflictResolveRequest, db: Session = Depends(get_db)):
    """Resolve sync conflict"""
    try:
        result = sync_service.resolve_conflict(db, req.strategy, req.remote_snapshot_path)
        
        if result['success']:
            return APIResponse(
                success=True,
                data={'message': result['message']}
            )
        else:
            return APIResponse(
                success=False,
                error={'message': result.get('error', 'Resolution failed')}
            )
            
    except Exception as e:
        logger.error(f"Resolve conflict error: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Failed to resolve conflict', 'details': str(e)}
        )


@router.post("/push", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def push_to_drive(db: Session = Depends(get_db)):
    """Export snapshot and push to Google Drive"""
    try:
        # Export snapshot
        export_result = sync_service.export_snapshot(db)
        
        if not export_result['success']:
            return APIResponse(
                success=False,
                error={'message': export_result.get('error', 'Export failed')}
            )
        
        snapshot_path = Path(export_result['snapshot_path'])
        
        # Upload to Google Drive
        drive_svc = get_drive_service()
        upload_success, error, file_info = drive_svc.upload_backup(snapshot_path)
        
        if not upload_success:
            return APIResponse(
                success=False,
                error={'message': 'Failed to upload to Google Drive', 'details': error}
            )
        
        # Update sync state
        sync_state = sync_service.get_or_create_sync_state(db)
        sync_state.last_push_at = datetime.datetime.now().isoformat()
        sync_state.last_sync_file_id = file_info.get('id') if file_info else None
        db.commit()
        
        return APIResponse(
            success=True,
            data={
                'message': 'Pushed to Google Drive successfully',
                'file_info': file_info,
                'size_mb': export_result['size_mb']
            }
        )
        
    except Exception as e:
        logger.error(f"Push to drive error: {e}")
        
        # Update error in sync state
        try:
            sync_state = sync_service.get_or_create_sync_state(db)
            sync_state.last_error = str(e)
            db.commit()
        except:
            pass
        
        return APIResponse(
            success=False,
            error={'message': 'Failed to push', 'details': str(e)}
        )


@router.post("/pull", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def pull_from_drive(db: Session = Depends(get_db)):
    """Pull latest snapshot from Google Drive"""
    try:
        # Download from Google Drive
        drive_svc = get_drive_service()
        
        temp_dir = Path(tempfile.gettempdir())
        temp_file = temp_dir / f"pull_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
        
        download_success, error, file_name = drive_svc.download_latest_backup(temp_file)
        
        if not download_success:
            return APIResponse(
                success=False,
                error={'message': 'Failed to download from Google Drive', 'details': error}
            )
        
        # Import snapshot
        import_result = sync_service.import_snapshot(db, str(temp_file))
        
        # Cleanup
        if temp_file.exists():
            temp_file.unlink()
        
        if import_result['success']:
            # Update sync state
            sync_state = sync_service.get_or_create_sync_state(db)
            sync_state.last_pull_at = datetime.datetime.now().isoformat()
            db.commit()
            
            return APIResponse(
                success=True,
                data={'message': 'Pulled from Google Drive successfully'}
            )
        elif import_result.get('conflict'):
            return APIResponse(
                success=False,
                error={
                    'message': 'Conflict detected',
                    'conflict': True,
                    'details': import_result['message']
                }
            )
        else:
            return APIResponse(
                success=False,
                error={'message': import_result.get('error', 'Import failed')}
            )
            
    except Exception as e:
        logger.error(f"Pull from drive error: {e}")
        
        # Update error in sync state
        try:
            sync_state = sync_service.get_or_create_sync_state(db)
            sync_state.last_error = str(e)
            db.commit()
        except:
            pass
        
        return APIResponse(
            success=False,
            error={'message': 'Failed to pull', 'details': str(e)}
        )
