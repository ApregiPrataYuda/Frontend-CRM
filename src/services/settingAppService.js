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
}