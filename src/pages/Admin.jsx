import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../lib/AuthProvider.jsx'
import { IconTrash, IconLock } from '../components/icons.jsx'

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  color: '#f5f1ea',
  fontFamily: 'inherit',
  fontSize: 13.5,
  padding: '9px 12px',
  outline: 'none',
}

const labelStyle = { fontSize: 12.5, color: '#a89f92', marginBottom: 4, display: 'block' }

const TABS = [
  { key: 'aulas', label: 'Aulas' },
  { key: 'comunidade', label: 'Comunidade' },
  { key: 'alunos', label: 'Alunos' },
]

const CATEGORY_LABELS = {
  avisos: '📢 Avisos',
  sacadas: '💡 Sacadas',
  em_acao: '⚡ Em Ação',
  conquistas: '🏆 Conquistas',
  conexoes: '🤝 Conexões',
}

const emptyLessonForm = {
  id: null,
  title: '',
  description: '',
  youtube_id: '',
  duration_seconds: '',
  module_id: '',
  module_order: 0,
  is_featured: false,
  cover_url: '',
  unlock_after_days: '',
}

const emptyModuleForm = {
  id: null,
  title: '',
  description: '',
  module_order: 0,
  cover_url: '',
  unlock_after_days: '',
}

function Field({ label, children }) {
  return (
    <div>
      <span style={labelStyle}>{label}</span>
      {children}
    </div>
  )
}

// Sobe uma imagem de capa pro bucket "lesson-covers" (só admin escreve
// nele) e devolve a URL pública. Lê como ArrayBuffer em vez de mandar o
// File puro — no Safari do iOS o upload do File direto às vezes falha com
// "No content provided" (bug conhecido do Supabase Storage nesse navegador).
async function uploadCover(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `capas/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`
  const buffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('lesson-covers')
    .upload(path, buffer, {
      upsert: false,
      cacheControl: '3600',
      contentType: file.type || 'application/octet-stream',
    })
  if (uploadError) throw uploadError
  const { data: pub } = supabase.storage.from('lesson-covers').getPublicUrl(path)
  return pub.publicUrl
}

// Campo de capa reaproveitado no form de módulo e no form de aula: mostra
// uma miniatura quando já tem capa, botão pra trocar e botão pra remover.
function CoverField({ coverUrl, onChange, uploading, setUploading, setError }) {
  const inputRef = useRef(null)

  async function handlePick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const url = await uploadCover(file)
      onChange(url)
    } catch (err) {
      setError('Não consegui enviar a capa: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Field label="Capa personalizada (opcional — se não colocar, usa a miniatura do YouTube)">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            style={{ width: 80, height: 45, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}
          />
        ) : (
          <div
            style={{
              width: 80,
              height: 45,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.03)',
              border: '1px dashed rgba(255,255,255,0.14)',
            }}
          />
        )}
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={handlePick} />
        <button
          type="button"
          className="srd-btn-outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          style={{ padding: '7px 14px', fontSize: 12.5 }}
        >
          {uploading ? 'Enviando…' : coverUrl ? 'Trocar' : 'Escolher imagem'}
        </button>
        {coverUrl && (
          <button
            type="button"
            onClick={() => onChange('')}
            style={{ background: 'none', border: 'none', color: '#dc8290', fontSize: 12.5 }}
          >
            Remover
          </button>
        )}
      </div>
    </Field>
  )
}

