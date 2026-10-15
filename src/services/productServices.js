import api from './api'

// ── Product untuk Sales (dan role lain) ──
// Backend: App\Http\Controllers\Api\Mobile\Product\ProductController (+ ProductSaleController,
// ProductPurchaseController). Isi otomatis mengikuti user login:
//   - Sales                         : hanya product yang di-assign ke dirinya
//   - Manager / admin / Supervisor  : semua product company-nya
//   - Administrator                 : semua product
export const productServices = {

  // List + pagination (dipakai juga untuk link prev/next)
  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  async getProducts(params = {}) {
    const response = await api.get('/mobile/products', { params })
    return response
  },

  // Daftar brand & kategori untuk chip filter
  async getFilters() {
    const response = await api.get('/mobile/products/filters')
    return response
  },

  // Detail + stok WH / GRN / Consignment
  async show(id) {
    const response = await api.get(`/mobile/products/${id}`)
    return response
  },

  // Cari 1 product berdasarkan barcode, lalu SKU
  async findByBarcode(code) {
    const response = await api.get(`/mobile/products/barcode/${encodeURIComponent(code)}`)
    return response
  },

  // Tab Sold: Quotation + SO per bulan. params: { month: 'YYYY-MM', type: 'all'|'so'|'quotation', per_page }
  async getSales(id, params = {}) {
    const response = await api.get(`/mobile/products/${id}/sales`, { params })
    return response
  },

  // Transaksi penjualan terbaru (dipakai untuk menentukan bulan awal tab Sold)
  async getSalesHistory(id, limit = 5) {
    const response = await api.get(`/mobile/products/${id}/sales-history`, { params: { limit } })
    return response
  },

  // Tab Purchase: PO per bulan. params: { month: 'YYYY-MM', per_page }
  async getPurchases(id, params = {}) {
    const response = await api.get(`/mobile/products/${id}/purchases`, { params })
    return response
  },

}