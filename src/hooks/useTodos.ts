import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getPraise } from '../lib/praise'
import { createRemoteStore, localStore } from '../lib/storage'
import type { Celebration, CatMood, CompletionContext, Todo } from '../types'

/** How far back `recentCompletions` remembers, in ms. */
const STREAK_WINDOW = 60_000

/**
 * ─────────────────────────────────────────────────────────────────────
 * YOUR CALL #2 — when does the cat lose its mind?
 *
 * Every completion makes the cat `happy`. This decides when it escalates to
 * `ecstatic` (bigger animation, paw particles, a rarer set of phrases).
 *
 * The trade-off is real and there's no objectively right answer:
 *   - escalate too often and the peak stops meaning anything
 *   - escalate too rarely and most users never see the best part of the app
 *
 * The default below fires when you clear the last open task. Some alternatives,
 * all implementable with what's on `ctx`:
 *
 *   streak     ctx.recentCompletions.length >= 3        // 3 within 60s
 *   milestone  ctx.todos.filter(t => t.done).length % 5 === 0
 *   effort     ctx.completed.text.length > 40           // reward the big ones
 *   grind      Date.now() - ctx.completed.createdAt > 86_400_000  // finally!
 *
 * Change the body, keep the signature.
 * ─────────────────────────────────────────────────────────────────────
 */
function getCatMood(ctx: CompletionContext): CatMood {
  const openTasksRemaining = ctx.todos.some((t) => !t.done)
  return openTasksRemaining ? 'happy' : 'ecstatic'
}

/** A write that was applied to the screen but rejected by the server. */
export type SyncFailure = {
  error: Error
  /** The list as it was before the optimistic update. */
  previous: Todo[]
  /** The list as the user currently sees it, with the change applied. */
  optimistic: Todo[]
  /** Fire the same write again. Safe to call from a timer. */
  retry: () => void
}

export type SyncDecision = {
  /** Which list to show now. */
  todos: Todo[]
  /** What to tell the user, or `null` to say nothing. */
  message: string | null
}

/**
 * ─────────────────────────────────────────────────────────────────────
 * YOUR CALL #3 — what happens when a write doesn't land?
 *
 * Writes are optimistic: the checkbox ticks and the cat celebrates the instant
 * you click, and only then does the row go to Postgres. Usually it lands. On a
 * flaky connection it doesn't, and this decides what the user sees.
 *
 * Three defensible answers, and they disagree:
 *
 *   honest    return { todos: f.previous, message: "Couldn't save that." }
 *             The checkbox visibly un-ticks. Truthful, and jarring — the cat
 *             already congratulated you for something that didn't happen.
 *
 *   forgiving return { todos: f.optimistic, message: 'Offline — retrying…' }
 *             plus `setTimeout(f.retry, 3000)`. The UI keeps the change and
 *             heals itself. Feels great when the retry works; quietly lies
 *             when it never does.
 *
 *   quiet     return { todos: f.optimistic, message: null }
 *             Pretend nothing happened. Don't — this is how todos vanish on
 *             the next reload with no one having been told.
 *
 * The default is `honest`, on the theory that a todo app's whole job is to be
 * trusted about what it remembers.
 *
 * Change the body, keep the signature.
 * ─────────────────────────────────────────────────────────────────────
 */
function onSyncFailure(failure: SyncFailure): SyncDecision {
  return {
    todos: failure.previous,
    message: `Couldn't save that — ${failure.error.message}`,
  }
}

const NO_CELEBRATION: Celebration = { id: 0, mood: 'idle', praise: '' }

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

/**
 * Todos, the cat's reaction to them, and their persistence.
 *
 * Pass a `userId` to read and write Postgres; pass `null` for the signed-out
 * guest experience, which is the original localStorage behaviour.
 */
