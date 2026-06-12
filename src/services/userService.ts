import { User } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ─── User Service ─────────────────────────────────────────────────────────────
// After the Supabase Auth migration:
//   - Authentication (email/password) is handled by Supabase Auth (auth.users)
//   - public.users_atelier is now a PROFILE table:
//       id (= auth.users.id), email, name, lastName, role
//   - Passwords are no longer stored in users_atelier
//
// Mirrors src/services/userService.ts in the Sales Dashboard.

export interface UserFormData {
  email:    string;
  password: string;        // only used at create time, sent to Supabase Auth
  name:     string;
  lastName: string;
  role:     User['role'];
}

const PROFILE_COLUMNS = 'id, email, name, "lastName", role';

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
  // Creates the Supabase Auth account first, then inserts a profile row that
  // shares the same UUID. Wraps both in a try/catch so a failed profile
  // insert rolls back the auth user (avoiding orphaned auth accounts).
  //
  // ⚠️  Requires "Auto Confirm" (or `email_confirm: true` below) — otherwise
  //     the user can't log in until they click an email confirmation link.

  async createUser(userData: UserFormData): Promise<User> {
    // 1. Create the Auth user via the admin API (keeps the current admin
    //    session untouched, unlike supabase.auth.signUp which would log the
    //    admin OUT and the new user IN on the current browser).
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email:         userData.email,
        password:      userData.password,
        email_confirm: true,
        user_metadata: {
          name:     userData.name,
          lastName: userData.lastName,
          role:     userData.role,
        },
      });

    if (authError || !authData.user) {
      console.error('Error creating Auth user:', authError?.message);
      throw new Error(authError?.message ?? 'Failed to create Auth user');
    }

    // 2. Insert the profile row using the SAME UUID as the Auth user.
    //    users_atelier.id is a FK to auth.users(id) with ON DELETE CASCADE.
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users_atelier')
      .insert([{
        id:       authData.user.id,
        email:    userData.email,
        name:     userData.name,
        lastName: userData.lastName,
        role:     userData.role,
      }])
      .select(PROFILE_COLUMNS)
      .single();

    if (profileError) {
      console.error('Error creating user profile:', profileError.message);
      // Roll back — delete the auth user we just made so we don't leave an
      // orphaned auth account without a profile row.
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id).catch(() => {
        /* best-effort; we already logged the underlying error */
      });
      throw new Error('Failed to create user profile: ' + profileError.message);
    }

    return profile as User;
  },

  // ── Update ──────────────────────────────────────────────────────────────────
  // Updates profile fields (name, lastName, role). Email changes also update
  // the auth user so the login email stays in sync. Password changes are NOT
  // handled here — they must go through supabase.auth.updateUser or the
  // admin updateUserById endpoint as a separate "reset password" flow.

  async updateUser(
    id: string,
    userData: Partial<Omit<UserFormData, 'password'>>,
  ): Promise<User> {
    // 1. If email changed, update the auth account first so the credentials
    //    stay aligned with the profile row.
    if (userData.email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        id,
        { email: userData.email, email_confirm: true },
      );
      if (authError) {
        console.error('Error updating auth email:', authError.message);
        throw new Error('Failed to update auth email: ' + authError.message);
      }
    }

    // 2. Update the profile row.
    const updatePayload: Record<string, unknown> = {};
    if (userData.email    !== undefined) updatePayload.email    = userData.email;
    if (userData.name     !== undefined) updatePayload.name     = userData.name;
    if (userData.lastName !== undefined) updatePayload.lastName = userData.lastName;
    if (userData.role     !== undefined) updatePayload.role     = userData.role;

    const { data, error } = await supabaseAdmin
      .from('users_atelier')
      .update(updatePayload)
      .eq('id', id)
      .select(PROFILE_COLUMNS)
      .single();

    if (error) {
      console.error('Error updating user profile:', error.message);
      throw new Error('Failed to update user profile: ' + error.message);
    }

    return data as User;
  },

  // ── Delete ──────────────────────────────────────────────────────────────────
  // Deletes the auth account. The profile row is removed automatically by the
  // ON DELETE CASCADE on users_atelier.id → auth.users.id.

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) {
      console.error('Error deleting auth user:', error.message);
      throw new Error('Failed to delete user: ' + error.message);
    }
    // Profile row is gone via cascade — nothing else to do.
  },

  // ── Password reset (optional helper for an admin "reset password" button) ──

  async resetPassword(id: string, newPassword: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: newPassword,
    });
    if (error) {
      console.error('Error resetting password:', error.message);
      throw new Error('Failed to reset password: ' + error.message);
    }
  },
};
