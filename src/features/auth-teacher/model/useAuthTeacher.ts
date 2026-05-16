import { useState } from 'react';
import { useSessionStore } from '@entities/session';

export const useAuthTeacher = () => {
  const signInTeacher = useSessionStore((s) => s.signInTeacher);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Введите email и пароль');
      setLoading(false);
      return false;
    }
    const res = await signInTeacher(trimmedEmail, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? 'Не удалось войти');
      return false;
    }
    return true;
  };

  return { loading, error, submit, clearError: () => setError(null) };
};
