import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PlacedSignature } from './types';

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Embeds an e-signature onto a specific PDF page at given coordinates.
 */
export async function embedSignatureToPdf(
  data: Uint8Array,
  placement: PlacedSignature
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const numPages = doc.getPageCount();

  if (placement.pageNumber < 1 || placement.pageNumber > numPages) {
    throw new Error(`Invalid page number ${placement.pageNumber}`);
  }

  const page = doc.getPage(placement.pageNumber - 1);
  const { height: pageHeight } = page.getSize();

  // Convert PNG base64 to byte array and embed
  const imgBytes = dataUrlToBytes(placement.dataUrl);
  const embeddedImg = await doc.embedPng(imgBytes);

  // Convert top-left coordinates to PDF bottom-left coordinates
  const pdfY = pageHeight - placement.y - placement.height;

  page.drawImage(embeddedImg, {
    x: placement.x,
    y: pdfY,
    width: placement.width,
    height: placement.height,
  });

  // Optional date stamp burn-in
  if (placement.includeDateStamp) {
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const dateText = placement.dateStampText || new Date().toISOString().split('T')[0];
    page.drawText(`Signed: ${dateText}`, {
      x: placement.x,
      y: Math.max(5, pdfY - 12),
      size: 9,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  }

  return await doc.save();
}
