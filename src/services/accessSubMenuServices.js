import api from './api'
 
export const accessSubMenuService = {
 
  // Fetch dengan full URL (untuk pagination prev/next)
  getByUrl: (url) => api.get(url),
 
  // Save/update permission per submenu (can_view, can_create, can_update, can_delete)
  savePermission: (userId, subMenuId, payload) =>
    api.put(`/users/${userId}/submenu-access/${subMenuId}`, payload),
}
 