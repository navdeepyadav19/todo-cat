import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthResult = { ok: boolean; message?: string }

/**
 * Session state, kept in sync with Supabase.
 *
 * Two sources feed `user`: one `getSession()` read on mount, and then the
 * `onAuthStateChange` stream for everything after — sign in, sign out, token
 * refresh, and the redirect back from an OAuth provider.
 *
 * The subscription MUST be unsubscribed on cleanup. `main.tsx` renders under
 * `<StrictMode>`, which deliberately mounts effects twice in development; a
 * missing cleanup leaves two live listeners and every auth event fires twice.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  // Starts true only when there's a session to restore. With no client
  // configured there is nothing to wait for, so guests render immediately.
  const [loading, setLoading] = useState(supabase !== null)

  useEffect(() => {
    if (!supabase) return

    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!supabase) return { ok: false, message: 'Sync is not configured.' }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return error ? { ok: false, message: error.message } : { ok: true }
    },
    [],
  )

  const signUp = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!supabase) return { ok: false, message: 'Sync is not configured.' }
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return { ok: false, message: error.message }

      // With "Confirm email" enabled, signUp succeeds but hands back no
      // session — the account exists and is waiting on a link in the inbox.
      // Without that message the UI would look like nothing happened.
      if (!data.session) {
        return { ok: true, message: 'Check your email to confirm your account.' }
      }
      return { ok: true }
    },
    [],
  )

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    if (!supabase) return { ok: false, message: 'Sync is not configured.' }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      // Comes back to whatever origin we left from, so the same build works
      // on localhost, on preview deploys, and in production. Each of those
      // origins has to be listed in Supabase → Auth → URL Configuration.
      options: { redirectTo: window.location.origin },
    })
    return error ? { ok: false, message: error.message } : { ok: true }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  return { user, loading, signIn, signUp, signInWithGoogle, signOut }
}
