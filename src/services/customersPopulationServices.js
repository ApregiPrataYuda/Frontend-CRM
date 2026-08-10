
import api from './api'

export const customersPopulationServices = {

  // ── GET BY FULL URL (untuk pagination prev/next) ──
  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  // ── GET ALL (dengan params biasa) ──
  async getAll(params = {}) {
    const response = await api.get('/customers/population', { params })
    return response
  },

  // ── SHOW DETAIL ──
  async show(id) {
    const response = await api.get(`/customers/${id}/purchase-detail`)
    return response
  },

  // ── SUMMARY / DASHBOARD ──
  async summaryPopulationCustomer() {
    const response = await api.get('/customers/population/summary')
    return response
  },

  // ── SYNC CUSTOMERS ──
  async syncCustomers(payload) {
    const response = await api.post('/odoo/sync-customers', payload)
    return response
  },

  async syncCustomerPurchases(payload) {
    const response = await api.post('/odoo/sync-customer-purchases', payload)
    return response
  },

  // ═══ BARU: ASSIGN SALES ═══

  // ── LIST SALES (untuk dropdown assign) ──
  async getSalesList() {
    const response = await api.get('/customers/sales-list')
    return response
  },

  // ── ASSIGN / REASSIGN customer ke sales ──
  async assignSales(payload) {
    // payload: { odoo_customer_id, sales_id }
    const response = await api.post('/customers/assign-sales', payload)
    return response
  },

  // ── UNASSIGN customer dari sales ──
  async unassignSales(payload) {
    // payload: { odoo_customer_id }
    const response = await api.post('/customers/unassign-sales', payload)
    return response
  },

  // ── LIST semua assignment (opsional, untuk halaman monitoring) ──
  async getSalesAssignments(params = {}) {
    const response = await api.get('/customers/sales-assignments', { params })
    return response
  },

}