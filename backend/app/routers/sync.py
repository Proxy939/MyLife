from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.google_drive_service import get_drive_service
from app.services.vault_service import get_vault_service
from app.schemas import APIResponse
from pathlib import Path
import logging
import tempfile
import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sync", tags=["sync"])


class PullRequest(BaseModel):
    confirm_overwrite: bool


@router.get("/status", response_model=APIResponse[dict])
def get_sync_status():
    """Get Google Drive sync status - never crashes"""
    try:
        drive_svc = get_drive_service()
        status = drive_svc.get_status()
        
        return APIResponse(
            success=True,
            data=status
        )
        
    except Exception as e:
        logger.error(f"Sync status error (non-fatal): {e}")
        return APIResponse(
            success=True,
            data={
                'connected': False,
                'last_backup_name': None,
                'last_backup_time': None,
                'last_error': str(e)
            }
        )


@router.post("/connect", response_model=APIResponse[dict])
def connect_google_drive():
    """Connect to Google Drive via OAuth - safe if it fails"""
    try:
        drive_svc = get_drive_service()
        success, error = drive_svc.connect()
        
        if not success:
            return APIResponse(
                success=False,
                error={
                    'message': 'Failed to connect to Google Drive',
                    'details': error or 'OAuth flow failed'
                }
            )
        
        return APIResponse(
            success=True,
            data={'connected': True, 'message': 'Successfully connected to Google Drive'}
        )
        
    except Exception as e:
        logger.error(f"Connect error (non-fatal): {e}")
        return APIResponse(
            success=False,
            error={
                'message': 'Failed to connect to Google Drive',
                'details': str(e)
            }
        )


@router.post("/push", response_model=APIResponse[dict])
def push_backup_to_drive():
    """Upload encrypted backup to Google Drive - safe if it fails"""
    try:
        # Generate emergency export
        from app.routers.vault import emergency_export
        
        # Create temp file
        temp_dir = Path(tempfile.gettempdir())
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        temp_backup = temp_dir / f"mylife_backup_{timestamp}.zip"
        
        try:
            # Get vault service and create export
            vault_svc = get_vault_service()
            files_to_export = vault_svc.emergency_export_files()
            
            if not files_to_export:
                return APIResponse(
                    success=False,
                    error={'message': 'No vault files found to backup'}
                )
            
            # Create ZIP
            import zipfile
            import json
            
            with zipfile.ZipFile(temp_backup, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                # Add metadata
                metadata = {
                    "app_name": "MyLife",
                    "version": "0.1.0",
                    "exported_at": datetime.datetime.now().isoformat(),
                    "backup_type": "google_drive_sync"
                }
                zip_file.writestr("metadata.json", json.dumps(metadata, indent=2))
                
                # Add vault files
                for file_path in files_to_export:
                    rel_path = file_path.relative_to(vault_svc.vault_dir)
                    arcname = f"vault/{rel_path}"
                    zip_file.write(file_path, arcname)
            
            # Upload to Google Drive
            drive_svc = get_drive_service()
            upload_success, error, file_info = drive_svc.upload_backup(temp_backup)
            
            if not upload_success:
                return APIResponse(
                    success=False,
                    error={
                        'message': 'Failed to upload backup to Google Drive',
                        'details': error
                    }
                )
            
            return APIResponse(
                success=True,
                data={
                    'message': 'Backup uploaded successfully',
                    'file_info': file_info
                }
            )
            
        finally:
            # Clean up temp file
            if temp_backup.exists():
                temp_backup.unlink()
        
    except Exception as e:
        logger.error(f"Push backup error (non-fatal): {e}")
        return APIResponse(
            success=False,
            error={
                'message': 'Failed to push backup',
                'details': str(e)
            }
        )


@router.post("/pull", response_model=APIResponse[dict])
def pull_backup_from_drive(req: PullRequest):
    """Download and restore backup from Google Drive - safe if it fails"""
    try:
        # Check confirmation
        if not req.confirm_overwrite:
            return APIResponse(
                success=False,
                error={
                    'message': 'Confirmation required',
                    'details': 'You must confirm overwrite by setting confirm_overwrite=true'
                }
            )
        
        # Create temp file for download
        temp_dir = Path(tempfile.gettempdir())
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        temp_download = temp_dir / f"mylife_restore_{timestamp}.zip"
        
        try:
            # Download from Google Drive
            drive_svc = get_drive_service()
            download_success, error, file_name = drive_svc.download_latest_backup(temp_download)
            
            if not download_success:
                return APIResponse(
                    success=False,
                    error={
                        'message': 'Failed to download backup from Google Drive',
                        'details': error
                    }
                )
            
            # TODO: Implement restore logic
            # For now, just confirm download worked
            return APIResponse(
                success=True,
                data={
                    'message': f'Backup downloaded: {file_name}',
                    'note': 'Restore functionality will be implemented in next update',
                    'downloaded_file': file_name
                }
            )
            
        finally:
            # Keep temp_download for now (manual restore)
            pass
        
    except Exception as e:
        logger.error(f"Pull backup error (non-fatal): {e}")
        return APIResponse(
            success=False,
            error={
                'message': 'Failed to pull backup',
                'details': str(e)
            }
        )
