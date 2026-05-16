import {
  Box,
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@widgets/app-header';
import { useSessionStore } from '@entities/session';
import { useAuthStudent } from '@features/auth-student';
import { ROUTES } from '@shared/config/routes';

export const StudentNamePage = () => {
  const existingName = useSessionStore((s) => s.studentName);
  const role = useSessionStore((s) => s.role);
  const [name, setName] = useState(existingName ?? '');
  const [groupCode, setGroupCode] = useState('');
  const navigate = useNavigate();
  const { loading, error, submit } = useAuthStudent();

  useEffect(() => {
    if (role === 'student' && existingName) {
      navigate(ROUTES.STUDENT_TESTS, { replace: true });
    }
  }, [role, existingName, navigate]);

  const onSubmit = async () => {
    const ok = await submit(name, groupCode);
    if (ok) navigate(ROUTES.STUDENT_TESTS);
  };

  return (
    <Box minH="100vh" bg="paper.50">
      <AppHeader showLogout={false} />
      <Center px={4} py={{ base: 10, md: 16 }}>
        <Box maxW="480px" w="full">
          <VStack spacing={2} align="stretch" mb={8}>
            <Text
              color="ink.500"
              fontSize="xs"
              letterSpacing="0.16em"
              textTransform="uppercase"
            >
              Студент
            </Text>
            <Heading fontFamily="heading" fontWeight={500} size="xl" letterSpacing="-0.02em">
              Представьтесь
            </Heading>
            <Text color="ink.700" fontSize="sm">
              Имя будет сохранено вместе с результатом и видно преподавателю.
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
                Фамилия и имя
              </FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                placeholder="Например: Иванов Иван"
                fontFamily="heading"
                fontSize="lg"
                autoFocus
              />
              <FormHelperText color="ink.500" fontSize="xs">
                Как в зачётной книжке.
              </FormHelperText>
            </FormControl>

            <FormControl isInvalid={!!error}>
              <FormLabel
                color="ink.500"
                fontSize="xs"
                letterSpacing="0.06em"
                textTransform="uppercase"
              >
                Код группы (опционально)
              </FormLabel>
              <Input
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                placeholder="ABC123"
                fontFamily="mono"
                fontSize="lg"
                letterSpacing="0.1em"
                maxLength={12}
              />
              {error ? (
                <FormErrorMessage>{error}</FormErrorMessage>
              ) : (
                <FormHelperText color="ink.500" fontSize="xs">
                  Если преподаватель выдал код — введите. Без него увидите только общедоступные тесты.
                </FormHelperText>
              )}
            </FormControl>

            <Button
              variant="solid"
              size="lg"
              onClick={onSubmit}
              isLoading={loading}
              isDisabled={name.trim().length < 2}
            >
              Продолжить
            </Button>
          </Stack>
        </Box>
      </Center>
    </Box>
  );
};
