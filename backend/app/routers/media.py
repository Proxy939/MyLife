import os
import shutil
import uuid
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException
from .. import schemas

router = APIRouter(prefix="/media", tags=["media"])

UPLOAD_DIR = "backend/storage/photos"
MAX_FILE_SIZE = 5 * 1024 * 1024 # 5MB
ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"]

# Ensure directory exists (can also be done in main.py startup, but safe here too)
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=schemas.APIResponse[dict])
async def upload_photos(files: List[UploadFile] = File(...)):
    saved_paths = []
    
    for file in files:
        # Validate Type
        if file.content_type not in ALLOWED_TYPES:
             return {"success": False, "error": {"message": f"Invalid file type: {file.filename}. Only JPG, PNG, WEBP allowed."}}
        
        # Validate Size (Checking content-length header is unreliable, but reading chunks is expensive for denial checking. 
        # For local app, simple seek/tell or reading is okay).
        # file.spool_max_size is default. Let's read and check size.
        # Efficient way: seek to end, tell position.
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)
        
        if size > MAX_FILE_SIZE:
             return {"success": False, "error": {"message": f"File too large: {file.filename}. Max 5MB."}}
        
        # Generate Unique Name
        ext = file.filename.split(".")[-1].lower()
        if ext == "jpeg": ext = "jpg"
        new_filename = f"{uuid.uuid4()}.{ext}"
        file_path = os.path.join(UPLOAD_DIR, new_filename)
        
        # Save
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Store relative path for portability (or absolute? Requirement says "backend/storage/..." example)
        # "storage/photos/a.jpg" is cleaner relative path.
        # But our UPLOAD_DIR is "backend/storage/photos". 
        # If running from project root "MyLife", correct.
        # Let's return "storage/photos/{filename}" assuming frontend/backend serve from root or static mount.
        # Actually requirement example: "storage/photos/a.jpg". 
        # Our UPLOAD_DIR construction "backend/storage/photos" implies backend is inside root.
        # Let's stick to the relative path suitable for DB.
        
        # If we save in "backend/storage/photos", relative from "backend" is "storage/photos".
        # But if we run from root, we need to be careful.
        # Let's save consistent path: "storage/photos/{filename}" and ensure it maps to "backend/storage/photos" on disk.
        
        saved_paths.append(f"storage/photos/{new_filename}")

    return {"success": True, "data": {"paths": saved_paths}}
