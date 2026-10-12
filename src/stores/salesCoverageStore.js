import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { salesCoverageServices } from '@/services/salesCoverageServices'

export const useSalesCoverageStore = defineStore('salesCoverage', () => {
  const coverageData = ref([])
  const loadingCoverage = ref(false)
  const searchCoverage = ref('')
  let searchTimeout = null

  // filter: '' = semua, '1' = udah punya wilayah, '0' = belum punya wilayah
  const filterHasCoverage = ref('')
  // filter wilayah (kode provinsi) -- sales yang wilayahnya nyentuh provinsi ini
  const filterAreaCode = ref('')

  const savingCoverage = ref(false)
  const deletingCoverage = ref(false)
  const errorCoverage = ref(null)

  const coverageDetail = ref(null)
  const loadingDetail = ref(false)

  const pagination = reactive({
    current_page: 1,
    per_page: 10,
    prev_page_url: null,
    next_page_url: null,
    last_page: 1,
    total: 0,
  })

  // label level -- SAMA dengan EmployeeCoverage::LEVEL_LABELS di backend
  const levelLabels = {
    province: 'Provinsi',
    city:     'Kota/Kabupaten',
    district: 'Kecamatan',
    village:  'Desa/Kelurahan',
  }

  // level dari panjang kode Laravolt (2 / 4 / 7 / 10 digit)
  const levelFromCode = (code) => {
    const map = { 2: 'province', 4: 'city', 6: 'district', 10: 'village' }
    return map[String(code ?? '').length] ?? null
  }

  // ── BUILD URL ──
  const buildUrl = () => {
    const params = new URLSearchParams()
    if (searchCoverage.value) params.append('search', searchCoverage.value)
    if (filterHasCoverage.value !== '') params.append('has_coverage', filterHasCoverage.value)
    if (filterAreaCode.value) params.append('area_code', filterAreaCode.value)
    if (pagination.current_page) params.append('page', pagination.current_page)
    if (pagination.per_page) params.append('per_page', pagination.per_page)
    return `/employee-coverages?${params.toString()}`
  }

  // ── FETCH ──
  const fetchCoverage = async (url = null) => {
    loadingCoverage.value = true
    try {
      const finalUrl = url || buildUrl()
      const response = await salesCoverageServices.getByUrl(finalUrl)
      const result = response.data

      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      coverageData.value.splice(0, coverageData.value.length, ...dataArray)

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
      console.error('Gagal fetch sales coverage:', error)
    } finally {
      loadingCoverage.value = false
    }
  }

  // pindah halaman pakai nomor halaman (BUKAN next_page_url) --
  // next_page_url dari Laravel ga bawa filter search/area, jadi URL
  // dibangun ulang biar filter tetap kepake di halaman berikutnya
  const goToPage = (page) => {
    if (page < 1 || page > pagination.last_page) return
    pagination.current_page = page
    fetchCoverage(buildUrl())
  }

  // ── SEARCH WITH DELAY ──
  const searchWithDelay = (val) => {
    clearTimeout(searchTimeout)
    searchCoverage.value = val
    pagination.current_page = 1
    searchTimeout = setTimeout(() => {
      fetchCoverage(buildUrl())
    }, 500)
  }

  // ── CHANGE PAGE SIZE ──
  const changePageSize = () => {
    pagination.current_page = 1
    fetchCoverage(buildUrl())
  }

  // ── FILTER ──
  const changeFilter = () => {
    pagination.current_page = 1
    fetchCoverage(buildUrl())
  }

  // ── RESET ──
  const resetFilters = () => {
    searchCoverage.value = ''
    filterHasCoverage.value = ''
    filterAreaCode.value = ''
    pagination.per_page = 10
    pagination.current_page = 1
    fetchCoverage(buildUrl())
  }

  // ── FORMAT DATE ──
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

  // ── DETAIL ──
  const detailCoverage = async (employeeId) => {
    loadingDetail.value = true
    try {
      const res = await salesCoverageServices.show(employeeId)
      coverageDetail.value = res.data.data
      return coverageDetail.value
    } catch (err) {
      console.error('Gagal ambil detail coverage:', err)
      throw err
    } finally {
      loadingDetail.value = false
    }
  }

  // ── SELECT DATA: SALES ──
  const salesSelectData = ref([])
  const fetchSalesSelect = async () => {
    try {
      const data = await salesCoverageServices.getSales()
      salesSelectData.value = data ?? []
    } catch (error) {
      console.error('Gagal fetch sales:', error)
    }
  }

  // ── SELECT DATA: REGION (province → city → district → village) ──
  const regionOptions = reactive({
    province: [],
    city:     [],
    district: [],
    village:  [],
  })

  const regionLoading = reactive({
    province: false,
    city:     false,
    district: false,
    village:  false,
  })

  const fetchRegionOptions = async (level, parent = null) => {
    regionLoading[level] = true
    try {
      const data = await salesCoverageServices.getRegions(level, parent)
      regionOptions[level] = data ?? []
    } catch (error) {
      console.error(`Gagal fetch region ${level}:`, error)
      regionOptions[level] = []
    } finally {
      regionLoading[level] = false
    }
  }

  // ── SAVE (SINKRON) ──
  // dipakai buat Add maupun Edit: modal selalu nampilin daftar wilayah
  // LENGKAP milik sales, jadi simpannya pakai PUT (ganti persis)
  const syncCoverage = async (employeeId, areaCodes) => {
    savingCoverage.value = true
    errorCoverage.value = null
    try {
      const res = await salesCoverageServices.sync(employeeId, { area_codes: areaCodes })
      await fetchCoverage(buildUrl())
      return res.data
    } catch (err) {
      if (err.response?.status === 422) {
        errorCoverage.value = err.response.data.errors
      }
      throw err
    } finally {
      savingCoverage.value = false
    }
  }

  // ── DELETE 1 WILAYAH ──
  const deleteCoverage = async (id) => {
    deletingCoverage.value = true
    try {
      await salesCoverageServices.destroy(id)
      await fetchCoverage(buildUrl())
    } catch (err) {
      throw err
    } finally {
      deletingCoverage.value = false
    }
  }

  return {
    // state
    coverageData, loadingCoverage, searchCoverage,
    filterHasCoverage, filterAreaCode,
    pagination, errorCoverage,
    savingCoverage, deletingCoverage,
    coverageDetail, loadingDetail,
    salesSelectData,
    regionOptions, regionLoading,
    levelLabels,
    // actions
    buildUrl,
    fetchCoverage, goToPage,
    searchWithDelay, changePageSize,
    changeFilter, resetFilters,
    formatDate, levelFromCode,
    detailCoverage,
    fetchSalesSelect, fetchRegionOptions,
    syncCoverage, deleteCoverage,
  }
})