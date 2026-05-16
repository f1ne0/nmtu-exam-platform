import { useCallback, useMemo, useState } from 'react';
import { generateId } from '@shared/lib/id';
import type { Question, Test, TestValidationError } from '@entities/test';
import { useTestStore, validateTest } from '@entities/test';

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

export const useTestEditor = (initial: Test) => {
  const [test, setTest] = useState<Test>(initial);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const upsert = useTestStore((s) => s.upsert);

  const setField = useCallback(<K extends keyof Test>(key: K, value: Test[K]) => {
    setTouched(true);
    setTest((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateQuestion = useCallback((idx: number, patch: Partial<Question>) => {
    setTouched(true);
    setTest((prev) => {
      const next = [...prev.questions];
      const cur = next[idx];
      if (!cur) return prev;
      next[idx] = { ...cur, ...patch };
      return { ...prev, questions: next };
    });
  }, []);

  const setOption = useCallback((qIdx: number, optIdx: number, value: string) => {
    setTouched(true);
    setTest((prev) => {
      const next = [...prev.questions];
      const cur = next[idx(next, qIdx)];
      if (!cur) return prev;
      const opts = [...cur.options];
      opts[optIdx] = value;
      next[qIdx] = { ...cur, options: opts };
      return { ...prev, questions: next };
    });
  }, []);

  const addQuestion = useCallback(() => {
    setTouched(true);
    setTest((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        { id: generateId(), text: '', options: ['', ''], correctIndex: 0 },
      ],
    }));
  }, []);

  const removeQuestion = useCallback((qIdx: number) => {
    setTouched(true);
    setTest((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== qIdx),
    }));
  }, []);

  const addOption = useCallback((qIdx: number) => {
    setTouched(true);
    setTest((prev) => {
      const next = [...prev.questions];
      const cur = next[qIdx];
      if (!cur || cur.options.length >= MAX_OPTIONS) return prev;
      next[qIdx] = { ...cur, options: [...cur.options, ''] };
      return { ...prev, questions: next };
    });
  }, []);

  const removeOption = useCallback((qIdx: number, optIdx: number) => {
    setTouched(true);
    setTest((prev) => {
      const next = [...prev.questions];
      const cur = next[qIdx];
      if (!cur || cur.options.length <= MIN_OPTIONS) return prev;
      const opts = cur.options.filter((_, i) => i !== optIdx);
      let correctIndex = cur.correctIndex;
      if (correctIndex === optIdx) correctIndex = 0;
      else if (correctIndex > optIdx) correctIndex -= 1;
      next[qIdx] = { ...cur, options: opts, correctIndex };
      return { ...prev, questions: next };
    });
  }, []);

  const setCorrect = useCallback((qIdx: number, optIdx: number) => {
    setTouched(true);
    setTest((prev) => {
      const next = [...prev.questions];
      const cur = next[qIdx];
      if (!cur) return prev;
      next[qIdx] = { ...cur, correctIndex: optIdx };
      return { ...prev, questions: next };
    });
  }, []);

  const replaceQuestions = useCallback((items: Question[]) => {
    setTouched(true);
    setTest((prev) => ({ ...prev, questions: items }));
  }, []);

  const appendQuestions = useCallback((items: Question[]) => {
    setTouched(true);
    setTest((prev) => ({ ...prev, questions: [...prev.questions, ...items] }));
  }, []);

  const errors = useMemo<TestValidationError[]>(() => validateTest(test), [test]);
  const errorMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of errors) m.set(e.field, e.message);
    return m;
  }, [errors]);

  const save = useCallback(async (): Promise<boolean> => {
    setSubmitAttempted(true);
    if (errors.length > 0) return false;
    setSaving(true);
    try {
      await upsert(test);
      return true;
    } finally {
      setSaving(false);
    }
  }, [errors.length, test, upsert]);

  const showError = (field: string): string | undefined =>
    submitAttempted ? errorMap.get(field) : undefined;

  return {
    test,
    touched,
    saving,
    errors,
    showError,
    setField,
    updateQuestion,
    setOption,
    addQuestion,
    removeQuestion,
    addOption,
    removeOption,
    setCorrect,
    replaceQuestions,
    appendQuestions,
    save,
    minOptions: MIN_OPTIONS,
    maxOptions: MAX_OPTIONS,
  };
};

const idx = (arr: Question[], i: number): number => (i >= 0 && i < arr.length ? i : 0);
