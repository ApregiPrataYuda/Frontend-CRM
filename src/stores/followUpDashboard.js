import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { managerDashboardServices } from '@/services/homeDashboardManagerServices'

export const useFollowUpDashboardStore = defineStore('followUpDashboard', () => {

  // ═══════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════

  const followUp = ref({
    summary: {
      total_follow_up: 0,
      pending: 0,
      done: 0,
      cancelled: 0,
      closed: 0,
      overdue: 0,
    },
    activity: [],
    result: [],
    top_sales: [],
    overdue_list: [],
    daily_trend: [],
  })

  const loadingFollowUp = ref(false)
  const errorFollowUp = ref(null)

  // ═══════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════

  const hasData = computed(() => {
    return (
      followUp.value.activity.length ||
      followUp.value.top_sales.length ||
      followUp.value.overdue_list.length
    )
  })

  const maxActivity = computed(() => {
    return Math.max(
      ...followUp.value.activity.map(item => item.total ?? 0),
      1
    )
  })

  const activity = computed(() => {
    return followUp.value.activity.map(item => ({
      ...item,
      percentage:
        ((item.total ?? 0) / maxActivity.value) * 100,
    }))
  })

  const completionRate = computed(() => {
    const total = followUp.value.summary.total_follow_up

    if (!total) return 0

    return (
      (followUp.value.summary.done / total) * 100
    ).toFixed(1)
  })

  const pendingRate = computed(() => {
    const total = followUp.value.summary.total_follow_up

    if (!total) return 0

    return (
      (followUp.value.summary.pending / total) * 100
    ).toFixed(1)
  })

  const overdueRate = computed(() => {
    const total = followUp.value.summary.total_follow_up

    if (!total) return 0

    return (
      (followUp.value.summary.overdue / total) * 100
    ).toFixed(1)
  })

  const cancelledRate = computed(() => {
    const total = followUp.value.summary.total_follow_up

    if (!total) return 0

    return (
      (followUp.value.summary.cancelled / total) * 100
    ).toFixed(1)
  })

  const closedRate = computed(() => {
    const total = followUp.value.summary.total_follow_up

    if (!total) return 0

    return (
      (followUp.value.summary.closed / total) * 100
    ).toFixed(1)
  })

  const trendCategories = computed(() => {
    return followUp.value.daily_trend.map(item => item.date)
  })

  const trendSeries = computed(() => {
    return followUp.value.daily_trend.map(item => item.total)
  })

  const bestSales = computed(() => {
    return followUp.value.top_sales[0] ?? null
  })

  // ═══════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════

  const fetchFollowUp = async (userId) => {

    loadingFollowUp.value = true
    errorFollowUp.value = null

    try {

      const response =
        await managerDashboardServices.getDashboardFollowUp(userId)

      const data = response.data.data ?? {}

      followUp.value = {
        summary: data.summary ?? followUp.value.summary,
        activity: data.activity ?? [],
        result: data.result ?? [],
        top_sales: data.top_sales ?? [],
        overdue_list: data.overdue_list ?? [],
        daily_trend: data.daily_trend ?? [],
      }

    } catch (err) {

      console.error(
        'Gagal fetch follow up dashboard:',
        err
      )

      errorFollowUp.value = err

    } finally {

      loadingFollowUp.value = false

    }

  }

  // ═══════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════

  const medal = index => {

    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'

    return '#' + (index + 1)

  }

  const statusClass = status => {

    switch (status) {

      case 'DONE':
        return 'bg-success'

      case 'PENDING':
        return 'bg-warning'

      case 'CANCELLED':
        return 'bg-danger'

      case 'CLOSED':
        return 'bg-primary'

      default:
        return 'bg-secondary'

    }

  }

  const overdueClass = days => {

    if (days >= 7)
      return 'text-danger'

    if (days >= 3)
      return 'text-warning'

    return 'text-success'

  }

  const formatDate = date => {

    return new Date(date).toLocaleDateString(
      'id-ID',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )

  }

  const formatDateTime = date => {

    return new Date(date).toLocaleString(
      'id-ID'
    )

  }

  // ═══════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════

  return {

    // state
    followUp,
    loadingFollowUp,
    errorFollowUp,

    // getters
    hasData,
    activity,
    maxActivity,
    bestSales,
    completionRate,
    pendingRate,
    overdueRate,
    cancelledRate,
    closedRate,
    trendCategories,
    trendSeries,

    // actions
    fetchFollowUp,

    // helpers
    medal,
    statusClass,
    overdueClass,
    formatDate,
    formatDateTime,

  }

})