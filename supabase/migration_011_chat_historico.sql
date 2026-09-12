-- Histórico de conversas do Suporte 24/7: agrupa as mensagens em
-- "conversas" separadas (uma por clique em "Nova conversa"), pra dar pra
-- listar e reabrir conversas antigas, igual ChatGPT.
alter table public.chat_messages
  add column if not exists conversation_id uuid not null default gen_random_uuid();

create index if not exists chat_messages_user_conv_idx
  on public.chat_messages (user_id, conversation_id, created_at);
