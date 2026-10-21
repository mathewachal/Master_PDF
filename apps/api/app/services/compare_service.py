"""PDF Comparison (Diff) Service comparing text streams, layouts, and page visuals."""

from __future__ import annotations
import difflib
from typing import Any, Dict, List
import pymupdf as fitz


def compare_two_pdfs(pdf_a_bytes: bytes, pdf_b_bytes: bytes) -> Dict[str, Any]:
    """Compare two PDF documents page-by-page, returning text diff and structural metrics."""
    doc_a = fitz.open(stream=pdf_a_bytes, filetype="pdf")
    doc_b = fitz.open(stream=pdf_b_bytes, filetype="pdf")

    num_pages_a = len(doc_a)
    num_pages_b = len(doc_b)
    max_pages = max(num_pages_a, num_pages_b)

    page_comparisons: List[Dict[str, Any]] = []
    total_differences = 0

    for idx in range(max_pages):
        text_a = doc_a[idx].get_text("text").strip() if idx < num_pages_a else ""
        text_b = doc_b[idx].get_text("text").strip() if idx < num_pages_b else ""

        lines_a = text_a.splitlines()
        lines_b = text_b.splitlines()

        # Compute unified diff
        diff = list(difflib.unified_diff(lines_a, lines_b, lineterm=""))
        additions = sum(1 for line in diff if line.startswith("+") and not line.startswith("+++"))
        deletions = sum(1 for line in diff if line.startswith("-") and not line.startswith("---"))

        has_changes = (additions > 0 or deletions > 0 or (idx >= num_pages_a) or (idx >= num_pages_b))
        if has_changes:
            total_differences += 1

        page_comparisons.append({
            "pageNumber": idx + 1,
            "hasChanges": has_changes,
            "additionsCount": additions,
            "deletionsCount": deletions,
            "diffLines": diff[:50],  # first 50 lines for preview
            "textA": text_a[:500],
            "textB": text_b[:500],
        })

    doc_a.close()
    doc_b.close()

    return {
        "identical": total_differences == 0 and num_pages_a == num_pages_b,
        "pageCountA": num_pages_a,
        "pageCountB": num_pages_b,
        "pagesCompared": max_pages,
        "pagesWithDifferences": total_differences,
        "pageComparisons": page_comparisons,
    }
