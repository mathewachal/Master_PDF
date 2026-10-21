import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import {
  mergeDocuments,
  splitDocumentByRanges,
  splitEveryNPages,
  reorderPages,
  rotatePages,
  deletePages,
  extractPages,
  insertBlankPage,
  parsePageRanges,
} from '../pdfOperations';
import { compressPdf } from '../../optimize/compression';

async function createSamplePdf(pageCount: number = 3): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([300, 400]);
    page.drawText(`Page ${i + 1}`);
  }
  return await doc.save();
}

describe('PDF Page Operations', () => {
  it('should parse page range strings accurately', () => {
    expect(parsePageRanges('1-3, 5', 6)).toEqual([0, 1, 2, 4]);
    expect(parsePageRanges('2, 4, 6', 6)).toEqual([1, 3, 5]);
    expect(parsePageRanges('1-10', 4)).toEqual([0, 1, 2, 3]);
  });

  it('should merge multiple PDF documents', async () => {
    const pdf1 = await createSamplePdf(2);
    const pdf2 = await createSamplePdf(3);

    const merged = await mergeDocuments([
      { name: 'doc1.pdf', data: pdf1 },
      { name: 'doc2.pdf', data: pdf2 },
    ]);

    const resultDoc = await PDFDocument.load(merged);
    expect(resultDoc.getPageCount()).toBe(5);
  });

  it('should split document by page ranges', async () => {
    const pdf = await createSamplePdf(5);
    const splits = await splitDocumentByRanges(pdf, ['1-2', '3-5'], 'report.pdf');

    expect(splits).toHaveLength(2);
    expect(splits[0].filename).toBe('report_part_1.pdf');
    expect(splits[0].pageCount).toBe(2);

    expect(splits[1].filename).toBe('report_part_2.pdf');
    expect(splits[1].pageCount).toBe(3);
  });

  it('should split document every N pages', async () => {
    const pdf = await createSamplePdf(5);
    const chunks = await splitEveryNPages(pdf, 2, 'catalog.pdf');

    expect(chunks).toHaveLength(3); // 2, 2, 1
    expect(chunks[0].pageCount).toBe(2);
    expect(chunks[1].pageCount).toBe(2);
    expect(chunks[2].pageCount).toBe(1);
  });

  it('should reorder pages', async () => {
    const pdf = await createSamplePdf(3);
    const reordered = await reorderPages(pdf, [3, 1, 2]);

    const doc = await PDFDocument.load(reordered);
    expect(doc.getPageCount()).toBe(3);
  });

  it('should rotate specified pages', async () => {
    const pdf = await createSamplePdf(3);
    const rotated = await rotatePages(pdf, [2], 90);

    const doc = await PDFDocument.load(rotated);
    expect(doc.getPage(0).getRotation().angle).toBe(0);
    expect(doc.getPage(1).getRotation().angle).toBe(90);
    expect(doc.getPage(2).getRotation().angle).toBe(0);
  });

  it('should delete pages', async () => {
    const pdf = await createSamplePdf(4);
    const modified = await deletePages(pdf, [2, 4]);

    const doc = await PDFDocument.load(modified);
    expect(doc.getPageCount()).toBe(2);
  });

  it('should extract pages into a new document', async () => {
    const pdf = await createSamplePdf(5);
    const extracted = await extractPages(pdf, [1, 4]);

    const doc = await PDFDocument.load(extracted);
    expect(doc.getPageCount()).toBe(2);
  });

  it('should insert a blank page', async () => {
    const pdf = await createSamplePdf(2);
    const withBlank = await insertBlankPage(pdf, 2);

    const doc = await PDFDocument.load(withBlank);
    expect(doc.getPageCount()).toBe(3);
  });

  it('should optimize and compress PDF document', async () => {
    const pdf = await createSamplePdf(4);
    const compressed = await compressPdf(pdf);

    expect(compressed.data.byteLength).toBeGreaterThan(0);
    expect(compressed.newSize).toBeGreaterThan(0);
  });
});
