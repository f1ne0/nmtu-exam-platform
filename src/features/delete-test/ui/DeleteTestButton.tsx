import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  IconButton,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTestStore } from '@entities/test';

interface Props {
  testId: string;
  testTitle: string;
  variant?: 'icon' | 'button';
}

export const DeleteTestButton = ({ testId, testTitle, variant = 'icon' }: Props) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const remove = useTestStore((s) => s.remove);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const onConfirm = async () => {
    setBusy(true);
    try {
      await remove(testId);
      toast({
        title: 'Тест удалён',
        status: 'success',
        position: 'bottom-right',
        duration: 2500,
      });
      onClose();
    } catch (e) {
      toast({
        title: 'Не удалось удалить',
        description: (e as Error).message,
        status: 'error',
        position: 'bottom-right',
        duration: 4000,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {variant === 'icon' ? (
        <IconButton
          aria-label="Удалить тест"
          icon={<Trash2 size={18} strokeWidth={1.5} />}
          variant="ghost"
          onClick={onOpen}
        />
      ) : (
        <Button variant="outline" leftIcon={<Trash2 size={18} strokeWidth={1.5} />} onClick={onOpen}>
          Удалить
        </Button>
      )}
      <AlertDialog isOpen={isOpen} onClose={onClose} leastDestructiveRef={cancelRef} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontFamily="heading" fontWeight={500}>
              Удалить тест?
            </AlertDialogHeader>
            <AlertDialogBody color="ink.700">
              Тест «{testTitle}» будет удалён без возможности восстановления. Результаты студентов
              сохранятся.
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef} variant="ghost" onClick={onClose}>
                Отмена
              </Button>
              <Button onClick={onConfirm} isLoading={busy} bg="err" _hover={{ bg: 'err' }}>
                Удалить
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};
