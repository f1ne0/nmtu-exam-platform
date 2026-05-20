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
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@widgets/app-header';
import { useSessionStore } from '@entities/session';
import { useAuthStudent } from '@features/auth-student';
import { ROUTES } from '@shared/config/routes';

export const StudentNamePage = () => {
  const { t } = useTranslation();
  const existingName = useSessionStore((s) => s.studentName);
  const role = useSessionStore((s) => s.role);
  const [name, setName] = useState(existingName ?? '');
  const [groupCode, setGroupCode] = useState('');
  const navigate = useNavigate();
  const { loading, error: errorCode, submit } = useAuthStudent();
  const KNOWN = ['name_too_short', 'code_not_found', 'code_check_failed', 'signin_failed'] as const;
  const error = errorCode
    ? KNOWN.includes(errorCode as typeof KNOWN[number])
      ? t(`authStudent.errors.${errorCode}` as const)
      : errorCode
    : null;

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
              {t('studentName.eyebrow')}
            </Text>
            <Heading fontFamily="heading" fontWeight={500} size="xl" letterSpacing="-0.02em">
              {t('studentName.title')}
            </Heading>
            <Text color="ink.700" fontSize="sm">
              {t('studentName.subtitle')}
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
                {t('studentName.fullNameLabel')}
              </FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                placeholder={t('studentName.fullNamePlaceholder')}
                fontFamily="heading"
                fontSize="lg"
                autoFocus
              />
              <FormHelperText color="ink.500" fontSize="xs">
                {t('studentName.fullNameHelper')}
              </FormHelperText>
            </FormControl>

            <FormControl isInvalid={!!error}>
              <FormLabel
                color="ink.500"
                fontSize="xs"
                letterSpacing="0.06em"
                textTransform="uppercase"
              >
                {t('studentName.groupCodeLabel')}
              </FormLabel>
              <Input
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                placeholder={t('studentName.groupCodePlaceholder')}
                fontFamily="mono"
                fontSize="lg"
                letterSpacing="0.1em"
                maxLength={12}
              />
              {error ? (
                <FormErrorMessage>{error}</FormErrorMessage>
              ) : (
                <FormHelperText color="ink.500" fontSize="xs">
                  {t('studentName.groupCodeHelper')}
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
              {t('studentName.submit')}
            </Button>
          </Stack>
        </Box>
      </Center>
    </Box>
  );
};
