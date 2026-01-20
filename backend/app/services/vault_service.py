import os
import shutil
import secrets
from pathlib import Path
from typing import Optional, Tuple
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import logging

logger = logging.getLogger(__name__)


class VaultState:
    """Global vault state"""
    is_unlocked: bool = False
    encryption_key: Optional[bytes] = None
    runtime_db_path: Optional[Path] = None
    state: str = "LOCKED"  # LOCKED, UNLOCKED, UNAVAILABLE


vault_state = VaultState()


class VaultService:
    def __init__(self, app_data_dir: Path):
        self.app_data_dir = app_data_dir
        self.vault_dir = app_data_dir / 'vault'
        self.vault_db = self.vault_dir / 'vault.enc'
        self.salt_file = self.vault_dir / 'salt.bin'
        self.encrypted_photos_dir = self.vault_dir / 'photos'
        self.runtime_dir = app_data_dir / 'runtime'
        self.runtime_db = self.runtime_dir / 'db.sqlite'
        self.backups_dir = self.vault_dir / 'backups'
        
        # Ensure directories exist
        self.vault_dir.mkdir(parents=True, exist_ok=True)
        self.encrypted_photos_dir.mkdir(parents=True, exist_ok=True)
        self.runtime_dir.mkdir(parents=True, exist_ok=True)
        self.backups_dir.mkdir(parents=True, exist_ok=True)
    
    def derive_key(self, pin: str, salt: bytes) -> bytes:
        """Derive encryption key from PIN using PBKDF2"""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=200000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(pin.encode()))
        return key
    
    def vault_exists(self) -> bool:
        """Check if vault has been set up"""
        return self.salt_file.exists()
    
    def setup_vault(self, pin: str) -> Tuple[bool, Optional[str]]:
        """Initialize vault with PIN"""
        try:
            if self.vault_exists():
                return False, "Vault already exists"
            
            # Generate salt
            salt = secrets.token_bytes(32)
            self.salt_file.write_bytes(salt)
            
            # Derive key
            key = self.derive_key(pin, salt)
            
            # Create empty SQLite database
            import sqlite3
            conn = sqlite3.connect(str(self.runtime_db))
            
            # Create tables
            from app.database import Base, engine
            Base.metadata.create_all(bind=engine)
            conn.close()
            
            # Encrypt to vault
            with open(self.runtime_db, 'rb') as f:
                db_data = f.read()
            
            fernet = Fernet(key)
            encrypted = fernet.encrypt(db_data)
            
            # Atomic write
            temp_vault = self.vault_db.with_suffix('.tmp')
            temp_vault.write_bytes(encrypted)
            temp_vault.replace(self.vault_db)
            
            # Remove runtime DB
            if self.runtime_db.exists():
                self.runtime_db.unlink()
            
            logger.info("Vault setup completed")
            return True, None
            
        except Exception as e:
            logger.error(f"Vault setup failed: {e}")
            return False, str(e)
    
    def unlock_vault(self, pin: str) -> Tuple[bool, Optional[str]]:
        """Unlock vault and decrypt database"""
        try:
            if not self.vault_exists():
                vault_state.state = "UNAVAILABLE"
                return False, "Vault not initialized"
            
            if not self.vault_db.exists():
                vault_state.state = "UNAVAILABLE"
                return False, "Vault database not found"
            
            # Load salt and derive key
            salt = self.salt_file.read_bytes()
            key = self.derive_key(pin, salt)
            
            # Try to decrypt vault
            fernet = Fernet(key)
            encrypted_data = self.vault_db.read_bytes()
            
            try:
                decrypted_db = fernet.decrypt(encrypted_data)
            except InvalidToken:
                return False, "Invalid PIN"
            
            # Write to runtime DB (atomic)
            temp_db = self.runtime_db.with_suffix('.tmp')
            temp_db.write_bytes(decrypted_db)
            temp_db.replace(self.runtime_db)
            
            # Update state
            vault_state.is_unlocked = True
            vault_state.encryption_key = key
            vault_state.runtime_db_path = self.runtime_db
            vault_state.state = "UNLOCKED"
            
            logger.info("Vault unlocked successfully")
            return True, None
            
        except Exception as e:
            logger.error(f"Vault unlock failed: {e}")
            vault_state.state = "UNAVAILABLE"
            return False, str(e)
    
    def lock_vault(self) -> Tuple[bool, Optional[str]]:
        """Lock vault and encrypt database"""
        try:
            if vault_state.state != "UNLOCKED":
                return False, "Vault is not unlocked"
            
            if not self.runtime_db.exists():
                vault_state.state = "UNAVAILABLE"
                return False, "Runtime database not found"
            
            # Read runtime DB
            with open(self.runtime_db, 'rb') as f:
                db_data = f.read()
            
            # Encrypt
            fernet = Fernet(vault_state.encryption_key)
            encrypted = fernet.encrypt(db_data)
            
            # Atomic write to vault
            temp_vault = self.vault_db.with_suffix('.tmp')
            temp_vault.write_bytes(encrypted)
            temp_vault.replace(self.vault_db)
            
            # Delete runtime DB
            if self.runtime_db.exists():
                self.runtime_db.unlink()
            
            # Clear state
            vault_state.is_unlocked = False
            vault_state.encryption_key = None
            vault_state.runtime_db_path = None
            vault_state.state = "LOCKED"
            
            logger.info("Vault locked successfully")
            return True, None
            
        except Exception as e:
            logger.error(f"Vault lock failed: {e}")
            return False, str(e)
    
    def recover_vault(self) -> Tuple[bool, Optional[str]]:
        """Recover from corrupted vault"""
        try:
            import datetime
            
            # Move corrupted vault if exists
            if self.vault_db.exists():
                timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                corrupt_name = f"vault.enc.corrupt.{timestamp}"
                self.vault_db.rename(self.vault_dir / corrupt_name)
                logger.info(f"Moved corrupt vault to {corrupt_name}")
            
            # Remove salt if exists
            if self.salt_file.exists():
                timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                self.salt_file.rename(self.vault_dir / f"salt.bin.corrupt.{timestamp}")
            
            # Remove runtime DB if exists
            if self.runtime_db.exists():
                self.runtime_db.unlink()
            
            # Reset state
            vault_state.is_unlocked = False
            vault_state.encryption_key = None
            vault_state.runtime_db_path = None
            vault_state.state = "LOCKED"
            
            logger.info("Vault recovered - ready for setup")
            return True, None
            
        except Exception as e:
            logger.error(f"Vault recovery failed: {e}")
            return False, str(e)
    
    def encrypt_file(self, data: bytes) -> bytes:
        """Encrypt file data"""
        if not vault_state.encryption_key:
            raise Exception("Vault is locked")
        
        fernet = Fernet(vault_state.encryption_key)
        return fernet.encrypt(data)
    
    def decrypt_file(self, encrypted_data: bytes) -> bytes:
        """Decrypt file data"""
        if not vault_state.encryption_key:
            raise Exception("Vault is locked")
        
        fernet = Fernet(vault_state.encryption_key)
        return fernet.decrypt(encrypted_data)
    
    def get_encrypted_photo_path(self, photo_id: str) -> Path:
        """Get path for encrypted photo"""
        return self.encrypted_photos_dir / f"{photo_id}.enc"
    
    def emergency_export_files(self) -> list:
        """Get list of files for emergency export"""
        files = []
        
        if self.vault_db.exists():
            files.append(self.vault_db)
        
        if self.salt_file.exists():
            files.append(self.salt_file)
        
        # Add encrypted photos
        if self.encrypted_photos_dir.exists():
            for photo in self.encrypted_photos_dir.glob("*.enc"):
                files.append(photo)
        
        # Add backups
        if self.backups_dir.exists():
            for backup in self.backups_dir.glob("*"):
                files.append(backup)
        
        return files


# Global instance
vault_service: Optional[VaultService] = None


def get_vault_service() -> VaultService:
    """Get vault service instance"""
    global vault_service
    if vault_service is None:
        from app.config import APP_DATA_DIR
        vault_service = VaultService(APP_DATA_DIR)
    return vault_service
