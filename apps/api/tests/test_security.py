import io
import pytest
from fastapi.testclient import TestClient
import pikepdf
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def create_minimal_pdf_bytes():
    pdf = pikepdf.new()
    pdf.add_blank_page(page_size=(300, 300))
    stream = io.BytesIO()
    pdf.save(stream)
    stream.seek(0)
    return stream.getvalue()


def test_protect_and_unlock_pdf(client):
    pdf_bytes = create_minimal_pdf_bytes()
    assert len(pdf_bytes) > 0

    # 1. Protect PDF with a user password
    protect_res = client.post(
        "/api/v1/security/protect",
        files={"file": ("test.pdf", pdf_bytes, "application/pdf")},
        data={"user_password": "SecretPassword123", "owner_password": "AdminPassword123"},
    )
    assert protect_res.status_code == 200
    encrypted_bytes = protect_res.content
    assert len(encrypted_bytes) > 0

    # 2. Verify it cannot be opened without password
    with pytest.raises(pikepdf.PasswordError):
        with pikepdf.open(io.BytesIO(encrypted_bytes)):
            pass

    # 3. Verify it opens with valid password
    with pikepdf.open(io.BytesIO(encrypted_bytes), password="SecretPassword123") as pdf:
        assert len(pdf.pages) == 1

    # 4. Unlock via API
    unlock_res = client.post(
        "/api/v1/security/unlock",
        files={"file": ("protected.pdf", encrypted_bytes, "application/pdf")},
        data={"password": "SecretPassword123"},
    )
    assert unlock_res.status_code == 200
    unlocked_bytes = unlock_res.content

    # 5. Verify unlocked PDF opens without password
    with pikepdf.open(io.BytesIO(unlocked_bytes)) as pdf:
        assert len(pdf.pages) == 1
