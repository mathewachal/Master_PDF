"""Conversion and Table Extraction Services using PyMuPDF, pymupdf4llm, python-docx, and openpyxl."""

from __future__ import annotations
import io
import csv
import re
from typing import Any, Dict, List, Optional
import pymupdf as fitz
import pymupdf4llm
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
import pikepdf


def pdf_to_txt(pdf_bytes: bytes) -> str:
    """Extract plain text from all pages of a PDF document."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages_text: List[str] = []
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        text = page.get_text("text")
        pages_text.append(f"--- Page {page_idx + 1} ---\n{text.strip()}\n")
    doc.close()
    return "\n".join(pages_text)


def pdf_to_markdown(pdf_bytes: bytes) -> str:
    """Convert PDF to structured Markdown using pymupdf4llm."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    md_text = pymupdf4llm.to_markdown(doc)
    doc.close()
    return md_text


def pdf_to_html(pdf_bytes: bytes) -> str:
    """Convert PDF to standalone responsive HTML with layout preservation."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    html_parts: List[str] = [
        "<!DOCTYPE html>",
        "<html lang='en'>",
        "<head>",
        "<meta charset='utf-8'/>",
        "<title>Converted Document</title>",
        "<style>",
        "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; padding: 2rem; color: #1e293b; }",
        ".pdf-page { background: #ffffff; margin: 0 auto 2rem auto; padding: 2.5rem; max-width: 800px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1); border-radius: 8px; }",
        ".page-num { font-size: 0.75rem; color: #94a3b8; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 1.5rem; }",
        "p { line-height: 1.6; margin-bottom: 1rem; }",
        "table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }",
        "th, td { border: 1px solid #cbd5e1; padding: 0.5rem 0.75rem; text-align: left; font-size: 0.875rem; }",
        "th { background: #f1f5f9; font-weight: 600; }",
        "</style>",
        "</head>",
        "<body>",
    ]

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        html_parts.append(f"<div class='pdf-page'><div class='page-num'>Page {page_idx + 1} of {len(doc)}</div>")
        page_html = page.get_text("html")
        # Extract body contents from page html
        match = re.search(r"<body[^>]*>(.*?)</body>", page_html, re.DOTALL | re.IGNORECASE)
        if match:
            html_parts.append(match.group(1))
        else:
            html_parts.append(f"<pre>{page.get_text('text')}</pre>")
        html_parts.append("</div>")

    html_parts.append("</body></html>")
    doc.close()
    return "\n".join(html_parts)


def pdf_to_docx(pdf_bytes: bytes) -> bytes:
    """Convert PDF to Microsoft Word (.docx) preserving paragraphs, formatting, and tables."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    docx_doc = Document()

    # Document properties
    docx_doc.core_properties.title = "Converted Document"
    docx_doc.core_properties.author = "Master_PDF"

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        if page_idx > 0:
            docx_doc.add_page_break()

        # Check for tables first
        tables = page.find_tables()
        table_bboxes = [t.bbox for t in tables]

        # Extract text blocks
        blocks = page.get_text("blocks")
        # Sort blocks top-to-bottom
        blocks.sort(key=lambda b: (b[1], b[0]))

        for block in blocks:
            # block format: (x0, y0, x1, y1, text, block_no, block_type)
            bx0, by0, bx1, by1, text, _, b_type = block
            if b_type != 0 or not text.strip():
                continue

            # Check if block falls inside an extracted table to avoid duplicate rendering
            in_table = False
            for t_bbox in table_bboxes:
                tx0, ty0, tx1, ty1 = t_bbox
                if bx0 >= tx0 - 5 and bx1 <= tx1 + 5 and by0 >= ty0 - 5 and by1 <= ty1 + 5:
                    in_table = True
                    break

            if not in_table:
                # Add heading if large font or short single line
                clean_text = text.strip()
                if len(clean_text) < 60 and not clean_text.endswith("."):
                    p = docx_doc.add_heading(clean_text, level=2)
                else:
                    docx_doc.add_paragraph(clean_text)

        # Add detected tables
        for table in tables:
            extracted = table.extract()
            if not extracted or len(extracted) == 0:
                continue

            num_rows = len(extracted)
            num_cols = max(len(row) for row in extracted)
            if num_cols == 0:
                continue

            tbl = docx_doc.add_table(rows=num_rows, cols=num_cols)
            tbl.style = "Table Grid"

            for r_idx, row in enumerate(extracted):
                for c_idx, cell_value in enumerate(row):
                    if c_idx < num_cols:
                        cell = tbl.cell(r_idx, c_idx)
                        cell.text = str(cell_value or "").strip()

    doc.close()

    output_stream = io.BytesIO()
    docx_doc.save(output_stream)
    return output_stream.getvalue()


