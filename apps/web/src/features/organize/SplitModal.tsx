import React, { useState } from 'react';
import {
  Split,
  Download,
  X,
  FileText,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { getPlatform } from '../../platform';
import {
  splitDocumentByRanges,
  splitEveryNPages,
  extractPages,
} from './pdfOperations';
import { Button } from '../../components/ui/Button';

export const SplitModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { document: activeDoc, selectedPages } = useWorkspaceStore();
  const [splitMode, setSplitMode] = useState<'range' | 'every_n' | 'extract'>('range');
  const [rangesText, setRangesText] = useState('1-2, 3-4');
  const [chunkSize, setChunkSize] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const platform = getPlatform();

  if (!isOpen || !activeDoc) return null;

  const totalPages = activeDoc.pageCount || 1;

  const handleExecuteSplit = async () => {
    setIsProcessing(true);
    try {
      if (splitMode === 'range') {
        const groups = rangesText.split(';').map((s) => s.trim()).filter(Boolean);
        const ranges = groups.length > 0 ? groups : [rangesText];
        const results = await splitDocumentByRanges(activeDoc.data, ranges, activeDoc.name);

        for (const res of results) {
          await platform.file.saveFile(res.data, res.filename);
        }
      } else if (splitMode === 'every_n') {
        const results = await splitEveryNPages(activeDoc.data, chunkSize, activeDoc.name);
        for (const res of results) {
          await platform.file.saveFile(res.data, res.filename);
        }
      } else if (splitMode === 'extract') {
        if (selectedPages.length === 0) {
          alert('No pages currently selected.');
          return;
        }
        const extracted = await extractPages(activeDoc.data, selectedPages);
        const name = `extracted_${activeDoc.name}`;
        await platform.file.saveFile(extracted, name);
      }

      onClose();
    } catch (err: any) {
      alert(`Split operation failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-lg">
              <Split className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Split PDF Document
              </h3>
              <p className="text-xs text-slate-500">
                Total document pages: {totalPages}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Mode Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setSplitMode('range')}
              className={`py-2 px-3 rounded-lg font-semibold transition-colors ${
                splitMode === 'range'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              By Ranges
            </button>
            <button
              onClick={() => setSplitMode('every_n')}
              className={`py-2 px-3 rounded-lg font-semibold transition-colors ${
                splitMode === 'every_n'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Every N Pages
            </button>
            <button
              onClick={() => setSplitMode('extract')}
              className={`py-2 px-3 rounded-lg font-semibold transition-colors ${
                splitMode === 'extract'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Extract Selected
            </button>
          </div>

          {/* Form Options */}
          {splitMode === 'range' && (
            <div className="space-y-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Page Range Groups (separated by semicolon for separate files)
              </label>
              <input
                type="text"
                value={rangesText}
                onChange={(e) => setRangesText(e.target.value)}
                placeholder="e.g. 1-2; 3-5"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
              />
              <p className="text-[11px] text-slate-400">
                Example: <code>1-3; 4-6</code> will split the document into two files.
              </p>
            </div>
          )}

          {splitMode === 'every_n' && (
            <div className="space-y-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Split every N pages
              </label>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={chunkSize}
                onChange={(e) => setChunkSize(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <p className="text-[11px] text-slate-400">
                Will produce approximately {Math.ceil(totalPages / (chunkSize || 1))} separate files.
              </p>
            </div>
          )}

          {splitMode === 'extract' && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-center space-y-1">
              <FileText className="w-6 h-6 text-brand-500 mx-auto" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                {selectedPages.length} page(s) selected
              </p>
              <p className="text-[11px] text-slate-400">
                Selected pages: {selectedPages.join(', ') || 'None'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-end gap-2 text-xs">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleExecuteSplit} disabled={isProcessing}>
            <Download className="w-4 h-4 mr-1.5" />
            <span>{isProcessing ? 'Splitting...' : 'Split & Download'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
