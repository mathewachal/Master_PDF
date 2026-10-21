import { create } from 'zustand';

export type TaskStatus = 'idle' | 'running' | 'success' | 'error';

export interface ActiveTask {
  id: string;
  name: string;
  progress: number;
  isLocal: boolean;
  status: TaskStatus;
  message?: string;
  resultUrl?: string;
}

export interface ToolState {
  activeTask: ActiveTask | null;
  startTask: (id: string, name: string, isLocal: boolean) => void;
  updateProgress: (progress: number, message?: string) => void;
  finishTask: (resultUrl?: string) => void;
  failTask: (error: string) => void;
  resetTask: () => void;
}

export const useToolStore = create<ToolState>((set) => ({
  activeTask: null,

  startTask: (id, name, isLocal) =>
    set({
      activeTask: {
        id,
        name,
        progress: 0,
        isLocal,
        status: 'running',
      },
    }),

  updateProgress: (progress, message) =>
    set((state) => ({
      activeTask: state.activeTask
        ? {
            ...state.activeTask,
            progress: Math.min(100, Math.max(0, progress)),
            message: message !== undefined ? message : state.activeTask.message,
          }
        : null,
    })),

  finishTask: (resultUrl) =>
    set((state) => ({
      activeTask: state.activeTask
        ? {
            ...state.activeTask,
            progress: 100,
            status: 'success',
            resultUrl,
          }
        : null,
    })),

  failTask: (error) =>
    set((state) => ({
      activeTask: state.activeTask
        ? {
            ...state.activeTask,
            status: 'error',
            message: error,
          }
        : null,
    })),

  resetTask: () => set({ activeTask: null }),
}));
