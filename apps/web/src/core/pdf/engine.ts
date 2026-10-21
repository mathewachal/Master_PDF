import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure Web Worker for pdfjs-dist in browser environments
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
}

export interface LoadedPdfDoc {
  doc: pdfjsLib.PDFDocumentProxy;
  numPages: number;
  fingerprint: string;
}

/**
 * Loads a PDF document from raw byte data using pdfjs-dist.
 */
export async function loadPdfDocument(
  data: Uint8Array,
  password?: string
): Promise<LoadedPdfDoc> {
  // Pass a copy of the buffer to avoid DetachedArrayBuffer issues with Web Workers
  const bufferCopy = data.slice().buffer;

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(bufferCopy),
    password,
    cMapUrl: 'https://unpkg.com/pdfjs-dist@4.0.379/cmaps/',
    cMapPacked: true,
  });

  const doc = await loadingTask.promise;
  return {
    doc,
    numPages: doc.numPages,
    fingerprint: (doc.fingerprints && doc.fingerprints[0]) || '',
  };
}

export { pdfjsLib };
