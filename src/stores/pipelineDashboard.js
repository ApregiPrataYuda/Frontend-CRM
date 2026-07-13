import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { managerDashboardServices } from '@/services/homeDashboardManagerServices'

export const usePipelineDashboardStore = defineStore('pipelineDashboard', () => {

  // ═══════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════
  const dashboard = ref({
    summary: {
      total_lead: 0,
      converted_lead: 0,
      open_lead: 0,
      conversion_rate: 0,
    },
    lead_source: [],
    customer_status: [],
    pipeline_per_sales: [],
    monthly_conversion: [],
    latest_customer: [],
  })

  const loadingPipeline = ref(false)
  const errorPipeline   = ref(null)

  // ═══════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════

  const leadSourceColors     = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#06B6D4']
  const customerStatusColors = ['#10B981', '#EF4444', '#F59E0B', '#6366F1']
  const avatarColors = [
    '#4F46E5', '#059669', '#0891B2', '#D97706',
    '#7C3AED', '#DC2626', '#0EA5E9', '#EA580C',
  ]

  const leadSourceChart = computed(() => ({
    labels: dashboard.value.lead_source.map(item => item.lead_source),
    datasets: [
      {
        data: dashboard.value.lead_source.map(item => item.total),
        backgroundColor: leadSourceColors,
        borderWidth: 0,
      },
    ],
  }))

  const customerStatusChart = computed(() => ({
    labels: dashboard.value.customer_status.map(item => item.customer_status),
    datasets: [
      {
        data: dashboard.value.customer_status.map(item => item.total),
        backgroundColor: customerStatusColors,
        borderWidth: 0,
      },
    ],
  }))

  const monthlyConversionChart = computed(() => ({
    labels: dashboard.value.monthly_conversion.map(item => item.date),
    datasets: [
      {
        label: 'Conversion',
        data: dashboard.value.monthly_conversion.map(item => item.total),
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(99,102,241,.15)',
        fill: true,
        tension: 0.35,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  }))

  // Nilai tertinggi total_customer, dipakai untuk lebar progress bar
  // per sales — dihitung sebagai getter, bukan memutasi state langsung
  const maxCustomer = computed(() => {
    return Math.max(
      ...dashboard.value.pipeline_per_sales.map(item => item.total_customer ?? 0),
      1
    )
  })

  const pipelinePerSales = computed(() => {
    return dashboard.value.pipeline_per_sales.map(item => ({
      ...item,
      percent: ((item.total_customer ?? 0) / maxCustomer.value) * 100,
    }))
  })

  const hasPipelinePerSales = computed(() => dashboard.value.pipeline_per_sales.length > 0)
  const hasLatestCustomer   = computed(() => dashboard.value.latest_customer.length > 0)

  // ═══════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════
  const fetchPipeline = async (userId) => {
    loadingPipeline.value = true
    errorPipeline.value   = null
    try {
      const response  = await managerDashboardServices.getDashboardPipeline(userId)
      dashboard.value = response.data.data ?? dashboard.value
    } catch (err) {
      console.error('Gagal fetch pipeline dashboard:', err)
      errorPipeline.value = err
    } finally {
      loadingPipeline.value = false
    }
  }

  // ═══════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════
  const formatDateTime = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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

  const customerStatusBadge = (status) => {
    switch (status) {
      case 'Active':    return 'bg-success'
      case 'Inactive':  return 'bg-secondary'
      case 'Churned':   return 'bg-danger'
      case 'On Hold':   return 'bg-warning'
      default:          return 'bg-dark'
    }
  }

  return {
    // state
    dashboard,
    loadingPipeline,
    errorPipeline,
    // getters
    leadSourceChart,
    customerStatusChart,
    monthlyConversionChart,
    pipelinePerSales,
    hasPipelinePerSales,
    hasLatestCustomer,
    // actions
    fetchPipeline,
    // helpers
    formatDateTime,
    getInitials,
    getAvatarColor,
    customerStatusBadge,
  }
})