import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Code,
  FileType,
  Archive,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  TableProperties,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { convertPdfToFormat, TargetConvertFormat } from './convertClient';
import { Button } from '../../components/ui/Button';

interface FormatOption {
  id: TargetConvertFormat;
  name: string;
  ext: string;
  desc: string;
  icon: React.ReactNode;
  badge?: string;
  color: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: 'docx',
    name: 'Microsoft Word',
    ext: '.docx',
    desc: 'Editable document with preserved paragraphs, headings, and tables.',
    icon: <FileText className="w-6 h-6 text-blue-600" />,
    badge: 'Popular',
    color: 'hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/20',
  },
  {
    id: 'xlsx',
    name: 'Microsoft Excel',
    ext: '.xlsx',
    desc: 'Formatted multi-sheet spreadsheet generated from detected tables.',
    icon: <FileSpreadsheet className="w-6 h-6 text-emerald-600" />,
    badge: 'Tables',
    color: 'hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20',
  },
  {
    id: 'csv',
    name: 'CSV Delimited',
    ext: '.csv',
    desc: 'Raw comma-separated table data ready for database import.',
    icon: <TableProperties className="w-6 h-6 text-teal-600" />,
    color: 'hover:border-teal-500 hover:bg-teal-50/30 dark:hover:bg-teal-950/20',
  },
  {
    id: 'markdown',
    name: 'Markdown',
    ext: '.md',
    desc: 'Clean markdown text preserving titles, lists, and layout blocks.',
    icon: <Code className="w-6 h-6 text-purple-600" />,
    badge: 'LLM Ready',
    color: 'hover:border-purple-500 hover:bg-purple-50/30 dark:hover:bg-purple-950/20',
  },
  {
    id: 'html',
    name: 'Standalone HTML',
    ext: '.html',
    desc: 'Responsive web document styled for easy browser viewing.',
    icon: <Code className="w-6 h-6 text-orange-600" />,
    color: 'hover:border-orange-500 hover:bg-orange-50/30 dark:hover:bg-orange-950/20',
  },
  {
    id: 'txt',
    name: 'Plain Text',
    ext: '.txt',
    desc: 'Clean extracted text content without layout or formatting.',
    icon: <FileType className="w-6 h-6 text-slate-600 dark:text-slate-400" />,
    color: 'hover:border-slate-500 hover:bg-slate-50/40 dark:hover:bg-slate-900/40',
  },
  {
    id: 'pdfa',
    name: 'PDF/A Archival',
    ext: '.pdf',
    desc: 'ISO 19005 compliant standard for long-term document archiving.',
    icon: <Archive className="w-6 h-6 text-indigo-600" />,
    badge: 'ISO Standard',
    color: 'hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20',
  },
];

export const ConvertModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { document: activeDoc } = useWorkspaceStore();
  const [selectedFormat, setSelectedFormat] = useState<TargetConvertFormat>('docx');
  const [isConverting, setIsConverting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadInfo, setDownloadInfo] = useState<{ url: string; filename: string } | null>(null);

  if (!isOpen || !activeDoc) return null;

  const handleConvert = async () => {
    setIsConverting(true);
    setErrorMsg(null);
    setDownloadInfo(null);

    try {
      const { blob, downloadFilename } = await convertPdfToFormat(
        activeDoc.data,
        activeDoc.name,
        selectedFormat
      );

      const url = URL.createObjectURL(blob);
      setDownloadInfo({ url, filename: downloadFilename });

      // Automatically trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      setErrorMsg(err.message || 'Conversion failed. Please check backend connection.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Convert PDF Document
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Export {activeDoc.name} into various editable formats and ISO standards.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FORMAT_OPTIONS.map((opt) => {
              const isSelected = selectedFormat === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => {
                    setSelectedFormat(opt.id);
                    setDownloadInfo(null);
                  }}
                  className={`relative p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/40 dark:bg-brand-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                  } ${opt.color}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                      {opt.icon}
                    </div>
                    {opt.badge && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <div className="mt-2.5">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {opt.name}{' '}
                      <span className="text-xs font-normal text-slate-400">{opt.ext}</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {opt.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2.5 text-xs text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {downloadInfo && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Converted successfully: <strong>{downloadInfo.filename}</strong>
                </span>
              </div>
              <a
                href={downloadInfo.url}
                download={downloadInfo.filename}
                className="font-semibold underline hover:text-emerald-900 dark:hover:text-emerald-100 flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Selected target: <strong>.{selectedFormat}</strong>
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConvert}
              disabled={isConverting}
              className="gap-1.5"
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Convert & Download</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
