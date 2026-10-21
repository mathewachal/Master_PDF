import { NetworkService } from '../types';

export class WebNetworkService implements NetworkService {
  private apiBaseUrl: string;

  constructor() {
    // Read from Vite environment or default to local backend
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  getApiBaseUrl(): string {
    return this.apiBaseUrl;
  }

  setApiBaseUrl(url: string): void {
    this.apiBaseUrl = url.replace(/\/+$/, '');
  }
}
