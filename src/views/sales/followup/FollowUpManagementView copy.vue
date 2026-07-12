<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppModal from '@/components/AppModal.vue'
import { useConfirm } from '@/composables/useConfirm'
import { usePermissionStore } from '@/stores/permissionStore'
import { useAuthStore } from '@/stores/authStore'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useFollowUpStore } from '@/stores/followUpStore'
import Multiselect from '@vueform/multiselect'
import '@vueform/multiselect/themes/default.css' 


const { confirm }   = useConfirm()
const permission    = usePermissionStore()
const route         = useRoute()
const router        = useRouter()
const toast         = useToast()
const authStore     = useAuthStore()
const followUpStore = useFollowUpStore()

// ── PERMISSIONS ──
const currentUrl = computed(() => route.path.replace('/app', ''))
const canCreate  = computed(() => permission.canCreate(currentUrl.value))
const canUpdate  = computed(() => permission.canUpdate(currentUrl.value))
const canDelete  = computed(() => permission.canDelete(currentUrl.value))
const canView    = computed(() => permission.canView(currentUrl.value))

// ── DROPDOWN TOGGLES ──
const showExportMenu  = ref(false)
const showImportMenu  = ref(false)
const showPerPageMenu = ref(false)
const showSortByMenu  = ref(false)
const showSortDirMenu = ref(false)
const showModeMenu    = ref(false)

// ── DATETIME HELPERS ──
// native input pakai format "YYYY-MM-DDTHH:mm", backend expect "YYYY-MM-DD HH:mm"
const toNative = (val) => {
  if (!val) return ''
  return val.replace(' ', 'T').slice(0, 16)
}
const fromNative = (val) => {
  if (!val) return ''
  return val.replace('T', ' ')
}
// min datetime untuk input native (sekarang)
const minDatetime = computed(() => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
})

// ── INIT ──
onMounted(() => {
  followUpStore.fetchFollowUps('customers')
})

// ── MODE LABEL ──
const modeLabel = computed(() =>
  followUpStore.mode === 'leads' ? 'Leads' : 'Customers'
)

const changeMode = (type) => {
  showModeMenu.value = false
  followUpStore.fetchFollowUps(type)
}

// ── SORT OPTIONS ──
const sortByOptions = [
  { label: 'Created Date', value: 'created_at'   },
  { label: 'Company Name', value: 'company_name' },
]
const sortByLabel = computed(() =>
  sortByOptions.find(o => o.value === followUpStore.sort.column)?.label ?? 'Created Date'
)

// ── COMPUTED: SHOW COLUMNS ──
const showVisitColumn  = computed(() => followUpStore.mode !== 'customers')
const showActionColumn = computed(() => followUpStore.mode !== 'leads')
const isActionable     = (item) => !['DONE', 'CLOSED', 'CANCELLED'].includes(item.status)

// ── STATUS CONFIG ──
const StatusConfigFromLeads = {
  PROSPECTIVE_CUSTOMERS: { class: 'status-info',    icon: 'fa-solid fa-user-plus'    },
  CONSIDERATION_STAGE  : { class: 'status-warning', icon: 'fa-solid fa-clock'        },
  POTENTIAL_CUSTOMERS  : { class: 'status-primary',  icon: 'fa-solid fa-star'         },
  CONVERTED            : { class: 'status-success', icon: 'fa-solid fa-check-double' },
  FAILED               : { class: 'status-danger',  icon: 'fa-solid fa-circle-xmark' },
  OTHER                : { class: 'status-dark',    icon: 'fa-solid fa-tag'          },
}

const normalizeStatus = (status) =>
  status?.toUpperCase().replaceAll(' ', '_')

const followUpStatusConfig = {
  PENDING  : { class: 'status-warning', label: 'PENDING'  },
  DONE     : { class: 'status-success', label: 'DONE'     },
  CANCELED : { class: 'status-danger',  label: 'CANCELED' },
}

const normalizeFollowUpStatus = (status) => {
  if (!status) return ''
  if (status === 'CANCELLED') return 'CANCELED'
  return status.toUpperCase()
}

const getFollowUpStatus = (status) => {
  const normalized = normalizeFollowUpStatus(status)
  return followUpStatusConfig[normalized] || { class: 'status-secondary', label: normalized || '-' }
}

// ══════════════════════════════════════════════
//  MODAL: EDIT / RESCHEDULE FOLLOW UP
// ══════════════════════════════════════════════
const isEditModalVisible = ref(false)
const editFollowUpId     = ref(null)
const formEdit = reactive({
  follow_up_at    : '',
  notes           : '',
  subject         : '',
  subject_template: null,
})

const openEditModal = (item) => {
  editFollowUpId.value       = item.id
  formEdit.follow_up_at      = item.follow_up_at
  formEdit.notes             = item.notes       ?? ''
  formEdit.subject           = item.subject     ?? ''
  formEdit.subject_template  = null
  followUpStore.errorFollowUp = null
  isEditModalVisible.value   = true
}

const closeEditModal = () => {
  isEditModalVisible.value = false
  editFollowUpId.value     = null
}

watch(() => formEdit.subject_template, (val) => {
  if (val) formEdit.subject = val
})

const submitEdit = async () => {
  if (!formEdit.follow_up_at) {
    return toast.error('Follow up date wajib diisi')
  }
  if (!formEdit.subject) {
    return toast.error('Subject wajib diisi')
  }
  try {
    await followUpStore.updateFollowUp(editFollowUpId.value, formEdit)
    closeEditModal()
    toast.success('Follow up berhasil diperbarui')
  } catch {
    toast.error(followUpStore.errorFollowUp || 'Gagal update follow up')
  }
}

// ══════════════════════════════════════════════
//  MODAL: SUBMIT RESULT LEAD
// ══════════════════════════════════════════════
const isSubmitLeadModalVisible = ref(false)
const selectedFollowUpId       = ref(null)

const formLead = reactive({
  status        : '',
  done_action   : '',
  lead_category : '',
  follow_up_at  : '',
  follow_up_type: '',
  subject       : '',
  subject_template: null,
  notes         : '',
})

const openSubmitLeadModal = (item) => {
  selectedFollowUpId.value  = item.id
  Object.assign(formLead, {
    status: '', done_action: '', lead_category: '',
    follow_up_at: '', follow_up_type: item.follow_up_type ?? '',
    subject: item.subject ?? '', subject_template: null, notes: '',
  })
  isSubmitLeadModalVisible.value = true
}

const closeSubmitLeadModal = () => {
  isSubmitLeadModalVisible.value = false
  selectedFollowUpId.value       = null
}

watch(() => formLead.status, (val) => {
  if (val === 'DONE')    { formLead.lead_category = '' }
  if (val === 'PENDING') { formLead.done_action   = '' }
  if (val === 'CANCELED'){ formLead.done_action = ''; formLead.lead_category = '' }
})

watch(() => formLead.subject_template, (val) => {
  if (val) formLead.subject = val
})

const submitLeadResult = async () => {
  if (!formLead.status)  return toast.warning('Status wajib dipilih')
  if (!formLead.subject) return toast.warning('Subject wajib diisi')

  let payload = { status: formLead.status, notes: formLead.notes }

  if (formLead.status === 'DONE') {
    if (!formLead.done_action) return toast.warning('Pilih action setelah DONE')
    payload.done_action = formLead.done_action
  }

  if (formLead.status === 'PENDING') {
    if (!formLead.follow_up_at || !formLead.follow_up_type || !formLead.subject) {
      return toast.warning('Lengkapi jadwal follow up berikutnya')
    }
    payload.follow_up_at   = formLead.follow_up_at
    payload.follow_up_type = String(formLead.follow_up_type).toUpperCase()
    payload.subject        = formLead.subject
    payload.lead_category  = formLead.lead_category
  }

  try {
    await followUpStore.submitResultLead(selectedFollowUpId.value, payload)
    closeSubmitLeadModal()
    toast.success('Follow up lead berhasil disimpan')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal submit result')
  }
}

// ══════════════════════════════════════════════
//  MODAL: SUBMIT RESULT CUSTOMER
// ══════════════════════════════════════════════
const isSubmitCustomerModalVisible = ref(false)

const resultForm = reactive({
  result          : '',
  notes           : '',
  next_follow_up_at: '',
  follow_up_type  : '',
})

const showNextFollowUp = computed(() =>
  ['need_followup', 'reschedule', 'dealing', 'no_meet'].includes(resultForm.result)
)
const isNextFollowUpRequired = computed(() =>
  ['need_followup', 'reschedule', 'dealing'].includes(resultForm.result)
)

const openSubmitCustomerModal = (item) => {
  selectedFollowUpId.value = item.id
  Object.assign(resultForm, { result: '', notes: '', next_follow_up_at: '', follow_up_type: '' })
  isSubmitCustomerModalVisible.value = true
}

