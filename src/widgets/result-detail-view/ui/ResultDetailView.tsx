import {
  Box,
  Divider,
  HStack,
  Heading,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { AlertTriangle, CheckCircle2, MinusCircle, XCircle } from 'lucide-react';
import {
  gradeColor,
  type AnswerRecord,
  type TestResult,
  type ViolationEntry,
} from '@entities/result';
import { formatDateTime } from '@shared/lib/format';

const VIOLATION_LABEL: Record<string, string> = {
  visibility_hidden: 'Свернул вкладку',
  fullscreen_exit: 'Вышел из полноэкранного',
  copy_attempt: 'Попытка копирования',
  paste_attempt: 'Попытка вставки',
  context_menu: 'Контекстное меню',
  shortcut_block: 'Запрещённая комбинация',
  devtools_open: 'DevTools',
  window_blur: 'Переключение окна',
};

interface Props {
  result: TestResult;
  groupName?: string | null;
}

export const ResultDetailView = ({ result, groupName }: Props) => (
  <Stack spacing={6}>
    <Box>
      <Text color="ink.500" fontSize="xs" letterSpacing="0.06em" textTransform="uppercase">
        Студент
      </Text>
      <Heading size="md" mt={1}>
        {result.studentName}
      </Heading>
      {groupName && (
        <Text color="ink.700" mt={1} fontFamily="mono" fontSize="sm">
          Группа: {groupName}
        </Text>
      )}
      <Text color="ink.700" mt={1}>
        {result.testTitle}
      </Text>
      <Text color="ink.500" mt={2} fontFamily="mono" fontSize="sm">
        {formatDateTime(result.completedAt)}
      </Text>
    </Box>

    <HStack spacing={8} align="baseline">
      <Box>
        <Text color="ink.500" fontSize="xs" letterSpacing="0.06em" textTransform="uppercase">
          Балл
        </Text>
        <Text fontFamily="heading" fontSize="3xl" fontWeight={500}>
          {result.score} <Text as="span" color="ink.500">/ {result.total}</Text>
        </Text>
      </Box>
      <Box>
        <Text color="ink.500" fontSize="xs" letterSpacing="0.06em" textTransform="uppercase">
          Процент
        </Text>
        <Text
          fontFamily="heading"
          fontSize="3xl"
          fontWeight={500}
          color={gradeColor(result.percentage)}
        >
          {result.percentage}%
        </Text>
      </Box>
    </HStack>

    {result.violations.length > 0 && <ViolationsBlock violations={result.violations} />}

    <Divider />

    <Stack spacing={5}>
      {result.answers.map((a, i) => (
        <AnswerBlock key={a.questionId} answer={a} index={i} />
      ))}
    </Stack>
  </Stack>
);

const ViolationsBlock = ({ violations }: { violations: ViolationEntry[] }) => (
  <Box borderWidth="1px" borderColor="warn" borderRadius="sm" p={4} bg="card">
    <HStack spacing={2} mb={3} color="warn">
      <AlertTriangle size={18} strokeWidth={1.5} />
      <Text
        fontFamily="heading"
        fontWeight={500}
        fontSize="sm"
        letterSpacing="0.04em"
        textTransform="uppercase"
      >
        Нарушения · {violations.length}
      </Text>
    </HStack>
    <Stack spacing={1}>
      {violations.map((v, i) => (
        <HStack key={i} spacing={3} fontSize="sm" fontFamily="mono">
          <Text color="ink.500" minW="16ch">
            {formatDateTime(new Date(v.at).getTime())}
          </Text>
          <Text color="ink.700">{VIOLATION_LABEL[v.kind] ?? v.kind}</Text>
        </HStack>
      ))}
    </Stack>
  </Box>
);

interface AnswerProps {
  answer: AnswerRecord;
  index: number;
}

const AnswerBlock = ({ answer, index }: AnswerProps) => {
  const skipped = answer.selectedIndex === null;
  const correct = !skipped && answer.selectedIndex === answer.correctIndex;
  return (
    <Box borderWidth="1px" borderColor="line" borderRadius="sm" p={4} bg="card">
      <HStack spacing={3} mb={3} align="flex-start">
        <Text
          fontFamily="mono"
          color="ink.500"
          fontSize="sm"
          minW="2ch"
        >
          {String(index + 1).padStart(2, '0')}
        </Text>
        <Text fontWeight={500} flex="1">
          {answer.questionText}
        </Text>
        {skipped ? (
          <MinusCircle size={18} strokeWidth={1.5} color="var(--chakra-colors-ink-500)" />
        ) : correct ? (
          <CheckCircle2 size={18} strokeWidth={1.5} color="var(--chakra-colors-ok)" />
        ) : (
          <XCircle size={18} strokeWidth={1.5} color="var(--chakra-colors-err)" />
        )}
      </HStack>
      <VStack align="stretch" spacing={2} pl={6}>
        {answer.options.map((opt, oi) => {
          const isCorrect = oi === answer.correctIndex;
          const isPicked = oi === answer.selectedIndex;
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
          if (isPicked && isCorrect) {
            bg = 'paper.100';
          }
          return (
            <HStack
              key={oi}
              spacing={3}
              p={2}
              bg={bg}
              borderRadius="sm"
              align="flex-start"
            >
              <Text fontFamily="mono" color="ink.500" fontSize="sm" minW="2ch">
                {String.fromCharCode(65 + oi)}
              </Text>
              <Text color={color} fontWeight={weight}>
                {opt}
              </Text>
            </HStack>
          );
        })}
      </VStack>
    </Box>
  );
};
