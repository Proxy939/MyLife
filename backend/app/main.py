from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import memories, recap, settings
from .database import engine, Base, SessionLocal
from .config import settings as app_settings
from . import crud

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=app_settings.APP_NAME)

@app.on_event("startup")
def startup_event():
    # Ensure AppSettings exists
    db = SessionLocal()
    try:
        crud.get_settings(db)
    finally:
        db.close()


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

@app.get("/health")
def health_check():
    return {"status": "ok"}
