// Suporte 24/7 — responde as perguntas do aluno usando a API da OpenAI.
// A chave da OpenAI fica só aqui no servidor (nunca no front-end).
//
// Necessário nas variáveis de ambiente da Vercel (além de SUPABASE_URL e
// SUPABASE_SECRET_KEY, que você já configurou antes):
//   OPENAI_API_KEY  -> a chave da sua conta na OpenAI (platform.openai.com)
// E no front-end (variável já existente, só precisa preencher o valor):
//   VITE_CHAT_API_URL=/api/chat

import { createClient } from '@supabase/supabase-js'

// Ajuste esse texto à vontade pra mudar o "jeito de falar" do assistente ou
// o que ele sabe/deve responder — não precisa mexer em mais nada do código
// pra isso.
const SYSTEM_PROMPT = `Você é o assistente de Suporte 24/7 da Mentoria Império, uma mentoria de
growth e vendas para quem cria ofertas digitais e vende ao vivo (TikTok Shop
e afins). Responda em português do Brasil, de forma acolhedora, direta e
objetiva. Ajude com dúvidas sobre as aulas da plataforma, como navegar pela
Área de Membros, e sobre o Sistema de Renda Digital (a ferramenta de geração
de oferta). Se a pergunta for sobre algo bem específico do negócio do aluno
que você não tem como saber (valores, prazos de reembolso, questões de
pagamento), oriente a pessoa a procurar o suporte humano da mentoria em vez
de inventar uma resposta.`

const MODEL = 'gpt-5.6-luna'
const MAX_HISTORY_MESSAGES = 12
const MAX_OUTPUT_TOKENS = 500

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }

  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    res.status(401).json({ error: 'missing token' })
    return
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  if (!supabaseUrl || !secretKey) {
    res.status(500).json({ error: 'server not configured (faltam SUPABASE_URL/SUPABASE_SECRET_KEY)' })
    return
  }
  if (!openaiKey) {
    res.status(500).json({ error: 'server not configured (falta OPENAI_API_KEY)' })
    return
  }

  // Só deixa qualquer aluno logado usar (não precisa ser admin) — mas
  // precisa estar logado, pra ninguém de fora ficar gastando seu crédito da
  // OpenAI sem controle.
  const admin = createClient(supabaseUrl, secretKey)
  const { data: userData, error: userError } = await admin.auth.getUser(token)
  if (userError || !userData?.user) {
    res.status(401).json({ error: 'invalid token' })
    return
  }

  const { messages } = req.body || {}
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages é obrigatório' })
    return
  }

  // Só manda as últimas N mensagens pra IA — evita que uma conversa muito
  // longa fique cada vez mais cara (e mais lenta) sem necessidade.
  const recent = messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content ?? ''),
  }))

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...recent],
        max_tokens: MAX_OUTPUT_TOKENS,
      }),
    })

    if (!openaiRes.ok) {
      const errBody = await openaiRes.text()
      // eslint-disable-next-line no-console
      console.error('[Império] Erro da OpenAI:', openaiRes.status, errBody)
      res.status(502).json({ error: `A IA não respondeu agora (status ${openaiRes.status}). Tente de novo em instantes.` })
      return
    }

    const data = await openaiRes.json()
    const reply = data.choices?.[0]?.message?.content?.trim()
    if (!reply) {
      res.status(502).json({ error: 'A IA respondeu vazio. Tente de novo.' })
      return
    }

    res.status(200).json({ reply })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Império] Erro chamando a OpenAI:', err.message)
    res.status(500).json({ error: 'Não consegui falar com a IA agora. Tente de novo em instantes.' })
  }
}
