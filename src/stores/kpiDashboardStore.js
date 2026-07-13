import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { managerDashboardServices } from '@/services/homeDashboardManagerServices'

export const useKpiDashboardStore = defineStore('kpiDashboard', () => {

  // ═══════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════
  const dashboard = ref({
    summary: {
      lead: 0,
      customer: 0,
      visit: 0,
      visit_today: 0,
      follow_up: 0,
      overdue_follow_up: 0,
      complaint: 0,
      potential_order: 0,
    },
    kpi: {
      conversion_rate: 0,
      complaint_rate: 0,
      potential_rate: 0,
    },
    top_sales: {
      id_user: null,
      fullname: null,
      total_visit: 0,
    },
    top_customer: {
      customer_code: null,
      company_name: null,
      total_visit: 0,
    },
    insight: [],
  })

  const loadingKpi = ref(false)
  const errorKpi   = ref(null)

  // ═══════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════

  const avatarColors = [
    '#4F46E5', '#059669', '#0891B2', '#D97706',
    '#7C3AED', '#DC2626', '#0EA5E9', '#EA580C',
  ]

  // Lebar progress bar dibatasi max 100% (conversion_rate dari API bisa
  // lebih dari 100%, mis. 350%, saat customer > lead karena lead lama
  // sudah dihapus/diarsip) — angka aslinya tetap ditampilkan di teks
  const clampPercent = (value) => Math.min(Math.max(value ?? 0, 0), 100)

  const conversionRateWidth = computed(() => clampPercent(dashboard.value.kpi.conversion_rate))
  const complaintRateWidth  = computed(() => clampPercent(dashboard.value.kpi.complaint_rate))
  const potentialRateWidth  = computed(() => clampPercent(dashboard.value.kpi.potential_rate))
  const overdueWidth        = computed(() => clampPercent((dashboard.value.summary.overdue_follow_up ?? 0) * 10))

  // Skor kesehatan CRM sederhana, dipakai untuk label "CRM Health" di mini stat
  const overallScore = computed(() => {
    let score = 100
    score -= (dashboard.value.summary.overdue_follow_up ?? 0) * 5
    score -= dashboard.value.kpi.complaint_rate ?? 0
    score += clampPercent(dashboard.value.kpi.conversion_rate) * 0.10
    score += clampPercent(dashboard.value.kpi.potential_rate) * 0.05
    return Math.min(Math.max(Math.round(score), 0), 100)
  })

  const overallGrade = computed(() => {
    if (overallScore.value >= 90) return 'A+'
    if (overallScore.value >= 80) return 'A'
    if (overallScore.value >= 70) return 'B'
    if (overallScore.value >= 60) return 'C'
    return 'D'
  })

  const crmHealthText = computed(() => {
    if (overallScore.value >= 90) return 'Excellent'
    if (overallScore.value >= 75) return 'Good'
    if (overallScore.value >= 60) return 'Fair'
    return 'Needs Attention'
  })

  const crmHealthColor = computed(() => {
    if (overallScore.value >= 90) return 'text-success'
    if (overallScore.value >= 75) return 'text-primary'
    if (overallScore.value >= 60) return 'text-warning'
    return 'text-danger'
  })

  const hasInsight    = computed(() => dashboard.value.insight.length > 0)
  const hasTopSales    = computed(() => !!dashboard.value.top_sales?.fullname)
  const hasTopCustomer = computed(() => !!dashboard.value.top_customer?.company_name)

  // ═══════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════
  const fetchKpi = async (userId) => {
    loadingKpi.value = true
    errorKpi.value   = null
    try {
      const response  = await managerDashboardServices.getDashboardKpi(userId)
      dashboard.value = response.data.data ?? dashboard.value
    } catch (err) {
      console.error('Gagal fetch KPI dashboard:', err)
      errorKpi.value = err
    } finally {
      loadingKpi.value = false
    }
  }

  // ═══════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════
  const formatNumber = (value) => {
    return new Intl.NumberFormat('id-ID').format(value ?? 0)
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

  const insightIcon = (type) => {
    switch (type) {
      case 'warning':  return 'fa-solid fa-triangle-exclamation'
      case 'success':  return 'fa-solid fa-circle-check'
      case 'danger':   return 'fa-solid fa-circle-xmark'
      default:         return 'fa-solid fa-circle-info'
    }
  }

  const insightBadge = (type) => {
    switch (type) {
      case 'warning':  return 'bg-warning text-dark'
      case 'success':  return 'bg-success'
      case 'danger':   return 'bg-danger'
      default:         return 'bg-info'
    }
  }

  return {
    // state
    dashboard,
    loadingKpi,
    errorKpi,
    // getters
    conversionRateWidth,
    complaintRateWidth,
    potentialRateWidth,
    overdueWidth,
    overallScore,
    overallGrade,
    crmHealthText,
    crmHealthColor,
    hasInsight,
    hasTopSales,
    hasTopCustomer,
    // actions
    fetchKpi,
    // helpers
    formatNumber,
    getInitials,
    getAvatarColor,
    insightIcon,
    insightBadge,
  }
})