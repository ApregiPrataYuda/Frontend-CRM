import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { salesActivityServices } from '@/services/salesActivityServices'

export const useSalesActivityStore = defineStore('salesActivity', () => {

  // ── SUMMARY (stat tiles + roster/leaderboard) ──
  const summary = reactive({
    mode: 'day',
    start_date: null,
    end_date: null,
    days: 1,
    stats: {
      active_sales: 0,
      total_sales: 0,
      visits: 0,
      followups: 0,
      direct: 0,
    },
    roster: [],
    follow_up_reminders: [],
  })
  const loadingSummary = ref(false)

  // ── ACTIVITIES (table) ──
  const activitiesData = ref([])
  const loadingActivities = ref(false)
  const errorActivity = ref(null)

  const searchActivity = ref('')
  let searchTimeout = null

  const typeFilter = ref('all')
  const typeOptions = ref([
    { value: 'all',      label: 'Semua Tipe' },
    { value: 'visit',    label: 'Visit' },
    { value: 'followup', label: 'Follow Up' },
    { value: 'direct',   label: 'Direct' },
  ])

  const pagination = reactive({
    current_page: 1,
    per_page: 10,
    prev_page_url: null,
    next_page_url: null,
    last_page: 1,
    total: 0,
  })

  const sort = reactive({
    column: 'time',
    direction: 'desc',
  })
  const allowedSortColumns = ['time', 'name']
  const sortOptions = ref([
    { value: 'time', label: 'Waktu' },
    { value: 'name', label: 'Nama Sales' },
  ])

  // ── DATE RANGE ──
  // dayKey dipakai buat 3 tab harian (today / yesterday / tanggal ISO lain).
  // rangePreset dipakai buat dropdown "Rentang Lain" (last7/last_week/last30/
  // last_month/custom) dan kalau ke-set, prioritas di atas dayKey.
  const dayKey = ref('today')
  const rangePreset = ref(null)
  const customRange = reactive({
    start: null,
    end: null,
  })

  const rangePresetOptions = ref([
    { value: 'last7',       label: '7 Hari Terakhir' },
    { value: 'last_week',   label: 'Minggu Lalu' },
    { value: 'last30',      label: '30 Hari Terakhir' },
    { value: 'last_month',  label: 'Bulan Lalu' },
  ])

  const viewMode = computed(() => (rangePreset.value ? 'range' : 'day'))

  // ── DETAIL ──
  const activityDetail = ref(null)
  const loadingDetail = ref(false)

  // ── EXPORT ──
  const exportingExcel = ref(false)

  // ── BUILD DATE PARAMS (dipakai bareng oleh summary & activities) ──
  const buildDateParams = () => {
    if (rangePreset.value === 'custom') {
      return { start_date: customRange.start, end_date: customRange.end }
    }
    if (rangePreset.value) {
      return { preset: rangePreset.value }
    }
    if (dayKey.value === 'today' || dayKey.value === 'yesterday') {
      return { preset: dayKey.value }
    }
    return { date: dayKey.value }
  }

  // ── BUILD URL (activities) ──
  const buildActivitiesUrl = () => {
    const params = new URLSearchParams()
    const dateParams = buildDateParams()

    Object.entries(dateParams).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })

    if (typeFilter.value && typeFilter.value !== 'all') params.append('type', typeFilter.value)
    if (searchActivity.value) params.append('search', searchActivity.value)
    if (pagination.current_page) params.append('page', pagination.current_page)
    if (pagination.per_page) params.append('per_page', pagination.per_page)
    if (sort.column) {
      params.append('sort_by', sort.column)
      params.append('sort_dir', sort.direction)
    }

    return `/manager/sales-activity/activities?${params.toString()}`
  }

  // ── FETCH SUMMARY ──
  const fetchSummary = async () => {
    loadingSummary.value = true
    try {
      const response = await salesActivityServices.getSummary(buildDateParams())
      const result = response.data.data

      summary.mode                = result.mode
      summary.start_date          = result.start_date
      summary.end_date            = result.end_date
      summary.days                = result.days
      summary.stats               = result.stats
      summary.roster              = result.roster
      summary.follow_up_reminders = result.follow_up_reminders ?? []
    } catch (error) {
      console.error('Gagal fetch summary sales activity:', error)
    } finally {
      loadingSummary.value = false
    }
  }

  // ── FETCH ACTIVITIES ──
  const fetchActivities = async (url = null) => {
    loadingActivities.value = true
    try {
      const finalUrl = url || buildActivitiesUrl()
      const response = await salesActivityServices.getByUrl(finalUrl)
      const result = response.data

      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      activitiesData.value.splice(0, activitiesData.value.length, ...dataArray)

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
      console.error('Gagal fetch activities:', error)
    } finally {
      loadingActivities.value = false
    }
  }

  // ── FETCH SEMUA ACTIVITIES UTK EXPORT (loop semua halaman, ikutin filter aktif) ──
  // per_page dibatasi max 100 sama SalesActivityValidationIndex, jadi export nge-loop
  // page 1..last_page dengan per_page=100 lalu digabung, bukan sekali fetch semua.
  const fetchAllActivitiesForExport = async () => {
    const baseParams = {
      ...buildDateParams(),
      per_page: 100,
      sort_by: sort.column,
      sort_dir: sort.direction,
    }
    if (typeFilter.value && typeFilter.value !== 'all') baseParams.type = typeFilter.value
    if (searchActivity.value) baseParams.search = searchActivity.value

    const allRows = []
    let page = 1
    let lastPage = 1

    do {
      const response = await salesActivityServices.getActivities({ ...baseParams, page })
      const result = response.data

      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      allRows.push(...dataArray)

      const pag = result.pagination ?? result.data?.pagination
      lastPage = pag?.last_page ?? 1
      page += 1
    } while (page <= lastPage)

    return allRows
  }

  // ── REFRESH SEMUA (summary + activities sekaligus) ──
  const refreshAll = async () => {
    await Promise.all([fetchSummary(), fetchActivities(buildActivitiesUrl())])
  }

  // ── DAY TAB / RANGE PRESET / CUSTOM RANGE ──
  const selectDay = (key) => {
    rangePreset.value = null
    dayKey.value = key
    pagination.current_page = 1
    refreshAll()
  }

  const selectRangePreset = (key) => {
    rangePreset.value = key
    pagination.current_page = 1
    refreshAll()
  }

  const applyCustomRange = (start, end) => {
    customRange.start = start
    customRange.end = end
    rangePreset.value = 'custom'
    pagination.current_page = 1
    refreshAll()
  }

  // ── SEARCH WITH DELAY ──
  const searchWithDelay = (val) => {
    clearTimeout(searchTimeout)
    searchActivity.value = val
    pagination.current_page = 1
    searchTimeout = setTimeout(() => {
      fetchActivities(buildActivitiesUrl())
    }, 500)
  }

  // ── CHANGE TYPE FILTER ──
  const changeTypeFilter = (val) => {
    typeFilter.value = val
    pagination.current_page = 1
    fetchActivities(buildActivitiesUrl())
  }

  // ── CHANGE PAGE SIZE ──
  const changePageSize = () => {
    pagination.current_page = 1
    fetchActivities(buildActivitiesUrl())
  }

  // ── SORTING ──
  const changeSorting = () => {
    pagination.current_page = 1
    fetchActivities(buildActivitiesUrl())
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

  // ── RESET ──
  const resetFilters = () => {
    searchActivity.value = ''
    typeFilter.value = 'all'
    pagination.per_page = 10
    pagination.current_page = 1
    sort.column = 'time'
    sort.direction = 'desc'
    rangePreset.value = null
    dayKey.value = 'today'
    customRange.start = null
    customRange.end = null
    refreshAll()
  }

  // ── DETAIL ──
  const fetchActivityDetail = async (type, id) => {
    loadingDetail.value = true
    try {
      const res = await salesActivityServices.getActivityDetail(type, id)
      activityDetail.value = res.data.data
    } catch (err) {
      console.error('Gagal ambil detail activity:', err)
      throw err
    } finally {
      loadingDetail.value = false
    }
  }

  // ── FORMAT DATE ──
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
    summary, loadingSummary,
    activitiesData, loadingActivities, errorActivity,
    searchActivity, typeFilter, typeOptions,
    pagination, sort, sortOptions,
    dayKey, rangePreset, rangePresetOptions, customRange, viewMode,
    activityDetail, loadingDetail,
    exportingExcel,
    // actions
    buildDateParams, buildActivitiesUrl,
    fetchSummary, fetchActivities, refreshAll,
    fetchAllActivitiesForExport,
    selectDay, selectRangePreset, applyCustomRange,
    searchWithDelay, changeTypeFilter, changePageSize,
    changeSorting, toggleSort, resetFilters,
    fetchActivityDetail, formatDate,
  }
})