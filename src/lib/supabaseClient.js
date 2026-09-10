// Cliente Supabase — preenche login, progresso de aulas e o feed da
// comunidade com dados reais assim que você criar um projeto em
// https://supabase.com e configurar as variáveis de ambiente abaixo.
//
// Enquanto VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não existirem, as
// telas continuam funcionando com os dados de exemplo em src/data/mockData.js
// — não é obrigatório configurar isso para rodar o projeto localmente.
//
// Veja o schema sugerido em supabase/schema.sql.

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null

if (!isSupabaseConfigured && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.info(
    '[Império] Supabase não configurado — usando dados de exemplo (src/data/mockData.js). ' +
      'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env para conectar dados reais.'
  )
}
