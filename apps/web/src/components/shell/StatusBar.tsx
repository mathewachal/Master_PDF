import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  FileSpreadsheet,
  Sliders,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useToolStore } from '../../store/toolStore';
import { Progress } from '../ui/Progress';

export const StatusBar: React.FC = () => {
  const {
    document: activeDoc,
    currentPage,
    setCurrentPage,
    scale,
    setScale,
    setRotation,
    viewMode,
    setViewMode,
    toggleProperties,
  } = useWorkspaceStore();

  const { activeTask } = useToolStore();

  if (!activeDoc) return null;

  const totalPages = activeDoc.pageCount || 1;

  const handleZoomIn = () => setScale((s) => Math.min(3.0, +(s + 0.1).toFixed(1)));
  const handleZoomOut = () => setScale((s) => Math.max(0.4, +(s - 0.1).toFixed(1)));
  const handleResetZoom = () => setScale(1.0);
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  return (
    <footer className="h-10 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 flex items-center justify-between text-xs select-none z-20">
      {/* Left: Page Jump & Navigation */}
      <div className="flex items-center gap-2">
        <button
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40"
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
          <span>Page</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 1 && val <= totalPages) {
                setCurrentPage(val);
              }
            }}
            className="w-10 text-center py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <span className="text-slate-400">/ {totalPages}</span>
        </div>

        <button
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40"
          title="Next Page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Middle: Active Task Progress (if running) */}
      <div className="flex-1 max-w-xs mx-4">
        {activeTask && activeTask.status === 'running' && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
              {activeTask.message || activeTask.name}...
            </span>
            <Progress value={activeTask.progress} className="flex-1" />
            <span className="text-[10px] font-mono text-slate-500">{activeTask.progress}%</span>
          </div>
        )}
      </div>

      {/* Right: Zoom, Rotate & View Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleRotate}
          className="p-1.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Rotate Clockwise (90°)"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleResetZoom}
          className="px-1.5 py-0.5 rounded text-[11px] font-mono font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Reset to 100%"
        >
          {Math.round(scale * 100)}%
        </button>

        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        <button
          onClick={() => setViewMode(viewMode === 'continuous' ? 'single' : 'continuous')}
          className={`p-1.5 rounded transition-colors ${
            viewMode === 'continuous'
              ? 'text-brand-600 bg-brand-50 dark:bg-brand-950/50'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          title={viewMode === 'continuous' ? 'Continuous Scroll View' : 'Single Page View'}
        >
          {viewMode === 'continuous' ? (
            <FileSpreadsheet className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          onClick={toggleProperties}
          className="p-1.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 ml-1"
          title="Toggle Properties Panel"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
};
