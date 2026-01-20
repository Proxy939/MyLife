import uuid
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import Response
from pathlib import Path
from .. import schemas
from ..services.vault_service import get_vault_service, vault_state
from ..middleware.vault_middleware import require_unlocked_vault

router = APIRouter(prefix="/media", tags=["media"])

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"]


@router.post("/upload", response_model=schemas.APIResponse[dict], dependencies=[Depends(require_unlocked_vault)])
async def upload_photos(files: List[UploadFile] = File(...)):
    """Upload and encrypt photos"""
    try:
        vault_svc = get_vault_service()
        saved_ids = []
        
        for file in files:
            # Validate Type
            if file.content_type not in ALLOWED_TYPES:
                return schemas.APIResponse(
                    success=False,
                    error={"message": f"Invalid file type: {file.filename}. Only JPG, PNG, WEBP allowed."}
                )
            
            # Validate Size
            file.file.seek(0, 2)
            size = file.file.tell()
            file.file.seek(0)
            
            if size > MAX_FILE_SIZE:
                return schemas.APIResponse(
                    success=False,
                    error={"message": f"File too large: {file.filename}. Max 5MB."}
                )
            
            # Read file data
            file_data = await file.read()
            
            # Encrypt
            encrypted_data = vault_svc.encrypt_file(file_data)
            
            # Generate photo ID
            photo_id = str(uuid.uuid4())
            
            # Save encrypted
            photo_path = vault_svc.get_encrypted_photo_path(photo_id)
            photo_path.write_bytes(encrypted_data)
            
            saved_ids.append(photo_id)
        
        return schemas.APIResponse(
            success=True,
            data={"photo_ids": saved_ids}
        )
        
    except Exception as e:
        return schemas.APIResponse(
            success=False,
            error={"message": "Upload failed", "details": str(e)}
        )


@router.get("/photo/{photo_id}", dependencies=[Depends(require_unlocked_vault)])
async def get_photo(photo_id: str):
    """Get decrypted photo"""
    try:
        vault_svc = get_vault_service()
        
        # Get encrypted photo path
        photo_path = vault_svc.get_encrypted_photo_path(photo_id)
        
        if not photo_path.exists():
            raise HTTPException(status_code=404, detail="Photo not found")
        
        # Read encrypted data
        encrypted_data = photo_path.read_bytes()
        
        # Decrypt
        decrypted_data = vault_svc.decrypt_file(encrypted_data)
        
        # Determine content type (simple heuristic)
        if decrypted_data[:4] == b'\xff\xd8\xff\xe0' or decrypted_data[:4] == b'\xff\xd8\xff\xe1':
            content_type = "image/jpeg"
        elif decrypted_data[:8] == b'\x89PNG\r\n\x1a\n':
            content_type = "image/png"
        elif decrypted_data[:4] == b'RIFF':
            content_type = "image/webp"
        else:
            content_type = "application/octet-stream"
        
        return Response(content=decrypted_data, media_type=content_type)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve photo: {str(e)}")
