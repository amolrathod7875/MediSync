"""
Documents API Endpoints
"""

from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

router = APIRouter()

# In-memory storage for demo (would be database in production)
documents_db: Dict[str, Dict[str, Any]] = {}


class DocumentResponse(BaseModel):
    """Document response model"""
    document_id: str
    patient_id: Optional[str]
    filename: str
    file_type: str
    content: str
    chunks: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    created_at: str
    status: str


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_document(
    patient_id: Optional[str] = None,
    filename: str = "document.txt",
    content: str = "",
    file_type: str = "text"
) -> Dict[str, Any]:
    """
    Create a new document from raw text or processed content
    """
    document_id = str(uuid.uuid4())
    
    document = {
        "document_id": document_id,
        "patient_id": patient_id,
        "filename": filename,
        "file_type": file_type,
        "content": content,
        "chunks": [],
        "metadata": {
            "source": "api",
            "created_at": datetime.utcnow().isoformat()
        },
        "created_at": datetime.utcnow().isoformat(),
        "status": "created"
    }
    
    documents_db[document_id] = document
    
    return document


@router.get("/", status_code=status.HTTP_200_OK)
async def list_documents(
    patient_id: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0)
) -> Dict[str, Any]:
    """
    List all documents, optionally filtered by patient_id
    """
    docs = list(documents_db.values())
    
    if patient_id:
        docs = [d for d in docs if d.get("patient_id") == patient_id]
    
    # Sort by created_at descending
    docs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    return {
        "total": len(docs),
        "documents": docs[offset:offset + limit]
    }


@router.get("/{document_id}", status_code=status.HTTP_200_OK)
async def get_document(document_id: str) -> Dict[str, Any]:
    """
    Get a specific document by ID
    """
    if document_id not in documents_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document {document_id} not found"
        )
    
    return documents_db[document_id]


@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
async def delete_document(document_id: str) -> Dict[str, Any]:
    """
    Delete a document by ID
    """
    if document_id not in documents_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document {document_id} not found"
        )
    
    del documents_db[document_id]
    
    return {
        "status": "deleted",
        "document_id": document_id
    }


@router.post("/{document_id}/chunk", status_code=status.HTTP_200_OK)
async def chunk_document(document_id: str) -> Dict[str, Any]:
    """
    Process and chunk a document for embedding
    """
    if document_id not in documents_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document {document_id} not found"
        )
    
    from backend.services.ingestion import chunk_document as chunk_text
    
    doc = documents_db[document_id]
    chunks = chunk_text(doc["content"])
    
    doc["chunks"] = chunks
    doc["status"] = "chunked"
    
    return {
        "document_id": document_id,
        "chunks": chunks,
        "chunk_count": len(chunks)
    }
