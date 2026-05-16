import { Box, type BoxProps } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface Props extends BoxProps {
  children: ReactNode;
}

export const PageContainer = ({ children, ...rest }: Props) => (
  <Box maxW="960px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 6, md: 10 }} {...rest}>
    {children}
  </Box>
);
