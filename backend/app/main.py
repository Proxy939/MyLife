from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import memories, recap, settings, media, ai
from .database import engine, Base, SessionLocal
from .config import settings as app_settings
from . import crud, models
from .services.vector_store import vector_store
import os

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=app_settings.APP_NAME)

@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        # Ensure AppSettings exists
        crud.get_settings(db)
        
        # Initialize Embeddings (Offline AI)
        all_memories = db.query(models.Memory).all()
        vector_store.initialize(all_memories)
        
    finally:
        db.close()
    
    # Ensure Photo Storage exists
    os.makedirs("backend/storage/photos", exist_ok=True)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(memories.router)
app.include_router(recap.router)
app.include_router(settings.router)
app.include_router(media.router)
app.include_router(ai.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
