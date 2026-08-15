import type { PraiseMood } from '../types'

/**
 * ─────────────────────────────────────────────────────────────────────
 * YOUR CALL #1 — the cat's voice.
 *
 * These lines are the actual product. The mechanics below are done; the
 * personality is yours. Pick a lane and stay in it — a consistent voice is
 * what makes this feel authored rather than generated:
 *
 *   warm      "I'm feline proud of you."
 *   smug      "Adequate. I suppose I shall purr."
 *   unhinged  "YOU DID THE THING. I AM KNOCKING A GLASS OFF A TABLE."
 *
 * `happy` fires on any completion, so you'll read these a lot — keep them
 * short and varied. `ecstatic` fires rarely (see getCatMood), so it can be
 * bigger and more over-the-top.
 *
 * Add as many as you like; the shuffle bag scales to any length.
 * ─────────────────────────────────────────────────────────────────────
 */
const PRAISE: Record<PraiseMood, string[]> = {
  happy: [
    'Purrfect work! 🐾',
    "You're paw-some.",
    'Meow-velous job.',
    "I'm feline proud of you.",
    'That one deserves a treat. 🐟',
    'Nice. Very nice.',
    'Look at you go!',
    'Consider yourself head-bonked.',
    // TODO(you): add more here — this is where the charm lives
  ],
  ecstatic: [
    'THE LIST IS CLEAR! 🐾✨',
    'Every single one. I am purring uncontrollably.',
    'You absolute legend. Nap time earned.',
    'Nothing left! I shall now sit in a box to celebrate.',
    // TODO(you): add more here
  ],
}

/** Fisher–Yates. Returns a new array; does not touch the input. */
function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * A shuffle bag: draws every item once before any item repeats.
 *
 * Plain `Math.random()` picking *feels* broken here — with 8 phrases there's a
 * better-than-even chance of a repeat within your first four clicks, and users
 * read that as a bug rather than as chance. Drawing without replacement fixes
 * it. When the bag refills we also make sure the first draw of the new bag
 * isn't the same phrase that ended the old one.
 */
function createShuffleBag(items: string[]): () => string {
  let bag: string[] = []
  let last: string | undefined

  return () => {
    if (bag.length === 0) {
      bag = shuffle(items)
      // pop() draws from the end, so guard against a seam repeat
      if (bag.length > 1 && bag[bag.length - 1] === last) {
        ;[bag[bag.length - 1], bag[0]] = [bag[0], bag[bag.length - 1]]
      }
    }
    last = bag.pop()
    return last ?? ''
  }
}

const bags: Record<PraiseMood, () => string> = {
  happy: createShuffleBag(PRAISE.happy),
  ecstatic: createShuffleBag(PRAISE.ecstatic),
}

/**
 * Pick something for the cat to say.
 *
 * NOTE: this is deliberately impure (the bag carries state between calls), so
 * only ever call it from an event handler — never inside a React state updater
 * or during render, both of which can run twice.
 *
 * Swapping this for a Claude-generated compliment later is a one-function
 * change: make it `async`, call your `/api/praise` route, and the UI already
 * awaits it.
 */
export function getPraise(mood: PraiseMood): string {
  return bags[mood]()
}
