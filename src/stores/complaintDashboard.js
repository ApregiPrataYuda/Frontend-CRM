import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { managerDashboardServices } from '@/services/homeDashboardManagerServices'

export const useComplaintDashboardStore = defineStore('complaintDashboard', () => {

  // ═══════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════
  const dashboard = ref({
    summary: {
      total_visit: 0,
      total_complaint: 0,
      complaint_rate: 0,
    },
    daily_trend: [],
    complaint_per_sales: [],
    complaint_per_customer: [],
    complaint_percentage: [],
    latest_complaint: [],
  })

  const loadingComplaint = ref(false)
  const errorComplaint   = ref(null)

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
        label: 'Complaint',
        data: dashboard.value.daily_trend.map(item => item.total),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239,68,68,.12)',
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: '#EF4444',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
    ],
  }))

  const percentageChart = computed(() => ({
    labels: ['Complaint', 'No Complaint'],
    datasets: [
      {
        data: [
          dashboard.value.summary.complaint_rate,
          100 - dashboard.value.summary.complaint_rate,
        ],
        backgroundColor: ['#EF4444', '#10B981'],
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  }))

  const noComplaintRate = computed(() => {
    return (100 - (dashboard.value.summary.complaint_rate ?? 0)).toFixed(2)
  })

  // Persentase progress bar per customer, dihitung sebagai getter
  // (menghindari pembagian dengan 0 saat total_complaint masih kosong)
  const complaintPerCustomer = computed(() => {
    const total = dashboard.value.summary.total_complaint || 0
    return dashboard.value.complaint_per_customer.map(item => ({
      ...item,
      percent: total > 0 ? (item.total_complaint / total) * 100 : 0,
    }))
  })

  const hasDailyTrend            = computed(() => dashboard.value.daily_trend.length > 0)
  const hasComplaintPerSales     = computed(() => dashboard.value.complaint_per_sales.length > 0)
  const hasComplaintPerCustomer  = computed(() => dashboard.value.complaint_per_customer.length > 0)
  const hasLatestComplaint       = computed(() => dashboard.value.latest_complaint.length > 0)

  // ═══════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════
  const fetchComplaint = async (userId) => {
    loadingComplaint.value = true
    errorComplaint.value   = null
    try {
      const response  = await managerDashboardServices.getDashboardComplaint(userId)
      dashboard.value = response.data.data ?? dashboard.value
    } catch (err) {
      console.error('Gagal fetch complaint dashboard:', err)
      errorComplaint.value = err
    } finally {
      loadingComplaint.value = false
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
  // (mis. "complaint_handled") — diubah jadi judul yang enak dibaca
  const formatVisitResult = (status) => {
    if (!status) return '-'
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const visitResultBadge = (status) => {
    switch (status) {
      case 'complaint_handled':  return 'bg-success'
      case 'complaint_open':     return 'bg-danger'
      case 'complaint_pending':  return 'bg-warning text-dark'
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
    loadingComplaint,
    errorComplaint,
    // getters
    dailyTrendChart,
    percentageChart,
    noComplaintRate,
    complaintPerCustomer,
    hasDailyTrend,
    hasComplaintPerSales,
    hasComplaintPerCustomer,
    hasLatestComplaint,
    // actions
    fetchComplaint,
    // helpers
    formatDateTime,
    formatVisitResult,
    visitResultBadge,
    getInitials,
    getAvatarColor,
  }
})