import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Download,
  UploadCloud,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { getPlatform } from '../../platform';
import { imagesToPdf, pdfToImages } from './imageConversion';
import { Button } from '../../components/ui/Button';

export const ImageConvertModal: React.FC<{
  isOpen: boolean;
  initialMode?: 'img_to_pdf' | 'pdf_to_img';
  onClose: () => void;
}> = ({ isOpen, initialMode = 'pdf_to_img', onClose }) => {
  const { document: activeDoc, setDocument } = useWorkspaceStore();
  const [mode, setMode] = useState<'img_to_pdf' | 'pdf_to_img'>(initialMode);
  const [selectedFormat, setSelectedFormat] = useState<'png' | 'jpeg'>('png');
  const [imagesList, setImagesList] = useState<{ name: string; type: string; data: Uint8Array }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const platform = getPlatform();

  if (!isOpen) return null;

  const handlePickImages = async () => {
    try {
      const files = await platform.file.openFile({
        accept: ['.png', '.jpg', '.jpeg', '.webp', 'image/*'],
        multiple: true,
      });
      setImagesList(files.map((f) => ({ name: f.name, type: f.type, data: f.data })));
    } catch (err) {
      console.error('Failed to pick images:', err);
    }
  };

  const handleConvertImagesToPdf = async () => {
    if (imagesList.length === 0) {
      alert('Please select at least one image.');
      return;
    }

    setIsProcessing(true);
    try {
      const pdfBytes = await imagesToPdf(imagesList);
      const name = `converted_${Date.now()}.pdf`;

      setDocument({
        name,
        size: pdfBytes.byteLength,
        type: 'application/pdf',
        data: pdfBytes,
        pageCount: imagesList.length,
        lastModified: Date.now(),
      });
      onClose();
    } catch (err: any) {
      alert(`Image conversion failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportPdfToImages = async () => {
    if (!activeDoc) {
      alert('No active PDF loaded.');
      return;
    }

    setIsProcessing(true);
    try {
      const pageImages = await pdfToImages(activeDoc.data, selectedFormat, 2.0);

      for (const item of pageImages) {
        const ext = selectedFormat === 'jpeg' ? 'jpg' : 'png';
        const filename = `${activeDoc.name.replace(/\.pdf$/i, '')}_page_${item.pageNumber}.${ext}`;
        await platform.file.saveFile(item.blob, filename, `image/${selectedFormat}`);
      }
      onClose();
    } catch (err: any) {
      alert(`Failed to export PDF pages: ${err.message}`);
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
            <div className="p-2 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 rounded-lg">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Image & PDF Conversions
              </h3>
              <p className="text-xs text-slate-500">
                Client-side offline conversion between images and PDF.
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
              onClick={() => setMode('pdf_to_img')}
              disabled={!activeDoc}
              className={`py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'pdf_to_img'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm'
                  : 'text-slate-500 disabled:opacity-40'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF to Images</span>
            </button>
            <button
              onClick={() => setMode('img_to_pdf')}
              className={`py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'img_to_pdf'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Images to PDF</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {mode === 'pdf_to_img' ? (
            <div className="space-y-3">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Target Image Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedFormat('png')}
                  className={`p-3 rounded-xl border text-left font-medium transition-colors ${
                    selectedFormat === 'png'
                      ? 'border-brand-500 bg-brand-50/30 text-brand-700'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600'
                  }`}
                >
                  <span className="block font-bold">PNG Image</span>
                  <span className="text-[11px] text-slate-400">Lossless, best for text & charts</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFormat('jpeg')}
                  className={`p-3 rounded-xl border text-left font-medium transition-colors ${
                    selectedFormat === 'jpeg'
                      ? 'border-brand-500 bg-brand-50/30 text-brand-700'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600'
                  }`}
                >
                  <span className="block font-bold">JPEG Image</span>
                  <span className="text-[11px] text-slate-400">Smaller size, best for photos</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                Each page will be rendered at crisp 2x resolution and downloaded directly.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {imagesList.length === 0 ? (
                <div
                  onClick={handlePickImages}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-brand-500 transition-colors"
                >
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Click to select images (PNG, JPG, WebP)
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Combine multiple photos into one document
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
                    <span>{imagesList.length} image(s) selected:</span>
                    <button
                      onClick={handlePickImages}
                      className="text-brand-600 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                    {imagesList.map((img, i) => (
                      <div key={i} className="flex items-center gap-2 truncate text-slate-600 dark:text-slate-300">
                        <ImageIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{img.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-end gap-2 text-xs">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>

          {mode === 'pdf_to_img' ? (
            <Button variant="primary" size="sm" onClick={handleExportPdfToImages} disabled={isProcessing}>
              <Download className="w-4 h-4 mr-1.5" />
              <span>{isProcessing ? 'Rendering...' : 'Export Pages'}</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleConvertImagesToPdf}
              disabled={isProcessing || imagesList.length === 0}
            >
              <Check className="w-4 h-4 mr-1.5" />
              <span>{isProcessing ? 'Converting...' : 'Create PDF'}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
