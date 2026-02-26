"""
MediSync - AI Shift-Handoff & Discharge Copilot
FastAPI Backend Application
"""

import sys
import os

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.api import health, documents, summary, upload
from backend.core.config import settings

# Create FastAPI application
app = FastAPI(
    title="MediSync API",
    description="AI-powered clinical documentation with RAG-based generation",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    health.router,
    prefix="/api/v1",
    tags=["Health"]
)

app.include_router(
    documents.router,
    prefix="/api/v1/documents",
    tags=["Documents"]
)

app.include_router(
    summary.router,
    prefix="/api/v1/summary",
    tags=["Summary"]
)

app.include_router(
    upload.router,
    prefix="/api/v1/upload",
    tags=["Upload"]
)


@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "name": "MediSync API",
        "version": "1.0.0",
        "description": "AI-powered clinical documentation with RAG-based generation",
        "docs": "/api/docs"
    }


if __name__ == "__main__":
    import uvicorn
