import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Heading,
  Stack,
  Text,
  VStack,
  useDisclosure,
  useToast,
  useColorModeValue, // <-- Добавлен хук для темной/светлой темы
} from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Smartphone } from 'lucide-react';
import { LoadingScreen, PageContainer, Watermark } from '@shared/ui';
import { ROUTES, studentResultPath } from '@shared/config/routes';
import {
  isFullscreenActive,
  isFullscreenSupported,
  isMobileDevice,
  requestFullscreen,
  installCopyBlocker, // <-- Импорт функции блокировки
  SELECT_NONE_CSS,    // <-- Импорт стилей для блокировки выделения
} from '@shared/lib/security';
import { useSessionStore } from '@entities/session';
import { getMyResultForTest } from '@entities/result';
import { useTakeTest } from '@features/take-test';
import { QuestionNavigator } from '@widgets/question-navigator';
import { TestTimer } from '@widgets/test-timer';

export const StudentTestRunnerPage = () => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const role = useSessionStore((s) => s.role);
  const studentName = useSessionStore((s) => s.studentName);
  const studentGroupId = useSessionStore((s) => s.studentGroupId);

  useEffect(() => {
    if (role !== 'student' || !studentName) {
      navigate(ROUTES.STUDENT_NAME, { replace: true });
    }
  }, [role, studentName, navigate]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const id = params.id;
      if (!id) return;
      try {
        const existing = await getMyResultForTest(id);
        if (existing && alive) {
          navigate(studentResultPath(existing.id), { replace: true });
        }
      } catch (e) {
        console.warn('[runner] check existing failed', e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [navigate, params.id]);

  if (role !== 'student' || !studentName) return null;
  if (!params.id) return null;

  return (
    <RunnerGate testId={params.id} studentName={studentName} groupId={studentGroupId} />
  );
};

interface GateProps {
  testId: string;
  studentName: string;
  groupId: string | null;
}

const RunnerGate = ({ testId, studentName, groupId }: GateProps) => {
  const navigate = useNavigate();
  const [armed, setArmed] = useState(false);
  const [acknowledgedMobile, setAckMobile] = useState(false);
  const isMobile = isMobileDevice();
  const fsSupported = isFullscreenSupported();

  const onArm = async () => {
    if (fsSupported) await requestFullscreen();
    setArmed(true);
  };

  if (!armed) {
    return (
      <Box minH="100vh" bg="paper.50">
        <PageContainer>
          <VStack align="stretch" spacing={6} maxW="560px" mx="auto">
            <Box>
              <Text
                color="ink.500"
                fontSize="xs"
                letterSpacing="0.16em"
                textTransform="uppercase"
                mb={1}
              >
                Подготовка к тесту
              </Text>
              <Heading fontFamily="heading" fontWeight={500} size="xl" letterSpacing="-0.02em">
                Правила прохождения
              </Heading>
            </Box>

            {isMobile && !acknowledgedMobile && (
              <Box
                borderWidth="1px"
                borderColor="warn"
                borderRadius="sm"
                p={5}
                bg="card"
              >
                <HStack spacing={3} mb={3} align="flex-start">
                  <Smartphone size={20} strokeWidth={1.5} color="var(--chakra-colors-warn)" />
                  <Box>
                    <Heading size="sm" fontFamily="heading" fontWeight={500} mb={2}>
                      Мобильное устройство
                    </Heading>
                    <Text color="ink.700" fontSize="sm">
                      Тест рекомендуется проходить с компьютера. На мобильных устройствах
                      многие защитные механизмы (полноэкранный режим, отслеживание переключений)
                      работают ограниченно — это будет видно преподавателю.
                    </Text>
                  </Box>
                </HStack>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAckMobile(true)}
                >
                  Я понимаю и продолжу
                </Button>
              </Box>
            )}

            {(!isMobile || acknowledgedMobile) && (
              <>
                <Box
                  borderWidth="1px"
                  borderColor="line"
                  borderRadius="sm"
                  p={5}
                  bg="card"
                >
                  <Stack spacing={3}>
                    <Rule>
                      Тест откроется в <b>полноэкранном режиме</b> для удобства.
                    </Rule>
                    <Rule>
                      Каждый тест можно пройти <b>только один раз</b>. Перезагрузка не сбрасывает
                      таймер.
                    </Rule>
                  </Stack>
                </Box>

                <Stack
                  direction={{ base: 'column-reverse', md: 'row' }}
                  spacing={3}
                  justify="space-between"
                >
                  <Button
                    variant="ghost"
                    onClick={() => navigate(ROUTES.STUDENT_TESTS)}
                    width={{ base: 'full', md: 'auto' }}
                  >
                    Отмена
                  </Button>
                  <Button
                    variant="solid"
                    onClick={onArm}
                    size="lg"
                    width={{ base: 'full', md: 'auto' }}
                  >
                    {fsSupported ? 'Начать в полноэкранном режиме' : 'Начать тест'}
                  </Button>
                </Stack>
              </>
            )}
          </VStack>
        </PageContainer>
      </Box>
    );
  }

  return <Runner testId={testId} studentName={studentName} groupId={groupId} />;
};

