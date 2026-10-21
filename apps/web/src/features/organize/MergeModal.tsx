import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  ArrowUp,
  ArrowDown,
  Trash2,
  Check,
  X,
  Layers,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { getPlatform } from '../../platform';
import { mergeDocuments } from './pdfOperations';
import { Button } from '../../components/ui/Button';

interface DocumentEntry {
  id: string;
  name: string;
  size: number;
  data: Uint8Array;
}

export const MergeModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { setDocument } = useWorkspaceStore();
  const [fileList, setFileList] = useState<DocumentEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const platform = getPlatform();

  if (!isOpen) return null;

  const handleAddFiles = async () => {
    try {
      const files = await platform.file.openFile({
        accept: ['.pdf', 'application/pdf'],
        multiple: true,
      });

      const newEntries: DocumentEntry[] = files.map((f, i) => ({
        id: `${Date.now()}-${i}`,
        name: f.name,
        size: f.size,
        data: f.data,
      }));

      setFileList((prev) => [...prev, ...newEntries]);
    } catch (err) {
      console.error('Failed to select files for merge:', err);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= fileList.length) return;

    const list = [...fileList];
    const item = list[index];
    list[index] = list[target];
    list[target] = item;
    setFileList(list);
  };

  const handleRemove = (index: number) => {
    setFileList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleExecuteMerge = async () => {
    if (fileList.length < 2) {
      alert('Please add at least 2 PDF files to merge.');
      return;
    }

    setIsProcessing(true);
    try {
      const mergedBytes = await mergeDocuments(
        fileList.map((f) => ({ name: f.name, data: f.data }))
      );

      const mergedName = `merged_${Date.now()}.pdf`;

      // Set directly as active document
      setDocument({
        name: mergedName,
        size: mergedBytes.byteLength,
        type: 'application/pdf',
        data: mergedBytes,
        pageCount: 1, // Will be recalculated by viewer
        lastModified: Date.now(),
      });

      onClose();
    } catch (err: any) {
      alert(`Merge failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-50 dark:bg-brand-950/60 text-brand-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Merge PDF Documents
              </h3>
              <p className="text-xs text-slate-500">
                Combine multiple PDFs into a single document.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {fileList.length === 0 ? (
            <div
              onClick={handleAddFiles}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-brand-500 transition-colors"
            >
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Click to add PDF documents
              </p>
              <p className="text-xs text-slate-400 mt-1">
                You can select multiple files at once
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {fileList.map((file, idx) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="font-mono font-bold text-slate-400 w-4">{idx + 1}.</span>
                    <FileText className="w-4 h-4 text-brand-500 shrink-0" />
                    <span className="font-medium truncate max-w-xs">{file.name}</span>
                    <span className="text-[10px] text-slate-400">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === fileList.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemove(idx)}
                      className="p-1 text-red-500 hover:text-red-700 ml-1"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {fileList.length > 0 && (
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={handleAddFiles} className="w-full">
                <UploadCloud className="w-4 h-4 mr-1.5" />
                <span>Add More PDFs</span>
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            {fileList.length} document(s) queued
          </span>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExecuteMerge}
              disabled={isProcessing || fileList.length < 2}
            >
              <Check className="w-4 h-4 mr-1" />
              <span>{isProcessing ? 'Merging...' : 'Merge Files'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
