"""Document Optimization, Linearization (Fast Web View), Repair, and Deep Sanitization."""

from __future__ import annotations
import io
from typing import Any, Dict, List
import pymupdf as fitz
import pikepdf


def linearize_pdf(pdf_bytes: bytes) -> bytes:
    """Optimize PDF for Fast Web View (byte-range streaming / progressive loading)."""
    with pikepdf.open(io.BytesIO(pdf_bytes)) as pdf:
        output = io.BytesIO()
        pdf.save(
            output,
            linearize=True,
            compress_streams=True,
            object_stream_mode=pikepdf.ObjectStreamMode.generate,
        )
        return output.getvalue()


def repair_pdf(pdf_bytes: bytes) -> bytes:
    """Rebuild cross-reference tables and recover corrupted objects using PyMuPDF and pikepdf."""
    # Step 1: Open with PyMuPDF repair heuristics
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    cleaned_bytes = doc.tobytes(garbage=4, deflate=True, clean=True)
    doc.close()

    # Step 2: Validate and re-save using pikepdf
    with pikepdf.open(io.BytesIO(cleaned_bytes)) as pdf:
        output = io.BytesIO()
        pdf.save(
            output,
            fix_metadata_version=True,
            compress_streams=True,
            linearize=True,
        )
        return output.getvalue()


def sanitize_pdf(pdf_bytes: bytes) -> Dict[str, Any]:
    """Strip all hidden metadata, embedded scripts, JavaScript actions, attachments, and private data."""
    scrubbed_items: List[str] = []

    with pikepdf.open(io.BytesIO(pdf_bytes)) as pdf:
        # 1. Remove Document-level JavaScript actions
        if "/Names" in pdf.Root and "/JavaScript" in pdf.Root.Names:
            del pdf.Root.Names["/JavaScript"]
            scrubbed_items.append("Document JavaScript action table")

        if "/OpenAction" in pdf.Root:
            del pdf.Root["/OpenAction"]
            scrubbed_items.append("Automatic OpenAction launch triggers")

        if "/AA" in pdf.Root:
            del pdf.Root["/AA"]
            scrubbed_items.append("Document event action triggers")

        # 2. Remove Embedded file attachments
        if "/Names" in pdf.Root and "/EmbeddedFiles" in pdf.Root.Names:
            del pdf.Root.Names["/EmbeddedFiles"]
            scrubbed_items.append("Embedded file attachments")

        # 3. Strip XFA (XML Forms Architecture)
        if "/AcroForm" in pdf.Root and "/XFA" in pdf.Root.AcroForm:
            del pdf.Root.AcroForm["/XFA"]
            scrubbed_items.append("XML Forms Architecture (XFA) streams")

        # 4. Remove XML metadata / XMP packet
        if "/Metadata" in pdf.Root:
            del pdf.Root["/Metadata"]
            scrubbed_items.append("XMP metadata packet")

        # 5. Clean DocInfo dictionary
        if pdf.docinfo:
            for k in list(pdf.docinfo.keys()):
                del pdf.docinfo[k]
            scrubbed_items.append("Document info dictionary (Author, Producer, Creator, Title)")

        # 6. Clean Page-level annotations if requested or page scripts
        for p_idx, page in enumerate(pdf.pages):
            if "/AA" in page:
                del page["/AA"]
                scrubbed_items.append(f"Page {p_idx + 1} action scripts")

        output = io.BytesIO()
        pdf.save(
            output,
            compress_streams=True,
            linearize=True,
            object_stream_mode=pikepdf.ObjectStreamMode.generate,
        )

        return {
            "bytes": output.getvalue(),
            "itemsRemoved": scrubbed_items,
            "originalSize": len(pdf_bytes),
            "sanitizedSize": len(output.getvalue()),
        }
