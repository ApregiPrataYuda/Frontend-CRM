import api from './api'

export const customersServices = {

  // ── GET BY FULL URL (untuk pagination prev/next) ──
  async getByUrl(url) {
    const response = await api.get(url)
    return response          // store expects: response.data.data, response.data.pagination
  },

  // ── GET ALL (dengan params biasa) ──
  async getAll(params = {}) {
    const response = await api.get('/customers-masters', { params })
    return response
  },

  // ── SHOW DETAIL ──
  async show(id) {
    const response = await api.get(`/customers/show/${id}`)
    return response          // store expects: res.data.data
  },

  // ── CREATE ──
  async create(payload) {
    const response = await api.post('/customers/store', payload)
    return response
  },

  // ── UPDATE ──
  async update(id, payload) {
    const response = await api.put(`/customers/update/${id}`, payload)
    return response
  },

  // ── DELETE ──
  async destroy(id) {
    const response = await api.delete(`/customers/delete/${id}`)
    return response
  },

  // ── SELECT: INDUSTRY ──
  // PERBAIKAN: kode lama return response.data, store baru assign langsung ke .value
  // Kita return response.data agar store tidak perlu .data lagi
  async getIndustry(params = {}) {
    const response = await api.get('/leads/select/industry', { params })
    return response.data     // store: industrySelectData.value = response.data  
  },

  // ── SELECT: SALES ──
  async getSales(params = {}) {
    const response = await api.get('/leads/select/user-sales', { params })
    return response.data
  },

  // ── SELECT: CATEGORY ──
  async getCategory(params = {}) {
    const response = await api.get('/leads/select/category', { params })
    return response.data     // store: categorySelectData.value = response.data  
  },

  // ── SUBMISSION: PENDING + REJECTED (punya sales sendiri) ──
  // customersServices.js
async getSubmissions(params = {}) {
  const response = await api.get('/customer-submissions', { params })
  return response
},

// ── BRANCHES ──
//   async getBranches(customerId) {
//     const response = await api.get(`/customers/${customerId}/branches`)
//     return response          // store expects: response.data.data
//   },



//   async searchCompany(search) {
//   const response = await api.get('/customers/search-company', {
//     params: {
//       search
//     }
//   })
//   return response
// }

// ── BRANCHES ──
  async getBranches(customerId) {
    const response = await api.get(`/customers/${customerId}/branches`)
    return response          // store expects: response.data.data
  },

  // ── CREATE BRANCH UNTUK CUSTOMER YANG SUDAH ADA ──
  async createBranch(customerId, payload) {
    const response = await api.post(`/customers/${customerId}/branches`, payload)
    return response
  },

  async searchCompany(search) {
    const response = await api.get('/customers/search-company', {
      params: { search }
    })
    return response
  }

  
}