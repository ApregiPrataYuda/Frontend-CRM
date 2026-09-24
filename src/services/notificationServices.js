import api from './api'

// ── Mengikuti pola persis contactTypeService.js/catalogSendService.js:
// getByUrl() generik untuk index (search/sort/pagination dibangun di
// store), lalu action eksplisit sesuai route backend
// (notification_routes.php). ──
export const notificationServices = {

  // ── Admin/Manager side: daftar notifikasi yang pernah dibuat ──
  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  async show(id) {
    const response = await api.get(`/notification-show/${id}`)
    return response
  },

  async create(payload) {
    const response = await api.post('/store-notification', payload)
    return response
  },

  async selectUsers(companyId) {
    const params = companyId ? { company_id: companyId } : {}
    const response = await api.get('/notification-select-users', { params })
    return response
  },

  async selectCompanies() {
    const response = await api.get('/notification-select-companies')
    return response
  },

  async toggleReminderStatus(id) {
    const response = await api.post(`/toggle-reminder-status/${id}`)
    return response
  },

  async destroy(id) {
    const response = await api.delete(`/delete-notification/${id}`)
    return response
  },

  // ── Recipient side: "notifikasi saya" (lonceng & Notification Center) ──
  async myNotifications(url) {
    const response = await api.get(url)
    return response
  },

  async unreadCount() {
    const response = await api.get('/notification-unread-count')
    return response
  },

  async markAsRead(id) {
    const response = await api.post(`/mark-notification-read/${id}`)
    return response
  },

  async markAllAsRead() {
    const response = await api.post('/mark-all-notifications-read')
    return response
  },
}