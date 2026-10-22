import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Merge,
  Split,
  RotateCw,
  Highlighter,
  PenTool,
  FileSpreadsheet,
  Sparkles,
  Binary,
  Info,
  FileText,
  ScanText,
  Table,
  Image as ImageIcon,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Minimize2,
  Wrench,
  GitCompare,
  Camera,
  Accessibility,
  ChevronDown,
} from 'lucide-react';

export interface ViewerToolbarProps {
  // Page operations
  onOpenOrganize: () => void;
  onOpenMerge: () => void;
  onOpenSplit: () => void;
  onRotate: () => void;

  // Annotate & Edit
  isAnnotateActive: boolean;
  onToggleAnnotate: () => void;
  onOpenFormFill: () => void;
  onOpenWatermark: () => void;
  onOpenPageNumbers: () => void;
  onOpenMetadata: () => void;

  // Convert & OCR
  onOpenConvertOffice: () => void;
  onOpenOcr: () => void;
  onOpenTableExtract: () => void;
  onOpenConvertImages: () => void;

  // Security & Sign
  onOpenSignature: () => void;
  onOpenCertificate: () => void;
  onOpenSecurity: () => void;
  onOpenRedact: () => void;

  // Tools & Optimize
  onOpenCompress: () => void;
  onOpenRepair: () => void;
  onOpenCompare: () => void;
  onOpenCameraScan: () => void;
  onOpenBatch: () => void;
  onOpenA11y: () => void;

  // AI Assistant
  onOpenAi: () => void;
}

interface ToolItem {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
  action: () => void;
  isLocal: boolean;
}

interface CategoryDef {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  tools: ToolItem[];
}

