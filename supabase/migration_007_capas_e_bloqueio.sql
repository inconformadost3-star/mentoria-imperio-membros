-- Migration 007: capa personalizada de aulas/módulos + bloqueio por dias
-- ("gotejamento" de conteúdo — a aula/módulo só libera N dias depois que o
-- aluno se cadastrou). Seguro rodar quantas vezes quiser, não apaga nada.
--
-- Como funciona o bloqueio: unlock_after_days é contado a partir de
-- profiles.created_at (a data em que o aluno se cadastrou). Se
-- unlock_after_days for nulo/0, libera na hora. Se a AULA não tiver valor
-- preenchido, ela herda o valor do MÓDULO dela. Preencher na aula sempre
-- tem prioridade sobre o módulo.

alter table public.modules add column if not exists cover_url text;
alter table public.modules add column if not exists unlock_after_days integer;

alter table public.lessons add column if not exists cover_url text;
alter table public.lessons add column if not exists unlock_after_days integer;

-- Bucket para as capas (imagens) das aulas/módulos — upload só pelo Painel
-- admin. Leitura pública (a capa aparece pra qualquer aluno logado).
insert into storage.buckets (id, name, public)
values ('lesson-covers', 'lesson-covers', true)
on conflict (id) do nothing;

drop policy if exists "lesson-covers: public read" on storage.objects;
create policy "lesson-covers: public read" on storage.objects
  for select using (bucket_id = 'lesson-covers');

drop policy if exists "lesson-covers: admin insert" on storage.objects;
create policy "lesson-covers: admin insert" on storage.objects
  for insert with check (bucket_id = 'lesson-covers' and public.is_admin());

drop policy if exists "lesson-covers: admin update" on storage.objects;
create policy "lesson-covers: admin update" on storage.objects
  for update using (bucket_id = 'lesson-covers' and public.is_admin());

drop policy if exists "lesson-covers: admin delete" on storage.objects;
create policy "lesson-covers: admin delete" on storage.objects
  for delete using (bucket_id = 'lesson-covers' and public.is_admin());
