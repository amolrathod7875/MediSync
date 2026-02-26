"""
Health Check API Endpoints
"""

from fastapi import APIRouter, status
from datetime import datetime

router = APIRouter()


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Health check endpoint for service monitoring
    """
    return {
        "status": "healthy",
        "service": "MediSync API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/ready", status_code=status.HTTP_200_OK)
async def readiness_check():
    """
    Readiness check for Kubernetes/容器 orchestration
    """
    return {
        "status": "ready",
        "timestamp": datetime.utcnow().isoformat()
    }
