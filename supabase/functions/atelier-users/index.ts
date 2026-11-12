// atelier-users: create / update / delete / reset-password for workshop staff.
//
// Replaces the browser-side service-role client (the key was shipped to every
// visitor of the atelier app). The caller sends their own session JWT; we
// check they are an admin in public.users_atelier before doing anything.
import { createClient } from "npm:@supabase/supabase-js@2";

// Prefer the new secret key (sb_secret_...), fall back to the legacy service_role JWT.
function serviceKey(): string {
  try {
    const k = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}")?.default;
    if (k) return k;
  } catch { /* fall through */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
}

// CORS is not the security boundary: every call needs an atelier admin's JWT.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const ROLES = ["admin", "viewer", "reception"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f-]{36}$/i;
const PROFILE_COLUMNS = 'id, email, name, "lastName", role';
const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Who is calling?
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return reply(401, { error: "Not authenticated" });
  const { data: who, error: whoErr } = await admin.auth.getUser(token);
  if (whoErr || !who.user) return reply(401, { error: "Not authenticated" });

  // 2. Is the caller an atelier admin? (profile matched by id or email)
  const callerEmail = (who.user.email ?? "").toLowerCase();
  const byId = await admin.from("users_atelier").select("role").eq("id", who.user.id).limit(1);
  const byEmail = callerEmail
    ? await admin.from("users_atelier").select("role").ilike("email", callerEmail.replace(/[%_\\]/g, "\\$&")).limit(5)
    : { data: [] };
  const roles = [...(byId.data ?? []), ...(byEmail.data ?? [])].map((p) => p.role);
  if (!roles.includes("admin")) return reply(403, { error: "Forbidden" });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: "Invalid JSON" });
  }

  // 3. Act
  switch (body.action) {
    case "create": {
      const email = text(body.email, 254).toLowerCase();
      const password = String(body.password ?? "");
      const name = text(body.name, 100);
      const lastName = text(body.lastName, 100);
      const role = String(body.role ?? "");
      if (!EMAIL_RE.test(email)) return reply(400, { error: "Email invalide" });
      if (password.length < 8 || password.length > 72) return reply(400, { error: "Mot de passe: 8 à 72 caractères" });
      if (!ROLES.includes(role)) return reply(400, { error: "Rôle invalide" });

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { name, lastName, role },
      });
      if (createErr || !created.user) return reply(400, { error: createErr?.message ?? "Création impossible" });

      const { data: profile, error: profErr } = await admin
        .from("users_atelier")
        .insert({ id: created.user.id, email, name, lastName, role })
        .select(PROFILE_COLUMNS)
        .single();
      if (profErr) {
        await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
        return reply(500, { error: "Création du profil impossible" });
      }
      return reply(200, { user: profile });
    }

    case "update": {
      const id = String(body.id ?? "");
      if (!UUID_RE.test(id)) return reply(400, { error: "Identifiant invalide" });
      const patch: Record<string, unknown> = {};
      if (body.email !== undefined) {
        const email = text(body.email, 254).toLowerCase();
        if (!EMAIL_RE.test(email)) return reply(400, { error: "Email invalide" });
        const { error } = await admin.auth.admin.updateUserById(id, { email, email_confirm: true });
        if (error) return reply(400, { error: error.message });
        patch.email = email;
      }
      if (body.name !== undefined) patch.name = text(body.name, 100);
      if (body.lastName !== undefined) patch.lastName = text(body.lastName, 100);
      if (body.role !== undefined) {
        if (!ROLES.includes(String(body.role))) return reply(400, { error: "Rôle invalide" });
        if (id === who.user.id && body.role !== "admin") {
          return reply(400, { error: "Impossible de retirer votre propre rôle admin" });
        }
        patch.role = body.role;
      }
      const { data, error } = await admin
        .from("users_atelier").update(patch).eq("id", id).select(PROFILE_COLUMNS).single();
      if (error) return reply(500, { error: "Mise à jour impossible" });
      return reply(200, { user: data });
    }

    case "delete": {
      const id = String(body.id ?? "");
      if (!UUID_RE.test(id)) return reply(400, { error: "Identifiant invalide" });
      if (id === who.user.id) return reply(400, { error: "Impossible de supprimer votre propre compte" });
      const { error } = await admin.auth.admin.deleteUser(id); // profile removed by ON DELETE CASCADE
      if (error) return reply(400, { error: error.message });
      return reply(200, { ok: true });
    }

    case "resetPassword": {
      const id = String(body.id ?? "");
      const password = String(body.password ?? "");
      if (!UUID_RE.test(id)) return reply(400, { error: "Identifiant invalide" });
      if (password.length < 8 || password.length > 72) return reply(400, { error: "Mot de passe: 8 à 72 caractères" });
      const { error } = await admin.auth.admin.updateUserById(id, { password });
      if (error) return reply(400, { error: error.message });
      return reply(200, { ok: true });
    }
  }

  return reply(400, { error: "Unknown action" });
});
