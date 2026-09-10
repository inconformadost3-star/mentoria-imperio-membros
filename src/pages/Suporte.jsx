import { useEffect, useRef, useState } from 'react'
import { sendChatMessage } from '../lib/chatClient.js'
import { IconSend } from '../components/icons.jsx'

const WELCOME = {
  role: 'assistant',
  content:
    'Oi! Eu sou o assistente da Mentoria Império. Pode me perguntar sobre as aulas, a Ferramenta de geração de oferta ou qualquer dúvida sobre sua jornada por aqui. Estou disponível 24/7 😊',
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
          background: isUser ? 'linear-gradient(135deg,#f3d386,#c8862c)' : 'var(--srd-bg-card)',
          color: isUser ? '#1a150f' : '#f5f1ea',
          border: isUser ? 'none' : '1px solid var(--srd-border)',
        }}
      >
        {content}
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

export default function Suporte() {
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return

    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setSending(true)

    try {
      const reply = await sendChatMessage(next)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
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
