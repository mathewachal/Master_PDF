import {
  PDFDocument,
  PDFTextField,
  PDFCheckBox,
  PDFDropdown,
  PDFRadioGroup,
  PDFButton,
} from 'pdf-lib';
import { FormFieldInfo, NewFieldConfig } from './types';

/**
 * Extracts all interactive AcroForm fields from a PDF document.
 */
export async function extractFormFields(data: Uint8Array): Promise<FormFieldInfo[]> {
  try {
    const doc = await PDFDocument.load(data, { ignoreEncryption: true });
    const form = doc.getForm();
    const fields = form.getFields();
    const results: FormFieldInfo[] = [];

    for (const field of fields) {
      const name = field.getName();
      let type: FormFieldInfo['type'] = 'text';
      let value: string | boolean = '';
      let options: string[] | undefined;

      if (field instanceof PDFTextField) {
        type = 'text';
        value = field.getText() || '';
      } else if (field instanceof PDFCheckBox) {
        type = 'checkbox';
        value = field.isChecked();
      } else if (field instanceof PDFDropdown) {
        type = 'dropdown';
        options = field.getOptions();
        const selected = field.getSelected();
        value = selected && selected.length > 0 ? selected[0] : '';
      } else if (field instanceof PDFRadioGroup) {
        type = 'radio';
        options = field.getOptions();
        value = field.getSelected() || '';
      } else if (field instanceof PDFButton) {
        type = 'button';
        value = '';
      }

      results.push({
        name,
        type,
        value,
        options,
        isReadOnly: field.isReadOnly(),
      });
    }

    return results;
  } catch (err) {
    console.warn('No AcroForm fields found or failed to parse form:', err);
    return [];
  }
}

/**
 * Updates form field values in a PDF document.
 */
export async function fillFormFields(
  data: Uint8Array,
  fieldValues: Record<string, string | boolean>
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const form = doc.getForm();

  for (const [fieldName, val] of Object.entries(fieldValues)) {
    try {
      const field = form.getField(fieldName);
      if (field instanceof PDFTextField) {
        field.setText(String(val));
      } else if (field instanceof PDFCheckBox) {
        if (val === true || val === 'true') {
          field.check();
        } else {
          field.uncheck();
        }
      } else if (field instanceof PDFDropdown) {
        field.select(String(val));
      } else if (field instanceof PDFRadioGroup) {
        field.select(String(val));
      }
    } catch (e) {
      // Field might not exist; continue gracefully
    }
  }

  return await doc.save();
}

/**
 * Creates and embeds a new interactive form field into a PDF page.
 */
export async function createNewFormField(
  data: Uint8Array,
  config: NewFieldConfig
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const form = doc.getForm();
  const page = doc.getPage(config.pageNumber - 1);
  const { height: pageHeight } = page.getSize();

  // Convert to PDF bottom-left coordinate system
  const pdfY = pageHeight - config.y - config.height;

  if (config.type === 'text') {
    const textField = form.createTextField(config.name);
    textField.setText(config.defaultValue || '');
    textField.addToPage(page, {
      x: config.x,
      y: pdfY,
      width: config.width,
      height: config.height,
    });
  } else if (config.type === 'checkbox') {
    const checkBox = form.createCheckBox(config.name);
    if (config.defaultValue === 'true') {
      checkBox.check();
    }
    checkBox.addToPage(page, {
      x: config.x,
      y: pdfY,
      width: config.width,
      height: config.height,
    });
  } else if (config.type === 'dropdown') {
    const dropdown = form.createDropdown(config.name);
    if (config.options && config.options.length > 0) {
      dropdown.setOptions(config.options);
      if (config.defaultValue) {
        dropdown.select(config.defaultValue);
      }
    }
    dropdown.addToPage(page, {
      x: config.x,
      y: pdfY,
      width: config.width,
      height: config.height,
    });
  }

  return await doc.save();
}

/**
 * Permanently flattens all form fields into uneditable page content.
 */
export async function flattenForm(data: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const form = doc.getForm();
  form.flatten();
  return await doc.save();
}

/**
 * Exports current form field key-value pairs as a JSON formatted string.
 */
export async function exportFormDataAsJson(data: Uint8Array): Promise<string> {
  const fields = await extractFormFields(data);
  const dataMap: Record<string, string | boolean> = {};
  for (const f of fields) {
    dataMap[f.name] = f.value;
  }
  return JSON.stringify(dataMap, null, 2);
}

/**
 * Imports JSON key-value pairs and applies them to matching form fields.
 */
export async function importFormDataFromJson(
  data: Uint8Array,
  jsonString: string
): Promise<Uint8Array> {
  const parsed = JSON.parse(jsonString) as Record<string, string | boolean>;
  return await fillFormFields(data, parsed);
}
