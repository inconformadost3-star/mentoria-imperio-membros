import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthProvider.jsx'
import logoFull from '../assets/logo-imperio-full.png'

export default function Login() {
  const { signIn, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin') // 'signin' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      if (mode === 'forgot') {
        await resetPassword(email)
        setInfo('Se esse e-mail tiver uma conta, enviamos um link pra você definir uma senha nova.')
      } else {
        await signIn(email, password)
        navigate('/comunidade', { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Não foi possível concluir. Tente novamente.')
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
          {mode === 'forgot' ? 'Redefinir senha' : 'Entrar na área de membros'}
        </div>
        <div style={{ fontSize: 13.5, color: '#a89f92', marginBottom: 22 }}>
          {mode === 'forgot'
            ? 'Digite o e-mail usado na sua compra — vamos te mandar um link pra criar uma senha nova.'
            : 'Use o e-mail e senha que você recebeu após a compra da Mentoria Império.'}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          {mode === 'signin' && (
            <input
              type="password"
              required
              minLength={6}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          )}

          {error && <div style={{ fontSize: 13, color: '#dc8290' }}>{error}</div>}
          {info && <div style={{ fontSize: 13, color: '#7fb69e' }}>{info}</div>}

          <button type="submit" disabled={busy} className="srd-btn-gold" style={{ justifyContent: 'center', opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Aguarde…' : mode === 'forgot' ? 'Enviar link' : 'Entrar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: '#8f8577' }}>
          {mode === 'forgot' ? (
            <button
              onClick={() => {
                setMode('signin')
                setError('')
                setInfo('')
              }}
              style={{ background: 'none', border: 'none', color: '#e8bd6e', fontWeight: 700, padding: 0 }}
            >
              Voltar para o login
            </button>
          ) : (
            <button
              onClick={() => {
                setMode('forgot')
                setError('')
                setInfo('')
              }}
              style={{ background: 'none', border: 'none', color: '#e8bd6e', fontWeight: 700, padding: 0 }}
            >
              Esqueci minha senha
            </button>
          )}
        </div>
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
