import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { notificationServices } from '@/services/notificationServices'

// ── Store fitur Notification (Bulk & Reminder, Phase A). Mengikuti pola
// persis contactTypeStore.js untuk bagian admin-side (list notifikasi
// yang pernah dibuat), plus bagian recipient-side ("notifikasi saya")
// untuk lonceng & Notification Center yang dipakai semua role. ──
export const useNotificationStore = defineStore('notification', () => {

  // ═══════════════════════════════════════════
  // ADMIN/MANAGER SIDE -- daftar notifikasi yang pernah dibuat
  // ═══════════════════════════════════════════
  const notificationsData = ref([])
  const loadingNotifications = ref(false)
  const searchNotifications = ref('')
  let searchTimeout = null

  const savingNotification = ref(false)
  const togglingReminder = ref(false)
  const deletingNotification = ref(false)
  const errorNotification = ref(null)

  const pagination = reactive({
    current_page: 1,
    per_page: 10,
    prev_page_url: null,
    next_page_url: null,
    last_page: 1,
    total: 0,
  })

  const sort = reactive({
    column: 'created_at',
    direction: 'desc',
  })

  const filters = reactive({
    category: '', // '' | 'bulk' | 'reminder' | 'agenda'
    mine: false,  // true = cuma notifikasi/reminder milik user login sendiri
  })

  // ── dropdown user untuk target='specific' ──
  const userOptions = ref([])
  const loadingUserOptions = ref(false)

  // ── filter company (group_companies) buat mempersempit list user di
  // atas -- selectedCompanyFilter dibaca langsung oleh fetchUserOptions,
  // jadi ganti nilainya lalu panggil ulang fetchUserOptions() dari
  // component (lihat NotificationCenter.vue). ──
  const companyOptions = ref([])
  const loadingCompanyOptions = ref(false)
  const selectedCompanyFilter = ref('') // '' = semua company

  const fetchCompanyOptions = async () => {
    loadingCompanyOptions.value = true
    try {
      const response = await notificationServices.selectCompanies()
      const result = response.data
      const dataArray = Array.isArray(result.data) ? result.data : []
      companyOptions.value.splice(0, companyOptions.value.length, ...dataArray)
    } catch (error) {
      console.error('Gagal fetch daftar company:', error)
    } finally {
      loadingCompanyOptions.value = false
    }
  }

  const fetchUserOptions = async () => {
    loadingUserOptions.value = true
    try {
      const response = await notificationServices.selectUsers(selectedCompanyFilter.value || null)
      const result = response.data
      const dataArray = Array.isArray(result.data) ? result.data : []
      userOptions.value.splice(0, userOptions.value.length, ...dataArray)
    } catch (error) {
      console.error('Gagal fetch daftar user:', error)
    } finally {
      loadingUserOptions.value = false
    }
  }

  const buildUrl = () => {
    const params = new URLSearchParams()

    if (searchNotifications.value) params.append('search', searchNotifications.value)
    if (filters.category) params.append('category', filters.category)
    if (filters.mine) params.append('mine', 'true')
    if (pagination.current_page) params.append('page', pagination.current_page)
    if (pagination.per_page) params.append('per_page', pagination.per_page)
    if (sort.column) {
      params.append('sort_by', sort.column)
      params.append('sort_dir', sort.direction)
    }

    return `/notification?${params.toString()}`
  }

  const fetchNotifications = async (url = null) => {
    loadingNotifications.value = true

    try {
      const finalUrl = url || buildUrl()
      const response = await notificationServices.getByUrl(finalUrl)
      const result = response.data

      const dataArray = Array.isArray(result.data) ? result.data : result.data?.data ?? []
      notificationsData.value.splice(0, notificationsData.value.length, ...dataArray)

      const pag = result.pagination ?? result.data?.pagination
      if (pag) {
        pagination.current_page = pag.current_page
        pagination.per_page = pag.per_page
        pagination.prev_page_url = pag.prev_page_url
        pagination.next_page_url = pag.next_page_url
        pagination.last_page = pag.last_page
        pagination.total = pag.total
      }
    } catch (error) {
      console.error('Gagal fetch notifications:', error)
    } finally {
      loadingNotifications.value = false
    }
  }

  const searchWithDelay = () => {
    clearTimeout(searchTimeout)
    pagination.current_page = 1
    searchTimeout = setTimeout(() => fetchNotifications(buildUrl()), 500)
  }

  const changePageSize = () => {
    pagination.current_page = 1
    fetchNotifications(buildUrl())
  }

  const changeSorting = () => {
    pagination.current_page = 1
    fetchNotifications(buildUrl())
  }

  const changeFilters = () => {
    pagination.current_page = 1
    fetchNotifications(buildUrl())
  }

  const resetFilters = () => {
    searchNotifications.value = ''
    filters.category = ''
    pagination.current_page = 1
    pagination.per_page = 10
    sort.column = 'created_at'
    sort.direction = 'desc'
    fetchNotifications(buildUrl())
  }

  const clearFieldError = (field) => {
    if (!errorNotification.value) return
    const updated = { ...errorNotification.value }
    delete updated[field]
    errorNotification.value = Object.keys(updated).length ? updated : null
  }

  // ── CREATE (Bulk / Reminder) ──
  const saveNotification = async (payload) => {
    savingNotification.value = true
    errorNotification.value = null

    try {
      await notificationServices.create(payload)
      await fetchNotifications(buildUrl())
      return true
    } catch (error) {
      if (error.response?.status === 422) {
        errorNotification.value = error.response.data.errors
      } else {
        errorNotification.value = { _general: [error.response?.data?.message ?? 'Gagal menyimpan notifikasi'] }
      }
      return false
    } finally {
      savingNotification.value = false
    }
  }

  // ── nyala/mati-kan reminder (tidak menghapus definisinya) ──
  const toggleReminderStatus = async (id) => {
    togglingReminder.value = true

    try {
      await notificationServices.toggleReminderStatus(id)
      await fetchNotifications(buildUrl())
      return true
    } catch (error) {
      console.error('Gagal toggle status reminder:', error)
      return false
    } finally {
      togglingReminder.value = false
    }
  }

  const deleteNotification = async (id) => {
    deletingNotification.value = true

    try {
      await notificationServices.destroy(id)
      await fetchNotifications(buildUrl())
      return { ok: true }
    } catch (error) {
      console.error('Gagal delete notification:', error)
      return { ok: false, message: error.response?.data?.message ?? 'Gagal menghapus notifikasi' }
    } finally {
      deletingNotification.value = false
    }
  }

  // ═══════════════════════════════════════════
  // RECIPIENT SIDE -- "notifikasi saya" (lonceng & Notification Center)
  // ═══════════════════════════════════════════
  const myNotificationsData = ref([])
  const loadingMyNotifications = ref(false)
  const unreadCount = ref(0)

  const myPagination = reactive({
    current_page: 1,
    per_page: 10,
    prev_page_url: null,
    next_page_url: null,
    last_page: 1,
    total: 0,
  })

  const myFilters = reactive({
    is_read: '', // '' | 'true' | 'false'
  })

  const buildMyUrl = () => {
    const params = new URLSearchParams()
    params.append('page', myPagination.current_page)
    params.append('per_page', myPagination.per_page)
    if (myFilters.is_read !== '') params.append('is_read', myFilters.is_read)
    return `/my-notifications?${params.toString()}`
  }

  const fetchMyNotifications = async (url = null) => {
    loadingMyNotifications.value = true

    try {
      const finalUrl = url || buildMyUrl()
      const response = await notificationServices.myNotifications(finalUrl)
      const result = response.data

      const dataArray = Array.isArray(result.data) ? result.data : result.data?.data ?? []
      myNotificationsData.value.splice(0, myNotificationsData.value.length, ...dataArray)

      const pag = result.pagination ?? result.data?.pagination
      if (pag) {
        myPagination.current_page = pag.current_page
        myPagination.per_page = pag.per_page
        myPagination.prev_page_url = pag.prev_page_url
        myPagination.next_page_url = pag.next_page_url
        myPagination.last_page = pag.last_page
        myPagination.total = pag.total
      }
    } catch (error) {
      console.error('Gagal fetch notifikasi saya:', error)
    } finally {
      loadingMyNotifications.value = false
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationServices.unreadCount()
      unreadCount.value = response.data?.data?.unread_count ?? 0
    } catch (error) {
      console.error('Gagal fetch unread count:', error)
    }
  }

  const markAsRead = async (recipientId) => {
    try {
      await notificationServices.markAsRead(recipientId)

      const item = myNotificationsData.value.find((n) => n.id === recipientId)
      if (item && !item.is_read) {
        item.is_read = true
        item.read_at = new Date().toISOString()
        if (unreadCount.value > 0) unreadCount.value -= 1
      }
      return true
    } catch (error) {
      console.error('Gagal mark as read:', error)
      return false
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationServices.markAllAsRead()
      myNotificationsData.value.forEach((n) => { n.is_read = true })
      unreadCount.value = 0
      return true
    } catch (error) {
      console.error('Gagal mark all as read:', error)
      return false
    }
  }

  // ── Dipanggil dari listener Echo (lihat @/services/echo.js) tiap kali
  // event NotificationCreated diterima real-time -- taruh di paling atas
  // list & naikkan badge, tanpa perlu re-fetch dari server. ──
  const pushRealtimeNotification = (payload) => {
    unreadCount.value += 1
    myNotificationsData.value.unshift({
      id: payload.recipient_id ?? `tmp-${Date.now()}`,
      notification_id: payload.id,
      category: payload.category,
      reminder_type: payload.reminder_type,
      title: payload.title,
      message: payload.message,
      related_type: payload.related_type,
      related_id: payload.related_id,
      is_read: false,
      read_at: null,
      created_at: payload.created_at,
    })
  }

  return {
    // admin side
    notificationsData,
    loadingNotifications,
    searchNotifications,
    pagination,
    sort,
    filters,
    userOptions,
    loadingUserOptions,
    fetchUserOptions,
    companyOptions,
    loadingCompanyOptions,
    selectedCompanyFilter,
    fetchCompanyOptions,
    savingNotification,
    togglingReminder,
    deletingNotification,
    errorNotification,

    fetchNotifications,
    buildUrl,
    searchWithDelay,
    changePageSize,
    changeSorting,
    changeFilters,
    resetFilters,
    clearFieldError,
    saveNotification,
    toggleReminderStatus,
    deleteNotification,

    // recipient side
    myNotificationsData,
    loadingMyNotifications,
    unreadCount,
    myPagination,
    myFilters,

    fetchMyNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    pushRealtimeNotification,
  }
})