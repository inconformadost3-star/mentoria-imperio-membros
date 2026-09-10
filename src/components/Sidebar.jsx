import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthProvider.jsx'
import logoWordmark from '../assets/logo-imperio-wordmark.png'
import logoFull from '../assets/logo-imperio-full.png'
import {
  IconFerramenta,
  IconComunidade,
  IconAulas,
  IconSuporte,
  IconAjustes,
  IconExternal,
  IconAdmin,
  IconMore,
  IconLogout,
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

// Os 3 primeiros itens do menu principal ficam na barra de baixo no
// celular (o resto entra dentro do "Mais").
const MOBILE_TAB_ITEMS = NAV_MEMBROS.filter((item) => !item.external)

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
      className="srd-sidebar-desktop"
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

// Barra de cima só no celular: logo pequena + avatar (some no desktop via
// CSS — ver .srd-mobile-topbar em index.css).
export function MobileTopBar() {
  const { profile } = useAuth()

  return (
    <header
      className="srd-mobile-topbar"
      style={{
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: '#17130e',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}
    >
      <img src={logoFull} alt="Mentoria Império" style={{ height: 26, width: 'auto', display: 'block' }} />
      <NavLink to="/ajustes" style={{ display: 'flex' }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: profile?.avatar_url
              ? `center / cover no-repeat url(${profile.avatar_url})`
              : 'linear-gradient(135deg,#f3d386,#c8862c)',
          }}
        />
      </NavLink>
    </header>
  )
}

const mobileTabStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  flex: 1,
  padding: '6px 0 4px',
  background: 'none',
  border: 'none',
  textDecoration: 'none',
}

// Só o conteúdo visual do item da barra de baixo (ícone + rótulo) — quem
// chama decide se isso vira um <NavLink> (rota interna) ou um <button>
// (abre o "Mais"), pra nunca ficar um link dentro de outro link.
function MobileTabContent({ label, Icon, isActive }) {
  return (
    <>
      <div
        style={{
          width: 40,
          height: 30,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isActive ? 'rgba(232,189,110,0.16)' : 'transparent',
        }}
      >
        <Icon size={19} color={isActive ? '#e8bd6e' : '#8f8577'} />
      </div>
      <span style={{ fontSize: 10.5, fontWeight: isActive ? 700 : 500, color: isActive ? '#e8bd6e' : '#8f8577' }}>
        {label}
      </span>
    </>
  )
}

// Barra de baixo só no celular: os itens principais + um "Mais" com o
// resto (Sistema de Renda Digital, Ajustes, Painel admin, Sair).
export function MobileBottomNav() {
  const { isAdmin, signOut } = useAuth()
  const [moreOpen, setMoreOpen] = useState(false)
  const navigate = useNavigate()

  function goTo(path) {
    setMoreOpen(false)
    navigate(path)
  }

  return (
    <>
      {moreOpen && (
        <div
          onClick={() => setMoreOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 45 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="srd-card"
            style={{
              position: 'fixed',
              left: 12,
              right: 12,
              bottom: 78,
              padding: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              zIndex: 46,
            }}
          >
            <a
              href={SISTEMA_RENDA_URL}
              target={SISTEMA_RENDA_URL === '#' ? undefined : '_blank'}
              rel="noreferrer"
              onClick={() => setMoreOpen(false)}
              style={{ ...rowBaseStyle, textDecoration: 'none' }}
            >
              <IconFerramenta color="#8f8577" />
              Sistema de Renda Digital
              <span style={{ marginLeft: 'auto' }}>
                <IconExternal color="#8f8577" />
              </span>
            </a>
            {isAdmin && (
              <button onClick={() => goTo('/admin')} style={{ ...rowBaseStyle, width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}>
                <IconAdmin color="#8f8577" />
                Painel admin
              </button>
            )}
            <button onClick={() => goTo('/ajustes')} style={{ ...rowBaseStyle, width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}>
              <IconAjustes color="#8f8577" />
              Ajustes
            </button>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 6px' }} />
            <button
              onClick={() => {
                setMoreOpen(false)
                signOut()
              }}
              style={{ ...rowBaseStyle, width: '100%', border: 'none', background: 'transparent', textAlign: 'left', color: '#dc8290' }}
            >
              <IconLogout color="#dc8290" />
              Sair
            </button>
          </div>
        </div>
      )}

      <nav
        className="srd-mobile-bottomnav"
        style={{
          background: '#17130e',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        {MOBILE_TAB_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} style={mobileTabStyle}>
            {({ isActive }) => (
              <MobileTabContent label={item.label.split(' ')[0]} Icon={item.Icon} isActive={isActive} />
            )}
          </NavLink>
        ))}
        <button onClick={() => setMoreOpen((v) => !v)} style={mobileTabStyle}>
          <MobileTabContent label="Mais" Icon={IconMore} isActive={moreOpen} />
        </button>
      </nav>
    </>
  )
}
