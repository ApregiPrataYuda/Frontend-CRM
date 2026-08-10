import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { customersPopulationServices } from '@/services/customersPopulationServices'

export const usecustomersPopulationStore = defineStore('customers', () => {
  const customersData = ref([])
  const loadingCustomers = ref(false)
  const searchCustomers = ref('')
  let searchTimeout = null

  const filterPurchased = ref('all') // 'all' | 'has_purchased'

  const errorCustomers = ref(null)

  const customerDetail = ref(null)
  const purchaseItems = ref([])
  const loadingDetail = ref(false)

  const syncingCustomers = ref(false)
  const syncingPurchases = ref(false)

  // ── DASHBOARD / SUMMARY ──
  const summaryData = ref(null)
  const loadingSummary = ref(false)

  // ═══ BARU: ASSIGN SALES ═══
  const salesOptions = ref([])          // list sales untuk dropdown
  const loadingSalesOptions = ref(false)
  const assigningSales = ref(false)
  const errorAssign = ref(null)

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

  const allowedSortColumns = ['name', 'total_transaksi', 'created_at']

  // ── BUILD URL ──
  const buildUrl = () => {
    const params = new URLSearchParams()
    if (searchCustomers.value) params.append('search', searchCustomers.value)
    if (filterPurchased.value) params.append('filter', filterPurchased.value)
    if (pagination.current_page) params.append('page', pagination.current_page)
    if (pagination.per_page) params.append('per_page', pagination.per_page)
    if (sort.column) {
      params.append('sort_by', sort.column)
      params.append('sort_dir', sort.direction)
    }
    return `/customers/population?${params.toString()}`
  }

  // ── FETCH ──
  const fetchCustomers = async (url = null) => {
    loadingCustomers.value = true
    try {
      const finalUrl = url || buildUrl()
      const response = await customersPopulationServices.getByUrl(finalUrl)
      const result = response.data

      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      customersData.value.splice(0, customersData.value.length, ...dataArray)

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
      console.error('Gagal fetch customers:', error)
    } finally {
      loadingCustomers.value = false
    }
  }

  // ── FETCH SUMMARY (untuk dashboard) ──
  const fetchSummary = async () => {
    loadingSummary.value = true
    try {
      const response = await customersPopulationServices.summaryPopulationCustomer()
      summaryData.value = response.data.data
    } catch (error) {
      console.error('Gagal fetch summary:', error)
    } finally {
      loadingSummary.value = false
    }
  }

  // ── SEARCH WITH DELAY ──
  const searchWithDelay = (val) => {
    clearTimeout(searchTimeout)
    searchCustomers.value = val
    pagination.current_page = 1
    searchTimeout = setTimeout(() => {
      fetchCustomers(buildUrl())
    }, 500)
  }

  // ── FILTER (All / Has Purchased) ──
  const changeFilter = (val) => {
    filterPurchased.value = val
    pagination.current_page = 1
    fetchCustomers(buildUrl())
  }

  // ── CHANGE PAGE SIZE ──
  const changePageSize = () => {
    pagination.current_page = 1
    fetchCustomers(buildUrl())
  }

  // ── SORTING ──
  const changeSorting = () => {
    pagination.current_page = 1
    fetchCustomers(buildUrl())
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
    searchCustomers.value = ''
    filterPurchased.value = 'all'
    pagination.per_page = 10
    pagination.current_page = 1
    sort.column = 'created_at'
    sort.direction = 'desc'
    fetchCustomers(buildUrl())
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

  // ── FORMAT CURRENCY ──
  const formatCurrency = (value) => {
    const num = Number(value ?? 0)
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num)
  }

  // ── DETAIL (customer + purchase items) ──
  const detailCustomer = async (id) => {
    loadingDetail.value = true
    try {
      const res = await customersPopulationServices.show(id)
      customerDetail.value = res.data.data?.customer ?? null
      purchaseItems.value  = res.data.data?.purchases ?? []
    } catch (err) {
      console.error('Gagal ambil detail customer:', err)
      throw err
    } finally {
      loadingDetail.value = false
    }
  }

  // ── SYNC ──
  const syncCustomers = async () => {
    syncingCustomers.value = true
    try {
      const res = await customersPopulationServices.syncCustomers()
      await fetchCustomers(buildUrl())
      return res.data
    } catch (err) {
      console.error('Gagal sync customers:', err)
      throw err
    } finally {
      syncingCustomers.value = false
    }
  }

  const syncCustomerPurchases = async () => {
    syncingPurchases.value = true
    try {
      const res = await customersPopulationServices.syncCustomerPurchases()
      await fetchCustomers(buildUrl())
      return res.data
    } catch (err) {
      console.error('Gagal sync purchases:', err)
      throw err
    } finally {
      syncingPurchases.value = false
    }
  }

  // ═══ BARU: ASSIGN SALES ═══

  // ── FETCH LIST SALES (untuk dropdown) ──
  const fetchSalesOptions = async () => {
    loadingSalesOptions.value = true
    try {
      const res = await customersPopulationServices.getSalesList()
      salesOptions.value = res.data.data ?? []
    } catch (err) {
      console.error('Gagal fetch sales options:', err)
      salesOptions.value = []
    } finally {
      loadingSalesOptions.value = false
    }
  }

  // ── ASSIGN customer ke sales ──
  const assignCustomerToSales = async (odooCustomerId, salesId) => {
    assigningSales.value = true
    errorAssign.value = null
    try {
      const res = await customersPopulationServices.assignSales({
        odoo_customer_id: odooCustomerId,
        sales_id: salesId,
      })

      // Update data di list yang sedang tampil, biar tidak perlu refetch semua
      const target = customersData.value.find(c => c.odoo_partner_id === odooCustomerId)
      if (target) {
        target.sales_id = salesId
        const sales = salesOptions.value.find(s => s.id_user === salesId)
        target.assigned_name = sales?.fullname ?? target.assigned_name
      }

      return res.data
    } catch (err) {
      errorAssign.value = err.response?.data?.message || 'Gagal assign customer ke sales'
      throw err
    } finally {
      assigningSales.value = false
    }
  }

  // ── UNASSIGN customer dari sales ──
  const unassignCustomerFromSales = async (odooCustomerId) => {
    assigningSales.value = true
    errorAssign.value = null
    try {
      const res = await customersPopulationServices.unassignSales({
        odoo_customer_id: odooCustomerId,
      })

      const target = customersData.value.find(c => c.odoo_partner_id === odooCustomerId)
      if (target) {
        target.sales_id = null
        target.assigned_name = null
      }

      return res.data
    } catch (err) {
      errorAssign.value = err.response?.data?.message || 'Gagal unassign customer'
      throw err
    } finally {
      assigningSales.value = false
    }
  }

  return {
    // state
    customersData, loadingCustomers, searchCustomers,
    filterPurchased, errorCustomers,
    pagination, sort,
    customerDetail, purchaseItems, loadingDetail,
    syncingCustomers, syncingPurchases,
    summaryData, loadingSummary,
    // BARU
    salesOptions, loadingSalesOptions, assigningSales, errorAssign,
    // actions
    buildUrl,
    fetchCustomers,
    fetchSummary,
    searchWithDelay, changeFilter, changePageSize,
    changeSorting, toggleSort, resetFilters,
    formatDate, formatCurrency,
    detailCustomer,
    syncCustomers, syncCustomerPurchases,
    // BARU
    fetchSalesOptions, assignCustomerToSales, unassignCustomerFromSales,
  }
})