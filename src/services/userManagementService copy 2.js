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
}