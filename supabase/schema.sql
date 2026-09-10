-- Schema sugerido para a Área de Membros da Mentoria Império.
-- Rode isto no SQL editor do seu projeto Supabase (supabase.com) depois de
-- criar o projeto. Ajuste nomes/campos conforme sua necessidade — isto é
-- um ponto de partida, não um contrato fechado.

-- Perfis de aluno (espelha auth.users, criado pelo Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  avatar_url text,
  email_notifications boolean not null default true,
  community_notifications boolean not null default true,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Posts da Comunidade (category = a aba onde o post aparece)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  category text not null default 'avisos'
    check (category in ('avisos', 'sacadas', 'em_acao', 'conquistas', 'conexoes')),
  media_url text,
  media_type text check (media_type is null or media_type in ('image', 'video', 'audio')),
  created_at timestamptz not null default now()
);

-- Guarda, por aluno e por aba da Comunidade, quando foi a última vez que
-- ele viu aquela aba — usado pro contador de "novidades" em cada aba.
create table if not exists public.community_reads (
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null,
  last_seen_at timestamptz not null default now(),
  primary key (user_id, category)
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- Aulas (catálogo) — o vídeo em si fica hospedado no YouTube, aqui só
-- guardamos metadados e o ID do vídeo.
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  youtube_id text not null,
  duration_seconds integer,
  module_order integer not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

-- Progresso do aluno por aula
create table if not exists public.lesson_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  primary key (user_id, lesson_id)
);

-- Histórico de conversas do Suporte 24/7 (opcional, útil para
-- auditoria/qualidade das respostas da IA)
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Projetos da Ferramenta (referência local aos projetos que vivem no
-- sistema real de geração de oferta — se a Ferramenta já tiver seu próprio
-- banco, esta tabela pode ser apenas um cache/espelho)
create table if not exists public.tool_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  status text not null default 'em_andamento',
  step integer,
  total_steps integer,
  updated_at timestamptz not null default now()
);

-- Row Level Security — cada aluno só enxerga/edita o que é dele; conteúdo
-- de comunidade e aulas é de leitura pública para quem está autenticado.
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.chat_messages enable row level security;
alter table public.tool_projects enable row level security;
alter table public.community_reads enable row level security;

-- profiles: qualquer aluno logado pode LER o nome de qualquer outro aluno
-- (precisa disso pra mostrar o autor de cada post da comunidade), mas só
-- pode criar/editar a própria linha.
create policy "profiles: read all authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "posts: read all authenticated" on public.posts
  for select using (auth.role() = 'authenticated');
create policy "posts: delete own" on public.posts
  for delete using (auth.uid() = author_id);

-- post_likes / post_comments: contagens e nomes de quem curtiu/comentou
-- precisam ser legíveis por qualquer aluno logado; só o próprio autor pode
-- inserir/remover sua curtida ou comentário.
create policy "post_likes: read all authenticated" on public.post_likes
  for select using (auth.role() = 'authenticated');
create policy "post_likes: insert own" on public.post_likes
  for insert with check (auth.uid() = user_id);
create policy "post_likes: delete own" on public.post_likes
  for delete using (auth.uid() = user_id);

create policy "post_comments: read all authenticated" on public.post_comments
  for select using (auth.role() = 'authenticated');
create policy "post_comments: insert own" on public.post_comments
  for insert with check (auth.uid() = author_id);
create policy "post_comments: delete own" on public.post_comments
  for delete using (auth.uid() = author_id);

-- lessons: catálogo é só leitura pelo app (quem cadastra aula é você, via
-- SQL editor ou um painel admin futuro — não existe insert liberado pro
-- client aqui de propósito).
create policy "lessons: read all authenticated" on public.lessons
  for select using (auth.role() = 'authenticated');

-- Verifica se o usuário logado é administrador (marcado manualmente em
-- profiles.is_admin). security definer faz essa função ler a tabela
-- profiles com privilégio próprio, ignorando RLS — evita recursão nas
-- políticas abaixo e é o padrão recomendado pelo Supabase para esse caso.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Painel de administrador: cadastrar/editar aulas e moderar a comunidade
-- direto pelo site, sem precisar do Table Editor do Supabase.
create policy "lessons: admin insert" on public.lessons
  for insert with check (public.is_admin());
create policy "lessons: admin update" on public.lessons
  for update using (public.is_admin()) with check (public.is_admin());
create policy "lessons: admin delete" on public.lessons
  for delete using (public.is_admin());

-- Só quem é admin pode publicar na aba "avisos" — nas demais abas qualquer
-- aluno autenticado pode publicar na própria conta.
create policy "posts: insert own (avisos admin only)" on public.posts
  for insert with check (
    auth.uid() = author_id
    and (category <> 'avisos' or public.is_admin())
  );
create policy "posts: admin delete" on public.posts
  for delete using (public.is_admin());
create policy "post_comments: admin delete" on public.post_comments
  for delete using (public.is_admin());

create policy "lesson_progress: own row" on public.lesson_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "chat_messages: own row" on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tool_projects: own row" on public.tool_projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "community_reads: own row" on public.community_reads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Fotos de perfil: espaço de armazenamento (bucket) público pra leitura,
-- mas cada aluno só pode subir/trocar/apagar a própria foto (guardada numa
-- "pasta" com o id dele dentro do bucket).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars: public read" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "avatars: user insert own" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: user update own" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: user delete own" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Fotos, vídeos e áudios postados na Comunidade (bucket separado do de
-- avatars). Leitura pública, mas cada aluno só sobe/apaga dentro da própria
-- "pasta" (nomeada com o próprio id).
insert into storage.buckets (id, name, public)
values ('community-media', 'community-media', true)
on conflict (id) do nothing;

create policy "community-media: public read" on storage.objects
  for select using (bucket_id = 'community-media');
create policy "community-media: user insert own" on storage.objects
  for insert with check (bucket_id = 'community-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "community-media: user delete own" on storage.objects
  for delete using (bucket_id = 'community-media' and (storage.foldername(name))[1] = auth.uid()::text);
