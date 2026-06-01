import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { attendanceService } from '@/services/attendanceService'

export const useDataAttendanceStore = defineStore('attendance', () => {

  // ── ATTENDANCE LIST ──────────────────────────
  const attendancesData = ref([])
  const loadingAttendances = ref(false)
  const searchAttendances = ref('')
  let searchTimeout = null

  // ── ATTENDANCE DETAIL ────────────────────────
  const attendanceDetail = ref(null)
  const loadingDetail = ref(false)

  // ── PAGINATION ───────────────────────────────
  const pagination = reactive({
    current_page: 1,
    per_page: 10,
    prev_page_url: null,
    next_page_url: null,
    last_page: 1,
    total: 0,
  })

  // ── SORT ─────────────────────────────────────
  const sort = reactive({
    column: 'created_at',
    direction: 'desc',
  })

  const allowedSortColumns = ['attendance_date', 'created_at']

  // ── BUILD URL ─────────────────────────────────
  const buildUrl = () => {
    const params = new URLSearchParams()
    if (searchAttendances.value) params.append('search', searchAttendances.value)
    if (pagination.current_page)  params.append('page', pagination.current_page)
    if (pagination.per_page)      params.append('per_page', pagination.per_page)
    if (sort.column) {
      params.append('sort_by', sort.column)
      params.append('sort_dir', sort.direction)
    }
    return `/attendance-management?${params.toString()}`
  }

  // ── FETCH LIST ────────────────────────────────
  const fetchAttendance = async (url = null) => {
    loadingAttendances.value = true
    try {
      const finalUrl = url || buildUrl()
      const response = await attendanceService.getByUrl(finalUrl)
      const result = response.data

      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      attendancesData.value.splice(0, attendancesData.value.length, ...dataArray)

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
      console.error('Failed to fetch attendance:', error)
    } finally {
      loadingAttendances.value = false
    }
  }

  // ── FETCH DETAIL ──────────────────────────────
  const fetchAttendanceDetail = async (id) => {
    loadingDetail.value = true
    attendanceDetail.value = null
    try {
      const res = await attendanceService.show(id)
      attendanceDetail.value = res.data?.data ?? res.data ?? null
    } catch (error) {
      console.error('Failed to fetch attendance detail:', error)
    } finally {
      loadingDetail.value = false
    }
  }

  // ── SEARCH WITH DELAY ─────────────────────────
  const searchWithDelay = (val) => {
    clearTimeout(searchTimeout)
    searchAttendances.value = val  // ✅ update value dulu sebelum buildUrl()
    pagination.current_page = 1
    searchTimeout = setTimeout(() => {
      fetchAttendance(buildUrl())
    }, 500)
  }

  // ── PAGE SIZE ─────────────────────────────────
  const changePageSize = () => {
    pagination.current_page = 1
    fetchAttendance(buildUrl())
  }

  // ── SORTING ───────────────────────────────────
  const changeSorting = () => {
    pagination.current_page = 1
    fetchAttendance(buildUrl())
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

  // ── RESET ─────────────────────────────────────
  const resetFilters = () => {
    searchAttendances.value = ''
    pagination.per_page = 10
    pagination.current_page = 1
    sort.column = 'created_at'
    sort.direction = 'desc'
    fetchAttendance(buildUrl())
  }

  // ── FORMAT DATE ───────────────────────────────
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

  // ── STATUS NORMALIZER ─────────────────────────
  const normalizeStatus = (rawStatus) => {
    if (!rawStatus) return 'NONE'
    if (rawStatus === 'IN_ONLY' || rawStatus === 'CHECKED_IN') return 'CHECKED_IN'
    if (rawStatus === 'COMPLETE' || rawStatus === 'CHECKED_OUT') return 'CHECKED_OUT'
    return rawStatus
  }

  // ── TODAY STATUS ──────────────────────────────
  const todayStatus = ref(null)
  const isCheckingStatus = ref(false)

  const normalizedTodayStatus = computed(() =>
    normalizeStatus(todayStatus.value?.status)
  )

  const hasAttendanceToday = computed(() =>
    todayStatus.value?.has_attendance_today ?? false
  )

  const attendanceStatus = computed(() =>
    normalizedTodayStatus.value
  )

  const checkToday = async () => {
    isCheckingStatus.value = true
    try {
      const res = await attendanceService.checkToday()
      if (res.data.success) {
        const rawData = res.data.data
        todayStatus.value = {
          ...rawData,
          status: normalizeStatus(rawData?.status),
        }
      }
    } catch (err) {
      console.error('Failed to check today status:', err)
      todayStatus.value = {
        has_attendance_today: false,
        check_in: null,
        check_out: null,
        status: 'NONE',
      }
    } finally {
      isCheckingStatus.value = false
    }
  }

  // ── SUBMIT ────────────────────────────────────
  const isSubmitting = ref(false)
  const submitError = ref(null)

  const submitAttendance = async (payload) => {
    isSubmitting.value = true
    submitError.value = null
    try {
      const res = await attendanceService.store(payload)
      if (res.data.success) {
        await checkToday()
        await fetchAttendance()
      }
      return res.data
    } catch (err) {
      submitError.value = err.response?.status === 422
        ? err.response.data.errors
        : err.response?.data?.message ?? 'Gagal menyimpan absen.'
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  // ── RETURN ────────────────────────────────────
  return {
    // list
    attendancesData,
    loadingAttendances,
    searchAttendances,
    pagination,
    sort,
    fetchAttendance,
    buildUrl,
    formatDate,
    resetFilters,
    toggleSort,
    changePageSize,
    changeSorting,
    searchWithDelay,

    // detail
    attendanceDetail,
    loadingDetail,
    fetchAttendanceDetail,

    // status helpers
    normalizeStatus,
    normalizedTodayStatus,
    hasAttendanceToday,
    attendanceStatus,

    // today
    todayStatus,
    isCheckingStatus,
    checkToday,

    // submit
    isSubmitting,
    submitError,
    submitAttendance,
  }
})