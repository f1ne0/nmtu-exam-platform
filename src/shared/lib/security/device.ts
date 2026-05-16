export const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/Mobi|Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(ua)) return true;
  // iPadOS 13+ маскируется под Mac, но имеет тач.
  if (
    typeof navigator.maxTouchPoints === 'number' &&
    navigator.maxTouchPoints > 1 &&
    /Macintosh/.test(ua)
  ) {
    return true;
  }
  return false;
};
