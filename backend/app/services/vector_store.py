import logging
import os
from typing import List, Tuple, Dict, Any
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
                # Use BAAI/bge-small-en-v1.5 as preferred
                self.model = SentenceTransformer('BAAI/bge-small-en-v1.5')
            except Exception as e:
                logger.warning(f"Preferred model failed ({e}), falling back to all-MiniLM-L6-v2")
                self.model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
            logger.info("Model loaded.")

    def _get_text(self, memory: models.Memory) -> str:
        # Combine fields for semantic density: Title + Mood + Tags + Note
        tags = memory.tags if memory.tags else ""
        return f"{memory.title}. {memory.mood}. {tags}. {memory.note}"

    def initialize(self, db_memories: List[models.Memory]):
        """Load all memories and compute/cache embeddings on startup."""
        self.load_model()
        self.index = []
        
        if not db_memories:
            self.initialized = True
            return

        texts = [self._get_text(m) for m in db_memories]
        ids = [m.id for m in db_memories]
        
        logger.info(f"Computing embeddings for {len(texts)} memories...")
        # Batch encode
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        
        for i, emb in enumerate(embeddings):
            self.index.append({
                'id': ids[i],
                'embedding': emb
            })
        self.initialized = True
        logger.info("Vector Store initialized.")

    def add_or_update(self, memory: models.Memory):
        """Update a single memory in the index."""
        if not self.model: 
            # If called before init (shouldn't happen in normal flow), load model
            self.load_model()
            
        text = self._get_text(memory)
        embedding = self.model.encode(text, convert_to_numpy=True)
        
        # Check if exists and update
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
        """Remove a memory from the index."""
        self.index = [item for item in self.index if item['id'] != memory_id]

    def search(self, query: str, top_k: int = 5) -> List[Tuple[int, float]]:
        """
        Search for memories similar to query.
        Returns list of (memory_id, score).
        """
        if not self.model or not self.index:
            return []

        # Encode query
        query_emb = self.model.encode(query, convert_to_numpy=True).reshape(1, -1)
        
        # Stack embeddings from index
        index_embs = np.stack([item['embedding'] for item in self.index])
        
        # Compute Cosine Similarity
        # Result shape: (1, n_samples)
        scores = cosine_similarity(query_emb, index_embs)[0]
        
        # Get top k indices
        # Sort desc
        top_indices = np.argsort(scores)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            score = float(scores[idx])
            # Optional threshold
            if score > 0.01: 
                results.append((self.index[idx]['id'], score))
                
        return results

# global instance
vector_store = VectorStore()
