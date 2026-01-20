import random
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from app import models
import logging

logger = logging.getLogger(__name__)


class JournalService:
    
    DAILY_PROMPTS = [
        "What was the best moment today?",
        "What challenged you today and how did you handle it?",
        "What did you learn today?",
        "What are you grateful for today?",
        "Who made a positive impact on your day?",
        "What would you do differently today?",
        "What made you smile today?",
        "What progress did you make toward your goals?",
        "What surprised you today?",
        "How did you take care of yourself today?",
        "What conversation stood out to you today?",
        "What small win should you celebrate?",
        "What are you looking forward to tomorrow?",
        "How did you show kindness today?",
        "What energy level did you have today and why?",
        "What creative idea came to you today?",
        "What boundary did you set or need to set?",
        "What made you feel proud today?",
        "What pattern did you notice in your day?",
        "How did you connect with others today?"
    ]
    
    def get_daily_prompt(self, date_str: Optional[str] = None) -> Dict:
        """Get daily prompt for a specific date"""
        if date_str:
            try:
                date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            except:
                date_obj = datetime.now()
        else:
            date_obj = datetime.now()
        
        # Use date as seed for consistent daily prompts
        date_seed = int(date_obj.strftime("%Y%m%d"))
        random.seed(date_seed)
        prompt = random.choice(self.DAILY_PROMPTS)
        
        suggested_tags = ["daily", "reflection", date_obj.strftime("%B").lower()]
        
        return {
            "date": date_obj.strftime("%Y-%m-%d"),
            "prompt": prompt,
            "suggested_tags": suggested_tags
        }
    
    def create_auto_draft(self, db: Session, date_str: Optional[str] = None) -> Optional[models.Memory]:
        """Create automatic daily log draft"""
        try:
            if date_str:
                try:
                    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
                except:
                    date_obj = datetime.now()
            else:
                date_obj = datetime.now()
            
            date_formatted = date_obj.strftime("%Y-%m-%d")
            
            # Check if draft already exists for this date
            existing = db.query(models.Memory).filter(
                models.Memory.title == f"Daily Log — {date_formatted}"
            ).first()
            
            if existing:
                logger.info(f"Daily log already exists for {date_formatted}")
                return existing
            
            # Get daily prompt
            prompt_data = self.get_daily_prompt(date_formatted)
            
            # Create template
            template = f"""## Daily Reflection

**Prompt:** {prompt_data['prompt']}

### Quick Log
- [ ] Morning routine completed
- [ ] Key tasks accomplished
- [ ] Self-care activities
- [ ] Connections made

### Notes
[Write your thoughts here...]

### Highlights
- 

### Tomorrow
- 

---
*Auto-generated daily log*
"""
            
            # Create memory
            memory = models.Memory(
                title=f"Daily Log — {date_formatted}",
                note=template,
                mood="neutral",
                tags="daily,auto-draft",
                timestamp=date_obj.isoformat()
            )
            
            db.add(memory)
            db.commit()
            db.refresh(memory)
            
            logger.info(f"Created auto-draft for {date_formatted}: ID {memory.id}")
            return memory
            
        except Exception as e:
            logger.error(f"Error creating auto-draft: {e}")
            db.rollback()
            return None
    
    def get_weekly_review(self, db: Session, week_start: str) -> Dict:
        """Generate weekly review"""
        try:
            start_date = datetime.strptime(week_start, "%Y-%m-%d")
            end_date = start_date + timedelta(days=7)
            
            # Get memories for the week
            memories = db.query(models.Memory).filter(
                models.Memory.timestamp >= start_date.isoformat(),
                models.Memory.timestamp < end_date.isoformat()
            ).all()
            
            if not memories:
                return {
                    "week_start": week_start,
                    "week_end": end_date.strftime("%Y-%m-%d"),
                    "summary": "No memories for this week",
                    "total_memories": 0,
                    "top_tags": [],
                    "mood_breakdown": {},
                    "highlights": []
                }
            
            # Calculate stats
            total_memories = len(memories)
            
            # Mood breakdown
            mood_counts = {}
            for memory in memories:
                mood = memory.mood or "neutral"
                mood_counts[mood] = mood_counts.get(mood, 0) + 1
            
            # Top tags
            tag_counts = {}
            for memory in memories:
                if memory.tags:
                    tags = [t.strip() for t in memory.tags.split(',')]
                    for tag in tags:
                        if tag:
                            tag_counts[tag] = tag_counts.get(tag, 0) + 1
            
            top_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            top_tags = [{"tag": tag, "count": count} for tag, count in top_tags]
            
            # Highlights (memories with photos or long notes)
            highlights = []
            for memory in memories:
                if memory.photos or (memory.note and len(memory.note) > 100):
                    highlights.append({
                        "id": memory.id,
                        "title": memory.title,
                        "date": memory.timestamp[:10] if memory.timestamp else None,
                        "mood": memory.mood
                    })
            
            highlights = highlights[:5]  # Top 5
            
            # Summary
            summary = f"You created {total_memories} memories this week. "
            if mood_counts:
                dominant_mood = max(mood_counts.items(), key=lambda x: x[1])[0]
                summary += f"Your dominant mood was {dominant_mood}. "
            if top_tags:
                summary += f"Top themes: {', '.join([t['tag'] for t in top_tags[:3]])}."
            
            return {
                "week_start": week_start,
                "week_end": end_date.strftime("%Y-%m-%d"),
                "summary": summary,
                "total_memories": total_memories,
                "top_tags": top_tags,
                "mood_breakdown": mood_counts,
                "highlights": highlights
            }
            
        except Exception as e:
            logger.error(f"Error generating weekly review: {e}")
            return {
                "week_start": week_start,
                "summary": f"Error generating review: {str(e)}",
                "total_memories": 0,
                "top_tags": [],
                "mood_breakdown": {},
                "highlights": []
            }


# Global instance
journal_service = JournalService()
