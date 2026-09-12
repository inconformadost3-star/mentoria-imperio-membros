import { useEffect, useRef, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'
import { useAuth } from '../lib/AuthProvider.jsx'
import { mockPosts } from '../data/mockData.js'
import { IconHeart, IconComment } from '../components/icons.jsx'
import StoriesBar from '../components/Stories.jsx'

const CATEGORIES = [
  {
    key: 'avisos',
    emoji: '📢',
    label: 'Avisos',
    description:
      'Tudo o que você precisa saber sobre a comunidade, novidades, atualizações e comunicados importantes.',
    adminOnly: true,
  },
  {
    key: 'sacadas',
    emoji: '💡',
    label: 'Sacadas',
    description:
      'Compartilhe aqui uma ideia, estratégia, ferramenta ou aprendizado que pode ajudar outras pessoas da comunidade.',
  },
  {
    key: 'em_acao',
    emoji: '⚡',
    label: 'Em Ação',
    description:
      'Mostre o que você está colocando em prática. Vale teste, primeira tentativa, nova oferta, conteúdo publicado e cada passo dado.',
  },
  {
    key: 'conquistas',
    emoji: '🏆',
    label: 'Conquistas',
    description:
      'Compartilhe suas vitórias, grandes ou pequenas. Primeira venda, primeiro cliente, resultado, meta alcançada ou qualquer evolução que merece ser comemorada.',
  },
  {
    key: 'conexoes',
    emoji: '🤝',
    label: 'Conexões',
    description:
      'Conheça outras pessoas da comunidade, troque experiências, encontre parceiros e crie novas oportunidades.',
  },
]

const MAX_MEDIA_BYTES = 50 * 1024 * 1024 // 50MB

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

function mediaTypeFor(file) {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  return null
}

// Normaliza a linha vinda do Supabase (com os embeds de contagem) pro
// mesmo formato usado pelos dados de exemplo, o que mantém <Post> simples.
function mapRow(row, likedIds) {
  return {
    id: row.id,
    authorId: row.author_id,
    author: row.profiles?.name || 'Aluno',
    initial: (row.profiles?.name || 'A').charAt(0).toUpperCase(),
    avatarUrl: row.profiles?.avatar_url || null,
    time: timeAgo(row.created_at),
    text: row.content,
    category: row.category,
    mediaUrl: row.media_url || null,
    mediaType: row.media_type || null,
    likes: row.post_likes?.[0]?.count ?? 0,
    comments: row.post_comments?.[0]?.count ?? 0,
    liked: likedIds.has(row.id),
  }
}

function Avatar({ initial, avatarUrl, size = 40 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: avatarUrl ? `center / cover no-repeat url(${avatarUrl})` : 'rgba(232,189,110,0.14)',
        color: '#e8bd6e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size * 0.4,
        flexShrink: 0,
      }}
    >
      {!avatarUrl && initial}
    </div>
  )
}

function Badge({ count }) {
  if (!count) return null
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 18,
        height: 18,
        padding: '0 5px',
        borderRadius: 999,
        background: '#dc4f63',
        color: '#fff',
        fontSize: 10.5,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}

function CategoryTabs({ active, onSelect, counts }) {
  return (
    <div
      className="srd-card"
      style={{
        display: 'inline-flex',
        gap: 4,
        padding: 5,
        marginBottom: 14,
        flexWrap: 'wrap',
        justifyContent: 'center',
        borderRadius: 14,
      }}
    >
      {CATEGORIES.map((cat) => {
        const isActive = cat.key === active
        return (
          <button
            key={cat.key}
            onClick={() => onSelect(cat.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              background: isActive ? 'rgba(232,189,110,0.14)' : 'transparent',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 13.5,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#e8bd6e' : '#a89f92',
              whiteSpace: 'nowrap',
            }}
          >
            {cat.label}
            <Badge count={counts[cat.key]} />
          </button>
        )
      })}
    </div>
  )
}

