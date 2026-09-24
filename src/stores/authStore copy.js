import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService }        from '@/services/authServices'
import { useSidebarStore }    from '@/stores/sidebarStore'
import { usePermissionStore } from '@/stores/PermissionStore'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {

  // =========================================
  // STATE
  // =========================================
  const user     = ref(JSON.parse(localStorage.getItem('user')) || null)
  const token    = ref(localStorage.getItem('token') || null)
  const redirectUrl    = ref(null)
  const loading        = ref(false)
  const error          = ref(null)
  const successMessage = ref(null)

  // =========================================
  // COMPUTED
  // =========================================
  const isLoggedIn = computed(() => !!token.value)
  const userName   = computed(() => user.value?.fullname || '')
  const roleId     = computed(() => user.value?.role_id || null)
  const isAdmin    = computed(() => roleId.value === 1)
  const isSales    = computed(() => roleId.value === 2)
  const isManager  = computed(() => roleId.value === 3)

  // =========================================
  // FETCH ME
  // =========================================
  async function fetchMe() {
    try {
      const data = await authService.me()
      const u    = data.user

      const normalizedUser = {
        id:       u.id || u.id_user,
        role_id:  u.role_id,
        username: u.username,
        fullname: u.fullname,
        ...u
      }

      user.value = normalizedUser
      localStorage.setItem('user', JSON.stringify(normalizedUser))

    } catch (err) {
      console.error(err)
      throw err
    }
  }

  // =========================================
  // LOGIN
  // =========================================
  async function login(credentials) {
    loading.value = true
    error.value   = null

    try {
      const data = await authService.login(credentials)

      token.value       = data.access_token
      redirectUrl.value = '/app' + data.redirect_url
      localStorage.setItem('token', data.access_token)

      await fetchMe()

      // Login → selalu fetch sidebar & permission baru
      const sidebarStore    = useSidebarStore()
      const permissionStore = usePermissionStore()

      await Promise.all([
        sidebarStore.fetchMenus(user.value.role_id, user.value.id),
        permissionStore.fetchPermissions(user.value.id),
      ])

      return data

    } catch (err) {
      error.value = err.response?.data?.message || 'Login gagal'
      throw err
    } finally {
      loading.value = false
    }
  }

  // =========================================
  // LOGOUT
  // =========================================
  async function logout() {
    try {
      await authService.logout()
    } catch (err) {
      console.error(err)
    } finally {
      const sidebarStore    = useSidebarStore()
      const permissionStore = usePermissionStore()

      sidebarStore.clearMenus()
      permissionStore.clearPermissions()

      token.value       = null
      user.value        = null
      redirectUrl.value = null

      localStorage.removeItem('token')
      localStorage.removeItem('user')

      router.push('/login')
    }
  }

  // =========================================
  // HYDRATE — dipanggil saat refresh halaman
  // =========================================
  async function hydrate() {
    if (!token.value) return

    try {
      await fetchMe()

      // Skip fetchMenus jika sidebar sudah ada di cache
      const sidebarStore    = useSidebarStore()
      const permissionStore = usePermissionStore()

      await Promise.all([
        // Sidebar — skip jika cache masih ada
        sidebarStore.sections.length
          ? Promise.resolve()
          : sidebarStore.fetchMenus(user.value.role_id, user.value.id),

        // Permission — skip jika cache masih ada
        Object.keys(permissionStore.permissions).length
          ? Promise.resolve()
          : permissionStore.fetchPermissions(user.value.id),
      ])

    } catch (err) {
      await logout()
    }
  }

  // =========================================
  // FORGOT PASSWORD
  // =========================================
  async function forgotPassword(payload) {
    loading.value        = true
    error.value          = null
    successMessage.value = null

    try {
      const response       = await authService.forgotPassword(payload)
      successMessage.value = response.message
      return response
    } catch (err) {
      error.value = err.response?.data?.message || 'Gagal kirim email reset password'
      throw err
    } finally {
      loading.value = false
    }
  }

  // =========================================
  // RESET PASSWORD
  // =========================================
  async function resetPassword(payload) {
    loading.value        = true
    error.value          = null
    successMessage.value = null

    try {
      const response       = await authService.resetPassword(payload)
      successMessage.value = response.message
      return response
    } catch (err) {
      error.value = err.response?.data?.message || 'Gagal reset password'
      throw err
    } finally {
      loading.value = false
    }
  }

  // =========================================
  // RETURN
  // =========================================
  return {
    // State
    user, token, redirectUrl,
    loading, error, successMessage,

    // Computed
    isLoggedIn, userName, roleId,
    isAdmin, isSales, isManager,

    // Actions
    login, logout, fetchMe, hydrate,
    forgotPassword, resetPassword,
  }
})