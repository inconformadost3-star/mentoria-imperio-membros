import { useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../lib/AuthProvider.jsx'

function Field({ label, value, onChange, type = 'text', disabled = false }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#a89f92' }}>{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          color: disabled ? '#8f8577' : '#f5f1ea',
          fontFamily: 'inherit',
          fontSize: 14,
          padding: '10px 12px',
          outline: 'none',
        }}
      />
    </label>
  )
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 0',
        borderBottom: '1px solid var(--srd-border)',
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#f5f1ea' }}>{label}</div>
        {description && (
          <div style={{ fontSize: 12.5, color: '#8f8577', marginTop: 2 }}>{description}</div>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 42,
          height: 24,
          borderRadius: 999,
          border: 'none',
          background: checked ? 'linear-gradient(135deg,#f3d386,#c8862c)' : 'rgba(255,255,255,0.12)',
          position: 'relative',
          transition: 'background 0.15s ease',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: checked ? 21 : 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: checked ? '#1a150f' : '#f5f1ea',
            transition: 'left 0.15s ease',
          }}
        />
      </button>
    </div>
  )
}

function AvatarPicker({ name, avatarUrl, busy, onPick }) {
  const inputRef = useRef(null)
  const initial = (name || 'A').trim().charAt(0).toUpperCase()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
      <div
        style={{
          width: 68,
          height: 68,
          borderRadius: '50%',
          background: avatarUrl ? `center / cover no-repeat url(${avatarUrl})` : 'rgba(232,189,110,0.14)',
          color: '#e8bd6e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 24,
          flexShrink: 0,
          border: '1px solid var(--srd-border-strong)',
        }}
      >
        {!avatarUrl && initial}
      </div>
      <div>
        <button
          type="button"
          className="srd-btn-outline"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          style={{ opacity: busy ? 0.6 : 1 }}
        >
          {busy ? 'Enviando…' : 'Trocar foto'}
        </button>
        <div style={{ fontSize: 12, color: '#8f8577', marginTop: 6 }}>JPG ou PNG, até 5MB.</div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) onPick(file)
          }}
        />
      </div>
    </div>
  )
}

export default function Ajustes() {
  const { configured, user, profile, refreshProfile } = useAuth()

  const [name, setName] = useState(profile?.name || '')
  const [emailNotif, setEmailNotif] = useState(profile?.email_notifications ?? true)
  const [communityNotif, setCommunityNotif] = useState(profile?.community_notifications ?? true)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const email = configured ? user?.email || '' : 'bia@exemplo.com'
  const displayName = configured ? name || profile?.name || '' : name || 'Bia'

  async function handleAvatarPick(file) {
    if (!configured || !user) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Essa imagem passa de 5MB — escolhe uma menor.')
      return
    }
    setAvatarBusy(true)
    setError('')
    try {
      const ext = file.name.split('.').pop().toLowerCase()
      const path = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, cacheControl: '3600' })
      if (uploadError) throw uploadError

      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
      const avatarUrl = `${pub.publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id)
      if (updateError) throw updateError

      await refreshProfile()
    } catch (err) {
      setError('Não consegui salvar a foto: ' + err.message)
    } finally {
      setAvatarBusy(false)
    }
  }

  async function handleSave() {
    if (!configured) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      return
    }
    setSaving(true)
    setError('')
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: name.trim() || profile?.name,
          email_notifications: emailNotif,
          community_notifications: communityNotif,
        })
        .eq('id', user.id)
      if (updateError) throw updateError
      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError('Não consegui salvar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#f5f1ea' }}>Ajustes</div>
        <div style={{ fontSize: 14, color: '#a89f92', marginTop: 4 }}>
          Gerencie seus dados de conta e preferências de notificação.
        </div>
      </div>

      {!configured && (
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
          Modo demonstração: as alterações abaixo não são salvas de verdade.
        </div>
      )}

      <div className="srd-card" style={{ padding: 22, marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#f5f1ea', marginBottom: 16 }}>
          Perfil
        </div>

        {configured && (
          <AvatarPicker name={displayName} avatarUrl={profile?.avatar_url} busy={avatarBusy} onPick={handleAvatarPick} />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nome" value={displayName} onChange={setName} />
          <Field label="E-mail" value={email} onChange={() => {}} type="email" disabled />
        </div>
      </div>

      <div className="srd-card" style={{ padding: 22, marginBottom: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#f5f1ea', marginBottom: 4 }}>
          Notificações
        </div>
        <Toggle
          label="E-mails de novidades"
          description="Avisos sobre novas aulas e atualizações do sistema."
          checked={emailNotif}
          onChange={setEmailNotif}
        />
        <Toggle
          label="Atividade da comunidade"
          description="Curtidas e comentários nas suas publicações."
          checked={communityNotif}
          onChange={setCommunityNotif}
        />
      </div>

      {error && <div style={{ fontSize: 13, color: '#dc8290', marginBottom: 16 }}>{error}</div>}

      <button className="srd-btn-gold" onClick={handleSave} disabled={saving}>
        {saving ? 'Salvando…' : saved ? 'Salvo ✓' : 'Salvar alterações'}
      </button>
    </div>
  )
}
