import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { homeFrontendServices } from '@/services/homeFrontendServices'

export const useHomeFrontendStore = defineStore('homeFrontend', () => {

  // ── STATE ──
  const homeStats        = ref({})
  const loadingHomeStats = ref(false)
  const errorHomeStats   = ref(null)

  const mapData      = ref([])
  const loadingMap   = ref(false)
  const errorMap     = ref(null)

  // ── GETTERS ──
  const totalLeads = computed(() => homeStats.value.total_leads ?? 0)
  const totalCustomers = computed(() => homeStats.value.total_customers ?? 0)
  const visitsToday = computed(() => homeStats.value.visits_today ?? 0)
  const dealsClosed = computed(() => homeStats.value.deals_closed ?? 0)

//   const visibleMapMarkers = computed(() =>
//     mapData.value.filter(v => v.show_on_map)
//   )
const visibleMapMarkers = computed(() => mapData.value)

  // ── ACTIONS ──
  const fetchHomeStats = async () => {
    loadingHomeStats.value = true
    errorHomeStats.value   = null
    try {
      const response      = await homeFrontendServices.getHomeStats()
      homeStats.value     = response.data.data ?? {}
    } catch (err) {
      console.error('Gagal fetch home stats:', err)
      errorHomeStats.value = err
    } finally {
      loadingHomeStats.value = false
    }
  }

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

  const fetchAll = async () => {
    await Promise.all([fetchHomeStats(), fetchMapData()])
  }

  // ── HELPERS ──
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
    // state
    homeStats,
    loadingHomeStats,
    errorHomeStats,
    mapData,
    loadingMap,
    errorMap,
    // getters
    totalLeads,
    totalCustomers,
    visitsToday,
    dealsClosed,
    visibleMapMarkers,
    // actions
    fetchHomeStats,
    fetchMapData,
    fetchAll,
    // helpers
    formatVisitTime,
    visitStatusClass,
    targetTypeIcon,
  }
})