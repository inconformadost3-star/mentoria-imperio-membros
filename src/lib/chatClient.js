// Cliente do chat de Suporte 24/7.
//
// Por segurança, a chave da API de IA NUNCA deve ficar no front-end.
// Este cliente chama um endpoint de back-end (serverless function, API
// própria, etc.) que você controla e que guarda a chave do lado do servidor.
//
// Configure VITE_CHAT_API_URL no seu .env apontando para esse endpoint.
// Enquanto ele não existir, o chat funciona com respostas simuladas — bom
// para validar a interface antes de plugar a IA de verdade.
//
// Contrato esperado do endpoint (você implementa como quiser):
//   POST { messages: [{ role: 'user' | 'assistant', content: string }, ...] }
//   -> { reply: string }

import { supabase, isSupabaseConfigured } from './supabaseClient.js'

const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL

const FALLBACK_REPLIES = [
  'Consegui registrar sua mensagem! (Esse é um retorno simulado — conecte VITE_CHAT_API_URL para respostas reais de IA.)',
  'Boa pergunta! Assim que o back-end de IA estiver conectado, vou te responder com base no conteúdo da Mentoria Império.',
  'Anotado. Enquanto o suporte com IA não está conectado, recomendo dar uma olhada na aula "Comece aqui" em Aulas.',
]

function fallbackReply() {
  const i = Math.floor(Math.random() * FALLBACK_REPLIES.length)
  return FALLBACK_REPLIES[i]
}

export async function sendChatMessage(messages) {
  if (!CHAT_API_URL) {
    await new Promise((r) => setTimeout(r, 500))
    return fallbackReply()
  }

  let token = null
  if (isSupabaseConfigured) {
    const { data: sessionData } = await supabase.auth.getSession()
    token = sessionData?.session?.access_token || null
  }

  const res = await fetch(CHAT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages }),
  })

  if (!res.ok) {
    throw new Error(`Chat API respondeu ${res.status}`)
  }

  const data = await res.json()
  return data.reply ?? fallbackReply()
}
