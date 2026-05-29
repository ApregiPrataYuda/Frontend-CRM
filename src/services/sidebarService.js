// src/services/sidebarService.js
import api from './api'

export const sidebarService = {

  /**
   * GET menu sections berdasarkan role
   * → /api/sidebar-access/{roleId}
   * → returns: [{ id_menu, menu, id_access_menu, id_role }]
   */
  async getMenuByRole(roleId) {
    const response = await api.get(`/sidebar-access/${roleId}`)
    return response.data
  },

  /**
   * GET semua submenu + children berdasarkan menu_ids dan user
   * → /api/sidebar-access-submenu?menu_ids[]=1&menu_ids[]=2&id_user=1
   * → returns: [{ id_submenu, id_menu, title, url, icon, parent_id, children[] }]
   */
  async getSubmenus(menuIds, userId) {
    const response = await api.get('/sidebar-access-submenu', {
      params: {
        'menu_ids[]': menuIds,
        id_user: userId,
      }
    })
    return response.data
  }
}