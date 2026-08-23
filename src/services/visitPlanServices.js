import api from './api'

export const visitPlanServices = {

  // GET /sales/visit-plans?month=2026-08
  async getByMonth(month) {
    const response = await api.get('/sales/visit-plans', {
      params: { month },
    })
    return response
  },

  // POST /sales/visit-plans
  async create(payload) {
    const response = await api.post('/sales/visit-plans', payload)
    return response
  },

  // PUT /sales/visit-plans/{id}
  async update(id, payload) {
    const response = await api.put(`/sales/visit-plans/${id}`, payload)
    return response
  },

  // DELETE /sales/visit-plans/{id}
  async destroy(id) {
    const response = await api.delete(`/sales/visit-plans/${id}`)
    return response
  },

  // SELECT: CUSTOMER MILIK SALES YANG LOGIN (dropdown form tambah/edit rencana)
  // Beda dari /customers/search-company (global, dipakai modul lain) -- ini
  // cuma balikin customer yang customers.id_user-nya = sales yang login.
  async getCustomerSelect() {
    const response = await api.get('/sales/visit-plans/select/customers')
    return response
  },

}