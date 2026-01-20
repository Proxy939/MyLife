from sqlalchemy.orm import Session
from app import models
from app.config import VAULT_DIR, BACKUPS_DIR
from datetime import datetime
import uuid
import hashlib
import shutil
import zipfile
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class SyncService:
    
    def get_or_create_sync_state(self, db: Session) -> models.SyncState:
        """Get or create sync state for this device"""
        sync_state = db.query(models.SyncState).filter(models.SyncState.id == 1).first()
        
        if not sync_state:
            device_id = str(uuid.uuid4())
            sync_state = models.SyncState(
                id=1,
                device_id=device_id
            )
            db.add(sync_state)
            db.commit()
            db.refresh(sync_state)
        
        return sync_state
    
    def calculate_sync_hash(self, vault_path: Path) -> str:
        """Calculate hash of vault file for conflict detection"""
        try:
            if not vault_path.exists():
                return ""
            
            with open(vault_path, 'rb') as f:
                return hashlib.sha256(f.read()).hexdigest()
        except Exception as e:
            logger.error(f"Error calculating sync hash: {e}")
            return ""
    
    def export_snapshot(self, db: Session) -> dict:
        """Export encrypted snapshot package"""
        try:
            sync_state = self.get_or_create_sync_state(db)
            
            # Create snapshot directory
            snapshot_dir = BACKUPS_DIR / f"snapshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            snapshot_dir.mkdir(parents=True, exist_ok=True)
            
            # Copy vault files
            vault_enc = VAULT_DIR / "vault.enc"
            salt_bin = VAULT_DIR / "salt.bin"
            
            if not vault_enc.exists():
                return {'success': False, 'error': 'Vault not found'}
            
            shutil.copy(vault_enc, snapshot_dir / "vault.enc")
            
            if salt_bin.exists():
                shutil.copy(salt_bin, snapshot_dir / "salt.bin")
            
            # Copy encrypted photos if they exist
            photos_dir = VAULT_DIR / "encrypted_photos"
            if photos_dir.exists():
                shutil.copytree(photos_dir, snapshot_dir / "encrypted_photos", dirs_exist_ok=True)
            
            # Calculate sync hash
            sync_hash = self.calculate_sync_hash(vault_enc)
            
            # Create metadata
            metadata = {
                'device_id': sync_state.device_id,
                'exported_at': datetime.now().isoformat(),
                'sync_hash': sync_hash,
                'version': '1.0'
            }
            
            with open(snapshot_dir / "metadata.json", 'w') as f:
                json.dump(metadata, f, indent=2)
            
            # Create ZIP
            zip_path = BACKUPS_DIR / f"mylife_snapshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
            
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for file in snapshot_dir.rglob('*'):
                    if file.is_file():
                        zipf.write(file, file.relative_to(snapshot_dir))
            
            # Cleanup temp directory
            shutil.rmtree(snapshot_dir)
            
            # Update sync state
            sync_state.last_sync_hash = sync_hash
            db.commit()
            
            return {
                'success': True,
                'snapshot_path': str(zip_path),
                'sync_hash': sync_hash,
                'size_mb': zip_path.stat().st_size / (1024 * 1024)
            }
            
        except Exception as e:
            logger.error(f"Snapshot export error: {e}")
            return {'success': False, 'error': str(e)}
    
    def import_snapshot(self, db: Session, snapshot_path: str) -> dict:
        """Import encrypted snapshot and detect conflicts"""
        try:
            sync_state = self.get_or_create_sync_state(db)
            snapshot_file = Path(snapshot_path)
            
            if not snapshot_file.exists():
                return {'success': False, 'error': 'Snapshot file not found'}
            
            # Extract to temp directory
            temp_dir = BACKUPS_DIR / f"temp_import_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            temp_dir.mkdir(parents=True, exist_ok=True)
            
            with zipfile.ZipFile(snapshot_file, 'r') as zipf:
                zipf.extractall(temp_dir)
            
            # Read metadata
            metadata_path = temp_dir / "metadata.json"
            if not metadata_path.exists():
                shutil.rmtree(temp_dir)
                return {'success': False, 'error': 'Invalid snapshot: missing metadata'}
            
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            # Detect conflicts
            current_vault = VAULT_DIR / "vault.enc"
            current_hash = self.calculate_sync_hash(current_vault) if current_vault.exists() else ""
            remote_hash = metadata.get('sync_hash', '')
            
            has_conflict = False
            if current_vault.exists() and current_hash != remote_hash:
                # Check if local has been modified since last sync
                if sync_state.last_sync_hash and sync_state.last_sync_hash != current_hash:
                    has_conflict = True
            
            if has_conflict:
                shutil.rmtree(temp_dir)
                return {
                    'success': False,
                    'conflict': True,
                    'local_hash': current_hash,
                    'remote_hash': remote_hash,
                    'message': 'Conflict detected: local changes exist'
                }
            
            # No conflict - proceed with import
            # Backup current vault
            if current_vault.exists():
                backup_path = BACKUPS_DIR / f"vault_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.enc"
                shutil.copy(current_vault, backup_path)
            
            # Copy vault files
            imported_vault = temp_dir / "vault.enc"
            if imported_vault.exists():
                shutil.copy(imported_vault, current_vault)
            
            imported_salt = temp_dir / "salt.bin"
            if imported_salt.exists():
                shutil.copy(imported_salt, VAULT_DIR / "salt.bin")
            
            # Copy encrypted photos
            imported_photos = temp_dir / "encrypted_photos"
            if imported_photos.exists():
                target_photos = VAULT_DIR / "encrypted_photos"
                target_photos.mkdir(parents=True, exist_ok=True)
                shutil.copytree(imported_photos, target_photos, dirs_exist_ok=True)
            
            # Update sync state
            sync_state.last_sync_hash = remote_hash
            sync_state.last_pull_at = datetime.now().isoformat()
            db.commit()
            
            # Cleanup
            shutil.rmtree(temp_dir)
            
            return {
                'success': True,
                'message': 'Snapshot imported successfully',
                'sync_hash': remote_hash
            }
            
        except Exception as e:
            logger.error(f"Snapshot import error: {e}")
            return {'success': False, 'error': str(e)}
    
    def detect_conflicts(self, db: Session) -> list:
        """Detect sync conflicts"""
        try:
            sync_state = self.get_or_create_sync_state(db)
            vault_path = VAULT_DIR / "vault.enc"
            
            if not vault_path.exists():
                return []
            
            current_hash = self.calculate_sync_hash(vault_path)
            
            conflicts = []
            
            if sync_state.last_sync_hash and sync_state.last_sync_hash != current_hash:
                conflicts.append({
                    'type': 'vault_modified',
                    'local_hash': current_hash,
                    'last_sync_hash': sync_state.last_sync_hash,
                    'message': 'Local vault has been modified since last sync'
                })
            
            return conflicts
            
        except Exception as e:
            logger.error(f"Conflict detection error: {e}")
            return []
    
    def resolve_conflict(self, db: Session, strategy: str, remote_snapshot_path: str = None) -> dict:
        """Resolve sync conflict"""
        try:
            if strategy == 'keep_local':
                # Just update sync hash to match current local
                sync_state = self.get_or_create_sync_state(db)
                vault_path = VAULT_DIR / "vault.enc"
                sync_state.last_sync_hash = self.calculate_sync_hash(vault_path)
                db.commit()
                
                return {'success': True, 'message': 'Kept local changes'}
            
            elif strategy == 'use_remote':
                # Force import remote snapshot
                if not remote_snapshot_path:
                    return {'success': False, 'error': 'Remote snapshot path required'}
                
                # Temporarily disable conflict detection
                sync_state = self.get_or_create_sync_state(db)
                old_hash = sync_state.last_sync_hash
                sync_state.last_sync_hash = None
                db.commit()
                
                result = self.import_snapshot(db, remote_snapshot_path)
                
                if not result['success']:
                    # Restore old hash
                    sync_state.last_sync_hash = old_hash
                    db.commit()
                
                return result
            
            elif strategy == 'merge':
                # TODO: Implement merge using MemoryVersions
                return {'success': False, 'error': 'Merge strategy not yet implemented'}
            
            else:
                return {'success': False, 'error': 'Invalid strategy'}
                
        except Exception as e:
            logger.error(f"Conflict resolution error: {e}")
            return {'success': False, 'error': str(e)}


# Global instance
sync_service = SyncService()
