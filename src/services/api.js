// // src/services/api.js
// import axios from 'axios'

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL,
//   headers: {
//     'Content-Type': 'application/json',
//     'Accept':       'application/json',
//   }
// })

// api.interceptors.request.use(config => {
//   const token = localStorage.getItem('token') // ← sesuai authStore kamu
//   if (token) config.headers.Authorization = `Bearer ${token}`
//   return config
// })

// api.interceptors.response.use(
//   res => res,
//   err => {
//     if (err.response?.status === 401) {
//       localStorage.removeItem('token')
//       localStorage.removeItem('user')
//       window.location.href = '/login'
//     }
//     return Promise.reject(err)
//   }
// )

// export default api


// src/services/api.js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  }
})

// Request interceptor — tambah token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — handle 401
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {

      // Bersihkan localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('sidebar_sections')
      localStorage.removeItem('permissions')

      // Bersihkan Pinia state
      try {
        const { useAuthStore }       = await import('@/stores/authStore')
        const { useSidebarStore }    = await import('@/stores/sidebarStore')
        const { usePermissionStore } = await import('@/stores/PermissionStore')

        const authStore       = useAuthStore()
        const sidebarStore    = useSidebarStore()
        const permissionStore = usePermissionStore()

        authStore.user        = null
        authStore.token       = null
        authStore.redirectUrl = null

        sidebarStore.clearMenus()
        permissionStore.clearPermissions()

      } catch (e) {
        console.error('[api.js]', e)
      }

      // Toast sebelum redirect
      try {
        const { useToast } = await import('vue-toastification')
        const toast = useToast()
        toast.error('Sesi Anda telah berakhir, silakan login kembali.')
      } catch {}

      // Delay agar toast sempat tampil lalu redirect
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
    }

    return Promise.reject(err)
  }
)

export default api