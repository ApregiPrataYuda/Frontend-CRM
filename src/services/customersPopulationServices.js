import api from './api'

export const customersPopulationServices = {

  // ── GET BY FULL URL (untuk pagination prev/next) ──
  async getByUrl(url) {
    const response = await api.get(url)
    return response          // store expects: response.data.data, response.data.pagination
  },

  // ── GET ALL (dengan params biasa) ──
  async getAll(params = {}) {
    const response = await api.get('/customers/population', { params })
    return response
  },

  // ── SHOW DETAIL ──
  async show(id) {
    const response = await api.get(`/customers/${id}/purchase-detail`)
    return response          // store expects: res.data.data
  },

  // ── SYNC CUSTOMERS ──
  async syncCustomers(payload) {
    const response = await api.post('/odoo/sync-customers', payload)
    return response
  },

   async syncCustomerPurchases(payload) {
    const response = await api.post('/odoo/sync-customer-purchases', payload)
    return response
  },


}