/**
 * API client for advanced PDF operations: digital signatures, repair, sanitization, linearization, and diffing.
 */

const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface SignatureInfo {
  name: string;
  signer: string;
  reason: string;
  location: string;
  signingTime: string;
  hasByteRange: boolean;
  isValid: boolean;
  status: string;
  digestAlgorithm: string;
}

export interface VerificationResult {
  success: boolean;
  filename: string;
  isSigned: boolean;
  signatureCount: number;
  signatures: SignatureInfo[];
}

export interface DiffComparisonResult {
  success: boolean;
  identical: boolean;
  pageCountA: number;
  pageCountB: number;
  pagesCompared: number;
  pagesWithDifferences: number;
  pageComparisons: Array<{
    pageNumber: number;
    hasChanges: boolean;
    additionsCount: number;
    deletionsCount: number;
    diffLines: string[];
    textA: string;
    textB: string;
  }>;
}

/**
 * Verify digital signatures present in the PDF.
 */
export async function verifyPdfSignatures(
  pdfBytes: Uint8Array,
  filename: string
): Promise<VerificationResult> {
  const formData = new FormData();
  formData.append(
    'file',
    new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' }),
    filename
  );

  const response = await fetch(`${API_BASE_URL}/advanced/verify-signatures`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Verification failed' }));
    throw new Error(errorData.detail || 'Failed to verify signatures');
  }

  return response.json();
}

/**
 * Digitally sign a PDF using a PKCS#12 (.p12/.pfx) certificate.
 */
export async function signDocumentPkcs12(
  pdfBytes: Uint8Array,
  filename: string,
  p12Bytes: Uint8Array,
  password: string,
  reason: string = 'Approved and certified with Master_PDF',
  location: string = 'Secure Workstation'
): Promise<Uint8Array> {
  const formData = new FormData();
  formData.append(
    'file',
    new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' }),
    filename
  );
  formData.append(
    'p12_file',
    new Blob([p12Bytes as unknown as BlobPart], { type: 'application/x-pkcs12' }),
    'certificate.pfx'
  );
  formData.append('password', password);
  formData.append('reason', reason);
  formData.append('location', location);

  const response = await fetch(`${API_BASE_URL}/advanced/sign-pkcs12`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Digital signing failed' }));
    throw new Error(errorData.detail || 'Digital signing failed');
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Generate a demo self-signed PKCS#12 certificate for testing.
 */
export async function generateDemoCertificate(
  commonName: string,
  password: string
): Promise<Uint8Array> {
  const formData = new FormData();
  formData.append('common_name', commonName);
  formData.append('password', password);

  const response = await fetch(`${API_BASE_URL}/advanced/generate-test-cert`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to generate test certificate');
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Linearize PDF for Fast Web View.
 */
export async function linearizePdf(
  pdfBytes: Uint8Array,
  filename: string
): Promise<Uint8Array> {
  const formData = new FormData();
  formData.append(
    'file',
    new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' }),
    filename
  );

  const response = await fetch(`${API_BASE_URL}/advanced/linearize`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Linearization failed' }));
    throw new Error(errorData.detail || 'Linearization failed');
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Repair a damaged or corrupted PDF.
 */
export async function repairPdf(
  pdfBytes: Uint8Array,
  filename: string
): Promise<Uint8Array> {
  const formData = new FormData();
  formData.append(
    'file',
    new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' }),
    filename
  );

  const response = await fetch(`${API_BASE_URL}/advanced/repair`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Repair failed' }));
    throw new Error(errorData.detail || 'Repair failed');
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Deep sanitize document (strip hidden scripts, metadata, attachments).
 */
export async function sanitizePdf(
  pdfBytes: Uint8Array,
  filename: string
): Promise<{ data: Uint8Array; removedItems: string[] }> {
  const formData = new FormData();
  formData.append(
    'file',
    new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' }),
    filename
  );

  const response = await fetch(`${API_BASE_URL}/advanced/sanitize`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Sanitization failed' }));
    throw new Error(errorData.detail || 'Sanitization failed');
  }

  const removedHeader = response.headers.get('X-Items-Removed') || '';
  const removedItems = removedHeader ? removedHeader.split(',') : [];

  const arrayBuffer = await response.arrayBuffer();
  return {
    data: new Uint8Array(arrayBuffer),
    removedItems,
  };
}

/**
 * Compare two PDF files and return text differences.
 */
export async function compareTwoPdfs(
  fileABytes: Uint8Array,
  nameA: string,
  fileBBytes: Uint8Array,
  nameB: string
): Promise<DiffComparisonResult> {
  const formData = new FormData();
  formData.append(
    'file_a',
    new Blob([fileABytes as unknown as BlobPart], { type: 'application/pdf' }),
    nameA
  );
  formData.append(
    'file_b',
    new Blob([fileBBytes as unknown as BlobPart], { type: 'application/pdf' }),
    nameB
  );

  const response = await fetch(`${API_BASE_URL}/advanced/compare`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Comparison failed' }));
    throw new Error(errorData.detail || 'Comparison failed');
  }

  return response.json();
}
