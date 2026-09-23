import api from './api'

// ── Mengikuti pola persis contactTypeService.js: getByUrl() generik untuk
// index (search/sort/pagination dibangun di store), lalu action eksplisit
// untuk show/create/update/delete/select sesuai route backend
// (product_catalog_routes.php). ──
export const categoryProductCatalogServices = {

  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  async show(id) {
    const response = await api.get(`/category-product-catalog-show/${id}`)
    return response
  },

  // dropdown flat (tanpa pagination), dipakai di form Add/Edit Product
  async select() {
    const response = await api.get('/category-product-catalog-select')
    return response
  },

  async create(payload) {
    const response = await api.post('/store-category-product-catalog', payload)
    return response
  },

  async update(id, payload) {
    const response = await api.put(`/update-category-product-catalog/${id}`, payload)
    return response
  },

  async destroy(id) {
    const response = await api.delete(`/delete-category-product-catalog/${id}`)
    return response
  },
}