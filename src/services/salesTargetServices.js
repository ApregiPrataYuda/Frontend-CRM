import api from './api'

export const salesTargetServices = {

  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  async getSalesTargets(params = {}) {
    const response = await api.get('/sales-targets', { params })
    return response
  },

  async getSummary(params = {}) {
    const response = await api.get('/sales-targets/summary', { params })
    return response
  },

  // Dropdown-search buat field "Sales" di form Tambah/Edit Target.
  async getSalesOptions(params = {}) {
    const response = await api.get('/sales-targets/options/sales', { params })
    return response
  },

  // Dropdown-search buat field "Customer Odoo" (opsional) di form.
  async getCustomerOptions(params = {}) {
    const response = await api.get('/sales-targets/options/customers', { params })
    return response
  },

  // Dropdown-search buat field "Brand" (= Product Odoo) di form.
  async getProductOptions(params = {}) {
    const response = await api.get('/sales-targets/options/products', { params })
    return response
  },

  // Dropdown-search buat field "Kategori" di form.
  async getCategoryOptions(params = {}) {
    const response = await api.get('/sales-targets/options/categories', { params })
    return response
  },

  async createSalesTarget(payload) {
    const response = await api.post('/sales-targets', payload)
    return response
  },

  async updateSalesTarget(id, payload) {
    const response = await api.put(`/sales-targets/${id}`, payload)
    return response
  },

  async deleteSalesTarget(id) {
    const response = await api.delete(`/sales-targets/${id}`)
    return response
  },

  // Breakdown di balik angka "Tercapai" -- transaksi (per-customer) atau
  // breakdown per customer (TOTAL). Dipakai modal "Detail Target".
  async getTargetDetail(id) {
    const response = await api.get(`/sales-targets/${id}/detail`)
    return response
  },

}