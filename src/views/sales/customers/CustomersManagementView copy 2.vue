<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import AppModal from '@/components/AppModal.vue'
import { useConfirm } from '@/composables/useConfirm'
import { useCustomersStore } from '@/stores/customersStore'
import { usePermissionStore } from '@/stores/PermissionStore'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'

const { confirm } = useConfirm()
const store       = useCustomersStore()
const permission  = usePermissionStore()
const route       = useRoute()

const {
  customersData, loadingCustomers, searchCustomers,
  pagination, sort, errorCustomers,
  savingCustomers, updatingCustomers, deletingCustomers,
  customersDetail, loadingDetail,
  industrySelectData, categorySelectData,
  branchesData, loadingBranches,
} = storeToRefs(store)

// ── PERMISSIONS ───────────────────────────────────────
const currentUrl = computed(() => route.path.replace('/app', ''))
const canCreate  = computed(() => permission.canCreate(currentUrl.value))
const canUpdate  = computed(() => permission.canUpdate(currentUrl.value))
const canDelete  = computed(() => permission.canDelete(currentUrl.value))
const canView    = computed(() => permission.canView(currentUrl.value))

// ── VIEW MODE (CARD / TABLE) ──────────────────────────
// Default: card. Preference disimpan di localStorage supaya tetap
// diingat ketika user reload halaman.
const VIEW_MODE_KEY = 'customers_view_mode'
const viewMode = ref(localStorage.getItem(VIEW_MODE_KEY) || 'card')

function setViewMode(mode) {
  viewMode.value = mode
  localStorage.setItem(VIEW_MODE_KEY, mode)
}

// ── VALIDASI NOMOR TELEPON (DINAMIS) ───────────────────
// Mendukung berbagai format:
//   - HP            : 08123456789, +6281234567890
//   - Telepon kantor: 021-5551234, (021) 555-1234
//   - Dengan ext.   : 021-5551234 ext 123, 0215551234 x45
// Karakter yang diizinkan saat mengetik: angka, +, -, ., spasi,
// kurung, dan huruf e/x/t/k/s (untuk kata "ext"/"ekst"/"x").
const phoneTouched = ref(false)

function sanitizePhoneInput(e) {
  const value = e.target.value.replace(/[^0-9+\-.\s()extEXTkKsS]/g, '')
  formData.value.phone = value
  phoneTouched.value = true
}

// Pisahkan bagian nomor utama dari extension (jika ada)
function parsePhoneParts(raw) {
  if (!raw) return { main: '', ext: null }
  const extMatch = raw.match(/(?:ext\.?|ekst\.?|x)\s*([0-9]{1,6})\s*$/i)
  if (extMatch) {
    return { main: raw.slice(0, extMatch.index), ext: extMatch[1] }
  }
  return { main: raw, ext: null }
}

const phoneFormatError = computed(() => {
  const phone = formData.value.phone
  if (!phone) return null
  const { main, ext } = parsePhoneParts(phone)
  const digitsOnly = main.replace(/[^0-9]/g, '')
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return 'Nomor telepon harus 7–15 digit angka (boleh pakai -, spasi, kurung, +).'
  }
  if (ext !== null && (ext.length < 1 || ext.length > 6)) {
    return 'Nomor extension tidak valid, maksimal 6 digit.'
  }
  return null
})

const isPhoneValid = computed(() => !!formData.value.phone && !phoneFormatError.value)

