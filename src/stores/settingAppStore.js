import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'   // ← tambah computed
import { settingAppService } from '@/services/settingAppService'

export const useSettingAppStore = defineStore('settingApp', () => {

  const settingAppData      = ref([])
  const loadingSettingApp   = ref(false)
  const searchSettingApp    = ref('')
  let   searchTimeout       = null

  const savingSettingApp    = ref(false)
  const updatingSettingApp  = ref(false)
  const deletingSettingApp  = ref(false)
  const errorSettingApp     = ref(null)

  const settingAppDetail    = ref(null)
  const loadingDetail       = ref(false)

  const pagination = reactive({
    current_page:  1,
    per_page:      10,
    prev_page_url: null,
    next_page_url: null,
    last_page:     1,
    total:         0,
  })

  const sort = reactive({
    column:    'created_at',
    direction: 'desc',
  })

  const allowedSortColumns = ['app_name', 'created_at']

  // ─────────────────────────────────────────────
  // COMPUTED GETTERS — akses setting aktif
  // Setting app biasanya hanya 1 record (index 0)
  // ─────────────────────────────────────────────

  /** Record setting yang aktif (selalu index 0) */
  const currentSetting = computed(() => settingAppData.value[0] ?? null)

  /** Nama lengkap aplikasi */
  const appName = computed(() => currentSetting.value?.app_name ?? 'My App')

  /** Nama pendek / singkatan */
  const appShortName = computed(() => currentSetting.value?.app_short_name ?? 'App')

  /** Tagline */
  const appTagline = computed(() => currentSetting.value?.app_tagline ?? '')

  /** Filename logo (bukan URL lengkap — gabungkan dengan storageUrl di komponen) */
  const appLogo = computed(() => currentSetting.value?.app_logo ?? null)

  /** Filename logo small */
  const appLogoSmall = computed(() => currentSetting.value?.app_logo_small ?? null)

  /** Filename favicon */
  const appFavicon = computed(() => currentSetting.value?.favicon ?? null)

  /** Warna-warna */
  const primaryColor   = computed(() => currentSetting.value?.primary_color   ?? '#6366f1')
  const secondaryColor = computed(() => currentSetting.value?.secondary_color ?? '#818cf8')
  const sidebarColor   = computed(() => currentSetting.value?.sidebar_color   ?? null)
  const navbarColor    = computed(() => currentSetting.value?.navbar_color    ?? null)

  /** Footer */
  const footerText     = computed(() => currentSetting.value?.footer_text     ?? '')

  /** Versi & environment */
  const appVersion     = computed(() => currentSetting.value?.version         ?? '1.0.0')
  const appEnvironment = computed(() => currentSetting.value?.environment     ?? 'production')

  // ─────────────────────────────────────────────
  // BUILD URL
  // ─────────────────────────────────────────────
  const buildUrl = () => {
    const params = new URLSearchParams()
    if (searchSettingApp.value) params.append('search',   searchSettingApp.value)
    if (pagination.current_page) params.append('page',    pagination.current_page)
    if (pagination.per_page)     params.append('per_page', pagination.per_page)
    if (sort.column) {
      params.append('sort_by',  sort.column)
      params.append('sort_dir', sort.direction)
    }
    return `/setting-app-management?${params.toString()}`
  }

  // ─────────────────────────────────────────────
  // FETCH
  // ─────────────────────────────────────────────
  const fetchSettingApp = async (url = null) => {
    loadingSettingApp.value = true
    try {
      const finalUrl = url || buildUrl()
      const response = await settingAppService.getByUrl(finalUrl)
      const result   = response.data

      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      settingAppData.value.splice(0, settingAppData.value.length, ...dataArray)

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
      console.error('Gagal fetch setting app:', error)
    } finally {
      loadingSettingApp.value = false
    }
  }

  // ─────────────────────────────────────────────
  // SEARCH / PAGE SIZE / SORT / RESET
  // ─────────────────────────────────────────────
  const searchWithDelay = (val) => {
    clearTimeout(searchTimeout)
    searchSettingApp.value  = val
    pagination.current_page = 1
    searchTimeout = setTimeout(() => fetchSettingApp(buildUrl()), 500)
  }

  const changePageSize = () => {
    pagination.current_page = 1
    fetchSettingApp(buildUrl())
  }

  const changeSorting = () => {
    pagination.current_page = 1
    fetchSettingApp(buildUrl())
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
    searchSettingApp.value  = ''
    pagination.per_page     = 10
    pagination.current_page = 1
    sort.column             = 'created_at'
    sort.direction          = 'desc'
    fetchSettingApp(buildUrl())
  }

  // ─────────────────────────────────────────────
  // FORMAT DATE
  // ─────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Belum pernah diupdate'
    return date.toLocaleDateString('id-ID', {
      year: 'numeric', month: 'long', day: '2-digit',
    })
  }

  // ─────────────────────────────────────────────
  // DETAIL
  // ─────────────────────────────────────────────
  const detailSettingApp = async (id) => {
    loadingDetail.value = true
    try {
      const res = await settingAppService.show(id)
      settingAppDetail.value = res.data.data
      return res.data.data
    } catch (err) {
      console.error('Gagal ambil detail setting app:', err)
      throw err
    } finally {
      loadingDetail.value = false
    }
  }

  // ─────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────
  const updateSettingApp = async (id, payload) => {
    updatingSettingApp.value = true
    errorSettingApp.value    = null
    try {
      await settingAppService.update(id, payload)
      await fetchSettingApp(buildUrl())
    } catch (err) {
      if (err.response?.status === 422) {
        errorSettingApp.value = err.response.data.errors
      }
      throw err
    } finally {
      updatingSettingApp.value = false
    }
  }

  // ─────────────────────────────────────────────
  // EXPORTS
  // ─────────────────────────────────────────────
  return {
    // state
    settingAppData, loadingSettingApp, searchSettingApp,
    pagination, sort,
    savingSettingApp, updatingSettingApp, deletingSettingApp, errorSettingApp,
    settingAppDetail, loadingDetail,

    // ★ computed getters — pakai di mana saja
    currentSetting,
    appName, appShortName, appTagline,
    appLogo, appLogoSmall, appFavicon,
    primaryColor, secondaryColor, sidebarColor, navbarColor,
    footerText, appVersion, appEnvironment,

    // actions
    fetchSettingApp, buildUrl,
    searchWithDelay, changePageSize,
    changeSorting, toggleSort, resetFilters,
    formatDate, detailSettingApp, updateSettingApp,
  }
})