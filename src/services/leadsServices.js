import api from './api'

export const masterLeadsServices = {

  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  async getAll(params = {}) {
    const response = await api.get('/leads-master', {
      params,
    })
    return response
  },

  async getAssignToMe(params = {}) {
    const response = await api.get('/leads-assigned-to-me', {
      params,
    })
    return response
  },

  async show(id) {
    const response = await api.get(`/leads/show/${id}`)
    return response
  },

  async create(payload) {
    const response = await api.post('/leads-store', payload)
    return response
  },

  async createBulks(payload) {
    const response = await api.post('/leads-store-bulk', payload)
    return response
  },

  async update(id, payload) {
    const response = await api.put(`/leads-update/${id}`, payload)
    return response
  },

  async destroy(id) {
    const response = await api.delete(`/leads-delete/${id}`)
    return response
  },

  async getIndustry() {
    const response = await api.get('/leads/select/industry')
    return response
  },

  async getSales() {
    const response = await api.get('/leads/select/user-sales')
    return response
  },

  async getCategory() {
    const response = await api.get('/leads/select/category')
    return response
  },
}