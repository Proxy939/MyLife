from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List, Generic, TypeVar, Any
from datetime import datetime
from enum import Enum

# --- Enums ---
class MoodEnum(str, Enum):
    neutral = "neutral"
    happy = "happy"
    sad = "sad"
    stressed = "stressed"
    excited = "excited"
    calm = "calm"

# --- Shared wrapper ---
T = TypeVar('T')

class APIResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[dict] = None # Expecting {"message": "...", "details": "..."} or null

# --- Memory Schemas ---
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

    model_config = ConfigDict(from_attributes=True)

# --- Settings Schemas ---
class AppSettingsBase(BaseModel):
    ai_provider: str = "auto"
    local_model: str = "none"
    openai_enabled: bool = False

    @field_validator("ai_provider")
    @classmethod
    def validate_provider(cls, v: str) -> str:
        allowed = ["auto", "local", "openai"]
        if v not in allowed:
            raise ValueError(f"Invalid provider. Must be one of {allowed}")
        return v

class AppSettingsUpdate(AppSettingsBase):
    @field_validator("local_model")
    @classmethod
    def validate_local_model(cls, v: str) -> str:
        return v

class AppSettingsRead(AppSettingsBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# --- Recap Schemas ---
class MonthlyRecapResponse(BaseModel):
    month: str
    total_memories: int
    highlights: List[str]
    mood_hint: str
    summary: str
