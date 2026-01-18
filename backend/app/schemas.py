from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class MoodEnum(str, Enum):
    neutral = "neutral"
    happy = "happy"
    sad = "sad"
    stressed = "stressed"
    excited = "excited"
    calm = "calm"

class MemoryBase(BaseModel):
    title: str = Field(..., min_length=3)
    note: str = Field(..., min_length=5)
    tags: Optional[str] = Field(default="", max_length=300)
    mood: MoodEnum = MoodEnum.neutral

class MemoryCreate(MemoryBase):
    pass

class MemoryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3)
    note: Optional[str] = Field(None, min_length=5)
    tags: Optional[str] = Field(None, max_length=300)
    mood: Optional[MoodEnum] = None

class MemoryRead(MemoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class AppSettingsBase(BaseModel):
    ai_provider: str = "auto"
    local_model: str = "none"
    openai_enabled: bool = False

class AppSettingsUpdate(AppSettingsBase):
    pass

class AppSettingsRead(AppSettingsBase):
    id: int

    class Config:
        orm_mode = True

class MonthlyRecapResponse(BaseModel):
    month: str
    total_memories: int
    highlights: List[str]
    mood_hint: str
    summary: str
