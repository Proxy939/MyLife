from fastapi import APIRouter, Depends
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

@router.get("/ai", response_model=schemas.AppSettingsRead)
def read_settings(db: Session = Depends(get_db)):
    return crud.get_settings(db)

@router.put("/ai", response_model=schemas.AppSettingsRead)
def update_settings(settings: schemas.AppSettingsUpdate, db: Session = Depends(get_db)):
    return crud.update_settings(db, settings)
