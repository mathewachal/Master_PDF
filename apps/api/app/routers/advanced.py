"""Router for advanced PDF operations: digital signatures, comparison, repair, linearization, and sanitization."""

from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response
from app.services.signing_service import (
    verify_pdf_signatures,
    sign_pdf_with_pkcs12,
    generate_self_signed_pkcs12,
)
from app.services.optimize_service import (
    linearize_pdf,
    repair_pdf,
    sanitize_pdf,
)
from app.services.compare_service import compare_two_pdfs

router = APIRouter(prefix="/advanced", tags=["Advanced & Signatures"])


@router.post("/verify-signatures")
async def verify_signatures(file: UploadFile = File(...)):
    """Inspect and verify all cryptographic digital signatures in a PDF."""
    content = await file.read()
    if not content.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Not a valid PDF file")

    try:
        results = verify_pdf_signatures(content)
        return {
            "success": True,
            "filename": file.filename,
            **results,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Signature verification error: {str(exc)}",
        )


@router.post("/sign-pkcs12")
async def sign_document(
    file: UploadFile = File(...),
    p12_file: UploadFile = File(...),
    password: str = Form(""),
    reason: str = Form("Certified with Master_PDF"),
    location: str = Form("Secure Workstation"),
):
    """Digitally sign a PDF document using a PKCS#12 (.p12/.pfx) certificate."""
    pdf_bytes = await file.read()
    p12_bytes = await p12_file.read()

    if not pdf_bytes.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Primary document is not a valid PDF")

    try:
        signed_bytes = sign_pdf_with_pkcs12(
            pdf_bytes=pdf_bytes,
            p12_bytes=p12_bytes,
            p12_password=password,
            reason=reason,
            location=location,
        )

        base_name = (file.filename or "document").rsplit(".", 1)[0]
        return Response(
            content=signed_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{base_name}_signed.pdf"'},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Digital signing failed: {str(exc)}",
        )


@router.post("/generate-test-cert")
async def generate_cert(
    common_name: str = Form("Demo Signer"),
    organization: str = Form("Master_PDF"),
    password: str = Form("password123"),
):
    """Generate a self-signed PKCS#12 certificate (.pfx) for local testing."""
    try:
        p12_bytes = generate_self_signed_pkcs12(
            common_name=common_name,
            organization=organization,
            password=password,
        )
        return Response(
            content=p12_bytes,
            media_type="application/x-pkcs12",
            headers={"Content-Disposition": 'attachment; filename="demo_certificate.pfx"'},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Certificate generation failed: {str(exc)}",
        )


@router.post("/linearize")
async def linearize(file: UploadFile = File(...)):
    """Optimize PDF for Fast Web View (byte-range streaming)."""
    content = await file.read()
    if not content.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Not a valid PDF file")

    try:
        optimized = linearize_pdf(content)
        base_name = (file.filename or "document").rsplit(".", 1)[0]
        return Response(
            content=optimized,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{base_name}_linearized.pdf"'},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Linearization failed: {str(exc)}")


@router.post("/repair")
async def repair(file: UploadFile = File(...)):
    """Rebuild cross-reference tables and repair corrupted PDF objects."""
    content = await file.read()
    try:
        repaired = repair_pdf(content)
        base_name = (file.filename or "document").rsplit(".", 1)[0]
        return Response(
            content=repaired,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{base_name}_repaired.pdf"'},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF repair failed: {str(exc)}")


@router.post("/sanitize")
async def sanitize(file: UploadFile = File(...)):
    """Deep sanitize document by stripping scripts, attachments, and metadata."""
    content = await file.read()
    if not content.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Not a valid PDF file")

    try:
        result = sanitize_pdf(content)
        base_name = (file.filename or "document").rsplit(".", 1)[0]
        return Response(
            content=result["bytes"],
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{base_name}_sanitized.pdf"',
                "X-Items-Removed": ",".join(result["itemsRemoved"]),
            },
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Sanitization failed: {str(exc)}")


@router.post("/compare")
async def compare(
    file_a: UploadFile = File(...),
    file_b: UploadFile = File(...),
):
    """Compare two PDF documents page-by-page."""
    content_a = await file_a.read()
    content_b = await file_b.read()

    if not content_a.startswith(b"%PDF") or not content_b.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Both files must be valid PDFs")

    try:
        diff_result = compare_two_pdfs(content_a, content_b)
        return {
            "success": True,
            "fileA": file_a.filename,
            "fileB": file_b.filename,
            **diff_result,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(exc)}")
