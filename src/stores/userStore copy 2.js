import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { useToast } from 'vue-toastification'
import { usersManagementServices } from '@/services/userManagementService'

export const useUserStore = defineStore('userStore', () => {

  const toast = useToast()

  // ─────────────────────────────────────────────
  // STATE — Tabel Utama
  // ─────────────────────────────────────────────
  const usersData    = ref([])
  const loadingUsers = ref(false)
  const searchUsers  = ref('')

  // FIX #1 — searchTimeout pakai ref agar bisa di-clear dari luar (cegah memory leak)
  const searchTimeout = ref(null)

  // FIX #4 — AbortController untuk cancel stale request (cegah race condition)
  let abortController = null

  // ─────────────────────────────────────────────
  // STATE — CRUD Loading
  // ─────────────────────────────────────────────
  const savingUser   = ref(false)
  const updatingUser = ref(false)
  const deletingUser = ref(false)
  const errorUser    = ref(null)

  // ─────────────────────────────────────────────
  // STATE — Detail
  // ─────────────────────────────────────────────
  const userDetail    = ref(null)
  const loadingDetail = ref(false)

  // ─────────────────────────────────────────────
  // STATE — Select Options Form
  // ─────────────────────────────────────────────
  const rolesOptions     = ref([])
  const divisionsOptions = ref([])
  const groupsOptions    = ref([])
  const loadingOptions   = ref(false)

  // Status statis untuk dropdown is_active
  const statusStatis = ref([
    { value: 1, label: 'Aktif' },
    { value: 0, label: 'Non-Aktif' },
  ])

  // ─────────────────────────────────────────────
  // STATE — Pagination & Sort
  // ─────────────────────────────────────────────
  const pagination = reactive({
    current_page:  1,
    per_page:      10,
    prev_page_url: null,
    next_page_url: null,
    last_page:     1,
    total:         0,
  })

  const sort = reactive({
    column:    'created_at',
    direction: 'desc',
  })

  const allowedSortColumns = ['fullname', 'email', 'created_at']

  // ─────────────────────────────────────────────
  // BUILD URL
  // ─────────────────────────────────────────────
  const buildUrl = () => {
    const params = new URLSearchParams()
    if (searchUsers.value)       params.append('search',   searchUsers.value)
    if (pagination.current_page) params.append('page',     pagination.current_page)
    if (pagination.per_page)     params.append('per_page', pagination.per_page)
    if (sort.column) {
      params.append('sort_by',  sort.column)
      params.append('sort_dir', sort.direction)
    }
    return `/users-management?${params.toString()}`
  }

  // ─────────────────────────────────────────────
  // FETCH USERS
  // FIX #4 — AbortController: cancel request lama sebelum kirim yang baru
  // ─────────────────────────────────────────────
  const fetchUsers = async (url = null) => {
    // Batalkan request sebelumnya jika masih pending
    if (abortController) {
      abortController.abort()
    }
    abortController = new AbortController()

    loadingUsers.value = true
    try {
      const finalUrl = url || buildUrl()
      const response = await usersManagementServices.getByUrl(finalUrl, abortController.signal)
      const result   = response.data

      // FIX #3 — assignment langsung, lebih idiomatis daripada splice
      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      usersData.value = dataArray

      const pag = result.pagination ?? result.data?.pagination
      if (pag) {
        pagination.current_page  = pag.current_page
        pagination.per_page      = pag.per_page
        pagination.prev_page_url = pag.prev_page_url
        pagination.next_page_url = pag.next_page_url
        pagination.last_page     = pag.last_page
        pagination.total         = pag.total
      }
    } catch (error) {
      // FIX #4 — abaikan error dari request yang sengaja dibatalkan
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') return
      console.error('Gagal fetch users:', error)
      toast.error('Gagal memuat data user')
    } finally {
      loadingUsers.value = false
    }
  }

  // ─────────────────────────────────────────────
  // SEARCH WITH DELAY
  // FIX #1 — gunakan searchTimeout.value agar bisa di-clear dari onUnmounted
  // ─────────────────────────────────────────────
  const searchWithDelay = (val) => {
    if (searchTimeout.value) clearTimeout(searchTimeout.value)
    if (val !== undefined) searchUsers.value = val
    pagination.current_page = 1
    searchTimeout.value = setTimeout(() => {
      fetchUsers(buildUrl())
    }, 500)
  }

  // FIX #1 — fungsi cleanup, dipanggil dari onUnmounted di view
  const clearSearchTimeout = () => {
    if (searchTimeout.value) {
      clearTimeout(searchTimeout.value)
      searchTimeout.value = null
    }
    // Juga batalkan request yang masih pending
    if (abortController) {
      abortController.abort()
      abortController = null
    }
  }

  // ─────────────────────────────────────────────
  // CHANGE PAGE SIZE
  // ─────────────────────────────────────────────
  const changePageSize = () => {
    pagination.current_page = 1
    fetchUsers(buildUrl())
  }

  // ─────────────────────────────────────────────
  // SORTING
  // ─────────────────────────────────────────────
  const changeSorting = () => {
    pagination.current_page = 1
    fetchUsers(buildUrl())
  }

  const toggleSort = (col) => {
    if (!allowedSortColumns.includes(col)) return
    if (sort.column === col) {
      sort.direction = sort.direction === 'asc' ? 'desc' : 'asc'
    } else {
      sort.column    = col
      sort.direction = 'asc'
    }
    changeSorting()
  }

  // ─────────────────────────────────────────────
  // RESET FILTERS
  // ─────────────────────────────────────────────
  const resetFilters = () => {
    searchUsers.value       = ''
    pagination.current_page = 1
    pagination.per_page     = 10
    sort.column             = 'created_at'
    sort.direction          = 'desc'
    fetchUsers(buildUrl())
  }

  // ─────────────────────────────────────────────
  // FETCH OPTIONS FORM (role, division, group)
  // ─────────────────────────────────────────────
  const fetchFormOptions = async () => {
    loadingOptions.value = true
    try {
      const [rolesRes, divisionsRes, groupsRes] = await Promise.all([
        usersManagementServices.getRolesForSelectForm(),
        usersManagementServices.getDivisionsForSelectForm(),
        usersManagementServices.getGroupsForSelectForm(),
      ])
      rolesOptions.value     = rolesRes.data?.data     ?? rolesRes.data     ?? []
      divisionsOptions.value = divisionsRes.data?.data ?? divisionsRes.data ?? []
      groupsOptions.value    = groupsRes.data?.data    ?? groupsRes.data    ?? []
    } catch (error) {
      console.error('Gagal fetch form options:', error)
      toast.error('Gagal memuat opsi form')
    } finally {
      loadingOptions.value = false
    }
  }

  // ─────────────────────────────────────────────
  // FETCH DETAIL
  // ─────────────────────────────────────────────
  const fetchUserDetail = async (id) => {
    loadingDetail.value = true
    userDetail.value    = null
    try {
      const response   = await usersManagementServices.show(id)
      userDetail.value = response.data?.data ?? response.data
      return userDetail.value
    } catch (error) {
      console.error('Gagal fetch detail user:', error)
      toast.error('Gagal memuat detail user')
      return null
    } finally {
      loadingDetail.value = false
    }
  }

  // ─────────────────────────────────────────────
  // HELPER — Build FormData
  // ─────────────────────────────────────────────
  const buildFormData = (payload, isUpdate = false) => {
    const fd = new FormData()
    if (isUpdate) fd.append('_method', 'PUT')

    Object.entries(payload).forEach(([key, value]) => {
      if (value === null || value === undefined) return
      if (value instanceof File) {
        fd.append(key, value)
      } else if (typeof value === 'boolean') {
        fd.append(key, value ? '1' : '0')
      } else {
        fd.append(key, value)
      }
    })
    return fd
  }

  // ─────────────────────────────────────────────
  // FIX #2 — clearFieldError: clear error hanya untuk field tertentu
  // ─────────────────────────────────────────────
  const clearFieldError = (field) => {
    if (!errorUser.value) return
    const updated = { ...errorUser.value }
    delete updated[field]
    errorUser.value = Object.keys(updated).length ? updated : null
  }

  // ─────────────────────────────────────────────
  // CREATE USER
  // ─────────────────────────────────────────────
  const saveUser = async (payload) => {
    savingUser.value = true
    errorUser.value  = null
    try {
      const fd = buildFormData(payload, false)
      await usersManagementServices.create(fd)
      await fetchUsers(buildUrl())
      return true
    } catch (error) {
      if (error.response?.status === 422) {
        errorUser.value = error.response.data.errors
      } else {
        toast.error(error.response?.data?.message ?? 'Gagal menyimpan user')
      }
      return false
    } finally {
      savingUser.value = false
    }
  }

  // ─────────────────────────────────────────────
  // UPDATE USER
  // ─────────────────────────────────────────────
  const updateUser = async (id, payload) => {
    updatingUser.value = true
    errorUser.value    = null
    try {
      const fd = buildFormData(payload, true)
      await usersManagementServices.update(id, fd)
      await fetchUsers(buildUrl())
      return true
    } catch (error) {
      if (error.response?.status === 422) {
        errorUser.value = error.response.data.errors
      } else {
        toast.error(error.response?.data?.message ?? 'Gagal mengupdate user')
      }
      return false
    } finally {
      updatingUser.value = false
    }
  }

  // ─────────────────────────────────────────────
  // DELETE USER
  // ─────────────────────────────────────────────
  const deleteUser = async (id) => {
    deletingUser.value = true
    try {
      await usersManagementServices.destroy(id)
      await fetchUsers(buildUrl())
      return true
    } catch (error) {
      console.error('Gagal delete user:', error)
      toast.error(error.response?.data?.message ?? 'Gagal menghapus user')
      return false
    } finally {
      deletingUser.value = false
    }
  }

  // ─────────────────────────────────────────────
  // FORMAT DATE
  // ─────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Belum pernah diupdate'
    return date.toLocaleDateString('id-ID', {
      year:  'numeric',
      month: 'long',
      day:   '2-digit',
    })
  }

  // ─────────────────────────────────────────────
  // FORMAT IMAGE URL
  // ─────────────────────────────────────────────
  const formatImageUrl = (path) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    const base = import.meta.env.VITE_BASE_URL ?? 'http://127.0.0.1:8000'
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base
    return `${cleanBase}/storage/users/${path}`
  }

  // ─────────────────────────────────────────────
  // GET IMAGE URL — dengan fallback avatar ui-avatars
  // ─────────────────────────────────────────────
  const getImageUrl = (image, fullname = 'User') => {
    if (!image || image === 'default.png') {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullname)}&background=6366f1&color=fff&size=80`
    }
    if (image.startsWith('http')) return image
    const base = import.meta.env.VITE_BASE_URL ?? 'http://127.0.0.1:8000'
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base
    return `${cleanBase}/storage/users/${image}`
  }

  // ─────────────────────────────────────────────
  // EXPORTS
  // ─────────────────────────────────────────────
  return {
    usersData,
    loadingUsers,
    searchUsers,
    pagination,
    sort,
    savingUser,
    updatingUser,
    deletingUser,
    errorUser,
    userDetail,
    loadingDetail,
    rolesOptions,
    divisionsOptions,
    groupsOptions,
    loadingOptions,
    statusStatis,
    fetchUsers,
    buildUrl,
    searchWithDelay,
    clearSearchTimeout,   // FIX #1 — expose untuk onUnmounted
    changePageSize,
    changeSorting,
    toggleSort,
    resetFilters,
    fetchFormOptions,
    fetchUserDetail,
    clearFieldError,      // FIX #2 — expose per-field error clear
    saveUser,
    updateUser,
    deleteUser,
    formatDate,
    formatImageUrl,
    getImageUrl,
    buildFormData,
  }
})