import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { menuServices } from '@/services/menuManagementService'

export const useMenuStore = defineStore('menu', () => {
  const menusData = ref([])
  const loadingMenus = ref(false)
  const searchMenus = ref('')
  let searchTimeout = null

  const savingMenu = ref(false)
  const updatingMenu = ref(false)
  const deletingMenu = ref(false)
  const errorMenu = ref(null)

  const menuDetail = ref(null)
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

   const allowedSortColumns = ['menu', 'created_at']


    // ── BUILD URL ──
  const buildUrl = () => {
    const params = new URLSearchParams()
    if (searchMenus.value) params.append('search', searchMenus.value)
    if (pagination.current_page) params.append('page', pagination.current_page)
    if (pagination.per_page) params.append('per_page', pagination.per_page)
    if (sort.column) {
      params.append('sort_by', sort.column)
      params.append('sort_dir', sort.direction)
    }
    return `/menu-management?${params.toString()}`
  }

const fetchMenus = async (url = null) => {
  loadingMenus.value = true
  try {
    const finalUrl = url || buildUrl()
    const response = await menuServices.getByUrl(finalUrl)
    const result = response.data

    // ambil data array
    const dataArray = Array.isArray(result.data)
      ? result.data
      : result.data?.data ?? []

    menusData.value.splice(0, menusData.value.length, ...dataArray)

    // ambil pagination
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
    console.error('Gagal fetch menus:', error)
  } finally {
    loadingMenus.value = false
  }
}


 // ── SEARCH WITH DELAY ──
  const searchWithDelay = (val) => {
    clearTimeout(searchTimeout)
    searchMenus.value = val
    pagination.current_page = 1
    searchTimeout = setTimeout(() => {
      fetchMenus(buildUrl())
    }, 500)
  }

  // ── CHANGE PAGE SIZE ──
  const changePageSize = () => {
    pagination.current_page = 1
    fetchMenus(buildUrl())
  }

  // ── SORTING ──
  const changeSorting = () => {
    pagination.current_page = 1
    fetchMenus(buildUrl())
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

  // ── RESET ──
  const resetFilters = () => {
    searchMenus.value = ''
    pagination.per_page = 10
    pagination.current_page = 1
    sort.column = 'created_at'
    sort.direction = 'desc'
    fetchMenus(buildUrl())
  }

  // ── FORMAT DATE ──
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Belum pernah diupdate'
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    })
  }


  // ── DETAIL ──
  const detailMenu = async (id) => {
    loadingDetail.value = true
    try {
      const res = await menuServices.show(id)
      menuDetail.value = res.data.data
    } catch (err) {
      console.error('Gagal ambil detail menu:', err)
      throw err
    } finally {
      loadingDetail.value = false
    }
  }

  // ── STORE ──
  const storeMenu = async (payload) => {
    savingMenu.value = true
    errorMenu.value = null
    try {
      const res = await menuServices.create(payload)
      await fetchMenus(buildUrl())
      return res.data
    } catch (err) {
      if (err.response?.status === 422) {
        errorMenu.value = err.response.data.errors
      }
      throw err
    } finally {
      savingMenu.value = false
    }
  }

  // ── UPDATE ──
  const updateMenu = async (id, payload) => {
    updatingMenu.value = true
    errorMenu.value = null
    try {
      await menuServices.update(id, payload)
      await fetchMenus(buildUrl())
    } catch (err) {
      if (err.response?.status === 422) {
        errorMenu.value = err.response.data.errors
      }
      throw err
    } finally {
      updatingMenu.value = false
    }
  }


  // ── DELETE ──
    const deleteMenu = async (id) => {
      deletingMenu.value = true
      try {
        await menuServices.destroy(id)
        await fetchMenus(buildUrl())
      } catch (err) {
        throw err
      } finally {
        deletingMenu.value = false
      }
    }


 return {
    menusData, loadingMenus, searchMenus,
    pagination, sort,
    savingMenu, updatingMenu, deletingMenu, errorMenu,
    menuDetail, loadingDetail,
    fetchMenus, buildUrl,
    searchWithDelay, changePageSize,
    changeSorting, toggleSort, resetFilters,
    formatDate,
    detailMenu,
    storeMenu, updateMenu,
    deleteMenu,
  }
})