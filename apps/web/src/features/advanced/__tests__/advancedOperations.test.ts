import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  verifyPdfSignatures,
  signDocumentPkcs12,
  linearizePdf,
  repairPdf,
  sanitizePdf,
  compareTwoPdfs,
} from '../advancedClient';

describe('Phase 5: Advanced Features Suite (Signatures, Repair, Sanitize, Diff)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should verify digital signatures in a document', async () => {
    const mockVerification = {
      success: true,
      filename: 'contract.pdf',
      isSigned: true,
      signatureCount: 1,
      signatures: [
        {
          name: 'Signature_1',
          signer: 'Alice Auditor',
          reason: 'Certified',
          location: 'US',
          signingTime: '2026-10-21',
          hasByteRange: true,
          isValid: true,
          status: 'VALID',
          digestAlgorithm: 'SHA-256',
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockVerification,
    } as any);

    const pdfData = new Uint8Array([37, 80, 68, 70]);
    const res = await verifyPdfSignatures(pdfData, 'contract.pdf');

    expect(res.isSigned).toBe(true);
    expect(res.signatures[0].signer).toBe('Alice Auditor');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('should digitally sign PDF with PKCS#12 bundle', async () => {
    const mockSignedBytes = new Uint8Array([37, 80, 68, 70, 99, 101, 114, 116]);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => mockSignedBytes.buffer,
    } as any);

    const pdfData = new Uint8Array([37, 80, 68, 70]);
    const p12Data = new Uint8Array([48, 130]);
    const signed = await signDocumentPkcs12(pdfData, 'doc.pdf', p12Data, 'pass123');

    expect(signed.byteLength).toBe(mockSignedBytes.byteLength);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('should linearize PDF for fast web view streaming', async () => {
    const mockOptBytes = new Uint8Array([37, 80, 68, 70, 49, 46, 55]);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => mockOptBytes.buffer,
    } as any);

    const pdfData = new Uint8Array([37, 80, 68, 70]);
    const linearized = await linearizePdf(pdfData, 'big.pdf');

    expect(linearized.byteLength).toBe(mockOptBytes.byteLength);
  });

  it('should repair damaged PDF objects', async () => {
    const mockRepairedBytes = new Uint8Array([37, 80, 68, 70]);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => mockRepairedBytes.buffer,
    } as any);

    const pdfData = new Uint8Array([37, 80, 68, 70]);
    const repaired = await repairPdf(pdfData, 'broken.pdf');

    expect(repaired.byteLength).toBe(mockRepairedBytes.byteLength);
  });

  it('should deep sanitize document and return removed items', async () => {
    const mockCleanBytes = new Uint8Array([37, 80, 68, 70]);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'X-Items-Removed': 'JavaScript triggers,XMP metadata',
      }),
      arrayBuffer: async () => mockCleanBytes.buffer,
    } as any);

    const pdfData = new Uint8Array([37, 80, 68, 70]);
    const result = await sanitizePdf(pdfData, 'clean.pdf');

    expect(result.data.byteLength).toBe(mockCleanBytes.byteLength);
    expect(result.removedItems.length).toBe(2);
    expect(result.removedItems[0]).toBe('JavaScript triggers');
  });

  it('should compare two PDFs and return text diff structures', async () => {
    const mockDiff = {
      success: true,
      identical: false,
      pageCountA: 1,
      pageCountB: 1,
      pagesCompared: 1,
      pagesWithDifferences: 1,
      pageComparisons: [
        {
          pageNumber: 1,
          hasChanges: true,
          additionsCount: 1,
          deletionsCount: 0,
          diffLines: ['+Added text line'],
          textA: 'Original line',
          textB: 'Original line\nAdded text line',
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockDiff,
    } as any);

    const fileA = new Uint8Array([37, 80, 68, 70]);
    const fileB = new Uint8Array([37, 80, 68, 70]);
    const res = await compareTwoPdfs(fileA, 'v1.pdf', fileB, 'v2.pdf');

    expect(res.identical).toBe(false);
    expect(res.pagesWithDifferences).toBe(1);
    expect(res.pageComparisons[0].additionsCount).toBe(1);
  });
});
