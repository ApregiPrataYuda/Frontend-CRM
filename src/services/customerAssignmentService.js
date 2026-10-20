import api from './api'

// ── Menu Customer Assignment (Admin / Manager / admin / Supervisor) ──
// Backend: App\Http\Controllers\Api\Mobile\MarketCoverage\Customers\CustomerAssignmentController
export const customerAssignmentServices = {

  // Daftar sales yang boleh di-assign + jumlah customer yang dipegang
  async getSales(search = '') {
    const response = await api.get('/customer-assignments/sales', {
      params: search ? { search } : {},
    })
    return response
  },

  // Daftar customer / lead (dipakai juga untuk link prev/next pagination)
  // params: view (all|mine|unassigned), sales_id, status (all|customer|lead), search,
  //         island_id, province_id, regency_id, page, per_page
  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  // payload: { sales_ids: [..], customer_ids: [..] }  (maks 50 sales, 500 customer)
  // customer_ids = id customer dari daftar (odoo_id perusahaan induk)
  async assign(payload) {
    const response = await api.post('/customer-assignments/assign', payload)
    return response
  },

  async unassign(payload) {
    const response = await api.post('/customer-assignments/unassign', payload)
    return response
  },

  // ── Sync customer dari Odoo: partner -> cabang -> status customer ──
  async syncCustomers() {
    const response = await api.post('/customer-assignments/sync')
    return response
  },

  async getSyncStatus() {
    const response = await api.get('/customer-assignments/sync-status')
    return response
  },
}