function MediaPreview({ file, previewUrl, onRemove }) {
  const type = mediaTypeFor(file)
  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 8,
        maxWidth: '100%',
      }}
    >
      {type === 'image' && (
        <img src={previewUrl} alt="" style={{ maxHeight: 120, borderRadius: 8, display: 'block' }} />
      )}
      {type === 'video' && (
        <video src={previewUrl} controls style={{ maxHeight: 120, borderRadius: 8, display: 'block' }} />
      )}
      {type === 'audio' && <audio src={previewUrl} controls style={{ maxWidth: 220 }} />}
      {!type && <span style={{ fontSize: 12.5, color: '#a89f92', padding: '0 8px' }}>{file.name}</span>}
      <button
        type="button"
        onClick={onRemove}
        title="Remover anexo"
        style={{
          background: 'rgba(0,0,0,0.4)',
          border: 'none',
          borderRadius: '50%',
          width: 22,
          height: 22,
          color: '#fff',
          fontSize: 13,
          lineHeight: 1,
          position: 'absolute',
          top: -8,
          right: -8,
        }}
      >
        ×
      </button>
    </div>
  )
}

// Tipos de áudio aceitos pra gravação (na ordem de preferência) — nem
// todo navegador suporta os mesmos formatos com o MediaRecorder.
const AUDIO_MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']

function pickAudioMimeType() {
  if (typeof window === 'undefined' || !window.MediaRecorder) return ''
  return AUDIO_MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) || ''
}

function formatSeconds(total) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function Composer({ onPost, authorInitial, authorAvatarUrl, category, onCategoryChange, categories }) {
  const [value, setValue] = useState('')
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState(null)
  const [busy, setBusy] = useState(false)
  const [mediaError, setMediaError] = useState('')
  const [recording, setRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const recordTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      clearInterval(recordTimerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  function handleFilePick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const type = mediaTypeFor(file)
    if (type === 'audio') {
      setMediaError('Pra áudio, use o botão de gravar (🎙️) aqui do lado.')
      return
    }
    if (!type) {
      setMediaError('Esse tipo de arquivo não é suportado. Envie foto ou vídeo.')
      return
    }
    if (file.size > MAX_MEDIA_BYTES) {
      setMediaError('Esse arquivo passa de 50MB. Escolha um arquivo menor.')
      return
    }
    setMediaError('')
    setMediaFile(file)
    setMediaPreviewUrl(URL.createObjectURL(file))
  }

  function clearMedia() {
    setMediaFile(null)
    setMediaPreviewUrl(null)
    setMediaError('')
  }

  async function startRecording() {
    if (mediaFile || busy || recording) return
    setMediaError('')
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setMediaError('Seu navegador não suporta gravação de áudio.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = pickAudioMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      audioChunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const finalType = mimeType || 'audio/webm'
        const blob = new Blob(audioChunksRef.current, { type: finalType })
        const ext = finalType.includes('mp4') ? 'm4a' : 'webm'
        const file = new File([blob], `audio-${Date.now()}.${ext}`, { type: finalType })
        setMediaFile(file)
        setMediaPreviewUrl(URL.createObjectURL(file))
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
      setRecordSeconds(0)
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000)
    } catch {
      setMediaError('Não consegui acessar o microfone. Verifique a permissão do navegador.')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setRecording(false)
    clearInterval(recordTimerRef.current)
    recordTimerRef.current = null
  }

  async function submit() {
    const text = value.trim()
    if ((!text && !mediaFile) || busy || recording) return
    setBusy(true)
    try {
      await onPost(text, mediaFile)
      setValue('')
      clearMedia()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="srd-card" style={{ padding: 18, marginBottom: 20, display: 'flex', gap: 14 }}>
      <Avatar initial={authorInitial} avatarUrl={authorAvatarUrl} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Compartilhe uma conquista, uma dúvida ou uma dica com a comunidade…"
          rows={2}
          style={{
            resize: 'none',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            color: '#f5f1ea',
            fontFamily: 'inherit',
            fontSize: 14,
            padding: '10px 12px',
            outline: 'none',
          }}
        />

        {mediaFile && (
          <MediaPreview file={mediaFile} previewUrl={mediaPreviewUrl} onRemove={clearMedia} />
        )}
        {mediaError && <div style={{ fontSize: 12.5, color: '#dc8290' }}>{mediaError}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                color: '#a89f92',
                fontFamily: 'inherit',
                fontSize: 12.5,
                padding: '7px 10px',
                outline: 'none',
              }}
            >
              {categories.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  Postar em: {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFilePick}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Anexar foto ou vídeo"
              className="srd-btn-outline"
              disabled={recording || !!mediaFile}
              style={{ padding: '7px 12px', fontSize: 12.5, opacity: recording || mediaFile ? 0.5 : 1 }}
            >
              📎 Foto/vídeo
            </button>
            {!recording ? (
              <button
                type="button"
                onClick={startRecording}
                title="Gravar áudio"
                className="srd-btn-outline"
                disabled={!!mediaFile || busy}
                style={{ padding: '7px 12px', fontSize: 12.5, opacity: mediaFile ? 0.5 : 1 }}
              >
                🎙️ Gravar áudio
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                title="Parar gravação e revisar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '7px 12px',
                  fontSize: 12.5,
                  fontWeight: 700,
                  borderRadius: 999,
                  border: '1px solid rgba(220,79,99,0.4)',
                  background: 'rgba(220,79,99,0.14)',
                  color: '#dc8290',
                }}
              >
                <span className="srd-recording-dot" />
                Parar • {formatSeconds(recordSeconds)}
              </button>
            )}
          </div>
          <button
            className="srd-btn-gold"
            onClick={submit}
            disabled={busy || recording}
            style={{ opacity: busy || recording ? 0.6 : 1 }}
          >
            {busy ? 'Publicando…' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CommentRow({ comment }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '7px 0' }}>
      <Avatar initial={comment.initial} avatarUrl={comment.avatarUrl} size={26} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#f5f1ea' }}>{comment.author}</span>
          <span style={{ fontSize: 11, color: '#8f8577' }}>{comment.time}</span>
        </div>
        <p style={{ fontSize: 13, color: '#d8cfc2', margin: '2px 0 0', lineHeight: 1.45 }}>{comment.text}</p>
      </div>
    </div>
  )
}

