import React, { useState, useEffect } from 'react';
import {
  ScanText,
  Languages,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
  X,
  FileCheck,
  Compass,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { performOcr, getOcrLanguages, OcrLanguage } from '../convert/convertClient';
import { Button } from '../../components/ui/Button';

export const OcrModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { document: activeDoc, setDocument } = useWorkspaceStore();
  const [languages, setLanguages] = useState<OcrLanguage[]>([
    { code: 'eng', name: 'English' },
    { code: 'spa', name: 'Spanish' },
    { code: 'fra', name: 'French' },
    { code: 'deu', name: 'German' },
    { code: 'ita', name: 'Italian' },
    { code: 'por', name: 'Portuguese' },
    { code: 'chi_sim', name: 'Chinese (Simplified)' },
    { code: 'jpn', name: 'Japanese' },
    { code: 'rus', name: 'Russian' },
    { code: 'ara', name: 'Arabic' },
    { code: 'hin', name: 'Hindi' },
  ]);
  const [selectedLanguage, setSelectedLanguage] = useState('eng');
  const [outputFormat, setOutputFormat] = useState<'searchable_pdf' | 'txt' | 'markdown'>('searchable_pdf');
  const [deskew, setDeskew] = useState(true);
  const [pageScope, setPageScope] = useState<'all' | 'custom'>('all');
  const [customPages, setCustomPages] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultData, setResultData] = useState<{
    data: Uint8Array;
    downloadFilename: string;
    isPdf: boolean;
    pagesProcessed: number;
    url: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      getOcrLanguages().then((langs) => {
        if (langs.length > 0) setLanguages(langs);
      });
      setResultData(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen || !activeDoc) return null;

  const handleStartOcr = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    setResultData(null);

    try {
      const res = await performOcr(activeDoc.data, activeDoc.name, {
        language: selectedLanguage,
        outputFormat,
        deskew,
        pages: pageScope === 'custom' ? customPages : undefined,
      });

      const blob = new Blob([res.data as unknown as BlobPart], {
        type: res.isPdf ? 'application/pdf' : 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);

      setResultData({
        ...res,
        url,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'OCR processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenInEditor = () => {
    if (!resultData || !resultData.isPdf) return;
    setDocument({
      name: resultData.downloadFilename,
      size: resultData.data.byteLength,
      type: 'application/pdf',
      data: resultData.data,
      pageCount: activeDoc.pageCount,
      lastModified: Date.now(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-50 dark:bg-orange-950/40 text-orange-600 rounded-lg">
              <ScanText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Optical Character Recognition (OCR)
              </h2>
              <p className="text-xs text-slate-500">
                Transform scanned document images into searchable, selectable text.
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

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Language Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-blue-500" />
              <span>Document Primary Language</span>
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name} ({l.code})
                </option>
              ))}
            </select>
          </div>

          {/* Output Format */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Output Target
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setOutputFormat('searchable_pdf')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  outputFormat === 'searchable_pdf'
                    ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 font-semibold ring-1 ring-orange-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="text-xs font-bold">Searchable PDF</div>
                <div className="text-[10px] opacity-75 mt-0.5">Invisible text overlay</div>
              </button>

              <button
                type="button"
                onClick={() => setOutputFormat('markdown')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  outputFormat === 'markdown'
                    ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 font-semibold ring-1 ring-orange-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="text-xs font-bold">Markdown (.md)</div>
                <div className="text-[10px] opacity-75 mt-0.5">Structured text</div>
              </button>

              <button
                type="button"
                onClick={() => setOutputFormat('txt')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  outputFormat === 'txt'
                    ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 font-semibold ring-1 ring-orange-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="text-xs font-bold">Plain Text (.txt)</div>
                <div className="text-[10px] opacity-75 mt-0.5">Stripped content</div>
              </button>
            </div>
          </div>

          {/* Options: Auto deskew */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-slate-500" />
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Auto-deskew & Clean Scan
                </div>
                <div className="text-[10px] text-slate-500">
                  Straightens tilted pages and optimizes contrast before OCR
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={deskew}
              onChange={(e) => setDeskew(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
            />
          </div>

          {/* Page Scope */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Page Range
            </label>
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="ocrScope"
                  checked={pageScope === 'all'}
                  onChange={() => setPageScope('all')}
                  className="text-brand-600"
                />
                <span>All pages ({activeDoc.pageCount})</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="ocrScope"
                  checked={pageScope === 'custom'}
                  onChange={() => setPageScope('custom')}
                  className="text-brand-600"
                />
                <span>Custom pages</span>
              </label>
            </div>
            {pageScope === 'custom' && (
              <input
                type="text"
                placeholder="e.g. 1, 3-5"
                value={customPages}
                onChange={(e) => setCustomPages(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2.5 text-xs text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resultData && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl space-y-3 text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  OCR complete! Processed {resultData.pagesProcessed} page(s).
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={resultData.url}
                  download={resultData.downloadFilename}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {resultData.downloadFilename}</span>
                </a>
                {resultData.isPdf && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenInEditor}
                    className="gap-1.5 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Open in Editor</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Language: <strong>{selectedLanguage.toUpperCase()}</strong>
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleStartOcr}
              disabled={isProcessing}
              className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Running OCR Engine...</span>
                </>
              ) : (
                <>
                  <ScanText className="w-4 h-4" />
                  <span>Start OCR</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
