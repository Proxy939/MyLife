from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
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
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=schemas.APIResponse[List[schemas.MemoryRead]])
def read_memories(
    skip: int = 0, 
    limit: int = 100, 
    month: Optional[str] = Query(None, regex="^\\d{4}-\\d{2}$"),
    db: Session = Depends(get_db)
):
    memories = crud.get_memories(db, skip=skip, limit=limit, month=month)
    return {"success": True, "data": memories}

@router.get("/{memory_id}", response_model=schemas.APIResponse[schemas.MemoryRead])
def read_memory(memory_id: int, db: Session = Depends(get_db)):
    db_memory = crud.get_memory(db, memory_id=memory_id)
    if db_memory is None:
        return {"success": False, "error": {"message": "Memory not found"}}
        # Or raise exception but return standardized error? 
        # Requirement: "Consistent API response shape".
        # 404 is still valid HTTP code. 
        # But body should matching consistent shape ideally or just allow 404 standard?
        # "All responses should follow: { "success": true/false, ... }"
        # So even 404 should probably return that json.
        # But FastAPI HTTPException works differently.
        # Let's return JSONResponse with status 404? 
        # Or simple return with success=False and let client handle.
        # Let's simple return success=False for now. 
        # Though usually 404 is better status code. 
        # I'll stick to returning 404 but with the shape.
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
