import api from './api'

export const masterEmployeServices = {

  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  async getAll(params = {}) {
    const response = await api.get('/employee-management', { params })
    return response
  },

  async show(id) {
    const response = await api.get(`/employee-management-show/${id}`)
    return response
  },

  async create(payload) {
    const response = await api.post('/employee-store-management', payload)
    return response
  },

  async update(id, payload) {
    const response = await api.put(`/employee-update-management/${id}`, payload)
    return response
  },

  async destroy(id) {
    const response = await api.delete(`/employee-delete-management/${id}`)
    return response
  },


  async getOffice() {
    const response = await api.get('/select-office-for-employee')
    return response.data
  },


  // async getUsers() {
  //   const response = await api.get('/employee-available-users')
  //   return response
  // },

  // Service
async getUsers() {
  const response = await api.get('/employee-available-users')
  return response.data.data  // response.data = body JSON, .data lagi = array users
},
}