from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()

@router.get("/")
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}"
    }

@router.get("/health")
def health_check():
    return {
        "status": "healthy"
    }