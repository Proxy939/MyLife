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
    # Pydantic schema validation handles:
    # - allowed values for ai_provider
    # - checks if local is valid
    try:
        updated_settings = crud.update_settings(db, settings)
        return {"success": True, "data": updated_settings}
    except ValueError as e:
        # Pydantic validation error would happen BEFORE this function is called (422)
        # But if logic in CRUD raises error, catch here.
        return {"success": False, "error": {"message": str(e)}}
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}
