// Stories estilo Instagram: bolinha de foto de perfil no topo da Comunidade,
// story fica ativo por 24h (o próprio banco filtra pelo expires_at — ver
// migration_010_stories.sql) e depois some sozinho, sem precisar apagar nada.
import { useEffect, useRef, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'
import { IconPlus, IconX, IconTrash } from './icons.jsx'

const MAX_STORY_BYTES = 50 * 1024 * 1024 // 50MB
const IMAGE_DURATION_MS = 5000

function mediaTypeForStory(file) {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return null
}

function Avatar({ initial, avatarUrl, size }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        background: avatarUrl ? `center / cover no-repeat url(${avatarUrl})` : 'rgba(232,189,110,0.14)',
        color: '#e8bd6e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size * 0.38,
      }}
    >
      {!avatarUrl && initial}
    </div>
  )
}

// Anel gradiente (não visto) ou cinza (já visto/próprio) ao redor da bolinha
// — igual ao efeito do Instagram, feito só com padding + background.
function Ring({ size = 64, tone, children }) {
  const ringBg =
    tone === 'unseen'
      ? 'linear-gradient(135deg,#f3d386,#e8bd6e,#c8862c)'
      : tone === 'seen'
      ? 'rgba(255,255,255,0.16)'
      : '1px solid rgba(255,255,255,0.16)'
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        padding: 2.5,
        background: tone === 'own-empty' ? 'transparent' : ringBg,
        border: tone === 'own-empty' ? '1.5px dashed rgba(255,255,255,0.22)' : 'none',
        flexShrink: 0,
      }}
    >
      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--srd-bg)', padding: 2 }}>
        {children}
      </div>
    </div>
  )
}

function Bubble({ label, tone, avatarUrl, initial, badge, busy, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        background: 'none',
        border: 'none',
        width: 72,
        flexShrink: 0,
        opacity: busy ? 0.6 : 1,
      }}
    >
      <div style={{ position: 'relative', width: 64, height: 64 }}>
        <Ring size={64} tone={tone}>
          <Avatar initial={initial} avatarUrl={avatarUrl} size={59} />
        </Ring>
        {badge && (
          <div
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'var(--srd-gold)',
              color: '#1a150f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--srd-bg)',
            }}
          >
            <IconPlus size={12} color="#1a150f" />
          </div>
        )}
      </div>
      <span
        style={{
          fontSize: 11.5,
          color: '#a89f92',
          maxWidth: 72,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </button>
  )
}

