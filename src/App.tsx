import { useEffect, useState } from 'react'
import { AccountBar } from './components/AccountBar'
import { AuthDialog } from './components/AuthDialog'
import { CatReaction } from './components/CatReaction'
import { ImportPrompt } from './components/ImportPrompt'
import { TodoInput } from './components/TodoInput'
import { TodoList } from './components/TodoList'
import { useAuth } from './hooks/useAuth'
import { useTodos } from './hooks/useTodos'
import { isSyncConfigured } from './lib/supabase'
import {
  clearLocalTodos,
  dismissImport,
  readLocalTodos,
  wasImportDismissed,
} from './lib/storage'
import type { Todo } from './types'

export default function App() {
  const { user, loading: authLoading, signIn, signUp, signInWithGoogle, signOut } =
    useAuth()
  const {
    todos,
    celebration,
    loading: todosLoading,
    syncError,
    addTodo,
    toggleTodo,
    removeTodo,
    clearCompleted,
    importTodos,
  } = useTodos(user?.id ?? null)

  const [authOpen, setAuthOpen] = useState(false)
  const [pendingImport, setPendingImport] = useState<Todo[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  // On sign-in, look for todos left behind in this browser and offer them.
  // Waits for `todosLoading` so the offer appears alongside the real list
  // rather than flashing over an empty one.
  useEffect(() => {
    if (!user || todosLoading) {
      setPendingImport(null)
      return
    }
    if (wasImportDismissed(user.id)) return
    const local = readLocalTodos()
    setPendingImport(local.length > 0 ? local : null)
  }, [user, todosLoading])

  async function handleImport() {
    if (!pendingImport) return
    setImporting(true)
    setImportError(null)
    try {
      await importTodos(pendingImport)
      // Only now is it safe to drop the originals.
      clearLocalTodos()
      setPendingImport(null)
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setImporting(false)
    }
  }

  function handleDismissImport() {
    if (user) dismissImport(user.id)
    setPendingImport(null)
  }

  const remaining = todos.filter((t) => !t.done).length
  const doneCount = todos.length - remaining
  const busy = authLoading || todosLoading

  return (
    <main className="app">
      <AccountBar
        user={user}
        configured={isSyncConfigured}
        onSignIn={() => setAuthOpen(true)}
        onSignOut={signOut}
      />

      <header className="app__header">
        <CatReaction celebration={celebration} />
      </header>

      {syncError && (
        <p className="banner banner--error" role="alert">
          {syncError}
        </p>
      )}

      {pendingImport && (
        <ImportPrompt
          count={pendingImport.length}
          busy={importing}
          error={importError}
          onImport={handleImport}
          onDismiss={handleDismissImport}
        />
      )}

      <section className="card">
        <TodoInput onAdd={addTodo} />

        {busy ? (
          <p className="empty">Fetching your list…</p>
        ) : (
          <TodoList todos={todos} onToggle={toggleTodo} onRemove={removeTodo} />
        )}

        {!busy && todos.length > 0 && (
          <footer className="card__footer">
            <span className="card__count">
              {remaining === 0
                ? 'All done 🎉'
                : `${remaining} left${doneCount ? ` · ${doneCount} done` : ''}`}
            </span>
            {doneCount > 0 && (
              <button className="card__clear" onClick={clearCompleted}>
                Clear completed
              </button>
            )}
          </footer>
        )}
      </section>

      <AuthDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSignIn={signIn}
        onSignUp={signUp}
        onGoogle={signInWithGoogle}
      />
    </main>
  )
}
