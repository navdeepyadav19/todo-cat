type ImportPromptProps = {
  count: number
  busy: boolean
  error: string | null
  onImport: () => void
  onDismiss: () => void
}

/**
 * Offered once, when a guest signs in and their browser still holds todos.
 * Opt-in rather than automatic: a shared or borrowed browser shouldn't quietly
 * push someone else's list into your account.
 */
export function ImportPrompt({
  count,
  busy,
  error,
  onImport,
  onDismiss,
}: ImportPromptProps) {
  return (
    <div className="import" role="region" aria-label="Import local todos">
      <p className="import__text">
        You have {count} {count === 1 ? 'todo' : 'todos'} saved on this device. Add
        {count === 1 ? ' it' : ' them'} to your account?
      </p>
      {error && (
        <p className="import__error" role="alert">
          {error}
        </p>
      )}
      <div className="import__actions">
        <button
          className="import__accept"
          type="button"
          onClick={onImport}
          disabled={busy}
        >
          {busy ? 'Importing…' : 'Import'}
        </button>
        <button
          className="import__dismiss"
          type="button"
          onClick={onDismiss}
          disabled={busy}
        >
          No thanks
        </button>
      </div>
    </div>
  )
}
