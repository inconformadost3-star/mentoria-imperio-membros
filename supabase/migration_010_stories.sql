-- Stories estilo Instagram: foto/vídeo que fica visível por 24h e some
-- sozinho. Reaproveita o bucket "community-media" que já existe (mesma
-- política de pasta por usuário), então não precisa criar bucket novo.

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  media_url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index if not exists stories_author_idx on public.stories (author_id, created_at desc);
create index if not exists stories_expires_idx on public.stories (expires_at);

-- Quem já viu qual story (pra pintar a bolinha de "visto"/"não visto",
-- igual Instagram).
create table if not exists public.story_views (
  story_id uuid not null references public.stories (id) on delete cascade,
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

alter table public.stories enable row level security;
alter table public.story_views enable row level security;

-- Só aparece pra todo mundo enquanto não passou das 24h. Depois disso o
-- select para de trazer a linha (some da tela), mesmo sem apagar do banco.
create policy "stories: read not expired" on public.stories
  for select using (auth.role() = 'authenticated' and expires_at > now());
create policy "stories: insert own" on public.stories
  for insert with check (auth.uid() = author_id);
create policy "stories: delete own" on public.stories
  for delete using (auth.uid() = author_id);
create policy "stories: admin delete" on public.stories
  for delete using (public.is_admin());

create policy "story_views: read all authenticated" on public.story_views
  for select using (auth.role() = 'authenticated');
create policy "story_views: insert own" on public.story_views
  for insert with check (auth.uid() = viewer_id);
create policy "story_views: update own" on public.story_views
  for update using (auth.uid() = viewer_id) with check (auth.uid() = viewer_id);
