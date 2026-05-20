import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Fade,
  Flex,
  HStack,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import {
  Archive,
  ArchiveRestore,
  Eye,
  FileText,
  Inbox,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@widgets/app-header';
import { TestCard } from '@widgets/test-card';
import { ResultsTable } from '@widgets/results-table';
import { ResultDetailView } from '@widgets/result-detail-view';
import { DeleteTestButton } from '@features/delete-test';
import { useTestStore } from '@entities/test';
import { useResultStore, type TestResult } from '@entities/result';
import { useSessionStore } from '@entities/session';
import {
  createGroup,
  deleteGroup,
  getAllGroups,
  type Group,
} from '@entities/group';
import { EmptyState, LoadingScreen, PageContainer } from '@shared/ui';
import { ROUTES, teacherEditPath, teacherPreviewPath } from '@shared/config/routes';

export const TeacherDashboardPage = () => {
  const navigate = useNavigate();
  const role = useSessionStore((s) => s.role);
  const {
    tests,
    loading: tLoading,
    loaded: tLoaded,
    load: loadTests,
    setArchived,
  } = useTestStore();
  const {
    results,
    loading: rLoading,
    loaded: rLoaded,
    load: loadResults,
    remove: removeResult,
  } = useResultStore();
  const toast = useToast();

  useEffect(() => {
    if (role !== 'teacher') {
      navigate(ROUTES.TEACHER_AUTH, { replace: true });
    }
  }, [role, navigate]);

  useEffect(() => {
    void loadTests();
    void loadResults();
  }, [loadTests, loadResults]);

  const [active, setActive] = useState<TestResult | null>(null);
  const drawer = useDisclosure();
  const confirmDelete = useDisclosure();
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);
  const [deleting, setDeleting] = useState(false);
  const [filterTestId, setFilterTestId] = useState<string>('all');
  const [filterGroupId, setFilterGroupId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  const reloadGroups = async () => {
    setGroupsLoading(true);
    try {
      const g = await getAllGroups();
      setGroups(g);
    } catch (e) {
      console.warn('[dashboard] groups load failed', e);
    } finally {
      setGroupsLoading(false);
    }
  };

  useEffect(() => {
    void reloadGroups();
  }, []);

  const onCreateGroup = async () => {
    const name = newGroupName.trim();
    if (!name) return;
    setCreatingGroup(true);
    try {
      const g = await createGroup(name);
      setGroups((prev) => [g, ...prev]);
      setNewGroupName('');
      toast({
        title: `Группа создана. Код: ${g.code}`,
        status: 'success',
        position: 'top',
        duration: 4000,
      });
    } catch (e) {
      toast({
        title: 'Не удалось создать группу',
        description: (e as Error).message,
        status: 'error',
        position: 'top',
        duration: 4000,
      });
    } finally {
      setCreatingGroup(false);
    }
  };

  const onDeleteGroup = async (g: Group) => {
    try {
      await deleteGroup(g.id);
      setGroups((prev) => prev.filter((x) => x.id !== g.id));
      toast({
        title: 'Группа удалена',
        status: 'success',
        position: 'top',
        duration: 2500,
      });
    } catch (e) {
      toast({
        title: 'Не удалось удалить группу',
        description: (e as Error).message,
        status: 'error',
        position: 'top',
        duration: 4000,
      });
    }
  };

  const visibleTests = useMemo(
    () => tests.filter((t) => (showArchived ? t.archived : !t.archived)),
    [tests, showArchived],
  );

  const groupNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const g of groups) m.set(g.id, g.name);
    return m;
  }, [groups]);

  const filteredResults = useMemo(() => {
    let r = [...results];
    if (filterTestId !== 'all') {
      r = r.filter((x) => x.testId === filterTestId);
    }
    if (filterGroupId === 'none') {
      r = r.filter((x) => !x.groupId);
    } else if (filterGroupId !== 'all') {
      r = r.filter((x) => x.groupId === filterGroupId);
    }
    const q = search.trim().toLowerCase();
    if (q) r = r.filter((x) => x.studentName.toLowerCase().includes(q));
    return r;
  }, [results, filterTestId, search]);

  if (role !== 'teacher') return null;

  return (
    <Box minH="100vh" bg="paper.50">
      <AppHeader subtitle="Кабинет преподавателя" />
      <PageContainer>
        <Flex justify="space-between" align="center" mb={6} gap={4} wrap="wrap">
          <Heading fontFamily="heading" fontWeight={500} size="xl" letterSpacing="-0.02em">
            Кабинет
          </Heading>
          <Button
            variant="solid"
            leftIcon={<Plus size={18} strokeWidth={1.5} />}
            onClick={() => navigate(ROUTES.TEACHER_TEST_NEW)}
          >
            Новый тест
          </Button>
        </Flex>

        <Tabs colorScheme="accent">
          <TabList>
            <Tab>Тесты</Tab>
            <Tab>Результаты</Tab>
            <Tab>Группы</Tab>
          </TabList>
          <TabPanels>
            <TabPanel px={0} py={6}>
              <HStack mb={4} spacing={2}>
                <Button
                  variant={!showArchived ? 'solid' : 'ghost'}
                  size="sm"
                  onClick={() => setShowArchived(false)}
                >
                  Активные
                </Button>
                <Button
                  variant={showArchived ? 'solid' : 'ghost'}
                  size="sm"
                  onClick={() => setShowArchived(true)}
                  leftIcon={<Archive size={16} strokeWidth={1.5} />}
                >
                  Архив
                </Button>
              </HStack>

              {tLoading && !tLoaded ? (
                <LoadingScreen minH="40vh" />
              ) : visibleTests.length === 0 ? (
                showArchived ? (
                  <EmptyState
                    icon={Archive}
                    title="Архив пуст"
                    description="Сюда попадают тесты, отмеченные как архивные."
                  />
                ) : (
                  <EmptyState
                    icon={Inbox}
                    title="Создайте первый тест"
                    description="Тесты будут доступны студентам сразу после сохранения."
                    actionLabel="Новый тест"
                    onAction={() => navigate(ROUTES.TEACHER_TEST_NEW)}
                  />
                )
              ) : (
                <Stack spacing={3}>
                  {visibleTests.map((t, i) => (
                    <Fade in key={t.id} transition={{ enter: { delay: 0.03 * i } }}>
                      <TestCard
                        test={t}
                        actions={
                          <>
                            <Tooltip label="Предпросмотр с правильными ответами" hasArrow>
                              <IconButton
                                aria-label="Предпросмотр теста"
                                icon={<Eye size={18} strokeWidth={1.5} />}
                                variant="ghost"
                                onClick={() => navigate(teacherPreviewPath(t.id))}
                              />
                            </Tooltip>
                            <Tooltip label="Редактировать" hasArrow>
                              <IconButton
                                aria-label="Редактировать тест"
                                icon={<Pencil size={18} strokeWidth={1.5} />}
                                variant="ghost"
                                onClick={() => navigate(teacherEditPath(t.id))}
                              />
                            </Tooltip>
                            <Tooltip
                              label={t.archived ? 'Вернуть из архива' : 'В архив'}
                              hasArrow
                            >
                              <IconButton
                                aria-label={t.archived ? 'Восстановить' : 'Архивировать'}
                                icon={
                                  t.archived ? (
                                    <ArchiveRestore size={18} strokeWidth={1.5} />
                                  ) : (
                                    <Archive size={18} strokeWidth={1.5} />
                                  )
                                }
                                variant="ghost"
                                onClick={async () => {
                                  try {
                                    await setArchived(t.id, !t.archived);
                                    toast({
                                      title: t.archived ? 'Восстановлено' : 'В архиве',
                                      status: 'success',
                                      position: 'top',
                                      duration: 2000,
                                    });
                                  } catch (e) {
                                    toast({
                                      title: 'Не удалось',
                                      description: (e as Error).message,
                                      status: 'error',
                                      position: 'top',
                                    });
                                  }
                                }}
                              />
                            </Tooltip>
                            <DeleteTestButton testId={t.id} testTitle={t.title} />
                          </>
                        }
                      />
                    </Fade>
                  ))}
                </Stack>
              )}
            </TabPanel>

            <TabPanel px={0} py={6}>
              {rLoading && !rLoaded ? (
                <LoadingScreen minH="40vh" />
              ) : results.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Студенты ещё не проходили тесты"
                  description="Когда появятся первые попытки, они отобразятся здесь."
                />
              ) : (
                <Stack spacing={4}>
                  <HStack spacing={3} flexWrap="wrap">
                    <InputGroup maxW={{ base: 'full', md: '320px' }}>
                      <InputLeftElement pointerEvents="none" color="ink.500">
                        <Search size={16} strokeWidth={1.5} />
                      </InputLeftElement>
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск по имени"
                      />
                    </InputGroup>
                    <Select
                      maxW={{ base: 'full', md: '260px' }}
                      value={filterTestId}
                      onChange={(e) => setFilterTestId(e.target.value)}
                      variant="flushed"
                    >
                      <option value="all">Все тесты</option>
                      {tests.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title || 'Без названия'}
                        </option>
                      ))}
                    </Select>
                    <Select
                      maxW={{ base: 'full', md: '220px' }}
                      value={filterGroupId}
                      onChange={(e) => setFilterGroupId(e.target.value)}
                      variant="flushed"
                    >
                      <option value="all">Все группы</option>
                      <option value="none">Без группы</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </Select>
                  </HStack>
                  {filteredResults.length === 0 ? (
                    <Text color="ink.500" py={8} textAlign="center">
                      По заданным фильтрам ничего не найдено.
                    </Text>
                  ) : (
                    <ResultsTable
                      results={filteredResults}
                      groupNameById={groupNameById}
                      onRowClick={(r) => {
                        setActive(r);
                        drawer.onOpen();
                      }}
                    />
                  )}
                </Stack>
              )}
            </TabPanel>

            <TabPanel px={0} py={6}>
              <Stack spacing={4}>
                <Box
                  borderWidth="1px"
                  borderColor="line"
                  borderRadius="sm"
                  p={5}
                  bg="card"
                >
                  <Text
                    color="ink.500"
                    fontSize="xs"
                    letterSpacing="0.06em"
                    textTransform="uppercase"
                    mb={3}
                  >
                    Новая группа
                  </Text>
                  <HStack spacing={3} flexWrap="wrap">
                    <Input
                      placeholder="Например: ПИ-21-1"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && void onCreateGroup()}
                      maxW={{ base: 'full', md: '320px' }}
                    />
                    <Button
                      variant="solid"
                      onClick={onCreateGroup}
                      isLoading={creatingGroup}
                      isDisabled={!newGroupName.trim()}
                      leftIcon={<Plus size={18} strokeWidth={1.5} />}
                    >
                      Создать
                    </Button>
                  </HStack>
                  <Text color="ink.500" fontSize="xs" mt={2}>
                    Студенты вводят код группы при первом входе.
                  </Text>
                </Box>

                {groupsLoading ? (
                  <LoadingScreen minH="20vh" />
                ) : groups.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="Групп пока нет"
                    description="Создайте группу выше — система выдаст уникальный код для студентов."
                  />
                ) : (
                  <Stack spacing={2}>
                    {groups.map((g) => (
                      <Flex
                        key={g.id}
                        borderWidth="1px"
                        borderColor="line"
                        borderRadius="sm"
                        bg="card"
                        p={4}
                        align="center"
                        justify="space-between"
                        gap={3}
                        wrap="wrap"
                      >
                        <Box>
                          <Text fontFamily="heading" fontWeight={500} fontSize="lg">
                            {g.name}
                          </Text>
                          <HStack spacing={3} mt={1}>
                            <Text
                              fontFamily="mono"
                              fontSize="sm"
                              color="ink.500"
                              letterSpacing="0.04em"
                            >
                              КОД:
                            </Text>
                            <Text
                              fontFamily="mono"
                              fontSize="md"
                              color="accent.500"
                              fontWeight={500}
                              letterSpacing="0.1em"
                            >
                              {g.code}
                            </Text>
                          </HStack>
                        </Box>
                        <HStack spacing={2}>
                          <Tooltip label="Скопировать код" hasArrow>
                            <IconButton
                              aria-label="Скопировать код"
                              icon={<FileText size={18} strokeWidth={1.5} />}
                              variant="ghost"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(g.code);
                                  toast({
                                    title: 'Код скопирован',
                                    status: 'success',
                                    position: 'top',
                                    duration: 1500,
                                  });
                                } catch {
                                  toast({
                                    title: 'Не удалось скопировать',
                                    status: 'error',
                                    position: 'top',
                                    duration: 2000,
                                  });
                                }
                              }}
                            />
                          </Tooltip>
                          <Tooltip label="Удалить группу" hasArrow>
                            <IconButton
                              aria-label="Удалить группу"
                              icon={<Trash2 size={18} strokeWidth={1.5} />}
                              variant="ghost"
                              onClick={() => void onDeleteGroup(g)}
                            />
                          </Tooltip>
                        </HStack>
                      </Flex>
                    ))}
                  </Stack>
                )}
              </Stack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </PageContainer>

      <Drawer
        isOpen={drawer.isOpen}
        onClose={drawer.onClose}
        size={{ base: 'full', md: 'lg' }}
        placement="right"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader fontFamily="heading" fontWeight={500} borderBottomWidth="1px" borderColor="line">
            Разбор работы
          </DrawerHeader>
          <DrawerBody py={6}>
            {active && (
              <ResultDetailView
                result={active}
                groupName={active.groupId ? groupNameById.get(active.groupId) : null}
              />
            )}
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px" borderColor="line" gap={3}>
            <Button variant="ghost" onClick={drawer.onClose}>
              Закрыть
            </Button>
            <Button
              variant="outline"
              leftIcon={<Trash2 size={18} strokeWidth={1.5} />}
              onClick={confirmDelete.onOpen}
              isDisabled={!active}
            >
              Удалить результат
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AlertDialog
        isOpen={confirmDelete.isOpen}
        onClose={confirmDelete.onClose}
        leastDestructiveRef={cancelDeleteRef}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontFamily="heading" fontWeight={500}>
              Удалить результат?
            </AlertDialogHeader>
            <AlertDialogBody color="ink.700">
              {active && (
                <>
                  Результат студента <b>{active.studentName}</b> по тесту «{active.testTitle}»
                  будет удалён без возможности восстановления. Студент сможет пройти этот тест
                  заново.
                </>
              )}
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelDeleteRef} variant="ghost" onClick={confirmDelete.onClose}>
                Отмена
              </Button>
              <Button
                bg="err"
                _hover={{ bg: 'err' }}
                isLoading={deleting}
                onClick={async () => {
                  if (!active) return;
                  setDeleting(true);
                  try {
                    await removeResult(active.id);
                    toast({
                      title: 'Результат удалён',
                      status: 'success',
                      position: 'top',
                      duration: 2500,
                    });
                    confirmDelete.onClose();
                    drawer.onClose();
                    setActive(null);
                  } catch (e) {
                    toast({
                      title: 'Не удалось удалить',
                      description: (e as Error).message,
                      status: 'error',
                      position: 'top',
                      duration: 4000,
                    });
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                Удалить
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};
