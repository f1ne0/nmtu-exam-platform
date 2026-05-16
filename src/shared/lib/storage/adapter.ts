import type { PlatformStorage, StorageOptions } from './types';

const isFn = (value: unknown): value is (...args: unknown[]) => unknown =>
  typeof value === 'function';

const hasMethod = <K extends string>(
  obj: object,
  key: K,
): obj is Record<K, (...args: unknown[]) => unknown> =>
  isFn((obj as Record<string, unknown>)[key]);

const detectPlatformStorage = (): PlatformStorage | null => {
  if (typeof window === 'undefined') return null;
  const candidate = (window as Window).storage;
  if (!candidate || typeof candidate !== 'object') return null;
  if (
    hasMethod(candidate, 'get') &&
    hasMethod(candidate, 'set') &&
    hasMethod(candidate, 'delete') &&
    hasMethod(candidate, 'list')
  ) {
    return candidate as unknown as PlatformStorage;
  }
  return null;
};

class MemoryStorage implements PlatformStorage {
  private readonly map = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.map.has(key) ? (this.map.get(key) ?? null) : null;
  }

  async set(key: string, value: string): Promise<void> {
    this.map.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.map.delete(key);
  }

  async list(prefix: string): Promise<string[]> {
    const out: string[] = [];
    for (const k of this.map.keys()) {
      if (k.startsWith(prefix)) out.push(k);
    }
    return out;
  }
}

let cached: PlatformStorage | null = null;

export const getStorage = (): PlatformStorage => {
  if (cached) return cached;
  const detected = detectPlatformStorage();
  if (detected) {
    cached = detected;
    return detected;
  }
  if (typeof console !== 'undefined') {
    console.warn(
      '[storage] window.storage не найден. Используется in-memory fallback. ' +
        'Данные не будут сохранены между перезагрузками.',
    );
  }
  cached = new MemoryStorage();
  return cached;
};

export const SHARED_OPTS: StorageOptions = { shared: true };