export const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  onOpenOrganize,
  onOpenMerge,
  onOpenSplit,
  onRotate,
  isAnnotateActive,
  onToggleAnnotate,
  onOpenFormFill,
  onOpenWatermark,
  onOpenPageNumbers,
  onOpenMetadata,
  onOpenConvertOffice,
  onOpenOcr,
  onOpenTableExtract,
  onOpenConvertImages,
  onOpenSignature,
  onOpenCertificate,
  onOpenSecurity,
  onOpenRedact,
  onOpenCompress,
  onOpenRepair,
  onOpenCompare,
  onOpenCameraScan,
  onOpenBatch,
  onOpenA11y,
  onOpenAi,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close open dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const categories: CategoryDef[] = [
    {
      id: 'pages',
      name: 'Pages',
      icon: <Layers className="w-3.5 h-3.5 text-blue-500" />,
      color: 'blue',
      tools: [
        {
          id: 'organize',
          name: 'Organize Pages',
          desc: 'Drag & drop reorder, rotate & delete pages',
          icon: <Layers className="w-4 h-4 text-blue-500" />,
          action: onOpenOrganize,
          isLocal: true,
        },
        {
          id: 'merge',
          name: 'Merge Documents',
          desc: 'Combine multiple PDFs and images into one',
          icon: <Merge className="w-4 h-4 text-indigo-500" />,
          action: onOpenMerge,
          isLocal: true,
        },
        {
          id: 'split',
          name: 'Split Document',
          desc: 'Extract ranges or separate pages cleanly',
          icon: <Split className="w-4 h-4 text-rose-500" />,
          action: onOpenSplit,
          isLocal: true,
        },
        {
          id: 'rotate-view',
          name: 'Rotate Page View',
          desc: 'Rotate viewing orientation 90° clockwise',
          icon: <RotateCw className="w-4 h-4 text-sky-500" />,
          action: onRotate,
          isLocal: true,
        },
      ],
    },
    {
      id: 'edit',
      name: 'Edit & Forms',
      icon: <PenTool className="w-3.5 h-3.5 text-amber-500" />,
      color: 'amber',
      tools: [
        {
          id: 'annotate',
          name: isAnnotateActive ? 'Close Markup Tools' : 'Markup & Annotate',
          desc: 'Highlighters, vector pen, shapes and notes',
          icon: <Highlighter className="w-4 h-4 text-amber-500" />,
          action: onToggleAnnotate,
          isLocal: true,
        },
        {
          id: 'forms',
          name: 'Interactive Forms',
          desc: 'Fill AcroForms or build fillable fields',
          icon: <FileSpreadsheet className="w-4 h-4 text-green-500" />,
          action: onOpenFormFill,
          isLocal: true,
        },
        {
          id: 'watermark',
          name: 'Watermark',
          desc: 'Stamp custom text or transparent image stamps',
          icon: <Sparkles className="w-4 h-4 text-teal-500" />,
          action: onOpenWatermark,
          isLocal: true,
        },
        {
          id: 'page-numbers',
          name: 'Page Numbers & Bates',
          desc: 'Sequential Bates numbers, headers and footers',
          icon: <Binary className="w-4 h-4 text-blue-500" />,
          action: onOpenPageNumbers,
          isLocal: true,
        },
        {
          id: 'metadata',
          name: 'Document Info & Metadata',
          desc: 'Edit title, author, producer & properties',
          icon: <Info className="w-4 h-4 text-indigo-500" />,
          action: onOpenMetadata,
          isLocal: true,
        },
      ],
    },
    {
      id: 'convert',
      name: 'Convert & OCR',
      icon: <FileText className="w-3.5 h-3.5 text-cyan-500" />,
      color: 'cyan',
      tools: [
        {
          id: 'convert-office',
          name: 'Convert to Office',
          desc: 'Export to Word (.docx), Excel (.xlsx), Markdown',
          icon: <FileText className="w-4 h-4 text-blue-500" />,
          action: onOpenConvertOffice,
          isLocal: false,
        },
        {
          id: 'ocr',
          name: 'OCR Text Recognition',
          desc: 'Make scanned or raster PDFs searchable',
          icon: <ScanText className="w-4 h-4 text-orange-500" />,
          action: onOpenOcr,
          isLocal: false,
        },
        {
          id: 'tables',
          name: 'Extract Tables',
          desc: 'Export structured tables to CSV & Excel spreadsheets',
          icon: <Table className="w-4 h-4 text-emerald-500" />,
          action: onOpenTableExtract,
          isLocal: false,
        },
        {
          id: 'images',
          name: 'PDF & Images',
          desc: 'Convert pages to JPG/PNG or images to PDF',
          icon: <ImageIcon className="w-4 h-4 text-cyan-500" />,
          action: onOpenConvertImages,
          isLocal: true,
        },
      ],
    },
    {
      id: 'security',
      name: 'Security & Sign',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />,
      color: 'purple',
      tools: [
        {
          id: 'sign',
          name: 'E-Sign Document',
          desc: 'Draw, type, or place visual signatures',
          icon: <PenTool className="w-4 h-4 text-purple-500" />,
          action: onOpenSignature,
          isLocal: true,
        },
        {
          id: 'cert',
          name: 'Digital Certificate',
          desc: 'Cryptographic PKCS#12 certified digital signature',
          icon: <ShieldCheck className="w-4 h-4 text-purple-500" />,
          action: onOpenCertificate,
          isLocal: false,
        },
        {
          id: 'protect',
          name: 'Protect & Encrypt',
          desc: 'AES-256 password protection & permission control',
          icon: <Lock className="w-4 h-4 text-slate-500" />,
          action: onOpenSecurity,
          isLocal: true,
        },
        {
          id: 'redact',
          name: 'Permanent Redaction',
          desc: 'Certified byte-level removal of sensitive data',
          icon: <ShieldAlert className="w-4 h-4 text-red-500" />,
          action: onOpenRedact,
          isLocal: false,
        },
      ],
    },
    {
      id: 'tools',
      name: 'Tools & Utilities',
      icon: <Wrench className="w-3.5 h-3.5 text-emerald-500" />,
      color: 'emerald',
      tools: [
        {
          id: 'compress',
          name: 'Compress PDF',
          desc: 'Optimize file size with DPI & quality presets',
          icon: <Minimize2 className="w-4 h-4 text-emerald-500" />,
          action: onOpenCompress,
          isLocal: true,
        },
        {
          id: 'repair',
          name: 'Repair & Linearize',
          desc: 'Fix corrupted structures & Fast Web View',
          icon: <Wrench className="w-4 h-4 text-emerald-500" />,
          action: onOpenRepair,
          isLocal: false,
        },
        {
          id: 'compare',
          name: 'Compare Documents',
          desc: 'Visual & text diff between two PDF versions',
          icon: <GitCompare className="w-4 h-4 text-blue-500" />,
          action: onOpenCompare,
          isLocal: false,
        },
        {
          id: 'camera',
          name: 'Camera Scanner',
          desc: 'Capture and insert pages via webcam or camera',
          icon: <Camera className="w-4 h-4 text-sky-500" />,
          action: onOpenCameraScan,
          isLocal: true,
        },
        {
          id: 'batch',
          name: 'Batch Automation',
          desc: 'Automate multi-step pipelines on multiple files',
          icon: <Layers className="w-4 h-4 text-indigo-500" />,
          action: onOpenBatch,
          isLocal: false,
        },
        {
          id: 'a11y',
          name: 'Accessibility Audit',
          desc: 'WCAG 2.1 & PDF/UA compliance check',
          icon: <Accessibility className="w-4 h-4 text-teal-500" />,
          action: onOpenA11y,
          isLocal: true,
        },
      ],
    },
  ];

  const handleToggleMenu = (categoryId: string) => {
    setActiveMenu((prev) => (prev === categoryId ? null : categoryId));
  };

  const handleToolClick = (action: () => void) => {
    setActiveMenu(null);
    action();
  };

  return (
    <div
      ref={containerRef}
      className="h-11 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-4 flex items-center justify-between z-20 select-none shadow-xs"
    >
      {/* Left: Quick Toggle + Categorized Dropdown Groups */}
      <div className="flex items-center gap-1.5">
        {/* Quick Direct Action: Annotate Toggle */}
        <button
          onClick={onToggleAnnotate}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isAnnotateActive
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold ring-1 ring-amber-500/40 shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Toggle on-screen drawing, highlight, notes & shapes"
        >
          <Highlighter className="w-3.5 h-3.5 text-amber-500" />
          <span>Annotate</span>
        </button>

        {/* Vertical divider */}
        <div className="h-4 w-px bg-slate-200 dark:border-slate-800 dark:bg-slate-800 mx-1" />

        {/* Categorized Dropdown Menus */}
        {categories.map((cat) => {
          const isOpen = activeMenu === cat.id;
          return (
            <div key={cat.id} className="relative">
              <button
                onClick={() => handleToggleMenu(cat.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isOpen
                    ? 'bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-semibold shadow-xs ring-1 ring-slate-300 dark:ring-slate-700'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={`Open ${cat.name} tools`}
                aria-expanded={isOpen}
              >
                {cat.icon}
                <span>{cat.name}</span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-brand-500' : ''
                  }`}
                />
              </button>

              {/* Popover Menu */}
              {isOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 mb-1 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {cat.name} Tools
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {cat.tools.length} actions
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    {cat.tools.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => handleToolClick(tool.action)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700/80 flex items-center justify-center shrink-0 shadow-2xs transition-colors">
                          {tool.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                              {tool.name}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-full font-medium ${
                                tool.isLocal
                                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                                  : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                              }`}
                            >
                              {tool.isLocal ? 'Local' : 'Server'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {tool.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right: Featured AI Assistant & View Rotation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenAi}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-brand-950/40 dark:to-indigo-950/40 text-brand-600 dark:text-brand-300 hover:opacity-90 border border-brand-200 dark:border-brand-800 shadow-xs transition-opacity"
          title="AI Document Intelligence (Chat, Summarize & Extract)"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
          <span>AI Assistant</span>
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

        <button
          onClick={onRotate}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Rotate View (90° Clockwise)"
        >
          <RotateCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Rotate</span>
        </button>
      </div>
    </div>
  );
};
