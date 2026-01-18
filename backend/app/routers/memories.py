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

@router.post("/{memory_id}/photos", response_model=schemas.APIResponse[schemas.MemoryRead])
def attach_photos(memory_id: int, payload: dict, db: Session = Depends(get_db)): # Using dict for loose body { "paths": [...] }
    # Ideally should use a Schema (e.g. PhotoAttachRequest), but prompt implied body shape.
    # Requirement: Body includes: { "paths": ["storage/photos/..", ...] }
    
    if "paths" not in payload or not isinstance(payload["paths"], list):
         return {"success": False, "error": {"message": "Invalid body. Expected {'paths': [str, ...]}"}}
    
    new_paths = payload["paths"]
    
    db_memory = crud.get_memory(db, memory_id)
    if not db_memory:
         return {"success": False, "error": {"message": "Memory not found"}}
    
    # Logic: Append to existing.
    # We need to rely on Pydantic's parsing or manual JSON load?
    # db_memory.photos is a String (Text) in DB model.
    import json
    existing_photos = []
    if db_memory.photos:
        try:
            existing_photos = json.loads(db_memory.photos)
        except:
            existing_photos = []
            
    # Append
    updated_list = existing_photos + new_paths
    # Deduplicate? Prompt says "Append... (do not overwrite)". Doesn't explicitly say dedup.
    # Let's keep it simple append.
    
    # Update via CRUD or direct? 
    # Use CRUD update to ensure updated_at triggers!
    # Reuse update_memory schema?
    
    update_schema = schemas.MemoryUpdate(photos=updated_list)
    updated_memory = crud.update_memory(db, memory_id, update_schema)
    
    return {"success": True, "data": updated_memory}

@router.delete("/{memory_id}", response_model=schemas.APIResponse[schemas.MemoryRead])
def delete_memory(memory_id: int, db: Session = Depends(get_db)):
    db_memory = crud.delete_memory(db, memory_id=memory_id)
    if db_memory is None:
        return {"success": False, "error": {"message": "Memory not found"}}
    return {"success": True, "data": db_memory}
