import { StorageService } from '../types';

export class WebStorageService implements StorageService {
  private prefix = 'master_pdf_';
  private memoryFallback = new Map<string, string>();

  private get hasStorage(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const fullKey = `${this.prefix}${key}`;
      const raw = this.hasStorage
        ? window.localStorage.getItem(fullKey)
        : this.memoryFallback.get(fullKey) ?? null;

      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.error(`Failed to get storage key ${key}:`, err);
      return null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const fullKey = `${this.prefix}${key}`;
      const serialized = JSON.stringify(value);
      if (this.hasStorage) {
        window.localStorage.setItem(fullKey, serialized);
      } else {
        this.memoryFallback.set(fullKey, serialized);
      }
    } catch (err) {
      console.error(`Failed to set storage key ${key}:`, err);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const fullKey = `${this.prefix}${key}`;
      if (this.hasStorage) {
        window.localStorage.removeItem(fullKey);
      } else {
        this.memoryFallback.delete(fullKey);
      }
    } catch (err) {
      console.error(`Failed to remove storage key ${key}:`, err);
    }
  }

  async clear(): Promise<void> {
    try {
      if (this.hasStorage) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.startsWith(this.prefix)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => window.localStorage.removeItem(k));
      } else {
        this.memoryFallback.clear();
      }
    } catch (err) {
      console.error('Failed to clear storage:', err);
    }
  }
}
