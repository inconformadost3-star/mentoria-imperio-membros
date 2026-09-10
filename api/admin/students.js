// Lista alunos cadastrados (nome + e-mail) pro painel admin. Só funciona
// pra quem está marcado como is_admin=true em public.profiles — a
// verificação acontece aqui no servidor, usando a chave secreta do
// Supabase (a mesma já configurada pra api/lastlink-webhook.js).
//
// Necessário nas variáveis de ambiente da Vercel:
//   SUPABASE_SECRET_KEY  -> a chave "sb_secret_..."
// (SUPABASE_URL já é coberta pelo VITE_SUPABASE_URL que você já configurou)

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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
  if (!supabaseUrl || !secretKey) {
    res.status(500).json({ error: 'server not configured (faltam SUPABASE_URL/SUPABASE_SECRET_KEY)' })
    return
  }

  const admin = createClient(supabaseUrl, secretKey)

  const { data: userData, error: userError } = await admin.auth.getUser(token)
  if (userError || !userData?.user) {
    // "invalid token" quase sempre é um destes dois motivos:
    // 1) a sessão do navegador expirou/ficou velha (sair e entrar de novo resolve)
    // 2) SUPABASE_URL/SUPABASE_SECRET_KEY na Vercel apontam pra um projeto
    //    Supabase DIFERENTE do que VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY usam
    //    no site (comum depois de recriar o projeto no Supabase) — um token
    //    emitido pelo projeto certo nunca valida contra o projeto errado.
    res.status(401).json({
      error:
        'invalid token' +
        (userError?.message ? ` (${userError.message})` : '') +
        ' — tente sair e entrar de novo; se continuar, confira se SUPABASE_URL na Vercel é do MESMO projeto Supabase que VITE_SUPABASE_URL',
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

  const { data: usersPage, error: listError } = await admin.auth.admin.listUsers({ perPage: 200 })
  if (listError) {
    res.status(500).json({ error: listError.message })
    return
  }

  const { data: profiles } = await admin.from('profiles').select('id, name, created_at')
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))

  const students = usersPage.users
    .map((u) => ({
      id: u.id,
      email: u.email,
      name: profileById.get(u.id)?.name || u.user_metadata?.name || null,
      createdAt: profileById.get(u.id)?.created_at || u.created_at,
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  res.status(200).json({ students })
}
