import { Box, HStack, Text } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { Clock } from 'lucide-react';
import { formatTime } from '@shared/lib/format';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
`;

interface Props {
  remainingSeconds: number;
}

export const TestTimer = ({ remainingSeconds }: Props) => {
  const danger = remainingSeconds <= 60;
  return (
    <HStack
      spacing={2}
      borderWidth="1px"
      borderColor={danger ? 'err' : 'line'}
      borderRadius="sm"
      bg="card"
      px={3}
      py={2}
      color={danger ? 'err' : 'ink.900'}
      animation={danger ? `${pulse} 1.6s ease-in-out infinite` : undefined}
      role="timer"
      aria-live="polite"
    >
      <Clock size={16} strokeWidth={1.5} />
      <Text
        fontFamily="mono"
        fontWeight={500}
        letterSpacing="0.04em"
        fontSize="md"
        minW="5ch"
        textAlign="right"
      >
        {formatTime(remainingSeconds)}
      </Text>
    </HStack>
  );
};

export const TimerBadge = Box;
