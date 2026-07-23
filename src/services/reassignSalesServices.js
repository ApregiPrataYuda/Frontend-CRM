import api from './api'

export const reassignSalesServices = {

  // ── GET BY FULL URL (untuk pagination prev/next) ──
  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  // ── GET LIST CUSTOMER + BRANCH (dengan assigned_to masing-masing) ──
  async getAll(params = {}) {
    const response = await api.get('/manager-reassign-sales', { params })
    return response
  },

  // ── GET SALES DROPDOWN ──
  async getSales(params = {}) {
    const response = await api.get('/manager-reassign-sales/sales', { params })
    return response
  },

  // ── REASSIGN CUSTOMER (head company) ──
  async reassignCustomer(customerId, payload) {
    const response = await api.put(`/manager-reassign-sales/customer/${customerId}`, payload)
    return response
  },

  // ── REASSIGN BRANCH ──
  async reassignBranch(branchId, payload) {
    const response = await api.put(`/manager-reassign-sales/branch/${branchId}`, payload)
    return response
  },

}