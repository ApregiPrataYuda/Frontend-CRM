<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import AppModal from '@/components/AppModal.vue'
import { useConfirm } from '@/composables/useConfirm'
import { useProductPopulationsStore } from '@/stores/productPopulationsStore'
import { usePermissionStore } from '@/stores/PermissionStore'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'

const { confirm } = useConfirm()
const store       = useProductPopulationsStore()
const permission  = usePermissionStore()
const route       = useRoute()

const {
  productPopulationsData, loadingProductPopulations, searchProductPopulations,
  pagination, sort, errorProductPopulations,
  savingProductPopulations, updatingProductPopulations, deletingProductPopulations,
  productPopulationDetail, loadingDetail,

  view, counts, loadingCounts,

  salesSelectData,
  customerSuggestions, searchingCustomer,

  unassignedData, loadingUnassigned, searchUnassigned, errorUnassignedFetch,
  assigningSales, errorAssign,
} = storeToRefs(store)

// ── PERMISSIONS ───────────────────────────────────────
const currentUrl = computed(() => route.path.replace('/app', ''))
const canCreate  = computed(() => permission.canCreate(currentUrl.value))
const canUpdate  = computed(() => permission.canUpdate(currentUrl.value))
const canDelete  = computed(() => permission.canDelete(currentUrl.value))
const canView    = computed(() => permission.canView(currentUrl.value))

// ── ROLE CHECK: admin/manager vs sales ────────────────
// Sama seperti aturan di backend ensurePrivileged() (role_id 2 = Sales,
// selain itu dianggap privileged/admin-manager). Dipakai buat:
//  1. Nampilin tombol "Assign Sales" di tab Semua Data.
//  2. Nyembunyiin section "PIC / Sales yang menangani" di modal Add/Edit,
//     biar Sales nggak bisa iseng reassign data ke sales lain.
//
// NOTE: saya nggak punya visibility ke auth store project ini, jadi
// role_id user yang login saya ambil dari localStorage key "user" —
// asumsi ini sesuai response login yang kamu kasih contohnya kemarin
// ({ ..., "user": { "id":10, "fullname":"Budhi", ..., "role_id":3 } }).
// Kalau ternyata user login disimpan di tempat lain (misal Pinia
// authStore / key localStorage lain), tinggal sesuaikan isi
// getLoggedInRoleId() ini aja, bagian lain nggak perlu diubah.
function getLoggedInRoleId() {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.role_id ?? null
  } catch (e) {
    console.error('Gagal baca role_id user login:', e)
    return null
  }
}

const loggedInRoleId = getLoggedInRoleId()
const canAssignSales = computed(() => Number(loggedInRoleId) !== 2)

// ── VIEW MODE (all / mine / incomplete) — config statis buat tab ──
const viewModes = [
  { key: 'all',        icon: 'table-list',            label: 'Semua Data',        desc: 'Menampilkan seluruh data product population tanpa filter.',                     color: '#6366f1' },
  { key: 'mine',       icon: 'user-check',             label: 'Customer Saya',     desc: 'Data yang sudah di-assign ke sales yang login.',                                 color: '#16a34a' },
  { key: 'incomplete', icon: 'triangle-exclamation',   label: 'Data Belum Lengkap',desc: 'Data yang belum ada nama customer dan belum ada PIC/sales sama sekali.',        color: '#ef4444' },
]
const activeViewInfo = () => viewModes.find(v => v.key === store.view)

// ── LIFECYCLE ───────────────────────────────────────────
onMounted(async () => {
  await store.fetchProductPopulations()
  await store.fetchCounts()
  await store.fetchSalesSelect()
})

onUnmounted(() => {
  if (toastTimer) clearTimeout(toastTimer)
})

// ── TOOLBAR TOGGLES ─────────────────────────────────────
const showExportProductPopulations  = ref(false)
const showImportProductPopulations  = ref(false)
const showPerPageProductPopulations = ref(false)
const showSortByProductPopulations  = ref(false)
const showSortDirProductPopulations = ref(false)

// NOTE: value di sini harus persis sama dengan whitelist $allowedSort di
// CustomersProductPopulation@index (pakai alias tabel "pp." di backend).
const sortByOptions = [
  { label: 'Created Date',   value: 'pp.created_at' },
  { label: 'Tag No',         value: 'pp.tag_no' },
  { label: 'Pump Serial No', value: 'pp.pump_serial_no' },
  { label: 'Qty',            value: 'pp.qty' },
  { label: 'Customer',       value: 'customer_name' },
]
const sortByLabel = () =>
  sortByOptions.find(o => o.value === store.sort.column)?.label ?? 'Created Date'

