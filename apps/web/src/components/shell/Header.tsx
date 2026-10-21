import React from 'react';
import {
  FileText,
  FolderOpen,
  Download,
  Share2,
  Search,
  Sun,
  Moon,
  ShieldCheck,
  Server,
  Layers,
  X,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useToolStore } from '../../store/toolStore';
import { getPlatform } from '../../platform';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const Header: React.FC = () => {
  const {
    document: activeDoc,
    setDocument,
    closeDocument,
    theme,
    toggleTheme,
    setCommandPaletteOpen,
    activeTool,
  } = useWorkspaceStore();

  const { activeTask } = useToolStore();
  const platform = getPlatform();

  const handleOpenFile = async () => {
    try {
      const files = await platform.file.openFile({
        accept: ['.pdf', 'application/pdf'],
        multiple: false,
      });
      if (files.length > 0) {
        const file = files[0];
        setDocument({
          name: file.name,
          size: file.size,
          type: file.type,
          data: file.data,
          pageCount: 1, // Will be parsed accurately by PDF worker in Phase 1
          lastModified: file.lastModified,
        });
      }
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  };

  const handleSaveFile = async () => {
    if (!activeDoc) return;
    try {
      await platform.file.saveFile(activeDoc.data, activeDoc.name, activeDoc.type);
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  };

  const handleShareFile = async () => {
    if (!activeDoc) return;
    try {
      await platform.file.shareFile({
        name: activeDoc.name,
        size: activeDoc.size,
        type: activeDoc.type,
        data: activeDoc.data,
      });
    } catch (err) {
      console.error('Failed to share file:', err);
    }
  };

  // Determine whether operation is local or server-bound
  const isServerTool = ['ocr', 'convert-office', 'redact-deep', 'digital-sign'].includes(activeTool || '');

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between select-none z-20">
      {/* Left: Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <div
          onClick={closeDocument}
          className="flex items-center gap-2 cursor-pointer group"
          title="Master_PDF Home"
        >
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm group-hover:bg-brand-700 transition-colors">
            <Layers className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">
            Master_PDF
          </span>
        </div>

        {activeDoc && (
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-200 dark:border-slate-800">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 max-w-[200px] truncate" title={activeDoc.name}>
              {activeDoc.name}
            </span>
            <button
              onClick={closeDocument}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Close Document"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Middle: Command Palette & Privacy Badge */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-lg border border-slate-200 dark:border-slate-700 transition-all shadow-inner"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Quick actions & tools...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-slate-400">
            Ctrl+K
          </kbd>
        </button>

        {/* Dynamic Privacy & Execution Badge */}
        {activeDoc && (
          isServerTool ? (
            <Badge variant="server" title="This operation processes through the backend">
              <Server className="w-3 h-3 text-indigo-500" />
              <span>Server Processing</span>
            </Badge>
          ) : (
            <Badge variant="local" title="100% processed locally on this device. Your data never leaves your computer.">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Processed Locally</span>
            </Badge>
          )
        )}
      </div>

      {/* Right: Actions, Theme & Save */}
      <div className="flex items-center gap-2">
        {!activeDoc ? (
          <Button variant="primary" size="sm" onClick={handleOpenFile}>
            <FolderOpen className="w-4 h-4" />
            <span>Open PDF</span>
          </Button>
        ) : (
          <>
            <Button variant="ghost" size="icon" onClick={handleShareFile} title="Share Document">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveFile} disabled={activeTask?.status === 'running'}>
              <Download className="w-4 h-4" />
              <span>Download</span>
            </Button>
          </>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </Button>
      </div>
    </header>
  );
};
