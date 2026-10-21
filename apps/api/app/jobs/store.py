import time
import uuid
from enum import Enum
from typing import Dict, Optional, Any, List
from pydantic import BaseModel, Field


class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Job(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tool_name: str
    status: JobStatus = JobStatus.PENDING
    progress: int = 0
    message: Optional[str] = None
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)
    completed_at: Optional[float] = None
    output_path: Optional[str] = None
    output_filename: Optional[str] = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class JobStore:
    """In-memory async job store with a clean interface for background task tracking."""

    def __init__(self):
        self._jobs: Dict[str, Job] = {}

    def create(self, tool_name: str, metadata: Optional[Dict[str, Any]] = None) -> Job:
        job = Job(tool_name=tool_name, metadata=metadata or {})
        self._jobs[job.id] = job
        return job

    def get(self, job_id: str) -> Optional[Job]:
        return self._jobs.get(job_id)

    def update_progress(self, job_id: str, progress: int, message: Optional[str] = None) -> Optional[Job]:
        job = self._jobs.get(job_id)
        if job:
            job.status = JobStatus.PROCESSING
            job.progress = max(0, min(100, progress))
            if message is not None:
                job.message = message
            job.updated_at = time.time()
        return job

    def complete(self, job_id: str, output_path: str, output_filename: str) -> Optional[Job]:
        job = self._jobs.get(job_id)
        if job:
            job.status = JobStatus.COMPLETED
            job.progress = 100
            job.output_path = output_path
            job.output_filename = output_filename
            job.completed_at = time.time()
            job.updated_at = time.time()
        return job

    def fail(self, job_id: str, error_message: str) -> Optional[Job]:
        job = self._jobs.get(job_id)
        if job:
            job.status = JobStatus.FAILED
            job.error = error_message
            job.completed_at = time.time()
            job.updated_at = time.time()
        return job

    def list_jobs(self, limit: int = 50) -> List[Job]:
        return sorted(self._jobs.values(), key=lambda j: j.created_at, reverse=True)[:limit]

    def remove(self, job_id: str) -> bool:
        if job_id in self._jobs:
            del self._jobs[job_id]
            return True
        return False


# Singleton JobStore instance
job_store = JobStore()