const closeSubmitCustomerModal = () => {
  isSubmitCustomerModalVisible.value = false
  selectedFollowUpId.value           = null
}

const submitCustomerResult = async () => {
  if (!resultForm.result) return toast.warning('Pilih result terlebih dahulu')
  if (isNextFollowUpRequired.value && !resultForm.next_follow_up_at) {
    return toast.warning('Tanggal follow up berikutnya wajib diisi')
  }

  if (resultForm.result === 'no_meet' && !resultForm.next_follow_up_at) {
    const ok = await confirm({
      type       : 'warning',
      title      : 'Tanggal tidak diisi',
      message    : 'Customer ini tidak akan punya jadwal follow up berikutnya. Lanjutkan?',
      confirmText: 'Ya, lanjutkan',
      cancelText : 'Isi tanggal dulu',
    })
    if (!ok) return
  }

  const payload = {
    result: resultForm.result,
    notes : resultForm.notes ?? null,
    ...(resultForm.next_follow_up_at && {
      next_follow_up_at: resultForm.next_follow_up_at,
      follow_up_type   : resultForm.follow_up_type ?? null,
    }),
  }

  try {
    await followUpStore.submitResultCustomer(selectedFollowUpId.value, payload)
    closeSubmitCustomerModal()
    toast.success('Result berhasil di-submit!')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal submit result')
  }
}

// ══════════════════════════════════════════════
//  MODAL: DIRECT FOLLOW UP LEAD
// ══════════════════════════════════════════════
const isDirectLeadModalVisible = ref(false)

const formDirectLead = reactive({
  lead_id               : null,
  follow_up_at          : '',
  follow_up_type        : '',
  subject               : '',
  subject_template_direct: null,
  notes                 : '',
})

const openDirectLeadModal = async () => {
  Object.assign(formDirectLead, {
    lead_id: null, follow_up_at: '', follow_up_type: '',
    subject: '', subject_template_direct: null, notes: '',
  })
  await followUpStore.fetchLeadsDirectSelect()
  isDirectLeadModalVisible.value = true
}

const closeDirectLeadModal = () => {
  isDirectLeadModalVisible.value = false
}

watch(() => formDirectLead.subject_template_direct, (val) => {
  if (val) formDirectLead.subject = val
})

const submitDirectLead = async () => {
  if (!formDirectLead.lead_id)        return toast.warning('Lead wajib dipilih')
  if (!formDirectLead.follow_up_type) return toast.warning('Type follow up wajib dipilih')
  if (!formDirectLead.subject)        return toast.warning('Subject wajib diisi')

  const payload = {
    subject       : formDirectLead.subject,
    follow_up_type: formDirectLead.follow_up_type,
    follow_up_at  : formDirectLead.follow_up_at,
    notes         : formDirectLead.notes,
  }

  try {
    await followUpStore.storeDirectLead(formDirectLead.lead_id, payload)
    closeDirectLeadModal()
    toast.success('Direct Follow Up lead berhasil dibuat')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal membuat direct follow up')
  }
}

// ══════════════════════════════════════════════
//  MODAL: DIRECT FOLLOW UP CUSTOMER
// ══════════════════════════════════════════════
const isDirectCustomerModalVisible = ref(false)

const followUpTypes = [
  { value: 'CALL',     label: 'Call',      icon: 'fa-solid fa-phone'          },
  { value: 'WHATSAPP', label: 'WhatsApp',  icon: 'fa-solid fa-comments'      },
  { value: 'EMAIL',    label: 'Email',     icon: 'fa-solid fa-envelope'       },
  { value: 'MEETING',  label: 'Meeting',   icon: 'fa-solid fa-handshake'      },
]

const subjectTemplatesCustomers = [
  { label: 'Check-in Rutin - Memastikan Kepuasan Layanan',       value: 'Check-in Rutin - Memastikan Kepuasan Layanan'       },
  { label: 'Penawaran Repeat Order - Produk/Layanan Sebelumnya', value: 'Penawaran Repeat Order - Produk/Layanan Sebelumnya' },
  { label: 'Perpanjangan Kontrak / Renewal Layanan',             value: 'Perpanjangan Kontrak / Renewal Layanan'             },
  { label: 'Tindak Lanjut Setelah Pembelian - Evaluasi Kepuasan',value: 'Tindak Lanjut Setelah Pembelian - Evaluasi Kepuasan'},
  { label: 'Penanganan Keluhan / Komplain Customer',             value: 'Penanganan Keluhan / Komplain Customer'             },
  { label: 'Diskusi Lanjutan Negosiasi Harga / Kontrak',         value: 'Diskusi Lanjutan Negosiasi Harga / Kontrak'         },
  { label: 'Re-aktivasi Customer - Sudah Lama Tidak Bertransaksi',value:'Re-aktivasi Customer - Sudah Lama Tidak Bertransaksi'},
  { label: 'Tidak Berminat Lanjut - Kendala Anggaran',           value: 'Tidak Berminat Lanjut - Kendala Anggaran'           },
]

const formDirectCustomer = reactive({
  customer_id               : null,
  follow_up_type            : 'CALL',
  follow_up_at              : '',
  subject                   : '',
  subject_template_customer : '',
  notes                     : '',
  need_follow_up            : false,
  next_follow_up_at         : null,
})

const openDirectCustomerModal = async () => {
  Object.assign(formDirectCustomer, {
    customer_id: null, follow_up_type: 'CALL', follow_up_at: '',
    subject: '', subject_template_customer: '', notes: '',
    need_follow_up: false, next_follow_up_at: null,
  })
  await followUpStore.fetchCustomersDirectSelect()
  isDirectCustomerModalVisible.value = true
}

const closeDirectCustomerModal = () => {
  isDirectCustomerModalVisible.value = false
}

watch(() => formDirectCustomer.subject_template_customer, (val) => {
  if (val) formDirectCustomer.subject = val
})

const submitDirectCustomer = async () => {
  if (!formDirectCustomer.customer_id)   return toast.warning('Customer wajib dipilih')
  if (!formDirectCustomer.follow_up_type) return toast.warning('Type follow up wajib dipilih')
  if (!formDirectCustomer.subject)        return toast.warning('Subject wajib diisi')
  if (!formDirectCustomer.notes)          return toast.warning('Notes wajib diisi')

  const payload = {
    customer_id   : formDirectCustomer.customer_id,
    follow_up_type: formDirectCustomer.follow_up_type,
    subject       : formDirectCustomer.subject,
    notes         : formDirectCustomer.notes,
    follow_up_at  : formDirectCustomer.follow_up_at,
  }

  try {
    await followUpStore.storeDirectCustomer(payload)
    closeDirectCustomerModal()
    toast.success('Direct Follow Up customer berhasil dibuat!')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal membuat follow up')
  }
}

// ══════════════════════════════════════════════
//  MODAL: DETAIL FOLLOW UP
// ══════════════════════════════════════════════
const isDetailModalVisible = ref(false)

const openDetailModal = async (item) => {
  followUpStore.followUpDetail = null
  isDetailModalVisible.value   = true
  try {
    await followUpStore.detailFollowUp(item.id)
  } catch {
    toast.error('Gagal memuat detail follow up')
    isDetailModalVisible.value = false
  }
}

const closeDetailModal = () => {
  isDetailModalVisible.value = false
}

// ══════════════════════════════════════════════
//  MODAL: TIMELINE LEAD
// ══════════════════════════════════════════════
const isTimelineLeadModalVisible = ref(false)

const openTimelineLeadModal = async (item) => {
  followUpStore.clearTimeline()
  isTimelineLeadModalVisible.value = true
  await followUpStore.fetchTimelineLead(item.id)
}

// ══════════════════════════════════════════════
//  MODAL: TIMELINE CUSTOMER
// ══════════════════════════════════════════════
const isTimelineCustomerModalVisible = ref(false)

const openTimelineCustomerModal = async (item) => {
  isTimelineCustomerModalVisible.value = true
  await followUpStore.fetchTimelineCustomer(item.id)
}

// ══════════════════════════════════════════════
//  DELETE
// ══════════════════════════════════════════════
const handleDelete = async (item) => {
  const ok = await confirm({
    type       : 'danger',
    title      : 'Hapus Follow Up',
    message    : `Yakin ingin menghapus "${item.follow_up_code}"?`,
    detail     : 'Tindakan ini tidak bisa dibatalkan.',
    confirmText: 'Yes, Delete',
    cancelText : 'Cancel',
  })
  if (!ok) return

  try {
    await followUpStore.deleteFollowUp(item.id)
    toast.success('Follow up berhasil dihapus')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal menghapus follow up')
  }
}

