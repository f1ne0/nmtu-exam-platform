import type { ViolationKind } from './types';

export interface VisibilityWatchdogOptions {
  onViolation: (kind: ViolationKind) => void;
}

export const installVisibilityWatchdog = ({ onViolation }: VisibilityWatchdogOptions) => {
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      onViolation('visibility_hidden');
    }
  };
  const onBlur = () => {
    onViolation('window_blur');
  };

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('blur', onBlur);

  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('blur', onBlur);
  };
};
