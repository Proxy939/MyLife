from fastapi import HTTPException
from app.services.vault_service import vault_state


def require_unlocked_vault():
    """Dependency to check if vault is unlocked"""
    if vault_state.state == "UNAVAILABLE":
        raise HTTPException(
            status_code=503,
            detail={
                "message": "Vault is unavailable",
                "vault_state": vault_state.state
            }
        )
    
    if not vault_state.is_unlocked:
        raise HTTPException(
            status_code=401,
            detail={
                "message": "Vault is locked",
                "vault_state": vault_state.state
            }
        )
