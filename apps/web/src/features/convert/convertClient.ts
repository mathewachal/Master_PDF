/**
 * Frontend client for PDF conversion, table extraction, and OCR services.
 */

const API_BASE_URL = 'http://localhost:8000/api/v1';

export type TargetConvertFormat =
  | 'docx'
  | 'xlsx'
  | 'csv'
  | 'markdown'
  | 'txt'
  | 'html'
  | 'pdfa';

export interface OcrLanguage {
  code: string;
  name: string;
}

export interface TableExtractionResult {
  success: boolean;
  filename: string;
  tablesFound: number;
  tables: Array<{
    page: number;
    tableIndex: number;
    bbox: number[];
    rowCount: number;
    colCount: number;
    headers: string[];
    rows: string[][];
  }>;
}

/**
 * Convert a PDF into another document format (DOCX, XLSX, CSV, MD, TXT, HTML, PDF/A).
 */
export async function convertPdfToFormat(
  pdfBytes: Uint8Array,
  filename: string,
  targetFormat: TargetConvertFormat
): Promise<{ blob: Blob; downloadFilename: string }> {
  const formData = new FormData();
  formData.append(
    'file',
    new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' }),
    filename
  );
  formData.append('target_format', targetFormat);

  const response = await fetch(`${API_BASE_URL}/convert/pdf-to-format`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Conversion failed' }));
    throw new Error(errorData.detail || `Conversion to ${targetFormat} failed with HTTP ${response.status}`);
  }

  const blob = await response.blob();
  const contentDisp = response.headers.get('Content-Disposition') || '';
  const match = contentDisp.match(/filename="?([^"]+)"?/);
  const baseName = filename.replace(/\.[^/.]+$/, '');
  const extMap: Record<TargetConvertFormat, string> = {
    docx: 'docx',
    xlsx: 'xlsx',
    csv: 'csv',
    markdown: 'md',
    txt: 'txt',
    html: 'html',
    pdfa: 'pdf',
  };
  const downloadFilename = match ? match[1] : `${baseName}.${extMap[targetFormat] || 'bin'}`;

  return { blob, downloadFilename };
}

/**
 * Convert a text, Markdown, or HTML file to a clean PDF document.
 */
export async function convertFileToPdf(
  fileBytes: Uint8Array,
  filename: string,
  title?: string
): Promise<Uint8Array> {
  const formData = new FormData();
  formData.append('file', new Blob([fileBytes as unknown as BlobPart]), filename);
  if (title) formData.append('title', title);

  const response = await fetch(`${API_BASE_URL}/convert/to-pdf`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to convert file to PDF' }));
    throw new Error(errorData.detail || `PDF conversion failed with HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Extract structured tables from the PDF.
 */
export async function extractPdfTables(
  pdfBytes: Uint8Array,
  filename: string,
  pageNumber?: number
): Promise<TableExtractionResult> {
  const formData = new FormData();
  formData.append(
    'file',
    new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' }),
    filename
  );
  if (pageNumber !== undefined) {
    formData.append('page_number', pageNumber.toString());
  }
  formData.append('output_format', 'json');

  const response = await fetch(`${API_BASE_URL}/convert/extract-tables`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Table extraction failed' }));
    throw new Error(errorData.detail || 'Table extraction failed');
  }

  return response.json();
}

/**
 * Fetch supported OCR language list.
 */
export async function getOcrLanguages(): Promise<OcrLanguage[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/ocr/languages`);
    if (!response.ok) return [{ code: 'eng', name: 'English' }];
    const data = await response.json();
    return data.languages || [{ code: 'eng', name: 'English' }];
  } catch {
    return [{ code: 'eng', name: 'English' }];
  }
}

/**
 * Perform OCR on a PDF and return the resulting searchable PDF, Markdown, or text.
 */
export async function performOcr(
  pdfBytes: Uint8Array,
  filename: string,
  options: {
    language: string;
    outputFormat: 'searchable_pdf' | 'txt' | 'markdown';
    deskew: boolean;
    pages?: string;
  }
): Promise<{ data: Uint8Array; downloadFilename: string; isPdf: boolean; pagesProcessed: number }> {
  const formData = new FormData();
  formData.append(
    'file',
    new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' }),
    filename
  );
  formData.append('language', options.language);
  formData.append('output_format', options.outputFormat);
  formData.append('deskew', options.deskew ? 'true' : 'false');
  if (options.pages) {
    formData.append('pages', options.pages);
  }

  const response = await fetch(`${API_BASE_URL}/ocr/recognize`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'OCR failed' }));
    throw new Error(errorData.detail || `OCR execution failed with HTTP ${response.status}`);
  }

  const baseName = filename.replace(/\.[^/.]+$/, '');
  const pagesProcessed = parseInt(response.headers.get('X-Pages-Processed') || '1', 10);
  const ext = options.outputFormat === 'searchable_pdf' ? 'pdf' : options.outputFormat === 'markdown' ? 'md' : 'txt';
  const downloadFilename = `${baseName}_ocr.${ext}`;

  const arrayBuffer = await response.arrayBuffer();
  return {
    data: new Uint8Array(arrayBuffer),
    downloadFilename,
    isPdf: options.outputFormat === 'searchable_pdf',
    pagesProcessed,
  };
}
