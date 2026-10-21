import { create } from 'zustand';

export interface DocumentInfo {
  name: string;
  size: number;
  type: string;
  data: Uint8Array;
  pageCount: number;
  lastModified?: number;
}

export type ViewMode = 'continuous' | 'single';
export type SidebarTab = 'thumbnails' | 'outline' | 'search';
export type ThemeMode = 'light' | 'dark';

export interface WorkspaceState {
  // Document state
  document: DocumentInfo | null;
  currentPage: number;
  scale: number;
  rotation: number;
  viewMode: ViewMode;
  selectedPages: number[];

  // Shell & Tool state
  activeTool: string | null;
  sidebarOpen: boolean;
  sidebarTab: SidebarTab;
  propertiesOpen: boolean;
  theme: ThemeMode;
  commandPaletteOpen: boolean;

  // Actions
  setDocument: (doc: DocumentInfo | null) => void;
  closeDocument: () => void;
  setCurrentPage: (page: number) => void;
  setScale: (scale: number | ((prev: number) => number)) => void;
  setRotation: (rotation: number | ((prev: number) => number)) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedPages: (pages: number[] | ((prev: number[]) => number[])) => void;
  setActiveTool: (tool: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setPropertiesOpen: (open: boolean) => void;
  toggleProperties: () => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  document: null,
  currentPage: 1,
  scale: 1.0,
  rotation: 0,
  viewMode: 'continuous',
  selectedPages: [1],

  activeTool: null,
  sidebarOpen: true,
  sidebarTab: 'thumbnails',
  propertiesOpen: false,
  theme: (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light',
  commandPaletteOpen: false,

  setDocument: (doc) => set({
    document: doc,
    currentPage: 1,
    selectedPages: [1],
    rotation: 0,
    scale: 1.0,
  }),
  closeDocument: () => set({
    document: null,
    currentPage: 1,
    selectedPages: [],
    activeTool: null,
  }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setScale: (scale) => set((state) => ({
    scale: typeof scale === 'function' ? scale(state.scale) : scale,
  })),
  setRotation: (rotation) => set((state) => ({
    rotation: typeof rotation === 'function' ? rotation(state.rotation) : rotation,
  })),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedPages: (pages) => set((state) => ({
    selectedPages: typeof pages === 'function' ? pages(state.selectedPages) : pages,
  })),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarTab: (tab) => set({ sidebarTab: tab, sidebarOpen: true }),
  setPropertiesOpen: (open) => set({ propertiesOpen: open }),
  toggleProperties: () => set((state) => ({ propertiesOpen: !state.propertiesOpen })),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => {
    const next = state.theme === 'light' ? 'dark' : 'light';
    if (typeof document !== 'undefined') {
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    return { theme: next };
  }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}));