// Palet warna avatar + helper inisial nama, dipakai di card view
const avatarPalette = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#8b5cf6']
function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}
function getAvatarColor(name) {
  if (!name) return avatarPalette[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return avatarPalette[Math.abs(hash) % avatarPalette.length]
}

// ── LIFECYCLE ─────────────────────────────────────────
onMounted(async () => {
  await store.fetchCustomers()
  await store.fetchIndustrySelect()
  await store.fetchCategorySelect()
  await store.fetchSubmissions()  
  document.addEventListener('click', handleIndustryClickOutside)
  document.addEventListener('click', handleCategoryClickOutside)
  document.addEventListener('click', handleStatusStatisClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleIndustryClickOutside)
  document.removeEventListener('click', handleCategoryClickOutside)
  document.removeEventListener('click', handleStatusStatisClickOutside)
  if (toastTimer) clearTimeout(toastTimer)
})

// ── TOOLBAR TOGGLES ───────────────────────────────────
const showExportCustomers  = ref(false)
const showImportCustomers  = ref(false)
const showPerPageCustomers = ref(false)
const showSortByCustomers  = ref(false)
const showSortDirCustomers = ref(false)

const sortByOptions = [
  { label: 'Created Date', value: 'created_at' },
  { label: 'Company Name', value: 'company_name' },
]
const sortByLabel = () =>
  sortByOptions.find(o => o.value === store.sort.column)?.label ?? 'Created Date'

// ── EXPORT ────────────────────────────────────────────
function exportCSV() {
  const header = 'ID,Customer Code,Company Name,Contact,Email,Phone,Status,Converted,Created\n'
  const rows   = store.customersData.map(c =>
    `${c.id},"${c.customer_code}","${c.company_name}","${c.contact_name}","${c.email}","${c.phone}","${c.customer_status}","${c.converted_at}","${c.created_at}"`
  ).join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'customers.csv'; a.click()
  URL.revokeObjectURL(url)
  showExportCustomers.value = false
}
function exportExcel() { showExportCustomers.value = false }
function exportPDF()   { showExportCustomers.value = false }

// ── ERROR HELPER ──────────────────────────────────────
function getError(field) {
  if (!errorCustomers.value || typeof errorCustomers.value !== 'object') return null
  return errorCustomers.value[field]?.[0] ?? null
}

// ── TOAST ─────────────────────────────────────────────
const toast      = ref({ show: false, type: '', message: '' })
let   toastTimer = null

function showToast(type, message) {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { show: true, type, message }
  toastTimer  = setTimeout(() => { toast.value.show = false }, 3000)
}

// ── SELECT: INDUSTRY ──────────────────────────────────
const isOpenIndustry   = ref(false)
const searchIndustry   = ref('')
const selectedIndustry = ref(null)
const industryRef      = ref(null)  // ref ke cs-wrap (trigger + dropdown sekaligus)

const filteredIndustry = computed(() => {
  if (!industrySelectData.value) return []
  if (!searchIndustry.value) return industrySelectData.value
  return industrySelectData.value.filter(o =>
    o.name?.toLowerCase().includes(searchIndustry.value.toLowerCase())
  )
})

function toggleIndustryDropdown() {
  // Tutup yang lain dulu (mutual exclusive)
  isOpenCategory.value     = false
  isOpenStatusStatis.value = false
  isOpenIndustry.value     = !isOpenIndustry.value
  if (!isOpenIndustry.value) searchIndustry.value = ''
}
function selectIndustry(industry) {
  selectedIndustry.value     = industry
  formData.value.industry_id = industry.id
  isOpenIndustry.value       = false
  searchIndustry.value       = ''
}
function clearIndustry() {
  selectedIndustry.value     = null
  formData.value.industry_id = ''
}
function handleIndustryClickOutside(e) {
  if (industryRef.value && !industryRef.value.contains(e.target)) {
    isOpenIndustry.value = false
    searchIndustry.value = ''
  }
}

// ── SELECT: CATEGORY ──────────────────────────────────
const isOpenCategory   = ref(false)
const searchCategory   = ref('')
const selectedCategory = ref(null)
const categoryRef      = ref(null)

const filteredCategory = computed(() => {
  if (!categorySelectData.value) return []
  if (!searchCategory.value) return categorySelectData.value
  return categorySelectData.value.filter(o =>
    o.name?.toLowerCase().includes(searchCategory.value.toLowerCase())
  )
})

function toggleCategoryDropdown() {
  isOpenIndustry.value     = false
  isOpenStatusStatis.value = false
  isOpenCategory.value     = !isOpenCategory.value
  if (!isOpenCategory.value) searchCategory.value = ''
}
function selectCategory(cat) {
  selectedCategory.value          = cat
  formData.value.lead_category_id = cat.id
  isOpenCategory.value            = false
  searchCategory.value            = ''
}
function clearCategory() {
  selectedCategory.value          = null
  formData.value.lead_category_id = ''
}
function handleCategoryClickOutside(e) {
  if (categoryRef.value && !categoryRef.value.contains(e.target)) {
    isOpenCategory.value = false
    searchCategory.value = ''
  }
}

// ── SELECT: STATUS ────────────────────────────────────
const isOpenStatusStatis   = ref(false)
const searchStatusStatis   = ref('')
const selectedStatusStatis = ref(null)
const statusStatisRef      = ref(null)

const filteredStatusStatisOptions = computed(() => {
  if (!searchStatusStatis.value) return store.statusStatis
  return store.statusStatis.filter(o =>
    o.label.toLowerCase().includes(searchStatusStatis.value.toLowerCase())
  )
})

function toggleStatusStatisDropdown() {
  isOpenIndustry.value     = false
  isOpenCategory.value     = false
  isOpenStatusStatis.value = !isOpenStatusStatis.value
  if (!isOpenStatusStatis.value) searchStatusStatis.value = ''
}
function toggleStatusStatis(value) {
  selectedStatusStatis.value     = value
  formData.value.customer_status = value
  isOpenStatusStatis.value       = false
  searchStatusStatis.value       = ''
}
function removeStatusStatis() {
  selectedStatusStatis.value     = null
  formData.value.customer_status = ''
}
function isStatusStatisSelected(value) { return selectedStatusStatis.value === value }
function getStatusStatisLabel(value) {
  return store.statusStatis.find(o => o.value === value)?.label ?? value
}
function handleStatusStatisClickOutside(e) {
  if (statusStatisRef.value && !statusStatisRef.value.contains(e.target)) {
    isOpenStatusStatis.value = false
    searchStatusStatis.value = ''
  }
}

// ── DETAIL MODAL ──────────────────────────────────────
const isDetailModalVisible = ref(false)

// async function openDetailModal(id) {
//   isDetailModalVisible.value = true
//   await store.detailCustomer(id)
// }
// function closeDetailModal() {
//   isDetailModalVisible.value = false
//   customersDetail.value      = null
// }

// ── DELETE ────────────────────────────────────────────
async function openDeleteModal(item) {
  const isConfirmed = await confirm({
    type       : 'danger',
    title      : 'Hapus Data Customer',
    message    : `Yakin ingin menghapus "${item.company_name}"?`,
    detail     : 'Tindakan ini tidak bisa dibatalkan dan akan menghapus data secara permanen.',
    confirmText: 'Yes, Delete',
    cancelText : 'Cancel',
  })
  if (isConfirmed) {
    try {
      await store.deleteCustomer(item.id)
      showToast('success', 'Customer berhasil dihapus!')
    } catch {
      showToast('error', 'Gagal menghapus, coba lagi.')
    }
  }
}

// ── FORM ADD / EDIT ───────────────────────────────────
const isAddModalVisible = ref(false)
const isEdit            = ref(false)
const editId            = ref(null)
const formLoading       = ref(false)
const assignVisibility  = ref('PUBLIC')

const defaultForm = {
  company_name     : '',
  contact_name     : '',
  email            : '',
  phone            : '',
  customer_status  : '',
  industry_id      : '',
  lead_category_id : '',
  lead_source      : '',
  notes            : '',
  address          : '',
  visibility       : 'PUBLIC',
}

const formData = ref({ ...defaultForm })

function resetSelectState() {
  selectedIndustry.value     = null
  selectedCategory.value     = null
  selectedStatusStatis.value = null
  searchIndustry.value       = ''
  searchCategory.value       = ''
  searchStatusStatis.value   = ''
  isOpenIndustry.value       = false
  isOpenCategory.value       = false
  isOpenStatusStatis.value   = false
  assignVisibility.value     = 'PUBLIC'
}

function resetForm() {
  formData.value       = { ...defaultForm }
  errorCustomers.value = null
  phoneTouched.value   = false
  resetSelectState()
}

function openAddModal() {
  isEdit.value            = false
  editId.value            = null
  resetForm()
  isAddModalVisible.value = true
}

function openEditModal(c) {
  isEdit.value = true
  editId.value = c.id
  resetForm()
  formData.value = {
    company_name     : c.company_name     ?? '',
    contact_name     : c.contact_name     ?? '',
    email            : c.email            ?? '',
    phone            : c.phone            ?? '',
    customer_status  : c.customer_status  ?? '',
    industry_id      : c.industry_id      ?? '',
    lead_category_id : c.lead_category_id ?? '',
    lead_source      : c.lead_source      ?? '',
    notes            : c.notes            ?? '',
    address          : c.address          ?? '',
    visibility       : c.visibility       ?? 'PUBLIC',
  }
  assignVisibility.value     = c.visibility      ?? 'PUBLIC'
  selectedStatusStatis.value = c.customer_status ?? null
  selectedIndustry.value     = industrySelectData.value?.find(i => i.id === c.industry_id)      ?? null
  selectedCategory.value     = categorySelectData.value?.find(i => i.id === c.lead_category_id) ?? null
  isAddModalVisible.value    = true
}

function closeAddModal() {
  isAddModalVisible.value = false
  isEdit.value            = false
  editId.value            = null
  resetForm()
}

async function handleSave() {
  phoneTouched.value = true
  if (!isPhoneValid.value) {
    showToast('error', 'Nomor telepon tidak valid.')
    return
  }

  formLoading.value         = true
  errorCustomers.value      = null
  formData.value.visibility = assignVisibility.value
  try {
    if (isEdit.value) {
      await store.updateCustomer(editId.value, formData.value)
      showToast('success', 'Customer berhasil diperbarui!')
    } else {
      await store.saveCustomer(formData.value)
      // showToast('success', 'Customer berhasil ditambahkan!')
      showToast(
          'success',
          'Customer berhasil diajukan dan sedang menunggu approval Manager.'
      )
    }
    closeAddModal()
  } catch {
    // error per-field tampil via getError()
  } finally {
    formLoading.value = false
  }
}


// ── MODAL: SUBMISSION STATUS (pending + rejected milik sales) ──
const isSubmissionModalVisible = ref(false)

async function openSubmissionModal() {
  isSubmissionModalVisible.value = true
  await store.fetchSubmissions()
}
function closeSubmissionModal() {
  isSubmissionModalVisible.value = false
}


async function openDetailModal(id) {
  isDetailModalVisible.value = true
  await store.detailCustomer(id)
  await store.fetchBranches(id)
}

function closeDetailModal() {
  isDetailModalVisible.value = false
  customersDetail.value      = null
  store.branchesData         = []
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <!-- ═══ BREADCRUMB ═══ -->
    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="table-list" /> Customers Management
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" /> Home
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Customers Table</span>
        </div>
      </div>
    </div>

    <!-- ═══ TOOLBAR TOP ═══ -->
    <div class="toolbar-top">
      <div class="toolbar-left">
        <div class="drop-wrap">
          <button class="btn-toolbar btn-purple" @click="showExportCustomers = !showExportCustomers">
            <font-awesome-icon icon="upload" /> Exports
            <font-awesome-icon icon="chevron-down" class="btn-arrow" />
          </button>
          <div class="drop-menu" :class="{ show: showExportCustomers }">
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
          <button class="btn-toolbar btn-purple" @click="showImportCustomers = !showImportCustomers">
            <font-awesome-icon icon="download" /> Imports
            <font-awesome-icon icon="chevron-down" class="btn-arrow" />
          </button>
          <div class="drop-menu" :class="{ show: showImportCustomers }">
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
    </div>

    <!-- ═══ CONTROLS ROW ═══ -->
    <div class="controls-card">
      <div class="controls-row">
        <div class="controls-left">
          <div class="showing-wrap">
            <font-awesome-icon icon="list" class="text-muted-color" />
            <span class="showing-label">Showing:</span>
            <div class="drop-wrap">
              <button class="btn-select" @click="showPerPageCustomers = !showPerPageCustomers">
                {{ store.pagination.per_page }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showPerPageCustomers }">
                <div class="drop-label">Per Halaman</div>
                <div class="perpage-grid">
                  <button
                    v-for="opt in [5, 10, 25, 50]" :key="opt"
                    class="perpage-opt"
                    :class="{ active: store.pagination.per_page === opt }"
                    @click="store.pagination.per_page = opt; showPerPageCustomers = false; store.changePageSize()"
                  >{{ opt }}</button>
                </div>
              </div>
            </div>
          </div>

          <!-- ═══ VIEW MODE TOGGLE (CARD / TABLE) ═══ -->
          <div class="view-toggle">
            <button
              class="view-toggle-btn"
              :class="{ active: viewMode === 'card' }"
              title="Tampilan Card"
              @click="setViewMode('card')"
            >
              <font-awesome-icon icon="table-cells" /> Card
            </button>
            <button
              class="view-toggle-btn"
              :class="{ active: viewMode === 'table' }"
              title="Tampilan Tabel"
              @click="setViewMode('table')"
            >
              <font-awesome-icon icon="list" /> Table
            </button>
          </div>

          <button v-if="canCreate" class="btn-toolbar btn-purple" @click="openAddModal">
            <font-awesome-icon icon="plus" /> Add Data
          </button>

          <button class="btn-toolbar btn-submission" @click="openSubmissionModal">
            <font-awesome-icon icon="hourglass-half" /> Status Pengajuan
            <span v-if="store.submissionMeta.total" class="submission-count">
              {{ store.submissionMeta.total }}
            </span>
          </button>

        </div>
        <div class="controls-right">
          <div class="search-wrap">
            <input
              :value="store.searchCustomers"
              type="text"
              placeholder="Search Customers..."
              class="search-input"
              @input="store.searchWithDelay($event.target.value)"
            />
            <button class="search-btn"><font-awesome-icon icon="magnifying-glass" /></button>
          </div>
          <div class="sort-wrap">
            <span class="showing-label">Sort:</span>
            <div class="drop-wrap">
              <button class="btn-select" @click="showSortByCustomers = !showSortByCustomers">
                {{ sortByLabel() }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showSortByCustomers }">
                <div class="drop-label">Sort By</div>
                <button
                  v-for="opt in sortByOptions" :key="opt.value"
                  class="drop-item"
                  :class="{ active: store.sort.column === opt.value }"
                  @click="store.toggleSort(opt.value); showSortByCustomers = false"
                >{{ opt.label }}</button>
              </div>
            </div>
            <div class="drop-wrap">
              <button class="btn-select" @click="showSortDirCustomers = !showSortDirCustomers">
                {{ store.sort.direction === 'asc' ? 'Asc' : 'Desc' }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-right" :class="{ show: showSortDirCustomers }">
                <div class="drop-label">Urutan</div>
                <button
                  v-for="opt in ['desc', 'asc']" :key="opt"
                  class="drop-item"
                  :class="{ active: store.sort.direction === opt }"
                  @click="store.sort.direction = opt; store.changeSorting(); showSortDirCustomers = false"
                >{{ opt === 'asc' ? 'Asc' : 'Desc' }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ CONTENT: CARD VIEW / TABLE VIEW ═══ -->
    <div class="content-card flex-grow-1 overflow-auto mb-3">

      <!-- LOADING (shared) -->
      <div v-if="store.loadingCustomers" class="state-wrap">
        <div class="spinner-custom"></div>
      </div>

      <!-- EMPTY (shared) -->
      <!-- <div v-else-if="!store.customersData.length" class="state-wrap">
        <div class="empty-state">
          <img src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif"
            alt="No data" class="empty-img" />
          <div class="empty-text">No data found</div>
        </div>
      </div> -->
      <div v-else-if="!store.customersData.length" class="state-wrap">
        <div class="empty-state">

          <img
            src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif"
            alt="No Customer"
            class="empty-img"
          />

          <h5 class="empty-title">
            Belum Ada Customer
          </h5>

          <p class="empty-text">
            Customer akan muncul di halaman ini setelah disetujui oleh Manager.
          </p>

          <button
            v-if="canCreate"
            class="btn-toolbar btn-purple mt-2"
            @click="openAddModal"
          >
            <font-awesome-icon icon="plus" />
            Tambah Customer
          </button>

        </div>
      </div>

      <!-- ═══ CARD VIEW (DEFAULT) ═══ -->
      <div v-else-if="viewMode === 'card'" class="customer-grid">
        <div v-for="item in store.customersData" :key="item.id" class="customer-card">
          <div class="cc-top">
            <div class="cc-avatar" :style="{ background: getAvatarColor(item.company_name) }">
              {{ getInitials(item.company_name) }}
            </div>
            <div class="cc-headinfo">
              <div class="cc-name" :title="item.company_name">{{ item.company_name }}</div>
              <div class="cc-code">{{ item.customer_code }}</div>
            </div>
            <div class="cc-break"></div>
            <span class="status-badge cc-status" :class="store.getStatusConfig(item.customer_status).label">
              {{ item.customer_status ?? '-' }}
            </span>
          </div>

          <div class="cc-body">
            <div class="cc-row">
              <font-awesome-icon icon="user" class="cc-icon" />
              <span>{{ item.contact_name ?? '-' }}</span>
            </div>
            <div class="cc-row">
              <font-awesome-icon icon="envelope" class="cc-icon" />
              <span>{{ item.email ?? '-' }}</span>
            </div>
            <div class="cc-row">
              <font-awesome-icon icon="phone" class="cc-icon" />
              <span>{{ item.phone ?? '-' }}</span>
            </div>
            <div class="cc-row">
              <font-awesome-icon icon="industry" class="cc-icon" />
              <span>{{ item.industry_name ?? '-' }}</span>
            </div>
          </div>

          <div class="cc-tags">
            <span class="badge-lead-source">{{ item.lead_source ?? '-' }}</span>
            <span v-if="item.lead_category_name" class="detail-badge">{{ item.lead_category_name }}</span>
            <span v-if="item.branch_count > 0" class="detail-badge">
              <font-awesome-icon icon="code-branch" /> {{ item.branch_count }} Cabang
            </span>
          </div>

          <div class="cc-footer">
            <span class="cc-date">
              <font-awesome-icon icon="calendar" /> {{ store.formatDate(item.created_at) }}
            </span>
            <div class="cc-actions">
              <button v-if="canUpdate" class="act-btn act-edit"   title="Edit"   @click="openEditModal(item)">
                <font-awesome-icon icon="pen-to-square" />
              </button>
              <button v-if="canDelete" class="act-btn act-delete" title="Hapus"  @click="openDeleteModal(item)">
                <font-awesome-icon icon="trash-can" />
              </button>
              <button v-if="canView" class="act-btn act-info"   title="Detail" @click="openDetailModal(item.id)">
                <font-awesome-icon icon="circle-info" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ TABLE VIEW ═══ -->
      <table v-else class="data-table">
        <thead>
          <tr>
            <th style="width:60px">NO.</th>
            <th>Customer Code</th>
            <th>Company Name</th>
            <th>Contact</th>
            <th>Email / Phone</th>
            <th>Lead Info</th>
            <th>Status</th>
            <th style="width:130px; text-align:center">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in store.customersData" :key="item.id" class="data-row">
            <td class="td-no">
              {{ (store.pagination.current_page - 1) * store.pagination.per_page + index + 1 }}.
            </td>
            <td class="td-name"><span class="mono-text">{{ item.customer_code }}</span></td>
            <td class="td-name">
              <span class="fw-bold">{{ item.company_name }}</span>
              <div class="td-sub">{{ item.industry_name ?? '-' }}</div>
            </td>
            <td class="td-name">{{ item.contact_name }}</td>
            <td class="td-name">
              <div class="td-muted">{{ item.email }}</div>
              <div class="td-muted">{{ item.phone }}</div>
            </td>
            <td class="td-name">
              <span class="badge-lead-source">{{ item.lead_source ?? '-' }}</span>
              <div class="td-sub">{{ item.lead_category_name ?? '-' }}</div>
              <div class="td-sub">by {{ item.owner_name ?? '-' }}</div>
            </td>
            <td class="td-name">
              <span class="status-badge" :class="store.getStatusConfig(item.customer_status).label">
                {{ item.customer_status ?? '-' }}
              </span>
            </td>
           
            <td class="td-actions">
              <button v-if="canUpdate" class="act-btn act-edit"   title="Edit"   @click="openEditModal(item)">
                <font-awesome-icon icon="pen-to-square" />
              </button>
              <button v-if="canDelete" class="act-btn act-delete" title="Hapus"  @click="openDeleteModal(item)">
                <font-awesome-icon icon="trash-can" />
              </button>
              <button v-if="canView" class="act-btn act-info"   title="Detail" @click="openDetailModal(item.id)">
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
          @click="store.fetchCustomers(store.pagination.prev_page_url)">
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button class="btn-prev-next" :disabled="store.pagination.current_page === store.pagination.last_page"
          @click="store.fetchCustomers(store.pagination.next_page_url)">
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">{{ store.customersData.length }} DATA | PAGE {{ store.pagination.current_page }}</span>
        <span class="page-badge">TOTAL: {{ store.pagination.total }}</span>
      </div>
    </div>


    <!-- ═══ MODAL ADD / EDIT ═══ -->
    <AppModal
      :show="isAddModalVisible"
      :title="isEdit ? 'Edit Customer' : 'Add New Customer'"
      :icon="isEdit ? 'pen-to-square' : 'plus'"
      size="md"
      @close="closeAddModal"
    >
      <div class="form-container-gap">

        <div class="form-group">
          <label>Company Name <span class="required">*</span></label>
          <input v-model="formData.company_name" class="form-input"
            :class="{ 'input-error': getError('company_name') }"
            placeholder="PT. Example" />
          <span v-if="getError('company_name')" class="form-error">{{ getError('company_name') }}</span>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label>Contact Name <span class="required">*</span></label>
            <input v-model="formData.contact_name" class="form-input"
              :class="{ 'input-error': getError('contact_name') }"
              placeholder="John Doe" />
            <span v-if="getError('contact_name')" class="form-error">{{ getError('contact_name') }}</span>
          </div>
          <div class="form-group">
            <label>Phone <span class="required">*</span></label>
            <input
              :value="formData.phone"
              type="tel"
              class="form-input"
              :class="{ 'input-error': getError('phone') || (phoneTouched && phoneFormatError) }"
              placeholder="08xxxxxxxxxx / 021-xxxxxxx ext 123"
              @input="sanitizePhoneInput"
              @blur="phoneTouched = true"
            />
            <span v-if="getError('phone')" class="form-error">{{ getError('phone') }}</span>
            <span v-else-if="phoneTouched && phoneFormatError" class="form-error">{{ phoneFormatError }}</span>
          </div>
        </div>

        <div class="form-group">
          <label>Email <span class="required">*</span></label>
          <input v-model="formData.email" type="email" class="form-input"
            :class="{ 'input-error': getError('email') }"
            placeholder="email@example.com" />
          <span v-if="getError('email')" class="form-error">{{ getError('email') }}</span>
        </div>

        <!-- Industry + Category -->
        <div class="form-row-2">

          <!-- FIX: ref="industryRef" dipindah ke cs-wrap (wrapper trigger+dropdown), bukan di form-group -->
          <div class="form-group">
            <label>Industry <span class="required">*</span></label>
            <div class="cs-wrap" ref="industryRef">
              <div class="custom-select"
                :class="{ open: isOpenIndustry, 'has-error': getError('industry_id') }"
                @click="toggleIndustryDropdown">
                <span v-if="!selectedIndustry" class="cs-placeholder">Select Industry...</span>
                <span v-else class="cs-tag">
                  {{ selectedIndustry.name }}
                  <button type="button" @click.stop="clearIndustry">×</button>
                </span>
                <font-awesome-icon icon="chevron-down" class="cs-arrow" :class="{ rotated: isOpenIndustry }" />
              </div>
              <!-- FIX: position static — dropdown inline, tidak tembus keluar modal -->
              <div v-if="isOpenIndustry" class="cs-dropdown">
                <div class="cs-search-wrap">
                  <input v-model="searchIndustry" placeholder="Cari industry..." class="cs-search" @click.stop />
                </div>
                <div class="cs-list">
                  <div v-if="!filteredIndustry.length" class="cs-empty">Data tidak ditemukan</div>
                  <div v-for="ind in filteredIndustry" :key="ind.id" class="cs-item"
                    :class="{ active: selectedIndustry?.id === ind.id }"
                    @click="selectIndustry(ind)">
                    <span class="cs-check">
                      <font-awesome-icon v-if="selectedIndustry?.id === ind.id" icon="check" />
                    </span>
                    {{ ind.name }}
                  </div>
                </div>
              </div>
            </div>
            <span v-if="getError('industry_id')" class="form-error">{{ getError('industry_id') }}</span>
          </div>

          <div class="form-group">
            <label>Category <span class="required">*</span></label>
            <div class="cs-wrap" ref="categoryRef">
              <div class="custom-select"
                :class="{ open: isOpenCategory, 'has-error': getError('lead_category_id') }"
                @click="toggleCategoryDropdown">
                <span v-if="!selectedCategory" class="cs-placeholder">Select Category...</span>
                <span v-else class="cs-tag">
                  {{ selectedCategory.name }}
                  <button type="button" @click.stop="clearCategory">×</button>
                </span>
                <font-awesome-icon icon="chevron-down" class="cs-arrow" :class="{ rotated: isOpenCategory }" />
              </div>
              <div v-if="isOpenCategory" class="cs-dropdown">
                <div class="cs-search-wrap">
                  <input v-model="searchCategory" placeholder="Cari category..." class="cs-search" @click.stop />
                </div>
                <div class="cs-list">
                  <div v-if="!filteredCategory.length" class="cs-empty">Data tidak ditemukan</div>
                  <div v-for="cat in filteredCategory" :key="cat.id" class="cs-item"
                    :class="{ active: selectedCategory?.id === cat.id }"
                    @click="selectCategory(cat)">
                    <span class="cs-check">
                      <font-awesome-icon v-if="selectedCategory?.id === cat.id" icon="check" />
                    </span>
                    {{ cat.name }}
                  </div>
                </div>
              </div>
            </div>
            <span v-if="getError('lead_category_id')" class="form-error">{{ getError('lead_category_id') }}</span>
          </div>

        </div>

        <div class="form-group">
          <label>Lead Source <span class="required">*</span></label>
          <div class="pill-btn-group">
            <button
              v-for="src in store.leadSourceOptions" :key="src.value"
              type="button"
              class="pill-btn"
              :class="{ active: formData.lead_source === src.value }"
              @click="formData.lead_source = src.value"
            >{{ src.label }}</button>
          </div>
          <span v-if="getError('lead_source')" class="form-error">{{ getError('lead_source') }}</span>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label>Visibility</label>
            <div class="segment-group">
              <button type="button" class="segment-btn" :class="{ active: assignVisibility === 'PUBLIC' }"
                @click="assignVisibility = 'PUBLIC'">
                <font-awesome-icon icon="globe" /> PUBLIC
              </button>
              <button type="button" class="segment-btn" :class="{ active: assignVisibility === 'PRIVATE' }"
                @click="assignVisibility = 'PRIVATE'">
                <font-awesome-icon icon="lock" /> PRIVATE
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>Customer Status <span class="required">*</span></label>
            <div class="cs-wrap" ref="statusStatisRef">
              <div class="custom-select"
                :class="{ open: isOpenStatusStatis, 'has-error': getError('customer_status') }"
                @click="toggleStatusStatisDropdown">
                <span v-if="!selectedStatusStatis" class="cs-placeholder">Select Status...</span>
                <span v-else class="cs-tag">
                  {{ getStatusStatisLabel(selectedStatusStatis) }}
                  <button type="button" @click.stop="removeStatusStatis">×</button>
                </span>
                <font-awesome-icon icon="chevron-down" class="cs-arrow" :class="{ rotated: isOpenStatusStatis }" />
              </div>
              <div v-if="isOpenStatusStatis" class="cs-dropdown">
                <div class="cs-search-wrap">
                  <input v-model="searchStatusStatis" placeholder="Cari status..." class="cs-search" @click.stop />
                </div>
                <div class="cs-list">
                  <div v-if="!filteredStatusStatisOptions.length" class="cs-empty">Data tidak ditemukan</div>
                  <div v-for="sts in filteredStatusStatisOptions" :key="sts.value" class="cs-item"
                    :class="{ active: isStatusStatisSelected(sts.value) }"
                    @click="toggleStatusStatis(sts.value)">
                    <span class="cs-check">
                      <font-awesome-icon v-if="isStatusStatisSelected(sts.value)" icon="check" />
                    </span>
                    {{ sts.label }}
                  </div>
                </div>
              </div>
            </div>
            <span v-if="getError('customer_status')" class="form-error">{{ getError('customer_status') }}</span>
          </div>
        </div>

        <div class="form-group">
          <label>Address</label>
          <textarea v-model="formData.address" class="form-input form-textarea" rows="2"
            placeholder="Alamat lengkap..." />
        </div>

        <div class="form-group">
          <label>Notes</label>
          <textarea v-model="formData.notes" class="form-input form-textarea" rows="2"
            placeholder="Catatan tambahan..." />
        </div>

      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeAddModal">Cancel</button>
        <button
          class="btn-save"
          :class="{ 'btn-save-edit': isEdit }"
          :disabled="formLoading || savingCustomers || updatingCustomers || !isPhoneValid"
          @click="handleSave"
        >
          <font-awesome-icon v-if="formLoading || savingCustomers || updatingCustomers" icon="spinner" spin />
          <font-awesome-icon v-else :icon="isEdit ? 'pen-to-square' : 'check'" />
          {{ (formLoading || savingCustomers || updatingCustomers)
              ? (isEdit ? 'Menyimpan...' : 'Menambahkan...')
              : (isEdit ? 'Simpan Perubahan' : 'Save Data') }}
        </button>
      </template>
    </AppModal>


    <!-- ═══ MODAL DETAIL ═══ -->
    <AppModal :show="isDetailModalVisible" title="Customer Detail" icon="circle-info" size="md"
      @close="closeDetailModal">
      <div v-if="store.loadingDetail" style="display:flex;justify-content:center;padding:40px 0;">
        <div class="spinner-custom"></div>
      </div>
      <template v-else-if="store.customersDetail">
        <div class="detail-banner">
          <span class="detail-banner-code">{{ store.customersDetail.customer_code }}</span>
          <h3 class="detail-banner-name">{{ store.customersDetail.company_name }}</h3>
          <span class="detail-banner-industry">{{ store.customersDetail.industry_name ?? '-' }}</span>
        </div>
        <div class="detail-list">
          <div class="detail-section-label">Contact Info</div>
          <div class="detail-row">
            <span class="detail-label">Contact Name</span>
            <span class="detail-value">{{ store.customersDetail.contact_name }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phone</span>
            <span class="detail-value">{{ store.customersDetail.phone }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email</span>
            <span class="detail-value">{{ store.customersDetail.email }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Address</span>
            <span class="detail-value">{{ store.customersDetail.address ?? '-' }}</span>
          </div>
          <div class="detail-section-label">Lead Info</div>
          <div class="detail-row">
            <span class="detail-label">Lead Source</span>
            <span class="detail-badge">{{ store.customersDetail.lead_source ?? '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Category</span>
            <span class="detail-badge">{{ store.customersDetail.category_name ?? store.customersDetail.lead_category_name ?? '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Owner</span>
            <span class="detail-value">{{ store.customersDetail.owner_name ?? '-' }}</span>
          </div>
          <div v-if="store.customersDetail.assigned_name" class="detail-row">
            <span class="detail-label">Assigned To</span>
            <span class="detail-value">{{ store.customersDetail.assigned_name }}</span>
          </div>
          <div class="detail-section-label">Status</div>
          <div class="detail-row">
            <span class="detail-label">Customer Status</span>
            <span class="status-badge" :class="store.getStatusConfig(store.customersDetail.customer_status).label">
              {{ store.customersDetail.customer_status }}
            </span>
          </div>

          <div class="detail-row">
            <span class="detail-label">Lead Status</span>
            <span class="detail-badge">{{ store.customersDetail.lead_status ?? '-' }}</span>
          </div>


          <div class="detail-section-label">
            Cabang <span v-if="store.branchesData.length">({{ store.branchesData.length }})</span>
          </div>

          <div v-if="store.loadingBranches" style="display:flex;justify-content:center;padding:12px 0;">
            <div class="spinner-custom" style="width:1.4rem;height:1.4rem;"></div>
          </div>

          <div v-else-if="!store.branchesData.length" class="detail-row">
            <span class="detail-value" style="color:var(--text-muted);">Belum ada cabang</span>
          </div>

          <div v-else class="branch-list">
            <div v-for="branch in store.branchesData" :key="branch.id" class="branch-item">
              <div class="branch-item-top">
                <span class="branch-name">
                  {{ branch.branch_name }}
                  <span v-if="branch.is_main_branch" class="detail-badge">Utama</span>
                </span>
                <span class="status-badge" :class="store.getStatusConfig(branch.status).label">
                  {{ branch.status }}
                </span>
              </div>
              <div class="branch-item-row" v-if="branch.address">
                <font-awesome-icon icon="location-dot" class="cc-icon" /> {{ branch.address }}
              </div>
              <div class="branch-item-row">
                <font-awesome-icon icon="user" class="cc-icon" />
                Sales: {{ branch.assigned_name ?? 'Belum ditentukan' }}
              </div>
            </div>
          </div>



          <div class="detail-row">
            <span class="detail-label">Converted At</span>
            <span class="detail-value">{{ store.formatDate(store.customersDetail.converted_at) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Created At</span>
            <span class="detail-value">{{ store.formatDate(store.customersDetail.created_at) }}</span>
          </div>
          <div v-if="store.customersDetail.notes" class="detail-row">
            <span class="detail-label">Notes</span>
            <span class="detail-value">{{ store.customersDetail.notes }}</span>
          </div>
        </div>
      </template>
      <template #footer>
        <button class="btn-cancel" @click="closeDetailModal">Close</button>
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




  <!-- ═══ MODAL SUBMISSION STATUS ═══ -->
<AppModal
  :show="isSubmissionModalVisible"
  title="Status Pengajuan Customer Saya"
  icon="hourglass-half"
  size="lg"
  @close="closeSubmissionModal"
>
  <div v-if="store.loadingSubmission" class="state-wrap">
    <div class="spinner-custom"></div>
  </div>

  <div v-else-if="!store.submissionData.length" class="state-wrap">
    <div class="empty-state">
      <h5 class="empty-title">Tidak Ada Pengajuan</h5>
      <p class="empty-text">Semua customer yang kamu ajukan sudah disetujui, atau kamu belum pernah mengajukan customer baru.</p>
    </div>
  </div>

  <div v-else class="submission-list">
    <div v-for="item in store.submissionData" :key="item.id" class="submission-item">
      <div class="si-top">
        <div class="si-headinfo">
          <div class="si-name">{{ item.company_name }}</div>
          <div class="si-code">{{ item.customer_code }}</div>
        </div>
        <span class="status-badge" :class="store.getApprovalConfig(item.approval_status).label">
          <font-awesome-icon :icon="item.approval_status === 'pending' ? 'clock' : 'circle-xmark'" />
          {{ store.getApprovalConfig(item.approval_status).text }}
        </span>
      </div>

      <div class="si-body">
        <div class="si-row">
          <font-awesome-icon icon="user" class="cc-icon" />
          <span>{{ item.contact_name ?? '-' }}</span>
        </div>
        <div class="si-row">
          <font-awesome-icon icon="calendar" class="cc-icon" />
          <span>Diajukan {{ store.formatDate(item.created_at) }}</span>
        </div>
      </div>

      <!-- CATATAN REVISI/PENOLAKAN DARI MANAGER -->
      <div v-if="item.approval_status === 'rejected' && item.approval_note" class="si-reject-note">
        <font-awesome-icon icon="circle-exclamation" />
        <div>
          <div class="si-reject-label">Alasan Ditolak Manager:</div>
          <div class="si-reject-text">{{ item.approval_note }}</div>
        </div>
      </div>

      <div v-if="item.approval_status === 'pending'" class="si-pending-note">
        <font-awesome-icon icon="hourglass-half" />
        Masih menunggu review dari Manager.
      </div>
    </div>
  </div>

  <template #footer>
    <button class="btn-cancel" @click="closeSubmissionModal">Close</button>
  </template>
</AppModal>
</template>

<style scoped>
.h-100 {
  --text-muted   : #64748b;
  --primary-color: #6366f1;
}

.form-container-gap { display: flex; flex-direction: column; gap: 14px; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

/* ── BREADCRUMB ── */
.breadcrumb-card { background: var(--bg-card); border-radius: 10px; padding: 16px 18px; box-shadow: 0 1px 3px var(--shadow-color); }
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

/* ── TOOLBAR ── */
.toolbar-top { display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); border-radius: 10px; padding: 12px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); flex-wrap: wrap; gap: 8px; }
.toolbar-left { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-toolbar { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: none; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; transition: all 0.18s ease; white-space: nowrap; }
.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover { background: #4f46e5; }
.btn-orange { background: #f59e0b; color: #fff; }
.btn-orange:hover { background: #d97706; }
.btn-arrow { font-size: 0.6rem; opacity: 0.7; }

/* ── SPINNER & EMPTY ── */
.state-wrap { display: flex; justify-content: center; padding: 40px 0; }
.spinner-custom { width: 2rem; height: 2rem; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 24px 0; gap: 8px; }
.empty-img { max-width: 200px; height: auto; opacity: 0.85; }
.empty-text { font-size: 0.9rem; font-weight: 600; color: var(--text-muted); }

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

/* ── VIEW TOGGLE (CARD / TABLE) ── */
.view-toggle { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.view-toggle-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; background: transparent; border: none; color: var(--text-muted); font-size: 0.83rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; white-space: nowrap; }
.view-toggle-btn + .view-toggle-btn { border-left: 1px solid var(--border-main); }
.view-toggle-btn:hover:not(.active) { color: #6366f1; }
.view-toggle-btn.active { background: #6366f1; color: #fff; }

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

/* ── CONTENT WRAPPER (CARD / TABLE) ── */
.content-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); overflow: auto; }

/* ── CARD VIEW ── */
.customer-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 14px; padding: 16px; }
.customer-card { display: flex; flex-direction: column; gap: 10px; border: 1px solid var(--border-main); border-radius: 12px; background: var(--bg-card); padding: 14px; transition: all 0.18s ease; }
.customer-card:hover { box-shadow: 0 6px 18px rgba(0,0,0,0.08); border-color: #6366f1; transform: translateY(-2px); }
.cc-top { display: flex; align-items: flex-start; gap: 10px; flex-wrap: wrap; }
.cc-avatar { width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }
.cc-headinfo { flex: 1; min-width: 0; }
.cc-name { font-weight: 700; font-size: 0.92rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cc-code { font-family: monospace; font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }
.cc-status { flex-shrink: 0; }
.cc-break { display: none; }
.cc-body { display: flex; flex-direction: column; gap: 6px; }
.cc-row { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cc-icon { color: var(--text-muted); width: 14px; flex-shrink: 0; }
.cc-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.cc-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px dashed var(--border-main); }
.cc-date { display: inline-flex; align-items: center; gap: 6px; font-size: 0.72rem; color: var(--text-muted); font-weight: 600; }
.cc-actions { display: flex; gap: 4px; }

/* ── TABLE VIEW ── */
.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
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
.badge-lead-source { display: inline-block; padding: 2px 8px; border-radius: 5px; background: var(--bg-input); color: var(--text-muted); font-size: 0.75rem; font-weight: 600; }
.act-btn { width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s ease; margin: 0 2px; background: transparent; }
.act-edit         { color: #f59e0b; border-color: #f59e0b; }
.act-edit:hover   { background: #f59e0b; color: #fff; }
.act-delete       { color: #ef4444; border-color: #ef4444; }
.act-delete:hover { background: #ef4444; color: #fff; }
.act-info         { color: #6366f1; border-color: #6366f1; }
.act-info:hover   { background: #6366f1; color: #fff; }

/* ── PAGINATION ── */
.pagination-card { background: var(--bg-card); border-radius: 10px; padding: 14px 18px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: row-reverse; align-items: center; justify-content: space-between; gap: 12px; }
.pagination-nav { display: flex; align-items: center; gap: 8px; }
.btn-prev-next { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; min-width: 85px; justify-content: center; transition: background 0.18s ease; }
.btn-prev-next:hover:not(:disabled) { background: #4f46e5; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badges { display: flex; gap: 8px; align-items: center; }
.page-badge { padding: 7px 14px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); background: var(--bg-input); white-space: nowrap; }

/* ── FORM ── (satu deklarasi, tidak duplikat) */
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.required { color: #ef4444; }
.form-input { padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.875rem; background: var(--bg-input); color: var(--text-primary); outline: none; transition: border 0.18s; width: 100%; box-sizing: border-box; }
.form-input:focus { border-color: #6366f1; }
.form-textarea { resize: none; min-height: 70px; line-height: 1.5; }
.input-error { border-color: #ef4444 !important; background: #fef2f2 !important; }
.form-error { font-size: 0.75rem; color: #ef4444; }

/* ── MODAL BUTTONS ── */
.btn-cancel { padding: 8px 18px; background: var(--bg-main, #f1f5f9); color: var(--text-muted); border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
.btn-cancel:hover { background: var(--border-main); color: var(--text-primary); }
.btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.18s; }
.btn-save:hover:not(:disabled) { background: #4f46e5; }
.btn-save.btn-save-edit { background: #f59e0b; }
.btn-save.btn-save-edit:hover:not(:disabled) { background: #d97706; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }


.branch-list { display: flex; flex-direction: column; gap: 8px; padding: 4px 0 12px; }
.branch-item { border: 1px solid var(--border-main); border-radius: 8px; padding: 10px 12px; }
.branch-item-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
.branch-name { font-weight: 700; font-size: 0.86rem; color: var(--text-primary); display: flex; align-items: center; gap: 6px; }
.branch-item-row { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--text-muted); margin-top: 3px; }

/* ════════════════════════════════════════════════
   CUSTOM SELECT — FIX DROPDOWN TEMBUS MODAL
   
   Sebelumnya: .cs-dropdown { position: absolute }
               → keluar dari flow, tembus modal
   
   Sesudah   : .cs-dropdown { position: static }
               → inline, push konten ke bawah,
                 tidak pernah keluar dari modal
   
   .cs-wrap  : wrapper trigger + dropdown, jadi
               target click-outside detection
════════════════════════════════════════════════ */
.cs-wrap { display: flex; flex-direction: column; }

.custom-select {
  display: flex; align-items: center; justify-content: space-between;
  min-height: 40px; padding: 6px 10px;
  border: 1px solid var(--border-main); border-radius: 8px;
  background: var(--bg-input); cursor: pointer; transition: border 0.18s;
}
.custom-select:hover,
.custom-select.open { border-color: #6366f1; }
.custom-select.has-error { border-color: #ef4444; background: #fef2f2; }

.cs-placeholder { font-size: 0.875rem; color: var(--text-muted); flex: 1; }
.cs-tag {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 2px 8px; background: rgba(99,102,241,0.1); color: #6366f1;
  border-radius: 6px; font-size: 0.82rem; font-weight: 600; flex: 1;
}
.cs-tag button { background: none; border: none; cursor: pointer; color: inherit; font-size: 0.9rem; line-height: 1; padding: 0; }
.cs-arrow { font-size: 0.65rem; color: var(--text-muted); transition: transform 0.2s; flex-shrink: 0; margin-left: 6px; }
.cs-arrow.rotated { transform: rotate(180deg); }

/* KEY FIX: position static, bukan absolute */
.cs-dropdown {
  position: static;
  margin-top: 4px;
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  overflow: hidden;
}

.cs-search-wrap { padding: 8px; border-bottom: 1px solid var(--border-main); }
.cs-search { width: 100%; padding: 7px 10px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.84rem; background: var(--bg-input); color: var(--text-primary); outline: none; box-sizing: border-box; }
.cs-search:focus { border-color: #6366f1; }
.cs-list { max-height: 180px; overflow-y: auto; padding: 4px; }
.cs-empty { text-align: center; padding: 12px; font-size: 0.84rem; color: var(--text-muted); }
.cs-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 7px; font-size: 0.84rem; cursor: pointer; color: var(--text-primary); }
.cs-item:hover { background: var(--bg-nav-hover); }
.cs-item.active { background: rgba(99,102,241,0.08); color: #6366f1; font-weight: 600; }
.cs-check { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; color: #6366f1; flex-shrink: 0; }

/* ── PILL BUTTONS ── */
.pill-btn-group { display: flex; flex-wrap: wrap; gap: 6px; }
.pill-btn { padding: 6px 14px; border: 1px solid var(--border-main); border-radius: 20px; background: var(--bg-input); color: var(--text-primary); font-size: 0.82rem; font-weight: 500; cursor: pointer; transition: all 0.15s; }
.pill-btn:hover { border-color: #6366f1; color: #6366f1; }
.pill-btn.active { background: #6366f1; border-color: #6366f1; color: #fff; font-weight: 600; }

/* ── SEGMENT GROUP ── */
.segment-group { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.segment-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 10px; border: none; background: transparent; color: var(--text-primary); font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.18s; }
.segment-btn:hover:not(.active) { background: rgba(99,102,241,0.06); color: #6366f1; }
.segment-btn.active { background: #6366f1; color: #fff; }

/* ── DETAIL MODAL ── */
.detail-banner { background: linear-gradient(135deg, #1e3a5f, #2563eb); border-radius: 10px; padding: 16px 18px; margin-bottom: 16px; }
.detail-banner-code { font-family: monospace; font-size: 0.75rem; color: #93c5fd; display: block; }
.detail-banner-name { margin: 4px 0; color: #fff; font-size: 1.05rem; font-weight: 700; }
.detail-banner-industry { font-size: 0.78rem; color: #bfdbfe; }
.detail-list { display: flex; flex-direction: column; }
.detail-section-label { font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.09em; color: #6366f1; padding: 12px 0 4px; border-top: 1px solid var(--border-main); margin-top: 8px; }
.detail-section-label:first-child { margin-top: 0; border-top: none; }
.detail-row { display: flex; align-items: flex-start; justify-content: space-between; padding: 9px 0; border-bottom: 1px dashed var(--border-main); gap: 12px; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); flex-shrink: 0; }
.detail-value { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); text-align: right; }
.detail-badge { font-size: 0.8rem; font-weight: 600; padding: 3px 10px; border-radius: 6px; background: rgba(99,102,241,0.1); color: #6366f1; border: 1px solid rgba(99,102,241,0.2); }

/* ── TOAST ── */
.toast-wrap { position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 260px; max-width: 360px; }
.toast-box { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 12px; border: 1px solid; box-shadow: 0 8px 24px rgba(0,0,0,0.12); position: relative; overflow: hidden; }
.toast-success { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
.toast-error   { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
.toast-info    { background: #f8fafc; border-color: #e2e8f0; color: #475569; }
.toast-icon { margin-top: 2px; flex-shrink: 0; }
.toast-msg { flex: 1; font-size: 0.875rem; font-weight: 500; }
.toast-close { background: none; border: none; cursor: pointer; color: inherit; opacity: 0.5; font-size: 0.8rem; }
.toast-close:hover { opacity: 1; }
.toast-progress { position: absolute; bottom: 0; left: 0; height: 3px; animation: shrink 3s linear forwards; }
.progress-success { background: #22c55e; }
.progress-error   { background: #ef4444; }
.progress-info    { background: #94a3b8; }



.btn-submission { background: #f59e0b; color: #fff; position: relative; }
.btn-submission:hover { background: #d97706; }
.submission-count { background: #fff; color: #d97706; border-radius: 999px; padding: 1px 7px; font-size: 0.72rem; font-weight: 800; margin-left: 2px; }

.submission-list { display: flex; flex-direction: column; gap: 12px; max-height: 60vh; overflow-y: auto; }
.submission-item { border: 1px solid var(--border-main); border-radius: 10px; padding: 12px 14px; }
.si-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.si-name { font-weight: 700; font-size: 0.92rem; color: var(--text-primary); }
.si-code { font-family: monospace; font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }
.si-body { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
.si-row { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--text-muted); }
.si-reject-note { display: flex; gap: 8px; margin-top: 10px; padding: 10px 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #b91c1c; font-size: 0.82rem; }
.si-reject-label { font-weight: 700; margin-bottom: 2px; }
.si-reject-text { line-height: 1.5; }
.si-pending-note { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding: 8px 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; color: #b45309; font-size: 0.8rem; }


.empty-title{
    margin-top:12px;
    margin-bottom:6px;
    font-size:20px;
    font-weight:700;
    color:var(--text-primary);
}

.empty-text{
    max-width:420px;
    text-align:center;
    color:var(--text-muted);
    line-height:1.6;
}

@keyframes shrink { from { width: 100%; } to { width: 0%; } }
.toast-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from { opacity: 0; transform: translateY(-16px) scale(0.95); }
.toast-leave-to { opacity: 0; transform: translateY(-8px) scale(0.97); }

@media (max-width: 768px) {
  /* ── BREADCRUMB ── */
  .breadcrumb-card { padding: 12px 14px; }
  .breadcrumb-title { font-size: 1rem; }

  /* ── TOOLBAR TOP ── */
  .toolbar-top { flex-direction: column; align-items: stretch; padding: 10px 12px; }
  .toolbar-left { width: 100%; }
  .toolbar-left .drop-wrap { flex: 1; }
  .toolbar-left .btn-toolbar { width: 100%; justify-content: center; }
  .toolbar-top > .btn-orange { width: 100%; justify-content: center; }
  .drop-menu { left: 0; right: 0; min-width: 0; }

  /* ── CONTROLS ROW ── */
  .controls-card { padding: 12px; }
  .controls-row { flex-direction: column; align-items: stretch; gap: 10px; }
  .controls-left, .controls-right { width: 100%; justify-content: flex-start; }
  .controls-left { flex-wrap: wrap; }
  .showing-wrap { flex: 1 1 auto; }
  .view-toggle { flex: 1 1 auto; }
  .view-toggle-btn { flex: 1; justify-content: center; }
  .controls-left > .btn-toolbar { width: 100%; justify-content: center; order: 3; }
  .search-wrap { width: 100%; }
  .search-input { width: 100%; }
  .sort-wrap { width: 100%; }
  .sort-wrap .drop-wrap { flex: 1; }
  .sort-wrap .btn-select { width: 100%; justify-content: space-between; }
}

@media (max-width: 576px) {
  .customer-grid { grid-template-columns: 1fr; padding: 10px; gap: 10px; }

  /* ── CARD: cegah nama & status badge bertabrakan ── */
  .customer-card { padding: 12px; gap: 8px; }
  .cc-avatar { width: 38px; height: 38px; font-size: 0.78rem; }
  .cc-name { white-space: normal; overflow: visible; text-overflow: unset; line-height: 1.3; font-size: 0.88rem; }
  .cc-status { flex-basis: auto; margin-left: 48px; }
  .cc-break { display: block; flex-basis: 100%; width: 0; height: 0; }
  .cc-row { white-space: normal; }
  .act-btn { width: 34px; height: 34px; }

  .pagination-card { flex-direction: column; padding: 12px; gap: 12px; }
  .pagination-nav { width: 100%; justify-content: space-between; }
  .btn-prev-next { flex: 1; max-width: 48%; padding: 10px 14px; }
  .page-badges { width: 100%; justify-content: center; flex-wrap: wrap; }
  .page-badge { flex: 1; text-align: center; font-size: 0.7rem; }
  .form-row-2 { grid-template-columns: 1fr; }

  /* ── MODAL FOOTER: tombol full width bertumpuk ── */
  .btn-cancel, .btn-save { width: 100%; justify-content: center; }
}
</style>