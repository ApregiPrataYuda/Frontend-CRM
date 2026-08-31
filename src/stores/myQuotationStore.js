import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { quotationServices } from '@/services/quotationServices'

/**
 * Store SISI SALES -- bikin/edit/hapus quotation milik sendiri, download
 * PDF, push manual ke Odoo (sale.order). Backend otomatis scope ke
 * sales_id = user login (lihat QuotationController::index()/
 * canViewAllQuotations()).
 */
export const useMyQuotationStore = defineStore('myQuotation', () => {

  // ── FILTER ──
  const searchQuery   = ref('')
  let   searchTimeout = null

  // ── LIST ──
  const quotationData    = ref([])
  const loadingQuotation = ref(false)
  const pagination = reactive({
    current_page: 1, per_page: 10, prev_page_url: null, next_page_url: null, last_page: 1, total: 0,
  })

  // ── SUMMARY ──
  const summaryData = reactive({
    total_quotations: 0, total_net_amount: 0, total_pushed: 0, total_failed_push: 0,
  })
  const loadingSummary = ref(false)

  // ── OPTIONS ──
  const customerOptions        = ref([])
  const loadingCustomerOptions = ref(false)
  const productOptions         = ref([])
  const loadingProductOptions  = ref(false)

  // ── DETAIL ──
  const quotationDetail = ref(null)
  const loadingDetail   = ref(false)

  // ── SAVE / ACTION ──
  const loadingSave   = ref(false)
  const loadingAction = ref(false) // dipakai buat delete & push-to-odoo

  const buildUrl = () => {
    const params = new URLSearchParams()
    if (searchQuery.value) params.append('search', searchQuery.value)
    params.append('page', pagination.current_page)
    params.append('per_page', pagination.per_page)
    return `/quotations?${params.toString()}`
  }

  const fetchQuotations = async (url = null) => {
    loadingQuotation.value = true
    try {
      let finalUrl = url || buildUrl()
      if (typeof finalUrl === 'string' && finalUrl.startsWith('http://')) {
        finalUrl = finalUrl.replace('http://', 'https://')
      }
      const response = await quotationServices.getByUrl(finalUrl)
      const result = response.data
      const dataArray = Array.isArray(result.data) ? result.data : result.data?.data ?? []
      quotationData.value.splice(0, quotationData.value.length, ...dataArray)

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
      console.error('Gagal fetch quotation saya:', error)
      throw error
    } finally {
      loadingQuotation.value = false
    }
  }

  const fetchSummary = async () => {
    loadingSummary.value = true
    try {
      const response = await quotationServices.getSummary()
      const result = response.data.data
      summaryData.total_quotations  = result?.total_quotations ?? 0
      summaryData.total_net_amount  = result?.total_net_amount ?? 0
      summaryData.total_pushed      = result?.total_pushed ?? 0
      summaryData.total_failed_push = result?.total_failed_push ?? 0
    } catch (error) {
      console.error('Gagal fetch summary quotation saya:', error)
      throw error
    } finally {
      loadingSummary.value = false
    }
  }

  const changePageSize = () => {
    pagination.current_page = 1
    fetchQuotations(buildUrl())
  }

  const searchWithDelay = (val) => {
    clearTimeout(searchTimeout)
    searchQuery.value = val
    pagination.current_page = 1
    searchTimeout = setTimeout(() => fetchQuotations(buildUrl()), 500)
  }

  const fetchCustomerOptions = async (search = '') => {
    loadingCustomerOptions.value = true
    try {
      const response = await quotationServices.getCustomerOptions({ search })
      customerOptions.value = response.data.data ?? []
    } catch (error) {
      console.error('Gagal fetch customer options:', error)
      customerOptions.value = []
    } finally {
      loadingCustomerOptions.value = false
    }
  }

  const fetchProductOptions = async (search = '') => {
    loadingProductOptions.value = true
    try {
      const response = await quotationServices.getProductOptions({ search })
      productOptions.value = response.data.data ?? []
    } catch (error) {
      console.error('Gagal fetch product options:', error)
      productOptions.value = []
    } finally {
      loadingProductOptions.value = false
    }
  }

  const fetchDetail = async (id) => {
    loadingDetail.value = true
    quotationDetail.value = null
    try {
      const response = await quotationServices.getDetail(id)
      quotationDetail.value = response.data.data
    } catch (error) {
      console.error('Gagal fetch detail quotation:', error)
      throw error
    } finally {
      loadingDetail.value = false
    }
  }

  const buildErrorMessage = (error, fallback) => {
    return error?.response?.data?.message
      ?? (error?.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : null)
      ?? fallback
  }

  const createQuotation = async (payload) => {
    loadingSave.value = true
    try {
      const response = await quotationServices.createQuotation(payload)
      return { success: true, message: response.data?.message ?? 'Quotation berhasil dibuat', data: response.data?.data }
    } catch (error) {
      return { success: false, message: buildErrorMessage(error, 'Gagal membuat quotation') }
    } finally {
      loadingSave.value = false
    }
  }

  const updateQuotation = async (id, payload) => {
    loadingSave.value = true
    try {
      const response = await quotationServices.updateQuotation(id, payload)
      return { success: true, message: response.data?.message ?? 'Quotation berhasil diperbarui', data: response.data?.data }
    } catch (error) {
      return { success: false, message: buildErrorMessage(error, 'Gagal memperbarui quotation') }
    } finally {
      loadingSave.value = false
    }
  }

  const deleteQuotation = async (id) => {
    loadingAction.value = true
    try {
      const response = await quotationServices.deleteQuotation(id)
      return { success: true, message: response.data?.message ?? 'Quotation berhasil dihapus' }
    } catch (error) {
      return { success: false, message: error?.response?.data?.message ?? 'Gagal menghapus quotation' }
    } finally {
      loadingAction.value = false
    }
  }

  const pushToOdoo = async (id) => {
    loadingAction.value = true
    try {
      const response = await quotationServices.pushToOdoo(id)
      const data = response.data?.data
      const success = data?.odoo_push_status === 'pushed'
      return { success, message: response.data?.message ?? (success ? 'Berhasil dikirim ke Odoo' : 'Gagal dikirim ke Odoo'), data }
    } catch (error) {
      return { success: false, message: error?.response?.data?.message ?? 'Gagal mengirim quotation ke Odoo' }
    } finally {
      loadingAction.value = false
    }
  }

  // Trigger download file PDF dari response blob -- endpoint-nya butuh
  // header Authorization, jadi tidak bisa window.open() biasa, harus lewat
  // axios (yang sudah otomatis nyisipin token) baru di-convert ke file.
  const downloadPdf = async (item) => {
    try {
      const response = await quotationServices.downloadPdf(item.id)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url  = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      // Nama file pakai customer_ref (BUKAN quotation_no lagi -- quotation_no
      // sekarang opsional/sering masih kosong, sudah disamakan dengan
      // penamaan file di backend QuotationController::buildPdfFilename()).
      // Diganti ke "-" dulu kalau ada "/" atau "\", karena karakter itu di
      // nama file bisa bikin browser salah artikan sebagai pemisah folder.
      link.download = `Quotation-${(item.customer_ref || '').replace(/[/\\]/g, '-')}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      return { success: true }
    } catch (error) {
      console.error('Gagal download PDF quotation:', error)
      return { success: false, message: 'Gagal download PDF quotation' }
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
    searchQuery,
    quotationData, loadingQuotation, pagination,
    summaryData, loadingSummary,
    customerOptions, loadingCustomerOptions,
    productOptions, loadingProductOptions,
    quotationDetail, loadingDetail, loadingSave, loadingAction,
    buildUrl, fetchQuotations, fetchSummary,
    changePageSize, searchWithDelay,
    fetchCustomerOptions, fetchProductOptions, fetchDetail,
    createQuotation, updateQuotation, deleteQuotation, pushToOdoo, downloadPdf,
    formatCurrency, formatDate,
  }
})