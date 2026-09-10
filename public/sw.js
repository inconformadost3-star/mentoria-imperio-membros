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
  event.respondWith(fetch(event.request))
})
