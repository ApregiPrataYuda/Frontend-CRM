import api from './api'

export const usersManagementServices = {

  // FIX #4 — terima signal AbortController dari store untuk cancel stale request
  async getByUrl(url, signal = null) {
    const config = signal ? { signal } : {}
    const response = await api.get(url, config)
    return response
  },

  async getAll(params = {}) {
    const response = await api.get('/users-management', { params })
    return response
  },

  async show(id) {
    const response = await api.get(`/users-management/show/${id}`)
    return response
  },

  // create — multipart/form-data
  async create(payload) {
    const response = await api.post(
      '/store-users-management',
      payload,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response
  },

  // update — multipart/form-data + method spoofing _method: PUT
  // (Laravel mendukung ini secara default via MethodSpoofing middleware)
  async update(id, payload) {
    const response = await api.post(
      `/update-users-management/${id}`,
      payload,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response
  },

  async destroy(id) {
    const response = await api.delete(`/delete-users-management/${id}`)
    return response
  },

  async getRolesForSelectForm() {
    const response = await api.get('/role-select')
    return response
  },

  async getDivisionsForSelectForm() {
    const response = await api.get('/division-select')
    return response
  },

  async getGroupsForSelectForm() {
    const response = await api.get('/group-select')
    return response
  },

  // ── Atasan (Master User hierarchy) ──
  // excludeId opsional -- dipakai pas Edit User, biar user yang lagi
  // di-edit tidak muncul jadi pilihan atasannya sendiri.
  async getManagersForSelectForm(excludeId = null) {
    const response = await api.get('/manager-select', {
      params: excludeId ? { exclude_id: excludeId } : {},
    })
    return response
  },

  // ── Cabang ──
  async getCabangsForSelectForm() {
    const response = await api.get('/cabang-select')
    return response
  },

  // ── Modal Hirarki User (atasan + rekan setingkat + bawahan) ──
  async getHierarchy(id) {
    const response = await api.get(`/users-management/hierarchy/${id}`)
    return response
  },
}