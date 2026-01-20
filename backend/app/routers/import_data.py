from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.schemas import APIResponse
from app.services.import_service import import_service
from app.database import SessionLocal
from app.middleware.vault_middleware import require_unlocked_vault
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/import", tags=["import"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class PhotosFolderRequest(BaseModel):
    folder_path: str


@router.post("/photos-folder", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
def import_photos_folder(req: PhotosFolderRequest, db: Session = Depends(get_db)):
    """Import photos from a local folder"""
    try:
        result = import_service.import_photos_folder(db, req.folder_path)
        
        if result['success']:
            return APIResponse(
                success=True,
                data=result['data']
            )
        else:
            return APIResponse(
                success=False,
                error={'message': result.get('error', 'Import failed')}
            )
            
    except Exception as e:
        logger.error(f"Photos folder import error: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Import failed', 'details': str(e)}
        )


@router.post("/whatsapp", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
async def import_whatsapp(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Import WhatsApp chat export (TXT)"""
    try:
        # Read file content
        content = await file.read()
        text_content = content.decode('utf-8', errors='ignore')
        
        result = import_service.import_whatsapp(db, text_content)
        
        if result['success']:
            return APIResponse(
                success=True,
                data=result['data']
            )
        else:
            return APIResponse(
                success=False,
                error={'message': result.get('error', 'Import failed')}
            )
            
    except Exception as e:
        logger.error(f"WhatsApp import error: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Import failed', 'details': str(e)}
        )


@router.post("/pdf", response_model=APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
async def import_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Import PDF file with text extraction"""
    try:
        # Read file content
        content = await file.read()
        
        result = import_service.import_pdf(db, file.filename, content)
        
        if result['success']:
            return APIResponse(
                success=True,
                data=result['data']
            )
        else:
            return APIResponse(
                success=False,
                error={'message': result.get('error', 'Import failed')}
            )
            
    except Exception as e:
        logger.error(f"PDF import error: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Import failed', 'details': str(e)}
        )


@router.get("/jobs", response_model=APIResponse[list])
def get_import_jobs(db: Session = Depends(get_db)):
    """Get recent import jobs"""
    try:
        jobs = import_service.get_import_jobs(db)
        
        return APIResponse(
            success=True,
            data=jobs
        )
        
    except Exception as e:
        logger.error(f"Get import jobs error: {e}")
        return APIResponse(
            success=False,
            error={'message': 'Failed to get import jobs', 'details': str(e)}
        )
