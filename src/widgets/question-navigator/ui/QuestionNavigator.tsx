import { Box, HStack, Text, Wrap, WrapItem, useBreakpointValue } from '@chakra-ui/react';

interface Props {
  total: number;
  currentIndex: number;
  selections: ReadonlyArray<number | null>;
  onJump: (index: number) => void;
}

export const QuestionNavigator = ({ total, currentIndex, selections, onJump }: Props) => {
  const collapsed = useBreakpointValue({ base: true, md: false });

  if (collapsed) {
    return (
      <HStack
        justify="space-between"
        borderWidth="1px"
        borderColor="line"
        borderRadius="sm"
        bg="card"
        py={2}
        px={4}
      >
        <Text color="ink.500" fontSize="xs" letterSpacing="0.06em" textTransform="uppercase">
          Вопрос
        </Text>
        <Text fontFamily="mono">
          {currentIndex + 1} / {total}
        </Text>
      </HStack>
    );
  }

  return (
    <Wrap spacing={2} align="center">
      {Array.from({ length: total }).map((_, i) => {
        const answered = selections[i] !== null && selections[i] !== undefined;
        const isCurrent = i === currentIndex;
        return (
          <WrapItem key={i}>
            <Box
              as="button"
              aria-label={`Перейти к вопросу ${i + 1}`}
              aria-current={isCurrent ? 'true' : undefined}
              onClick={() => onJump(i)}
              w="36px"
              h="36px"
              borderRadius="sm"
              borderWidth={isCurrent ? '2px' : '1px'}
              borderColor={isCurrent ? 'accent.500' : answered ? 'accent.500' : 'line'}
              bg={answered && !isCurrent ? 'accent.500' : 'card'}
              color={answered && !isCurrent ? 'white' : 'ink.900'}
              fontFamily="mono"
              fontSize="sm"
              transition="all 120ms"
              _hover={{ borderColor: 'accent.500' }}
              _focusVisible={{ outline: 'none', boxShadow: '0 0 0 2px var(--chakra-colors-accent-500)' }}
            >
              {i + 1}
            </Box>
          </WrapItem>
        );
      })}
    </Wrap>
  );
};
