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
                # Parse to Pydantic schema
                # We need to manually construct or use from_attributes
                # SearchResultItem inherits MemoryRead which expects ORM object
                item = SearchResultItem.model_validate(db_mem)
                item.score = score
                output.append(item)
        
        return {"success": True, "data": {"results": output}}
        
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}

@router.post("/chat", response_model=schemas.APIResponse[ChatResponse])
def memory_chat(req: ChatRequest, db: Session = Depends(get_db)):
    try:
        # 1. Search context
        search_results = vector_store.search(req.message, top_k=3)
        
        memories = []
        for mem_id, score in search_results:
            m = crud.get_memory(db, mem_id)
            if m:
                memories.append(m)
        
        # 2. Generate Reply (Auto Mode / Template)
        # Ideally check Settings here, but requirement says "If not auto, still allow (Auto fallback)"
        # So we just do the Auto logic here.
        
        reply = ""
        memory_refs = [m.id for m in memories]
        
        if not memories:
            reply = "I couldn't find any specific memories related to that. Try writing a new memory about it!"
        else:
            titles = [f"'{m.title}'" for m in memories]
            titles_str = ", ".join(titles)
            
            # Extract common tags
            all_tags = []
            for m in memories:
                if m.tags:
                    all_tags.extend([t.strip() for t in m.tags.split(',')])
            from collections import Counter
            common_tags = [t for t, c in Counter(all_tags).most_common(3)]
            tags_str = ", ".join(common_tags)
            
            # Simple heuristic response
            if "?" in req.message:
                reply = f"Looking at {titles_str}, it seems you have relevant experiences. "
                if "stress" in tags_str.lower() or "sad" in tags_str.lower():
                    reply += "These memories seem challenging. It might be good to reflect on what helped you then."
                elif "happy" in tags_str.lower() or "excited" in tags_str.lower():
                    reply += "You've had some great times related to this!"
                else:
                    reply += "I've pulled up these memories for you."
            else:
                reply = f"I found these memories: {titles_str}. "
                if tags_str:
                    reply += f"Common themes include: {tags_str}."
        
        reply += " (Auto Mode)"

        return {"success": True, "data": {"reply": reply, "memory_refs": memory_refs}}
        
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}
