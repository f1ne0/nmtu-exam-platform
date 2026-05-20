interface FsDocument extends Document {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
}

interface FsElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

export const isFullscreenSupported = (): boolean => {
  if (typeof document === 'undefined') return false;
  const el = document.documentElement as FsElement;
  return !!(
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen
  );
};

export const isFullscreenActive = (): boolean => {
  if (typeof document === 'undefined') return false;
  const d = document as FsDocument;
  return !!(
    d.fullscreenElement ||
    d.webkitFullscreenElement ||
    d.mozFullScreenElement ||
    d.msFullscreenElement
  );
};

export const requestFullscreen = async (): Promise<void> => {
  const el = document.documentElement as FsElement;
  try {
    if (el.requestFullscreen) await el.requestFullscreen();
    else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
    else if (el.msRequestFullscreen) await el.msRequestFullscreen();
  } catch (e) {
    console.warn('[fullscreen] request failed', e);
  }
};
