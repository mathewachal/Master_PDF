import React, { useState } from 'react';
import { Check, X, Calendar, Move } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { embedSignatureToPdf } from './signatureOperations';
import { Button } from '../../components/ui/Button';

export const SignaturePlacementOverlay: React.FC<{
  pageNumber: number;
  dataUrl: string;
  scale: number;
  onFinished: () => void;
}> = ({ pageNumber, dataUrl, scale, onFinished }) => {
  const { document: activeDoc, setDocument } = useWorkspaceStore();
  const [posX, setPosX] = useState(100);
  const [posY, setPosY] = useState(150);
  const [width, setWidth] = useState(160);
  const [includeDate, setIncludeDate] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  if (!activeDoc) return null;

  const height = width * 0.45; // standard signature aspect ratio

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - posX * scale,
      y: e.clientY - posY * scale,
    });
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const newX = (e.clientX - dragOffset.x) / scale;
    const newY = (e.clientY - dragOffset.y) / scale;
    setPosX(Math.max(10, newX));
    setPosY(Math.max(10, newY));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handleBurnSignature = async () => {
    setIsProcessing(true);
    try {
      const updatedBytes = await embedSignatureToPdf(activeDoc.data, {
        pageNumber,
        x: posX,
        y: posY,
        width,
        height,
        dataUrl,
        includeDateStamp: includeDate,
        dateStampText: new Date().toLocaleDateString(),
      });

      setDocument({
        ...activeDoc,
        data: updatedBytes,
        size: updatedBytes.byteLength,
      });

      onFinished();
    } catch (err: any) {
      alert(`Failed to apply signature: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-auto z-30 select-none">
      {/* Draggable Placement Box */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          left: `${posX * scale}px`,
          top: `${posY * scale}px`,
          width: `${width * scale}px`,
        }}
        className="absolute cursor-move border-2 border-brand-500 rounded-lg p-2 bg-white/90 dark:bg-slate-900/90 shadow-2xl backdrop-blur-sm group"
      >
        <div className="flex items-center justify-between text-[10px] text-brand-600 font-bold mb-1">
          <span className="flex items-center gap-1">
            <Move className="w-3 h-3" />
            <span>Drag to Position</span>
          </span>
        </div>

        <img
          src={dataUrl}
          alt="Signature Preview"
          className="w-full h-auto object-contain pointer-events-none"
        />

        {includeDate && (
          <div className="text-[10px] font-mono text-slate-500 text-center mt-1 border-t border-slate-100 dark:border-slate-800 pt-0.5">
            Signed: {new Date().toLocaleDateString()}
          </div>
        )}

        {/* Floating Controls Bar */}
        <div className="absolute -top-12 left-0 right-0 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-lg text-xs pointer-events-auto">
          <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 px-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeDate}
              onChange={(e) => setIncludeDate(e.target.checked)}
              className="rounded text-brand-600"
            />
            <Calendar className="w-3 h-3" />
            <span>Date</span>
          </label>

          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
            <button
              type="button"
              onClick={() => setWidth((w) => Math.max(80, w - 20))}
              className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-[10px] font-bold"
              title="Make Smaller"
            >
              -
            </button>
            <span className="text-[10px] text-slate-400 font-mono">{width}px</span>
            <button
              type="button"
              onClick={() => setWidth((w) => Math.min(350, w + 20))}
              className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-[10px] font-bold"
              title="Make Larger"
            >
              +
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onFinished}
            disabled={isProcessing}
            className="p-1 h-6"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleBurnSignature}
            disabled={isProcessing}
            className="h-6 text-[11px] px-2"
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            <span>{isProcessing ? 'Saving...' : 'Apply'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