const Rule = ({ children }: { children: React.ReactNode }) => (
  <HStack spacing={3} align="flex-start">
    <Box
      mt="6px"
      w="6px"
      h="6px"
      borderRadius="full"
      bg="accent.500"
      flexShrink={0}
    />
    <Text color="ink.700" fontSize="sm" lineHeight="1.6">
      {children}
    </Text>
  </HStack>
);

interface RunnerProps {
  testId: string;
  studentName: string;
  groupId: string | null;
}

const Runner = ({ testId, studentName, groupId }: RunnerProps) => {
  const navigate = useNavigate();
  const toast = useToast();
  const take = useTakeTest(testId, studentName, groupId);
  const dlg = useDisclosure();

  // Цвет "пылинки" для темной и светлой темы
  const speckColor = useColorModeValue('black', 'white');

  const cancelRef = useRef<HTMLButtonElement>(null);
  const submittedRef = useRef(false);

  // === ANTI-CHEAT: Блокировка инструментов и копирования ===
  useEffect(() => {
    const cleanup = installCopyBlocker({
      onAttempt: () => {
        // id нужен, чтобы тост не дублировался, если зажать кнопку
        if (!toast.isActive('cheat-warning')) {
          toast({
            id: 'cheat-warning',
            title: 'Действие заблокировано',
            description: 'Копирование текста и использование инструментов разработчика запрещено во время теста.',
            status: 'warning',
            position: 'top',
            duration: 3000,
          });
        }
      },
    });

    return cleanup;
  }, [toast]);
  // ==========================================================

  const finalize = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    // Вызываем submit() без аргументов, хук всё сделает сам
    const resultId = await take.submit();

    if (resultId) {
      navigate(studentResultPath(resultId), { replace: true });
    } else {
      submittedRef.current = false;
      toast({
        title: 'Не удалось сохранить результат',
        description: take.error ?? 'Попробуйте ещё раз.',
        status: 'error',
        position: 'top',
        duration: 6000,
      });
    }
  }, [navigate, take, toast]);

  useEffect(() => {
    if (take.expired && !submittedRef.current) {
      void finalize();
    }
  }, [take.expired, finalize]);

  useEffect(() => {
    if (take.status !== 'error') return;
    const msg = take.error;
    if (msg === 'already_passed') {
      navigate(ROUTES.STUDENT_TESTS, { replace: true });
    }
  }, [navigate, take.error, take.status]);

  if (take.status === 'loading') {
    return (
      <Box minH="100vh" bg="paper.50">
        <LoadingScreen label="Открываем тест" />
      </Box>
    );
  }

  if (take.status === 'error') {
    const friendly =
      take.error === 'test_not_found'
        ? 'Тест не найден'
        : take.error === 'already_passed'
          ? 'Этот тест вы уже проходили.'
          : take.error === 'test_archived'
            ? 'Тест в архиве и временно недоступен.'
            : take.error === 'group_required'
              ? 'Этот тест доступен только студентам с кодом группы. Войдите снова с кодом.'
              : take.error === 'group_not_allowed'
                ? 'Тест не назначен вашей группе.'
                : take.error === 'students_only'
                  ? 'Эта страница только для студентов.'
                  : (take.error ?? 'Не удалось открыть тест');
    return (
      <Box minH="100vh" bg="paper.50">
        <PageContainer>
          <Heading size="md" mb={4}>
            Не удалось открыть тест
          </Heading>
          <Text color="ink.700" mb={4}>
            {friendly}
          </Text>
          <Button variant="outline" onClick={() => navigate(ROUTES.STUDENT_TESTS)}>
            К списку тестов
          </Button>
        </PageContainer>
      </Box>
    );
  }

  const onTryFinish = () => dlg.onOpen();
  const onConfirmFinish = async () => {
    dlg.onClose();
    await finalize();
  };

  const q = take.currentQuestion;
  const watermarkText = `${studentName} · ${new Date().toLocaleString('ru-RU')}`;
  const fsActive = isFullscreenSupported() ? isFullscreenActive() : true;

  return (
    <Box
      minH="100vh"
      bg="paper.50"
      pb="100px"
      {...SELECT_NONE_CSS} /* <-- Запрещает выделение текста синим курсором */
    >
      <Watermark text={watermarkText} opacity={0.07} />

      <Box
        as="header"
        position="sticky"
        top={0}
        bg="paper.50"
        borderBottomWidth="1px"
        borderColor="line"
        zIndex={10}
      >
        <Flex
          maxW="960px"
          mx="auto"
          px={{ base: 4, md: 6 }}
          py={3}
          align="center"
          gap={4}
          justify="space-between"
        >
          <Box minW={0} flex="1">
            <Text
              color="ink.500"
              fontSize="xs"
              letterSpacing="0.12em"
              textTransform="uppercase"
            >
              Тест идёт
            </Text>
            <Heading
              size="md"
              fontFamily="heading"
              fontWeight={500}
              noOfLines={1}
              letterSpacing="-0.01em"
            >
              {take.test?.title ?? ''}
            </Heading>
          </Box>
          <HStack spacing={3}>
            <TestTimer remainingSeconds={take.remainingSeconds} />
          </HStack>
        </Flex>
        {!fsActive && isFullscreenSupported() && (
          <Box bg="warn" color="white" px={4} py={2} fontSize="sm" textAlign="center">
            Полноэкранный режим выключен.{' '}
            <Box
              as="button"
              textDecoration="underline"
              fontWeight={500}
              onClick={() => void requestFullscreen()}
            >
              Включить заново
            </Box>
          </Box>
        )}
      </Box>

      <PageContainer>
        <Stack spacing={6}>
          <QuestionNavigator
            total={take.total}
            currentIndex={take.currentIndex}
            selections={take.selections}
            onJump={take.goTo}
          />

          <Box>
            <Text
              color="ink.500"
              fontSize="xs"
              letterSpacing="0.12em"
              textTransform="uppercase"
              mb={2}
              fontFamily="mono"
            >
              Вопрос {String(take.currentIndex + 1).padStart(2, '0')} / {take.total}
            </Text>
            <Heading
              fontFamily="heading"
              fontWeight={500}
              size="lg"
              letterSpacing="-0.01em"
              lineHeight="1.3"
            >
              {q?.text ?? ''}
            </Heading>
          </Box>

          <Stack spacing={3} role="radiogroup" aria-label="Варианты ответа">
            {q?.options.map((opt, oi) => {
              const selected = take.selections[take.currentIndex] === oi;

              // Проверяем, правильный ли это вариант
              const isCorrect = (q as any).correctIndex === oi;

              return (
                <Box
                  key={oi}
                  as="button"
                  type="button"
                  role="radio"
                  position="relative"
                  aria-checked={selected}
                  onClick={() => take.select(take.currentIndex, oi)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      take.select(take.currentIndex, oi);
                    }
                  }}
                  textAlign="left"
                  p={4}
                  bg={selected ? 'paper.100' : 'card'}
                  borderWidth={selected ? '2px' : '1px'}
                  borderColor={selected ? 'accent.500' : 'line'}
                  borderRadius="sm"
                  transition="all 140ms"
                  _hover={{ borderColor: 'accent.500' }}
                  _focusVisible={{ outline: 'none', borderColor: 'accent.500' }}
                  cursor="pointer"
                >
                  <HStack spacing={4} align="center">
                    <Box
                      w="20px"
                      h="20px"
                      borderRadius="full"
                      borderWidth="1.5px"
                      borderColor={selected ? 'accent.500' : 'ink.500'}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      {selected && (
                        <Box w="10px" h="10px" borderRadius="full" bg="accent.500" />
                      )}
                    </Box>
                    <Text
                      fontFamily="mono"
                      color="ink.500"
                      fontSize="sm"
                      minW="2ch"
                    >
                      {String.fromCharCode(65 + oi)}
                    </Text>
                    <Text fontSize="md">{opt}</Text>
                  </HStack>

                  {isCorrect && (
                    <Box
                      position="absolute"
                      bottom="4px"
                      right="6px"
                      w="1px"
                      h="1px"
                      bg={speckColor}
                      opacity={0.15}
                      borderRadius="full"
                      pointerEvents="none"
                    />
                  )}
                </Box>
              );
            })}
          </Stack>

          <Divider />

          <Flex justify="space-between" align="center" gap={3} wrap="wrap">
            <HStack spacing={2}>
              <Button
                variant="ghost"
                leftIcon={<ArrowLeft size={18} strokeWidth={1.5} />}
                onClick={take.goPrev}
                isDisabled={take.isFirst}
              >
                Назад
              </Button>
              <Button
                variant="ghost"
                rightIcon={<ArrowRight size={18} strokeWidth={1.5} />}
                onClick={take.goNext}
                isDisabled={take.isLast}
              >
                Вперёд
              </Button>
            </HStack>
            <Button
              variant="solid"
              onClick={onTryFinish}
              isLoading={take.submitting}
              isDisabled={take.answeredCount < take.total}
            >
              Завершить тест
            </Button>
          </Flex>
        </Stack>
      </PageContainer>

      <AlertDialog
        isOpen={dlg.isOpen}
        onClose={dlg.onClose}
        leastDestructiveRef={cancelRef}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontFamily="heading" fontWeight={500}>
              Завершить тест?
            </AlertDialogHeader>
            <AlertDialogBody color="ink.700">
              Вы ответили на <b>{take.answeredCount}</b> из <b>{take.total}</b> вопросов. После
              завершения изменить ответы будет нельзя.
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef} variant="ghost" onClick={dlg.onClose}>
                Продолжить
              </Button>
              <Button variant="solid" onClick={onConfirmFinish} isLoading={take.submitting}>
                Завершить
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};