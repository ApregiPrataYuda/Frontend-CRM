import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { productCatalogServices } from '@/services/productCatalogServices'

// ── Store untuk Product Catalog (Admin/Manager). Strukturnya mengikuti
// pola contactTypeStore.js untuk bagian listing/pagination/sort, dan
// buildFormData() dari userStore.js untuk bagian create/update (karena
// ada upload file thumbnail). ──
export const useProductCatalogStore = defineStore('productCatalog', () => {

  const productsData = ref([])
  const loadingProducts = ref(false)
  const searchProducts = ref('')
  let searchTimeout = null

  const savingProduct = ref(false)
  const updatingProduct = ref(false)
  const deletingProduct = ref(false)
  const errorProduct = ref(null)

  const productDetail = ref(null)
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

  const allowedSortColumns = ['name', 'sku', 'price', 'stock', 'created_at']

  // ── Filter opsional by kategori (dropdown di controls-row) ──
  const filters = reactive({
    category_id: '',
  })

  // ───────────────── BUILD URL ─────────────────
  const buildUrl = () => {
    const params = new URLSearchParams()

    if (searchProducts.value) {
      params.append('search', searchProducts.value)
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

    if (filters.category_id) {
      params.append('category_id', filters.category_id)
    }

    return `/product-catalog?${params.toString()}`
  }

  // ───────────────── FETCH (list, dipaginasi) ─────────────────
  const fetchProducts = async (url = null) => {
    loadingProducts.value = true

    try {
      const finalUrl = url || buildUrl()

      const response = await productCatalogServices.getByUrl(finalUrl)

      const result = response.data

      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      productsData.value.splice(0, productsData.value.length, ...dataArray)

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
      console.error('Gagal fetch products:', error)
    } finally {
      loadingProducts.value = false
    }
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

  // ───────────────── SORTING ─────────────────
  const changeSorting = () => {
    pagination.current_page = 1
    fetchProducts(buildUrl())
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

  // ───────────────── FILTERS ─────────────────
  const changeFilters = () => {
    pagination.current_page = 1
    fetchProducts(buildUrl())
  }

  // ───────────────── RESET ─────────────────
  const resetFilters = () => {
    searchProducts.value = ''
    pagination.current_page = 1
    pagination.per_page = 10

    sort.column = 'created_at'
    sort.direction = 'desc'

    filters.category_id = ''

    fetchProducts(buildUrl())
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

  // ───────────────── FORMAT CURRENCY ─────────────────
  const formatCurrency = (value) => {
    const num = Number(value ?? 0)
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
  }

  // ───────────────── DETAIL ─────────────────
  const fetchProductDetail = async (id) => {
    loadingDetail.value = true

    try {
      const response = await productCatalogServices.show(id)

      productDetail.value = response.data?.data ?? response.data

      return productDetail.value

    } catch (error) {
      console.error('Gagal fetch detail product:', error)
      return null
    } finally {
      loadingDetail.value = false
    }
  }

  // ───────────────── HELPER — Build FormData ─────────────────
  // ── Mengikuti persis pola buildFormData() di userStore.js. ──
  const buildFormData = (payload, isUpdate = false) => {
    const fd = new FormData()
    if (isUpdate) fd.append('_method', 'PUT')

    Object.entries(payload).forEach(([key, value]) => {
      if (value === null || value === undefined) return
      if (value instanceof File) {
        fd.append(key, value)
      } else if (typeof value === 'boolean') {
        fd.append(key, value ? '1' : '0')
      } else {
        fd.append(key, value)
      }
    })
    return fd
  }

  // ───────────────── clearFieldError ─────────────────
  const clearFieldError = (field) => {
    if (!errorProduct.value) return
    const updated = { ...errorProduct.value }
    delete updated[field]
    errorProduct.value = Object.keys(updated).length ? updated : null
  }

  // ───────────────── STORE ─────────────────
  const saveProduct = async (payload) => {
    savingProduct.value = true
    errorProduct.value = null

    try {
      const fd = buildFormData(payload, false)
      await productCatalogServices.create(fd)

      await fetchProducts(buildUrl())

      return true

    } catch (error) {

      if (error.response?.status === 422) {
        errorProduct.value = error.response.data.errors
      } else {
        errorProduct.value = { _general: [error.response?.data?.message ?? 'Gagal menyimpan produk'] }
      }

      return false

    } finally {
      savingProduct.value = false
    }
  }

  // ───────────────── UPDATE ─────────────────
  const updateProduct = async (id, payload) => {
    updatingProduct.value = true
    errorProduct.value = null

    try {
      const fd = buildFormData(payload, true)
      await productCatalogServices.update(id, fd)

      await fetchProducts(buildUrl())

      return true

    } catch (error) {

      if (error.response?.status === 422) {
        errorProduct.value = error.response.data.errors
      } else {
        errorProduct.value = { _general: [error.response?.data?.message ?? 'Gagal update produk'] }
      }

      return false

    } finally {
      updatingProduct.value = false
    }
  }

  // ───────────────── DELETE ─────────────────
  const deleteProduct = async (id) => {
    deletingProduct.value = true

    try {
      await productCatalogServices.destroy(id)

      await fetchProducts(buildUrl())

      return { ok: true }

    } catch (error) {

      console.error('Gagal delete product:', error)

      const message =
        error.response?.data?.message ??
        'Gagal menghapus produk'

      return { ok: false, message }

    } finally {
      deletingProduct.value = false
    }
  }

  // ───────────────── IMAGE URL HELPER ─────────────────
  // ── Mengikuti PERSIS pola store.getImageUrl() di userStore.js: URL
  // dibangun di FRONTEND dari VITE_BASE_URL, TIDAK pakai thumbnail_full_url
  // dari backend (Storage::disk('public')->url() di backend bergantung ke
  // APP_URL Laravel, yang bisa beda port/host dari VITE_BASE_URL kalau
  // APP_URL di .env Laravel tidak disetel presisi -- itu yang bikin
  // thumbnail 404 padahal foto user aman, karena foto user memang selalu
  // dibangun dari VITE_BASE_URL di sisi frontend, bukan dari backend). ──
  const getThumbnailUrl = (thumbnailUrl) => {
    if (!thumbnailUrl) return 'https://ui-avatars.com/api/?name=Product&background=6366f1&color=fff&size=80'
    if (thumbnailUrl.startsWith('http')) return thumbnailUrl
    const base = import.meta.env.VITE_BASE_URL ?? 'http://127.0.0.1:8000'
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base
    return `${cleanBase}/storage/product-catalogs/thumbnails/${thumbnailUrl}`
  }

  return {

    // state
    productsData,
    loadingProducts,
    searchProducts,

    pagination,
    sort,
    filters,

    savingProduct,
    updatingProduct,
    deletingProduct,
    errorProduct,

    productDetail,
    loadingDetail,

    // actions
    fetchProducts,
    buildUrl,

    searchWithDelay,
    changePageSize,

    changeSorting,
    toggleSort,

    changeFilters,
    resetFilters,

    formatDate,
    formatCurrency,

    fetchProductDetail,

    clearFieldError,
    saveProduct,
    updateProduct,
    deleteProduct,

    getThumbnailUrl,
  }
})