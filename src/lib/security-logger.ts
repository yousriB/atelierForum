// lib/security-logger.ts
// Fire-and-forget security event logger for Fortress Insights.
// This file NEVER throws — logging must never crash the app.

const SECURITY_LOG_URL =
  'https://gjnnvubibcypgjguryeb.supabase.co/functions/v1/security-log'

const SUPABASE_ANON_KEY: string =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const ATELIER_APP_ID = '1289920d-89f2-40e1-9caf-fc943c85da79'

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = 'low' | 'medium' | 'high' | 'critical'

export interface SecurityEvent {
  event_type: 'login_attempt' | 'api_request' | 'permission_error' | 'rate_limit'
  severity?: Severity
  user_id?: string
  /** ip_address and user_agent are auto-extracted by the Edge Function */
  endpoint?: string
  method?: string
  status_code?: number
  metadata?: Record<string, unknown>
}

// ─── Core logger ──────────────────────────────────────────────────────────────

export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  // Abort after 5 seconds — prevents stale connections from piling up
  const controller = new AbortController()
  const timeoutId  = setTimeout(() => controller.abort(), 5_000)

  try {
    await fetch(SECURITY_LOG_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization:  `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id:   ATELIER_APP_ID,
        severity: event.severity ?? 'low',
        ...event,
      }),
    })
  } catch {
    // Intentionally silent — logging must never crash or slow the app
  } finally {
    clearTimeout(timeoutId)
  }
}
