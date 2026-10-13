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
    { value: 'list_price',    label: 'Harga Jual' },
    { value: 'qty_available', label: 'Stok' },
  ])

  // ── DETAIL PRODUCT (modal) ──
  const productDetail = ref(null)
  const loadingDetail = ref(false)

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
    return `/mobile/products?${params.toString()}`
  }

  // ── FETCH PRODUCTS ──
  // Format response /mobile/products:
  //   data.items[]  data.meta{ current_page, last_page, per_page, total }
  //   data.links{ prev, next }
  // dipetakan ke struktur `pagination` yang sama dengan halaman lain.
  const fetchProducts = async (url = null) => {
    loadingProducts.value = true
    errorProduct.value    = null

    try {
      // SAFETY NET: link prev/next dari Laravel kadang http:// walau halamannya
      // https:// (reverse proxy) -> diblok browser sebagai mixed content.
      let finalUrl = url || buildProductsUrl()
      if (typeof finalUrl === 'string' && finalUrl.startsWith('http://')) {
        finalUrl = finalUrl.replace('http://', 'https://')
      }

      const response = await productServices.getByUrl(finalUrl)
      const payload  = response.data?.data ?? {}

      const dataArray = payload.items ?? []
      productsData.value.splice(0, productsData.value.length, ...dataArray)

      const meta = payload.meta ?? {}
      pagination.current_page  = meta.current_page ?? 1
      pagination.per_page      = meta.per_page ?? pagination.per_page
      pagination.last_page     = meta.last_page ?? 1
      pagination.total         = meta.total ?? 0
      pagination.prev_page_url = payload.links?.prev ?? null
      pagination.next_page_url = payload.links?.next ?? null

    } catch (error) {
      errorProduct.value = error
      console.error('Gagal fetch products:', error)
      throw error
    } finally {
      loadingProducts.value = false
    }
  }

  // ── DETAIL ──
  const fetchProductDetail = async (id) => {
    loadingDetail.value = true
    productDetail.value = null

    try {
      const response = await productServices.show(id)
      productDetail.value = response.data?.data ?? null
      return productDetail.value
    } catch (error) {
      console.error('Gagal fetch detail product:', error)
      throw error
    } finally {
      loadingDetail.value = false
    }
  }

  // ── SEARCH WITH DELAY ──
  const searchWithDelay = (val) => {
    clearTimeout(searchTimeout)
    searchProduct.value = val
    pagination.current_page = 1
    searchTimeout = setTimeout(() => {
      fetchProducts(buildProductsUrl()).catch(() => {})
    }, 500)
  }

  // ── CHANGE PAGE SIZE ──
  const changePageSize = () => {
    pagination.current_page = 1
    fetchProducts(buildProductsUrl()).catch(() => {})
  }

  // ── SORTING ──
  const changeSorting = () => {
    pagination.current_page = 1
    fetchProducts(buildProductsUrl()).catch(() => {})
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
    const date = new Date(String(dateStr).replace(' ', 'T'))
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Format angka stok: ribuan pakai titik, desimal hanya kalau ada.
  const formatStock = (val) => {
    const num = Number(val ?? 0)
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num)
  }

  return {
    // state
    productsData, loadingProducts, errorProduct,
    searchProduct, pagination, sort, sortOptions,
    productDetail, loadingDetail,
    // actions
    buildProductsUrl, fetchProducts, fetchProductDetail,
    searchWithDelay, changePageSize, changeSorting, toggleSort,
    formatCurrency, formatDate, formatStock,
  }
})