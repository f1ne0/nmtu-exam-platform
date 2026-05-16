import { useState } from 'react';
import { findGroupByCode } from '@entities/group';
import { useSessionStore } from '@entities/session';

export const useAuthStudent = () => {
  const signInStudent = useSessionStore((s) => s.signInStudent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (name: string, groupCode: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    const trimmedName = name.trim();
    const trimmedCode = groupCode.trim().toUpperCase();
    if (trimmedName.length < 2) {
      setError('Введите фамилию и имя');
      setLoading(false);
      return false;
    }
    let group: { id: string; name: string } | null = null;
    if (trimmedCode) {
      try {
        const found = await findGroupByCode(trimmedCode);
        if (!found) {
          setError('Код группы не найден');
          setLoading(false);
          return false;
        }
        group = { id: found.id, name: found.name };
      } catch (e) {
        setError((e as Error).message ?? 'Не удалось проверить код');
        setLoading(false);
        return false;
      }
    }
    const res = await signInStudent(trimmedName, group);
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? 'Не удалось войти');
      return false;
    }
    return true;
  };

  return { loading, error, submit };
};
