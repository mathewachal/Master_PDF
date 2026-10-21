import React, { useState, useEffect } from 'react';
import { Info, Check, X } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { extractMetadata, updateMetadata, PdfMetadata } from './metadataOperations';
import { Button } from '../../components/ui/Button';

export const MetadataModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { document: activeDoc, setDocument } = useWorkspaceStore();
  const [meta, setMeta] = useState<PdfMetadata>({});
  const [keywordsStr, setKeywordsStr] = useState('');
  const [stripProducer, setStripProducer] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen || !activeDoc) return;
    extractMetadata(activeDoc.data).then((m) => {
      setMeta(m);
      setKeywordsStr((m.keywords || []).join(', '));
    });
  }, [isOpen, activeDoc?.data]);

  if (!isOpen || !activeDoc) return null;

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      const keywords = keywordsStr
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      const updatedBytes = await updateMetadata(
        activeDoc.data,
        {
          ...meta,
          keywords,
        },
        stripProducer
      );

      setDocument({
        ...activeDoc,
        data: updatedBytes,
        size: updatedBytes.byteLength,
      });

      onClose();
    } catch (err: any) {
      alert(`Failed to update metadata: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-lg">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Document Metadata & Properties
              </h3>
              <p className="text-xs text-slate-500">
                Inspect and update document title, author, and keywords.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Document Title
            </label>
            <input
              type="text"
              value={meta.title || ''}
              onChange={(e) => setMeta({ ...meta, title: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Author
            </label>
            <input
              type="text"
              value={meta.author || ''}
              onChange={(e) => setMeta({ ...meta, author: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Subject
            </label>
            <input
              type="text"
              value={meta.subject || ''}
              onChange={(e) => setMeta({ ...meta, subject: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={keywordsStr}
              onChange={(e) => setKeywordsStr(e.target.value)}
              placeholder="e.g. report, annual, financial"
              className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stripProducer}
                onChange={(e) => setStripProducer(e.target.checked)}
                className="rounded text-brand-600"
              />
              <span className="text-slate-600 dark:text-slate-300">
                Strip producer and creator application signatures
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-end gap-2 text-xs">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={isProcessing}>
            <Check className="w-4 h-4 mr-1.5" />
            <span>{isProcessing ? 'Saving...' : 'Save Metadata'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
