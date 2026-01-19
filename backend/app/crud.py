from sqlalchemy.orm import Session
from sqlalchemy import extract, desc
from datetime import datetime
import json
import logging
from . import models, schemas
from .services.vector_store import vector_store

logger = logging.getLogger(__name__)

# Memories
def get_memory(db: Session, memory_id: int):
    return db.query(models.Memory).filter(models.Memory.id == memory_id).first()

def get_memories(db: Session, skip: int = 0, limit: int = 100, month: str = None):
    query = db.query(models.Memory)
    
    if month:
        try:
            target_date = datetime.strptime(month, "%Y-%m")
            query = query.filter(extract('year', models.Memory.created_at) == target_date.year)
            query = query.filter(extract('month', models.Memory.created_at) == target_date.month)
        except ValueError:
            return []

    return query.order_by(desc(models.Memory.created_at)).offset(skip).limit(limit).all()

def create_memory(db: Session, memory: schemas.MemoryCreate):
    data = memory.model_dump()
    if "photos" in data:
        data["photos"] = json.dumps(data["photos"])
    
    db_memory = models.Memory(**data)
    db.add(db_memory)
    db.commit()
    db.refresh(db_memory)
    
    # Sync Vector Store
    try:
        vector_store.add_or_update(db_memory)
    except Exception as e:
        logger.error(f"Error updating vector store: {e}")

    return db_memory

def update_memory(db: Session, memory_id: int, memory: schemas.MemoryUpdate):
    db_memory = get_memory(db, memory_id)
    if not db_memory:
        return None
    
    update_data = memory.model_dump(exclude_unset=True)
    if "photos" in update_data:
        update_data["photos"] = json.dumps(update_data["photos"])

    for key, value in update_data.items():
        setattr(db_memory, key, value)
    
    db_memory.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_memory)

    # Sync Vector Store
    try:
        vector_store.add_or_update(db_memory)
    except Exception as e:
        logger.error(f"Error updating vector store: {e}")

    return db_memory

def delete_memory(db: Session, memory_id: int):
    db_memory = get_memory(db, memory_id)
    if db_memory:
        db.delete(db_memory)
        db.commit()
        # Sync Vector Store
        try:
            vector_store.remove(memory_id)
        except Exception as e:
            logger.error(f"Error updating vector store: {e}")
            
    return db_memory

# Settings
def get_settings(db: Session):
    settings = db.query(models.AppSettings).filter(models.AppSettings.id == 1).first()
    if not settings:
        settings = models.AppSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

def update_settings(db: Session, settings_update: schemas.AppSettingsUpdate):
    settings = get_settings(db)
    update_data = settings_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings
