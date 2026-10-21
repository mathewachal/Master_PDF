import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import {
  applyWatermark,
  applyPageNumbers,
  applyBatesNumbering,
  applyBackgroundColor,
} from '../pageDecorations';
import { extractMetadata, updateMetadata } from '../metadataOperations';
import { addTextBoxToPage } from '../contentOperations';

async function createSamplePdf(pageCount: number = 3): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([400, 600]);
    page.drawText(`Page content ${i + 1}`);
  }
  return await doc.save();
}

describe('Phase 3: Content Edit & Page Decoration Suite', () => {
  it('should apply text watermarks across document pages', async () => {
    const pdf = await createSamplePdf(2);
    const withWatermark = await applyWatermark(pdf, {
      text: 'CONFIDENTIAL',
      fontSize: 36,
      opacity: 0.3,
      rotation: 45,
    });

    expect(withWatermark.byteLength).toBeGreaterThan(pdf.byteLength);
    const doc = await PDFDocument.load(withWatermark);
    expect(doc.getPageCount()).toBe(2);
  });

  it('should apply tiled watermarks', async () => {
    const pdf = await createSamplePdf(1);
    const withTiled = await applyWatermark(pdf, {
      text: 'DRAFT',
      tiled: true,
      fontSize: 24,
      opacity: 0.2,
    });

    expect(withTiled.byteLength).toBeGreaterThan(pdf.byteLength);
  });

  it('should apply page numbers with custom formats', async () => {
    const pdf = await createSamplePdf(4);
    const withNumbers = await applyPageNumbers(pdf, {
      format: 'Page {n} of {total}',
      position: 'bottom-center',
      fontSize: 10,
    });

    expect(withNumbers.byteLength).toBeGreaterThan(pdf.byteLength);
    const doc = await PDFDocument.load(withNumbers);
    expect(doc.getPageCount()).toBe(4);
  });

  it('should apply legal Bates numbering with zero padding', async () => {
    const pdf = await createSamplePdf(3);
    const withBates = await applyBatesNumbering(pdf, {
      prefix: 'LEGAL-',
      numDigits: 6,
      startNumber: 1,
      position: 'bottom-right',
    });

    expect(withBates.byteLength).toBeGreaterThan(pdf.byteLength);
    const doc = await PDFDocument.load(withBates);
    expect(doc.getPageCount()).toBe(3);
  });

  it('should apply background tint color', async () => {
    const pdf = await createSamplePdf(2);
    const withBg = await applyBackgroundColor(pdf, '#fef3c7');

    expect(withBg.byteLength).toBeGreaterThan(pdf.byteLength);
  });

  it('should read and update PDF document metadata', async () => {
    const pdf = await createSamplePdf(1);

    const updated = await updateMetadata(
      pdf,
      {
        title: 'Q3 Financial Report',
        author: 'Jane Doe',
        subject: 'Corporate Audit',
        keywords: ['finance', 'audit', '2026'],
      },
      true
    );

    const meta = await extractMetadata(updated);
    expect(meta.title).toBe('Q3 Financial Report');
    expect(meta.author).toBe('Jane Doe');
    expect(meta.subject).toBe('Corporate Audit');
    expect(meta.keywords).toContain('finance');
  });

  it('should add custom text boxes to pages', async () => {
    const pdf = await createSamplePdf(2);
    const withText = await addTextBoxToPage(pdf, 1, 'Notice: Revision 2.0', {
      x: 50,
      y: 100,
      fontSize: 14,
      colorHex: '#dc2626',
      isBold: true,
    });

    expect(withText.byteLength).toBeGreaterThan(pdf.byteLength);
    const doc = await PDFDocument.load(withText);
    expect(doc.getPageCount()).toBe(2);
  });
});
