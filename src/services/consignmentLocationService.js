import api from './api'

// ── Halaman "Lokasi Konsinyasi" (Admin / Manager / admin / Supervisor) ──
// Backend: App\Http\Controllers\Api\Mobile\Inventory\ConsignmentLocationController
export const consignmentLocationServices = {

  // params: { company_id, search, filter: all|consignment|unmapped, page, per_page }
  async getLocations(params = {}) {
    return api.get('/stock-locations', { params })
  },

  async getCompanies() {
    return api.get('/stock-locations/companies')
  },

  async searchPartners(search = '') {
    return api.get('/stock-locations/partners', { params: search ? { search } : {} })
  },

  async searchSales(search = '') {
    return api.get('/stock-locations/sales', { params: search ? { search } : {} })
  },

  // payload: { is_consignment?, partner_odoo_id?, count_interval_days?, is_vehicle?, vehicle_sales_id? }
  async update(id, payload) {
    return api.put(`/stock-locations/${id}`, payload)
  },

  async applySuggestion(id) {
    return api.post(`/stock-locations/${id}/apply-suggestion`)
  },

  // Petakan sekaligus semua lokasi yang sarannya tepat satu. payload: { company_id? }
  async applyAllSuggestions(payload = {}) {
    return api.post('/stock-locations/apply-all-suggestions', payload)
  },

  async sync() {
    return api.post('/stock-locations/sync')
  },

  async getSyncStatus() {
    return api.get('/stock-locations/sync/status')
  },
}