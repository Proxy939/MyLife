from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import json
from .. import schemas, models
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
        # 1. Check Cache
        cached = db.query(models.MonthlyRecapCache).filter(models.MonthlyRecapCache.month == month).first()
        if cached:
            # Parse JSON highlights
            try:
                highlights = json.loads(cached.highlights)
            except:
                highlights = []
            
            # Simple count query for total_memories (not cached in model, cheap to query)
            # Or we could fetch real memories count.
            # For correctness, let's fetch real count as it might change? 
            # Requirements say "return cached recap". 
            # If we strictly return cached, fields might be stale if user added memories AFTER cache gen.
            # But the goal of cache is to avoid re-generating the SUMMARY/AI part.
            # So we use cached summary/mood, but maybe refresh simple stats?
            # Implied requirement: "if exists -> return cached recap". 
            # We'll reconstruct schemas.MonthlyRecapResponse from cache + live count for consistency.
            
            # Re-fetch count cheap
            # Actually, to strictly follow "return cached", we should trust the cache for expensive parts.
            # We'll re-calculate total_memories cheaply.
            target_date = datetime.strptime(month, "%Y-%m")
            from sqlalchemy import extract
            total_memories = db.query(models.Memory).filter(
                extract('year', models.Memory.created_at) == target_date.year,
                extract('month', models.Memory.created_at) == target_date.month
            ).count()

            return {"success": True, "data": schemas.MonthlyRecapResponse(
                month=month,
                total_memories=total_memories,
                highlights=highlights,
                mood_hint=cached.mood_hint,
                summary=cached.summary
            )}

        # 2. Generate if not cached
        recap = recap_service.generate_monthly_recap(db, month)
        
        # 3. Store in Cache
        new_cache = models.MonthlyRecapCache(
            month=month,
            summary=recap.summary,
            highlights=json.dumps(recap.highlights),
            mood_hint=recap.mood_hint
        )
        db.add(new_cache)
        db.commit()

        return {"success": True, "data": recap}
    except Exception as e:
         return {"success": False, "error": {"message": str(e)}}
