import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import api from '@/services/api'
import { useNotificationStore } from '@/stores/notificationStore'
import { useToast } from 'vue-toastification'

// ═══════════════════════════════════════════════════════════════════
// Endpoint otorisasi channel (`/broadcasting/auth`) di-daftarkan lewat
// `->withBroadcasting()` di bootstrap/app.php dengan `'prefix' => 'api'`
// + `'middleware' => ['jwt.auth']` -- jadi endpoint-nya sekarang
// `/api/broadcasting/auth`, PAS sama axios instance `api` (baseURL-nya
// sudah termasuk /api) yang dipakai di authorize() bawah. Interceptor
// auth Bearer token yang sudah ada di api.js otomatis ke-attach juga
// ke request ini, sama seperti request API lain -- tidak perlu axios
// terpisah.
//
// ⚠️ SATU HAL YANG MASIH PERLU DITAMBAHKAN MANUAL DI .ENV FRONTEND:
// VITE_REVERB_APP_KEY, VITE_REVERB_HOST, VITE_REVERB_PORT,
// VITE_REVERB_SCHEME -- isi sesuai .env backend hasil
// `php artisan reverb:install` (REVERB_APP_KEY/HOST/PORT/SCHEME),
// tinggal ditambah prefix VITE_ supaya kebaca Vite.
// ═══════════════════════════════════════════════════════════════════

window.Pusher = Pusher

let echoInstance = null

// ── Panggil sekali setelah user login berhasil (mis. di authStore
// setelah fetchMe() sukses), dan disconnectEcho() saat logout. ──
export function initEcho(currentUserId) {
  if (echoInstance) return echoInstance

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
    enabledTransports: ['ws', 'wss'],

    // ── custom authorizer: JWT bukan cookie/session, jadi Echo bawaan
    // tidak otomatis nempelin token -- pakai axios instance `api` yang
    // sudah ada interceptor auth-nya, jalan ke /api/broadcasting/auth
    // (lihat catatan di atas). ──
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        api.post('/broadcasting/auth', {
          socket_id: socketId,
          channel_name: channel.name,
        })
          .then((response) => callback(false, response.data))
          .catch((error) => callback(true, error))
      },
    }),
  })

  if (currentUserId) {
    listenNotifications(currentUserId)
  }

  return echoInstance
}

// ── Dengerin channel private notifications.{id_user} milik user yang
// login -- begitu event NotificationCreated masuk, dorong ke store
// (badge + list) dan tampilkan toast, mirip notifikasi WA. ──
export function listenNotifications(userId) {
  if (!echoInstance || !userId) return

  const notificationStore = useNotificationStore()
  const toast = useToast()

  echoInstance
    .private(`notifications.${userId}`)
    .listen('NotificationCreated', (payload) => {
      notificationStore.pushRealtimeNotification(payload)
      toast.info(`${payload.title}`, { timeout: 6000 })
    })
}

export function disconnectEcho() {
  if (echoInstance) {
    echoInstance.disconnect()
    echoInstance = null
  }
}

export function getEcho() {
  return echoInstance
}