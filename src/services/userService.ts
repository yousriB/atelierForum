import { User } from '@/types';
import { supabase } from '@/lib/supabaseClient';

// ─── User Service ─────────────────────────────────────────────────────────────
//   - Authentication (email/password) is handled by Supabase Auth (auth.users)
//   - public.users_atelier is a PROFILE table:
//       id (= auth.users.id), email, name, lastName, role
//   - Creating, editing, deleting accounts and resetting passwords need admin
//     rights on auth.users, so they go through the `atelier-users` edge
//     function. It holds the secret key server-side and checks that the
//     caller is an atelier admin. No service-role key may live in this bundle.

export interface UserFormData {
  email:    string;
  password: string;        // only used at create time, sent to Supabase Auth
  name:     string;
  lastName: string;
  role:     User['role'];
}

const PROFILE_COLUMNS = 'id, email, name, "lastName", role';

async function callAtelierUsers<T>(payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('atelier-users', { body: payload });
  if (error) {
    let message = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx) message = (await ctx.json()).error ?? message;
    } catch { /* keep default message */ }
    throw new Error(message);
  }
  return data as T;
}

export const userService = {

  // ── Read ────────────────────────────────────────────────────────────────────

  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users_atelier')
      .select(PROFILE_COLUMNS)
      .order('email', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error.message);
      throw new Error('Failed to fetch users');
    }

    return (data ?? []) as User[];
  },

  // ── Create ──────────────────────────────────────────────────────────────────

  async createUser(userData: UserFormData): Promise<User> {
    const { user } = await callAtelierUsers<{ user: User }>({ action: 'create', ...userData });
    return user;
  },

  // ── Update ──────────────────────────────────────────────────────────────────

  async updateUser(
    id: string,
    userData: Partial<Omit<UserFormData, 'password'>>,
  ): Promise<User> {
    const { user } = await callAtelierUsers<{ user: User }>({ action: 'update', id, ...userData });
    return user;
  },

  // ── Delete ──────────────────────────────────────────────────────────────────

  async deleteUser(id: string): Promise<void> {
    await callAtelierUsers<{ ok: true }>({ action: 'delete', id });
  },

  // ── Password reset ──────────────────────────────────────────────────────────

  async resetPassword(id: string, newPassword: string): Promise<void> {
    await callAtelierUsers<{ ok: true }>({ action: 'resetPassword', id, password: newPassword });
  },
};
