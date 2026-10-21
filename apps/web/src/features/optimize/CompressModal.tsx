import React, { useState } from 'react';
import {
  Minimize2,
  Download,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { getPlatform } from '../../platform';
import { compressPdf, CompressionResult } from './compression';
import { Button } from '../../components/ui/Button';

export const CompressModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { document: activeDoc, setDocument } = useWorkspaceStore();
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const platform = getPlatform();

  if (!isOpen || !activeDoc) return null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleRunCompress = async () => {
    setIsProcessing(true);
    try {
      const res = await compressPdf(activeDoc.data);
      setResult(res);
    } catch (err: any) {
      alert(`Compression failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadCompressed = async () => {
    if (!result) return;
    const name = `compressed_${activeDoc.name}`;
    await platform.file.saveFile(result.data, name);
    onClose();
  };

  const handleApplyToActive = () => {
    if (!result) return;
    setDocument({
      ...activeDoc,
      data: result.data,
      size: result.newSize,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-lg">
              <Minimize2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Compress PDF
              </h3>
              <p className="text-xs text-slate-500">
                Optimize and reduce file size locally.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Original Document Size:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {formatSize(activeDoc.size)}
              </span>
            </div>

            {result && (
              <>
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold border-t border-slate-200 dark:border-slate-700/60 pt-2">
                  <span>Optimized Size:</span>
                  <span>{formatSize(result.newSize)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Reduction:</span>
                  <span className="font-bold text-emerald-600">
                    -{result.reductionPercentage}% ({formatSize(result.savedBytes)} saved)
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Client-side stream linearization without external server upload.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-end gap-2 text-xs">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>

          {!result ? (
            <Button variant="primary" size="sm" onClick={handleRunCompress} disabled={isProcessing}>
              <Minimize2 className="w-4 h-4 mr-1.5" />
              <span>{isProcessing ? 'Optimizing...' : 'Compress Document'}</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleApplyToActive}>
                <Check className="w-4 h-4 mr-1" />
                <span>Apply to Document</span>
              </Button>
              <Button variant="primary" size="sm" onClick={handleDownloadCompressed}>
                <Download className="w-4 h-4 mr-1" />
                <span>Download</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
