-- Migration 008: materiais da aula (links de sites e/ou anexos/arquivos).
-- Seguro rodar quantas vezes quiser, não apaga nada.

create table if not exists public.lesson_resources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  title text not null,
  url text not null,
  resource_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.lesson_resources enable row level security;

drop policy if exists "lesson_resources: read all authenticated" on public.lesson_resources;
create policy "lesson_resources: read all authenticated" on public.lesson_resources
  for select using (auth.role() = 'authenticated');

drop policy if exists "lesson_resources: admin insert" on public.lesson_resources;
create policy "lesson_resources: admin insert" on public.lesson_resources
  for insert with check (public.is_admin());

drop policy if exists "lesson_resources: admin update" on public.lesson_resources;
create policy "lesson_resources: admin update" on public.lesson_resources
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "lesson_resources: admin delete" on public.lesson_resources;
create policy "lesson_resources: admin delete" on public.lesson_resources
  for delete using (public.is_admin());

-- Bucket para anexos (arquivos) das aulas — upload só pelo Painel admin,
-- leitura pública (o link do material funciona pra qualquer aluno).
insert into storage.buckets (id, name, public)
values ('lesson-resources', 'lesson-resources', true)
on conflict (id) do nothing;

drop policy if exists "lesson-resources: public read" on storage.objects;
create policy "lesson-resources: public read" on storage.objects
  for select using (bucket_id = 'lesson-resources');

drop policy if exists "lesson-resources: admin insert" on storage.objects;
create policy "lesson-resources: admin insert" on storage.objects
  for insert with check (bucket_id = 'lesson-resources' and public.is_admin());

drop policy if exists "lesson-resources: admin update" on storage.objects;
create policy "lesson-resources: admin update" on storage.objects
  for update using (bucket_id = 'lesson-resources' and public.is_admin());

drop policy if exists "lesson-resources: admin delete" on storage.objects;
create policy "lesson-resources: admin delete" on storage.objects
  for delete using (bucket_id = 'lesson-resources' and public.is_admin());
