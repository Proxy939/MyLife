from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from .database import Base

class Memory(Base):
    __tablename__ = "memories"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    note = Column(Text, nullable=False)
    tags = Column(String, default="")
    mood = Column(String, default="neutral")
    photos = Column(Text, default="[]")  # JSON string of paths
    timestamp = Column(String, nullable=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class AppSettings(Base):
    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, index=True, default=1)
    ai_provider = Column(String, default="auto")
    local_model = Column(String, default="none")
    openai_enabled = Column(Boolean, default=False)

class MonthlyRecapCache(Base):
    __tablename__ = "monthly_recap_cache"

    id = Column(Integer, primary_key=True, index=True)
    month = Column(String, unique=True, index=True)  # YYYY-MM
    summary = Column(Text)
    highlights = Column(Text)  # JSON string
    mood_hint = Column(String)
    generated_at = Column(DateTime, default=func.now())

class ImportJob(Base):
    __tablename__ = 'import_jobs'
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    status = Column(String, nullable=False)
    created_at = Column(String, nullable=False)
    finished_at = Column(String, nullable=True)
    details = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<ImportJob(id={self.id}, type={self.type}, status={self.status})>"

class MemoryVersion(Base):
    __tablename__ = 'memory_versions'
    
    id = Column(Integer, primary_key=True, index=True)
    memory_id = Column(Integer, nullable=False, index=True)
    version_no = Column(Integer, nullable=False)
    snapshot_title = Column(String, nullable=False)
    snapshot_note = Column(Text, nullable=False)
    snapshot_tags = Column(String, default="")
    snapshot_mood = Column(String, default="neutral")
    snapshot_photos = Column(Text, default="[]")
    action = Column(String, nullable=False)  # created/updated/deleted/restored/merged/enhanced/imported
    created_at = Column(DateTime, default=func.now())
    
    def __repr__(self):
        return f"<MemoryVersion(id={self.id}, memory_id={self.memory_id}, version={self.version_no})>"

class AuditLog(Base):
    __tablename__ = 'audit_log'
    
    id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(Integer, nullable=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, action={self.action_type})>"

class Goal(Base):
    __tablename__ = 'goals'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    status = Column(String, default="active")  # active/completed
    source_memory_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=func.now())
    completed_at = Column(String, nullable=True)
    
    def __repr__(self):
        return f"<Goal(id={self.id}, title={self.title}, status={self.status})>"