function CommentsSection({ post }) {
  const { user, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [comments, setComments] = useState([])
  const [value, setValue] = useState('')
  const [sending, setSending] = useState(false)

  async function toggleOpen() {
    const next = !open
    setOpen(next)
    if (next && !loaded && isSupabaseConfigured) {
      setLoading(true)
      const { data, error } = await supabase
        .from('post_comments')
        .select('id, content, created_at, author_id, profiles!author_id(name, avatar_url)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })
      if (!error) {
        setComments(
          (data ?? []).map((row) => ({
            id: row.id,
            author: row.profiles?.name || 'Aluno',
            initial: (row.profiles?.name || 'A').charAt(0).toUpperCase(),
            avatarUrl: row.profiles?.avatar_url || null,
            text: row.content,
            time: timeAgo(row.created_at),
          }))
        )
      }
      setLoaded(true)
      setLoading(false)
    }
  }

  async function submitComment() {
    const text = value.trim()
    if (!text || sending) return
    setSending(true)
    try {
      if (!isSupabaseConfigured) {
        setComments((prev) => [...prev, { id: `local-${Date.now()}`, author: 'Bia', initial: 'B', avatarUrl: null, text, time: 'agora' }])
        setValue('')
        return
      }
      const { data, error } = await supabase
        .from('post_comments')
        .insert({ post_id: post.id, author_id: user.id, content: text })
        .select('id, content, created_at, author_id, profiles!author_id(name, avatar_url)')
        .single()
      if (error) return
      setComments((prev) => [
        ...prev,
        {
          id: data.id,
          author: data.profiles?.name || 'Aluno',
          initial: (data.profiles?.name || 'A').charAt(0).toUpperCase(),
          avatarUrl: data.profiles?.avatar_url || null,
          text: data.content,
          time: 'agora',
        },
      ])
      setValue('')
      if (post.authorId && post.authorId !== user.id) {
        await supabase.from('notifications').insert({
          recipient_id: post.authorId,
          actor_id: user.id,
          type: 'comment',
          post_id: post.id,
          category: post.category,
          preview: text.slice(0, 140),
        })
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <button
        onClick={toggleOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          color: '#8f8577',
          fontSize: 13,
          fontWeight: 600,
          padding: 0,
        }}
      >
        <IconComment />
        {loaded ? comments.length : post.comments}
      </button>

      {open && (
        <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
          {loading && <div style={{ fontSize: 12.5, color: '#8f8577' }}>Carregando comentários…</div>}
          {!loading && comments.length === 0 && (
            <div style={{ fontSize: 12.5, color: '#8f8577' }}>Nenhum comentário ainda. Seja a primeira a comentar!</div>
          )}
          {comments.map((c) => (
            <CommentRow key={c.id} comment={c} />
          ))}

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Avatar initial={(profile?.name || 'B').charAt(0).toUpperCase()} avatarUrl={profile?.avatar_url || null} size={26} />
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitComment()
              }}
              placeholder="Escreva um comentário…"
              style={{
                flex: 1,
                minWidth: 0,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 999,
                color: '#f5f1ea',
                fontFamily: 'inherit',
                fontSize: 13,
                padding: '7px 12px',
                outline: 'none',
              }}
            />
            <button
              onClick={submitComment}
              disabled={sending || !value.trim()}
              className="srd-btn-gold"
              style={{ padding: '7px 14px', fontSize: 12.5, opacity: sending || !value.trim() ? 0.6 : 1 }}
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Post({ post, onToggleLike }) {
  const [busy, setBusy] = useState(false)

  async function handleLike() {
    if (busy) return
    setBusy(true)
    try {
      await onToggleLike(post)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="srd-card" style={{ padding: 18, marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 14 }}>
        <Avatar initial={post.initial} avatarUrl={post.avatarUrl} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: '#f5f1ea' }}>
              {post.author}
            </span>
            <span style={{ fontSize: 12.5, color: '#8f8577' }}>{post.time}</span>
          </div>
          {post.text && (
            <p
              style={{
                fontSize: 14,
                color: '#d8cfc2',
                lineHeight: 1.55,
                margin: '8px 0 12px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {post.text}
            </p>
          )}

          {post.mediaUrl && post.mediaType === 'image' && (
            <img
              src={post.mediaUrl}
              alt=""
              style={{ maxWidth: '100%', borderRadius: 12, marginBottom: 12, display: 'block' }}
            />
          )}
          {post.mediaUrl && post.mediaType === 'video' && (
            <video
              src={post.mediaUrl}
              controls
              style={{ maxWidth: '100%', borderRadius: 12, marginBottom: 12, display: 'block' }}
            />
          )}
          {post.mediaUrl && post.mediaType === 'audio' && (
            <audio src={post.mediaUrl} controls style={{ width: '100%', marginBottom: 12, display: 'block' }} />
          )}

          <div style={{ display: 'flex', gap: 18 }}>
            <button
              onClick={handleLike}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                color: post.liked ? '#e8bd6e' : '#8f8577',
                fontSize: 13,
                fontWeight: 600,
                padding: 0,
              }}
            >
              <IconHeart color={post.liked ? '#e8bd6e' : '#8f8577'} />
              {post.likes}
            </button>
          </div>

          <div style={{ marginTop: 10 }}>
            <CommentsSection post={post} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Comunidade() {
  const { user, profile, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('avisos')
  const [postCategory, setPostCategory] = useState('avisos')
  const [posts, setPosts] = useState(isSupabaseConfigured ? [] : mockPosts)
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState('')

  const activeCategoryMeta = CATEGORIES.find((c) => c.key === activeTab) || CATEGORIES[0]
  const postableCategories = isAdmin ? CATEGORIES : CATEGORIES.filter((c) => !c.adminOnly)
  const canPostInActiveTab = !activeCategoryMeta.adminOnly || isAdmin

  useEffect(() => {
    if (!isSupabaseConfigured) return
    loadPosts(activeTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, activeTab])

  useEffect(() => {
    if (!isSupabaseConfigured || !user) return
    loadCounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  async function loadCounts() {
    const { data: reads } = await supabase
      .from('community_reads')
      .select('category, last_seen_at')
      .eq('user_id', user.id)
    const lastSeenByCat = new Map((reads ?? []).map((r) => [r.category, r.last_seen_at]))

    const nextCounts = {}
    await Promise.all(
      CATEGORIES.map(async (cat) => {
        const since = lastSeenByCat.get(cat.key) || '1970-01-01T00:00:00Z'
        const { count } = await supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('category', cat.key)
          .neq('author_id', user.id)
          .gt('created_at', since)
        nextCounts[cat.key] = count || 0
      })
    )
    setCounts(nextCounts)
  }

  async function handleSelectTab(key) {
    setActiveTab(key)
    const meta = CATEGORIES.find((c) => c.key === key)
    if (!meta?.adminOnly || isAdmin) setPostCategory(key)
    setCounts((prev) => ({ ...prev, [key]: 0 }))
    if (isSupabaseConfigured && user) {
      await supabase
        .from('community_reads')
        .upsert({ user_id: user.id, category: key, last_seen_at: new Date().toISOString() }, { onConflict: 'user_id,category' })
    }
  }

  async function loadPosts(category) {
    setLoading(true)
    setError('')
    try {
      const { data: rows, error: postsError } = await supabase
        .from('posts')
        .select(
          'id, content, created_at, author_id, category, media_url, media_type, profiles!author_id(name, avatar_url), post_likes(count), post_comments(count)'
        )
        .eq('category', category)
        .order('created_at', { ascending: false })

      if (postsError) throw postsError

      let likedIds = new Set()
      if (user) {
        const { data: likedRows } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
        likedIds = new Set((likedRows ?? []).map((r) => r.post_id))
      }

      setPosts((rows ?? []).map((row) => mapRow(row, likedIds)))
    } catch (err) {
      setError('Não consegui carregar os posts da comunidade agora. Tente recarregar a página.')
      // eslint-disable-next-line no-console
      console.error('[Império] Erro carregando posts:', err.message)
    } finally {
      setLoading(false)
    }
  }

  async function addPost(text, mediaFile) {
    if (!isSupabaseConfigured) {
      setPosts((prev) => [
        {
          id: `local-${Date.now()}`,
          author: 'Bia',
          initial: 'B',
          time: 'agora',
          text,
          mediaUrl: mediaFile ? URL.createObjectURL(mediaFile) : null,
          mediaType: mediaFile ? mediaTypeFor(mediaFile) : null,
          likes: 0,
          comments: 0,
        },
        ...prev,
      ])
      return
    }

    let mediaUrl = null
    let mediaType = null
    if (mediaFile) {
      mediaType = mediaTypeFor(mediaFile)
      const ext = mediaFile.name.includes('.') ? mediaFile.name.split('.').pop() : 'bin'
      const path = `${user.id}/${Date.now()}.${ext}`
      // No Safari do iPhone, mandar o File direto pro Supabase às vezes dá
      // erro "No content provided" (o corpo da requisição chega vazio).
      // Ler o arquivo como ArrayBuffer antes de enviar resolve isso.
      const fileBuffer = await mediaFile.arrayBuffer()
      const { error: uploadError } = await supabase.storage
        .from('community-media')
        .upload(path, fileBuffer, {
          upsert: false,
          cacheControl: '3600',
          contentType: mediaFile.type || 'application/octet-stream',
        })
      if (uploadError) {
        // eslint-disable-next-line no-console
        console.error('[Império] Erro upload mídia:', uploadError)
        const hint = /bucket/i.test(uploadError.message || '')
          ? ' O bucket "community-media" pode não existir ainda no Supabase — confira em Storage.'
          : ''
        setError(`Não consegui enviar o arquivo anexado (${uploadError.message || 'erro desconhecido'}).${hint}`)
        return
      }
      const { data: pub } = supabase.storage.from('community-media').getPublicUrl(path)
      mediaUrl = pub.publicUrl
    }

    const { data, error: insertError } = await supabase
      .from('posts')
      .insert({ author_id: user.id, content: text, category: postCategory, media_url: mediaUrl, media_type: mediaType })
      .select(
        'id, content, created_at, author_id, category, media_url, media_type, profiles!author_id(name, avatar_url)'
      )
      .single()

    if (insertError) {
      setError('Não consegui publicar seu post agora. Tente de novo em instantes.')
      return
    }

    if (postCategory === activeTab) {
      setPosts((prev) => [mapRow({ ...data, post_likes: [{ count: 0 }], post_comments: [{ count: 0 }] }, new Set()), ...prev])
    }

    // Aviso novo: manda notificação push de verdade (aparece na tela do
    // celular de quem tiver ativado). Não trava o post se der erro — é só
    // um "melhor esforço", o post já foi publicado normalmente.
    if (postCategory === 'avisos') {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        if (token) {
          fetch('/api/send-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              title: 'Novo aviso da Mentoria Império',
              body: text.slice(0, 140),
              url: '/comunidade',
            }),
          }).catch(() => {})
        }
      } catch (e) {
        // silencioso
      }
    }
  }

  async function toggleLike(post) {
    if (!isSupabaseConfigured) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p
        )
      )
      return
    }

    const wasLiked = post.liked
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p
      )
    )

    if (wasLiked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id)
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id })
      if (post.authorId && post.authorId !== user.id) {
        await supabase.from('notifications').insert({
          recipient_id: post.authorId,
          actor_id: user.id,
          type: 'like',
          post_id: post.id,
          category: post.category,
          preview: post.text ? post.text.slice(0, 140) : null,
        })
      }
    }
  }

  const authorInitial = (profile?.name || 'B').charAt(0).toUpperCase()
  const authorAvatarUrl = profile?.avatar_url || null

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#f5f1ea' }}>Comunidade</div>
        <div
          style={{
            height: 3,
            width: 64,
            margin: '10px auto',
            borderRadius: 999,
            background: 'linear-gradient(90deg, transparent, #e8bd6e, transparent)',
          }}
        />
        <div style={{ fontSize: 14, color: '#a89f92', marginTop: 4 }}>
          Troque experiências com outros alunos da Mentoria Império.
        </div>
      </div>

      {!isSupabaseConfigured && (
        <div
          className="srd-card"
          style={{
            padding: '12px 18px',
            marginBottom: 20,
            fontSize: 13,
            color: '#a89f92',
            border: '1px dashed rgba(255,255,255,0.14)',
          }}
        >
          Modo demonstração: os posts abaixo são de exemplo e não são salvos. Configure
          <code> VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> no <code>.env</code> para
          conectar a comunidade de verdade.
        </div>
      )}

      <StoriesBar user={user} profile={profile} />

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <CategoryTabs active={activeTab} onSelect={handleSelectTab} counts={counts} />
      </div>

      <div
        style={{
          textAlign: 'center',
          fontSize: 13,
          color: '#a89f92',
          marginBottom: 20,
          maxWidth: 520,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        {activeCategoryMeta.description}
      </div>

      {error && (
        <div style={{ fontSize: 13, color: '#dc8290', marginBottom: 16 }}>{error}</div>
      )}

      {canPostInActiveTab ? (
        <Composer
          onPost={addPost}
          authorInitial={authorInitial}
          authorAvatarUrl={authorAvatarUrl}
          category={postCategory}
          onCategoryChange={setPostCategory}
          categories={postableCategories}
        />
      ) : (
        <div
          className="srd-card"
          style={{ padding: '14px 18px', marginBottom: 20, fontSize: 13, color: '#a89f92', textAlign: 'center' }}
        >
          Somente administradores podem publicar em Avisos. Você pode curtir e comentar à vontade aqui embaixo. 📢
        </div>
      )}

      {loading ? (
        <div style={{ fontSize: 13.5, color: '#8f8577', padding: '20px 0' }}>Carregando posts…</div>
      ) : posts.length === 0 ? (
        <div style={{ fontSize: 13.5, color: '#8f8577', padding: '20px 0', textAlign: 'center' }}>
          Nenhum post por aqui ainda. Seja a primeira a publicar!
        </div>
      ) : (
        posts.map((post) => <Post key={post.id} post={post} onToggleLike={toggleLike} />)
      )}
    </div>
  )
}
