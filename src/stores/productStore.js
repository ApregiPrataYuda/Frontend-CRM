import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { productServices } from '@/services/productServices'

const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Link prev/next dari Laravel kadang http:// walau halamannya https:// (reverse proxy).
const safeUrl = (url) =>
  typeof url === 'string' && url.startsWith('http://') && window.location.protocol === 'https:'
    ? url.replace('http://', 'https://')
    : url

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

  // ── FILTER CHIP (brand & kategori) ──
  const filterOptions   = reactive({ brands: [], categories: [] })
  const selectedBrand   = ref(null)   // null = All
  const selectedCateg   = ref(null)   // null = All
  const lowStockLimit   = ref(5)      // dari meta.low_stock_threshold

  // ── DETAIL PRODUCT (modal) ──
  const productDetail = ref(null)
  const loadingDetail = ref(false)

  // ── TAB SOLD & PURCHASE (di modal detail) ──
  const sold = reactive({
    month: currentMonth(),
    type: 'all',            // all / so / quotation
    summary: null,
    items: [],
    next: null,
    loading: false,
    loaded: false,
  })

  const purchase = reactive({
    month: currentMonth(),
    summary: null,
    items: [],
    next: null,
    loading: false,
    loaded: false,
  })

  const invoice = reactive({
    month: currentMonth(),
    type: 'customer',       // customer / vendor / all
    summary: null,
    items: [],
    next: null,
    loading: false,
    loaded: false,
  })

  // Detail satu invoice yang dibuka dari tab Invoice (null = tampilkan daftar)
  const invoiceDetail        = ref(null)
  const loadingInvoiceDetail = ref(false)

  const delivery = reactive({
    month: currentMonth(),
    type: 'outgoing',       // outgoing / incoming / all
    summary: null,
    items: [],
    next: null,
    loading: false,
    loaded: false,
  })

  // Status order (4 tahap) di tab Detail
  const orderStatus = reactive({ items: [], loading: false, loaded: false })

  // Detail satu transfer yang dibuka dari tab Delivery (null = tampilkan daftar)
  const deliveryDetail        = ref(null)
  const loadingDeliveryDetail = ref(false)

  // ── BUILD URL ──
  const buildProductsUrl = () => {
    const params = new URLSearchParams()
    if (searchProduct.value) params.append('search', searchProduct.value)
    if (selectedBrand.value) params.append('brand_id', selectedBrand.value)
    if (selectedCateg.value) params.append('categ_id', selectedCateg.value)
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
  //   data.items[]  data.meta{ current_page, last_page, per_page, total, low_stock_threshold }
  //   data.links{ prev, next }
  // dipetakan ke struktur `pagination` yang sama dengan halaman lain.
  const fetchProducts = async (url = null) => {
    loadingProducts.value = true
    errorProduct.value    = null

    try {
      const response = await productServices.getByUrl(safeUrl(url || buildProductsUrl()))
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
      lowStockLimit.value      = meta.low_stock_threshold ?? lowStockLimit.value

    } catch (error) {
      errorProduct.value = error
      console.error('Gagal fetch products:', error)
      throw error
    } finally {
      loadingProducts.value = false
    }
  }

  // ── FILTER CHIP ──
  const fetchFilters = async () => {
    try {
      const response = await productServices.getFilters()
      const data     = response.data?.data ?? {}
      filterOptions.brands     = data.brands ?? []
      filterOptions.categories = data.categories ?? []
    } catch (error) {
      // Chip hanya pelengkap -- halaman tetap jalan tanpa ini.
      console.error('Gagal fetch filter:', error)
    }
  }

  const selectBrand = (id) => {
    selectedBrand.value = id
    pagination.current_page = 1
    fetchProducts(buildProductsUrl()).catch(() => {})
  }

  const selectCategory = (id) => {
    selectedCateg.value = id
    pagination.current_page = 1
    fetchProducts(buildProductsUrl()).catch(() => {})
  }

  // ── DETAIL ──
  const fetchProductDetail = async (id) => {
    loadingDetail.value = true
    productDetail.value = null
    resetTabs()

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

  // ── TAB SOLD ──
  const resetTabs = () => {
    Object.assign(sold, { month: currentMonth(), type: 'all', summary: null, items: [], next: null, loading: false, loaded: false })
    Object.assign(purchase, { month: currentMonth(), summary: null, items: [], next: null, loading: false, loaded: false })
    Object.assign(invoice, { month: currentMonth(), type: 'customer', summary: null, items: [], next: null, loading: false, loaded: false })
    invoiceDetail.value = null
    Object.assign(delivery, { month: currentMonth(), type: 'outgoing', summary: null, items: [], next: null, loading: false, loaded: false })
    deliveryDetail.value = null
    Object.assign(orderStatus, { items: [], loading: false, loaded: false })
  }

  // Pertama kali tab Sold dibuka: mulai dari bulan transaksi terakhir (bila ada),
  // supaya tidak langsung kosong ketika bulan berjalan belum ada penjualan.
  const openSoldTab = async (productId) => {
    if (sold.loaded) return
    try {
      const response = await productServices.getSalesHistory(productId, 1)
      const latest   = response.data?.data?.items?.[0]
      if (latest?.date) sold.month = latest.date.slice(0, 7)
    } catch (error) {
      console.error('Gagal fetch riwayat penjualan:', error)
    }
    await fetchSold(productId)
  }

  // append = true untuk tombol "Muat lebih banyak"
  const fetchSold = async (productId, append = false) => {
    sold.loading = true
    try {
      const response = append && sold.next
        ? await productServices.getByUrl(safeUrl(sold.next))
        : await productServices.getSales(productId, { month: sold.month, type: sold.type, per_page: 20 })

      const data = response.data?.data ?? {}
      sold.summary = data.summary ?? null
      sold.items   = append ? [...sold.items, ...(data.items ?? [])] : (data.items ?? [])
      sold.next    = data.links?.next ?? null
      sold.loaded  = true
    } catch (error) {
      console.error('Gagal fetch penjualan:', error)
      if (!append) { sold.items = []; sold.summary = null; sold.next = null }
      throw error
    } finally {
      sold.loading = false
    }
  }

  // ── TAB PURCHASE ──
  const fetchPurchases = async (productId, append = false) => {
    purchase.loading = true
    try {
      const response = append && purchase.next
        ? await productServices.getByUrl(safeUrl(purchase.next))
        : await productServices.getPurchases(productId, { month: purchase.month, per_page: 20 })

      const data = response.data?.data ?? {}
      purchase.summary = data.summary ?? null
      purchase.items   = append ? [...purchase.items, ...(data.items ?? [])] : (data.items ?? [])
      purchase.next    = data.links?.next ?? null
      purchase.loaded  = true
    } catch (error) {
      console.error('Gagal fetch purchase:', error)
      if (!append) { purchase.items = []; purchase.summary = null; purchase.next = null }
      throw error
    } finally {
      purchase.loading = false
    }
  }

  // ── TAB INVOICE ──
  const fetchInvoices = async (productId, append = false) => {
    invoice.loading = true
    try {
      const response = append && invoice.next
        ? await productServices.getByUrl(safeUrl(invoice.next))
        : await productServices.getInvoices(productId, { month: invoice.month, type: invoice.type, per_page: 20 })

      const data = response.data?.data ?? {}
      invoice.summary = data.summary ?? null
      invoice.items   = append ? [...invoice.items, ...(data.items ?? [])] : (data.items ?? [])
      invoice.next    = data.links?.next ?? null
      invoice.loaded  = true
    } catch (error) {
      console.error('Gagal fetch invoice:', error)
      if (!append) { invoice.items = []; invoice.summary = null; invoice.next = null }
      throw error
    } finally {
      invoice.loading = false
    }
  }

  const fetchInvoiceDetail = async (invoiceId) => {
    loadingInvoiceDetail.value = true
    try {
      const response = await productServices.getInvoice(invoiceId)
      invoiceDetail.value = response.data?.data ?? null
      return invoiceDetail.value
    } catch (error) {
      console.error('Gagal fetch detail invoice:', error)
      throw error
    } finally {
      loadingInvoiceDetail.value = false
    }
  }

  const closeInvoiceDetail = () => {
    invoiceDetail.value = null
    Object.assign(delivery, { month: currentMonth(), type: 'outgoing', summary: null, items: [], next: null, loading: false, loaded: false })
    deliveryDetail.value = null
    Object.assign(orderStatus, { items: [], loading: false, loaded: false })
  }

  // ── STATUS ORDER (tab Detail) ──
  // Tidak melempar error: bagian ini pelengkap, detail product tetap tampil walau gagal.
  const fetchOrderStatus = async (productId, limit = 5) => {
    orderStatus.loading = true
    try {
      const response = await productServices.getOrderStatus(productId, limit)
      orderStatus.items = response.data?.data?.items ?? []
    } catch (error) {
      console.error('Gagal fetch status order:', error)
      orderStatus.items = []
    } finally {
      orderStatus.loading = false
      orderStatus.loaded  = true
    }
  }

  // ── TAB DELIVERY ──
  const fetchDeliveries = async (productId, append = false) => {
    delivery.loading = true
    try {
      const response = append && delivery.next
        ? await productServices.getByUrl(safeUrl(delivery.next))
        : await productServices.getDeliveries(productId, { month: delivery.month, type: delivery.type, per_page: 20 })

      const data = response.data?.data ?? {}
      delivery.summary = data.summary ?? null
      delivery.items   = append ? [...delivery.items, ...(data.items ?? [])] : (data.items ?? [])
      delivery.next    = data.links?.next ?? null
      delivery.loaded  = true
    } catch (error) {
      console.error('Gagal fetch delivery:', error)
      if (!append) { delivery.items = []; delivery.summary = null; delivery.next = null }
      throw error
    } finally {
      delivery.loading = false
    }
  }

  const fetchDeliveryDetail = async (deliveryId) => {
    loadingDeliveryDetail.value = true
    try {
      const response = await productServices.getDelivery(deliveryId)
      deliveryDetail.value = response.data?.data ?? null
      return deliveryDetail.value
    } catch (error) {
      console.error('Gagal fetch detail delivery:', error)
      throw error
    } finally {
      loadingDeliveryDetail.value = false
    }
  }

  const closeDeliveryDetail = () => {
    deliveryDetail.value = null
    Object.assign(orderStatus, { items: [], loading: false, loaded: false })
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
      maximumFractionDigits: 0,
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

  // "30/09/2026" -- dipakai di baris Sold / Purchase
  const formatShortDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(String(dateStr).replace(' ', 'T'))
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
    filterOptions, selectedBrand, selectedCateg, lowStockLimit,
    productDetail, loadingDetail,
    sold, purchase, invoice, invoiceDetail, loadingInvoiceDetail,
    delivery, deliveryDetail, loadingDeliveryDetail, orderStatus,
    // actions
    buildProductsUrl, fetchProducts, fetchFilters, selectBrand, selectCategory,
    fetchProductDetail, openSoldTab, fetchSold, fetchPurchases,
    fetchInvoices, fetchInvoiceDetail, closeInvoiceDetail,
    fetchDeliveries, fetchDeliveryDetail, closeDeliveryDetail, fetchOrderStatus,
    searchWithDelay, changePageSize, changeSorting, toggleSort,
    formatCurrency, formatDate, formatShortDate, formatStock,
  }
})