import { Box } from '@chakra-ui/react';
import { useMemo } from 'react';

interface Props {
  text: string;
  opacity?: number;
}

export const Watermark = ({ text, opacity = 0.1 }: Props) => {
  // Кодируем текст в SVG-data-url, чтобы получить tile-pattern бесконечного фона.
  const url = useMemo(() => {
    const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="380" height="220" viewBox="0 0 380 220">
  <g transform="rotate(-30 190 110)" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="13" fill="#1A1814" fill-opacity="${opacity}">
    <text x="0" y="40">${safe}</text>
    <text x="60" y="120">${safe}</text>
    <text x="-40" y="200">${safe}</text>
  </g>
</svg>`;
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  }, [text, opacity]);

  return (
    <Box
      aria-hidden
      pointerEvents="none"
      position="fixed"
      inset={0}
      zIndex={9999}
      style={{
        backgroundImage: url,
        backgroundRepeat: 'repeat',
      }}
    />
  );
};
