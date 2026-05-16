import {
  Box,
  Center,
  Flex,
  Heading,
  HStack,
  ScaleFade,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ArrowRight, GraduationCap, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@shared/config/routes';
import { useSessionStore } from '@entities/session';

export const HomePage = () => {
  const navigate = useNavigate();
  const role = useSessionStore((s) => s.role);
  const studentName = useSessionStore((s) => s.studentName);

  const goTeacher = () => {
    if (role === 'teacher') navigate(ROUTES.TEACHER_DASHBOARD);
    else navigate(ROUTES.TEACHER_AUTH);
  };
  const goStudent = () => {
    if (role === 'student' && studentName) navigate(ROUTES.STUDENT_TESTS);
    else navigate(ROUTES.STUDENT_NAME);
  };

  return (
    <Flex direction="column" minH="100vh" bg="paper.50">
      <Center flex="1" px={4} py={10}>
        <Box maxW="960px" w="full">
          <ScaleFade in initialScale={0.96}>
            <VStack spacing={3} mb={{ base: 8, md: 12 }} textAlign="center">
              <Text
                color="ink.500"
                fontSize="xs"
                letterSpacing="0.18em"
                textTransform="uppercase"
              >
                Платформа для проведения тестов
              </Text>
              <Heading
                fontFamily="heading"
                fontWeight={500}
                fontSize={{ base: '4xl', md: '6xl' }}
                letterSpacing="-0.03em"
                lineHeight="1"
              >
                Exam Platform
              </Heading>
              <Text color="ink.700" maxW="md" mt={2}>
                {role
                  ? `Вы вошли как ${role === 'teacher' ? 'преподаватель' : studentName ?? 'студент'}.`
                  : 'Выберите роль, чтобы продолжить.'}
              </Text>
            </VStack>
          </ScaleFade>

          <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
            <RoleCard
              title="Я преподаватель"
              description="Создавайте тесты, открывайте к ним доступ и просматривайте результаты студентов."
              icon={<Pencil size={24} strokeWidth={1.5} />}
              actionLabel={role === 'teacher' ? 'В кабинет' : 'Войти'}
              onClick={goTeacher}
            />
            <RoleCard
              title="Я студент"
              description="Введите имя и пройдите доступные тесты. Результат покажем сразу."
              icon={<GraduationCap size={24} strokeWidth={1.5} />}
              actionLabel={role === 'student' && studentName ? `Продолжить как ${studentName}` : 'Войти'}
              onClick={goStudent}
            />
          </Flex>
        </Box>
      </Center>
      <Box as="footer" py={6} textAlign="center">
        <Text color="ink.500" fontSize="xs" letterSpacing="0.06em">
          v0.2 · Exam Platform · академический инструмент
        </Text>
      </Box>
    </Flex>
  );
};

interface RoleProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  actionLabel: string;
  onClick: () => void;
}

const RoleCard = ({ title, description, icon, actionLabel, onClick }: RoleProps) => (
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
          <Text>Продолжить</Text>
          <ArrowRight size={16} strokeWidth={1.5} />
        </HStack>
      </Box>
    </Flex>
  </Box>
);
