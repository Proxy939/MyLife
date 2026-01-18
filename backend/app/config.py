import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "MyLife"
    DATABASE_URL: str = "sqlite:///./mylife.db"
    
settings = Settings()
