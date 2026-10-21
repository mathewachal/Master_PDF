import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface TextBoxOptions {
  x: number;
  y: number;
  fontSize?: number;
  colorHex?: string;
  isBold?: boolean;
}

export interface InsertImageOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(clean.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(clean.substring(4, 6), 16) / 255 || 0;
  return { r, g, b };
}

/**
 * Inserts a custom text box onto a target PDF page.
 */
export async function addTextBoxToPage(
  data: Uint8Array,
  pageNumber: number,
  text: string,
  options: TextBoxOptions
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const total = doc.getPageCount();

  if (pageNumber < 1 || pageNumber > total) {
    throw new Error(`Invalid page number ${pageNumber}`);
  }

  const page = doc.getPage(pageNumber - 1);
  const { height: pageHeight } = page.getSize();
  const font = await doc.embedFont(
    options.isBold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica
  );
  const fontSize = options.fontSize || 14;
  const { r, g, b } = hexToRgb(options.colorHex || '#0f172a');

  // Convert top-left coordinates to PDF bottom-left coordinates
  const pdfY = pageHeight - options.y - fontSize;

  page.drawText(text, {
    x: options.x,
    y: pdfY,
    size: fontSize,
    font,
    color: rgb(r, g, b),
  });

  return await doc.save();
}

/**
 * Embeds and places an image onto a target PDF page.
 */
export async function insertImageOnPage(
  data: Uint8Array,
  pageNumber: number,
  imgBytes: Uint8Array,
  isPng: boolean,
  options: InsertImageOptions
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const total = doc.getPageCount();

  if (pageNumber < 1 || pageNumber > total) {
    throw new Error(`Invalid page number ${pageNumber}`);
  }

  const page = doc.getPage(pageNumber - 1);
  const { height: pageHeight } = page.getSize();

  const embeddedImg = isPng ? await doc.embedPng(imgBytes) : await doc.embedJpg(imgBytes);
  const pdfY = pageHeight - options.y - options.height;

  page.drawImage(embeddedImg, {
    x: options.x,
    y: pdfY,
    width: options.width,
    height: options.height,
  });

  return await doc.save();
}
