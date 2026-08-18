import api from './api'

export const productServices = {

  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  async getProducts(params = {}) {
    const response = await api.get('/products', { params })
    return response
  },

  // Manager-only di backend -- Sales yang klik ini bakal kena 403.
  async syncProducts() {
    const response = await api.post('/products/sync')
    return response
  },

}