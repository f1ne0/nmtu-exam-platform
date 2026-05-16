import { create } from 'zustand';
import { deleteResult as apiDelete, getAllResults, saveResult as apiSave } from '../api';
import type { TestResult } from './types';

interface ResultState {
  results: TestResult[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  load: () => Promise<void>;
  add: (r: TestResult) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useResultStore = create<ResultState>((set, get) => ({
  results: [],
  loading: false,
  loaded: false,
  error: null,
  load: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const results = await getAllResults();
      set({ results, loading: false, loaded: true });
    } catch (e) {
      set({ loading: false, error: (e as Error).message ?? 'Не удалось загрузить результаты' });
    }
  },
  add: async (r) => {
    await apiSave(r);
    set({ results: [r, ...get().results] });
  },
  remove: async (id) => {
    await apiDelete(id);
    set({ results: get().results.filter((r) => r.id !== id) });
  },
}));
