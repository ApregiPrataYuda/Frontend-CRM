import api from './api'

// ── Mengikuti pola persis userManagementService.js: create/update pakai
// multipart/form-data secara eksplisit karena ada upload file thumbnail.
// update() tetap POST (bukan PUT) -- method spoofing (_method: PUT)
// ditambahkan di FormData-nya sendiri lewat buildFormData() di store
// (lihat productCatalogStore.js), match dengan route backend yang juga
// POST untuk /update-product-catalog/{id}. ──
export const productCatalogServices = {

  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  async show(id) {
    const response = await api.get(`/product-catalog-show/${id}`)
    return response
  },

  // create -- multipart/form-data
  async create(payload) {
    const response = await api.post(
      '/store-product-catalog',
      payload,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response
  },

  // update -- multipart/form-data + method spoofing _method: PUT
  // (payload FormData-nya sudah membawa _method: PUT dari buildFormData())
  async update(id, payload) {
    const response = await api.post(
      `/update-product-catalog/${id}`,
      payload,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response
  },

  async destroy(id) {
    const response = await api.delete(`/delete-product-catalog/${id}`)
    return response
  },
}