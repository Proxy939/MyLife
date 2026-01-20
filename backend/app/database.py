from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

Base = declarative_base()

# Global engine and session
_engine = None
_SessionLocal = None


def get_database_url():
    """Get database URL based on vault state"""
    from app.services.vault_service import vault_state
    from app.config import RUNTIME_DB
    
    if vault_state.is_unlocked and RUNTIME_DB.exists():
        return f"sqlite:///{RUNTIME_DB}"
    else:
        # Return in-memory DB that won't work (prevents crashes)
        return "sqlite:///:memory:"


def init_database():
    """Initialize database engine"""
    global _engine, _SessionLocal
    
    db_url = get_database_url()
    _engine = create_engine(db_url, connect_args={"check_same_thread": False})
    _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
    
    # Create tables if they don't exist
    try:
        Base.metadata.create_all(bind=_engine)
    except Exception as e:
        logger.error(f"Failed to create tables: {e}")


def get_engine():
    """Get database engine"""
    global _engine
    if _engine is None:
        init_database()
    return _engine


def get_session_local():
    """Get SessionLocal"""
    global _SessionLocal
    if _SessionLocal is None:
        init_database()
    return _SessionLocal


# Compatibility
engine = get_engine()
SessionLocal = get_session_local()
