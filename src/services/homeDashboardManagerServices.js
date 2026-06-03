import api from './api'

export const managerDashboardServices = {

  async getDashboard(userId) {
    const response = await api.get('/dashboard/manager', {
      params: { user_id: userId },
    })
    return response
  },

}