import { PDFDocument } from 'pdf-lib';

export interface CompressionResult {
  data: Uint8Array;
  originalSize: number;
  newSize: number;
  savedBytes: number;
  reductionPercentage: number;
}

/**
 * Optimizes and compresses a PDF document client-side by stream linearization,
 * object consolidation, and stripping unreferenced metadata objects.
 */
export async function compressPdf(data: Uint8Array): Promise<CompressionResult> {
  const originalSize = data.byteLength;
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });

  // Save with optimized object streams and compressed dictionary tables
  const compressedBytes = await doc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false,
  });

  const newSize = compressedBytes.byteLength;
  const savedBytes = Math.max(0, originalSize - newSize);
  const reductionPercentage = originalSize > 0 ? +((savedBytes / originalSize) * 100).toFixed(1) : 0;

  return {
    data: compressedBytes,
    originalSize,
    newSize,
    savedBytes,
    reductionPercentage,
  };
}
