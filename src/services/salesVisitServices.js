import api from './api'

export const visitsSalesServices = {

  // ── GET BY FULL URL (untuk pagination prev/next) ──
  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  // ── GET ALL ──
  async getAll(params = {}) {
    const response = await api.get('/data-visits-leads', { params })
    return response
  },

  // ── SHOW DETAIL ──
  async show(id) {
    const response = await api.get(`/data-visits/detail/${id}`)
    return response
  },

  // ── GET leads ready to visit ──
  async dataLeadsVisit(params = {}) {
    const response = await api.get('/data-leads-visit', { params })
    return response
  },

  // ── GET customers ready to visit ──
  async dataCustomersVisit(params = {}) {
    const response = await api.get('/data-customers-visit', { params })
    return response
  },

  // ── START VISIT — LEAD ──
  async visitStart(leadId) {
    const response = await api.post(`/leads/${leadId}/start`)
    return response
  },

  // ── START VISIT — CUSTOMER ──
async visitStartCustomers(customerId, branchId = null) {
  console.log('SERVICE kirim:', customerId, branchId)

  return api.post(`/customers/${customerId}/start`, {
    branch_id: branchId,
  })
},



  // ── CHECK IN — LEAD ──
  async checkIn(visitId, payload) {
    const response = await api.post(
      `/visits/${visitId}/check-in`,
      payload,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response
  },

  // ── CHECK IN — CUSTOMER ──
  async checkInCustomers(visitId, payload) {
    const response = await api.post(
      `/visits/customers/${visitId}/check-in`,
      payload,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response
  },

  // ── CHECK OUT — LEAD ──
  async checkOut(visitId, payload) {
    const response = await api.post(
      `/visits/${visitId}/check-out`,
      payload
    )
    return response
  },

  // ── CHECK OUT — CUSTOMER ──
  // async checkOutCustomers(visitId, payload) {
  //   const response = await api.post(
  //     `/visits/customers/${visitId}/check-out`,
  //     payload
  //   )
  //   return response
  // },

  async checkOutCustomers(visitId, payload) {
  const response = await api.post(
    `/visits/customers/${visitId}/check-out`,
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