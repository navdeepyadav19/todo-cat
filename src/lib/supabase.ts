import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/**
 * The Supabase client, or `null` when the environment isn't configured.
 *
 * Both values are safe to ship in the bundle — the publishable key grants no
 * access by itself, since every table is gated by row-level security (see
 * `supabase/schema.sql`). The `service_role` key must never appear here.
 *
 * Null rather than throwing: a missing `.env.local` should leave you with a
 * working offline app and a "sync unavailable" notice, not a white screen.
 */
export const supabase: SupabaseClient | null =
  url && publishableKey ? createClient(url, publishableKey) : null

export const isSyncConfigured = supabase !== null
