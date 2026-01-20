from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.vault_service import get_vault_service, vault_state
from app.schemas import APIResponse
import logging
import zipfile
import io
import json
import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vault", tags=["vault"])


class SetupRequest(BaseModel):
    pin: str


class UnlockRequest(BaseModel):
    pin: str


@router.get("/status", response_model=APIResponse[dict])
def get_vault_status():
    """Get vault status - always works"""
    try:
        vault_svc = get_vault_service()
        
        return APIResponse(
            success=True,
            data={
                "vault_exists": vault_svc.vault_exists(),
                "is_unlocked": vault_state.is_unlocked,
                "state": vault_state.state
            }
        )
    except Exception as e:
        logger.error(f"Error getting vault status: {e}")
        return APIResponse(
            success=False,
            error={"message": "Failed to get vault status", "details": str(e)}
        )


@router.post("/setup", response_model=APIResponse[dict])
def setup_vault(req: SetupRequest):
    """Setup vault with PIN"""
    try:
        if len(req.pin) < 4:
            return APIResponse(
                success=False,
                error={"message": "PIN must be at least 4 characters"}
            )
        
        vault_svc = get_vault_service()
        success, error = vault_svc.setup_vault(req.pin)
        
        if not success:
            return APIResponse(
                success=False,
                error={"message": error or "Vault setup failed"}
            )
        
        return APIResponse(
            success=True,
            data={"message": "Vault created successfully"}
        )
        
    except Exception as e:
        logger.error(f"Vault setup error: {e}")
        return APIResponse(
            success=False,
            error={"message": "Vault setup failed", "details": str(e)}
        )


@router.post("/unlock", response_model=APIResponse[dict])
def unlock_vault(req: UnlockRequest):
    """Unlock vault with PIN"""
    try:
        vault_svc = get_vault_service()
        success, error = vault_svc.unlock_vault(req.pin)
        
        if not success:
            return APIResponse(
                success=False,
                error={"message": error or "Failed to unlock vault"}
            )
        
        return APIResponse(
            success=True,
            data={"message": "Vault unlocked successfully"}
        )
        
    except Exception as e:
        logger.error(f"Vault unlock error: {e}")
        return APIResponse(
            success=False,
            error={"message": "Failed to unlock vault", "details": str(e)}
        )


@router.post("/lock", response_model=APIResponse[dict])
def lock_vault():
    """Lock vault"""
    try:
        vault_svc = get_vault_service()
        success, error = vault_svc.lock_vault()
        
        if not success:
            return APIResponse(
                success=False,
                error={"message": error or "Failed to lock vault"}
            )
        
        return APIResponse(
            success=True,
            data={"message": "Vault locked successfully"}
        )
        
    except Exception as e:
        logger.error(f"Vault lock error: {e}")
        return APIResponse(
            success=False,
            error={"message": "Failed to lock vault", "details": str(e)}
        )


@router.post("/recover", response_model=APIResponse[dict])
def recover_vault():
    """Recover from corrupted vault"""
    try:
        vault_svc = get_vault_service()
        success, error = vault_svc.recover_vault()
        
        if not success:
            return APIResponse(
                success=False,
                error={"message": error or "Failed to recover vault"}
            )
        
        return APIResponse(
            success=True,
            data={"message": "Vault recovered - you can now setup a new vault"}
        )
        
    except Exception as e:
        logger.error(f"Vault recovery error: {e}")
        return APIResponse(
            success=False,
            error={"message": "Failed to recover vault", "details": str(e)}
        )


@router.get("/emergency-export")
def emergency_export():
    """Emergency export of encrypted vault files - works even when locked"""
    try:
        vault_svc = get_vault_service()
        
        # Get files to export
        files_to_export = vault_svc.emergency_export_files()
        
        if not files_to_export:
            raise HTTPException(
                status_code=404,
                detail="No vault files found to export"
            )
        
        # Create ZIP in memory
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Add metadata
            metadata = {
                "app_name": "MyLife",
                "version": "0.1.0",
                "exported_at": datetime.datetime.now().isoformat(),
                "vault_state": vault_state.state,
                "note": "This is an emergency export of encrypted vault files. You will need your PIN to decrypt this data."
            }
            zip_file.writestr("metadata.json", json.dumps(metadata, indent=2))
            
            # Add vault files
            for file_path in files_to_export:
                # Get relative path from vault dir
                rel_path = file_path.relative_to(vault_svc.vault_dir)
                arcname = f"vault/{rel_path}"
                zip_file.write(file_path, arcname)
        
        # Prepare response
        zip_buffer.seek(0)
        
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={
                "Content-Disposition": "attachment; filename=MyLife-emergency-export.zip"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Emergency export error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Emergency export failed: {str(e)}"
        )
