import api from './api'

export const cabangServices = {

  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  async show(id) {
    const response = await api.get(`/master-cabang-show/${id}`)
    return response
  },

  async create(payload) {
    const response = await api.post('/master-cabang-store', payload)
    return response
  },

  async update(id, payload) {
    const response = await api.put(`/master-cabang-update/${id}`, payload)
    return response
  },

  async destroy(id) {
    const response = await api.delete(`/master-cabang-delete/${id}`)
    return response
  },
}