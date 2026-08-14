import api from './api'

export const productPopulationsServices = {

  // ── GET BY FULL URL (untuk pagination prev/next) ──
  async getByUrl(url) {
    const response = await api.get(url)
    return response          // store expects: response.data.data, response.data.pagination
  },

  // ── GET ALL (dengan params: view, search, per_page, sort_by, sort_dir) ──
  async getAll(params = {}) {
    const response = await api.get('/product-populations', { params })
    return response
  },

  // ── COUNTS: badge 3 tab (all / mine / incomplete) ──
  async getCounts() {
    const response = await api.get('/product-populations/counts')
    return response.data     // store: counts.all/mine/incomplete = response.data.data.xxx
  },

  // ── SHOW DETAIL ──
  async show(id) {
    const response = await api.get(`/product-populations/${id}`)
    return response          // store expects: res.data.data
  },

  // ── CREATE ──
  async create(payload) {
    const response = await api.post('/product-populations', payload)
    return response
  },

  // ── UPDATE ──
  async update(id, payload) {
    const response = await api.put(`/product-populations/${id}`, payload)
    return response
  },

  // ── DELETE ──
  async destroy(id) {
    const response = await api.delete(`/product-populations/${id}`)
    return response
  },

  // ── UNASSIGNED: customer sudah ada, PIC belum ada sama sekali ──
  // Khusus admin/manager, dipakai modal "Assign Sales".
  async getUnassigned(params = {}) {
    const response = await api.get('/product-populations/unassigned', { params })
    return response.data     // store: unassignedData.value = response.data.data
  },

  // ── ASSIGN: bulk assign PIC ke banyak data sekaligus ──
  // payload: { ids: [1, 2, 3], user_id: 5 }
  async assign(payload) {
    const response = await api.post('/product-populations/assign', payload)
    return response
  },

  // ── SELECT: SALES (reuse endpoint select sales yang sudah ada di leads) ──
  // Dipakai buat dropdown PIC di modal Add/Edit & modal Assign Sales.
  async getSales(params = {}) {
    const response = await api.get('/leads/select/user-sales', { params })
    return response.data
  },

  // ── SEARCH CUSTOMER (autocomplete, reuse endpoint search-company customer) ──
  async searchCustomer(search) {
    const response = await api.get('/customers/search-company', {
      params: { search }
    })
    return response
  },

}