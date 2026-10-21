import { PDFDocument } from 'pdf-lib';

export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  producer?: string;
  creator?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

/**
 * Extracts document metadata properties from a PDF.
 */
export async function extractMetadata(data: Uint8Array): Promise<PdfMetadata> {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });

  return {
    title: doc.getTitle() || '',
    author: doc.getAuthor() || '',
    subject: doc.getSubject() || '',
    keywords: doc.getKeywords()?.split(' ').filter(Boolean) || [],
    producer: doc.getProducer() || '',
    creator: doc.getCreator() || '',
    creationDate: doc.getCreationDate(),
    modificationDate: doc.getModificationDate(),
  };
}

/**
 * Updates document catalog metadata and optionally scrubs internal producer traces.
 */
export async function updateMetadata(
  data: Uint8Array,
  meta: PdfMetadata,
  stripProducer: boolean = false
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });

  if (meta.title !== undefined) doc.setTitle(meta.title);
  if (meta.author !== undefined) doc.setAuthor(meta.author);
  if (meta.subject !== undefined) doc.setSubject(meta.subject);
  if (meta.keywords !== undefined) doc.setKeywords(meta.keywords);

  if (stripProducer) {
    doc.setProducer('');
    doc.setCreator('');
  } else {
    if (meta.producer !== undefined) doc.setProducer(meta.producer);
    if (meta.creator !== undefined) doc.setCreator(meta.creator);
  }

  doc.setModificationDate(new Date());

  return await doc.save();
}
