import React, { useEffect, useState } from 'react';
import {
  LayoutGrid,
  Bookmark,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useWorkspaceStore, SidebarTab } from '../../store/workspaceStore';
import { loadPdfDocument } from '../../core/pdf/engine';
import { renderPageThumbnail } from '../../core/pdf/render';
import { extractDocumentOutline, OutlineItem } from '../../core/pdf/outline';
import {
  extractDocumentText,
  searchInExtractedText,
  PageTextCache,
  SearchMatch,
} from '../../core/pdf/textSearch';

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

  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [textCache, setTextCache] = useState<PageTextCache[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load PDF and prefetch outline and thumbnails
  useEffect(() => {
    if (!activeDoc) {
      setThumbnails({});
      setOutline([]);
      setTextCache([]);
      setSearchResults([]);
      return;
    }

    let isMounted = true;

    loadPdfDocument(activeDoc.data)
      .then(async ({ doc, numPages }) => {
        if (!isMounted) return;

        // 1. Fetch document bookmarks/outline
        extractDocumentOutline(doc).then((items) => {
          if (isMounted) setOutline(items);
        });

        // 2. Cache plain text for full-text search
        extractDocumentText(doc).then((cache) => {
          if (isMounted) setTextCache(cache);
        });

        // 3. Incrementally generate thumbnails
        for (let i = 1; i <= Math.min(numPages, 30); i++) {
          if (!isMounted) break;
          try {
            const page = await doc.getPage(i);
            const thumbUrl = await renderPageThumbnail(page, 150);
            if (isMounted) {
              setThumbnails((prev) => ({ ...prev, [i]: thumbUrl }));
            }
          } catch (err) {
            console.warn(`Failed to render thumbnail for page ${i}:`, err);
          }
        }
      })
      .catch((err) => {
        console.warn('Sidebar PDF loading:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [activeDoc?.data]);

  // Handle Search Input Changes
  useEffect(() => {
    if (!searchQuery.trim() || textCache.length === 0) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      const matches = searchInExtractedText(textCache, searchQuery);
      setSearchResults(matches);
      setIsSearching(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery, textCache]);

  if (!activeDoc) return null;

  const tabs: { id: SidebarTab; label: string; icon: React.ReactNode }[] = [
    { id: 'thumbnails', label: 'Pages', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'outline', label: 'Outline', icon: <Bookmark className="w-4 h-4" /> },
    { id: 'search', label: 'Search', icon: <Search className="w-4 h-4" /> },
  ];

  return (
    <aside
      className={`relative border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 flex flex-col z-10 select-none ${
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
          {/* Thumbnails View */}
          {sidebarTab === 'thumbnails' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                <span>{activeDoc.pageCount} page(s)</span>
                <span>Select & Jump</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: activeDoc.pageCount || 1 }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isCurrent = currentPage === pageNum;
                  const isSelected = selectedPages.includes(pageNum);
                  const thumb = thumbnails[pageNum];

                  return (
                    <div
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        setSelectedPages([pageNum]);
                      }}
                      className={`group relative rounded-lg border p-1.5 flex flex-col items-center cursor-pointer transition-all ${
                        isCurrent
                          ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/20 dark:bg-brand-950/20'
                          : isSelected
                          ? 'border-brand-400 bg-slate-50 dark:bg-slate-800/40'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="w-full aspect-[1/1.4] bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center overflow-hidden shadow-inner">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={`Page ${pageNum}`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-[11px] font-mono text-slate-400">
                            Page {pageNum}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-1">
                        {pageNum}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Outline / Bookmarks View */}
          {sidebarTab === 'outline' && (
            <div>
              {outline.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-8">
                  <Bookmark className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p>No document bookmarks found.</p>
                </div>
              ) : (
                <div className="space-y-1 text-xs">
                  {outline.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        if (item.pageNumber) {
                          setCurrentPage(item.pageNumber);
                        }
                      }}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-slate-700 dark:text-slate-300"
                    >
                      <span className="truncate pr-2 font-medium">{item.title}</span>
                      {item.pageNumber && (
                        <span className="text-[10px] font-mono text-slate-400">
                          p. {item.pageNumber}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Text Search View */}
          {sidebarTab === 'search' && (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in document..."
                  className="w-full text-xs px-3 py-2 pl-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              {searchQuery && (
                <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                  <span>{searchResults.length} match(es) found</span>
                  {isSearching && <span className="text-brand-600">Searching...</span>}
                </div>
              )}

              <div className="space-y-1.5 max-h-[calc(100vh-180px)] overflow-y-auto">
                {searchResults.map((match, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentPage(match.pageNumber)}
                    className="p-2 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-brand-600 dark:text-brand-400 text-[10px] mb-1">
                      <span>Page {match.pageNumber}</span>
                      <span>#{idx + 1}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
                      {match.snippet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
