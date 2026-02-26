"""
Summary Generation API Endpoints
"""

from fastapi import APIRouter, HTTPException, status, Body
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

router = APIRouter()

# In-memory storage for generated summaries
summaries_db: Dict[str, Dict[str, Any]] = {}


class SummaryRequest(BaseModel):
    """Request model for generating summary"""
    patient_id: str
    document_ids: List[str]
    summary_type: str = "discharge"  # discharge or handoff
    include_citations: bool = True


class GeneratedSummary(BaseModel):
    """Generated summary response model"""
    summary_id: str
    patient_id: str
    summary_type: str
    content: Dict[str, Any]
    citations: List[Dict[str, Any]]
    generated_at: str
    status: str


@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_summary(request: SummaryRequest) -> Dict[str, Any]:
    """
    Generate a clinical summary (discharge or handoff) from documents
    """
    from backend.services.generation import generate_clinical_summary
    
    summary_id = str(uuid.uuid4())
    
    try:
        # Generate summary using RAG pipeline
        result = await generate_clinical_summary(
            patient_id=request.patient_id,
            document_ids=request.document_ids,
            summary_type=request.summary_type,
            include_citations=request.include_citations
        )
        
        summary_data = {
            "summary_id": summary_id,
            "patient_id": request.patient_id,
            "summary_type": request.summary_type,
            "content": result["content"],
            "citations": result.get("citations", []),
            "document_ids": request.document_ids,
            "generated_at": datetime.utcnow().isoformat(),
            "status": "generated"
        }
        
        summaries_db[summary_id] = summary_data
        
        return summary_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating summary: {str(e)}"
        )


@router.get("/", status_code=status.HTTP_200_OK)
async def list_summaries(
    patient_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> Dict[str, Any]:
    """
    List all generated summaries, optionally filtered by patient_id
    """
    summaries = list(summaries_db.values())
    
    if patient_id:
        summaries = [s for s in summaries if s.get("patient_id") == patient_id]
    
    # Sort by generated_at descending
    summaries.sort(key=lambda x: x.get("generated_at", ""), reverse=True)
    
    return {
        "total": len(summaries),
        "summaries": summaries[offset:offset + limit]
    }


@router.get("/{summary_id}", status_code=status.HTTP_200_OK)
async def get_summary(summary_id: str) -> Dict[str, Any]:
    """
    Get a specific summary by ID
    """
    if summary_id not in summaries_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Summary {summary_id} not found"
        )
    
    return summaries_db[summary_id]


@router.put("/{summary_id}/edit", status_code=status.HTTP_200_OK)
async def edit_summary(
    summary_id: str,
    edited_content: Dict[str, Any] = Body(...)
) -> Dict[str, Any]:
    """
    Update/Edit a generated summary
    """
    if summary_id not in summaries_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Summary {summary_id} not found"
        )
    
    summary = summaries_db[summary_id]
    summary["content"] = edited_content
    summary["status"] = "edited"
    summary["edited_at"] = datetime.utcnow().isoformat()
    
    return summary


@router.post("/{summary_id}/sign-off", status_code=status.HTTP_200_OK)
async def sign_off_summary(
    summary_id: str,
    signed_by: str = Body(..., embed=True)
) -> Dict[str, Any]:
    """
    Sign off on a summary (doctor approval)
    """
    if summary_id not in summaries_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Summary {summary_id} not found"
        )
    
    summary = summaries_db[summary_id]
    summary["status"] = "signed"
    summary["signed_by"] = signed_by
    summary["signed_at"] = datetime.utcnow().isoformat()
    
    return summary


@router.delete("/{summary_id}", status_code=status.HTTP_200_OK)
async def delete_summary(summary_id: str) -> Dict[str, Any]:
    """
    Delete a summary
    """
    if summary_id not in summaries_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Summary {summary_id} not found"
        )
    
    del summaries_db[summary_id]
    
    return {
        "status": "deleted",
        "summary_id": summary_id
    }
