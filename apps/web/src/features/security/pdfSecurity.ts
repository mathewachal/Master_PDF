import { getPlatform } from '../../platform';
import { loadPdfDocument } from '../../core/pdf/engine';

export interface ProtectOptions {
  userPassword?: string;
  ownerPassword?: string;
  allowPrinting?: boolean;
  allowModifications?: boolean;
}

/**
 * Checks whether a PDF requires a password to open.
 */
export async function isPdfEncrypted(data: Uint8Array): Promise<boolean> {
  try {
    await loadPdfDocument(data);
    return false;
  } catch (err: any) {
    if (err && (err.name === 'PasswordException' || err.message?.includes('password'))) {
      return true;
    }
    return false;
  }
}

/**
 * Encrypts a PDF with AES-256 using the backend security service.
 */
export async function protectPdfOnline(
  data: Uint8Array,
  filename: string,
  options: ProtectOptions
): Promise<Uint8Array> {
  const platform = getPlatform();
  const baseUrl = platform.network.getApiBaseUrl();

  const formData = new FormData();
  formData.append('file', new Blob([data.buffer as ArrayBuffer], { type: 'application/pdf' }), filename);
  if (options.userPassword) formData.append('user_password', options.userPassword);
  if (options.ownerPassword) formData.append('owner_password', options.ownerPassword);
  formData.append('allow_printing', String(options.allowPrinting ?? true));
  formData.append('allow_modifications', String(options.allowModifications ?? false));

  const response = await fetch(`${baseUrl}/api/v1/security/protect`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to protect PDF: ${errorText || response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Decrypts a password-protected PDF using the valid password.
 */
export async function unlockPdfOnline(
  data: Uint8Array,
  filename: string,
  password: string
): Promise<Uint8Array> {
  const platform = getPlatform();
  const baseUrl = platform.network.getApiBaseUrl();

  const formData = new FormData();
  formData.append('file', new Blob([data.buffer as ArrayBuffer], { type: 'application/pdf' }), filename);
  formData.append('password', password);

  const response = await fetch(`${baseUrl}/api/v1/security/unlock`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Incorrect password provided.');
    }
    const errorText = await response.text();
    throw new Error(`Failed to unlock PDF: ${errorText || response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
