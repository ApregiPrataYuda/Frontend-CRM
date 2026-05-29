import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { subMenuManagementService } from '@/services/subMenuManagementService'

export const useSubMenuStore = defineStore('subMenu', () => {

  // ── STATE ─────────────────────────────────────
  const subMenusData = ref([])
  const loadingSubMenus = ref(false)
  const searchSubMenus = ref('')
  let searchTimeout = null

  const savingSubMenu = ref(false)
  const updatingSubMenu = ref(false)
  const deletingSubMenu = ref(false)

  const errorSubMenu = ref(null)

  const subMenuDetail = ref(null)
  const loadingDetail = ref(false)

  // ── PAGINATION ────────────────────────────────
  const pagination = reactive({
    current_page: 1,
    per_page: 10,
    prev_page_url: null,
    next_page_url: null,
    last_page: 1,
    total: 0,
  })

  // ── SORT ──────────────────────────────────────
  const sort = reactive({
    column: 'created_at',
    direction: 'desc',
  })

  const allowedSortColumns = ['title', 'created_at']

  // ── BUILD URL ─────────────────────────────────
  const buildUrl = () => {
    const params = new URLSearchParams()

    if (searchSubMenus.value) {
      params.append('search', searchSubMenus.value)
    }

    params.append('page', pagination.current_page)
    params.append('per_page', pagination.per_page)
    params.append('sort_by', sort.column)
    params.append('sort_dir', sort.direction)

    return `/submenu-management?${params.toString()}`
  }

  // ── FETCH SUBMENUS ────────────────────────────
  const fetchSubMenus = async (url = null) => {
    loadingSubMenus.value = true

    try {
      const finalUrl = url || buildUrl()

      const response = await subMenuManagementService.getByUrl(finalUrl)

      const result = response.data

      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      subMenusData.value = dataArray

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
      console.error('Gagal fetch submenus:', error)
    } finally {
      loadingSubMenus.value = false
    }
  }

  // ── SEARCH ────────────────────────────────────
  const searchWithDelay = () => {
    clearTimeout(searchTimeout)

    pagination.current_page = 1

    searchTimeout = setTimeout(() => {
      fetchSubMenus(buildUrl())
    }, 500)
  }

  // ── PAGE SIZE ─────────────────────────────────
  const changePageSize = () => {
    pagination.current_page = 1
    fetchSubMenus(buildUrl())
  }

  // ── SORTING ───────────────────────────────────
  const changeSorting = () => {
    pagination.current_page = 1
    fetchSubMenus(buildUrl())
  }

  const toggleSort = (col) => {
    if (!allowedSortColumns.includes(col)) return

    if (sort.column === col) {
      sort.direction = sort.direction === 'asc' ? 'desc' : 'asc'
    } else {
      sort.column = col
      sort.direction = 'asc'
    }

    changeSorting()
  }

  // ── RESET FILTER ──────────────────────────────
  const resetFilters = () => {
    searchSubMenus.value = ''
    pagination.current_page = 1
    pagination.per_page = 10

    sort.column = 'created_at'
    sort.direction = 'desc'

    fetchSubMenus(buildUrl())
  }

  // ── FORMAT DATE ───────────────────────────────
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

  // ── MENU SELECT ───────────────────────────────
  const menuSelectData = ref([])

  const fetchMenuSelect = async () => {
    loadingSubMenus.value = true

    try {
      const response = await subMenuManagementService.getMenuForSelectForm()

      menuSelectData.value =
        response.data?.data ??
        response.data ??
        []

    } catch (error) {
      console.error('Gagal fetch menu select:', error)
    } finally {
      loadingSubMenus.value = false
    }
  }

  // ── STATUS ────────────────────────────────────
  const statusStatis = ref([
    { value: true, label: 'Aktif' },
    { value: false, label: 'Non-Aktif' },
  ])

  // ── SUBMENU SELECT ────────────────────────────
  const subMenuSelectData = ref([])

  const fetchSubMenuSelect = async () => {
    loadingSubMenus.value = true

    try {
      const response = await subMenuManagementService.getSubMenuForSelectForm()

      subMenuSelectData.value =
        response.data?.data ??
        response.data ??
        []

    } catch (error) {
      console.error('Gagal fetch submenu select:', error)
    } finally {
      loadingSubMenus.value = false
    }
  }

  // ── SAVE ──────────────────────────────────────
  const saveSubMenu = async (payload) => {
    savingSubMenu.value = true
    errorSubMenu.value = null

    try {
      await subMenuManagementService.create(payload)

      await fetchSubMenus(buildUrl())

      return true

    } catch (error) {
      errorSubMenu.value =
        error.response?.data?.errors ??
        error.response?.data?.message ??
        'Gagal menyimpan'

      return false

    } finally {
      savingSubMenu.value = false
    }
  }

  // ── UPDATE ────────────────────────────────────
  const updateSubMenu = async (id, payload) => {
    updatingSubMenu.value = true
    errorSubMenu.value = null

    try {
      await subMenuManagementService.update(id, payload)

      await fetchSubMenus(buildUrl())

      return true

    } catch (error) {
      errorSubMenu.value =
        error.response?.data?.errors ??
        error.response?.data?.message ??
        'Gagal mengupdate data'

      return false

    } finally {
      updatingSubMenu.value = false
    }
  }

  // ── DELETE ────────────────────────────────────
  const deleteSubMenu = async (id) => {
    deletingSubMenu.value = true

    try {
      await subMenuManagementService.destroy(id)

      await fetchSubMenus(buildUrl())

      return true

    } catch (error) {
      console.error('Gagal delete:', error)
      return false

    } finally {
      deletingSubMenu.value = false
    }
  }

  // ── DETAIL ────────────────────────────────────
  const fetchSubMenuDetail = async (id) => {
    loadingDetail.value = true

    try {
      const response = await subMenuManagementService.show(id)

      subMenuDetail.value =
        response.data?.data ??
        response.data ??
        null

      return subMenuDetail.value

    } catch (error) {
      console.error('Gagal fetch detail:', error)
      return null

    } finally {
      loadingDetail.value = false
    }
  }

  return {

    // state
    subMenusData,
    loadingSubMenus,
    searchSubMenus,

    pagination,
    sort,

    savingSubMenu,
    updatingSubMenu,
    deletingSubMenu,

    errorSubMenu,

    subMenuDetail,
    loadingDetail,

    // actions
    fetchSubMenus,
    buildUrl,

    searchWithDelay,
    changePageSize,

    changeSorting,
    toggleSort,

    resetFilters,

    formatDate,

    // select
    menuSelectData,
    fetchMenuSelect,

    statusStatis,

    subMenuSelectData,
    fetchSubMenuSelect,

    // crud
    saveSubMenu,
    updateSubMenu,
    deleteSubMenu,

    fetchSubMenuDetail,
  }
})