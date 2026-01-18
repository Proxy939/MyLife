from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from .. import schemas
from ..services import recap_service
from ..database import SessionLocal

router = APIRouter(prefix="/recap", tags=["recap"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/monthly", response_model=schemas.MonthlyRecapResponse)
def get_monthly_recap(
    month: str = Query(..., regex="^\\d{4}-\\d{2}$"),
    db: Session = Depends(get_db)
):
    return recap_service.generate_monthly_recap(db, month)
