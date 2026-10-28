import api from './api'

// ── Menu Product Assignment (Admin / Manager / admin / Supervisor) ──
// Backend: App\Http\Controllers\Api\Mobile\Product\ProductAssignmentController
export const productAssignmentServices = {

  // Daftar sales yang boleh di-assign + jumlah product yang dipegang
  async getSales(search = '') {
    const response = await api.get('/product-assignments/sales', {
      params: search ? { search } : {},
    })
    return response
  },

  // Daftar product (dipakai juga untuk link prev/next pagination)
  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  // payload: { sales_ids: [..], product_ids: [..] }  (maks 50 sales, 500 product)
  async assign(payload) {
    const response = await api.post('/product-assignments/assign', payload)
    return response
  },

  async unassign(payload) {
    const response = await api.post('/product-assignments/unassign', payload)
    return response
  },

  // ── Sync product dari Odoo (Administrator / Manager / admin / Supervisor) ──
  async syncProducts() {
    const response = await api.post('/products/sync')
    return response
  },

  // ── Sync Product Catalog saja (Odoo Documents) -- tombol "Sync Catalog" ──
  async syncCatalog() {
    const response = await api.post('/products/sync-catalog')
    return response
  },

  async getSyncStatus() {
    const response = await api.get('/products/sync-status')
    return response
  },
}