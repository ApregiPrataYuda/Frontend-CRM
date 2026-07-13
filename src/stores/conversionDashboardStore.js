import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { managerDashboardServices } from '@/services/homeDashboardManagerServices'

export const useConversionDashboardStore = defineStore('conversionDashboard', () => {

  // ═══════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════
  const dashboard = ref({
    summary: {
      total_lead: 0,
      converted: 0,
      not_converted: 0,
      conversion_rate: 0,
    },
    sales_conversion: [],
    daily_conversion: [],
    customer_status: [],
    latest_conversion: [],
  })

  const loadingConversion = ref(false)
  const errorConversion   = ref(null)

  // ═══════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════

  const avatarColors = [
    '#4F46E5', '#059669', '#0891B2', '#D97706',
    '#7C3AED', '#DC2626', '#0EA5E9', '#EA580C',
  ]

  const dailyConversionChart = computed(() => ({
    labels: dashboard.value.daily_conversion.map(item => item.date),
    datasets: [
      {
        label: 'Converted',
        data: dashboard.value.daily_conversion.map(item => item.total),
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(139,92,246,.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 5,
        pointHoverRadius: 8,
      },
    ],
  }))

  const hasSalesConversion  = computed(() => dashboard.value.sales_conversion.length > 0)
  const hasLatestConversion = computed(() => dashboard.value.latest_conversion.length > 0)

  // ═══════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════
  const fetchConversion = async (userId) => {
    loadingConversion.value = true
    errorConversion.value   = null
    try {
      const response  = await managerDashboardServices.getDashboardConversion(userId)
      dashboard.value = response.data.data ?? dashboard.value
    } catch (err) {
      console.error('Gagal fetch conversion dashboard:', err)
      errorConversion.value = err
    } finally {
      loadingConversion.value = false
    }
  }

  // ═══════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════
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

  const statusBadge = (status) => {
    switch (status) {
      case 'Active':    return 'badge-success'
      case 'Dormant':   return 'badge-secondary'
      case 'Inactive':  return 'badge-dark'
      case 'Lost':      return 'badge-danger'
      default:          return 'badge-dark'
    }
  }

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

  return {
    // state
    dashboard,
    loadingConversion,
    errorConversion,
    // getters
    dailyConversionChart,
    hasSalesConversion,
    hasLatestConversion,
    // actions
    fetchConversion,
    // helpers
    formatDateTime,
    statusBadge,
    getInitials,
    getAvatarColor,
  }
})