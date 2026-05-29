import api from './api'

export const dashboardServices = {

  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  async getAll(params = {}) {
    const response = await api.get('/dashboard/it', {
      params,
    })
    return response
  },
}