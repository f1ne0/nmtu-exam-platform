import {
  Box,
  Button,
  Code,
  Divider,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import type { Question } from '@entities/test';
import { parseTestText } from '../lib/parseTestText';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (mode: 'replace' | 'append', questions: Question[]) => void;
}

const PLACEHOLDER = `Йога это:
====
умение правильно жить
====
способность долго не дышать
====
#философская система
====
экзотическая система физических упражнений
++++

Аватары Вишну это:
====
его сыновья
====
#его нисхождения
====
его друзья
++++`;

export const ImportTestTextDialog = ({ isOpen, onClose, onApply }: Props) => {
  const [text, setText] = useState('');

  const parsed = useMemo(() => parseTestText(text), [text]);
  const hasContent = parsed.questions.length > 0;

  const handleApply = (mode: 'replace' | 'append') => {
    if (!hasContent) return;
    onApply(mode, parsed.questions);
    setText('');
    onClose();
  };

  const handleClose = () => {
    setText('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl" isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontFamily="heading" fontWeight={500} borderBottomWidth="1px" borderColor="line">
          Импорт вопросов из текста
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody py={5}>
          <Stack spacing={5}>
            <Box>
              <Text color="ink.700" fontSize="sm" mb={3}>
                Вставьте вопросы в текстовом формате. Разделитель блоков —{' '}
                <Code bg="paper.100" color="ink.900" px={2}>
                  ====
                </Code>
                , конец вопроса —{' '}
                <Code bg="paper.100" color="ink.900" px={2}>
                  ++++
                </Code>
                . Правильный вариант начинается с{' '}
                <Code bg="paper.100" color="ink.900" px={2}>
                  #
                </Code>
                .
              </Text>
            </Box>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={PLACEHOLDER}
              rows={14}
              fontFamily="mono"
              fontSize="sm"
              variant="flushed"
            />

            <Divider />

            <VStack align="stretch" spacing={2}>
              <HStack justify="space-between">
                <Text
                  color="ink.500"
                  fontSize="xs"
                  letterSpacing="0.06em"
                  textTransform="uppercase"
                >
                  Найдено вопросов
                </Text>
                <Text fontFamily="mono" fontSize="md">
                  {parsed.questions.length}
                </Text>
              </HStack>
              {parsed.warnings.length > 0 && (
                <Box borderWidth="1px" borderColor="warn" borderRadius="sm" p={3}>
                  <Text
                    color="warn"
                    fontSize="xs"
                    letterSpacing="0.06em"
                    textTransform="uppercase"
                    mb={2}
                  >
                    Предупреждения
                  </Text>
                  <Stack spacing={1}>
                    {parsed.warnings.map((w, i) => (
                      <Text key={i} color="ink.700" fontSize="sm">
                        — {w}
                      </Text>
                    ))}
                  </Stack>
                </Box>
              )}
            </VStack>
          </Stack>
        </ModalBody>
        <ModalFooter borderTopWidth="1px" borderColor="line" gap={3}>
          <Button variant="ghost" onClick={handleClose}>
            Отмена
          </Button>
          <Button
            variant="outline"
            onClick={() => handleApply('append')}
            isDisabled={!hasContent}
          >
            Добавить к существующим
          </Button>
          <Button
            variant="solid"
            onClick={() => handleApply('replace')}
            isDisabled={!hasContent}
          >
            Заменить вопросы
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
