import pytest
from fastapi.testclient import TestClient
import pymupdf as fitz
from app.main import app

client = TestClient(app)


def create_sample_pdf_page() -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text(fitz.Point(72, 72), "CONFIDENTIAL INVOICE #98214", fontsize=14, fontname="helv")
    page.insert_text(fitz.Point(72, 100), "Billed to: Acme Corporation", fontsize=11, fontname="helv")
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_ocr_languages_endpoint():
    res = client.get("/api/v1/ocr/languages")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["languages"]) >= 5
    codes = [l["code"] for l in data["languages"]]
    assert "eng" in codes
    assert "spa" in codes


def test_ocr_recognize_searchable_pdf():
    pdf_bytes = create_sample_pdf_page()
    res = client.post(
        "/api/v1/ocr/recognize",
        files={"file": ("invoice.pdf", pdf_bytes, "application/pdf")},
        data={"language": "eng", "output_format": "searchable_pdf", "deskew": True},
    )
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert res.content.startswith(b"%PDF")
    assert "X-Pages-Processed" in res.headers


def test_ocr_recognize_text():
    pdf_bytes = create_sample_pdf_page()
    res = client.post(
        "/api/v1/ocr/recognize",
        files={"file": ("invoice.pdf", pdf_bytes, "application/pdf")},
        data={"language": "eng", "output_format": "txt", "deskew": True},
    )
    assert res.status_code == 200
    assert "text/plain" in res.headers["content-type"]
    text = res.content.decode("utf-8")
    assert "Page 1" in text
