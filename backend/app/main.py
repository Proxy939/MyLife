from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import memories, recap, settings
from .database import engine, Base
from .config import settings as app_settings

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=app_settings.APP_NAME)

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
