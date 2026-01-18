from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import shutil
import os
import io
import json
import zipfile
from datetime import datetime
from .. import schemas

router = APIRouter(prefix="/backup", tags=["backup"])

DB_PATH = "memories.db"
STORAGE_DIR = "backend/storage/photos"
BACKUP_TMP_DIR = "backend/storage/backups_tmp"

@router.get("/export")
def export_backup():
    try:
        # Create temp filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        zip_filename = f"mylife_backup_{timestamp}.zip"
        zip_path = os.path.join(BACKUP_TMP_DIR, zip_filename)
        
        # Ensure tmp dir exists
        os.makedirs(BACKUP_TMP_DIR, exist_ok=True)

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # 1. Add Database
            if os.path.exists(DB_PATH):
                zipf.write(DB_PATH, arcname="memories.db")
            
            # 2. Add Photos
            if os.path.exists(STORAGE_DIR):
                for root, dirs, files in os.walk(STORAGE_DIR):
                    for file in files:
                        file_path = os.path.join(root, file)
                        # Archive name should be relative to storage root
                        # But simpler: put "photos/" at root of zip
                        arcname = os.path.join("photos", file)
                        zipf.write(file_path, arcname=arcname)
            
            # 3. Add Metadata
            metadata = {
                "app": "MyLife",
                "version": "1.0",
                "exported_at": datetime.now().isoformat()
            }
            zipf.writestr("metadata.json", json.dumps(metadata, indent=2))
        
        return FileResponse(
            zip_path, 
            media_type="application/zip", 
            filename=zip_filename
        )

    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}

@router.post("/restore", response_model=schemas.APIResponse[dict])
async def restore_backup(file: UploadFile = File(...)):
    if not file.filename.endswith(".zip"):
        return {"success": False, "error": {"message": "Invalid file type. Must be .zip"}}

    # Helpers
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    restore_tmp = os.path.join(BACKUP_TMP_DIR, f"restore_{timestamp}")
    old_db_backup = f"{DB_PATH}.bak.{timestamp}"
    
    os.makedirs(restore_tmp, exist_ok=True)
    zip_path = os.path.join(restore_tmp, "upload.zip")
    
    try:
        # 1. Save uploaded zip
        with open(zip_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 2. Extract and Validate
        with zipfile.ZipFile(zip_path, 'r') as zipf:
            zipf.extractall(restore_tmp)
            
        if not os.path.exists(os.path.join(restore_tmp, "metadata.json")):
             raise Exception("Invalid backup: Missing metadata.json")
             
        # 3. Safe Restore Strategy
        
        # Backup existing DB
        if os.path.exists(DB_PATH):
            shutil.copy2(DB_PATH, old_db_backup)
            
        # Restore DB
        db_source = os.path.join(restore_tmp, "memories.db")
        if os.path.exists(db_source):
            # Atomic replace isn't trivial cross-platform with open connections, 
            # but copy2 is reasonably safe if traffic is low. 
            # Ideally we'd lock the db, but keeping it simple for SQLite.
            shutil.copy2(db_source, DB_PATH)
        
        # Restore Photos
        # We merge/overwrite strategy
        photos_source = os.path.join(restore_tmp, "photos")
        if os.path.exists(photos_source):
             os.makedirs(STORAGE_DIR, exist_ok=True)
             for filename in os.listdir(photos_source):
                 src = os.path.join(photos_source, filename)
                 dst = os.path.join(STORAGE_DIR, filename)
                 shutil.copy2(src, dst)

        return {"success": True, "data": {"message": "Restore completed successfully"}}

    except Exception as e:
        # Attempt minimal rollback (restore old db if we backed it up)
        if os.path.exists(old_db_backup):
            try:
                shutil.copy2(old_db_backup, DB_PATH)
            except: 
                pass # Critical failure if we can't rollback
        return {"success": False, "error": {"message": f"Restore failed: {str(e)}"}}
        
    finally:
        # Cleanup Tmp
        if os.path.exists(restore_tmp):
            shutil.rmtree(restore_tmp, ignore_errors=True)
