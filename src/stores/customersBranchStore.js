import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { customerBranchApprovalServices } from '@/services/customerBranchApprovalServices'

export const useCustomersBranchApprovalStore = defineStore('branchApproval', () => {

  // ── STATE ──────────────────────────────────────────
  const branchesData     = ref([])
  const loadingBranches  = ref(false)
  const searchBranches   = ref('')
  let   searchTimeout    = null

  const approvingBranch  = ref(false)
  const rejectingBranch  = ref(false)
  const errorBranch      = ref(null)

  const approvalStatus   = ref('all') // all | pending | approved | rejected

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

  const allowedSortColumns = ['branch_name', 'company_name', 'created_at']


  // ── BUILD URL ──────────────────────────────────────
  const buildUrl = () => {
    const params = new URLSearchParams()
    if (searchBranches.value)    params.append('search',          searchBranches.value)
    if (pagination.current_page) params.append('page',            pagination.current_page)
    if (pagination.per_page)     params.append('per_page',        pagination.per_page)
    if (approvalStatus.value)    params.append('approval_status', approvalStatus.value)
    if (sort.column) {
      params.append('sort_by',  sort.column)
      params.append('sort_dir', sort.direction)
    }
    return `/customer-branch-approval?${params.toString()}`
  }


  // ── FETCH LIST ────────────────────────────────────
  const fetchBranches = async (url = null) => {
    loadingBranches.value = true
    try {
      const finalUrl = url || buildUrl()
      const response = await customerBranchApprovalServices.getByUrl(finalUrl)
      const result   = response.data

      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      branchesData.value.splice(0, branchesData.value.length, ...dataArray)

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
      console.error('Gagal fetch branch approval:', error)
    } finally {
      loadingBranches.value = false
    }
  }


  // ── APPROVE ───────────────────────────────────────
  const approveBranch = async (id) => {
    approvingBranch.value = true
    errorBranch.value     = null
    try {
      const res = await customerBranchApprovalServices.approveBranch(id)
      await fetchBranches(buildUrl())
      return res
    } catch (err) {
      throw err
    } finally {
      approvingBranch.value = false
    }
  }


  // ── REJECT ────────────────────────────────────────
  const rejectBranch = async (id, note) => {
    rejectingBranch.value = true
    errorBranch.value     = null
    try {
      const res = await customerBranchApprovalServices.rejectBranch(id, { approval_note: note })
      await fetchBranches(buildUrl())
      return res
    } catch (err) {
      if (err.response?.status === 422) {
        errorBranch.value = err.response.data.errors
      }
      throw err
    } finally {
      rejectingBranch.value = false
    }
  }


  // ── SEARCH WITH DEBOUNCE ─────────────────────────
  const searchWithDelay = (val) => {
    clearTimeout(searchTimeout)
    searchBranches.value    = val
    pagination.current_page = 1
    searchTimeout = setTimeout(() => fetchBranches(buildUrl()), 500)
  }

  const changePageSize = () => {
    pagination.current_page = 1
    fetchBranches(buildUrl())
  }

  const changeSorting = () => {
    pagination.current_page = 1
    fetchBranches(buildUrl())
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

  const changeApprovalStatus = (status) => {
    approvalStatus.value    = status
    pagination.current_page = 1
    fetchBranches(buildUrl())
  }

  const resetFilters = () => {
    searchBranches.value    = ''
    approvalStatus.value    = 'all'
    pagination.per_page     = 10
    pagination.current_page = 1
    sort.column              = 'created_at'
    sort.direction           = 'desc'
    fetchBranches(buildUrl())
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


  // ── STATUS CONFIG (samakan dengan customersStore) ──
  const getStatusConfig = (status) => {
    const map = {
      Active   : { label: 'bg-success' },
      Inactive : { label: 'bg-danger' },
    }
    return map[status] ?? { label: 'bg-secondary' }
  }

  const getApprovalConfig = (status) => {
    const map = {
      pending : { label: 'bg-warning', text: 'Pending' },
      rejected: { label: 'bg-danger',  text: 'Rejected' },
      approved: { label: 'bg-success', text: 'Approved' },
    }
    return map[status] ?? { label: 'bg-secondary', text: status }
  }


  // ── RETURN ────────────────────────────────────────
  return {
    // state
    branchesData, loadingBranches, searchBranches,
    pagination, sort, approvalStatus,
    approvingBranch, rejectingBranch, errorBranch,

    // actions
    buildUrl,
    fetchBranches,
    approveBranch,
    rejectBranch,
    searchWithDelay,
    changePageSize,
    changeSorting,
    toggleSort,
    changeApprovalStatus,
    resetFilters,

    // helpers
    formatDate,
    getStatusConfig,
    getApprovalConfig,
  }
})