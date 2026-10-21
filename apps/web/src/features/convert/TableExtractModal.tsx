import React, { useState, useEffect } from 'react';
import {
  Table,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  X,
  Layers,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { extractPdfTables, convertPdfToFormat, TableExtractionResult } from './convertClient';
import { Button } from '../../components/ui/Button';

export const TableExtractModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { document: activeDoc } = useWorkspaceStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extractionResult, setExtractionResult] = useState<TableExtractionResult | null>(null);
  const [activeTableIdx, setActiveTableIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && activeDoc) {
      handleScanTables();
    }
  }, [isOpen, activeDoc?.data]);

  const handleScanTables = async () => {
    if (!activeDoc) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await extractPdfTables(activeDoc.data, activeDoc.name);
      setExtractionResult(res);
      setActiveTableIdx(0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to detect tables from document.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!activeDoc) return;
    try {
      const { blob, downloadFilename } = await convertPdfToFormat(
        activeDoc.data,
        activeDoc.name,
        'xlsx'
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Excel export failed: ${err.message}`);
    }
  };

  const handleDownloadCsv = async () => {
    if (!activeDoc) return;
    try {
      const { blob, downloadFilename } = await convertPdfToFormat(
        activeDoc.data,
        activeDoc.name,
        'csv'
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`CSV export failed: ${err.message}`);
    }
  };

  const handleCopyJson = () => {
    if (!extractionResult) return;
    const currentTable = extractionResult.tables[activeTableIdx];
    navigator.clipboard.writeText(JSON.stringify(currentTable || extractionResult.tables, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !activeDoc) return null;

  const tables = extractionResult?.tables || [];
  const currentTable = tables[activeTableIdx];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Extract Tables
              </h2>
              <p className="text-xs text-slate-500">
                Detect, inspect, and export tabular data from {activeDoc.name}.
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
        <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-4">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
              <p className="text-sm">Scanning PDF layout and detecting table structures...</p>
            </div>
          ) : errorMsg ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-3 text-sm text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          ) : tables.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Table className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No Tables Detected
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                No structured table borders or tabular column alignments were found on the pages.
              </p>
            </div>
          ) : (
            <>
              {/* Tables selector pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {tables.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTableIdx(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      activeTableIdx === idx
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Table {idx + 1} (Page {t.page})</span>
                    <span className="text-[10px] opacity-80">({t.rowCount} rows)</span>
                  </button>
                ))}
              </div>

              {/* Table Data Preview */}
              {currentTable && (
                <div className="flex-1 overflow-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/40">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200 border-collapse">
                    <thead>
                      <tr className="bg-slate-200/80 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700">
                        {currentTable.headers.map((h, i) => (
                          <th key={i} className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {currentTable.rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className="hover:bg-white/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-3 py-2">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {tables.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyJson}
                className="gap-1.5 text-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied JSON' : 'Copy JSON'}</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {tables.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCsv}
                  className="gap-1.5 text-xs"
                >
                  <Download className="w-3.5 h-3.5 text-teal-600" />
                  <span>Download CSV</span>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDownloadExcel}
                  className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Download Excel (.xlsx)</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
