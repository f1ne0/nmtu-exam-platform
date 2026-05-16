import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Box, Button, Center, Heading, Text, VStack } from '@chakra-ui/react';
import { isSupabaseConfigured } from '@shared/api/supabase';
import { useSessionStore } from '@entities/session';
import { LoadingScreen } from '@shared/ui';
import { AppProviders } from './providers/AppProviders';
import { AppRoutes } from './routes';

const Boot = () => {
  const init = useSessionStore((s) => s.init);
  const ready = useSessionStore((s) => s.ready);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        await init();
      } catch (e) {
        setError((e as Error).message ?? 'Не удалось инициализировать сессию');
      }
    })();
  }, [init]);

  if (error) {
    return (
      <Center minH="100vh" px={6}>
        <VStack spacing={4} maxW="520px" textAlign="center">
          <Heading fontFamily="heading" fontWeight={500} size="md">
            Не удалось подключиться к серверу
          </Heading>
          <Text color="ink.700" fontSize="sm">
            {error}
          </Text>
          <Text color="ink.500" fontFamily="mono" fontSize="xs">
            Проверьте подключение к интернету и обратитесь к администратору.
          </Text>
        </VStack>
      </Center>
    );
  }

  if (!ready) return <LoadingScreen />;

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

const NotConfigured = () => (
  <Center minH="100vh" px={6} bg="paper.50">
    <Box maxW="540px" w="full">
      <VStack spacing={5} align="stretch">
        <Heading fontFamily="heading" fontWeight={500} size="lg">
          Exam Platform — сервер не настроен
        </Heading>
        <Text color="ink.700">
          Конфигурация подключения отсутствует. Если вы администратор, проверьте файл{' '}
          <Text as="code" fontFamily="mono" bg="paper.100" px={1}>.env.local</Text> в корне проекта.
        </Text>
        <Text color="ink.500" fontSize="sm">
          Если вы студент или преподаватель — обратитесь к администратору платформы.
        </Text>
        <Button onClick={() => window.location.reload()} variant="outline" alignSelf="flex-start">
          Перезагрузить
        </Button>
      </VStack>
    </Box>
  </Center>
);

export const App = () => (
  <AppProviders>
    {isSupabaseConfigured ? <Boot /> : <NotConfigured />}
  </AppProviders>
);
