from fastapi import APIRouter
from .. import schemas
from ..services.scheduler import get_status

router = APIRouter(prefix="/system", tags=["system"])

@router.get("/status")
def system_status():
    try:
        status = get_status()
        return {"success": True, "data": {
            "scheduler_running": status["running"],
            "jobs": status["jobs"]
        }}
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}
