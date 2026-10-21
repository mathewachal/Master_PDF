import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { createNewFormField } from './formOperations';
import { Button } from '../../components/ui/Button';

export const FormBuilderModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}> = ({ isOpen, onClose, onCreated }) => {
  const { document: activeDoc, setDocument, currentPage } = useWorkspaceStore();
  const [fieldType, setFieldType] = useState<'text' | 'checkbox' | 'dropdown'>('text');
  const [fieldName, setFieldName] = useState('');
  const [targetPage, setTargetPage] = useState(currentPage || 1);
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(100);
  const [fieldWidth, setFieldWidth] = useState(200);
  const [fieldHeight, setFieldHeight] = useState(25);
  const [defaultValue, setDefaultValue] = useState('');
  const [dropdownOptions, setDropdownOptions] = useState('Option 1, Option 2, Option 3');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !activeDoc) return null;

  const totalPages = activeDoc.pageCount || 1;

  const handleCreate = async () => {
    if (!fieldName.trim()) {
      alert('Please enter a field name.');
      return;
    }

    setIsProcessing(true);
    try {
      const options =
        fieldType === 'dropdown'
          ? dropdownOptions.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined;

      const updatedBytes = await createNewFormField(activeDoc.data, {
        type: fieldType,
        name: fieldName.trim(),
        pageNumber: targetPage,
        x: posX,
        y: posY,
        width: fieldWidth,
        height: fieldHeight,
        defaultValue,
        options,
      });

      setDocument({
        ...activeDoc,
        data: updatedBytes,
        size: updatedBytes.byteLength,
      });

      onCreated();
    } catch (err: any) {
      alert(`Failed to create form field: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Add Interactive Form Field
          </h3>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Field Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['text', 'checkbox', 'dropdown'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFieldType(t)}
                  className={`py-1.5 rounded-lg border font-semibold capitalize ${
                    fieldType === t
                      ? 'border-brand-500 bg-brand-50/50 text-brand-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Field Name (Identifier)
            </label>
            <input
              type="text"
              placeholder="e.g. fullName, agreeToTerms"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Target Page
              </label>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={targetPage}
                onChange={(e) => setTargetPage(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Default Value
              </label>
              <input
                type="text"
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {fieldType === 'dropdown' && (
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Dropdown Options (comma-separated)
              </label>
              <input
                type="text"
                value={dropdownOptions}
                onChange={(e) => setDropdownOptions(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          )}

          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">X (px)</label>
              <input
                type="number"
                value={posX}
                onChange={(e) => setPosX(parseInt(e.target.value, 10) || 0)}
                className="w-full px-2 py-1 border rounded bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Y (px)</label>
              <input
                type="number"
                value={posY}
                onChange={(e) => setPosY(parseInt(e.target.value, 10) || 0)}
                className="w-full px-2 py-1 border rounded bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Width</label>
              <input
                type="number"
                value={fieldWidth}
                onChange={(e) => setFieldWidth(parseInt(e.target.value, 10) || 50)}
                className="w-full px-2 py-1 border rounded bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Height</label>
              <input
                type="number"
                value={fieldHeight}
                onChange={(e) => setFieldHeight(parseInt(e.target.value, 10) || 20)}
                className="w-full px-2 py-1 border rounded bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-end gap-2 text-xs">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleCreate} disabled={isProcessing}>
            <Check className="w-4 h-4 mr-1.5" />
            <span>{isProcessing ? 'Adding...' : 'Add Field'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
