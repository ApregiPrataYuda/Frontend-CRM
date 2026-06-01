import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { masterEmployeServices } from '@/services/employeServices'

export const useEmployeStore = defineStore('employe', () => {
  const employeData = ref([])
  const loadingEmploye = ref(false)
  const searchEmploye = ref('')
  let searchTimeout = null

  const savingEmploye = ref(false)
  const updatingEmploye = ref(false)
  const deletingEmploye = ref(false)
  const errorEmploye = ref(null)

  const employeDetail = ref(null)
  const loadingDetail = ref(false)

  const pagination = reactive({
    current_page: 1,
    per_page: 10,
    prev_page_url: null,
    next_page_url: null,
    last_page: 1,
    total: 0,
  })

  const sort = reactive({
    column: 'created_at',
    direction: 'desc',
  })

  const allowedSortColumns = ['nik', 'created_at']

  // ── BUILD URL ──
  const buildUrl = () => {
    const params = new URLSearchParams()
    if (searchEmploye.value) params.append('search', searchEmploye.value)
    if (pagination.current_page) params.append('page', pagination.current_page)
    if (pagination.per_page) params.append('per_page', pagination.per_page)
    if (sort.column) {
      params.append('sort_by', sort.column)
      params.append('sort_dir', sort.direction)
    }
    return `/employee-management?${params.toString()}`
  }

  // ── FETCH ──
  const fetchEmploye = async (url = null) => {
    loadingEmploye.value = true
    try {
      const finalUrl = url || buildUrl()
      const response = await masterEmployeServices.getByUrl(finalUrl)
      const result = response.data

      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      employeData.value.splice(0, employeData.value.length, ...dataArray)

      const pag = result.pagination ?? result.data?.pagination
      if (pag) {
        pagination.current_page = pag.current_page
        pagination.per_page     = pag.per_page
        pagination.prev_page_url = pag.prev_page_url
        pagination.next_page_url = pag.next_page_url
        pagination.last_page    = pag.last_page
        pagination.total        = pag.total
      }
    } catch (error) {
      console.error('Gagal fetch employee:', error)
    } finally {
      loadingEmploye.value = false
    }
  }

  // ── SEARCH WITH DELAY ──
  const searchWithDelay = (val) => {
    clearTimeout(searchTimeout)
    searchEmploye.value = val
    pagination.current_page = 1
    searchTimeout = setTimeout(() => {
      fetchEmploye(buildUrl())
    }, 500)
  }

  // ── CHANGE PAGE SIZE ──
  const changePageSize = () => {
    pagination.current_page = 1
    fetchEmploye(buildUrl())
  }

  // ── SORTING ──
  const changeSorting = () => {
    pagination.current_page = 1
    fetchEmploye(buildUrl())
  }

  const toggleSort = (col) => {
    if (!allowedSortColumns.includes(col)) return
    if (sort.column === col) {
      sort.direction = sort.direction === 'asc' ? 'desc' : 'asc'
    } else {
      sort.column = col
      sort.direction = 'asc'
    }
    changeSorting()
  }

  // ── RESET ──
  const resetFilters = () => {
    searchEmploye.value = ''
    pagination.per_page = 10
    pagination.current_page = 1
    sort.column = 'created_at'
    sort.direction = 'desc'
    fetchEmploye(buildUrl())
  }

  // ── FORMAT DATE ──
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Belum pernah diupdate'
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    })
  }

  // ── DETAIL ──
  const detailEmploye = async (id) => {
    loadingDetail.value = true
    try {
      const res = await masterEmployeServices.show(id)
      employeDetail.value = res.data.data
    } catch (err) {
      console.error('Gagal ambil detail employe:', err)
      throw err
    } finally {
      loadingDetail.value = false
    }
  }

  // ── SELECT DATA ──
  const officeSelectData = ref([])
  const fetchOfficeSelect = async () => {
    try {
      const response = await masterEmployeServices.getOffice()
      officeSelectData.value = response
    } catch (error) {
      console.error('Gagal fetch office:', error)
    }
  }

 // Di component/store
const userSelectData = ref([])

const fetchUserSelect = async () => {
  try {
    const data = await masterEmployeServices.getUsers()
    userSelectData.value = data
  } catch (error) {
    console.error('Gagal fetch users:', error)
  }
}

  // ── STATIC OPTIONS ──
  const statusGender = ref([
    { value: 'L', label: 'Male' },
    { value: 'P', label: 'Female' },
  ])

  const statusJobsEmploye = ref([
    { value: 'PERMANENT', label: 'PERMANENT' },
    { value: 'CONTRACT',  label: 'CONTRACT' },
    { value: 'INTERNSHIP', label: 'INTERNSHIP' },
  ])

  const AttendanceMode = ref([
    { value: 'OFFICE', label: 'OFFICE' },
    { value: 'FREE',   label: 'FREE' },
    { value: 'WFH',    label: 'WFH' },
    { value: 'HYBRID', label: 'HYBRID' },
  ])

  // ── STORE ──
  const storeEmploye = async (payload) => {
    savingEmploye.value = true
    errorEmploye.value = null
    try {
      const res = await masterEmployeServices.create(payload)
      await fetchEmploye(buildUrl())
      return res.data
    } catch (err) {
      if (err.response?.status === 422) {
        errorEmploye.value = err.response.data.errors
      }
      throw err
    } finally {
      savingEmploye.value = false
    }
  }

  // ── UPDATE ──
  const updateEmploye = async (id, payload) => {
    updatingEmploye.value = true
    errorEmploye.value = null
    try {
      const res = await masterEmployeServices.update(id, payload)
      await fetchEmploye(buildUrl())
      return res.data
    } catch (err) {
      if (err.response?.status === 422) {
        errorEmploye.value = err.response.data.errors
      }
      throw err
    } finally {
      updatingEmploye.value = false
    }
  }

  // ── DELETE ──
  const deleteEmploye = async (id) => {
    deletingEmploye.value = true
    try {
      await masterEmployeServices.destroy(id)
      await fetchEmploye(buildUrl())
    } catch (err) {
      throw err
    } finally {
      deletingEmploye.value = false
    }
  }


    // GET IMAGE URL — dengan fallback avatar ui-avatars
  // Dipakai di tabel dan form (mendukung null image)
  // ─────────────────────────────────────────────
  const getImageUrl = (image, fullname = 'User') => {
    if (!image || image === 'default.png') {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullname)}&background=6366f1&color=fff&size=80`
    }
    if (image.startsWith('http')) return image
    const base = import.meta.env.VITE_BASE_URL ?? 'http://127.0.0.1:8000'
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base
    return `${cleanBase}/storage/users/${image}`
  }

  return {
    // state
    employeData, loadingEmploye, searchEmploye,
    pagination, sort, errorEmploye,
    savingEmploye, updatingEmploye, deletingEmploye,
    employeDetail, loadingDetail,
    officeSelectData, userSelectData,
    statusGender, statusJobsEmploye, AttendanceMode,
    // actions
    buildUrl,
    fetchEmploye,
    searchWithDelay, changePageSize,
    changeSorting, toggleSort, resetFilters,
    formatDate,getImageUrl,
    detailEmploye,
    fetchOfficeSelect, fetchUserSelect,
    storeEmploye, updateEmploye, deleteEmploye,
  }
})