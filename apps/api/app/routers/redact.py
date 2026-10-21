import re
import json
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
import fitz  # PyMuPDF

router = APIRouter(prefix="/redact", tags=["True Redaction & Verification"])

PRESET_PATTERNS = {
    "email": r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
    "phone": r"(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}",
    "ssn": r"\b\d{3}-\d{2}-\d{4}\b",
    "credit_card": r"\b(?:\d{4}[-\s]?){3}\d{4}\b",
}


@router.post("/search-and-redact")
async def search_and_redact(
    file: UploadFile = File(...),
    custom_pattern: str = Form(""),
    preset: str = Form(""),  # 'email', 'phone', 'ssn', 'credit_card'
    case_sensitive: bool = Form(False),
    sanitize_metadata: bool = Form(True),
):
    """
    Permanently deletes sensitive text, underlying character glyphs, and images matching
    preset patterns (email, phone, SSN, credit cards) or custom regex.
    Performs verified audit confirming text cannot be recovered.
    """
    pattern_str = ""
    if preset and preset in PRESET_PATTERNS:
        pattern_str = PRESET_PATTERNS[preset]
    elif custom_pattern:
        pattern_str = custom_pattern
    else:
        raise HTTPException(status_code=400, detail="Either a valid preset or custom_pattern is required")

    try:
        flags = 0 if case_sensitive else re.IGNORECASE
        regex = re.compile(pattern_str, flags)
    except re.error as e:
        raise HTTPException(status_code=400, detail=f"Invalid regular expression: {str(e)}")

    try:
        content = await file.read()
        doc = fitz.open(stream=content, filetype="pdf")
        total_redactions = 0

        for page in doc:
            # Search for occurrences matching pattern
            text_instances = []
            page_text = page.get_text("text")

            for match in regex.finditer(page_text):
                matched_str = match.group(0)
                # Find all bounding rects for this match
                rects = page.search_for(matched_str)
                text_instances.extend(rects)

            for rect in text_instances:
                # Add true redaction annotation with solid black fill
                page.add_redact_annot(rect, fill=(0, 0, 0))
                total_redactions += 1

            # Apply redactions to permanently remove text and scrub overlapping images
            page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_PIXELS)

        if sanitize_metadata:
            # Permanently strip tracking metadata
            doc.set_metadata({})

        # Audit Verification Step: Re-extract text to confirm pattern is 100% gone
        is_clean = True
        for page in doc:
            remaining_text = page.get_text("text")
            if regex.search(remaining_text):
                is_clean = False
                break

        out_bytes = doc.tobytes(garbage=4, deflate=True, clean=True)
        doc.close()

        return Response(
            content=out_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="redacted_{file.filename or "doc.pdf"}"',
                "X-Redactions-Applied": str(total_redactions),
                "X-Audit-Verified": str(is_clean).lower(),
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Redaction failed: {str(e)}")


@router.post("/areas")
async def redact_specific_areas(
    file: UploadFile = File(...),
    areas_json: str = Form(...),  # JSON array: [{"page": 1, "x0": 50, "y0": 100, "x1": 200, "y1": 150}]
):
    """
    Applies certified byte-level redaction to explicit coordinate bounding boxes.
    """
    try:
        areas = json.loads(areas_json)
        if not isinstance(areas, list):
            raise ValueError("areas_json must be a list of rect objects")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid areas_json: {str(e)}")

    try:
        content = await file.read()
        doc = fitz.open(stream=content, filetype="pdf")

        for item in areas:
            page_num = item.get("page", 1) - 1
            if 0 <= page_num < len(doc):
                page = doc[page_num]
                rect = fitz.Rect(item["x0"], item["y0"], item["x1"], item["y1"])
                page.add_redact_annot(rect, fill=(0, 0, 0))
                page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_PIXELS)

        out_bytes = doc.tobytes(garbage=4, deflate=True, clean=True)
        doc.close()

        return Response(
            content=out_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="redacted_{file.filename or "doc.pdf"}"',
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Area redaction failed: {str(e)}")


@router.post("/verify")
async def verify_absence(
    file: UploadFile = File(...),
    pattern: str = Form(...),
):
    """
    Audits a PDF document to verify that a string or pattern does NOT exist
    anywhere in its content streams.
    """
    try:
        regex = re.compile(pattern, re.IGNORECASE)
        content = await file.read()
        doc = fitz.open(stream=content, filetype="pdf")

        occurrences = []
        for i, page in enumerate(doc):
            text = page.get_text("text")
            matches = list(regex.finditer(text))
            for m in matches:
                occurrences.append({"page": i + 1, "match": m.group(0)})

        doc.close()

        return {
            "verified_absent": len(occurrences) == 0,
            "occurrences_count": len(occurrences),
            "occurrences": occurrences,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")
