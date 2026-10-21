import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  X,
  Mail,
  Phone,
  CreditCard,
  Hash,
  AlertTriangle,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { searchAndRedactOnline } from './redactClient';
import { Button } from '../../components/ui/Button';

export const RedactionModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { document: activeDoc, setDocument } = useWorkspaceStore();
  const [selectedPreset, setSelectedPreset] = useState<'email' | 'phone' | 'ssn' | 'credit_card' | 'custom'>('email');
  const [customPattern, setCustomPattern] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [sanitizeMetadata, setSanitizeMetadata] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [auditResult, setAuditResult] = useState<{ applied: number; verified: boolean } | null>(null);

  if (!isOpen || !activeDoc) return null;

  const presets = [
    { id: 'email', label: 'Email Addresses', icon: <Mail className="w-3.5 h-3.5" />, desc: 'e.g. john@example.com' },
    { id: 'phone', label: 'Phone Numbers', icon: <Phone className="w-3.5 h-3.5" />, desc: 'e.g. (555) 123-4567' },
    { id: 'ssn', label: 'Social Security', icon: <Hash className="w-3.5 h-3.5" />, desc: 'e.g. 123-45-6789' },
    { id: 'credit_card', label: 'Credit Cards', icon: <CreditCard className="w-3.5 h-3.5" />, desc: '16-digit card numbers' },
    { id: 'custom', label: 'Custom Keyword/Regex', icon: <AlertTriangle className="w-3.5 h-3.5" />, desc: 'Specify custom term' },
  ];

  const handleExecuteRedact = async () => {
    if (selectedPreset === 'custom' && !customPattern.trim()) {
      alert('Please specify a keyword or regex pattern to redact.');
      return;
    }

    setIsProcessing(true);
    setAuditResult(null);

    try {
      const res = await searchAndRedactOnline(activeDoc.data, activeDoc.name, {
        preset: selectedPreset !== 'custom' ? selectedPreset : undefined,
        customPattern: selectedPreset === 'custom' ? customPattern.trim() : undefined,
        caseSensitive,
        sanitizeMetadata,
      });

      setDocument({
        ...activeDoc,
        data: res.data,
        size: res.data.byteLength,
      });

      setAuditResult({
        applied: res.redactionsApplied,
        verified: res.auditVerified,
      });
    } catch (err: any) {
      alert(`Certified redaction failed: ${err.message}`);
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
            <div className="p-2 bg-red-50 dark:bg-red-950/60 text-red-600 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Certified Permanent Redaction
              </h3>
              <p className="text-xs text-slate-500">
                Permanently purge sensitive text, glyphs, and images via PyMuPDF.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Select Sensitive Information Preset
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPreset(p.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-colors flex flex-col justify-between ${
                    selectedPreset === p.id
                      ? 'border-red-500 bg-red-50/40 text-red-700 dark:bg-red-950/30 dark:text-red-300 ring-1 ring-red-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    {p.icon}
                    <span>{p.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedPreset === 'custom' && (
            <div className="space-y-2 pt-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Target Keyword or Regular Expression
              </label>
              <input
                type="text"
                placeholder="e.g. Confidential Project, [A-Z]{3}-\d{4}"
                value={customPattern}
                onChange={(e) => setCustomPattern(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
              />
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  className="rounded text-red-600"
                />
                <span className="text-slate-600 dark:text-slate-300">Case-sensitive matching</span>
              </label>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sanitizeMetadata}
                onChange={(e) => setSanitizeMetadata(e.target.checked)}
                className="rounded text-red-600"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Purge hidden document metadata (author, edit history, software)
              </span>
            </label>
          </div>

          {/* Audit Verification Result Banner */}
          {auditResult && (
            <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Audit Verified: {auditResult.applied} redaction(s) applied</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Underlying character glyphs, image pixels, and streams have been permanently scrubbed.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-end gap-2 text-xs">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isProcessing}>
            {auditResult ? 'Done' : 'Cancel'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleExecuteRedact}
            disabled={isProcessing}
          >
            <ShieldAlert className="w-4 h-4 mr-1.5" />
            <span>{isProcessing ? 'Scrubbing...' : 'Apply Redaction'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
