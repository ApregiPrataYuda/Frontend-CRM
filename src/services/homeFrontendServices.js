import api from './api'

export const homeFrontendServices = {


    // untuk home
  async getHomeStats() {
    const response = await api.get('/dashboard/home-stats')
    return response
  },


  async getDataMapsRealtime() {
    const response = await api.get('/data-visits-leads-map')
    return response
  },

}