import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { attendanceService } from '@/services/attendanceService'

export const useAttendanceReportStore = defineStore('attendanceReport', () => {

  const reportData     = ref(null)
  const attendanceDays = ref([])
  const reportSummary  = ref({})
  const loadingReport  = ref(false)

  const historyData    = ref([])
  const loadingHistory = ref(false)
  const searchHistory  = ref('')
  let searchTimeout    = null

  const pagination = reactive({
    current_page:  1,
    per_page:      10,
    prev_page_url: null,
    next_page_url: null,
    last_page:     1,
    total:         0,
  })

  const selectedMonth = ref(new Date().getMonth() + 1)
  const selectedYear  = ref(new Date().getFullYear())

  // ======================
  // REPORT
  // ======================
//   const fetchMyReport = async () => {
//     loadingReport.value = true
//     try {
//       // Service sudah return response.data, jadi langsung pakai res
//       const res = await attendanceService.getMyReport({
//         month: selectedMonth.value,
//         year:  selectedYear.value,
//       })

//       const data = res.data  // ← res = response.data dari service, res.data = payload dalam data

//       reportData.value     = data
//       attendanceDays.value = data.attendance_days || []
//       reportSummary.value  = data.summary || {}

//     } catch (err) {
//       console.error('Gagal fetch report:', err)
//     } finally {
//       loadingReport.value = false
//     }
//   }
// Di store fetchMyReport()
const fetchMyReport = async () => {
  loadingReport.value = true
  try {
    const res = await attendanceService.getMyReport({
      month: selectedMonth.value,
      year:  selectedYear.value,
    })

    // ✅ FIX: res = response.data (dari axios)
    // res.data = { user, period, summary, attendance_days }
    const data = res.data  // ini { success, message, data: {...} }

    reportData.value     = data.data          // ← data.data = { user, period, ... }
    attendanceDays.value = data.data.attendance_days || []
    reportSummary.value  = data.data.summary || {}

  } catch (err) {
    console.error('Gagal fetch report:', err)
  } finally {
    loadingReport.value = false
  }
}

  const changeMonth = async (val) => {
    selectedMonth.value = val
    await fetchMyReport()
  }

  const changeYear = async (val) => {
    selectedYear.value = val
    await fetchMyReport()
  }

  // ======================
  // HISTORY
  // ======================
  const fetchMyHistory = async () => {
    loadingHistory.value = true
    try {
      const res = await attendanceService.getMyHistory({
        page:     pagination.current_page,
        per_page: pagination.per_page,
        search:   searchHistory.value,
      })

      const result = res.data  // ← sama, res = response.data

      historyData.value = result.data || []

      const pag = result.pagination
      if (pag) {
        Object.assign(pagination, pag)
      }

    } catch (err) {
      console.error('Gagal fetch history:', err)
    } finally {
      loadingHistory.value = false
    }
  }

  const searchWithDelay = (val) => {
    clearTimeout(searchTimeout)
    searchHistory.value     = val
    pagination.current_page = 1

    searchTimeout = setTimeout(() => {
      fetchMyHistory()
    }, 500)
  }

  // ======================
  // UTIL
  // ======================
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year:  'numeric',
      month: 'long',
      day:   'numeric',
    })
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  return {
    reportData, attendanceDays, reportSummary, loadingReport,
    historyData, loadingHistory, searchHistory, pagination,
    selectedMonth, selectedYear,
    fetchMyReport, fetchMyHistory, searchWithDelay, changeMonth, changeYear,
    formatDate, getInitials,
  }
})