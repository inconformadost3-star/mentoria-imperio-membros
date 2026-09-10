import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/AuthProvider.jsx'
import logoWordmark from '../assets/logo-imperio-wordmark.png'
import {
  IconFerramenta,
  IconComunidade,
  IconAulas,
  IconSuporte,
  IconAjustes,
  IconExternal,
  IconAdmin,
} from './icons.jsx'

// URL real do Sistema de Renda Digital (a ferramenta de geração de oferta).
// É um sistema separado — o item de menu abaixo só leva pra lá, não existe
// uma tela interna própria pra isso.
const SISTEMA_RENDA_URL = import.meta.env.VITE_FERRAMENTA_URL || '#'

const NAV_MEMBROS = [
  { to: '/comunidade', label: 'Comunidade', Icon: IconComunidade },
  { to: '/aulas', label: 'Aulas', Icon: IconAulas },
  { external: true, label: 'Sistema de Renda Digital', Icon: IconFerramenta },
  { to: '/suporte', label: 'Suporte 24/7', Icon: IconSuporte },
]

const NAV_CONTA = [{ to: '/ajustes', label: 'Ajustes', Icon: IconAjustes }]

const rowBaseStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 14px',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 500,
  color: '#c9c0b3',
  transition: 'background 0.15s ease, color 0.15s ease',
}

function NavRow({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...rowBaseStyle,
        fontWeight: isActive ? 700 : 500,
        color: isActive ? '#e8bd6e' : '#c9c0b3',
        background: isActive ? 'rgba(232,189,110,0.12)' : 'transparent',
      })}
    >
      {({ isActive }) => (
        <>
          <Icon color={isActive ? '#e8bd6e' : '#8f8577'} />
          {label}
        </>
      )}
    </NavLink>
  )
}

// Item de menu que só existe pra levar pro sistema real (fora do app),
// aberto em nova aba — não tem estado de "ativo" porque não é uma rota
// interna.
function NavRowExternal({ label, Icon }) {
  return (
    <a
      href={SISTEMA_RENDA_URL}
      target={SISTEMA_RENDA_URL === '#' ? undefined : '_blank'}
      rel="noreferrer"
      style={{
        ...rowBaseStyle,
        alignItems: 'flex-start',
        fontSize: 13,
        background: 'transparent',
        textDecoration: 'none',
      }}
    >
      <span style={{ marginTop: 1, flexShrink: 0 }}>
        <Icon color="#8f8577" />
      </span>
      <span style={{ flex: 1, lineHeight: 1.3 }}>{label}</span>
      <span style={{ marginTop: 2, flexShrink: 0 }}>
        <IconExternal color="#8f8577" />
      </span>
    </a>
  )
}

export default function Sidebar({ userName: userNameProp = 'Bia' }) {
  const { configured, profile, user, isAdmin, signOut } = useAuth()
  const userName = configured ? profile?.name || user?.email || 'Aluno' : userNameProp
  const initial = userName.trim().charAt(0).toUpperCase() || '?'

  const navConta = isAdmin
    ? [...NAV_CONTA, { to: '/admin', label: 'Painel admin', Icon: IconAdmin }]
    : NAV_CONTA

  return (
    <aside
      style={{
        width: 260,
        minWidth: 260,
        height: '100%',
        background: '#17130e',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          padding: '0 8px',
          marginBottom: 28,
        }}
      >
        <img
          src={logoWordmark}
          alt="Mentoria Império"
          style={{ width: '100%', maxWidth: 210, height: 'auto', display: 'block' }}
        />
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {NAV_MEMBROS.map((item) =>
          item.external ? (
            <NavRowExternal key={item.label} {...item} />
          ) : (
            <NavRow key={item.to} {...item} />
          )
        )}
      </nav>

      <div
        style={{
          height: 1,
          background: 'rgba(255,255,255,0.07)',
          margin: '14px 6px',
        }}
      />

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {navConta.map((item) => (
          <NavRow key={item.to} {...item} />
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 8px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingTop: 16,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: profile?.avatar_url
              ? `center / cover no-repeat url(${profile.avatar_url})`
              : 'linear-gradient(135deg,#f3d386,#c8862c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 14,
            color: '#1a150f',
            flexShrink: 0,
          }}
        >
          {!profile?.avatar_url && initial}
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#f5f1ea', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {userName}
        </div>
        {configured && (
          <button
            onClick={signOut}
            title="Sair"
            style={{
              background: 'none',
              border: 'none',
              color: '#8f8577',
              fontSize: 12,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            Sair
          </button>
        )}
      </div>
    </aside>
  )
}
