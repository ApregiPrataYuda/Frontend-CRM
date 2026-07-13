import api from './api'

export const customersServices = {

  // ── GET BY FULL URL (untuk pagination prev/next) ──
  async getByUrl(url) {
    const response = await api.get(url)
    return response   
  },

  // ── GET ALL (dengan params biasa) ──
  async getListCustomers(params = {}) {
    const response = await api.get('/customer-approval', { params })
    return response
  },


  // ── Approve Customer ──
  async approveCustomer(id, payload) {
    const response = await api.put(`customer-approval/${id}/approve`, payload)
    return response
  },

  // ── Reject Customer ──
  async rejectCustomer(id, payload) {
    const response = await api.put(`customer-approval/${id}/reject`, payload)
    return response
  },

  

  
}