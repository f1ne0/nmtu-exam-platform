import { Box, Button, Heading, Icon, Text, VStack } from '@chakra-ui/react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({ icon: IconCmp, title, description, actionLabel, onAction }: Props) => (
  <Box
    borderWidth="1px"
    borderColor="line"
    borderStyle="dashed"
    borderRadius="sm"
    py={{ base: 12, md: 16 }}
    px={6}
    bg="card"
  >
    <VStack spacing={4}>
      <Icon as={IconCmp} boxSize={8} strokeWidth={1.5} color="ink.500" />
      <Heading size="md" textAlign="center">
        {title}
      </Heading>
      {description && (
        <Text color="ink.700" textAlign="center" maxW="md">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button mt={2} onClick={onAction} variant="solid">
          {actionLabel}
        </Button>
      )}
    </VStack>
  </Box>
);
