import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { contactServices } from '@/services/contactServices'

// ── Source type yang didukung fitur "Link dari Data Existing" -- harus
// PERSIS sinkron dengan Contact::SOURCE_TYPES di backend (Contact.php)
// dan dengan system_source_type yang di-seed di migration
// create_contact_types_table. Kalau backend nambah source_type baru,
// tambahkan juga di sini. ──
export const SOURCE_TYPE_OPTIONS = [
  { value: 'customer', label: 'Customer' },
  { value: 'lead', label: 'Lead' },
  { value: 'customer_contact', label: 'Customer Contact (PIC)' },
  { value: 'branch_contact', label: 'Branch Contact (PIC)' },
]

// ── Untuk saat ini, "Link dari Data Existing" & filter Sumber sengaja
// dibatasi ke PIC (Customer Contact & Branch Contact) + Lead supaya
// user tidak bingung -- Customer masih belum dibuka sebagai pilihan
// link. SOURCE_TYPE_OPTIONS di atas TETAP lengkap (dipakai contactStore
// sourceLabel() untuk resolve label kalau suatu saat ada data yang
// sudah ter-link dari Customer), yang dipersempit cuma daftar pilihan
// yang ditampilkan di dropdown. Kalau nanti mau dibuka lagi, tinggal
// tambahkan filter-nya di sini. ──
export const LINKABLE_SOURCE_TYPE_OPTIONS = SOURCE_TYPE_OPTIONS.filter(
  o => o.value === 'customer_contact' || o.value === 'branch_contact' || o.value === 'lead'
)

