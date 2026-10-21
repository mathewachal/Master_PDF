import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Merge,
  Split,
  RotateCw,
  Trash2,
  FileText,
  Highlighter,
  PenTool,
  Lock,
  Unlock,
  Minimize2,
  ScanText,
  FileCheck,
  Table,
  X,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';

interface ToolAction {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  shortcut?: string;
  isLocal: boolean;
}

const TOOLS: ToolAction[] = [
  { id: 'merge', name: 'Merge PDFs', category: 'Organize', icon: <Merge className="w-4 h-4" />, isLocal: true },
  { id: 'split', name: 'Split PDF', category: 'Organize', icon: <Split className="w-4 h-4" />, isLocal: true },
  { id: 'rotate', name: 'Rotate Pages', category: 'Organize', icon: <RotateCw className="w-4 h-4" />, isLocal: true },
  { id: 'delete-pages', name: 'Delete Pages', category: 'Organize', icon: <Trash2 className="w-4 h-4" />, isLocal: true },
  { id: 'annotate', name: 'Annotate & Markup', category: 'Review', icon: <Highlighter className="w-4 h-4" />, isLocal: true },
  { id: 'sign', name: 'Fill & Sign', category: 'Forms & Sign', icon: <PenTool className="w-4 h-4" />, isLocal: true },
  { id: 'compress', name: 'Compress PDF', category: 'Optimize', icon: <Minimize2 className="w-4 h-4" />, isLocal: true },
  { id: 'watermark', name: 'Watermark & Background', category: 'Edit', icon: <Highlighter className="w-4 h-4" />, isLocal: true },
  { id: 'page-numbers', name: 'Page Numbers & Bates', category: 'Edit', icon: <FileText className="w-4 h-4" />, isLocal: true },
  { id: 'redact-deep', name: 'Permanent Redaction (Byte-level)', category: 'Security', icon: <Lock className="w-4 h-4" />, isLocal: false },
  { id: 'metadata', name: 'Edit PDF Metadata', category: 'Edit', icon: <FileCheck className="w-4 h-4" />, isLocal: true },
  { id: 'extract-tables', name: 'Extract Tables to Excel/CSV', category: 'Convert', icon: <Table className="w-4 h-4" />, isLocal: false },
  { id: 'protect', name: 'Protect & Encrypt', category: 'Security', icon: <Lock className="w-4 h-4" />, isLocal: true },
  { id: 'unlock', name: 'Unlock Password', category: 'Security', icon: <Unlock className="w-4 h-4" />, isLocal: true },
  { id: 'ocr', name: 'Recognize Text (OCR)', category: 'Convert & OCR', icon: <ScanText className="w-4 h-4" />, isLocal: false },
  { id: 'convert-office', name: 'Convert to Word, Excel, Markdown', category: 'Convert', icon: <FileText className="w-4 h-4" />, isLocal: false },
  { id: 'verify-sign', name: 'Verify Certificate Signatures', category: 'Security', icon: <FileCheck className="w-4 h-4" />, isLocal: false },
];

export const CommandPalette: React.FC = () => {
  const { commandPaletteOpen, setCommandPaletteOpen, setActiveTool } = useWorkspaceStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global key listener for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      } else if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  // Focus input when opened
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const filtered = TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (tool: ToolAction) => {
    setActiveTool(tool.id);
    setCommandPaletteOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a tool name or action..."
            className="w-full py-3.5 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching tools or actions found.
            </div>
          ) : (
            filtered.map((tool, idx) => (
              <div
                key={tool.id}
                onClick={() => handleSelect(tool)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                  idx === selectedIndex
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      idx === selectedIndex
                        ? 'bg-brand-100 dark:bg-brand-900/60 text-brand-600 dark:text-brand-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {tool.icon}
                  </div>
                  <div>
                    <span className="font-semibold block">{tool.name}</span>
                    <span className="text-[10px] text-slate-400">{tool.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                      tool.isLocal
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                        : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                    }`}
                  >
                    {tool.isLocal ? 'Offline' : 'Server'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer navigation cues */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>Navigate:</span>
            <kbd className="px-1 py-0.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800">↑</kbd>
            <kbd className="px-1 py-0.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800">↓</kbd>
          </div>
          <div>
            <span>Select:</span> <kbd className="px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800">Enter</kbd>
          </div>
        </div>
      </div>
    </div>
  );
};
