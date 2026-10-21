import React from 'react';
import {
  RotateCw,
  Highlighter,
  PenTool,
  Lock,
  Minimize2,
  Sparkles,
  Split,
  Merge,
  FileCheck2,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { Button } from '../../components/ui/Button';

export const ViewerWorkspace: React.FC = () => {
  const {
    document: activeDoc,
    currentPage,
    scale,
    rotation,
    activeTool,
    setActiveTool,
    setRotation,
  } = useWorkspaceStore();

  if (!activeDoc) return null;

  const quickTools = [
    { id: 'organize', label: 'Organize', icon: <Merge className="w-3.5 h-3.5" /> },
    { id: 'split', label: 'Split', icon: <Split className="w-3.5 h-3.5" /> },
    { id: 'annotate', label: 'Annotate', icon: <Highlighter className="w-3.5 h-3.5" /> },
    { id: 'sign', label: 'Sign', icon: <PenTool className="w-3.5 h-3.5" /> },
    { id: 'watermark', label: 'Watermark', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'compress', label: 'Compress', icon: <Minimize2 className="w-3.5 h-3.5" /> },
    { id: 'protect', label: 'Protect', icon: <Lock className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex-1 flex flex-col bg-slate-100/80 dark:bg-slate-950 overflow-hidden">
      {/* Contextual Top Toolbar */}
      <div className="h-11 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {quickTools.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTool(activeTool === t.id ? null : t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTool === t.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="text-xs"
            title="Rotate Page"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Rotate</span>
          </Button>
        </div>
      </div>

      {/* Viewport Canvas Area */}
      <div className="flex-1 overflow-auto p-8 flex justify-center items-start">
        <div
          className="transition-transform duration-150 ease-out origin-top flex flex-col items-center gap-8"
          style={{
            transform: `scale(${scale})`,
          }}
        >
          {/* Document Page Canvas Container */}
          <div
            className="bg-white dark:bg-slate-900 shadow-2xl rounded-sm border border-slate-200/80 dark:border-slate-800 transition-all duration-200 flex flex-col items-center justify-center relative select-none"
            style={{
              width: '595px', // Standard A4 points width
              minHeight: '842px', // Standard A4 points height
              transform: `rotate(${rotation}deg)`,
            }}
          >
            {/* Page Header / Number Badge */}
            <div className="absolute top-4 left-6 flex items-center gap-2 text-xs font-mono text-slate-400">
              <FileCheck2 className="w-4 h-4 text-brand-500" />
              <span>
                {activeDoc.name} — Page {currentPage} of {activeDoc.pageCount || 1}
              </span>
            </div>

            {/* Document Render Target Placeholder */}
            <div className="text-center p-8 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 mx-auto flex items-center justify-center">
                <Merge className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">
                Ready for Editing & Manipulation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Document loaded successfully into memory ({((activeDoc.size || 0) / 1024).toFixed(1)} KB).
                Select a tool above to organize, split, annotate, or secure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
