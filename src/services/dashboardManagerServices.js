import api from './api'

export const dashboardManagerServices = {

  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  async getExecutiveSummary(params = {}) {
    const response = await api.get('/dashboard/manager/executive-summary', {
      params,
    })
    return response
  },
}