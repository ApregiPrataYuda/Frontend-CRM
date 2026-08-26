import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { expenseServices } from '@/services/expenseServices'

/**
 * Store SISI SALES -- ajukan expense baru & lihat daftar expense milik
 * sendiri (backend otomatis scope ke sales_id = user login, lihat
 * ExpenseController::index()/canViewAllExpenses()).
 */
export const useMyExpenseStore = defineStore('myExpense', () => {

  // ── FILTER ──
  const filterStatus   = ref('') // '' = semua
  const filterCategory = ref('')
  const searchQuery    = ref('')
  let   searchTimeout  = null

  // ── LIST ──
  const expenseData    = ref([])
  const loadingExpense = ref(false)
  const pagination = reactive({
    current_page: 1, per_page: 10, prev_page_url: null, next_page_url: null, last_page: 1, total: 0,
  })

  // ── SUMMARY ──
  const summaryData = reactive({
    total_pending: 0, total_approved: 0, total_rejected: 0,
    total_amount_approved: 0, total_failed_push: 0,
  })
  const loadingSummary = ref(false)

  // ── OPTIONS ──
  const categoryOptions = ref([])
  const customerOptions        = ref([])
  const loadingCustomerOptions = ref(false)

  // ── DETAIL ──
  const expenseDetail  = ref(null)
  const loadingDetail  = ref(false)

  // ── CREATE ──
  const loadingCreate = ref(false)

  const buildUrl = () => {
    const params = new URLSearchParams()
    if (filterStatus.value)   params.append('status', filterStatus.value)
    if (filterCategory.value) params.append('category', filterCategory.value)
    if (searchQuery.value)    params.append('search', searchQuery.value)
    params.append('page', pagination.current_page)
    params.append('per_page', pagination.per_page)
    return `/expenses?${params.toString()}`
  }

  const fetchExpenses = async (url = null) => {
    loadingExpense.value = true
    try {
      let finalUrl = url || buildUrl()
      if (typeof finalUrl === 'string' && finalUrl.startsWith('http://')) {
        finalUrl = finalUrl.replace('http://', 'https://')
      }
      const response = await expenseServices.getByUrl(finalUrl)
      const result = response.data
      const dataArray = Array.isArray(result.data) ? result.data : result.data?.data ?? []
      expenseData.value.splice(0, expenseData.value.length, ...dataArray)

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
      console.error('Gagal fetch expense saya:', error)
      throw error
    } finally {
      loadingExpense.value = false
    }
  }

  const fetchSummary = async () => {
    loadingSummary.value = true
    try {
      const response = await expenseServices.getSummary()
      const result = response.data.data
      summaryData.total_pending          = result?.total_pending ?? 0
      summaryData.total_approved         = result?.total_approved ?? 0
      summaryData.total_rejected         = result?.total_rejected ?? 0
      summaryData.total_amount_approved  = result?.total_amount_approved ?? 0
      summaryData.total_failed_push      = result?.total_failed_push ?? 0
    } catch (error) {
      console.error('Gagal fetch summary expense saya:', error)
      throw error
    } finally {
      loadingSummary.value = false
    }
  }

  const changeStatusFilter = (status) => {
    filterStatus.value = status || ''
    pagination.current_page = 1
    return Promise.all([fetchExpenses(buildUrl()), fetchSummary()])
  }

  const changeCategoryFilter = (category) => {
    filterCategory.value = category || ''
    pagination.current_page = 1
    return fetchExpenses(buildUrl())
  }

  const changePageSize = () => {
    pagination.current_page = 1
    fetchExpenses(buildUrl())
  }

  const searchWithDelay = (val) => {
    clearTimeout(searchTimeout)
    searchQuery.value = val
    pagination.current_page = 1
    searchTimeout = setTimeout(() => fetchExpenses(buildUrl()), 500)
  }

  const fetchCategoryOptions = async () => {
    try {
      const response = await expenseServices.getCategoryOptions()
      categoryOptions.value = response.data.data ?? []
    } catch (error) {
      console.error('Gagal fetch category options:', error)
      categoryOptions.value = []
    }
  }

  const fetchCustomerOptions = async (search = '') => {
    loadingCustomerOptions.value = true
    try {
      const response = await expenseServices.getCustomerOptions({ search })
      customerOptions.value = response.data.data ?? []
    } catch (error) {
      console.error('Gagal fetch customer options:', error)
      customerOptions.value = []
    } finally {
      loadingCustomerOptions.value = false
    }
  }

  const fetchDetail = async (id) => {
    loadingDetail.value = true
    expenseDetail.value = null
    try {
      const response = await expenseServices.getDetail(id)
      expenseDetail.value = response.data.data
    } catch (error) {
      console.error('Gagal fetch detail expense:', error)
      throw error
    } finally {
      loadingDetail.value = false
    }
  }

  const createExpense = async (formData) => {
    loadingCreate.value = true
    try {
      const response = await expenseServices.createExpense(formData)
      return { success: true, message: response.data?.message ?? 'Expense berhasil diajukan', data: response.data?.data }
    } catch (error) {
      const message = error?.response?.data?.message
        ?? (error?.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : null)
        ?? 'Gagal mengajukan expense'
      return { success: false, message }
    } finally {
      loadingCreate.value = false
    }
  }

  const deleteExpense = async (id) => {
    try {
      const response = await expenseServices.deleteExpense(id)
      return { success: true, message: response.data?.message ?? 'Expense berhasil dihapus' }
    } catch (error) {
      return { success: false, message: error?.response?.data?.message ?? 'Gagal menghapus expense' }
    }
  }

  const formatCurrency = (val) => {
    const num = Number(val ?? 0)
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: '2-digit' })
  }

  return {
    filterStatus, filterCategory, searchQuery,
    expenseData, loadingExpense, pagination,
    summaryData, loadingSummary,
    categoryOptions, customerOptions, loadingCustomerOptions,
    expenseDetail, loadingDetail, loadingCreate,
    buildUrl, fetchExpenses, fetchSummary,
    changeStatusFilter, changeCategoryFilter, changePageSize, searchWithDelay,
    fetchCategoryOptions, fetchCustomerOptions, fetchDetail,
    createExpense, deleteExpense,
    formatCurrency, formatDate,
  }
})