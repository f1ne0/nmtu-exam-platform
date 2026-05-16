import { Center, Spinner, Text, VStack } from '@chakra-ui/react';

interface Props {
  label?: string;
  minH?: string | number;
}

export const LoadingScreen = ({ label = 'Загрузка', minH = '60vh' }: Props) => (
  <Center minH={minH}>
    <VStack spacing={4}>
      <Spinner color="accent.500" size="lg" thickness="2px" speed="0.7s" />
      <Text fontFamily="heading" color="ink.700" letterSpacing="-0.01em">
        {label}
      </Text>
    </VStack>
  </Center>
);
