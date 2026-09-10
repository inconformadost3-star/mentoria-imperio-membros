// Notificações push de verdade — aparecem na tela do celular junto com as
// outras notificações do sistema, mesmo com o app fechado (funciona no PWA
// instalado via "Adicionar à tela de início"). Precisa de HTTPS e de o
// navegador suportar Push API (todos os principais suportam, incluindo
// Safari do iOS a partir da versão instalada como app na tela de início).
import { supabase } from './supabaseClient.js'

export function isPushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
}

// Converte a chave pública VAPID (base64 URL-safe) pro formato que a Push
// API pede (Uint8Array) — conversão padrão recomendada pela documentação
// da Push API, nada específico deste projeto.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Descobre se esse aparelho/navegador já está inscrito pra push (usado pra
// já marcar o botão/toggle como ligado ao carregar a tela).
export async function getExistingPushSubscription() {
  if (!isPushSupported()) return null
  try {
    const reg = await navigator.serviceWorker.ready
    return await reg.pushManager.getSubscription()
  } catch (e) {
    return null
  }
}

// Pede permissão e inscreve esse aparelho pra receber push, salvando a
// inscrição no Supabase (é ela que api/send-push.js usa pra saber pra quem
// mandar). Retorna { ok: true } ou { ok: false, reason }.
export async function subscribeToPush(userId) {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' }

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!vapidKey) return { ok: false, reason: 'not-configured' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, reason: 'denied' }

  try {
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
    }

    const json = sub.toJSON()
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
      { onConflict: 'endpoint' }
    )
    if (error) return { ok: false, reason: error.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, reason: err.message }
  }
}

// Desliga as notificações push nesse aparelho e remove a inscrição salva.
export async function unsubscribeFromPush() {
  if (!isPushSupported()) return
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return
    const endpoint = sub.endpoint
    await sub.unsubscribe()
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  } catch (e) {
    // silencioso — pior caso, a inscrição antiga só para de funcionar
  }
}
