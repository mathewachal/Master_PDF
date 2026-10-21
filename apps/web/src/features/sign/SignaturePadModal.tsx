import React, { useState, useRef, useEffect } from 'react';
import {
  PenTool,
  Type,
  Upload,
  Eraser,
  Check,
  X,
} from 'lucide-react';
import { getPlatform } from '../../platform';
import { SavedSignature, SignatureMode } from './types';
import { Button } from '../../components/ui/Button';

export const SignaturePadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectSignature: (dataUrl: string) => void;
}> = ({ isOpen, onClose, onSelectSignature }) => {
  const [mode, setMode] = useState<SignatureMode>('draw');
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState('cursive');
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const platform = getPlatform();

  // Load saved signatures from StorageService
  useEffect(() => {
    if (!isOpen) return;
    platform.storage.getItem<SavedSignature[]>('saved_signatures').then((items) => {
      if (items) setSavedSignatures(items);
    });
  }, [isOpen]);

  // Setup drawing canvas
  useEffect(() => {
    if (mode !== 'draw' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0f172a';
    }
  }, [mode]);

  if (!isOpen) return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    }
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const handleClearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const generateTypedSignatureDataUrl = (): string => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 400;
    tempCanvas.height = 120;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return '';

    ctx.font = `italic 42px ${selectedFont}`;
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName || 'Signature', 200, 60);

    return tempCanvas.toDataURL('image/png');
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onSelectSignature(dataUrl);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmSignature = async () => {
    let dataUrl = '';

    if (mode === 'draw' && canvasRef.current) {
      dataUrl = canvasRef.current.toDataURL('image/png');
    } else if (mode === 'type') {
      dataUrl = generateTypedSignatureDataUrl();
    }

    if (!dataUrl) return;

    // Save to persistent signature library
    const newSaved: SavedSignature = {
      id: `sig-${Date.now()}`,
      name: typedName || 'Signature',
      dataUrl,
      type: mode,
      createdAt: Date.now(),
    };

    const updated = [newSaved, ...savedSignatures.slice(0, 5)];
    setSavedSignatures(updated);
    await platform.storage.setItem('saved_signatures', updated);

    onSelectSignature(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 rounded-lg">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Create E-Signature
              </h3>
              <p className="text-xs text-slate-500">
                Draw, type, or upload your electronic signature.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="px-6 pt-4 pb-2">
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setMode('draw')}
              className={`py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'draw'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Draw</span>
            </button>
            <button
              onClick={() => setMode('type')}
              className={`py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'type'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Type</span>
            </button>
            <button
              onClick={() => setMode('upload')}
              className={`py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'upload'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          {mode === 'draw' && (
            <div className="space-y-2">
              <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={420}
                  height={150}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="w-full h-[150px] cursor-crosshair touch-none"
                />
                <button
                  onClick={handleClearCanvas}
                  className="absolute bottom-2 right-2 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1 shadow-sm"
                >
                  <Eraser className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Draw with your mouse, trackpad, or finger on touch screens.
              </p>
            </div>
          )}

          {mode === 'type' && (
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Handwriting Font Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['cursive', 'serif', 'sans-serif'].map((font) => (
                    <button
                      key={font}
                      onClick={() => setSelectedFont(font)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        selectedFont === font
                          ? 'border-brand-500 bg-brand-50/40 text-brand-700 ring-1 ring-brand-500'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                      style={{ fontFamily: font, fontStyle: 'italic', fontSize: '16px' }}
                    >
                      {typedName || 'Signature'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {mode === 'upload' && (
            <div className="space-y-2">
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Upload signature image
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">PNG or JPG</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleUploadImage}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Saved Signature Library */}
          {savedSignatures.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                Saved Signatures
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {savedSignatures.map((sig) => (
                  <div
                    key={sig.id}
                    onClick={() => {
                      onSelectSignature(sig.dataUrl);
                      onClose();
                    }}
                    className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-brand-500 cursor-pointer bg-slate-50 dark:bg-slate-800 shrink-0 w-28 h-14 flex items-center justify-center overflow-hidden"
                  >
                    <img src={sig.dataUrl} alt={sig.name} className="max-h-full max-w-full object-contain" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-end gap-2 text-xs">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          {mode !== 'upload' && (
            <Button variant="primary" size="sm" onClick={handleConfirmSignature}>
              <Check className="w-4 h-4 mr-1.5" />
              <span>Use Signature</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
