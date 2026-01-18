from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import SessionLocal

router = APIRouter(prefix="/settings", tags=["settings"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/ai", response_model=schemas.APIResponse[schemas.AppSettingsRead])
def read_settings(db: Session = Depends(get_db)):
    settings = crud.get_settings(db)
    return {"success": True, "data": settings}

@router.put("/ai", response_model=schemas.APIResponse[schemas.AppSettingsRead])
def update_settings(settings: schemas.AppSettingsUpdate, db: Session = Depends(get_db)):
    # Strict Validation Logic
    if settings.ai_provider == "local" and (not settings.local_model or settings.local_model == "none"):
        raise HTTPException(status_code=400, detail="Local provider requires a valid local_model")

    try:
        updated_settings = crud.update_settings(db, settings)
        return {"success": True, "data": updated_settings}
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}
