import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { attendanceService } from '@/services/attendanceService'

export const useAttendanceReportHistory = defineStore('attendanceReportHistory', () => {

  // ═══════════════════════════════
  // STATE
  // ═══════════════════════════════
  const historyData   = ref([])
  const loading       = ref(false)
  const error         = ref(null)

  const pagination = ref({
    total        : 0,
    per_page     : 15,
    current_page : 1,
    last_page    : 1,
    next_page_url: null,
    prev_page_url: null,
  })

  const search   = ref('')
  const perPage  = ref(15)

  // Detail modal
  const detailData    = ref(null)
  const loadingDetail = ref(false)

  // Photo preview modal
  const previewPhoto  = ref(null)


  // ═══════════════════════════════
  // GETTERS
  // ═══════════════════════════════
  const isEmpty = computed(() => !loading.value && historyData.value.length === 0)

  const hasPrev = computed(() => !!pagination.value.prev_page_url)
  const hasNext = computed(() => !!pagination.value.next_page_url)


  // ═══════════════════════════════
  // BUILD PARAMS
  // ═══════════════════════════════
  function buildParams(page = 1) {
    const params = {
      page    : page,
      per_page: perPage.value,
    }
    if (search.value.trim()) {
      params.search = search.value.trim()
    }
    return params
  }


 // ═══════════════════════════════
// FETCH MY HISTORY
// ═══════════════════════════════
async function fetchMyHistory(page = 1) {
  try {
    loading.value = true
    error.value   = null

    const res = await attendanceService.getMyHistory(buildParams(page))

    const payload = res.data?.data        // { data: [], pagination: {} }
    historyData.value = payload?.data ?? []

    const p = payload?.pagination ?? {}
    pagination.value = {
      total        : p.total         ?? 0,
      per_page     : p.per_page      ?? perPage.value,
      current_page : p.current_page  ?? 1,
      last_page    : p.last_page     ?? 1,
      next_page_url: p.next_page_url ?? null,
      prev_page_url: p.prev_page_url ?? null,
    }

  } catch (err) {
    error.value = err?.response?.data?.message ?? 'Gagal memuat riwayat absensi.'
    console.error('[fetchMyHistory]', err)
  } finally {
    loading.value = false
  }
}


  // ═══════════════════════════════
  // PAGINATION NAVIGATION
  // ═══════════════════════════════
  function prevPage() {
    if (hasPrev.value) fetchMyHistory(pagination.value.current_page - 1)
  }

  function nextPage() {
    if (hasNext.value) fetchMyHistory(pagination.value.current_page + 1)
  }

  function goToPage(page) {
    if (page >= 1 && page <= pagination.value.last_page) {
      fetchMyHistory(page)
    }
  }


  // ═══════════════════════════════
  // SEARCH WITH DEBOUNCE
  // ═══════════════════════════════
  let searchTimer = null
  function onSearchChange() {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      pagination.value.current_page = 1
      fetchMyHistory(1)
    }, 400)
  }


  // ═══════════════════════════════
  // CHANGE PER PAGE
  // ═══════════════════════════════
  function onPerPageChange() {
    pagination.value.current_page = 1
    fetchMyHistory(1)
  }


  // ═══════════════════════════════
  // RESET FILTER
  // ═══════════════════════════════
  function resetFilters() {
    search.value   = ''
    perPage.value  = 15
    fetchMyHistory(1)
  }


  // ═══════════════════════════════
  // DETAIL
  // ═══════════════════════════════
  // ═══════════════════════════════
// DETAIL
// ═══════════════════════════════
async function fetchDetail(id) {
  try {
    loadingDetail.value = true
    detailData.value    = null

    const res = await attendanceService.show(id)
    detailData.value = res.data?.data ?? null  // { success, message, data: {...} }

  } catch (err) {
    console.error('[fetchDetail]', err)
  } finally {
    loadingDetail.value = false
  }
}

  function clearDetail() {
    detailData.value = null
  }


  // ═══════════════════════════════
  // PHOTO PREVIEW
  // ═══════════════════════════════
  function openPhotoPreview(photoPath) {
    previewPhoto.value = photoPath
  }

  function closePhotoPreview() {
    previewPhoto.value = null
  }


  // ═══════════════════════════════
  // HELPERS
  // ═══════════════════════════════
  function formatDate(dateStr) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
  }

  function formatTime(timeStr) {
    if (!timeStr) return '-'
    // Handle "HH:mm:ss" or full datetime string
    const parts = timeStr.split(' ')
    return parts.length > 1 ? parts[1].slice(0, 5) : timeStr.slice(0, 5)
  }

  function getAttendanceTypeConfig(type) {
    const map = {
      IN : { label: 'IN',  bg: 'bg-green-100 text-green-600'  },
      OUT: { label: 'OUT', bg: 'bg-gray-100 text-gray-600'    },
    }
    return map[type] ?? { label: type ?? '-', bg: 'bg-gray-100 text-gray-500' }
  }

  function getStatusConfig(status) {
    const map = {
      ONTIME    : { label: 'On Time',   bg: 'bg-green-100 text-green-600'   },
      LATE      : { label: 'Late',      bg: 'bg-yellow-100 text-yellow-600' },
      COMPLETED : { label: 'Completed', bg: 'bg-blue-100 text-blue-600'     },
      ABSENT    : { label: 'Absent',    bg: 'bg-red-100 text-red-600'       },
      LEAVE     : { label: 'Leave',     bg: 'bg-purple-100 text-purple-600' },
    }
    return map[status] ?? { label: status ?? '-', bg: 'bg-gray-100 text-gray-500' }
  }

  function getDeviceConfig(device) {
    const map = {
      ANDROID: { label: 'Android', bg: 'bg-green-100 text-green-700'  },
      IOS    : { label: 'iOS',     bg: 'bg-blue-100 text-blue-700'    },
      WEB    : { label: 'Web',     bg: 'bg-slate-100 text-slate-700'  },
    }
    return map[device] ?? { label: device ?? '-', bg: 'bg-gray-100 text-gray-500' }
  }

  function shortLocation(locationName) {
    if (!locationName) return '-'
    // Ambil 2 segmen terakhir agar tidak terlalu panjang di tabel
    const parts = locationName.split(',')
    return parts.slice(-3, -1).map(s => s.trim()).join(', ') || locationName
  }


  // ═══════════════════════════════
  // EXPOSE
  // ═══════════════════════════════
  return {
    // state
    historyData, loading, error,
    pagination, search, perPage,
    detailData, loadingDetail,
    previewPhoto,
    // getters
    isEmpty, hasPrev, hasNext,
    // actions
    fetchMyHistory,
    prevPage, nextPage, goToPage,
    onSearchChange, onPerPageChange, resetFilters,
    fetchDetail, clearDetail,
    openPhotoPreview, closePhotoPreview,
    // helpers
    formatDate, formatTime,
    getAttendanceTypeConfig, getStatusConfig,
    getDeviceConfig, shortLocation,
  }
})