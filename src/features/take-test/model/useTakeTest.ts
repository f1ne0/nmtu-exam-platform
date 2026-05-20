import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  startAttempt,
  submitAttempt,
  updateAttempt,
  type Attempt,
  type AttemptStartTestMeta,
} from '@entities/attempt';

interface State {
  status: 'loading' | 'ready' | 'error' | 'submitting' | 'submitted';
  attempt: Attempt | null;
  test: AttemptStartTestMeta | null;
  error: string | null;
  resultId: string | null;
}

export const useTakeTest = (
  testId: string,
  studentName: string,
  groupId: string | null = null,
) => {
  const [state, setState] = useState<State>({
    status: 'loading',
    attempt: null,
    test: null,
    error: null,
    resultId: null,
  });
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    void (async () => {
      try {
        const { attempt, test } = await startAttempt(testId, studentName, groupId);
        setState({
          status: 'ready',
          attempt,
          test,
          error: null,
          resultId: null,
        });
      } catch (e) {
        const msg = (e as Error).message ?? 'start_failed';
        setState({
          status: 'error',
          attempt: null,
          test: null,
          error: msg,
          resultId: null,
        });
      }
    })();
  }, [groupId, studentName, testId]);

  const totalSeconds = (state.test?.durationMinutes ?? 0) * 60;
  const startedAtMs = state.attempt?.startedAt ?? Date.now();
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!state.attempt || !state.test) return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAtMs) / 1000);
      const left = Math.max(0, totalSeconds - elapsed);
      setRemainingSeconds(left);
      if (left <= 0) setExpired(true);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [state.attempt, state.test, startedAtMs, totalSeconds]);

  const attemptIdRef = useRef<string | null>(null);
  attemptIdRef.current = state.attempt?.id ?? null;
  const pendingRef = useRef<{ selections?: Array<number | null>; currentIndex?: number }>({});
  const timerRef = useRef<number | null>(null);

  const flush = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const id = attemptIdRef.current;
    const patch = pendingRef.current;
    if (!id || Object.keys(patch).length === 0) return;
    pendingRef.current = {};
    void updateAttempt(id, patch).catch((e) =>
      console.warn('[take-test] persist failed', e),
    );
  }, []);

  const persist = useCallback(
    (patch: { selections?: Array<number | null>; currentIndex?: number }) => {
      pendingRef.current = { ...pendingRef.current, ...patch };
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(flush, 500);
    },
    [flush],
  );

  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener('beforeunload', onHide);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('beforeunload', onHide);
      document.removeEventListener('visibilitychange', onHide);
      flush();
    };
  }, [flush]);

  const select = useCallback(
    (qIdx: number, optIdx: number) => {
      setState((prev) => {
        if (!prev.attempt) return prev;
        const next = [...prev.attempt.selections];
        next[qIdx] = optIdx;
        persist({ selections: next });
        return { ...prev, attempt: { ...prev.attempt, selections: next } };
      });
    },
    [persist],
  );

  const goTo = useCallback(
    (i: number) => {
      setState((prev) => {
        if (!prev.attempt) return prev;
        if (i < 0 || i >= prev.attempt.shuffledQuestions.length) return prev;
        persist({ currentIndex: i });
        return { ...prev, attempt: { ...prev.attempt, currentIndex: i } };
      });
    },
    [persist],
  );

  const goNext = useCallback(() => {
    if (!state.attempt) return;
    goTo(Math.min(state.attempt.currentIndex + 1, state.attempt.shuffledQuestions.length - 1));
  }, [goTo, state.attempt]);

  const goPrev = useCallback(() => {
    if (!state.attempt) return;
    goTo(Math.max(state.attempt.currentIndex - 1, 0));
  }, [goTo, state.attempt]);

  // =========================================================
  // ИЗМЕНЕННАЯ ФУНКЦИЯ SUBMIT (проверка ответов на клиенте)
  // =========================================================
  const submit = useCallback(async (): Promise<string | null> => {
    if (!state.attempt) return null;
    flush();
    setState((prev) => ({ ...prev, status: 'submitting', error: null }));

    try {
      const questions = state.attempt.shuffledQuestions;
      const selections = state.attempt.selections;

      let correctCount = 0;

      // 1. Подсчитываем правильные ответы
      questions.forEach((q, idx) => {
        if (selections[idx] === q.correctIndex) {
          correctCount++;
        }
      });

      // 2. Считаем процент правильных ответов
      const totalQuestions = questions.length;
      const scorePercentage = totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;

      // 3. Отправляем на сервер вычисленные баллы
      // ВНИМАНИЕ: Вам нужно обновить функцию submitAttempt,
      // чтобы она принимала эти новые аргументы!
      const { resultId } = await submitAttempt(
        testId,
        selections,
        correctCount,
        scorePercentage
      );

      setState((prev) => ({ ...prev, status: 'submitted', resultId }));
      return resultId;
    } catch (e) {
      const msg = (e as Error).message ?? 'finish_failed';
      setState((prev) => ({ ...prev, status: 'ready', error: msg }));
      return null;
    }
  }, [flush, state.attempt, testId]);

  const answeredCount = useMemo(
    () => (state.attempt ? state.attempt.selections.filter((s) => s !== null).length : 0),
    [state.attempt],
  );

  if (state.status === 'loading' || state.status === 'error' || !state.attempt || !state.test) {
    return {
      status: state.status,
      error: state.error,
      attempt: null as Attempt | null,
      test: null as AttemptStartTestMeta | null,
      shuffled: [],
      selections: [] as Array<number | null>,
      currentIndex: 0,
      currentQuestion: undefined,
      remainingSeconds,
      expired: false,
      answeredCount: 0,
      total: 0,
      isFirst: true,
      isLast: true,
      submitting: false,
      resultId: null as string | null,
      select,
      goNext,
      goPrev,
      goTo,
      submit,
    };
  }

  return {
    status: state.status,
    error: state.error,
    attempt: state.attempt,
    test: state.test,
    shuffled: state.attempt.shuffledQuestions,
    selections: state.attempt.selections,
    currentIndex: state.attempt.currentIndex,
    currentQuestion: state.attempt.shuffledQuestions[state.attempt.currentIndex],
    remainingSeconds,
    expired,
    answeredCount,
    total: state.attempt.shuffledQuestions.length,
    isFirst: state.attempt.currentIndex === 0,
    isLast: state.attempt.currentIndex === state.attempt.shuffledQuestions.length - 1,
    submitting: state.status === 'submitting',
    resultId: state.resultId,
    select,
    goNext,
    goPrev,
    goTo,
    submit,
  };
};

export type TakeTestApi = ReturnType<typeof useTakeTest>;