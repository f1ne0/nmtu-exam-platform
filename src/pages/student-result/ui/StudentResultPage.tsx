import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Heading,
  ScaleFade,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { CheckCircle2, MinusCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { AppHeader } from '@widgets/app-header';
import { LoadingScreen, PageContainer } from '@shared/ui';
import { ROUTES } from '@shared/config/routes';
import { gradeColor, getResultById, type TestResult } from '@entities/result';
import { useSessionStore } from '@entities/session';
import { formatDateTime, pluralizeRu } from '@shared/lib/format';

export const StudentResultPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const role = useSessionStore((s) => s.role);
  const studentName = useSessionStore((s) => s.studentName);
  const [result, setResult] = useState<TestResult | null>(null);
  const [notFound, setNotFound] = useState(false);

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
      const r = await getResultById(id);
      if (!alive) return;
      if (!r) setNotFound(true);
      else setResult(r);
    })();
    return () => {
      alive = false;
    };
  }, [params.id]);

  if (notFound) {
    return (
      <Box minH="100vh" bg="paper.50">
        <AppHeader />
        <PageContainer>
          <Heading size="md" mb={4}>
            {t('studentResult.notFound')}
          </Heading>
          <Button variant="outline" onClick={() => navigate(ROUTES.STUDENT_TESTS)}>
            {t('studentResult.backToList')}
          </Button>
        </PageContainer>
      </Box>
    );
  }

  if (!result) {
    return (
      <Box minH="100vh" bg="paper.50">
        <AppHeader />
        <LoadingScreen />
      </Box>
    );
  }

  const isRu = i18n.language === 'ru';
  const correctWord = isRu
    ? pluralizeRu(result.score, ['правильный', 'правильных', 'правильных'])
    : '';
  const ofTotal = isRu
    ? pluralizeRu(result.total, ['вопрос', 'вопроса', 'вопросов'])
    : '';

  return (
    <Box minH="100vh" bg="paper.50">
      <AppHeader subtitle={t('studentResult.subtitle')} />
      <PageContainer>
        <ScaleFade in initialScale={0.97}>
          <VStack spacing={2} align="stretch" mb={8}>
            <Text
              color="ink.500"
              fontSize="xs"
              letterSpacing="0.16em"
              textTransform="uppercase"
            >
              {t('studentResult.completed')}
            </Text>
            <Heading
              fontFamily="heading"
              fontWeight={500}
              size="xl"
              letterSpacing="-0.02em"
            >
              {result.testTitle}
            </Heading>
            <Text color="ink.700" fontSize="sm">
              {result.studentName} · {formatDateTime(result.completedAt)}
            </Text>
          </VStack>

          <Flex
            direction={{ base: 'column', md: 'row' }}
            gap={{ base: 6, md: 12 }}
            align={{ base: 'stretch', md: 'flex-end' }}
            mb={8}
          >
            <Box>
              <Text
                color="ink.500"
                fontSize="xs"
                letterSpacing="0.06em"
                textTransform="uppercase"
                mb={1}
              >
                {t('studentResult.scoreLabel')}
              </Text>
              <Heading
                fontFamily="heading"
                fontWeight={500}
                fontSize="6xl"
                lineHeight="1"
                letterSpacing="-0.03em"
              >
                {result.score}
                <Text as="span" color="ink.500" fontSize="3xl" ml={2}>
                  / {result.total}
                </Text>
              </Heading>
              <Text color="ink.500" fontSize="sm" mt={2}>
                {t('studentResult.scoreDetail', {
                  score: result.score,
                  total: result.total,
                  correctWord,
                  ofTotal,
                })}
              </Text>
            </Box>
            <Box>
              <Text
                color="ink.500"
                fontSize="xs"
                letterSpacing="0.06em"
                textTransform="uppercase"
                mb={1}
              >
                {t('studentResult.percentLabel')}
              </Text>
              <Heading
                fontFamily="heading"
                fontWeight={500}
                fontSize={{ base: '6xl', md: '7xl' }}
                lineHeight="1"
                letterSpacing="-0.03em"
                color={gradeColor(result.percentage)}
              >
                {result.percentage}%
              </Heading>
            </Box>
          </Flex>

          <Divider mb={8} />

          <Box mb={8}>
            <Heading size="md" mb={4} fontFamily="heading" fontWeight={500}>
              {t('studentResult.answersTitle')}
            </Heading>
            <Accordion allowMultiple>
              {result.answers.map((a, i) => {
                const skipped = a.selectedIndex === null;
                const correct = !skipped && a.selectedIndex === a.correctIndex;
                return (
                  <AccordionItem
                    key={a.questionId}
                    borderColor="line"
                    bg="card"
                    mb={2}
                    borderWidth="1px"
                    borderRadius="sm"
                  >
                    <AccordionButton _expanded={{ bg: 'paper.100' }} _hover={{ bg: 'paper.100' }} px={4} py={3}>
                      <HStack flex="1" spacing={3} align="center" textAlign="left">
                        <Text
                          fontFamily="mono"
                          color="ink.500"
                          fontSize="sm"
                          minW="3ch"
                        >
                          {String(i + 1).padStart(2, '0')}
                        </Text>
                        {skipped ? (
                          <MinusCircle size={18} strokeWidth={1.5} color="var(--chakra-colors-ink-500)" />
                        ) : correct ? (
                          <CheckCircle2 size={18} strokeWidth={1.5} color="var(--chakra-colors-ok)" />
                        ) : (
                          <XCircle size={18} strokeWidth={1.5} color="var(--chakra-colors-err)" />
                        )}
                        <Text noOfLines={1} flex="1">
                          {a.questionText}
                        </Text>
                      </HStack>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel px={4} py={4} bg="card">
                      <Text mb={3} fontWeight={500}>
                        {a.questionText}
                      </Text>
                      <Stack spacing={2}>
                        {a.options.map((opt, oi) => {
                          const isCorrect = oi === a.correctIndex;
                          const isPicked = oi === a.selectedIndex;
                          let color = 'ink.700';
                          let bg = 'transparent';
                          let weight: number | undefined;
                          if (isCorrect) {
                            color = 'ok';
                            weight = 500;
                          }
                          if (isPicked && !isCorrect) {
                            color = 'err';
                            bg = 'paper.100';
                          }
                          if (isPicked && isCorrect) bg = 'paper.100';
                          return (
                            <HStack key={oi} spacing={3} p={2} bg={bg} borderRadius="sm">
                              <Text
                                fontFamily="mono"
                                color="ink.500"
                                fontSize="sm"
                                minW="2ch"
                              >
                                {String.fromCharCode(65 + oi)}
                              </Text>
                              <Text color={color} fontWeight={weight}>
                                {opt}
                              </Text>
                            </HStack>
                          );
                        })}
                      </Stack>
                    </AccordionPanel>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </Box>

          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.STUDENT_TESTS)}
            size="lg"
          >
            {t('studentResult.backLong')}
          </Button>
        </ScaleFade>
      </PageContainer>
    </Box>
  );
};
