import api from './api'

/**
 * Service fitur Expenses -- dipakai BARENG oleh halaman Sales (submit +
 * lihat punya sendiri) dan halaman Manager/Admin (lihat semua + approve/
 * reject). Backend-nya juga satu controller yang sama (ExpenseController),
 * scoping "punya sendiri vs semua" ditentukan di backend berdasarkan role.
 */
export const expenseServices = {

  async getByUrl(url) {
    return await api.get(url)
  },

  async getExpenses(params = {}) {
    return await api.get('/expenses', { params })
  },

  async getSummary(params = {}) {
    return await api.get('/expenses/summary', { params })
  },

  async getDetail(id) {
    return await api.get(`/expenses/${id}`)
  },

  async createExpense(formData) {
    return await api.post('/expenses', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  async deleteExpense(id) {
    return await api.delete(`/expenses/${id}`)
  },

  async approveExpense(id) {
    return await api.post(`/expenses/${id}/approve`)
  },

  async rejectExpense(id, rejection_reason) {
    return await api.post(`/expenses/${id}/reject`, { rejection_reason })
  },

  async retryPushExpense(id) {
    return await api.post(`/expenses/${id}/retry-push`)
  },

  async getCategoryOptions() {
    return await api.get('/expenses/options/categories')
  },

  async getCustomerOptions(params = {}) {
    return await api.get('/expenses/options/customers', { params })
  },

}