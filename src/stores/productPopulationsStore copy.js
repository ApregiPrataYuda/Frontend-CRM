import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { productPopulationsServices } from '@/services/productPopulationsServices'

export const useProductPopulationsStore = defineStore('productPopulations', () => {

  // ── STATE ──────────────────────────────────────────
  const productPopulationsData    = ref([])
  const loadingProductPopulations = ref(false)
  const searchProductPopulations  = ref('')
  let   searchTimeout             = null

  const savingProductPopulations   = ref(false)
  const updatingProductPopulations = ref(false)
  const deletingProductPopulations = ref(false)
  const errorProductPopulations    = ref(null)

  const productPopulationDetail = ref(null)
  const loadingDetail           = ref(false)

  const pagination = reactive({
    current_page  : 1,
    per_page      : 10,
    prev_page_url : null,
    next_page_url : null,
    last_page     : 1,
    total         : 0,
  })

  const sort = reactive({
    // NOTE: value di sini harus persis sama dengan whitelist $allowedSort
    // di CustomersProductPopulation@index (pakai prefix "pp." karena
    // itu alias tabel di raw query backend), kecuali customer_name.
    column   : 'pp.created_at',
    direction: 'desc',
  })

  const allowedSortColumns = ['pp.created_at', 'pp.tag_no', 'pp.pump_serial_no', 'pp.qty', 'customer_name']

  // ── VIEW MODE: all | mine | incomplete ────────────
  const view = ref('all')

  const counts        = reactive({ all: 0, mine: 0, incomplete: 0 })
  const loadingCounts = ref(false)


  // ── BUILD URL ──────────────────────────────────────
  const buildUrl = () => {
    const params = new URLSearchParams()
    if (view.value)                    params.append('view',     view.value)
    if (searchProductPopulations.value) params.append('search',   searchProductPopulations.value)
    if (pagination.current_page)        params.append('page',     pagination.current_page)
    if (pagination.per_page)            params.append('per_page', pagination.per_page)
    if (sort.column) {
      params.append('sort_by',  sort.column)
      params.append('sort_dir', sort.direction)
    }
    return `/product-populations?${params.toString()}`
  }


  // ── FETCH LIST ────────────────────────────────────
  const fetchProductPopulations = async (url = null) => {
    loadingProductPopulations.value = true

    try {
      const finalUrl = url || buildUrl()
      const response = await productPopulationsServices.getByUrl(finalUrl)
      const result    = response.data

      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      productPopulationsData.value.splice(
        0,
        productPopulationsData.value.length,
        ...dataArray
      )

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
      console.error('Gagal fetch product population:', error)
      productPopulationsData.value = []
    } finally {
      loadingProductPopulations.value = false
    }
  }


  // ── COUNTS: badge 3 tab ────────────────────────────
  const fetchCounts = async () => {
    loadingCounts.value = true
    try {
      const envelope = await productPopulationsServices.getCounts()
      const result   = envelope.data ?? {}

      counts.all        = result.all ?? 0
      counts.mine        = result.mine ?? 0
      counts.incomplete = result.incomplete ?? 0
    } catch (error) {
      console.error('Gagal fetch counts product population:', error)
    } finally {
      loadingCounts.value = false
    }
  }


  // ── GANTI TAB (all / mine / incomplete) ───────────
  const changeView = (newView) => {
    view.value               = newView
    pagination.current_page  = 1
    fetchProductPopulations(buildUrl())
  }


  // ── DETAIL ────────────────────────────────────────
  const detailProductPopulation = async (id) => {
    loadingDetail.value = true
    try {
      const res = await productPopulationsServices.show(id)
      productPopulationDetail.value = res.data.data
    } catch (err) {
      console.error('Gagal fetch detail product population:', err)
      throw err
    } finally {
      loadingDetail.value = false
    }
  }


  // ── CREATE ────────────────────────────────────────
  const saveProductPopulation = async (payload) => {
    savingProductPopulations.value = true
    errorProductPopulations.value  = null
    try {
      const res = await productPopulationsServices.create(payload)
      await fetchProductPopulations(buildUrl())
      await fetchCounts()
      return res
    } catch (err) {
      if (err.response?.status === 422) {
        errorProductPopulations.value = err.response.data.errors
      }
      throw err
    } finally {
      savingProductPopulations.value = false
    }
  }


  // ── UPDATE ────────────────────────────────────────
  // Dipakai juga oleh admin/manager buat "melengkapi" data yang tadinya
  // masuk tab incomplete — begitu customer_id/user_id keisi lewat form
  // edit yang sama, baris ini otomatis pindah tab pas fetchCounts() jalan.
  const updateProductPopulation = async (id, payload) => {
    updatingProductPopulations.value = true
    errorProductPopulations.value    = null
    try {
      const res = await productPopulationsServices.update(id, payload)
      await fetchProductPopulations(buildUrl())
      await fetchCounts()
      return res
    } catch (err) {
      if (err.response?.status === 422) {
        errorProductPopulations.value = err.response.data.errors
      }
      throw err
    } finally {
      updatingProductPopulations.value = false
    }
  }


  // ── DELETE ────────────────────────────────────────
  const deleteProductPopulation = async (id) => {
    deletingProductPopulations.value = true
    try {
      await productPopulationsServices.destroy(id)
      await fetchProductPopulations(buildUrl())
      await fetchCounts()
    } catch (err) {
      throw err
    } finally {
      deletingProductPopulations.value = false
    }
  }


  // ── SEARCH WITH DEBOUNCE ─────────────────────────
  const searchWithDelay = (val) => {
    clearTimeout(searchTimeout)
    searchProductPopulations.value = val
    pagination.current_page        = 1
    searchTimeout = setTimeout(() => fetchProductPopulations(buildUrl()), 500)
  }

  const changePageSize = () => {
    pagination.current_page = 1
    fetchProductPopulations(buildUrl())
  }

  const changeSorting = () => {
    pagination.current_page = 1
    fetchProductPopulations(buildUrl())
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

  const resetFilters = () => {
    searchProductPopulations.value = ''
    pagination.per_page            = 10
    pagination.current_page        = 1
    sort.column                    = 'pp.created_at'
    sort.direction                 = 'desc'
    view.value                     = 'all'
    fetchProductPopulations(buildUrl())
  }


  // ── FORMAT DATE ───────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('id-ID', {
      year : 'numeric',
      month: 'long',
      day  : '2-digit',
    })
  }


  // ── STATUS CONFIG (complete / no_customer / no_pic / empty) ──
  const getStatusConfig = (status) => {
    const map = {
      complete   : { bg: 'bg-emerald-100 text-emerald-600', label: 'bg-success', icon: 'fa-solid fa-circle-check',        text: 'Lengkap' },
      no_customer: { bg: 'bg-amber-100 text-amber-600',     label: 'bg-warning', icon: 'fa-solid fa-ban',                 text: 'Belum Ada Customer' },
      no_pic     : { bg: 'bg-amber-100 text-amber-600',     label: 'bg-warning', icon: 'fa-solid fa-user-slash',          text: 'Belum Ada PIC' },
      empty      : { bg: 'bg-red-100 text-red-500',         label: 'bg-danger',  icon: 'fa-solid fa-triangle-exclamation', text: 'Data Kosong' },
    }
    return map[status] ?? { bg: 'bg-slate-100 text-slate-500', label: 'bg-secondary', icon: 'fa-solid fa-tag', text: status }
  }


  // ── SELECT: SALES (dropdown PIC di modal Add/Edit & Assign Sales) ──
  const salesSelectData = ref([])

  const fetchSalesSelect = async () => {
    try {
      const data = await productPopulationsServices.getSales()
      salesSelectData.value = data
    } catch (error) {
      console.error('Gagal fetch sales select:', error)
    }
  }


  // ── SEARCH CUSTOMER (autocomplete di modal Add/Edit) ──
  const customerSuggestions    = ref([])
  const searchingCustomer      = ref(false)
  let   customerSearchTimeout  = null

  const searchCustomerName = (val) => {
    clearTimeout(customerSearchTimeout)
    if (!val || val.length < 2) {
      customerSuggestions.value = []
      return
    }
    customerSearchTimeout = setTimeout(async () => {
      searchingCustomer.value = true
      try {
        const res = await productPopulationsServices.searchCustomer(val)
        customerSuggestions.value = res.data.data ?? []
      } catch (err) {
        console.error('Gagal search customer:', err)
        customerSuggestions.value = []
      } finally {
        searchingCustomer.value = false
      }
    }, 400)
  }


  // ── UNASSIGNED: list data customer yang belum ada PIC ─────
  // Khusus admin/manager, isi modal "Assign Sales" di tab Semua Data.
  const unassignedData          = ref([])
  const loadingUnassigned       = ref(false)
  const searchUnassigned        = ref('')
  let   unassignedSearchTimeout = null

  const fetchUnassigned = async () => {
    loadingUnassigned.value = true
    try {
      const envelope = await productPopulationsServices.getUnassigned(
        searchUnassigned.value ? { search: searchUnassigned.value } : {}
      )
      unassignedData.value = envelope.data ?? []
    } catch (error) {
      console.error('Gagal fetch unassigned product population:', error)
      unassignedData.value = []
    } finally {
      loadingUnassigned.value = false
    }
  }

  const searchUnassignedWithDelay = (val) => {
    clearTimeout(unassignedSearchTimeout)
    searchUnassigned.value = val
    unassignedSearchTimeout = setTimeout(fetchUnassigned, 400)
  }


  // ── ASSIGN SALES (bulk assign PIC) ────────────────
  const assigningSales = ref(false)
  const errorAssign     = ref(null)

  const assignSales = async (ids, targetUserId) => {
    assigningSales.value = true
    errorAssign.value    = null
    try {
      const res = await productPopulationsServices.assign({
        ids,
        user_id: targetUserId,
      })
      // refresh semua yang kepengaruh: list unassigned, list utama, dan badge count
      await fetchUnassigned()
      await fetchProductPopulations(buildUrl())
      await fetchCounts()
      return res
    } catch (err) {
      if (err.response?.status === 422) {
        errorAssign.value = err.response.data.errors
      }
      throw err
    } finally {
      assigningSales.value = false
    }
  }


  // ── RETURN ────────────────────────────────────────
  return {
    // state list utama
    productPopulationsData, loadingProductPopulations, searchProductPopulations,
    pagination, sort,
    savingProductPopulations, updatingProductPopulations, deletingProductPopulations, errorProductPopulations,
    productPopulationDetail, loadingDetail,

    // view mode (all / mine / incomplete) + counts badge
    view, counts, loadingCounts,
    changeView, fetchCounts,

    // actions list utama
    buildUrl,
    fetchProductPopulations,
    detailProductPopulation,
    saveProductPopulation,
    updateProductPopulation,
    deleteProductPopulation,
    searchWithDelay,
    changePageSize,
    changeSorting,
    toggleSort,
    resetFilters,

    // helpers
    formatDate,
    getStatusConfig,

    // select sales (PIC)
    salesSelectData,
    fetchSalesSelect,

    // search customer (autocomplete)
    customerSuggestions, searchingCustomer,
    searchCustomerName,

    // unassigned + assign sales (khusus admin/manager)
    unassignedData, loadingUnassigned, searchUnassigned,
    fetchUnassigned, searchUnassignedWithDelay,
    assigningSales, errorAssign, assignSales,
  }
})