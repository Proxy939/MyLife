from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import memories, recap, settings, media, ai, backup, system, vault, sync
from .database import Base
from .config import APP_DATA_DIR
from . import models
from .services.vault_service import get_vault_service
from .services.scheduler import start_scheduler, shutdown_scheduler
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MyLife")


@app.on_event("startup")
def startup_event():
    """Startup - vault-aware, never crashes"""
    try:
        # Ensure dirs exist
        (APP_DATA_DIR / 'vault' / 'photos').mkdir(parents=True, exist_ok=True)
        (APP_DATA_DIR / 'runtime').mkdir(parents=True, exist_ok=True)
        (APP_DATA_DIR / 'vault' / 'backups').mkdir(parents=True, exist_ok=True)
        (APP_DATA_DIR / 'logs').mkdir(parents=True, exist_ok=True)
        
        # Initialize vault service
        vault_svc = get_vault_service()
        logger.info(f"Vault exists: {vault_svc.vault_exists()}")
        
        # Start scheduler
        start_scheduler()
        logger.info("MyLife backend started successfully")
        
    except Exception as e:
        logger.error(f"Startup error (non-fatal): {e}")


@app.on_event("shutdown")
def shutdown_event():
    shutdown_scheduler()


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check - always works
@app.get("/health")
def health():
    return {"status": "ok"}

# Routers
app.include_router(vault.router)
app.include_router(sync.router)
app.include_router(memories.router)
app.include_router(recap.router)
app.include_router(settings.router)
app.include_router(media.router)
app.include_router(ai.router)
app.include_router(backup.router)
app.include_router(system.router)
