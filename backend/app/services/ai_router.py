from sqlalchemy.orm import Session
from .. import crud

def get_current_ai_provider(db: Session):
    settings = crud.get_settings(db)
    return settings.ai_provider

def execute_ai_task(db: Session, task_type: str, context: dict):
    provider = get_current_ai_provider(db)
    # Phase 1: Just log or return info
    return {"provider": provider, "status": "simulated"}
