from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas import APIResponse
from app.database import SessionLocal, engine
from app.services.vault_service import get_vault_service
from app.services.google_drive_service import get_drive_service
from app.config import APP_VERSION
import logging
import psutil
import sys

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/diagnostics", tags=["diagnostics"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("", response_model=APIResponse[dict])
def get_diagnostics(db: Session = Depends(get_db)):
    """Get system diagnostics (privacy-safe)"""
    try:
        diagnostics = {
            'app_name': 'MyLife',
            'app_version': APP_VERSION,
            'python_version': sys.version.split()[0],
            'vault_state': 'unknown',
            'database_status': 'unknown',
            'scheduler_status': 'running',
            'sync_drive_connected': False,
            'memory_usage_mb': 0,
            'last_errors': []
        }
        
        # Vault state
        try:
            vault_svc = get_vault_service()
            diagnostics['vault_state'] = 'exists' if vault_svc.vault_exists() else 'not_created'
        except Exception as e:
            diagnostics['vault_state'] = 'error'
            diagnostics['last_errors'].append(f"Vault check failed: {str(e)[:100]}")
        
        # Database status
        try:
            db.execute("SELECT 1")
            diagnostics['database_status'] = 'connected'
        except Exception as e:
            diagnostics['database_status'] = 'error'
            diagnostics['last_errors'].append(f"Database check failed: {str(e)[:100]}")
        
        # Sync status
        try:
            drive_svc = get_drive_service()
            status = drive_svc.get_status()
            diagnostics['sync_drive_connected'] = status.get('connected', False)
        except Exception as e:
            diagnostics['last_errors'].append(f"Sync check failed: {str(e)[:100]}")
        
        # Memory usage
        try:
            process = psutil.Process()
            diagnostics['memory_usage_mb'] = round(process.memory_info().rss / 1024 / 1024, 2)
        except Exception:
            pass
        
        return APIResponse(
            success=True,
            data=diagnostics
        )
        
    except Exception as e:
        logger.error(f"Diagnostics error: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Failed to get diagnostics', 'details': str(e)}
        )
