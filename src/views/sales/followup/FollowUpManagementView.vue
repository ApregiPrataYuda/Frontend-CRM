<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppModal from '@/components/AppModal.vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { useConfirm } from '@/composables/useConfirm'
import { usePermissionStore } from '@/stores/PermissionStore'
import { useAuthStore } from '@/stores/authStore'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useFollowUpStore } from '@/stores/followUpStores'
import Multiselect from '@vueform/multiselect'
import '@vueform/multiselect/themes/default.css' 


const { confirm }   = useConfirm()
const permission    = usePermissionStore()
const route         = useRoute()
const router        = useRouter()
const toast         = useToast()
const authStore     = useAuthStore()
const followUpStore = useFollowUpStore()

// PERMISSIONS
const currentUrl = computed(() => route.path.replace('/app', ''))
const canCreate  = computed(() => permission.canCreate(currentUrl.value))
const canUpdate  = computed(() => permission.canUpdate(currentUrl.value))
const canDelete  = computed(() => permission.canDelete(currentUrl.value))
const canView    = computed(() => permission.canView(currentUrl.value))

// DROPDOWN TOGGLES
const showExportMenu  = ref(false)
const showImportMenu  = ref(false)
const showPerPageMenu = ref(false)
const showSortByMenu  = ref(false)
const showSortDirMenu = ref(false)
const showModeMenu    = ref(false)
const closingFollowUpId = ref(null)

// â”€â”€ TIMELINE GROUP LINK (Follow Up Aktif <-> Histori terkait) â”€â”€
// Menggantikan garis penghubung manual. Setiap follow-up aktif dan histori
// yang berasal dari visit yang sama diberi warna sama, dan saling menyala
// saat salah satunya di-hover. Lebih tahan banyak follow-up aktif sekaligus
// dibanding garis fisik yang gampang tabrakan di layar sempit.
// Kunci penghubung: visit_code (kalau follow-up lahir dari visit),
// fallback ke follow_up_id/id untuk direct follow-up yang tidak punya visit.
const groupKeyOf = (item) =>
  item?.visit_code || (item?.follow_up_id ? `fu-${item.follow_up_id}` : (item?.id ? `fu-${item.id}` : null))

const groupColorPalette = ['#f59e0b', '#6366f1', '#16a34a', '#0891b2', '#dc2626', '#7c3aed']
const groupColorMap = new Map()
const groupColorOf = (key) => {
  if (!key) return '#94a3b8'
  if (!groupColorMap.has(key)) {
    groupColorMap.set(key, groupColorPalette[groupColorMap.size % groupColorPalette.length])
  }
  return groupColorMap.get(key)
}

const hoveredGroupKey = ref(null)

// VIEW MODE (Card / Table)
const viewMode = ref('card') // default: card

// DATETIME HELPERS
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

// INIT
onMounted(() => {
  followUpStore.fetchFollowUps('customers')
})

// MODE LABEL
const modeLabel = computed(() =>
  followUpStore.mode === 'leads' ? 'Leads' : 'Customers'
)

const changeMode = (type) => {
  showModeMenu.value = false
  followUpStore.fetchFollowUps(type)
}

// SORT OPTIONS
const sortByOptions = [
  { label: 'Created Date', value: 'created_at'   },
  { label: 'Company Name', value: 'company_name' },
]
const sortByLabel = computed(() =>
  sortByOptions.find(o => o.value === followUpStore.sort.column)?.label ?? 'Created Date'
)

// COMPUTED: SHOW COLUMNS
const showVisitColumn  = computed(() => followUpStore.mode !== 'customers')
const showActionColumn = computed(() => followUpStore.mode !== 'leads')
const isActionable     = (item) => !['DONE', 'CLOSED', 'CANCELLED'].includes(item.status)

// â”€â”€ CODE DISPLAY HELPER â”€â”€
// Dipakai di semua tempat yang menampilkan "kode" follow up:
// Table view, Card view, dan panel Follow Up Aktif di Customer Journey.
// Prioritas tampilan: no_reference (dari visit) > follow_up_code (kode internal FUP-...)
// isRef dipakai untuk nentuin apakah perlu label "(No Ref)" atau tidak.
// const codeDisplay = (item) => ({
//   value: item?.no_reference || item?.follow_up_code || '-',
//   isRef: !!item?.no_reference,
// })

const codeDisplay = (item) => ({
  value: item?.no_reference || '-',
  isRef: !!item?.no_reference,
})


// STATUS CONFIG
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

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  MODAL: EDIT / RESCHEDULE FOLLOW UP
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  MODAL: SUBMIT RESULT LEAD
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  MODAL: SUBMIT RESULT CUSTOMER
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
  Object.assign(resultForm, { result: '', notes: '', next_follow_up_at: '', follow_up_type: '', no_reference: item.no_reference ?? '',})
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
      no_reference      : resultForm.no_reference || null,   // ← tambahan
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

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  MODAL: DIRECT FOLLOW UP LEAD
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  MODAL: DIRECT FOLLOW UP CUSTOMER
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const isDirectCustomerModalVisible = ref(false)

const followUpTypes = [
  { value: 'CALL',     label: 'Call',      icon: 'fa-solid fa-phone'          },
  { value: 'WHATSAPP', label: 'WhatsApp',  icon: 'fa-solid fa-comments'      },
  { value: 'EMAIL',    label: 'Email',     icon: 'fa-solid fa-envelope'       },
  { value: 'MEETING',  label: 'Meeting',   icon: 'fa-solid fa-handshake'      },
]



