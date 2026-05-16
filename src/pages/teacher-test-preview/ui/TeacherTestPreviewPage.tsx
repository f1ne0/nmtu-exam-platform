import {
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  Flex,
  HStack,
  Heading,
  Stack,
  Tag,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ArrowLeft, CheckCircle2, Clock, Eye, ListChecks, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppHeader } from '@widgets/app-header';
import { LoadingScreen, PageContainer } from '@shared/ui';
import { ROUTES, teacherEditPath } from '@shared/config/routes';
import { useSessionStore } from '@entities/session';
import { getTestById, type Test } from '@entities/test';
import { pluralizeRu } from '@shared/lib/format';

export const TeacherTestPreviewPage = () => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const role = useSessionStore((s) => s.role);
  const [test, setTest] = useState<Test | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role !== 'teacher') {
      navigate(ROUTES.TEACHER_AUTH, { replace: true });
    }
  }, [role, navigate]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const id = params.id;
      if (!id) return;
      try {
        const t = await getTestById(id);
        if (!alive) return;
        if (!t) setError('Тест не найден');
        else setTest(t);
      } catch (e) {
        if (!alive) return;
        setError((e as Error).message ?? 'Не удалось загрузить тест');
      }
    })();
    return () => {
      alive = false;
    };
  }, [params.id]);

  if (role !== 'teacher') return null;

  if (error) {
    return (
      <Box minH="100vh" bg="paper.50">
        <AppHeader subtitle="Предпросмотр" />
        <PageContainer>
          <Heading size="md" mb={4}>
            {error}
          </Heading>
          <Button variant="outline" onClick={() => navigate(ROUTES.TEACHER_DASHBOARD)}>
            К списку тестов
          </Button>
        </PageContainer>
      </Box>
    );
  }

  if (!test) {
    return (
      <Box minH="100vh" bg="paper.50">
        <AppHeader subtitle="Предпросмотр" />
        <LoadingScreen />
      </Box>
    );
  }

  const minWord = pluralizeRu(test.durationMinutes, ['минута', 'минуты', 'минут']);
  const qWord = pluralizeRu(test.questions.length, ['вопрос', 'вопроса', 'вопросов']);

  return (
    <Box minH="100vh" bg="paper.50">
      <AppHeader subtitle="Предпросмотр" />
      <PageContainer>
        <VStack align="stretch" spacing={6}>
          <Flex justify="space-between" align="flex-start" gap={4} wrap="wrap">
            <Box flex="1" minW={0}>
              <HStack mb={2} spacing={3}>
                <Tag
                  bg="paper.100"
                  color="ink.700"
                  borderWidth="1px"
                  borderColor="line"
                  borderRadius="sm"
                  fontFamily="mono"
                  fontSize="xs"
                  letterSpacing="0.06em"
                  textTransform="uppercase"
                  px={3}
                  py={1}
                >
                  <HStack spacing={2}>
                    <Eye size={14} strokeWidth={1.5} />
                    <Text>Предпросмотр · только для преподавателя</Text>
                  </HStack>
                </Tag>
              </HStack>
              <Heading
                fontFamily="heading"
                fontWeight={500}
                size="xl"
                letterSpacing="-0.02em"
                mb={2}
              >
                {test.title}
              </Heading>
              {test.description && (
                <Text color="ink.700" mb={3}>
                  {test.description}
                </Text>
              )}
              <HStack spacing={5} color="ink.500" fontSize="sm" fontFamily="mono" flexWrap="wrap">
                <HStack spacing={2}>
                  <Clock size={16} strokeWidth={1.5} />
                  <Text>
                    {test.durationMinutes} {minWord}
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  <ListChecks size={16} strokeWidth={1.5} />
                  <Text>
                    {test.questions.length} {qWord}
                  </Text>
                </HStack>
              </HStack>
            </Box>
            <HStack spacing={2}>
              <Button
                variant="ghost"
                leftIcon={<ArrowLeft size={18} strokeWidth={1.5} />}
                onClick={() => navigate(ROUTES.TEACHER_DASHBOARD)}
              >
                Назад
              </Button>
              <Button
                variant="outline"
                leftIcon={<Pencil size={18} strokeWidth={1.5} />}
                onClick={() => navigate(teacherEditPath(test.id))}
              >
                Редактировать
              </Button>
            </HStack>
          </Flex>

          <Box
            borderWidth="1px"
            borderColor="ok"
            borderRadius="sm"
            p={4}
            bg="card"
          >
            <HStack spacing={3} align="flex-start">
              <CheckCircle2 size={18} strokeWidth={1.5} color="var(--chakra-colors-ok)" />
              <Text color="ink.700" fontSize="sm">
                Это предпросмотр для преподавателя. Правильные ответы подсвечены зелёным.
                Прохождение здесь <b>не сохраняется</b> и не виден студентам.
              </Text>
            </HStack>
          </Box>

          <Divider />

          <Stack spacing={5}>
            {test.questions.map((q, qi) => (
              <Card key={q.id}>
                <CardBody p={6}>
                  <HStack spacing={3} mb={4} align="flex-start">
                    <Text
                      fontFamily="mono"
                      color="ink.500"
                      fontSize="sm"
                      minW="3ch"
                    >
                      {String(qi + 1).padStart(2, '0')}
                    </Text>
                    <Heading size="md" flex="1" lineHeight="1.4">
                      {q.text}
                    </Heading>
                  </HStack>
                  <Stack spacing={2} pl={6}>
                    {q.options.map((opt, oi) => {
                      const isCorrect = oi === q.correctIndex;
                      return (
                        <HStack
                          key={oi}
                          spacing={3}
                          p={3}
                          borderWidth="1px"
                          borderColor={isCorrect ? 'ok' : 'line'}
                          borderRadius="sm"
                          bg={isCorrect ? 'paper.100' : 'transparent'}
                          align="center"
                        >
                          <Text
                            fontFamily="mono"
                            color="ink.500"
                            fontSize="sm"
                            minW="2ch"
                          >
                            {String.fromCharCode(65 + oi)}
                          </Text>
                          <Text flex="1" color={isCorrect ? 'ok' : 'ink.900'} fontWeight={isCorrect ? 500 : undefined}>
                            {opt}
                          </Text>
                          {isCorrect && (
                            <HStack spacing={1} color="ok">
                              <CheckCircle2 size={16} strokeWidth={1.5} />
                              <Text fontSize="xs" letterSpacing="0.04em" textTransform="uppercase">
                                Правильный
                              </Text>
                            </HStack>
                          )}
                        </HStack>
                      );
                    })}
                  </Stack>
                </CardBody>
              </Card>
            ))}
          </Stack>
        </VStack>
      </PageContainer>
    </Box>
  );
};
