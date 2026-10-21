import { PDFDocument, degrees, PageSizes } from 'pdf-lib';

export interface SplitFileResult {
  filename: string;
  data: Uint8Array;
  pageCount: number;
}

/**
 * Merges multiple PDF byte arrays into a single unified PDF document.
 */
export async function mergeDocuments(
  documents: { name: string; data: Uint8Array }[]
): Promise<Uint8Array> {
  if (documents.length === 0) {
    throw new Error('At least one document is required to merge');
  }

  const mergedPdf = await PDFDocument.create();

  for (const doc of documents) {
    const srcDoc = await PDFDocument.load(doc.data);
    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * Parses page range strings like "1-3, 5, 8-10" into unique 0-indexed page indices.
 */
export function parsePageRanges(rangeStr: string, totalPages: number): number[] {
  const indices = new Set<number>();
  const parts = rangeStr.split(',').map((p) => p.trim());

  for (const part of parts) {
    if (!part) continue;
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = Math.max(1, parseInt(startStr, 10));
      const end = Math.min(totalPages, parseInt(endStr, 10));
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          indices.add(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        indices.add(pageNum - 1);
      }
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Splits a PDF document by comma-separated page ranges (e.g. "1-2, 3-5").
 */
export async function splitDocumentByRanges(
  data: Uint8Array,
  rangeGroups: string[],
  baseFilename: string = 'document'
): Promise<SplitFileResult[]> {
  const srcDoc = await PDFDocument.load(data);
  const totalPages = srcDoc.getPageCount();
  const results: SplitFileResult[] = [];
  const cleanBase = baseFilename.replace(/\.pdf$/i, '');

  for (let g = 0; g < rangeGroups.length; g++) {
    const rangeStr = rangeGroups[g].trim();
    if (!rangeStr) continue;

    const indices = parsePageRanges(rangeStr, totalPages);
    if (indices.length === 0) continue;

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, indices);
    copiedPages.forEach((page) => newDoc.addPage(page));

    const bytes = await newDoc.save();
    results.push({
      filename: `${cleanBase}_part_${g + 1}.pdf`,
      data: bytes,
      pageCount: indices.length,
    });
  }

  return results;
}

/**
 * Splits document into chunks of every N pages.
 */
export async function splitEveryNPages(
  data: Uint8Array,
  n: number,
  baseFilename: string = 'document'
): Promise<SplitFileResult[]> {
  if (n <= 0) throw new Error('Chunk size N must be greater than 0');

  const srcDoc = await PDFDocument.load(data);
  const totalPages = srcDoc.getPageCount();
  const results: SplitFileResult[] = [];
  const cleanBase = baseFilename.replace(/\.pdf$/i, '');

  let part = 1;
  for (let i = 0; i < totalPages; i += n) {
    const end = Math.min(i + n, totalPages);
    const indices: number[] = [];
    for (let j = i; j < end; j++) {
      indices.push(j);
    }

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, indices);
    copiedPages.forEach((page) => newDoc.addPage(page));

    const bytes = await newDoc.save();
    results.push({
      filename: `${cleanBase}_part_${part++}.pdf`,
      data: bytes,
      pageCount: indices.length,
    });
  }

  return results;
}

/**
 * Reorders pages in a document based on an array of 1-indexed page numbers.
 */
export async function reorderPages(
  data: Uint8Array,
  newOrder: number[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(data);
  const newDoc = await PDFDocument.create();

  const zeroIndexed = newOrder.map((p) => p - 1);
  const copiedPages = await newDoc.copyPages(srcDoc, zeroIndexed);
  copiedPages.forEach((page) => newDoc.addPage(page));

  return await newDoc.save();
}

/**
 * Rotates specified 1-indexed pages by a given angle (e.g. 90, 180, 270).
 */
export async function rotatePages(
  data: Uint8Array,
  pagesToRotate: number[],
  angle: number
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data);
  const pagesSet = new Set(pagesToRotate);

  for (let i = 0; i < doc.getPageCount(); i++) {
    const pageNum = i + 1;
    if (pagesSet.has(pageNum)) {
      const page = doc.getPage(i);
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + angle) % 360));
    }
  }

  return await doc.save();
}

/**
 * Deletes specified 1-indexed pages from the document.
 */
export async function deletePages(
  data: Uint8Array,
  pagesToDelete: number[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data);
  const total = doc.getPageCount();
  const toDelete = new Set(pagesToDelete.map((p) => p - 1));

  // Must have at least 1 page remaining
  if (toDelete.size >= total) {
    throw new Error('Cannot delete all pages in document. At least one page must remain.');
  }

  // Delete in descending order of indices to prevent shifting issues
  const sorted = Array.from(toDelete).sort((a, b) => b - a);
  for (const idx of sorted) {
    if (idx >= 0 && idx < doc.getPageCount()) {
      doc.removePage(idx);
    }
  }

  return await doc.save();
}

/**
 * Extracts specified 1-indexed pages into a fresh document.
 */
export async function extractPages(
  data: Uint8Array,
  pagesToExtract: number[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(data);
  const newDoc = await PDFDocument.create();

  const zeroIndexed = pagesToExtract.map((p) => p - 1);
  const copiedPages = await newDoc.copyPages(srcDoc, zeroIndexed);
  copiedPages.forEach((page) => newDoc.addPage(page));

  return await newDoc.save();
}

/**
 * Inserts a blank A4 page at a specified 1-indexed position (1 = at start).
 */
export async function insertBlankPage(
  data: Uint8Array,
  insertAtPage: number = -1
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data);
  const total = doc.getPageCount();

  if (insertAtPage < 1 || insertAtPage > total + 1) {
    doc.addPage(PageSizes.A4);
  } else {
    doc.insertPage(insertAtPage - 1, PageSizes.A4);
  }

  return await doc.save();
}
