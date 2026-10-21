import React, { useState } from 'react';
import {
  RotateCw,
  Trash2,
  Plus,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import {
  reorderPages,
  rotatePages,
} from './pdfOperations';
import { Button } from '../../components/ui/Button';

interface PageItem {
  pageNumber: number;
  rotation: number;
}

export const OrganizeModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { document: activeDoc, setDocument } = useWorkspaceStore();
  const [pages, setPages] = useState<PageItem[]>(() => {
    const total = activeDoc?.pageCount || 1;
    return Array.from({ length: total }, (_, i) => ({
      pageNumber: i + 1,
      rotation: 0,
    }));
  });
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !activeDoc) return null;

  const handleMove = (index: number, direction: 'left' | 'right') => {
    const target = direction === 'left' ? index - 1 : index + 1;
    if (target < 0 || target >= pages.length) return;

    const newPages = [...pages];
    const temp = newPages[index];
    newPages[index] = newPages[target];
    newPages[target] = temp;
    setPages(newPages);
  };

  const handleRotatePage = (index: number) => {
    const newPages = [...pages];
    newPages[index].rotation = (newPages[index].rotation + 90) % 360;
    setPages(newPages);
  };

  const handleDeleteSelected = () => {
    if (selectedIndices.length === 0) return;
    if (selectedIndices.length >= pages.length) {
      alert('At least one page must remain in the document.');
      return;
    }
    const toDelete = new Set(selectedIndices);
    setPages(pages.filter((_, idx) => !toDelete.has(idx)));
    setSelectedIndices([]);
  };

  const handleInsertBlank = (atIndex: number) => {
    const newPages = [...pages];
    newPages.splice(atIndex + 1, 0, {
      pageNumber: pages.length + 1,
      rotation: 0,
    });
    setPages(newPages);
  };

  const handleApplyChanges = async () => {
    setIsProcessing(true);
    try {
      let currentBytes = activeDoc.data;

      // 1. Reorder if order changed
      const order = pages.map((p) => p.pageNumber);
      currentBytes = await reorderPages(currentBytes, order);

      // 2. Apply rotations
      for (let i = 0; i < pages.length; i++) {
        if (pages[i].rotation !== 0) {
          currentBytes = await rotatePages(currentBytes, [i + 1], pages[i].rotation);
        }
      }

      setDocument({
        ...activeDoc,
        data: currentBytes,
        pageCount: pages.length,
        size: currentBytes.byteLength,
      });

      onClose();
    } catch (err: any) {
      alert(`Failed to organize pages: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Organize Pages
            </h3>
            <p className="text-xs text-slate-500">
              Reorder, rotate, or delete pages in {activeDoc.name}.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {pages.length} page(s) total
            </span>
            {selectedIndices.length > 0 && (
              <span className="text-brand-600 font-medium">
                ({selectedIndices.length} selected)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleInsertBlank(pages.length - 1)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Insert Blank Page</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={selectedIndices.length === 0}
              onClick={handleDeleteSelected}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              <span>Delete Selected</span>
            </Button>
          </div>
        </div>

        {/* Page Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {pages.map((p, idx) => {
            const isSelected = selectedIndices.includes(idx);

            return (
              <div
                key={`${p.pageNumber}-${idx}`}
                className={`relative rounded-xl border p-3 flex flex-col items-center group transition-all ${
                  isSelected
                    ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/20 dark:bg-brand-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIndices([...selectedIndices, idx]);
                    } else {
                      setSelectedIndices(selectedIndices.filter((i) => i !== idx));
                    }
                  }}
                  className="absolute top-2 left-2 rounded text-brand-600 focus:ring-brand-500 z-10"
                />

                {/* Page Card Canvas Area */}
                <div
                  className="w-full aspect-[1/1.4] bg-slate-100 dark:bg-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-400 transition-transform duration-200"
                  style={{ transform: `rotate(${p.rotation}deg)` }}
                >
                  <FileText className="w-8 h-8 mb-1" />
                  <span className="text-xs font-mono font-medium">Page {p.pageNumber}</span>
                </div>

                {/* Label and Control Buttons */}
                <div className="w-full flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    #{idx + 1}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMove(idx, 'left')}
                      disabled={idx === 0}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                      title="Move Left"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRotatePage(idx)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 'right')}
                      disabled={idx === pages.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                      title="Move Right"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleApplyChanges} disabled={isProcessing}>
            <Check className="w-4 h-4 mr-1.5" />
            <span>{isProcessing ? 'Applying...' : 'Apply & Save'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
