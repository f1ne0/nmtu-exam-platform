import {
  Box,
  Button,
  Checkbox,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Heading,
  IconButton,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Radio,
  RadioGroup,
  Stack,
  Tag,
  Text,
  Textarea,
  VStack,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { FileUp, Minus, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppHeader } from '@widgets/app-header';
import { LoadingScreen, PageContainer } from '@shared/ui';
import { ROUTES } from '@shared/config/routes';
import { useSessionStore } from '@entities/session';
import { getTestById, type Test } from '@entities/test';
import { getAllGroups, type Group } from '@entities/group';
import { createEmptyTest } from '@features/create-test';
import { useTestEditor } from '@features/edit-test';
import { ImportTestTextDialog } from '@features/import-test-text';

export const TeacherTestEditorPage = () => {
  const role = useSessionStore((s) => s.role);
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const isNew = !params.id;

  const [initial, setInitial] = useState<Test | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (role !== 'teacher') {
      navigate(ROUTES.TEACHER_AUTH, { replace: true });
    }
  }, [role, navigate]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      if (isNew) {
        if (alive) setInitial(createEmptyTest());
        return;
      }
      const id = params.id;
      if (!id) return;
      const t = await getTestById(id);
      if (!alive) return;
      if (!t) {
        setNotFound(true);
      } else {
        setInitial(t);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isNew, params.id]);

  if (role !== 'teacher') return null;

  if (notFound) {
    return (
      <Box minH="100vh" bg="paper.50">
        <AppHeader subtitle="Редактор теста" />
        <PageContainer>
          <Heading size="md" mb={4}>
            Тест не найден
          </Heading>
          <Button variant="outline" onClick={() => navigate(ROUTES.TEACHER_DASHBOARD)}>
            К списку тестов
          </Button>
        </PageContainer>
      </Box>
    );
  }

  if (!initial) {
    return (
      <Box minH="100vh" bg="paper.50">
        <AppHeader subtitle="Редактор теста" />
        <LoadingScreen />
      </Box>
    );
  }

  return <Editor initial={initial} isNew={isNew} />;
};

interface EditorProps {
  initial: Test;
  isNew: boolean;
}