def extract_tables_from_pdf(
    pdf_bytes: bytes,
    page_number: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """Detect and extract structured tables across all pages or a single page."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    extracted_tables: List[Dict[str, Any]] = []

    pages_to_scan = [page_number - 1] if page_number is not None else list(range(len(doc)))

    for p_idx in pages_to_scan:
        if p_idx < 0 or p_idx >= len(doc):
            continue
        page = doc[p_idx]
        tables = page.find_tables()

        for t_idx, table in enumerate(tables):
            raw_data = table.extract()
            if not raw_data:
                continue

            # First row as header if non-empty
            headers: List[str] = []
            rows: List[List[str]] = []
            if len(raw_data) > 0:
                headers = [str(col or f"Column {i+1}").strip() for i, col in enumerate(raw_data[0])]
                for row_data in raw_data[1:]:
                    rows.append([str(c or "").strip() for c in row_data])

            extracted_tables.append({
                "page": p_idx + 1,
                "tableIndex": t_idx + 1,
                "bbox": list(table.bbox),
                "rowCount": len(raw_data),
                "colCount": len(headers),
                "headers": headers,
                "rows": rows,
                "raw": raw_data,
            })

    doc.close()
    return extracted_tables


def tables_to_csv(tables: List[Dict[str, Any]]) -> str:
    """Convert extracted tables list into a consolidated CSV string."""
    output = io.StringIO()
    writer = csv.writer(output)

    for i, tbl in enumerate(tables):
        if i > 0:
            writer.writerow([])
            writer.writerow([f"--- Table {tbl['tableIndex']} (Page {tbl['page']}) ---"])
        if tbl.get("headers"):
            writer.writerow(tbl["headers"])
        for row in tbl.get("rows", []):
            writer.writerow(row)

    return output.getvalue()


def tables_to_xlsx(tables: List[Dict[str, Any]]) -> bytes:
    """Convert extracted tables into a professional styled multi-sheet or single-sheet Excel workbook."""
    wb = Workbook()
    # Remove default sheet
    wb.remove(wb.active)

    if not tables:
        ws = wb.create_sheet(title="No Tables Detected")
        ws["A1"] = "No tables were detected in the provided PDF document."
    else:
        header_font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="3B82F6", end_color="3B82F6", fill_type="solid")
        cell_font = Font(name="Segoe UI", size=10)
        border_side = Side(style="thin", color="CBD5E1")
        cell_border = Border(left=border_side, right=border_side, top=border_side, bottom=border_side)
        alt_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")

        for idx, tbl in enumerate(tables):
            sheet_title = f"Page_{tbl['page']}_Tbl_{tbl['tableIndex']}"[:31]
            ws = wb.create_sheet(title=sheet_title)

            # Write headers
            headers = tbl.get("headers", [])
            for c_idx, h_text in enumerate(headers, start=1):
                cell = ws.cell(row=1, column=c_idx, value=h_text)
                cell.font = header_font
                cell.fill = header_fill
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.border = cell_border

            # Write data rows
            rows = tbl.get("rows", [])
            for r_idx, row in enumerate(rows, start=2):
                is_even = (r_idx % 2 == 0)
                for c_idx, val in enumerate(row, start=1):
                    cell = ws.cell(row=r_idx, column=c_idx, value=val)
                    cell.font = cell_font
                    cell.border = cell_border
                    if is_even:
                        cell.fill = alt_fill

            # Auto-fit column widths
            for col in ws.columns:
                max_len = max(len(str(c.value or "")) for c in col)
                col_letter = col[0].column_letter
                ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    output = io.BytesIO()
    wb.save(output)
    return output.getvalue()


def text_or_markdown_to_pdf(content: str, title: str = "Document") -> bytes:
    """Convert text or markdown to PDF with PyMuPDF story / page layout."""
    doc = fitz.open()
    rect = fitz.Rect(54, 54, 558, 738)  # Standard 0.75-inch margins on Letter/A4
    font_size = 11
    line_height = 15

    lines = content.splitlines()
    page = doc.new_page()
    y = rect.y0

    # Insert document title
    page.insert_text(fitz.Point(rect.x0, y), title, fontsize=18, fontname="helv", color=(0.1, 0.2, 0.4))
    y += 28

    for line in lines:
        if y > rect.y1 - line_height:
            page = doc.new_page()
            y = rect.y0

        # Markdown headings
        if line.startswith("# "):
            page.insert_text(fitz.Point(rect.x0, y), line[2:], fontsize=16, fontname="helv", color=(0.1, 0.2, 0.4))
            y += 22
        elif line.startswith("## "):
            page.insert_text(fitz.Point(rect.x0, y), line[3:], fontsize=14, fontname="helv", color=(0.2, 0.3, 0.5))
            y += 20
        elif line.startswith("### "):
            page.insert_text(fitz.Point(rect.x0, y), line[4:], fontsize=12, fontname="helv", color=(0.25, 0.35, 0.55))
            y += 18
        else:
            page.insert_text(fitz.Point(rect.x0, y), line, fontsize=font_size, fontname="helv", color=(0.15, 0.15, 0.15))
            y += line_height

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def convert_to_pdfa(pdf_bytes: bytes, standard: str = "PDF/A-1b") -> bytes:
    """Standardize and sanitize a PDF into an archival PDF/A compliant document via pikepdf."""
    with pikepdf.open(io.BytesIO(pdf_bytes)) as pdf:
        # Standardize metadata for PDF/A
        with pdf.open_metadata() as meta:
            meta["dc:title"] = "Archival Document"
            meta["pdfaid:part"] = "1" if "1" in standard else "2"
            meta["pdfaid:conformance"] = "B"

        output = io.BytesIO()
        pdf.save(
            output,
            linearize=True,
            compress_streams=True,
            object_stream_mode=pikepdf.ObjectStreamMode.generate,
        )
        return output.getvalue()
