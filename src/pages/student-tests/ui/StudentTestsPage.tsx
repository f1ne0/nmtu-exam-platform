import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Card,
  CardBody,
  Fade,
  Flex,
  HStack,
  Heading,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { CheckCircle2, Clock, Inbox, ListChecks } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@widgets/app-header';
import { EmptyState, LoadingScreen, PageContainer } from '@shared/ui';
import { ROUTES, studentResultPath, studentRunPath } from '@shared/config/routes';
import { listTestsForStudent, type StudentTestSummary } from '@entities/test';
import { gradeColor, getMyResults, type TestResult } from '@entities/result';
import { useSessionStore } from '@entities/session';

export const StudentTestsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const role = useSessionStore((s) => s.role);
  const studentName = useSessionStore((s) => s.studentName);
  const studentGroupId = useSessionStore((s) => s.studentGroupId);
  const studentGroupName = useSessionStore((s) => s.studentGroupName);
  const [tests, setTests] = useState<StudentTestSummary[] | null>(null);
  const [myResults, setMyResults] = useState<TestResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<StudentTestSummary | null>(null);
  const dlg = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (role !== 'student' || !studentName) {
      navigate(ROUTES.STUDENT_NAME, { replace: true });
    }
  }, [role, studentName, navigate]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [t, r] = await Promise.all([
          listTestsForStudent(studentGroupId),
          getMyResults(),
        ]);
        if (!alive) return;
        setTests(t);
        setMyResults(r);
      } catch (e) {
        if (!alive) return;
        setError((e as Error).message ?? t('toast.loadTestsFailed'));
        setTests([]);
        setMyResults([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [studentGroupId, t]);

  const passedByTestId = useMemo(() => {
    const map = new Map<string, TestResult>();
    for (const r of myResults ?? []) map.set(r.testId, r);
    return map;
  }, [myResults]);

  if (role !== 'student' || !studentName) return null;

  const onPick = (t: StudentTestSummary) => {
    setPending(t);
    dlg.onOpen();
  };

  const onConfirmStart = () => {
    if (pending) {
      dlg.onClose();
      navigate(studentRunPath(pending.id));
    }
  };

  const isLoading = tests === null || myResults === null;

  return (
    <Box minH="100vh" bg="paper.50">
      <AppHeader subtitle={t('studentTests.subtitle')} />
      <PageContainer>
        <Flex justify="space-between" align="baseline" mb={6} gap={4} wrap="wrap">
          <Box>
            <Text
              color="ink.500"
              fontSize="xs"
              letterSpacing="0.16em"
              textTransform="uppercase"
              mb={1}
            >
              {t('studentTests.greeting')}
            </Text>
            <Heading fontFamily="heading" fontWeight={500} size="xl" letterSpacing="-0.02em">
              {studentName}
            </Heading>
            {studentGroupName && (
              <Text color="ink.500" fontSize="sm" mt={1} fontFamily="mono">
                {t('studentTests.groupLabel', { name: studentGroupName })}
              </Text>
            )}
          </Box>
        </Flex>

        {isLoading ? (
          <LoadingScreen minH="40vh" />
        ) : error ? (
          <EmptyState icon={Inbox} title={t('studentTests.loadErrorTitle')} description={error} />
        ) : (tests?.length ?? 0) === 0 ? (
          <EmptyState
            icon={Inbox}
            title={t('studentTests.emptyTitle')}
            description={t('studentTests.emptyDescription')}
          />
        ) : (
          <Stack spacing={3}>
            {(tests ?? []).map((t, i) => {
              const passed = passedByTestId.get(t.id);
              return (
                <Fade in key={t.id} transition={{ enter: { delay: 0.03 * i } }}>
                  <StudentTestRow
                    test={t}
                    passed={passed}
                    onStart={() => onPick(t)}
                    onView={
                      passed ? () => navigate(studentResultPath(passed.id)) : undefined
                    }
                  />
                </Fade>
              );
            })}
          </Stack>
        )}
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
              {t('studentTests.confirmTitle')}
            </AlertDialogHeader>
            <AlertDialogBody color="ink.700">
              {pending && (
                <Text
                  dangerouslySetInnerHTML={{
                    __html: t('studentTests.confirmBody', { minutes: pending.durationMinutes }),
                  }}
                />
              )}
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef} variant="ghost" onClick={dlg.onClose}>
                {t('studentTests.back')}
              </Button>
              <Button variant="solid" onClick={onConfirmStart}>
                {t('studentTests.confirmStart')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

interface RowProps {
  test: StudentTestSummary;
  passed: TestResult | undefined;
  onStart: () => void;
  onView: (() => void) | undefined;
}

const StudentTestRow = ({ test, passed, onStart, onView }: RowProps) => {
  const { t } = useTranslation();
  const interactive = !!onView;

  return (
    <Card
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onView}
      cursor={interactive ? 'pointer' : 'default'}
      transition="border-color 150ms, transform 150ms"
      _hover={interactive ? { borderColor: 'accent.500', transform: 'translateY(-1px)' } : undefined}
    >
      <CardBody p={6}>
        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" gap={4}>
          <Box flex="1" minW={0}>
            <Heading size="md" mb={2} noOfLines={2}>
              {test.title || t('studentTests.untitled')}
            </Heading>
            {test.description && (
              <Text color="ink.700" fontSize="sm" noOfLines={3} mb={4}>
                {test.description}
              </Text>
            )}
            <HStack
              spacing={5}
              color="ink.500"
              fontSize="sm"
              flexWrap="wrap"
              fontFamily="mono"
            >
              <HStack spacing={2}>
                <Clock size={16} strokeWidth={1.5} />
                <Text>
                  {test.durationMinutes} {t('common.minutes', { count: test.durationMinutes })}
                </Text>
              </HStack>
              <HStack spacing={2}>
                <ListChecks size={16} strokeWidth={1.5} />
                <Text>
                  {test.questionsCount} {t('common.questions', { count: test.questionsCount })}
                </Text>
              </HStack>
              {passed && (
                <HStack spacing={2} color={gradeColor(passed.percentage)}>
                  <CheckCircle2 size={16} strokeWidth={1.5} />
                  <Text>
                    {t('studentTests.passedBadge', {
                      score: passed.score,
                      total: passed.total,
                      percentage: passed.percentage,
                    })}
                  </Text>
                </HStack>
              )}
            </HStack>
          </Box>
          <Box
            onClick={(e) => e.stopPropagation()}
            w={{ base: 'full', md: 'auto' }}
            mt={{ base: 4, md: 0 }}
          >
            {passed ? (
              <Button
                variant="outline"
                onClick={onView}
                size="lg"
                w={{ base: 'full', md: 'auto' }}
              >
                {t('studentTests.viewResult')}
              </Button>
            ) : (
              <Button
                variant="solid"
                onClick={onStart}
                size="lg"
                w={{ base: 'full', md: 'auto' }}
              >
                {t('studentTests.start')}
              </Button>
            )}
          </Box>
        </Flex>
      </CardBody>
    </Card>
  );
};
