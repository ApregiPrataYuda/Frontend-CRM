import api from './api'

// ── Mengikuti pola persis roleManagementService.js, ditambah 2 method
// khusus fitur Contact: link() untuk "Link dari Data Existing"
// (ContactController::storeLink()), dan searchSource() untuk picker
// pencarian data sumber (ContactController::searchSourceOptions()). ──
export const contactServices = {

  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  async show(id) {
    const response = await api.get(`/contact-show/${id}`)
    return response
  },

  // create STANDALONE (Principle, Competitor, dll -- input manual)
  async create(payload) {
    const response = await api.post('/store-contact', payload)
    return response
  },

  // update STANDALONE saja -- contact hasil link ditolak backend (403)
  async update(id, payload) {
    const response = await api.put(`/update-contact/${id}`, payload)
    return response
  },

  // hapus (standalone) ATAU unlink (linked) -- endpoint & logic sama,
  // beda cuma pesan sukses dari backend
  async destroy(id) {
    const response = await api.delete(`/delete-contact/${id}`)
    return response
  },

  // "Link dari Data Existing" -- source_type + source_id
  async link(payload) {
    const response = await api.post('/link-contact', payload)
    return response
  },

  // picker search untuk modal link (Customer / Lead / Customer Contact / Branch Contact)
  async searchSource(sourceType, search) {
    const params = new URLSearchParams()
    params.append('source_type', sourceType)
    params.append('search', search)
    const response = await api.get(`/contact-search-source?${params.toString()}`)
    return response
  },
}