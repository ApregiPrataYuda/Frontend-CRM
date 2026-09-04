import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { cabangServices } from '@/services/cabangManagementService'

export const useCabangStore = defineStore('cabang', () => {

  const cabangData    = ref([])
  const loadingCabang = ref(false)
  const searchCabang  = ref('')
  let   searchTimeout = null

  const savingCabang   = ref(false)
  const updatingCabang = ref(false)
  const deletingCabang = ref(false)
  const errorCabang    = ref(null)

  const cabangDetail  = ref(null)
  const loadingDetail = ref(false)

  // ── Dropdown pilih Company (1 Cabang = 1 Company) ──
  const groupsOptions = ref([])
  const loadingOptions = ref(false)

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

  const allowedSortColumns = ['cabang', 'created_at']

  // ───────────────── BUILD URL ─────────────────
  const buildUrl = () => {
    const params = new URLSearchParams()

    if (searchCabang.value) {
      params.append('search', searchCabang.value)
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

    return `/master-cabang?${params.toString()}`
  }

  // ───────────────── FETCH ─────────────────
  const fetchCabang = async (url = null) => {
    loadingCabang.value = true

    try {
      let finalUrl = url || buildUrl()

      // Laravel paginate() kadang generate prev_page_url/next_page_url
      // pakai http:// walau situsnya sudah https:// (APP_URL / skema
      // request di server) -- di-normalize dulu di sini biar tidak kena
      // mixed-content block sama browser.
      if (typeof finalUrl === 'string' && finalUrl.startsWith('http://')) {
        finalUrl = finalUrl.replace('http://', 'https://')
      }

      const response = await cabangServices.getByUrl(finalUrl)

      const result = response.data

      // data array
      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      cabangData.value.splice(0, cabangData.value.length, ...dataArray)

      // pagination
      const pag = result.pagination ?? result.data?.pagination

      if (pag) {
        pagination.current_page  = pag.current_page
        pagination.per_page      = pag.per_page
        pagination.prev_page_url = pag.prev_page_url
        pagination.next_page_url = pag.next_page_url
        pagination.last_page     = pag.last_page
        pagination.total         = pag.total
      }

    } catch (error) {
      console.error('Gagal fetch cabang:', error)
    } finally {
      loadingCabang.value = false
    }
  }

  // ───────────────── SEARCH ─────────────────
  const searchWithDelay = () => {
    clearTimeout(searchTimeout)

    pagination.current_page = 1

    searchTimeout = setTimeout(() => {
      fetchCabang(buildUrl())
    }, 500)
  }

  // ───────────────── PAGE SIZE ─────────────────
  const changePageSize = () => {
    pagination.current_page = 1
    fetchCabang(buildUrl())
  }

  // ───────────────── SORTING ─────────────────
  const changeSorting = () => {
    pagination.current_page = 1
    fetchCabang(buildUrl())
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
    searchCabang.value = ''
    pagination.current_page = 1
    pagination.per_page = 10

    sort.column = 'created_at'
    sort.direction = 'desc'

    fetchCabang(buildUrl())
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
  const fetchCabangDetail = async (id) => {
    loadingDetail.value = true

    try {
      const response = await cabangServices.show(id)

      cabangDetail.value = response.data?.data ?? response.data

      return cabangDetail.value

    } catch (error) {
      console.error('Gagal fetch detail cabang:', error)
      return null
    } finally {
      loadingDetail.value = false
    }
  }

  // ───────────────── FORM OPTIONS (dropdown Company) ─────────────────
  const fetchFormOptions = async () => {
    loadingOptions.value = true

    try {
      const response = await cabangServices.getGroupsForSelectForm()

      // /group-select mengembalikan array JSON langsung (response()->json($query->get())),
      // bukan dibungkus ApiResponse -- pola sama seperti userStore.js.
      groupsOptions.value = response.data?.data ?? response.data ?? []

    } catch (error) {
      console.error('Gagal fetch opsi company:', error)
    } finally {
      loadingOptions.value = false
    }
  }

  // ───────────────── STORE ─────────────────
  const saveCabang = async (payload) => {
    savingCabang.value = true
    errorCabang.value  = null

    try {
      await cabangServices.create(payload)

      await fetchCabang(buildUrl())

      return true

    } catch (error) {

      errorCabang.value =
        error.response?.data?.errors ??
        error.response?.data?.message ??
        'Gagal menyimpan cabang'

      return false

    } finally {
      savingCabang.value = false
    }
  }

  // ───────────────── UPDATE ─────────────────
  const updateCabang = async (id, payload) => {
    updatingCabang.value = true
    errorCabang.value    = null

    try {
      await cabangServices.update(id, payload)

      await fetchCabang(buildUrl())

      return true

    } catch (error) {

      errorCabang.value =
        error.response?.data?.errors ??
        error.response?.data?.message ??
        'Gagal update cabang'

      return false

    } finally {
      updatingCabang.value = false
    }
  }

  // ───────────────── DELETE ─────────────────
  const deleteCabang = async (id) => {
    deletingCabang.value = true

    try {
      await cabangServices.destroy(id)

      await fetchCabang(buildUrl())

      return true

    } catch (error) {

      console.error('Gagal delete cabang:', error)

      return false

    } finally {
      deletingCabang.value = false
    }
  }

  return {

    // state
    cabangData,
    loadingCabang,
    searchCabang,

    pagination,
    sort,

    savingCabang,
    updatingCabang,
    deletingCabang,
    errorCabang,

    cabangDetail,
    loadingDetail,

    groupsOptions,
    loadingOptions,

    // actions
    fetchCabang,
    buildUrl,

    fetchFormOptions,

    searchWithDelay,
    changePageSize,

    changeSorting,
    toggleSort,

    resetFilters,

    formatDate,

    fetchCabangDetail,

    saveCabang,
    updateCabang,
    deleteCabang,
  }
})