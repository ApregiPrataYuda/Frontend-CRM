// src/services/permissionService.js
import api from './api'

export const permissionService = {
  async getPermissions(userId) {
    const response = await api.get('/permission-button', {
      params: { id_user: userId }
    })
    return response.data
  }
}