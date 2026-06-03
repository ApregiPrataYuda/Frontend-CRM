import api from './api'

export const followUpService = {

  // ── LIST ──────────────────────────────────────────────
  async getLeadsByUrl(url) {
    const response = await api.get(url)
    return response
  },

  async getCustomersByUrl(url) {
    const response = await api.get(url)
    return response
  },

  // ── DETAIL ────────────────────────────────────────────
  async show(id) {
    const response = await api.get(`/follow-up/show/${id}`)
    return response
  },

  // ── DELETE ────────────────────────────────────────────
  async destroy(id) {
    const response = await api.delete(`/follow-up/delete/${id}`)
    return response
  },

  // ── UPDATE (RESCHEDULE) ───────────────────────────────
  async update(id, payload) {
    const response = await api.put(`/follow-up/update/${id}`, payload)
    return response
  },

  // ── SUBMIT RESULT ─────────────────────────────────────
  async submitResultLead(followUpId, payload) {
    const response = await api.post(`/follow-ups/${followUpId}/submit-result`, payload)
    return response
  },

  async submitResultCustomer(followUpId, payload) {
    const response = await api.post(`/follow-ups/${followUpId}/submit-result/customer`, payload)
    return response
  },

  // ── TIMELINE ──────────────────────────────────────────
  async getTimelineLead(followUpId) {
    const response = await api.get(`/follow-ups/${followUpId}/timeline`)
    return response
  },

  async getTimelineCustomer(followUpId) {
    const response = await api.get(`/follow-ups/${followUpId}/customer-timeline`)
    return response
  },

  // ── SELECT OPTIONS ────────────────────────────────────
  async getLeadsSelect(params = {}) {
    const response = await api.get('/follow-up/get-sales/leads', { params })
    return response
  },

  async getLeadsDirectSelect() {
    const response = await api.get('/follow-up/get-sales/leads/direct')
    return response
  },

  async getCustomersDirectSelect() {
    const response = await api.get('/follow-up/get-sales/customers')
    return response
  },

  // ── STORE DIRECT ──────────────────────────────────────
  async storeDirectLead(leadId, payload) {
    const response = await api.post(`/follow-ups/${leadId}/direct-follow-up`, payload)
    return response
  },

  async storeDirectCustomer(payload) {
    const response = await api.post('/follow-ups/direct-follow-up-customer', payload)
    return response
  },

}