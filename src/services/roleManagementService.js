import api from './api'

export const roleServices = {

  async getByUrl(url) {
    const response = await api.get(url)
    return response       
  },

  async show(id) {
    const response = await api.get(`/role-management-show/${id}`)
    return response     
  },

  async create(payload) {
    const response = await api.post('/store-role-management', payload)
    return response
  },

  async update(id, payload) {
    const response = await api.put(`/update-role-management/${id}`, payload)
    return response
  },

  async destroy(id) {
    const response = await api.delete(`/delete-role-management/${id}`)
    return response
  },
}