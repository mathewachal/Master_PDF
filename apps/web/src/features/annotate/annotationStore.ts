import { create } from 'zustand';
import { Annotation, AnnotationTool, StampType } from './types';

export interface AnnotationState {
  annotations: Annotation[];
  activeTool: AnnotationTool;
  selectedAnnotationId: string | null;

  // Active styling settings
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  fillColor: string;
  activeStampType: StampType;

  // History stack for undo/redo
  history: Annotation[][];
  historyIndex: number;

  // Actions
  setActiveTool: (tool: AnnotationTool) => void;
  setSelectedAnnotationId: (id: string | null) => void;
  setStrokeColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setOpacity: (opacity: number) => void;
  setFillColor: (color: string) => void;
  setActiveStampType: (stamp: StampType) => void;

  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  clearAll: () => void;
  undo: () => void;
  redo: () => void;
}

export const useAnnotationStore = create<AnnotationState>((set) => ({
  annotations: [],
  activeTool: 'select',
  selectedAnnotationId: null,

  strokeColor: '#ef4444', // Red default
  strokeWidth: 3,
  opacity: 1.0,
  fillColor: 'transparent',
  activeStampType: 'APPROVED',

  history: [[]],
  historyIndex: 0,

  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedAnnotationId: (id) => set({ selectedAnnotationId: id }),
  setStrokeColor: (color) => set({ strokeColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setOpacity: (opacity) => set({ opacity: opacity }),
  setFillColor: (color) => set({ fillColor: color }),
  setActiveStampType: (stamp) => set({ activeStampType: stamp }),

  addAnnotation: (ann) =>
    set((state) => {
      const nextAnnotations = [...state.annotations, ann];
      const nextHistory = state.history.slice(0, state.historyIndex + 1);
      nextHistory.push(nextAnnotations);

      return {
        annotations: nextAnnotations,
        history: nextHistory,
        historyIndex: nextHistory.length - 1,
        selectedAnnotationId: ann.id,
      };
    }),

  updateAnnotation: (id, updates) =>
    set((state) => {
      const nextAnnotations = state.annotations.map((a) =>
        a.id === id ? ({ ...a, ...updates } as Annotation) : a
      );
      const nextHistory = state.history.slice(0, state.historyIndex + 1);
      nextHistory.push(nextAnnotations);

      return {
        annotations: nextAnnotations,
        history: nextHistory,
        historyIndex: nextHistory.length - 1,
      };
    }),

  deleteAnnotation: (id) =>
    set((state) => {
      const nextAnnotations = state.annotations.filter((a) => a.id !== id);
      const nextHistory = state.history.slice(0, state.historyIndex + 1);
      nextHistory.push(nextAnnotations);

      return {
        annotations: nextAnnotations,
        history: nextHistory,
        historyIndex: nextHistory.length - 1,
        selectedAnnotationId: null,
      };
    }),

  clearAll: () =>
    set((state) => {
      const nextHistory = state.history.slice(0, state.historyIndex + 1);
      nextHistory.push([]);
      return {
        annotations: [],
        history: nextHistory,
        historyIndex: nextHistory.length - 1,
        selectedAnnotationId: null,
      };
    }),

  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state;
      const prevIndex = state.historyIndex - 1;
      return {
        historyIndex: prevIndex,
        annotations: state.history[prevIndex] || [],
        selectedAnnotationId: null,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const nextIndex = state.historyIndex + 1;
      return {
        historyIndex: nextIndex,
        annotations: state.history[nextIndex] || [],
        selectedAnnotationId: null,
      };
    }),
}));
