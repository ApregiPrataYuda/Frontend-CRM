import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { visitsSalesServices } from '@/services/salesVisitServices'

export const useVisitDataStore = defineStore('visitData', () => {

  // ════════════════════════════════════════════
  // STATE
  // ════════════════════════════════════════════

  const visitsData    = ref([])
  const loadingVisits = ref(false)
  const errorVisits   = ref(null)
  const searchVisits  = ref('')
  let   searchTimeout = null

  const visitsDetail  = ref(null)
  const loadingDetail = ref(false)


  // ── Visit Now ──
  const loadingVisitNow        = ref(false)
  const visitNowError          = ref(null)
  const activeVisitLeadId      = ref(null)  // lead_id aktif
  const activeVisitId          = ref(null)  // visit_id untuk lead check-in
  const activeVisitCustomersId = ref(null)  // customer_id aktif
  const activeVisitCustId      = ref(null)  // visit_id untuk customer check-in

  // ── Check In ──
  const loadingCheckIn = ref(false)
  const checkInError   = ref(null)
  const checkInSuccess = ref(false)

  // ── Check Out Lead ──
  const loadingCheckOut = ref(false)
  const checkOutError   = ref(null)
  const checkOutSuccess = ref(false)

  // ── Check Out Customer ──
  const loadingCheckOutCustomers = ref(false)
  const checkOutErrorCustomers   = ref(null)
  const checkOutSuccessCustomers = ref(false)

  const pagination = reactive({
    current_page  : 1,
    per_page      : 10,
    prev_page_url : null,
    next_page_url : null,
    last_page     : 1,
    total         : 0,
  })

  const sort = reactive({
    column    : 'created_at',
    direction : 'desc',
  })

  const allowedSortColumns = ['company_name', 'visit_code', 'created_at']


  // ════════════════════════════════════════════
  // BUILD URL
  // ════════════════════════════════════════════

  const buildUrl = () => {
    const params = new URLSearchParams()
    if (searchVisits.value)      params.append('search',   searchVisits.value)
    if (pagination.current_page) params.append('page',     pagination.current_page)
    if (pagination.per_page)     params.append('per_page', pagination.per_page)
    if (sort.column) {
      params.append('sort_by',  sort.column)
      params.append('sort_dir', sort.direction)
    }
    return `/data-visits-leads?${params.toString()}`
  }


  // ════════════════════════════════════════════
  // FETCH VISITS
  // ════════════════════════════════════════════

  const fetchVisits = async (url = null) => {
    loadingVisits.value = true
    errorVisits.value   = null
    try {
      const finalUrl = url || buildUrl()
      const response = await visitsSalesServices.getByUrl(finalUrl)
      const result   = response.data

      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      visitsData.value.splice(0, visitsData.value.length, ...dataArray)

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
      errorVisits.value = error?.response?.data?.message ?? 'Gagal memuat data visit'
      console.error('Gagal fetch Visits:', error)
    } finally {
      loadingVisits.value = false
    }
  }


  // ════════════════════════════════════════════
  // START VISIT — LEAD
  // ════════════════════════════════════════════

  const startVisit = async (leadId) => {
    loadingVisitNow.value = true
    visitNowError.value   = null
    try {
      const res = await visitsSalesServices.visitStart(leadId)
      activeVisitLeadId.value = leadId
      activeVisitId.value     = res.data?.data?.id ?? res.data?.id ?? null
      return { success: true, message: 'Kunjungan berhasil dimulai', data: res.data ?? res }
    } catch (error) {
      const message = error?.response?.data?.message ?? 'Gagal memulai kunjungan. Coba lagi.'
      visitNowError.value = message
      return { success: false, message }
    } finally {
      loadingVisitNow.value = false
    }
  }


  // ════════════════════════════════════════════
  // START VISIT — CUSTOMER
  // branchId: null = visit ke head office, terisi = visit ke branch tertentu
  // ════════════════════════════════════════════
  const startVisitCustomers = async (customerId, branchId = null) => {
  loadingVisitNow.value = true
  visitNowError.value = null

  try {
    const res = await visitsSalesServices.visitStartCustomers(
      customerId,
      branchId
    )

    const visit = res.data.data
    activeVisitCustomersId.value = visit.customer_id
    activeVisitCustId.value = visit.id

    return {
      success: true,
      message: 'Kunjungan customer berhasil dimulai',
      data: visit,
    }
  } catch (error) {
    const message =
      error?.response?.data?.message ??
      'Gagal memulai kunjungan customer.'

    visitNowError.value = message
    return { success: false, message }
  } finally {
    loadingVisitNow.value = false
  }
}


  // ════════════════════════════════════════════
  // SUBMIT CHECK IN — LEAD
  // ════════════════════════════════════════════

  const submitCheckIn = async (visitId, payload) => {
    loadingCheckIn.value = true
    checkInError.value   = null
    checkInSuccess.value = false
    try {
      const res = await visitsSalesServices.checkIn(visitId, payload)
      checkInSuccess.value = true
      return { success: true, message: 'Check in berhasil', data: res.data?.data }
    } catch (error) {
      const message = error?.response?.data?.message ?? 'Gagal check in'
      checkInError.value = message
      return { success: false, message }
    } finally {
      loadingCheckIn.value = false
    }
  }


  // ════════════════════════════════════════════
  // SUBMIT CHECK IN — CUSTOMER
  // ════════════════════════════════════════════

  const submitCheckInCustomer = async (visitId, payload) => {
    loadingCheckIn.value = true
    checkInError.value   = null
    checkInSuccess.value = false
    try {
      const res = await visitsSalesServices.checkInCustomers(visitId, payload)
      checkInSuccess.value = true
      return { success: true, message: 'Check in customer berhasil', data: res.data?.data }
    } catch (error) {
      const message = error?.response?.data?.message ?? 'Gagal check in customer'
      checkInError.value = message
      return { success: false, message }
    } finally {
      loadingCheckIn.value = false
    }
  }


  // ════════════════════════════════════════════
  // SUBMIT CHECK OUT — LEAD
  // ════════════════════════════════════════════

  const submitCheckOut = async (visitId, payload) => {
    loadingCheckOut.value = true
    checkOutError.value   = null
    try {
      const res = await visitsSalesServices.checkOut(visitId, payload)
      activeVisitId.value     = null
      activeVisitLeadId.value = null
      return {
        success : true,
        message : res.data?.message ?? 'Check out berhasil disimpan',
        data    : res.data?.data ?? res.data,
      }
    } catch (error) {
      const message = error?.response?.data?.message ?? 'Gagal check out'
      checkOutError.value = message
      return { success: false, message }
    } finally {
      loadingCheckOut.value = false
    }
  }


  // ════════════════════════════════════════════
  // SUBMIT CHECK OUT — CUSTOMER (code lama)
  // ════════════════════════════════════════════

  // const submitCheckOutCustomers = async (visitId, payload) => {
  //   loadingCheckOutCustomers.value = true
  //   checkOutErrorCustomers.value   = null
  //   try {
  //     const res = await visitsSalesServices.checkOutCustomers(visitId, payload)
  //     activeVisitCustId.value      = null
  //     activeVisitCustomersId.value = null
  //     return {
  //       success : true,
  //       message : res.data?.message ?? 'Check out customer berhasil disimpan',
  //       data    : res.data?.data ?? res.data,
  //     }
  //   } catch (error) {
  //     const message = error?.response?.data?.message ?? 'Gagal check out customer'
  //     checkOutErrorCustomers.value = message
  //     return { success: false, message }
  //   } finally {
  //     loadingCheckOutCustomers.value = false
  //   }
  // }

  const submitCheckOutCustomers = async (visitId, payload) => {
  loadingCheckOutCustomers.value = true
  checkOutErrorCustomers.value   = null

  try {
    const res = await visitsSalesServices.checkOutCustomers(visitId, payload)

    activeVisitCustId.value      = null
    activeVisitCustomersId.value = null

    return {
      success : true,
      message : res.data?.message ?? 'Check out customer berhasil disimpan',
      data    : res.data?.data ?? res.data,
    }
  } catch (error) {
    const message = error?.response?.data?.message ?? 'Gagal check out customer'
    checkOutErrorCustomers.value = message

    return { success: false, message }
  } finally {
    loadingCheckOutCustomers.value = false
  }
}


  // ════════════════════════════════════════════
  // DETAIL VISIT
  // ════════════════════════════════════════════

  const detailVisits = async (id) => {
    loadingDetail.value = true
    try {
      const res          = await visitsSalesServices.show(id)
      visitsDetail.value = res.data.data
    } catch (err) {
      console.error('Gagal ambil detail visit:', err)
    } finally {
      loadingDetail.value = false
    }
  }

  const clearDetail = () => { visitsDetail.value = null }


  // ════════════════════════════════════════════
  // SEARCH / SORT / PAGINATION HELPERS
  // ════════════════════════════════════════════

  const searchWithDelay = (val) => {
    clearTimeout(searchTimeout)
    searchVisits.value      = val
    pagination.current_page = 1
    searchTimeout = setTimeout(() => fetchVisits(buildUrl()), 500)
  }

  const changePageSize = () => {
    pagination.current_page = 1
    fetchVisits(buildUrl())
  }

  const changeSorting = () => {
    pagination.current_page = 1
    fetchVisits(buildUrl())
  }

  const toggleSort = (col) => {
    if (!allowedSortColumns.includes(col)) return
    if (sort.column === col) {
      sort.direction = sort.direction === 'asc' ? 'desc' : 'asc'
    } else {
      sort.column    = col
      sort.direction = 'asc'
    }
    changeSorting()
  }

  const resetFilters = () => {
    searchVisits.value      = ''
    pagination.per_page     = 10
    pagination.current_page = 1
    sort.column             = 'created_at'
    sort.direction          = 'desc'
    fetchVisits(buildUrl())
  }


  // ════════════════════════════════════════════
  // FORMAT HELPERS
  // ════════════════════════════════════════════

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Belum pernah diupdate'
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: '2-digit' })
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateStr))
  }

  const formatDuration = (time) => {
    if (!time) return '-'
    const [hours, minutes, seconds] = time.split(':').map(Number)
    const result = []
    if (hours   > 0) result.push(`${hours} jam`)
    if (minutes > 0) result.push(`${minutes} menit`)
    if (seconds > 0) result.push(`${seconds} detik`)
    return result.join(' ') || '-'
  }

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '-'
    const diffMs  = Date.now() - new Date(dateStr)
    const minutes = Math.floor(diffMs / 60000)
    const hours   = Math.floor(diffMs / 3600000)
    const days    = Math.floor(diffMs / 86400000)
    if (minutes < 1)  return 'Baru saja'
    if (minutes < 60) return `${minutes} menit lalu`
    if (hours   < 24) return `${hours} jam lalu`
    if (days    < 30) return `${days} hari lalu`
    return formatDate(dateStr)
  }

  const getStatusBadge = (status) => {
    const map = {
      DONE    : 'bg-emerald-50 text-emerald-600 border border-emerald-200',
      PENDING : 'bg-amber-50 text-amber-600 border border-amber-200',
      CANCEL  : 'bg-rose-50 text-rose-600 border border-rose-200',
    }
    return map[status] ?? 'bg-slate-50 text-slate-600 border border-slate-200'
  }


  // ════════════════════════════════════════════
  // RETURN
  // ════════════════════════════════════════════

  return {
    visitsData, loadingVisits, errorVisits, searchVisits, pagination, sort,
    visitsDetail, loadingDetail,

    loadingVisitNow, visitNowError,
    activeVisitLeadId, activeVisitId,
    activeVisitCustomersId, activeVisitCustId,

    loadingCheckIn, checkInError, checkInSuccess,
    loadingCheckOut, checkOutError, checkOutSuccess,
    loadingCheckOutCustomers, checkOutErrorCustomers, checkOutSuccessCustomers,

    fetchVisits, buildUrl,
    startVisit, startVisitCustomers,
    submitCheckIn, submitCheckInCustomer,
    submitCheckOut, submitCheckOutCustomers,

    searchWithDelay, changePageSize, changeSorting, toggleSort, resetFilters,
    detailVisits, clearDetail,
    formatDate, formatDateTime, formatDuration, formatTimeAgo, getStatusBadge
  }
})