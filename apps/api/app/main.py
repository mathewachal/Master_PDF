import os

# Constrain thread pools to avoid excessive buffer allocation and OpenBLAS failures on memory-constrained systems
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.cleanup import cleanup_expired_files
from app.routers import health, jobs, security, redact, convert, ocr, advanced


async def periodic_cleanup_task():
    """Background task running cleanup every 15 minutes."""
    while True:
        try:
            cleanup_expired_files()
        except Exception:
            pass
        await asyncio.sleep(15 * 60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: trigger initial cleanup and start background cleanup loop
    cleanup_expired_files()
    cleanup_task = asyncio.create_task(periodic_cleanup_task())
    yield
    # Shutdown: cancel periodic task
    cleanup_task.cancel()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="High-performance backend API for Master_PDF suite",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(health.router, prefix="/api/v1")
app.include_router(jobs.router, prefix="/api/v1")
app.include_router(security.router, prefix="/api/v1")
app.include_router(redact.router, prefix="/api/v1")
app.include_router(convert.router, prefix="/api/v1")
app.include_router(ocr.router, prefix="/api/v1")
app.include_router(advanced.router, prefix="/api/v1")


@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1": "/api/v1/health",
    }
