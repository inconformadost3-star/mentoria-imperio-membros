-- Migração: módulos do curso (Módulo 0, Módulo 1...), com aulas agrupadas
-- dentro de cada um. Rode no SQL Editor do Supabase. Pode rodar mais de
-- uma vez sem erro.

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  module_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.modules enable row level security;

drop policy if exists "modules: read all authenticated" on public.modules;
create policy "modules: read all authenticated" on public.modules
  for select using (auth.role() = 'authenticated');

drop policy if exists "modules: admin insert" on public.modules;
create policy "modules: admin insert" on public.modules
  for insert with check (public.is_admin());

drop policy if exists "modules: admin update" on public.modules;
create policy "modules: admin update" on public.modules
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "modules: admin delete" on public.modules;
create policy "modules: admin delete" on public.modules
  for delete using (public.is_admin());

-- Cada aula passa a poder pertencer a um módulo (module_order de lessons
-- vira a ordem da aula DENTRO do módulo).
alter table public.lessons add column if not exists module_id uuid references public.modules (id) on delete set null;

-- Permite cadastrar a aula antes de gravar o vídeo (fica marcada como "em
-- breve" pro aluno até você preencher o youtube_id depois).
alter table public.lessons alter column youtube_id drop not null;
