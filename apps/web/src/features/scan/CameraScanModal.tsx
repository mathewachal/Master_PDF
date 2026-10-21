import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  AlertCircle,
  Loader2,
  X,
  FileCheck,
  Trash2,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { imagesToPdf, ImageInput } from '../convert/imageConversion';
import { Button } from '../../components/ui/Button';

export const CameraScanModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { setDocument } = useWorkspaceStore();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPages, setCapturedPages] = useState<Array<{ dataUrl: string; data: Uint8Array }>>([]);
  const [isCompiling, setIsCompiling] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setCameraError(
        'Unable to access camera. Please check browser camera permissions or device availability.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Document enhance: boost contrast
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const contrast = 1.2;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    for (let i = 0; i < data.length; i += 4) {
      data[i] = factor * (data[i] - 128) + 128;
      data[i + 1] = factor * (data[i + 1] - 128) + 128;
      data[i + 2] = factor * (data[i + 2] - 128) + 128;
    }
    ctx.putImageData(imageData, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    // Convert dataUrl to Uint8Array
    const binStr = atob(dataUrl.split(',')[1]);
    const len = binStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }

    setCapturedPages((prev) => [...prev, { dataUrl, data: bytes }]);
  };

  const handleRemovePage = (idx: number) => {
    setCapturedPages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCompilePdf = async () => {
    if (capturedPages.length === 0) return;
    setIsCompiling(true);
    try {
      const inputs: ImageInput[] = capturedPages.map((p, idx) => ({
        name: `page_${idx + 1}.jpg`,
        type: 'image/jpeg',
        data: p.data,
      }));

      const pdfBytes = await imagesToPdf(inputs);
      const filename = `Scanned_Document_${Date.now()}.pdf`;

      setDocument({
        name: filename,
        data: pdfBytes,
        size: pdfBytes.byteLength,
        type: 'application/pdf',
        pageCount: capturedPages.length,
        lastModified: Date.now(),
      });

      stopCamera();
      onClose();
    } catch (err: any) {
      alert(`Failed to compile PDF: ${err.message}`);
    } finally {
      setIsCompiling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Scan-to-PDF Camera Scanner
              </h2>
              <p className="text-xs text-slate-500">
                Capture physical documents and invoices with auto-contrast enhancement.
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

        {/* Viewport */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {cameraError ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-3 text-xs text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <span>{cameraError}</span>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder frame overlay */}
              <div className="absolute inset-8 border-2 border-white/60 rounded-xl pointer-events-none" />

              {/* Capture Button Overlay */}
              <div className="absolute bottom-4 inset-x-0 flex justify-center">
                <button
                  type="button"
                  onClick={handleCapture}
                  className="w-14 h-14 rounded-full border-4 border-white bg-red-500 hover:bg-red-600 shadow-xl transition-transform active:scale-95 flex items-center justify-center"
                >
                  <div className="w-6 h-6 rounded-full bg-white" />
                </button>
              </div>
            </div>
          )}

          {/* Captured Pages Strip */}
          {capturedPages.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Captured Pages ({capturedPages.length})
              </span>
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {capturedPages.map((p, idx) => (
                  <div key={idx} className="relative group shrink-0">
                    <img
                      src={p.dataUrl}
                      alt={`Page ${idx + 1}`}
                      className="w-20 h-28 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                    />
                    <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                      Page {idx + 1}
                    </div>
                    <button
                      onClick={() => handleRemovePage(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCompilePdf}
            disabled={isCompiling || capturedPages.length === 0}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isCompiling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Compiling PDF...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Open {capturedPages.length} Page(s) in Editor</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
