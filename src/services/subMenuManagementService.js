import api from './api'

export const subMenuManagementService = {

  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  async getAll(params = {}) {
    const response = await api.get('/submenu-management', {
      params,
    })
    return response
  },

  async show(id) {
    const response = await api.get(`/submenu-management-show/${id}`)
    return response
  },

  async create(payload) {
    const response = await api.post('/store-submenu-management', payload)
    return response
  },

  async update(id, payload) {
    const response = await api.put(`/update-submenu-management/${id}`, payload)
    return response
  },

  async destroy(id) {
    const response = await api.delete(`/delete-submenu-management/${id}`)
    return response
  },

  async getMenuForSelectForm() {
    const response = await api.get('/get-menu-for-form')
    return response
  },

  async getSubMenuForSelectForm() {
    const response = await api.get('/submenu-select')
    return response
  },
}