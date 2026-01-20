import os
import io
import json
import logging
from pathlib import Path
from typing import Optional, Tuple
from datetime import datetime

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)

SCOPES = ['https://www.googleapis.com/auth/drive.file']


class GoogleDriveService:
    def __init__(self, sync_dir: Path):
        self.sync_dir = sync_dir
        self.sync_dir.mkdir(parents=True, exist_ok=True)
        
        self.token_file = self.sync_dir / 'token.json'
        self.credentials_file = self.sync_dir / 'credentials.json'
        self.service = None
        self.folder_id = None
        
    def is_connected(self) -> bool:
        """Check if we have valid credentials"""
        try:
            if not self.token_file.exists():
                return False
            
            creds = Credentials.from_authorized_user_file(str(self.token_file), SCOPES)
            return creds and creds.valid
        except Exception as e:
            logger.error(f"Error checking connection: {e}")
            return False
    
    def connect(self) -> Tuple[bool, Optional[str]]:
        """Start OAuth flow and save credentials"""
        try:
            if not self.credentials_file.exists():
                return False, "credentials.json not found in sync directory"
            
            creds = None
            
            # Check existing token
            if self.token_file.exists():
                creds = Credentials.from_authorized_user_file(str(self.token_file), SCOPES)
            
            # Refresh or get new token
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                else:
                    flow = InstalledAppFlow.from_client_secrets_file(
                        str(self.credentials_file), SCOPES
                    )
                    creds = flow.run_local_server(port=0)
                
                # Save credentials
                self.token_file.write_text(creds.to_json())
            
            # Build service
            self.service = build('drive', 'v3', credentials=creds)
            
            # Ensure MyLifeBackups folder exists
            self._ensure_backup_folder()
            
            return True, None
            
        except Exception as e:
            logger.error(f"OAuth connection failed: {e}")
            return False, str(e)
    
    def _ensure_backup_folder(self):
        """Ensure MyLifeBackups folder exists on Google Drive"""
        try:
            if not self.service:
                return
            
            # Search for existing folder
            query = "name='MyLifeBackups' and mimeType='application/vnd.google-apps.folder' and trashed=false"
            results = self.service.files().list(q=query, spaces='drive', fields='files(id, name)').execute()
            items = results.get('files', [])
            
            if items:
                self.folder_id = items[0]['id']
                logger.info(f"Using existing MyLifeBackups folder: {self.folder_id}")
            else:
                # Create folder
                file_metadata = {
                    'name': 'MyLifeBackups',
                    'mimeType': 'application/vnd.google-apps.folder'
                }
                folder = self.service.files().create(body=file_metadata, fields='id').execute()
                self.folder_id = folder.get('id')
                logger.info(f"Created MyLifeBackups folder: {self.folder_id}")
                
        except Exception as e:
            logger.error(f"Error ensuring backup folder: {e}")
    
    def upload_backup(self, backup_path: Path) -> Tuple[bool, Optional[str], Optional[dict]]:
        """Upload backup file to Google Drive"""
        try:
            # Ensure connected
            if not self.is_connected():
                connect_success, error = self.connect()
                if not connect_success:
                    return False, error, None
            
            if not self.service or not self.folder_id:
                self._ensure_backup_folder()
            
            if not backup_path.exists():
                return False, "Backup file not found", None
            
            # Create file metadata
            timestamp = datetime.now().strftime("%Y-%m-%d-%H%M")
            file_name = f"MyLife-backup-{timestamp}.zip"
            
            file_metadata = {
                'name': file_name,
                'parents': [self.folder_id]
            }
            
            # Upload file
            media = MediaFileUpload(str(backup_path), mimetype='application/zip', resumable=True)
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, name, createdTime, size'
            ).execute()
            
            logger.info(f"Uploaded backup: {file_name} (ID: {file.get('id')})")
            
            return True, None, {
                'file_id': file.get('id'),
                'file_name': file.get('name'),
                'created_time': file.get('createdTime'),
                'size': file.get('size')
            }
            
        except HttpError as e:
            logger.error(f"Google Drive upload error: {e}")
            return False, f"Upload failed: {e.reason}", None
        except Exception as e:
            logger.error(f"Upload error: {e}")
            return False, str(e), None
    
    def download_latest_backup(self, download_path: Path) -> Tuple[bool, Optional[str], Optional[str]]:
        """Download latest backup from Google Drive"""
        try:
            # Ensure connected
            if not self.is_connected():
                connect_success, error = self.connect()
                if not connect_success:
                    return False, error, None
            
            if not self.service or not self.folder_id:
                self._ensure_backup_folder()
            
            # List backups in folder, sorted by created time (newest first)
            query = f"'{self.folder_id}' in parents and trashed=false"
            results = self.service.files().list(
                q=query,
                orderBy='createdTime desc',
                pageSize=1,
                fields='files(id, name, createdTime)'
            ).execute()
            
            items = results.get('files', [])
            
            if not items:
                return False, "No backups found on Google Drive", None
            
            file = items[0]
            file_id = file['id']
            file_name = file['name']
            
            # Download file
            request = self.service.files().get_media(fileId=file_id)
            
            fh = io.BytesIO()
            downloader = MediaIoBaseDownload(fh, request)
            
            done = False
            while not done:
                status, done = downloader.next_chunk()
                if status:
                    logger.info(f"Download progress: {int(status.progress() * 100)}%")
            
            # Write to file
            download_path.write_bytes(fh.getvalue())
            
            logger.info(f"Downloaded backup: {file_name}")
            return True, None, file_name
            
        except HttpError as e:
            logger.error(f"Google Drive download error: {e}")
            return False, f"Download failed: {e.reason}", None
        except Exception as e:
            logger.error(f"Download error: {e}")
            return False, str(e), None
    
    def get_status(self) -> dict:
        """Get sync status"""
        try:
            connected = self.is_connected()
            
            last_backup_name = None
            last_backup_time = None
            last_error = None
            
            if connected:
                try:
                    # Ensure service is built
                    if not self.service:
                        creds = Credentials.from_authorized_user_file(str(self.token_file), SCOPES)
                        self.service = build('drive', 'v3', credentials=creds)
                        self._ensure_backup_folder()
                    
                    # Get latest backup info
                    if self.folder_id:
                        query = f"'{self.folder_id}' in parents and trashed=false"
                        results = self.service.files().list(
                            q=query,
                            orderBy='createdTime desc',
                            pageSize=1,
                            fields='files(name, createdTime)'
                        ).execute()
                        
                        items = results.get('files', [])
                        if items:
                            last_backup_name = items[0].get('name')
                            last_backup_time = items[0].get('createdTime')
                            
                except Exception as e:
                    last_error = str(e)
            
            return {
                'connected': connected,
                'last_backup_name': last_backup_name,
                'last_backup_time': last_backup_time,
                'last_error': last_error
            }
            
        except Exception as e:
            logger.error(f"Error getting status: {e}")
            return {
                'connected': False,
                'last_backup_name': None,
                'last_backup_time': None,
                'last_error': str(e)
            }


# Global instance
_drive_service: Optional[GoogleDriveService] = None


def get_drive_service() -> GoogleDriveService:
    """Get Google Drive service instance"""
    global _drive_service
    if _drive_service is None:
        from app.config import APP_DATA_DIR
        sync_dir = APP_DATA_DIR / 'sync'
        _drive_service = GoogleDriveService(sync_dir)
    return _drive_service
