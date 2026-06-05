// import { defineStore } from 'pinia'
// import { ref, computed } from 'vue'
// import { homeFrontendServices } from '@/services/homeFrontendServices'

// export const useHomeFrontendStore = defineStore('homeFrontend', () => {

//   // ── STATE ──
//   const homeStats        = ref({})
//   const loadingHomeStats = ref(false)
//   const errorHomeStats   = ref(null)

//   const mapData      = ref([])
//   const loadingMap   = ref(false)
//   const errorMap     = ref(null)

//   // ── GETTERS ──
//   const totalLeads = computed(() => homeStats.value.total_leads ?? 0)
//   const totalCustomers = computed(() => homeStats.value.total_customers ?? 0)
//   const visitsToday = computed(() => homeStats.value.visits_today ?? 0)
//   const dealsClosed = computed(() => homeStats.value.deals_closed ?? 0)

// //   const visibleMapMarkers = computed(() =>
// //     mapData.value.filter(v => v.show_on_map)
// //   )
// const visibleMapMarkers = computed(() => mapData.value)

//   // ── ACTIONS ──
//   const fetchHomeStats = async () => {
//     loadingHomeStats.value = true
//     errorHomeStats.value   = null
//     try {
//       const response      = await homeFrontendServices.getHomeStats()
//       homeStats.value     = response.data.data ?? {}
//     } catch (err) {
//       console.error('Gagal fetch home stats:', err)
//       errorHomeStats.value = err
//     } finally {
//       loadingHomeStats.value = false
//     }
//   }

//   const fetchMapData = async () => {
//     loadingMap.value = true
//     errorMap.value   = null
//     try {
//       const response = await homeFrontendServices.getDataMapsRealtime()
//       mapData.value  = response.data.data ?? []
//     } catch (err) {
//       console.error('Gagal fetch map data:', err)
//       errorMap.value = err
//     } finally {
//       loadingMap.value = false
//     }
//   }

//   const fetchAll = async () => {
//     await Promise.all([fetchHomeStats(), fetchMapData()])
//   }

//   // ── HELPERS ──
//   const formatVisitTime = (dt) => {
//     if (!dt) return '-'
//     return new Date(dt).toLocaleString('id-ID', {
//       day: '2-digit', month: 'short',
//       hour: '2-digit', minute: '2-digit',
//     })
//   }

//   const visitStatusClass = (status) => {
//     const map = {
//       'SELESAI':      'badge-done',
//       'BERLANGSUNG':  'badge-ongoing',
//       'DIRENCANAKAN': 'badge-planned',
//     }
//     return map[status] ?? 'badge-unknown'
//   }

//   const targetTypeIcon = (type) => {
//     return type === 'CUSTOMER'
//       ? 'fa-solid fa-building'
//       : 'fa-solid fa-user-plus'
//   }

//   return {
//     // state
//     homeStats,
//     loadingHomeStats,
//     errorHomeStats,
//     mapData,
//     loadingMap,
//     errorMap,
//     // getters
//     totalLeads,
//     totalCustomers,
//     visitsToday,
//     dealsClosed,
//     visibleMapMarkers,
//     // actions
//     fetchHomeStats,
//     fetchMapData,
//     fetchAll,
//     // helpers
//     formatVisitTime,
//     visitStatusClass,
//     targetTypeIcon,
//   }
// })


import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { homeFrontendServices } from '@/services/homeFrontendServices'

