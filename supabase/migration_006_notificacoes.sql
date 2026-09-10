-- Migração: notificações (curtida ou comentário no seu post). Rode no SQL
-- Editor do Supabase. Pode rodar mais de uma vez sem erro.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('like', 'comment')),
  post_id uuid not null references public.posts (id) on delete cascade,
  category text not null,
  preview text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications: read own" on public.notifications;
create policy "notifications: read own" on public.notifications
  for select using (recipient_id = auth.uid());

-- Cada pessoa só pode criar notificação em nome dela mesma (como "ator"),
-- e nunca pra si mesma (curtir/comentar o próprio post não notifica).
drop policy if exists "notifications: insert as self" on public.notifications;
create policy "notifications: insert as self" on public.notifications
  for insert with check (actor_id = auth.uid() and recipient_id <> auth.uid());

drop policy if exists "notifications: mark own as read" on public.notifications;
create policy "notifications: mark own as read" on public.notifications
  for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
