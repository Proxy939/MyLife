from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class FTSSearchService:
    
    def create_fts_table(self, db: Session):
        """Create FTS5 virtual table if not exists"""
        try:
            # Create FTS5 virtual table
            db.execute(text("""
                CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
                    memory_id UNINDEXED,
                    title,
                    note,
                    tags,
                    mood,
                    content='memories',
                    content_rowid='id'
                )
            """))
            
            # Create triggers to keep FTS in sync
            # Insert trigger
            db.execute(text("""
                CREATE TRIGGER IF NOT EXISTS memories_fts_insert AFTER INSERT ON memories BEGIN
                    INSERT INTO memories_fts(memory_id, title, note, tags, mood)
                    VALUES (new.id, new.title, new.note, new.tags, new.mood);
                END
            """))
            
            # Update trigger
            db.execute(text("""
                CREATE TRIGGER IF NOT EXISTS memories_fts_update AFTER UPDATE ON memories BEGIN
                    UPDATE memories_fts SET
                        title = new.title,
                        note = new.note,
                        tags = new.tags,
                        mood = new.mood
                    WHERE memory_id = new.id;
                END
            """))
            
            # Delete trigger
            db.execute(text("""
                CREATE TRIGGER IF NOT EXISTS memories_fts_delete AFTER DELETE ON memories BEGIN
                    DELETE FROM memories_fts WHERE memory_id = old.id;
                END
            """))
            
            db.commit()
            logger.info("FTS5 table and triggers created successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error creating FTS5 table: {e}")
            db.rollback()
            return False
    
    def rebuild_fts_index(self, db: Session):
        """Rebuild FTS index from existing memories"""
        try:
            # Clear existing FTS data
            db.execute(text("DELETE FROM memories_fts"))
            
            # Rebuild from memories table
            db.execute(text("""
                INSERT INTO memories_fts(memory_id, title, note, tags, mood)
                SELECT id, title, note, tags, mood FROM memories
            """))
            
            db.commit()
            logger.info("FTS index rebuilt successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error rebuilding FTS index: {e}")
            db.rollback()
            return False
    
    def search(
        self,
        db: Session,
        query: str,
        month: Optional[str] = None,
        mood: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict]:
        """Fast keyword search using FTS5"""
        try:
            # Build FTS query
            # Escape special characters and prepare for MATCH
            safe_query = query.replace('"', '""').strip()
            if not safe_query:
                return []
            
            # Try FTS search first
            try:
                base_query = """
                    SELECT 
                        m.id,
                        m.title,
                        m.note,
                        m.tags,
                        m.mood,
                        m.timestamp,
                        m.created_at,
                        fts.rank
                    FROM memories_fts fts
                    JOIN memories m ON m.id = fts.memory_id
                    WHERE memories_fts MATCH :query
                """
                
                params = {'query': safe_query}
                
                # Add filters
                if month:
                    base_query += " AND m.timestamp LIKE :month"
                    params['month'] = f"{month}%"
                
                if mood:
                    base_query += " AND m.mood = :mood"
                    params['mood'] = mood
                
                # Order by rank and limit
                base_query += " ORDER BY fts.rank LIMIT :limit"
                params['limit'] = limit
                
                result = db.execute(text(base_query), params)
                rows = result.fetchall()
                
                return [{
                    'id': row[0],
                    'title': row[1],
                    'note': row[2],
                    'tags': row[3],
                    'mood': row[4],
                    'timestamp': row[5],
                    'created_at': str(row[6]) if row[6] else None,
                    'rank': row[7]
                } for row in rows]
                
            except Exception as fts_error:
                logger.warning(f"FTS search failed, falling back to LIKE: {fts_error}")
                
                # Fallback to simple LIKE search
                base_query = """
                    SELECT 
                        id,
                        title,
                        note,
                        tags,
                        mood,
                        timestamp,
                        created_at,
                        0 as rank
                    FROM memories
                    WHERE (title LIKE :query OR note LIKE :query OR tags LIKE :query)
                """
                
                params = {'query': f"%{query}%"}
                
                if month:
                    base_query += " AND timestamp LIKE :month"
                    params['month'] = f"{month}%"
                
                if mood:
                    base_query += " AND mood = :mood"
                    params['mood'] = mood
                
                base_query += " ORDER BY created_at DESC LIMIT :limit"
                params['limit'] = limit
                
                result = db.execute(text(base_query), params)
                rows = result.fetchall()
                
                return [{
                    'id': row[0],
                    'title': row[1],
                    'note': row[2],
                    'tags': row[3],
                    'mood': row[4],
                    'timestamp': row[5],
                    'created_at': str(row[6]) if row[6] else None,
                    'rank': row[7]
                } for row in rows]
                
        except Exception as e:
            logger.error(f"Search error: {e}")
            return []


# Global instance
fts_search_service = FTSSearchService()
