import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { productAssignmentServices } from '@/services/productAssignmentService'

// Batas backend: maksimal 500 product per sekali assign / unassign.
const MAX_PER_CALL = 500

export const useProductAssignmentStore = defineStore('productAssignment', () => {

  // ── Sales (dropdown pilih sales) ──
  const salesOptions    = ref([])
  const loadingSales    = ref(false)
  const selectedSalesId = ref(null)

  const selectedSales = computed(
    () => salesOptions.value.find(s => s.id_user === selectedSalesId.value) ?? null
  )

  // ── Product ──
  const productData     = ref([])
  const loadingProducts = ref(false)
  const searchProduct   = ref('')
  let   searchTimeout   = null

  // mine       = product milik sales terpilih
  // unassigned = product yang belum dipegang siapa pun
  // all        = semua product company
  const view = ref('mine')

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
    () => productData.value.length > 0 && productData.value.every(p => selectedIds.value.includes(p.id))
  )

  const savingAssignment = ref(false)
  const errorAssignment  = ref(null)

  // ── Sync product dari Odoo ──
  const syncing      = ref(false)
  const syncStatus   = reactive({
    status: null,          // running / success / failed
    last_success_at: null,
    last_error: null,
    total_products: 0,
  })

  // ───────────────── ERROR MESSAGE ─────────────────
  const errorMessage = (error, fallback) => {
    const res = error?.response
    if (!res) return 'Tidak bisa terhubung ke server.'

    const e = res.data?.errors
    if (res.status === 422 && (e?.invalid_sales_ids?.length || e?.invalid_product_ids?.length)) {
      const parts = []
      if (e.invalid_sales_ids?.length)   parts.push(`sales ID ${e.invalid_sales_ids.join(', ')}`)
      if (e.invalid_product_ids?.length) parts.push(`product ID ${e.invalid_product_ids.join(', ')}`)
      return `${res.data.message} (${parts.join('; ')})`
    }

    return res.data?.message ?? fallback
  }

  // ───────────────── BUILD URL ─────────────────
  const buildUrl = () => {
    const params = new URLSearchParams()

    if (view.value === 'mine' && selectedSalesId.value) {
      params.append('sales_id', selectedSalesId.value)
    }
    if (view.value === 'unassigned') {
      params.append('status', 'unassigned')
    }
    if (searchProduct.value) {
      params.append('search', searchProduct.value)
    }
    if (pagination.current_page) {
      params.append('page', pagination.current_page)
    }
    if (pagination.per_page) {
      params.append('per_page', pagination.per_page)
    }

    return `/product-assignments/products?${params.toString()}`
  }

  // ───────────────── FETCH SALES ─────────────────
  const fetchSales = async () => {
    loadingSales.value = true

    try {
      const response = await productAssignmentServices.getSales()
      salesOptions.value = response.data?.data ?? []
    } catch (error) {
      console.error('Gagal fetch sales:', error)
      errorAssignment.value = errorMessage(error, 'Gagal memuat daftar sales')
    } finally {
      loadingSales.value = false
    }
  }

  // ───────────────── FETCH PRODUCT ─────────────────
  const fetchProducts = async (url = null) => {
    if (!selectedSalesId.value) {
      productData.value = []
      return
    }

    loadingProducts.value = true

    try {
      let finalUrl = url || buildUrl()

      // Link prev/next dari Laravel kadang http:// walau situsnya https://
      if (typeof finalUrl === 'string' && finalUrl.startsWith('http://') && window.location.protocol === 'https:') {
        finalUrl = finalUrl.replace('http://', 'https://')
      }

      const response = await productAssignmentServices.getByUrl(finalUrl)
      const result   = response.data?.data ?? {}

      productData.value.splice(0, productData.value.length, ...(result.items ?? []))

      const meta = result.meta ?? {}
      pagination.current_page  = meta.current_page ?? 1
      pagination.per_page      = meta.per_page ?? pagination.per_page
      pagination.last_page     = meta.last_page ?? 1
      pagination.total         = meta.total ?? 0
      pagination.prev_page_url = result.links?.prev ?? null
      pagination.next_page_url = result.links?.next ?? null

      // Halaman jadi kosong setelah product dilepas -> mundur ke halaman terakhir
      if (!productData.value.length && pagination.current_page > pagination.last_page && pagination.last_page >= 1) {
        pagination.current_page = pagination.last_page
        loadingProducts.value = false
        return fetchProducts(buildUrl())
      }

    } catch (error) {
      console.error('Gagal fetch product:', error)
      productData.value = []
      errorAssignment.value = errorMessage(error, 'Gagal memuat daftar product')
    } finally {
      loadingProducts.value = false
    }
  }

  // ───────────────── PILIH SALES / TAB ─────────────────
  const selectSales = (id) => {
    if (selectedSalesId.value === id) return

    selectedSalesId.value   = id
    view.value              = 'mine'
    searchProduct.value     = ''
    pagination.current_page = 1
    clearSelection()
    fetchProducts(buildUrl())
  }

  const changeView = (value) => {
    if (view.value === value) return

    view.value              = value
    pagination.current_page = 1
    clearSelection()
    fetchProducts(buildUrl())
  }

  // ───────────────── SEARCH ─────────────────
  const searchWithDelay = () => {
    clearTimeout(searchTimeout)
    pagination.current_page = 1

    searchTimeout = setTimeout(() => {
      fetchProducts(buildUrl())
    }, 500)
  }

  // ───────────────── PAGE SIZE ─────────────────
  const changePageSize = () => {
    pagination.current_page = 1
    fetchProducts(buildUrl())
  }

  // ───────────────── RESET ─────────────────
  const resetFilters = () => {
    searchProduct.value     = ''
    view.value              = 'mine'
    pagination.current_page = 1
    pagination.per_page     = 10
    clearSelection()
    fetchProducts(buildUrl())
  }

  // ───────────────── CHECKBOX ─────────────────
  const toggleSelect = (id) => {
    const i = selectedIds.value.indexOf(id)
    if (i === -1) selectedIds.value.push(id)
    else          selectedIds.value.splice(i, 1)
  }

  const toggleSelectPage = () => {
    const pageIds = productData.value.map(p => p.id)

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
  const runInChunks = async (action, productIds) => {
    if (!selectedSalesId.value || !productIds.length) {
      return { ok: false, message: 'Pilih sales dan minimal satu product.' }
    }

    savingAssignment.value = true
    errorAssignment.value  = null
    let changed = 0

    try {
      for (let i = 0; i < productIds.length; i += MAX_PER_CALL) {
        const payload = {
          sales_ids:   [selectedSalesId.value],
          product_ids: productIds.slice(i, i + MAX_PER_CALL),
        }

        const response = await productAssignmentServices[action](payload)
        const data     = response.data?.data ?? {}

        changed += action === 'assign' ? (data.inserted ?? 0) : (data.deleted ?? 0)
      }

      // Product yang barusan diproses tidak perlu tetap dicentang
      selectedIds.value = selectedIds.value.filter(id => !productIds.includes(id))

      await Promise.all([fetchProducts(buildUrl()), fetchSales()])

      return { ok: true, changed }

    } catch (error) {
      const message = errorMessage(
        error,
        action === 'assign' ? 'Gagal assign product' : 'Gagal melepas product'
      )
      errorAssignment.value = message

      return { ok: false, message }

    } finally {
      savingAssignment.value = false
    }
  }

  const assignSelected   = () => runInChunks('assign',   [...selectedIds.value])
  const unassignSelected = () => runInChunks('unassign', [...selectedIds.value])
  const assignOne        = (productId) => runInChunks('assign',   [productId])
  const unassignOne      = (productId) => runInChunks('unassign', [productId])

  // ───────────────── SYNC PRODUCT ─────────────────
  const fetchSyncStatus = async () => {
    try {
      const response = await productAssignmentServices.getSyncStatus()
      Object.assign(syncStatus, response.data?.data ?? {})
    } catch (error) {
      // Status sync hanya informasi tambahan -- halaman tetap jalan tanpa ini.
      console.error('Gagal fetch status sync:', error)
    }
  }

  // Sync product (+ gambar + stok) lalu PO, dijalankan berurutan di backend.
  // Return: { ok: true, total, totalPo } atau { ok: false, message }
  const syncProducts = async () => {
    if (syncing.value) return { ok: false, message: 'Sync masih berjalan.' }

    syncing.value = true

    try {
      const response = await productAssignmentServices.syncProducts()
      const data     = response.data?.data ?? {}

      await Promise.all([
        fetchSyncStatus(),
        fetchSales(),
        selectedSalesId.value ? fetchProducts(buildUrl()) : Promise.resolve(),
      ])

      return {
        ok: true,
        total: data.total_products ?? syncStatus.total_products,
        totalPo: data.total_purchase_orders ?? null,
      }

    } catch (error) {
      await fetchSyncStatus()
      return { ok: false, message: errorMessage(error, 'Gagal sync product dari Odoo') }

    } finally {
      syncing.value = false
    }
  }

  // ───────────────── FORMAT ─────────────────
  const formatPrice = (value) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
      .format(value ?? 0)

  const formatDateTime = (value) => {
    if (!value) return '-'
    const date = new Date(String(value).replace(' ', 'T'))
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  return {

    // state
    salesOptions,
    loadingSales,
    selectedSalesId,
    selectedSales,

    productData,
    loadingProducts,
    searchProduct,
    view,
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
    fetchProducts,

    selectSales,
    changeView,

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
    syncProducts,

    formatPrice,
    formatDateTime,
  }
})