/**
 * Platform Abstraction Layer Interfaces
 *
 * All platform-specific interactions (Browser, Capacitor, Electron)
 * MUST strictly implement and pass through these contracts.
 */

export interface PlatformFile {
  name: string;
  size: number;
  type: string;
  lastModified?: number;
  data: Uint8Array;
}

export interface OpenFileOptions {
  accept?: string[];
  multiple?: boolean;
}

export interface FileService {
  /** Open and read one or more files from disk or native file picker */
  openFile(options?: OpenFileOptions): Promise<PlatformFile[]>;

  /** Save a file/blob to the platform filesystem or initiate download */
  saveFile(data: Uint8Array | Blob, defaultName: string, mimeType?: string): Promise<void>;

  /** Native share sheet or fallback to download/clipboard */
  shareFile(file: PlatformFile): Promise<void>;
}

export interface StorageService {
  /** Get a typed item from platform persistence */
  getItem<T>(key: string): Promise<T | null>;

  /** Store a typed item to platform persistence */
  setItem<T>(key: string, value: T): Promise<void>;

  /** Remove item from persistence */
  removeItem(key: string): Promise<void>;

  /** Clear all keys */
  clear(): Promise<void>;
}

export interface ClipboardService {
  /** Copy text to platform clipboard */
  writeText(text: string): Promise<void>;

  /** Read text from platform clipboard */
  readText(): Promise<string>;
}

export interface NetworkService {
  /** Returns whether device currently has network connectivity */
  isOnline(): boolean;

  /** Get base URL of the FastAPI backend */
  getApiBaseUrl(): string;

  /** Update or configure base URL (e.g. for sidecar vs hosted server) */
  setApiBaseUrl(url: string): void;
}

export type PlatformType = 'web' | 'capacitor' | 'electron';

export interface Platform {
  type: PlatformType;
  file: FileService;
  storage: StorageService;
  clipboard: ClipboardService;
  network: NetworkService;
}
