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
      setError('name_too_short');
      setLoading(false);
      return false;
    }
    let group: { id: string; name: string } | null = null;
    if (trimmedCode) {
      try {
        const found = await findGroupByCode(trimmedCode);
        if (!found) {
          setError('code_not_found');
          setLoading(false);
          return false;
        }
        group = { id: found.id, name: found.name };
      } catch (e) {
        setError((e as Error).message ?? 'code_check_failed');
        setLoading(false);
        return false;
      }
    }
    const res = await signInStudent(trimmedName, group);
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? 'signin_failed');
      return false;
    }
    return true;
  };

  const clearError = () => setError(null);

  return { loading, error, submit, clearError };
};
