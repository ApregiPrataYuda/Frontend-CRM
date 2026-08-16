import api from './api'

export const salesActivityServices = {

  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  async getSummary(params = {}) {
    const response = await api.get('/manager/sales-activity/summary', { params })
    return response
  },

  async getActivities(params = {}) {
    const response = await api.get('/manager/sales-activity/activities', { params })
    return response
  },

  async getActivityDetail(type, id) {
    const response = await api.get(`/manager/sales-activity/activities/${type}/${id}`)
    return response
  },

}