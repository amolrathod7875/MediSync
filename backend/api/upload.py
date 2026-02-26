"""
File Upload API Endpoints
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse
from typing import List, Dict, Any
import os
import uuid
from datetime import datetime

from backend.core.config import settings
from backend.services.ingestion import process_file

router = APIRouter()

# Supported file extensions
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".csv", ".json", ".txt"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


@router.post("/", status_code=status.HTTP_201_CREATED)
async def upload_file(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Upload a single clinical document for processing
    
    Supports: PDF, PNG, JPG, JPEG, TIFF, CSV, JSON, TXT
    """
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Generate unique file ID
    file_id = str(uuid.uuid4())
    
    # Create safe filename
    safe_filename = f"{file_id}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    
    # Save file
    try:
        content = await file.read()
        
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE / (1024*1024)}MB"
            )
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Process file (extract text, anonymize, etc.)
        processed_doc = await process_file(file_path, file.filename, file_id)
        
        return {
            "file_id": file_id,
            "filename": file.filename,
            "file_type": file_ext,
            "status": "uploaded",
            "processed": True,
            "document": processed_doc,
            "uploaded_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        # Clean up on failure
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}"
        )


@router.post("/batch", status_code=status.HTTP_201_CREATED)
async def upload_batch(files: List[UploadFile] = File(...)) -> Dict[str, Any]:
    """
    Upload multiple clinical documents for batch processing
    """
    results = []
    
    for file in files:
        try:
            file_ext = os.path.splitext(file.filename)[1].lower()
            if file_ext not in ALLOWED_EXTENSIONS:
                results.append({
                    "filename": file.filename,
                    "status": "error",
                    "error": f"File type not supported"
                })
                continue
            
            file_id = str(uuid.uuid4())
            safe_filename = f"{file_id}_{file.filename}"
            file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
            
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
            
            processed_doc = await process_file(file_path, file.filename, file_id)
            
            results.append({
                "file_id": file_id,
                "filename": file.filename,
                "status": "uploaded",
                "processed": True,
                "document": processed_doc
            })
            
        except Exception as e:
            results.append({
                "filename": file.filename,
                "status": "error",
                "error": str(e)
            })
    
    return {
        "total_files": len(files),
        "results": results,
        "uploaded_at": datetime.utcnow().isoformat()
    }
