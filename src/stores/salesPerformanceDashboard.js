import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { managerDashboardServices } from '@/services/homeDashboardManagerServices'

const photoBase = `${import.meta.env.VITE_STORAGE_URL}/users/`

export const useSalesPerformanceDashboardStore = defineStore('salesPerformanceDashboard', () => {

  // ═══════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════
  const performance = ref({
    summary: {
      total_sales: 0,
      active_sales: 0,
      inactive_sales: 0,
      total_visit: 0,
      total_follow_up: 0,
      total_customer: 0,
    },
    top_performer: null,
    ranking: [],
  })

  const loadingPerformance = ref(false)
  const errorPerformance   = ref(null)

  // ═══════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════

  const maxScore = computed(() => {
    return Math.max(
      ...performance.value.ranking.map(item => item.performance_score ?? 0),
      1
    )
  })

  const totalScore = computed(() => {
    return performance.value.ranking.reduce((total, item) => {
      return total + (item.performance_score ?? 0)
    }, 0)
  })

  const averageScore = computed(() => {
    if (!performance.value.ranking.length) return 0
    return (totalScore.value / performance.value.ranking.length).toFixed(1)
  })

  const bestSales = computed(() => performance.value.ranking[0] ?? null)

  const totalActivePercentage = computed(() => {
    const total = performance.value.summary.total_sales
    if (!total) return 0
    return (performance.value.summary.active_sales / total) * 100
  })

  const totalInactivePercentage = computed(() => {
    const total = performance.value.summary.total_sales
    if (!total) return 0
    return (performance.value.summary.inactive_sales / total) * 100
  })

  // ═══════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════
  const fetchPerformance = async (userId) => {
    loadingPerformance.value = true
    errorPerformance.value   = null
    try {
      const response = await managerDashboardServices.getDashboardSalesPerformance(userId)
      const data     = response.data.data ?? {}

      const topPerformer = data.top_performer
        ? { ...data.top_performer, image_url: photoBase + (data.top_performer.image ?? '') }
        : null

      const maxScoreRaw = Math.max(
        ...(data.ranking ?? []).map(item => item.performance_score ?? 0),
        1
      )

      const ranking = (data.ranking ?? []).map(item => ({
        ...item,
        image_url: photoBase + (item.image ?? ''),
        score_percent: ((item.performance_score ?? 0) / maxScoreRaw) * 100,
      }))

      performance.value = {
        summary: data.summary ?? performance.value.summary,
        top_performer: topPerformer,
        ranking,
      }
    } catch (err) {
      console.error('Gagal fetch sales performance dashboard:', err)
      errorPerformance.value = err
    } finally {
      loadingPerformance.value = false
    }
  }

  // ═══════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════
  const scoreBadge = (score) => {
    if (score >= 10) return 'bg-success'
    if (score >= 7)  return 'bg-primary'
    if (score >= 5)  return 'bg-warning'
    return 'bg-secondary'
  }

  const medal = (index) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return '#' + (index + 1)
  }

  return {
    // state
    performance,
    loadingPerformance,
    errorPerformance,
    // getters
    maxScore,
    totalScore,
    averageScore,
    bestSales,
    totalActivePercentage,
    totalInactivePercentage,
    // actions
    fetchPerformance,
    // helpers
    scoreBadge,
    medal,
  }
})