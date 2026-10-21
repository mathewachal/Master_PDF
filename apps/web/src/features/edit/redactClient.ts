import { getPlatform } from '../../platform';

export interface RedactOnlineResult {
  data: Uint8Array;
  redactionsApplied: number;
  auditVerified: boolean;
}

export interface VerifyResult {
  verifiedAbsent: boolean;
  occurrencesCount: number;
  occurrences: { page: number; match: string }[];
}

/**
 * Sends a PDF to the PyMuPDF backend for certified, permanent redaction of text/images
 * matching a preset or custom regex pattern.
 */
export async function searchAndRedactOnline(
  data: Uint8Array,
  filename: string,
  options: {
    preset?: string;
    customPattern?: string;
    caseSensitive?: boolean;
    sanitizeMetadata?: boolean;
  }
): Promise<RedactOnlineResult> {
  const platform = getPlatform();
  const baseUrl = platform.network.getApiBaseUrl();

  const formData = new FormData();
  formData.append('file', new Blob([data.buffer as ArrayBuffer], { type: 'application/pdf' }), filename);
  if (options.preset) formData.append('preset', options.preset);
  if (options.customPattern) formData.append('custom_pattern', options.customPattern);
  formData.append('case_sensitive', String(options.caseSensitive ?? false));
  formData.append('sanitize_metadata', String(options.sanitizeMetadata ?? true));

  const response = await fetch(`${baseUrl}/api/v1/redact/search-and-redact`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Redaction failed: ${errorText || response.statusText}`);
  }

  const redactionsApplied = parseInt(response.headers.get('X-Redactions-Applied') || '0', 10);
  const auditVerified = response.headers.get('X-Audit-Verified') === 'true';

  const buffer = await response.arrayBuffer();
  return {
    data: new Uint8Array(buffer),
    redactionsApplied,
    auditVerified,
  };
}

/**
 * Audits a PDF via the backend to verify that a pattern is 100% absent.
 */
export async function verifyAbsenceOnline(
  data: Uint8Array,
  filename: string,
  pattern: string
): Promise<VerifyResult> {
  const platform = getPlatform();
  const baseUrl = platform.network.getApiBaseUrl();

  const formData = new FormData();
  formData.append('file', new Blob([data.buffer as ArrayBuffer], { type: 'application/pdf' }), filename);
  formData.append('pattern', pattern);

  const response = await fetch(`${baseUrl}/api/v1/redact/verify`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Verification failed: ${errorText || response.statusText}`);
  }

  const result = await response.json();
  return {
    verifiedAbsent: result.verified_absent,
    occurrencesCount: result.occurrences_count,
    occurrences: result.occurrences,
  };
}
