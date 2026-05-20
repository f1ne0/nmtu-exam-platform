export type ViolationKind =
  | 'visibility_hidden'
  | 'fullscreen_exit'
  | 'copy_attempt'
  | 'paste_attempt'
  | 'context_menu'
  | 'shortcut_block'
  | 'devtools_open'
  | 'window_blur';

export interface SecurityEvent {
  kind: ViolationKind;
  at: number;
}