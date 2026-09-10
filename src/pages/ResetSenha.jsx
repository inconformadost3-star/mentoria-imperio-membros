import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../lib/AuthProvider.jsx'
import logoFull from '../assets/logo-imperio-full.png'

// Tela pra onde o link de "esqueci minha senha" (e o convite de compra da
// Lastlink) redireciona. O Supabase, ao clicar nesses links, já cria uma
// sessão temporária sozinho (lendo o token que vem na URL) — só falta
// pedir a senha nova e chamar updateUser.
export default function ResetSenha() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    // Dá um tempinho pro cliente do Supabase processar o token da URL e
    // criar a sessão de recuperação antes de decidir se o link é válido.
    supabase.auth.getSession().then(({ data }) => {
      setReady(true)
      if (!data.session) setError('Esse link é inválido ou já expirou. Peça um novo em "Esqueci minha senha".')
    })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não são iguais.')
      return
    }
    setBusy(true)
    try {
      await updatePassword(password)
      navigate('/comunidade', { replace: true })
    } catch (err) {
      setError(err.message || 'Não consegui trocar a senha. Tente pedir um novo link.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="srd-login-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="srd-login-glow srd-login-glow--1" />
      <div className="srd-login-glow srd-login-glow--2" />
      <div className="srd-login-glow srd-login-glow--3" />

      <div className="srd-card" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, padding: 32 }}>
        <div style={{ marginBottom: 24 }}>
          <img src={logoFull} alt="Mentoria Império — Construa o seu legado" style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>

        <div style={{ fontSize: 19, fontWeight: 700, color: '#f5f1ea', marginBottom: 4 }}>
          Defina sua senha
        </div>
        <div style={{ fontSize: 13.5, color: '#a89f92', marginBottom: 22 }}>
          Escolha a senha que você vai usar pra entrar na área de membros.
        </div>

        {!ready ? (
          <div style={{ fontSize: 13, color: '#8f8577' }}>Verificando link…</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Senha nova"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Confirme a senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={inputStyle}
            />

            {error && <div style={{ fontSize: 13, color: '#dc8290' }}>{error}</div>}

            <button type="submit" disabled={busy} className="srd-btn-gold" style={{ justifyContent: 'center', opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Salvando…' : 'Salvar senha e entrar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

const inputStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  color: '#f5f1ea',
  fontFamily: 'inherit',
  fontSize: 14,
  padding: '11px 12px',
  outline: 'none',
}
