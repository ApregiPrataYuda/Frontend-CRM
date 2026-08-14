<script setup>
import { ref, computed, watch } from 'vue'

/* =========================================================================
   STATIC MOCK DATA
   Semua data di bawah ini masih dummy/statis mengikuti struktur tabel
   `product_populations` di database (lihat kolom: customer_id, user_id,
   pump_serial_no, product_category, product_display, product_model,
   tag_no, qty, seal_plan, mechanical_seal_drawing_no, created_at).
   Store / service / API akan menggantikan bagian ini nanti.
   ========================================================================= */

// User yang sedang login (dummy, nanti diganti dari auth store).
// Role bisa disimulasikan lewat switcher di bawah, khusus untuk preview desain admin/manager.
const currentUser = ref({ id: 3, name: 'Soni', role: 'sales' })
const rolePreviewOptions = [
  { value: 'sales', label: 'Sales' },
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
]
const isPrivileged = computed(() => ['admin', 'manager'].includes(currentUser.value.role))

// Lookup dummy customer (nanti diganti data dari tabel customers)
const customersLookup = {
  196: 'PT Petrokimia Nusantara',
  204: 'PT Chandra Karya Abadi',
  211: 'PT Semen Baturaja',
  225: 'PT Kilang Pertamina Balikpapan',
}

// Lookup dummy user/sales (nanti diganti data dari tabel users)
const usersLookup = {
  3: 'Soni',
  5: 'Dedi Kurniawan',
  7: 'Rina Amelia',
  9: 'Fajar Nugroho',
}

const productCategoryOptions = ['Durco Std', 'Durco Lo Flo']
const productDisplayOptions = ['Overhung Mark 3 ASME', 'Overhung Mark 3 Lo Flo', 'Overhung Mark 3 HRV']

const loading = ref(false)

const rows = ref([
  { id: 1, customer_id: 196, user_id: [3], pump_serial_no: '419974 - 419975 - 419976', product_category: 'Durco Std', product_display: 'Overhung Mark 3 ASME', product_model: '2K6X4-10 HRV', tag_no: 'AG-712 A/B/C', qty: 3, seal_plan: null, mechanical_seal_drawing_no: null, created_at: '2026-08-13' },
  { id: 2, customer_id: 196, user_id: [3], pump_serial_no: '419914 - 419915', product_category: 'Durco Std', product_display: 'Overhung Mark 3 ASME', product_model: '2K2X1-10 ARV', tag_no: 'BG-111 A/B', qty: 2, seal_plan: 'Plan 11', mechanical_seal_drawing_no: 'MSD-0021', created_at: '2026-08-13' },
  { id: 3, customer_id: 204, user_id: [3, 5], pump_serial_no: '419916 - 419917', product_category: 'Durco Std', product_display: 'Overhung Mark 3 ASME', product_model: '2K6X4-13 ARV', tag_no: 'BG-302 A/B', qty: 2, seal_plan: null, mechanical_seal_drawing_no: null, created_at: '2026-08-12' },
  { id: 4, customer_id: 204, user_id: [5], pump_serial_no: '419918 - 419919', product_category: 'Durco Std', product_display: 'Overhung Mark 3 ASME', product_model: '2K3X2-13 RV', tag_no: 'BG-303 A/B', qty: 2, seal_plan: null, mechanical_seal_drawing_no: null, created_at: '2026-08-12' },
  { id: 5, customer_id: 211, user_id: [7], pump_serial_no: '419920 - 419921', product_category: 'Durco Std', product_display: 'Overhung Mark 3 ASME', product_model: '2K4X3-10 RV', tag_no: 'BG-304 A/B', qty: 2, seal_plan: null, mechanical_seal_drawing_no: null, created_at: '2026-08-11' },
  { id: 6, customer_id: 211, user_id: [3], pump_serial_no: '419922 - 419923', product_category: 'Durco Std', product_display: 'Overhung Mark 3 ASME', product_model: '1K1.5X1-62 RV', tag_no: 'BG-305 A/B', qty: 2, seal_plan: 'Plan 23', mechanical_seal_drawing_no: null, created_at: '2026-08-11' },
  { id: 7, customer_id: 225, user_id: [9], pump_serial_no: '419924 - 419925', product_category: 'Durco Std', product_display: 'Overhung Mark 3 ASME', product_model: '2K4X3-10 RV', tag_no: 'BG-306 A/B', qty: 2, seal_plan: null, mechanical_seal_drawing_no: null, created_at: '2026-08-10' },
  { id: 8, customer_id: 225, user_id: [3], pump_serial_no: '419926 - 419927', product_category: 'Durco Std', product_display: 'Overhung Mark 3 ASME', product_model: '2K6X4-10 RV', tag_no: 'BG-308 A/B', qty: 2, seal_plan: null, mechanical_seal_drawing_no: null, created_at: '2026-08-10' },
  { id: 9, customer_id: 196, user_id: [3], pump_serial_no: '419930 - 419931', product_category: 'Durco Std', product_display: 'Overhung Mark 3 ASME', product_model: '1K1.5X1-62 RV', tag_no: 'BG-403 A/B', qty: 2, seal_plan: null, mechanical_seal_drawing_no: null, created_at: '2026-08-09' },
  { id: 10, customer_id: 204, user_id: [5], pump_serial_no: '419933 - 419934', product_category: 'Durco Std', product_display: 'Overhung Mark 3 ASME', product_model: '2K4X3-13 RV', tag_no: 'BG-405 A/B', qty: 2, seal_plan: null, mechanical_seal_drawing_no: null, created_at: '2026-08-09' },
  { id: 11, customer_id: 211, user_id: [3, 9], pump_serial_no: '419935 - 419936', product_category: 'Durco Lo Flo', product_display: 'Overhung Mark 3 Lo Flo', product_model: '2K2X1LF-10 OP', tag_no: 'BG-406 A/B', qty: 2, seal_plan: null, mechanical_seal_drawing_no: null, created_at: '2026-08-08' },
  { id: 12, customer_id: 225, user_id: [7], pump_serial_no: '419937 - 419938', product_category: 'Durco Lo Flo', product_display: 'Overhung Mark 3 Lo Flo', product_model: '2K2X1LF-10 OP', tag_no: 'BG-407 A/B', qty: 2, seal_plan: null, mechanical_seal_drawing_no: 'MSD-0088', created_at: '2026-08-08' },
  { id: 13, customer_id: null, user_id: [], pump_serial_no: '419939 - 419940', product_category: 'Durco Std', product_display: 'Overhung Mark 3 ASME', product_model: '2K3X2-13 RV', tag_no: 'BG-408 A/B', qty: 2, seal_plan: null, mechanical_seal_drawing_no: null, created_at: '2026-08-07' },
  { id: 14, customer_id: null, user_id: [], pump_serial_no: '419942 - 419943', product_category: 'Durco Std', product_display: 'Overhung Mark 3 ASME', product_model: '3K8X6-16 ARV', tag_no: 'BG-601 A/B', qty: 2, seal_plan: null, mechanical_seal_drawing_no: null, created_at: '2026-08-06' },
  { id: 15, customer_id: null, user_id: null, pump_serial_no: '419944 - 419945', product_category: 'Durco Std', product_display: 'Overhung Mark 3 ASME', product_model: '2K4X3-13 RV', tag_no: 'BG-703 A/B', qty: 2, seal_plan: null, mechanical_seal_drawing_no: null, created_at: '2026-08-06' },
  { id: 16, customer_id: null, user_id: [], pump_serial_no: '419946 - 419947', product_category: 'Durco Std', product_display: 'Overhung Mark 3 HRV', product_model: '2K4X3-13 HHRV', tag_no: 'BG-704 A/B', qty: 2, seal_plan: null, mechanical_seal_drawing_no: null, created_at: '2026-08-05' },
  { id: 17, customer_id: null, user_id: [], pump_serial_no: '419948 - 419949', product_category: 'Durco Std', product_display: 'Overhung Mark 3 ASME', product_model: '1K1.5X1-62 RV', tag_no: 'BG-705 A/B', qty: 2, seal_plan: null, mechanical_seal_drawing_no: null, created_at: '2026-08-05' },
  { id: 18, customer_id: null, user_id: null, pump_serial_no: '419950 - 419951', product_category: 'Durco Std', product_display: 'Overhung Mark 3 ASME', product_model: '2K4X3-13 RV', tag_no: 'BG-901 A/B', qty: 2, seal_plan: null, mechanical_seal_drawing_no: null, created_at: '2026-08-04' },
  { id: 19, customer_id: 196, user_id: [3, 5], pump_serial_no: '419952 - 419953', product_category: 'Durco Std', product_display: 'Overhung Mark 3 ASME', product_model: '2K3X2-13 RV', tag_no: 'BG-904 A/B', qty: 2, seal_plan: 'Plan 11', mechanical_seal_drawing_no: null, created_at: '2026-08-04' },
  { id: 20, customer_id: 204, user_id: [7, 9], pump_serial_no: '419954 - 419955', product_category: 'Durco Lo Flo', product_display: 'Overhung Mark 3 Lo Flo', product_model: '2K2X1LF-10 OP', tag_no: 'BG-905 A/B', qty: 2, seal_plan: null, mechanical_seal_drawing_no: null, created_at: '2026-08-03' },
])

