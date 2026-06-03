import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { visitsSalesServices } from '@/services/salesVisitServices'

export const useLeadsVisitStore = defineStore('leadsVisitStore', () => {

  // =====================
  // STATE
  // =====================
  const leadsData = ref([])
  const loadingLeads = ref(false)
  const searchLeads = ref('')
  const errorLeads = ref(null)

  const leadsDetail = ref(null)
  const loadingDetail = ref(false)

  let searchTimeout = null
  const activeLeadPhase = ref(null) // null | 'visiting' | 'checked_in'

  // =====================
  // PAGINATION
  // =====================
  const pagination = reactive({
    current_page: 1,
    per_page: 10,
    prev_page_url: null,
    next_page_url: null,
    last_page: 1,
    total: 0,
  })

  // =====================
  // SORT
  // =====================
  const sort = reactive({
    column: 'created_at',
    direction: 'desc',
  })

  const allowedSortColumns = ['company_name', 'created_at']

  // =====================
  // BUILD URL
  // =====================
  const buildUrl = () => {
    const params = new URLSearchParams()

    if (searchLeads.value) params.append('search', searchLeads.value)
    params.append('page', pagination.current_page)
    params.append('per_page', pagination.per_page)

    params.append('sort_by', sort.column)
    params.append('sort_dir', sort.direction)

    return `/data-leads-visit?${params.toString()}`
  }

  // =====================
  // FETCH DATA
  // =====================
  const fetchLeadsVisit = async (url = null) => {
    loadingLeads.value = true
    try {
      const finalUrl = url || buildUrl()
      const response = await visitsSalesServices.getByUrl(finalUrl)
      const result = response.data

      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      leadsData.value.splice(0, leadsData.value.length, ...dataArray)

      const pag = result.pagination ?? result.data?.pagination

      if (pag) {
        pagination.current_page = pag.current_page
        pagination.per_page = pag.per_page
        pagination.prev_page_url = pag.prev_page_url
        pagination.next_page_url = pag.next_page_url
        pagination.last_page = pag.last_page
        pagination.total = pag.total
      }

    } catch (err) {
      console.error('Failed fetch leads visit:', err)
      errorLeads.value = err
    } finally {
      loadingLeads.value = false
    }
  }

  // =====================
  // SEARCH (DEBOUNCE)
  // =====================
  const searchLeadsWithDelay = (val) => {
    clearTimeout(searchTimeout)
    searchLeads.value = val
    pagination.current_page = 1

    searchTimeout = setTimeout(() => {
      fetchLeadsVisit()
    }, 500)
  }

  // =====================
  // PAGE SIZE
  // =====================
  const changePageSize = () => {
    pagination.current_page = 1
    fetchLeadsVisit()
  }

  // =====================
  // SORT
  // =====================
  const toggleSort = (col) => {
    if (!allowedSortColumns.includes(col)) return

    if (sort.column === col) {
      sort.direction = sort.direction === 'asc' ? 'desc' : 'asc'
    } else {
      sort.column = col
      sort.direction = 'asc'
    }

    pagination.current_page = 1
    fetchLeadsVisit()
  }

  // =====================
  // RESET
  // =====================
  const resetFilters = () => {
    searchLeads.value = ''
    pagination.current_page = 1
    pagination.per_page = 10
    sort.column = 'created_at'
    sort.direction = 'desc'

    fetchLeadsVisit()
  }

  // =====================
  // FORMAT DATE
  // =====================
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'

    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'

    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    })
  }

  // =====================
  // RETURN
  // =====================
  return {
    // state
    leadsData,
    loadingLeads,
    searchLeads,
    pagination,
    sort,
    errorLeads,
    leadsDetail,
    loadingDetail,
    activeLeadPhase,

    // actions
    fetchLeadsVisit,
    buildUrl,
    searchLeadsWithDelay,
    changePageSize,
    toggleSort,
    resetFilters,
    formatDate,
  }
})