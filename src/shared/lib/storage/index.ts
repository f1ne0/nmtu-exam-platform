import { getStorage, SHARED_OPTS } from './adapter';

export type { PlatformStorage, StorageOptions } from './types';

export const storageGet = async (key: string): Promise<string | null> => {
  try {
    return await getStorage().get(key, SHARED_OPTS);
  } catch (e) {
    console.error('[storage] get failed', key, e);
    return null;
  }
};

export const storageSet = async (key: string, value: string): Promise<void> => {
  try {
    await getStorage().set(key, value, SHARED_OPTS);
  } catch (e) {
    console.error('[storage] set failed', key, e);
    throw e;
  }
};

export const storageDelete = async (key: string): Promise<void> => {
  try {
    await getStorage().delete(key, SHARED_OPTS);
  } catch (e) {
    console.error('[storage] delete failed', key, e);
    throw e;
  }
};

export const storageList = async (prefix: string): Promise<string[]> => {
  try {
    return await getStorage().list(prefix, SHARED_OPTS);
  } catch (e) {
    console.error('[storage] list failed', prefix, e);
    return [];
  }
};

export const parseJson = <T>(raw: string | null): T | null => {
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error('[storage] parse failed', e);
    return null;
  }
};

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 300,
): Promise<T> => {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) {
        const delay = baseDelayMs * 2 ** i;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
};
