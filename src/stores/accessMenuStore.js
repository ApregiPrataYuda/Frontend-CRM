import { ref, reactive, computed } from 'vue'
import { defineStore } from 'pinia'
import { useToast } from 'vue-toastification'
import { accessMenuServices } from '@/services/accessMenuServices'

export const useAccessMenuStore = defineStore('accessMenuStore', () => {

  const toast = useToast()

  const roleId              = ref(null)
  const accessMenuStoreData = ref([])
  const loadingAccessMenu   = ref(false)
  const searchAccessMenu    = ref('')
  let searchTimeoutAccessMenu = null
  let autoSaveTimeout         = null

  const pagination = reactive({
    current_page:  1,
    per_page:      10,
    prev_page_url: null,
    next_page_url: null,
    last_page:     1,
    total:         0,
  })

  const sort = reactive({
    column:    'menu',
    direction: 'asc',
  })

  const allowedSortColumns = ['menu', 'id_menu']

  // ── BASE URL — null jika belum ada roleId ─────────────────
  const baseUrlApi = computed(() =>
    roleId.value ? `/access-role-to-menu/${roleId.value}` : null
  )

  // ── BUILD URL ─────────────────────────────────────────────
  const buildUrl = () => {
    const params = new URLSearchParams()
    if (searchAccessMenu.value) params.append('search', searchAccessMenu.value)
    if (pagination.current_page)  params.append('page',     pagination.current_page)
    if (pagination.per_page)      params.append('per_page', pagination.per_page)
    if (sort.column) {
      params.append('sort_by',  sort.column)
      params.append('sort_dir', sort.direction)
    }
    return `${baseUrlApi.value}?${params.toString()}`
  }

  // ── FETCH — mendukung URL eksplisit untuk prev/next pagination ──
  const fetchAccessMenu = async (url = null) => {
    // Jangan fetch jika belum ada roleId dan tidak ada URL eksplisit
    if (!baseUrlApi.value && !url) return

    loadingAccessMenu.value = true
    try {
      const finalUrl = url || buildUrl()
      const response = await accessMenuServices.getByUrl(finalUrl)
      const result   = response.data

      // Normalisasi struktur respons
      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      accessMenuStoreData.value = dataArray

      // Update pagination
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
      console.error('Gagal fetch access menu:', error)
      toast.error('Gagal memuat data akses menu')
    } finally {
      loadingAccessMenu.value = false
    }
  }

  // ── SET ROLE ID & langsung fetch ──────────────────────────
  const setRoleId = (id) => {
    roleId.value             = id
    pagination.current_page  = 1
    searchAccessMenu.value   = ''
    fetchAccessMenu()
  }

  // ── SEARCH WITH DELAY ─────────────────────────────────────
  const searchWithDelay = (val) => {
    clearTimeout(searchTimeoutAccessMenu)
    searchAccessMenu.value  = val
    pagination.current_page = 1
    searchTimeoutAccessMenu = setTimeout(() => {
      fetchAccessMenu()
    }, 500)
  }

  // ── CHANGE PAGE SIZE ──────────────────────────────────────
  const changePageSize = () => {
    pagination.current_page = 1
    fetchAccessMenu()
  }

  // ── TOGGLE SORT ───────────────────────────────────────────
  const toggleSort = (col) => {
    if (!allowedSortColumns.includes(col)) return
    if (sort.column === col) {
      sort.direction = sort.direction === 'asc' ? 'desc' : 'asc'
    } else {
      sort.column    = col
      sort.direction = 'asc'
    }
    pagination.current_page = 1
    fetchAccessMenu()
  }

  // ── RESET FILTERS ─────────────────────────────────────────
  const resetFilters = () => {
    searchAccessMenu.value  = ''
    pagination.current_page = 1
    pagination.per_page     = 10
    sort.column             = 'menu'
    sort.direction          = 'asc'
    fetchAccessMenu()
  }

  // ── AUTO SAVE ACCESS (toggle checkbox) ───────────────────
  // Mengembalikan Promise agar komponen bisa await jika perlu
  const autoSaveAccess = (menu) => {
    if (!roleId.value) return Promise.resolve('no-role')
    clearTimeout(autoSaveTimeout)

    return new Promise((resolve) => {
      autoSaveTimeout = setTimeout(async () => {
        try {
          const res = await accessMenuServices.changeAccess({
            roleId: roleId.value,
            menuId: menu.id_menu,
          })

          const status = res.data?.status

          if (status === 'added') {
            toast.success(res.data.message ?? 'Akses berhasil diberikan')
          } else if (status === 'removed') {
            toast.info(res.data.message ?? 'Akses berhasil dicabut')
          }

          resolve(status)
        } catch (error) {
          console.error('Auto save failed:', error)
          // Rollback checkbox jika gagal
          menu.has_access = !menu.has_access
          toast.error('Gagal menyimpan perubahan akses')
          resolve('error')
        }
      }, 300)
    })
  }

  return {
    roleId,
    accessMenuStoreData,
    loadingAccessMenu,
    searchAccessMenu,
    pagination,
    sort,
    setRoleId,
    fetchAccessMenu,
    searchWithDelay,
    changePageSize,
    toggleSort,
    resetFilters,
    autoSaveAccess,
  }
})