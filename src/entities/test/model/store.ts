import { create } from 'zustand';
import {
  deleteTest as apiDelete,
  getAllTests,
  saveTest as apiSave,
  setTestArchived as apiSetArchived,
} from '../api';
import type { Test } from './types';

interface TestState {
  tests: Test[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  load: () => Promise<void>;
  upsert: (test: Test) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setArchived: (id: string, archived: boolean) => Promise<void>;
}

export const useTestStore = create<TestState>((set, get) => ({
  tests: [],
  loading: false,
  loaded: false,
  error: null,
  load: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const tests = await getAllTests(true);
      set({ tests, loading: false, loaded: true });
    } catch (e) {
      set({ loading: false, error: (e as Error).message ?? 'Не удалось загрузить тесты' });
    }
  },
  upsert: async (test) => {
    await apiSave(test);
    const list = await getAllTests(true);
    set({ tests: list, loaded: true });
  },
  remove: async (id) => {
    await apiDelete(id);
    set({ tests: get().tests.filter((t) => t.id !== id) });
  },
  setArchived: async (id, archived) => {
    await apiSetArchived(id, archived);
    set({
      tests: get().tests.map((t) => (t.id === id ? { ...t, archived } : t)),
    });
  },
}));
