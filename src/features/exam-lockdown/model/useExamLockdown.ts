import { useCallback, useEffect, useRef, useState } from 'react';
import {
  installCopyBlocker,
  installFullscreenWatchdog,
  installVisibilityWatchdog,
  type ViolationKind,
} from '@shared/lib/security';
import { recordViolation } from '@entities/attempt';

interface Options {
  testId: string;
  enabled: boolean;
  onAutoSubmit: () => void;
  threshold?: number;
}

interface State {
  violationsCount: number;
  lastViolation: ViolationKind | null;
  warning: string | null;
}

const FRIENDLY: Record<ViolationKind, string> = {
  visibility_hidden: 'Вы свернули вкладку',
  fullscreen_exit: 'Вы вышли из полноэкранного режима',
  copy_attempt: 'Копирование запрещено',
  paste_attempt: 'Вставка запрещена',
  context_menu: 'Контекстное меню отключено',
  shortcut_block: 'Эта комбинация клавиш отключена',
  devtools_open: 'Инструменты разработчика запрещены',
  window_blur: 'Вы переключились на другое окно',
};

export const useExamLockdown = ({
  testId,
  enabled,
  onAutoSubmit,
  threshold = 3,
}: Options) => {
  const [state, setState] = useState<State>({
    violationsCount: 0,
    lastViolation: null,
    warning: null,
  });
  const submittedRef = useRef(false);
  const onAutoSubmitRef = useRef(onAutoSubmit);
  useEffect(() => {
    onAutoSubmitRef.current = onAutoSubmit;
  }, [onAutoSubmit]);

  const reportViolation = useCallback(
    (kind: ViolationKind) => {
      // Не дублировать после автосдачи.
      if (submittedRef.current) return;

      void recordViolation(testId, kind);

      setState((prev) => {
        const count = prev.violationsCount + 1;
        const friendly = FRIENDLY[kind] ?? 'Нарушение правил';
        let warn = `${friendly}. Нарушение ${count} из ${threshold}.`;
        if (count >= threshold) warn = 'Тест автоматически завершён из-за нарушений.';
        return {
          violationsCount: count,
          lastViolation: kind,
          warning: warn,
        };
      });
    },
    [testId, threshold],
  );

  // Подключение защит.
  useEffect(() => {
    if (!enabled) return;
    const offCopy = installCopyBlocker({ onAttempt: reportViolation });
    const offVis = installVisibilityWatchdog({ onViolation: reportViolation });
    const offFs = installFullscreenWatchdog({ onExit: reportViolation });
    return () => {
      offCopy();
      offVis();
      offFs();
    };
  }, [enabled, reportViolation]);

  // Автосдача после превышения порога.
  useEffect(() => {
    if (!enabled) return;
    if (state.violationsCount >= threshold && !submittedRef.current) {
      submittedRef.current = true;
      // Дать тосту/баннеру показаться, потом сдать.
      const t = window.setTimeout(() => onAutoSubmitRef.current(), 1200);
      return () => window.clearTimeout(t);
    }
  }, [enabled, state.violationsCount, threshold]);

  const dismissWarning = useCallback(() => {
    setState((prev) => ({ ...prev, warning: null }));
  }, []);

  return {
    violationsCount: state.violationsCount,
    threshold,
    lastViolation: state.lastViolation,
    warning: state.warning,
    dismissWarning,
  };
};
