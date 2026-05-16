const pad2 = (n: number): string => (n < 10 ? `0${n}` : `${n}`);

export const formatDate = (ts: number): string => {
  const d = new Date(ts);
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
};

export const formatDateTime = (ts: number): string => {
  const d = new Date(ts);
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

export const formatTime = (totalSeconds: number): string => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${pad2(m)}:${pad2(s)}`;
};

export const pluralizeRu = (
  n: number,
  forms: readonly [string, string, string],
): string => {
  const abs = Math.abs(n) % 100;
  const tens = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (tens > 1 && tens < 5) return forms[1];
  if (tens === 1) return forms[0];
  return forms[2];
};
