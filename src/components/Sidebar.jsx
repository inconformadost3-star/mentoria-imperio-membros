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
  justifyContent: 'center',
  gap: 10,
  padding: '9px 14px',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 500,
  color: '#c9c0b3',
  transition: 'background 0.15s ease, color 0.15s ease',
}

function IconBox({ Icon, isActive }) {
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: 10,
        flexShrink: 0,
        background: isActive ? 'rgba(232,189,110,0.18)' : 'transparent',
      }}
    >
      <Icon color={isActive ? '#e8bd6e' : '#8f8577'} />
    </span>
  )
}

function NavRow({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...rowBaseStyle,
        fontWeight: isActive ? 700 : 500,
        color: isActive ? '#e8bd6e' : '#c9c0b3',
        background: isActive ? 'rgba(232,189,110,0.1)' : 'transparent',
      })}
    >
      {({ isActive }) => (
        <>
          <IconBox Icon={Icon} isActive={isActive} />
          <span className="srd-nav-label">{label}</span>
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
      style={{ ...rowBaseStyle, background: 'transparent', textDecoration: 'none' }}
    >
      <IconBox Icon={Icon} isActive={false} />
      <span className="srd-nav-label" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
        {label}
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
    <aside className="srd-sidebar-desktop">
      <div className="srd-sidebar-inner">
        <div className="srd-sidebar-logo-row">
          <img src="/icons/icon-192.png" alt="" className="srd-sidebar-logomark" />
          <img src={logoWordmark} alt="Mentoria Império" className="srd-sidebar-logowordmark srd-nav-label" />
        </div>

        <nav className="srd-sidebar-nav">
          {NAV_MEMBROS.map((item) =>
            item.external ? (
              <NavRowExternal key={item.label} {...item} />
            ) : (
              <NavRow key={item.to} {...item} />
            )
          )}
        </nav>

        <div className="srd-sidebar-divider" />

        <nav className="srd-sidebar-nav">
          {navConta.map((item) => (
            <NavRow key={item.to} {...item} />
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        <div className="srd-sidebar-footer">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: profile?.avatar_url
                ? `center / cover no-repeat url(${profile.avatar_url})`
                : 'linear-gradient(135deg,#f3d386,#c8862c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13,
              color: '#1a150f',
              flexShrink: 0,
            }}
          >
            {!profile?.avatar_url && initial}
          </div>
          <div
            className="srd-nav-label"
            style={{ fontSize: 13.5, fontWeight: 600, color: '#f5f1ea', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {userName}
          </div>
          {configured && (
            <button
              onClick={signOut}
              title="Sair"
              className="srd-nav-label"
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
