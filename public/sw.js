// Service worker mínimo — existe só pra o navegador considerar o site
// "instalável" como app no celular (Add to Home Screen / Instalar app).
// De propósito NÃO guarda cache: cada acesso busca a versão mais nova do
// site direto da rede, então nunca fica uma versão antiga presa no celular
// de alguém.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Em certas situações (pré-carregamento interno do navegador) o Chrome faz
  // uma requisição especial com esses parâmetros, que não pode ser repassada
  // direto pro fetch() — se a gente tentar, a página inteira falha com
  // ERR_FAILED. Aqui a gente ignora esse tipo de requisição (deixa o
  // navegador cuidar dela do jeito normal, sem passar pelo service worker).
  if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
    return
  }

  // Repassa pra rede normalmente; se der erro de rede mesmo, deixa a
  // requisição falhar do jeito nativo do navegador em vez de travar tudo.
  event.respondWith(
    fetch(event.request).catch(() => new Response('', { status: 503, statusText: 'offline' }))
  )
})

// Notificação push de verdade (aparece na tela do celular/notificações do
// sistema, mesmo com o site fechado) — quem envia é api/send-push.js.
self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch (e) {
    payload = { title: 'Mentoria Império', body: event.data ? event.data.text() : '' }
  }

  const title = payload.title || 'Mentoria Império'
  const options = {
    body: payload.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: payload.url || '/comunidade' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Ao tocar na notificação: se já tiver uma aba do site aberta, foca nela
// (e manda pra URL certa); senão abre uma nova.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) client.navigate(url)
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
