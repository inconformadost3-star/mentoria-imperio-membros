-- Migração para o projeto que você já criou no Supabase: adiciona o
-- administrador e as permissões do painel interno (aulas + moderação da
-- comunidade). Rode isto no SQL Editor do Supabase (New query → cole → Run).
-- Pode rodar quantas vezes precisar, não dá erro se já tiver sido aplicada.

alter table public.profiles add column if not exists is_admin boolean not null default false;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

drop policy if exists "lessons: admin insert" on public.lessons;
create policy "lessons: admin insert" on public.lessons
  for insert with check (public.is_admin());

drop policy if exists "lessons: admin update" on public.lessons;
create policy "lessons: admin update" on public.lessons
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "lessons: admin delete" on public.lessons;
create policy "lessons: admin delete" on public.lessons
  for delete using (public.is_admin());

drop policy if exists "posts: admin delete" on public.posts;
create policy "posts: admin delete" on public.posts
  for delete using (public.is_admin());

drop policy if exists "post_comments: admin delete" on public.post_comments;
create policy "post_comments: admin delete" on public.post_comments
  for delete using (public.is_admin());
