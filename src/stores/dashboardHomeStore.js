import { defineStore } from 'pinia'
import { ref } from 'vue'
import { homeFrontendServices } from '@/services/homeFrontendServices'

export const useDashboardStore = defineStore('dashboard', () => {
  // ── STATE ──
  const loading = ref(false)

  const summary = ref({})
  const visitChart = ref({})
  const topSales = ref([])
  const conversion = ref({})
  const conversionCustomers = ref({})
  const visitStatus = ref({})
  const recentActivity = ref([])


  // ── STATE: Activity Feed ──────────────────────────────────────────────
  const activityVisits = ref([])
  const activityFollowUps = ref([])
  const loadingActivityVisits = ref(false)
  const loadingActivityFollowUps = ref(false)

  // ── ACTIONS ──
  const fetchSummary = async (month) => {
    try {
      loading.value = true
      const res = await homeFrontendServices.getSummary(month)
      summary.value = res.data.data ?? {}
      return res
    } finally {
      loading.value = false
    }
  }

  const fetchVisitChart = async (period, month) => {
    try {
      loading.value = true
      const res = await homeFrontendServices.getVisitChart(period, month)
      visitChart.value = res.data.data ?? {}
      return res
    } finally {
      loading.value = false
    }
  }

  const fetchTopSales = async (month) => {
    try {
      loading.value = true
      const res = await homeFrontendServices.getTopSales(month)
      topSales.value = res.data.data ?? []
      return res
    } finally {
      loading.value = false
    }
  }

  const fetchConversionRate = async (month) => {
    try {
      loading.value = true
      const res = await homeFrontendServices.getConversionRate(month)
      conversion.value = res.data.data ?? {}
      return res
    } finally {
      loading.value = false
    }
  }

  const fetchConversionRateCustomers = async (month) => {
    try {
      loading.value = true
      const res = await homeFrontendServices.getConversionRateCustomers(month)
      conversionCustomers.value = res.data.data ?? {}
      return res
    } finally {
      loading.value = false
    }
  }

  const fetchVisitStatus = async (dateFrom, dateTo) => {
    try {
      loading.value = true
      const res = await homeFrontendServices.getVisitStatus(dateFrom, dateTo)
      visitStatus.value = res.data.data ?? {}
      return res
    } finally {
      loading.value = false
    }
  }

  const fetchRecentActivity = async (month) => {
    try {
      loading.value = true
      const res = await homeFrontendServices.getRecentActivity(month)
      recentActivity.value = res.data.data ?? []
      return res
    } finally {
      loading.value = false
    }
  }

  const fetchAllDashboard = async (month, period = 'month') => {
    try {
      loading.value = true

      const start = `${month}-01`
      const end = new Date(
        new Date(start).getFullYear(),
        new Date(start).getMonth() + 1,
        0
      )
        .toISOString()
        .split('T')[0]

      await Promise.all([
        fetchSummary(month),
        fetchVisitChart(period, month),
        fetchTopSales(month),
        fetchConversionRate(month),
        fetchConversionRateCustomers(month),
        fetchVisitStatus(start, end),
        fetchRecentActivity(month)
      ])
    } finally {
      loading.value = false
    }
  }



  // ── ACTIONS: Activity Feed ─────────────────────────────────────────────
  const fetchActivityVisits = async (month, page = 1, append = false) => {
    loadingActivityVisits.value = true
    try {
      const response = await homeFrontendServices.getActivityVisits(month, page)
      const data = response.data.data
      activityVisits.value = append ? [...activityVisits.value, ...(data.data ?? [])] : (data.data ?? [])
      return data
    } catch (err) {
      console.error('Gagal fetch activity visits:', err)
      return null
    } finally {
      loadingActivityVisits.value = false
    }
  }

  const fetchActivityFollowUps = async (month, page = 1, append = false) => {
    loadingActivityFollowUps.value = true
    try {
      const response = await homeFrontendServices.getActivityFollowUps(month, page)
      const data = response.data.data
      activityFollowUps.value = append ? [...activityFollowUps.value, ...(data.data ?? [])] : (data.data ?? [])
      return data
    } catch (err) {
      console.error('Gagal fetch activity follow ups:', err)
      return null
    } finally {
      loadingActivityFollowUps.value = false
    }
  }

  // ── RETURN ──
  return {
    loading,
    summary,
    visitChart,
    topSales,
    conversion,
    conversionCustomers,
    visitStatus,
    recentActivity,
    fetchSummary,
    fetchVisitChart,
    fetchTopSales,
    fetchConversionRate,
    fetchConversionRateCustomers,
    fetchVisitStatus,
    fetchRecentActivity,
    fetchAllDashboard,
    // ... state yang lama
    activityVisits,
    activityFollowUps,
    loadingActivityVisits,
    loadingActivityFollowUps,

    // ... actions yang lama
    fetchActivityVisits,
    fetchActivityFollowUps,
  }
})