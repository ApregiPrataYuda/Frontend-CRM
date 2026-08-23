import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { reportProductBySalesServices } from '@/services/reportProductBySalesServices'
// Dropdown "Sales" & "Kategori" REUSE service yang sudah ada di fitur
// Target Penjualan (endpoint-nya sama persis, ga perlu duplikat) --
// lihat catatan di reportProductBySalesServices.js.
import { salesTargetServices } from '@/services/salesTargetServices'

export const useReportProductBySalesStore = defineStore('reportProductBySales', () => {

  // ── FILTER ──
  const filterPeriodYear = ref(new Date().getFullYear())
  const filterSalesId    = ref(null)
  const filterCategId    = ref(null)
  const searchQuery      = ref('')
  let searchTimeout = null

  // ── LIST REKAP (Sales + Product) ──
  const reportData    = ref([])
  const loadingReport = ref(false)
  const errorReport    = ref(null)

  const pagination = reactive({
    current_page: 1,
    per_page: 10,
    prev_page_url: null,
    next_page_url: null,
    last_page: 1,
    total: 0,
  })

  // ── SUMMARY (kartu ringkasan di atas tabel) ──
  const summaryData    = reactive({
    total_qty: 0,
    total_omzet: 0,
    total_transactions: 0,
    product_count: 0,
    sales_count: 0,
  })
  const loadingSummary = ref(false)

  // ── DROPDOWN OPTIONS (Sales / Kategori) ──
  const salesOptions           = ref([])
  const loadingSalesOptions    = ref(false)
  const categoryOptions        = ref([])
  const loadingCategoryOptions = ref(false)

  // ── DETAIL (rincian transaksi di balik 1 baris rekap) ──
  const reportDetail  = ref(null)
  const loadingDetail = ref(false)

  // ── BUILD URL ──
  const buildReportUrl = () => {
    const params = new URLSearchParams()
    params.append('period_year', filterPeriodYear.value)
    if (filterSalesId.value) params.append('sales_id', filterSalesId.value)
    if (filterCategId.value) params.append('categ_id', filterCategId.value)
    if (searchQuery.value) params.append('search', searchQuery.value)
    params.append('page', pagination.current_page)
    params.append('per_page', pagination.per_page)
    return `/report-product-by-sales?${params.toString()}`
  }

  // ── FETCH LIST ──
  const fetchReport = async (url = null) => {
    loadingReport.value = true
    try {
      let finalUrl = url || buildReportUrl()
      if (typeof finalUrl === 'string' && finalUrl.startsWith('http://')) {
        finalUrl = finalUrl.replace('http://', 'https://')
      }
      const response = await reportProductBySalesServices.getByUrl(finalUrl)
      const result = response.data

      const dataArray = Array.isArray(result.data) ? result.data : result.data?.data ?? []
      reportData.value.splice(0, reportData.value.length, ...dataArray)

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
      errorReport.value = error
      console.error('Gagal fetch report product by sales:', error)
      throw error
    } finally {
      loadingReport.value = false
    }
  }

  // ── FETCH SUMMARY ──
  const fetchSummary = async () => {
    loadingSummary.value = true
    try {
      const response = await reportProductBySalesServices.getSummary({
        period_year: filterPeriodYear.value,
        sales_id: filterSalesId.value || undefined,
        categ_id: filterCategId.value || undefined,
      })
      const result = response.data.data
      summaryData.total_qty          = result?.total_qty ?? 0
      summaryData.total_omzet        = result?.total_omzet ?? 0
      summaryData.total_transactions = result?.total_transactions ?? 0
      summaryData.product_count      = result?.product_count ?? 0
      summaryData.sales_count        = result?.sales_count ?? 0
    } catch (error) {
      console.error('Gagal fetch summary report product by sales:', error)
      throw error
    } finally {
      loadingSummary.value = false
    }
  }

  // ── GANTI FILTER (reset ke halaman 1, lalu reload list + summary) ──
  const changePeriodYear = (year) => {
    filterPeriodYear.value = Number(year)
    pagination.current_page = 1
    return Promise.all([fetchReport(buildReportUrl()), fetchSummary()])
  }

  const changeSalesFilter = (salesId) => {
    filterSalesId.value = salesId || null
    pagination.current_page = 1
    return Promise.all([fetchReport(buildReportUrl()), fetchSummary()])
  }

  const changeCategFilter = (categId) => {
    filterCategId.value = categId || null
    pagination.current_page = 1
    return Promise.all([fetchReport(buildReportUrl()), fetchSummary()])
  }

  const changePageSize = () => {
    pagination.current_page = 1
    fetchReport(buildReportUrl())
  }

  const searchWithDelay = (val) => {
    clearTimeout(searchTimeout)
    searchQuery.value = val
    pagination.current_page = 1
    searchTimeout = setTimeout(() => {
      fetchReport(buildReportUrl())
    }, 500)
  }

  // ── FETCH DROPDOWN OPTIONS (reuse service Target Penjualan) ──
  const fetchSalesOptions = async (search = '') => {
    loadingSalesOptions.value = true
    try {
      const response = await salesTargetServices.getSalesOptions({ search })
      salesOptions.value = response.data.data ?? []
    } catch (error) {
      console.error('Gagal fetch sales options:', error)
      salesOptions.value = []
    } finally {
      loadingSalesOptions.value = false
    }
  }

  const fetchCategoryOptions = async (search = '') => {
    loadingCategoryOptions.value = true
    try {
      const response = await salesTargetServices.getCategoryOptions({ search })
      categoryOptions.value = response.data.data ?? []
    } catch (error) {
      console.error('Gagal fetch category options:', error)
      categoryOptions.value = []
    } finally {
      loadingCategoryOptions.value = false
    }
  }

  // ── FETCH DETAIL (rincian transaksi 1 baris rekap) ──
  const fetchDetail = async (salesId, odooProductId) => {
    loadingDetail.value = true
    reportDetail.value = null
    try {
      const response = await reportProductBySalesServices.getDetail(salesId, odooProductId, {
        period_year: filterPeriodYear.value,
      })
      reportDetail.value = response.data.data
    } catch (error) {
      console.error('Gagal fetch detail report product by sales:', error)
      throw error
    } finally {
      loadingDetail.value = false
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

  const formatNumber = (val) => {
    return new Intl.NumberFormat('id-ID').format(Number(val ?? 0))
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
    // filter
    filterPeriodYear, filterSalesId, filterCategId, searchQuery,
    // list
    reportData, loadingReport, errorReport, pagination,
    // summary
    summaryData, loadingSummary,
    // options
    salesOptions, loadingSalesOptions, categoryOptions, loadingCategoryOptions,
    // detail
    reportDetail, loadingDetail,
    // actions
    buildReportUrl, fetchReport, fetchSummary,
    changePeriodYear, changeSalesFilter, changeCategFilter, changePageSize, searchWithDelay,
    fetchSalesOptions, fetchCategoryOptions, fetchDetail,
    formatCurrency, formatNumber, formatDate,
  }
})