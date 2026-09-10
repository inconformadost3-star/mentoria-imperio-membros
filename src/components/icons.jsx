// Ícones de linha usados na sidebar e nas telas — SVG inline, sem dependência externa.

const base = {
  fill: 'none',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconFerramenta({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="m14.5 9.5-2 5-5 2 2-5 5-2Z" />
    </svg>
  )
}

export function IconComunidade({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="7" r="2.4" />
      <path d="M15.5 14.2c2.6.4 4.5 2.7 4.5 5.8" />
    </svg>
  )
}

export function IconAulas({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <path d="M4 5.5c2.5-1.3 5.5-1.3 8 0 2.5-1.3 5.5-1.3 8 0v13c-2.5-1.3-5.5-1.3-8 0-2.5-1.3-5.5-1.3-8 0Z" />
      <path d="M12 5.5v13" />
    </svg>
  )
}

export function IconSuporte({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <path d="M4 12a8 8 0 1 1 3 6.2L4 19l.8-3A7.96 7.96 0 0 1 4 12Z" />
      <circle cx="9" cy="12" r="0.9" fill={color} stroke="none" />
      <circle cx="12" cy="12" r="0.9" fill={color} stroke="none" />
      <circle cx="15" cy="12" r="0.9" fill={color} stroke="none" />
    </svg>
  )
}

export function IconAjustes({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V20a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H4a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.6V4a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.6 1H20a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1Z" />
    </svg>
  )
}

export function IconChevronLeft({ size = 15, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <path d="m15 6-6 6 6 6" />
    </svg>
  )
}

export function IconPlus({ size = 15, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconSend({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} fill="none" {...base}>
      <path d="M4 12 20 4l-6 16-3-7-7-3Z" />
    </svg>
  )
}

export function IconPlay({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  )
}

export function IconHeart({ size = 15, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <path d="M12 20.5s-7.5-4.6-9.5-9.3C1.2 8 3 5 6.3 5c2 0 3.4 1.1 4.2 2.4C11.3 6.1 12.7 5 14.7 5c3.3 0 5.1 3 3.8 6.2-2 4.7-9.5 9.3-9.5 9.3Z" />
    </svg>
  )
}

export function IconExternal({ size = 12, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  )
}

export function IconComment({ size = 15, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <path d="M4 5h16v11H8l-4 4V5Z" />
    </svg>
  )
}

export function IconAdmin({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <path d="M12 3.5 5 6.5v5c0 4.6 3 8 7 9 4-1 7-4.4 7-9v-5l-7-3Z" />
      <path d="m9 12 2 2 4-4.2" />
    </svg>
  )
}

export function IconMore({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  )
}

export function IconLogout({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

export function IconTrash({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" />
    </svg>
  )
}
