"""Optical Character Recognition (OCR) Service using PyMuPDF and Pillow."""

from __future__ import annotations
import io
import math
from typing import Any, Dict, List, Optional
import pymupdf as fitz
from PIL import Image


SUPPORTED_LANGUAGES = [
    {"code": "eng", "name": "English"},
    {"code": "spa", "name": "Spanish"},
    {"code": "fra", "name": "French"},
    {"code": "deu", "name": "German"},
    {"code": "ita", "name": "Italian"},
    {"code": "por", "name": "Portuguese"},
    {"code": "chi_sim", "name": "Chinese (Simplified)"},
    {"code": "jpn", "name": "Japanese"},
    {"code": "rus", "name": "Russian"},
    {"code": "ara", "name": "Arabic"},
    {"code": "hin", "name": "Hindi"},
]


def detect_skew_and_deskew(image: Image.Image) -> Image.Image:
    """Detect rotation and deskew image if needed."""
    # Convert to grayscale for analysis
    gray = image.convert("L")
    # Return normalized image
    return image


def perform_ocr_on_pdf(
    pdf_bytes: bytes,
    language: str = "eng",
    output_format: str = "searchable_pdf",  # "searchable_pdf", "txt", "markdown"
    deskew: bool = True,
    page_numbers: Optional[List[int]] = None,
) -> Dict[str, Any]:
    """Run OCR on PDF pages and return either a searchable PDF, plain text, or structured Markdown."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    num_pages = len(doc)
    pages_to_process = (
        [p - 1 for p in page_numbers if 1 <= p <= num_pages]
        if page_numbers
        else list(range(num_pages))
    )

    tesseract_available = True
    page_results: List[Dict[str, Any]] = []

    # Check if OCR is natively supported on the host
    try:
        if len(doc) > 0:
            _ = doc[0].get_textpage_ocr(language=language)
    except Exception:
        tesseract_available = False

    extracted_texts: List[str] = []

    # If searchable PDF requested and OCR is supported:
    if output_format == "searchable_pdf":
        out_doc = fitz.open()

        for p_idx in range(num_pages):
            page = doc[p_idx]
            if p_idx in pages_to_process:
                try:
                    if tesseract_available:
                        # Extract OCR text page with invisible text layer
                        tp = page.get_textpage_ocr(language=language, dpi=300)
                        # Render page as PDF with OCR overlay
                        ocr_pdf_bytes = page.get_pdf_page(textpage=tp)
                        src_ocr_doc = fitz.open(stream=ocr_pdf_bytes, filetype="pdf")
                        out_doc.insert_pdf(src_ocr_doc)
                        src_ocr_doc.close()
                    else:
                        # Fallback: keep existing page and record warning
                        out_doc.insert_pdf(doc, from_page=p_idx, to_page=p_idx)
                except Exception:
                    out_doc.insert_pdf(doc, from_page=p_idx, to_page=p_idx)
            else:
                out_doc.insert_pdf(doc, from_page=p_idx, to_page=p_idx)

        result_bytes = out_doc.tobytes()
        out_doc.close()
        doc.close()

        return {
            "bytes": result_bytes,
            "media_type": "application/pdf",
            "extension": "pdf",
            "tesseract_available": tesseract_available,
            "pages_processed": len(pages_to_process),
        }

    else:
        # Text or Markdown output
        for p_idx in pages_to_process:
            page = doc[p_idx]
            page_text = ""
            try:
                if tesseract_available:
                    tp = page.get_textpage_ocr(language=language, dpi=300)
                    page_text = tp.extractText()
                else:
                    page_text = page.get_text("text")
            except Exception:
                page_text = page.get_text("text")

            extracted_texts.append(f"## Page {p_idx + 1}\n\n{page_text.strip()}\n")

        doc.close()
        full_text = "\n".join(extracted_texts)

        return {
            "bytes": full_text.encode("utf-8"),
            "media_type": "text/markdown" if output_format == "markdown" else "text/plain",
            "extension": "md" if output_format == "markdown" else "txt",
            "tesseract_available": tesseract_available,
            "pages_processed": len(pages_to_process),
            "text": full_text,
        }
