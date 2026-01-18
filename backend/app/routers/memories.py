from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from .. import crud, models, schemas
from ..database import SessionLocal

router = APIRouter(prefix="/memories", tags=["memories"])

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.APIResponse[schemas.MemoryRead])
def create_memory(memory: schemas.MemoryCreate, db: Session = Depends(get_db)):
    try:
        db_memory = crud.create_memory(db=db, memory=memory)
        return {"success": True, "data": db_memory}
    except Exception as e:
        # Standardize unexpected errors
        return {"success": False, "error": {"message": str(e)}}

@router.get("/", response_model=schemas.APIResponse[List[schemas.MemoryRead]])
def read_memories(
    skip: int = 0, 
    limit: int = 100, 
    month: Optional[str] = Query(None, regex="^\\d{4}-\\d{2}$"),
    db: Session = Depends(get_db)
):
    # Strict Month Validation
    if month:
        try:
            datetime.strptime(month, "%Y-%m")
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid month value (must be YYYY-MM)")

    try:
        memories = crud.get_memories(db, skip=skip, limit=limit, month=month)
        return {"success": True, "data": memories}
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}

@router.get("/{memory_id}", response_model=schemas.APIResponse[schemas.MemoryRead])
def read_memory(memory_id: int, db: Session = Depends(get_db)):
    db_memory = crud.get_memory(db, memory_id=memory_id)
    if db_memory is None:
        # Return success=False instead of raising 404 to strictly strict generic shape?
        # The prompt says "error": null OR {"message": ...}
        # If I raise HTTPException(404), FastAPI returns {"detail": "..."}.
        # To strictly follow {success, data, error}, I should return JSONResponse or matching model.
        # But `response_model` is set.
        return {"success": False, "error": {"message": "Memory not found"}}
    return {"success": True, "data": db_memory}

@router.put("/{memory_id}", response_model=schemas.APIResponse[schemas.MemoryRead])
def update_memory(memory_id: int, memory: schemas.MemoryUpdate, db: Session = Depends(get_db)):
    db_memory = crud.update_memory(db, memory_id=memory_id, memory=memory)
    if db_memory is None:
         return {"success": False, "error": {"message": "Memory not found"}}
    return {"success": True, "data": db_memory}

@router.delete("/{memory_id}", response_model=schemas.APIResponse[schemas.MemoryRead])
def delete_memory(memory_id: int, db: Session = Depends(get_db)):
    db_memory = crud.delete_memory(db, memory_id=memory_id)
    if db_memory is None:
        return {"success": False, "error": {"message": "Memory not found"}}
    return {"success": True, "data": db_memory}
