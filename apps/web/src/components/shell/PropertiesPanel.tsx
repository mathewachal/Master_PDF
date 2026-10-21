import React from 'react';
import { Sliders, X, Info, Clock, HardDrive } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';

export const PropertiesPanel: React.FC = () => {
  const {
    document: activeDoc,
    propertiesOpen,
    toggleProperties,
    activeTool,
  } = useWorkspaceStore();

  if (!activeDoc || !propertiesOpen) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <aside className="w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col z-10 select-none">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <Sliders className="w-4 h-4 text-brand-600" />
          <span>Properties & Inspector</span>
        </div>
        <button
          onClick={toggleProperties}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Close Properties"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Tool Context Section */}
        {activeTool ? (
          <div className="bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800/60 rounded-lg p-3">
            <span className="font-semibold text-brand-700 dark:text-brand-300 capitalize">
              Active Tool: {activeTool.replace('-', ' ')}
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
              Configure parameters and presets for this operation.
            </p>
          </div>
        ) : (
          <div className="text-slate-500 text-center py-2">
            Select a tool or element to edit its properties.
          </div>
        )}

        {/* Document Info Section */}
        <div className="space-y-3">
          <span className="font-semibold text-slate-900 dark:text-slate-100 block border-b border-slate-100 dark:border-slate-800 pb-1">
            Document Metadata
          </span>

          <div className="flex items-start gap-2.5 text-slate-600 dark:text-slate-300">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="overflow-hidden">
              <span className="text-[10px] uppercase text-slate-400 font-bold block">File Name</span>
              <span className="truncate block font-medium" title={activeDoc.name}>
                {activeDoc.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
            <HardDrive className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase text-slate-400 font-bold block">File Size</span>
              <span className="font-medium">{formatFileSize(activeDoc.size)}</span>
            </div>
          </div>

          {activeDoc.lastModified && (
            <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Modified</span>
                <span className="font-medium">
                  {new Date(activeDoc.lastModified).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
