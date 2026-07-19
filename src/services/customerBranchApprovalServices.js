import api from './api'

export const customerBranchApprovalServices = {

  // ── GET BY FULL URL (untuk pagination prev/next) ──
  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  // ── GET ALL (dengan params biasa) ──
  async getListBranches(params = {}) {
    const response = await api.get('/customer-branch-approval', { params })
    return response
  },

  // ── Approve Branch ──
  async approveBranch(id, payload) {
    const response = await api.put(`customer-branch-approval/${id}/approve`, payload)
    return response
  },

  // ── Reject Branch ──
  async rejectBranch(id, payload) {
    const response = await api.put(`customer-branch-approval/${id}/reject`, payload)
    return response
  },

}