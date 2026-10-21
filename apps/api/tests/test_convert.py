import io
import pytest
from fastapi.testclient import TestClient
import pymupdf as fitz
from app.main import app

client = TestClient(app)


def create_sample_pdf_with_table() -> bytes:
    """Create a sample PDF containing text and a structured table."""
    doc = fitz.open()
    page = doc.new_page()

    # Add title and paragraph
    page.insert_text(fitz.Point(50, 50), "Sales Summary Report", fontsize=16, fontname="helv")
    page.insert_text(
        fitz.Point(50, 80),
        "This is an automated financial summary containing Q1 performance.",
        fontsize=11,
        fontname="helv",
    )

    # Draw table border and lines
    rect = fitz.Rect(50, 110, 350, 190)
    page.draw_rect(rect, color=(0.2, 0.4, 0.8), width=1)
    # Column lines
    page.draw_line(fitz.Point(150, 110), fitz.Point(150, 190), color=(0.5, 0.5, 0.5))
    page.draw_line(fitz.Point(250, 110), fitz.Point(250, 190), color=(0.5, 0.5, 0.5))
    # Row lines
    page.draw_line(fitz.Point(50, 135), fitz.Point(350, 135), color=(0.5, 0.5, 0.5))
    page.draw_line(fitz.Point(50, 160), fitz.Point(350, 160), color=(0.5, 0.5, 0.5))

    # Cell texts
    page.insert_text(fitz.Point(60, 128), "Region", fontsize=10, fontname="helv")
    page.insert_text(fitz.Point(160, 128), "Units Sold", fontsize=10, fontname="helv")
    page.insert_text(fitz.Point(260, 128), "Revenue", fontsize=10, fontname="helv")

    page.insert_text(fitz.Point(60, 150), "North", fontsize=10, fontname="helv")
    page.insert_text(fitz.Point(160, 150), "1,200", fontsize=10, fontname="helv")
    page.insert_text(fitz.Point(260, 150), "$45,000", fontsize=10, fontname="helv")

    page.insert_text(fitz.Point(60, 178), "South", fontsize=10, fontname="helv")
    page.insert_text(fitz.Point(160, 178), "850", fontsize=10, fontname="helv")
    page.insert_text(fitz.Point(260, 178), "$32,500", fontsize=10, fontname="helv")

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_convert_pdf_to_txt():
    pdf_bytes = create_sample_pdf_with_table()
    res = client.post(
        "/api/v1/convert/pdf-to-format",
        files={"file": ("report.pdf", pdf_bytes, "application/pdf")},
        data={"target_format": "txt"},
    )
    assert res.status_code == 200
    assert "text/plain" in res.headers["content-type"]
    text = res.content.decode("utf-8")
    assert "Sales Summary Report" in text
    assert "North" in text


def test_convert_pdf_to_markdown():
    pdf_bytes = create_sample_pdf_with_table()
    res = client.post(
        "/api/v1/convert/pdf-to-format",
        files={"file": ("report.pdf", pdf_bytes, "application/pdf")},
        data={"target_format": "markdown"},
    )
    assert res.status_code == 200
    assert "text/markdown" in res.headers["content-type"]
    md = res.content.decode("utf-8")
    assert "Sales Summary Report" in md


def test_convert_pdf_to_docx():
    pdf_bytes = create_sample_pdf_with_table()
    res = client.post(
        "/api/v1/convert/pdf-to-format",
        files={"file": ("report.pdf", pdf_bytes, "application/pdf")},
        data={"target_format": "docx"},
    )
    assert res.status_code == 200
    assert "wordprocessingml.document" in res.headers["content-type"]
    assert len(res.content) > 1000  # valid docx file


def test_convert_pdf_to_xlsx():
    pdf_bytes = create_sample_pdf_with_table()
    res = client.post(
        "/api/v1/convert/pdf-to-format",
        files={"file": ("report.pdf", pdf_bytes, "application/pdf")},
        data={"target_format": "xlsx"},
    )
    assert res.status_code == 200
    assert "spreadsheetml.sheet" in res.headers["content-type"]
    assert len(res.content) > 500


def test_convert_pdf_to_pdfa():
    pdf_bytes = create_sample_pdf_with_table()
    res = client.post(
        "/api/v1/convert/pdf-to-format",
        files={"file": ("report.pdf", pdf_bytes, "application/pdf")},
        data={"target_format": "pdfa"},
    )
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert res.content.startswith(b"%PDF")


def test_convert_text_to_pdf():
    text_content = "# Project Brief\n\nThis is a sample brief converted directly to PDF."
    res = client.post(
        "/api/v1/convert/to-pdf",
        files={"file": ("brief.md", text_content.encode("utf-8"), "text/markdown")},
        data={"title": "Project Brief"},
    )
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert res.content.startswith(b"%PDF")


def test_extract_tables_json():
    pdf_bytes = create_sample_pdf_with_table()
    res = client.post(
        "/api/v1/convert/extract-tables",
        files={"file": ("report.pdf", pdf_bytes, "application/pdf")},
        data={"output_format": "json"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "tables" in data
