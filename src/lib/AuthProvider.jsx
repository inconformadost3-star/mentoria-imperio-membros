import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabaseClient.js'

const AuthContext = createContext(null)

// Garante que exista uma linha em public.profiles para o usuário logado.
// Necessário porque o cadastro (auth.users) é gerenciado pelo Supabase Auth,
// mas os dados de perfil (nome, preferências) vivem numa tabela nossa.
//
// Retorna null tanto se não conseguiu criar quanto se a sessão for "órfã"
// (referencia um usuário que não existe mais em auth.users — ex: foi
// apagado manualmente no painel do Supabase enquanto o navegador ainda
// tinha uma sessão salva). Nesse segundo caso, o chamador deve encerrar
// a sessão local pra parar de tentar de novo em loop.
async function ensureProfile(user) {
  if (!user) return null

  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (existing) return existing

  const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Aluno'

  const { data: created, error } = await supabase
    .from('profiles')
    .insert({ id: user.id, name })
    .select()
    .single()

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[Império] Não consegui criar o perfil do usuário:', error.message)
    if (error.message?.includes('foreign key constraint')) {
      return { orphanSession: true }
    }
    return null
  }

  return created
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const result = await ensureProfile(data.session.user)
        if (result?.orphanSession) {
          await supabase.auth.signOut()
          setSession(null)
          setProfile(null)
        } else {
          setSession(data.session)
          setProfile(result)
        }
      } else {
        setSession(data.session)
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession?.user) {
        const result = await ensureProfile(newSession.user)
        if (result?.orphanSession) {
          await supabase.auth.signOut()
          setSession(null)
          setProfile(null)
        } else {
          setSession(newSession)
          setProfile(result)
        }
      } else {
        setSession(newSession)
        setProfile(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signUp(email, password, name) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) throw error
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  // Manda o e-mail de "esqueci minha senha" (link volta pra /reset-senha,
  // onde a aluna define a senha nova).
  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-senha`,
    })
    if (error) throw error
  }

  // Usado só na tela /reset-senha, depois que a aluna clicou no link do
  // e-mail (nesse ponto o Supabase já criou uma sessão temporária de
  // recuperação, então dá pra trocar a senha direto).
  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  // Recarrega o perfil (nome, foto, preferências) depois de uma edição em
  // Ajustes — evita ter que sair/entrar de novo pra ver a mudança refletida
  // na sidebar e na comunidade.
  async function refreshProfile() {
    if (!session?.user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
    if (data) setProfile(data)
  }

  const value = {
    configured: isSupabaseConfigured,
    session,
    user: session?.user ?? null,
    profile,
    isAdmin: profile?.is_admin === true,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
