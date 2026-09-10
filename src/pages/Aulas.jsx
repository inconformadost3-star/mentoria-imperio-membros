import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'
import { useAuth } from '../lib/AuthProvider.jsx'
import { mockLessons } from '../data/mockData.js'
import { IconPlay } from '../components/icons.jsx'

function ytThumb(id) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
}

function formatDuration(seconds) {
  if (!seconds) return null
  const min = Math.round(seconds / 60)
  return `${min} min`
}

// Normaliza uma linha da tabela `lessons` do Supabase pro mesmo formato
// usado pelos dados de exemplo, pra manter os componentes abaixo simples.
function mapLessonRow(row, doneIds) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    youtubeId: row.youtube_id,
    duration: formatDuration(row.duration_seconds),
    moduleId: row.module_id,
    done: doneIds.has(row.id),
  }
}

function VideoModal({ youtubeId, title, onClose }) {
  if (!youtubeId) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 860 }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: '#f5f1ea', marginBottom: 10 }}>
          {title}
        </div>
        <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 16, overflow: 'hidden' }}>
          <iframe
            title={title}
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}

function LessonCard({ lesson, onPlay }) {
  const comingSoon = !lesson.youtubeId
  return (
    <button
      onClick={() => !comingSoon && onPlay(lesson)}
      disabled={comingSoon}
      className="srd-card"
      style={{
        textAlign: 'left',
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--srd-border)',
        opacity: comingSoon ? 0.55 : 1,
        cursor: comingSoon ? 'default' : 'pointer',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
        {comingSoon ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#8f8577', letterSpacing: 0.6 }}>
              EM BREVE
            </span>
          </div>
        ) : (
          <>
            <img
              src={ytThumb(lesson.youtubeId)}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.9 }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  background: 'rgba(26,21,15,0.75)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconPlay color="#f5f1ea" />
              </div>
            </div>
          </>
        )}
        {lesson.duration && !comingSoon && (
          <span
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              background: 'rgba(0,0,0,0.7)',
              color: '#f5f1ea',
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: 6,
            }}
          >
            {lesson.duration}
          </span>
        )}
        {lesson.done && (
          <span
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              background: 'var(--srd-success-soft)',
              color: 'var(--srd-success)',
              fontSize: 10.5,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 999,
            }}
          >
            Concluída
          </span>
        )}
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#f5f1ea', lineHeight: 1.4 }}>
          {lesson.title}
        </div>
        {(lesson.views != null || lesson.comments != null) && (
          <div style={{ fontSize: 12, color: '#8f8577', marginTop: 8, display: 'flex', gap: 12 }}>
            {lesson.views != null && <span>{lesson.views.toLocaleString('pt-BR')} visualizações</span>}
            {lesson.comments != null && <span>{lesson.comments} comentários</span>}
          </div>
        )}
      </div>
    </button>
  )
}

function ModuleSection({ title, lessons, onPlay }) {
  if (lessons.length === 0) return null
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#e8bd6e', marginBottom: 14 }}>{title}</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 18,
        }}
      >
        {lessons.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} onPlay={onPlay} />
        ))}
      </div>
    </div>
  )
}

