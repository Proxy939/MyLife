import logging
from typing import List, Tuple
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from .. import models

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VectorStore:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(VectorStore, cls).__new__(cls)
            cls._instance.model = None
            cls._instance.index = [] # List of dict: {'id': int, 'embedding': np.array}
            cls._instance.initialized = False
        return cls._instance

    def load_model(self):
        if self.model is None:
            logger.info("Loading Embedding Model (BAAI/bge-small-en-v1.5)...")
            try:
                self.model = SentenceTransformer('BAAI/bge-small-en-v1.5')
            except Exception:
                logger.warning("Preferred model failed, falling back to all-MiniLM-L6-v2")
                self.model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
            logger.info("Model loaded.")

    def _get_text(self, memory: models.Memory) -> str:
        # Combine fields for semantic density
        tags = memory.tags if memory.tags else ""
        return f"{memory.title}. {memory.mood}. {tags}. {memory.note}"

    def initialize(self, db_memories: List[models.Memory]):
        self.load_model()
        self.index = []
        
        if not db_memories:
            return

        texts = [self._get_text(m) for m in db_memories]
        ids = [m.id for m in db_memories]
        
        logger.info(f"Computing embeddings for {len(texts)} memories...")
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        
        for i, emb in enumerate(embeddings):
            self.index.append({
                'id': ids[i],
                'embedding': emb
            })
        self.initialized = True
        logger.info("Vector Store initialized.")

    def add_or_update(self, memory: models.Memory):
        if not self.model: 
            return # Should be initialized
            
        text = self._get_text(memory)
        embedding = self.model.encode(text, convert_to_numpy=True)
        
        # Check if exists
        for item in self.index:
            if item['id'] == memory.id:
                item['embedding'] = embedding
                return
        
        # Add new
        self.index.append({
            'id': memory.id,
            'embedding': embedding
        })

    def remove(self, memory_id: int):
        self.index = [item for item in self.index if item['id'] != memory_id]

    def search(self, query: str, top_k: int = 5) -> List[Tuple[int, float]]:
        if not self.model or not self.index:
            return []

        query_emb = self.model.encode(query, convert_to_numpy=True).reshape(1, -1)
        
        # Stack embeddings
        index_embs = np.stack([item['embedding'] for item in self.index])
        
        # Cosine Similarity
        scores = cosine_similarity(query_emb, index_embs)[0]
        
        # Get top k
        # Sort indices by score desc
        top_indices = np.argsort(scores)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            score = float(scores[idx])
            if score > 0.01: # Minimal threshold
                results.append((self.index[idx]['id'], score))
                
        return results

# Singleton global access
vector_store = VectorStore()
