import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { followUpService } from '@/services/followUpService'

export const useFollowUpStore = defineStore('followUp', () => {

  // ── STATE ──────────────────────────────────────────
  const followUpData     = ref([])
  const loadingFollowUp  = ref(false)
  const searchFollowUp   = ref('')
  let   searchTimeout    = null

  const deletingFollowUp  = ref(false)
  const updatingFollowUp  = ref(false)
  const submittingResult  = ref(false)
  const submittingDirect  = ref(false)
  const errorFollowUp     = ref(null)

  const followUpDetail   = ref(null)
  const loadingDetail    = ref(false)

  // mode: 'leads' | 'customers'
  const mode = ref('customers')

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
    if (searchFollowUp.value)    params.append('search',   searchFollowUp.value)
    if (pagination.current_page) params.append('page',     pagination.current_page)
    if (pagination.per_page)     params.append('per_page', pagination.per_page)
    if (sort.column) {
      params.append('sort_by',  sort.column)
      params.append('sort_dir', sort.direction)
    }

    const endpoint = mode.value === 'leads'
      ? '/follow-up-leads'
      : '/follow-up-customers'

    return `${endpoint}?${params.toString()}`
  }


  // ── FETCH LIST ─────────────────────────────────────
  const fetchFollowUps = async (newMode = null, url = null) => {
    if (newMode) {
      mode.value             = newMode
      pagination.current_page = 1
    }

    loadingFollowUp.value = true
    try {
      const finalUrl = url || buildUrl()
      const response = mode.value === 'leads'
        ? await followUpService.getLeadsByUrl(finalUrl)
        : await followUpService.getCustomersByUrl(finalUrl)

      const result = response.data

      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      followUpData.value.splice(0, followUpData.value.length, ...dataArray)

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
      console.error('Gagal fetch follow up:', error)
      followUpData.value = []
    } finally {
      loadingFollowUp.value = false
    }
  }


  // ── DETAIL ─────────────────────────────────────────
  const detailFollowUp = async (id) => {
    loadingDetail.value  = true
    followUpDetail.value = null
    try {
      const res = await followUpService.show(id)
      followUpDetail.value = res.data.data
    } catch (err) {
      console.error('Gagal fetch detail follow up:', err)
      throw err
    } finally {
      loadingDetail.value = false
    }
  }


  // ── DELETE ─────────────────────────────────────────
  const deleteFollowUp = async (id) => {
    deletingFollowUp.value = true
    try {
      await followUpService.destroy(id)
      await fetchFollowUps()
    } catch (err) {
      throw err
    } finally {
      deletingFollowUp.value = false
    }
  }


  // ── UPDATE (RESCHEDULE) ────────────────────────────
  const updateFollowUp = async (id, form) => {
    updatingFollowUp.value = true
    errorFollowUp.value    = null
    try {
      const payload = {
        follow_up_at : form.follow_up_at,
        notes        : form.notes   ?? null,
        subject      : form.subject ?? null,
      }
      const res = await followUpService.update(id, payload)
      await fetchFollowUps()
      return res.data
    } catch (err) {
      errorFollowUp.value = err.response?.data?.message || 'Gagal update follow up'
      throw err
    } finally {
      updatingFollowUp.value = false
    }
  }


  // ── SUBMIT RESULT LEAD ─────────────────────────────
  const submitResultLead = async (followUpId, payload) => {
    submittingResult.value = true
    errorFollowUp.value    = null
    try {
      const res = await followUpService.submitResultLead(followUpId, payload)
      await fetchFollowUps()
      return res.data
    } catch (err) {
      if (err.response?.status === 422) {
        errorFollowUp.value = err.response.data.errors
      }
      throw err
    } finally {
      submittingResult.value = false
    }
  }


  // ── SUBMIT RESULT CUSTOMER ─────────────────────────
  const submitResultCustomer = async (followUpId, payload) => {
    submittingResult.value = true
    errorFollowUp.value    = null
    try {
      const res = await followUpService.submitResultCustomer(followUpId, payload)
      await fetchFollowUps()
      return res.data
    } catch (err) {
      if (err.response?.status === 422) {
        errorFollowUp.value = err.response.data.errors
      }
      throw err
    } finally {
      submittingResult.value = false
    }
  }


  // ── TIMELINE LEAD ──────────────────────────────────
  const timeline            = ref([])
  const loadingTimeline     = ref(false)
  const selectedFollowUpCode = ref(null)

  const fetchTimelineLead = async (id) => {
    loadingTimeline.value     = true
    timeline.value            = []
    selectedFollowUpCode.value = null
    try {
      const res = await followUpService.getTimelineLead(id)
      selectedFollowUpCode.value = res.data.data.follow_up_code
      timeline.value             = res.data.data.histories ?? []
    } catch (err) {
      console.error('Gagal fetch timeline lead:', err)
      timeline.value = []
    } finally {
      loadingTimeline.value = false
    }
  }

  const clearTimeline = () => {
    timeline.value             = []
    selectedFollowUpCode.value = null
  }


  // ── TIMELINE CUSTOMER ──────────────────────────────
  const customerTimeline        = ref([])
  const loadingCustomerTimeline = ref(false)

  const fetchTimelineCustomer = async (id) => {
    loadingCustomerTimeline.value = true
    customerTimeline.value        = []
    try {
      const res = await followUpService.getTimelineCustomer(id)
      customerTimeline.value = res.data.data.histories ?? []
    } catch (err) {
      console.error('Gagal fetch timeline customer:', err)
      customerTimeline.value = []
    } finally {
      loadingCustomerTimeline.value = false
    }
  }


  // ── SELECT: LEADS (form add follow up) ────────────
  const leadsSelectData        = ref([])
  const loadingLeadsSelect     = ref(false)
  let   leadsSearchTimeout     = null

  const fetchLeadsSelect = async (keyword = '') => {
    loadingLeadsSelect.value = true
    try {
      const res = await followUpService.getLeadsSelect(
        keyword ? { search: keyword } : {}
      )
      leadsSelectData.value = res.data.data ?? []
    } catch (err) {
      console.error('Gagal fetch leads select:', err)
      leadsSelectData.value = []
    } finally {
      loadingLeadsSelect.value = false
    }
  }

  const searchLeadsSelect = (val) => {
    clearTimeout(leadsSearchTimeout)
    leadsSearchTimeout = setTimeout(() => fetchLeadsSelect(val), 400)
  }


  // ── SELECT: LEADS DIRECT ───────────────────────────
  const leadsDirectData        = ref([])
  const loadingLeadsDirect     = ref(false)

  const fetchLeadsDirectSelect = async () => {
    loadingLeadsDirect.value = true
    try {
      const res = await followUpService.getLeadsDirectSelect()
      leadsDirectData.value = (res.data.data ?? []).map(item => ({
        lead_id      : Number(item.id),
        company_name : item.company_name,
        contact_name : item.contact_name,
      }))
    } catch (err) {
      console.error('Gagal fetch leads direct select:', err)
      leadsDirectData.value = []
    } finally {
      loadingLeadsDirect.value = false
    }
  }


  // ── SELECT: CUSTOMERS DIRECT ───────────────────────
  const customersDirectData    = ref([])
  const loadingCustomersDirect = ref(false)

  const fetchCustomersDirectSelect = async () => {
    loadingCustomersDirect.value = true
    try {
      const res = await followUpService.getCustomersDirectSelect()
      customersDirectData.value = (res.data.data ?? []).map(item => ({
        customer_id   : Number(item.id),
        company_name  : item.company_name,
        contact_name  : item.contact_name,
        customer_code : item.customer_code ?? null,
      }))
    } catch (err) {
      console.error('Gagal fetch customers direct select:', err)
      customersDirectData.value = []
    } finally {
      loadingCustomersDirect.value = false
    }
  }


  // ── STORE DIRECT LEAD ──────────────────────────────
  const storeDirectLead = async (leadId, payload) => {
    submittingDirect.value = true
    errorFollowUp.value    = null
    try {
      const res = await followUpService.storeDirectLead(leadId, payload)
      await fetchFollowUps()
      return res.data
    } catch (err) {
      if (err.response?.status === 422) {
        errorFollowUp.value = err.response.data.errors
      }
      throw err
    } finally {
      submittingDirect.value = false
    }
  }


  // ── STORE DIRECT CUSTOMER ──────────────────────────
  const storeDirectCustomer = async (payload) => {
    submittingDirect.value = true
    errorFollowUp.value    = null
    try {
      const res = await followUpService.storeDirectCustomer(payload)
      await fetchFollowUps()
      return res.data
    } catch (err) {
      if (err.response?.status === 422) {
        errorFollowUp.value = err.response.data.errors
      }
      throw err
    } finally {
      submittingDirect.value = false
    }
  }


  // ── SEARCH WITH DEBOUNCE ───────────────────────────
  const searchWithDelay = (val) => {
    clearTimeout(searchTimeout)
    searchFollowUp.value    = val
    pagination.current_page = 1
    searchTimeout = setTimeout(() => fetchFollowUps(null, buildUrl()), 500)
  }

  const changePageSize = () => {
    pagination.current_page = 1
    fetchFollowUps(null, buildUrl())
  }

  const changeSorting = () => {
    pagination.current_page = 1
    fetchFollowUps(null, buildUrl())
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
    searchFollowUp.value    = ''
    pagination.per_page     = 10
    pagination.current_page = 1
    sort.column             = 'created_at'
    sort.direction          = 'desc'
    fetchFollowUps(null, buildUrl())
  }

  const nextPage = () => {
    if (pagination.current_page < pagination.last_page) {
      pagination.current_page++
      fetchFollowUps(null, buildUrl())
    }
  }

  const prevPage = () => {
    if (pagination.current_page > 1) {
      pagination.current_page--
      fetchFollowUps(null, buildUrl())
    }
  }


  // ── FORMAT HELPERS ─────────────────────────────────
  const formatDate = (value) => {
    if (!value) return '-'
    const date = new Date(value.replace(' ', 'T'))
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('id-ID', {
      day  : '2-digit',
      month: 'short',
      year : 'numeric',
      timeZone: 'Asia/Jakarta',
    })
  }

  const formatDates = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('id-ID', {
      day  : '2-digit',
      month: 'short',
      year : 'numeric',
    })
  }


  // ── STATIC OPTIONS ─────────────────────────────────
  const typeFollowUp = ref([
    { value: 'CALL',     label: 'CALL'           },
    { value: 'EMAIL',    label: 'EMAIL'          },
    { value: 'WHATSAPP', label: 'WHATSAPP'       },
    { value: 'MEETING',  label: 'MEETING'        },
    { value: 'VISIT',    label: 'VISIT LOCATION' },
  ])

  const typeSubjectDirect = ref([
    { value: 'Perkenalan Produk',    label: 'Perkenalan Produk'    },
    { value: 'Penawaran Harga',      label: 'Penawaran Harga'      },
    { value: 'Negosiasi',            label: 'Negosiasi'            },
    { value: 'Follow Up',            label: 'Follow Up'            },
    { value: 'Kirim Proposal',       label: 'Kirim Proposal'       },
    { value: 'Presentasi Produk',    label: 'Presentasi Produk'    },
    { value: 'Demo Produk',          label: 'Demo Produk'          },
    { value: 'Klarifikasi Kebutuhan',label: 'Klarifikasi Kebutuhan'},
    { value: 'Pembahasan Kontrak',   label: 'Pembahasan Kontrak'   },
    { value: 'After Sales',          label: 'After Sales'          },
    { value: 'Menunggu Keputusan',   label: 'Menunggu Keputusan'   },
    { value: 'Lainnya',              label: 'Lainnya'              },
  ])

  const resultSubmit = ref([
    {
      value      : 'success',
      label      : 'Follow Up Ditutup (Tidak Ada Respons dari Customer)',
      description: 'Customer tidak merespons setelah beberapa kali follow up.',
    },
    {
      value      : 'need_followup',
      label      : 'Perlu Follow Up Lagi',
      description: 'Sudah ada komunikasi, namun customer belum memberi keputusan.',
    },
    {
      value      : 'reschedule',
      label      : 'Jadwal Ulang',
      description: 'Customer meminta untuk dihubungi di waktu yang berbeda.',
    },
    {
      value      : 'no_meet',
      label      : 'Tidak Berhasil Follow Up / Tidak Bertemu Customer (PIC)',
      description: 'Sudah dicoba menghubungi namun PIC tidak bisa ditemui.',
    },
    {
      value      : 'dealing',
      label      : 'Sedang Proses Deal / Negotiation Stage',
      description: 'Customer tertarik dan sedang dalam tahap negosiasi.',
    },
    {
      value      : 'closed',
      label      : 'Selesai / Closed',
      description: 'Deal berhasil ditutup.',
    },
    {
      value      : 'cancelled',
      label      : 'Dibatalkan',
      description: 'Follow up dibatalkan karena customer tidak jadi melanjutkan.',
    },
  ])


  // ── RETURN ─────────────────────────────────────────
  return {
    // state
    followUpData, loadingFollowUp, searchFollowUp,
    mode, pagination, sort,
    deletingFollowUp, updatingFollowUp,
    submittingResult, submittingDirect,
    errorFollowUp,
    followUpDetail, loadingDetail,

    // timeline
    timeline, loadingTimeline, selectedFollowUpCode,
    customerTimeline, loadingCustomerTimeline,

    // select options
    leadsSelectData,    loadingLeadsSelect,
    leadsDirectData,    loadingLeadsDirect,
    customersDirectData, loadingCustomersDirect,

    // static options
    typeFollowUp, typeSubjectDirect, resultSubmit,

    // actions
    buildUrl,
    fetchFollowUps,
    detailFollowUp,
    deleteFollowUp,
    updateFollowUp,
    submitResultLead,
    submitResultCustomer,
    fetchTimelineLead,
    fetchTimelineCustomer,
    clearTimeline,
    fetchLeadsSelect,
    searchLeadsSelect,
    fetchLeadsDirectSelect,
    fetchCustomersDirectSelect,
    storeDirectLead,
    storeDirectCustomer,
    searchWithDelay,
    changePageSize,
    changeSorting,
    toggleSort,
    resetFilters,
    nextPage,
    prevPage,

    // helpers
    formatDate,
    formatDates,
  }
})