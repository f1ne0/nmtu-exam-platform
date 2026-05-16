export interface StorageOptions {
  shared?: boolean;
}

export interface PlatformStorage {
  get(key: string, options?: StorageOptions): Promise<string | null>;
  set(key: string, value: string, options?: StorageOptions): Promise<void>;
  delete(key: string, options?: StorageOptions): Promise<void>;
  list(prefix: string, options?: StorageOptions): Promise<string[]>;
}

declare global {
  interface Window {
    storage?: PlatformStorage | unknown;
  }
}