export const useContactStore = defineStore('contact', () => {

  const contactsData = ref([])
  const loadingContacts = ref(false)
  const searchContacts = ref('')
  let searchTimeout = null

  const savingContact = ref(false)
  const updatingContact = ref(false)
  const deletingContact = ref(false)
  const linkingContact = ref(false)
  const errorContact = ref(null)

  const contactDetail = ref(null)
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

  // ── Sesuai ContactValidationIndex::$allowedSortFields di backend ──
  const allowedSortColumns = ['company_name', 'status', 'created_at']

  // ── Filter tambahan (semua opsional, dikirim ke backend kalau terisi
  // -- lihat ContactController::index()). null/'' berarti "semua". ──
  const filters = reactive({
    contact_type_id: '',
    source_type: '',
    status: '',
  })

  // ============================================================
  // LISTING
  // ============================================================
  const buildUrl = () => {
    const params = new URLSearchParams()

    if (searchContacts.value) {
      params.append('search', searchContacts.value)
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

    if (filters.contact_type_id) {
      params.append('contact_type_id', filters.contact_type_id)
    }

    if (filters.source_type) {
      params.append('source_type', filters.source_type)
    }

    if (filters.status) {
      params.append('status', filters.status)
    }

    return `/contact?${params.toString()}`
  }

  const fetchContacts = async (url = null) => {
    loadingContacts.value = true

    try {
      const finalUrl = url || buildUrl()

      const response = await contactServices.getByUrl(finalUrl)

      const result = response.data

      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      contactsData.value.splice(0, contactsData.value.length, ...dataArray)

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
      console.error('Gagal fetch contacts:', error)
    } finally {
      loadingContacts.value = false
    }
  }

  const searchWithDelay = () => {
    clearTimeout(searchTimeout)

    pagination.current_page = 1

    searchTimeout = setTimeout(() => {
      fetchContacts(buildUrl())
    }, 500)
  }

  const changePageSize = () => {
    pagination.current_page = 1
    fetchContacts(buildUrl())
  }

  const changeSorting = () => {
    pagination.current_page = 1
    fetchContacts(buildUrl())
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

  const changeFilters = () => {
    pagination.current_page = 1
    fetchContacts(buildUrl())
  }

  const resetFilters = () => {
    searchContacts.value = ''
    pagination.current_page = 1
    pagination.per_page = 10

    sort.column = 'created_at'
    sort.direction = 'desc'

    filters.contact_type_id = ''
    filters.source_type = ''
    filters.status = ''

    fetchContacts(buildUrl())
  }

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

  // ── Label yang enak dibaca untuk kolom "Sumber" di tabel -- 'Standalone'
  // untuk data manual (Principle/Competitor), atau label SOURCE_TYPE_OPTIONS
  // untuk data hasil link. ──
  const sourceLabel = (item) => {
    if (!item.source_type) return 'Standalone'
    return SOURCE_TYPE_OPTIONS.find(o => o.value === item.source_type)?.label ?? item.source_type
  }

  // ============================================================
  // DETAIL
  // ============================================================
  const fetchContactDetail = async (id) => {
    loadingDetail.value = true

    try {
      const response = await contactServices.show(id)

      contactDetail.value = response.data?.data ?? response.data

      return contactDetail.value

    } catch (error) {
      console.error('Gagal fetch detail contact:', error)
      return null
    } finally {
      loadingDetail.value = false
    }
  }

  // ============================================================
  // STANDALONE (Principle, Competitor, dll -- input manual)
  // ============================================================
  const saveContactStandalone = async (payload) => {
    savingContact.value = true
    errorContact.value = null

    try {
      await contactServices.create(payload)

      await fetchContacts(buildUrl())

      return true

    } catch (error) {

      errorContact.value =
        error.response?.data?.errors ??
        error.response?.data?.message ??
        'Gagal menyimpan contact'

      return false

    } finally {
      savingContact.value = false
    }
  }

  const updateContactStandalone = async (id, payload) => {
    updatingContact.value = true
    errorContact.value = null

    try {
      await contactServices.update(id, payload)

      await fetchContacts(buildUrl())

      return true

    } catch (error) {

      errorContact.value =
        error.response?.data?.errors ??
        error.response?.data?.message ??
        'Gagal update contact'

      return false

    } finally {
      updatingContact.value = false
    }
  }

  // ============================================================
  // DELETE / UNLINK (endpoint & logic sama di backend, beda pesan sukses)
  // ============================================================
  const deleteContact = async (id) => {
    deletingContact.value = true

    try {
      const response = await contactServices.destroy(id)

      await fetchContacts(buildUrl())

      return {
        ok: true,
        message: response.data?.message ?? 'Success',
      }

    } catch (error) {

      console.error('Gagal delete/unlink contact:', error)

      return {
        ok: false,
        message: error.response?.data?.message ?? 'Gagal menghapus contact',
      }

    } finally {
      deletingContact.value = false
    }
  }

  // ============================================================
  // LINK DARI DATA EXISTING
  // ============================================================

  // ── Picker search (Customer / Lead / Customer Contact / Branch Contact) ──
  const sourceOptions = ref([])
  const loadingSourceOptions = ref(false)
  let sourceSearchTimeout = null

  const searchSource = (sourceType, keyword) => {
    clearTimeout(sourceSearchTimeout)

    if (!sourceType || !keyword || keyword.trim().length < 2) {
      sourceOptions.value.splice(0, sourceOptions.value.length)
      return
    }

    sourceSearchTimeout = setTimeout(async () => {
      loadingSourceOptions.value = true

      try {
        const response = await contactServices.searchSource(sourceType, keyword.trim())

        const result = response.data
        const dataArray = Array.isArray(result.data) ? result.data : result.data?.data ?? []

        sourceOptions.value.splice(0, sourceOptions.value.length, ...dataArray)

      } catch (error) {
        console.error('Gagal search source options:', error)
      } finally {
        loadingSourceOptions.value = false
      }
    }, 400)
  }

  const clearSourceOptions = () => {
    sourceOptions.value.splice(0, sourceOptions.value.length)
  }

  const linkContact = async (payload) => {
    linkingContact.value = true
    errorContact.value = null

    try {
      await contactServices.link(payload)

      await fetchContacts(buildUrl())

      return true

    } catch (error) {

      errorContact.value =
        error.response?.data?.errors ??
        error.response?.data?.message ??
        'Gagal link contact'

      return false

    } finally {
      linkingContact.value = false
    }
  }

  return {

    // state
    contactsData,
    loadingContacts,
    searchContacts,

    pagination,
    sort,
    filters,

    savingContact,
    updatingContact,
    deletingContact,
    linkingContact,
    errorContact,

    contactDetail,
    loadingDetail,

    sourceOptions,
    loadingSourceOptions,

    // actions
    fetchContacts,
    buildUrl,

    searchWithDelay,
    changePageSize,

    changeSorting,
    toggleSort,

    changeFilters,
    resetFilters,

    formatDate,
    sourceLabel,

    fetchContactDetail,

    saveContactStandalone,
    updateContactStandalone,
    deleteContact,

    searchSource,
    clearSourceOptions,
    linkContact,
  }
})