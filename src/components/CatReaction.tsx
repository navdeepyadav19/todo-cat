import { useEffect, useState, type CSSProperties } from 'react'
import { Cat } from './Cat'
import type { CatMood, Celebration } from '../types'

/**
 * How long the cat stays excited. Long enough to actually read the praise —
 * the animations themselves are shorter and finish well before this.
 */
const CELEBRATION_MS = 2000

const PARTICLES = ['🐾', '✨', '🐾', '💛', '🐾', '✨']

type CatReactionProps = {
  celebration: Celebration
}

/**
 * Owns the celebration lifecycle: react to a new completion, hold the excited
 * state briefly, then settle back to idle.
 *
 * The `key={celebration.id}` on the stage is the load-bearing detail. A CSS
 * animation only runs when an element *enters* the animated state — re-applying
 * a class that's already there does nothing. Completing a task, unchecking it,
 * and completing it again would otherwise animate exactly once. Changing the
 * key throws away the DOM subtree and builds a new one, so every completion
 * gets a genuinely fresh animation.
 */
export function CatReaction({ celebration }: CatReactionProps) {
  const [mood, setMood] = useState<CatMood>('idle')

  useEffect(() => {
    // id 0 is the initial "nothing has happened yet" sentinel.
    if (celebration.id === 0) return

    setMood(celebration.mood)
    const timer = setTimeout(() => setMood('idle'), CELEBRATION_MS)
    return () => clearTimeout(timer)
  }, [celebration])

  const celebrating = mood !== 'idle'

  return (
    <div className="reaction">
      <div className="reaction__stage" key={celebration.id}>
        {mood === 'ecstatic' &&
          PARTICLES.map((glyph, i) => (
            <span
              className="reaction__particle"
              key={i}
              style={{ '--i': i } as CSSProperties}
              aria-hidden="true"
            >
              {glyph}
            </span>
          ))}
        <Cat mood={mood} />
      </div>

      {/*
        aria-live so the praise is announced to screen readers when it appears.
        The node stays mounted and empty between celebrations — live regions
        only announce changes to content that was already in the document.
      */}
      <p
        className={`reaction__praise ${celebrating ? 'is-visible' : ''}`}
        aria-live="polite"
      >
        <span key={celebration.id}>{celebrating ? celebration.praise : ''}</span>
      </p>
    </div>
  )
}
