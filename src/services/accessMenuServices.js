import api from './api'

export const accessMenuServices = {

  // Fetch data dengan full URL (untuk pagination prev/next)
  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  // Toggle akses role ke menu (grant / revoke)
  async changeAccess(payload) {
    const response = await api.post('/access-menu/change', payload)
    return response
  },
}