import React from 'react';
import {
  LayoutGrid,
  Bookmark,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useWorkspaceStore, SidebarTab } from '../../store/workspaceStore';

export const Sidebar: React.FC = () => {
  const {
    document: activeDoc,
    sidebarOpen,
    toggleSidebar,
    sidebarTab,
    setSidebarTab,
    currentPage,
    setCurrentPage,
    selectedPages,
    setSelectedPages,
  } = useWorkspaceStore();

  if (!activeDoc) return null;

  const tabs: { id: SidebarTab; label: string; icon: React.ReactNode }[] = [
    { id: 'thumbnails', label: 'Pages', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'outline', label: 'Outline', icon: <Bookmark className="w-4 h-4" /> },
    { id: 'search', label: 'Search', icon: <Search className="w-4 h-4" /> },
  ];

  return (
    <aside
      className={`relative border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 flex flex-col z-10 ${
        sidebarOpen ? 'w-64' : 'w-12'
      }`}
    >
      {/* Tab Selector Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-2">
        {sidebarOpen ? (
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSidebarTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  sidebarTab === tab.id
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2 w-full items-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSidebarTab(tab.id)}
                className={`p-2 rounded-lg text-xs transition-colors ${
                  sidebarTab === tab.id
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={tab.label}
              >
                {tab.icon}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Tab Content Panel */}
      {sidebarOpen && (
        <div className="flex-1 overflow-y-auto p-3">
          {sidebarTab === 'thumbnails' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                <span>{activeDoc.pageCount} page(s)</span>
                <span>Select & Reorder</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: activeDoc.pageCount || 1 }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isCurrent = currentPage === pageNum;
                  const isSelected = selectedPages.includes(pageNum);

                  return (
                    <div
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        setSelectedPages([pageNum]);
                      }}
                      className={`group relative rounded-lg border p-2 flex flex-col items-center cursor-pointer transition-all ${
                        isCurrent
                          ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/20 dark:bg-brand-950/20'
                          : isSelected
                          ? 'border-brand-400 bg-slate-50 dark:bg-slate-800/40'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Thumbnail Placeholder Preview (Workers render in Phase 1) */}
                      <div className="w-full aspect-[1/1.4] bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-slate-400 shadow-inner text-xs font-mono">
                        Page {pageNum}
                      </div>
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-1.5">
                        {pageNum}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {sidebarTab === 'outline' && (
            <div className="text-xs text-slate-500 text-center py-8">
              <Bookmark className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p>No document outline or bookmarks detected.</p>
            </div>
          )}

          {sidebarTab === 'search' && (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search in document..."
                  className="w-full text-xs px-3 py-2 pl-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
              <p className="text-[11px] text-slate-400 text-center py-4">
                Type a term to search across all pages.
              </p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
