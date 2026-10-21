import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Check,
  X,
  Plus,
  CheckCheck,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { getPlatform } from '../../platform';
import { FormFieldInfo } from './types';
import {
  extractFormFields,
  fillFormFields,
  flattenForm,
  exportFormDataAsJson,
  importFormDataFromJson,
} from './formOperations';
import { FormBuilderModal } from './FormBuilderModal';
import { Button } from '../../components/ui/Button';

export const FormFillModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { document: activeDoc, setDocument } = useWorkspaceStore();
  const [fields, setFields] = useState<FormFieldInfo[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const platform = getPlatform();

  useEffect(() => {
    if (!isOpen || !activeDoc) return;
    setIsLoading(true);

    extractFormFields(activeDoc.data)
      .then((extracted) => {
        setFields(extracted);
        const initialMap: Record<string, string | boolean> = {};
        extracted.forEach((f) => {
          initialMap[f.name] = f.value;
        });
        setFormValues(initialMap);
      })
      .finally(() => setIsLoading(false));
  }, [isOpen, activeDoc?.data]);

  if (!isOpen || !activeDoc) return null;

  const handleApplyValues = async () => {
    setIsProcessing(true);
    try {
      const updatedBytes = await fillFormFields(activeDoc.data, formValues);
      setDocument({
        ...activeDoc,
        data: updatedBytes,
        size: updatedBytes.byteLength,
      });
      onClose();
    } catch (err: any) {
      alert(`Failed to save form values: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFlatten = async () => {
    if (!confirm('Flattening will make all form fields permanent and non-editable. Proceed?')) {
      return;
    }

    setIsProcessing(true);
    try {
      // First apply current values, then flatten
      const filled = await fillFormFields(activeDoc.data, formValues);
      const flattened = await flattenForm(filled);

      setDocument({
        ...activeDoc,
        data: flattened,
        size: flattened.byteLength,
      });
      alert('Form successfully flattened!');
      onClose();
    } catch (err: any) {
      alert(`Flatten failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportJson = async () => {
    try {
      const jsonStr = await exportFormDataAsJson(activeDoc.data);
      const filename = `${activeDoc.name.replace(/\.pdf$/i, '')}_form_data.json`;
      const blob = new Blob([jsonStr], { type: 'application/json' });
      await platform.file.saveFile(blob, filename, 'application/json');
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  const handleImportJson = async () => {
    try {
      const files = await platform.file.openFile({
        accept: ['.json', 'application/json'],
        multiple: false,
      });
      if (files.length > 0) {
        const text = new TextDecoder().decode(files[0].data);
        const updatedBytes = await importFormDataFromJson(activeDoc.data, text);
        setDocument({
          ...activeDoc,
          data: updatedBytes,
          size: updatedBytes.byteLength,
        });
        alert('Form values successfully imported!');
        onClose();
      }
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 rounded-lg">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Interactive AcroForms
                </h3>
                <p className="text-xs text-slate-500">
                  Fill, export, import, or flatten form fields.
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions Bar */}
          <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowBuilder(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Add Form Field</span>
              </Button>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleImportJson}
                className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded flex items-center gap-1 font-medium"
                title="Import field data from JSON"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON</span>
              </button>
              <button
                onClick={handleExportJson}
                className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded flex items-center gap-1 font-medium"
                title="Export current values to JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Fields List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400">Scanning form fields...</div>
            ) : fields.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <p className="text-slate-500">
                  No interactive form fields found in this document.
                </p>
                <Button variant="primary" size="sm" onClick={() => setShowBuilder(true)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>Create First Form Field</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map((field) => (
                  <div
                    key={field.name}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-200">
                      <span>{field.name}</span>
                      <span className="text-[10px] uppercase font-mono text-slate-400">
                        {field.type}
                      </span>
                    </div>

                    {field.type === 'text' && (
                      <input
                        type="text"
                        value={String(formValues[field.name] ?? '')}
                        onChange={(e) =>
                          setFormValues({ ...formValues, [field.name]: e.target.value })
                        }
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    )}

                    {field.type === 'checkbox' && (
                      <label className="flex items-center gap-2 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={Boolean(formValues[field.name])}
                          onChange={(e) =>
                            setFormValues({ ...formValues, [field.name]: e.target.checked })
                          }
                          className="rounded text-brand-600"
                        />
                        <span className="text-slate-600 dark:text-slate-300">Checked</span>
                      </label>
                    )}

                    {field.type === 'dropdown' && field.options && (
                      <select
                        value={String(formValues[field.name] ?? '')}
                        onChange={(e) =>
                          setFormValues({ ...formValues, [field.name]: e.target.value })
                        }
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs">
            {fields.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleFlatten}
                disabled={isProcessing}
                className="text-amber-600 hover:text-amber-700"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                <span>Flatten Form</span>
              </Button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <Button variant="ghost" size="sm" onClick={onClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApplyValues}
                disabled={isProcessing || fields.length === 0}
              >
                <Check className="w-4 h-4 mr-1.5" />
                <span>{isProcessing ? 'Saving...' : 'Save & Apply'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Field Builder Modal */}
      <FormBuilderModal
        isOpen={showBuilder}
        onClose={() => setShowBuilder(false)}
        onCreated={() => {
          setShowBuilder(false);
          // Refresh fields
          if (activeDoc) {
            extractFormFields(activeDoc.data).then(setFields);
          }
        }}
      />
    </>
  );
};
