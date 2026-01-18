import requests
import logging
import os
import json
from openai import OpenAI
from sqlalchemy.orm import Session
from .. import crud, models
from .vector_store import vector_store

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OLLAMA_API_URL = "http://127.0.0.1:11434"

class AIRouterService:
    def __init__(self):
        self.openai_client = None
        api_key = os.environ.get("OPENAI_API_KEY")
        if api_key:
            self.openai_client = OpenAI(api_key=api_key)

    def get_ollama_models(self):
        try:
            res = requests.get(f"{OLLAMA_API_URL}/api/tags", timeout=2)
            if res.status_code == 200:
                data = res.json()
                models = [m["name"] for m in data.get("models", [])]
                return {"installed": models, "ollama_running": True}
        except Exception:
            pass
        return {"installed": [], "ollama_running": False}

    def _generate_auto_reply(self, message: str, memories: list):
        """Fallback rule-based chat logic"""
        reply = ""
        if not memories:
            reply = "I couldn't find any specific memories related to that. Try writing a new memory about it!"
        else:
            titles = ", ".join([f"'{m.title}'" for m in memories])
            themes = set()
            for m in memories:
                if m.tags:
                    themes.update([t.strip() for t in m.tags.split(',')])
            theme_str = ", ".join(list(themes)[:3])
            
            if "?" in message:
                reply = f"Based on {titles}, it seems like this is a recurring theme. "
                if "stress" in theme_str.lower() or "sad" in theme_str.lower():
                     reply += "You've handled similar situations before. Maybe take a break?"
                else:
                     reply += f"You have some positive experiences related to {theme_str}."
            else:
                reply = f"I found some memories that match: {titles}. "
                if theme_str:
                    reply += f"Common themes involved are {theme_str}."
        
        return reply + " (Auto Mode)"

    def _generate_local_reply(self, message: str, memories: list, model: str):
        """Call Ollama with Context"""
        if not model or model == "none":
            raise Exception("No model selected")

        context_str = ""
        for m in memories:
            date_str = m.created_at.strftime("%Y-%m-%d")
            context_str += f"- [{date_str}] {m.title} (Mood: {m.mood}): {m.note}\n"

        system_prompt = (
            "You are a helpful AI assistant for the user's personal journal 'MyLife'. "
            "Use the provided memory context to answer the user's message warmly and concisely. "
            "If the memories don't help, verify that, but try to be helpful."
        )

        prompt = f"Context:\n{context_str}\n\nUser Message: {message}\n\nAnswer:"

        payload = {
            "model": model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False
        }

        try:
            res = requests.post(f"{OLLAMA_API_URL}/api/generate", json=payload, timeout=30)
            if res.status_code == 200:
                return res.json().get("response", "")
            else:
                raise Exception(f"Ollama Error: {res.text}")
        except Exception as e:
            logger.error(f"Ollama Call Failed: {e}")
            raise e

    def _generate_openai_reply(self, message: str, memories: list):
        """Call OpenAI with Context"""
        if not self.openai_client:
            raise Exception("OpenAI API Key not found")

        context_str = ""
        for m in memories:
            date_str = m.created_at.strftime("%Y-%m-%d")
            context_str += f"- [{date_str}] {m.title} (Mood: {m.mood}): {m.note}\n"

        response = self.openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful and empathetic AI assistant for a personal journal. Summarize insights based on the user's memories provided."},
                {"role": "user", "content": f"Context Memories:\n{context_str}\n\nUser Question: {message}"}
            ],
            max_tokens=300
        )
        return response.choices[0].message.content

    def chat(self, message: str, db: Session):
        settings = crud.get_settings(db)
        
        # 1. Retrieve Context
        top_k = 3 if settings.ai_provider == "auto" else 5
        search_results = vector_store.search(message, top_k=top_k)
        
        memories = []
        for mem_id, score in search_results:
            m = crud.get_memory(db, mem_id)
            if m:
                memories.append(m)
        
        memory_refs = [m.id for m in memories]
        reply = ""

        # 2. Route Request
        try:
            if settings.ai_provider == "openai" and settings.openai_enabled:
                 reply = self._generate_openai_reply(message, memories)
            elif settings.ai_provider == "local":
                 reply = self._generate_local_reply(message, memories, settings.local_model)
            else:
                 reply = self._generate_auto_reply(message, memories)
        except Exception as e:
            logger.error(f"AI Provider {settings.ai_provider} failed: {e}")
            reply = self._generate_auto_reply(message, memories)

        return {"reply": reply, "memory_refs": memory_refs}

    def generate_recap_openai(self, memories: list):
        """Generate a monthly recap summary using OpenAI"""
        if not self.openai_client:
            raise Exception("OpenAI API Key not found")
        
        if not memories:
            return "No memories recorded this month."

        context_str = ""
        for m in memories[:30]: 
            date_str = m.created_at.strftime("%d")
            context_str += f"- Day {date_str}: {m.title} ({m.mood}): {m.note[:100]}...\n"

        prompt = (
            "Write a warm, concise monthly recap summary (2-3 sentences) based on these journal entries. "
            "Highlight the general mood and key events."
        )

        response = self.openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an empathetic journal assistant."},
                {"role": "user", "content": f"Entries:\n{context_str}\n\n{prompt}"}
            ],
            max_tokens=200
        )
        return response.choices[0].message.content

    def analyze_insights(self, memories: list, provider: str, local_model: str):
        """
        Generate deeper insights (Summary, Patterns, Suggestions) using LLM.
        Returns a dict with keys: summary, customs_patterns (list), custom_suggestions (list)
        """
        if not memories:
            return None

        context_str = ""
        # Provide more context for insights, maybe up to 40 entries
        for m in memories[:40]:
            date_str = m.created_at.strftime("%Y-%m-%d")
            context_str += f"- {date_str}: {m.title} (Mood: {m.mood}, Tags: {m.tags}). Note: {m.note[:150]}\n"

        system_prompt = (
            "You are an analytical but empathetic life coach AI. Analyze the user's journal entries. "
            "Output JSON with 3 fields: 'summary' (string), 'patterns' (list of strings), 'suggestions' (list of strings). "
            "Summary: 2 sentences overview of their month/period. "
            "Patterns: 3 key recurring behaviors or mood triggers. "
            "Suggestions: 3 actionable tips based on the patterns. "
            "Do NOT include markdown formatting, just raw JSON."
        )

        user_prompt = f"Journal Data:\n{context_str}\n\nGenerate JSON insights."

        try:
            response_text = ""
            if provider == 'openai':
                if not self.openai_client: raise Exception("No OpenAI client")
                completion = self.openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    max_tokens=500
                )
                response_text = completion.choices[0].message.content

            elif provider == 'local':
                 payload = {
                    "model": local_model,
                    "prompt": user_prompt,
                    "system": system_prompt + " RETURN ONLY JSON.",
                    "stream": False,
                    "format": "json" 
                }
                 res = requests.post(f"{OLLAMA_API_URL}/api/generate", json=payload, timeout=45)
                 if res.status_code == 200:
                     response_text = res.json().get("response", "")
                 else:
                     raise Exception("Ollama failed")
            
            # Parse JSON
            try:
                data = json.loads(response_text)
                return {
                    "summary": data.get("summary", ""),
                    "patterns": data.get("patterns", []),
                    "suggestions": data.get("suggestions", [])
                }
            except:
                # Fallback if JSON parsing fails
                return {
                    "summary": response_text[:200] + "...",
                    "patterns": [],
                    "suggestions": []
                }

        except Exception as e:
            logger.error(f"Insight Generation Failed ({provider}): {e}")
            return None

ai_router_service = AIRouterService()
