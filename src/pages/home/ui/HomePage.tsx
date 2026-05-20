import {
  Box,
  Center,
  Collapse,
  Flex,
  Heading,
  HStack,
  ScaleFade,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ArrowRight, GraduationCap, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@shared/config/routes';
import { LanguageSwitcher } from '@widgets/language-switcher';
import { useSessionStore } from '@entities/session';

export const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const role = useSessionStore((s) => s.role);
  const studentName = useSessionStore((s) => s.studentName);
  const [secretClicks, setSecretClicks] = useState(0);
  const secretRevealed = secretClicks >= 7;

  const goTeacher = () => {
    if (role === 'teacher') navigate(ROUTES.TEACHER_DASHBOARD);
    else navigate(ROUTES.TEACHER_AUTH);
  };
  const goStudent = () => {
    if (role === 'student' && studentName) navigate(ROUTES.STUDENT_TESTS);
    else navigate(ROUTES.STUDENT_NAME);
  };

  const subtitle = role === 'teacher'
    ? t('home.subtitleTeacher')
    : role === 'student'
      ? t('home.subtitleStudent', { name: studentName ?? '' })
      : t('home.subtitleGuest');

  return (
    <Flex direction="column" minH="100vh" bg="paper.50">
      <Flex justify="flex-end" px={{ base: 4, md: 8 }} pt={4}>
        <LanguageSwitcher />
      </Flex>
      <Center flex="1" px={4} py={6}>
        <Box maxW="960px" w="full">
          <ScaleFade in initialScale={0.96}>
            <VStack spacing={3} mb={{ base: 8, md: 12 }} textAlign="center">
              <Text
                color="ink.500"
                fontSize="xs"
                letterSpacing="0.18em"
                textTransform="uppercase"
              >
                {t('home.eyebrow')}
              </Text>
              <Heading
                fontFamily="heading"
                fontWeight={500}
                fontSize={{ base: '4xl', md: '6xl' }}
                letterSpacing="-0.03em"
                lineHeight="1"
              >
                {t('home.title')}
              </Heading>
              <Text color="ink.700" maxW="md" mt={2}>
                {subtitle}
              </Text>
            </VStack>
          </ScaleFade>

          <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
            <RoleCard
              title={t('home.teacherTitle')}
              description={t('home.teacherDescription')}
              icon={<Pencil size={24} strokeWidth={1.5} />}
              actionLabel={role === 'teacher' ? t('home.actionGoToCabinet') : t('home.actionLogin')}
              onClick={goTeacher}
              continueLabel={t('home.continue')}
            />
            <RoleCard
              title={t('home.studentTitle')}
              description={t('home.studentDescription')}
              icon={<GraduationCap size={24} strokeWidth={1.5} />}
              actionLabel={
                role === 'student' && studentName
                  ? t('home.actionContinueAs', { name: studentName })
                  : t('home.actionLogin')
              }
              onClick={goStudent}
              continueLabel={t('home.continue')}
            />
          </Flex>
        </Box>
      </Center>
      <Box as="footer" py={6} textAlign="center">
        <Text
          color="ink.500"
          fontSize="xs"
          letterSpacing="0.06em"
          cursor="default"
          userSelect="none"
          onClick={() => setSecretClicks((n) => n + 1)}
          _hover={{ color: 'ink.700' }}
        >
          {t('home.footer')}
        </Text>
        <Collapse in={secretRevealed} animateOpacity>
          <VStack spacing={1} mt={4} color="accent.500" fontFamily="mono" fontSize="xs">
            <Text letterSpacing="0.18em" textTransform="uppercase">
              ✦ скрытая комната ✦
            </Text>
            <Text color="ink.700" maxW="sm" textAlign="center">
              «Тот, кто умеет хорошо думать, найдёт ответы там, где другие видят
              только вопросы.»
            </Text>
            <Text color="ink.500" mt={2}>
              подсказка: 42 · ↑ ↑ ↓ ↓ ← → ← → B A
            </Text>
          </VStack>
        </Collapse>
      </Box>
    </Flex>
  );
};

interface RoleProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  actionLabel: string;
  continueLabel: string;
  onClick: () => void;
}

const RoleCard = ({ title, description, icon, actionLabel, continueLabel, onClick }: RoleProps) => (
  <Box
    as="button"
    onClick={onClick}
    flex="1"
    bg="card"
    borderWidth="1px"
    borderColor="line"
    borderRadius="sm"
    px={{ base: 6, md: 8 }}
    py={{ base: 8, md: 10 }}
    textAlign="left"
    transition="all 180ms ease"
    _hover={{ borderColor: 'accent.500', transform: 'translateY(-2px)' }}
    _focusVisible={{ borderColor: 'accent.500', outline: 'none' }}
    minH={{ base: '180px', md: '240px' }}
  >
    <Flex direction="column" h="full" justify="space-between">
      <HStack spacing={3} color="accent.500">
        {icon}
        <Text fontFamily="mono" fontSize="xs" letterSpacing="0.1em" textTransform="uppercase">
          {actionLabel}
        </Text>
      </HStack>
      <Box>
        <Heading
          fontFamily="heading"
          fontWeight={500}
          fontSize={{ base: '2xl', md: '3xl' }}
          letterSpacing="-0.02em"
          mt={6}
          mb={3}
        >
          {title}
        </Heading>
        <Text color="ink.700" fontSize="sm" mb={4}>
          {description}
        </Text>
        <HStack color="accent.500" fontSize="sm" fontWeight={500}>
          <Text>{continueLabel}</Text>
          <ArrowRight size={16} strokeWidth={1.5} />
        </HStack>
      </Box>
    </Flex>
  </Box>
);
