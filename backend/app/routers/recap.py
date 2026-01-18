from fastapi import APIRouter, Depends, Query, HTTPException
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

@router.get("/monthly", response_model=schemas.APIResponse[schemas.MonthlyRecapResponse])
def get_monthly_recap(
    month: str = Query(..., regex="^\\d{4}-\\d{2}$"),
    db: Session = Depends(get_db)
):
    try:
        # Note: CRUD or Service handles logic. 
        # Requirement: "GET /recap/monthly?month=YYYY-MM must also use that month"
        # Since regex enforces format, we are good on format.
        recap = recap_service.generate_monthly_recap(db, month)
        return {"success": True, "data": recap}
    except Exception as e:
         return {"success": False, "error": {"message": str(e)}}
