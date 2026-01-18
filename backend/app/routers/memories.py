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

@router.post("/", response_model=schemas.MemoryRead)
def create_memory(memory: schemas.MemoryCreate, db: Session = Depends(get_db)):
    return crud.create_memory(db=db, memory=memory)

@router.get("/", response_model=List[schemas.MemoryRead])
def read_memories(
    skip: int = 0, 
    limit: int = 100, 
    month: Optional[str] = Query(None, regex="^\\d{4}-\\d{2}$"),
    db: Session = Depends(get_db)
):
    memories = crud.get_memories(db, skip=skip, limit=limit, month=month)
    return memories

@router.get("/{memory_id}", response_model=schemas.MemoryRead)
def read_memory(memory_id: int, db: Session = Depends(get_db)):
    db_memory = crud.get_memory(db, memory_id=memory_id)
    if db_memory is None:
        raise HTTPException(status_code=404, detail="Memory not found")
    return db_memory

@router.put("/{memory_id}", response_model=schemas.MemoryRead)
def update_memory(memory_id: int, memory: schemas.MemoryUpdate, db: Session = Depends(get_db)):
    db_memory = crud.update_memory(db, memory_id=memory_id, memory=memory)
    if db_memory is None:
        raise HTTPException(status_code=404, detail="Memory not found")
    return db_memory

@router.delete("/{memory_id}", response_model=schemas.MemoryRead)
def delete_memory(memory_id: int, db: Session = Depends(get_db)):
    db_memory = crud.delete_memory(db, memory_id=memory_id)
    if db_memory is None:
        raise HTTPException(status_code=404, detail="Memory not found")
    return db_memory
