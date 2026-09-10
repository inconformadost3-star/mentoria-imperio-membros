-- Garante que o bucket "community-media" (fotos/vídeos/áudios da Comunidade)
-- e as permissões dele existem no Supabase. Seguro rodar quantas vezes
-- quiser — não duplica nem apaga nada que já exista.
--
-- Rode isso se o upload de foto/vídeo/áudio na Comunidade estiver dando
-- erro "não consegui enviar o arquivo anexado".

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
