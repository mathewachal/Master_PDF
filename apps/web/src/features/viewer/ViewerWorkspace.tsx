import React, { useEffect, useRef, useState } from 'react';
import {
  RotateCw,
  Lock,
  Minimize2,
  Split,
  Merge,
  Image as ImageIcon,
  Layers,
  KeyRound,
  AlertCircle,
  Highlighter,
  PenTool,
  FileSpreadsheet,
  Sparkles,
  Binary,
  ShieldAlert,
  Info,
} from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { loadPdfDocument } from '../../core/pdf/engine';
import { renderPageToCanvas } from '../../core/pdf/render';
import { Button } from '../../components/ui/Button';

// Phase 1 Modals
import { OrganizeModal } from '../organize/OrganizeModal';
import { MergeModal } from '../organize/MergeModal';
import { SplitModal } from '../organize/SplitModal';
import { CompressModal } from '../optimize/CompressModal';
import { SecurityModal } from '../security/SecurityModal';
import { ImageConvertModal } from '../convert/ImageConvertModal';

// Phase 2 Annotate, Forms & Sign Components
import { AnnotationToolbar } from '../annotate/AnnotationToolbar';
import { AnnotationOverlay } from '../annotate/AnnotationOverlay';
import { flattenAnnotationsToPdf } from '../annotate/flatten';
import { useAnnotationStore } from '../annotate/annotationStore';
import { FormFillModal } from '../forms/FormFillModal';
import { SignaturePadModal } from '../sign/SignaturePadModal';
import { SignaturePlacementOverlay } from '../sign/SignaturePlacementOverlay';

// Phase 3 Edit, Watermark & Redaction Modals
import { WatermarkModal } from '../edit/WatermarkModal';
import { PageNumberModal } from '../edit/PageNumberModal';
import { RedactionModal } from '../edit/RedactionModal';
import { MetadataModal } from '../edit/MetadataModal';

