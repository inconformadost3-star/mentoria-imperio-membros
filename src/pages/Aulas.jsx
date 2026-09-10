import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'
import { useAuth } from '../lib/AuthProvider.jsx'
import { mockLessons } from '../data/mockData.js'
import { IconPlay, IconLock, IconExternal, IconChevronLeft } from '../components/icons.jsx'

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
    coverUrl: row.cover_url,
    unlockAfterDays: row.unlock_after_days,
    done: doneIds.has(row.id),
  }
}

// Quantos dias faltam pra uma aula liberar, contando a partir de quando o
// aluno se cadastrou (enrolledAt = profiles.created_at). unlockAfterDays vem
// da própria aula, ou, se ela não tiver valor, do módulo dela (herança).
// Sem valor em nenhum dos dois = liberada na hora.
function getLockInfo(lesson, moduleRow, enrolledAt) {
  const days = lesson.unlockAfterDays ?? moduleRow?.unlock_after_days ?? null
  if (!days || days <= 0 || !enrolledAt) return { locked: false }
  const unlockDate = new Date(enrolledAt)
  unlockDate.setDate(unlockDate.getDate() + Number(days))
  const now = new Date()
  if (now >= unlockDate) return { locked: false }
  const msLeft = unlockDate.getTime() - now.getTime()
  const daysLeft = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))
  return { locked: true, daysLeft }
}

// Miniatura pequena usada na lista de aulas do módulo, dentro do player.
function SidebarLessonThumb({ lesson }) {
  const src = lesson.coverUrl || (lesson.youtubeId ? ytThumb(lesson.youtubeId) : null)
  return (
    <div style={{ position: 'relative', width: 64, height: 40, borderRadius: 8, overflow: 'hidden', background: '#000', flexShrink: 0 }}>
      {src ? (
        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.04)' }} />
      )}
      {lesson.lockInfo?.locked && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,16,11,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconLock size={13} color="#e8bd6e" />
        </div>
      )}
    </div>
  )
}

