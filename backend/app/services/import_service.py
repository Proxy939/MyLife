import hashlib
import os
import re
from pathlib import Path
from typing import Optional, List, Dict
from datetime import datetime
from sqlalchemy.orm import Session
from app import models
from app.services.vault_service import get_vault_service
import logging

logger = logging.getLogger(__name__)


class ImportService:
    
    def __init__(self):
        self.supported_image_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
    
    def create_import_job(self, db: Session, job_type: str) -> models.ImportJob:
        """Create new import job"""
        job = models.ImportJob(
            type=job_type,
            status='queued',
            created_at=datetime.now().isoformat()
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job
    
    def update_job_status(self, db: Session, job_id: int, status: str, details: Optional[str] = None):
        """Update job status"""
        job = db.query(models.ImportJob).filter(models.ImportJob.id == job_id).first()
        if job:
            job.status = status
            if details:
                job.details = details
            if status in ['success', 'failed']:
                job.finished_at = datetime.now().isoformat()
            db.commit()
    
    def get_file_hash(self, file_path: Path) -> str:
        """Calculate file hash for duplicate detection"""
        try:
            with open(file_path, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()
        except Exception as e:
            logger.error(f"Error hashing file {file_path}: {e}")
            return ""
    
    def import_photos_folder(self, db: Session, folder_path: str) -> Dict:
        """Import photos from a folder"""
        job = self.create_import_job(db, 'photos_folder')
        
        try:
            self.update_job_status(db, job.id, 'running')
            
            folder = Path(folder_path)
            if not folder.exists() or not folder.is_dir():
                self.update_job_status(db, job.id, 'failed', 'Folder not found or invalid')
                return {'success': False, 'error': 'Folder not found'}
            
            # Get all image files
            image_files = []
            for ext in self.supported_image_extensions:
                image_files.extend(folder.glob(f"*{ext}"))
                image_files.extend(folder.glob(f"*{ext.upper()}"))
            
            imported_count = 0
            skipped_count = 0
            failed_count = 0
            
            # Track existing photos by hash (simplified - in production use better dedup)
            existing_hashes = set()
            
            for image_path in image_files:
                try:
                    # Check for duplicates
                    file_hash = self.get_file_hash(image_path)
                    if file_hash in existing_hashes:
                        skipped_count += 1
                        continue
                    
                    existing_hashes.add(file_hash)
                    
                    # Create memory
                    memory = models.Memory(
                        title=f"Photo Import — {image_path.name}",
                        note="Imported from folder.",
                        mood="neutral",
                        tags="import,photo",
                        timestamp=datetime.now().isoformat()
                    )
                    
                    # TODO: Handle photo storage - for now skip actual file copy
                    # In production: copy to vault storage or encrypt
                    
                    db.add(memory)
                    db.commit()
                    imported_count += 1
                    
                except Exception as e:
                    logger.error(f"Error importing {image_path}: {e}")
                    failed_count += 1
                    continue
            
            details = f"Imported: {imported_count}, Skipped: {skipped_count}, Failed: {failed_count}"
            self.update_job_status(db, job.id, 'success', details)
            
            return {
                'success': True,
                'data': {
                    'job_id': job.id,
                    'imported': imported_count,
                    'skipped': skipped_count,
                    'failed': failed_count
                }
            }
            
        except Exception as e:
            logger.error(f"Photo folder import failed: {e}")
            self.update_job_status(db, job.id, 'failed', str(e))
            return {'success': False, 'error': str(e)}
    
    def import_whatsapp(self, db: Session, file_content: str) -> Dict:
        """Import WhatsApp chat export"""
        job = self.create_import_job(db, 'whatsapp')
        
        try:
            self.update_job_status(db, job.id, 'running')
            
            # Parse WhatsApp format: "DD/MM/YYYY, HH:MM - Sender: Message"
            pattern = r'(\d{1,2}/\d{1,2}/\d{2,4}),\s(\d{1,2}:\d{2})\s-\s([^:]+):\s(.+)'
            
            messages_by_date = {}
            
            for line in file_content.split('\n'):
                match = re.match(pattern, line)
                if match:
                    date_str, time_str, sender, message = match.groups()
                    
                    # Parse date
                    try:
                        date_parts = date_str.split('/')
                        if len(date_parts[2]) == 2:
                            year = f"20{date_parts[2]}"
                        else:
                            year = date_parts[2]
                        date_key = f"{year}-{date_parts[1].zfill(2)}-{date_parts[0].zfill(2)}"
                    except:
                        continue
                    
                    if date_key not in messages_by_date:
                        messages_by_date[date_key] = []
                    
                    messages_by_date[date_key].append({
                        'sender': sender.strip(),
                        'message': message.strip(),
                        'time': time_str
                    })
            
            # Create memories for each date
            imported_count = 0
            
            for date_key, messages in messages_by_date.items():
                try:
                    # Count participants
                    participants = {}
                    for msg in messages:
                        sender = msg['sender']
                        participants[sender] = participants.get(sender, 0) + 1
                    
                    # Create summary note
                    note = f"""## WhatsApp Summary

**Total Messages:** {len(messages)}

**Participants:**
{chr(10).join([f'- {name}: {count} messages' for name, count in sorted(participants.items(), key=lambda x: x[1], reverse=True)[:5]])}

**Sample Messages:**
{chr(10).join([f'• [{msg["time"]}] {msg["sender"]}: {msg["message"][:100]}...' for msg in messages[:5]])}

*Imported from WhatsApp export*
"""
                    
                    memory = models.Memory(
                        title=f"WhatsApp Summary — {date_key}",
                        note=note,
                        mood="neutral",
                        tags="import,whatsapp",
                        timestamp=f"{date_key}T12:00:00"
                    )
                    
                    db.add(memory)
                    db.commit()
                    imported_count += 1
                    
                except Exception as e:
                    logger.error(f"Error creating WhatsApp memory for {date_key}: {e}")
                    continue
            
            details = f"Imported {imported_count} daily summaries from {len(messages_by_date)} dates"
            self.update_job_status(db, job.id, 'success', details)
            
            return {
                'success': True,
                'data': {
                    'job_id': job.id,
                    'imported': imported_count,
                    'dates_processed': len(messages_by_date)
                }
            }
            
        except Exception as e:
            logger.error(f"WhatsApp import failed: {e}")
            self.update_job_status(db, job.id, 'failed', str(e))
            return {'success': False, 'error': str(e)}
    
    def import_pdf(self, db: Session, filename: str, file_content: bytes) -> Dict:
        """Import PDF with text extraction"""
        job = self.create_import_job(db, 'pdf')
        
        try:
            self.update_job_status(db, job.id, 'running')
            
            # Try to extract text (basic approach without external library)
            # In production: use PyPDF2 or pdfplumber
            try:
                text_content = file_content.decode('utf-8', errors='ignore')
                # Extract readable text (very basic)
                text_preview = text_content[:2000] if text_content else "PDF content (binary)"
            except:
                text_preview = "Unable to extract text from PDF"
            
            # Create memory
            note = f"""## PDF Import

**Filename:** {filename}

**Content Preview:**
{text_preview}

*Imported from PDF file*
"""
            
            memory = models.Memory(
                title=f"PDF Notes — {filename}",
                note=note,
                mood="neutral",
                tags="import,pdf",
                timestamp=datetime.now().isoformat()
            )
            
            db.add(memory)
            db.commit()
            
            details = f"Imported PDF: {filename}"
            self.update_job_status(db, job.id, 'success', details)
            
            return {
                'success': True,
                'data': {
                    'job_id': job.id,
                    'memory_id': memory.id,
                    'filename': filename
                }
            }
            
        except Exception as e:
            logger.error(f"PDF import failed: {e}")
            self.update_job_status(db, job.id, 'failed', str(e))
            return {'success': False, 'error': str(e)}
    
    def get_import_jobs(self, db: Session, limit: int = 20) -> List[Dict]:
        """Get recent import jobs"""
        jobs = db.query(models.ImportJob).order_by(
            models.ImportJob.created_at.desc()
        ).limit(limit).all()
        
        return [{
            'id': job.id,
            'type': job.type,
            'status': job.status,
            'created_at': job.created_at,
            'finished_at': job.finished_at,
            'details': job.details
        } for job in jobs]


# Global instance
import_service = ImportService()
