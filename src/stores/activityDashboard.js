import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { managerDashboardServices } from '@/services/homeDashboardManagerServices'

export const useActivityDashboardStore = defineStore('activityDashboard', () => {

  // ═══════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════
  const dashboard = ref({
    summary: {
      total_activity: 0,
      today_activity: 0,
    },
    activity_type: [],
    top_sales: [],
    daily_trend: [],
    latest_activity: [],
  })

  const loadingActivity = ref(false)
  const errorActivity   = ref(null)

  // ═══════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════

  // Palet warna dipisah dari data supaya urutan warna tetap konsisten
  // walaupun jumlah/urutan activity_type dari API berubah-ubah
  const activityTypeColors = [
    '#6366F1',
    '#F59E0B',
    '#10B981',
    '#06B6D4',
    '#8B5CF6',
    '#FB923C',
    '#0EA5E9',
    '#EF4444',
  ]

  const activityTypeChart = computed(() => ({
    labels: dashboard.value.activity_type.map(item => item.activity_type),
    datasets: [
      {
        data: dashboard.value.activity_type.map(item => item.total),
        backgroundColor: activityTypeColors,
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  }))

  const dailyTrendChart = computed(() => ({
    labels: dashboard.value.daily_trend.map(item => item.date),
    datasets: [
      {
        label: 'Activity',
        data: dashboard.value.daily_trend.map(item => item.total),
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(99,102,241,.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 5,
        pointHoverRadius: 8,
      },
    ],
  }))

  const hasTopSales        = computed(() => dashboard.value.top_sales.length > 0)
  const hasLatestActivity  = computed(() => dashboard.value.latest_activity.length > 0)

  // Palet warna untuk avatar inisial (dipilih berdasarkan nama, jadi tiap
  // sales konsisten dapat warna yang sama tiap kali render)
  const avatarColors = [
    '#4F46E5', '#059669', '#0891B2', '#D97706',
    '#7C3AED', '#DC2626', '#0EA5E9', '#EA580C',
  ]

  // ═══════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════
  const fetchActivity = async (userId) => {
    loadingActivity.value = true
    errorActivity.value   = null
    try {
      const response  = await managerDashboardServices.getDashboardActivity(userId)
      dashboard.value = response.data.data ?? dashboard.value
    } catch (err) {
      console.error('Gagal fetch activity dashboard:', err)
      errorActivity.value = err
    } finally {
      loadingActivity.value = false
    }
  }

  // ═══════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════
  // Ambil 1-2 huruf inisial dari nama, contoh "sputnix norwey" -> "SN"
  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    const initials = parts.length > 1
      ? parts[0][0] + parts[1][0]
      : parts[0].slice(0, 2)
    return initials.toUpperCase()
  }

  // Warna avatar konsisten per nama (hash sederhana dari karakter nama)
  const getAvatarColor = (name) => {
    if (!name) return avatarColors[0]
    const hash = name
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return avatarColors[hash % avatarColors.length]
  }

  const formatDateTime = (date) => {
    if (!date) return '-'
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  const activityBadge = (type) => {
    switch (type) {
      case 'CREATE':                   return 'badge-primary'
      case 'EXECUTED':                 return 'badge-success'
      case 'RESULT_SUBMITTED':         return 'badge-warning'
      case 'FOLLOW_UP_CREATED':        return 'badge-info'
      case 'NEXT_FOLLOW_UP_CREATED':   return 'badge-secondary'
      case 'LEAD_CONVERTED':           return 'badge-purple'
      case 'DEAL_CLOSED':              return 'badge-danger'
      case 'NEED_FOLLOW_UP':           return 'badge-orange'
      default:                         return 'badge-dark'
    }
  }

  const activityDot = (type) => {
    switch (type) {
      case 'CREATE':                   return 'dot-primary'
      case 'EXECUTED':                 return 'dot-success'
      case 'RESULT_SUBMITTED':         return 'dot-warning'
      case 'FOLLOW_UP_CREATED':        return 'dot-info'
      case 'NEXT_FOLLOW_UP_CREATED':   return 'dot-secondary'
      case 'LEAD_CONVERTED':           return 'dot-purple'
      case 'DEAL_CLOSED':              return 'dot-danger'
      case 'NEED_FOLLOW_UP':           return 'dot-orange'
      default:                         return 'dot-dark'
    }
  }

  return {
    // state
    dashboard,
    loadingActivity,
    errorActivity,
    // getters
    activityTypeChart,
    dailyTrendChart,
    hasTopSales,
    hasLatestActivity,
    // actions
    fetchActivity,
    // helpers
    formatDateTime,
    getInitials,
    getAvatarColor,
    activityBadge,
    activityDot,
  }
})