// Tela cheia de "assistindo aula": vídeo grande à esquerda + lista das
// aulas do mesmo módulo à direita (a atual em destaque) — igual ao layout
// de referência que a Bia mandou. Ocupa a área da página inteira, no lugar
// da grade normal de Aulas.
function LessonPlayerPage({ lesson, moduleTitle, siblings, done, resources, resourcesLoading, onBack, onSelectLesson }) {
  const idx = siblings.findIndex((l) => l.id === lesson.id)
  const total = siblings.length
  const moduleDone = siblings.filter((l) => l.done).length

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13.5 }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(255,255,255,0.05)',
            border: 'none',
            borderRadius: 999,
            color: '#f5f1ea',
            fontWeight: 700,
            fontSize: 13,
            padding: '6px 14px',
          }}
        >
          <IconChevronLeft size={13} /> Aulas
        </button>
        {moduleTitle && (
          <>
            <span style={{ color: '#6e6355' }}>/</span>
            <span style={{ color: '#a89f92', fontWeight: 600 }}>{moduleTitle}</span>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '3 1 480px', minWidth: 0 }}>
          <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 16, overflow: 'hidden', background: '#000' }}>
            {lesson.youtubeId ? (
              <iframe
                title={lesson.title}
                src={`https://www.youtube.com/embed/${lesson.youtubeId}?autoplay=1`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#8f8577', letterSpacing: 0.6 }}>EM BREVE</span>
              </div>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#e8bd6e' }}>
              {total > 0 ? `Aula ${idx + 1} de ${total}` : 'Aula'}
              {lesson.duration ? ` · ${lesson.duration}` : ''}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f1ea', marginTop: 6 }}>{lesson.title}</div>
            {lesson.description && (
              <p style={{ fontSize: 13.5, color: '#a89f92', marginTop: 8, lineHeight: 1.6 }}>{lesson.description}</p>
            )}
          </div>

          {!resourcesLoading && resources.length > 0 && (
            <div className="srd-card" style={{ marginTop: 20, padding: 16 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#e8bd6e', marginBottom: 10 }}>
                Materiais da aula
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {resources.map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      color: '#f5f1ea',
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <IconExternal size={13} color="#e8bd6e" />
                    {r.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {total > 0 && (
          <div className="srd-card" style={{ flex: '1 1 280px', minWidth: 260, maxWidth: 340, padding: 16, maxHeight: 620, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8f8577', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Módulo
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f5f1ea', marginTop: 2 }}>
              {moduleTitle || 'Aulas'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 6 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.round((moduleDone / total) * 100)}%`,
                    background: 'linear-gradient(90deg,#c8862c,#f3d386)',
                  }}
                />
              </div>
              <span style={{ fontSize: 11.5, color: '#8f8577', flexShrink: 0 }}>
                {moduleDone}/{total}
              </span>
            </div>

            <div style={{ overflowY: 'auto', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 2 }}>
              {siblings.map((sib) => {
                const isCurrent = sib.id === lesson.id
                const blocked = sib.lockInfo?.locked
                return (
                  <button
                    key={sib.id}
                    onClick={() => !blocked && onSelectLesson(sib)}
                    disabled={blocked}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      textAlign: 'left',
                      padding: '8px',
                      borderRadius: 10,
                      border: isCurrent ? '1px solid var(--srd-success)' : '1px solid transparent',
                      background: isCurrent ? 'var(--srd-success-soft)' : 'transparent',
                      opacity: blocked ? 0.5 : 1,
                      cursor: blocked ? 'default' : 'pointer',
                    }}
                  >
                    <SidebarLessonThumb lesson={sib} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: isCurrent ? 700 : 500,
                          color: isCurrent ? '#f5f1ea' : '#d8cfc2',
                          lineHeight: 1.3,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {sib.title}
                      </div>
                      {sib.duration && (
                        <div style={{ fontSize: 11, color: isCurrent ? 'var(--srd-success)' : '#8f8577', marginTop: 2 }}>
                          {sib.duration}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function LessonCard({ lesson, onPlay }) {
  const locked = lesson.lockInfo?.locked
  const comingSoon = !lesson.youtubeId && !locked
  const blocked = locked || comingSoon
  const thumbSrc = lesson.coverUrl || (lesson.youtubeId ? ytThumb(lesson.youtubeId) : null)

  return (
    <button
      onClick={() => !blocked && onPlay(lesson)}
      disabled={blocked}
      className="srd-card"
      style={{
        textAlign: 'left',
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--srd-border)',
        opacity: blocked ? 0.55 : 1,
        cursor: blocked ? 'default' : 'pointer',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
        {locked ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: thumbSrc ? `center / cover no-repeat url(${thumbSrc})` : 'rgba(255,255,255,0.03)',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                inset: 0,
                background: 'rgba(20,16,11,0.72)',
              }}
            />
            <span style={{ position: 'relative', display: 'flex' }}>
              <IconLock size={20} color="#e8bd6e" />
            </span>
            <span style={{ position: 'relative', fontSize: 11.5, fontWeight: 700, color: '#e8bd6e', letterSpacing: 0.3, textAlign: 'center', padding: '0 10px' }}>
              Libera em {lesson.lockInfo.daysLeft} dia{lesson.lockInfo.daysLeft > 1 ? 's' : ''}
            </span>
          </div>
        ) : comingSoon ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: thumbSrc ? `center / cover no-repeat url(${thumbSrc})` : 'rgba(255,255,255,0.03)',
            }}
          >
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#8f8577', letterSpacing: 0.6, background: thumbSrc ? 'rgba(20,16,11,0.6)' : 'transparent', padding: thumbSrc ? '4px 10px' : 0, borderRadius: 6 }}>
              EM BREVE
            </span>
          </div>
        ) : (
          <>
            <img
              src={thumbSrc}
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
        {lesson.duration && !blocked && (
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
  const { user, profile } = useAuth()
  const [playing, setPlaying] = useState(null)
  const [featured, setFeatured] = useState(isSupabaseConfigured ? null : mockLessons.featured)
  const [moduleRows, setModuleRows] = useState([])
  const [lessons, setLessons] = useState(isSupabaseConfigured ? [] : mockLessons.modules)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState('')
  const [resources, setResources] = useState([])
  const [resourcesLoading, setResourcesLoading] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    loadLessons()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    if (!isSupabaseConfigured || !playing) {
      setResources([])
      return
    }
    setResourcesLoading(true)
    supabase
      .from('lesson_resources')
      .select('*')
      .eq('lesson_id', playing.id)
      .order('resource_order', { ascending: true })
      .then(({ data, error: err }) => {
        setResources(err ? [] : data ?? [])
        setResourcesLoading(false)
      })
  }, [playing?.id])

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
    if (lesson.lockInfo?.locked) return
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

  const enrolledAt = profile?.created_at || null
  const moduleById = new Map(moduleRows.map((m) => [m.id, m]))
  const withLockInfo = (l) => ({ ...l, lockInfo: getLockInfo(l, moduleById.get(l.moduleId), enrolledAt) })
  const lessonsLocked = lessons.map(withLockInfo)
  const featuredLocked = featured ? withLockInfo(featured) : null

  const done = lessonsLocked.filter((l) => l.done).length
  const lessonsWithoutModule = lessonsLocked.filter((l) => !l.moduleId)

  if (playing) {
    const allPlayable = featuredLocked ? [featuredLocked, ...lessonsLocked] : lessonsLocked
    const siblings = allPlayable.filter((l) => (l.moduleId || null) === (playing.moduleId || null))
    const moduleTitle = playing.moduleId
      ? moduleById.get(playing.moduleId)?.title || null
      : featuredLocked && siblings.some((l) => l.id === featuredLocked.id)
      ? 'Comece aqui'
      : null

    return (
      <LessonPlayerPage
        lesson={siblings.find((l) => l.id === playing.id) || playing}
        moduleTitle={moduleTitle}
        siblings={siblings}
        done={done}
        resources={resources}
        resourcesLoading={resourcesLoading}
        onBack={() => setPlaying(null)}
        onSelectLesson={handlePlay}
      />
    )
  }

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
      ) : isSupabaseConfigured && lessonsLocked.length === 0 && !featuredLocked ? (
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

          {featuredLocked && (
            <button
              onClick={() => handlePlay(featuredLocked)}
              disabled={featuredLocked.lockInfo?.locked || (!featuredLocked.youtubeId && !featuredLocked.coverUrl)}
              className="srd-card srd-featured-card"
              style={{
                position: 'relative',
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: 0,
                overflow: 'hidden',
                marginBottom: 36,
                aspectRatio: '2.2 / 1',
                background: '#000',
                cursor: featuredLocked.lockInfo?.locked ? 'default' : 'pointer',
              }}
            >
              {(featuredLocked.coverUrl || featuredLocked.youtubeId) && (
                <img
                  src={featuredLocked.coverUrl || ytThumb(featuredLocked.youtubeId)}
                  alt=""
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              )}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(0deg, rgba(10,8,6,0.92) 0%, rgba(10,8,6,0.45) 42%, rgba(10,8,6,0.05) 68%)',
                }}
              />

              {featuredLocked.lockInfo?.locked && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,16,11,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <IconLock size={26} color="#e8bd6e" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#e8bd6e' }}>
                    Libera em {featuredLocked.lockInfo.daysLeft} dia{featuredLocked.lockInfo.daysLeft > 1 ? 's' : ''}
                  </span>
                </div>
              )}

              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span
                  style={{
                    alignSelf: 'flex-start',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    color: '#e8bd6e',
                    border: '1px solid var(--srd-gold-border)',
                    background: 'rgba(232,189,110,0.12)',
                    padding: '4px 10px',
                    borderRadius: 999,
                    textTransform: 'uppercase',
                  }}
                >
                  Comece por aqui
                </span>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                  {featuredLocked.title}
                </div>
                {!featuredLocked.lockInfo?.locked && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#fff',
                        color: '#1a150f',
                        fontWeight: 700,
                        fontSize: 13,
                        padding: '8px 16px',
                        borderRadius: 999,
                      }}
                    >
                      <IconPlay size={13} color="#1a150f" /> Assistir
                    </span>
                    {featuredLocked.duration && (
                      <span style={{ fontSize: 12.5, color: '#c9c0b3' }}>{featuredLocked.duration}</span>
                    )}
                  </div>
                )}
              </div>
            </button>
          )}

          {lessonsLocked.length > 0 && (
            <>
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: '#f5f1ea' }}>Seu progresso</span>
                  <span style={{ fontSize: 13, color: '#a89f92' }}>
                    {done} de {lessonsLocked.length} aulas concluídas
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.round((done / lessonsLocked.length) * 100)}%`,
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
                      lessons={lessonsLocked.filter((l) => l.moduleId === mod.id)}
                      onPlay={handlePlay}
                    />
                  ))
                : null}

              {(moduleRows.length === 0 || lessonsWithoutModule.length > 0) && (
                <ModuleSection
                  title={moduleRows.length > 0 ? 'Outras aulas' : 'Aulas'}
                  lessons={moduleRows.length > 0 ? lessonsWithoutModule : lessonsLocked}
                  onPlay={handlePlay}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
