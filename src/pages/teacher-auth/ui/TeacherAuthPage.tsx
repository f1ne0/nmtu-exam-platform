import {
  Box,
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@widgets/app-header';
import { ROUTES } from '@shared/config/routes';
import { useSessionStore } from '@entities/session';
import { useAuthTeacher } from '@features/auth-teacher';

export const TeacherAuthPage = () => {
  const { t } = useTranslation();
  const { loading, error, submit, clearError } = useAuthTeacher();
  const navigate = useNavigate();
  const role = useSessionStore((s) => s.role);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (role === 'teacher') navigate(ROUTES.TEACHER_DASHBOARD, { replace: true });
  }, [role, navigate]);

  useEffect(() => {
    clearError();
  }, [email, password, clearError]);

  const onSubmit = async () => {
    const ok = await submit(email, password);
    if (ok) navigate(ROUTES.TEACHER_DASHBOARD);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void onSubmit();
  };

  return (
    <Box minH="100vh" bg="paper.50">
      <AppHeader showLogout={false} />
      <Center px={4} py={{ base: 10, md: 16 }}>
        <Box maxW="420px" w="full">
          <VStack spacing={2} align="stretch" mb={8}>
            <Text
              color="ink.500"
              fontSize="xs"
              letterSpacing="0.16em"
              textTransform="uppercase"
            >
              {t('teacherAuth.eyebrow')}
            </Text>
            <Heading fontFamily="heading" fontWeight={500} size="xl" letterSpacing="-0.02em">
              {t('teacherAuth.title')}
            </Heading>
            <Text color="ink.700" fontSize="sm">
              {t('teacherAuth.subtitle')}
            </Text>
          </VStack>

          <Stack spacing={6}>
            <FormControl isInvalid={!!error}>
              <FormLabel
                color="ink.500"
                fontSize="xs"
                letterSpacing="0.06em"
                textTransform="uppercase"
              >
                {t('teacherAuth.emailLabel')}
              </FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="teacher@example.com"
                fontFamily="mono"
                autoFocus
                autoComplete="username"
              />
            </FormControl>

            <FormControl isInvalid={!!error}>
              <FormLabel
                color="ink.500"
                fontSize="xs"
                letterSpacing="0.06em"
                textTransform="uppercase"
              >
                {t('teacherAuth.passwordLabel')}
              </FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="••••••••"
                fontFamily="mono"
                autoComplete="current-password"
              />
              {error && <FormErrorMessage>{error}</FormErrorMessage>}
            </FormControl>

            <Button
              variant="solid"
              isLoading={loading}
              onClick={onSubmit}
              isDisabled={!email.trim() || !password}
              size="lg"
              borderRadius="sm"
            >
              {t('teacherAuth.submit')}
            </Button>
          </Stack>
        </Box>
      </Center>
    </Box>
  );
};
