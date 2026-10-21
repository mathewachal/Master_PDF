import React, { useState } from 'react';
import {
  GitCompare,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileText,
  Plus,
  Minus,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { compareTwoPdfs, DiffComparisonResult } from '../advanced/advancedClient';
import { Button } from '../../components/ui/Button';

export const CompareModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { document: activeDoc } = useWorkspaceStore();
  const [fileB, setFileB] = useState<File | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [diffResult, setDiffResult] = useState<DiffComparisonResult | null>(null);
  const [selectedPageIdx, setSelectedPageIdx] = useState(0);

  if (!isOpen || !activeDoc) return null;

  const handleCompare = async () => {
    if (!fileB) {
      setErrorMsg('Please select a second PDF file to compare.');
      return;
    }

    setIsComparing(true);
    setErrorMsg(null);
    setDiffResult(null);

    try {
      const bufferB = await fileB.arrayBuffer();
      const result = await compareTwoPdfs(
        activeDoc.data,
        activeDoc.name,
        new Uint8Array(bufferB),
        fileB.name
      );
      setDiffResult(result);
      setSelectedPageIdx(0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Comparison failed.');
    } finally {
      setIsComparing(false);
    }
  };

  const currentPage = diffResult?.pageComparisons[selectedPageIdx];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Compare PDF Documents
              </h2>
              <p className="text-xs text-slate-500">
                Compare {activeDoc.name} side-by-side with another revision.
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
          {/* File Comparison Setup Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Base Document (A)
                </span>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {activeDoc.name}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 shrink-0">
                <Upload className="w-4 h-4" />
              </div>
              <div className="flex-1 overflow-hidden">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Target Revision (B)
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFileB(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-purple-50 file:text-purple-700"
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isComparing ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
              <p className="text-xs font-medium">Comparing text streams and structure...</p>
            </div>
          ) : diffResult ? (
            <div className="space-y-4">
              {/* Metrics Summary */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {diffResult.identical ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> Documents are 100% Identical
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
                      <AlertCircle className="w-4 h-4" /> Differences found on{' '}
                      {diffResult.pagesWithDifferences} page(s)
                    </span>
                  )}
                </div>
                <div className="text-slate-500">
                  Compared {diffResult.pagesCompared} pages (Doc A: {diffResult.pageCountA} pages,
                  Doc B: {diffResult.pageCountB} pages)
                </div>
              </div>

              {/* Page Navigator */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {diffResult.pageComparisons.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPageIdx(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      selectedPageIdx === idx
                        ? 'bg-blue-600 text-white font-semibold'
                        : p.hasChanges
                        ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>Page {p.pageNumber}</span>
                    {p.hasChanges && (
                      <span className="flex items-center text-[10px]">
                        <span className="text-emerald-500">+{p.additionsCount}</span>
                        <span className="text-red-500">-{p.deletionsCount}</span>
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Diff Lines Preview */}
              {currentPage && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
                  <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Page {currentPage.pageNumber} Diff Details</span>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1 text-emerald-600">
                        <Plus className="w-3 h-3" /> {currentPage.additionsCount} added lines
                      </span>
                      <span className="flex items-center gap-1 text-rose-600">
                        <Minus className="w-3 h-3" /> {currentPage.deletionsCount} deleted lines
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 text-slate-200 max-h-60 overflow-y-auto space-y-1">
                    {currentPage.diffLines.length === 0 ? (
                      <div className="text-slate-400 italic py-2">
                        No text changes on this page.
                      </div>
                    ) : (
                      currentPage.diffLines.map((line, lIdx) => {
                        const isAdd = line.startsWith('+');
                        const isDel = line.startsWith('-');
                        return (
                          <div
                            key={lIdx}
                            className={`px-1.5 py-0.5 rounded ${
                              isAdd
                                ? 'bg-emerald-950/80 text-emerald-300'
                                : isDel
                                ? 'bg-rose-950/80 text-rose-300'
                                : 'text-slate-400'
                            }`}
                          >
                            {line}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCompare}
            disabled={isComparing || !fileB}
            className="gap-1.5"
          >
            {isComparing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Comparing...</span>
              </>
            ) : (
              <>
                <GitCompare className="w-4 h-4" />
                <span>Run Document Comparison</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
