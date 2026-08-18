import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { productServices } from '@/services/productServices'

export const useProductStore = defineStore('product', () => {

  // ── LIST PRODUCT ──
  const productsData    = ref([])
  const loadingProducts = ref(false)
  const errorProduct    = ref(null)

  const searchProduct = ref('')
  let searchTimeout = null

  const pagination = reactive({
    current_page: 1,
    per_page: 10,
    prev_page_url: null,
    next_page_url: null,
    last_page: 1,
    total: 0,
  })

  const sort = reactive({
    column: 'name',
    direction: 'asc',
  })
  const sortOptions = ref([
    { value: 'name',          label: 'Nama Produk' },
    { value: 'default_code',  label: 'Kode / SKU' },
    // { value: 'list_price',    label: 'Harga Jual' },
    // { value: 'qty_available', label: 'Stok' },
  ])

  // ── SYNC (manual, tombol "Sync Sekarang") ──
  const syncing      = ref(false)
  const lastSyncedAt = ref(null)

  // ── BUILD URL ──
  const buildProductsUrl = () => {
    const params = new URLSearchParams()
    if (searchProduct.value) params.append('search', searchProduct.value)
    if (pagination.current_page) params.append('page', pagination.current_page)
    if (pagination.per_page) params.append('per_page', pagination.per_page)
    if (sort.column) {
      params.append('sort_by', sort.column)
      params.append('sort_dir', sort.direction)
    }
    return `/products?${params.toString()}`
  }

  // ── FETCH PRODUCTS ──
  const fetchProducts = async (url = null) => {
    loadingProducts.value = true
    try {
      const finalUrl = url || buildProductsUrl()
      const response = await productServices.getByUrl(finalUrl)
      const result = response.data

      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      productsData.value.splice(0, productsData.value.length, ...dataArray)

      const pag = result.pagination ?? result.data?.pagination
      if (pag) {
        pagination.current_page  = pag.current_page
        pagination.per_page      = pag.per_page
        pagination.prev_page_url = pag.prev_page_url
        pagination.next_page_url = pag.next_page_url
        pagination.last_page     = pag.last_page
        pagination.total         = pag.total
      }

      // last synced ditarik dari updated_at paling baru di halaman ini --
      // cuma perkiraan tampilan, bukan sumber kebenaran (nilai pastinya
      // dikirim balik oleh syncProducts() tiap habis sync).
      if (dataArray.length) {
        const latest = dataArray
          .map(p => p.updated_at)
          .filter(Boolean)
          .sort()
          .reverse()[0]
        if (latest) lastSyncedAt.value = latest
      }
    } catch (error) {
      errorProduct.value = error
      console.error('Gagal fetch products:', error)
    } finally {
      loadingProducts.value = false
    }
  }

  // ── SEARCH WITH DELAY ──
  const searchWithDelay = (val) => {
    clearTimeout(searchTimeout)
    searchProduct.value = val
    pagination.current_page = 1
    searchTimeout = setTimeout(() => {
      fetchProducts(buildProductsUrl())
    }, 500)
  }

  // ── CHANGE PAGE SIZE ──
  const changePageSize = () => {
    pagination.current_page = 1
    fetchProducts(buildProductsUrl())
  }

  // ── SORTING ──
  const changeSorting = () => {
    pagination.current_page = 1
    fetchProducts(buildProductsUrl())
  }

  const toggleSort = (col) => {
    if (sort.column === col) {
      sort.direction = sort.direction === 'asc' ? 'desc' : 'asc'
    } else {
      sort.column = col
      sort.direction = 'asc'
    }
    changeSorting()
  }

  // ── SYNC SEKARANG ──
  const syncProducts = async () => {
    syncing.value = true
    try {
      const res = await productServices.syncProducts()
      const result = res.data.data
      lastSyncedAt.value = result?.last_synced_at ?? lastSyncedAt.value
      pagination.current_page = 1
      await fetchProducts(buildProductsUrl())
      return result
    } finally {
      syncing.value = false
    }
  }

  // ── FORMAT ──
  const formatCurrency = (val) => {
    const num = Number(val ?? 0)
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    })
  }

  return {
    // state
    productsData, loadingProducts, errorProduct,
    searchProduct, pagination, sort, sortOptions,
    syncing, lastSyncedAt,
    // actions
    buildProductsUrl, fetchProducts,
    searchWithDelay, changePageSize, changeSorting, toggleSort,
    syncProducts, formatCurrency, formatDate,
  }
})