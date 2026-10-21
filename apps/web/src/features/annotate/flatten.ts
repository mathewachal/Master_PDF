import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Annotation } from './types';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16) / 255;
    const g = parseInt(cleanHex[1] + cleanHex[1], 16) / 255;
    const b = parseInt(cleanHex[2] + cleanHex[2], 16) / 255;
    return { r, g, b };
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255 || 0;
  return { r, g, b };
}

/**
 * Permanently flattens interactive vector annotations directly into the PDF byte streams.
 */
export async function flattenAnnotationsToPdf(
  data: Uint8Array,
  annotations: Annotation[]
): Promise<Uint8Array> {
  if (annotations.length === 0) return data;

  const doc = await PDFDocument.load(data);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const numPages = doc.getPageCount();

  for (const ann of annotations) {
    if (ann.pageNumber < 1 || ann.pageNumber > numPages) continue;
    const page = doc.getPage(ann.pageNumber - 1);
    const { height: pageHeight } = page.getSize();
    const { r, g, b } = hexToRgb(ann.color);
    const color = rgb(r, g, b);

    if (ann.type === 'pen' || ann.type === 'highlight') {
      const isHighlighter = ann.type === 'highlight';
      for (let i = 0; i < ann.points.length - 1; i++) {
        const p1 = ann.points[i];
        const p2 = ann.points[i + 1];

        page.drawLine({
          start: { x: p1.x, y: pageHeight - p1.y },
          end: { x: p2.x, y: pageHeight - p2.y },
          thickness: ann.strokeWidth,
          color: isHighlighter ? rgb(0.98, 0.8, 0.08) : color,
          opacity: ann.opacity,
        });
      }
    } else if (ann.type === 'rectangle') {
      page.drawRectangle({
        x: ann.x,
        y: pageHeight - ann.y - ann.height,
        width: ann.width,
        height: ann.height,
        borderColor: color,
        borderWidth: ann.strokeWidth,
        opacity: ann.opacity,
      });
    } else if (ann.type === 'circle') {
      page.drawEllipse({
        x: ann.x + ann.width / 2,
        y: pageHeight - (ann.y + ann.height / 2),
        xScale: ann.width / 2,
        yScale: ann.height / 2,
        borderColor: color,
        borderWidth: ann.strokeWidth,
        opacity: ann.opacity,
      });
    } else if (ann.type === 'line' || ann.type === 'arrow') {
      page.drawLine({
        start: { x: ann.x, y: pageHeight - ann.y },
        end: { x: ann.x + ann.width, y: pageHeight - (ann.y + ann.height) },
        thickness: ann.strokeWidth,
        color,
        opacity: ann.opacity,
      });
    } else if (ann.type === 'stamp') {
      // Draw stamp border
      page.drawRectangle({
        x: ann.x,
        y: pageHeight - ann.y - ann.height,
        width: ann.width,
        height: ann.height,
        borderColor: color,
        borderWidth: 2,
        opacity: ann.opacity,
      });

      // Draw stamp text
      page.drawText(ann.stampType, {
        x: ann.x + 12,
        y: pageHeight - ann.y - ann.height + 14,
        size: 14,
        font,
        color,
        opacity: ann.opacity,
      });
    } else if (ann.type === 'note') {
      // Draw note icon placeholder
      page.drawCircle({
        x: ann.x,
        y: pageHeight - ann.y,
        size: 10,
        color: rgb(0.98, 0.75, 0.14),
      });
    }
  }

  return await doc.save();
}
