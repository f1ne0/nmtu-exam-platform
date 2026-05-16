import { ChakraProvider, ColorModeScript, type ThemeConfig } from '@chakra-ui/react';
import { Global } from '@emotion/react';
import type { ReactNode } from 'react';
import { theme } from '@shared/config/theme';
import { globalCss } from '../styles/global';
import { ErrorBoundary } from './ErrorBoundary';

interface Props {
  children: ReactNode;
}

const config: ThemeConfig = theme.config;

export const AppProviders = ({ children }: Props) => (
  <>
    <ColorModeScript initialColorMode={config.initialColorMode} />
    <ChakraProvider theme={theme} resetCSS>
      <Global styles={globalCss} />
      <ErrorBoundary>{children}</ErrorBoundary>
    </ChakraProvider>
  </>
);
