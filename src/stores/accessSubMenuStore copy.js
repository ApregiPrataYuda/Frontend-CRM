import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { accessSubMenuService } from '@/services/accessSubMenuServices'

export const useAccessSubMenuStore = defineStore('accessSubMenu', () => {

  // ── STATE ──
  const accessSubMenuData    = ref([])
  const loadingAccessSubMenu = ref(false)
  const searchAccessSubMenu  = ref('')

  // FIX (memory leak) — pakai ref agar bisa di-clear
  const searchTimeout   = ref(null)
  const autoSaveTimeout = ref(null)

  const userId = ref(null)

  const pagination = reactive({
    current_page:  1,
    per_page:      10,
    prev_page_url: null,
    next_page_url: null,
    last_page:     1,
    total:         0,
  })

  // FIX #1 — gunakan nama kolom sederhana yang diterima backend
  // 'submenu.title' (dot notation) menyebabkan Laravel validation 422
  const sort = reactive({
    column:    'title',
    direction: 'asc',
  })

  const allowedSortColumns = ['title', 'created_at']

  // ── BUILD URL ──
  const buildUrl = () => {
    const params = new URLSearchParams()
    if (searchAccessSubMenu.value) params.append('search',   searchAccessSubMenu.value)
    if (pagination.current_page)   params.append('page',     pagination.current_page)
    if (pagination.per_page)       params.append('per_page', pagination.per_page)
    if (sort.column) {
      params.append('sort_by',  sort.column)
      params.append('sort_dir', sort.direction)
    }
    return `/users/${userId.value}/submenu-access?${params.toString()}`
  }

  // ── FETCH ──
  const fetchAccessSubMenu = async (url = null) => {
    if (!userId.value) return
    loadingAccessSubMenu.value = true
    try {
      const finalUrl = url || buildUrl()
      const response = await accessSubMenuService.getByUrl(finalUrl)
      const result   = response.data

      // FIX — assignment langsung lebih idiomatis
      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      accessSubMenuData.value = dataArray

      const pag = result.pagination ?? result.data?.pagination
      if (pag) {
        pagination.current_page  = pag.current_page
        pagination.per_page      = pag.per_page
        pagination.prev_page_url = pag.prev_page_url
        pagination.next_page_url = pag.next_page_url
        pagination.last_page     = pag.last_page
        pagination.total         = pag.total
      }
    } catch (err) {
      console.error('Gagal fetch access submenu:', err)
    } finally {
      loadingAccessSubMenu.value = false
    }
  }

  // ── SET USER & FETCH ──
  const setUserId = async (id) => {
    userId.value                  = id
    searchAccessSubMenu.value     = ''
    pagination.current_page       = 1
    pagination.per_page           = 10
    // FIX — reset sort ke default yang valid
    sort.column                   = 'title'
    sort.direction                = 'asc'
    await fetchAccessSubMenu()
  }

  // ── SEARCH WITH DELAY ──
  const searchWithDelay = (val) => {
    if (searchTimeout.value) clearTimeout(searchTimeout.value)
    searchAccessSubMenu.value = val
    pagination.current_page   = 1
    searchTimeout.value = setTimeout(() => {
      fetchAccessSubMenu(buildUrl())
    }, 500)
  }

  // ── CHANGE PAGE SIZE ──
  const changePageSize = () => {
    pagination.current_page = 1
    fetchAccessSubMenu(buildUrl())
  }

  // ── SORTING ──
  const changeSorting = () => {
    pagination.current_page = 1
    fetchAccessSubMenu(buildUrl())
  }

  const toggleSort = (col) => {
    if (!allowedSortColumns.includes(col)) return
    if (sort.column === col) {
      sort.direction = sort.direction === 'asc' ? 'desc' : 'asc'
    } else {
      sort.column    = col
      sort.direction = 'asc'
    }
    changeSorting()
  }

  // ── RESET FILTERS ──
  // FIX #2 — sort.column dikembalikan ke 'title' (konsisten dengan allowedSortColumns)
  const resetFilters = () => {
    searchAccessSubMenu.value = ''
    pagination.per_page       = 10
    pagination.current_page   = 1
    sort.column               = 'title'
    sort.direction            = 'asc'
    fetchAccessSubMenu(buildUrl())
  }

  // ── AUTO SAVE PERMISSION ──
  const autoSavePermission = (submenu) => {
    if (!userId.value) return Promise.resolve('no-user')
    if (autoSaveTimeout.value) clearTimeout(autoSaveTimeout.value)

    const payload = {
      can_view:   submenu.can_view   ? 1 : 0,
      can_create: submenu.can_create ? 1 : 0,
      can_update: submenu.can_update ? 1 : 0,
      can_delete: submenu.can_delete ? 1 : 0,
    }

    return new Promise((resolve) => {
      autoSaveTimeout.value = setTimeout(async () => {
        try {
          await accessSubMenuService.savePermission(
            userId.value,
            submenu.id_submenu,
            payload
          )
          resolve('success')
        } catch (err) {
          console.error('Gagal save permission:', err)
          resolve('error')
        }
      }, 300)
    })
  }

  return {
    accessSubMenuData,
    loadingAccessSubMenu,
    searchAccessSubMenu,
    pagination,
    sort,
    userId,
    fetchAccessSubMenu,
    setUserId,
    buildUrl,
    searchWithDelay,
    changePageSize,
    changeSorting,
    toggleSort,
    resetFilters,
    autoSavePermission,
  }
})