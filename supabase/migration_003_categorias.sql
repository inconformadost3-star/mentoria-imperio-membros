-- Migração: categorias (abas) na Comunidade + contagem de novidades por
-- aluno. Rode isto no SQL Editor do Supabase. Pode rodar mais de uma vez
-- sem erro.

alter table public.posts add column if not exists category text not null default 'avisos';

alter table public.posts drop constraint if exists posts_category_check;
alter table public.posts add constraint posts_category_check
  check (category in ('avisos', 'dicas', 'resultados', 'sugestoes', 'networking'));

-- Guarda, por aluno e por aba, quando foi a última vez que ele viu aquela
-- aba — é o que permite calcular "quantos posts novos" mostrar no
-- contador de cada aba.
create table if not exists public.community_reads (
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null,
  last_seen_at timestamptz not null default now(),
  primary key (user_id, category)
);

alter table public.community_reads enable row level security;

drop policy if exists "community_reads: own row" on public.community_reads;
create policy "community_reads: own row" on public.community_reads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
