import React, { useState } from 'react';
import { Sparkles, Check, X } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { applyWatermark } from './pageDecorations';
import { Button } from '../../components/ui/Button';

export const WatermarkModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { document: activeDoc, setDocument } = useWorkspaceStore();
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.2);
  const [rotation, setRotation] = useState(45);
  const [tiled, setTiled] = useState(false);
  const [colorHex, setColorHex] = useState('#94a3b8');
  const [pageRange, setPageRange] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !activeDoc) return null;

  const handleApply = async () => {
    if (!text.trim()) {
      alert('Please enter watermark text.');
      return;
    }

    setIsProcessing(true);
    try {
      const updatedBytes = await applyWatermark(activeDoc.data, {
        text: text.trim(),
        fontSize,
        opacity,
        rotation,
        tiled,
        colorHex,
        pageRange: pageRange.trim() || undefined,
      });

      setDocument({
        ...activeDoc,
        data: updatedBytes,
        size: updatedBytes.byteLength,
      });
      onClose();
    } catch (err: any) {
      alert(`Watermark failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-50 dark:bg-teal-950/60 text-teal-600 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Watermark Document
              </h3>
              <p className="text-xs text-slate-500">
                Add text stamps or repetitive background watermarks.
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
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Watermark Text
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. CONFIDENTIAL, DRAFT, DO NOT COPY"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Font Size ({fontSize}pt)
              </label>
              <input
                type="range"
                min="20"
                max="90"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Opacity ({Math.round(opacity * 100)}%)
              </label>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Rotation Angle ({rotation}°)
              </label>
              <input
                type="range"
                min="0"
                max="90"
                step="15"
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Color
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {['#94a3b8', '#ef4444', '#3b82f6', '#10b981', '#0f172a'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColorHex(c)}
                    className={`w-5 h-5 rounded-full ${
                      colorHex === c ? 'ring-2 ring-brand-500 ring-offset-1' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={tiled}
                onChange={(e) => setTiled(e.target.checked)}
                className="rounded text-brand-600"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Tiled Pattern (Repeat across entire page)
              </span>
            </label>

            <div>
              <label className="text-[11px] text-slate-500 block mb-1">
                Page Range (Optional, e.g. "1-3, 5")
              </label>
              <input
                type="text"
                placeholder="All pages"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs"
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
            <span>{isProcessing ? 'Applying...' : 'Apply Watermark'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
