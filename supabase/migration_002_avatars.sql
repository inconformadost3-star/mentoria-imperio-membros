-- Migração: cria o espaço de armazenamento (bucket) pras fotos de perfil
-- dos alunos, e as permissões de quem pode subir/trocar sua própria foto.
-- Rode isto no SQL Editor do Supabase. Pode rodar mais de uma vez sem erro.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Qualquer pessoa pode VER as fotos (é assim que a foto aparece pros outros
-- alunos na Comunidade), mas só o próprio dono pode enviar/trocar/apagar a
-- sua (a foto fica guardada dentro de uma "pasta" com o id do usuário).
drop policy if exists "avatars: public read" on storage.objects;
create policy "avatars: public read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars: user insert own" on storage.objects;
create policy "avatars: user insert own" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars: user update own" on storage.objects;
create policy "avatars: user update own" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars: user delete own" on storage.objects;
create policy "avatars: user delete own" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
