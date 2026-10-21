import {
  PDFDocument,
  rgb,
  degrees,
  StandardFonts,
} from 'pdf-lib';
import { parsePageRanges } from '../organize/pdfOperations';

export interface WatermarkOptions {
  text?: string;
  imageBytes?: Uint8Array;
  isPng?: boolean;
  fontSize?: number;
  rotation?: number; // degrees, e.g. 45
  opacity?: number; // 0.0 to 1.0
  colorHex?: string;
  tiled?: boolean; // Repeat across page in a grid
  pageRange?: string; // e.g. "1-5", default all
}

export type PageNumberPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface PageNumberOptions {
  format?: string; // e.g. "Page {n} of {total}" or "{n}"
  position?: PageNumberPosition;
  fontSize?: number;
  colorHex?: string;
  startNumber?: number;
  margin?: number;
  pageRange?: string;
}

export interface BatesOptions {
  prefix?: string;
  suffix?: string;
  startNumber?: number;
  numDigits?: number; // e.g. 6 -> "000001"
  position?: PageNumberPosition;
  fontSize?: number;
  colorHex?: string;
  margin?: number;
  pageRange?: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(clean.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(clean.substring(4, 6), 16) / 255 || 0;
  return { r, g, b };
}

/**
 * Applies a text or image watermark across selected document pages.
 */
export async function applyWatermark(
  data: Uint8Array,
  options: WatermarkOptions
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const totalPages = doc.getPageCount();
  const targetIndices = options.pageRange
    ? parsePageRanges(options.pageRange, totalPages)
    : doc.getPageIndices();

  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const opacity = options.opacity ?? 0.25;
  const rotation = degrees(options.rotation ?? 45);
  const { r, g, b } = hexToRgb(options.colorHex || '#94a3b8');
  const color = rgb(r, g, b);
  const fontSize = options.fontSize || 48;

  let embeddedImage;
  if (options.imageBytes) {
    embeddedImage = options.isPng
      ? await doc.embedPng(options.imageBytes)
      : await doc.embedJpg(options.imageBytes);
  }

  for (const idx of targetIndices) {
    const page = doc.getPage(idx);
    const { width, height } = page.getSize();

    if (embeddedImage) {
      const imgWidth = 200;
      const imgHeight = (imgWidth / embeddedImage.width) * embeddedImage.height;
      page.drawImage(embeddedImage, {
        x: (width - imgWidth) / 2,
        y: (height - imgHeight) / 2,
        width: imgWidth,
        height: imgHeight,
        opacity,
        rotate: rotation,
      });
    } else if (options.text) {
      const text = options.text;
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      if (options.tiled) {
        // Tiled grid pattern across page
        const stepX = textWidth + 120;
        const stepY = textHeight + 120;

        for (let x = 30; x < width; x += stepX) {
          for (let y = 30; y < height; y += stepY) {
            page.drawText(text, {
              x,
              y,
              size: fontSize,
              font,
              color,
              opacity,
              rotate: rotation,
            });
          }
        }
      } else {
        // Single centered watermark
        page.drawText(text, {
          x: (width - textWidth) / 2,
          y: (height - textHeight) / 2,
          size: fontSize,
          font,
          color,
          opacity,
          rotate: rotation,
        });
      }
    }
  }

  return await doc.save();
}

/**
 * Calculates (x, y) coordinates for page numbers or bates stamps given page dimensions and text width.
 */
function calculatePosition(
  pos: PageNumberPosition,
  pageWidth: number,
  pageHeight: number,
  textWidth: number,
  fontSize: number,
  margin: number
): { x: number; y: number } {
  let x = margin;
  let y = margin;

  if (pos.includes('left')) {
    x = margin;
  } else if (pos.includes('center')) {
    x = (pageWidth - textWidth) / 2;
  } else if (pos.includes('right')) {
    x = pageWidth - textWidth - margin;
  }

  if (pos.startsWith('top')) {
    y = pageHeight - margin - fontSize;
  } else {
    y = margin;
  }

  return { x, y };
}

/**
 * Adds page numbering across pages using customizable formats and positions.
 */
export async function applyPageNumbers(
  data: Uint8Array,
  options: PageNumberOptions = {}
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const totalPages = doc.getPageCount();
  const targetIndices = options.pageRange
    ? parsePageRanges(options.pageRange, totalPages)
    : doc.getPageIndices();

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontSize = options.fontSize || 10;
  const position = options.position || 'bottom-center';
  const margin = options.margin || 30;
  const format = options.format || 'Page {n} of {total}';
  const startNum = options.startNumber || 1;
  const { r, g, b } = hexToRgb(options.colorHex || '#475569');
  const color = rgb(r, g, b);

  targetIndices.forEach((idx, counter) => {
    const page = doc.getPage(idx);
    const { width, height } = page.getSize();
    const currentNum = startNum + counter;

    const label = format
      .replace('{n}', String(currentNum))
      .replace('{total}', String(totalPages));

    const textWidth = font.widthOfTextAtSize(label, fontSize);
    const { x, y } = calculatePosition(position, width, height, textWidth, fontSize, margin);

    page.drawText(label, {
      x,
      y,
      size: fontSize,
      font,
      color,
    });
  });

  return await doc.save();
}

/**
 * Adds legal Bates numbering with zero padding and custom prefixes.
 */
export async function applyBatesNumbering(
  data: Uint8Array,
  options: BatesOptions = {}
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const totalPages = doc.getPageCount();
  const targetIndices = options.pageRange
    ? parsePageRanges(options.pageRange, totalPages)
    : doc.getPageIndices();

  const font = await doc.embedFont(StandardFonts.CourierBold);
  const fontSize = options.fontSize || 10;
  const position = options.position || 'bottom-right';
  const margin = options.margin || 25;
  const prefix = options.prefix || 'CONF-';
  const suffix = options.suffix || '';
  const numDigits = options.numDigits || 6;
  const startNum = options.startNumber || 1;
  const { r, g, b } = hexToRgb(options.colorHex || '#0f172a');
  const color = rgb(r, g, b);

  targetIndices.forEach((idx, counter) => {
    const page = doc.getPage(idx);
    const { width, height } = page.getSize();
    const currentNum = startNum + counter;
    const padded = String(currentNum).padStart(numDigits, '0');
    const label = `${prefix}${padded}${suffix}`;

    const textWidth = font.widthOfTextAtSize(label, fontSize);
    const { x, y } = calculatePosition(position, width, height, textWidth, fontSize, margin);

    page.drawText(label, {
      x,
      y,
      size: fontSize,
      font,
      color,
    });
  });

  return await doc.save();
}

/**
 * Applies a solid background fill color to pages.
 */
export async function applyBackgroundColor(
  data: Uint8Array,
  colorHex: string,
  pageRange?: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const totalPages = doc.getPageCount();
  const targetIndices = pageRange
    ? parsePageRanges(pageRange, totalPages)
    : doc.getPageIndices();

  const { r, g, b } = hexToRgb(colorHex);
  const color = rgb(r, g, b);

  for (const idx of targetIndices) {
    const page = doc.getPage(idx);
    const { width, height } = page.getSize();
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color,
      opacity: 0.15,
    });
  }

  return await doc.save();
}
