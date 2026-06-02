import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { masterLeadsServices } from '@/services/leadsServices'

export const leadAssignStore = defineStore('leadAssign', () => {

  const leadsData     = ref([])
  const loadingLeads  = ref(false)
  const searchLeads   = ref('')
  const assigningLead = ref(false)
  const savingLead    = ref(false)
  const errorAssign   = ref(null)
  const errorForm     = ref(null)
  let   searchTimeout = null

  const salesSelectData    = ref([])
  const industrySelectData = ref([])
  const categorySelectData = ref([])
  const loadingSales       = ref(false)

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

  // ── FETCH LEADS ──
  const fetchLeads = async (url = null) => {
    loadingLeads.value = true
    try {
      // service baru return axios response langsung → data di res.data
      const res    = await masterLeadsServices.getByUrl(url || buildUrl())
      const result = res.data
      const data   = Array.isArray(result.data) ? result.data : result.data?.data ?? []
      leadsData.value.splice(0, leadsData.value.length, ...data)

      const pag = result.pagination ?? result.data?.pagination
      if (pag) {
        pagination.current_page  = pag.current_page
        pagination.per_page      = pag.per_page
        pagination.prev_page_url = pag.prev_page_url
        pagination.next_page_url = pag.next_page_url
        pagination.last_page     = pag.last_page
        pagination.total         = pag.total
      }
    } catch (err) {
      console.error('Gagal fetch leads assign:', err)
    } finally {
      loadingLeads.value = false
    }
  }

  // ── FETCH SELECTS ──
  const fetchSalesSelect = async () => {
    loadingSales.value = true
    try {
      // service baru: getSales() return axios response → data di res.data
      const res = await masterLeadsServices.getSales()
      salesSelectData.value = res.data
    } catch (err) {
      console.error('Gagal fetch sales:', err)
    } finally {
      loadingSales.value = false
    }
  }

  const fetchIndustrySelect = async () => {
    try {
      const res = await masterLeadsServices.getIndustry()
      industrySelectData.value = res.data
    } catch (err) {
      console.error('Gagal fetch industry:', err)
    }
  }

  const fetchCategorySelect = async () => {
    try {
      const res = await masterLeadsServices.getCategory()
      categorySelectData.value = res.data
    } catch (err) {
      console.error('Gagal fetch category:', err)
    }
  }

  // ── STORE LEAD WITH ASSIGN ──
  const storeLeadWithAssign = async (payload) => {
    savingLead.value = true
    errorForm.value  = null
    try {
      await masterLeadsServices.create(payload)
      await fetchLeads(buildUrl())
    } catch (err) {
      if (err.response?.status === 422) {
        errorForm.value = err.response.data.errors
      }
      throw err
    } finally {
      savingLead.value = false
    }
  }

  // ── ASSIGN ──
  const assignLead = async (id, payload) => {
    assigningLead.value = true
    errorAssign.value   = null
    try {
      await masterLeadsServices.update(id, payload)
      await fetchLeads(buildUrl())
    } catch (err) {
      if (err.response?.status === 422) {
        errorAssign.value = err.response.data.errors
      }
      throw err
    } finally {
      assigningLead.value = false
    }
  }

  // ── UNASSIGN ──
  const unassignLead = async (id) => {
    assigningLead.value = true
    try {
      await masterLeadsServices.update(id, {
        assigned_to     : null,
        visibility_type : 'PRIVATE',
      })
      await fetchLeads(buildUrl())
    } catch (err) {
      throw err
    } finally {
      assigningLead.value = false
    }
  }

  // ── DELETE ──
  const deleteLead = async (id) => {
    assigningLead.value = true
    try {
      await masterLeadsServices.destroy(id)
      await fetchLeads(buildUrl())
    } catch (err) {
      throw err
    } finally {
      assigningLead.value = false
    }
  }

  // ── UPDATE ──
  const updateLead = async (id, payload) => {
    savingLead.value = true
    errorForm.value  = null
    try {
      await masterLeadsServices.update(id, payload)
      await fetchLeads(buildUrl())
    } catch (err) {
      if (err.response?.status === 422) {
        errorForm.value = err.response.data.errors
      }
      throw err
    } finally {
      savingLead.value = false
    }
  }

  const searchWithDelay = (val) => {
    clearTimeout(searchTimeout)
    searchLeads.value       = val
    pagination.current_page = 1
    searchTimeout = setTimeout(() => fetchLeads(buildUrl()), 500)
  }

  const changePageSize = () => {
    pagination.current_page = 1
    fetchLeads(buildUrl())
  }

  const toggleSort = (col) => {
    if (sort.column === col) {
      sort.direction = sort.direction === 'asc' ? 'desc' : 'asc'
    } else {
      sort.column    = col
      sort.direction = 'asc'
    }
    pagination.current_page = 1
    fetchLeads(buildUrl())
  }

  const resetFilters = () => {
    searchLeads.value       = ''
    pagination.per_page     = 10
    pagination.current_page = 1
    sort.column             = 'created_at'
    sort.direction          = 'desc'
    fetchLeads(buildUrl())
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (isNaN(date)) return '-'
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: '2-digit' })
  }

  // Bootstrap badge class
  const getStatusConfig = (status) => {
    const map = {
      New                   : { label: 'bg-primary',   icon: 'fa-solid fa-circle-plus'  },
      Customer              : { label: 'bg-success',   icon: 'fa-solid fa-circle-check' },
      Failed                : { label: 'bg-danger',    icon: 'fa-solid fa-circle-xmark' },
      Prospective_Customers : { label: 'bg-info',      icon: 'fa-solid fa-user-plus'    },
      Consideration_Stage   : { label: 'bg-warning',   icon: 'fa-solid fa-clock'        },
      Potential_Customers   : { label: 'bg-secondary', icon: 'fa-solid fa-star'         },
      Partner               : { label: 'bg-dark',      icon: 'fa-solid fa-handshake'    },
      Converted             : { label: 'bg-success',   icon: 'fa-solid fa-check-double' },
    }
    return map[status] ?? { label: 'bg-secondary', icon: 'fa-solid fa-tag' }
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

  return {
    leadsData, loadingLeads, searchLeads,
    pagination, sort,
    assigningLead, savingLead, errorAssign, errorForm,
    salesSelectData, industrySelectData, categorySelectData, loadingSales,
    buildUrl, fetchLeads,
    fetchSalesSelect, fetchIndustrySelect, fetchCategorySelect,
    storeLeadWithAssign, assignLead, unassignLead, deleteLead, updateLead,
    searchWithDelay, changePageSize, toggleSort, resetFilters,
    formatDate, getStatusConfig, leadSourceOptions,
  }
})