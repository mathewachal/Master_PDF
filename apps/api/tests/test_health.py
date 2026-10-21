import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.jobs.store import job_store, JobStatus


@pytest.fixture
def client():
    return TestClient(app)


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "version" in data
    assert data["docs_url"] == "/docs"


def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "system_tools" in data
    assert data["temp_storage_ready"] is True


def test_job_store_lifecycle(client):
    # 1. Create a job
    job = job_store.create(tool_name="test-compress", metadata={"file": "sample.pdf"})
    assert job.id is not None
    assert job.status == JobStatus.PENDING

    # 2. Check status via API
    res = client.get(f"/api/v1/jobs/{job.id}")
    assert res.status_code == 200
    assert res.json()["status"] == "pending"

    # 3. Update progress
    job_store.update_progress(job.id, progress=50, message="Compressing streams...")
    res = client.get(f"/api/v1/jobs/{job.id}")
    assert res.json()["progress"] == 50
    assert res.json()["status"] == "processing"

    # 4. Delete job
    del_res = client.delete(f"/api/v1/jobs/{job.id}")
    assert del_res.status_code == 200

    # 5. Verify 404 after deletion
    res_after = client.get(f"/api/v1/jobs/{job.id}")
    assert res_after.status_code == 404
