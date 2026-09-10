import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'
import { useAuth } from '../lib/AuthProvider.jsx'
import { IconBell } from './icons.jsx'

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h}h`
  const d = Math.floor(h / 24)
  return `há ${d} dia${d > 1 ? 's' : ''}`
}

function describe(n) {
  const who = n.actor_name || 'Alguém'
  if (n.type === 'like') return `${who} curtiu seu post`
  if (n.type === 'comment') return `${who} comentou no seu post`
  return `${who} interagiu no seu post`
}

// Sino de notificações: avisa quando alguém curte ou comenta um post seu.
// Aparece tanto no computador (flutuando no canto) quanto no celular (dentro
// da barra de cima) — quem decide onde ele fica é a classe CSS do wrapper.
export default function NotificationBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)
  const wrapRef = useRef(null)
  const navigate = useNavigate()

  const unreadCount = items.filter((n) => !n.read_at).length

  useEffect(() => {
    if (!isSupabaseConfigured || !user) return
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function load() {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, post_id, category, preview, created_at, read_at, profiles!actor_id(name)')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
    if (error) return
    setItems(
      (data ?? []).map((row) => ({
        id: row.id,
        type: row.type,
        category: row.category,
        preview: row.preview,
        created_at: row.created_at,
        read_at: row.read_at,
        actor_name: row.profiles?.name || null,
      }))
    )
    setLoaded(true)
  }

  async function handleToggle() {
    const next = !open
    setOpen(next)
    if (next && unreadCount > 0) {
      const unreadIds = items.filter((n) => !n.read_at).map((n) => n.id)
      setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })))
      await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', unreadIds)
    }
  }

  function handleClickItem() {
    setOpen(false)
    navigate('/comunidade')
  }

  if (!isSupabaseConfigured || !user) return null

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        onClick={handleToggle}
        title="Notificações"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(255,255,255,0.06)',
          color: '#c9c0b3',
        }}
      >
        <IconBell size={17} color={unreadCount > 0 ? '#e8bd6e' : '#c9c0b3'} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              borderRadius: 999,
              background: '#dc4f63',
              color: '#fff',
              fontSize: 9.5,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="srd-card"
          style={{
            position: 'absolute',
            top: 42,
            right: 0,
            width: 300,
            maxHeight: 360,
            overflowY: 'auto',
            padding: 8,
            zIndex: 60,
          }}
        >
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#a89f92', padding: '6px 8px' }}>Notificações</div>
          {!loaded && <div style={{ fontSize: 12.5, color: '#8f8577', padding: '8px' }}>Carregando…</div>}
          {loaded && items.length === 0 && (
            <div style={{ fontSize: 12.5, color: '#8f8577', padding: '8px' }}>
              Nenhuma notificação ainda. Quando alguém curtir ou comentar num post seu, aparece aqui.
            </div>
          )}
          {items.map((n) => (
            <button
              key={n.id}
              onClick={handleClickItem}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                border: 'none',
                background: n.read_at ? 'transparent' : 'rgba(232,189,110,0.08)',
                borderRadius: 10,
                padding: '8px 8px',
                marginBottom: 2,
              }}
            >
              <div style={{ fontSize: 13, color: '#f5f1ea', fontWeight: n.read_at ? 500 : 700 }}>{describe(n)}</div>
              {n.preview && (
                <div style={{ fontSize: 12, color: '#a89f92', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  “{n.preview}”
                </div>
              )}
              <div style={{ fontSize: 11, color: '#8f8577', marginTop: 2 }}>{timeAgo(n.created_at)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