const subjectTemplatesCustomers = [
  {
    label: 'Follow Up Rutin - Menjaga Hubungan dengan Customer',
    value: 'Follow Up Rutin - Menjaga Hubungan dengan Customer'
  },
  {
    label: 'Evaluasi Kepuasan Customer',
    value: 'Evaluasi Kepuasan Customer'
  },

  
  {
    label: 'Tindak Lanjut Penawaran',
    value: 'Tindak Lanjut Penawaran'
  },
  {
    label: 'Penawaran Repeat Order',
    value: 'Penawaran Repeat Order'
  },
  {
    label: 'Penawaran Produk atau Layanan Baru',
    value: 'Penawaran Produk atau Layanan Baru'
  },
  {
    label: 'Peluang Upselling',
    value: 'Peluang Upselling'
  },
  {
    label: 'Peluang Cross Selling',
    value: 'Peluang Cross Selling'
  },
  {
    label: 'Negosiasi Harga atau Kontrak',
    value: 'Negosiasi Harga atau Kontrak'
  },
  {
    label: 'Perpanjangan Kontrak atau Kerja Sama',
    value: 'Perpanjangan Kontrak atau Kerja Sama'
  },
  {
    label: 'Pendampingan Implementasi Produk/Layanan',
    value: 'Pendampingan Implementasi Produk/Layanan'
  },
  {
    label: 'Tindak Lanjut Setelah Pembelian',
    value: 'Tindak Lanjut Setelah Pembelian'
  },
  {
    label: 'Penanganan Keluhan Customer',
    value: 'Penanganan Keluhan Customer'
  },
  {
    label: 'Tindak Lanjut Penyelesaian Keluhan',
    value: 'Tindak Lanjut Penyelesaian Keluhan'
  },
  {
    label: 'Pengingat Pembayaran',
    value: 'Pengingat Pembayaran Dengan Nomor'
  },
  {
    label: 'Permintaan Dokumen atau Data',
    value: 'Permintaan Dokumen atau Data'
  },
  {
    label: 'Pembaruan Data Customer',
    value: 'Pembaruan Data Customer'
  },
  {
    label: 'Reaktivasi Customer Tidak Aktif',
    value: 'Reaktivasi Customer Tidak Aktif'
  },
  {
    label: 'Diskusi Pengembangan Kerja Sama',
    value: 'Diskusi Pengembangan Kerja Sama'
  },
  {
    label: 'Rapat Evaluasi Kinerja Layanan',
    value: 'Rapat Evaluasi Kinerja Layanan'
  },

  {
  label: 'Penagihan Customer',
  value: 'Penagihan Customer'
},
{
  label: 'Follow Up Pembayaran',
  value: 'Follow Up Pembayaran Customer'
},
{
  label: 'Konfirmasi Pembayaran',
  value: 'Konfirmasi Pembayaran Customer'
},
{
  label: 'Pengingat Jatuh Tempo',
  value: 'Pengingat Jatuh Tempo Pembayaran'
},
{
  label: 'Pembahasan Piutang',
  value: 'Pembahasan Piutang Customer'
},
{
  label: 'Klarifikasi Pembayaran',
  value: 'Klarifikasi Pembayaran Customer'
},
{
  label: 'Negosiasi Pembayaran',
  value: 'Negosiasi Pembayaran Customer'
},
{
  label: 'Keterlambatan Pembayaran',
  value: 'Follow Up Keterlambatan Pembayaran'
},
{
  label: 'Konfirmasi Pelunasan',
  value: 'Konfirmasi Pelunasan Customer'
},
  {
    label: 'Pembahasan Lainnya',
    value: 'Pembahasan Lainnya'
  },
]

// HEAD_OFFICE_VALUE dipakai sebagai "pilihan pertama & default" di dropdown
// branch, supaya sales SELALU melihat sesuatu yang sudah terpilih
// (tidak pernah ada state "belum pilih apa-apa" yang bikin bingung).
const HEAD_OFFICE_VALUE = '__HEAD_OFFICE__'

const formDirectCustomer = reactive({
  customer_id               : null,
  branch_id                 : HEAD_OFFICE_VALUE,
  follow_up_type            : 'CALL',
  follow_up_at              : '',
  subject                   : '',
  subject_template_customer : '',
  no_reference              : '',
  notes                     : '',
  need_follow_up            : false,
  next_follow_up_at         : null,
})



// Customer yang sedang dipilih (objek penuh, termasuk daftar branch-nya).
// Diasumsikan followUpStore.customersDirectData sudah membawa field
// `branches: [{ id, branch_name, is_main_branch, contact_name, phone }]`
// dan `contact_name` / `phone` di level customer untuk head office.
const selectedCustomer = computed(() =>
  followUpStore.customersDirectData.find(c => c.customer_id === formDirectCustomer.customer_id) ?? null
)

// Opsi dropdown branch: selalu diawali "Head Office", baru diikuti
// cabang-cabang aktual. Kalau customer tidak punya cabang sama sekali,
// dropdown branch disembunyikan total (lihat hasBranches di bawah) â€”
// jadi sales dengan customer sederhana tidak akan pernah lihat pilihan
// yang tidak relevan buat mereka.


const branchOptions = computed(() => {
  const branches = selectedCustomer.value?.branches ?? []
  const opts = []

  // "Head Office" cuma jadi opsi kalau user ini benar-benar owns head-nya
  if (selectedCustomer.value?.owns_head) {
    opts.push({ value: HEAD_OFFICE_VALUE, label: 'Head Office (Kantor Pusat)' })
  }

  opts.push(...branches.map(b => ({
    value: b.id,
    label: b.is_main_branch ? `${b.branch_name} (Utama)` : b.branch_name,
  })))

  return opts
})

const hasBranches = computed(() => (selectedCustomer.value?.branches ?? []).length > 0)

// Preview kontak yang akan dihubungi â€” read-only, cuma buat konfirmasi
// visual supaya sales yakin dia menghubungi orang yang benar sebelum submit.
const contactPreview = computed(() => {
  if (!selectedCustomer.value) return null

  if (formDirectCustomer.branch_id !== HEAD_OFFICE_VALUE) {
    const branch = (selectedCustomer.value.branches ?? [])
      .find(b => b.id === formDirectCustomer.branch_id)
    if (branch) {
      return {
        name : branch.contact_name || selectedCustomer.value.contact_name || '-',
        phone: branch.phone || selectedCustomer.value.phone || null,
        label: branch.branch_name,
      }
    }
  }

  return {
    name : selectedCustomer.value.contact_name || '-',
    phone: selectedCustomer.value.phone || null,
    label: 'Head Office',
  }
})

