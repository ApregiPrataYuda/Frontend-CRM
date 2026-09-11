import api from './api'

export const settingAppService = {

  // Fetch dengan full URL (untuk pagination prev/next)
  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  async getAll(params = {}) {
    const response = await api.get('/setting-app-management', { params })
    return response
  },

  async show(id) {
    const response = await api.get(`/setting-app-show/${id}`)
    return response
  },

  // Update — selalu POST + multipart/form-data
  // _method: PUT otomatis ditambahkan ke FormData untuk Laravel method spoofing
  async update(id, payload) {
    // Tambahkan _method: PUT agar Laravel mengenali ini sebagai PUT request
    if (payload instanceof FormData) {
      payload.append('_method', 'PUT')
    }

    const response = await api.post(
      `/update-setting-app-management/${id}`,
      payload,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response
  },

  // ── Logo per Company (group_companies) ──
  // Section terpisah dari App Setting global di atas -- datanya
  // multi-baris (1 baris per company), lihat
  // Administrator::companyLogos()/updateCompanyLogo() di backend.
  async getCompanyLogos() {
    const response = await api.get('/company-logos')
    return response
  },

  // Sama persis pola-nya kayak update() di atas: POST + multipart +
  // _method: PUT spoofing (soalnya upload file, bukan JSON biasa).
  async updateCompanyLogo(idGroup, payload) {
    if (payload instanceof FormData) {
      payload.append('_method', 'PUT')
    }

    const response = await api.post(
      `/company-logos/${idGroup}`,
      payload,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response
  },
}