import React, { useState } from 'react';
import {
  Zap,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileCheck,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { linearizePdf, repairPdf, sanitizePdf } from './advancedClient';
import { Button } from '../../components/ui/Button';

type ActionType = 'linearize' | 'repair' | 'sanitize';

export const OptimizeAdvancedModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { document: activeDoc, setDocument } = useWorkspaceStore();
  const [selectedAction, setSelectedAction] = useState<ActionType>('linearize');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  if (!isOpen || !activeDoc) return null;

  const handleExecute = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessInfo(null);

    try {
      if (selectedAction === 'linearize') {
        const optimizedBytes = await linearizePdf(activeDoc.data, activeDoc.name);
        setDocument({
          ...activeDoc,
          data: optimizedBytes,
          size: optimizedBytes.byteLength,
          lastModified: Date.now(),
        });
        setSuccessInfo('PDF optimized for Fast Web View! Byte-range streaming enabled.');
      } else if (selectedAction === 'repair') {
        const repairedBytes = await repairPdf(activeDoc.data, activeDoc.name);
        setDocument({
          ...activeDoc,
          data: repairedBytes,
          size: repairedBytes.byteLength,
          lastModified: Date.now(),
        });
        setSuccessInfo('Document structure rebuilt and cross-reference table repaired.');
      } else if (selectedAction === 'sanitize') {
        const { data: sanitizedBytes, removedItems } = await sanitizePdf(
          activeDoc.data,
          activeDoc.name
        );
        setDocument({
          ...activeDoc,
          data: sanitizedBytes,
          size: sanitizedBytes.byteLength,
          lastModified: Date.now(),
        });
        setSuccessInfo(
          `Document sanitized! Removed: ${
            removedItems.length > 0 ? removedItems.join(', ') : 'all tracking metadata & scripts'
          }`
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Repair, Linearize & Sanitize
              </h2>
              <p className="text-xs text-slate-500">
                Advanced structural maintenance and privacy sanitization.
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

        {/* Action Selection */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="space-y-3">
            <div
              onClick={() => setSelectedAction('linearize')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedAction === 'linearize'
                  ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/40 dark:bg-brand-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Linearize (Fast Web View)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 pl-7">
                Rearranges PDF objects into a streamable byte-range format so web browsers can view page 1 instantly while downloading.
              </p>
            </div>

            <div
              onClick={() => setSelectedAction('repair')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedAction === 'repair'
                  ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/40 dark:bg-brand-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Wrench className="w-5 h-5 text-blue-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Rebuild & Repair
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 pl-7">
                Reconstructs corrupted cross-reference tables, fixes dangling object references, and recovers damaged streams.
              </p>
            </div>

            <div
              onClick={() => setSelectedAction('sanitize')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedAction === 'sanitize'
                  ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/40 dark:bg-brand-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Deep Privacy Sanitize
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 pl-7">
                Permanently strips embedded JavaScript triggers, file attachments, XML Forms Architecture (XFA), and private tracking metadata.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successInfo && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successInfo}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExecute}
            disabled={isProcessing}
            className="gap-1.5"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Apply to Document</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