/* ===================== HELPERS: resolve display value ===================== */
const getCustomerName = (id) => (id ? customersLookup[id] ?? `Customer #${id}` : null)
const getPicNames = (userIds) => {
  if (!Array.isArray(userIds) || userIds.length === 0) return []
  return userIds.map((uid) => usersLookup[uid] ?? `User #${uid}`)
}
const isAssignedToMe = (row) => Array.isArray(row.user_id) && row.user_id.includes(currentUser.value.id)
const isIncomplete = (row) => !row.customer_id && (!row.user_id || row.user_id.length === 0)

const rowStatus = (row) => {
  const noCustomer = !row.customer_id
  const noPic = !row.user_id || row.user_id.length === 0
  if (noCustomer && noPic) return { key: 'empty', label: 'Data Kosong' }
  if (noCustomer) return { key: 'no-customer', label: 'Belum Ada Customer' }
  if (noPic) return { key: 'no-pic', label: 'Belum Ada PIC' }
  return { key: 'complete', label: 'Lengkap' }
}

/* ===================== VIEW MODE (3 tampilan data) ===================== */
const viewModes = [
  {
    key: 'all',
    icon: 'table-list',
    label: 'Semua Data',
    desc: 'Menampilkan seluruh data product population tanpa filter.',
    color: '#6366f1',
  },
  {
    key: 'mine',
    icon: 'user-check',
    label: 'Customer Saya',
    desc: `Data yang sudah di-assign ke sales yang login (${currentUser.value.name}).`,
    color: '#16a34a',
  },
  {
    key: 'incomplete',
    icon: 'triangle-exclamation',
    label: 'Data Belum Lengkap',
    desc: 'Data yang belum ada nama customer dan belum ada PIC/sales sama sekali.',
    color: '#ef4444',
  },
]
const activeView = ref('all')

const viewCounts = computed(() => ({
  all: rows.value.length,
  mine: rows.value.filter(isAssignedToMe).length,
  incomplete: rows.value.filter(isIncomplete).length,
}))

const activeViewInfo = computed(() => viewModes.find((v) => v.key === activeView.value))

const viewFilteredRows = computed(() => {
  if (activeView.value === 'mine') return rows.value.filter(isAssignedToMe)
  if (activeView.value === 'incomplete') return rows.value.filter(isIncomplete)
  return rows.value
})

// Data yang sudah punya nama customer, tapi belum dipegang sales manapun.
// Ini yang nanti di-assign lewat modal "Assign Sales" (khusus admin/manager).
const unassignedRows = computed(() =>
  rows.value.filter((r) => r.customer_id && (!r.user_id || r.user_id.length === 0))
)
const unassignedCount = computed(() => unassignedRows.value.length)

/* ===================== SEARCH ===================== */
const searchQuery = ref('')
const filteredRows = computed(() => {
  if (!searchQuery.value) return viewFilteredRows.value
  const q = searchQuery.value.toLowerCase()
  return viewFilteredRows.value.filter((r) => {
    const haystack = [
      r.pump_serial_no,
      r.product_category,
      r.product_display,
      r.product_model,
      r.tag_no,
      r.seal_plan,
      r.mechanical_seal_drawing_no,
      getCustomerName(r.customer_id),
      ...getPicNames(r.user_id),
    ]
    return haystack.some((v) => String(v ?? '').toLowerCase().includes(q))
  })
})

/* ===================== SORT ===================== */
const sortBy = ref('created_at')
const sortDir = ref('Desc')
const sortByOptions = [
  { label: 'Created Date', value: 'created_at' },
  { label: 'Tag No', value: 'tag_no' },
  { label: 'Pump Serial No', value: 'pump_serial_no' },
  { label: 'Customer', value: 'customer' },
]
const sortByLabel = computed(() => sortByOptions.find((o) => o.value === sortBy.value)?.label ?? 'Created Date')

