import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { consignmentLocationServices } from '@/services/consignmentLocationServices'

export const useConsignmentLocationStore = defineStore('consignmentLocation', () => {

  const locations   = ref([])
  const companies   = ref([])
  const loading     = ref(false)
  const savingId    = ref(null)          // id lokasi yang sedang disimpan
  const defaultInterval = ref(14)

  const filters = reactive({
    company_id: null,
    search: '',
    filter: 'all',                       // all / consignment / unmapped
  })

  const pagination = reactive({ current_page: 1, last_page: 1, per_page: 50, total: 0 })

  const applyingAll = ref(false)
  const lastSkipped = ref([])            // hasil "Pakai semua saran" yang perlu dicek manual

  const syncing    = ref(false)
  const syncStatus = reactive({ last_status: null, last_success_at: null, last_error: null, total: 0, consignment: 0 })

  let searchTimeout = null

  const errorMessage = (error, fallback) =>
    error?.response ? (error.response.data?.message ?? fallback) : 'Tidak bisa terhubung ke server.'

  // ───────────── FETCH ─────────────
  const fetchCompanies = async () => {
    try {
      const res = await consignmentLocationServices.getCompanies()
      companies.value = res.data?.data ?? []
      if (!filters.company_id && companies.value.length === 1) filters.company_id = companies.value[0].id
    } catch (e) {
      console.error('Gagal memuat company:', e)
    }
  }

  const fetchLocations = async (page = 1) => {
    loading.value = true
    try {
      const res = await consignmentLocationServices.getLocations({
        company_id: filters.company_id || undefined,
        search: filters.search || undefined,
        filter: filters.filter,
        page,
        per_page: pagination.per_page,
      })
      const data = res.data?.data ?? {}
      defaultInterval.value = data.default_interval_days ?? 14
      const list = data.list ?? {}
      locations.value = list.data ?? []
      pagination.current_page = list.current_page ?? 1
      pagination.last_page    = list.last_page ?? 1
      pagination.total        = list.total ?? 0
    } catch (e) {
      console.error('Gagal memuat lokasi:', e)
      locations.value = []
    } finally {
      loading.value = false
    }
  }

  const searchWithDelay = () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => fetchLocations(1), 500)
  }

  // ───────────── UPDATE ─────────────
  // Return: { ok, message }
  const updateLocation = async (loc, payload) => {
    savingId.value = loc.id
    try {
      const res = await consignmentLocationServices.update(loc.id, payload)
      await Promise.all([fetchLocations(pagination.current_page), fetchCompanies(), fetchSyncStatus()])
      return { ok: true, message: res.data?.message ?? 'Tersimpan' }
    } catch (e) {
      return { ok: false, message: errorMessage(e, 'Gagal menyimpan lokasi') }
    } finally {
      savingId.value = null
    }
  }

  const applySuggestion = async (loc) => {
    savingId.value = loc.id
    try {
      const res = await consignmentLocationServices.applySuggestion(loc.id)
      await fetchLocations(pagination.current_page)
      return { ok: true, message: res.data?.message ?? 'Tersimpan' }
    } catch (e) {
      return { ok: false, message: errorMessage(e, 'Gagal memakai saran') }
    } finally {
      savingId.value = null
    }
  }

  // Return: { ok, message, applied, skipped }
  const applyAllSuggestions = async () => {
    if (applyingAll.value) return { ok: false, message: 'Masih diproses.' }
    applyingAll.value = true
    try {
      const res = await consignmentLocationServices.applyAllSuggestions({ company_id: filters.company_id || undefined })
      const data = res.data?.data ?? {}
      lastSkipped.value = data.skipped ?? []
      await Promise.all([fetchLocations(pagination.current_page), fetchCompanies()])
      return { ok: true, message: res.data?.message, applied: (data.applied ?? []).length, skipped: lastSkipped.value.length }
    } catch (e) {
      return { ok: false, message: errorMessage(e, 'Gagal memetakan saran') }
    } finally {
      applyingAll.value = false
    }
  }

  const searchPartners = async (search) => {
    try {
      const res = await consignmentLocationServices.searchPartners(search)
      return res.data?.data ?? []
    } catch {
      return []
    }
  }

  // ───────────── SYNC ─────────────
  const fetchSyncStatus = async () => {
    try {
      const res = await consignmentLocationServices.getSyncStatus()
      Object.assign(syncStatus, res.data?.data ?? {})
    } catch (e) {
      console.error('Gagal memuat status sync lokasi:', e)
    }
  }

  const syncLocations = async () => {
    if (syncing.value) return { ok: false, message: 'Sync masih berjalan.' }
    syncing.value = true
    try {
      await consignmentLocationServices.sync()
      await Promise.all([fetchSyncStatus(), fetchCompanies(), fetchLocations(1)])
      return { ok: true, total: syncStatus.total }
    } catch (e) {
      await fetchSyncStatus()
      return { ok: false, message: errorMessage(e, 'Gagal sync lokasi dari Odoo') }
    } finally {
      syncing.value = false
    }
  }

  const formatDateTime = (value) => {
    if (!value) return '-'
    const d = new Date(String(value).replace(' ', 'T'))
    return isNaN(d) ? '-' : d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const formatQty = (v) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(v ?? 0)

  return {
    locations, companies, loading, savingId, defaultInterval, filters, pagination,
    applyingAll, lastSkipped, applyAllSuggestions,
    syncing, syncStatus,
    fetchCompanies, fetchLocations, searchWithDelay,
    updateLocation, applySuggestion, searchPartners,
    fetchSyncStatus, syncLocations,
    formatDateTime, formatQty,
  }
})