export const ViewerWorkspace: React.FC = () => {
  const {
    document: activeDoc,
    currentPage,
    setCurrentPage,
    scale,
    rotation,
    viewMode,
    activeTool,
    setActiveTool,
    setRotation,
    setDocument,
  } = useWorkspaceStore();

  const { annotations, clearAll: clearAllAnnotations } = useAnnotationStore();

  const [pdfProxy, setPdfProxy] = useState<PDFDocumentProxy | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 595, height: 842 });

  // Phase 1 Modals
  const [showOrganize, setShowOrganize] = useState(false);
  const [showMerge, setShowMerge] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const [showCompress, setShowCompress] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showConvert, setShowConvert] = useState(false);

  // Phase 2 Components & Modals
  const [showAnnotateToolbar, setShowAnnotateToolbar] = useState(false);
  const [showFormFill, setShowFormFill] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [activeSignatureUrl, setActiveSignatureUrl] = useState<string | null>(null);

  // Phase 3 Edit, Watermark & Redaction Modals
  const [showWatermark, setShowWatermark] = useState(false);
  const [showPageNumbers, setShowPageNumbers] = useState(false);
  const [showRedaction, setShowRedaction] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

  // References for rendering single page canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load document whenever activeDoc or password changes
  useEffect(() => {
    if (!activeDoc) {
      setPdfProxy(null);
      return;
    }

    let isMounted = true;
    setLoadingError(null);
    setPasswordRequired(false);

    loadPdfDocument(activeDoc.data, passwordInput || undefined)
      .then(({ doc, numPages }) => {
        if (!isMounted) return;
        setPdfProxy(doc);
        if (activeDoc.pageCount !== numPages) {
          setDocument({
            ...activeDoc,
            pageCount: numPages,
          });
        }
      })
      .catch((err: any) => {
        if (!isMounted) return;
        if (err && (err.name === 'PasswordException' || err.message?.includes('password'))) {
          setPasswordRequired(true);
        } else {
          setLoadingError(err.message || 'Failed to render PDF document');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeDoc?.data, passwordInput]);

  // Render current page when page, scale, or rotation changes
  useEffect(() => {
    if (!pdfProxy || !canvasRef.current || viewMode !== 'single') return;

    let isCancelled = false;
    setIsRendering(true);

    pdfProxy.getPage(currentPage).then((page) => {
      if (isCancelled || !canvasRef.current) return;
      renderPageToCanvas(page, canvasRef.current, scale, rotation)
        .then((res) => {
          if (!isCancelled) {
            setCanvasDimensions(res);
          }
        })
        .catch((err) => {
          if (!isCancelled) console.warn('Canvas render error:', err);
        })
        .finally(() => {
          if (!isCancelled) setIsRendering(false);
        });
    });

    return () => {
      isCancelled = true;
    };
  }, [pdfProxy, currentPage, scale, rotation, viewMode]);

  // Handle active tool modals from command palette / home screen
  useEffect(() => {
    if (!activeTool) return;
    if (activeTool === 'organize' || activeTool === 'rotate' || activeTool === 'delete-pages') {
      setShowOrganize(true);
    } else if (activeTool === 'merge') {
      setShowMerge(true);
    } else if (activeTool === 'split') {
      setShowSplit(true);
    } else if (activeTool === 'compress') {
      setShowCompress(true);
    } else if (activeTool === 'protect' || activeTool === 'unlock') {
      setShowSecurity(true);
    } else if (activeTool === 'convert-office') {
      setShowConvert(true);
    } else if (activeTool === 'annotate') {
      setShowAnnotateToolbar(true);
    } else if (activeTool === 'sign') {
      setShowSignaturePad(true);
    } else if (activeTool === 'watermark') {
      setShowWatermark(true);
    } else if (activeTool === 'page-numbers') {
      setShowPageNumbers(true);
    } else if (activeTool === 'redact-deep') {
      setShowRedaction(true);
    } else if (activeTool === 'metadata') {
      setShowMetadata(true);
    }
  }, [activeTool]);

  const handleFlattenAnnotations = async () => {
    if (!activeDoc || annotations.length === 0) {
      alert('No annotations to flatten.');
      return;
    }

    try {
      const flattenedBytes = await flattenAnnotationsToPdf(activeDoc.data, annotations);
      setDocument({
        ...activeDoc,
        data: flattenedBytes,
        size: flattenedBytes.byteLength,
      });
      clearAllAnnotations();
      alert('Annotations successfully flattened into document!');
    } catch (err: any) {
      alert(`Flattening failed: ${err.message}`);
    }
  };

  if (!activeDoc) return null;

  return (
    <div className="flex-1 flex flex-col bg-slate-100/80 dark:bg-slate-950 overflow-hidden relative">
      {/* Top Contextual Action Toolbar */}
      <div className="h-11 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between z-10 select-none">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => setShowOrganize(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            <span>Organize</span>
          </button>
          <button
            onClick={() => setShowAnnotateToolbar(!showAnnotateToolbar)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showAnnotateToolbar
                ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 font-semibold ring-1 ring-brand-500'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5 text-amber-500" />
            <span>Annotate</span>
          </button>
          <button
            onClick={() => setShowSignaturePad(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <PenTool className="w-3.5 h-3.5 text-purple-500" />
            <span>Sign</span>
          </button>
          <button
            onClick={() => setShowFormFill(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
            <span>Forms</span>
          </button>
          <button
            onClick={() => setShowMerge(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Merge className="w-3.5 h-3.5 text-indigo-500" />
            <span>Merge</span>
          </button>
          <button
            onClick={() => setShowSplit(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Split className="w-3.5 h-3.5 text-rose-500" />
            <span>Split</span>
          </button>
          <button
            onClick={() => setShowCompress(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Minimize2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Compress</span>
          </button>
          <button
            onClick={() => setShowConvert(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ImageIcon className="w-3.5 h-3.5 text-cyan-500" />
            <span>Images</span>
          </button>
          <button
            onClick={() => setShowSecurity(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Protect</span>
          </button>
          <button
            onClick={() => setShowWatermark(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            <span>Watermark</span>
          </button>
          <button
            onClick={() => setShowPageNumbers(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Binary className="w-3.5 h-3.5 text-blue-500" />
            <span>Page # & Bates</span>
          </button>
          <button
            onClick={() => setShowRedaction(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
            <span>Redact</span>
          </button>
          <button
            onClick={() => setShowMetadata(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>Info</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="text-xs"
            title="Rotate Page View"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Rotate</span>
          </Button>
        </div>
      </div>

      {/* Phase 2: Embedded Annotation Toolbar */}
      {showAnnotateToolbar && (
        <AnnotationToolbar onFlatten={handleFlattenAnnotations} />
      )}

      {/* Viewport Area */}
      <div className="flex-1 overflow-auto p-8 flex justify-center items-start">
        {passwordRequired ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Password Protected PDF
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter the password to view {activeDoc.name}.
              </p>
            </div>
            <input
              type="password"
              placeholder="Enter password..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        ) : loadingError ? (
          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 rounded-2xl p-6 shadow-xl max-w-sm w-full text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Rendering Error
            </h3>
            <p className="text-xs text-slate-500">{loadingError}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            {viewMode === 'single' ? (
              <div className="relative shadow-2xl rounded-sm border border-slate-200/80 dark:border-slate-800 bg-white">
                <canvas ref={canvasRef} className="block transition-all" />

                {/* Phase 2: Interactive Annotation Overlay */}
                <AnnotationOverlay
                  pageNumber={currentPage}
                  width={canvasDimensions.width * scale}
                  height={canvasDimensions.height * scale}
                  scale={scale}
                />

                {/* Phase 2: E-Signature Placement Overlay */}
                {activeSignatureUrl && (
                  <SignaturePlacementOverlay
                    pageNumber={currentPage}
                    dataUrl={activeSignatureUrl}
                    scale={scale}
                    onFinished={() => setActiveSignatureUrl(null)}
                  />
                )}

                {isRendering && (
                  <div className="absolute inset-0 bg-white/40 dark:bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center text-xs font-semibold text-slate-600">
                    Rendering...
                  </div>
                )}
              </div>
            ) : (
              // Continuous scroll view mode
              <div className="flex flex-col gap-6">
                {Array.from({ length: activeDoc.pageCount || 1 }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <ContinuousPageCanvas
                      key={pageNum}
                      pdfProxy={pdfProxy}
                      pageNumber={pageNum}
                      scale={scale}
                      rotation={rotation}
                      onVisible={() => setCurrentPage(pageNum)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Phase 1 Modals */}
      <OrganizeModal
        isOpen={showOrganize}
        onClose={() => {
          setShowOrganize(false);
          setActiveTool(null);
        }}
      />
      <MergeModal
        isOpen={showMerge}
        onClose={() => {
          setShowMerge(false);
          setActiveTool(null);
        }}
      />
      <SplitModal
        isOpen={showSplit}
        onClose={() => {
          setShowSplit(false);
          setActiveTool(null);
        }}
      />
      <CompressModal
        isOpen={showCompress}
        onClose={() => {
          setShowCompress(false);
          setActiveTool(null);
        }}
      />
      <SecurityModal
        isOpen={showSecurity}
        onClose={() => {
          setShowSecurity(false);
          setActiveTool(null);
        }}
      />
      <ImageConvertModal
        isOpen={showConvert}
        onClose={() => {
          setShowConvert(false);
          setActiveTool(null);
        }}
      />

      {/* Phase 2 Modals */}
      <FormFillModal
        isOpen={showFormFill}
        onClose={() => {
          setShowFormFill(false);
          setActiveTool(null);
        }}
      />
      <SignaturePadModal
        isOpen={showSignaturePad}
        onClose={() => {
          setShowSignaturePad(false);
          setActiveTool(null);
        }}
        onSelectSignature={(dataUrl) => {
          setActiveSignatureUrl(dataUrl);
        }}
      />

      {/* Phase 3 Modals */}
      <WatermarkModal
        isOpen={showWatermark}
        onClose={() => {
          setShowWatermark(false);
          setActiveTool(null);
        }}
      />
      <PageNumberModal
        isOpen={showPageNumbers}
        onClose={() => {
          setShowPageNumbers(false);
          setActiveTool(null);
        }}
      />
      <RedactionModal
        isOpen={showRedaction}
        onClose={() => {
          setShowRedaction(false);
          setActiveTool(null);
        }}
      />
      <MetadataModal
        isOpen={showMetadata}
        onClose={() => {
          setShowMetadata(false);
          setActiveTool(null);
        }}
      />
    </div>
  );
};

// Continuous Page Canvas Item Component with Annotation Support
const ContinuousPageCanvas: React.FC<{
  pdfProxy: PDFDocumentProxy | null;
  pageNumber: number;
  scale: number;
  rotation: number;
  onVisible: () => void;
}> = ({ pdfProxy, pageNumber, scale, rotation, onVisible }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 595, height: 842 });

  useEffect(() => {
    if (!pdfProxy || !canvasRef.current) return;
    let isCancelled = false;

    pdfProxy.getPage(pageNumber).then((page) => {
      if (isCancelled || !canvasRef.current) return;
      renderPageToCanvas(page, canvasRef.current, scale, rotation)
        .then((res) => {
          if (!isCancelled) setDimensions(res);
        })
        .catch((err) => {
          if (!isCancelled) console.warn('Continuous canvas render error:', err);
        });
    });

    return () => {
      isCancelled = true;
    };
  }, [pdfProxy, pageNumber, scale, rotation]);

  return (
    <div
      onMouseEnter={onVisible}
      className="relative shadow-2xl rounded-sm border border-slate-200/80 dark:border-slate-800 bg-white"
    >
      <canvas ref={canvasRef} className="block transition-all" />
      <AnnotationOverlay
        pageNumber={pageNumber}
        width={dimensions.width * scale}
        height={dimensions.height * scale}
        scale={scale}
      />
    </div>
  );
};
