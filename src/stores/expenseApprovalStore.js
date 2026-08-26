import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { expenseServices } from '@/services/expenseServices'

/**
 * Store SISI MANAGER/ADMIN -- lihat SEMUA expense (semua sales) &
 * approve/reject. Backend endpoint SAMA PERSIS dengan myExpenseStore.js
 * (ExpenseController), yang beda cuma scoping-nya di-handle backend
 * berdasarkan role login (canViewAllExpenses()).
 */
export const useExpenseApprovalStore = defineStore('expenseApproval', () => {

  // ── FILTER: default nampilin yang PENDING dulu (perlu ditindaklanjuti) ──
  const filterStatus   = ref('pending')
  const filterCategory = ref('')
  const filterSalesId  = ref(null)
  const searchQuery    = ref('')
  let   searchTimeout  = null

  const expenseData    = ref([])
  const loadingExpense = ref(false)
  const pagination = reactive({
    current_page: 1, per_page: 10, prev_page_url: null, next_page_url: null, last_page: 1, total: 0,
  })

  const summaryData = reactive({
    total_pending: 0, total_approved: 0, total_rejected: 0,
    total_amount_approved: 0, total_failed_push: 0,
  })
  const loadingSummary = ref(false)

  const categoryOptions = ref([])

  const expenseDetail = ref(null)
  const loadingDetail = ref(false)

  const loadingAction = ref(false)

  const buildUrl = () => {
    const params = new URLSearchParams()
    if (filterStatus.value)   params.append('status', filterStatus.value)
    if (filterCategory.value) params.append('category', filterCategory.value)
    if (filterSalesId.value)  params.append('sales_id', filterSalesId.value)
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
      console.error('Gagal fetch expense (approval):', error)
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
      console.error('Gagal fetch summary expense (approval):', error)
      throw error
    } finally {
      loadingSummary.value = false
    }
  }

  const changeStatusFilter = (status) => {
    filterStatus.value = status || ''
    pagination.current_page = 1
    return fetchExpenses(buildUrl())
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

  const approveExpense = async (id) => {
    loadingAction.value = true
    try {
      const response = await expenseServices.approveExpense(id)
      return { success: true, message: response.data?.message ?? 'Expense berhasil di-approve', data: response.data?.data }
    } catch (error) {
      return { success: false, message: error?.response?.data?.message ?? 'Gagal approve expense' }
    } finally {
      loadingAction.value = false
    }
  }

  const rejectExpense = async (id, reason) => {
    loadingAction.value = true
    try {
      const response = await expenseServices.rejectExpense(id, reason)
      return { success: true, message: response.data?.message ?? 'Expense berhasil di-reject', data: response.data?.data }
    } catch (error) {
      return { success: false, message: error?.response?.data?.message ?? 'Gagal reject expense' }
    } finally {
      loadingAction.value = false
    }
  }

  const retryPushExpense = async (id) => {
    loadingAction.value = true
    try {
      const response = await expenseServices.retryPushExpense(id)
      return { success: true, message: response.data?.message ?? 'Berhasil dikirim ulang ke Odoo', data: response.data?.data }
    } catch (error) {
      return { success: false, message: error?.response?.data?.message ?? 'Gagal mengirim ulang ke Odoo' }
    } finally {
      loadingAction.value = false
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
    filterStatus, filterCategory, filterSalesId, searchQuery,
    expenseData, loadingExpense, pagination,
    summaryData, loadingSummary,
    categoryOptions,
    expenseDetail, loadingDetail, loadingAction,
    buildUrl, fetchExpenses, fetchSummary,
    changeStatusFilter, changeCategoryFilter, changePageSize, searchWithDelay,
    fetchCategoryOptions, fetchDetail,
    approveExpense, rejectExpense, retryPushExpense,
    formatCurrency, formatDate,
  }
})