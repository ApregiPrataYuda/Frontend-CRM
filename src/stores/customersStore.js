import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { customersServices } from '@/services/customersServices'

export const useCustomersStore = defineStore('customers', () => {

  // ── STATE ──────────────────────────────────────────
  const customersData     = ref([])
  const loadingCustomers  = ref(false)
  const searchCustomers   = ref('')
  let   searchTimeout     = null

  const savingCustomers   = ref(false)
  const updatingCustomers = ref(false)
  const deletingCustomers = ref(false)
  const errorCustomers    = ref(null)

  const customersDetail   = ref(null)
  const loadingDetail     = ref(false)

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

  const allowedSortColumns = ['company_name', 'created_at']


  // ── BUILD URL ──────────────────────────────────────
  const buildUrl = () => {
    const params = new URLSearchParams()
    if (searchCustomers.value)   params.append('search',   searchCustomers.value)
    if (pagination.current_page) params.append('page',     pagination.current_page)
    if (pagination.per_page)     params.append('per_page', pagination.per_page)
    if (sort.column) {
      params.append('sort_by',  sort.column)
      params.append('sort_dir', sort.direction)
    }
    return `/customers-masters?${params.toString()}`
  }


  // ── FETCH LIST ────────────────────────────────────
  const fetchCustomers = async (url = null) => {
    loadingCustomers.value = true
    try {
      const finalUrl  = url || buildUrl()
      const response  = await customersServices.getByUrl(finalUrl)
      const result    = response.data

      // Support dua struktur: result.data (array) atau result.data.data (nested)
      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      customersData.value.splice(0, customersData.value.length, ...dataArray)

      // Support dua posisi pagination: result.pagination atau result.data.pagination
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
      console.error('Gagal fetch customers:', error)
    } finally {
      loadingCustomers.value = false
    }
  }


  // ── DETAIL ────────────────────────────────────────
  const detailCustomer = async (id) => {
    loadingDetail.value = true
    try {
      const res = await customersServices.show(id)
      customersDetail.value = res.data.data
    } catch (err) {
      console.error('Gagal fetch detail customer:', err)
      throw err
    } finally {
      loadingDetail.value = false
    }
  }


  // ── CREATE ────────────────────────────────────────
  const saveCustomer = async (payload) => {
    savingCustomers.value = true
    errorCustomers.value  = null
    try {
      const res = await customersServices.create(payload)
      await fetchCustomers(buildUrl())
      return res
    } catch (err) {
      if (err.response?.status === 422) {
        errorCustomers.value = err.response.data.errors
      }
      throw err
    } finally {
      savingCustomers.value = false
    }
  }


  // ── UPDATE ────────────────────────────────────────
  const updateCustomer = async (id, payload) => {
    updatingCustomers.value = true
    errorCustomers.value    = null
    try {
      const res = await customersServices.update(id, payload)
      await fetchCustomers(buildUrl())
      return res
    } catch (err) {
      if (err.response?.status === 422) {
        errorCustomers.value = err.response.data.errors
      }
      throw err
    } finally {
      updatingCustomers.value = false
    }
  }


  // ── DELETE ────────────────────────────────────────
  const deleteCustomer = async (id) => {
    deletingCustomers.value = true
    try {
      await customersServices.destroy(id)
      await fetchCustomers(buildUrl())
    } catch (err) {
      throw err
    } finally {
      deletingCustomers.value = false
    }
  }


  // ── SEARCH WITH DEBOUNCE ─────────────────────────
  const searchWithDelay = (val) => {
    clearTimeout(searchTimeout)
    searchCustomers.value   = val
    pagination.current_page = 1
    searchTimeout = setTimeout(() => fetchCustomers(buildUrl()), 500)
  }

  const changePageSize = () => {
    pagination.current_page = 1
    fetchCustomers(buildUrl())
  }

  const changeSorting = () => {
    pagination.current_page = 1
    fetchCustomers(buildUrl())
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
    searchCustomers.value   = ''
    pagination.per_page     = 10
    pagination.current_page = 1
    sort.column             = 'created_at'
    sort.direction          = 'desc'
    fetchCustomers(buildUrl())
  }


  // ── FORMAT DATE ───────────────────────────────────
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


  // ── STATUS CONFIG ─────────────────────────────────
  // Gabungan: versi view (untuk CoreUI/Bootstrap) + class Tailwind disimpan di bg
  const getStatusConfig = (status) => {
    const map = {
      Active    : { bg: 'bg-emerald-100 text-emerald-600', label: 'bg-success', icon: 'fa-solid fa-circle-check'  },
      Inactive  : { bg: 'bg-red-100 text-red-500',         label: 'bg-danger',  icon: 'fa-solid fa-circle-xmark'  },
      Dormant   : { bg: 'bg-amber-100 text-amber-600',     label: 'bg-warning', icon: 'fa-solid fa-moon'           },
      Lost      : { bg: 'bg-slate-100 text-slate-500',     label: 'bg-secondary',icon: 'fa-solid fa-xmark'         },
      Blacklist : { bg: 'bg-gray-200 text-gray-700',       label: 'bg-dark',    icon: 'fa-solid fa-ban'            },
      Prospect  : { bg: 'bg-blue-100 text-blue-600',       label: 'bg-info',    icon: 'fa-solid fa-clock'          },
    }
    return map[status] ?? { bg: 'bg-slate-100 text-slate-500', label: 'bg-secondary', icon: 'fa-solid fa-tag' }
  }


  // ── STATIC OPTIONS ────────────────────────────────
  const leadSourceOptions = [
    { value: 'Website',      label: 'Website'      },
    { value: 'Cold Call',    label: 'Cold Call'    },
    { value: 'Referral',     label: 'Referral'     },
    { value: 'Social Media', label: 'Social Media' },
    { value: 'Email',        label: 'Email'        },
    { value: 'Event',        label: 'Event'        },
    { value: 'Other',        label: 'Other'        },
  ]

  const statusStatis = ref([
    { value: 'Active',    label: 'Active'    },
    { value: 'Inactive',  label: 'Inactive'  },
    { value: 'Dormant',   label: 'Dormant'   },
    { value: 'Lost',      label: 'Lost'      },
    { value: 'Blacklist', label: 'Blacklist' },
  ])


  // ── SELECT: INDUSTRY ─────────────────────────────
  const industrySelectData  = ref([])

  const fetchIndustrySelect = async () => {
    try {
      // service sudah return response.data langsung
      const data = await customersServices.getIndustry()
      industrySelectData.value = data
    } catch (error) {
      console.error('Gagal fetch industry:', error)
    }
  }


  // ── SELECT: CATEGORY ─────────────────────────────
  const categorySelectData  = ref([])

  const fetchCategorySelect = async () => {
    try {
      // service sudah return response.data langsung
      const data = await customersServices.getCategory()
      categorySelectData.value = data
    } catch (error) {
      console.error('Gagal fetch category:', error)
    }
  }


  // ── RETURN ────────────────────────────────────────
  return {
    // state
    customersData, loadingCustomers, searchCustomers,
    pagination, sort,
    savingCustomers, updatingCustomers, deletingCustomers, errorCustomers,
    customersDetail, loadingDetail,
    industrySelectData, categorySelectData,
    leadSourceOptions, statusStatis,

    // actions
    buildUrl,
    fetchCustomers,
    detailCustomer,
    saveCustomer,
    updateCustomer,
    deleteCustomer,
    searchWithDelay,
    changePageSize,
    changeSorting,
    toggleSort,
    resetFilters,
    fetchIndustrySelect,
    fetchCategorySelect,

    // helpers
    formatDate,
    getStatusConfig,
  }
})