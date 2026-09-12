import { useEffect, useMemo, useRef, useState } from 'react'
import { sendChatMessage } from '../lib/chatClient.js'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'
import { useAuth } from '../lib/AuthProvider.jsx'
import { IconSend, IconPlus, IconHistory, IconX } from '../components/icons.jsx'

const WELCOME = {
  role: 'assistant',
  content:
    'Oi! Eu sou o assistente da Mentoria Império. Pode me perguntar sobre as aulas, a Ferramenta de geração de oferta ou qualquer dúvida sobre sua jornada por aqui. Estou disponível 24/7 😊',
}

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

// Deixa o texto da IA (que às vezes vem com **negrito** e quebras de
// linha/listas) legível de verdade, em vez de mostrar os asteriscos soltos
// e tudo grudado numa linha só.
function renderRichText(text) {
  const lines = String(text ?? '').split('\n')
  return lines.map((line, i) => (
    <span key={i}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((chunk, j) =>
        chunk.startsWith('**') && chunk.endsWith('**') ? (
          <strong key={j}>{chunk.slice(2, -2)}</strong>
        ) : (
          <span key={j}>{chunk}</span>
        )
      )}
      {i < lines.length - 1 && <br />}
    </span>
  ))
}

function Bubble({ role, content }) {
  const isUser = role === 'user'
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 14,
      }}
    >
      <div
        style={{
          maxWidth: '72%',
          padding: '11px 15px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          fontSize: 14,
          lineHeight: 1.5,
          wordBreak: 'break-word',
          background: isUser ? 'linear-gradient(135deg,#f3d386,#c8862c)' : 'var(--srd-bg-card)',
          color: isUser ? '#1a150f' : '#f5f1ea',
          border: isUser ? 'none' : '1px solid var(--srd-border)',
        }}
      >
        {renderRichText(content)}
      </div>
    </div>
  )
}

function TypingBubble() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 14 }}>
      <div
        className="srd-card"
        style={{ padding: '13px 16px', display: 'flex', gap: 5 }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#8f8577',
              opacity: 0.6,
              animation: `srd-typing-bounce 1s ${i * 0.15}s infinite`,
            }}
          />
        ))}
        <style>{`
          @keyframes srd-typing-bounce {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-4px); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  )
}

function HistoryPanel({ conversations, activeId, onSelect, onClose }) {
  return (
    <div
      className="srd-card om-scrollbar"
      style={{
        position: 'absolute',
        top: 54,
        right: 0,
        width: 280,
        maxHeight: 360,
        overflowY: 'auto',
        padding: 8,
        zIndex: 20,
        boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px 8px' }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#a89f92' }}>Conversas anteriores</span>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#8f8577' }}>
          <IconX size={16} color="#8f8577" />
        </button>
      </div>
      {conversations.length === 0 && (
        <div style={{ fontSize: 12.5, color: '#8f8577', padding: '8px 6px' }}>
          Nenhuma conversa anterior ainda.
        </div>
      )}
      {conversations.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelect(c.id)}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            background: c.id === activeId ? 'rgba(232,189,110,0.12)' : 'transparent',
            border: 'none',
            borderRadius: 10,
            padding: '9px 10px',
            marginBottom: 2,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: '#f5f1ea',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {c.preview || 'Conversa'}
          </div>
          <div style={{ fontSize: 11, color: '#8f8577', marginTop: 2 }}>{timeAgo(c.updatedAt)}</div>
        </button>
      ))}
    </div>
  )
}

export default function Suporte() {
  const { user } = useAuth()
  const [conversationId, setConversationId] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`
  )
  const [messages, setMessages] = useState([WELCOME])
  const [allRows, setAllRows] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  useEffect(() => {
    if (!isSupabaseConfigured || !user) return
    loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  async function loadHistory() {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, conversation_id, role, content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    // Se a coluna conversation_id ainda não existir (migração não rodada),
    // isso dá erro — nesse caso só ignora e mantém o chat funcionando do
    // jeito simples, sem histórico.
    if (error || !data || data.length === 0) return

    setAllRows(data)
    const lastConvId = data[data.length - 1].conversation_id
    setConversationId(lastConvId)
    setMessages(messagesForConversation(data, lastConvId))
  }

  function messagesForConversation(rows, convId) {
    const msgs = rows.filter((r) => r.conversation_id === convId).map((r) => ({ role: r.role, content: r.content }))
    return msgs.length ? msgs : [WELCOME]
  }

  const conversations = useMemo(() => {
    const byConv = new Map()
    for (const row of allRows) {
      const entry = byConv.get(row.conversation_id) || {
        id: row.conversation_id,
        preview: '',
        updatedAt: row.created_at,
      }
      if (!entry.preview && row.role === 'user') entry.preview = row.content.slice(0, 60)
      entry.updatedAt = row.created_at
      byConv.set(row.conversation_id, entry)
    }
    return Array.from(byConv.values()).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  }, [allRows])

  function logMessage(role, content, convId) {
    if (!isSupabaseConfigured || !user) return
    const row = { user_id: user.id, role, content, conversation_id: convId }
    supabase
      .from('chat_messages')
      .insert(row)
      .then(({ error }) => {
        if (!error) {
          setAllRows((prev) => [...prev, { ...row, id: `local-${Date.now()}-${role}`, created_at: new Date().toISOString() }])
        }
      })
  }

  function startNewConversation() {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`
    setConversationId(newId)
    setMessages([WELCOME])
    setHistoryOpen(false)
  }

  function openConversation(convId) {
    setConversationId(convId)
    setMessages(messagesForConversation(allRows, convId))
    setHistoryOpen(false)
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return

    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setSending(true)
    logMessage('user', text, conversationId)

    try {
      const reply = await sendChatMessage(next)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      logMessage('assistant', reply, conversationId)
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Ops, tive um problema para responder agora. Tente novamente em instantes.',
        },
      ])
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      style={{
        maxWidth: 760,
        margin: '0 auto',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#f3d386,#c8862c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: '#1a150f',
            }}
          >
            IA
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f5f1ea' }}>Suporte 24/7</div>
            <div style={{ fontSize: 12.5, color: '#7fb69e', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7fb69e', display: 'inline-block' }} />
              Assistente sempre disponível
            </div>
          </div>
        </div>

        {isSupabaseConfigured && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={startNewConversation}
              title="Nova conversa"
              className="srd-btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', fontSize: 12.5 }}
            >
              <IconPlus size={13} />
              Nova conversa
            </button>
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              title="Ver conversas anteriores"
              className="srd-btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', fontSize: 12.5 }}
            >
              <IconHistory size={14} />
              Histórico
            </button>
            {historyOpen && (
              <HistoryPanel
                conversations={conversations}
                activeId={conversationId}
                onSelect={openConversation}
                onClose={() => setHistoryOpen(false)}
              />
            )}
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="om-scrollbar"
        style={{ flex: 1, overflowY: 'auto', padding: '4px 4px 8px' }}
      >
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}
        {sending && <TypingBubble />}
      </div>

      <div
        className="srd-card"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 10,
          padding: 10,
          marginTop: 12,
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua pergunta…"
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#f5f1ea',
            fontFamily: 'inherit',
            fontSize: 14,
            padding: '8px 6px',
          }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="srd-btn-gold"
          style={{ opacity: sending || !input.trim() ? 0.5 : 1 }}
        >
          <IconSend color="#1a150f" />
          Enviar
        </button>
      </div>
    </div>
  )
}
