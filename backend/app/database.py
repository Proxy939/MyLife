from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

Base = declarative_base()

# Global engine and session
_engine = None
_SessionLocal = None


def get_database_url():
    """Get database URL - uses persistent database file (vault features disabled)"""
    from app.config import APP_DATA_DIR
    
    # Use persistent database file in app data directory
    db_path = APP_DATA_DIR / "mylife.db"
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{db_path}"


def migrate_database_schema(engine):
    """Auto-repair database schema - add missing columns if needed"""
    try:
        inspector = inspect(engine)
        
        # Check if memories table exists
        if 'memories' not in inspector.get_table_names():
            logger.info("memories table doesn't exist, will be created")
            return
        
        # Get existing columns
        existing_columns = {col['name'] for col in inspector.get_columns('memories')}
        logger.info(f"Existing columns: {existing_columns}")
        
        # Define required columns with their SQL definitions
        required_columns = {
            'timestamp': "ALTER TABLE memories ADD COLUMN timestamp TEXT",
            'photos': "ALTER TABLE memories ADD COLUMN photos TEXT DEFAULT '[]'",
            'is_deleted': "ALTER TABLE memories ADD COLUMN is_deleted BOOLEAN DEFAULT 0",
            'deleted_at': "ALTER TABLE memories ADD COLUMN deleted_at TEXT",
            'updated_at': "ALTER TABLE memories ADD COLUMN updated_at DATETIME",
            'created_at': "ALTER TABLE memories ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"
        }
        
        # Add missing columns
        with engine.connect() as conn:
            for col_name, alter_sql in required_columns.items():
                if col_name not in existing_columns:
                    logger.info(f"Adding missing column: {col_name}")
                    conn.execute(text(alter_sql))
                    conn.commit()
        
        logger.info("Database schema migration completed successfully")
        
    except Exception as e:
        logger.error(f"Database migration failed: {e}")
        # Don't raise - allow app to continue


def init_database():
    """Initialize database engine"""
    global _engine, _SessionLocal
    
    db_url = get_database_url()
    _engine = create_engine(db_url, connect_args={"check_same_thread": False})
    _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
    
    # Create tables if they don't exist
    try:
        Base.metadata.create_all(bind=_engine)
        logger.info(f"Database initialized at: {db_url}")
    except Exception as e:
        logger.error(f"Failed to create tables: {e}")
    
    # Run schema migration to add any missing columns
    migrate_database_schema(_engine)


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
