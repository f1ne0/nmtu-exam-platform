import type { ViolationKind } from './types';

export interface CopyBlockerOptions {
  onAttempt: (kind: ViolationKind) => void;
}

const SHORTCUTS_TO_BLOCK = new Set([
  'c', // copy
  'a', // select all
  'p', // print
  's', // save
  'u', // view source
  'i', // devtools
  'j', // devtools console
  'x', // cut
]);

export const installCopyBlocker = ({ onAttempt }: CopyBlockerOptions) => {
  const onCopy = (e: ClipboardEvent) => {
    e.preventDefault();
    onAttempt('copy_attempt');
  };
  const onCut = (e: ClipboardEvent) => {
    e.preventDefault();
    onAttempt('copy_attempt');
  };
  const onPaste = (e: ClipboardEvent) => {
    e.preventDefault();
    onAttempt('paste_attempt');
  };
  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    onAttempt('context_menu');
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    const key = e.key.toLowerCase();
    if (SHORTCUTS_TO_BLOCK.has(key)) {
      e.preventDefault();
      onAttempt('shortcut_block');
    }
    // F12 / Ctrl+Shift+I etc.
    if (e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) {
      e.preventDefault();
      onAttempt('shortcut_block');
    }
  };
  const onF12 = (e: KeyboardEvent) => {
    if (e.key === 'F12') {
      e.preventDefault();
      onAttempt('shortcut_block');
    }
  };

  document.addEventListener('copy', onCopy);
  document.addEventListener('cut', onCut);
  document.addEventListener('paste', onPaste);
  document.addEventListener('contextmenu', onContextMenu);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keydown', onF12);

  return () => {
    document.removeEventListener('copy', onCopy);
    document.removeEventListener('cut', onCut);
    document.removeEventListener('paste', onPaste);
    document.removeEventListener('contextmenu', onContextMenu);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keydown', onF12);
  };
};

export const SELECT_NONE_CSS = {
  userSelect: 'none' as const,
  WebkitUserSelect: 'none' as const,
  MozUserSelect: 'none' as const,
  msUserSelect: 'none' as const,
  WebkitTouchCallout: 'none' as const,
};