// ══════════════════════════════════════════════
//  VISIT FROM FOLLOW UP
// ══════════════════════════════════════════════
// const createVisitFromFollowUp = (item) => {
//   if (!item.customer_id) {
//     return toast.warning('Customer tidak ditemukan untuk follow up ini')
//   }
//   router.push({
//     path : '/sales-visit-customers',
//     query: {
//       customer_id  : item.customer_id,
//       company_name : item.target_name,
//       from_followup: item.follow_up_code,
//     },
//   })
// }
const createVisitFromFollowUp = (item) => {
  if (!item.customer_id) {
    return toast.warning('Customer tidak ditemukan untuk follow up ini')
  }
  router.push('/app/sales-visit')
}

// ── RESET ──
const handleReset = () => {
  followUpStore.resetFilters()
}

// ── HELPER: FU TYPE ICON ──
const fuTypeIcon = (type) => {
  const map = {
    CALL    : 'fa-solid fa-phone',
    EMAIL   : 'fa-solid fa-envelope',
    WHATSAPP: 'fa-solid fa-comments',
    MEETING : 'fa-solid fa-users',
    VISIT   : 'fa-solid fa-location-dot',
    OTHER   : 'fa-solid fa-ellipsis',
  }
  return map[type] ?? 'fa-solid fa-ellipsis'
}

</script>

