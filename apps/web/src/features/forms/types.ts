export type FormFieldType = 'text' | 'checkbox' | 'dropdown' | 'radio' | 'button';

export interface FormFieldInfo {
  name: string;
  type: FormFieldType;
  value: string | boolean;
  options?: string[]; // for dropdowns / radio
  isReadOnly?: boolean;
}

export interface NewFieldConfig {
  type: 'text' | 'checkbox' | 'dropdown';
  name: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  defaultValue?: string;
  options?: string[];
}
