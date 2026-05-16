import {
  Box,
  Card,
  CardBody,
  Flex,
  HStack,
  Heading,
  Text,
  type CardProps,
} from '@chakra-ui/react';
import { Clock, FileText, ListChecks } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Test } from '@entities/test';
import { formatDate, pluralizeRu } from '@shared/lib/format';

interface Props extends Omit<CardProps, 'children'> {
  test: Test;
  meta?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
  showCreatedAt?: boolean;
}

export const TestCard = ({
  test,
  meta,
  actions,
  onClick,
  showCreatedAt = true,
  ...rest
}: Props) => {
  const interactive = !!onClick;
  const minWord = pluralizeRu(test.durationMinutes, ['минута', 'минуты', 'минут']);
  const qWord = pluralizeRu(test.questions.length, ['вопрос', 'вопроса', 'вопросов']);

  return (
    <Card
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      cursor={interactive ? 'pointer' : 'default'}
      transition="border-color 150ms, transform 150ms"
      _hover={
        interactive
          ? { borderColor: 'accent.500', transform: 'translateY(-1px)' }
          : undefined
      }
      _focusVisible={{ borderColor: 'accent.500', outline: 'none' }}
      {...rest}
    >
      <CardBody p={6}>
        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" gap={4}>
          <Box flex="1" minW={0}>
            <Heading size="md" mb={2} noOfLines={2}>
              {test.title || 'Без названия'}
            </Heading>
            {test.description && (
              <Text color="ink.700" fontSize="sm" noOfLines={3} mb={4}>
                {test.description}
              </Text>
            )}
            <HStack
              spacing={5}
              color="ink.500"
              fontSize="sm"
              flexWrap="wrap"
              fontFamily="mono"
            >
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
              {showCreatedAt && (
                <HStack spacing={2}>
                  <FileText size={16} strokeWidth={1.5} />
                  <Text>{formatDate(test.createdAt)}</Text>
                </HStack>
              )}
              {meta}
            </HStack>
          </Box>
          {actions && (
            <HStack
              spacing={2}
              align="flex-start"
              justify={{ base: 'flex-start', md: 'flex-end' }}
              onClick={(e) => e.stopPropagation()}
            >
              {actions}
            </HStack>
          )}
        </Flex>
      </CardBody>
    </Card>
  );
};
