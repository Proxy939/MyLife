from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from .. import crud, models, schemas
from ..database import SessionLocal
from ..services.vector_store import vector_store
from ..services.ai_router import ai_router_service
from ..services.insights_service import insights_service
from ..middleware.vault_middleware import require_unlocked_vault

router = APIRouter(prefix="/ai", tags=["ai"], dependencies=[Depends(require_unlocked_vault)])

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

class ModelsResponse(BaseModel):
    installed: List[str]
    ollama_running: bool

class TagCount(BaseModel):
    tag: str
    count: int

class InsightsResponse(BaseModel):
    summary: str
    patterns: List[str]
    suggestions: List[str]
    focus_tags: List[TagCount]
    mood_breakdown: Dict[str, int]

# --- Endpoints ---

@router.get("/models", response_model=schemas.APIResponse[ModelsResponse])
def get_ai_models():
    """Check Ollama status and get available models"""
    try:
        data = ai_router_service.get_ollama_models()
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}

@router.post("/search", response_model=schemas.APIResponse[SearchResponse])
def semantic_search(req: SearchRequest, db: Session = Depends(get_db)):
    try:
        results = vector_store.search(req.query, req.top_k)
        
        output = []
        for mem_id, score in results:
            db_mem = crud.get_memory(db, mem_id)
            if db_mem:
                item = SearchResultItem.model_validate(db_mem)
                item.score = score
                output.append(item)
        
        return {"success": True, "data": {"results": output}}
        
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}

@router.post("/chat", response_model=schemas.APIResponse[ChatResponse])
def memory_chat(req: ChatRequest, db: Session = Depends(get_db)):
    try:
        response = ai_router_service.chat(req.message, db)
        return {"success": True, "data": response}
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}

@router.get("/insights", response_model=schemas.APIResponse[InsightsResponse])
def get_insights(month: Optional[str] = None, db: Session = Depends(get_db)):
    """Get AI-powered or rule-based insights for a specific period"""
    try:
        data = insights_service.get_insights(db, month)
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}
