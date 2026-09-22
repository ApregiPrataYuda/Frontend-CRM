import api from './api'

// ── Mengikuti pola persis roleManagementService.js: getByUrl() generik
// untuk index (search/sort/pagination dibangun di store), lalu action
// eksplisit untuk show/create/update/delete -- sesuai konvensi route
// backend (lihat contact_routes_snippet.php: 'master-contact-type-show/{id}',
// 'store-master-contact-type', dst). ──
export const contactTypeServices = {

  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  async show(id) {
    const response = await api.get(`/master-contact-type-show/${id}`)
    return response
  },

  async create(payload) {
    const response = await api.post('/store-master-contact-type', payload)
    return response
  },

  async update(id, payload) {
    const response = await api.put(`/update-master-contact-type/${id}`, payload)
    return response
  },

  async destroy(id) {
    const response = await api.delete(`/delete-master-contact-type/${id}`)
    return response
  },
}