import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

export const theme = extendTheme({
  config,
  colors: {
    // Зелёные оттенки светлой темы (мягкая бумажная зелень).
    paperLight: { 50: '#F2F4EC', 100: '#E5EBD8' },
    inkLight: { 900: '#15201A', 700: '#3D4A40', 500: '#6F7B71' },
    // Чистый нейтральный чёрный для тёмной темы — без зелёного подтона.
    paperDark: { 50: '#0E0E0E', 100: '#1A1A1A' },
    inkDark: { 900: '#F4F4F4', 700: '#B0B0B0', 500: '#7A7A7A' },
    // Палитры для светлой и тёмной темы. Имена НЕ совпадают с semantic
    // токенами (accent.*), чтобы исключить циклические ссылки.
    accentLight: {
      50: '#EAF3EC',
      100: '#CCE0CF',
      200: '#A4C7AB',
      300: '#7CAE87',
      400: '#558E63',
      500: '#2F6B3F',
      600: '#235430',
      700: '#1A4024',
      800: '#122C19',
      900: '#0B1A0F',
    },
    // Яркий читаемый зелёный для тёмной темы (близко к iOS system green).
    accentNight: {
      50: '#0E1A12',
      100: '#163021',
      200: '#1F4A33',
      300: '#296748',
      400: '#33875D',
      500: '#3FB071',
      600: '#5BC78A',
      700: '#85D6A6',
      800: '#B0E5C2',
      900: '#D8F2DE',
    },
    ok: '#2D5A3D',
    okDark: '#5DD692',
    warn: '#9A7218',
    warnDark: '#E8B95E',
    err: '#A03030',
    errDark: '#FF6B6B',
  },
  semanticTokens: {
    colors: {
      'paper.50':    { default: 'paperLight.50',  _dark: 'paperDark.50' },
      'paper.100':   { default: 'paperLight.100', _dark: 'paperDark.100' },
      'card':        { default: '#FFFFFF',        _dark: '#161616' },
      'ink.900':     { default: 'inkLight.900',   _dark: 'inkDark.900' },
      'ink.700':     { default: 'inkLight.700',   _dark: 'inkDark.700' },
      'ink.500':     { default: 'inkLight.500',   _dark: 'inkDark.500' },
      'line':        { default: '#D2DCC2',        _dark: '#2A2A2A' },
      'accent.500':  { default: 'accentLight.500', _dark: 'accentNight.500' },
      'accent.600':  { default: 'accentLight.600', _dark: 'accentNight.600' },
      'ok':          { default: '#2D5A3D',        _dark: 'okDark' },
      'warn':        { default: '#9A7218',        _dark: 'warnDark' },
      'err':         { default: '#A03030',        _dark: 'errDark' },
    },
  },
  fonts: {
    heading: `'Fraunces', Georgia, serif`,
    body: `'IBM Plex Sans', system-ui, sans-serif`,
    mono: `'IBM Plex Mono', ui-monospace, monospace`,
  },
  radii: { sm: '2px', md: '2px', lg: '4px' },
  shadows: { sm: 'none', md: 'none' },
  styles: {
    global: {
      body: { bg: 'paper.50', color: 'ink.900' },
      '*::selection': { bg: 'accent.500', color: 'white' },
    },
  },
  components: {
    Button: {
      baseStyle: { borderRadius: 'sm', fontWeight: 500, letterSpacing: '0.01em' },
      variants: {
        solid: () => ({
          bg: 'accent.500',
          color: 'white',
          _hover: { bg: 'accent.600', _disabled: { bg: 'accent.500' } },
          _active: { bg: 'accent.600' },
          _disabled: { opacity: 0.5 },
        }),
        outline: () => ({
          borderWidth: '1px',
          borderColor: 'line',
          color: 'ink.900',
          bg: 'transparent',
          _hover: { bg: 'paper.100', borderColor: 'accent.500' },
          _active: { bg: 'paper.100' },
        }),
        ghost: () => ({
          color: 'ink.700',
          bg: 'transparent',
          _hover: { bg: 'paper.100', color: 'ink.900' },
          _active: { bg: 'paper.100' },
        }),
      },
      defaultProps: { variant: 'solid' },
    },
    IconButton: {
      baseStyle: { borderRadius: 'sm' },
      defaultProps: { variant: 'ghost' },
    },
    Input: {
      defaultProps: { variant: 'flushed' },
      variants: {
        flushed: {
          field: {
            borderColor: 'line',
            _focus: { borderColor: 'accent.500', boxShadow: 'none' },
            _placeholder: { color: 'ink.500' },
          },
        },
      },
    },
    Textarea: {
      defaultProps: { variant: 'flushed' },
      variants: {
        flushed: {
          borderColor: 'line',
          _focus: { borderColor: 'accent.500', boxShadow: 'none' },
          _placeholder: { color: 'ink.500' },
        },
      },
    },
    NumberInput: {
      defaultProps: { variant: 'flushed' },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'card',
          borderWidth: '1px',
          borderColor: 'line',
          borderRadius: 'sm',
          boxShadow: 'none',
        },
      },
    },
    Heading: {
      baseStyle: { fontWeight: 500, letterSpacing: '-0.01em' },
    },
    Tabs: {
      variants: {
        line: {
          tab: {
            color: 'ink.700',
            borderColor: 'transparent',
            fontWeight: 500,
            _selected: { color: 'accent.500', borderColor: 'accent.500' },
          },
          tablist: { borderColor: 'line' },
        },
      },
      defaultProps: { variant: 'line' },
    },
    Table: {
      variants: {
        simple: {
          th: {
            color: 'ink.500',
            borderColor: 'line',
            fontFamily: 'body',
            fontWeight: 500,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontSize: 'xs',
          },
          td: { borderColor: 'line' },
        },
      },
    },
    Drawer: {
      baseStyle: {
        dialog: { bg: 'paper.50' },
      },
    },
    Modal: {
      baseStyle: {
        dialog: { bg: 'card', borderRadius: 'sm' },
      },
    },
    Divider: {
      baseStyle: { borderColor: 'line' },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: 'card',
          borderColor: 'line',
          borderRadius: 'sm',
          boxShadow: 'none',
          py: 1,
        },
        item: {
          bg: 'card',
          _hover: { bg: 'paper.100' },
          _focus: { bg: 'paper.100' },
        },
      },
    },
  },
});
