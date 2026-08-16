import api from './api'

export const visitTargetServices = {

  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  async getList(params = {}) {
    const response = await api.get('/manager/visit-targets', { params })
    return response
  },

  async getDetail(id) {
    const response = await api.get(`/manager/visit-targets/${id}`)
    return response
  },

  async create(payload) {
    const response = await api.post('/manager/visit-targets', payload)
    return response
  },

  // update HANYA target_count & notes -- sesuai VisitTargetValidationUpdate
  // di backend (sales/customer/branch/period_month tidak bisa diubah).
  async update(id, payload) {
    const response = await api.put(`/manager/visit-targets/${id}`, payload)
    return response
  },

  async remove(id) {
    const response = await api.delete(`/manager/visit-targets/${id}`)
    return response
  },

  // dropdown Customer di form Tambah Target -- di-scope ke customer milik/
  // assigned ke sales_id yang lagi dipilih (bukan semua customer), biar
  // dropdown-nya nggak kepanjangan & sesuai tanggung jawab sales itu.
  async getCustomersBySales(salesId) {
    const response = await api.get('/manager/visit-targets/support/customers', {
      params: { sales_id: salesId },
    })
    return response
  },

}