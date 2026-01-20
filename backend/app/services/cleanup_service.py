from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from difflib import SequenceMatcher
from app import models
import logging
import json

logger = logging.getLogger(__name__)


class CleanupService:
    
    def calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate text similarity (0-1)"""
        if not text1 or not text2:
            return 0.0
        return SequenceMatcher(None, text1.lower(), text2.lower()).ratio()
    
    def detect_duplicates(self, db: Session) -> List[Dict]:
        """Detect duplicate memories"""
        try:
            memories = db.query(models.Memory).order_by(models.Memory.created_at.desc()).all()
            
            groups = []
            processed = set()
            
            for i, mem1 in enumerate(memories):
                if mem1.id in processed:
                    continue
                
                duplicates = [mem1.id]
                
                for mem2 in memories[i+1:]:
                    if mem2.id in processed:
                        continue
                    
                    # Check title similarity
                    title_sim = self.calculate_similarity(mem1.title, mem2.title)
                    
                    # Check note similarity
                    note_sim = self.calculate_similarity(mem1.note[:200], mem2.note[:200])
                    
                    # Check timestamp proximity (within 5 minutes)
                    try:
                        time1 = datetime.fromisoformat(mem1.timestamp) if mem1.timestamp else datetime.now()
                        time2 = datetime.fromisoformat(mem2.timestamp) if mem2.timestamp else datetime.now()
                        time_diff = abs((time1 - time2).total_seconds())
                        within_time_window = time_diff < 300  # 5 minutes
                    except:
                        within_time_window = False
                    
                    # Determine if duplicate
                    is_duplicate = False
                    reason = ""
                    
                    if title_sim > 0.9 and note_sim > 0.8:
                        is_duplicate = True
                        reason = f"Very similar title and note ({title_sim:.0%}, {note_sim:.0%})"
                    elif title_sim > 0.95 and within_time_window:
                        is_duplicate = True
                        reason = f"Same title within {int(time_diff)}s"
                    elif mem1.title == mem2.title and mem1.note == mem2.note:
                        is_duplicate = True
                        reason = "Exact duplicate"
                    
                    if is_duplicate:
                        duplicates.append(mem2.id)
                        processed.add(mem2.id)
                
                # Only add group if duplicates found
                if len(duplicates) > 1:
                    groups.append({
                        'group_id': f"group_{mem1.id}",
                        'memory_ids': duplicates,
                        'reason': reason or "Potential duplicates"
                    })
                    processed.add(mem1.id)
            
            return groups
            
        except Exception as e:
            logger.error(f"Duplicate detection error: {e}")
            return []
    
    def merge_memories(self, db: Session, memory_ids: List[int], merge_title: Optional[str] = None) -> Optional[models.Memory]:
        """Merge multiple memories into one"""
        try:
            if len(memory_ids) < 2:
                return None
            
            # Get all memories
            memories = db.query(models.Memory).filter(
                models.Memory.id.in_(memory_ids)
            ).order_by(models.Memory.created_at).all()
            
            if not memories:
                return None
            
            # Use first memory as base
            base_memory = memories[0]
            
            # Combine notes
            combined_note = base_memory.note
            for mem in memories[1:]:
                if mem.note and mem.note not in combined_note:
                    combined_note += f"\n\n---\n\n{mem.note}"
            
            # Combine tags (unique)
            all_tags = set()
            for mem in memories:
                if mem.tags:
                    tags = [t.strip().lower() for t in mem.tags.split(',')]
                    all_tags.update(tags)
            combined_tags = ','.join(sorted(all_tags))
            
            # Choose most common mood
            mood_counts = {}
            for mem in memories:
                if mem.mood:
                    mood_counts[mem.mood] = mood_counts.get(mem.mood, 0) + 1
            best_mood = max(mood_counts.items(), key=lambda x: x[1])[0] if mood_counts else 'neutral'
            
            # Combine photos
            all_photos = []
            for mem in memories:
                if mem.photos:
                    try:
                        photos = json.loads(mem.photos) if isinstance(mem.photos, str) else mem.photos
                        if isinstance(photos, list):
                            all_photos.extend(photos)
                    except:
                        pass
            combined_photos = json.dumps(list(set(all_photos))) if all_photos else "[]"
            
            # Update base memory
            base_memory.title = merge_title or base_memory.title
            base_memory.note = combined_note
            base_memory.tags = combined_tags
            base_memory.mood = best_mood
            base_memory.photos = combined_photos
            
            # Delete other memories
            for mem in memories[1:]:
                db.delete(mem)
            
            db.commit()
            db.refresh(base_memory)
            
            logger.info(f"Merged {len(memories)} memories into ID {base_memory.id}")
            return base_memory
            
        except Exception as e:
            logger.error(f"Memory merge error: {e}")
            db.rollback()
            return None
    
    def enhance_memory(self, db: Session, memory_id: int, use_ai: bool = False) -> Optional[models.Memory]:
        """Auto-enhance a memory"""
        try:
            memory = db.query(models.Memory).filter(models.Memory.id == memory_id).first()
            
            if not memory:
                return None
            
            # Auto-enhancement rules
            enhanced = False
            
            # 1. Improve generic titles
            generic_titles = ['untitled', 'new memory', 'note', 'daily log', 'memory']
            if memory.title.lower().strip() in generic_titles or len(memory.title) < 5:
                # Extract first line from note as title
                if memory.note:
                    first_line = memory.note.split('\n')[0].strip()
                    if len(first_line) > 5 and len(first_line) < 100:
                        memory.title = first_line[:80]
                        enhanced = True
            
            # 2. Normalize tags
            if memory.tags:
                # Split, trim, lowercase, unique
                tags = [t.strip().lower() for t in memory.tags.split(',')]
                tags = [t for t in tags if t]  # Remove empty
                unique_tags = list(dict.fromkeys(tags))  # Preserve order, unique
                new_tags = ','.join(unique_tags)
                
                if new_tags != memory.tags:
                    memory.tags = new_tags
                    enhanced = True
            
            # 3. AI enhancement (optional, basic)
            if use_ai and memory.note:
                # In production: call AI service for summary enhancement
                # For now, just add a header if missing
                if not memory.note.startswith('#'):
                    memory.note = f"# {memory.title}\n\n{memory.note}"
                    enhanced = True
            
            if enhanced:
                db.commit()
                db.refresh(memory)
                logger.info(f"Enhanced memory ID {memory_id}")
            
            return memory
            
        except Exception as e:
            logger.error(f"Memory enhancement error: {e}")
            db.rollback()
            return None


# Global instance
cleanup_service = CleanupService()
