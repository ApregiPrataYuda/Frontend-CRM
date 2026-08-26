import api from './api'

/**
 * Service fitur Quotations (Penawaran) -- dipakai BARENG oleh halaman Sales
 * (bikin/edit/hapus quotation punya sendiri, download PDF, push ke Odoo)
 * dan halaman Manager/Admin (lihat SEMUA quotation, read-only monitoring).
 * Backend-nya juga satu controller yang sama (QuotationController), scoping
 * "punya sendiri vs semua" ditentukan di backend berdasarkan role -- pola
 * sama persis dengan expenseServices.js.
 */
export const quotationServices = {

  async getByUrl(url) {
    return await api.get(url)
  },

  async getQuotations(params = {}) {
    return await api.get('/quotations', { params })
  },

  async getSummary(params = {}) {
    return await api.get('/quotations/summary', { params })
  },

  async getDetail(id) {
    return await api.get(`/quotations/${id}`)
  },

  async createQuotation(payload) {
    return await api.post('/quotations', payload)
  },

  async updateQuotation(id, payload) {
    return await api.put(`/quotations/${id}`, payload)
  },

  async deleteQuotation(id) {
    return await api.delete(`/quotations/${id}`)
  },

  async pushToOdoo(id) {
    return await api.post(`/quotations/${id}/push-odoo`)
  },

  // responseType 'blob' -- hasil endpoint ini adalah file PDF (bukan JSON),
  // lihat QuotationController::downloadPdf().
  async downloadPdf(id) {
    return await api.get(`/quotations/${id}/pdf`, { responseType: 'blob' })
  },

  async getCustomerOptions(params = {}) {
    return await api.get('/quotations/options/customers', { params })
  },

  async getProductOptions(params = {}) {
    return await api.get('/quotations/options/products', { params })
  },

}