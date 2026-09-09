import api from './api'

export const odooSettingsServices = {

  // GET koneksi global + daftar company & mapping-nya
  async getSettings() {
    const response = await api.get('/admin/odoo-settings')
    return response
  },

  // PUT update koneksi global (url, db, username, api_key, default_company_id)
  async updateConnection(payload) {
    const response = await api.put('/admin/odoo-settings/connection', payload)
    return response
  },

  // POST test koneksi PAKAI NILAI DI FORM (belum tentu tersimpan)
  async testConnection(payload) {
    const response = await api.post('/admin/odoo-settings/test-connection', payload)
    return response
  },

  // PUT update mapping 1 company (odoo_company_id), groupId = id_group
  async updateCompanyMapping(groupId, payload) {
    const response = await api.put(`/admin/odoo-settings/company/${groupId}`, payload)
    return response
  },
}