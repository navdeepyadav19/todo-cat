# Todo Cat 🐱

A todo list with a cat that appreciates you. Check something off and the cat perks
its ears, squints happily, wags its tail, and says something nice.

```bash
npm run dev     # http://localhost:5173
npm run build   # typecheck + production build
```

Vite + React + TypeScript, deployed as a static site on Vercel. Signed-out visitors
get the original experience — todos in `localStorage` under `todo-cat.todos`. Sign in
and the same todos live in Postgres instead, scoped to your account by Supabase
row-level security.

## Setup

Copy `.env.example` to `.env.local` and fill in your Supabase project URL and
publishable key, then run `supabase/schema.sql` once in the Supabase SQL editor.
Without those variables the app still runs — it just stays in local-only mode.

## Where things are

| File | Does |
| --- | --- |
| `src/hooks/useTodos.ts` | State, optimistic writes, and the completion event |
| `src/hooks/useAuth.ts` | Session state, sign in / up / out |
| `src/lib/storage.ts` | The `TodoStore` seam: localStorage vs Supabase |
| `src/lib/supabase.ts` | Client, or `null` when unconfigured |
| `src/lib/praise.ts` | The phrases and the shuffle-bag picker |
| `src/components/Cat.tsx` | The cat, as inline SVG |
| `src/components/CatReaction.tsx` | Celebration lifecycle and the praise bubble |
| `src/styles.css` | Tokens, keyframes, dark mode, reduced motion |
| `supabase/schema.sql` | Table + RLS policies |

## Three spots marked for you

All three are `YOUR CALL` in the source:

1. **`src/lib/praise.ts`** — the phrases themselves. The mechanics are done; the
   voice is yours. Pick a register (warm / smug / unhinged) and stay in it.
2. **`src/hooks/useTodos.ts` → `getCatMood()`** — when the cat escalates from
   `happy` to `ecstatic`. Defaults to "you cleared the last task"; alternatives
   (streaks, milestones, long-neglected tasks) are listed in the comment above it.
3. **`src/hooks/useTodos.ts` → `onSyncFailure()`** — what the user sees when a write
   is rejected. Roll the change back honestly, keep it and retry, or stay quiet.

## Why writes are optimistic

The cat has to react on the click, not on the server's reply. So every mutation
updates React state first and sends the row afterwards; `onSyncFailure` decides what
to do if that send fails. Making the handlers `await` the network would put a
few hundred milliseconds between the click and the celebration, which is precisely
the thing this app exists to get right.

## The one thing worth knowing before you edit

Completing a task is an **event**, not a state value. If the celebration were derived
from `todos.filter(done).length`, completing a task, unchecking it, and completing it
again would return to the same count and the animation would silently stop firing —
and even with correct state, a CSS animation doesn't restart just because its class is
still applied.

So `useTodos` emits a `Celebration` with an incrementing `id`, and `CatReaction` uses
`key={celebration.id}` to remount the animated subtree. That remount is what guarantees
a fresh animation every single time. If you refactor that away, the cat will appear to
work and then quietly stop celebrating.

## Swapping in AI-written praise later

`getPraise(mood)` in `src/lib/praise.ts` is the only seam. Make it `async`, have it
call a route that asks Claude for a compliment referencing the finished task, and
return the string — the UI already awaits it and nothing else changes.
