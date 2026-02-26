"""
MediSync RAG Pipeline - Hybrid GPU Architecture
================================================
This module demonstrates the hybrid RAG pipeline:
- LOCAL GPU Embeddings: sentence-transformers on CUDA
- COHERE LLM: command-r via API for generation

Author: MediSync Engineering Team
"""

import os
import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

# LangChain imports
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document

# LOCAL GPU Embeddings (HuggingFace on CUDA)
from langchain_huggingface import HuggingFaceEmbeddings

# Cohere LLM imports
from langchain_cohere import ChatCohere

# ChromaDB imports
from langchain_community.vectorstores import Chroma


# ============================================================================
# CONFIGURATION
# ============================================================================

class Config:
    """Configuration for Hybrid AI Pipeline"""
    
    # ============ COHERE LLM (API) ============
    COHERE_API_KEY: str = os.getenv("COHERE_API_KEY", "")
    COHERE_MODEL: str = "command-r"
    
    # ============ LOCAL GPU EMBEDDINGS ============
    EMBEDDING_MODEL: str = os.getenv(
        "EMBEDDING_MODEL", 
        "sentence-transformers/all-MiniLM-L6-v2"
    )
    EMBEDDING_DEVICE: str = os.getenv("EMBEDDING_DEVICE", "cuda")
    EMBEDDING_BATCH_SIZE: int = int(os.getenv("EMBEDDING_BATCH_SIZE", "32"))
    
    # ============ CHROMADB ============
    PERSIST_DIRECTORY: str = "data/embeddings/chromadb"
    COLLECTION_NAME: str = "medical_documents"
    
    # ============ RETRIEVAL ============
    TOP_K_RETRIEVAL: int = 5
    RETRIEVAL_SCORE_THRESHOLD: float = 0.7
    
    # ============ CHUNKING ============
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 100


config = Config()


# ============================================================================
# DATA MODELS
# ============================================================================

class Diagnosis(BaseModel):
    condition: str
    icd_code: Optional[str] = None
    confidence: float = 1.0


class Medication(BaseModel):
    name: str
    dosage: str
    frequency: str
    route: str
    duration: Optional[str] = None


# ============================================================================
# LOCAL GPU EMBEDDINGS
# ============================================================================

def get_embeddings_safe() -> HuggingFaceEmbeddings:
    """Initialize embeddings with CUDA fallback"""
    try:
        embeddings = HuggingFaceEmbeddings(
            model_name=config.EMBEDDING_MODEL,
            model_kwargs={'device': config.EMBEDDING_DEVICE},
            encode_kwargs={
                'batch_size': config.EMBEDDING_BATCH_SIZE,
                'normalize_embeddings': True,
            }
        )
        test = embeddings.embed_query("test")
        print(f"✅ GPU Embeddings: {config.EMBEDDING_MODEL} on {config.EMBEDDING_DEVICE}")
        return embeddings
    except Exception as e:
        print(f"⚠️  GPU failed, using CPU: {e}")
        return HuggingFaceEmbeddings(
            model_name=config.EMBEDDING_MODEL,
            model_kwargs={'device': 'cpu'},
        )


# ============================================================================
# CHROMADB
# ============================================================================

def create_vectorstore(embeddings: HuggingFaceEmbeddings) -> Chroma:
    return Chroma(
        collection_name=config.COLLECTION_NAME,
        embedding_function=embeddings,
        persist_directory=config.PERSIST_DIRECTORY,
    )


def load_vectorstore(embeddings: HuggingFaceEmbeddings) -> Optional[Chroma]:
    if not os.path.exists(config.PERSIST_DIRECTORY):
        return None
    try:
        vs = Chroma(
            collection_name=config.COLLECTION_NAME,
            embedding_function=embeddings,
            persist_directory=config.PERSIST_DIRECTORY,
        )
        print(f"✅ Loaded ChromaDB with {vs._collection.count()} docs")
        return vs
    except:
        return None


# ============================================================================
# COHERE LLM
# ============================================================================

def get_cohere_llm() -> ChatCohere:
    return ChatCohere(
        cohere_api_key=config.COHERE_API_KEY,
        model=config.COHERE_MODEL,
        temperature=0.1,
        max_tokens=2048,
    )


# ============================================================================
# DOCUMENT PROCESSING
# ============================================================================

