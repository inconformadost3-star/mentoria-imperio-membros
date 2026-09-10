// Dispara notificação push de verdade (aparece na tela do celular) pra
// todo mundo inscrito — usado quando você publica um "aviso" na
// Comunidade. Só funciona pra quem está marcado como is_admin=true em
// public.profiles — a verificação acontece aqui no servidor, mesmo jeito
// de api/admin/students.js.
//
// Necessário nas variáveis de ambiente da Vercel (além de SUPABASE_URL e
// SUPABASE_SECRET_KEY, que você já configurou pra api/admin/students.js):
//   VITE_VAPID_PUBLIC_KEY  -> a chave pública VAPID
//   VAPID_PRIVATE_KEY      -> a chave privada VAPID (nunca exponha essa)
//   VAPID_SUBJECT          -> opcional, "mailto:seu@email.com"

import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

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
  const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

  if (!supabaseUrl || !secretKey) {
    res.status(500).json({ error: 'server not configured (faltam SUPABASE_URL/SUPABASE_SECRET_KEY)' })
    return
  }
  if (!vapidPublicKey || !vapidPrivateKey) {
    res.status(500).json({ error: 'server not configured (faltam VITE_VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY)' })
    return
  }

  const admin = createClient(supabaseUrl, secretKey)

  const { data: userData, error: userError } = await admin.auth.getUser(token)
  if (userError || !userData?.user) {
    res.status(401).json({
      error:
        'invalid token' +
        (userError?.message ? ` (${userError.message})` : '') +
        ' — confira se SUPABASE_URL na Vercel é do mesmo projeto Supabase que VITE_SUPABASE_URL',
    })
    return
  }

  const { data: callerProfile, error: profileError } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (profileError || !callerProfile?.is_admin) {
    res.status(403).json({ error: 'forbidden' })
    return
  }

  const { title, body, url } = req.body || {}
  if (!title && !body) {
    res.status(400).json({ error: 'title ou body é obrigatório' })
    return
  }

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:contato@mentoriaimperio.site', vapidPublicKey, vapidPrivateKey)

  const { data: subs, error: subsError } = await admin.from('push_subscriptions').select('*')
  if (subsError) {
    res.status(500).json({ error: subsError.message })
    return
  }

  const payload = JSON.stringify({
    title: title || 'Mentoria Império',
    body: body || '',
    url: url || '/comunidade',
  })

  let sent = 0
  let removed = 0
  const failures = []

  await Promise.all(
    (subs ?? []).map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      }
      try {
        await webpush.sendNotification(pushSubscription, payload)
        sent += 1
      } catch (err) {
        // 404/410 = inscrição não existe mais (usuário desinstalou, trocou de
        // navegador, etc.) — aproveita e já limpa do banco.
        if (err.statusCode === 404 || err.statusCode === 410) {
          removed += 1
          await admin.from('push_subscriptions').delete().eq('id', sub.id)
        } else {
          failures.push(err.message)
        }
      }
    })
  )

  res.status(200).json({ sent, removed, total: (subs ?? []).length, failures })
}