export const useHomeFrontendStore = defineStore('homeFrontend', () => {

  // ── STATE: Home Stats ──────────────────────────────────────────────────
  const homeStats        = ref({})
  const loadingHomeStats = ref(false)
  const errorHomeStats   = ref(null)

  // ── STATE: Map ─────────────────────────────────────────────────────────
  const mapData    = ref([])
  const loadingMap = ref(false)
  const errorMap   = ref(null)

  // ── STATE: Visit All Data ──────────────────────────────────────────────
  const visitAllData      = ref([])
  const visitPagination   = ref({
    total:       0,
    currentPage: 1,
    lastPage:    1,
    perPage:     10,
  })
  const loadingVisitAll   = ref(false)
  const errorVisitAll     = ref(null)

  // Filter & sort params — disimpan di store agar bisa di-reset dari mana saja
  const visitFilters = ref({
    dateFrom:  new Date().toISOString().split('T')[0],
    dateTo:    new Date().toISOString().split('T')[0],
    status:    '',
    visitType: '',
    search:    '',
    sortBy:    'visit_date',
    sortDir:   'desc',
    perPage:   '10',   // String — CFormSelect CoreUI expects String | Array
    page:      1,
  })

  // ── GETTERS: Home Stats ────────────────────────────────────────────────
  const totalLeads     = computed(() => homeStats.value.total_leads     ?? 0)
  const totalCustomers = computed(() => homeStats.value.total_customers ?? 0)
  const visitsToday    = computed(() => homeStats.value.visits_today    ?? 0)
  const dealsClosed    = computed(() => homeStats.value.deals_closed    ?? 0)

  // ── GETTERS: Map ───────────────────────────────────────────────────────
  const visibleMapMarkers = computed(() => mapData.value)

  // ── GETTERS: Visit All Data ────────────────────────────────────────────
  const visitStats = computed(() => ({
    planned:  visitAllData.value.filter(v => v.visit_progress === 'PLANNED').length,
    ongoing:  visitAllData.value.filter(v => v.visit_progress === 'ONGOING').length,
    done:     visitAllData.value.filter(v => v.visit_progress === 'DONE').length,
    lead:     visitAllData.value.filter(v => v.visit_type === 'LEAD').length,
    customer: visitAllData.value.filter(v => v.visit_type === 'CUSTOMER').length,
  }))

  const visitPaginationFrom = computed(() => {
    if (visitPagination.value.total === 0) return 0
    return (visitPagination.value.currentPage - 1) * Number(visitFilters.value.perPage) + 1
  })

  const visitPaginationTo = computed(() =>
    Math.min(
      visitPagination.value.currentPage * Number(visitFilters.value.perPage),
      visitPagination.value.total,
    )
  )

  // ── ACTIONS: Home Stats ────────────────────────────────────────────────
  const fetchHomeStats = async () => {
    loadingHomeStats.value = true
    errorHomeStats.value   = null
    try {
      const response  = await homeFrontendServices.getHomeStats()
      homeStats.value = response.data.data ?? {}
    } catch (err) {
      console.error('Gagal fetch home stats:', err)
      errorHomeStats.value = err
    } finally {
      loadingHomeStats.value = false
    }
  }

  // ── ACTIONS: Map ───────────────────────────────────────────────────────
  const fetchMapData = async () => {
    loadingMap.value = true
    errorMap.value   = null
    try {
      const response = await homeFrontendServices.getDataMapsRealtime()
      mapData.value  = response.data.data ?? []
    } catch (err) {
      console.error('Gagal fetch map data:', err)
      errorMap.value = err
    } finally {
      loadingMap.value = false
    }
  }

  // ── ACTIONS: Visit All Data ────────────────────────────────────────────
  const fetchVisitAllData = async () => {
    loadingVisitAll.value = true
    errorVisitAll.value   = null
    try {
      const response = await homeFrontendServices.getDataVisitAllData({
        date_from:    visitFilters.value.dateFrom,
        date_to:      visitFilters.value.dateTo,
        visit_status: visitFilters.value.status,
        visit_type:   visitFilters.value.visitType,
        search:       visitFilters.value.search,
        sort_by:      visitFilters.value.sortBy,
        sort_dir:     visitFilters.value.sortDir,
        per_page:     Number(visitFilters.value.perPage),
        page:         visitFilters.value.page,
      })
      visitAllData.value    = response.data.data?.data ?? []
      visitPagination.value = {
        total:       response.data.data?.pagination?.total        ?? 0,
        currentPage: response.data.data?.pagination?.current_page ?? 1,
        lastPage:    response.data.data?.pagination?.last_page    ?? 1,
        perPage:     response.data.data?.pagination?.per_page     ?? Number(visitFilters.value.perPage),
      }
    } catch (err) {
      console.error('Gagal fetch visit all data:', err)
      errorVisitAll.value = err
    } finally {
      loadingVisitAll.value = false
    }
  }

  // Fetch export — ambil semua data tanpa pagination untuk di-download
  const fetchVisitAllDataExport = async () => {
    const response = await homeFrontendServices.getDataVisitAllData({
      date_from:    visitFilters.value.dateFrom,
      date_to:      visitFilters.value.dateTo,
      visit_status: visitFilters.value.status,
      visit_type:   visitFilters.value.visitType,
      search:       visitFilters.value.search,
      sort_by:      visitFilters.value.sortBy,
      sort_dir:     visitFilters.value.sortDir,
      per_page:     9999,
      page:         1,
    })
    return response.data.data?.data ?? []
  }

  // Helper: set filter lalu fetch ulang dari page 1
  const setVisitFilter = (key, value) => {
    visitFilters.value[key] = value
    visitFilters.value.page = 1
    fetchVisitAllData()
  }

  const setVisitSort = (col) => {
    if (visitFilters.value.sortBy === col) {
      visitFilters.value.sortDir = visitFilters.value.sortDir === 'asc' ? 'desc' : 'asc'
    } else {
      visitFilters.value.sortBy  = col
      visitFilters.value.sortDir = 'desc'
    }
    visitFilters.value.page = 1
    fetchVisitAllData()
  }

  const setVisitPage = (page) => {
    visitFilters.value.page = page
    fetchVisitAllData()
  }

  const resetVisitFilters = () => {
    visitFilters.value = {
      dateFrom:  new Date().toISOString().split('T')[0],
      dateTo:    new Date().toISOString().split('T')[0],
      status:    '',
      visitType: '',
      search:    '',
      sortBy:    'visit_date',
      sortDir:   'desc',
      perPage:   '10',
      page:      1,
    }
    fetchVisitAllData()
  }

  // ── ACTIONS: Combined ─────────────────────────────────────────────────
  const fetchAll = async () => {
    await Promise.all([fetchHomeStats(), fetchMapData()])
  }

  // ── HELPERS ───────────────────────────────────────────────────────────
  const formatVisitTime = (dt) => {
    if (!dt) return '-'
    return new Date(dt).toLocaleString('id-ID', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const visitStatusClass = (status) => {
    const map = {
      'SELESAI':      'badge-done',
      'BERLANGSUNG':  'badge-ongoing',
      'DIRENCANAKAN': 'badge-planned',
    }
    return map[status] ?? 'badge-unknown'
  }

  const targetTypeIcon = (type) => {
    return type === 'CUSTOMER'
      ? 'fa-solid fa-building'
      : 'fa-solid fa-user-plus'
  }

  return {
    // ── state ──
    homeStats, loadingHomeStats, errorHomeStats,
    mapData, loadingMap, errorMap,
    visitAllData, visitPagination, visitFilters,
    loadingVisitAll, errorVisitAll,

    // ── getters ──
    totalLeads, totalCustomers, visitsToday, dealsClosed,
    visibleMapMarkers,
    visitStats,
    visitPaginationFrom,
    visitPaginationTo,

    // ── actions ──
    fetchHomeStats,
    fetchMapData,
    fetchAll,
    fetchVisitAllData,
    fetchVisitAllDataExport,
    setVisitFilter,
    setVisitSort,
    setVisitPage,
    resetVisitFilters,

    // ── helpers ──
    formatVisitTime,
    visitStatusClass,
    targetTypeIcon,
  }
})