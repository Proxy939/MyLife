from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
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

    model_config = ConfigDict(from_attributes=True)

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

    @model_validator(mode='after')
    def check_local_model(self) -> 'AppSettingsUpdate':
        provider = self.ai_provider
        local_model = self.local_model
        
        if provider == "local" and (not local_model or local_model == "none"):
            raise ValueError("Local provider requires a valid local_model name (not 'none')")
        
        return self

class AppSettingsRead(AppSettingsBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class MonthlyRecapResponse(BaseModel):
    month: str
    total_memories: int
    highlights: List[str]
    mood_hint: str
    summary: str

# Standard Response Wrapper
from typing import Generic, TypeVar, Any
T = TypeVar('T')

class APIResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[Any] = None

