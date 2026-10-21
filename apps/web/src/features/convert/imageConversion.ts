import { PDFDocument } from 'pdf-lib';
import { loadPdfDocument } from '../../core/pdf/engine';

export interface ImageInput {
  data: Uint8Array;
  type: string;
  name: string;
}

export interface ExportedPageImage {
  pageNumber: number;
  dataUrl: string;
  blob: Blob;
}

/**
 * Converts one or more images (PNG, JPEG) into a unified PDF document.
 */
export async function imagesToPdf(images: ImageInput[]): Promise<Uint8Array> {
  if (images.length === 0) {
    throw new Error('At least one image is required to build a PDF');
  }

  const pdfDoc = await PDFDocument.create();

  for (const img of images) {
    let embeddedImg;
    const isPng = img.type.includes('png') || img.name.toLowerCase().endsWith('.png');

    if (isPng) {
      embeddedImg = await pdfDoc.embedPng(img.data);
    } else {
      embeddedImg = await pdfDoc.embedJpg(img.data);
    }

    const { width, height } = embeddedImg.scale(1.0);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  return await pdfDoc.save();
}

/**
 * Renders each page of a PDF document into image blobs (PNG / JPEG).
 */
export async function pdfToImages(
  data: Uint8Array,
  format: 'png' | 'jpeg' = 'png',
  scale: number = 2.0
): Promise<ExportedPageImage[]> {
  const { doc, numPages } = await loadPdfDocument(data);
  const results: ExportedPageImage[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context failed');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl = canvas.toDataURL(mime, 0.92);

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), mime, 0.92);
    });

    results.push({
      pageNumber: i,
      dataUrl,
      blob,
    });
  }

  return results;
}
