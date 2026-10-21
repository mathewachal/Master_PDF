import os
import shutil
from fastapi import APIRouter
from app.core.config import settings
from app.jobs.store import job_store

router = APIRouter(prefix="/health", tags=["Health & Status"])


def _check_system_tools():
    """Detect available system binary dependencies."""
    return {
        "libreoffice": shutil.which("libreoffice") is not None or shutil.which("soffice") is not None,
        "tesseract": shutil.which("tesseract") is not None,
        "ghostscript": shutil.which("gs") is not None or shutil.which("gswin64c") is not None,
    }


@router.get("")
def get_health():
    """Health check endpoint providing runtime state and detected tools."""
    tools = _check_system_tools()
    jobs = job_store.list_jobs(limit=10)
    
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.VERSION,
        "system_tools": tools,
        "active_jobs_count": len([j for j in jobs if j.status in ("pending", "processing")]),
        "temp_storage_ready": os.path.exists(settings.TEMP_DIR),
    }
