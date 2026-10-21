import { create } from 'zustand';
import { ProviderType } from './types';

interface AiState {
  aiEnabled: boolean;
  provider: ProviderType;
  apiKey: string;
  model: string;
  baseUrl: string;
  setAiEnabled: (enabled: boolean) => void;
  setProvider: (provider: ProviderType) => void;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setBaseUrl: (url: string) => void;
}

export const useAiStore = create<AiState>((set) => ({
  aiEnabled: true,
  provider: 'demo',
  apiKey: '',
  model: 'gpt-4o',
  baseUrl: 'https://api.openai.com/v1',
  setAiEnabled: (enabled) => set({ aiEnabled: enabled }),
  setProvider: (provider) => set({ provider }),
  setApiKey: (apiKey) => set({ apiKey }),
  setModel: (model) => set({ model }),
  setBaseUrl: (baseUrl) => set({ baseUrl }),
}));
