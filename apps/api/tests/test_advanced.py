import pytest
from fastapi.testclient import TestClient
import pymupdf as fitz
from app.main import app

client = TestClient(app)


def create_sample_pdf(text: str = "Confidential Document") -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text(fitz.Point(72, 72), text, fontsize=12, fontname="helv")
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_generate_test_certificate():
    res = client.post(
        "/api/v1/advanced/generate-test-cert",
        data={
            "common_name": "Test Signer",
            "organization": "Acme Corp",
            "password": "secretpassword",
        },
    )
    assert res.status_code == 200
    assert "application/x-pkcs12" in res.headers["content-type"]
    assert len(res.content) > 500


def test_sign_and_verify_signatures():
    # 1. Generate certificate
    cert_res = client.post(
        "/api/v1/advanced/generate-test-cert",
        data={"common_name": "Alice Auditor", "password": "pass"},
    )
    assert cert_res.status_code == 200
    p12_bytes = cert_res.content

    # 2. Sign document
    pdf_bytes = create_sample_pdf("Audit Report 2026")
    sign_res = client.post(
        "/api/v1/advanced/sign-pkcs12",
        files={
            "file": ("audit.pdf", pdf_bytes, "application/pdf"),
            "p12_file": ("cert.pfx", p12_bytes, "application/x-pkcs12"),
        },
        data={"password": "pass", "reason": "Certified compliant"},
    )
    assert sign_res.status_code == 200
    signed_pdf = sign_res.content
    assert signed_pdf.startswith(b"%PDF")

    # 3. Verify signatures
    verify_res = client.post(
        "/api/v1/advanced/verify-signatures",
        files={"file": ("signed_audit.pdf", signed_pdf, "application/pdf")},
    )
    assert verify_res.status_code == 200
    data = verify_res.json()
    assert data["success"] is True
    assert data["isSigned"] is True
    assert data["signatureCount"] >= 1
    assert data["signatures"][0]["signer"] == "Alice Auditor"
    assert data["signatures"][0]["reason"] == "Certified compliant"


def test_linearize_pdf():
    pdf_bytes = create_sample_pdf("Fast Web View Document")
    res = client.post(
        "/api/v1/advanced/linearize",
        files={"file": ("doc.pdf", pdf_bytes, "application/pdf")},
    )
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert res.content.startswith(b"%PDF")


def test_repair_pdf():
    pdf_bytes = create_sample_pdf("Recoverable Document")
    res = client.post(
        "/api/v1/advanced/repair",
        files={"file": ("doc.pdf", pdf_bytes, "application/pdf")},
    )
    assert res.status_code == 200
    assert res.content.startswith(b"%PDF")


def test_sanitize_pdf():
    pdf_bytes = create_sample_pdf("Sensitive Document")
    res = client.post(
        "/api/v1/advanced/sanitize",
        files={"file": ("doc.pdf", pdf_bytes, "application/pdf")},
    )
    assert res.status_code == 200
    assert res.content.startswith(b"%PDF")
    assert "X-Items-Removed" in res.headers


def test_compare_pdfs():
    doc_a = create_sample_pdf("Version 1.0 of the agreement.")
    doc_b = create_sample_pdf("Version 2.0 of the agreement with amendments.")

    res = client.post(
        "/api/v1/advanced/compare",
        files={
            "file_a": ("v1.pdf", doc_a, "application/pdf"),
            "file_b": ("v2.pdf", doc_b, "application/pdf"),
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["identical"] is False
    assert data["pagesWithDifferences"] >= 1
    assert len(data["pageComparisons"]) == 1
    assert data["pageComparisons"][0]["hasChanges"] is True
