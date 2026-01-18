from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, Response
import shutil
import os
import io
import json
import zipfile
import base64
from datetime import datetime
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from .. import schemas

router = APIRouter(prefix="/backup", tags=["backup"])

DB_PATH = "memories.db"
STORAGE_DIR = "backend/storage/photos"
BACKUP_TMP_DIR = "backend/storage/backups_tmp"

# --- Encryption Helpers ---

def _derive_key(password: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    return base64.urlsafe_b64encode(kdf.derive(password.encode()))

def encrypt_data(data: bytes, password: str) -> bytes:
    salt = os.urandom(16)
    key = _derive_key(password, salt)
    f = Fernet(key)
    encrypted = f.encrypt(data)
    # Return Salt + Encrypted Data
    return salt + encrypted

def decrypt_data(data: bytes, password: str) -> bytes:
    try:
        salt = data[:16]
        ciphertext = data[16:]
        key = _derive_key(password, salt)
        f = Fernet(key)
        return f.decrypt(ciphertext)
    except Exception:
        raise Exception("Decryption failed. Invalid PIN or corrupted file.")

# --- Endpoints ---

@router.get("/export")
def export_backup(pin: str = None):
    try:
        # Create temp filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        zip_filename = f"mylife_backup_{timestamp}.zip"
        zip_path = os.path.join(BACKUP_TMP_DIR, zip_filename)
        
        # Ensure tmp dir exists
        os.makedirs(BACKUP_TMP_DIR, exist_ok=True)

        # 1. Create ZIP in memory or temp file
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Add Database
            if os.path.exists(DB_PATH):
                zipf.write(DB_PATH, arcname="memories.db")
            
            # Add Photos
            if os.path.exists(STORAGE_DIR):
                for root, dirs, files in os.walk(STORAGE_DIR):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.join("photos", file)
                        zipf.write(file_path, arcname=arcname)
            
            # Add Metadata
            metadata = {
                "app": "MyLife",
                "version": "1.0",
                "exported_at": datetime.now().isoformat(),
                "encrypted": bool(pin)
            }
            zipf.writestr("metadata.json", json.dumps(metadata, indent=2))
        
        zip_bytes = buffer.getvalue()

        # 2. Encryption (Optional)
        if pin:
            encrypted_bytes = encrypt_data(zip_bytes, pin)
            enc_filename = f"mylife_backup_{timestamp}.encrypted"
            # Return encrypted stream
            return Response(
                content=encrypted_bytes,
                media_type="application/octet-stream",
                headers={"Content-Disposition": f"attachment; filename={enc_filename}"}
            )
        
        # 3. Normal Return
        # Write buffer to disk to serve as FileResponse (better for large files, though we have it in RAM now)
        # Re-using the logic to write to disk for consistency if needed, 
        # but returning bytes directly is fine for reasonable sizes.
        # Let's save to disk as per original requirement for structure
        with open(zip_path, "wb") as f:
            f.write(zip_bytes)

        return FileResponse(
            zip_path, 
            media_type="application/zip", 
            filename=zip_filename
        )

    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}

@router.post("/restore", response_model=schemas.APIResponse[dict])
async def restore_backup(
    file: UploadFile = File(...),
    pin: str = Form(None)
):
    # Helpers
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    restore_tmp = os.path.join(BACKUP_TMP_DIR, f"restore_{timestamp}")
    os.makedirs(restore_tmp, exist_ok=True)
    
    zip_path = os.path.join(restore_tmp, "upload.zip")
    old_db_backup = f"{DB_PATH}.bak.{timestamp}"

    try:
        # 1. Read Uploaded Content
        content = await file.read()
        
        # 2. Decrypt if needed
        # Simple check: Does filename end in .encrypted?
        # Or check magic bytes? For now rely on extension or user supplying PIN imply encryption
        is_encrypted = file.filename.endswith(".encrypted")
        
        final_zip_bytes = content
        
        if is_encrypted:
            if not pin:
                return {"success": False, "error": {"message": "Backup is encrypted. Please provide a PIN."}}
            try:
                final_zip_bytes = decrypt_data(content, pin)
            except Exception:
                return {"success": False, "error": {"message": "Invalid PIN or corrupted file."}}
        
        # 3. Write ZIP to disk
        with open(zip_path, "wb") as f:
            f.write(final_zip_bytes)
            
        # 4. Extract and Validate
        try:
            with zipfile.ZipFile(zip_path, 'r') as zipf:
                zipf.extractall(restore_tmp)
        except zipfile.BadZipFile:
             return {"success": False, "error": {"message": "Invalid ZIP file."}}

        if not os.path.exists(os.path.join(restore_tmp, "metadata.json")):
             return {"success": False, "error": {"message": "Invalid backup: Missing metadata.json"}}
             
        # 5. Safe Restore Strategy
        
        # Backup existing DB
        if os.path.exists(DB_PATH):
            shutil.copy2(DB_PATH, old_db_backup)
            
        # Restore DB
        db_source = os.path.join(restore_tmp, "memories.db")
        if os.path.exists(db_source):
            shutil.copy2(db_source, DB_PATH)
        
        # Restore Photos
        photos_source = os.path.join(restore_tmp, "photos")
        if os.path.exists(photos_source):
             os.makedirs(STORAGE_DIR, exist_ok=True)
             for filename in os.listdir(photos_source):
                 src = os.path.join(photos_source, filename)
                 dst = os.path.join(STORAGE_DIR, filename)
                 shutil.copy2(src, dst)

        return {"success": True, "data": {"message": "Restore completed successfully"}}

    except Exception as e:
        # Rollback DB
        if os.path.exists(old_db_backup):
            try:
                shutil.copy2(old_db_backup, DB_PATH)
            except: 
                pass
        return {"success": False, "error": {"message": f"Restore failed: {str(e)}"}}
        
    finally:
        # Cleanup
        if os.path.exists(restore_tmp):
            shutil.rmtree(restore_tmp, ignore_errors=True)
