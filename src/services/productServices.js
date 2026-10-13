import api from './api'

// ── Product untuk Sales (dan role lain) ──
// Backend: App\Http\Controllers\Api\Mobile\Product\ProductController
// Isi otomatis mengikuti user login:
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

}