function AulasAdmin() {
  const [modulesList, setModulesList] = useState([])
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyLessonForm)
  const [saving, setSaving] = useState(false)
  const [moduleForm, setModuleForm] = useState(emptyModuleForm)
  const [savingModule, setSavingModule] = useState(false)
  const [uploadingLessonCover, setUploadingLessonCover] = useState(false)
  const [uploadingModuleCover, setUploadingModuleCover] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    const [modulesRes, lessonsRes] = await Promise.all([
      supabase.from('modules').select('*').order('module_order', { ascending: true }),
      supabase.from('lessons').select('*').order('module_order', { ascending: true }),
    ])
    if (modulesRes.error) {
      setError('Não consegui carregar os módulos: ' + modulesRes.error.message)
    } else if (lessonsRes.error) {
      setError('Não consegui carregar as aulas: ' + lessonsRes.error.message)
    } else {
      setModulesList(modulesRes.data ?? [])
      setLessons(lessonsRes.data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function editLesson(lesson) {
    setForm({
      id: lesson.id,
      title: lesson.title || '',
      description: lesson.description || '',
      youtube_id: lesson.youtube_id || '',
      duration_seconds: lesson.duration_seconds ?? '',
      module_id: lesson.module_id || '',
      module_order: lesson.module_order ?? 0,
      is_featured: !!lesson.is_featured,
      cover_url: lesson.cover_url || '',
      unlock_after_days: lesson.unlock_after_days ?? '',
    })
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    setError('')

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      youtube_id: form.youtube_id.trim() || null,
      duration_seconds: form.duration_seconds === '' ? null : Number(form.duration_seconds),
      module_id: form.module_id || null,
      module_order: Number(form.module_order) || 0,
      is_featured: form.is_featured,
      cover_url: form.cover_url || null,
      unlock_after_days: form.unlock_after_days === '' ? null : Number(form.unlock_after_days),
    }

    const { error: err } = form.id
      ? await supabase.from('lessons').update(payload).eq('id', form.id)
      : await supabase.from('lessons').insert(payload)

    if (err) {
      setError('Não consegui salvar a aula: ' + err.message)
    } else {
      setForm(emptyLessonForm)
      await load()
    }
    setSaving(false)
  }

  async function remove(id) {
    if (!window.confirm('Apagar essa aula? Essa ação não pode ser desfeita.')) return
    const { error: err } = await supabase.from('lessons').delete().eq('id', id)
    if (err) {
      setError('Não consegui apagar: ' + err.message)
    } else {
      await load()
    }
  }

  function editModule(mod) {
    setModuleForm({
      id: mod.id,
      title: mod.title || '',
      description: mod.description || '',
      module_order: mod.module_order ?? 0,
      cover_url: mod.cover_url || '',
      unlock_after_days: mod.unlock_after_days ?? '',
    })
  }

  async function submitModule(e) {
    e.preventDefault()
    if (!moduleForm.title.trim()) return
    setSavingModule(true)
    setError('')

    const payload = {
      title: moduleForm.title.trim(),
      description: moduleForm.description.trim() || null,
      module_order: Number(moduleForm.module_order) || 0,
      cover_url: moduleForm.cover_url || null,
      unlock_after_days: moduleForm.unlock_after_days === '' ? null : Number(moduleForm.unlock_after_days),
    }

    const { error: err } = moduleForm.id
      ? await supabase.from('modules').update(payload).eq('id', moduleForm.id)
      : await supabase.from('modules').insert(payload)

    if (err) {
      setError('Não consegui salvar o módulo: ' + err.message)
    } else {
      setModuleForm(emptyModuleForm)
      await load()
    }
    setSavingModule(false)
  }

  async function removeModule(id) {
    if (!window.confirm('Apagar esse módulo? As aulas dele não são apagadas, só ficam sem módulo.')) return
    const { error: err } = await supabase.from('modules').delete().eq('id', id)
    if (err) {
      setError('Não consegui apagar: ' + err.message)
    } else {
      await load()
    }
  }

  const lessonsWithoutModule = lessons.filter((l) => !l.module_id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#f5f1ea', marginBottom: 12 }}>Módulos</div>
        <form onSubmit={submitModule} className="srd-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#f5f1ea' }}>
            {moduleForm.id ? 'Editar módulo' : 'Novo módulo'}
          </div>
          <Field label="Título do módulo">
            <input
              style={inputStyle}
              value={moduleForm.title}
              onChange={(e) => setModuleForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Módulo 0 - Passo zero"
            />
          </Field>
          <Field label="Descrição (opcional)">
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 50 }}
              value={moduleForm.description}
              onChange={(e) => setModuleForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>
          <Field label="Ordem (0, 1, 2…)">
            <input
              type="number"
              style={{ ...inputStyle, maxWidth: 140 }}
              value={moduleForm.module_order}
              onChange={(e) => setModuleForm((f) => ({ ...f, module_order: e.target.value }))}
            />
          </Field>
          <CoverField
            coverUrl={moduleForm.cover_url}
            onChange={(url) => setModuleForm((f) => ({ ...f, cover_url: url }))}
            uploading={uploadingModuleCover}
            setUploading={setUploadingModuleCover}
            setError={setError}
          />
          <Field label="Trancar por quantos dias (opcional) — libera N dias depois que o aluno se cadastra. Deixe em branco pra liberar na hora. As aulas desse módulo que não tiverem um valor próprio herdam esse aqui.">
            <input
              type="number"
              min="0"
              style={{ ...inputStyle, maxWidth: 140 }}
              value={moduleForm.unlock_after_days}
              onChange={(e) => setModuleForm((f) => ({ ...f, unlock_after_days: e.target.value }))}
              placeholder="Ex: 7"
            />
          </Field>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="srd-btn-gold" disabled={savingModule}>
              {savingModule ? 'Salvando…' : moduleForm.id ? 'Salvar edição' : 'Adicionar módulo'}
            </button>
            {moduleForm.id && (
              <button type="button" className="srd-btn-outline" onClick={() => setModuleForm(emptyModuleForm)}>
                Cancelar edição
              </button>
            )}
          </div>
        </form>

        {!loading && modulesList.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {modulesList.map((mod) => (
              <div key={mod.id} className="srd-card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#f5f1ea' }}>
                  {mod.module_order}. {mod.title}
                </div>
                <button className="srd-btn-outline" onClick={() => editModule(mod)} style={{ padding: '6px 12px', fontSize: 12.5 }}>
                  Editar
                </button>
                <button
                  onClick={() => removeModule(mod.id)}
                  title="Apagar módulo"
                  style={{ background: 'none', border: 'none', color: '#dc8290', padding: 6 }}
                >
                  <IconTrash />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#f5f1ea', marginBottom: 12 }}>Aulas</div>
        <form onSubmit={submit} className="srd-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#f5f1ea' }}>
            {form.id ? 'Editar aula' : 'Nova aula'}
          </div>
          <Field label="Módulo">
            <select
              style={inputStyle}
              value={form.module_id}
              onChange={(e) => setForm((f) => ({ ...f, module_id: e.target.value }))}
            >
              <option value="">— sem módulo —</option>
              {modulesList.map((mod) => (
                <option key={mod.id} value={mod.id}>
                  {mod.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Título">
            <input
              style={inputStyle}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Introdução ao sistema, a IA"
            />
          </Field>
          <Field label="Descrição (opcional, só aparece na aula em destaque)">
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>
          <Field label="ID do vídeo no YouTube (opcional — deixe em branco se ainda não gravou; a aula aparece como 'Em breve' até você preencher)">
            <input
              style={inputStyle}
              value={form.youtube_id}
              onChange={(e) => setForm((f) => ({ ...f, youtube_id: e.target.value }))}
              placeholder="Ex: dQw4w9WgXcQ"
            />
          </Field>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <Field label="Duração em segundos (opcional)">
                <input
                  type="number"
                  style={inputStyle}
                  value={form.duration_seconds}
                  onChange={(e) => setForm((f) => ({ ...f, duration_seconds: e.target.value }))}
                />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Ordem dentro do módulo (1, 2, 3…)">
                <input
                  type="number"
                  style={inputStyle}
                  value={form.module_order}
                  onChange={(e) => setForm((f) => ({ ...f, module_order: e.target.value }))}
                />
              </Field>
            </div>
          </div>
          <CoverField
            coverUrl={form.cover_url}
            onChange={(url) => setForm((f) => ({ ...f, cover_url: url }))}
            uploading={uploadingLessonCover}
            setUploading={setUploadingLessonCover}
            setError={setError}
          />
          <Field label="Trancar por quantos dias (opcional) — libera N dias depois que o aluno se cadastra. Deixe em branco pra herdar do módulo (ou liberar na hora, se o módulo também não tiver valor).">
            <input
              type="number"
              min="0"
              style={{ ...inputStyle, maxWidth: 140 }}
              value={form.unlock_after_days}
              onChange={(e) => setForm((f) => ({ ...f, unlock_after_days: e.target.value }))}
              placeholder="Ex: 7"
            />
          </Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#d8cfc2' }}>
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
            />
            Aula em destaque (aparece no topo da página de Aulas)
          </label>

          {error && <div style={{ fontSize: 13, color: '#dc8290' }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="srd-btn-gold" disabled={saving}>
              {saving ? 'Salvando…' : form.id ? 'Salvar edição' : 'Adicionar aula'}
            </button>
            {form.id && (
              <button type="button" className="srd-btn-outline" onClick={() => setForm(emptyLessonForm)}>
                Cancelar edição
              </button>
            )}
          </div>
        </form>

        {loading ? (
          <div style={{ fontSize: 13, color: '#8f8577' }}>Carregando…</div>
        ) : lessons.length === 0 ? (
          <div style={{ fontSize: 13, color: '#8f8577' }}>Nenhuma aula cadastrada ainda.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {modulesList.map((mod) => {
              const modLessons = lessons.filter((l) => l.module_id === mod.id)
              if (modLessons.length === 0) return null
              return (
                <div key={mod.id}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#e8bd6e', marginBottom: 8 }}>
                    {mod.title}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {modLessons.map((lesson) => (
                      <LessonRow key={lesson.id} lesson={lesson} onEdit={editLesson} onRemove={remove} />
                    ))}
                  </div>
                </div>
              )
            })}
            {lessonsWithoutModule.length > 0 && (
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#8f8577', marginBottom: 8 }}>
                  Sem módulo
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {lessonsWithoutModule.map((lesson) => (
                    <LessonRow key={lesson.id} lesson={lesson} onEdit={editLesson} onRemove={remove} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function LessonRow({ lesson, onEdit, onRemove }) {
  const [showResources, setShowResources] = useState(false)

  return (
    <div className="srd-card" style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#f5f1ea' }}>
            {lesson.module_order}. {lesson.title}
            {lesson.is_featured && (
              <span style={{ marginLeft: 8, fontSize: 11, color: '#e8bd6e' }}>★ destaque</span>
            )}
            {!!lesson.unlock_after_days && (
              <span style={{ marginLeft: 8, fontSize: 11, color: '#a89f92', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <IconLock size={11} /> {lesson.unlock_after_days}d
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: lesson.youtube_id ? '#8f8577' : '#dc8290', marginTop: 2 }}>
            {lesson.youtube_id || 'sem vídeo ainda (aparece como "Em breve")'}
          </div>
        </div>
        <button
          className="srd-btn-outline"
          onClick={() => setShowResources((v) => !v)}
          style={{ padding: '7px 14px', fontSize: 12.5 }}
        >
          {showResources ? 'Fechar materiais' : 'Materiais'}
        </button>
        <button className="srd-btn-outline" onClick={() => onEdit(lesson)} style={{ padding: '7px 14px' }}>
          Editar
        </button>
        <button
          onClick={() => onRemove(lesson.id)}
          title="Apagar aula"
          style={{ background: 'none', border: 'none', color: '#dc8290', padding: 6 }}
        >
          <IconTrash />
        </button>
      </div>
      {showResources && <LessonResourcesPanel lessonId={lesson.id} />}
    </div>
  )
}

// Sites/links e anexos (arquivos) da aula: cada linha é um título + uma
// URL (o link digitado direto, ou a URL pública de um arquivo subido pro
// bucket "lesson-resources"). Aparece pro aluno junto com o vídeo da aula.
function LessonResourcesPanel({ lessonId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef(null)

  async function load() {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('lesson_resources')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('resource_order', { ascending: true })
    if (err) {
      setError('Não consegui carregar os materiais: ' + err.message)
    } else {
      setItems(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId])

  async function addLink(e) {
    e.preventDefault()
    if (!newTitle.trim() || !newUrl.trim()) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('lesson_resources').insert({
      lesson_id: lessonId,
      title: newTitle.trim(),
      url: newUrl.trim(),
      resource_order: items.length,
    })
    if (err) {
      setError('Não consegui salvar: ' + err.message)
    } else {
      setNewTitle('')
      setNewUrl('')
      await load()
    }
    setSaving(false)
  }

  async function addFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingFile(true)
    setError('')
    try {
      const ext = file.name.split('.').pop().toLowerCase()
      const path = `${lessonId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`
      const buffer = await file.arrayBuffer()
      const { error: uploadError } = await supabase.storage
        .from('lesson-resources')
        .upload(path, buffer, {
          upsert: false,
          cacheControl: '3600',
          contentType: file.type || 'application/octet-stream',
        })
      if (uploadError) throw uploadError
      const { data: pub } = supabase.storage.from('lesson-resources').getPublicUrl(path)
      const { error: insertError } = await supabase.from('lesson_resources').insert({
        lesson_id: lessonId,
        title: file.name,
        url: pub.publicUrl,
        resource_order: items.length,
      })
      if (insertError) throw insertError
      await load()
    } catch (err) {
      setError('Não consegui enviar o anexo: ' + err.message)
    } finally {
      setUploadingFile(false)
    }
  }

  async function remove(id) {
    const { error: err } = await supabase.from('lesson_resources').delete().eq('id', id)
    if (err) {
      setError('Não consegui apagar: ' + err.message)
    } else {
      await load()
    }
  }

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#a89f92', marginBottom: 8 }}>
        Sites e anexos dessa aula
      </div>

      {loading ? (
        <div style={{ fontSize: 12.5, color: '#8f8577' }}>Carregando…</div>
      ) : (
        <>
          {items.length === 0 && (
            <div style={{ fontSize: 12.5, color: '#8f8577', marginBottom: 10 }}>Nenhum material ainda.</div>
          )}
          {items.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {items.map((it) => (
                <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12.5, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {it.title}
                  </a>
                  <button
                    onClick={() => remove(it.id)}
                    title="Remover"
                    style={{ background: 'none', border: 'none', color: '#dc8290', padding: 4 }}
                  >
                    <IconTrash size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {error && <div style={{ fontSize: 12, color: '#dc8290', marginBottom: 8 }}>{error}</div>}

      <form onSubmit={addLink} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <input
          style={{ ...inputStyle, flex: '1 1 140px' }}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Nome (ex: Site da oferta)"
        />
        <input
          style={{ ...inputStyle, flex: '2 1 200px' }}
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="https://…"
        />
        <button type="submit" className="srd-btn-outline" disabled={saving} style={{ padding: '9px 14px', fontSize: 12.5 }}>
          {saving ? 'Salvando…' : 'Adicionar link'}
        </button>
      </form>

      <input ref={fileInputRef} type="file" hidden onChange={addFile} />
      <button
        type="button"
        className="srd-btn-outline"
        disabled={uploadingFile}
        onClick={() => fileInputRef.current?.click()}
        style={{ padding: '7px 14px', fontSize: 12.5 }}
      >
        {uploadingFile ? 'Enviando…' : 'Anexar arquivo'}
      </button>
    </div>
  )
}

function ComunidadeAdmin() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase
      .from('posts')
      .select('id, content, created_at, category, profiles!author_id(name, avatar_url)')
      .order('created_at', { ascending: false })
    if (err) {
      setError('Não consegui carregar os posts: ' + err.message)
    } else {
      setPosts(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function remove(id) {
    if (!window.confirm('Apagar esse post da comunidade?')) return
    const { error: err } = await supabase.from('posts').delete().eq('id', id)
    if (err) {
      setError('Não consegui apagar: ' + err.message)
    } else {
      await load()
    }
  }

  if (loading) return <div style={{ fontSize: 13, color: '#8f8577' }}>Carregando…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {error && <div style={{ fontSize: 13, color: '#dc8290' }}>{error}</div>}
      {posts.length === 0 ? (
        <div style={{ fontSize: 13, color: '#8f8577' }}>Nenhum post ainda.</div>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="srd-card" style={{ padding: '14px 16px', display: 'flex', gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                flexShrink: 0,
                background: post.profiles?.avatar_url
                  ? `center / cover no-repeat url(${post.profiles.avatar_url})`
                  : 'rgba(232,189,110,0.14)',
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f5f1ea' }}>
                {post.profiles?.name || 'Aluno'}
                <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, color: '#8f8577' }}>
                  · {CATEGORY_LABELS[post.category] || post.category}
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#d8cfc2', margin: '6px 0 0', lineHeight: 1.5 }}>{post.content}</p>
            </div>
            <button
              onClick={() => remove(post.id)}
              title="Apagar post"
              style={{ background: 'none', border: 'none', color: '#dc8290', padding: 6, flexShrink: 0, height: 'fit-content' }}
            >
              <IconTrash />
            </button>
          </div>
        ))
      )}
    </div>
  )
}

function AlunosAdmin() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) {
        setError('Sessão inválida — tente sair e entrar de novo.')
        setLoading(false)
        return
      }
      try {
        const res = await fetch('/api/admin/students', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || 'erro desconhecido')
        setStudents(body.students ?? [])
      } catch (err) {
        setError(
          'Não consegui carregar a lista de alunos (' + err.message + '). Confirme se as variáveis ' +
            'SUPABASE_SECRET_KEY e SUPABASE_URL estão configuradas na Vercel.'
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div style={{ fontSize: 13, color: '#8f8577' }}>Carregando…</div>
  if (error) return <div style={{ fontSize: 13, color: '#dc8290' }}>{error}</div>

  return (
    <div className="srd-card" style={{ overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr auto', padding: '12px 16px', fontSize: 12, color: '#8f8577', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span>Nome</span>
        <span>E-mail</span>
        <span>Cadastrado em</span>
      </div>
      {students.length === 0 ? (
        <div style={{ padding: '16px', fontSize: 13, color: '#8f8577' }}>Nenhum aluno cadastrado ainda.</div>
      ) : (
        students.map((s) => (
          <div
            key={s.id}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr auto', padding: '12px 16px', fontSize: 13, color: '#d8cfc2', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
          >
            <span>{s.name || '—'}</span>
            <span>{s.email}</span>
            <span style={{ color: '#8f8577' }}>{new Date(s.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>
        ))
      )}
    </div>
  )
}

export default function Admin() {
  const { isAdmin } = useAuth()
  const [tab, setTab] = useState('aulas')

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#f5f1ea' }}>Painel admin</div>
        <div style={{ fontSize: 14, color: '#a89f92', marginTop: 4 }}>
          Cadastre aulas, modere a comunidade e veja quem já se cadastrou — sem precisar abrir o Supabase.
        </div>
      </div>

      {!isAdmin && (
        <div className="srd-card" style={{ padding: '12px 18px', marginBottom: 20, fontSize: 13, color: '#a89f92', border: '1px dashed rgba(255,255,255,0.14)' }}>
          Modo demonstração: as ações abaixo não têm efeito real.
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid #e8bd6e' : '2px solid transparent',
              color: tab === t.key ? '#e8bd6e' : '#a89f92',
              fontWeight: tab === t.key ? 700 : 500,
              fontSize: 13.5,
              padding: '10px 4px',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'aulas' && <AulasAdmin />}
      {tab === 'comunidade' && <ComunidadeAdmin />}
      {tab === 'alunos' && <AlunosAdmin />}
    </div>
  )
}
