import type { PDFDocumentProxy } from 'pdfjs-dist';

export interface OutlineItem {
  title: string;
  pageNumber?: number;
  dest?: any;
  items?: OutlineItem[];
}

/**
 * Extracts and parses hierarchical bookmark outline from a PDF document.
 */
export async function extractDocumentOutline(doc: PDFDocumentProxy): Promise<OutlineItem[]> {
  try {
    const rawOutline = await doc.getOutline();
    if (!rawOutline || rawOutline.length === 0) {
      return [];
    }

    const processItem = async (item: any): Promise<OutlineItem> => {
      let pageNumber: number | undefined;

      if (typeof item.dest === 'string') {
        const dest = await doc.getDestination(item.dest);
        if (dest && dest.length > 0) {
          const pageRef = dest[0];
          pageNumber = (await doc.getPageIndex(pageRef)) + 1;
        }
      } else if (Array.isArray(item.dest) && item.dest.length > 0) {
        const pageRef = item.dest[0];
        pageNumber = (await doc.getPageIndex(pageRef)) + 1;
      }

      const children: OutlineItem[] = [];
      if (item.items && item.items.length > 0) {
        for (const child of item.items) {
          children.push(await processItem(child));
        }
      }

      return {
        title: item.title,
        pageNumber,
        items: children.length > 0 ? children : undefined,
      };
    };

    const result: OutlineItem[] = [];
    for (const item of rawOutline) {
      result.push(await processItem(item));
    }

    return result;
  } catch (err) {
    console.warn('Failed to extract document outline:', err);
    return [];
  }
}
