import React, { useState } from 'react';
import {
  Layers,
  Upload,
  Loader2,
  X,
  FileText,
  Download,
  Trash2,
  Play,
  Zap,
  Sparkles,
  Archive,
} from 'lucide-react';
import { linearizePdf } from '../advanced/advancedClient';
import { convertPdfToFormat } from '../convert/convertClient';
import { applyWatermark } from '../edit/pageDecorations';
import { Button } from '../../components/ui/Button';

interface BatchFileItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  processedBytes?: Uint8Array;
  error?: string;
}

type BatchAction = 'linearize' | 'pdfa' | 'watermark';

export const BatchModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [fileQueue, setFileQueue] = useState<BatchFileItem[]>([]);
  const [selectedAction, setSelectedAction] = useState<BatchAction>('linearize');
  const [isProcessing, setIsProcessing] = useState(false);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');

  if (!isOpen) return null;

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newItems: BatchFileItem[] = Array.from(e.target.files).map((f) => ({
        id: Math.random().toString(36).substring(7),
        file: f,
        status: 'pending',
      }));
      setFileQueue((prev) => [...prev, ...newItems]);
    }
  };

  const handleRemove = (id: string) => {
    setFileQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleStartBatch = async () => {
    setIsProcessing(true);

    for (let i = 0; i < fileQueue.length; i++) {
      const item = fileQueue[i];
      if (item.status === 'done') continue;

      setFileQueue((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: 'processing' } : it))
      );

      try {
        const buffer = await item.file.arrayBuffer();
        const inputBytes = new Uint8Array(buffer);
        let outputBytes: Uint8Array;

        if (selectedAction === 'linearize') {
          outputBytes = await linearizePdf(inputBytes, item.file.name);
        } else if (selectedAction === 'pdfa') {
          const { blob } = await convertPdfToFormat(inputBytes, item.file.name, 'pdfa');
          const resBuf = await blob.arrayBuffer();
          outputBytes = new Uint8Array(resBuf);
        } else {
          outputBytes = await applyWatermark(inputBytes, {
            text: watermarkText,
            opacity: 0.3,
            fontSize: 32,
            rotation: 45,
          });
        }

        setFileQueue((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, status: 'done', processedBytes: outputBytes } : it
          )
        );
      } catch (err: any) {
        setFileQueue((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, status: 'error', error: err.message || 'Failed' } : it
          )
        );
      }
    }

    setIsProcessing(false);
  };

  const handleDownload = (item: BatchFileItem) => {
    if (!item.processedBytes) return;
    const blob = new Blob([item.processedBytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processed_${item.file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Batch Processing Workflows
              </h2>
              <p className="text-xs text-slate-500">
                Execute automated operations across multiple PDF files simultaneously.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Action Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Batch Action
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedAction('linearize')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedAction === 'linearize'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 font-semibold ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold">Linearize</span>
                </div>
                <div className="text-[10px] opacity-75 mt-0.5">Fast Web View</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAction('pdfa')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedAction === 'pdfa'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 font-semibold ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Archive className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold">PDF/A Archive</span>
                </div>
                <div className="text-[10px] opacity-75 mt-0.5">ISO 19005 Format</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAction('watermark')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedAction === 'watermark'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 font-semibold ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-500" />
                  <span className="text-xs font-bold">Watermark</span>
                </div>
                <div className="text-[10px] opacity-75 mt-0.5">Stamp Text</div>
              </button>
            </div>
          </div>

          {selectedAction === 'watermark' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Watermark Text
              </label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          )}

          {/* Upload Queue Dropzone */}
          <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center">
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleAddFiles}
              className="hidden"
              id="batch-file-input"
            />
            <label
              htmlFor="batch-file-input"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="w-6 h-6 text-indigo-500" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Click to add PDF documents to batch queue
              </span>
              <span className="text-[11px] text-slate-500">
                Supports multiple simultaneous files
              </span>
            </label>
          </div>

          {/* Queue List */}
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {fileQueue.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">
                    {item.file.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({(item.file.size / 1024).toFixed(0)} KB)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {item.status === 'processing' && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  )}
                  {item.status === 'done' && (
                    <button
                      onClick={() => handleDownload(item)}
                      className="text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Download className="w-3 h-3" /> Download
                    </button>
                  )}
                  {item.status === 'error' && (
                    <span className="text-red-500 text-[10px]">{item.error}</span>
                  )}
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-slate-400 hover:text-red-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleStartBatch}
            disabled={isProcessing || fileQueue.length === 0}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Queue...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Process {fileQueue.length} File(s)</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
