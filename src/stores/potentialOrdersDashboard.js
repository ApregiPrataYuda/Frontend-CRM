import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { managerDashboardServices } from '@/services/homeDashboardManagerServices'

export const usePotentialOrdersDashboardStore = defineStore('potentialOrdersDashboard', () => {

  // ═══════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════
  const dashboard = ref({
    summary: {
      total_visit: 0,
      total_potential_order: 0,
      potential_rate: 0,
    },
    daily_trend: [],
    potential_per_sales: [],
    potential_per_customer: [],
    potential_percentage: [],
    latest_potential_order: [],
  })

  const loadingPotential = ref(false)
  const errorPotential   = ref(null)

  // ═══════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════

  const avatarColors = [
    '#4F46E5', '#059669', '#0891B2', '#D97706',
    '#7C3AED', '#DC2626', '#0EA5E9', '#EA580C',
  ]

  const dailyTrendChart = computed(() => ({
    labels: dashboard.value.daily_trend.map(item => item.date),
    datasets: [
      {
        label: 'Potential Order',
        data: dashboard.value.daily_trend.map(item => item.total),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16,185,129,.12)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
    ],
  }))

  const percentageChart = computed(() => ({
    labels: ['Potential', 'No Potential'],
    datasets: [
      {
        data: [
          dashboard.value.summary.total_potential_order,
          dashboard.value.summary.total_visit - dashboard.value.summary.total_potential_order,
        ],
        backgroundColor: ['#10B981', '#E2E8F0'],
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  }))

  const notPotentialCount = computed(() => {
    const value = dashboard.value.summary.total_visit - dashboard.value.summary.total_potential_order
    return value > 0 ? value : 0
  })

  // Persentase progress bar per sales & per customer, dihitung sebagai
  // getter (menghindari pembagian dengan 0 saat total_potential_order kosong)
  const potentialPerSales = computed(() => {
    const total = dashboard.value.summary.total_potential_order || 0
    return dashboard.value.potential_per_sales.map(item => ({
      ...item,
      percent: total > 0 ? (item.total_potential / total) * 100 : 0,
    }))
  })

  const potentialPerCustomer = computed(() => {
    const total = dashboard.value.summary.total_potential_order || 0
    return dashboard.value.potential_per_customer.map(item => ({
      ...item,
      percent: total > 0 ? (item.total_potential / total) * 100 : 0,
    }))
  })

  const hasDailyTrend             = computed(() => dashboard.value.daily_trend.length > 0)
  const hasPotentialPerSales      = computed(() => dashboard.value.potential_per_sales.length > 0)
  const hasPotentialPerCustomer   = computed(() => dashboard.value.potential_per_customer.length > 0)
  const hasLatestPotentialOrder   = computed(() => dashboard.value.latest_potential_order.length > 0)

  // ═══════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════
  const fetchPotentialOrders = async (userId) => {
    loadingPotential.value = true
    errorPotential.value   = null
    try {
      const response  = await managerDashboardServices.getDashboardPotentialOrders(userId)
      dashboard.value = response.data.data ?? dashboard.value
    } catch (err) {
      console.error('Gagal fetch potential order dashboard:', err)
      errorPotential.value = err
    } finally {
      loadingPotential.value = false
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

  // API tidak mengirim "title" seperti mock lama, cuma visit_result
  // (mis. "upsell_identified") — diubah jadi judul yang enak dibaca
  const formatVisitResult = (status) => {
    if (!status) return '-'
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const visitResultBadge = (status) => {
    switch (status) {
      case 'upsell_identified':  return 'bg-success'
      case 'improved':           return 'bg-primary'
      case 'negotiation':        return 'bg-warning text-dark'
      case 'closing':            return 'bg-emerald'
      default:                   return 'bg-secondary'
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
    loadingPotential,
    errorPotential,
    // getters
    dailyTrendChart,
    percentageChart,
    notPotentialCount,
    potentialPerSales,
    potentialPerCustomer,
    hasDailyTrend,
    hasPotentialPerSales,
    hasPotentialPerCustomer,
    hasLatestPotentialOrder,
    // actions
    fetchPotentialOrders,
    // helpers
    formatDateTime,
    formatVisitResult,
    visitResultBadge,
    getInitials,
    getAvatarColor,
  }
})