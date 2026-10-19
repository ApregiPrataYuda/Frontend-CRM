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

  // Tab Invoice: invoice berisi product ini per bulan. params: { month, type: 'customer'|'vendor'|'all', per_page }
  async getInvoices(id, params = {}) {
    const response = await api.get(`/mobile/products/${id}/invoices`, { params })
    return response
  },

  // Detail satu invoice (header, baris, SO / PO asal, credit note). invoiceId = invoice_id dari daftar
  async getInvoice(invoiceId) {
    const response = await api.get(`/mobile/invoices/${invoiceId}`)
    return response
  },

  // Tab Delivery: surat jalan / penerimaan berisi product ini per bulan. params: { month, type: 'outgoing'|'incoming'|'all', per_page }
  async getDeliveries(id, params = {}) {
    const response = await api.get(`/mobile/products/${id}/deliveries`, { params })
    return response
  },

  // Status order terbaru yang berisi product ini (4 tahap: On Delivery, Delivered, Invoiced, Payment Confirmed)
  async getOrderStatus(id, limit = 5) {
    const response = await api.get(`/mobile/products/${id}/order-status`, { params: { limit } })
    return response
  },

  // Detail satu transfer (baris, SO / PO asal, backorder). deliveryId = delivery_id dari daftar
  async getDelivery(deliveryId) {
    const response = await api.get(`/mobile/deliveries/${deliveryId}`)
    return response
  },

}