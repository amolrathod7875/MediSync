"""
MediSync Configuration Settings
"""

import os
from typing import List
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application
    APP_NAME: str = "MediSync"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8000",
    ]
    
    # Data directories
    DATA_DIR: str = "data"
    UPLOAD_DIR: str = "data/uploads"
    EMBEDDINGS_DIR: str = "data/embeddings"
    
    # LLM Settings - COHERE (API-based generation)
    LLM_PROVIDER: str = "cohere"
    COHERE_API_KEY: str = ""
    COHERE_MODEL: str = "command-r"
    
    # Local GPU Embedding Settings
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DEVICE: str = "cuda"  # Use 'cuda' for GPU, 'cpu' as fallback
    EMBEDDING_BATCH_SIZE: int = 32
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 100
    
    # ChromaDB Settings
    CHROMA_PERSIST_DIRECTORY: str = "data/embeddings/chromadb"
    
    # BM25 Settings
    BM25_K1: float = 1.5
    BM25_B: float = 0.75
    
    # Presidio (PII Anonymization)
    PRESIDIO_ANALYZER_ENABLED: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.EMBEDDINGS_DIR, exist_ok=True)
os.makedirs(settings.CHROMA_PERSIST_DIRECTORY, exist_ok=True)
