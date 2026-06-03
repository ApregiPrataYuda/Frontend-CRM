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
  // BUG LAMA: nama fungsi duplikat dengan visitStartCustomers
  async visitStart(leadId) {
    const response = await api.post(`/leads/${leadId}/start`)
    return response
  },

  // ── START VISIT — CUSTOMER ──
  // BUG LAMA: pakai single quote di template literal → tidak interpolasi
  async visitStartCustomers(customerId) {
    const response = await api.post(`/customers/${customerId}/start`)
    return response
  },

  // ── CHECK IN — LEAD ──
  // BUG LAMA: koma setelah payload hilang, slash awal URL hilang
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
  // BUG LAMA: sama seperti checkIn
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
  // BUG LAMA: slash awal URL hilang
  async checkOut(visitId, payload) {
    const response = await api.post(
      `/visits/${visitId}/check-out`,
      payload
    )
    return response
  },

  // ── CHECK OUT — CUSTOMER ──
  async checkOutCustomers(visitId, payload) {
    const response = await api.post(
      `/visits/customers/${visitId}/check-out`,
      payload
    )
    return response
  },
}