// Setiap kali customer diganti, reset pilihan branch balik ke Head Office
// supaya tidak ada kondisi branch_id "nyangkut" dari customer sebelumnya.
watch(() => formDirectCustomer.customer_id, () => {
  const c = selectedCustomer.value
  if (c?.owns_head) {
    formDirectCustomer.branch_id = HEAD_OFFICE_VALUE
  } else {
    formDirectCustomer.branch_id = c?.branches?.[0]?.id ?? HEAD_OFFICE_VALUE
  }
})

const openDirectCustomerModal = async () => {
  Object.assign(formDirectCustomer, {
    customer_id: null, branch_id: HEAD_OFFICE_VALUE, follow_up_type: 'CALL', follow_up_at: '',
    subject: '', subject_template_customer: '', no_reference: '', notes: '',
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
    branch_id     : formDirectCustomer.branch_id === HEAD_OFFICE_VALUE
                      ? null
                      : formDirectCustomer.branch_id,
    follow_up_type: formDirectCustomer.follow_up_type,
    subject       : formDirectCustomer.subject,
    notes         : formDirectCustomer.notes,
    follow_up_at  : formDirectCustomer.follow_up_at,
    no_reference  : formDirectCustomer.no_reference || null,
  }

  try {
    await followUpStore.storeDirectCustomer(payload)
    closeDirectCustomerModal()
    toast.success('Direct Follow Up customer berhasil dibuat!')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal membuat follow up')
  }
}





// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  MODAL: DETAIL FOLLOW UP
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const isDetailModalVisible = ref(false)
const isDetailAboveTimeline = ref(false) 

// const openDetailModal = async (item) => {
//   isDetailAboveTimeline.value = aboveTimeline 
//   followUpStore.followUpDetail = null
//   isDetailModalVisible.value   = true
//   try {
//     await followUpStore.detailFollowUp(item.id)
//   } catch {
//     toast.error('Gagal memuat detail follow up')
//     isDetailModalVisible.value = false
//   }
// }

const openDetailModal = async (item, aboveTimeline = false) => {
  isDetailAboveTimeline.value = aboveTimeline   // ← tambahan
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
  isDetailAboveTimeline.value = false  
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  MODAL: TIMELINE LEAD
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const isTimelineLeadModalVisible = ref(false)

const openTimelineLeadModal = async (item) => {
  followUpStore.clearTimeline()
  isTimelineLeadModalVisible.value = true
  await followUpStore.fetchTimelineLead(item.id)
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  MODAL: TIMELINE CUSTOMER
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const isTimelineCustomerModalVisible = ref(false)

const openTimelineCustomerModal = async (item) => {
  groupColorMap.clear()          // reset palet warna tiap buka modal customer baru
  hoveredGroupKey.value = null
  isTimelineCustomerModalVisible.value = true
  await followUpStore.fetchTimelineCustomer(item.id)
}


const handleCloseFollowUp = async (fu) => {
  const refText = fu.no_reference
    ? `dengan No Reference "${fu.no_reference}"`
    : `ini (Tidak ada No Reference)`

  const ok = await confirm({
    type: 'warning',
    title: 'Tutup Follow Up',
    message: `Yakin ingin menutup Follow Up ${refText}?`,
    detail: 'Follow up ini akan ditandai CLOSED.',
    confirmText: 'Ya, Tutup',
    cancelText: 'Batal',
  })

  if (!ok) return

  closingFollowUpId.value = fu.id

  try {
    await followUpStore.closeFollowUp(fu.id)

    toast.success('Follow Up berhasil ditutup')

    // refresh timeline customer
    await followUpStore.fetchTimelineCustomer(
      followUpStore.timelineCustomerId
    )

    // refresh list utama
    await followUpStore.fetchFollowUps(followUpStore.mode)

  } catch (err) {
    toast.error(
      err.response?.data?.message ||
      'Gagal menutup Follow Up'
    )
  } finally {
    closingFollowUpId.value = null
  }
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  DELETE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  VISIT FROM FOLLOW UP
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const createVisitFromFollowUp = (item) => {
  if (!item.customer_id) {
    return toast.warning('Customer tidak ditemukan untuk follow up ini')
  }
  router.push('/app/sales-visit')
}

// RESET
const handleReset = () => {
  followUpStore.resetFilters()
}

// HELPER: FU TYPE ICON
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

          <!-- TOGGLE CARD / TABLE -->
          <div class="view-toggle-wrap">
            <button
              class="view-toggle-btn"
              :class="{ active: viewMode === 'card' }"
              @click="viewMode = 'card'"
            >
              <font-awesome-icon icon="fa-solid fa-table-cells" /> Card
            </button>
            <button
              class="view-toggle-btn"
              :class="{ active: viewMode === 'table' }"
              @click="viewMode = 'table'"
            >
              <font-awesome-icon icon="fa-solid fa-list" /> Table
            </button>
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

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         TABLE VIEW
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <div v-if="viewMode === 'table'" class="table-card flex-grow-1 overflow-auto mb-3">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:50px">NO.</th>
            <th>No REF</th>
            <th>Type</th>
            <th>Subject</th>
            <th>Lead / Customer</th>
            <th>Status Follow Up</th>
            <th v-if="showVisitColumn">Status From Lead</th>
            <th>Tgl Dibuat</th>
            <th>Estimasi Follow-up</th>
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
              <span class="code-badge">
                <font-awesome-icon icon="fa-solid fa-hashtag" />
                {{ codeDisplay(item).value }}
                <span v-if="!codeDisplay(item).isRef" class="code-badge-note">(No Ref)</span>
              </span>
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

            <!-- TARGET: company + branch (jika ada) + kontak resolved -->
            <td>
              <div class="fw-600">{{ item.target_name ?? item.customer_company_name ?? item.lead_company_name }}</div>
              <div v-if="item.branch" class="td-muted target-sub">
                <font-awesome-icon icon="fa-solid fa-code-branch" /> {{ item.branch.branch_name }}
              </div>
              <div v-if="item.contact?.name && item.contact.name !== '-'" class="td-muted target-sub">
                <font-awesome-icon icon="fa-solid fa-user" /> {{ item.contact.name }}
              </div>
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

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         CARD VIEW â€” default tampilan
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <div v-else class="card-view flex-grow-1 overflow-auto mb-3">

      <!-- LOADING -->
      <div v-if="followUpStore.loadingFollowUp" class="td-center">
        <div class="spinner-custom" style="margin:40px auto"></div>
      </div>

      <!-- EMPTY -->
      <div v-else-if="!followUpStore.followUpData.length" class="empty-state">
        <img src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif"
          alt="No data" class="empty-img" />
        <div class="empty-text">No data found</div>
      </div>

      <!-- CARDS -->
      <div v-else class="card-grid">
        <div
          v-for="item in followUpStore.followUpData"
          :key="item.id"
          class="fu-card"
          :class="{ 'card-overdue': item.is_overdue }"
        >

        <!-- STAMP -->
        <div
          v-if="!isActionable(item)"
          class="fu-stamp"
          :class="item.status === 'CANCELLED' ? 'stamp-cancelled' : 'stamp-done'"
        >
          {{ item.status === 'CANCELLED' ? 'Cancelled' : 'Selesai' }}
        </div>

          <!-- HEADER -->
          <div class="fu-card-header">
            <span class="code-badge">
              <font-awesome-icon icon="fa-solid fa-hashtag" />
              {{ codeDisplay(item).value }}
              <span v-if="!codeDisplay(item).isRef" class="code-badge-note">(No Ref)</span>
            </span>
            <span class="status-badge"
              :class="item.computed_status === 'OVERDUE' ? 'status-danger'
                : item.status === 'PENDING' ? 'status-warning' : 'status-success'">
              {{ item.computed_status }}
            </span>
          </div>

          <!-- BODY -->
          <div class="fu-card-body">
            <div class="fu-card-row">
              <span class="type-pill">
                <font-awesome-icon :icon="fuTypeIcon(item.follow_up_type)" />
                {{ item.follow_up_type }}
              </span>
              <span v-if="showVisitColumn" class="status-badge"
                :class="StatusConfigFromLeads[normalizeStatus(item.lead_status)]?.class || 'status-secondary'">
                <font-awesome-icon
                  :icon="StatusConfigFromLeads[normalizeStatus(item.lead_status)]?.icon || 'fa-solid fa-circle-info'"
                />
                {{ item.lead_status }}
              </span>
            </div>

            <div class="fu-card-subject">{{ item.subject }}</div>

            <!-- TARGET: company + branch chip + kontak resolved -->
            <div class="fu-card-target">
              <font-awesome-icon icon="fa-solid fa-building" />
              <div>
                <div class="fw-600">{{ item.target_name ?? item.customer_company_name ?? item.lead_company_name }}</div>
                <div v-if="item.branch" class="td-muted target-sub">
                  <font-awesome-icon icon="fa-solid fa-code-branch" /> {{ item.branch.branch_name }}
                </div>
                <div v-if="item.contact?.name && item.contact.name !== '-'" class="td-muted target-sub">
                  <font-awesome-icon icon="fa-solid fa-user" /> {{ item.contact.name }}
                  <span v-if="item.contact.phone">  {{ item.contact.phone }}</span>
                </div>
              </div>
            </div>

            <div class="fu-card-dates">
              <div>
                <span class="detail-label">Dibuat</span>
                <div class="td-muted">{{ followUpStore.formatDate(item.created_at) }}</div>
              </div>
              <div>
                <span class="detail-label">Estimasi Follow-up</span>
                <div :class="item.is_overdue ? 'text-danger fw-600' : ''">
                  {{ followUpStore.formatDate(item.follow_up_at) }}
                </div>
                <div v-if="item.is_overdue" class="overdue-hint">
                  <font-awesome-icon icon="fa-bell" /> Overdue
                </div>
              </div>
            </div>
          </div>

          <!-- FOOTER / ACTIONS -->
          <div class="fu-card-footer">
            <!-- Edit (hanya PENDING) -->
            <button
              v-if="canUpdate && item.status === 'PENDING'"
              class="act-btn act-edit"
              title="Reschedule"
              @click="openEditModal(item)"
            >
              <font-awesome-icon icon="fa-pen-to-square" />
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
          </div>
        </div>
      </div>
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


    <!-- MODAL: EDIT / RESCHEDULE -->
    <AppModal
      :show="isEditModalVisible"
      title="Reschedule Follow Up"
      icon="pen"
      size="md"
      @close="closeEditModal"
    >
      <div class="form-container-gap">
        <!-- <div class="form-group">
          <label>Template Subject <span class="opt-label">(opsional)</span></label>
          <Multiselect
            v-model="formEdit.subject_template"
            :options="followUpStore.typeSubjectDirect"
            label="label"
            valueProp="value"
            placeholder="Pilih template subject"
            :searchable="true"
          />
        </div> -->
        <!-- <div class="form-group">
          <label>Subject <span class="req-label"></span></label>
          <input v-model="formEdit.subject" class="form-input" placeholder="Tulis subject..." />
        </div> -->
        <div class="form-group">
          <label>Follow Up Date <span class="opt-label">(harus di Isi / dipilih)</span></label>
          <input
                type="datetime-local"
                class="form-input datetime-input"
                :value="toNative(formEdit.follow_up_at)"
                :min="minDatetime"
                @change="e => formEdit.follow_up_at = fromNative(e.target.value)"
              />
        </div>
        <!-- <div class="form-group">
          <label>Notes <span class="opt-label">(harus di Isi / dipilih)</span></label>
          <RichTextEditor v-model="formEdit.notes" placeholder="Tulis catatan reschedule..." />
        </div> -->
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeEditModal">Cancel</button>
        <button class="btn-save" :disabled="followUpStore.updatingFollowUp" @click="submitEdit">
          <font-awesome-icon icon="check" />
          {{ followUpStore.updatingFollowUp ? 'Menyimpan...' : 'Update' }}
        </button>
      </template>
    </AppModal>


    <!-- MODAL: SUBMIT RESULT LEAD -->
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


    <!-- MODAL: SUBMIT RESULT CUSTOMER -->
    <AppModal
      :show="isSubmitCustomerModalVisible"
      title="Submit Follow Up Result"
      icon="clipboard-check"
      size="lg"
      @close="closeSubmitCustomerModal"
    >
      <div class="form-container-gap">


        <div class="form-group" style="margin-top:12px">
          <label>No. Referensi <span class="opt-label">(opsional)</span></label>
          <input v-model="resultForm.no_reference" class="form-input" placeholder="Contoh: DIM/TES/1234/45" />
          <small v-if="resultForm.no_reference" class="text-muted-sm">
            Dibawa dari follow up sebelumnya — ubah jika referensi berbeda.
          </small>
        </div>

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


    <!-- MODAL: DIRECT FOLLOW UP LEAD -->
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


    <!-- MODAL: DIRECT FOLLOW UP CUSTOMER -->
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

        <!-- BRANCH: hanya muncul kalau customer punya cabang. -->
        <transition name="fade">
          <div v-if="formDirectCustomer.customer_id && hasBranches" class="form-group">
            <label>Lokasi / Cabang <span class="req-label">*</span></label>
            <Multiselect
              v-model="formDirectCustomer.branch_id"
              :options="branchOptions"
              label="label"
              valueProp="value"
              :can-clear="false"
              :searchable="true"
            />
          </div>
        </transition>

        <!-- CONTACT PREVIEW -->
        <transition name="fade">
          <div v-if="formDirectCustomer.customer_id && contactPreview" class="contact-preview">
            <font-awesome-icon icon="fa-solid fa-address-card" />
            <div>
              <div class="contact-preview-title">Akan menghubungi ({{ contactPreview.label }})</div>
              <div class="contact-preview-name">
                {{ contactPreview.name }}
                <span v-if="contactPreview.phone" class="td-muted">  {{ contactPreview.phone }}</span>
              </div>
            </div>
          </div>
        </transition>

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
        <label>No. Referensi <span class="opt-label"><span class="req-label">*</span></span></label>
        <input
          v-model="formDirectCustomer.no_reference"
          class="form-input"
          placeholder="Contoh: DIM/0000/NP"
        />
      </div>

        <div class="form-group">
          <label>(Date) Schedule Next Follow Up (Next Action Plan) <span class="req-label">*</span></label>
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


    <!-- MODAL: DETAIL FOLLOW UP -->
    <!-- <AppModal
      :show="isDetailModalVisible"
      title="Detail Follow Up"
      icon="circle-info"
      size="xl"
      @close="closeDetailModal"
    > -->
    <AppModal
  :show="isDetailModalVisible"
  :elevated="isDetailAboveTimeline"
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
            <strong>{{ codeDisplay(followUpStore.followUpDetail).value }}</strong>
            <span v-if="!codeDisplay(followUpStore.followUpDetail).isRef" class="code-badge-note">(Tidak Ada No Referensi)</span>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px">
              {{ followUpStore.followUpDetail?.customer_company_name ?? followUpStore.followUpDetail?.lead_company_name }}
              <template v-if="followUpStore.followUpDetail?.branch_name">
                â€” {{ followUpStore.followUpDetail.branch_name }}
              </template>
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
  <div class="detail-row">
    <span class="detail-label">Estimasi Jadwal Follow Up</span>
    <span class="detail-value">{{ followUpStore.formatDates(followUpStore.followUpDetail.follow_up_at) }}</span>
  </div>
  <div class="detail-row">
    <span class="detail-label">Created</span>
    <span class="detail-value">{{ followUpStore.formatDates(followUpStore.followUpDetail.created_at) }}</span>
  </div>
</div>

<!-- Subject & Notes, dikeluarkan dari grid -->
<div class="detail-block">
  <span class="detail-label">
    <font-awesome-icon icon="fa-solid fa-heading" /> Subject
  </span>
  <div class="detail-block-content">
    {{ followUpStore.followUpDetail.subject }}
  </div>
</div>

<div class="timeline-notes-box" style="margin-top:12px">
  <div class="timeline-notes-label">
    <font-awesome-icon icon="fa-solid fa-note-sticky" /> Notes
  </div>
  <div class="rich-content" v-html="followUpStore.followUpDetail.notes || '-'"></div>
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

    <!-- TAMBAHAN: Catatan Kunjungan -->
    <div v-if="c.visit_notes" class="timeline-notes-box">
      <div class="timeline-notes-label">
        <font-awesome-icon icon="fa-solid fa-comment-dots" /> Catatan Kunjungan
      </div>
      <div class="rich-content" v-html="c.visit_notes"></div>
    </div>

    <div class="rich-content" v-html="c.complaint_detail"></div>
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

    <!-- TAMBAHAN: Catatan Kunjungan -->
    <div v-if="v.visit_notes" class="timeline-notes-box">
      <div class="timeline-notes-label">
        <font-awesome-icon icon="fa-solid fa-comment-dots" /> Catatan Kunjungan
      </div>
      <div class="rich-content" v-html="v.visit_notes"></div>
    </div>

    <div class="rich-content" v-html="v.potential_order_detail"></div>
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
            <div class="td-muted rich-content" v-html="activity.description || '-'"></div>
          </div>
        </template>

      </div>

      <div v-else class="td-center">Data tidak ditemukan</div>

     <template #footer>

  <template v-if="followUpStore.followUpDetail && !followUpStore.followUpDetail.lead_id">
  <button
    v-if="!['DONE', 'CLOSED', 'CANCELLED'].includes(followUpStore.followUpDetail.status)"
    class="btn-visit"
    title="Buka halaman Sales Visit untuk mencatat kunjungan ke customer ini"
    @click="createVisitFromFollowUp(followUpStore.followUpDetail)"
  >
    <font-awesome-icon icon="fa-solid fa-location-dot" />
    Visit Customer
  </button>

  <button
    v-if="!['DONE', 'CLOSED', 'CANCELLED'].includes(followUpStore.followUpDetail.status)"
    class="btn-save"
    title="Selesaikan follow up ini dan catat hasilnya"
    :disabled="followUpStore.submittingResult"
    @click="closeDetailModal(); openSubmitCustomerModal(followUpStore.followUpDetail)"
  >
    <font-awesome-icon icon="fa-solid fa-check" />
    Submit Result
  </button>
</template>

  <button class="btn-cancel" @click="closeDetailModal">Close</button>
</template>
    </AppModal>


    <!-- MODAL: TIMELINE LEAD -->
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
                <span class="status-badge status-danger">Follow Up</span>
                <span v-if="item.follow_up_code" class="status-badge status-secondary">{{ item.follow_up_code }}</span>
              </div>
              <div class="td-muted rich-content" style="margin:0" v-html="item.description || '-'"></div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn-cancel" @click="isTimelineLeadModalVisible = false">Close</button>
      </template>
    </AppModal>


    <!-- MODAL: TIMELINE CUSTOMER -->
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

        <!-- PANEL: FOLLOW UP AKTIF -->
        <div
          v-if="followUpStore.openFollowUpsCustomer.length"
          class="open-fu-container"
        >
          <div class="open-fu-header">
            <div class="open-fu-title">
              <font-awesome-icon icon="fa-solid fa-folder-open" />
              <span>Follow Up Aktif</span>
              <span class="open-fu-count">
                ({{ followUpStore.openFollowUpsCustomer.length }})
              </span>
            </div>
          </div>

          <div
            v-for="fu in followUpStore.openFollowUpsCustomer"
            :key="fu.id"
            class="open-fu-card"
            :class="{ 'group-active': hoveredGroupKey === groupKeyOf(fu) }"
            :style="{ '--group-color': groupColorOf(groupKeyOf(fu)) }"
            @mouseenter="hoveredGroupKey = groupKeyOf(fu)"
            @mouseleave="hoveredGroupKey = null"
          >
            
            <div class="open-fu-content">
  <div class="fu-code">
    <font-awesome-icon
      icon="fa-solid fa-circle"
      :style="{ color: groupColorOf(groupKeyOf(fu)), fontSize: '9px' }"
    />
    {{ codeDisplay(fu).value }}
    <span v-if="!codeDisplay(fu).isRef" class="code-badge-note">(Tidak ada No Reference)</span>
  </div>

  <div class="fu-subject">
    {{ fu.subject }}
  </div>

  <div class="fu-footer">
    <div class="fu-date">
      <font-awesome-icon icon="fa-solid fa-calendar-days" />
      {{ followUpStore.formatDate(fu.follow_up_at) }}
    </div>

    <div class="fu-footer-actions">
      <button
        
        class="btn btn-secondary btn-sm"
        title="Lihat Detail Follow Up"
        @click="openDetailModal({ id: fu.id }, true)"
      >
        <font-awesome-icon icon="fa-eye" />
        Details
      </button>

      <button
        class="btn btn-secondary btn-sm"
        :disabled="closingFollowUpId === fu.id"
        @click="handleCloseFollowUp(fu)"
      >
        <font-awesome-icon icon="fa-solid fa-lock" />
        {{ closingFollowUpId === fu.id ? 'Closing...' : 'Close' }}
      </button>
    </div>
  </div>
</div>
          </div>
        </div>

        <!-- TIMELINE: murni histori/activity log -->
        <div class="timeline-wrapper" style="--line-color:#6366f1">
          <div
            v-for="(item, i) in followUpStore.customerTimeline"
            :key="i"
            class="timeline-step"
            :class="{ 'group-active': hoveredGroupKey && hoveredGroupKey === groupKeyOf(item) }"
            :style="{ '--group-color': groupColorOf(groupKeyOf(item)) }"
            @mouseenter="hoveredGroupKey = groupKeyOf(item)"
            @mouseleave="hoveredGroupKey = null"
          >
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
                <span
                  v-if="/closed|selesai/i.test(item.title)"
                  class="fu-mini-stamp"
                  :class="/closed/i.test(item.title) ? 'stamp-cancelled' : 'stamp-done'"
                >
                  <font-awesome-icon icon="fa-solid fa-stamp" />
                  {{ /closed/i.test(item.title) ? 'Closed' : 'Done' }}
                </span>

                


                <small>{{ item.activity_at }}</small>
              </div>
              <div style="display:flex; gap:6px; margin-bottom:6px; flex-wrap:wrap">
                <span class="status-badge" :class="item.source === 'VISIT' ? 'status-success' : 'status-primary'">
                  {{ item.source === 'VISIT' ? 'Visit' : 'Follow Up' }}
                </span>
                <span v-if="item.follow_up_code" class="status-badge status-secondary">
                 No Ref: {{ item.no_reference || item.follow_up_code }}
                </span>
                <span v-if="item.visit_code" class="status-badge status-secondary">Code Visit: {{ item.visit_code }}</span>
              </div>
              <!-- Description: khusus VISIT dibungkus box "Catatan Kunjungan" biar konsisten
                sama tampilan box Noted di FOLLOW_UP. Untuk FOLLOW_UP, tetap teks polos
                (cuma catatan otomatis sistem, bukan input manual). -->
            <div
              v-if="item.source === 'FOLLOW_UP'"
              class="td-muted rich-content"
              style="margin:0 0 8px"
              v-html="item.description || '-'"
            ></div>

            <div v-else-if="item.source === 'VISIT' && item.description" class="timeline-notes-box">
              <div class="timeline-notes-label">
                <font-awesome-icon icon="fa-solid fa-comment-dots" /> Catatan Kunjungan
              </div>
              <div class="rich-content" v-html="item.description"></div>
            </div>

              <!-- Notes asli follow-up (diketik user saat reschedule/submit result),
                   dibedakan dari description di atas yang cuma teks otomatis sistem.
                   Cuma tampil untuk FOLLOW_UP dan kalau memang ada isinya. -->
              <div v-if="item.source === 'FOLLOW_UP' && item.notes" class="timeline-notes-box">
                <div class="timeline-notes-label">
                  <font-awesome-icon icon="fa-solid fa-note-sticky" /> Noted
                </div>
                <div class="rich-content" v-html="item.notes"></div>
              </div>

             
              <template v-if="item.source === 'VISIT'">
  <div class="timeline-notes-box">
    <div class="timeline-notes-label">
      <font-awesome-icon icon="fa-solid fa-clock" /> Datetime Check In - Check Out
      <span v-if="item.visit_code" class="timeline-notes-subtag">{{ item.visit_code }}</span>
    </div>
    <div style="font-size:0.8rem; display:flex; gap:16px">
      <span><font-awesome-icon icon="fa-solid fa-right-to-bracket" style="color:#16a34a" /> {{ item.check_in_at ?? '-' }}</span>
      <span><font-awesome-icon icon="fa-solid fa-right-from-bracket" style="color:#dc2626" /> {{ item.check_out_at ?? '-' }}</span>
    </div>
  </div>

  <template v-if="item.has_complaint || item.has_potential_order">
    <div v-if="item.has_complaint" class="info-alert info-danger" style="font-size:0.8rem">
      <font-awesome-icon icon="triangle-exclamation" /> <span class="rich-content" v-html="item.complaint_detail"></span>
    </div>
    <div v-if="item.has_potential_order" class="info-alert info-success" style="font-size:0.8rem">
      <font-awesome-icon icon="fa-solid fa-sack-dollar" /> <span class="rich-content" v-html="item.potential_order_detail"></span>
    </div>
  </template>
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

/* VIEW TOGGLE (Card / Table) */
.view-toggle-wrap { display: flex; gap: 4px; padding: 3px; background: var(--bg-input); border: 1px solid var(--border-main); border-radius: 8px; }
.view-toggle-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border: none; border-radius: 6px; background: transparent; color: var(--text-muted); font-size: 0.83rem; font-weight: 600; cursor: pointer; transition: all 0.18s; white-space: nowrap; }
.view-toggle-btn.active { background: #6366f1; color: #fff; }
.view-toggle-btn:hover:not(.active) { color: #6366f1; }

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
.target-sub { display: flex; align-items: center; gap: 4px; margin-top: 2px; }


.timeline-notes-subtag {
  margin-left: auto;
  font-size: 0.66rem;
  font-weight: 700;
  color: #6366f1;
  background: rgba(99,102,241,0.1);
  padding: 2px 8px;
  border-radius: 6px;
  text-transform: none;
  letter-spacing: normal;
}
/* CODE BADGE â€” dipakai di Table, Card, dan panel Follow Up Aktif.
   Disatukan supaya tampilannya konsisten di semua tempat, dan
   otomatis muat teks panjang berkat text-overflow: ellipsis. */
.code-badge {
  font-family: monospace;
  font-size: 0.78rem;
  font-weight: 700;
  background: rgba(99,102,241,0.1);
  color: #6366f1;
  padding: 3px 10px;
  border-radius: 6px;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.code-badge-note {
  font-family: inherit;
  font-weight: 600;
  font-size: 0.68rem;
  color: #94a3b8;
  margin-left: 2px;
  white-space: nowrap;
}

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

/* CONTACT PREVIEW (Direct Customer modal) */
.contact-preview { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 8px; background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.2); color: #6366f1; font-size: 0.85rem; }
.contact-preview-title { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 2px; }
.contact-preview-name { font-weight: 600; color: var(--text-primary); }

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

.fu-card { position: relative; }

.fu-stamp {
  position: absolute;
  top: 16px;
  right: -8px;
  padding: 4px 16px;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 2px dashed currentColor;
  border-radius: 4px;
  transform: rotate(10deg);
  pointer-events: none;
  background: var(--bg-card);
  z-index: 3;
  opacity: 0.9;
}

.stamp-done      { color: #16a34a; }
.stamp-cancelled { color: #dc2626; }

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

/* SPINNER & EMPTY */
.spinner-custom { width: 2rem; height: 2rem; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 24px 0; gap: 8px; }
.empty-img { max-width: 200px; height: auto; opacity: 0.85; }
.empty-text { font-size: 0.9rem; font-weight: 600; color: var(--text-muted); }

/* FADE TRANSITION */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* CARD VIEW */
.card-view { background: transparent; }
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}
.fu-card {
  background: var(--bg-card);
  border-radius: 12px;
  box-shadow: 0 1px 3px var(--shadow-color);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: box-shadow 0.18s;
}
.fu-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.1); }
.card-overdue { border-left: 3px solid #ef4444; background: rgba(239,68,68,0.03); }
.fu-card-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.fu-card-body { display: flex; flex-direction: column; gap: 8px; }
.fu-card-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; }
.fu-card-subject { font-weight: 600; font-size: 0.92rem; color: var(--text-primary); line-height: 1.4; }
.fu-card-target { display: flex; align-items: flex-start; gap: 8px; color: var(--text-muted); font-size: 0.85rem; }
.fu-card-dates { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-top: 8px; border-top: 1px dashed var(--border-main); font-size: 0.8rem; }
.fu-card-footer { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; padding-top: 8px; border-top: 1px solid var(--border-main); }

/* RESPONSIVE */
@media (max-width: 768px) {
  .form-row-2 { grid-template-columns: 1fr; }
  .detail-grid { grid-template-columns: 1fr; }
  .pagination-card { flex-direction: column; }
  .card-grid { grid-template-columns: 1fr; }
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

.fu-mini-stamp {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.66rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2px 10px;
  border: 1.5px dashed currentColor;
  border-radius: 4px;
  transform: rotate(-6deg);
  margin-left: 8px;
  opacity: 0.9;
  white-space: nowrap;
}
.fu-mini-stamp.stamp-done      { color: #16a34a; }
.fu-mini-stamp.stamp-cancelled { color: #dc2626; }

/* PANEL: FOLLOW UP AKTIF (satu-satunya sumber tombol Close) */
.open-fu-container{
    margin:18px 0 24px;
    border:1px solid #f8d8a7;
    border-radius:14px;
    background:#fffaf3;
    overflow:hidden;
}
.open-fu-header{
    background:#fff4df;
    border-bottom:1px solid #f6dfb9;
    padding:12px 18px;
}
.open-fu-title{
    display:flex;
    align-items:center;
    gap:8px;
    font-weight:700;
    color:#9a4d00;
}
.open-fu-count{
    color:#f59e0b;
    font-weight:700;
}
.open-fu-card{
    padding:16px 18px;
}
.open-fu-card + .open-fu-card{
    border-top:1px dashed #ecd8b5;
}
.fu-code{
    display:flex;
    align-items:center;
    gap:8px;
    font-weight:700;
    color:#374151;
    margin-bottom:8px;
    font-size:.88rem;
}
.fu-subject{
    color:#6b7280;
    line-height:1.6;
    margin-bottom:14px;
}
.fu-footer{
    display:flex;
    justify-content:space-between;
    align-items:center;
}
.fu-date{
    display:flex;
    align-items:center;
    gap:6px;
    color:#6b7280;
    font-size:.82rem;
}
.btn-close-fu{
    display:flex;
    align-items:center;
    gap:6px;
    border:none;
    border-radius:8px;
    background:#f59e0b;
    color:#fff;
    padding:8px 14px;
    font-size:.82rem;
    font-weight:600;
    cursor:pointer;
    transition:.25s;
}
.btn-close-fu:hover{
    background:#d97706;
}
.btn-close-fu:disabled{
    opacity:.65;
    cursor:not-allowed;
}

.detail-block {
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  background: var(--bg-input);
  border: 1px solid var(--border-main);
}
.detail-block .detail-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.detail-block-content {
  font-size: 0.85rem;
  color: var(--text-primary);
  font-weight: 600;
  line-height: 1.5;
}

/* â”€â”€ GROUP LINK: warna penghubung Follow Up Aktif <-> histori terkait â”€â”€
   Menggantikan garis fisik. Setiap grup (follow-up + histori yang lahir
   dari visit yang sama) diberi warna konsisten lewat --group-color, dan
   saling menyala saat salah satu kartunya di-hover. */
.open-fu-card {
  border-left: 4px solid transparent;
  border-left-color: var(--group-color, transparent);
  transition: background 0.2s, box-shadow 0.2s;
  cursor: default;
}
.open-fu-card.group-active {
  background: color-mix(in srgb, var(--group-color) 10%, transparent);
  box-shadow: inset 0 0 0 1px var(--group-color);
}

.timeline-step { transition: opacity 0.2s; }
.timeline-step .timeline-card {
  border-left: 3px solid transparent;
  border-left-color: var(--group-color, transparent);
  transition: background 0.2s, box-shadow 0.2s;
}
.timeline-step.group-active .timeline-card {
  background: color-mix(in srgb, var(--group-color) 10%, var(--bg-input));
  box-shadow: 0 0 0 1px var(--group-color);
}
.timeline-step.group-active .timeline-dot {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--group-color) 30%, transparent);
}

/* â”€â”€ NOTES BOX di Customer Journey timeline (catatan asli follow-up) â”€â”€ */
.timeline-notes-box {
  margin: 0 0 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(99,102,241,0.06);
  border: 1px dashed rgba(99,102,241,0.25);
}
.timeline-notes-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6366f1;
  margin-bottom: 4px;
}

/* TIMELINE (activity log, murni display) */
.timeline-tags{
    display:flex;
    gap:6px;
    flex-wrap:wrap;
    margin-bottom:8px;
}
.timeline-description{
    margin:0 0 10px;
    color:#6b7280;
    line-height:1.55;
}
.timeline-time{
    display:flex;
    gap:18px;
    font-size:.78rem;
    margin-bottom:10px;
}

.fu-footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-detail-fu {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1.5px solid #6366f1;
  border-radius: 8px;
  background: transparent;
  color: #6366f1;
  padding: 8px 14px;
  font-size: .82rem;
  font-weight: 600;
  cursor: pointer;
  transition: .2s;
}
.btn-detail-fu:hover {
  background: #6366f1;
  color: #fff;
}

.btn-visit {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 18px;
  background: #16a34a;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-visit:hover {
  background: #15803d;
}


/* Rich text dari editor. Gunakan :deep karena elemen dari v-html tidak menerima scoped attribute. */
.rich-content :deep(p) { margin: 0 0 8px; }
.rich-content :deep(p:last-child) { margin-bottom: 0; }
.rich-content :deep(ul), .rich-content :deep(ol) { margin: 6px 0; padding-left: 20px; }
.rich-content :deep(li) { margin: 3px 0; }
</style>

