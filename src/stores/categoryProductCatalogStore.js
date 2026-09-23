import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { categoryProductCatalogServices } from '@/services/categoryProductCatalogServices'

// ── Store untuk Kategori Product Catalog. Strukturnya sengaja dibuat
// semirip mungkin dengan contactTypeStore.js. Bedanya: ada relasi
// parent_id (struktur pohon) dan dropdown select() flat untuk dipakai
// di form Add/Edit Product Catalog. ──
export const useCategoryProductCatalogStore = defineStore('categoryProductCatalog', () => {

  const categoriesData = ref([])
  const loadingCategories = ref(false)
  const searchCategories = ref('')
  let searchTimeout = null

  const savingCategory = ref(false)
  const updatingCategory = ref(false)
  const deletingCategory = ref(false)
  const errorCategory = ref(null)

  const categoryDetail = ref(null)
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

  const allowedSortColumns = ['name', 'created_at']

  // ── Dropdown flat semua kategori (tanpa pagination), dipakai di form
  // Add/Edit Product Catalog & filter parent_id. ──
  const categoryOptions = ref([])
  const loadingCategoryOptions = ref(false)

  // ───────────────── BUILD URL ─────────────────
  const buildUrl = () => {
    const params = new URLSearchParams()

    if (searchCategories.value) {
      params.append('search', searchCategories.value)
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

    return `/category-product-catalog?${params.toString()}`
  }

  // ───────────────── FETCH (list, dipaginasi) ─────────────────
  const fetchCategories = async (url = null) => {
    loadingCategories.value = true

    try {
      const finalUrl = url || buildUrl()

      const response = await categoryProductCatalogServices.getByUrl(finalUrl)

      const result = response.data

      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      categoriesData.value.splice(0, categoriesData.value.length, ...dataArray)

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
      console.error('Gagal fetch categories:', error)
    } finally {
      loadingCategories.value = false
    }
  }

  // ───────────────── FETCH OPTIONS (dropdown) ─────────────────
  const fetchCategoryOptions = async () => {
    loadingCategoryOptions.value = true

    try {
      const response = await categoryProductCatalogServices.select()

      const dataArray = Array.isArray(response.data) ? response.data : []

      categoryOptions.value.splice(0, categoryOptions.value.length, ...dataArray)

    } catch (error) {
      console.error('Gagal fetch category options:', error)
    } finally {
      loadingCategoryOptions.value = false
    }
  }

  // ───────────────── SEARCH ─────────────────
  const searchWithDelay = () => {
    clearTimeout(searchTimeout)

    pagination.current_page = 1

    searchTimeout = setTimeout(() => {
      fetchCategories(buildUrl())
    }, 500)
  }

  // ───────────────── PAGE SIZE ─────────────────
  const changePageSize = () => {
    pagination.current_page = 1
    fetchCategories(buildUrl())
  }

  // ───────────────── SORTING ─────────────────
  const changeSorting = () => {
    pagination.current_page = 1
    fetchCategories(buildUrl())
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

  // ───────────────── RESET ─────────────────
  const resetFilters = () => {
    searchCategories.value = ''
    pagination.current_page = 1
    pagination.per_page = 10

    sort.column = 'created_at'
    sort.direction = 'desc'

    fetchCategories(buildUrl())
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
  const fetchCategoryDetail = async (id) => {
    loadingDetail.value = true

    try {
      const response = await categoryProductCatalogServices.show(id)

      categoryDetail.value = response.data?.data ?? response.data

      return categoryDetail.value

    } catch (error) {
      console.error('Gagal fetch detail category:', error)
      return null
    } finally {
      loadingDetail.value = false
    }
  }

  // ───────────────── STORE ─────────────────
  const saveCategory = async (payload) => {
    savingCategory.value = true
    errorCategory.value = null

    try {
      await categoryProductCatalogServices.create(payload)

      await fetchCategories(buildUrl())

      return true

    } catch (error) {

      errorCategory.value =
        error.response?.data?.errors ??
        error.response?.data?.message ??
        'Gagal menyimpan kategori'

      return false

    } finally {
      savingCategory.value = false
    }
  }

  // ───────────────── UPDATE ─────────────────
  const updateCategory = async (id, payload) => {
    updatingCategory.value = true
    errorCategory.value = null

    try {
      await categoryProductCatalogServices.update(id, payload)

      await fetchCategories(buildUrl())

      return true

    } catch (error) {

      errorCategory.value =
        error.response?.data?.errors ??
        error.response?.data?.message ??
        'Gagal update kategori'

      return false

    } finally {
      updatingCategory.value = false
    }
  }

  // ───────────────── DELETE ─────────────────
  const deleteCategory = async (id) => {
    deletingCategory.value = true

    try {
      await categoryProductCatalogServices.destroy(id)

      await fetchCategories(buildUrl())

      return { ok: true }

    } catch (error) {

      console.error('Gagal delete category:', error)

      // ── Backend balikin 409 kalau kategori masih punya produk/sub-kategori ──
      const message =
        error.response?.data?.message ??
        'Gagal menghapus kategori'

      return { ok: false, message }

    } finally {
      deletingCategory.value = false
    }
  }

  return {

    // state
    categoriesData,
    loadingCategories,
    searchCategories,

    pagination,
    sort,

    savingCategory,
    updatingCategory,
    deletingCategory,
    errorCategory,

    categoryDetail,
    loadingDetail,

    categoryOptions,
    loadingCategoryOptions,

    // actions
    fetchCategories,
    fetchCategoryOptions,
    buildUrl,

    searchWithDelay,
    changePageSize,

    changeSorting,
    toggleSort,

    resetFilters,

    formatDate,

    fetchCategoryDetail,

    saveCategory,
    updateCategory,
    deleteCategory,
  }
})