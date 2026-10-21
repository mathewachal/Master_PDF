"""Router for PDF format conversion and table extraction."""

from __future__ import annotations
import io
import json
from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response, StreamingResponse
from app.services.convert_service import (
    pdf_to_docx,
    pdf_to_html,
    pdf_to_markdown,
    pdf_to_txt,
    extract_tables_from_pdf,
    tables_to_csv,
    tables_to_xlsx,
    text_or_markdown_to_pdf,
    convert_to_pdfa,
)

router = APIRouter(prefix="/convert", tags=["Convert & Tables"])


@router.post("/pdf-to-format")
async def convert_pdf_to_format(
    file: UploadFile = File(...),
    target_format: str = Form(...),  # "docx", "xlsx", "csv", "markdown", "txt", "html", "pdfa"
):
    """Convert a PDF document into a specified target format."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file missing filename")

    content = await file.read()
    if not content.startswith(b"%PDF"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provided file does not have a valid PDF header (%PDF)",
        )

    base_name = file.filename.rsplit(".", 1)[0]
    target = target_format.lower().strip()

    try:
        if target in ("docx", "word"):
            output_bytes = pdf_to_docx(content)
            return Response(
                content=output_bytes,
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                headers={"Content-Disposition": f'attachment; filename="{base_name}.docx"'},
            )

        elif target in ("xlsx", "excel"):
            tables = extract_tables_from_pdf(content)
            output_bytes = tables_to_xlsx(tables)
            return Response(
                content=output_bytes,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f'attachment; filename="{base_name}.xlsx"'},
            )

        elif target == "csv":
            tables = extract_tables_from_pdf(content)
            csv_str = tables_to_csv(tables)
            return Response(
                content=csv_str.encode("utf-8"),
                media_type="text/csv; charset=utf-8",
                headers={"Content-Disposition": f'attachment; filename="{base_name}.csv"'},
            )

        elif target in ("markdown", "md"):
            md_str = pdf_to_markdown(content)
            return Response(
                content=md_str.encode("utf-8"),
                media_type="text/markdown; charset=utf-8",
                headers={"Content-Disposition": f'attachment; filename="{base_name}.md"'},
            )

        elif target in ("txt", "text"):
            txt_str = pdf_to_txt(content)
            return Response(
                content=txt_str.encode("utf-8"),
                media_type="text/plain; charset=utf-8",
                headers={"Content-Disposition": f'attachment; filename="{base_name}.txt"'},
            )

        elif target == "html":
            html_str = pdf_to_html(content)
            return Response(
                content=html_str.encode("utf-8"),
                media_type="text/html; charset=utf-8",
                headers={"Content-Disposition": f'attachment; filename="{base_name}.html"'},
            )

        elif target in ("pdfa", "pdf/a"):
            output_bytes = convert_to_pdfa(content)
            return Response(
                content=output_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": f'attachment; filename="{base_name}_archival.pdf"'},
            )

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported target format: '{target_format}'. Choose from docx, xlsx, csv, markdown, txt, html, pdfa.",
            )

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Conversion error: {str(exc)}",
        )


@router.post("/to-pdf")
async def convert_to_pdf(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
):
    """Convert text, Markdown, or HTML files into PDF."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    content_bytes = await file.read()
    filename_lower = file.filename.lower()
    doc_title = title or file.filename.rsplit(".", 1)[0]

    try:
        if filename_lower.endswith((".txt", ".md", ".markdown")):
            text_content = content_bytes.decode("utf-8", errors="replace")
            pdf_bytes = text_or_markdown_to_pdf(text_content, title=doc_title)
        elif filename_lower.endswith((".html", ".htm")):
            text_content = content_bytes.decode("utf-8", errors="replace")
            pdf_bytes = text_or_markdown_to_pdf(text_content, title=doc_title)
        else:
            # Fallback text decoder
            text_content = content_bytes.decode("utf-8", errors="replace")
            pdf_bytes = text_or_markdown_to_pdf(text_content, title=doc_title)

        output_name = f"{doc_title}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{output_name}"'},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to convert file to PDF: {str(exc)}",
        )


@router.post("/extract-tables")
async def extract_tables(
    file: UploadFile = File(...),
    page_number: Optional[int] = Form(None),
    output_format: str = Form("json"),  # "json", "csv", "xlsx"
):
    """Detect and extract tabular data from PDF pages."""
    content = await file.read()
    if not content.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="File is not a valid PDF")

    base_name = (file.filename or "document").rsplit(".", 1)[0]
    tables = extract_tables_from_pdf(content, page_number=page_number)

    out_fmt = output_format.lower().strip()
    if out_fmt == "json":
        return {
            "success": True,
            "filename": file.filename,
            "tablesFound": len(tables),
            "tables": tables,
        }
    elif out_fmt == "csv":
        csv_str = tables_to_csv(tables)
        return Response(
            content=csv_str.encode("utf-8"),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{base_name}_tables.csv"'},
        )
    elif out_fmt in ("xlsx", "excel"):
        xlsx_bytes = tables_to_xlsx(tables)
        return Response(
            content=xlsx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{base_name}_tables.xlsx"'},
        )
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{output_format}'. Choose json, csv, or xlsx.",
        )
