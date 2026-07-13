import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { managerDashboardServices } from '@/services/homeDashboardManagerServices'

export const useExecutiveSummaryDashboardStore = defineStore('executiveSummaryDashboard', () => {

  // ═══════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════
  const summary = ref({
    period: {
      start_date: null,
      end_date: null,
    },
    lead: {
      total: 0,
    },
    customer: {
      total: 0,
    },
    visit: {
      today: 0,
      this_month: 0,
      last_month: 0,
      growth: 0,
    },
    follow_up: {
      today: 0,
      overdue: 0,
    },
    sales: {
      active: 0,
    },
  })

  const loadingSummary = ref(false)
  const errorSummary   = ref(null)

  // ═══════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════

  // Nilai tertinggi antara lead/customer/visit/sales — dipakai untuk lebar progress bar
  const highestValue = computed(() => {
    return Math.max(
      summary.value.lead?.total ?? 0,
      summary.value.customer?.total ?? 0,
      summary.value.visit?.this_month ?? 0,
      summary.value.sales?.active ?? 0,
      1
    )
  })

  const leadWidth = computed(() => {
    return `${((summary.value.lead?.total ?? 0) / highestValue.value) * 100}%`
  })

  const customerWidth = computed(() => {
    return `${((summary.value.customer?.total ?? 0) / highestValue.value) * 100}%`
  })

  const visitWidth = computed(() => {
    return `${((summary.value.visit?.this_month ?? 0) / highestValue.value) * 100}%`
  })

  const salesWidth = computed(() => {
    return `${((summary.value.sales?.active ?? 0) / highestValue.value) * 100}%`
  })

  const totalActivity = computed(() => {
    return (
      (summary.value.lead?.total ?? 0) +
      (summary.value.customer?.total ?? 0) +
      (summary.value.visit?.this_month ?? 0)
    )
  })

  const followUpStatus = computed(() => {
    return (summary.value.follow_up?.overdue ?? 0) > 0
      ? 'Perlu perhatian'
      : 'Semua aman'
  })

  const visitStatus = computed(() => {
    return (summary.value.visit?.today ?? 0) > 0
      ? 'Ada kunjungan hari ini'
      : 'Belum ada kunjungan'
  })

  const growthPositive = computed(() => (summary.value.visit?.growth ?? 0) >= 0)

  const growthColor = computed(() => (growthPositive.value ? '#16a34a' : '#dc2626'))

  const periodText = computed(() => {
    return `${formatDate(summary.value.period?.start_date)} - ${formatDate(summary.value.period?.end_date)}`
  })

  // ═══════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════
  const fetchSummary = async (userId) => {
    loadingSummary.value = true
    errorSummary.value   = null
    try {
      const response = await managerDashboardServices.getDashboardSummaryExecutive(userId)
      summary.value  = response.data.data ?? summary.value
    } catch (err) {
      console.error('Gagal fetch executive summary dashboard:', err)
      errorSummary.value = err
    } finally {
      loadingSummary.value = false
    }
  }

  // ═══════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════
  const formatDate = (date) => {
    if (!date) return '-'
    const options = { day: '2-digit', month: 'short', year: 'numeric' }
    return new Date(date).toLocaleDateString('id-ID', options)
  }

  return {
    // state
    summary,
    loadingSummary,
    errorSummary,
    // getters
    highestValue,
    leadWidth,
    customerWidth,
    visitWidth,
    salesWidth,
    totalActivity,
    followUpStatus,
    visitStatus,
    growthPositive,
    growthColor,
    periodText,
    // actions
    fetchSummary,
    // helpers
    formatDate,
  }
})