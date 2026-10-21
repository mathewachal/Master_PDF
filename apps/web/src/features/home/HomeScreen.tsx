import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  Merge,
  Split,
  RotateCw,
  Trash2,
  Highlighter,
  PenTool,
  Lock,
  Minimize2,
  ScanText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { getPlatform } from '../../platform';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface ToolDef {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
  isLocal: boolean;
  color: string;
}

interface CategoryGroup {
  name: string;
  tools: ToolDef[];
}

export const HomeScreen: React.FC = () => {
  const { setDocument, setActiveTool } = useWorkspaceStore();
  const [isDragging, setIsDragging] = useState(false);
  const platform = getPlatform();

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const buffer = await file.arrayBuffer();
      setDocument({
        name: file.name,
        size: file.size,
        type: file.type || 'application/pdf',
        data: new Uint8Array(buffer),
        pageCount: 1,
        lastModified: file.lastModified,
      });
    }
  };

  const handleOpenLocalFile = async (toolId?: string) => {
    try {
      const files = await platform.file.openFile({
        accept: ['.pdf', 'application/pdf', '.png', '.jpg', '.jpeg'],
        multiple: false,
      });
      if (files.length > 0) {
        const file = files[0];
        setDocument({
          name: file.name,
          size: file.size,
          type: file.type,
          data: file.data,
          pageCount: 1,
          lastModified: file.lastModified,
        });
        if (toolId) {
          setActiveTool(toolId);
        }
      }
    } catch (err) {
      console.error('File selection canceled or failed:', err);
    }
  };

  const handleToolCardClick = (toolId: string) => {
    if (toolId === 'merge') {
      setActiveTool('merge');
    } else if (toolId === 'img_to_pdf') {
      setActiveTool('convert-images');
    } else {
      handleOpenLocalFile(toolId);
    }
  };

  const categories: CategoryGroup[] = [
    {
      name: 'Organize Pages',
      tools: [
        {
          id: 'merge',
          name: 'Merge PDF',
          desc: 'Combine multiple PDFs and images into one document.',
          icon: <Merge className="w-5 h-5 text-blue-500" />,
          isLocal: true,
          color: 'bg-blue-50 dark:bg-blue-950/40',
        },
        {
          id: 'split',
          name: 'Split PDF',
          desc: 'Separate pages or extract specific page ranges.',
          icon: <Split className="w-5 h-5 text-indigo-500" />,
          isLocal: true,
          color: 'bg-indigo-50 dark:bg-indigo-950/40',
        },
        {
          id: 'rotate',
          name: 'Rotate & Reorder',
          desc: 'Rearrange, rotate 90/180°, and delete unwanted pages.',
          icon: <RotateCw className="w-5 h-5 text-sky-500" />,
          isLocal: true,
          color: 'bg-sky-50 dark:bg-sky-950/40',
        },
        {
          id: 'delete-pages',
          name: 'Delete Pages',
          desc: 'Select and remove specific pages cleanly.',
          icon: <Trash2 className="w-5 h-5 text-rose-500" />,
          isLocal: true,
          color: 'bg-rose-50 dark:bg-rose-950/40',
        },
      ],
    },
    {
      name: 'Annotate, Edit & Sign',
      tools: [
        {
          id: 'annotate',
          name: 'Markup & Annotate',
          desc: 'Highlighters, freehand pen, sticky notes, and shapes.',
          icon: <Highlighter className="w-5 h-5 text-amber-500" />,
          isLocal: true,
          color: 'bg-amber-50 dark:bg-amber-950/40',
        },
        {
          id: 'sign',
          name: 'Sign & Fill Forms',
          desc: 'Draw e-signatures and fill interactive AcroForms.',
          icon: <PenTool className="w-5 h-5 text-purple-500" />,
          isLocal: true,
          color: 'bg-purple-50 dark:bg-purple-950/40',
        },
        {
          id: 'watermark',
          name: 'Watermark & Bates',
          desc: 'Stamp text, images, page numbers, or bates counters.',
          icon: <Sparkles className="w-5 h-5 text-teal-500" />,
          isLocal: true,
          color: 'bg-teal-50 dark:bg-teal-950/40',
        },
        {
          id: 'redact-deep',
          name: 'Permanent Redact',
          desc: 'Search & certified byte-level removal of sensitive data.',
          icon: <ShieldCheck className="w-5 h-5 text-red-500" />,
          isLocal: false,
          color: 'bg-red-50 dark:bg-red-950/40',
        },
      ],
    },
    {
      name: 'Convert, OCR & Optimize',
      tools: [
        {
          id: 'compress',
          name: 'Compress PDF',
          desc: 'Optimize file size with smart DPI and quality presets.',
          icon: <Minimize2 className="w-5 h-5 text-emerald-500" />,
          isLocal: true,
          color: 'bg-emerald-50 dark:bg-emerald-950/40',
        },
        {
          id: 'ocr',
          name: 'OCR to Searchable',
          desc: 'Convert scanned pages into selectable, searchable text.',
          icon: <ScanText className="w-5 h-5 text-orange-500" />,
          isLocal: false,
          color: 'bg-orange-50 dark:bg-orange-950/40',
        },
        {
          id: 'convert-office',
          name: 'Office & Image Convert',
          desc: 'Convert between PDF, Word, Excel, Images, and HTML.',
          icon: <FileText className="w-5 h-5 text-cyan-500" />,
          isLocal: false,
          color: 'bg-cyan-50 dark:bg-cyan-950/40',
        },
        {
          id: 'protect',
          name: 'Protect & Encrypt',
          desc: 'Set AES-256 passwords and restrict permissions.',
          icon: <Lock className="w-5 h-5 text-slate-500" />,
          isLocal: true,
          color: 'bg-slate-100 dark:bg-slate-800/60',
        },
      ],
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/60 dark:bg-slate-950 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Hero & Upload Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all ${
            isDragging
              ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-400'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Open, Edit, or Convert Your PDF
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2">
            Drag and drop a file here, or choose from our extensive suite of offline-first PDF tools below.
          </p>

          <div className="flex items-center justify-center gap-3 mt-6">
            <Button variant="primary" size="lg" onClick={() => handleOpenLocalFile()}>
              <FileText className="w-5 h-5" />
              <span>Choose PDF File</span>
            </Button>
          </div>

          {/* Privacy badge callout */}
          <div className="flex items-center justify-center gap-2 mt-5 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>100% Client-Side Privacy: Core manipulations never leave your browser.</span>
          </div>
        </div>

        {/* Categorized Tool Cards Grid */}
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.name} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                  {category.name}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {category.tools.map((tool) => (
                  <Card
                    key={tool.id}
                    hoverable
                    onClick={() => handleToolCardClick(tool.id)}
                    className="flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2.5 rounded-xl ${tool.color} shadow-sm group-hover:scale-105 transition-transform`}>
                          {tool.icon}
                        </div>
                        <Badge variant={tool.isLocal ? 'local' : 'server'}>
                          {tool.isLocal ? 'Offline' : 'Server'}
                        </Badge>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-brand-600 transition-colors">
                        {tool.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {tool.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                      <span>Launch Tool</span>
                      <span>→</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
