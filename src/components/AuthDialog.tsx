import { useEffect, useRef, useState, type FormEvent } from 'react'

type AuthResult = { ok: boolean; message?: string }

type AuthDialogProps = {
  open: boolean
  onClose: () => void
  onSignIn: (email: string, password: string) => Promise<AuthResult>
  onSignUp: (email: string, password: string) => Promise<AuthResult>
  onGoogle: () => Promise<AuthResult>
}

type Mode = 'signin' | 'signup'

export function AuthDialog({
  open,
  onClose,
  onSignIn,
  onSignUp,
  onGoogle,
}: AuthDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // `showModal()` is what buys the free stuff: focus is trapped inside the
  // dialog, the rest of the page goes inert, Escape closes it, and ::backdrop
  // becomes stylable. Rendering a plain <div> overlay means hand-writing all
  // four, usually badly. React can't set `open` declaratively for modal mode —
  // the imperative call is the supported path.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  useEffect(() => {
    if (!open) return
    setError(null)
    setNotice(null)
    setBusy(false)
  }, [open, mode])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    setNotice(null)

    const result = mode === 'signin' ? await onSignIn(email, password) : await onSignUp(email, password)

    setBusy(false)
    if (!result.ok) {
      setError(result.message ?? 'Something went wrong.')
      return
    }
    // A successful sign-up with email confirmation on returns a message and no
    // session, so the dialog has to stay open to show it. Otherwise the auth
    // state change unmounts this anyway.
    if (result.message) {
      setNotice(result.message)
      setPassword('')
      return
    }
    onClose()
  }

  async function handleGoogle() {
    setBusy(true)
    setError(null)
    const result = await onGoogle()
    // On success the browser navigates away to Google, so this rarely runs.
    if (!result.ok) {
      setBusy(false)
      setError(result.message ?? 'Google sign-in is unavailable.')
    }
  }

  return (
    <dialog className="auth" ref={ref} onClose={onClose} aria-labelledby="auth-title">
      <form className="auth__form" onSubmit={handleSubmit}>
        <h2 className="auth__title" id="auth-title">
          {mode === 'signin' ? 'Welcome back' : 'Make an account'}
        </h2>
        <p className="auth__sub">
          Your todos follow you to every device the cat lives on.
        </p>

        <button
          className="auth__google"
          type="button"
          onClick={handleGoogle}
          disabled={busy}
        >
          <svg viewBox="0 0 18 18" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
            />
            <path
              fill="#FBBC05"
              d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="auth__divider">
          <span>or</span>
        </div>

        <label className="auth__label" htmlFor="auth-email">
          Email
        </label>
        <input
          className="auth__field"
          id="auth-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <label className="auth__label" htmlFor="auth-password">
          Password
        </label>
        <input
          className="auth__field"
          id="auth-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          minLength={6}
          required
        />

        {error && (
          <p className="auth__error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="auth__notice" role="status">
            {notice}
          </p>
        )}

        <button className="auth__submit" type="submit" disabled={busy}>
          {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>

        <p className="auth__swap">
          {mode === 'signin' ? "Don't have an account?" : 'Already have one?'}{' '}
          <button
            type="button"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        <button
          className="auth__close"
          type="button"
          onClick={onClose}
          aria-label="Close"
        >
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </button>
      </form>
    </dialog>
  )
}
