-- Migration 009: notificações push (as de verdade, que aparecem na tela do
-- celular mesmo com o site fechado — funciona no app instalado via "Adicionar
-- à tela de início"). Guarda a "inscrição" de push de cada aparelho; quem
-- dispara o envio de verdade é a função de servidor api/send-push.js.
-- Seguro rodar quantas vezes quiser, não apaga nada.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions: own rows" on public.push_subscriptions;
create policy "push_subscriptions: own rows" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
