import api from './api'

// endpoint coverage wilayah sales (Admin & Manager)
// backend: SalesCoverageController -- prefix /employee-coverages
export const salesCoverageServices = {

  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  // detail wilayah 1 sales (pakai id_employee, BUKAN id_user)
  async show(employeeId) {
    const response = await api.get(`/employee-coverages/employee/${employeeId}`)
    return response
  },

  // TAMBAH wilayah (wilayah lama tetap ada)
  // payload: { employee_id, area_codes: ['32', '3171', ...] }
  async create(payload) {
    const response = await api.post('/employee-coverages', payload)
    return response
  },

  // SINKRON -- wilayah sales diganti persis jadi area_codes yang dikirim
  // payload: { area_codes: [...] }   ([] = hapus semua)
  async sync(employeeId, payload) {
    const response = await api.put(`/employee-coverages/employee/${employeeId}`, payload)
    return response
  },

  // hapus 1 baris wilayah (pakai id coverage)
  async destroy(id) {
    const response = await api.delete(`/employee-coverages/${id}`)
    return response
  },

  // dropdown sales -- value = id_employee, label = nama sales
  async getSales() {
    const response = await api.get('/employee-coverages/options/sales')
    return response.data.data
  },

  // wilayah berjenjang (Laravolt) -- level: province | city | district | village
  async getRegions(level, parent = null) {
    const params = { level }
    if (parent) params.parent = parent
    const response = await api.get('/employee-coverages/options/regions', { params })
    return response.data.data  // array { value, label, level }
  },
}