def split_documents(documents: List[str]) -> List[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=config.CHUNK_SIZE,
        chunk_overlap=config.CHUNK_OVERLAP,
    )
    docs = [Document(page_content=d, metadata={"source": "medical_record"}) for d in documents]
    chunks = splitter.split_documents(docs)
    for i, c in enumerate(chunks):
        c.metadata["chunk_id"] = f"chunk_{i}"
    return chunks


def add_documents_to_store(vectorstore: Chroma, documents: List[Document]):
    texts = [d.page_content for d in documents]
    metadatas = [d.metadata for d in documents]
    vectorstore.add_texts(texts=texts, metadatas=metadatas)
    vectorstore.persist()


# ============================================================================
# RETRIEVAL
# ============================================================================

def retrieve_documents(vectorstore: Chroma, query: str, k: int = 5) -> List[Dict[str, Any]]:
    results = vectorstore.similarity_search_with_score(query, k=k)
    retrieved = []
    for doc, score in results:
        sim = 1 / (1 + score)
        if sim >= config.RETRIEVAL_SCORE_THRESHOLD:
            retrieved.append({
                "content": doc.page_content,
                "chunk_id": doc.metadata.get("chunk_id", "unknown"),
                "similarity_score": round(sim, 4),
            })
    return retrieved


# ============================================================================
# STRUCTURED JSON OUTPUT WITH CITATIONS
# ============================================================================

def build_citation_prompt(query: str, retrieved_docs: List[Dict[str, Any]]) -> str:
    context = "\n\n".join(f"[{d['chunk_id']}] {d['content']}" for d in retrieved_docs)
    
    json_schema = """{
    "diagnosis": [{"condition": "string", "icd_code": "string", "confidence": 0.95}],
    "medications": [{"name": "string", "dosage": "string", "frequency": "string", "route": "string"}],
    "allergies": ["string"],
    "chief_complaint": "string",
    "follow_up_instructions": "string",
    "citations": [{"chunk_id": "string", "claim": "string"}]
}"""
    
    return f"""You are a medical AI assistant.

TASK: Answer using ONLY the provided context. Output MUST be valid JSON:
{json_schema}

For EACH claim, cite using [CHUNK_ID] from context.

QUERY: {query}

CONTEXT:
{context}

Generate JSON now:"""


def query_with_structured_json(query: str, vectorstore: Chroma, llm: ChatCohere, k: int = 5) -> Dict[str, Any]:
    print(f"\n🔍 Query: {query}")
    
    retrieved_docs = retrieve_documents(vectorstore, query, k)
    if not retrieved_docs:
        return {"error": "No relevant documents found", "diagnosis": [], "medications": [], "allergies": []}
    
    prompt = build_citation_prompt(query, retrieved_docs)
    response = llm.invoke(prompt)
    
    try:
        content = response.content if hasattr(response, 'content') else str(response)
        parsed = json.loads(content)
        parsed["query"] = query
        parsed["retrieved_documents_count"] = len(retrieved_docs)
        return parsed
    except:
        return {"error": "JSON parse failed", "diagnosis": [], "medications": [], "allergies": []}


# ============================================================================
# DEMO
# ============================================================================

async def demo_pipeline():
    print("\n" + "="*50)
    print("🚀 MediSync Hybrid RAG Pipeline")
    print("="*50)
    
    embeddings = get_embeddings_safe()
    vectorstore = load_vectorstore(embeddings) or create_vectorstore(embeddings)
    llm = get_cohere_llm()
    
    sample_docs = [
        """
        Patient: John Doe, 65 years old
        Chief Complaint: Chest pain
        
        Diagnosis: Acute Myocardial Infarction (ICD: I21.9)
        Medications: Aspirin 81mg daily, Metoprolol 25mg twice daily
        Allergies: Penicillin
        Follow-up: Cardiology in 2 weeks
        """,
    ]
    
    chunks = split_documents(sample_docs)
    add_documents_to_store(vectorstore, chunks)
    
    result = query_with_structured_json("What medications is the patient on?", vectorstore, llm)
    print(f"\n📊 Result:\n{json.dumps(result, indent=2)}")


if __name__ == "__main__":
    import asyncio
    if not config.COHERE_API_KEY:
        print("⚠️  Set COHERE_API_KEY first!")
    else:
        asyncio.run(demo_pipeline())
