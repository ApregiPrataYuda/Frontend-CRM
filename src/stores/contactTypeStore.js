import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { contactTypeServices } from '@/services/contactTypeServices'

// ── Store untuk Master Contact Type (Principle, Competitor, dll).
// Strukturnya sengaja dibuat semirip mungkin dengan roleStore.js supaya
// developer lain yang sudah familiar dengan pola Role Management bisa
// langsung paham. Bedanya: tidak ada hierarchy_order, tapi ada
// is_system/system_source_type (jenis reserved -- dipasang otomatis
// oleh backend saat Contact di-link, tidak bisa diedit/dihapus dari
// sini, lihat ContactTypeController::update()/destroy()). ──
export const useContactTypeStore = defineStore('contactType', () => {

  const contactTypesData = ref([])
  const loadingContactTypes = ref(false)
  const searchContactTypes = ref('')
  let searchTimeout = null

  const savingContactType = ref(false)
  const updatingContactType = ref(false)
  const deletingContactType = ref(false)
  const errorContactType = ref(null)

  const contactTypeDetail = ref(null)
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

  const allowedSortColumns = ['name', 'created_at']

  // ── Dipakai untuk dropdown pilihan jenis contact di form Add/Edit
  // Contact (bukan tabel Master Contact Type). Hanya jenis yang boleh
  // dipilih manual (is_system = false) yang relevan untuk dropdown itu
  // -- tapi tetap ambil semua di sini, filter is_system dilakukan di
  // sisi pemakai (lihat contactStore.js / ContactManagement.vue) supaya
  // store ini tetap serbaguna untuk halaman Master Contact Type sendiri
  // (yang perlu nampilin semua jenis, termasuk yang reserved, read-only). ──
  const allContactTypes = ref([])
  const loadingAllContactTypes = ref(false)

  // ───────────────── BUILD URL ─────────────────
  const buildUrl = () => {
    const params = new URLSearchParams()

    if (searchContactTypes.value) {
      params.append('search', searchContactTypes.value)
    }

    if (pagination.current_page) {
      params.append('page', pagination.current_page)
    }

    if (pagination.per_page) {
      params.append('per_page', pagination.per_page)
    }

    if (sort.column) {
      params.append('sort_by', sort.column)
      params.append('sort_dir', sort.direction)
    }

    return `/master-contact-type?${params.toString()}`
  }

  // ───────────────── FETCH (list, dipaginasi) ─────────────────
  const fetchContactTypes = async (url = null) => {
    loadingContactTypes.value = true

    try {
      const finalUrl = url || buildUrl()

      const response = await contactTypeServices.getByUrl(finalUrl)

      const result = response.data

      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      contactTypesData.value.splice(0, contactTypesData.value.length, ...dataArray)

      const pag = result.pagination ?? result.data?.pagination

      if (pag) {
        pagination.current_page = pag.current_page
        pagination.per_page = pag.per_page
        pagination.prev_page_url = pag.prev_page_url
        pagination.next_page_url = pag.next_page_url
        pagination.last_page = pag.last_page
        pagination.total = pag.total
      }

    } catch (error) {
      console.error('Gagal fetch contact types:', error)
    } finally {
      loadingContactTypes.value = false
    }
  }

  // ───────────────── FETCH ALL (untuk dropdown, tanpa pagination UI) ─────────────────
  // Backend tetap mem-paginate (default 10), jadi kita minta per_page besar
  // supaya dropdown dapat semua jenis dalam 1 request.
  const fetchAllContactTypes = async () => {
    loadingAllContactTypes.value = true

    try {
      const response = await contactTypeServices.getByUrl('/master-contact-type?per_page=100&sort_by=name&sort_dir=asc')

      const result = response.data
      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      allContactTypes.value.splice(0, allContactTypes.value.length, ...dataArray)

    } catch (error) {
      console.error('Gagal fetch semua contact types:', error)
    } finally {
      loadingAllContactTypes.value = false
    }
  }

  // ───────────────── SEARCH ─────────────────
  const searchWithDelay = () => {
    clearTimeout(searchTimeout)

    pagination.current_page = 1

    searchTimeout = setTimeout(() => {
      fetchContactTypes(buildUrl())
    }, 500)
  }

  // ───────────────── PAGE SIZE ─────────────────
  const changePageSize = () => {
    pagination.current_page = 1
    fetchContactTypes(buildUrl())
  }

  // ───────────────── SORTING ─────────────────
  const changeSorting = () => {
    pagination.current_page = 1
    fetchContactTypes(buildUrl())
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

  // ───────────────── RESET ─────────────────
  const resetFilters = () => {
    searchContactTypes.value = ''
    pagination.current_page = 1
    pagination.per_page = 10

    sort.column = 'created_at'
    sort.direction = 'desc'

    fetchContactTypes(buildUrl())
  }

  // ───────────────── FORMAT DATE ─────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'

    const date = new Date(dateStr)

    if (isNaN(date.getTime())) {
      return 'Belum pernah diupdate'
    }

    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    })
  }

  // ───────────────── DETAIL ─────────────────
  const fetchContactTypeDetail = async (id) => {
    loadingDetail.value = true

    try {
      const response = await contactTypeServices.show(id)

      contactTypeDetail.value = response.data?.data ?? response.data

      return contactTypeDetail.value

    } catch (error) {
      console.error('Gagal fetch detail contact type:', error)
      return null
    } finally {
      loadingDetail.value = false
    }
  }

  // ───────────────── STORE ─────────────────
  const saveContactType = async (payload) => {
    savingContactType.value = true
    errorContactType.value = null

    try {
      await contactTypeServices.create(payload)

      await fetchContactTypes(buildUrl())

      return true

    } catch (error) {

      errorContactType.value =
        error.response?.data?.errors ??
        error.response?.data?.message ??
        'Gagal menyimpan jenis contact'

      return false

    } finally {
      savingContactType.value = false
    }
  }

  // ───────────────── UPDATE ─────────────────
  const updateContactType = async (id, payload) => {
    updatingContactType.value = true
    errorContactType.value = null

    try {
      await contactTypeServices.update(id, payload)

      await fetchContactTypes(buildUrl())

      return true

    } catch (error) {

      errorContactType.value =
        error.response?.data?.errors ??
        error.response?.data?.message ??
        'Gagal update jenis contact'

      return false

    } finally {
      updatingContactType.value = false
    }
  }

  // ───────────────── DELETE ─────────────────
  const deleteContactType = async (id) => {
    deletingContactType.value = true

    try {
      await contactTypeServices.destroy(id)

      await fetchContactTypes(buildUrl())

      return { ok: true }

    } catch (error) {

      console.error('Gagal delete contact type:', error)

      // ── Backend balikin 403 (reserved/is_system) atau 409 (masih dipakai
      // Contact) dengan pesan yang sudah ramah -- diteruskan ke UI supaya
      // toast-nya jelas, bukan cuma "Failed to delete". ──
      const message =
        error.response?.data?.message ??
        'Gagal menghapus jenis contact'

      return { ok: false, message }

    } finally {
      deletingContactType.value = false
    }
  }

  return {

    // state
    contactTypesData,
    loadingContactTypes,
    searchContactTypes,

    pagination,
    sort,

    savingContactType,
    updatingContactType,
    deletingContactType,
    errorContactType,

    contactTypeDetail,
    loadingDetail,

    allContactTypes,
    loadingAllContactTypes,

    // actions
    fetchContactTypes,
    fetchAllContactTypes,
    buildUrl,

    searchWithDelay,
    changePageSize,

    changeSorting,
    toggleSort,

    resetFilters,

    formatDate,

    fetchContactTypeDetail,

    saveContactType,
    updateContactType,
    deleteContactType,
  }
})