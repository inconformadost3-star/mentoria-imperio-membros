-- Migração: novo formato das abas da Comunidade (Avisos, Sacadas, Em Ação,
-- Conquistas, Conexões), Avisos só pode ser publicado por admin, e posts
-- agora podem ter foto/vídeo/áudio anexado. Rode no SQL Editor do Supabase.
-- Pode rodar mais de uma vez sem erro.

-- Migra os posts e os "vistos" que já existiam nas categorias antigas pro
-- nome novo da aba mais parecida.
update public.posts set category = 'sacadas' where category = 'dicas';
update public.posts set category = 'conquistas' where category = 'resultados';
update public.posts set category = 'em_acao' where category = 'sugestoes';
update public.posts set category = 'conexoes' where category = 'networking';

update public.community_reads set category = 'sacadas' where category = 'dicas';
update public.community_reads set category = 'conquistas' where category = 'resultados';
update public.community_reads set category = 'em_acao' where category = 'sugestoes';
update public.community_reads set category = 'conexoes' where category = 'networking';

alter table public.posts drop constraint if exists posts_category_check;
alter table public.posts add constraint posts_category_check
  check (category in ('avisos', 'sacadas', 'em_acao', 'conquistas', 'conexoes'));

-- Foto/vídeo/áudio no post
alter table public.posts add column if not exists media_url text;
alter table public.posts add column if not exists media_type text;
alter table public.posts drop constraint if exists posts_media_type_check;
alter table public.posts add constraint posts_media_type_check
  check (media_type is null or media_type in ('image', 'video', 'audio'));

-- Só admin publica em "avisos"; nas outras abas qualquer aluno publica na
-- própria conta (curtir/comentar continua liberado pra todo mundo, em
-- qualquer aba — isso não muda).
drop policy if exists "posts: insert own" on public.posts;
drop policy if exists "posts: insert own (avisos admin only)" on public.posts;
create policy "posts: insert own (avisos admin only)" on public.posts
  for insert with check (
    auth.uid() = author_id
    and (category <> 'avisos' or public.is_admin())
  );

-- Bucket de mídia dos posts da comunidade (separado do bucket de avatars).
insert into storage.buckets (id, name, public)
values ('community-media', 'community-media', true)
on conflict (id) do nothing;

drop policy if exists "community-media: public read" on storage.objects;
create policy "community-media: public read" on storage.objects
  for select using (bucket_id = 'community-media');

drop policy if exists "community-media: user insert own" on storage.objects;
create policy "community-media: user insert own" on storage.objects
  for insert with check (bucket_id = 'community-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "community-media: user delete own" on storage.objects;
create policy "community-media: user delete own" on storage.objects
  for delete using (bucket_id = 'community-media' and (storage.foldername(name))[1] = auth.uid()::text);