// ── EXPORT (hanya data di halaman aktif, sama seperti module Customers) ──
function exportCSV() {
  const header = 'ID,Customer,Pump Serial No,Product Category,Product Display,Product Model,Tag No,Qty,Seal Plan,Mechanical Seal Drawing No,PIC,Created\n'
  const rows = store.productPopulationsData.map(item => [
    item.id,
    item.customer?.name ?? '',
    item.pump_serial_no,
    item.product_category,
    item.product_display,
    item.product_model,
    item.tag_no,
    item.qty,
    item.seal_plan ?? '',
    item.mechanical_seal_drawing_no ?? '',
    (item.pic_list || []).map(p => p.name).join(' / '),
    item.created_at,
  ].map(v => `"${v ?? ''}"`).join(',')).join('\n')

  const blob = new Blob([header + rows], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'product_populations.csv'; a.click()
  URL.revokeObjectURL(url)
  showExportProductPopulations.value = false
}
function exportExcel() { showExportProductPopulations.value = false }
function exportPDF()   { showExportProductPopulations.value = false }

// ── ERROR HELPER ────────────────────────────────────────
function getError(field) {
  if (!errorProductPopulations.value || typeof errorProductPopulations.value !== 'object') return null
  return errorProductPopulations.value[field]?.[0] ?? null
}
function getAssignError(field) {
  if (!errorAssign.value || typeof errorAssign.value !== 'object') return null
  return errorAssign.value[field]?.[0] ?? null
}

// ── TOAST ───────────────────────────────────────────────
const toast      = ref({ show: false, type: '', message: '' })
let   toastTimer = null

function showToast(type, message) {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { show: true, type, message }
  toastTimer  = setTimeout(() => { toast.value.show = false }, 3000)
}

// ── DETAIL MODAL ────────────────────────────────────────
const isDetailModalVisible = ref(false)

async function openDetailModal(id) {
  isDetailModalVisible.value = true
  await store.detailProductPopulation(id)
}
function closeDetailModal() {
  isDetailModalVisible.value  = false
  productPopulationDetail.value = null
}

// ── DELETE ──────────────────────────────────────────────
async function openDeleteModal(item) {
  const isConfirmed = await confirm({
    type       : 'danger',
    title      : 'Hapus Data Product Population',
    message    : `Yakin ingin menghapus data dengan tag no "${item.tag_no || item.pump_serial_no}"?`,
    detail     : 'Tindakan ini tidak bisa dibatalkan dan akan menghapus data secara permanen.',
    confirmText: 'Yes, Delete',
    cancelText : 'Cancel',
  })

  if (isConfirmed) {
    try {
      await store.deleteProductPopulation(item.id)
      showToast('success', 'Data product population berhasil dihapus!')
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal menghapus, coba lagi.'
      showToast('error', message)
    }
  }
}

// ── FORM ADD / EDIT ─────────────────────────────────────
const isAddModalVisible = ref(false)
const isEdit            = ref(false)
const editId             = ref(null)
const formLoading       = ref(false)

const defaultForm = {
  pump_serial_no             : '',
  product_category           : '',
  product_display            : '',
  product_model               : '',
  tag_no                      : '',
  qty                         : 1,
  seal_plan                   : '',
  mechanical_seal_drawing_no  : '',
}
const formData = ref({ ...defaultForm })

// PIC (kolom user_id, array of sales id) dikelola terpisah lewat checkbox grid
const selectedPic = ref([])

function togglePic(uid) {
  const idx = selectedPic.value.indexOf(uid)
  if (idx > -1) selectedPic.value.splice(idx, 1)
  else selectedPic.value.push(uid)
}

// ── CUSTOMER (autocomplete, reuse pattern company-name Customers module) ──
const customerSearchInput = ref('')
const selectedCustomer    = ref(null)

function pickCustomer(c) {
  selectedCustomer.value       = c
  formData.value.customer_id   = c.id
  customerSuggestions.value    = []
  customerSearchInput.value    = c.company_name
}
function clearCustomer() {
  selectedCustomer.value     = null
  formData.value.customer_id = ''
  customerSearchInput.value  = ''
}

function resetForm() {
  formData.value             = { ...defaultForm }
  selectedPic.value          = []
  selectedCustomer.value     = null
  customerSearchInput.value  = ''
  customerSuggestions.value  = []
  errorProductPopulations.value = null
}

function openAddModal() {
  isEdit.value             = false
  editId.value              = null
  resetForm()
  isAddModalVisible.value  = true
}

async function openEditModal(item) {
  isEdit.value = true
  editId.value  = item.id
  resetForm()

  formLoading.value = true
  await store.detailProductPopulation(item.id) // GET /product-populations/{id}
  formLoading.value = false

  const detail = productPopulationDetail.value
  if (!detail) return // safety, kalau fetch gagal

  formData.value = {
    pump_serial_no             : detail.pump_serial_no ?? '',
    product_category           : detail.product_category ?? '',
    product_display            : detail.product_display ?? '',
    product_model               : detail.product_model ?? '',
    tag_no                      : detail.tag_no ?? '',
    qty                         : detail.qty ?? 1,
    seal_plan                   : detail.seal_plan ?? '',
    mechanical_seal_drawing_no  : detail.mechanical_seal_drawing_no ?? '',
  }

  selectedPic.value = Array.isArray(detail.user_id) ? [...detail.user_id] : []

  if (detail.customer) {
    formData.value.customer_id = detail.customer.id
    selectedCustomer.value     = {
      id           : detail.customer.id,
      company_name : detail.customer.name,
      customer_code: detail.customer.code,
    }
  } else {
    formData.value.customer_id = ''
    selectedCustomer.value     = null
  }

  isAddModalVisible.value = true
}

function closeAddModal() {
  isAddModalVisible.value = false
  isEdit.value             = false
  editId.value              = null
  resetForm()
}

async function handleSave() {
  if (!formData.value.pump_serial_no?.trim() || !formData.value.tag_no?.trim()) {
    showToast('error', 'Pump Serial No dan Tag No wajib diisi.')
    return
  }

  formLoading.value             = true
  errorProductPopulations.value = null

  const payload = {
    ...formData.value,
    customer_id: formData.value.customer_id || null,
    qty        : Number(formData.value.qty) || 1,
    user_id    : selectedPic.value,
  }

  try {
    if (isEdit.value) {
      await store.updateProductPopulation(editId.value, payload)
      showToast('success', 'Product population berhasil diperbarui!')
    } else {
      await store.saveProductPopulation(payload)
      showToast('success', 'Product population berhasil ditambahkan!')
    }
    closeAddModal()
  } catch (err) {
    if (err.response?.status !== 422) {
      const message = err.response?.data?.message || 'Gagal menyimpan, coba lagi.'
      showToast('error', message)
    }
    // error per-field (422) tampil via getError()
  } finally {
    formLoading.value = false
  }
}

// ── MODAL: PANDUAN / PENJELASAN HALAMAN ───────────────────────────
// Isi kontennya beda dikit buat sales vs admin/manager (canAssignSales),
// jadi masing-masing cuma lihat bagian yang relevan buat role mereka.
const isHelpModalVisible = ref(false)
function openHelpModal()  { isHelpModalVisible.value = true }
function closeHelpModal() { isHelpModalVisible.value = false }

// ── MODAL: ASSIGN SALES (khusus admin/manager, tab Semua Data) ────
const isAssignModalVisible = ref(false)
const assignSelectedIds    = ref([])
const assignTargetUser     = ref('')

async function openAssignModal() {
  assignSelectedIds.value = []
  assignTargetUser.value  = ''
  isAssignModalVisible.value = true
  await store.fetchUnassigned()
}
function closeAssignModal() {
  isAssignModalVisible.value = false
}

function toggleAssignSelect(id) {
  const idx = assignSelectedIds.value.indexOf(id)
  if (idx > -1) assignSelectedIds.value.splice(idx, 1)
  else assignSelectedIds.value.push(id)
}
function toggleAssignSelectAll() {
  if (assignSelectedIds.value.length === unassignedData.value.length) {
    assignSelectedIds.value = []
  } else {
    assignSelectedIds.value = unassignedData.value.map(r => r.id)
  }
}

async function submitBulkAssign() {
  // Cek eksplisit ke '' / null / undefined (bukan cuma falsy check) supaya
  // kalau suatu saat ada id sales bernilai 0, validasi ini nggak salah
  // nganggep "belum pilih". Ini juga jaga-jaga kalau normalisasi data sales
  // di store berubah bentuk lagi ke depannya.
  if (assignTargetUser.value === '' || assignTargetUser.value === null || assignTargetUser.value === undefined) {
    showToast('error', 'Pilih sales tujuan terlebih dahulu.')
    return
  }
  if (assignSelectedIds.value.length === 0) {
    showToast('error', 'Pilih minimal 1 data customer.')
    return
  }

  const count = assignSelectedIds.value.length

  try {
    await store.assignSales(assignSelectedIds.value, Number(assignTargetUser.value))
    showToast('success', `${count} data berhasil di-assign.`)
    assignSelectedIds.value = []
    assignTargetUser.value  = ''
  } catch (err) {
    const message = err.response?.data?.message || 'Gagal assign, coba lagi.'
    showToast('error', message)
  }
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <!-- ═══ BREADCRUMB ═══ -->
    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="table-list" /> Customer Product Population
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" /> Home
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Customer Product Population</span>
        </div>
      </div>

      <div class="breadcrumb-right">
        <button class="btn-help" type="button" @click="openHelpModal">
          <font-awesome-icon icon="circle-question" />
          <span>Apa itu halaman ini?</span>
        </button>
      </div>
    </div>

    <!-- ═══ VIEW MODE SWITCHER (all / mine / incomplete) ═══ -->
    <div class="view-card mb-2">
      <div class="view-tabs">
        <button
          v-for="v in viewModes" :key="v.key"
          class="view-tab" :class="{ active: store.view === v.key }"
          :style="store.view === v.key ? { '--tab-color': v.color } : {}"
          @click="store.changeView(v.key)"
        >
          <font-awesome-icon :icon="v.icon" />
          <span>{{ v.label }}</span>
          <span class="view-tab-count">{{ store.loadingCounts ? '…' : store.counts[v.key] }}</span>
        </button>
      </div>
      <p class="view-desc">
        <font-awesome-icon icon="circle-info" />
        {{ activeViewInfo()?.desc }}
      </p>
    </div>

    <!-- ═══ TOOLBAR TOP ═══ -->
    <!-- <div class="toolbar-top">
      <div class="toolbar-left">
        <div class="drop-wrap">
          <button class="btn-toolbar btn-purple" @click="showExportProductPopulations = !showExportProductPopulations">
            <font-awesome-icon icon="upload" /> Exports
            <font-awesome-icon icon="chevron-down" class="btn-arrow" />
          </button>
          <div class="drop-menu" :class="{ show: showExportProductPopulations }">
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
          <button class="btn-toolbar btn-purple" @click="showImportProductPopulations = !showImportProductPopulations">
            <font-awesome-icon icon="download" /> Imports
            <font-awesome-icon icon="chevron-down" class="btn-arrow" />
          </button>
          <div class="drop-menu" :class="{ show: showImportProductPopulations }">
            <div class="drop-label">Import Data</div>
            <button class="drop-item">
              <font-awesome-icon icon="file-csv" style="color:#22c55e" /> Import CSV
            </button>
          </div>
        </div>
      </div>

      <button class="btn-toolbar btn-orange" @click="store.resetFilters()">
        <font-awesome-icon icon="rotate-left" /> Reset
      </button>
    </div> -->

    <!-- ═══ CONTROLS ROW ═══ -->
    <div class="controls-card">
      <div class="controls-row">
        <div class="controls-left">
          <div class="showing-wrap">
            <font-awesome-icon icon="list" class="text-muted-color" />
            <span class="showing-label">Showing:</span>
            <div class="drop-wrap">
              <button class="btn-select" @click="showPerPageProductPopulations = !showPerPageProductPopulations">
                {{ store.pagination.per_page }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showPerPageProductPopulations }">
                <div class="drop-label">Per Halaman</div>
                <div class="perpage-grid">
                  <button
                    v-for="opt in [5, 10, 25, 50]" :key="opt"
                    class="perpage-opt"
                    :class="{ active: store.pagination.per_page === opt }"
                    @click="store.pagination.per_page = opt; showPerPageProductPopulations = false; store.changePageSize()"
                  >{{ opt }}</button>
                </div>
              </div>
            </div>
          </div>

          <button v-if="canCreate" class="btn-toolbar btn-purple" @click="openAddModal">
            <font-awesome-icon icon="plus" /> Add Data
          </button>

          <button
            v-if="canAssignSales && store.view === 'all'"
            class="btn-toolbar btn-teal"
            @click="openAssignModal"
          >
            <font-awesome-icon icon="user-plus" /> Assign Sales
          </button>
        </div>

        <div class="controls-right">
          <div class="search-wrap">
            <input
              :value="store.searchProductPopulations"
              type="text"
              placeholder="Search Product Population..."
              class="search-input"
              @input="store.searchWithDelay($event.target.value)"
            />
            <button class="search-btn"><font-awesome-icon icon="magnifying-glass" /></button>
          </div>
          <div class="sort-wrap">
            <span class="showing-label">Sort:</span>
            <div class="drop-wrap">
              <button class="btn-select" @click="showSortByProductPopulations = !showSortByProductPopulations">
                {{ sortByLabel() }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showSortByProductPopulations }">
                <div class="drop-label">Sort By</div>
                <button
                  v-for="opt in sortByOptions" :key="opt.value"
                  class="drop-item"
                  :class="{ active: store.sort.column === opt.value }"
                  @click="store.toggleSort(opt.value); showSortByProductPopulations = false"
                >{{ opt.label }}</button>
              </div>
            </div>
            <div class="drop-wrap">
              <button class="btn-select" @click="showSortDirProductPopulations = !showSortDirProductPopulations">
                {{ store.sort.direction === 'asc' ? 'Asc' : 'Desc' }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-right" :class="{ show: showSortDirProductPopulations }">
                <div class="drop-label">Urutan</div>
                <button
                  v-for="opt in ['desc', 'asc']" :key="opt"
                  class="drop-item"
                  :class="{ active: store.sort.direction === opt }"
                  @click="store.sort.direction = opt; store.changeSorting(); showSortDirProductPopulations = false"
                >{{ opt === 'asc' ? 'Asc' : 'Desc' }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ TABLE ═══ -->
    <div class="content-card flex-grow-1 overflow-auto mb-3">

      <div v-if="store.loadingProductPopulations" class="state-wrap">
        <div class="spinner-custom"></div>
      </div>

      <div v-else-if="!store.productPopulationsData.length" class="state-wrap">
        <div class="empty-state">
          <h5 class="empty-title">Tidak Ada Data</h5>
          <p class="empty-text">
            Belum ada data product population untuk filter/tab ini.
          </p>
          <button v-if="canCreate" class="btn-toolbar btn-purple mt-2" @click="openAddModal">
            <font-awesome-icon icon="plus" /> Tambah Data
          </button>
        </div>
      </div>

      <table v-else class="data-table">
        <thead>
          <tr>
            <th style="width:56px">NO.</th>
            <th>Pump Serial No</th>
            <th>Customer</th>
            <th>Product</th>
            <th>Model / Tag No</th>
            <th style="width:60px">Qty</th>
            <th>PIC / Sales</th>
            <th>Status</th>
            <th style="width:110px">Created</th>
            <th style="width:130px; text-align:center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in store.productPopulationsData" :key="item.id" class="data-row">
            <td class="td-no">
              {{ (store.pagination.current_page - 1) * store.pagination.per_page + index + 1 }}.
            </td>
            <td class="td-name"><span class="mono-text">{{ item.pump_serial_no || '-' }}</span></td>
            <td class="td-name">
              <span v-if="item.customer" class="fw-bold">{{ item.customer.name }}</span>
              <span v-else class="missing-badge"><font-awesome-icon icon="ban" /> Belum Ada Customer</span>
            </td>
            <td class="td-name">
              <div>{{ item.product_category || '-' }}</div>
              <div class="td-sub">{{ item.product_display || '-' }}</div>
            </td>
            <td class="td-name">
              <div class="mono-text">{{ item.product_model || '-' }}</div>
              <div class="td-sub">{{ item.tag_no || '-' }}</div>
            </td>
            <td>{{ item.qty }}</td>
            <td class="td-name">
              <div v-if="item.pic_list?.length" class="pic-chip-list">
                <span v-for="pic in item.pic_list" :key="pic.id" class="pic-chip">{{ pic.name }}</span>
              </div>
              <span v-else class="missing-badge"><font-awesome-icon icon="user-slash" /> Belum Ada PIC</span>
            </td>
            <td>
              <span class="status-badge" :class="store.getStatusConfig(item.status).label">
                {{ store.getStatusConfig(item.status).text }}
              </span>
            </td>
            <td class="td-muted">{{ store.formatDate(item.created_at) }}</td>
            <td class="td-actions">
              <!-- Tab "Data Belum Lengkap": cukup tombol Detail, Edit/Hapus
                   disembunyikan meskipun user punya hak canUpdate/canDelete. -->
              <button v-if="canUpdate && store.view !== 'incomplete'" class="act-btn act-edit" title="Edit" @click="openEditModal(item)">
                <font-awesome-icon icon="pen-to-square" />
              </button>
              <button v-if="canDelete && store.view !== 'incomplete'" class="act-btn act-delete" title="Hapus" @click="openDeleteModal(item)">
                <font-awesome-icon icon="trash-can" />
              </button>
              <button v-if="canView" class="act-btn act-info" title="Detail" @click="openDetailModal(item.id)">
                <font-awesome-icon icon="circle-info" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ═══ PAGINATION ═══ -->
    <div class="pagination-card">
      <div class="pagination-nav">
        <button class="btn-prev-next" :disabled="store.pagination.current_page === 1"
          @click="store.fetchProductPopulations(store.pagination.prev_page_url)">
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button class="btn-prev-next" :disabled="store.pagination.current_page === store.pagination.last_page"
          @click="store.fetchProductPopulations(store.pagination.next_page_url)">
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">{{ store.productPopulationsData.length }} DATA | PAGE {{ store.pagination.current_page }}</span>
        <span class="page-badge">TOTAL: {{ store.pagination.total }}</span>
      </div>
    </div>

    <!-- ═══ MODAL ADD / EDIT ═══ -->
    <AppModal
      :show="isAddModalVisible"
      :title="isEdit ? 'Edit Product Population' : 'Add New Product Population'"
      :icon="isEdit ? 'pen-to-square' : 'plus'"
      size="md"
      @close="closeAddModal"
    >
      <div class="form-container-gap">

        <!-- ═══ CUSTOMER (autocomplete) ═══ -->
        <div class="form-group">
          <label>Customer</label>

          <div v-if="!selectedCustomer" class="cs-wrap">
            <input
              v-model="customerSearchInput"
              class="form-input"
              :class="{ 'input-error': getError('customer_id') }"
              placeholder="Cari nama customer... (boleh dikosongkan kalau belum tahu)"
              @input="store.searchCustomerName(customerSearchInput)"
            />
            <div v-if="customerSuggestions.length" class="cs-dropdown">
              <div class="cs-list">
                <div
                  v-for="c in customerSuggestions" :key="c.id"
                  class="cs-item"
                  style="justify-content: space-between"
                  @click="pickCustomer(c)"
                >
                  <div>
                    <div style="font-weight:600">{{ c.company_name }}</div>
                    <div style="font-size:0.72rem;color:var(--text-muted)">{{ c.customer_code }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="searchingCustomer" class="td-sub" style="margin-top:4px">Mencari...</div>
          </div>

          <div v-else class="branch-locked-notice">
            <div>
              <div style="font-weight:700">{{ selectedCustomer.company_name }}</div>
              <div style="font-size:0.72rem;color:var(--text-muted)">{{ selectedCustomer.customer_code }}</div>
            </div>
            <button type="button" class="btn-cancel" style="padding:4px 10px" @click="clearCustomer">
              Ganti
            </button>
          </div>

          <span v-if="getError('customer_id')" class="form-error">{{ getError('customer_id') }}</span>
        </div>

        <div class="form-group">
          <label>Pump Serial No <span class="required">*</span></label>
          <input
            v-model="formData.pump_serial_no"
            class="form-input"
            :class="{ 'input-error': getError('pump_serial_no') }"
            placeholder="e.g. 419974 - 419975"
          />
          <span v-if="getError('pump_serial_no')" class="form-error">{{ getError('pump_serial_no') }}</span>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label>Product Category <span class="required">*</span></label>
            <input
              v-model="formData.product_category"
              class="form-input"
              :class="{ 'input-error': getError('product_category') }"
              placeholder="e.g. PUMP - DURCO"
            />
            <span v-if="getError('product_category')" class="form-error">{{ getError('product_category') }}</span>
          </div>

          <div class="form-group">
            <label>Product Display</label>
            <input v-model="formData.product_display" class="form-input" placeholder="e.g. Overhung Mark 3 ASME" />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label>Product Model</label>
            <input v-model="formData.product_model" class="form-input" placeholder="e.g. 2K6X4-10 HRV" />
          </div>

          <div class="form-group">
            <label>Tag No <span class="required">*</span></label>
            <input
              v-model="formData.tag_no"
              class="form-input"
              :class="{ 'input-error': getError('tag_no') }"
              placeholder="e.g. BG-111 A/B"
            />
            <span v-if="getError('tag_no')" class="form-error">{{ getError('tag_no') }}</span>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label>Qty <span class="required">*</span></label>
            <input v-model="formData.qty" type="number" min="1" class="form-input" />
            <span v-if="getError('qty')" class="form-error">{{ getError('qty') }}</span>
          </div>

          <div class="form-group">
            <label>Seal Plan</label>
            <input v-model="formData.seal_plan" class="form-input" placeholder="e.g. Plan 11" />
          </div>
        </div>

        <div class="form-group">
          <label>Mechanical Seal Drawing No</label>
          <input v-model="formData.mechanical_seal_drawing_no" class="form-input" placeholder="e.g. MSD-0021" />
        </div>

        <!-- Khusus admin/manager: Sales nggak boleh liat/ubah PIC biar nggak
             bisa iseng reassign data ke sales lain lewat form edit. -->
        <div v-if="canAssignSales" class="form-group">
          <label>PIC / Sales yang menangani</label>
          <div class="pic-checkbox-grid">
            <label v-for="s in salesSelectData" :key="s.id" class="pic-checkbox">
              <input
                type="checkbox"
                :checked="selectedPic.includes(s.id)"
                @change="togglePic(s.id)"
              />
              <span>{{ s.name }}</span>
            </label>
          </div>
          <span v-if="getError('user_id')" class="form-error">{{ getError('user_id') }}</span>
        </div>

      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeAddModal">Cancel</button>
        <button
          class="btn-save"
          :class="{ 'btn-save-edit': isEdit }"
          :disabled="formLoading || savingProductPopulations || updatingProductPopulations"
          @click="handleSave"
        >
          <font-awesome-icon v-if="formLoading || savingProductPopulations || updatingProductPopulations" icon="spinner" spin />
          <font-awesome-icon v-else :icon="isEdit ? 'pen-to-square' : 'check'" />
          {{
            (formLoading || savingProductPopulations || updatingProductPopulations)
              ? (isEdit ? 'Menyimpan...' : 'Menambahkan...')
              : (isEdit ? 'Simpan Perubahan' : 'Save Data')
          }}
        </button>
      </template>
    </AppModal>

    <!-- ═══ MODAL: ASSIGN SALES (khusus admin/manager) ═══ -->
    <AppModal
      :show="isAssignModalVisible"
      title="Assign Sales ke Data Customer"
      icon="user-plus"
      size="lg"
      @close="closeAssignModal"
    >
      <p class="assign-info">
        Data di bawah ini sudah punya nama customer, tapi belum ada sales yang memegang.
        Pilih datanya, tentukan sales tujuan, lalu klik Assign.
      </p>

      <div class="form-group" style="margin-bottom:12px">
        <input
          :value="searchUnassigned"
          type="text"
          class="form-input"
          placeholder="Cari customer / tag no / pump serial no..."
          @input="store.searchUnassignedWithDelay($event.target.value)"
        />
      </div>

      <div v-if="loadingUnassigned" class="state-wrap">
        <div class="spinner-custom"></div>
      </div>

      <!-- Beda dari list kosong karena sudah lengkap: ini fetch-nya sendiri gagal (403/500/dst) -->
      <div v-else-if="errorUnassignedFetch" class="assign-fetch-error">
        <font-awesome-icon icon="triangle-exclamation" />
        {{ errorUnassignedFetch }}
      </div>

      <div v-else-if="!unassignedData.length" class="empty-state assign-empty">
        <h5 class="empty-title" style="font-size:1rem">Semua data customer sudah ada PIC-nya.</h5>
      </div>

      <template v-else>
        <div class="assign-toolbar">
          <label class="pic-checkbox assign-select-all">
            <input
              type="checkbox"
              :checked="assignSelectedIds.length === unassignedData.length"
              @change="toggleAssignSelectAll"
            />
            <span>Pilih Semua ({{ unassignedData.length }})</span>
          </label>

          <div class="assign-target">
            <select v-model="assignTargetUser" class="form-input form-select">
              <option value="">— Pilih sales tujuan —</option>
              <option v-for="s in salesSelectData" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
            <button class="btn-save" :disabled="assigningSales" @click="submitBulkAssign">
              <font-awesome-icon v-if="assigningSales" icon="spinner" spin />
              <font-awesome-icon v-else icon="user-plus" />
              Assign ({{ assignSelectedIds.length }})
            </button>
          </div>
        </div>
        <span v-if="getAssignError('user_id')" class="form-error">{{ getAssignError('user_id') }}</span>

        <div class="assign-list">
          <label v-for="row in unassignedData" :key="row.id" class="assign-row">
            <input
              type="checkbox"
              :checked="assignSelectedIds.includes(row.id)"
              @change="toggleAssignSelect(row.id)"
            />
            <div class="assign-row-info">
              <div class="assign-row-customer">{{ row.customer_name }}</div>
              <div class="assign-row-sub">{{ row.tag_no }} &middot; {{ row.pump_serial_no }} &middot; {{ row.product_model }}</div>
            </div>
            <span class="assign-row-qty">Qty {{ row.qty }}</span>
          </label>
        </div>
      </template>

      <template #footer>
        <button class="btn-cancel" @click="closeAssignModal">Close</button>
      </template>
    </AppModal>

    <!-- ═══ MODAL DETAIL ═══ -->
    <AppModal :show="isDetailModalVisible" title="Product Population Detail" icon="circle-info" size="md" @close="closeDetailModal">
      <div v-if="loadingDetail" style="display:flex;justify-content:center;padding:40px 0;">
        <div class="spinner-custom"></div>
      </div>
      <template v-else-if="productPopulationDetail">
        <div class="detail-banner">
          <span class="detail-banner-code">{{ productPopulationDetail.pump_serial_no }}</span>
          <h3 class="detail-banner-name">{{ productPopulationDetail.tag_no || '-' }}</h3>
          <span class="detail-banner-industry">{{ productPopulationDetail.product_category }}</span>
        </div>
        <div class="detail-list">
          <div class="detail-row">
            <span class="detail-label">Customer</span>
            <span v-if="productPopulationDetail.customer" class="detail-badge">{{ productPopulationDetail.customer.name }}</span>
            <span v-else class="missing-badge"><font-awesome-icon icon="ban" /> Belum Ada Customer</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Product Display</span>
            <span class="detail-value">{{ productPopulationDetail.product_display || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Product Model</span>
            <span class="detail-value">{{ productPopulationDetail.product_model || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Qty</span>
            <span class="detail-value font-semibold">{{ productPopulationDetail.qty }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Seal Plan</span>
            <span class="detail-value">{{ productPopulationDetail.seal_plan || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Mech. Seal Drawing No</span>
            <span class="detail-value">{{ productPopulationDetail.mechanical_seal_drawing_no || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">PIC / Sales</span>
            <div v-if="productPopulationDetail.pic_list?.length" class="pic-chip-list">
              <span v-for="pic in productPopulationDetail.pic_list" :key="pic.id" class="pic-chip">{{ pic.name }}</span>
            </div>
            <span v-else class="missing-badge"><font-awesome-icon icon="user-slash" /> Belum Ada PIC</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Data Status</span>
            <span class="status-badge" :class="store.getStatusConfig(productPopulationDetail.status).label">
              {{ store.getStatusConfig(productPopulationDetail.status).text }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Created At</span>
            <span class="detail-value">{{ store.formatDate(productPopulationDetail.created_at) }}</span>
          </div>
        </div>
      </template>
      <template #footer>
        <button class="btn-cancel" @click="closeDetailModal">Close</button>
      </template>
    </AppModal>

    <!-- ═══ MODAL: PANDUAN / PENJELASAN HALAMAN ═══ -->
    <AppModal
      :show="isHelpModalVisible"
      title="Tentang Halaman Customer Product Population"
      icon="circle-question"
      size="lg"
      @close="closeHelpModal"
    >
      <div class="help-content">
        <p class="help-intro">
          Halaman ini buat mencatat <strong>produk apa yang terpasang/dipakai di customer mana</strong>
          (pompa, mechanical seal, dll) sekaligus siapa sales (PIC) yang memegang data itu. Dari sini,
          admin/manager juga bisa lihat data mana yang belum lengkap dan mana yang belum ada sales-nya.
        </p>

        <div class="help-section">
          <h5 class="help-section-title">
            <font-awesome-icon icon="table-list" /> 3 Tampilan Data
          </h5>
          <div class="help-view-list">
            <div v-for="v in viewModes" :key="v.key" class="help-view-item">
              <span class="help-view-icon" :style="{ color: v.color }">
                <font-awesome-icon :icon="v.icon" />
              </span>
              <div>
                <div class="help-view-label">{{ v.label }}</div>
                <div class="help-view-desc">{{ v.desc }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="help-section">
          <h5 class="help-section-title">
            <font-awesome-icon icon="user" /> Buat Sales
          </h5>
          <ul class="help-list">
            <li>Tambah/edit data product population buat customer yang kamu pegang lewat tombol <strong>Add Data</strong>.</li>
            <li>Tab <strong>Customer Saya</strong> nunjukin data yang PIC-nya kamu.</li>
            <li>
              Tab <strong>Data Belum Lengkap</strong> isinya data "yatim" — belum ada customer & belum ada PIC
              sama sekali. Kamu cuma bisa lihat <strong>Detail</strong>-nya; edit/hapus data di tab ini cuma bisa
              dilakukan admin/manager, biar nggak diserobot atau salah pegang.
            </li>
          </ul>
        </div>

        <div v-if="canAssignSales" class="help-section">
          <h5 class="help-section-title">
            <font-awesome-icon icon="user-shield" /> Khusus Admin/Manager
          </h5>
          <ul class="help-list">
            <li>
              Tombol <strong>Assign Sales</strong> (di tab Semua Data) buat nge-assign banyak data sekaligus —
              data yang sudah ada nama customer-nya tapi belum ada sales yang pegang — ke 1 sales tujuan.
            </li>
            <li>
              Data di tab <strong>Data Belum Lengkap</strong> bisa dilengkapi belakangan: tinggal <strong>Edit</strong>
              baris-nya begitu customer & PIC-nya sudah ketahuan.
            </li>
            <li>
              Begitu di-assign atau dilengkapi, customer terkait otomatis jadi milik sales itu dan status
              approval-nya ikut ke-set <strong>approved</strong> — tapi <em>cuma</em> kalau customer itu belum ada
              pemiliknya sama sekali atau statusnya masih pending. Kalau customer-nya udah ada pemilik dan
              sudah approved sebelumnya, datanya nggak akan ketimpa otomatis.
            </li>
          </ul>
        </div>
      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeHelpModal">Mengerti</button>
      </template>
    </AppModal>

    <!-- ═══ TOAST ═══ -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toast.show" class="toast-wrap">
          <div class="toast-box" :class="`toast-${toast.type}`">
            <font-awesome-icon
              :icon="toast.type === 'success' ? 'circle-check' : toast.type === 'error' ? 'circle-xmark' : 'circle-info'"
              class="toast-icon"
            />
            <span class="toast-msg">{{ toast.message }}</span>
            <button class="toast-close" @click="toast.show = false">✕</button>
            <div class="toast-progress" :class="`progress-${toast.type}`"></div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
.h-100 {
  --text-muted   : #64748b;
  --primary-color: #6366f1;
}

.form-container-gap { display: flex; flex-direction: column; gap: 14px; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

/* ── BREADCRUMB ── */
.breadcrumb-card { background: var(--bg-card); border-radius: 10px; padding: 16px 18px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

.breadcrumb-right { flex-shrink: 0; }
.btn-help {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 14px; border-radius: 8px; border: 1px solid #6366f1;
  background: transparent; color: #6366f1; font-size: 0.82rem; font-weight: 600;
  cursor: pointer; transition: background 0.15s, color 0.15s;
}
.btn-help:hover { background: #6366f1; color: #fff; }

/* ── MODAL PANDUAN ── */
.help-content { display: flex; flex-direction: column; gap: 18px; }
.help-intro { margin: 0; font-size: 0.88rem; line-height: 1.6; color: var(--text-primary); }
.help-section { display: flex; flex-direction: column; gap: 8px; }
.help-section-title {
  display: flex; align-items: center; gap: 8px; margin: 0;
  font-size: 0.86rem; font-weight: 700; color: #6366f1;
}
.help-list { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; }
.help-list li { font-size: 0.84rem; line-height: 1.55; color: var(--text-primary); }
.help-view-list { display: flex; flex-direction: column; gap: 10px; }
.help-view-item { display: flex; align-items: flex-start; gap: 12px; }
.help-view-icon { font-size: 1rem; margin-top: 2px; }
.help-view-label { font-size: 0.86rem; font-weight: 700; color: var(--text-primary); }
.help-view-desc { font-size: 0.82rem; color: var(--text-muted); line-height: 1.5; }

/* ── VIEW MODE SWITCHER ── */
.view-card { background: var(--bg-card); border-radius: 10px; padding: 14px 16px; box-shadow: 0 1px 3px var(--shadow-color); }
.view-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.view-tab {
  --tab-color: #6366f1;
  display: inline-flex; align-items: center; gap: 8px; padding: 9px 16px;
  border-radius: 10px; border: 1.5px solid var(--border-main); background: var(--bg-input);
  color: var(--text-primary); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.18s ease;
}
.view-tab:hover { border-color: var(--tab-color); color: var(--tab-color); }
.view-tab.active { background: var(--tab-color); border-color: var(--tab-color); color: #fff; }
.view-tab-count { font-size: 0.72rem; font-weight: 700; padding: 1px 8px; border-radius: 99px; background: rgba(255,255,255,0.25); }
.view-tab:not(.active) .view-tab-count { background: var(--bg-card); border: 1px solid var(--border-main); color: var(--text-muted); }
.view-desc { margin: 10px 2px 0; font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }

/* ── TOOLBAR ── */
.toolbar-top { display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); border-radius: 10px; padding: 12px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); flex-wrap: wrap; gap: 8px; }
.toolbar-left { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-toolbar { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: none; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; transition: all 0.18s ease; white-space: nowrap; }
.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover { background: #4f46e5; }
.btn-orange { background: #f59e0b; color: #fff; }
.btn-orange:hover { background: #d97706; }
.btn-teal { background: #0d9488; color: #fff; }
.btn-teal:hover { background: #0f766e; }
.btn-arrow { font-size: 0.6rem; opacity: 0.7; }

/* ── SPINNER & EMPTY ── */
.state-wrap { display: flex; justify-content: center; padding: 40px 0; }
.spinner-custom { width: 2rem; height: 2rem; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 24px 0; gap: 8px; }
.empty-text { font-size: 0.9rem; font-weight: 600; color: var(--text-muted); text-align: center; }
.empty-title { margin-top: 12px; margin-bottom: 6px; font-size: 20px; font-weight: 700; color: var(--text-primary); }

/* ── CONTROLS ── */
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
.search-btn:hover { background: #4f46e5; }
.sort-wrap { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

/* ── DROPDOWN TOOLBAR ── */
.drop-wrap { position: relative; }
.btn-select { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.83rem; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
.btn-select:hover { border-color: #6366f1; color: #6366f1; }
.drop-menu { position: absolute; top: calc(100% + 6px); left: 0; min-width: 160px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 10px; z-index: 200; opacity: 0; transform: translateY(-6px); pointer-events: none; transition: all 0.18s ease; }
.drop-right { left: auto; right: 0; }
.drop-menu.show { opacity: 1; transform: translateY(0); pointer-events: all; }
.drop-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; padding: 0 4px; }
.drop-item { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: none; border: none; border-radius: 7px; color: var(--text-primary); font-size: 0.84rem; cursor: pointer; text-align: left; }
.drop-item:hover { background: var(--bg-nav-hover); }
.drop-item.active { color: #6366f1; font-weight: 600; background: rgba(99,102,241,0.08); }
.perpage-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.perpage-opt { padding: 5px 10px; border: 1px solid var(--border-main); border-radius: 6px; background: var(--bg-input); color: var(--text-primary); font-size: 0.82rem; cursor: pointer; }
.perpage-opt:hover { border-color: #6366f1; color: #6366f1; }
.perpage-opt.active { background: #6366f1; border-color: #6366f1; color: #fff; font-weight: 700; }

/* ── TABLE ── */
.content-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); overflow: auto; }
.data-table { width: 100%; min-width: 1100px; border-collapse: collapse; font-size: 0.875rem; }
.data-table thead tr { background: var(--bg-input); border-bottom: 2px solid var(--border-main); position: sticky; top: 0; z-index: 2; }
.data-table th { padding: 12px 18px; text-align: left; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap; }
.data-table tbody tr { border-bottom: 1px solid var(--border-main); transition: background 0.15s; }
.data-table tbody tr:last-child { border-bottom: none; }
.data-row:hover { background: var(--bg-nav-hover); }
.data-table td { padding: 13px 18px; vertical-align: middle; color: var(--text-primary); }
.td-no { color: var(--text-muted); font-weight: 600; }
.td-name { font-weight: 500; }
.td-muted { color: var(--text-muted); font-size: 0.84rem; }
.td-sub { color: var(--text-muted); font-size: 0.78rem; margin-top: 2px; }
.td-actions { text-align: center; white-space: nowrap; }
.mono-text { font-family: monospace; font-size: 0.82rem; }
.fw-bold { font-weight: 700; }
.status-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
.act-btn { width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s ease; margin: 0 2px; background: transparent; }
.act-edit { color: #f59e0b; border-color: #f59e0b; }
.act-edit:hover { background: #f59e0b; color: #fff; }
.act-delete { color: #ef4444; border-color: #ef4444; }
.act-delete:hover { background: #ef4444; color: #fff; }
.act-info { color: #6366f1; border-color: #6366f1; }
.act-info:hover { background: #6366f1; color: #fff; }

/* Missing-data & PIC chips (khusus module ini) */
.missing-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 0.72rem; font-weight: 700; padding: 4px 9px; border-radius: 6px; background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.25); white-space: nowrap; }
.pic-chip-list { display: flex; flex-wrap: wrap; gap: 4px; }
.pic-chip { font-size: 0.72rem; font-weight: 600; padding: 3px 9px; border-radius: 99px; background: rgba(99,102,241,0.1); color: #6366f1; border: 1px solid rgba(99,102,241,0.2); }

/* ── PAGINATION ── */
.pagination-card { background: var(--bg-card); border-radius: 10px; padding: 14px 18px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: row-reverse; align-items: center; justify-content: space-between; gap: 12px; }
.pagination-nav { display: flex; align-items: center; gap: 8px; }
.btn-prev-next { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; min-width: 85px; justify-content: center; transition: background 0.18s ease; }
.btn-prev-next:hover:not(:disabled) { background: #4f46e5; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badges { display: flex; gap: 8px; align-items: center; }
.page-badge { padding: 7px 14px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); background: var(--bg-input); white-space: nowrap; }

/* ── FORM ── */
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.required { color: #ef4444; }
.form-input { padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.875rem; background: var(--bg-input); color: var(--text-primary); outline: none; transition: border 0.18s; width: 100%; box-sizing: border-box; }
.form-input:focus { border-color: #6366f1; }
.form-select {
  cursor: pointer; appearance: none; -webkit-appearance: none; -moz-appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, #64748b 50%), linear-gradient(135deg, #64748b 50%, transparent 50%);
  background-position: calc(100% - 20px) calc(50% - 2px), calc(100% - 14px) calc(50% - 2px);
  background-size: 6px 6px; background-repeat: no-repeat; padding-right: 40px;
}
.input-error { border-color: #ef4444 !important; background: #fef2f2 !important; }
.form-error { font-size: 0.75rem; color: #ef4444; }

/* ── PIC CHECKBOX GRID ── */
.pic-checkbox-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
@media (max-width: 560px) { .pic-checkbox-grid { grid-template-columns: 1fr; } }
.pic-checkbox { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: 1px solid var(--border-main); border-radius: 8px; background: var(--bg-input); font-size: 0.84rem; color: var(--text-primary); cursor: pointer; }
.pic-checkbox input { accent-color: #6366f1; width: 15px; height: 15px; cursor: pointer; }

/* ── CUSTOMER AUTOCOMPLETE (reuse pattern company-name Customers) ── */
.cs-wrap { position: relative; display: flex; flex-direction: column; }
.cs-dropdown { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); z-index: 50; overflow: hidden; }
.cs-list { max-height: 200px; overflow-y: auto; padding: 4px; }
.cs-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 7px; font-size: 0.84rem; cursor: pointer; color: var(--text-primary); }
.cs-item:hover { background: var(--bg-nav-hover); }
.branch-locked-notice { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border: 1px solid #6366f1; background: rgba(99,102,241,0.06); border-radius: 8px; }

/* ── MODAL BUTTONS ── */
.btn-cancel { padding: 8px 18px; background: var(--bg-main, #f1f5f9); color: var(--text-muted); border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
.btn-cancel:hover { background: var(--border-main); color: var(--text-primary); }
.btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.18s; }
.btn-save:hover:not(:disabled) { background: #4f46e5; }
.btn-save.btn-save-edit { background: #f59e0b; }
.btn-save.btn-save-edit:hover:not(:disabled) { background: #d97706; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── ASSIGN SALES MODAL ── */
.assign-info { font-size: 0.84rem; color: var(--text-muted); margin: 0 0 14px; line-height: 1.6; }
.assign-empty { padding: 30px 10px; }
.assign-fetch-error {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 14px; border-radius: 8px;
  background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
  font-size: 0.84rem; font-weight: 500;
}
.assign-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 4px; padding-bottom: 12px; border-bottom: 1px solid var(--border-main); }
.assign-select-all { background: transparent; border: none; padding: 0; }
.assign-target { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.assign-target .form-select { min-width: 170px; }
.assign-list { display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; margin-top: 12px; }
.assign-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid var(--border-main); border-radius: 8px; background: var(--bg-input); cursor: pointer; transition: border-color 0.15s; }
.assign-row:hover { border-color: #6366f1; }
.assign-row input { accent-color: #6366f1; width: 16px; height: 16px; cursor: pointer; flex-shrink: 0; }
.assign-row-info { flex: 1; min-width: 0; }
.assign-row-customer { font-weight: 700; font-size: 0.85rem; color: var(--text-primary); }
.assign-row-sub { font-size: 0.76rem; color: var(--text-muted); margin-top: 2px; white-space: normal; }
.assign-row-qty { font-size: 0.76rem; font-weight: 700; color: #6366f1; flex-shrink: 0; }

/* ── DETAIL MODAL ── */
.detail-banner { background: linear-gradient(135deg, #1e3a5f, #2563eb); border-radius: 10px; padding: 16px 18px; margin-bottom: 16px; }
.detail-banner-code { font-family: monospace; font-size: 0.75rem; color: #93c5fd; display: block; }
.detail-banner-name { margin: 4px 0; color: #fff; font-size: 1.05rem; font-weight: 700; }
.detail-banner-industry { font-size: 0.78rem; color: #bfdbfe; }
.detail-list { display: flex; flex-direction: column; }
.detail-row { display: flex; align-items: flex-start; justify-content: space-between; padding: 9px 0; border-bottom: 1px dashed var(--border-main); gap: 12px; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); flex-shrink: 0; }
.detail-value { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); text-align: right; }
.font-semibold { font-weight: 600; }
.detail-badge { font-size: 0.8rem; font-weight: 600; padding: 3px 10px; border-radius: 6px; background: rgba(99,102,241,0.1); color: #6366f1; border: 1px solid rgba(99,102,241,0.2); }

/* ── TOAST ── */
.toast-wrap { position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 260px; max-width: 360px; }
.toast-box { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 12px; border: 1px solid; box-shadow: 0 8px 24px rgba(0,0,0,0.12); position: relative; overflow: hidden; }
.toast-success { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
.toast-error { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
.toast-info { background: #f8fafc; border-color: #e2e8f0; color: #475569; }
.toast-icon { margin-top: 2px; flex-shrink: 0; }
.toast-msg { flex: 1; font-size: 0.875rem; font-weight: 500; }
.toast-close { background: none; border: none; cursor: pointer; color: inherit; opacity: 0.5; font-size: 0.8rem; }
.toast-close:hover { opacity: 1; }
.toast-progress { position: absolute; bottom: 0; left: 0; height: 3px; animation: shrink 3s linear forwards; }
.progress-success { background: #22c55e; }
.progress-error { background: #ef4444; }
.progress-info { background: #94a3b8; }
@keyframes shrink { from { width: 100%; } to { width: 0%; } }
.toast-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from { opacity: 0; transform: translateY(-16px) scale(0.95); }
.toast-leave-to { opacity: 0; transform: translateY(-8px) scale(0.97); }

@media (max-width: 768px) {
  .breadcrumb-card { padding: 12px 14px; }
  .breadcrumb-title { font-size: 1rem; }
  .breadcrumb-right { width: 100%; }
  .btn-help { width: 100%; justify-content: center; }
  .toolbar-top { flex-direction: column; align-items: stretch; padding: 10px 12px; }
  .toolbar-left { width: 100%; }
  .toolbar-left .drop-wrap { flex: 1; }
  .toolbar-left .btn-toolbar { width: 100%; justify-content: center; }
  .toolbar-top > .btn-orange { width: 100%; justify-content: center; }
  .drop-menu { left: 0; right: 0; min-width: 0; }
  .controls-card { padding: 12px; }
  .controls-row { flex-direction: column; align-items: stretch; gap: 10px; }
  .controls-left, .controls-right { width: 100%; justify-content: flex-start; }
  .controls-left { flex-wrap: wrap; }
  .controls-left > .btn-toolbar { width: 100%; justify-content: center; }
  .search-wrap { width: 100%; }
  .search-input { width: 100%; }
  .sort-wrap { width: 100%; }
  .sort-wrap .drop-wrap { flex: 1; }
  .sort-wrap .btn-select { width: 100%; justify-content: space-between; }
  .view-tabs { flex-direction: column; }
  .view-tab { width: 100%; justify-content: space-between; }
}

@media (max-width: 576px) {
  .pagination-card { flex-direction: column; padding: 12px; gap: 12px; }
  .pagination-nav { width: 100%; justify-content: space-between; }
  .btn-prev-next { flex: 1; max-width: 48%; padding: 10px 14px; }
  .page-badges { width: 100%; justify-content: center; flex-wrap: wrap; }
  .page-badge { flex: 1; text-align: center; font-size: 0.7rem; }
  .form-row-2 { grid-template-columns: 1fr; }
  .btn-cancel, .btn-save { width: 100%; justify-content: center; }
}
</style>