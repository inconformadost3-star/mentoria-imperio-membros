// Recebe o webhook da Lastlink quando uma compra é aprovada e cria
// automaticamente a conta do aluno no Supabase (convite por e-mail).
//
// Isso roda como "serverless function" na Vercel (pasta /api é detectada
// automaticamente, não precisa configurar nada extra). Usa a chave secreta
// do Supabase, então só pode rodar no servidor — NUNCA importe esse arquivo
// no front-end nem exponha SUPABASE_SECRET_KEY com prefixo VITE_.
//
// Configuração necessária nas variáveis de ambiente da Vercel:
//   SUPABASE_SECRET_KEY     -> a chave "sb_secret_..." (Project Settings > API Keys)
//   LASTLINK_WEBHOOK_SECRET -> uma senha qualquer que você inventa, usada
//                              pra confirmar que a chamada veio da Lastlink
//   LASTLINK_EVENTS         -> (opcional) lista separada por vírgula dos
//                              nomes de evento que devem liberar acesso.
//                              Padrão: "PurchaseApproved,PaymentConfirmed,AccessGranted"
//
// A URL do webhook a colocar no painel da Lastlink é:
//   https://SEU-SITE.vercel.app/api/lastlink-webhook?secret=SEU_LASTLINK_WEBHOOK_SECRET
//
// Veja o passo a passo completo no README, seção "Integração automática com a Lastlink".

import { createClient } from '@supabase/supabase-js'

const DEFAULT_EVENTS = ['PurchaseApproved', 'PaymentConfirmed', 'AccessGranted']

function getAllowedEvents() {
  const raw = process.env.LASTLINK_EVENTS
  if (!raw) return DEFAULT_EVENTS
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

// O payload exato da Lastlink pode variar por tipo de evento; procuramos o
// e-mail/nome do comprador em alguns caminhos plausíveis pra sermos tolerantes.
function extractBuyer(body) {
  const data = body?.Data || body?.data || {}
  const buyer = data.Buyer || data.buyer || data.Customer || data.customer || {}
  const email = buyer.Email || buyer.email
  const name = buyer.Nome || buyer.Name || buyer.name
  return { email, name }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }

  const secret = process.env.LASTLINK_WEBHOOK_SECRET
  if (!secret || req.query.secret !== secret) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!supabaseUrl || !secretKey) {
    console.error('[lastlink-webhook] faltando SUPABASE_URL ou SUPABASE_SECRET_KEY nas variáveis de ambiente')
    res.status(500).json({ error: 'server not configured' })
    return
  }

  const body = req.body || {}
  const eventName = body.Event || body.event
  console.info('[lastlink-webhook] evento recebido:', eventName)

  const allowedEvents = getAllowedEvents()
  if (!allowedEvents.includes(eventName)) {
    // Não é um evento de liberação de acesso (ex: carrinho abandonado,
    // reembolso). Confirmamos recebimento sem criar conta.
    res.status(200).json({ ok: true, ignored: true, event: eventName })
    return
  }

  const { email, name } = extractBuyer(body)
  if (!email) {
    console.error('[lastlink-webhook] payload sem e-mail do comprador:', JSON.stringify(body))
    res.status(400).json({ error: 'missing buyer email' })
    return
  }

  const supabaseAdmin = createClient(supabaseUrl, secretKey)

  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: name ? { full_name: name } : undefined,
  })

  // "already been registered" não é um erro real pra nós — o aluno já tem
  // conta (ex: renovação, ou tentativa duplicada do mesmo evento).
  if (error && !String(error.message).toLowerCase().includes('already')) {
    console.error('[lastlink-webhook] erro ao convidar usuário:', error.message)
    res.status(500).json({ error: error.message })
    return
  }

  res.status(200).json({ ok: true, email })
}
