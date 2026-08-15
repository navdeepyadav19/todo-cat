import type { User } from '@supabase/supabase-js'

type AccountBarProps = {
  user: User | null
  configured: boolean
  onSignIn: () => void
  onSignOut: () => void
}

export function AccountBar({ user, configured, onSignIn, onSignOut }: AccountBarProps) {
  if (!configured) {
    return (
      <div className="account">
        <span className="account__hint" title="Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY">
          Saved on this device only
        </span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="account">
        <span className="account__hint">Saved on this device</span>
        <button className="account__action" type="button" onClick={onSignIn}>
          Sign in to sync
        </button>
      </div>
    )
  }

  return (
    <div className="account">
      <span className="account__hint" title={user.email ?? undefined}>
        <span className="account__dot" aria-hidden="true" />
        {user.email ?? 'Signed in'}
      </span>
      <button className="account__action" type="button" onClick={onSignOut}>
        Sign out
      </button>
    </div>
  )
}
