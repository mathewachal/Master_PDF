import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  convertPdfToFormat,
  convertFileToPdf,
  extractPdfTables,
  getOcrLanguages,
  performOcr,
} from '../convertClient';

describe('Phase 4: Convert, Tables & OCR Client Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should request format conversion to docx via API', async () => {
    const mockBlob = new Blob(['mock docx binary'], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => mockBlob,
      headers: new Headers({
        'Content-Disposition': 'attachment; filename="contract.docx"',
      }),
    } as any);

    const pdfData = new Uint8Array([37, 80, 68, 70]); // %PDF
    const result = await convertPdfToFormat(pdfData, 'contract.pdf', 'docx');

    expect(result.downloadFilename).toBe('contract.docx');
    expect(result.blob).toBeDefined();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('should convert text files to PDF', async () => {
    const mockPdfBytes = new Uint8Array([37, 80, 68, 70, 49, 46, 52]); // %PDF1.4

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => mockPdfBytes.buffer,
    } as any);

    const txtBytes = new TextEncoder().encode('Hello World');
    const resultPdf = await convertFileToPdf(txtBytes, 'notes.txt', 'My Notes');

    expect(resultPdf.byteLength).toBe(mockPdfBytes.byteLength);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('should extract structured tables from PDF', async () => {
    const mockTables = {
      success: true,
      filename: 'financials.pdf',
      tablesFound: 1,
      tables: [
        {
          page: 1,
          tableIndex: 1,
          bbox: [50, 100, 300, 200],
          rowCount: 3,
          colCount: 2,
          headers: ['Item', 'Cost'],
          rows: [
            ['Hosting', '$100'],
            ['Domain', '$15'],
          ],
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockTables,
    } as any);

    const pdfData = new Uint8Array([37, 80, 68, 70]);
    const res = await extractPdfTables(pdfData, 'financials.pdf');

    expect(res.tablesFound).toBe(1);
    expect(res.tables[0].headers).toEqual(['Item', 'Cost']);
    expect(res.tables[0].rows.length).toBe(2);
  });

  it('should fetch supported OCR languages', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        languages: [
          { code: 'eng', name: 'English' },
          { code: 'spa', name: 'Spanish' },
        ],
      }),
    } as any);

    const langs = await getOcrLanguages();
    expect(langs.length).toBe(2);
    expect(langs[0].code).toBe('eng');
  });

  it('should run OCR and return searchable PDF', async () => {
    const mockPdfBytes = new Uint8Array([37, 80, 68, 70, 45, 111, 99, 114]);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => mockPdfBytes.buffer,
      headers: new Headers({
        'X-Pages-Processed': '2',
      }),
    } as any);

    const pdfData = new Uint8Array([37, 80, 68, 70]);
    const res = await performOcr(pdfData, 'scan.pdf', {
      language: 'eng',
      outputFormat: 'searchable_pdf',
      deskew: true,
    });

    expect(res.isPdf).toBe(true);
    expect(res.downloadFilename).toBe('scan_ocr.pdf');
    expect(res.pagesProcessed).toBe(2);
  });
});
