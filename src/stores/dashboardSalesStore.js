import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { salesDashboardServices } from '@/services/homeDashboardSalesServices'

export const useDashboardSalesStore = defineStore('dashboardSales', () => {

  // ── STATE ──
  const stats        = ref({})
  const loadingStats = ref(false)
  const errorStats   = ref(null)

  // ── GETTERS ──
  const achievementColor = computed(() => {
    const a = stats.value.target?.achievement ?? 0
    if (a >= 80) return '#71dd37'
    if (a >= 50) return '#ffab00'
    return '#ff3e1d'
  })

  const overdueCount = computed(() =>
    (stats.value.follow_ups ?? []).filter(f => f.is_overdue).length
  )

  const maxPerDay = computed(() => {
    const days = stats.value.target?.per_day ?? []
    return Math.max(...days.map(d => d.total), 1)
  })

  const maxVisits = computed(() => {
    const lb = stats.value.ranking?.leaderboard ?? []
    return Math.max(...lb.map(s => s.total_visits), 1)
  })

  // ── ACTIONS ──
  const fetchDashboard = async (userId) => {
    if (!userId) return
    loadingStats.value = true
    errorStats.value   = null
    try {
      const response = await salesDashboardServices.getDashboard(userId)
      stats.value    = response.data.data ?? {}
    } catch (err) {
      console.error('Gagal fetch sales dashboard:', err)
      errorStats.value = err
    } finally {
      loadingStats.value = false
    }
  }

  // ── HELPERS ──
  const formatTime = (dt) => {
    if (!dt) return '-'
    return new Date(dt).toLocaleString('id-ID', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const progressClass = (p) => {
    if (p === 'PLANNED') return 'badge-planned'
    if (p === 'ONGOING') return 'badge-ongoing'
    if (p === 'DONE')    return 'badge-done'
    return 'badge-unknown'
  }

  const fuTypeClass = (type) => {
    const map = {
      CALL:     'fu-call',
      EMAIL:    'fu-email',
      WHATSAPP: 'fu-wa',
      MEETING:  'fu-meeting',
      VISIT:    'fu-visit',
      OTHER:    'fu-other',
    }
    return map[type] ?? 'fu-other'
  }

  const fuTypeIcon = (type) => {
    const map = {
      CALL:     'fa-solid fa-phone',
      EMAIL:    'fa-solid fa-envelope',
      WHATSAPP: 'fa-brands fa-whatsapp',
      MEETING:  'fa-solid fa-users',
      VISIT:    'fa-solid fa-location-dot',
      OTHER:    'fa-solid fa-ellipsis',
    }
    return map[type] ?? 'fa-solid fa-ellipsis'
  }

  const barColor = (i) => {
    const colors = ['#ffab00', '#9ca3af', '#cd7c4f', '#696cff', '#03c3ec']
    return colors[i] ?? '#696cff'
  }

  return {
    // state
    stats,
    loadingStats,
    errorStats,
    // getters
    achievementColor,
    overdueCount,
    maxPerDay,
    maxVisits,
    // actions
    fetchDashboard,
    // helpers
    formatTime,
    progressClass,
    fuTypeClass,
    fuTypeIcon,
    barColor,
  }
})