const Editor = ({ initial, isNew }: EditorProps) => {
  const navigate = useNavigate();
  const toast = useToast();
  const editor = useTestEditor(initial);
  const { test, saving, showError, setField, updateQuestion, setOption } = editor;
  const importDlg = useDisclosure();
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const g = await getAllGroups();
        if (alive) setGroups(g);
      } catch (e) {
        console.warn('[editor] groups load failed', e);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const toggleGroup = (groupId: string) => {
    const set = new Set(test.groupIds);
    if (set.has(groupId)) set.delete(groupId);
    else set.add(groupId);
    setField('groupIds', [...set]);
  };

  const totalQuestions = test.questions.length;
  const perAttempt = test.questionsPerAttempt;

  const onSave = async () => {
    const ok = await editor.save();
    if (ok) {
      toast({
        title: isNew ? 'Тест создан' : 'Изменения сохранены',
        status: 'success',
        position: 'bottom-right',
        duration: 2500,
      });
      navigate(ROUTES.TEACHER_DASHBOARD);
    } else {
      toast({
        title: 'Проверьте поля',
        description: 'Не все обязательные поля заполнены корректно.',
        status: 'error',
        position: 'bottom-right',
        duration: 3500,
      });
    }
  };

  return (
    <Box minH="100vh" bg="paper.50" pb="120px">
      <AppHeader subtitle={isNew ? 'Новый тест' : 'Редактирование'} />
      <PageContainer>
        <VStack align="stretch" spacing={8}>
          <Box>
            <Text
              color="ink.500"
              fontSize="xs"
              letterSpacing="0.16em"
              textTransform="uppercase"
              mb={1}
            >
              {isNew ? 'Новый тест' : 'Редактирование теста'}
            </Text>
            <Heading fontFamily="heading" fontWeight={500} size="xl" letterSpacing="-0.02em">
              {test.title || 'Без названия'}
            </Heading>
          </Box>

          <Stack spacing={6}>
            <FormControl isInvalid={!!showError('title')}>
              <FormLabel
                color="ink.500"
                fontSize="xs"
                letterSpacing="0.06em"
                textTransform="uppercase"
              >
                Название теста
              </FormLabel>
              <Input
                value={test.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Введите название"
                fontFamily="heading"
                fontSize="lg"
              />
              <FormErrorMessage>{showError('title')}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel
                color="ink.500"
                fontSize="xs"
                letterSpacing="0.06em"
                textTransform="uppercase"
              >
                Описание
              </FormLabel>
              <Textarea
                value={test.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Краткое описание для студентов"
                rows={3}
              />
            </FormControl>

            <Flex gap={6} wrap="wrap">
              <FormControl
                isInvalid={!!showError('durationMinutes')}
                maxW="240px"
              >
                <FormLabel
                  color="ink.500"
                  fontSize="xs"
                  letterSpacing="0.06em"
                  textTransform="uppercase"
                >
                  Длительность (минут)
                </FormLabel>
                <NumberInput
                  value={test.durationMinutes}
                  onChange={(_, n) => setField('durationMinutes', Number.isFinite(n) ? n : 0)}
                  min={1}
                  max={240}
                  variant="flushed"
                >
                  <NumberInputField fontFamily="mono" />
                  <NumberInputStepper>
                    <NumberIncrementStepper border="none" />
                    <NumberDecrementStepper border="none" />
                  </NumberInputStepper>
                </NumberInput>
                <FormErrorMessage>{showError('durationMinutes')}</FormErrorMessage>
              </FormControl>

              <FormControl maxW="240px">
                <FormLabel
                  color="ink.500"
                  fontSize="xs"
                  letterSpacing="0.06em"
                  textTransform="uppercase"
                >
                  Вопросов на попытку
                </FormLabel>
                <NumberInput
                  value={perAttempt ?? ''}
                  onChange={(s, n) => {
                    if (s === '') {
                      setField('questionsPerAttempt', null);
                    } else {
                      setField('questionsPerAttempt', Number.isFinite(n) ? n : null);
                    }
                  }}
                  min={1}
                  max={Math.max(1, totalQuestions)}
                  variant="flushed"
                >
                  <NumberInputField fontFamily="mono" placeholder="все" />
                  <NumberInputStepper>
                    <NumberIncrementStepper border="none" />
                    <NumberDecrementStepper border="none" />
                  </NumberInputStepper>
                </NumberInput>
                <FormHelperText color="ink.500" fontSize="xs">
                  {perAttempt
                    ? `Случайные ${Math.min(perAttempt, totalQuestions)} из ${totalQuestions}`
                    : 'По умолчанию — все'}
                </FormHelperText>
              </FormControl>
            </Flex>

            <FormControl>
              <FormLabel
                color="ink.500"
                fontSize="xs"
                letterSpacing="0.06em"
                textTransform="uppercase"
              >
                Доступ — группы
              </FormLabel>
              {groups.length === 0 ? (
                <Text color="ink.500" fontSize="sm">
                  Групп пока нет. Без выбранных групп тест доступен всем студентам.
                </Text>
              ) : (
                <Flex gap={2} wrap="wrap">
                  {groups.map((g) => {
                    const selected = test.groupIds.includes(g.id);
                    return (
                      <Tag
                        key={g.id}
                        as="button"
                        type="button"
                        onClick={() => toggleGroup(g.id)}
                        cursor="pointer"
                        borderWidth="1px"
                        borderColor={selected ? 'accent.500' : 'line'}
                        bg={selected ? 'accent.500' : 'card'}
                        color={selected ? 'white' : 'ink.900'}
                        borderRadius="sm"
                        px={3}
                        py={1.5}
                        transition="all 120ms"
                      >
                        <HStack spacing={2}>
                          <Text fontFamily="heading" fontWeight={500}>
                            {g.name}
                          </Text>
                          <Text fontFamily="mono" fontSize="xs" opacity={0.8}>
                            {g.code}
                          </Text>
                        </HStack>
                      </Tag>
                    );
                  })}
                </Flex>
              )}
              <FormHelperText color="ink.500" fontSize="xs">
                Если ничего не выбрано — тест виден всем (даже студентам без группы).
              </FormHelperText>
            </FormControl>

            <FormControl>
              <Checkbox
                isChecked={test.archived}
                onChange={(e) => setField('archived', e.target.checked)}
                colorScheme="accent"
              >
                <Text fontSize="sm">Архивировать (скрыть от студентов)</Text>
              </Checkbox>
            </FormControl>
          </Stack>

          <Divider />

          <Box>
            <Flex justify="space-between" align="center" mb={4} gap={3} wrap="wrap">
              <HStack spacing={4} align="baseline">
                <Heading size="md" fontFamily="heading" fontWeight={500}>
                  Вопросы
                </Heading>
                <Text color="ink.500" fontSize="sm" fontFamily="mono">
                  {test.questions.length}
                </Text>
              </HStack>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<FileUp size={16} strokeWidth={1.5} />}
                onClick={importDlg.onOpen}
              >
                Импорт из текста
              </Button>
            </Flex>
            {showError('questions') && (
              <Text color="err" fontSize="sm" mb={2}>
                {showError('questions')}
              </Text>
            )}
            <Stack spacing={5}>
              {test.questions.map((q, qi) => (
                <Box
                  key={q.id}
                  borderWidth="1px"
                  borderColor="line"
                  borderRadius="sm"
                  bg="card"
                  p={5}
                >
                  <Flex justify="space-between" align="flex-start" mb={4}>
                    <Text
                      fontFamily="mono"
                      fontSize="sm"
                      color="ink.500"
                      letterSpacing="0.06em"
                    >
                      ВОПРОС {String(qi + 1).padStart(2, '0')}
                    </Text>
                    <IconButton
                      aria-label="Удалить вопрос"
                      icon={<X size={18} strokeWidth={1.5} />}
                      variant="ghost"
                      size="sm"
                      onClick={() => editor.removeQuestion(qi)}
                      isDisabled={test.questions.length <= 1}
                    />
                  </Flex>

                  <FormControl
                    isInvalid={!!showError(`questions.${qi}.text`)}
                    mb={5}
                  >
                    <Textarea
                      value={q.text}
                      onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                      placeholder="Текст вопроса"
                      rows={2}
                      variant="flushed"
                    />
                    <FormErrorMessage>{showError(`questions.${qi}.text`)}</FormErrorMessage>
                  </FormControl>

                  <FormControl
                    isInvalid={
                      !!showError(`questions.${qi}.options`) ||
                      !!showError(`questions.${qi}.correctIndex`)
                    }
                  >
                    <FormLabel
                      color="ink.500"
                      fontSize="xs"
                      letterSpacing="0.06em"
                      textTransform="uppercase"
                    >
                      Варианты — отметьте правильный
                    </FormLabel>
                    <RadioGroup
                      value={String(q.correctIndex)}
                      onChange={(v) => editor.setCorrect(qi, Number(v))}
                    >
                      <Stack spacing={2}>
                        {q.options.map((opt, oi) => (
                          <HStack key={oi} spacing={3} align="center">
                            <Radio
                              value={String(oi)}
                              colorScheme="accent"
                              borderColor="line"
                            />
                            <Input
                              value={opt}
                              onChange={(e) => setOption(qi, oi, e.target.value)}
                              placeholder={`Вариант ${String.fromCharCode(65 + oi)}`}
                              variant="flushed"
                            />
                            <IconButton
                              aria-label="Удалить вариант"
                              icon={<Minus size={16} strokeWidth={1.5} />}
                              variant="ghost"
                              size="sm"
                              onClick={() => editor.removeOption(qi, oi)}
                              isDisabled={q.options.length <= editor.minOptions}
                            />
                          </HStack>
                        ))}
                      </Stack>
                    </RadioGroup>
                    <FormErrorMessage>
                      {showError(`questions.${qi}.options`) ||
                        showError(`questions.${qi}.correctIndex`)}
                    </FormErrorMessage>
                    <Button
                      variant="ghost"
                      size="sm"
                      mt={3}
                      leftIcon={<Plus size={14} strokeWidth={1.5} />}
                      onClick={() => editor.addOption(qi)}
                      isDisabled={q.options.length >= editor.maxOptions}
                    >
                      Добавить вариант
                    </Button>
                  </FormControl>
                </Box>
              ))}
            </Stack>

            <Button
              mt={5}
              variant="outline"
              leftIcon={<Plus size={18} strokeWidth={1.5} />}
              onClick={editor.addQuestion}
            >
              Добавить вопрос
            </Button>
          </Box>
        </VStack>
      </PageContainer>

      <ImportTestTextDialog
        isOpen={importDlg.isOpen}
        onClose={importDlg.onClose}
        onApply={(mode, items) => {
          if (mode === 'replace') editor.replaceQuestions(items);
          else editor.appendQuestions(items);
          toast({
            title:
              mode === 'replace'
                ? `Заменено ${items.length} вопрос(ов)`
                : `Добавлено ${items.length} вопрос(ов)`,
            status: 'success',
            position: 'bottom-right',
            duration: 2500,
          });
        }}
      />

      <Box
        as="footer"
        position="sticky"
        bottom={0}
        bg="paper.50"
        borderTopWidth="1px"
        borderColor="line"
        py={4}
        zIndex={5}
      >
        <Flex maxW="960px" mx="auto" px={{ base: 4, md: 6 }} justify="space-between" gap={3}>
          <Button variant="ghost" onClick={() => navigate(ROUTES.TEACHER_DASHBOARD)}>
            Отмена
          </Button>
          <Button variant="solid" onClick={onSave} isLoading={saving}>
            Сохранить
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};
