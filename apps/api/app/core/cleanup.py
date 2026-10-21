import os
import shutil
import time
from pathlib import Path
from app.core.config import settings


def cleanup_expired_files(ttl_minutes: int = settings.TEMP_FILE_TTL_MINUTES) -> int:
    """
    Scans the temporary storage directory and removes directories or files
    older than ttl_minutes. Returns the count of purged items.
    """
    temp_dir = Path(settings.TEMP_DIR)
    if not temp_dir.exists():
        return 0

    now = time.time()
    cutoff = now - (ttl_minutes * 60)
    purged_count = 0

    for item in temp_dir.iterdir():
        try:
            mtime = item.stat().st_mtime
            if mtime < cutoff:
                if item.is_dir():
                    shutil.rmtree(item, ignore_errors=True)
                else:
                    item.unlink(missing_ok=True)
                purged_count += 1
        except Exception:
            # Ignore errors during cleanup to maintain resilience
            pass

    return purged_count


def purge_job_directory(job_id: str) -> bool:
    """Immediately purge a specific job's directory."""
    job_dir = Path(settings.TEMP_DIR) / job_id
    if job_dir.exists() and job_dir.is_dir():
        shutil.rmtree(job_dir, ignore_errors=True)
        return True
    return False
