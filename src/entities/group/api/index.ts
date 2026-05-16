import { getSupabase, type GroupRow } from '@shared/api/supabase';
import type { Group } from '../model/types';

const rowToGroup = (r: GroupRow): Group => ({
  id: r.id,
  name: r.name,
  code: r.code,
  createdAt: new Date(r.created_at).getTime(),
});

const generateCode = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i += 1) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return s;
};

export const getAllGroups = async (): Promise<Group[]> => {
  const { data, error } = await getSupabase()
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data as GroupRow[] | null) ?? []).map(rowToGroup);
};

export const createGroup = async (name: string): Promise<Group> => {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateCode();
    const payload = {
      name: name.trim(),
      code,
      created_by: user?.id ?? null,
    };
    const { data, error } = await sb.from('groups').insert(payload).select().single();
    if (!error && data) return rowToGroup(data as GroupRow);
    if (error && error.code !== '23505') throw new Error(error.message);
    // 23505 — конфликт по уникальному коду, повторим с новым кодом
  }
  throw new Error('Не удалось сгенерировать уникальный код');
};

export const renameGroup = async (id: string, name: string): Promise<void> => {
  const { error } = await getSupabase()
    .from('groups')
    .update({ name: name.trim() })
    .eq('id', id);
  if (error) throw new Error(error.message);
};

export const deleteGroup = async (id: string): Promise<void> => {
  const { error } = await getSupabase().from('groups').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const findGroupByCode = async (code: string): Promise<Group | null> => {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return null;
  const { data, error } = await getSupabase().rpc('find_group_by_code', { p_code: trimmed });
  if (error) throw new Error(error.message);
  const rows = (data as Array<{ id: string; name: string }> | null) ?? [];
  const row = rows[0];
  if (!row) return null;
  return { id: row.id, name: row.name, code: trimmed, createdAt: 0 };
};
