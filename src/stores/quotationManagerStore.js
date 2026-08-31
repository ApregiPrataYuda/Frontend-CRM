import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { quotationServices } from '@/services/quotationServices'

/**
 * Store SISI MANAGER/ADMIN -- lihat SEMUA quotation (semua sales),
 * read-only monitoring (TIDAK ADA create/edit/hapus di sini, sesuai
 * keputusan blueprint). Backend endpoint SAMA PERSIS dengan
 * myQuotationStore.js (QuotationController), yang beda cuma scoping-nya
 * di-handle backend berdasarkan role login (canViewAllQuotations()).
 */
export const useQuotationManagerStore = defineStore('quotationManager', () => {

  // ── FILTER ──
  const searchQuery   = ref('')
  let   searchTimeout = null

  const quotationData    = ref([])
  const loadingQuotation = ref(false)
  const pagination = reactive({
    current_page: 1, per_page: 10, prev_page_url: null, next_page_url: null, last_page: 1, total: 0,
  })

  const summaryData = reactive({
    total_quotations: 0, total_net_amount: 0, total_pushed: 0, total_failed_push: 0,
  })
  const loadingSummary = ref(false)

  const quotationDetail = ref(null)
  const loadingDetail   = ref(false)

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
      console.error('Gagal fetch quotation (monitoring):', error)
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
      console.error('Gagal fetch summary quotation (monitoring):', error)
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

  // Manager tetap boleh download PDF -- ini cuma "lihat", bukan
  // mengubah data, jadi tidak melanggar aturan read-only.
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
    quotationDetail, loadingDetail,
    buildUrl, fetchQuotations, fetchSummary,
    changePageSize, searchWithDelay,
    fetchDetail, downloadPdf,
    formatCurrency, formatDate,
  }
})