export default function Aulas() {
  const { user } = useAuth()
  const [playing, setPlaying] = useState(null)
  const [featured, setFeatured] = useState(isSupabaseConfigured ? null : mockLessons.featured)
  const [moduleRows, setModuleRows] = useState([])
  const [lessons, setLessons] = useState(isSupabaseConfigured ? [] : mockLessons.modules)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) return
    loadLessons()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  async function loadLessons() {
    setLoading(true)
    setError('')
    try {
      const [modulesRes, lessonsRes] = await Promise.all([
        supabase.from('modules').select('*').order('module_order', { ascending: true }),
        supabase.from('lessons').select('*').order('module_order', { ascending: true }),
      ])

      if (modulesRes.error) throw modulesRes.error
      if (lessonsRes.error) throw lessonsRes.error

      let doneIds = new Set()
      if (user) {
        const { data: progressRows } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('completed', true)
        doneIds = new Set((progressRows ?? []).map((r) => r.lesson_id))
      }

      const rows = lessonsRes.data ?? []
      const featuredRow = rows.find((r) => r.is_featured)
      const lessonRows = rows.filter((r) => !r.is_featured)
      setModuleRows(modulesRes.data ?? [])
      setFeatured(featuredRow ? mapLessonRow(featuredRow, doneIds) : null)
      setLessons(lessonRows.map((row) => mapLessonRow(row, doneIds)))
    } catch (err) {
      setError('Não consegui carregar as aulas agora. Tente recarregar a página.')
      // eslint-disable-next-line no-console
      console.error('[Império] Erro carregando aulas:', err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handlePlay(lesson) {
    setPlaying(lesson)

    if (!isSupabaseConfigured || !user) return

    // Marca a aula como assistida ao abrir o vídeo (proxy simples de
    // progresso — dá pra refinar depois com o IFrame Player API do
    // YouTube pra só marcar quando o vídeo realmente terminar).
    await supabase
      .from('lesson_progress')
      .upsert(
        { user_id: user.id, lesson_id: lesson.id, completed: true, completed_at: new Date().toISOString() },
        { onConflict: 'user_id,lesson_id' }
      )

    setLessons((prev) => prev.map((l) => (l.id === lesson.id ? { ...l, done: true } : l)))
    if (featured?.id === lesson.id) setFeatured((f) => ({ ...f, done: true }))
  }

  const done = lessons.filter((l) => l.done).length
  const lessonsWithoutModule = lessons.filter((l) => !l.moduleId)

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#f5f1ea' }}>Aulas</div>
        <div style={{ fontSize: 14, color: '#a89f92', marginTop: 4 }}>
          Sua trilha completa para colocar a Mentoria Império em prática.
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
          Modo demonstração: as aulas abaixo são de exemplo. Configure <code>VITE_SUPABASE_URL</code> e{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> no <code>.env</code>, depois cadastre módulos e aulas de
          verdade pelo Painel Admin — não precisa mexer em código.
        </div>
      )}

      {error && <div style={{ fontSize: 13, color: '#dc8290', marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div style={{ fontSize: 13.5, color: '#8f8577', padding: '20px 0', textAlign: 'center' }}>
          Carregando aulas…
        </div>
      ) : isSupabaseConfigured && lessons.length === 0 && !featured ? (
        <div className="srd-card" style={{ padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f5f1ea', marginBottom: 6 }}>
            Nenhuma aula cadastrada ainda
          </div>
          <div style={{ fontSize: 13.5, color: '#a89f92' }}>
            Cadastre seus módulos e aulas pelo <strong>Painel admin</strong> (menu "Conta" → "Painel admin").
            Não precisa ter o vídeo pronto ainda: uma aula sem vídeo aparece como "Em breve" até você
            preencher o ID do YouTube depois.
          </div>
        </div>
      ) : (
        <>
          <div
            className="srd-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 20px',
              marginBottom: 24,
              background: 'var(--srd-gold-soft)',
              border: '1px solid var(--srd-gold-border)',
            }}
          >
            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#e8bd6e' }}>Comece aqui</span>
            <span style={{ fontSize: 13, color: '#d8cfc2' }}>
              Assista à aula de boas-vindas antes de seguir para os módulos abaixo.
            </span>
          </div>

          {featured && (
            <button
              onClick={() => handlePlay(featured)}
              className="srd-card srd-featured-card"
              style={{
                display: 'flex',
                width: '100%',
                textAlign: 'left',
                padding: 0,
                overflow: 'hidden',
                marginBottom: 36,
              }}
            >
              <div className="srd-featured-thumb" style={{ position: 'relative', width: '46%', minWidth: 280, aspectRatio: '16/9', background: '#000' }}>
                <img
                  src={ytThumb(featured.youtubeId)}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg,#f3d386,#c8862c)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconPlay size={22} color="#1a150f" />
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#e8bd6e', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Aula em destaque
                </span>
                <div style={{ fontSize: 19, fontWeight: 700, color: '#f5f1ea', marginTop: 8 }}>
                  {featured.title}
                </div>
                {featured.description && (
                  <p style={{ fontSize: 13.5, color: '#a89f92', marginTop: 8, lineHeight: 1.55 }}>
                    {featured.description}
                  </p>
                )}
              </div>
            </button>
          )}

          {lessons.length > 0 && (
            <>
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: '#f5f1ea' }}>Seu progresso</span>
                  <span style={{ fontSize: 13, color: '#a89f92' }}>
                    {done} de {lessons.length} aulas concluídas
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.round((done / lessons.length) * 100)}%`,
                      background: 'linear-gradient(90deg,#c8862c,#f3d386)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {moduleRows.length > 0
                ? moduleRows.map((mod) => (
                    <ModuleSection
                      key={mod.id}
                      title={mod.title}
                      lessons={lessons.filter((l) => l.moduleId === mod.id)}
                      onPlay={handlePlay}
                    />
                  ))
                : null}

              {(moduleRows.length === 0 || lessonsWithoutModule.length > 0) && (
                <ModuleSection
                  title={moduleRows.length > 0 ? 'Outras aulas' : 'Aulas'}
                  lessons={moduleRows.length > 0 ? lessonsWithoutModule : lessons}
                  onPlay={handlePlay}
                />
              )}
            </>
          )}
        </>
      )}

      <VideoModal
        youtubeId={playing?.youtubeId}
        title={playing?.title}
        onClose={() => setPlaying(null)}
      />
    </div>
  )
}
