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
    photos = Column(Text, default="[]") # JSON string of paths
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
    month = Column(String, unique=True, index=True) # YYYY-MM
    summary = Column(Text)
    highlights = Column(Text) # JSON string
    mood_hint = Column(String)
    generated_at = Column(DateTime, default=func.now())
