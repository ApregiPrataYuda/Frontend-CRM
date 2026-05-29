import api from './api'

export const menuServices = {

  async getByUrl(url) {
    const response = await api.get(url)
    return response       
  },

  async show(id) {
    const response = await api.get(`/menu-management-show/${id}`)
    return response        // ← sama
  },

  async create(payload) {
    const response = await api.post('/store-menu-management', payload)
    return response
  },

  async update(id, payload) {
    const response = await api.put(`/update-menu-management/${id}`, payload)
    return response
  },

  async destroy(id) {
    const response = await api.delete(`/delete-menu-management/${id}`)
    return response
  },
}