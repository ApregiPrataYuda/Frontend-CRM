import api from './api'

/**
 * Service buat halaman "Report Product by Sales".
 *
 * Dropdown filter Sales & Kategori SENGAJA TIDAK punya endpoint sendiri di
 * sini -- reuse endpoint yang sudah ada di fitur Target Penjualan
 * (getSalesOptions / getCategoryOptions di salesTargetServices.js), soalnya
 * isinya sama persis (daftar sales role Sales aktif, daftar categ_id/
 * categ_name unik dari odoo_products). Import salesTargetServices di
 * store-nya, bukan duplikat di sini.
 */
export const reportProductBySalesServices = {

  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  async getReport(params = {}) {
    const response = await api.get('/report-product-by-sales', { params })
    return response
  },

  async getSummary(params = {}) {
    const response = await api.get('/report-product-by-sales/summary', { params })
    return response
  },

  // Rincian transaksi di balik 1 baris rekap (Sales + Product tertentu).
  async getDetail(salesId, odooProductId, params = {}) {
    const response = await api.get(`/report-product-by-sales/${salesId}/${odooProductId}/detail`, { params })
    return response
  },

}