import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { roleServices } from '@/services/roleManagementService'

export const useRoleStore = defineStore('role', () => {

  const rolesData = ref([])
  const loadingRoles = ref(false)
  const searchRoles = ref('')
  let searchTimeout = null

  const savingRole = ref(false)
  const updatingRole = ref(false)
  const deletingRole = ref(false)
  const errorRole = ref(null)

  const roleDetail = ref(null)
  const loadingDetail = ref(false)

  const pagination = reactive({
    current_page: 1,
    per_page: 10,
    prev_page_url: null,
    next_page_url: null,
    last_page: 1,
    total: 0,
  })

  const sort = reactive({
    column: 'created_at',
    direction: 'desc',
  })

  const allowedSortColumns = ['role', 'created_at']

  // ───────────────── BUILD URL ─────────────────
  const buildUrl = () => {
    const params = new URLSearchParams()

    if (searchRoles.value) {
      params.append('search', searchRoles.value)
    }

    if (pagination.current_page) {
      params.append('page', pagination.current_page)
    }

    if (pagination.per_page) {
      params.append('per_page', pagination.per_page)
    }

    if (sort.column) {
      params.append('sort_by', sort.column)
      params.append('sort_dir', sort.direction)
    }

    return `/role-management?${params.toString()}`
  }

  // ───────────────── FETCH ─────────────────
  const fetchRoles = async (url = null) => {
    loadingRoles.value = true

    try {
      const finalUrl = url || buildUrl()

      const response = await roleServices.getByUrl(finalUrl)

      const result = response.data

      // data array
      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      rolesData.value.splice(0, rolesData.value.length, ...dataArray)

      // pagination
      const pag = result.pagination ?? result.data?.pagination

      if (pag) {
        pagination.current_page = pag.current_page
        pagination.per_page = pag.per_page
        pagination.prev_page_url = pag.prev_page_url
        pagination.next_page_url = pag.next_page_url
        pagination.last_page = pag.last_page
        pagination.total = pag.total
      }

    } catch (error) {
      console.error('Gagal fetch roles:', error)
    } finally {
      loadingRoles.value = false
    }
  }

  // ───────────────── SEARCH ─────────────────
  const searchWithDelay = () => {
    clearTimeout(searchTimeout)

    pagination.current_page = 1

    searchTimeout = setTimeout(() => {
      fetchRoles(buildUrl())
    }, 500)
  }

  // ───────────────── PAGE SIZE ─────────────────
  const changePageSize = () => {
    pagination.current_page = 1
    fetchRoles(buildUrl())
  }

  // ───────────────── SORTING ─────────────────
  const changeSorting = () => {
    pagination.current_page = 1
    fetchRoles(buildUrl())
  }

  const toggleSort = (col) => {
    if (!allowedSortColumns.includes(col)) return

    if (sort.column === col) {
      sort.direction = sort.direction === 'asc'
        ? 'desc'
        : 'asc'
    } else {
      sort.column = col
      sort.direction = 'asc'
    }

    changeSorting()
  }

  // ───────────────── RESET ─────────────────
  const resetFilters = () => {
    searchRoles.value = ''
    pagination.current_page = 1
    pagination.per_page = 10

    sort.column = 'created_at'
    sort.direction = 'desc'

    fetchRoles(buildUrl())
  }

  // ───────────────── FORMAT DATE ─────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'

    const date = new Date(dateStr)

    if (isNaN(date.getTime())) {
      return 'Belum pernah diupdate'
    }

    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    })
  }

  // ───────────────── DETAIL ─────────────────
  const fetchRoleDetail = async (id) => {
    loadingDetail.value = true

    try {
      const response = await roleServices.show(id)

      roleDetail.value = response.data?.data ?? response.data

      return roleDetail.value

    } catch (error) {
      console.error('Gagal fetch detail role:', error)
      return null
    } finally {
      loadingDetail.value = false
    }
  }

  // ───────────────── STORE ─────────────────
  const saveRole = async (payload) => {
    savingRole.value = true
    errorRole.value = null

    try {
      await roleServices.create(payload)

      await fetchRoles(buildUrl())

      return true

    } catch (error) {

      errorRole.value =
        error.response?.data?.errors ??
        error.response?.data?.message ??
        'Gagal menyimpan role'

      return false

    } finally {
      savingRole.value = false
    }
  }

  // ───────────────── UPDATE ─────────────────
  const updateRole = async (id, payload) => {
    updatingRole.value = true
    errorRole.value = null

    try {
      await roleServices.update(id, payload)

      await fetchRoles(buildUrl())

      return true

    } catch (error) {

      errorRole.value =
        error.response?.data?.errors ??
        error.response?.data?.message ??
        'Gagal update role'

      return false

    } finally {
      updatingRole.value = false
    }
  }

  // ───────────────── DELETE ─────────────────
  const deleteRole = async (id) => {
    deletingRole.value = true

    try {
      await roleServices.destroy(id)

      await fetchRoles(buildUrl())

      return true

    } catch (error) {

      console.error('Gagal delete role:', error)

      return false

    } finally {
      deletingRole.value = false
    }
  }

  return {

    // state
    rolesData,
    loadingRoles,
    searchRoles,

    pagination,
    sort,

    savingRole,
    updatingRole,
    deletingRole,
    errorRole,

    roleDetail,
    loadingDetail,

    // actions
    fetchRoles,
    buildUrl,

    searchWithDelay,
    changePageSize,

    changeSorting,
    toggleSort,

    resetFilters,

    formatDate,

    fetchRoleDetail,

    saveRole,
    updateRole,
    deleteRole,
  }
})