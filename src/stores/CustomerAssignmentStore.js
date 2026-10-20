import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { customerAssignmentServices } from '@/services/customerAssignmentService'

// Batas backend: maksimal 500 customer per sekali assign / unassign.
const MAX_PER_CALL = 500

export const useCustomerAssignmentStore = defineStore('customerAssignment', () => {

  // ── Sales (dropdown pilih sales) ──
  const salesOptions    = ref([])
  const loadingSales    = ref(false)
  const selectedSalesId = ref(null)

  const selectedSales = computed(
    () => salesOptions.value.find(s => s.id_user === selectedSalesId.value) ?? null
  )

  // ── Customer ──
  const customerData     = ref([])
  const loadingCustomers = ref(false)
  const searchCustomer   = ref('')
  let   searchTimeout    = null

  // mine       = customer milik sales terpilih
  // unassigned = customer yang belum dipegang siapa pun
  // all        = semua customer company (+ customer dipakai bersama)
  const view = ref('mine')

  // all / customer (pernah transaksi) / lead (belum pernah)
  const statusFilter = ref('all')

  // Jumlah per tab dari backend: { all, unassigned, mine }
  const counts = reactive({ all: null, unassigned: null, mine: null })

  const pagination = reactive({
    current_page: 1,
    per_page: 10,
    prev_page_url: null,
    next_page_url: null,
    last_page: 1,
    total: 0,
  })

  // ── Pilihan checkbox (tetap tersimpan saat pindah halaman) ──
  const selectedIds   = ref([])
  const selectedCount = computed(() => selectedIds.value.length)
  const isSelected    = (id) => selectedIds.value.includes(id)
  const allOnPageSelected = computed(
    () => customerData.value.length > 0 && customerData.value.every(c => selectedIds.value.includes(c.id))
  )

  const savingAssignment = ref(false)
  const errorAssignment  = ref(null)

  // ── Sync customer dari Odoo ──
  const syncing    = ref(false)
  const syncStatus = reactive({
    status: null,            // running / success / failed
    last_success_at: null,
    last_error: null,
    total_customers: 0,
    total_leads: 0,
    total_branches: 0,
  })

  // ───────────────── ERROR MESSAGE ─────────────────
  const errorMessage = (error, fallback) => {
    const res = error?.response
    if (!res) return 'Tidak bisa terhubung ke server.'

    const e = res.data?.errors
    if (res.status === 422 && (e?.invalid_sales_ids?.length || e?.invalid_customer_ids?.length)) {
      const parts = []
      if (e.invalid_sales_ids?.length)    parts.push(`sales ID ${e.invalid_sales_ids.join(', ')}`)
      if (e.invalid_customer_ids?.length) parts.push(`customer ID ${e.invalid_customer_ids.join(', ')}`)
      return `${res.data.message} (${parts.join('; ')})`
    }

    return res.data?.message ?? fallback
  }

  // ───────────────── BUILD URL ─────────────────
  const buildUrl = () => {
    const params = new URLSearchParams()

    params.append('view', view.value)
    if (selectedSalesId.value) {
      params.append('sales_id', selectedSalesId.value)   // dipakai tab "mine" + hitungan tab
    }
    if (statusFilter.value !== 'all') {
      params.append('status', statusFilter.value)
    }
    if (searchCustomer.value) {
      params.append('search', searchCustomer.value)
    }
    if (pagination.current_page) {
      params.append('page', pagination.current_page)
    }
    if (pagination.per_page) {
      params.append('per_page', pagination.per_page)
    }

    return `/customer-assignments/customers?${params.toString()}`
  }

  // ───────────────── FETCH SALES ─────────────────
  const fetchSales = async () => {
    loadingSales.value = true

    try {
      const response = await customerAssignmentServices.getSales()
      salesOptions.value = response.data?.data ?? []
    } catch (error) {
      console.error('Gagal fetch sales:', error)
      errorAssignment.value = errorMessage(error, 'Gagal memuat daftar sales')
    } finally {
      loadingSales.value = false
    }
  }

  // ───────────────── FETCH CUSTOMER ─────────────────
  const fetchCustomers = async (url = null) => {
    if (!selectedSalesId.value) {
      customerData.value = []
      return
    }

    loadingCustomers.value = true

    try {
      let finalUrl = url || buildUrl()

      // Link prev/next dari Laravel kadang http:// walau situsnya https://
      if (typeof finalUrl === 'string' && finalUrl.startsWith('http://') && window.location.protocol === 'https:') {
        finalUrl = finalUrl.replace('http://', 'https://')
      }

      const response = await customerAssignmentServices.getByUrl(finalUrl)
      const result   = response.data?.data ?? {}

      customerData.value.splice(0, customerData.value.length, ...(result.items ?? []))
      Object.assign(counts, { all: null, unassigned: null, mine: null }, result.counts ?? {})

      const meta = result.meta ?? {}
      pagination.current_page  = meta.current_page ?? 1
      pagination.per_page      = meta.per_page ?? pagination.per_page
      pagination.last_page     = meta.last_page ?? 1
      pagination.total         = meta.total ?? 0
      pagination.prev_page_url = result.links?.prev ?? null
      pagination.next_page_url = result.links?.next ?? null

      // Halaman jadi kosong setelah customer dilepas -> mundur ke halaman terakhir
      if (!customerData.value.length && pagination.current_page > pagination.last_page && pagination.last_page >= 1) {
        pagination.current_page = pagination.last_page
        loadingCustomers.value = false
        return fetchCustomers(buildUrl())
      }

    } catch (error) {
      console.error('Gagal fetch customer:', error)
      customerData.value = []
      errorAssignment.value = errorMessage(error, 'Gagal memuat daftar customer')
    } finally {
      loadingCustomers.value = false
    }
  }

  // ───────────────── PILIH SALES / TAB / STATUS ─────────────────
  const selectSales = (id) => {
    if (selectedSalesId.value === id) return

    selectedSalesId.value   = id
    view.value              = 'mine'
    searchCustomer.value    = ''
    pagination.current_page = 1
    clearSelection()
    fetchCustomers(buildUrl())
  }

  const changeView = (value) => {
    if (view.value === value) return

    view.value              = value
    pagination.current_page = 1
    clearSelection()
    fetchCustomers(buildUrl())
  }

  const changeStatus = (value) => {
    if (statusFilter.value === value) return

    statusFilter.value      = value
    pagination.current_page = 1
    fetchCustomers(buildUrl())
  }

  // ───────────────── SEARCH ─────────────────
  const searchWithDelay = () => {
    clearTimeout(searchTimeout)
    pagination.current_page = 1

    searchTimeout = setTimeout(() => {
      fetchCustomers(buildUrl())
    }, 500)
  }

  // ───────────────── PAGE SIZE ─────────────────
  const changePageSize = () => {
    pagination.current_page = 1
    fetchCustomers(buildUrl())
  }

  // ───────────────── RESET ─────────────────
  const resetFilters = () => {
    searchCustomer.value    = ''
    view.value              = 'mine'
    statusFilter.value      = 'all'
    pagination.current_page = 1
    pagination.per_page     = 10
    clearSelection()
    fetchCustomers(buildUrl())
  }

  // ───────────────── CHECKBOX ─────────────────
  const toggleSelect = (id) => {
    const i = selectedIds.value.indexOf(id)
    if (i === -1) selectedIds.value.push(id)
    else          selectedIds.value.splice(i, 1)
  }

  const toggleSelectPage = () => {
    const pageIds = customerData.value.map(c => c.id)

    if (allOnPageSelected.value) {
      selectedIds.value = selectedIds.value.filter(id => !pageIds.includes(id))
    } else {
      selectedIds.value = [...new Set([...selectedIds.value, ...pageIds])]
    }
  }

  const clearSelection = () => {
    selectedIds.value = []
  }

  // ───────────────── ASSIGN / UNASSIGN ─────────────────
  // Return: { ok: true, changed } atau { ok: false, message }
  const runInChunks = async (action, customerIds) => {
    if (!selectedSalesId.value || !customerIds.length) {
      return { ok: false, message: 'Pilih sales dan minimal satu customer.' }
    }

    savingAssignment.value = true
    errorAssignment.value  = null
    let changed = 0

    try {
      for (let i = 0; i < customerIds.length; i += MAX_PER_CALL) {
        const payload = {
          sales_ids:    [selectedSalesId.value],
          customer_ids: customerIds.slice(i, i + MAX_PER_CALL),
        }

        const response = await customerAssignmentServices[action](payload)
        const data     = response.data?.data ?? {}

        changed += action === 'assign' ? (data.inserted ?? 0) : (data.deleted ?? 0)
      }

      // Customer yang barusan diproses tidak perlu tetap dicentang
      selectedIds.value = selectedIds.value.filter(id => !customerIds.includes(id))

      await Promise.all([fetchCustomers(buildUrl()), fetchSales()])

      return { ok: true, changed }

    } catch (error) {
      const message = errorMessage(
        error,
        action === 'assign' ? 'Gagal assign customer' : 'Gagal melepas customer'
      )
      errorAssignment.value = message

      return { ok: false, message }

    } finally {
      savingAssignment.value = false
    }
  }

  const assignSelected   = () => runInChunks('assign',   [...selectedIds.value])
  const unassignSelected = () => runInChunks('unassign', [...selectedIds.value])
  const assignOne        = (customerId) => runInChunks('assign',   [customerId])
  const unassignOne      = (customerId) => runInChunks('unassign', [customerId])

  // ───────────────── SYNC CUSTOMER ─────────────────
  const fetchSyncStatus = async () => {
    try {
      const response = await customerAssignmentServices.getSyncStatus()
      Object.assign(syncStatus, response.data?.data ?? {})
    } catch (error) {
      // Status sync hanya informasi tambahan -- halaman tetap jalan tanpa ini.
      console.error('Gagal fetch status sync customer:', error)
    }
  }

  // Sync partner -> cabang -> status customer (berurutan di backend).
  // Return: { ok: true, customers, leads, branches } atau { ok: false, message }
  const syncCustomers = async () => {
    if (syncing.value) return { ok: false, message: 'Sync masih berjalan.' }

    syncing.value = true

    try {
      const response = await customerAssignmentServices.syncCustomers()
      const data     = response.data?.data ?? {}

      await Promise.all([
        fetchSyncStatus(),
        fetchSales(),
        selectedSalesId.value ? fetchCustomers(buildUrl()) : Promise.resolve(),
      ])

      return {
        ok: true,
        customers: data.total_customers ?? null,
        leads:     data.total_leads ?? null,
        branches:  data.total_branches ?? null,
      }

    } catch (error) {
      await fetchSyncStatus()
      return { ok: false, message: errorMessage(error, 'Gagal sync customer dari Odoo') }

    } finally {
      syncing.value = false
    }
  }

  // ───────────────── FORMAT ─────────────────
  const formatDateTime = (value) => {
    if (!value) return '-'
    const date = new Date(String(value).replace(' ', 'T'))
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  const formatDate = (value) => {
    if (!value) return '-'
    const date = new Date(String(value).replace(' ', 'T'))
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return {

    // state
    salesOptions,
    loadingSales,
    selectedSalesId,
    selectedSales,

    customerData,
    loadingCustomers,
    searchCustomer,
    view,
    statusFilter,
    counts,
    pagination,

    selectedIds,
    selectedCount,
    allOnPageSelected,

    savingAssignment,
    errorAssignment,

    syncing,
    syncStatus,

    // actions
    buildUrl,
    fetchSales,
    fetchCustomers,

    selectSales,
    changeView,
    changeStatus,

    searchWithDelay,
    changePageSize,
    resetFilters,

    isSelected,
    toggleSelect,
    toggleSelectPage,
    clearSelection,

    assignSelected,
    unassignSelected,
    assignOne,
    unassignOne,

    fetchSyncStatus,
    syncCustomers,

    formatDate,
    formatDateTime,
  }
})