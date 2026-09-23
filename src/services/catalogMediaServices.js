import api from './api'

// ── Kelola media (PDF/Video) milik satu Product Catalog. Pola sama
// dengan productCatalogService.js -- create/update pakai multipart/
// form-data karena bisa ada upload file, update tetap POST dengan
// method spoofing (_method: PUT) dari FormData-nya sendiri. ──
export const catalogMediaServices = {

  // list media milik 1 product (non-paginated, urut sort_order)
  async listByProduct(productId) {
    const response = await api.get(`/catalog-media?product_id=${productId}`)
    return response
  },

  async show(id) {
    const response = await api.get(`/catalog-media-show/${id}`)
    return response
  },

  async create(payload) {
    const response = await api.post(
      '/store-catalog-media',
      payload,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response
  },

  async update(id, payload) {
    const response = await api.post(
      `/update-catalog-media/${id}`,
      payload,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response
  },

  async destroy(id) {
    const response = await api.delete(`/delete-catalog-media/${id}`)
    return response
  },
}