export function useTodos(userId: string | null) {
  // Swapping stores is what a sign-in *is*, as far as this hook is concerned.
  const store = useMemo(
    () => (userId ? createRemoteStore(userId) : localStore),
    [userId],
  )

  const [todos, setTodos] = useState<Todo[]>([])
  const [celebration, setCelebration] = useState<Celebration>(NO_CELEBRATION)
  const [loading, setLoading] = useState(true)
  const [syncError, setSyncError] = useState<string | null>(null)

  // Completion timestamps live in a ref, not state — they feed the mood
  // decision but nothing renders from them, so they shouldn't trigger renders.
  const completionsRef = useRef<number[]>([])

  // Load whenever the store changes, i.e. on mount and on every sign-in or
  // sign-out. `active` guards against a slow response from the previous user's
  // store landing after we've already switched away from it.
  useEffect(() => {
    let active = true
    setLoading(true)
    setSyncError(null)
    completionsRef.current = []

    store
      .load()
      .then((loaded) => {
        if (!active) return
        setTodos(loaded)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!active) return
        setTodos([])
        setSyncError(`Couldn't load your todos — ${toError(err).message}`)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [store])

  /**
   * Apply a change to the screen immediately, then persist it.
   *
   * This ordering is the whole point: awaiting a ~200ms round-trip before
   * ticking the checkbox would put that delay between the click and the cat's
   * reaction, and the reaction landing late is the difference between the app
   * feeling alive and feeling broken.
   *
   * Caveat worth knowing: a rollback replaces the entire list, so an edit made
   * while a failing write was in flight is discarded along with it. Acceptable
   * for a list this size; it would not be for a collaborative document.
   */
  const commit = useCallback(
    (previous: Todo[], optimistic: Todo[], write: () => Promise<void>) => {
      setTodos(optimistic)
      setSyncError(null)

      const attempt = () => {
        write()
          .then(() => setSyncError(null))
          .catch((err: unknown) => {
            const decision = onSyncFailure({
              error: toError(err),
              previous,
              optimistic,
              retry: attempt,
            })
            setTodos(decision.todos)
            setSyncError(decision.message)
          })
      }

      attempt()
    },
    [],
  )

  const addTodo = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      const todo: Todo = {
        id: crypto.randomUUID(),
        text: trimmed,
        done: false,
        createdAt: Date.now(),
      }
      commit(todos, [...todos, todo], () => store.add(todo))
    },
    [todos, store, commit],
  )

  const toggleTodo = useCallback(
    (id: string) => {
      const target = todos.find((t) => t.id === id)
      if (!target) return

      const nextDone = !target.done
      const next = todos.map((t) => (t.id === id ? { ...t, done: nextDone } : t))
      commit(todos, next, () => store.setDone(id, nextDone))

      // Only a false -> true transition is a celebration. Unchecking is not an
      // achievement, and the cat should not reward it.
      if (!nextDone) return

      const now = Date.now()
      completionsRef.current = [...completionsRef.current, now].filter(
        (t) => now - t < STREAK_WINDOW,
      )

      const mood = getCatMood({
        completed: { ...target, done: true },
        todos: next,
        recentCompletions: completionsRef.current,
      })

      // getPraise() is stateful, so it must be called out here in the event
      // handler — never inside the updater, which React may run twice.
      const praise = mood === 'idle' ? '' : getPraise(mood)
      setCelebration((prev) => ({ id: prev.id + 1, mood, praise }))
    },
    [todos, store, commit],
  )

  const removeTodo = useCallback(
    (id: string) => {
      commit(
        todos,
        todos.filter((t) => t.id !== id),
        () => store.remove(id),
      )
    },
    [todos, store, commit],
  )

  const clearCompleted = useCallback(() => {
    const doomed = todos.filter((t) => t.done).map((t) => t.id)
    if (doomed.length === 0) return
    commit(
      todos,
      todos.filter((t) => !t.done),
      () => store.removeMany(doomed),
    )
  }, [todos, store, commit])

  /**
   * Bulk-copy todos into the current store — used once, when a guest signs in
   * and accepts the offer to bring their local list with them.
   *
   * Not optimistic, deliberately: the caller clears localStorage afterwards,
   * so it must know the rows actually landed before destroying the original.
   * Fresh ids because these are copies; the originals' ids may already be
   * owned by another account.
   */
  const importTodos = useCallback(
    async (incoming: Todo[]) => {
      const copies = incoming.map((t) => ({ ...t, id: crypto.randomUUID() }))
      await store.addMany(copies)
      setTodos((prev) => [...prev, ...copies])
    },
    [store],
  )

  return {
    todos,
    celebration,
    loading,
    syncError,
    addTodo,
    toggleTodo,
    removeTodo,
    clearCompleted,
    importTodos,
  }
}