const sortedRows = computed(() => {
  return [...filteredRows.value].sort((a, b) => {
    let av
    let bv
    if (sortBy.value === 'customer') {
      av = getCustomerName(a.customer_id) ?? ''
      bv = getCustomerName(b.customer_id) ?? ''
    } else {
      av = a[sortBy.value] ?? ''
      bv = b[sortBy.value] ?? ''
    }
    const cmp = String(av).localeCompare(String(bv))
    return sortDir.value === 'Asc' ? cmp : -cmp
  })
})

/* ===================== PAGINATION ===================== */
const perPage = ref(10)
const currentPage = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(sortedRows.value.length / perPage.value)))
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return sortedRows.value.slice(start, start + perPage.value)
})

watch(activeView, () => { currentPage.value = 1 })
watch(sortedRows, () => { if (currentPage.value > totalPages.value) currentPage.value = totalPages.value })

/* ===================== DROPDOWNS ===================== */
const showExportMenu = ref(false)
const showImportMenu = ref(false)
const showPerPageMenu = ref(false)
const showSortByMenu = ref(false)
const showSortDirMenu = ref(false)

function handleReset() {
  searchQuery.value = ''
  sortBy.value = 'created_at'
  sortDir.value = 'Desc'
  perPage.value = 10
  currentPage.value = 1
  activeView.value = 'all'
}