<template>
  <div class="h-100 d-flex flex-column">

    <!-- BREADCRUMB -->
    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="phone" /> Follow Up Management
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" /> Dashboard
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Follow Up Table</span>
        </div>
      </div>
    </div>

    <!-- TOOLBAR TOP -->
    <div class="toolbar-top">
      <div class="toolbar-left">

        <!-- ADD BUTTONS sesuai mode -->
        <template v-if="followUpStore.mode === 'leads'">

          <!-- <button class="btn-toolbar btn-purple" @click="openSubmitLeadModal({ id: null, follow_up_type: '', subject: '' })">
            <font-awesome-icon icon="plus" /> Add Follow Up Lead
          </button> -->

          <button v-if="canCreate" class="btn-toolbar btn-purple" @click="openDirectLeadModal">
            <font-awesome-icon icon="plus" /> Direct Lead Data
          </button>
        </template>

        <template v-if="followUpStore.mode === 'customers'">
          <button v-if="canCreate" class="btn-toolbar btn-purple" @click="openDirectCustomerModal">
            <font-awesome-icon icon="plus" /> Direct Customer
          </button>
        </template>

        <!-- MODE SWITCH -->
        <div class="drop-wrap">
          <button class="btn-toolbar btn-teal" @click="showModeMenu = !showModeMenu">
            <font-awesome-icon icon="filter" />
            Filter: {{ modeLabel }}
            <font-awesome-icon icon="chevron-down" class="btn-arrow" />
          </button>
          <div class="drop-menu" :class="{ show: showModeMenu }">
            <div class="drop-label">Filter By</div>
            <button class="drop-item" :class="{ active: followUpStore.mode === 'leads' }"
              @click="changeMode('leads')">
              <font-awesome-icon icon="user-plus" /> Leads
            </button>
            <button class="drop-item" :class="{ active: followUpStore.mode === 'customers' }"
              @click="changeMode('customers')">
              <font-awesome-icon icon="users" /> Customers
            </button>
          </div>
        </div>

      </div>

      <button class="btn-toolbar btn-orange" @click="handleReset">
        <font-awesome-icon icon="rotate-left" /> Reset
      </button>
    </div>

    <!-- CONTROLS -->
    <div class="controls-card">
      <div class="controls-row">
        <div class="controls-left">
          <div class="showing-wrap">
            <font-awesome-icon icon="list" class="text-muted-color" />
            <span class="showing-label">Showing:</span>
            <div class="drop-wrap">
              <button class="btn-select" @click="showPerPageMenu = !showPerPageMenu">
                {{ followUpStore.pagination.per_page }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showPerPageMenu }">
                <div class="drop-label">Per Halaman</div>
                <div class="perpage-grid">
                  <button
                    v-for="opt in [10, 25, 50, 100]" :key="opt"
                    class="perpage-opt"
                    :class="{ active: followUpStore.pagination.per_page === opt }"
                    @click="followUpStore.pagination.per_page = opt; showPerPageMenu = false; followUpStore.changePageSize()"
                  >{{ opt }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="controls-right">
          <div class="search-wrap">
            <input
              type="text"
              placeholder="Searching...."
              class="search-input"
              @input="e => followUpStore.searchWithDelay(e.target.value)"
            />
            <button class="search-btn"><font-awesome-icon icon="magnifying-glass" /></button>
          </div>
          <div class="sort-wrap">
            <span class="showing-label">Sort:</span>
            <div class="drop-wrap">
              <button class="btn-select" @click="showSortByMenu = !showSortByMenu">
                {{ sortByLabel }} <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showSortByMenu }">
                <div class="drop-label">Sort By</div>
                <button
                  v-for="opt in sortByOptions" :key="opt.value"
                  class="drop-item" :class="{ active: followUpStore.sort.column === opt.value }"
                  @click="followUpStore.sort.column = opt.value; showSortByMenu = false; followUpStore.changeSorting()"
                >{{ opt.label }}</button>
              </div>
            </div>
            <div class="drop-wrap">
              <button class="btn-select" @click="showSortDirMenu = !showSortDirMenu">
                {{ followUpStore.sort.direction === 'asc' ? 'Asc' : 'Desc' }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-right" :class="{ show: showSortDirMenu }">
                <div class="drop-label">Urutan</div>
                <button
                  v-for="opt in [{ label: 'Desc', value: 'desc' }, { label: 'Asc', value: 'asc' }]"
                  :key="opt.value"
                  class="drop-item"
                  :class="{ active: followUpStore.sort.direction === opt.value }"
                  @click="followUpStore.sort.direction = opt.value; showSortDirMenu = false; followUpStore.changeSorting()"
                >{{ opt.label }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TABLE -->
    <div class="table-card flex-grow-1 overflow-auto mb-3">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:50px">NO.</th>
            <th>Code Follow Up</th>
            <th>Type</th>
            <th>Subject</th>
            <th>Lead / Customer</th>
            <th>Status Follow Up</th>
            <th v-if="showVisitColumn">Status From Lead</th>
            <th>Tgl Dibuat</th>
            <th>Est. Follow Up</th>
            <th style="width:160px; text-align:center">ACTIONS</th>
          </tr>
        </thead>

        <!-- LOADING -->
        <tbody v-if="followUpStore.loadingFollowUp">
          <tr>
            <td colspan="10" class="td-center">
              <div style="display:flex;justify-content:center;">
                <div class="spinner-custom"></div>
              </div>
            </td>
          </tr>
        </tbody>

        <!-- EMPTY -->
        <tbody v-else-if="!followUpStore.followUpData.length">
          <tr>
            <td colspan="10" class="td-center">
             <div class="empty-state">
                <img src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif"
                  alt="No data" class="empty-img" />
                <div class="empty-text">No data found</div>
              </div>
            </td>
          </tr>
        </tbody>

        <!-- DATA -->
        <tbody v-else>
          <tr
            v-for="(item, index) in followUpStore.followUpData"
            :key="item.id"
            class="data-row"
            :class="{ 'row-overdue': item.is_overdue }"
          >
            <td class="td-no">
              {{ (followUpStore.pagination.current_page - 1) * followUpStore.pagination.per_page + index + 1 }}
            </td>

            <!-- CODE -->
            <td>
              <span class="code-badge">{{ item.follow_up_code }}</span>
            </td>

            <!-- TYPE -->
            <td>
              <span class="type-pill">
                <font-awesome-icon :icon="fuTypeIcon(item.follow_up_type)" />
                {{ item.follow_up_type }}
              </span>
            </td>

            <!-- SUBJECT -->
            <td class="td-subject">{{ item.subject }}</td>

            <!-- TARGET -->
            <td>
              <div class="fw-600">{{ item.target_name }}</div>
              <div class="td-muted">{{ item.target_source }}</div>
            </td>

            <!-- STATUS FOLLOW UP -->
            <td>
              <span class="status-badge"
                :class="item.computed_status === 'OVERDUE' ? 'status-danger'
                  : item.status === 'PENDING' ? 'status-warning' : 'status-success'">
                {{ item.computed_status }}
              </span>
            </td>

            <!-- LEAD STATUS (hanya mode leads) -->
            <td v-if="showVisitColumn">
              <span class="status-badge"
                :class="StatusConfigFromLeads[normalizeStatus(item.lead_status)]?.class || 'status-secondary'">
                <font-awesome-icon
                  :icon="StatusConfigFromLeads[normalizeStatus(item.lead_status)]?.icon || 'fa-solid fa-circle-info'"
                />
                {{ item.lead_status }}
              </span>
            </td>

            <!-- CREATED -->
            <td class="td-muted">{{ followUpStore.formatDate(item.created_at) }}</td>

            <!-- ESTIMATED -->
            <td>
              <span :class="item.is_overdue ? 'text-danger fw-600' : ''">
                {{ followUpStore.formatDate(item.follow_up_at) }}
              </span>
              <div v-if="item.is_overdue" class="overdue-hint">
                <font-awesome-icon icon="fa-bell" /> Overdue
              </div>
            </td>

            <!-- ACTIONS -->
            <td class="td-actions">
              <!-- Edit (hanya PENDING) -->
              <button
                 v-if="canUpdate && item.status === 'PENDING'"
                class="act-btn act-edit"
                title="Reschedule"
                @click="openEditModal(item)"
              >
                <font-awesome-icon icon="fa-pen-to-square" />
              </button>

              <!-- Delete (hanya PENDING) -->
              <button
                 v-if="canDelete && item.status === 'PENDING'"
                class="act-btn act-delete"
                title="Hapus"
                @click="handleDelete(item)"
              >
                <font-awesome-icon icon="fa-trash-can" />
              </button>

              <!-- Done badge -->
              <span v-if="!['PENDING'].includes(item.status)" class="status-badge status-success me-1">
                {{ item.status }}
              </span>

              <!-- Detail -->
              <button v-if="canView" class="act-btn act-info" title="Detail" @click="openDetailModal(item)">
                <font-awesome-icon icon="fa-eye" />
              </button>

              <!-- Timeline Lead -->
              <button
                v-if="showVisitColumn"
                class="act-btn act-timeline"
                title="Timeline Lead"
                @click="openTimelineLeadModal(item)"
              >
                <font-awesome-icon icon="fa-timeline" />
              </button>

              <!-- Timeline Customer -->
              <button
                v-if="!showVisitColumn"
                class="act-btn act-timeline"
                title="Timeline Customer"
                @click="openTimelineCustomerModal(item)"
              >
                <font-awesome-icon icon="fa-timeline" />
              </button>

              <!-- Action dropdown (customer mode) -->
              <div class="act-dropdown" v-if="showActionColumn && isActionable(item)">
                <button class="act-btn act-more" title="Action">
                  <font-awesome-icon icon="fa-solid fa-person-chalkboard" />
                </button>
                <div class="act-dropdown-menu">
                  <button class="act-dropdown-item" @click="createVisitFromFollowUp(item)">
                    <font-awesome-icon icon="fa-solid fa-location-dot" /> Visit Customer
                  </button>
                  <button class="act-dropdown-item" @click="openSubmitCustomerModal(item)">
                    <font-awesome-icon icon="fa-solid fa-check" /> Submit Result
                  </button>
                </div>
              </div>

              <!-- Submit result lead -->
              <button
                v-if="showVisitColumn && item.status === 'PENDING'"
                class="act-btn act-submit"
                title="Submit Result"
                @click="openSubmitLeadModal(item)"
              >
                <font-awesome-icon icon="fa-solid fa-paper-plane" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PAGINATION -->
    <div class="pagination-card">
      <div class="pagination-nav">
        <button
          class="btn-prev-next"
          :disabled="followUpStore.pagination.current_page === 1 || followUpStore.loadingFollowUp"
          @click="followUpStore.prevPage()"
        >
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button
          class="btn-prev-next"
          :disabled="followUpStore.pagination.current_page === followUpStore.pagination.last_page || followUpStore.loadingFollowUp"
          @click="followUpStore.nextPage()"
        >
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">{{ followUpStore.followUpData.length }} DATA | PAGE {{ followUpStore.pagination.current_page }}</span>
        <span class="page-badge">TOTAL: {{ followUpStore.pagination.total }}</span>
      </div>
    </div>


    <!-- ══════════════════════════════════════════
         MODAL: EDIT / RESCHEDULE
    ══════════════════════════════════════════ -->
    <AppModal
      :show="isEditModalVisible"
      title="Reschedule Follow Up"
      icon="pen"
      size="md"
      @close="closeEditModal"
    >
      <div class="form-container-gap">
        <div class="form-group">
          <label>Template Subject <span class="opt-label">(opsional)</span></label>
          <Multiselect
            v-model="formEdit.subject_template"
            :options="followUpStore.typeSubjectDirect"
            label="label"
            valueProp="value"
            placeholder="Pilih template subject"
            :searchable="true"
          />
        </div>
        <div class="form-group">
          <label>Subject <span class="req-label"></span></label>
          <input v-model="formEdit.subject" class="form-input" placeholder="Tulis subject..." />
        </div>
        <div class="form-group">
          <label>Follow Up Date <span class="opt-label">(opsional)</span></label>
          <input
                type="datetime-local"
                class="form-input datetime-input"
                :value="toNative(formEdit.follow_up_at)"
                :min="minDatetime"
                @change="e => formEdit.follow_up_at = fromNative(e.target.value)"
              />
        </div>
        <div class="form-group">
          <label>Notes <span class="opt-label">(opsional)</span></label>
          <textarea v-model="formEdit.notes" class="form-input form-textarea" rows="3" />
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeEditModal">Cancel</button>
        <button class="btn-save" :disabled="followUpStore.updatingFollowUp" @click="submitEdit">
          <font-awesome-icon icon="check" />
          {{ followUpStore.updatingFollowUp ? 'Menyimpan...' : 'Update' }}
        </button>
      </template>
    </AppModal>


    <!-- ══════════════════════════════════════════
         MODAL: SUBMIT RESULT LEAD
    ══════════════════════════════════════════ -->
    <AppModal
      :show="isSubmitLeadModalVisible"
      title="Submit Result Follow Up Lead"
      icon="paper-plane"
      size="lg"
      @close="closeSubmitLeadModal"
    >
      <div class="form-container-gap">

        <div class="form-group">
          <label>Result Status <span class="req-label">*</span></label>
          <select v-model="formLead.status" class="form-input form-select">
            <option value="">-- Pilih Status --</option>
            <option value="PENDING">PENDING (Jadwal Follow Up Lanjutan)</option>
            <option value="DONE">DONE / FAILED</option>
          </select>
        </div>

        <!-- DONE ACTION -->
        <transition name="fade">
          <div v-if="formLead.status === 'DONE'" class="action-box action-box-success">
            <div class="action-box-title">Action setelah Done:</div>
            <div class="radio-group">
              <label class="radio-item">
                <input type="radio" v-model="formLead.done_action" value="convert" />
                <span>Convert to Customer</span>
              </label>
              <label class="radio-item">
                <input type="radio" v-model="formLead.done_action" value="failed" />
                <span>Mark Lead as Failed</span>
              </label>
            </div>
            <small class="text-muted-sm">*Semua data follow-up Lead ini akan ditandai DONE.</small>
          </div>
        </transition>

        <!-- PENDING: UPDATE CATEGORY -->
        <transition name="fade">
          <div v-if="formLead.status === 'PENDING'" class="action-box action-box-warning">
            <div class="action-box-title">Update Lead Category <span class="opt-label">(opsional)</span></div>
            <select v-model="formLead.lead_category" class="form-input form-select">
              <option value="">-- Keep Current --</option>
              <option value="potential_customers">Potential Customers</option>
              <option value="consideration_stage">Consideration Stage</option>
              <option value="prospective_customers">Prospective Customers</option>
            </select>
          </div>
        </transition>

        <div class="form-group">
          <label>Follow Up Type <span class="req-label">*</span></label>
          <Multiselect
            v-model="formLead.follow_up_type"
            :options="followUpStore.typeFollowUp"
            label="label"
            valueProp="value"
            placeholder="Pilih tipe follow up"
          />
        </div>

        <div class="form-group">
          <label>Follow Up Date <span class="req-label">*</span></label>
          <input
                type="datetime-local"
                class="form-input datetime-input"
                :value="toNative(formLead.follow_up_at)"
                :min="minDatetime"
                @change="e => formLead.follow_up_at = fromNative(e.target.value)"
              />
        </div>

        <div class="form-group">
          <label>Template Subject <span class="opt-label">(opsional)</span></label>
          <Multiselect
            v-model="formLead.subject_template"
            :options="followUpStore.typeSubjectDirect"
            label="label"
            valueProp="value"
            placeholder="Pilih template"
            :searchable="true"
          />
        </div>

        <div class="form-group">
          <label>Subject <span class="req-label">*</span></label>
          <input v-model="formLead.subject" class="form-input" placeholder="Tulis subject..." />
        </div>

        <div class="form-group">
          <label>Notes <span class="opt-label">(opsional)</span></label>
          <textarea v-model="formLead.notes" class="form-input form-textarea" rows="3" />
        </div>

      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeSubmitLeadModal">Cancel</button>
        <button class="btn-save" :disabled="followUpStore.submittingResult" @click="submitLeadResult">
          <font-awesome-icon icon="paper-plane" />
          {{ followUpStore.submittingResult ? 'Menyimpan...' : 'Save & Sync' }}
        </button>
      </template>
    </AppModal>


    <!-- ══════════════════════════════════════════
         MODAL: SUBMIT RESULT CUSTOMER
    ══════════════════════════════════════════ -->
    <AppModal
      :show="isSubmitCustomerModalVisible"
      title="Submit Follow Up Result"
      icon="clipboard-check"
      size="lg"
      @close="closeSubmitCustomerModal"
    >
      <div class="form-container-gap">

        <div class="form-group">
          <label>Result <span class="req-label">*</span></label>
          <Multiselect
            v-model="resultForm.result"
            :options="followUpStore.resultSubmit"
            label="label"
            valueProp="value"
            placeholder="Pilih Result Follow Up..."
            :searchable="true"
          >
            <template #option="{ option }">
              <div class="d-flex justify-content-between align-items-center w-100">
                <span>{{ option.label }}</span>
                <span v-if="option.description" :title="option.description" style="cursor:help; color:var(--text-muted)">
                  <font-awesome-icon icon="fa-solid fa-circle-info" />
                </span>
              </div>
            </template>
          </Multiselect>
        </div>

        <div class="form-group">
          <label>Notes <span class="opt-label">(opsional)</span></label>
          <textarea v-model="resultForm.notes" class="form-input form-textarea" rows="3" placeholder="Tulis catatan hasil follow up..." />
        </div>

        <!-- NEXT FOLLOW UP -->
        <transition name="fade">
          <div
            v-if="showNextFollowUp"
            class="action-box"
            :class="isNextFollowUpRequired ? 'action-box-primary' : 'action-box-secondary'"
          >
            <div class="action-box-title">
              <font-awesome-icon icon="fa-regular fa-calendar-plus" />
              Jadwalkan Follow Up Berikutnya
              <span v-if="!isNextFollowUpRequired" class="opt-label">(opsional)</span>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label>Tanggal Follow Up <span v-if="isNextFollowUpRequired" class="req-label">*</span></label>
                <input
                type="datetime-local"
                class="form-input datetime-input"
                :value="toNative(resultForm.next_follow_up_at)"
                :min="minDatetime"
                @change="e => resultForm.next_follow_up_at = fromNative(e.target.value)"
              />
              </div>
              <div class="form-group">
                <label>Type Follow Up <span class="opt-label">(opsional)</span></label>
                <Multiselect
                  v-model="resultForm.follow_up_type"
                  :options="followUpStore.typeFollowUp"
                  label="label"
                  valueProp="value"
                  placeholder="Pilih type"
                  :searchable="true"
                />
              </div>
            </div>
          </div>
        </transition>

        <!-- INFO ALERTS -->
        <div v-if="resultForm.result === 'dealing'"    class="info-alert info-warning">
          <font-awesome-icon icon="fa-solid fa-handshake" /> <strong>Negotiation Stage!</strong> Jadwalkan follow up lanjutan untuk monitoring.
        </div>
        <div v-else-if="resultForm.result === 'no_meet'" class="info-alert info-secondary">
          <font-awesome-icon icon="fa-solid fa-phone-slash" /> <strong>Tidak Berhasil Dihubungi.</strong> Isi tanggal jika ingin retry.
        </div>
        <div v-else-if="resultForm.result === 'closed'"  class="info-alert info-success">
          <font-awesome-icon icon="fa-solid fa-circle-check" /> <strong>Deal Closed!</strong> Semua follow up aktif akan ditutup otomatis.
        </div>
        <div v-else-if="resultForm.result === 'cancelled'" class="info-alert info-danger">
          <font-awesome-icon icon="fa-solid fa-triangle-exclamation" /> <strong>Opportunity Lost!</strong> Semua follow up aktif akan dibatalkan.
        </div>

      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeSubmitCustomerModal">Cancel</button>
        <button class="btn-save" :disabled="followUpStore.submittingResult" @click="submitCustomerResult">
          <font-awesome-icon icon="paper-plane" />
          {{ followUpStore.submittingResult ? 'Submitting...' : 'Submit Result' }}
        </button>
      </template>
    </AppModal>


    <!-- ══════════════════════════════════════════
         MODAL: DIRECT FOLLOW UP LEAD
    ══════════════════════════════════════════ -->
    <AppModal
      :show="isDirectLeadModalVisible"
      title="Direct Follow Up Lead"
      icon="user-plus"
      size="lg"
      @close="closeDirectLeadModal"
    >
      <div class="form-container-gap">

        <div class="form-group">
          <label>Lead <span class="req-label">*</span></label>
          <Multiselect
            v-model="formDirectLead.lead_id"
            :options="followUpStore.leadsDirectData"
            label="company_name"
            valueProp="lead_id"
            :object="false"
            placeholder="Select Lead..."
            :searchable="true"
            :loading="followUpStore.loadingLeadsDirect"
          />
        </div>

        <div class="form-group">
          <label>Follow Up Date <span class="opt-label">(opsional)</span></label>
          <input
                type="datetime-local"
                class="form-input datetime-input"
                :value="toNative(formDirectLead.follow_up_at)"
                :min="minDatetime"
                @change="e => formDirectLead.follow_up_at = fromNative(e.target.value)"
              />
        </div>

        <div class="form-group">
          <label>Type Follow Up <span class="req-label">*</span></label>
          <Multiselect
            v-model="formDirectLead.follow_up_type"
            :options="followUpStore.typeFollowUp"
            label="label"
            valueProp="value"
            placeholder="Pilih tipe"
          />
        </div>

        <div class="form-group">
          <label>Template Subject <span class="opt-label">(opsional)</span></label>
          <Multiselect
            v-model="formDirectLead.subject_template_direct"
            :options="followUpStore.typeSubjectDirect"
            label="label"
            valueProp="value"
            placeholder="Pilih template"
            :searchable="true"
          />
        </div>

        <div class="form-group">
          <label>Subject <span class="req-label">*</span></label>
          <input v-model="formDirectLead.subject" class="form-input" placeholder="Tulis subject..." />
        </div>

        <div class="form-group">
          <label>Notes <span class="opt-label">(opsional)</span></label>
          <textarea v-model="formDirectLead.notes" class="form-input form-textarea" rows="3" />
        </div>

      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeDirectLeadModal">Cancel</button>
        <button class="btn-save" :disabled="followUpStore.submittingDirect" @click="submitDirectLead">
          <font-awesome-icon icon="paper-plane" />
          {{ followUpStore.submittingDirect ? 'Menyimpan...' : 'Save & Sync' }}
        </button>
      </template>
    </AppModal>


    <!-- ══════════════════════════════════════════
         MODAL: DIRECT FOLLOW UP CUSTOMER
    ══════════════════════════════════════════ -->
    <AppModal
      :show="isDirectCustomerModalVisible"
      title="Direct Follow Up Customer"
      icon="phone"
      size="lg"
      @close="closeDirectCustomerModal"
    >
      <div class="form-container-gap">

        <div class="form-group">
          <label>Customer <span class="req-label">*</span></label>
          <Multiselect
            v-model="formDirectCustomer.customer_id"
            :options="followUpStore.customersDirectData"
            label="company_name"
            valueProp="customer_id"
            :object="false"
            placeholder="Select Customer..."
            :searchable="true"
            :loading="followUpStore.loadingCustomersDirect"
          />
        </div>

        <!-- TYPE RADIO BUTTON -->
        <div class="form-group">
          <label>Type Follow Up <span class="req-label">*</span></label>
          <div class="type-radio-group">
            <template v-for="type in followUpTypes" :key="type.value">
              <input type="radio" :id="`type-${type.value}`" :value="type.value" v-model="formDirectCustomer.follow_up_type" class="hidden-radio" />
              <label :for="`type-${type.value}`" class="type-radio-btn">
                <font-awesome-icon :icon="type.icon" />
                {{ type.label }}
              </label>
            </template>
          </div>
        </div>

        <div class="form-group">
          <label>Template Subject <span class="opt-label">(opsional)</span></label>
          <Multiselect
            v-model="formDirectCustomer.subject_template_customer"
            :options="subjectTemplatesCustomers"
            label="label"
            valueProp="value"
            placeholder="Pilih template"
            :searchable="true"
          />
        </div>

        <div class="form-group">
          <label>Subject <span class="req-label">*</span></label>
          <input v-model="formDirectCustomer.subject" class="form-input" placeholder="Tulis subject..." />
        </div>

        <div class="form-group">
          <label>Follow Up Date <span class="req-label">*</span></label>
          <input
                type="datetime-local"
                class="form-input datetime-input"
                :value="toNative(formDirectCustomer.follow_up_at)"
                :min="minDatetime"
                @change="e => formDirectCustomer.follow_up_at = fromNative(e.target.value)"
              />
        </div>

        <div class="form-group">
          <label>Notes / Discussion Results <span class="req-label">*</span></label>
          <textarea v-model="formDirectCustomer.notes" class="form-input form-textarea" rows="4" placeholder="Hasil pembicaraan, rencana selanjutnya..." />
        </div>

        <div class="form-group">
          <div class="toggle-switch-wrap">
            <input type="checkbox" v-model="formDirectCustomer.need_follow_up" id="needFollowUp" class="toggle-switch-input" />
            <label for="needFollowUp" class="toggle-switch-label">
              <font-awesome-icon icon="fa-solid fa-calendar-plus" /> Schedule Next Follow Up
            </label>
          </div>
        </div>

        <transition name="fade">
          <div v-if="formDirectCustomer.need_follow_up" class="form-group">
            <label>Next Follow Up Date</label>
            <input
                type="datetime-local"
                class="form-input datetime-input"
                :value="toNative(formDirectCustomer.next_follow_up_at)"
                :min="minDatetime"
                @change="e => formDirectCustomer.next_follow_up_at = fromNative(e.target.value)"
              />
          </div>
        </transition>

      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeDirectCustomerModal">Cancel</button>
        <button class="btn-save" :disabled="followUpStore.submittingDirect" @click="submitDirectCustomer">
          <font-awesome-icon icon="paper-plane" />
          {{ followUpStore.submittingDirect ? 'Submitting...' : 'Submit Follow Up' }}
        </button>
      </template>
    </AppModal>


    <!-- ══════════════════════════════════════════
         MODAL: DETAIL FOLLOW UP
    ══════════════════════════════════════════ -->
    <AppModal
      :show="isDetailModalVisible"
      title="Detail Follow Up"
      icon="circle-info"
      size="xl"
      @close="closeDetailModal"
    >
      <div v-if="followUpStore.loadingDetail" class="td-center">
        <font-awesome-icon icon="fa-solid fa-spinner" spin style="font-size:1.4rem; color:#6366f1" />
      </div>

      <div v-else-if="followUpStore.followUpDetail">

        <!-- HEADER ALERT -->
        <div class="detail-header-alert">
          <div>
            <strong>{{ followUpStore.followUpDetail.follow_up_code }}</strong>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px">
              {{ followUpStore.followUpDetail?.customer_company_name ?? followUpStore.followUpDetail?.lead_company_name }}
            </div>
          </div>
          <span class="status-badge" :class="getFollowUpStatus(followUpStore.followUpDetail.computed_status).class">
            {{ getFollowUpStatus(followUpStore.followUpDetail.computed_status).label }}
          </span>
        </div>

        <!-- DETAIL FIELDS -->
        <div class="detail-grid">
          <div class="detail-row">
            <span class="detail-label">Follow Up Type</span>
            <span class="detail-value">{{ followUpStore.followUpDetail.follow_up_type }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Sales</span>
            <span class="detail-value">{{ followUpStore.followUpDetail.sales_name }}</span>
          </div>
          <div class="detail-row" style="grid-column:1/-1">
            <span class="detail-label">Subject</span>
            <span class="detail-value">{{ followUpStore.followUpDetail.subject }}</span>
          </div>
          <div class="detail-row" style="grid-column:1/-1">
            <span class="detail-label">Notes</span>
            <span class="detail-value" style="white-space:pre-wrap">{{ followUpStore.followUpDetail.notes || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Est. Follow Up</span>
            <span class="detail-value">{{ followUpStore.formatDates(followUpStore.followUpDetail.follow_up_at) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Created</span>
            <span class="detail-value">{{ followUpStore.formatDates(followUpStore.followUpDetail.created_at) }}</span>
          </div>
        </div>

        <!-- COMPLAINT -->
        <template v-if="followUpStore.followUpDetail.complaint_details?.some(c => c.complaint_detail)">
          <div class="section-title danger mt-4">
            <font-awesome-icon icon="fa-solid fa-triangle-exclamation" /> Complaint From Visits
          </div>
          <div
            v-for="c in followUpStore.followUpDetail.complaint_details.filter(x => x.complaint_detail)"
            :key="'c-' + c.visit_id"
            class="timeline-card border-danger"
          >
            <div class="timeline-card-header">
              <strong>{{ c.visit_code }}</strong>
              <small>{{ followUpStore.formatDates(c.created_at) }}</small>
            </div>
            <span class="status-badge status-danger mb-2" style="display:inline-block">Complaint</span>
            <p>{{ c.complaint_detail }}</p>
            <small class="td-muted">Check In: {{ followUpStore.formatDates(c.check_in_at) }} | Check Out: {{ followUpStore.formatDates(c.check_out_at) }}</small>
          </div>
        </template>

        <!-- POTENTIAL ORDER -->
        <template v-if="followUpStore.followUpDetail.complaint_details?.some(c => c.has_potential_order)">
          <div class="section-title success mt-4">
            <font-awesome-icon icon="fa-solid fa-box" /> Potential Order From Visits
          </div>
          <div
            v-for="v in followUpStore.followUpDetail.complaint_details.filter(x => x.has_potential_order)"
            :key="'p-' + v.visit_id"
            class="timeline-card border-success"
          >
            <div class="timeline-card-header">
              <strong>{{ v.visit_code }}</strong>
              <small>{{ followUpStore.formatDates(v.created_at) }}</small>
            </div>
            <span class="status-badge status-success mb-2" style="display:inline-block">Potential Order</span>
            <p>{{ v.potential_order_detail }}</p>
          </div>
        </template>

        <!-- ACTIVITY TIMELINE -->
        <template v-if="followUpStore.followUpDetail.activities?.length">
          <div class="section-title primary mt-4">
            <font-awesome-icon icon="fa-solid fa-clock-rotate-left" /> Activity Timeline
          </div>
          <div
            v-for="activity in followUpStore.followUpDetail.activities"
            :key="activity.id"
            class="activity-item"
          >
            <div class="activity-item-header">
              <strong>{{ activity.title }}</strong>
              <small>{{ followUpStore.formatDates(activity.activity_at) }}</small>
            </div>
            <div class="td-muted">{{ activity.description }}</div>
          </div>
        </template>

      </div>

      <div v-else class="td-center">Data tidak ditemukan</div>

      <template #footer>
        <button class="btn-cancel" @click="closeDetailModal">Close</button>
      </template>
    </AppModal>


    <!-- ══════════════════════════════════════════
         MODAL: TIMELINE LEAD
    ══════════════════════════════════════════ -->
    <AppModal
      :show="isTimelineLeadModalVisible"
      title="Lead Journey"
      icon="clock-rotate-left"
      size="lg"
      @close="isTimelineLeadModalVisible = false"
    >
      <div v-if="followUpStore.loadingTimeline" class="td-center">
        <font-awesome-icon icon="fa-solid fa-spinner" spin style="font-size:1.4rem; color:#6366f1" />
      </div>

      <div v-else-if="!followUpStore.timeline.length" class="td-center">No Activity Found</div>

      <div v-else>
        <div class="timeline-summary">
          <span class="status-badge status-danger">{{ followUpStore.timeline.length }} Activities</span>
          <span class="status-badge status-primary">
            {{ [...new Set(followUpStore.timeline.map(h => h.follow_up_code))].length }} Follow Ups
          </span>
        </div>
        <div class="timeline-wrapper" style="--line-color:#dc2626">
          <div v-for="(item, i) in followUpStore.timeline" :key="i" class="timeline-step">
            <div class="timeline-dot"
              :class="{
                'dot-danger' : item.type === 'CREATE',
                'dot-warning': item.type === 'AUTO_CLOSE',
                'dot-success': item.type === 'COMPLETE',
                'dot-primary': !['CREATE','AUTO_CLOSE','COMPLETE'].includes(item.type),
              }"
            >
              <font-awesome-icon
                :icon="item.type === 'CREATE' ? 'plus'
                  : item.type === 'AUTO_CLOSE' ? 'xmark'
                  : item.type === 'COMPLETE' ? 'check'
                  : 'list-check'"
                style="color:#fff; font-size:0.7rem"
              />
            </div>
            <div class="timeline-card">
              <div class="timeline-card-header">
                <strong>{{ item.activity }}</strong>
                <small>{{ item.activity_at }}</small>
              </div>
              <div style="display:flex; gap:6px; margin-bottom:6px; flex-wrap:wrap">
                <span class="status-badge status-danger">📋 Follow Up</span>
                <span v-if="item.follow_up_code" class="status-badge status-secondary">{{ item.follow_up_code }}</span>
              </div>
              <p class="td-muted" style="margin:0">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn-cancel" @click="isTimelineLeadModalVisible = false">Close</button>
      </template>
    </AppModal>


    <!-- ══════════════════════════════════════════
         MODAL: TIMELINE CUSTOMER
    ══════════════════════════════════════════ -->
    <AppModal
      :show="isTimelineCustomerModalVisible"
      title="Customer Journey"
      icon="clock-rotate-left"
      size="lg"
      @close="isTimelineCustomerModalVisible = false"
    >
      <div v-if="followUpStore.loadingCustomerTimeline" class="td-center">
        <font-awesome-icon icon="fa-solid fa-spinner" spin style="font-size:1.4rem; color:#6366f1" />
      </div>

      <div v-else-if="!followUpStore.customerTimeline.length" class="td-center">No Activity Found</div>

      <div v-else>
        <div class="timeline-summary">
          <span class="status-badge status-primary">{{ followUpStore.customerTimeline.filter(h => h.source === 'FOLLOW_UP').length }} Activities</span>
          <span class="status-badge status-success">{{ followUpStore.customerTimeline.filter(h => h.source === 'VISIT').length }} Visits</span>
          <span class="status-badge status-danger">{{ followUpStore.customerTimeline.filter(h => h.has_complaint).length }} Complaints</span>
          <span class="status-badge status-warning">{{ followUpStore.customerTimeline.filter(h => h.has_potential_order).length }} Potential Orders</span>
        </div>

        <div class="timeline-wrapper" style="--line-color:#6366f1">
          <div v-for="(item, i) in followUpStore.customerTimeline" :key="i" class="timeline-step">
            <div class="timeline-dot"
              :class="{
                'dot-primary' : item.source === 'FOLLOW_UP',
                'dot-success' : item.source === 'VISIT' && !item.has_complaint && !item.has_potential_order,
                'dot-danger'  : item.has_complaint,
                'dot-warning' : item.has_potential_order && !item.has_complaint,
              }"
            >
              <font-awesome-icon
                :icon="item.has_complaint ? 'triangle-exclamation'
                  : item.has_potential_order ? 'sack-dollar'
                  : item.source === 'VISIT' ? 'building'
                  : 'list-check'"
                style="color:#fff; font-size:0.7rem"
              />
            </div>
            <div class="timeline-card">
              <div class="timeline-card-header">
                <strong>{{ item.title }}</strong>
                <small>{{ item.activity_at }}</small>
              </div>
              <div style="display:flex; gap:6px; margin-bottom:6px; flex-wrap:wrap">
                <span class="status-badge" :class="item.source === 'VISIT' ? 'status-success' : 'status-primary'">
                  {{ item.source === 'VISIT' ? '🏢 Visit' : '📋 Follow Up' }}
                </span>
                <span v-if="item.follow_up_code" class="status-badge status-secondary">{{ item.follow_up_code }}</span>
                <span v-if="item.visit_code" class="status-badge status-secondary">{{ item.visit_code }}</span>
              </div>
              <p class="td-muted" style="margin:0 0 8px">{{ item.description }}</p>

              <template v-if="item.source === 'VISIT'">
                <div style="font-size:0.75rem; display:flex; gap:16px; margin-bottom:6px">
                  <span><font-awesome-icon icon="fa-solid fa-right-to-bracket" style="color:#16a34a" /> {{ item.check_in_at ?? '-' }}</span>
                  <span><font-awesome-icon icon="fa-solid fa-right-from-bracket" style="color:#dc2626" /> {{ item.check_out_at ?? '-' }}</span>
                </div>
                <div v-if="item.has_complaint" class="info-alert info-danger" style="font-size:0.8rem">
                  <font-awesome-icon icon="triangle-exclamation" /> {{ item.complaint_detail }}
                </div>
                <div v-if="item.has_potential_order" class="info-alert info-success" style="font-size:0.8rem">
                  <font-awesome-icon icon="fa-solid fa-sack-dollar" /> {{ item.potential_order_detail }}
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn-cancel" @click="isTimelineCustomerModalVisible = false">Close</button>
      </template>
    </AppModal>

  </div>
</template>



<style scoped>
.h-100 {
  --text-muted: #64748b;
  --primary-color: #6366f1;
}
.form-container-gap { display: flex; flex-direction: column; gap: 14px; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

/* BREADCRUMB */
.breadcrumb-card { background: var(--bg-card); border-radius: 10px; padding: 16px 18px; box-shadow: 0 1px 3px var(--shadow-color); }
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

/* TOOLBAR */
.toolbar-top { display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); border-radius: 10px; padding: 12px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); flex-wrap: wrap; gap: 8px; }
.toolbar-left { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-toolbar { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: none; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; transition: all 0.18s; white-space: nowrap; }
.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover { background: #4f46e5; }
.btn-orange { background: #f59e0b; color: #fff; }
.btn-orange:hover { background: #d97706; }
.btn-teal   { background: #0d9488; color: #fff; }
.btn-teal:hover { background: #0f766e; }
.btn-arrow  { font-size: 0.6rem; opacity: 0.7; }

/* CONTROLS */
.controls-card { background: var(--bg-card); border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); }
.controls-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.controls-left, .controls-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.showing-wrap { display: flex; align-items: center; gap: 6px; font-size: 0.84rem; color: var(--text-primary); font-weight: 600; }
.showing-label { white-space: nowrap; color: var(--text-muted); font-size: 0.83rem; }
.text-muted-color { color: var(--text-muted); }
.search-wrap { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.search-input { padding: 7px 12px; border: none; background: transparent; color: var(--text-primary); font-size: 0.84rem; outline: none; width: 200px; }
.search-input::placeholder { color: var(--text-muted); }
.search-btn { padding: 7px 12px; background: #6366f1; color: #fff; border: none; cursor: pointer; }
.sort-wrap { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

/* DROPDOWN */
.drop-wrap { position: relative; }
.btn-select { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.83rem; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
.btn-select:hover { border-color: #6366f1; color: #6366f1; }
.drop-menu { position: absolute; top: calc(100% + 6px); left: 0; min-width: 160px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 10px; z-index: 200; opacity: 0; transform: translateY(-6px); pointer-events: none; transition: all 0.18s; }
.drop-right { left: auto; right: 0; }
.drop-menu.show { opacity: 1; transform: translateY(0); pointer-events: all; }
.drop-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; padding: 0 4px; }
.drop-item { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: none; border: none; border-radius: 7px; color: var(--text-primary); font-size: 0.84rem; cursor: pointer; text-align: left; }
.drop-item:hover { background: var(--bg-nav-hover); }
.drop-item.active { color: #6366f1; font-weight: 600; background: rgba(99,102,241,0.08); }
.perpage-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.perpage-opt { padding: 5px 10px; border: 1px solid var(--border-main); border-radius: 6px; background: var(--bg-input); color: var(--text-primary); font-size: 0.82rem; cursor: pointer; }
.perpage-opt.active { background: #6366f1; border-color: #6366f1; color: #fff; font-weight: 700; }

/* TABLE */
.table-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.data-table thead tr { background: var(--bg-input); border-bottom: 2px solid var(--border-main); position: sticky; top: 0; z-index: 2; }
.data-table th { padding: 12px 18px; text-align: left; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap; }
.data-table tbody tr { border-bottom: 1px solid var(--border-main); transition: background 0.15s; }
.data-table tbody tr:last-child { border-bottom: none; }
.data-row:hover { background: var(--bg-nav-hover); }
.data-table td { padding: 12px 18px; vertical-align: middle; color: var(--text-primary); }
.row-overdue { background: rgba(239,68,68,0.04) !important; border-left: 3px solid #ef4444; }
.td-no { color: var(--text-muted); font-weight: 600; }
.td-muted { color: var(--text-muted); font-size: 0.82rem; }
.td-center { text-align: center; padding: 40px; color: var(--text-muted); }
.td-actions { text-align: center; white-space: nowrap; }
.td-subject { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fw-600 { font-weight: 600; }

/* CODE BADGE */
.code-badge { font-family: monospace; font-size: 0.78rem; font-weight: 700; background: rgba(99,102,241,0.1); color: #6366f1; padding: 2px 8px; border-radius: 6px; white-space: nowrap; }

/* TYPE PILL */
.type-pill { display: inline-flex; align-items: center; gap: 5px; font-size: 0.75rem; font-weight: 600; padding: 3px 8px; border-radius: 20px; background: var(--bg-input); color: var(--text-muted); border: 1px solid var(--border-main); }

/* STATUS BADGES */
.status-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 0.7rem; font-weight: 700; padding: 3px 8px; border-radius: 20px; white-space: nowrap; }
.status-success  { background: rgba(34,197,94,0.12);  color: #16a34a; }
.status-warning  { background: rgba(245,158,11,0.12); color: #d97706; }
.status-danger   { background: rgba(239,68,68,0.12);  color: #dc2626; }
.status-primary  { background: rgba(99,102,241,0.12); color: #6366f1; }
.status-info     { background: rgba(6,182,212,0.12);  color: #0891b2; }
.status-secondary{ background: rgba(100,116,139,0.12);color: #475569; }
.status-dark     { background: rgba(15,23,42,0.1);    color: #0f172a; }

/* OVERDUE */
.overdue-hint { font-size: 0.7rem; color: #dc2626; margin-top: 3px; }
.text-danger  { color: #dc2626; }

/* ACTION BUTTONS */
.act-btn { width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.78rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s; margin: 0 2px; background: transparent; }
.act-edit     { color: #f59e0b; border-color: #f59e0b; }
.act-edit:hover { background: #f59e0b; color: #fff; }
.act-delete   { color: #ef4444; border-color: #ef4444; }
.act-delete:hover { background: #ef4444; color: #fff; }
.act-info     { color: #6366f1; border-color: #6366f1; }
.act-info:hover { background: #6366f1; color: #fff; }
.act-timeline { color: #0d9488; border-color: #0d9488; }
.act-timeline:hover { background: #0d9488; color: #fff; }
.act-submit   { color: #7c3aed; border-color: #7c3aed; }
.act-submit:hover { background: #7c3aed; color: #fff; }
.act-more     { color: #0891b2; border-color: #0891b2; }
.act-more:hover { background: #0891b2; color: #fff; }

/* ACTION DROPDOWN */
.act-dropdown { position: relative; display: inline-block; }
.act-dropdown-menu { position: absolute; top: calc(100% + 4px); right: 0; min-width: 160px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 8px; z-index: 100; display: none; }
.act-dropdown:hover .act-dropdown-menu { display: block; }
.act-dropdown-item { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: none; border: none; border-radius: 7px; color: var(--text-primary); font-size: 0.83rem; cursor: pointer; }
.act-dropdown-item:hover { background: var(--bg-nav-hover); }

/* PAGINATION */
.pagination-card { background: var(--bg-card); border-radius: 10px; padding: 14px 18px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: row-reverse; align-items: center; justify-content: space-between; gap: 12px; }
.pagination-nav { display: flex; align-items: center; gap: 8px; }
.btn-prev-next { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; min-width: 85px; justify-content: center; transition: background 0.18s; }
.btn-prev-next:hover:not(:disabled) { background: #4f46e5; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badges { display: flex; gap: 8px; align-items: center; }
.page-badge { padding: 7px 14px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); background: var(--bg-input); white-space: nowrap; }

/* FORM */
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.form-input { padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.875rem; background: var(--bg-input); color: var(--text-primary); outline: none; transition: border 0.18s; width: 100%; box-sizing: border-box; }
.form-input:focus { border-color: #6366f1; }
.form-textarea { resize: none; min-height: 90px; line-height: 1.5; }
.form-select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 12px center; background-size: 1.25rem; padding-right: 40px; }
.req-label { color: #ef4444; font-size: 0.7rem; }
.opt-label { color: var(--text-muted); font-size: 0.7rem; font-weight: 500; text-transform: none; }
.text-muted-sm { font-size: 0.75rem; color: var(--text-muted); }

/* ACTION BOX */
.action-box { padding: 14px; border-radius: 10px; border: 1px solid; margin-top: 2px; }
.action-box-success  { background: rgba(34,197,94,0.06);  border-color: rgba(34,197,94,0.3); }
.action-box-warning  { background: rgba(245,158,11,0.06); border-color: rgba(245,158,11,0.3); }
.action-box-primary  { background: rgba(99,102,241,0.06); border-color: rgba(99,102,241,0.3); }
.action-box-secondary{ background: rgba(100,116,139,0.06);border-color: rgba(100,116,139,0.3); }
.action-box-title { font-size: 0.82rem; font-weight: 700; margin-bottom: 10px; color: var(--text-primary); }
.radio-group { display: flex; gap: 20px; flex-wrap: wrap; }
.radio-item { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; cursor: pointer; }

/* TYPE RADIO */
.type-radio-group { display: flex; gap: 8px; flex-wrap: wrap; }
.hidden-radio { display: none; }
.type-radio-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border: 1.5px solid var(--border-main); border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; color: var(--text-muted); transition: all 0.18s; background: var(--bg-input); }
.hidden-radio:checked + .type-radio-btn { background: #6366f1; color: #fff; border-color: #6366f1; }

/* TOGGLE SWITCH */
.toggle-switch-wrap { display: flex; align-items: center; gap: 10px; }
.toggle-switch-input { width: 36px; height: 20px; cursor: pointer; accent-color: #6366f1; }
.toggle-switch-label { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; gap: 6px; }

/* INFO ALERTS */
.info-alert { padding: 10px 14px; border-radius: 8px; font-size: 0.83rem; display: flex; align-items: flex-start; gap: 8px; }
.info-warning  { background: rgba(245,158,11,0.1);  color: #92400e; }
.info-secondary{ background: rgba(100,116,139,0.1); color: #475569; }
.info-success  { background: rgba(34,197,94,0.1);   color: #166534; }
.info-danger   { background: rgba(239,68,68,0.1);   color: #991b1b; }

/* MODAL FOOTER BUTTONS */
.btn-cancel { padding: 8px 18px; background: var(--bg-main, #f1f5f9); color: var(--text-muted); border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { background: var(--border-main); color: var(--text-primary); }
.btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-save:hover:not(:disabled) { background: #4f46e5; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

/* DETAIL MODAL */
.detail-header-alert { display: flex; justify-content: space-between; align-items: flex-start; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); border-radius: 10px; padding: 14px 16px; margin-bottom: 16px; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
.detail-row { display: flex; flex-direction: column; gap: 4px; padding: 12px 0; border-bottom: 1px solid var(--border-main); }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.detail-value { font-size: 0.85rem; color: var(--text-primary); font-weight: 500; }
.section-title { font-size: 0.9rem; font-weight: 700; display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.section-title.danger  { color: #dc2626; }
.section-title.success { color: #16a34a; }
.section-title.primary { color: #6366f1; }

/* TIMELINE */
.timeline-summary { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
.timeline-wrapper { position: relative; padding-left: 44px; }
.timeline-wrapper::before { content: ''; position: absolute; left: 14px; top: 0; bottom: 0; width: 2px; background: var(--line-color, #6366f1); opacity: 0.3; }
.timeline-step { position: relative; margin-bottom: 14px; }
.timeline-dot { position: absolute; left: -44px; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 1; }
.dot-primary { background: #6366f1; }
.dot-success { background: #16a34a; }
.dot-danger  { background: #dc2626; }
.dot-warning { background: #d97706; }
.timeline-card { background: var(--bg-input); border: 1px solid var(--border-main); border-radius: 10px; padding: 12px 14px; }
.timeline-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
.timeline-card-header small { color: var(--text-muted); font-size: 0.75rem; white-space: nowrap; margin-left: 8px; }

/* ACTIVITY */
.activity-item { padding: 12px 0; border-bottom: 1px solid var(--border-main); }
.activity-item:last-child { border-bottom: none; }
.activity-item-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
.activity-item-header small { color: var(--text-muted); font-size: 0.75rem; }
.border-danger  { border-left: 3px solid #dc2626 !important; }
.border-success { border-left: 3px solid #16a34a !important; }
.mt-4 { margin-top: 20px; }
.mb-2 { margin-bottom: 8px; }
.me-1 { margin-right: 4px; }

/* ── SPINNER & EMPTY ── */
.spinner-custom { width: 2rem; height: 2rem; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 24px 0; gap: 8px; }
.empty-img { max-width: 200px; height: auto; opacity: 0.85; }
.empty-text { font-size: 0.9rem; font-weight: 600; color: var(--text-muted); }

/* FADE TRANSITION */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* RESPONSIVE */
@media (max-width: 768px) {
  .form-row-2 { grid-template-columns: 1fr; }
  .detail-grid { grid-template-columns: 1fr; }
  .pagination-card { flex-direction: column; }
}
@media (max-width: 576px) {
  .pagination-nav { width: 100%; justify-content: space-between; }
  .btn-prev-next { flex: 1; max-width: 48%; }
  .page-badges { width: 100%; justify-content: center; flex-wrap: wrap; }
}

/* DATETIME INPUT NATIVE */
.datetime-input {
  color-scheme: light dark;
  cursor: pointer;
}
.datetime-input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.6;
  filter: invert(40%) sepia(50%) saturate(400%) hue-rotate(200deg);
}
.datetime-input::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}
</style>