from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
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

@router.get("/monthly", response_model=schemas.APIResponse[schemas.MonthlyRecapResponse])
def get_monthly_recap(
    month: str = Query(..., regex="^\\d{4}-\\d{2}$"),
    db: Session = Depends(get_db)
):
    # Strict Month Validation
    try:
        datetime.strptime(month, "%Y-%m")
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid month value (must be YYYY-MM)")

    try:
        recap = recap_service.generate_monthly_recap(db, month)
        return {"success": True, "data": recap}
    except Exception as e:
         return {"success": False, "error": {"message": str(e)}}