function StoryViewer({ groups, startGroupIndex, currentUserId, onClose, onView, onDelete }) {
  const [groupIndex, setGroupIndex] = useState(startGroupIndex)
  const [storyIndex, setStoryIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef(null)
  const videoRef = useRef(null)

  const group = groups[groupIndex]
  const story = group?.stories[storyIndex]

  useEffect(() => {
    setStoryIndex(0)
  }, [groupIndex])

  useEffect(() => {
    if (story) onView(story)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id])

  function goNext() {
    if (!group) return
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((i) => i + 1)
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((i) => i + 1)
    } else {
      onClose()
    }
  }

  function goPrev() {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1)
    } else if (groupIndex > 0) {
      setGroupIndex((i) => i - 1)
      setStoryIndex(0)
    }
  }

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (paused || !story) return
    if (story.mediaType === 'image') {
      timerRef.current = setTimeout(goNext, IMAGE_DURATION_MS)
    }
    return () => clearTimeout(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id, paused])

  if (!group || !story) return null

  const canDelete = currentUserId && story.authorId === currentUserId

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'relative', width: '100%', maxWidth: 420, height: '100%', maxHeight: 800 }}>
        <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', gap: 4, zIndex: 2 }}>
          {group.stories.map((s, i) => (
            <div
              key={s.id}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.3)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width:
                    i < storyIndex
                      ? '100%'
                      : i > storyIndex
                      ? '0%'
                      : story.mediaType === 'image'
                      ? '100%'
                      : '0%',
                  background: '#fff',
                  animation:
                    i === storyIndex && story.mediaType === 'image' && !paused
                      ? `srd-story-fill ${IMAGE_DURATION_MS}ms linear forwards`
                      : 'none',
                }}
              />
            </div>
          ))}
          <style>{`@keyframes srd-story-fill { from { width: 0% } to { width: 100% } }`}</style>
        </div>

        <div
          style={{
            position: 'absolute',
            top: 22,
            left: 14,
            right: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 2,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden' }}>
              <Avatar initial={group.initial} avatarUrl={group.avatarUrl} size={30} />
            </div>
            <span style={{ color: '#fff', fontSize: 13.5, fontWeight: 700 }}>{group.author}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(story)}
                style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.85 }}
                title="Apagar story"
              >
                <IconTrash size={18} color="#fff" />
              </button>
            )}
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff' }}>
              <IconX size={22} color="#fff" />
            </button>
          </div>
        </div>

        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#111',
          }}
        >
          {story.mediaType === 'image' ? (
            <img
              src={story.mediaUrl}
              alt=""
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          ) : (
            <video
              ref={videoRef}
              src={story.mediaUrl}
              autoPlay
              playsInline
              onEnded={goNext}
              onPlay={() => setPaused(false)}
              onPause={() => setPaused(true)}
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
          )}
        </div>

        <div style={{ position: 'absolute', inset: 0, display: 'flex', zIndex: 1 }}>
          <div style={{ flex: 1 }} onClick={goPrev} />
          <div style={{ flex: 1 }} onClick={goNext} />
        </div>
      </div>
    </div>
  )
}

