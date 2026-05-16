import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <Box minH="100vh" bg="paper.50" display="flex" alignItems="center" justifyContent="center" px={6}>
          <VStack spacing={4} maxW="480px" textAlign="center">
            <Heading fontFamily="heading" fontWeight={500}>
              Что-то пошло не так
            </Heading>
            <Text color="ink.700">
              Попробуйте обновить страницу. Если ошибка повторяется — сообщите преподавателю.
            </Text>
            <Text color="ink.500" fontFamily="mono" fontSize="xs">
              {this.state.error.message}
            </Text>
            <Button onClick={() => window.location.reload()} variant="solid">
              Перезагрузить
            </Button>
          </VStack>
        </Box>
      );
    }
    return this.props.children;
  }
}
