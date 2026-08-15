-- Todo Cat — database schema
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- It is idempotent: re-running it will not destroy data.
--
-- The security model here is entirely Row Level Security. The key shipped in the
-- browser bundle is the *publishable* key, which is public by design — it grants
-- no access on its own. Postgres itself refuses to return a row whose user_id
-- doesn't match the JWT of the caller. There is no server in between to trust.

create table if not exists public.todos (
  id         uuid primary key,
  user_id    uuid not null references auth.users on delete cascade default auth.uid(),
  text       text not null check (char_length(text) between 1 and 500),
  done       boolean not null default false,
  created_at timestamptz not null default now()
);

-- The app's only query shape: "my todos, oldest first".
create index if not exists todos_user_created_idx on public.todos (user_id, created_at);

alter table public.todos enable row level security;

-- Policies are dropped first so this file can be re-run after edits.
drop policy if exists "own todos: select" on public.todos;
drop policy if exists "own todos: insert" on public.todos;
drop policy if exists "own todos: update" on public.todos;
drop policy if exists "own todos: delete" on public.todos;

create policy "own todos: select" on public.todos
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "own todos: insert" on public.todos
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- UPDATE needs both: `using` gates which existing rows you may touch,
-- `with check` gates what the row is allowed to look like afterwards.
-- Without the second one you could reassign a todo to someone else's user_id.
create policy "own todos: update" on public.todos
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own todos: delete" on public.todos
  for delete to authenticated
  using ((select auth.uid()) = user_id);
