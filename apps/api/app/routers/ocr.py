"""Router for Optical Character Recognition (OCR) and text recognition."""

from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response
from app.services.ocr_service import SUPPORTED_LANGUAGES, perform_ocr_on_pdf

router = APIRouter(prefix="/ocr", tags=["OCR"])


@router.get("/languages")
async def get_ocr_languages():
    """Return list of supported OCR languages and ISO codes."""
    return {
        "success": True,
        "languages": SUPPORTED_LANGUAGES,
    }


@router.post("/recognize")
async def recognize_pdf_text(
    file: UploadFile = File(...),
    language: str = Form("eng"),
    output_format: str = Form("searchable_pdf"),  # "searchable_pdf", "txt", "markdown"
    deskew: bool = Form(True),
    pages: Optional[str] = Form(None),  # e.g., "1,2,3" or None for all
):
    """Run OCR on uploaded PDF and return either a searchable PDF, plain text, or Markdown."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    content = await file.read()
    if not content.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="File is not a valid PDF")

    page_numbers = None
    if pages:
        try:
            page_numbers = [int(p.strip()) for p in pages.split(",") if p.strip().isdigit()]
        except Exception:
            page_numbers = None

    base_name = file.filename.rsplit(".", 1)[0]
    out_fmt = output_format.lower().strip()

    try:
        result = perform_ocr_on_pdf(
            pdf_bytes=content,
            language=language,
            output_format=out_fmt,
            deskew=deskew,
            page_numbers=page_numbers,
        )

        ext = result["extension"]
        filename = f"{base_name}_ocr.{ext}"

        response_headers = {
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Pages-Processed": str(result["pages_processed"]),
            "X-Tesseract-Available": str(result["tesseract_available"]).lower(),
        }

        return Response(
            content=result["bytes"],
            media_type=result["media_type"],
            headers=response_headers,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OCR execution failed: {str(exc)}",
        )
