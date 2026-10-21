import React from 'react';
import {
  MousePointer,
  Pen,
  Highlighter,
  Square,
  Circle,
  ArrowUpRight,
  MessageSquare,
  Stamp,
  Ruler,
  Undo2,
  Redo2,
  Trash2,
  CheckCheck,
} from 'lucide-react';
import { useAnnotationStore } from './annotationStore';
import { AnnotationTool, StampType } from './types';

const COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber/Yellow
  '#8b5cf6', // Purple
  '#0f172a', // Slate/Black
];

const STAMPS: StampType[] = ['APPROVED', 'CONFIDENTIAL', 'DRAFT', 'VOID'];

export const AnnotationToolbar: React.FC<{
  onFlatten?: () => void;
}> = ({ onFlatten }) => {
  const {
    activeTool,
    setActiveTool,
    strokeColor,
    setStrokeColor,
    strokeWidth,
    setStrokeWidth,
    activeStampType,
    setActiveStampType,
    undo,
    redo,
    clearAll,
  } = useAnnotationStore();

  const tools: { id: AnnotationTool; label: string; icon: React.ReactNode }[] = [
    { id: 'select', label: 'Select', icon: <MousePointer className="w-3.5 h-3.5" /> },
    { id: 'pen', label: 'Pen', icon: <Pen className="w-3.5 h-3.5" /> },
    { id: 'highlight', label: 'Highlighter', icon: <Highlighter className="w-3.5 h-3.5" /> },
    { id: 'rectangle', label: 'Rectangle', icon: <Square className="w-3.5 h-3.5" /> },
    { id: 'circle', label: 'Circle', icon: <Circle className="w-3.5 h-3.5" /> },
    { id: 'arrow', label: 'Arrow', icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
    { id: 'note', label: 'Sticky Note', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: 'stamp', label: 'Stamp', icon: <Stamp className="w-3.5 h-3.5" /> },
    { id: 'measure', label: 'Measure', icon: <Ruler className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex items-center justify-between px-3 py-1 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs overflow-x-auto select-none">
      {/* Tool Selector Buttons */}
      <div className="flex items-center gap-1">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTool(t.id)}
            className={`p-1.5 rounded-lg flex items-center gap-1 font-medium transition-colors ${
              activeTool === t.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={t.label}
          >
            {t.icon}
            <span className="hidden sm:inline text-[11px]">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-2" />

      {/* Style Config: Colors, Stroke Width & Stamps */}
      <div className="flex items-center gap-2">
        {activeTool === 'stamp' ? (
          <div className="flex items-center gap-1">
            {STAMPS.map((st) => (
              <button
                key={st}
                onClick={() => setActiveStampType(st)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-colors ${
                  activeStampType === st
                    ? 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setStrokeColor(c)}
                className={`w-4 h-4 rounded-full transition-transform ${
                  strokeColor === c ? 'scale-125 ring-2 ring-brand-500 ring-offset-1' : ''
                }`}
                style={{ backgroundColor: c }}
                title={`Color: ${c}`}
              />
            ))}
          </div>
        )}

        {/* Stroke Width Selector */}
        {(activeTool === 'pen' || activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'arrow') && (
          <div className="flex items-center gap-1 ml-2">
            {[2, 4, 8].map((w) => (
              <button
                key={w}
                onClick={() => setStrokeWidth(w)}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                  strokeWidth === w
                    ? 'bg-slate-200 dark:bg-slate-700 font-bold'
                    : 'text-slate-400 hover:bg-slate-100'
                }`}
              >
                {w}px
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-2" />

      {/* History and Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
          title="Undo Annotation"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={redo}
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
          title="Redo Annotation"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={clearAll}
          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
          title="Clear Annotations"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {onFlatten && (
          <button
            onClick={onFlatten}
            className="ml-2 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 font-medium text-[11px] shadow-sm transition-colors"
            title="Burn annotations permanently into the PDF document"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Flatten</span>
          </button>
        )}
      </div>
    </div>
  );
};
