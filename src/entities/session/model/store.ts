import { create } from 'zustand';
import { getSupabase } from '@shared/api/supabase';
import type { Role } from '@shared/types';

interface SessionState {
  role: Role | null;
  studentName: string | null;
  studentGroupId: string | null;
  studentGroupName: string | null;
  userId: string | null;
  email: string | null;
  ready: boolean;
  init: () => Promise<void>;
  signInTeacher: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signInStudent: (
    name: string,
    group?: { id: string; name: string } | null,
  ) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const STUDENT_NAME_KEY = 'bilet:student_name';
const STUDENT_GROUP_ID_KEY = 'bilet:student_group_id';
const STUDENT_GROUP_NAME_KEY = 'bilet:student_group_name';

const lsGet = (key: string) =>
  typeof window === 'undefined' ? null : window.localStorage.getItem(key);
const lsSet = (key: string, value: string | null) => {
  if (typeof window === 'undefined') return;
  if (value === null) window.localStorage.removeItem(key);
  else window.localStorage.setItem(key, value);
};

export const useSessionStore = create<SessionState>((set) => ({
  role: null,
  studentName: null,
  studentGroupId: null,
  studentGroupName: null,
  userId: null,
  email: null,
  ready: false,
  init: async () => {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      set({ ready: true });
      return;
    }
    const isAnon = (user as { is_anonymous?: boolean }).is_anonymous === true;
    set({
      ready: true,
      role: isAnon ? 'student' : 'teacher',
      userId: user.id,
      email: user.email ?? null,
      studentName: isAnon ? lsGet(STUDENT_NAME_KEY) : null,
      studentGroupId: isAnon ? lsGet(STUDENT_GROUP_ID_KEY) : null,
      studentGroupName: isAnon ? lsGet(STUDENT_GROUP_NAME_KEY) : null,
    });
    sb.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      if (!u) {
        set({
          role: null,
          userId: null,
          email: null,
          studentName: null,
          studentGroupId: null,
          studentGroupName: null,
        });
        return;
      }
      const anon = (u as { is_anonymous?: boolean }).is_anonymous === true;
      set({
        role: anon ? 'student' : 'teacher',
        userId: u.id,
        email: u.email ?? null,
        studentName: anon ? lsGet(STUDENT_NAME_KEY) : null,
        studentGroupId: anon ? lsGet(STUDENT_GROUP_ID_KEY) : null,
        studentGroupName: anon ? lsGet(STUDENT_GROUP_NAME_KEY) : null,
      });
    });
  },
  signInTeacher: async (email, password) => {
    const sb = getSupabase();
    await sb.auth.signOut();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: humanizeAuthError(error.message) };
    const user = data.user;
    set({
      role: 'teacher',
      userId: user?.id ?? null,
      email: user?.email ?? null,
      studentName: null,
      studentGroupId: null,
      studentGroupName: null,
    });
    return { ok: true };
  },
  signInStudent: async (name, group = null) => {
    const sb = getSupabase();
    const { data: { user: currentUser } } = await sb.auth.getUser();
    const isAnon = (currentUser as { is_anonymous?: boolean } | null)?.is_anonymous === true;
    if (currentUser && !isAnon) {
      await sb.auth.signOut();
    }
    let userId = isAnon ? currentUser!.id : null;
    if (!userId) {
      const { data, error } = await sb.auth.signInAnonymously();
      if (error) return { ok: false, error: humanizeAuthError(error.message) };
      userId = data.user?.id ?? null;
    }
    if (!userId) return { ok: false, error: 'Не удалось создать сессию' };
    lsSet(STUDENT_NAME_KEY, name);
    lsSet(STUDENT_GROUP_ID_KEY, group?.id ?? null);
    lsSet(STUDENT_GROUP_NAME_KEY, group?.name ?? null);
    set({
      role: 'student',
      userId,
      studentName: name,
      studentGroupId: group?.id ?? null,
      studentGroupName: group?.name ?? null,
      email: null,
    });
    return { ok: true };
  },
  signOut: async () => {
    await getSupabase().auth.signOut();
    lsSet(STUDENT_NAME_KEY, null);
    lsSet(STUDENT_GROUP_ID_KEY, null);
    lsSet(STUDENT_GROUP_NAME_KEY, null);
    set({
      role: null,
      userId: null,
      email: null,
      studentName: null,
      studentGroupId: null,
      studentGroupName: null,
    });
  },
}));

const humanizeAuthError = (msg: string): string => {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'Неверный email или пароль';
  if (m.includes('email not confirmed')) return 'Email не подтверждён';
  if (m.includes('anonymous sign-ins are disabled')) return 'Анонимный вход временно недоступен';
  if (m.includes('rate')) return 'Слишком много попыток, подождите немного';
  return msg;
};
