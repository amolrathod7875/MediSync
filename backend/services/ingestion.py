"""
Data Ingestion Service
Handles file processing, text extraction, PII anonymization, and chunking
"""

import os
import json
import csv
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime

from backend.core.config import settings


async def process_file(file_path: str, filename: str, file_id: str) -> Dict[str, Any]:
    """
    Process a file and extract text content
    """
    file_ext = os.path.splitext(filename)[1].lower()
    
    # Route to appropriate processor
    if file_ext == ".csv":
        content = await _process_csv(file_path)
    elif file_ext == ".json":
        content = await _process_json(file_path)
    elif file_ext == ".txt":
        content = await _process_text(file_path)
    elif file_ext == ".pdf":
        content = await _process_pdf(file_path)
    elif file_ext in {".png", ".jpg", ".jpeg", ".tiff"}:
        content = await _process_image(file_path)
    else:
        content = await _process_text(file_path)
    
    # Anonymize PII
    content = await anonymize_pii(content)
    
    # Create document
    document = {
        "document_id": file_id,
        "filename": filename,
        "file_type": file_ext,
        "content": content,
        "metadata": {
            "processed_at": datetime.utcnow().isoformat(),
            "file_size": os.path.getsize(file_path)
        }
    }
    
    return document


async def _process_csv(file_path: str) -> str:
    """Process CSV file and convert to text"""
    content_lines = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            for key, value in row.items():
                if value:
                    content_lines.append(f"{key}: {value}")
    
    return "\n".join(content_lines)


async def _process_json(file_path: str) -> str:
    """Process JSON file and convert to text"""
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    return _flatten_json(data)


def _flatten_json(data: Any, prefix: str = "") -> str:
    """Flatten JSON to text format"""
    if isinstance(data, dict):
        lines = []
        for key, value in data.items():
            new_prefix = f"{prefix}.{key}" if prefix else key
            lines.append(_flatten_json(value, new_prefix))
        return "\n".join(lines)
    elif isinstance(data, list):
        return "\n".join([_flatten_json(item, prefix) for item in data])
    else:
        return f"{prefix}: {data}" if prefix else str(data)


async def _process_text(file_path: str) -> str:
    """Process plain text file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()


async def _process_pdf(file_path: str) -> str:
    """Process PDF file (placeholder - requires pypdf or pdfplumber)"""
    # Placeholder - would integrate pypdf or pdfplumber
    return "[PDF processing not yet implemented - requires pypdf]" 


async def _process_image(file_path: str) -> str:
    """Process image file (placeholder - requires OCR)"""
    # Placeholder - would integrate vision API for OCR
    return "[Image processing not yet implemented - requires OCR API]"


async def anonymize_pii(text: str) -> str:
    """
    Anonymize PII in text using Microsoft Presidio
    """
    # Placeholder - would integrate Microsoft Presidio
    # For now, just return text as-is
    return text


def chunk_document(content: str, chunk_size: int = None, overlap: int = None) -> List[Dict[str, Any]]:
    """
    Split document into chunks for embedding
    """
    if chunk_size is None:
        chunk_size = settings.CHUNK_SIZE
    if overlap is None:
        chunk_overlap = settings.CHUNK_OVERLAP
    else:
        chunk_overlap = overlap
    
    # Simple chunking by paragraphs and sentences
    chunks = []
    
    # Split by paragraphs first
    paragraphs = content.split("\n\n")
    
    current_chunk = ""
    chunk_id = 0
    
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        
        # If adding this paragraph exceeds chunk size, save current and start new
        if len(current_chunk) + len(para) + 1 > chunk_size and current_chunk:
            chunks.append({
                "chunk_id": f"chunk_{chunk_id}",
                "content": current_chunk.strip(),
                "metadata": {
                    "index": chunk_id
                }
            })
            chunk_id += 1
            
            # Keep overlap from previous chunk
            if chunk_overlap > 0:
                overlap_start = current_chunk[-chunk_overlap:]
                current_chunk = overlap_start + "\n" + para
            else:
                current_chunk = para
        else:
            if current_chunk:
                current_chunk += "\n" + para
            else:
                current_chunk = para
    
    # Add final chunk
    if current_chunk.strip():
        chunks.append({
            "chunk_id": f"chunk_{chunk_id}",
            "content": current_chunk.strip(),
            "metadata": {
                "index": chunk_id
            }
        })
    
    return chunks
