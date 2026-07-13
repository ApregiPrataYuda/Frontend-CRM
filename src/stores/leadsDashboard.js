import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { managerDashboardServices } from '@/services/homeDashboardManagerServices'

export const useLeadsDashboardStore = defineStore('leadsDashboard', () => {

  // ═══════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════
  const dashboard = ref({
    summary: {
      total_lead: 0,
      new_lead: 0,
      converted: 0,
      open_lead: 0,
      conversion_rate: 0,
    },
    lead_source: [],
    lead_category: [],
    lead_industry: [],
    lead_per_sales: [],
    daily_trend: [],
    latest_lead: [],
  })

  const loadingLeads = ref(false)
  const errorLeads   = ref(null)

  // ═══════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════

  // Palet warna dipisah dari data supaya urutan warna tetap konsisten
  // walaupun jumlah item dari API berubah-ubah
  const sourceColors   = ['#6366F1', '#06B6D4', '#F59E0B', '#94A3B8', '#8B5CF6']
  const categoryColors = ['#EF4444', '#F59E0B', '#06B6D4', '#94A3B8', '#8B5CF6']
  const industryColors = ['#8B5CF6', '#64748B', '#10B981', '#FB923C', '#0EA5E9']

  const leadSourceChart = computed(() => ({
    labels: dashboard.value.lead_source.map(item => item.lead_source),
    datasets: [
      {
        data: dashboard.value.lead_source.map(item => item.total),
        backgroundColor: sourceColors,
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  }))

  const leadCategoryChart = computed(() => ({
    labels: dashboard.value.lead_category.map(item => item.name),
    datasets: [
      {
        data: dashboard.value.lead_category.map(item => item.total),
        backgroundColor: categoryColors,
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  }))

  const leadIndustryChart = computed(() => ({
    labels: dashboard.value.lead_industry.map(item => item.name),
    datasets: [
      {
        data: dashboard.value.lead_industry.map(item => item.total),
        backgroundColor: industryColors,
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  }))

  const dailyTrendChart = computed(() => ({
    labels: dashboard.value.daily_trend.map(item => item.date),
    datasets: [
      {
        label: 'Lead',
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

  const hasLatestLead   = computed(() => dashboard.value.latest_lead.length > 0)
  const hasLeadPerSales = computed(() => dashboard.value.lead_per_sales.length > 0)

  // Palet warna untuk avatar inisial (dipilih berdasarkan nama, jadi tiap
  // sales konsisten dapat warna yang sama tiap kali render)
  const avatarColors = [
    '#4F46E5', '#059669', '#0891B2', '#D97706',
    '#7C3AED', '#DC2626', '#0EA5E9', '#EA580C',
  ]

  // ═══════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════
  const fetchLeads = async (userId) => {
    loadingLeads.value = true
    errorLeads.value   = null
    try {
      const response  = await managerDashboardServices.getDashboardLeads(userId)
      dashboard.value = response.data.data ?? dashboard.value
    } catch (err) {
      console.error('Gagal fetch leads dashboard:', err)
      errorLeads.value = err
    } finally {
      loadingLeads.value = false
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

  const leadSourceBadge = (source) => {
    switch (source) {
      case 'Referral':      return 'badge-primary'
      case 'Website':       return 'badge-info'
      case 'Cold Call':     return 'badge-warning'
      case 'Other':         return 'badge-secondary'
      case 'Social Media':  return 'badge-purple'
      case 'Event':         return 'badge-orange'
      default:              return 'badge-dark'
    }
  }

  const leadSourceDot = (source) => {
    switch (source) {
      case 'Referral':      return 'dot-primary'
      case 'Website':       return 'dot-info'
      case 'Cold Call':     return 'dot-warning'
      case 'Other':         return 'dot-secondary'
      case 'Social Media':  return 'dot-purple'
      case 'Event':         return 'dot-orange'
      default:              return 'dot-dark'
    }
  }

  const leadCategoryDot = (name) => {
    switch (name) {
      case 'Hot Lead':   return 'dot-danger'
      case 'Warm Lead':  return 'dot-warning'
      case 'Cold Lead':  return 'dot-info'
      case 'Partner':    return 'dot-purple'
      default:           return 'dot-dark'
    }
  }

  const leadIndustryDot = (name) => {
    switch (name) {
      case 'Manufacture':  return 'dot-purple'
      case 'Retail':       return 'dot-secondary'
      case 'Technology':   return 'dot-success'
      case 'Logistics':    return 'dot-orange'
      case 'F&B':          return 'dot-info'
      case 'Healthcare':   return 'dot-danger'
      default:             return 'dot-dark'
    }
  }

  const leadStatusBadge = (status) => {
    switch (status) {
      case 'Converted':  return 'badge-success'
      case 'New':        return 'badge-primary'
      case 'Open':       return 'badge-info'
      case 'Qualified':  return 'badge-purple'
      case 'Lost':       return 'badge-danger'
      default:           return 'badge-dark'
    }
  }

  return {
    // state
    dashboard,
    loadingLeads,
    errorLeads,
    // getters
    leadSourceChart,
    leadCategoryChart,
    leadIndustryChart,
    dailyTrendChart,
    hasLatestLead,
    hasLeadPerSales,
    // actions
    fetchLeads,
    // helpers
    formatDateTime,
    getInitials,
    getAvatarColor,
    leadSourceBadge,
    leadSourceDot,
    leadCategoryDot,
    leadIndustryDot,
    leadStatusBadge,
  }
})