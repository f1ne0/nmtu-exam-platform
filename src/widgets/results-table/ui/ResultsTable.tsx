import {
  Box,
  HStack,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useBreakpointValue,
} from '@chakra-ui/react';
import { gradeColor, type TestResult } from '@entities/result';
import { formatDateTime } from '@shared/lib/format';

interface Props {
  results: readonly TestResult[];
  onRowClick: (result: TestResult) => void;
  groupNameById?: Map<string, string>;
}

const groupLabel = (
  result: TestResult,
  groupNameById: Map<string, string> | undefined,
): string => {
  if (!result.groupId) return '—';
  return groupNameById?.get(result.groupId) ?? 'Группа';
};

export const ResultsTable = ({ results, onRowClick, groupNameById }: Props) => {
  const isMobile = useBreakpointValue({ base: true, md: false });

  if (isMobile) {
    return (
      <Stack spacing={3}>
        {results.map((r) => (
          <Box
            key={r.id}
            as="button"
            textAlign="left"
            borderWidth="1px"
            borderColor="line"
            borderRadius="sm"
            bg="card"
            p={4}
            onClick={() => onRowClick(r)}
            transition="border-color 150ms"
            _hover={{ borderColor: 'accent.500' }}
            _focusVisible={{ borderColor: 'accent.500', outline: 'none' }}
          >
            <HStack mb={1} justify="space-between" align="flex-start">
              <Text fontFamily="heading" fontSize="lg" fontWeight={500}>
                {r.studentName}
              </Text>
              <Text fontFamily="mono" fontSize="xs" color="ink.500">
                {groupLabel(r, groupNameById)}
              </Text>
            </HStack>
            <Text color="ink.700" fontSize="sm" mb={2}>
              {r.testTitle}
            </Text>
            <HStack justify="space-between">
              <Text fontFamily="mono" fontSize="sm">
                {r.score} из {r.total}
              </Text>
              <Text fontFamily="mono" fontSize="sm" color={gradeColor(r.percentage)}>
                {r.percentage}%
              </Text>
              <Text fontFamily="mono" fontSize="xs" color="ink.500">
                {formatDateTime(r.completedAt)}
              </Text>
            </HStack>
          </Box>
        ))}
      </Stack>
    );
  }

  return (
    <TableContainer borderWidth="1px" borderColor="line" borderRadius="sm" bg="card">
      <Table variant="simple" size="md">
        <Thead>
          <Tr>
            <Th>Студент</Th>
            <Th>Группа</Th>
            <Th>Тест</Th>
            <Th isNumeric>Балл</Th>
            <Th isNumeric>%</Th>
            <Th>Дата</Th>
          </Tr>
        </Thead>
        <Tbody>
          {results.map((r) => (
            <Tr
              key={r.id}
              cursor="pointer"
              transition="background 120ms"
              _hover={{ bg: 'paper.100' }}
              onClick={() => onRowClick(r)}
            >
              <Td fontWeight={500}>
                <Text>{r.studentName}</Text>
              </Td>
              <Td color={r.groupId ? 'ink.900' : 'ink.500'} fontFamily="mono" fontSize="sm">
                {groupLabel(r, groupNameById)}
              </Td>
              <Td color="ink.700">{r.testTitle}</Td>
              <Td isNumeric fontFamily="mono">
                {r.score} / {r.total}
              </Td>
              <Td isNumeric fontFamily="mono" color={gradeColor(r.percentage)}>
                {r.percentage}%
              </Td>
              <Td color="ink.500" fontFamily="mono" fontSize="sm">
                {formatDateTime(r.completedAt)}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};
