import { createClient } from '@supabase/supabase-js';

// ─── Admin Supabase client ────────────────────────────────────────────────────
// Uses the service role key — bypasses Row Level Security and is allowed to
// manage auth.users (create, delete, update).
//
// ⚠️  Only import this from trusted admin-only code paths (e.g. the Users
//     management page). Never expose the service-role key to end users.
//
// Required env var (add to .env.local):
//     VITE_SUPABASE_SERVICE_ROLE_KEY=<your service role key>

const supabaseUrl    = import.meta.env.VITE_SUPABASE_URL              as string;
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

if (!serviceRoleKey) {
  // Don't throw at import time — that would crash any page that imports
  // a module which transitively imports this file. Warn loudly instead, and
  // let calls to supabaseAdmin fail with a clear error from the supabase-js
  // client at request time.
  console.warn(
    '[supabaseAdmin] VITE_SUPABASE_SERVICE_ROLE_KEY is not set. ' +
    'Admin features (create/delete users) will fail until this is configured.'
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey ?? '', {
  auth: {
    autoRefreshToken: false,
    persistSession:   false,
  },
});
