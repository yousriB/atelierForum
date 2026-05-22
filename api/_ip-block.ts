// api/_ip-block.ts
//
// Shared IP-blocking helper used by Vercel Edge Middleware.
// Looks up the visiting IP against public.is_blocked() in Supabase.
//
// Per-instance 30s TTL cache to keep DB hits low. Fails open on infra error
// so a Supabase outage never bricks the dashboard.

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  ''
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  ''

let _supabase: SupabaseClient | null = null
function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return _supabase
}

const TTL_MS = 30_000
const cache = new Map<string, { value: boolean; expiresAt: number }>()

const ALWAYS_ALLOW = new Set(['127.0.0.1', '::1', 'localhost'])

export async function isIpBlocked(ip: string): Promise<boolean> {
  if (!ip || ALWAYS_ALLOW.has(ip)) return false
  if (
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('169.254.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  ) return false

  const now = Date.now()
  const cached = cache.get(ip)
  if (cached && cached.expiresAt > now) return cached.value

  const supabase = getSupabase()
  if (!supabase) return false

  try {
    const { data, error } = await supabase.rpc('is_blocked', { p_ip: ip })
    if (error) {
      console.warn('[ip-block] rpc error, failing open:', error.message)
      return false
    }
    const blocked = data === true
    cache.set(ip, { value: blocked, expiresAt: now + TTL_MS })
    return blocked
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn('[ip-block] exception, failing open:', msg)
    return false
  }
}

export function extractClientIp(req: Request): string | null {
  const h = req.headers
  const xff = h.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return (
    h.get('x-real-ip') ||
    h.get('cf-connecting-ip') ||
    h.get('true-client-ip') ||
    null
  )
}

export const BLOCKED_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Access denied</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  html,body{margin:0;height:100%;background:#0b1220;color:#e2e8f0;font-family:-apple-system,Segoe UI,Roboto,sans-serif}
  .wrap{min-height:100%;display:flex;align-items:center;justify-content:center;padding:24px}
  .card{max-width:480px;background:#111827;border:1px solid #1f2937;border-radius:16px;padding:32px;text-align:center}
  h1{margin:0 0 8px;font-size:22px}
  p{margin:8px 0 0;color:#94a3b8;font-size:14px;line-height:1.5}
  .code{margin-top:16px;font-family:ui-monospace,Menlo,monospace;font-size:11px;color:#64748b}
</style></head><body>
<div class="wrap"><div class="card">
  <h1>Access denied</h1>
  <p>Your IP address has been temporarily blocked by our security system because of suspicious activity.</p>
  <p>If you believe this is a mistake, contact the site administrator.</p>
  <div class="code">HTTP 403 — IP_BLOCKED</div>
</div></div>
</body></html>`
