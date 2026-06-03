import api from './api'

export const salesDashboardServices = {

  async getDashboard(userId) {
    const response = await api.get('/dashboard/sales', {
      params: { user_id: userId },
    })
    return response
  },

}