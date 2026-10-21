import React, { useState } from 'react';
import { Hash, Check, X } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import {
  applyPageNumbers,
  applyBatesNumbering,
  PageNumberPosition,
} from './pageDecorations';
import { Button } from '../../components/ui/Button';

export const PageNumberModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { document: activeDoc, setDocument } = useWorkspaceStore();
  const [mode, setMode] = useState<'standard' | 'bates'>('standard');
  const [position, setPosition] = useState<PageNumberPosition>('bottom-center');
  const [format, setFormat] = useState('Page {n} of {total}');
  const [batesPrefix, setBatesPrefix] = useState('CONF-');
  const [startNumber, setStartNumber] = useState(1);
  const [numDigits, setNumDigits] = useState(6);
  const [fontSize, setFontSize] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !activeDoc) return null;

  const handleApply = async () => {
    setIsProcessing(true);
    try {
      let updatedBytes: Uint8Array;

      if (mode === 'standard') {
        updatedBytes = await applyPageNumbers(activeDoc.data, {
          format,
          position,
          fontSize,
          startNumber,
        });
      } else {
        updatedBytes = await applyBatesNumbering(activeDoc.data, {
          prefix: batesPrefix,
          position,
          fontSize,
          startNumber,
          numDigits,
        });
      }

      setDocument({
        ...activeDoc,
        data: updatedBytes,
        size: updatedBytes.byteLength,
      });

      onClose();
    } catch (err: any) {
      alert(`Failed to add page numbers: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const positions: { id: PageNumberPosition; label: string }[] = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-center', label: 'Top Center' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-center', label: 'Bottom Center' },
    { id: 'bottom-right', label: 'Bottom Right' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-lg">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Page & Bates Numbering
              </h3>
              <p className="text-xs text-slate-500">
                Add standard headers/footers or legal Bates numbering.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="px-6 pt-4 pb-2">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setMode('standard')}
              className={`py-2 rounded-lg font-semibold transition-colors ${
                mode === 'standard'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Standard Numbers
            </button>
            <button
              onClick={() => setMode('bates')}
              className={`py-2 rounded-lg font-semibold transition-colors ${
                mode === 'bates'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Bates Numbering
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 text-xs">
          {mode === 'standard' ? (
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Format Template
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Page {n} of {total}',
                    '{n} / {total}',
                    'Page {n}',
                    '- {n} -',
                  ].map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setFormat(fmt)}
                      className={`p-2 rounded-lg border text-left font-mono ${
                        format === fmt
                          ? 'border-brand-500 bg-brand-50/40 text-brand-700'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600'
                      }`}
                    >
                      {fmt.replace('{n}', '1').replace('{total}', String(activeDoc.pageCount || 10))}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Bates Prefix
                  </label>
                  <input
                    type="text"
                    value={batesPrefix}
                    onChange={(e) => setBatesPrefix(e.target.value)}
                    placeholder="e.g. CONF-"
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Number of Digits
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={10}
                    value={numDigits}
                    onChange={(e) => setNumDigits(parseInt(e.target.value, 10) || 6)}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Preview: {batesPrefix}{String(startNumber).padStart(numDigits, '0')}
              </p>
            </div>
          )}

          {/* Position Matrix Selector */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Placement Position
            </label>
            <div className="grid grid-cols-3 gap-2">
              {positions.map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => setPosition(pos.id)}
                  className={`py-2 px-1 rounded-lg border text-center font-medium transition-colors ${
                    position === pos.id
                      ? 'border-brand-500 bg-brand-50/50 text-brand-700 ring-1 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Start Number
              </label>
              <input
                type="number"
                min={1}
                value={startNumber}
                onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Font Size ({fontSize}pt)
              </label>
              <input
                type="number"
                min={8}
                max={24}
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value, 10) || 10)}
                className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-end gap-2 text-xs">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleApply} disabled={isProcessing}>
            <Check className="w-4 h-4 mr-1.5" />
            <span>{isProcessing ? 'Adding Numbers...' : 'Apply Numbers'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
