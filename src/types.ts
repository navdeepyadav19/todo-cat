export type Todo = {
  id: string
  text: string
  done: boolean
  createdAt: number
}

/**
 * How excited the cat currently is.
 * `idle` is the resting state; the other two are only ever held briefly,
 * during a celebration, before the cat settles back to `idle`.
 */
export type CatMood = 'idle' | 'happy' | 'ecstatic'

/** Moods that come with something for the cat to say. */
export type PraiseMood = Exclude<CatMood, 'idle'>

/**
 * A single "you finished a task" moment.
 *
 * `id` increments on every completion and is used as a React `key` so the
 * celebration subtree remounts — that's what makes the CSS animation replay
 * even when you complete the same task twice in a row.
 */
export type Celebration = {
  id: number
  mood: CatMood
  praise: string
}

/** Everything `getCatMood` gets to look at when deciding how excited to be. */
export type CompletionContext = {
  /** The task that was just checked off. */
  completed: Todo
  /** The full list, *after* the toggle was applied. */
  todos: Todo[]
  /** Timestamps (ms) of recent completions, oldest first, including this one. */
  recentCompletions: number[]
}
