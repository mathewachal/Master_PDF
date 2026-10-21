import type { PDFDocumentProxy } from 'pdfjs-dist';

export interface SearchMatch {
  pageNumber: number;
  matchIndex: number;
  snippet: string;
  query: string;
}

export interface PageTextCache {
  pageNumber: number;
  fullText: string;
}

/**
 * Extracts and caches all plain text across all document pages.
 */
export async function extractDocumentText(doc: PDFDocumentProxy): Promise<PageTextCache[]> {
  const pages: PageTextCache[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');

    pages.push({
      pageNumber: i,
      fullText: text,
    });
  }

  return pages;
}

/**
 * Searches for a text query across pre-extracted pages, returning matching snippets.
 */
export function searchInExtractedText(
  cachedPages: PageTextCache[],
  query: string
): SearchMatch[] {
  if (!query || query.trim().length === 0) return [];

  const normalizedQuery = query.toLowerCase().trim();
  const matches: SearchMatch[] = [];

  for (const page of cachedPages) {
    const text = page.fullText;
    const lower = text.toLowerCase();
    let pos = 0;
    let matchIdx = 0;

    while ((pos = lower.indexOf(normalizedQuery, pos)) !== -1) {
      const start = Math.max(0, pos - 35);
      const end = Math.min(text.length, pos + query.length + 35);
      const snippet = (start > 0 ? '...' : '') + text.substring(start, end) + (end < text.length ? '...' : '');

      matches.push({
        pageNumber: page.pageNumber,
        matchIndex: matchIdx++,
        snippet,
        query,
      });

      pos += normalizedQuery.length;
    }
  }

  return matches;
}
