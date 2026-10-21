import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { flattenAnnotationsToPdf } from '../flatten';
import {
  extractFormFields,
  fillFormFields,
  createNewFormField,
  flattenForm,
  exportFormDataAsJson,
  importFormDataFromJson,
} from '../../forms/formOperations';
import { embedSignatureToPdf } from '../../sign/signatureOperations';
import { DrawingAnnotation, ShapeAnnotation, StampAnnotation } from '../types';

async function createSamplePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([400, 600]);
  page.drawText('Sample PDF content for Phase 2 tests');
  return await doc.save();
}

// 1x1 transparent/black PNG base64 data URL
const SAMPLE_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('Phase 2: Annotate, Forms & Sign Suite', () => {
  describe('Annotation Flattening', () => {
    it('should flatten freehand, shape, and stamp annotations into PDF', async () => {
      const pdf = await createSamplePdf();

      const penAnn: DrawingAnnotation = {
        id: 'ann-1',
        pageNumber: 1,
        type: 'pen',
        points: [
          { x: 10, y: 10 },
          { x: 50, y: 50 },
        ],
        color: '#ef4444',
        strokeWidth: 2,
        opacity: 1.0,
        createdAt: Date.now(),
      };

      const rectAnn: ShapeAnnotation = {
        id: 'ann-2',
        pageNumber: 1,
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 150,
        height: 60,
        color: '#3b82f6',
        strokeWidth: 3,
        opacity: 0.8,
        createdAt: Date.now(),
      };

      const stampAnn: StampAnnotation = {
        id: 'ann-3',
        pageNumber: 1,
        type: 'stamp',
        x: 50,
        y: 200,
        width: 120,
        height: 40,
        stampType: 'APPROVED',
        color: '#10b981',
        opacity: 1.0,
        createdAt: Date.now(),
      };

      const flattened = await flattenAnnotationsToPdf(pdf, [penAnn, rectAnn, stampAnn]);
      expect(flattened.byteLength).toBeGreaterThan(pdf.byteLength);

      const doc = await PDFDocument.load(flattened);
      expect(doc.getPageCount()).toBe(1);
    });
  });

  describe('Interactive AcroForms', () => {
    it('should create new text, checkbox, and dropdown form fields', async () => {
      const pdf = await createSamplePdf();

      // Create text field
      const withText = await createNewFormField(pdf, {
        type: 'text',
        name: 'fullName',
        pageNumber: 1,
        x: 50,
        y: 50,
        width: 180,
        height: 25,
        defaultValue: 'Initial Name',
      });

      // Create checkbox
      const withCheckbox = await createNewFormField(withText, {
        type: 'checkbox',
        name: 'agreeTerms',
        pageNumber: 1,
        x: 50,
        y: 90,
        width: 20,
        height: 20,
        defaultValue: 'true',
      });

      // Create dropdown
      const withDropdown = await createNewFormField(withCheckbox, {
        type: 'dropdown',
        name: 'role',
        pageNumber: 1,
        x: 50,
        y: 130,
        width: 180,
        height: 25,
        options: ['Admin', 'Editor', 'Viewer'],
        defaultValue: 'Editor',
      });

      const fields = await extractFormFields(withDropdown);
      expect(fields.length).toBe(3);

      const fieldNames = fields.map((f) => f.name);
      expect(fieldNames).toContain('fullName');
      expect(fieldNames).toContain('agreeTerms');
      expect(fieldNames).toContain('role');
    });

    it('should fill form fields and export/import JSON values', async () => {
      const pdf = await createSamplePdf();
      const withField = await createNewFormField(pdf, {
        type: 'text',
        name: 'email',
        pageNumber: 1,
        x: 40,
        y: 40,
        width: 150,
        height: 20,
      });

      // Fill form field
      const filled = await fillFormFields(withField, { email: 'user@example.com' });
      const extracted = await extractFormFields(filled);
      const emailField = extracted.find((f) => f.name === 'email');
      expect(emailField?.value).toBe('user@example.com');

      // Export JSON
      const jsonStr = await exportFormDataAsJson(filled);
      expect(jsonStr).toContain('user@example.com');

      // Import JSON
      const imported = await importFormDataFromJson(withField, JSON.stringify({ email: 'new@test.com' }));
      const afterImport = await extractFormFields(imported);
      expect(afterImport.find((f) => f.name === 'email')?.value).toBe('new@test.com');
    });

    it('should flatten form fields', async () => {
      const pdf = await createSamplePdf();
      const withField = await createNewFormField(pdf, {
        type: 'text',
        name: 'company',
        pageNumber: 1,
        x: 20,
        y: 20,
        width: 100,
        height: 20,
        defaultValue: 'MasterPDF Inc',
      });

      const flattened = await flattenForm(withField);
      const remainingFields = await extractFormFields(flattened);
      expect(remainingFields.length).toBe(0);
    });
  });

  describe('E-Signatures', () => {
    it('should embed e-signature image onto PDF page', async () => {
      const pdf = await createSamplePdf();

      const signed = await embedSignatureToPdf(pdf, {
        pageNumber: 1,
        x: 80,
        y: 200,
        width: 120,
        height: 50,
        dataUrl: SAMPLE_PNG_DATA_URL,
        includeDateStamp: true,
        dateStampText: '2026-10-21',
      });

      expect(signed.byteLength).toBeGreaterThan(pdf.byteLength);
      const doc = await PDFDocument.load(signed);
      expect(doc.getPageCount()).toBe(1);
    });
  });
});
