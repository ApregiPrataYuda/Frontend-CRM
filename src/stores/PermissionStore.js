// src/stores/usePermissionStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { permissionService } from '@/services/permissionService'

export const usePermissionStore = defineStore('permission', () => {

  // { "/sales-home": { can_view, can_create, can_update, can_delete }, ... }
  const permissions = ref({})
  const loading     = ref(false)

  // Rehydrate cache
  try {
    const cached = localStorage.getItem('permissions')
    if (cached) permissions.value = JSON.parse(cached)
  } catch {
    localStorage.removeItem('permissions')
  }

  const fetchPermissions = async (userId) => {
    if (!userId) return
    loading.value = true
    try {
      const res         = await permissionService.getPermissions(userId)
      permissions.value = res.permissions ?? {}
      localStorage.setItem('permissions', JSON.stringify(permissions.value))
    } catch (err) {
      console.error('[PermissionStore]', err)
    } finally {
      loading.value = false
    }
  }

  // Helper — cek permission berdasarkan URL
  const can = (url, action = 'can_view') => {
    const perm = permissions.value[url]
    if (!perm) return false
    return perm[action] === true
  }

  const canView   = (url) => can(url, 'can_view')
  const canCreate = (url) => can(url, 'can_create')
  const canUpdate = (url) => can(url, 'can_update')
  const canDelete = (url) => can(url, 'can_delete')

  // Cek apakah URL boleh diakses (untuk route guard)
  const isAllowed = (url) => {
    // Hapus prefix /app sebelum cek
    const rawUrl = url.replace('/app', '')
    return !!permissions.value[rawUrl]
  }

  const clearPermissions = () => {
    permissions.value = {}
    localStorage.removeItem('permissions')
  }

  return {
    permissions,
    loading,
    fetchPermissions,
    can,
    canView,
    canCreate,
    canUpdate,
    canDelete,
    isAllowed,
    clearPermissions,
  }
})