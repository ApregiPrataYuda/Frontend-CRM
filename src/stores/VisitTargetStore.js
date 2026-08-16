import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { visitTargetServices } from '@/services/visitTargetServices'

function defaultMonth() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}` // format buat <input type="month">
}

export const useVisitTargetStore = defineStore('visitTarget', () => {

  // ── PERIODE (bulan aktif, format 'YYYY-MM' dari <input type="month">) ──
  const periodMonth = ref(defaultMonth())
  // dikirim ke backend selalu sebagai tanggal 1 di bulan itu, misal '2026-08-01'
  const periodMonthParam = computed(() => `${periodMonth.value}-01`)

  // ── SUMMARY (4 stat tile) ──
  // CATATAN: backend belum punya endpoint /summary khusus buat visit-targets
  // (beda dari Sales Activity Dashboard yang punya endpoint summary terpisah).
  // Jadi summary di sini dihitung dari endpoint list yang sama
  // (/manager/visit-targets), TANPA filter search/status, per_page=100 (batas
  // maksimal dari VisitTargetValidationIndex). Ini cukup buat kondisi normal
  // (jumlah target per bulan biasanya jauh di bawah 100), TAPI kalau nanti satu
  // bulan bisa punya >100 target sekaligus, angka summary ini jadi nggak akurat
  // -- di titik itu sebaiknya backend ditambah endpoint summary khusus yang
  // hitung pakai SQL aggregate (COUNT/AVG), bukan ngambil semua baris ke FE.
  const summary = reactive({
    total_targets: 0,
    unique_sales: 0,
    achieved_count: 0,
    avg_percentage: 0,
  })
  const loadingSummary = ref(false)

  // ── LIST (tabel, sudah difilter/sort/paginate) ──
  const targetsData = ref([])
  const loadingList = ref(false)
  const errorList = ref(null)

  const searchQuery = ref('')
  let searchTimeout = null

  const statusFilter = ref('all')
  const statusOptions = ref([
    { value: 'all',          label: 'Semua Status' },
    { value: 'achieved',     label: 'Tercapai' },
    { value: 'not_achieved', label: 'Belum Tercapai' },
  ])

  // opsional -- belum ada dropdown-nya di desain, tapi backend sudah support
  // filter sales_id, jadi disiapkan aja di store buat dipakai kalau nanti
  // mau ditambah dropdown "Filter per Sales".
  const salesIdFilter = ref(null)

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
  const allowedSortColumns = ['created_at', 'target_count', 'achieved_count', 'sales_name']
  const sortOptions = ref([
    { value: 'created_at',     label: 'Terbaru' },
    { value: 'achieved_count', label: 'Progress' },
    { value: 'sales_name',     label: 'Nama Sales' },
    { value: 'target_count',   label: 'Jumlah Target' },
  ])

  // ── LOADING STATE FORM (create/update/delete) ──
  const submitting = ref(false)
  const deleting = ref(false)

  // ── BUILD PARAMS (dipakai fetchList) ──
  const buildListParams = () => {
    const params = {
      period_month: periodMonthParam.value,
      per_page: pagination.per_page,
      page: pagination.current_page,
      sort_by: sort.column,
      sort_dir: sort.direction,
    }
    if (statusFilter.value !== 'all') params.status = statusFilter.value
    if (salesIdFilter.value) params.sales_id = salesIdFilter.value
    if (searchQuery.value) params.search = searchQuery.value
    return params
  }

  // ── FETCH SUMMARY ──
  const fetchSummary = async () => {
    loadingSummary.value = true
    try {
      const response = await visitTargetServices.getList({
        period_month: periodMonthParam.value,
        per_page: 100,
        page: 1,
      })
      const result = response.data
      const rows = Array.isArray(result.data) ? result.data : result.data?.data ?? []

      const total       = rows.length
      const uniqueSales = new Set(rows.map(r => r.sales_id)).size
      const achieved    = rows.filter(r => r.is_achieved).length
      const avgPct      = total
        ? Math.round(rows.reduce((sum, r) => sum + (r.percentage ?? 0), 0) / total)
        : 0

      summary.total_targets  = total
      summary.unique_sales   = uniqueSales
      summary.achieved_count = achieved
      summary.avg_percentage = avgPct
    } catch (error) {
      console.error('Gagal fetch summary visit target:', error)
    } finally {
      loadingSummary.value = false
    }
  }

  // ── FETCH LIST (tabel) ──
  const fetchList = async () => {
    loadingList.value = true
    errorList.value = null
    try {
      const response = await visitTargetServices.getList(buildListParams())
      const result = response.data

      const dataArray = Array.isArray(result.data) ? result.data : result.data?.data ?? []
      targetsData.value.splice(0, targetsData.value.length, ...dataArray)

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
      console.error('Gagal fetch list visit target:', error)
      errorList.value = 'Gagal memuat data target visit.'
    } finally {
      loadingList.value = false
    }
  }

  // ── FETCH VIA URL (Prev/Next pagination) ──
  const fetchByUrl = async (url) => {
    if (!url) return
    loadingList.value = true
    try {
      const response = await visitTargetServices.getByUrl(url)
      const result = response.data

      const dataArray = Array.isArray(result.data) ? result.data : result.data?.data ?? []
      targetsData.value.splice(0, targetsData.value.length, ...dataArray)

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
      console.error('Gagal fetch page visit target:', error)
    } finally {
      loadingList.value = false
    }
  }

  // ── REFRESH SEMUA (summary + list sekaligus) ──
  const refreshAll = async () => {
    await Promise.all([fetchSummary(), fetchList()])
  }

  // ── GANTI BULAN ──
  const changeMonth = (val) => {
    periodMonth.value = val
    pagination.current_page = 1
    refreshAll()
  }

  // ── SEARCH WITH DELAY ──
  const searchWithDelay = (val) => {
    clearTimeout(searchTimeout)
    searchQuery.value = val
    pagination.current_page = 1
    searchTimeout = setTimeout(() => {
      fetchList()
    }, 500)
  }

  // ── FILTER STATUS / SALES ──
  const changeStatusFilter = (val) => {
    statusFilter.value = val
    pagination.current_page = 1
    fetchList()
  }

  const changeSalesFilter = (val) => {
    salesIdFilter.value = val
    pagination.current_page = 1
    fetchList()
  }

  // ── PAGE SIZE ──
  const changePageSize = () => {
    pagination.current_page = 1
    fetchList()
  }

  // ── SORTING ──
  const changeSorting = () => {
    pagination.current_page = 1
    fetchList()
  }

  const toggleSort = (col) => {
    if (!allowedSortColumns.includes(col)) return
    if (sort.column === col) {
      sort.direction = sort.direction === 'asc' ? 'desc' : 'asc'
    } else {
      sort.column = col
      sort.direction = col === 'sales_name' ? 'asc' : 'desc'
    }
    changeSorting()
  }

  // ── RESET ──
  const resetFilters = () => {
    searchQuery.value = ''
    statusFilter.value = 'all'
    salesIdFilter.value = null
    pagination.per_page = 10
    pagination.current_page = 1
    sort.column = 'created_at'
    sort.direction = 'desc'
    periodMonth.value = defaultMonth()
    refreshAll()
  }

  // ── CREATE ──
  const createTarget = async (payload) => {
    submitting.value = true
    try {
      const response = await visitTargetServices.create(payload)
      await refreshAll()
      return response.data
    } catch (error) {
      console.error('Gagal membuat target visit:', error)
      throw error
    } finally {
      submitting.value = false
    }
  }

  // ── UPDATE (cuma target_count & notes -- lihat catatan di visitTargetServices.update) ──
  const updateTarget = async (id, payload) => {
    submitting.value = true
    try {
      const response = await visitTargetServices.update(id, {
        target_count: payload.target_count,
        notes: payload.notes ?? null,
      })
      await refreshAll()
      return response.data
    } catch (error) {
      console.error('Gagal update target visit:', error)
      throw error
    } finally {
      submitting.value = false
    }
  }

  // ── DELETE ──
  const deleteTarget = async (id) => {
    deleting.value = true
    try {
      const response = await visitTargetServices.remove(id)
      await refreshAll()
      return response.data
    } catch (error) {
      console.error('Gagal menghapus target visit:', error)
      throw error
    } finally {
      deleting.value = false
    }
  }

  return {
    // state
    periodMonth, periodMonthParam,
    summary, loadingSummary,
    targetsData, loadingList, errorList,
    searchQuery, statusFilter, statusOptions, salesIdFilter,
    pagination, sort, sortOptions,
    submitting, deleting,
    // actions
    buildListParams,
    fetchSummary, fetchList, fetchByUrl, refreshAll,
    changeMonth, searchWithDelay, changeStatusFilter, changeSalesFilter,
    changePageSize, changeSorting, toggleSort, resetFilters,
    createTarget, updateTarget, deleteTarget,
  }
})