function exportCSV() {
  const header = 'ID,Customer,Pump Serial No,Product Category,Product Display,Product Model,Tag No,Qty,Seal Plan,Mechanical Seal Drawing No,PIC,Created\n'
  const body = sortedRows.value
    .map((r) => [
      r.id,
      getCustomerName(r.customer_id) ?? '',
      r.pump_serial_no,
      r.product_category,
      r.product_display,
      r.product_model,
      r.tag_no,
      r.qty,
      r.seal_plan ?? '',
      r.mechanical_seal_drawing_no ?? '',
      getPicNames(r.user_id).join(' / '),
      r.created_at,
    ].map((v) => `"${v}"`).join(','))
    .join('\n')
  const blob = new Blob([header + body], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'customer_product_population.csv'
  a.click()
  URL.revokeObjectURL(url)
  showExportMenu.value = false
}
function exportExcel() { showExportMenu.value = false }
function exportPDF() { showExportMenu.value = false }

/* ===================== ADD / EDIT MODAL ===================== */
const isAddModalVisible = ref(false)
const isEdit = ref(false)
const selectedEditRow = ref(null)

const emptyForm = () => ({
  customer_id: '',
  pump_serial_no: '',
  product_category: productCategoryOptions[0],
  product_display: productDisplayOptions[0],
  product_model: '',
  tag_no: '',
  qty: 1,
  seal_plan: '',
  mechanical_seal_drawing_no: '',
  user_id: [],
})
const form = ref(emptyForm())

function openAddModal() {
  isEdit.value = false
  selectedEditRow.value = null
  form.value = emptyForm()
  isAddModalVisible.value = true
}
function openEditModal(row) {
  isEdit.value = true
  selectedEditRow.value = row
  form.value = {
    customer_id: row.customer_id ?? '',
    pump_serial_no: row.pump_serial_no,
    product_category: row.product_category,
    product_display: row.product_display,
    product_model: row.product_model,
    tag_no: row.tag_no,
    qty: row.qty,
    seal_plan: row.seal_plan ?? '',
    mechanical_seal_drawing_no: row.mechanical_seal_drawing_no ?? '',
    user_id: Array.isArray(row.user_id) ? [...row.user_id] : [],
  }
  isAddModalVisible.value = true
}
function closeAddModal() { isAddModalVisible.value = false }

function togglePic(uid) {
  const idx = form.value.user_id.indexOf(uid)
  if (idx > -1) form.value.user_id.splice(idx, 1)
  else form.value.user_id.push(uid)
}

function submitAddData() {
  if (!form.value.pump_serial_no.trim() || !form.value.tag_no.trim()) {
    alert('Pump Serial No dan Tag No wajib diisi!')
    return
  }
  const payload = {
    customer_id: form.value.customer_id ? Number(form.value.customer_id) : null,
    pump_serial_no: form.value.pump_serial_no,
    product_category: form.value.product_category,
    product_display: form.value.product_display,
    product_model: form.value.product_model,
    tag_no: form.value.tag_no,
    qty: Number(form.value.qty) || 1,
    seal_plan: form.value.seal_plan || null,
    mechanical_seal_drawing_no: form.value.mechanical_seal_drawing_no || null,
    user_id: form.value.user_id,
  }
  if (isEdit.value && selectedEditRow.value) {
    const idx = rows.value.findIndex((r) => r.id === selectedEditRow.value.id)
    if (idx > -1) rows.value[idx] = { ...rows.value[idx], ...payload }
  } else {
    rows.value.unshift({
      id: Math.max(0, ...rows.value.map((r) => r.id)) + 1,
      ...payload,
      created_at: new Date().toISOString().slice(0, 10),
    })
  }
  closeAddModal()
}

/* ===================== ASSIGN SALES MODAL (admin/manager only) ===================== */
const isAssignModalVisible = ref(false)
const assignSelectedIds = ref([])
const assignTargetUser = ref('')
const assignFeedback = ref('')

function openAssignModal() {
  assignSelectedIds.value = []
  assignTargetUser.value = ''
  assignFeedback.value = ''
  isAssignModalVisible.value = true
}
function closeAssignModal() { isAssignModalVisible.value = false }

function toggleAssignSelect(id) {
  const idx = assignSelectedIds.value.indexOf(id)
  if (idx > -1) assignSelectedIds.value.splice(idx, 1)
  else assignSelectedIds.value.push(id)
}
function toggleAssignSelectAll() {
  if (assignSelectedIds.value.length === unassignedRows.value.length) {
    assignSelectedIds.value = []
  } else {
    assignSelectedIds.value = unassignedRows.value.map((r) => r.id)
  }
}
function submitBulkAssign() {
  if (!assignTargetUser.value) { alert('Pilih sales tujuan terlebih dahulu.'); return }
  if (assignSelectedIds.value.length === 0) { alert('Pilih minimal 1 data customer.'); return }
  const targetId = Number(assignTargetUser.value)
  const targetName = usersLookup[targetId]
  const count = assignSelectedIds.value.length
  rows.value = rows.value.map((r) =>
    assignSelectedIds.value.includes(r.id) ? { ...r, user_id: [targetId] } : r
  )
  assignFeedback.value = `${count} data berhasil di-assign ke ${targetName}.`
  assignSelectedIds.value = []
  assignTargetUser.value = ''
}

/* ===================== DELETE MODAL ===================== */
const isDeleteModalVisible = ref(false)
const selectedRow = ref(null)
function openDeleteModal(row) { selectedRow.value = row; isDeleteModalVisible.value = true }
function closeDeleteModal() { isDeleteModalVisible.value = false; selectedRow.value = null }
function submitDeleteData() {
  rows.value = rows.value.filter((r) => r.id !== selectedRow.value.id)
  closeDeleteModal()
}

/* ===================== DETAIL MODAL ===================== */
const isDetailModalVisible = ref(false)
const detailRow = ref(null)
function openDetailModal(row) { detailRow.value = row; isDetailModalVisible.value = true }
function closeDetailModal() { isDetailModalVisible.value = false; detailRow.value = null }
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="table-list" />
          Customer Product Population
        </h4>

        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" />
            Dashboard
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Customer Product Population</span>
        </div>
      </div>
    </div>

    <!-- ===================== VIEW MODE SWITCHER ===================== -->
    <div class="view-card mb-2">
      <div class="view-tabs">
        <button
          v-for="v in viewModes" :key="v.key"
          class="view-tab" :class="{ active: activeView === v.key }"
          :style="activeView === v.key ? { '--tab-color': v.color } : {}"
          @click="activeView = v.key"
        >
          <font-awesome-icon :icon="v.icon" />
          <span>{{ v.label }}</span>
          <span class="view-tab-count">{{ viewCounts[v.key] }}</span>
        </button>
      </div>
      <p class="view-desc">
        <font-awesome-icon icon="circle-info" />
        {{ activeViewInfo?.desc }}
      </p>

      <p v-if="isPrivileged && activeView === 'all' && unassignedCount > 0" class="view-alert">
        <font-awesome-icon icon="triangle-exclamation" />
        Ada {{ unassignedCount }} data customer yang belum dipegang sales manapun.
        <button class="view-alert-link" @click="openAssignModal">Assign sekarang</button>
      </p>

      <div class="role-preview">
        <span class="role-preview-label">
          <font-awesome-icon icon="user-gear" /> Simulasi login sebagai (preview desain):
        </span>
        <div class="role-preview-buttons">
          <button
            v-for="r in rolePreviewOptions" :key="r.value"
            class="role-preview-btn" :class="{ active: currentUser.role === r.value }"
            @click="currentUser.role = r.value"
          >{{ r.label }}</button>
        </div>
      </div>
    </div>

    <div class="toolbar-top">
      <div class="toolbar-left">
        <div class="drop-wrap">
          <button class="btn-toolbar btn-purple" @click="showExportMenu = !showExportMenu">
            <font-awesome-icon icon="upload" /> Exports
            <font-awesome-icon icon="chevron-down" class="btn-arrow" />
          </button>
          <div class="drop-menu" :class="{ show: showExportMenu }">
            <div class="drop-label">Export Data</div>
            <button class="drop-item" @click="exportCSV">
              <font-awesome-icon icon="file-csv" style="color:#22c55e" /> Export CSV
            </button>
            <button class="drop-item" @click="exportExcel">
              <font-awesome-icon icon="file-excel" style="color:#16a34a" /> Export Excel
            </button>
            <button class="drop-item" @click="exportPDF">
              <font-awesome-icon icon="file-pdf" style="color:#ef4444" /> Export PDF
            </button>
          </div>
        </div>

        <div class="drop-wrap">
          <button class="btn-toolbar btn-purple" @click="showImportMenu = !showImportMenu">
            <font-awesome-icon icon="download" /> Imports
            <font-awesome-icon icon="chevron-down" class="btn-arrow" />
          </button>
          <div class="drop-menu" :class="{ show: showImportMenu }">
            <div class="drop-label">Import Data</div>
            <button class="drop-item">
              <font-awesome-icon icon="file-csv" style="color:#22c55e" /> Import CSV
            </button>
          </div>
        </div>
      </div>

      <button class="btn-toolbar btn-orange" @click="handleReset">
        <font-awesome-icon icon="rotate-left" /> Reset
      </button>
    </div>

    <div class="controls-card">
      <div class="controls-row">
        <div class="controls-left">
          <div class="showing-wrap">
            <font-awesome-icon icon="list" class="text-muted-color" />
            <span class="showing-label">Showing:</span>
            <div class="drop-wrap">
              <button class="btn-select" @click="showPerPageMenu = !showPerPageMenu">
                {{ perPage }} <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showPerPageMenu }">
                <div class="drop-label">Per halaman</div>
                <div class="perpage-grid">
                  <button
                    v-for="opt in [5, 10, 25, 50]" :key="opt"
                    class="perpage-opt" :class="{ active: perPage === opt }"
                    @click="perPage = opt; showPerPageMenu = false; currentPage = 1"
                  >{{ opt }}</button>
                </div>
              </div>
            </div>
          </div>
          <button class="btn-toolbar btn-purple" @click="openAddModal">
            <font-awesome-icon icon="plus" /> Add Data
          </button>
          <button
            v-if="isPrivileged && activeView === 'all'"
            class="btn-toolbar btn-teal"
            @click="openAssignModal"
          >
            <font-awesome-icon icon="user-plus" /> Assign Sales
            <span class="btn-count-badge">{{ unassignedCount }}</span>
          </button>
        </div>

        <div class="controls-right">
          <div class="search-wrap">
            <input v-model="searchQuery" type="text" placeholder="Searching...." class="search-input" @input="currentPage = 1" />
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
                  v-for="opt in sortByOptions" :key="opt.value" class="drop-item"
                  :class="{ active: sortBy === opt.value }"
                  @click="sortBy = opt.value; showSortByMenu = false"
                >{{ opt.label }}</button>
              </div>
            </div>
            <div class="drop-wrap">
              <button class="btn-select" @click="showSortDirMenu = !showSortDirMenu">
                {{ sortDir }} <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-right" :class="{ show: showSortDirMenu }">
                <div class="drop-label">Urutan</div>
                <button
                  v-for="opt in ['Desc', 'Asc']" :key="opt" class="drop-item"
                  :class="{ active: sortDir === opt }"
                  @click="sortDir = opt; showSortDirMenu = false"
                >{{ opt }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="table-card flex-grow-1 overflow-auto mb-3">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:56px">NO.</th>
            <th style="width:150px">PUMP SERIAL NO</th>
            <th style="width:190px">CUSTOMER</th>
            <th style="width:190px">PRODUCT</th>
            <th style="width:140px">MODEL</th>
            <th style="width:120px">TAG NO</th>
            <th style="width:60px">QTY</th>
            <th style="width:110px">SEAL PLAN</th>
            <th style="width:150px">MECH. SEAL DRAWING</th>
            <th style="width:150px">PIC / SALES</th>
            <th style="width:130px">STATUS</th>
            <th style="width:110px">CREATED</th>
            <th style="width:150px; text-align:center">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="13" class="td-center">
              <font-awesome-icon icon="spinner" spin /> Memuat data...
            </td>
          </tr>
          <tr v-else-if="paginatedRows.length === 0">
            <td colspan="13" class="td-center">
              <div class="empty-state">
                <font-awesome-icon icon="inbox" class="empty-icon" />
                <div>Tidak ada data ditemukan</div>
              </div>
            </td>
          </tr>
          <tr v-else v-for="(row, index) in paginatedRows" :key="row.id" class="data-row">
            <td class="td-no">{{ (currentPage - 1) * perPage + index + 1 }}.</td>
            <td class="td-mono">{{ row.pump_serial_no }}</td>
            <td>
              <span v-if="getCustomerName(row.customer_id)" class="td-name">{{ getCustomerName(row.customer_id) }}</span>
              <span v-else class="missing-badge"><font-awesome-icon icon="ban" /> Belum Ada Customer</span>
            </td>
            <td>
              <div class="td-name">{{ row.product_category }}</div>
              <div class="td-muted td-submuted">{{ row.product_display }}</div>
            </td>
            <td class="td-mono">{{ row.product_model }}</td>
            <td class="td-mono">{{ row.tag_no }}</td>
            <td>{{ row.qty }}</td>
            <td class="td-muted">{{ row.seal_plan ?? '-' }}</td>
            <td class="td-muted">{{ row.mechanical_seal_drawing_no ?? '-' }}</td>
            <td>
              <div v-if="getPicNames(row.user_id).length" class="pic-chip-list">
                <span v-for="name in getPicNames(row.user_id)" :key="name" class="pic-chip" :class="{ me: name === currentUser.name }">{{ name }}</span>
              </div>
              <span v-else class="missing-badge"><font-awesome-icon icon="user-slash" /> Belum Ada PIC</span>
            </td>
            <td>
              <span class="status-badge" :class="`status-${rowStatus(row).key}`">{{ rowStatus(row).label }}</span>
            </td>
            <td class="td-muted">{{ row.created_at }}</td>
            <td class="td-actions">
              <button class="act-btn act-edit" @click="openEditModal(row)" title="Edit">
                <font-awesome-icon icon="pen-to-square" />
              </button>
              <button class="act-btn act-delete" @click="openDeleteModal(row)" title="Hapus">
                <font-awesome-icon icon="trash-can" />
              </button>
              <button class="act-btn act-info" @click="openDetailModal(row)" title="Detail">
                <font-awesome-icon icon="circle-info" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination-card">
      <div class="pagination-nav">
        <button class="btn-prev-next" :disabled="currentPage === 1" @click="currentPage--">
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button class="btn-prev-next" :disabled="currentPage === totalPages" @click="currentPage++">
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">{{ paginatedRows.length }} DATA | ON PAGE {{ currentPage }}</span>
        <span class="page-badge">TOTAL: {{ sortedRows.length }}</span>
      </div>
    </div>

    <Teleport to="body">

      <!-- ===================== ADD / EDIT MODAL ===================== -->
      <div v-if="isAddModalVisible" class="modal-overlay" @click.self="closeAddModal">
        <div class="modal-box modal-lg">
          <div class="modal-header">
            <h5 class="modal-title">
              <font-awesome-icon :icon="isEdit ? 'pen' : 'plus'" />
              {{ isEdit ? 'Edit Product Population' : 'Add Product Population' }}
            </h5>
            <button class="modal-close" @click="closeAddModal">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>
          <div class="modal-body">
            <div class="form-grid-2">

              <div class="form-group">
                <label>Customer</label>
                <select v-model="form.customer_id" class="form-input form-select">
                  <option value="">— Belum ada customer —</option>
                  <option v-for="(name, id) in customersLookup" :key="id" :value="id">{{ name }}</option>
                </select>
              </div>

              <div class="form-group">
                <label>Pump Serial No</label>
                <input v-model="form.pump_serial_no" class="form-input" placeholder="e.g. 419974 - 419975" />
              </div>

              <div class="form-group">
                <label>Product Category</label>
                <select v-model="form.product_category" class="form-input form-select">
                  <option v-for="opt in productCategoryOptions" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </div>

              <div class="form-group">
                <label>Product Display</label>
                <select v-model="form.product_display" class="form-input form-select">
                  <option v-for="opt in productDisplayOptions" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </div>

              <div class="form-group">
                <label>Product Model</label>
                <input v-model="form.product_model" class="form-input" placeholder="e.g. 2K6X4-10 HRV" />
              </div>

              <div class="form-group">
                <label>Tag No</label>
                <input v-model="form.tag_no" class="form-input" placeholder="e.g. BG-111 A/B" />
              </div>

              <div class="form-group">
                <label>Qty</label>
                <input v-model="form.qty" type="number" min="1" class="form-input" />
              </div>

              <div class="form-group">
                <label>Seal Plan</label>
                <input v-model="form.seal_plan" class="form-input" placeholder="e.g. Plan 11" />
              </div>

              <div class="form-group form-span-2">
                <label>Mechanical Seal Drawing No</label>
                <input v-model="form.mechanical_seal_drawing_no" class="form-input" placeholder="e.g. MSD-0021" />
              </div>

              <div class="form-group form-span-2">
                <label>PIC / Sales yang menangani</label>
                <div class="pic-checkbox-grid">
                  <label v-for="(name, id) in usersLookup" :key="id" class="pic-checkbox">
                    <input
                      type="checkbox"
                      :checked="form.user_id.includes(Number(id))"
                      @change="togglePic(Number(id))"
                    />
                    <span>{{ name }}</span>
                  </label>
                </div>
              </div>

            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeAddModal">Cancel</button>
            <button class="btn-save" @click="submitAddData">
              <font-awesome-icon icon="check" />
              {{ isEdit ? 'Update' : 'Save Data' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ===================== ASSIGN SALES MODAL (admin/manager only) ===================== -->
      <div v-if="isAssignModalVisible" class="modal-overlay" @click.self="closeAssignModal">
        <div class="modal-box modal-lg">
          <div class="modal-header">
            <h5 class="modal-title">
              <font-awesome-icon icon="user-plus" />
              Assign Sales ke Data Customer
            </h5>
            <button class="modal-close" @click="closeAssignModal">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>
          <div class="modal-body">
            <p class="assign-info">
              Data di bawah ini sudah punya nama customer, tapi belum ada sales yang memegang.
              Pilih datanya, tentukan sales tujuan, lalu klik Assign.
            </p>

            <p v-if="assignFeedback" class="assign-feedback">
              <font-awesome-icon icon="circle-check" /> {{ assignFeedback }}
            </p>

            <div v-if="unassignedRows.length === 0" class="empty-state assign-empty">
              <font-awesome-icon icon="circle-check" class="empty-icon" style="color:#16a34a" />
              <div>Semua data customer sudah ada PIC-nya.</div>
            </div>

            <template v-else>
              <div class="assign-toolbar">
                <label class="pic-checkbox assign-select-all">
                  <input
                    type="checkbox"
                    :checked="assignSelectedIds.length === unassignedRows.length"
                    @change="toggleAssignSelectAll"
                  />
                  <span>Pilih Semua ({{ unassignedRows.length }})</span>
                </label>

                <div class="assign-target">
                  <select v-model="assignTargetUser" class="form-input form-select">
                    <option value="">— Pilih sales tujuan —</option>
                    <option v-for="(name, id) in usersLookup" :key="id" :value="id">{{ name }}</option>
                  </select>
                  <button class="btn-save" @click="submitBulkAssign">
                    <font-awesome-icon icon="user-plus" /> Assign ({{ assignSelectedIds.length }})
                  </button>
                </div>
              </div>

              <div class="assign-list">
                <label v-for="row in unassignedRows" :key="row.id" class="assign-row">
                  <input
                    type="checkbox"
                    :checked="assignSelectedIds.includes(row.id)"
                    @change="toggleAssignSelect(row.id)"
                  />
                  <div class="assign-row-info">
                    <div class="assign-row-customer">{{ getCustomerName(row.customer_id) }}</div>
                    <div class="assign-row-sub">{{ row.tag_no }} &middot; {{ row.pump_serial_no }} &middot; {{ row.product_model }}</div>
                  </div>
                  <span class="assign-row-qty">Qty {{ row.qty }}</span>
                </label>
              </div>
            </template>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeAssignModal">Close</button>
          </div>
        </div>
      </div>

      <!-- ===================== DELETE MODAL ===================== -->
      <div v-if="isDeleteModalVisible" class="modal-overlay" @click.self="closeDeleteModal">
        <div class="modal-box modal-sm">
          <div class="modal-body text-center py-4">
            <div class="delete-icon-wrap">
              <font-awesome-icon icon="triangle-exclamation" />
            </div>
            <h5 class="modal-danger-title">Delete Product Population?</h5>
            <p class="modal-danger-text">
              Yakin ingin menghapus data dengan tag no <strong>"{{ selectedRow?.tag_no }}"</strong>?
              Tindakan ini tidak bisa dibatalkan.
            </p>
          </div>
          <div class="modal-footer justify-content-center">
            <button class="btn-cancel" @click="closeDeleteModal">Cancel</button>
            <button class="btn-danger" @click="submitDeleteData">
              <font-awesome-icon icon="trash-can" /> Yes, Delete
            </button>
          </div>
        </div>
      </div>

      <!-- ===================== DETAIL MODAL ===================== -->
      <div v-if="isDetailModalVisible" class="modal-overlay" @click.self="closeDetailModal">
        <div class="modal-box">
          <div class="modal-header">
            <h5 class="modal-title">
              <font-awesome-icon icon="circle-info" /> Product Population Details
            </h5>
            <button class="modal-close" @click="closeDetailModal">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>
          <div class="modal-body">
            <div class="detail-list">
              <div class="detail-row">
                <span class="detail-label">ID</span>
                <span class="detail-value mono">#{{ detailRow?.id }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Customer</span>
                <span v-if="getCustomerName(detailRow?.customer_id)" class="detail-badge">{{ getCustomerName(detailRow?.customer_id) }}</span>
                <span v-else class="missing-badge"><font-awesome-icon icon="ban" /> Belum Ada Customer</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Pump Serial No</span>
                <span class="detail-value mono">{{ detailRow?.pump_serial_no }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Product Category</span>
                <span class="detail-value">{{ detailRow?.product_category }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Product Display</span>
                <span class="detail-value">{{ detailRow?.product_display }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Product Model</span>
                <span class="detail-value mono">{{ detailRow?.product_model }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Tag No</span>
                <span class="detail-value mono">{{ detailRow?.tag_no }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Qty</span>
                <span class="detail-value font-semibold">{{ detailRow?.qty }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Seal Plan</span>
                <span class="detail-value">{{ detailRow?.seal_plan ?? '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Mech. Seal Drawing No</span>
                <span class="detail-value">{{ detailRow?.mechanical_seal_drawing_no ?? '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">PIC / Sales</span>
                <div v-if="detailRow && getPicNames(detailRow.user_id).length" class="pic-chip-list">
                  <span v-for="name in getPicNames(detailRow.user_id)" :key="name" class="pic-chip">{{ name }}</span>
                </div>
                <span v-else class="missing-badge"><font-awesome-icon icon="user-slash" /> Belum Ada PIC</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Data Status</span>
                <span v-if="detailRow" class="status-badge" :class="`status-${rowStatus(detailRow).key}`">{{ rowStatus(detailRow).label }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Created At</span>
                <span class="detail-value">{{ detailRow?.created_at }}</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeDetailModal">Close</button>
          </div>
        </div>
      </div>

    </Teleport>
  </div>
</template>

<style scoped>
/* ===== BREADCRUMB ===== */
.breadcrumb-card {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 16px 18px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px var(--shadow-color);
}
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title {
  display: flex; align-items: center; gap: 10px; margin: 0;
  font-size: 1.1rem; font-weight: 800; color: var(--text-primary);
}
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

/* ===== VIEW MODE SWITCHER ===== */
.view-card {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 14px 16px;
  box-shadow: 0 1px 3px var(--shadow-color);
}
.view-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.view-tab {
  --tab-color: #6366f1;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 10px;
  border: 1.5px solid var(--border-main);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}
.view-tab:hover { border-color: var(--tab-color); color: var(--tab-color); }
.view-tab.active {
  background: var(--tab-color);
  border-color: var(--tab-color);
  color: #fff;
}
.view-tab-count {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 1px 8px;
  border-radius: 99px;
  background: rgba(255,255,255,0.25);
}
.view-tab:not(.active) .view-tab-count {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  color: var(--text-muted);
}
.view-desc {
  margin: 10px 2px 0;
  font-size: 0.8rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}
.view-alert {
  margin: 10px 2px 0;
  font-size: 0.8rem;
  color: #b45309;
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.25);
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.view-alert-link {
  background: none;
  border: none;
  color: #6366f1;
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
  font-size: 0.8rem;
  padding: 0;
}
.role-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-main);
}
.role-preview-label {
  font-size: 0.78rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}
.role-preview-buttons { display: flex; gap: 6px; }
.role-preview-btn {
  padding: 5px 12px;
  border-radius: 99px;
  border: 1.5px solid var(--border-main);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.role-preview-btn:hover { border-color: #6366f1; color: #6366f1; }
.role-preview-btn.active { background: #6366f1; border-color: #6366f1; color: #fff; }

.toolbar-top {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--bg-card); border-radius: 10px; padding: 12px 16px;
  margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color);
  flex-wrap: wrap; gap: 8px;
}
.toolbar-left { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-toolbar {
  display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px;
  border: none; border-radius: 8px; font-size: 0.83rem; font-weight: 600;
  cursor: pointer; transition: all 0.18s ease; white-space: nowrap;
}
.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover { background: #4f46e5; }
.btn-orange { background: #f59e0b; color: #fff; }
.btn-orange:hover { background: #d97706; }
.btn-teal { background: #0d9488; color: #fff; }
.btn-teal:hover { background: #0f766e; }
.btn-count-badge {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 1px 7px;
  border-radius: 99px;
  background: rgba(255,255,255,0.25);
  margin-left: 2px;
}
.btn-arrow { font-size: 0.6rem; opacity: 0.7; }
.controls-card {
  background: var(--bg-card); border-radius: 10px; padding: 14px 16px;
  margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color);
}
.controls-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.controls-left, .controls-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.showing-wrap { display: flex; align-items: center; gap: 6px; font-size: 0.84rem; color: var(--text-primary); font-weight: 600; }
.showing-label { white-space: nowrap; color: var(--text-muted); font-size: 0.83rem; }
.text-muted-color { color: var(--text-muted); }
.search-wrap { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.search-input { padding: 7px 12px; border: none; background: transparent; color: var(--text-primary); font-size: 0.84rem; outline: none; width: 200px; }
.search-input::placeholder { color: var(--text-muted); }
.search-btn { padding: 7px 12px; background: #6366f1; color: #fff; border: none; cursor: pointer; }
.search-btn:hover { background: #4f46e5; }
.sort-wrap { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.drop-wrap { position: relative; }
.btn-select {
  display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
  background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-main);
  border-radius: 7px; font-size: 0.83rem; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.15s;
}
.btn-select:hover { border-color: #6366f1; color: #6366f1; }
.drop-menu {
  position: absolute; top: calc(100% + 6px); left: 0; min-width: 160px;
  background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 10px; z-index: 200;
  opacity: 0; transform: translateY(-6px); pointer-events: none; transition: all 0.18s ease;
}
.drop-right { left: auto; right: 0; }
.drop-menu.show { opacity: 1; transform: translateY(0); pointer-events: all; }
.drop-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; padding: 0 4px; }
.drop-item {
  width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px;
  background: none; border: none; border-radius: 7px; color: var(--text-primary);
  font-size: 0.84rem; cursor: pointer; transition: background 0.15s; text-align: left;
}
.drop-item:hover { background: var(--bg-nav-hover); }
.drop-item.active { color: #6366f1; font-weight: 600; background: rgba(99,102,241,0.08); }
.perpage-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.perpage-opt {
  padding: 5px 10px; border: 1px solid var(--border-main); border-radius: 6px;
  background: var(--bg-input); color: var(--text-primary); font-size: 0.82rem; cursor: pointer; transition: all 0.15s;
}
.perpage-opt:hover  { border-color: #6366f1; color: #6366f1; }
.perpage-opt.active { background: #6366f1; border-color: #6366f1; color: #fff; font-weight: 700; }

.table-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); overflow: auto; }
.data-table { width: 100%; min-width: 1500px; border-collapse: collapse; font-size: 0.875rem; }
.data-table thead tr { background: var(--bg-input); border-bottom: 2px solid var(--border-main); position: sticky; top: 0; z-index: 2; }
.data-table th { padding: 12px 16px; text-align: left; font-size: 0.72rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; }
.data-table tbody tr { border-bottom: 1px solid var(--border-main); transition: background 0.15s; }
.data-table tbody tr:last-child { border-bottom: none; }
.data-row:hover { background: var(--bg-nav-hover); }
.data-table td { padding: 12px 16px; vertical-align: middle; color: var(--text-primary); white-space: nowrap; }
.td-no     { color: var(--text-muted); font-weight: 600; }
.td-name   { font-weight: 600; }
.td-mono   { font-family: monospace; font-size: 0.82rem; }
.td-muted  { color: var(--text-muted); font-size: 0.82rem; }
.td-submuted { font-size: 0.74rem; margin-top: 2px; }
.td-center { text-align: center; padding: 40px; color: var(--text-muted); white-space: normal; }
.td-actions { text-align: center; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--text-muted); }
.empty-icon  { font-size: 2rem; opacity: 0.3; }
.act-btn {
  width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer;
  font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center;
  transition: all 0.18s ease; margin: 0 2px; background: transparent;
}
.act-edit         { color: #f59e0b; border-color: #f59e0b; }
.act-edit:hover   { background: #f59e0b; color: #fff; }
.act-delete       { color: #ef4444; border-color: #ef4444; }
.act-delete:hover { background: #ef4444; color: #fff; }
.act-info         { color: #6366f1; border-color: #6366f1; }
.act-info:hover   { background: #6366f1; color: #fff; }

/* Missing-data & status badges */
.missing-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 0.72rem; font-weight: 700; padding: 4px 9px; border-radius: 6px;
  background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.25);
  white-space: nowrap;
}
.status-badge { font-size: 0.72rem; font-weight: 700; padding: 4px 10px; border-radius: 99px; white-space: nowrap; }
.status-complete    { background: rgba(34,197,94,0.12);  color: #16a34a; }
.status-no-customer { background: rgba(245,158,11,0.14); color: #b45309; }
.status-no-pic      { background: rgba(245,158,11,0.14); color: #b45309; }
.status-empty       { background: rgba(239,68,68,0.14);  color: #dc2626; }

.pic-chip-list { display: flex; flex-wrap: wrap; gap: 4px; }
.pic-chip {
  font-size: 0.72rem; font-weight: 600; padding: 3px 9px; border-radius: 99px;
  background: rgba(99,102,241,0.1); color: #6366f1; border: 1px solid rgba(99,102,241,0.2);
}
.pic-chip.me { background: rgba(34,197,94,0.12); color: #16a34a; border-color: rgba(34,197,94,0.25); }

/* ===== PAGINATION ===== */
.pagination-card {
  background: var(--bg-card); border-radius: 10px; padding: 14px 18px;
  box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: row-reverse;
  align-items: center; justify-content: space-between; gap: 12px;
}
.pagination-nav { display: flex; align-items: center; gap: 8px; }
.btn-prev-next {
  display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px;
  background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem;
  font-weight: 700; cursor: pointer; min-width: 85px; justify-content: center; transition: background 0.18s ease;
}
.btn-prev-next:hover:not(:disabled) { background: #4f46e5; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badges { display: flex; gap: 8px; align-items: center; }
.page-badge {
  padding: 7px 14px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.72rem;
  font-weight: 700; color: var(--text-muted); background: var(--bg-input); white-space: nowrap; letter-spacing: 0.04em;
}

@media (max-width: 576px) {
  .pagination-card { flex-direction: column; padding: 12px; gap: 12px; }
  .pagination-nav { width: 100%; justify-content: space-between; }
  .btn-prev-next { flex: 1; max-width: 48%; padding: 10px 14px; }
  .page-badges { width: 100%; justify-content: center; flex-wrap: wrap; }
  .page-badge { flex: 1; text-align: center; font-size: 0.7rem; }
  .view-tabs { flex-direction: column; }
  .view-tab { width: 100%; justify-content: space-between; }
}

/* ===== MODAL ===== */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000;
  display: flex; align-items: center; justify-content: center; padding: 20px;
  backdrop-filter: blur(2px); animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal-box {
  background: var(--bg-card); border-radius: 14px; width: 100%; max-width: 460px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: slideUp 0.22s ease;
}
.modal-sm { max-width: 360px; }
.modal-lg { max-width: 640px; }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--border-main); }
.modal-title { display: flex; align-items: center; gap: 8px; font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.modal-title svg { color: #6366f1; }
.modal-close { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1rem; padding: 4px 6px; border-radius: 6px; transition: all 0.15s; }
.modal-close:hover { background: var(--bg-nav-hover); color: var(--text-primary); }
.modal-body { padding: 20px; max-height: 70vh; overflow-y: auto; }
.modal-footer { display: flex; gap: 10px; justify-content: flex-end; padding: 14px 20px; border-top: 1px solid var(--border-main); }
.justify-content-center { justify-content: center !important; }

.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-span-2 { grid-column: 1 / -1; }
@media (max-width: 560px) { .form-grid-2 { grid-template-columns: 1fr; } }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.form-input {
  padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.875rem;
  background: var(--bg-input); color: var(--text-primary); outline: none; transition: border 0.18s; width: 100%;
}
.form-input:focus { border-color: #6366f1; }
.form-select {
  cursor: pointer; appearance: none; -webkit-appearance: none; -moz-appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, #64748b 50%), linear-gradient(135deg, #64748b 50%, transparent 50%);
  background-position: calc(100% - 20px) calc(50% - 2px), calc(100% - 14px) calc(50% - 2px);
  background-size: 6px 6px; background-repeat: no-repeat; padding-right: 40px;
}
.form-select:focus {
  background-image: linear-gradient(45deg, transparent 50%, #6366f1 50%), linear-gradient(135deg, #6366f1 50%, transparent 50%);
}

.pic-checkbox-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
@media (max-width: 560px) { .pic-checkbox-grid { grid-template-columns: 1fr; } }
.pic-checkbox {
  display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: 1px solid var(--border-main);
  border-radius: 8px; background: var(--bg-input); font-size: 0.84rem; color: var(--text-primary); cursor: pointer;
}
.pic-checkbox input { accent-color: #6366f1; width: 15px; height: 15px; cursor: pointer; }

.assign-info { font-size: 0.84rem; color: var(--text-muted); margin: 0 0 14px; line-height: 1.6; }
.assign-feedback {
  font-size: 0.82rem;
  color: #16a34a;
  background: rgba(34,197,94,0.1);
  border: 1px solid rgba(34,197,94,0.25);
  border-radius: 8px;
  padding: 8px 12px;
  margin: 0 0 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.assign-empty { padding: 30px 10px; }
.assign-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-main);
}
.assign-select-all { background: transparent; border: none; padding: 0; }
.assign-target { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.assign-target .form-select { min-width: 170px; }
.assign-list { display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; }
.assign-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--border-main);
  border-radius: 8px;
  background: var(--bg-input);
  cursor: pointer;
  transition: border-color 0.15s;
}
.assign-row:hover { border-color: #6366f1; }
.assign-row input { accent-color: #6366f1; width: 16px; height: 16px; cursor: pointer; flex-shrink: 0; }
.assign-row-info { flex: 1; min-width: 0; }
.assign-row-customer { font-weight: 700; font-size: 0.85rem; color: var(--text-primary); }
.assign-row-sub { font-size: 0.76rem; color: var(--text-muted); margin-top: 2px; white-space: normal; }
.assign-row-qty { font-size: 0.76rem; font-weight: 700; color: #6366f1; flex-shrink: 0; }

.btn-cancel {
  padding: 8px 18px; background: var(--bg-main); color: var(--text-muted); border: 1px solid var(--border-main);
  border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer;
}
.btn-cancel:hover { background: var(--border-main); }
.btn-save {
  display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff;
  border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer;
}
.btn-save:hover { background: #4f46e5; }
.btn-danger {
  display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #ef4444; color: #fff;
  border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer;
}
.btn-danger:hover { background: #dc2626; }
.delete-icon-wrap {
  width: 60px; height: 60px; border-radius: 50%; background: rgba(239,68,68,0.1); color: #ef4444;
  display: flex; align-items: center; justify-content: center; font-size: 1.6rem; margin: 0 auto 14px;
}
.modal-danger-title { font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
.modal-danger-text  { font-size: 0.84rem; color: var(--text-muted); padding: 0 10px; line-height: 1.6; }
.detail-list { display: flex; flex-direction: column; }
.detail-row {
  display: flex; align-items: center; justify-content: space-between; padding: 12px 0;
  border-bottom: 1px solid var(--border-main); gap: 12px;
}
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.detail-value { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); text-align: right; }
.font-semibold { font-weight: 600; }
.mono { font-family: monospace; font-weight: 700; }
.detail-badge {
  font-size: 0.82rem; font-weight: 600; padding: 3px 12px; border-radius: 6px;
  background: rgba(99,102,241,0.1); color: #6366f1; border: 1px solid rgba(99,102,241,0.2);
}
</style>