export default function StoriesBar({ user, profile }) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [viewerGroupIndex, setViewerGroupIndex] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (isSupabaseConfigured) loadStories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  async function loadStories() {
    setLoading(true)
    try {
      const { data: rows, error: err } = await supabase
        .from('stories')
        .select('id, author_id, media_url, media_type, created_at, profiles!author_id(name, avatar_url)')
        .order('created_at', { ascending: true })
      if (err) throw err

      let viewedIds = new Set()
      if (user) {
        const { data: viewedRows } = await supabase
          .from('story_views')
          .select('story_id')
          .eq('viewer_id', user.id)
        viewedIds = new Set((viewedRows ?? []).map((r) => r.story_id))
      }

      const byAuthor = new Map()
      for (const row of rows ?? []) {
        const list = byAuthor.get(row.author_id) || []
        list.push({
          id: row.id,
          authorId: row.author_id,
          author: row.profiles?.name || 'Aluno',
          initial: (row.profiles?.name || 'A').charAt(0).toUpperCase(),
          avatarUrl: row.profiles?.avatar_url || null,
          mediaUrl: row.media_url,
          mediaType: row.media_type,
          createdAt: row.created_at,
          viewed: viewedIds.has(row.id),
        })
        byAuthor.set(row.author_id, list)
      }

      const groupsArr = Array.from(byAuthor.values()).map((list) => ({
        authorId: list[0].authorId,
        author: list[0].author,
        avatarUrl: list[0].avatarUrl,
        initial: list[0].initial,
        isOwn: !!user && list[0].authorId === user.id,
        allSeen: list.every((s) => s.viewed),
        stories: list,
      }))

      groupsArr.sort((a, b) => {
        if (a.isOwn !== b.isOwn) return a.isOwn ? -1 : 1
        if (a.allSeen !== b.allSeen) return a.allSeen ? 1 : -1
        const aLatest = a.stories[a.stories.length - 1].createdAt
        const bLatest = b.stories[b.stories.length - 1].createdAt
        return new Date(bLatest) - new Date(aLatest)
      })

      setGroups(groupsArr)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[Império] Erro carregando stories:', e.message)
    } finally {
      setLoading(false)
    }
  }

  function handlePickFile() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user) return
    const type = mediaTypeForStory(file)
    if (!type) {
      setError('Envie uma foto ou vídeo para o story.')
      return
    }
    if (file.size > MAX_STORY_BYTES) {
      setError('Esse arquivo passa de 50MB. Escolha um arquivo menor.')
      return
    }
    setError('')
    setUploading(true)
    try {
      const ext = file.name.includes('.') ? file.name.split('.').pop() : type === 'image' ? 'jpg' : 'mp4'
      const path = `${user.id}/stories/${Date.now()}.${ext}`
      // Mesmo truque usado nos posts da Comunidade: no Safari do iPhone,
      // mandar o File direto pro Supabase às vezes falha — ler como
      // ArrayBuffer antes resolve.
      const fileBuffer = await file.arrayBuffer()
      const { error: uploadError } = await supabase.storage
        .from('community-media')
        .upload(path, fileBuffer, {
          upsert: false,
          cacheControl: '3600',
          contentType: file.type || 'application/octet-stream',
        })
      if (uploadError) throw uploadError
      const { data: pub } = supabase.storage.from('community-media').getPublicUrl(path)

      const { error: insertError } = await supabase.from('stories').insert({
        author_id: user.id,
        media_url: pub.publicUrl,
        media_type: type,
      })
      if (insertError) throw insertError

      await loadStories()
    } catch (e) {
      setError('Não consegui publicar o story agora. Tente de novo em instantes.')
      // eslint-disable-next-line no-console
      console.error('[Império] Erro publicando story:', e.message)
    } finally {
      setUploading(false)
    }
  }

  async function markViewed(story) {
    if (!user || story.viewed) return
    setGroups((prev) =>
      prev.map((g) =>
        g.authorId !== story.authorId
          ? g
          : {
              ...g,
              stories: g.stories.map((s) => (s.id === story.id ? { ...s, viewed: true } : s)),
              allSeen: g.stories.every((s) => (s.id === story.id ? true : s.viewed)),
            }
      )
    )
    await supabase
      .from('story_views')
      .upsert({ story_id: story.id, viewer_id: user.id }, { onConflict: 'story_id,viewer_id' })
  }

  async function deleteStory(story) {
    setViewerGroupIndex(null)
    await supabase.from('stories').delete().eq('id', story.id)
    await loadStories()
  }

  if (!isSupabaseConfigured || loading) return null
  if (groups.length === 0 && !user) return null

  const ownGroup = groups.find((g) => g.isOwn)
  const otherGroups = groups.filter((g) => !g.isOwn)

  return (
    <div style={{ marginBottom: 20 }}>
      <div
        className="om-scrollbar"
        style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '2px 2px 6px' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {user && (
          <Bubble
            label={ownGroup ? 'Seu story' : 'Adicionar'}
            tone={ownGroup ? (ownGroup.allSeen ? 'seen' : 'unseen') : 'own-empty'}
            avatarUrl={profile?.avatar_url || null}
            initial={(profile?.name || 'B').charAt(0).toUpperCase()}
            badge
            busy={uploading}
            onClick={() => {
              if (ownGroup) {
                setViewerGroupIndex(groups.indexOf(ownGroup))
              } else {
                handlePickFile()
              }
            }}
          />
        )}

        {otherGroups.map((g) => (
          <Bubble
            key={g.authorId}
            label={g.author}
            tone={g.allSeen ? 'seen' : 'unseen'}
            avatarUrl={g.avatarUrl}
            initial={g.initial}
            onClick={() => setViewerGroupIndex(groups.indexOf(g))}
          />
        ))}
      </div>

      {error && <div style={{ fontSize: 12.5, color: '#dc8290', marginTop: 4 }}>{error}</div>}

      {viewerGroupIndex !== null && groups[viewerGroupIndex] && (
        <StoryViewer
          groups={groups}
          startGroupIndex={viewerGroupIndex}
          currentUserId={user?.id}
          onClose={() => setViewerGroupIndex(null)}
          onView={markViewed}
          onDelete={deleteStory}
        />
      )}
    </div>
  )
}
