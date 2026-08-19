import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { salesTargetServices } from '@/services/salesTargetServices'

export const useSalesTargetStore = defineStore('salesTarget', () => {

  // ── LIST SALES TARGET ──
  const targetsData   = ref([])
  const loadingTargets = ref(false)
  const errorTarget    = ref(null)

  const filterSalesId    = ref(null)
  const filterPeriodYear = ref(new Date().getFullYear())

  const searchQuery = ref('') // cari by nama sales ATAU nama customer
  let searchTimeout = null

  const pagination = reactive({
    current_page: 1,
    per_page: 10,
    prev_page_url: null,
    next_page_url: null,
    last_page: 1,
    total: 0,
  })

  // ── SUMMARY (rekap target vs realisasi per sales) ──
  const summaryData  = ref([])
  const summaryTotal = reactive({ target_amount: 0, achieved_amount: 0 })
  const loadingSummary = ref(false)

  // ── SAVING STATE (create/update/delete) ──
  const saving   = ref(false)
  const deleting = ref(false)

  // ── DROPDOWN-SEARCH OPTIONS (buat form Tambah/Edit Target) ──
  const salesOptions          = ref([])
  const loadingSalesOptions   = ref(false)
  const customerOptions       = ref([])
  const loadingCustomerOptions = ref(false)

  // ── DETAIL TARGET (breakdown di balik angka "Tercapai") ──
  const targetDetail    = ref(null) // { type: 'customer'|'total', target, transactions?, customers? }
  const loadingDetail   = ref(false)

  // ── BUILD URL ──
  const buildTargetsUrl = () => {
    const params = new URLSearchParams()
    if (filterSalesId.value) params.append('sales_id', filterSalesId.value)
    if (filterPeriodYear.value) params.append('period_year', filterPeriodYear.value)
    if (searchQuery.value) params.append('search', searchQuery.value)
    if (pagination.current_page) params.append('page', pagination.current_page)
    if (pagination.per_page) params.append('per_page', pagination.per_page)
    return `/sales-targets?${params.toString()}`
  }

  // ── FETCH LIST ──
  const fetchTargets = async (url = null) => {
    loadingTargets.value = true
    try {
      // Safety net yang sama kayak productStore.js -- jaga-jaga mixed
      // content kalau next_page_url/prev_page_url dari paginator ke-generate
      // http:// di production.
      let finalUrl = url || buildTargetsUrl()
      if (typeof finalUrl === 'string' && finalUrl.startsWith('http://')) {
        finalUrl = finalUrl.replace('http://', 'https://')
      }
      const response = await salesTargetServices.getByUrl(finalUrl)
      const result = response.data

      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      targetsData.value.splice(0, targetsData.value.length, ...dataArray)

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
      errorTarget.value = error
      console.error('Gagal fetch sales targets:', error)
      throw error
    } finally {
      loadingTargets.value = false
    }
  }

  const changePeriodYear = (year) => {
    filterPeriodYear.value = year
    pagination.current_page = 1
    fetchTargets(buildTargetsUrl())
  }

  const changePageSize = () => {
    pagination.current_page = 1
    fetchTargets(buildTargetsUrl())
  }

  // ── SEARCH WITH DELAY (debounce, pola sama kayak productStore.js) ──
  const searchWithDelay = (val) => {
    clearTimeout(searchTimeout)
    searchQuery.value = val
    pagination.current_page = 1
    searchTimeout = setTimeout(() => {
      fetchTargets(buildTargetsUrl())
    }, 500)
  }

  // ── FETCH SUMMARY ──
  const fetchSummary = async (params = {}) => {
    loadingSummary.value = true
    try {
      const response = await salesTargetServices.getSummary({
        period_year: filterPeriodYear.value,
        ...params,
      })
      const result = response.data.data
      summaryData.value = result?.rows ?? []
      summaryTotal.target_amount   = result?.grand_total?.target_amount ?? 0
      summaryTotal.achieved_amount = result?.grand_total?.achieved_amount ?? 0
    } catch (error) {
      console.error('Gagal fetch sales target summary:', error)
      throw error
    } finally {
      loadingSummary.value = false
    }
  }

  // ── CREATE ──
  const createTarget = async (payload) => {
    saving.value = true
    try {
      const response = await salesTargetServices.createSalesTarget(payload)
      pagination.current_page = 1
      await fetchTargets(buildTargetsUrl())
      return response.data
    } finally {
      saving.value = false
    }
  }

  // ── UPDATE ──
  const updateTarget = async (id, payload) => {
    saving.value = true
    try {
      const response = await salesTargetServices.updateSalesTarget(id, payload)
      await fetchTargets(buildTargetsUrl())
      return response.data
    } finally {
      saving.value = false
    }
  }

  // ── DELETE ──
  const deleteTarget = async (id) => {
    deleting.value = true
    try {
      const response = await salesTargetServices.deleteSalesTarget(id)
      await fetchTargets(buildTargetsUrl())
      return response.data
    } finally {
      deleting.value = false
    }
  }

  // ── FETCH SALES OPTIONS (dropdown-search "Sales" di form) ──
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

  // ── FETCH CUSTOMER OPTIONS (dropdown-search "Customer Odoo" di form) ──
  // Di-scope ke salesId -- backend cuma balikin customer yang jadi
  // tanggung jawab sales itu (lewat CustomerSalesAssignmentOdoo). Tanpa
  // salesId, backend balikin list kosong.
  const fetchCustomerOptions = async (search = '', salesId = null) => {
    loadingCustomerOptions.value = true
    try {
      const response = await salesTargetServices.getCustomerOptions({ search, sales_id: salesId })
      customerOptions.value = response.data.data ?? []
    } catch (error) {
      console.error('Gagal fetch customer options:', error)
      customerOptions.value = []
    } finally {
      loadingCustomerOptions.value = false
    }
  }

  // ── FETCH DETAIL (buat modal "Detail Target") ──
  const fetchTargetDetail = async (id) => {
    loadingDetail.value = true
    targetDetail.value = null
    try {
      const response = await salesTargetServices.getTargetDetail(id)
      targetDetail.value = response.data.data
    } catch (error) {
      console.error('Gagal fetch detail target:', error)
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
    targetsData, loadingTargets, errorTarget,
    filterSalesId, filterPeriodYear, searchQuery, pagination,
    summaryData, summaryTotal, loadingSummary,
    saving, deleting,
    salesOptions, loadingSalesOptions, customerOptions, loadingCustomerOptions,
    targetDetail, loadingDetail,
    // actions
    buildTargetsUrl, fetchTargets, changePeriodYear, changePageSize, searchWithDelay,
    fetchSummary, createTarget, updateTarget, deleteTarget,
    fetchSalesOptions, fetchCustomerOptions, fetchTargetDetail,
    formatCurrency, formatDate,
  }
})