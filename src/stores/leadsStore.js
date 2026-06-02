import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { masterLeadsServices } from '@/services/leadsServices'

export const masterLeadsStore = defineStore('leads', () => {
  const leadsData     = ref([])
  const loadingLeads  = ref(false)
  const searchLeads   = ref('')
  let   searchTimeout = null

  const savingLeads   = ref(false)
  const updatingLeads = ref(false)
  const deletingLeads = ref(false)
  const errorLeads    = ref(null)

  const leadsDetail   = ref(null)
  const loadingDetail = ref(false)

  const pagination = reactive({
    current_page  : 1,
    per_page      : 10,
    prev_page_url : null,
    next_page_url : null,
    last_page     : 1,
    total         : 0,
  })

  const sort = reactive({
    column   : 'created_at',
    direction: 'desc',
  })

  const allowedSortColumns = ['company_name', 'contact_name', 'created_at']

  // ── MODE (master | assigned) ──
  const mode = ref('master')

  // ── BUILD URL ──
  const buildUrl = () => {
    const params = new URLSearchParams()
    if (searchLeads.value)       params.append('search',   searchLeads.value)
    if (pagination.current_page) params.append('page',     pagination.current_page)
    if (pagination.per_page)     params.append('per_page', pagination.per_page)
    if (sort.column) {
      params.append('sort_by',  sort.column)
      params.append('sort_dir', sort.direction)
    }
    return `/leads-master?${params.toString()}`
  }

  // ── FETCH MASTER LEADS ──
  const fetchleads = async (url = null) => {
    loadingLeads.value = true
    try {
      const finalUrl = url || buildUrl()
      // service baru: api.get() → response (bukan response.data)
      // jadi result ada di response.data
      const response = await masterLeadsServices.getByUrl(finalUrl)
      const result   = response.data

      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      leadsData.value.splice(0, leadsData.value.length, ...dataArray)

      const pag = result.pagination ?? result.data?.pagination
      if (pag) {
        pagination.current_page  = pag.current_page
        pagination.per_page      = pag.per_page
        pagination.prev_page_url = pag.prev_page_url
        pagination.next_page_url = pag.next_page_url
        pagination.last_page     = pag.last_page
        pagination.total         = pag.total
      }
    } catch (error) {
      console.error('Gagal fetch leads:', error)
    } finally {
      loadingLeads.value = false
    }
  }

  // ── FETCH ASSIGNED TO ME ──
  const fetchAssignedLeads = async (url = null) => {
    loadingLeads.value = true
    try {
      const baseUrl = `/leads-assigned-to-me`
      const params  = new URLSearchParams()
      if (searchLeads.value)       params.append('search',   searchLeads.value)
      if (pagination.current_page) params.append('page',     pagination.current_page)
      if (pagination.per_page)     params.append('per_page', pagination.per_page)

      const finalUrl = url || `${baseUrl}?${params.toString()}`
      const response = await masterLeadsServices.getByUrl(finalUrl)
      const result   = response.data

      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      leadsData.value.splice(0, leadsData.value.length, ...dataArray)

      const pag = result.pagination ?? result.data?.pagination
      if (pag) {
        pagination.current_page  = pag.current_page
        pagination.per_page      = pag.per_page
        pagination.prev_page_url = pag.prev_page_url
        pagination.next_page_url = pag.next_page_url
        pagination.last_page     = pag.last_page
        pagination.total         = pag.total
      }
    } catch (error) {
      console.error('Gagal fetch assigned leads:', error)
    } finally {
      loadingLeads.value = false
    }
  }

  // ── SWITCH MODE ──
  const switchMode = (newMode) => {
    mode.value              = newMode
    pagination.current_page = 1
    searchLeads.value       = ''
    if (newMode === 'master') {
      fetchleads(buildUrl())
    } else {
      fetchAssignedLeads()
    }
  }

  // ── DETAIL ──
  const detailLeads = async (id) => {
    loadingDetail.value = true
    try {
      const res = await masterLeadsServices.show(id)
      // service baru: res = response → data di res.data.data
      leadsDetail.value = res.data.data
    } catch (err) {
      console.error('Gagal ambil detail leads:', err)
      throw err
    } finally {
      loadingDetail.value = false
    }
  }

  // ── STORE ──
  const storeLeads = async (payload) => {
    savingLeads.value = true
    errorLeads.value  = null
    try {
      await masterLeadsServices.create(payload)
      await fetchleads(buildUrl())
    } catch (err) {
      if (err.response?.status === 422) {
        errorLeads.value = err.response.data.errors
      }
      throw err
    } finally {
      savingLeads.value = false
    }
  }

  // ── STORE BULK ──
  const storeBulkLeads = async (payload) => {
    savingLeads.value = true
    errorLeads.value  = null
    try {
      await masterLeadsServices.createBulks({ leads: payload })
      await fetchleads(buildUrl())
    } catch (err) {
      if (err.response?.status === 422) {
        errorLeads.value = err.response.data.errors
      }
      throw err
    } finally {
      savingLeads.value = false
    }
  }

  // ── UPDATE ──
  const updateLeads = async (id, payload) => {
    updatingLeads.value = true
    errorLeads.value    = null
    try {
      await masterLeadsServices.update(id, payload)
      await fetchleads(buildUrl())
    } catch (err) {
      if (err.response?.status === 422) {
        errorLeads.value = err.response.data.errors
      }
      throw err
    } finally {
      updatingLeads.value = false
    }
  }

  // ── DELETE ──
  const deleteLeads = async (id) => {
    deletingLeads.value = true
    try {
      await masterLeadsServices.destroy(id)
      await fetchleads(buildUrl())
    } catch (err) {
      throw err
    } finally {
      deletingLeads.value = false
    }
  }

  // ── SEARCH WITH DELAY ──
  const searchWithDelay = (val) => {
    clearTimeout(searchTimeout)
    searchLeads.value       = val
    pagination.current_page = 1
    searchTimeout = setTimeout(() => {
      if (mode.value === 'master') {
        fetchleads(buildUrl())
      } else {
        fetchAssignedLeads()
      }
    }, 500)
  }

  const changePageSize = () => {
    pagination.current_page = 1
    if (mode.value === 'master') fetchleads(buildUrl())
    else fetchAssignedLeads()
  }

  const changeSorting = () => {
    pagination.current_page = 1
    fetchleads(buildUrl())
  }

  const toggleSort = (col) => {
    if (!allowedSortColumns.includes(col)) return
    if (sort.column === col) {
      sort.direction = sort.direction === 'asc' ? 'desc' : 'asc'
    } else {
      sort.column    = col
      sort.direction = 'asc'
    }
    changeSorting()
  }

  const resetFilters = () => {
    searchLeads.value       = ''
    pagination.per_page     = 10
    pagination.current_page = 1
    sort.column             = 'created_at'
    sort.direction          = 'desc'
    mode.value              = 'master'
    fetchleads(buildUrl())
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('id-ID', {
      year : 'numeric',
      month: 'long',
      day  : '2-digit',
    })
  }

  // ── STATUS CONFIG ──
  const leadStatusConfig = {
    New                   : { label: 'bg-primary',   icon: 'fa-solid fa-circle-plus'  },
    Customer              : { label: 'bg-success',   icon: 'fa-solid fa-circle-check' },
    Failed                : { label: 'bg-danger',    icon: 'fa-solid fa-circle-xmark' },
    Prospective_Customers : { label: 'bg-info',      icon: 'fa-solid fa-user-plus'    },
    Consideration_Stage   : { label: 'bg-warning',   icon: 'fa-solid fa-clock'        },
    Potential_Customers   : { label: 'bg-secondary', icon: 'fa-solid fa-star'         },
    Partner               : { label: 'bg-dark',      icon: 'fa-solid fa-handshake'    },
    Converted             : { label: 'bg-success',   icon: 'fa-solid fa-check-double' },
  }

  // Mengembalikan class Bootstrap badge + icon
  const getStatusConfig = (status) => {
    return leadStatusConfig[status] ?? { label: 'bg-secondary', icon: 'fa-solid fa-tag' }
  }

  const leadSourceOptions = [
    { value: 'Website',      label: 'Website'      },
    { value: 'Cold Call',    label: 'Cold Call'    },
    { value: 'Referral',     label: 'Referral'     },
    { value: 'Social Media', label: 'Social Media' },
    { value: 'Email',        label: 'Email'        },
    { value: 'Event',        label: 'Event'        },
    { value: 'Other',        label: 'Other'        },
  ]

  // ── SELECT: INDUSTRY ──
  const industrySelectData = ref([])
  const fetchIndustrySelect = async () => {
    try {
      // service baru: getIndustry() return response (axios response object)
      const response = await masterLeadsServices.getIndustry()
      // data industry ada di response.data
      industrySelectData.value = response.data
    } catch (error) {
      console.error('Gagal fetch industry:', error)
    }
  }

  // ── SELECT: CATEGORY ──
  const categorySelectData = ref([])
  const fetchCategorySelect = async () => {
    try {
      const response = await masterLeadsServices.getCategory()
      categorySelectData.value = response.data
    } catch (error) {
      console.error('Gagal fetch category:', error)
    }
  }

  return {
    // state
    leadsData, loadingLeads, searchLeads,
    pagination, sort, mode,
    savingLeads, updatingLeads, deletingLeads, errorLeads,
    leadsDetail, loadingDetail,
    industrySelectData, categorySelectData,

    // actions
    buildUrl,
    fetchleads, fetchAssignedLeads, switchMode,
    detailLeads,
    storeLeads, storeBulkLeads, updateLeads, deleteLeads,
    searchWithDelay, changePageSize, changeSorting, toggleSort, resetFilters,
    fetchIndustrySelect, fetchCategorySelect,

    // helpers
    formatDate, getStatusConfig, leadSourceOptions,
  }
})