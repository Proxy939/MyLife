from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from .. import crud, models, schemas
from ..database import SessionLocal
from ..services.vector_store import vector_store

router = APIRouter(prefix="/ai", tags=["ai"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Schemas ---
class SearchRequest(BaseModel):
    query: str
    top_k: int = 5

class SearchResultItem(schemas.MemoryRead):
    score: float

class SearchResponse(BaseModel):
    results: List[SearchResultItem]

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    memory_refs: List[int]

# --- Endpoints ---

@router.post("/search", response_model=schemas.APIResponse[SearchResponse])
def semantic_search(req: SearchRequest, db: Session = Depends(get_db)):
    try:
        # 1. Search Vector Store
        results = vector_store.search(req.query, req.top_k)
        
        output = []
        for mem_id, score in results:
            db_mem = crud.get_memory(db, mem_id)
            if db_mem:
                # Convert to schema with score
                item = SearchResultItem.model_validate(db_mem)
                item.score = score
                output.append(item)
        
        return {"success": True, "data": {"results": output}}
        
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}

@router.post("/chat", response_model=schemas.APIResponse[ChatResponse])
def memory_chat(req: ChatRequest, db: Session = Depends(get_db)):
    try:
        # 1. Search relevant memories (Context)
        # Use top 3 for context
        search_results = vector_store.search(req.message, top_k=3)
        
        memories = []
        for mem_id, score in search_results:
            m = crud.get_memory(db, mem_id)
            if m:
                memories.append(m)
        
        # 2. Generate Template Response (Auto Mode)
        reply = ""
        memory_refs = [m.id for m in memories]
        
        if not memories:
            reply = "I couldn't find any specific memories related to that. Try writing a new memory about it!"
        else:
            # Construct a smart summary
            titles = ", ".join([f"'{m.title}'" for m in memories])
            themes = set()
            for m in memories:
                if m.tags:
                    themes.update([t.strip() for t in m.tags.split(',')])
            
            theme_str = ", ".join(list(themes)[:3])
            
            # Simple Logic: Advice vs Statement
            if "?" in req.message:
                reply = f"Based on {titles}, it seems like this is a recurring theme. "
                if "stress" in theme_str.lower() or "sad" in theme_str.lower():
                     reply += "You've handled similar situations before. Maybe take a break?"
                else:
                     reply += f"You have some positive experiences related to {theme_str}."
            else:
                reply = f"I found some memories that match: {titles}. "
                if theme_str:
                    reply += f"Common themes involved are {theme_str}."
            
            reply += " (Auto Mode)"

        return {"success": True, "data": {"reply": reply, "memory_refs": memory_refs}}
        
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}
