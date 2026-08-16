import api from './api'

export const myVisitTargetServices = {

  // GET /sales/visit-targets?period_month=2026-08-01
  async getMyTargets(periodMonth) {
    const response = await api.get('/sales/visit-targets', {
      params: { period_month: periodMonth },
    })
    return response
  },

}