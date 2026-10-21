import io
import pytest
from fastapi.testclient import TestClient
import fitz
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def create_pdf_with_sensitive_data():
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    text = (
        "CONFIDENTIAL MEDICAL RECORD\n"
        "Patient: John Doe\n"
        "Email: patient.john@example.com\n"
        "SSN: 123-45-6789\n"
        "Card: 4111-2222-3333-4444\n"
        "Notes: Standard health examination."
    )
    page.insert_text((50, 72), text, fontsize=12)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_search_and_redact_email(client):
    pdf_bytes = create_pdf_with_sensitive_data()

    # 1. Verify email exists initially
    verify_res1 = client.post(
        "/api/v1/redact/verify",
        files={"file": ("test.pdf", pdf_bytes, "application/pdf")},
        data={"pattern": "patient.john@example.com"},
    )
    assert verify_res1.status_code == 200
    assert verify_res1.json()["verified_absent"] is False
    assert verify_res1.json()["occurrences_count"] == 1

    # 2. Redact email using preset
    redact_res = client.post(
        "/api/v1/redact/search-and-redact",
        files={"file": ("test.pdf", pdf_bytes, "application/pdf")},
        data={"preset": "email", "sanitize_metadata": "true"},
    )
    assert redact_res.status_code == 200
    redacted_bytes = redact_res.content

    # 3. Verify email is PERMANENTLY scrubbed and cannot be found
    verify_res2 = client.post(
        "/api/v1/redact/verify",
        files={"file": ("redacted.pdf", redacted_bytes, "application/pdf")},
        data={"pattern": "patient.john@example.com"},
    )
    assert verify_res2.status_code == 200
    assert verify_res2.json()["verified_absent"] is True
    assert verify_res2.json()["occurrences_count"] == 0


def test_search_and_redact_ssn(client):
    pdf_bytes = create_pdf_with_sensitive_data()

    redact_res = client.post(
        "/api/v1/redact/search-and-redact",
        files={"file": ("test.pdf", pdf_bytes, "application/pdf")},
        data={"preset": "ssn"},
    )
    assert redact_res.status_code == 200
    redacted_bytes = redact_res.content

    # Verify SSN is gone
    verify_res = client.post(
        "/api/v1/redact/verify",
        files={"file": ("redacted.pdf", redacted_bytes, "application/pdf")},
        data={"pattern": r"\d{3}-\d{2}-\d{4}"},
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["verified_absent"] is True
