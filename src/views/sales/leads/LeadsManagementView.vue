<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import AppModal from '@/components/AppModal.vue'
import { useConfirm } from '@/composables/useConfirm'
import { masterLeadsStore } from '@/stores/leadsStore'
import { usePermissionStore } from '@/stores/permissionStore'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'


// ── STORE ──
const leadsStore = masterLeadsStore()
const {
  leadsData, loadingLeads, searchLeads,
  pagination, sort, mode,
  savingLeads, updatingLeads, deletingLeads, errorLeads,
  leadsDetail, loadingDetail,
  industrySelectData, categorySelectData,
} = storeToRefs(leadsStore)

// ── CONFIRM COMPOSABLE ──
const { confirm } = useConfirm()
const permission      = usePermissionStore()
const route           = useRoute()

// ── DROPDOWN TOGGLES (UI only) ──
const showExportMenu  = ref(false)
const showImportMenu  = ref(false)
const showPerPageMenu = ref(false)
const showSortByMenu  = ref(false)
const showSortDirMenu = ref(false)

// ── PERMISSIONS ────────────────────────────
const currentUrl = computed(() => route.path.replace('/app', ''))
const canCreate  = computed(() => permission.canCreate(currentUrl.value))
const canUpdate  = computed(() => permission.canUpdate(currentUrl.value))
const canDelete  = computed(() => permission.canDelete(currentUrl.value))
const canView    = computed(() => permission.canView(currentUrl.value))

const sortByOptions = [
  { label: 'Created Date', value: 'created_at'   },
  { label: 'Company Name', value: 'company_name'  },
  { label: 'Contact Name', value: 'contact_name'  },
]
const sortByLabel = computed(() =>
  sortByOptions.find(o => o.value === sort.value?.column)?.label ?? 'Created Date'
)

// ── LIFECYCLE ──
onMounted(async () => {
  leadsStore.fetchleads(leadsStore.buildUrl())
  await leadsStore.fetchIndustrySelect()
  await leadsStore.fetchCategorySelect()
})

onUnmounted(() => {
  clearTimeout(toastTimer)
})

// Sync search input ke store
watch(searchLeads, (val) => leadsStore.searchWithDelay(val))

// ── EXPORT CSV ──
function exportCSV() {
  const header = 'No,Company,Contact,Email,Phone,Source,Status\n'
  const rows   = leadsData.value.map((l, i) =>
    `${i + 1},"${l.company_name}","${l.contact_name}","${l.email}","${l.phone}","${l.lead_source}","${l.lead_status}"`
  ).join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'master-leads.csv'; a.click()
  URL.revokeObjectURL(url)
  showExportMenu.value = false
}

// ── TOAST ──
const toast      = ref({ show: false, type: '', message: '' })
let   toastTimer = null

const showToast = (type, message) => {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { show: true, type, message }
  toastTimer  = setTimeout(() => { toast.value.show = false }, 3000)
}

// ── ERROR HELPER ──
function getError(field) {
  if (!errorLeads.value || typeof errorLeads.value !== 'object') return null
  return errorLeads.value[field]?.[0] ?? null
}

// ═══════════════════════════════════════════
// FORM ADD
// ═══════════════════════════════════════════
const isAddModalVisible = ref(false)
const formLoading       = ref(false)

const defaultForm = {
  company_name     : '',
  contact_name     : '',
  email            : '',
  phone            : '',
  industry_id      : '',
  lead_category_id : '',
  lead_source      : '',
  notes            : '',
  address          : '',
}
const formData = ref({ ...defaultForm })

const resetForm = () => {
  formData.value   = { ...defaultForm }
  errorLeads.value = null
}

const openAddModal  = () => { resetForm(); isAddModalVisible.value = true }
const closeAddModal = () => { isAddModalVisible.value = false; resetForm() }

const handleStore = async () => {
  formLoading.value = true
  try {
    await leadsStore.storeLeads(formData.value)
    closeAddModal()
    showToast('success', 'Leads data has been successfully saved!')
  } catch (err) {
    if (err.response?.status === 422) {
      showToast('error', 'Please check the form inputs.')
    } else {
      showToast('error', 'An error occurred, please try again.')
    }
  } finally {
    formLoading.value = false
  }
}

// ═══════════════════════════════════════════
// FORM EDIT
// ═══════════════════════════════════════════
const isEditModalVisible = ref(false)
const editId             = ref(null)
const editLoading        = ref(false)
const editData           = ref({ ...defaultForm })

const openEditModal = (lead) => {
  editId.value     = lead.id
  errorLeads.value = null
  editData.value   = {
    company_name     : lead.company_name,
    contact_name     : lead.contact_name,
    email            : lead.email,
    phone            : lead.phone,
    lead_source      : lead.lead_source,
    industry_id      : lead.industry_id      ?? '',
    lead_category_id : lead.lead_category_id ?? '',
    notes            : lead.notes   ?? '',
    address          : lead.address ?? '',
  }
  isEditModalVisible.value = true
}

const closeEditModal = () => {
  isEditModalVisible.value = false
  editId.value             = null
  errorLeads.value         = null
}

const handleUpdate = async () => {
  editLoading.value = true
  try {
    await leadsStore.updateLeads(editId.value, editData.value)
    closeEditModal()
    showToast('success', 'Leads data has been successfully updated!')
  } catch (err) {
    if (err.response?.status === 422) {
      showToast('error', 'Please check the form inputs.')
    } else {
      showToast('error', 'An error occurred, please try again.')
    }
  } finally {
    editLoading.value = false
  }
}

// ═══════════════════════════════════════════
// DETAIL
// ═══════════════════════════════════════════
const isDetailModalVisible = ref(false)

const openDetailModal = async (id) => {
  isDetailModalVisible.value = true
  await leadsStore.detailLeads(id)
}
const closeDetailModal = () => {
  isDetailModalVisible.value = false
  leadsDetail.value          = null
}

// ═══════════════════════════════════════════
// DELETE (pakai useConfirm yang sudah ada)
// ═══════════════════════════════════════════
const handleDelete = async (lead) => {
  const isConfirmed = await confirm({
    type        : 'danger',
    title       : 'Delete Leads',
    message     : `Are you sure you want to delete the leads "${lead.company_name}"?`,
    detail      : 'This action cannot be undone.',
    confirmText : 'Yes, Delete',
    cancelText  : 'Cancel',
  })

  if (!isConfirmed) return

  try {
    await leadsStore.deleteLeads(lead.id)
    showToast('success', 'Leads data has been successfully deleted!')
  } catch {
    showToast('error', 'Failed to delete leads data, please try again.')
  }
}

// ═══════════════════════════════════════════
// BULK ADD
// ═══════════════════════════════════════════
const isBulkModalVisible = ref(false)
const bulkLoading        = ref(false)
const bulkError          = ref(null)

const defaultRow = () => ({
  _key             : crypto.randomUUID(),
  company_name     : '',
  contact_name     : '',
  email            : '',
  phone            : '',
  industry_id      : '',
  lead_category_id : '',
  lead_source      : '',
  notes            : '',
  address          : '',
})

const bulkRows = ref([defaultRow()])

const addRow    = () => bulkRows.value.push(defaultRow())
const removeRow = (index) => {
  if (bulkRows.value.length > 1) bulkRows.value.splice(index, 1)
}

const resetBulk = () => {
  bulkRows.value   = [defaultRow()]
  bulkError.value  = null
  errorLeads.value = null
}

const openBulkModal  = () => { resetBulk(); isBulkModalVisible.value = true }
const closeBulkModal = () => { isBulkModalVisible.value = false; resetBulk() }

// Error per-row dari backend (format: leads.0.company_name)
const getRowError = (index, field) => {
  if (!errorLeads.value) return null
  return errorLeads.value[`leads.${index}.${field}`]?.[0] ?? null
}

const handleStoreBulk = async () => {
  bulkLoading.value = true
  bulkError.value   = null

  const hasEmpty = bulkRows.value.some(r => !r.company_name.trim())
  if (hasEmpty) {
    bulkError.value   = 'Company Name is required in all rows.'
    bulkLoading.value = false
    return
  }

  try {
    const payload = bulkRows.value.map(({ _key, ...rest }) => rest)
    await leadsStore.storeBulkLeads(payload)
    closeBulkModal()
    showToast('success', `${payload.length} leads data has been successfully saved!`)
  } catch (err) {
    if (err.response?.status === 422) {
      showToast('error', 'Please check the form inputs.')
    } else {
      bulkError.value = 'Failed to save, please try again.'
      showToast('error', 'An error occurred, please try again.')
    }
  } finally {
    bulkLoading.value = false
  }
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <!-- BREADCRUMB -->
    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="table-list" /> Leads Master
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" /> Home
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Leads Table</span>
        </div>
      </div>
    </div>

    <!-- TOOLBAR TOP -->
    <div class="toolbar-top">
      <div class="toolbar-left">

        <!-- TOGGLE MODE -->
        <div class="mode-toggle">
          <button
            class="mode-btn"
            :class="{ active: mode === 'master' }"
            @click="leadsStore.switchMode('master')"
          >
            <font-awesome-icon icon="list-ul" /> Master Leads
          </button>
          <button
            class="mode-btn"
            :class="{ active: mode === 'assigned' }"
            @click="leadsStore.switchMode('assigned')"
          >
            <font-awesome-icon icon="user-check" /> Assigned to Me
          </button>
        </div>

        <!-- EXPORT -->
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
            <button class="drop-item" @click="showExportMenu = false">
              <font-awesome-icon icon="file-excel" style="color:#16a34a" /> Export Excel
            </button>
            <button class="drop-item" @click="showExportMenu = false">
              <font-awesome-icon icon="file-pdf" style="color:#ef4444" /> Export PDF
            </button>
          </div>
        </div>

        <!-- IMPORT -->
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

      <!-- RESET -->
      <button class="btn-toolbar btn-orange" @click="leadsStore.resetFilters()">
        <font-awesome-icon icon="rotate-left" /> Reset
      </button>
    </div>

    <!-- CONTROLS -->
    <div class="controls-card">
      <div class="controls-row">
        <div class="controls-left">
          <!-- PER PAGE -->
          <div class="showing-wrap">
            <font-awesome-icon icon="list" class="text-muted-color" />
            <span class="showing-label">Showing:</span>
            <div class="drop-wrap">
              <button class="btn-select" @click="showPerPageMenu = !showPerPageMenu">
                {{ pagination.per_page }} <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showPerPageMenu }">
                <div class="drop-label">Per halaman</div>
                <div class="perpage-grid">
                  <button
                    v-for="opt in [5, 10, 25, 50, 100]" :key="opt"
                    class="perpage-opt" :class="{ active: pagination.per_page === opt }"
                    @click="pagination.per_page = opt; showPerPageMenu = false; leadsStore.changePageSize()"
                  >{{ opt }}</button>
                </div>
              </div>
            </div>
          </div>

          <!-- ADD — hanya tampil di mode master -->
          <template v-if="mode === 'master'">
            <button  v-if="canCreate" class="btn-toolbar btn-purple" @click="openAddModal">
              <font-awesome-icon icon="plus" /> Add Data
            </button>
            <button v-if="canCreate" class="btn-toolbar btn-purple" style="background:#7c3aed" @click="openBulkModal">
              <font-awesome-icon icon="layer-group" /> Add Bulk
            </button>
          </template>
        </div>

        <div class="controls-right">
          <!-- SEARCH -->
          <div class="search-wrap">
            <input
              v-model="searchLeads"
              type="text"
              placeholder="Searching...."
              class="search-input"
            />
            <button class="search-btn"><font-awesome-icon icon="magnifying-glass" /></button>
          </div>

          <!-- SORT -->
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
                  class="drop-item" :class="{ active: sort.column === opt.value }"
                  @click="leadsStore.toggleSort(opt.value); showSortByMenu = false"
                >{{ opt.label }}</button>
              </div>
            </div>
            <div class="drop-wrap">
              <button class="btn-select" @click="showSortDirMenu = !showSortDirMenu">
                {{ sort.direction === 'desc' ? 'Desc' : 'Asc' }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-right" :class="{ show: showSortDirMenu }">
                <div class="drop-label">Urutan</div>
                <button
                  v-for="opt in [{ label: 'Desc', value: 'desc' }, { label: 'Asc', value: 'asc' }]"
                  :key="opt.value"
                  class="drop-item" :class="{ active: sort.direction === opt.value }"
                  @click="sort.direction = opt.value; leadsStore.fetchleads(leadsStore.buildUrl()); showSortDirMenu = false"
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
            <th style="width:60px">No.</th>
            <th>Company Name</th>
            <th>Contact Name</th>
            <th>Email Address</th>
            <th>Contact Phone</th>
            <th>Lead Source</th>
            <th>Status Lead</th>
            <th v-if="mode === 'assigned'">Assigned By</th>
            <th>Created</th>
            <th style="width:160px; text-align:center">Actions</th>
          </tr>
        </thead>
        <tbody>

          <!-- LOADING -->
          <tr v-if="loadingLeads">
            <td :colspan="mode === 'assigned' ? 9 : 8" class="td-center">
              <div class="d-flex flex-column align-items-center gap-2">
                <div class="spinner-border text-primary" role="status" style="width:1.5rem;height:1.5rem"></div>
                <span class="text-muted" style="font-size:0.85rem">Loading data...</span>
              </div>
            </td>
          </tr>

          <!-- EMPTY -->
          <tr v-else-if="leadsData.length === 0">
            <td :colspan="mode === 'assigned' ? 9 : 8" class="td-center">
            <div class="empty-state">
                <img
                  src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif"
                  alt="No data found"
                  class="empty-img"
                />
                <div class="empty-text">No data found</div>
              </div>
            </td>
          </tr>

          <!-- DATA ROWS -->
          <tr v-else
            v-for="(lead, index) in leadsData"
            :key="lead.id"
            class="data-row"
          >
            <td class="td-no">
              {{ index + 1 + pagination.per_page * (pagination.current_page - 1) }}.
            </td>

            <!-- Company -->
            <td>
              <p class="td-name mb-0">{{ lead.company_name }}</p>
              <small class="td-muted">{{ lead.industry_name ?? '-' }}</small><br>
              <small class="td-muted">{{ lead.category_name ?? '-' }}</small>
            </td>

            <td class="td-name">{{ lead.contact_name }}</td>
            <td class="td-muted">{{ lead.email }}</td>
            <td class="td-muted">{{ lead.phone }}</td>

            <!-- Source -->
            <td>
              <span class="badge bg-secondary text-white" style="font-size:0.75rem">
                {{ lead.lead_source }}
              </span>
            </td>

            <!-- Status -->
            <td>
              <span
                class="badge text-white d-inline-flex align-items-center gap-1"
                :class="leadsStore.getStatusConfig(lead.lead_status).label"
                style="font-size:0.75rem"
              >
                <i :class="leadsStore.getStatusConfig(lead.lead_status).icon"></i>
                {{ lead.lead_status }}
              </span>
            </td>

            <!-- Assigned By (hanya mode assigned) -->
            <td v-if="mode === 'assigned'">
              <span class="td-name" style="font-size:0.82rem">{{ lead.owner_name ?? '-' }}</span><br>
              <small class="td-muted">{{ lead.assigned_name ?? '-' }}</small>
            </td>

            <!-- Created -->
            <td class="td-muted">{{ leadsStore.formatDate(lead.created_at) }}</td>

            <!-- Actions -->
            <td class="td-actions">
              <template v-if="mode === 'master'">
                <button  v-if="canUpdate" class="act-btn act-edit" title="Edit" @click="openEditModal(lead)">
                  <font-awesome-icon icon="pen" />
                </button>
                <button v-if="canDelete" class="act-btn act-delete" title="Hapus" @click="handleDelete(lead)">
                  <font-awesome-icon icon="trash-can" />
                </button>
              </template>
              <button v-if="canView" class="act-btn act-info" title="Detail" @click="openDetailModal(lead.id)">
               <font-awesome-icon icon="circle-info" />
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
          :disabled="!pagination.prev_page_url"
          @click="leadsStore.fetchleads(pagination.prev_page_url)"
        >
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button
          class="btn-prev-next"
          :disabled="!pagination.next_page_url"
          @click="leadsStore.fetchleads(pagination.next_page_url)"
        >
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">
          Hal {{ pagination.current_page }} / {{ pagination.last_page }}
        </span>
        <span class="page-badge">Total: {{ pagination.total }}</span>
      </div>
    </div>


    <!-- ═══ MODAL ADD ═══ -->
    <AppModal
      :show="isAddModalVisible"
      title="Add Leads"
      icon="plus"
      size="md"
      @close="closeAddModal"
    >
      <div class="form-container-gap">

        <div class="form-group">
          <label>Company Name <span style="color:#ef4444">*</span></label>
          <input v-model="formData.company_name" class="form-input" placeholder="PT. Example"
            :class="{ 'is-invalid': getError('company_name') }" />
          <small v-if="getError('company_name')" class="text-danger">{{ getError('company_name') }}</small>
        </div>

        <div class="row g-2">
          <div class="col-6 form-group">
            <label>Contact Name <span style="color:#ef4444">*</span></label>
            <input v-model="formData.contact_name" class="form-input" placeholder="John Doe"
              :class="{ 'is-invalid': getError('contact_name') }" />
            <small v-if="getError('contact_name')" class="text-danger">{{ getError('contact_name') }}</small>
          </div>
          <div class="col-6 form-group">
            <label>Phone <span style="color:#ef4444">*</span></label>
            <input v-model="formData.phone" class="form-input" placeholder="08xxxxxxxxxx"
              :class="{ 'is-invalid': getError('phone') }" />
            <small v-if="getError('phone')" class="text-danger">{{ getError('phone') }}</small>
          </div>
        </div>

        <div class="form-group">
          <label>Email <span style="color:#ef4444">*</span></label>
          <input v-model="formData.email" type="email" class="form-input" placeholder="email@example.com"
            :class="{ 'is-invalid': getError('email') }" />
          <small v-if="getError('email')" class="text-danger">{{ getError('email') }}</small>
        </div>

        <div class="row g-2">
          <div class="col-6 form-group">
            <label>Industry</label>
            <select v-model="formData.industry_id" class="form-input form-select"
              :class="{ 'is-invalid': getError('industry_id') }">
              <option value="">-- Select Industry --</option>
              <option v-for="ind in industrySelectData" :key="ind.id" :value="ind.id">{{ ind.name }}</option>
            </select>
            <small v-if="getError('industry_id')" class="text-danger">{{ getError('industry_id') }}</small>
          </div>
          <div class="col-6 form-group">
            <label>Category</label>
            <select v-model="formData.lead_category_id" class="form-input form-select"
              :class="{ 'is-invalid': getError('lead_category_id') }">
              <option value="">-- Select Category --</option>
              <option v-for="cat in categorySelectData" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
            <small v-if="getError('lead_category_id')" class="text-danger">{{ getError('lead_category_id') }}</small>
          </div>
        </div>

        <div class="form-group">
          <label>Lead Source <span style="color:#ef4444">*</span></label>
          <div class="segment-group">
            <button
              v-for="src in leadsStore.leadSourceOptions" :key="src.value"
              type="button"
              class="segment-btn"
              :class="{ active: formData.lead_source === src.value }"
              @click="formData.lead_source = src.value"
            >{{ src.label }}</button>
          </div>
          <small v-if="getError('lead_source')" class="text-danger">{{ getError('lead_source') }}</small>
        </div>

        <div class="form-group">
          <label>Address</label>
          <textarea v-model="formData.address" class="form-input form-textarea" rows="2" placeholder="Alamat lengkap..."></textarea>
        </div>

        <div class="form-group">
          <label>Notes</label>
          <textarea v-model="formData.notes" class="form-input form-textarea" rows="2" placeholder="Catatan tambahan..."></textarea>
        </div>

      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeAddModal">Cancel</button>
        <button class="btn-save" :disabled="formLoading" @click="handleStore">
          <span v-if="formLoading" class="spinner-border spinner-border-sm me-1"></span>
          <font-awesome-icon v-else icon="check" />
          {{ formLoading ? 'Saving...' : 'Save Data' }}
        </button>
      </template>
    </AppModal>


    <!-- ═══ MODAL EDIT ═══ -->
    <AppModal
      :show="isEditModalVisible"
      title="Edit Leads"
      icon="pen"
      size="md"
      @close="closeEditModal"
    >
      <div class="form-container-gap">

        <div class="form-group">
          <label>Company Name <span style="color:#ef4444">*</span></label>
          <input v-model="editData.company_name" class="form-input" placeholder="PT. Example"
            :class="{ 'is-invalid': getError('company_name') }" />
          <small v-if="getError('company_name')" class="text-danger">{{ getError('company_name') }}</small>
        </div>

        <div class="row g-2">
          <div class="col-6 form-group">
            <label>Contact Name <span style="color:#ef4444">*</span></label>
            <input v-model="editData.contact_name" class="form-input" placeholder="John Doe"
              :class="{ 'is-invalid': getError('contact_name') }" />
            <small v-if="getError('contact_name')" class="text-danger">{{ getError('contact_name') }}</small>
          </div>
          <div class="col-6 form-group">
            <label>Phone <span style="color:#ef4444">*</span></label>
            <input v-model="editData.phone" class="form-input" placeholder="08xxxxxxxxxx"
              :class="{ 'is-invalid': getError('phone') }" />
            <small v-if="getError('phone')" class="text-danger">{{ getError('phone') }}</small>
          </div>
        </div>

        <div class="form-group">
          <label>Email <span style="color:#ef4444">*</span></label>
          <input v-model="editData.email" type="email" class="form-input" placeholder="email@example.com"
            :class="{ 'is-invalid': getError('email') }" />
          <small v-if="getError('email')" class="text-danger">{{ getError('email') }}</small>
        </div>

        <div class="row g-2">
          <div class="col-6 form-group">
            <label>Industry</label>
            <select v-model="editData.industry_id" class="form-input form-select"
              :class="{ 'is-invalid': getError('industry_id') }">
              <option value="">-- Select Industry --</option>
              <option v-for="ind in industrySelectData" :key="ind.id" :value="ind.id">{{ ind.name }}</option>
            </select>
            <small v-if="getError('industry_id')" class="text-danger">{{ getError('industry_id') }}</small>
          </div>
          <div class="col-6 form-group">
            <label>Category</label>
            <select v-model="editData.lead_category_id" class="form-input form-select"
              :class="{ 'is-invalid': getError('lead_category_id') }">
              <option value="">-- Select Category --</option>
              <option v-for="cat in categorySelectData" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
            <small v-if="getError('lead_category_id')" class="text-danger">{{ getError('lead_category_id') }}</small>
          </div>
        </div>

        <div class="form-group">
          <label>Lead Source <span style="color:#ef4444">*</span></label>
          <div class="segment-group">
            <button
              v-for="src in leadsStore.leadSourceOptions" :key="src.value"
              type="button"
              class="segment-btn"
              :class="{ active: editData.lead_source === src.value }"
              @click="editData.lead_source = src.value"
            >{{ src.label }}</button>
          </div>
          <small v-if="getError('lead_source')" class="text-danger">{{ getError('lead_source') }}</small>
        </div>

        <div class="form-group">
          <label>Address</label>
          <textarea v-model="editData.address" class="form-input form-textarea" rows="2"></textarea>
        </div>

        <div class="form-group">
          <label>Notes</label>
          <textarea v-model="editData.notes" class="form-input form-textarea" rows="2"></textarea>
        </div>

      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeEditModal">Cancel</button>
        <button class="btn-save" style="background:#f59e0b" :disabled="editLoading" @click="handleUpdate">
          <span v-if="editLoading" class="spinner-border spinner-border-sm me-1"></span>
          <font-awesome-icon v-else icon="floppy-disk" />
          {{ editLoading ? 'Saving...' : 'Update' }}
        </button>
      </template>
    </AppModal>


    <!-- ═══ MODAL DETAIL ═══ -->
    <AppModal
      :show="isDetailModalVisible"
      title="Lead Detail"
      icon="circle-info"
      size="md"
      @close="closeDetailModal"
    >
      <!-- Loading state -->
      <div v-if="loadingDetail" class="d-flex flex-column align-items-center gap-2 py-4">
        <div class="spinner-border text-primary" role="status"></div>
        <span class="text-muted" style="font-size:0.85rem">Memuat detail...</span>
      </div>

      <div v-else-if="leadsDetail" class="detail-list">
        <div class="detail-row">
          <span class="detail-label">Company</span>
          <span class="detail-badge">{{ leadsDetail.company_name }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Contact</span>
          <span class="detail-value">{{ leadsDetail.contact_name }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email</span>
          <span class="detail-value">{{ leadsDetail.email ?? '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Phone</span>
          <span class="detail-value">{{ leadsDetail.phone ?? '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Industry</span>
          <span class="detail-value">{{ leadsDetail.industry_name ?? '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Category</span>
          <span class="detail-value">{{ leadsDetail.category_name ?? '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Source</span>
          <span class="badge bg-secondary text-white">{{ leadsDetail.lead_source }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status</span>
          <span
            class="badge text-white"
            :class="leadsStore.getStatusConfig(leadsDetail.lead_status).label"
          >{{ leadsDetail.lead_status }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Address</span>
          <span class="detail-value">{{ leadsDetail.address ?? '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Notes</span>
          <span class="detail-value">{{ leadsDetail.notes ?? '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Created</span>
          <span class="detail-value">{{ leadsStore.formatDate(leadsDetail.created_at) }}</span>
        </div>
      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeDetailModal">Close</button>
      </template>
    </AppModal>


    <!-- ═══ MODAL BULK ADD ═══ -->
    <AppModal
      :show="isBulkModalVisible"
      title="Add Bulk Leads"
      icon="layer-group"
      size="lg"
      @close="closeBulkModal"
    >
      <div class="form-container-gap">

        <!-- Error global -->
        <div v-if="bulkError" class="alert alert-danger py-2 mb-0" style="font-size:0.85rem">
          <font-awesome-icon icon="triangle-exclamation" /> {{ bulkError }}
        </div>

        <div class="d-flex justify-content-between align-items-center">
          <span class="text-muted" style="font-size:0.82rem">Isi minimal 1 baris data.</span>
          <button type="button" class="btn-toolbar btn-purple" @click="addRow">
            <font-awesome-icon icon="plus" /> Add Row
          </button>
        </div>

        <!-- Rows -->
        <div v-for="(row, index) in bulkRows" :key="row._key"
          class="bulk-row-card"
        >
          <!-- Row header -->
          <div class="bulk-row-header">
            <span class="bulk-row-num">{{ index + 1 }}</span>
            <span class="td-muted" style="font-size:0.82rem">{{ row.company_name || 'New leads...' }}</span>
            <button type="button" class="act-btn act-delete ms-auto"
              :disabled="bulkRows.length === 1"
              :style="bulkRows.length === 1 ? 'opacity:0.3;cursor:not-allowed' : ''"
              @click="removeRow(index)"
            >
              <font-awesome-icon icon="trash-can" />
            </button>
          </div>

          <!-- Fields -->
          <div class="p-3">
            <div class="row g-2">

              <div class="col-12 form-group">
                <label>Company Name <span style="color:#ef4444">*</span></label>
                <input v-model="row.company_name" class="form-input" placeholder="PT. Example"
                  :class="{ 'is-invalid': getRowError(index, 'company_name') }" />
                <small v-if="getRowError(index, 'company_name')" class="text-danger">{{ getRowError(index, 'company_name') }}</small>
              </div>

              <div class="col-6 form-group">
                <label>Contact Name</label>
                <input v-model="row.contact_name" class="form-input" placeholder="John Doe" />
              </div>

              <div class="col-6 form-group">
                <label>Phone</label>
                <input v-model="row.phone" class="form-input" placeholder="08xxxxxxxxxx" />
              </div>

              <div class="col-12 form-group">
                <label>Email</label>
                <input v-model="row.email" type="email" class="form-input" placeholder="email@example.com"
                  :class="{ 'is-invalid': getRowError(index, 'email') }" />
                <small v-if="getRowError(index, 'email')" class="text-danger">{{ getRowError(index, 'email') }}</small>
              </div>

              <div class="col-6 form-group">
                <label>Industry</label>
                <select v-model="row.industry_id" class="form-input form-select">
                  <option value="">-- Select Industry --</option>
                  <option v-for="ind in industrySelectData" :key="ind.id" :value="ind.id">{{ ind.name }}</option>
                </select>
              </div>

              <div class="col-6 form-group">
                <label>Category</label>
                <select v-model="row.lead_category_id" class="form-input form-select">
                  <option value="">-- Select Category --</option>
                  <option v-for="cat in categorySelectData" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
              </div>

              <div class="col-12 form-group">
                <label>Lead Source</label>
                <div class="segment-group">
                  <button
                    v-for="src in leadsStore.leadSourceOptions" :key="src.value"
                    type="button" class="segment-btn"
                    :class="{ active: row.lead_source === src.value }"
                    @click="row.lead_source = src.value"
                  >{{ src.label }}</button>
                </div>
              </div>

              <div class="col-12 form-group">
                <label>Address</label>
                <textarea v-model="row.address" class="form-input form-textarea" rows="1" placeholder="Alamat..."></textarea>
              </div>

              <div class="col-12 form-group">
                <label>Notes</label>
                <textarea v-model="row.notes" class="form-input form-textarea" rows="1" placeholder="Catatan..."></textarea>
              </div>

            </div>
          </div>
        </div>

      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeBulkModal">Cancel</button>
        <button class="btn-save" style="background:#7c3aed" :disabled="bulkLoading" @click="handleStoreBulk">
          <span v-if="bulkLoading" class="spinner-border spinner-border-sm me-1"></span>
          <font-awesome-icon v-else icon="floppy-disk" />
          {{ bulkLoading ? `Saving ${bulkRows.length} data...` : `Save ${bulkRows.length} Data` }}
        </button>
      </template>
    </AppModal>


    <!-- ═══ TOAST ═══ -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toast.show" class="toast-wrapper">
          <div class="toast-box" :class="`toast-${toast.type}`">
            <i :class="{
              'fa-solid fa-circle-check'  : toast.type === 'success',
              'fa-solid fa-circle-xmark'  : toast.type === 'error',
              'fa-solid fa-circle-info'   : toast.type === 'info',
            }"></i>
            <span>{{ toast.message }}</span>
            <button @click="toast.show = false" class="toast-close">✕</button>
            <div class="toast-bar" :class="`toast-bar-${toast.type}`"></div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
/* Sistem Warna & Wrapper Global */
.h-100 {
  --text-muted: #64748b;
  --primary-color: #6366f1;
}

.form-container-gap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ===== BREADCRUMB ===== */
.breadcrumb-card {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 16px 18px;
  box-shadow: 0 1px 3px var(--shadow-color);
}
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

/* ===== MODE TOGGLE ===== */
.mode-toggle {
  display: flex;
  gap: 2px;
  background: var(--bg-input);
  border: 1px solid var(--border-main);
  border-radius: 8px;
  padding: 3px;
}
.mode-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  color: var(--text-muted);
  transition: all 0.18s;
}
.mode-btn.active { background: #6366f1; color: #fff; }
.mode-btn:not(.active):hover { background: rgba(99,102,241,0.08); color: #6366f1; }

/* ===== TOOLBAR TOP ===== */
.toolbar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-card);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px var(--shadow-color);
  flex-wrap: wrap;
  gap: 8px;
}
.toolbar-left { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.btn-toolbar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: none;
  border-radius: 8px;
  font-size: 0.83rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}
.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover { background: #4f46e5; }
.btn-orange { background: #f59e0b; color: #fff; }
.btn-orange:hover { background: #d97706; }
.btn-arrow { font-size: 0.6rem; opacity: 0.7; }

/* ===== CONTROLS ===== */
.controls-card {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px var(--shadow-color);
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
.sort-wrap { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.empty-img   { width: 160px; opacity: 0.85; border-radius: 8px; }
.empty-text  { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
/* ===== DROPDOWN ===== */
.drop-wrap { position: relative; }
.btn-select {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  background: var(--bg-input);
  color: var(--text-primary);
  border: 1px solid var(--border-main);
  border-radius: 7px;
  font-size: 0.83rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.btn-select:hover { border-color: #6366f1; color: #6366f1; }
.drop-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 160px;
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 10px;
  z-index: 200;
  opacity: 0;
  transform: translateY(-6px);
  pointer-events: none;
  transition: all 0.18s ease;
}
.drop-right { left: auto; right: 0; }
.drop-menu.show { opacity: 1; transform: translateY(0); pointer-events: all; }
.drop-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; padding: 0 4px; }
.drop-item { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: none; border: none; border-radius: 7px; color: var(--text-primary); font-size: 0.84rem; cursor: pointer; text-align: left; }
.drop-item:hover { background: var(--bg-nav-hover); }
.drop-item.active { color: #6366f1; font-weight: 600; background: rgba(99,102,241,0.08); }
.perpage-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.perpage-opt { padding: 5px 10px; border: 1px solid var(--border-main); border-radius: 6px; background: var(--bg-input); color: var(--text-primary); font-size: 0.82rem; cursor: pointer; }
.perpage-opt.active { background: #6366f1; border-color: #6366f1; color: #fff; font-weight: 700; }

/* ===== DATA TABLE ===== */
.table-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.data-table thead tr { background: var(--bg-input); border-bottom: 2px solid var(--border-main); position: sticky; top: 0; z-index: 2; }
.data-table th { padding: 12px 18px; text-align: left; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap; }
.data-table tbody tr { border-bottom: 1px solid var(--border-main); transition: background 0.15s; }
.data-row:hover { background: var(--bg-nav-hover); }
.data-table td { padding: 12px 18px; vertical-align: middle; color: var(--text-primary); }
.td-no { color: var(--text-muted); font-weight: 600; font-size: 0.85rem; }
.td-name { font-weight: 500; }
.td-muted { color: var(--text-muted); font-size: 0.82rem; }
.td-center { text-align: center; padding: 40px; }
.td-actions { text-align: center; white-space: nowrap; }

/* ACTION BUTTONS */
.act-btn { width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s ease; margin: 0 2px; background: transparent; }
.act-edit   { color: #f59e0b; border-color: #f59e0b; }
.act-edit:hover   { background: #f59e0b; color: #fff; }
.act-delete { color: #ef4444; border-color: #ef4444; }
.act-delete:hover { background: #ef4444; color: #fff; }
.act-info   { color: #6366f1; border-color: #6366f1; }
.act-info:hover   { background: #6366f1; color: #fff; }

/* ===== PAGINATION ===== */
.pagination-card {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 14px 18px;
  box-shadow: 0 1px 3px var(--shadow-color);
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.pagination-nav { display: flex; align-items: center; gap: 8px; }
.btn-prev-next {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  min-width: 85px;
  justify-content: center;
  transition: background 0.18s;
}
.btn-prev-next:hover:not(:disabled) { background: #4f46e5; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badges { display: flex; gap: 8px; }
.page-badge { padding: 7px 14px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); background: var(--bg-input); white-space: nowrap; }

/* ===== FORM ===== */
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.form-input { padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.875rem; background: var(--bg-input); color: var(--text-primary); outline: none; transition: border 0.18s; width: 100%; box-sizing: border-box; }
.form-input:focus { border-color: #6366f1; }
.form-textarea { resize: none; line-height: 1.5; }
.form-select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 12px center; background-size: 1.25rem; padding-right: 40px; }

/* MODAL BUTTONS */
.btn-cancel { padding: 8px 18px; background: var(--bg-main, #f1f5f9); color: var(--text-muted); border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { background: var(--border-main); color: var(--text-primary); }
.btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.18s; }
.btn-save:hover:not(:disabled) { filter: brightness(0.9); }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

/* DETAIL MODAL */
.detail-list { display: flex; flex-direction: column; }
.detail-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-main); gap: 12px; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.detail-value { font-size: 0.85rem; color: var(--text-primary); }
.detail-badge { font-size: 0.82rem; font-weight: 600; padding: 3px 12px; border-radius: 6px; background: rgba(99,102,241,0.1); color: #6366f1; border: 1px solid rgba(99,102,241,0.2); }

/* BULK ROWS */
.bulk-row-card { border: 1px solid var(--border-main); border-radius: 10px; overflow: hidden; }
.bulk-row-header { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--bg-input); border-bottom: 1px solid var(--border-main); }
.bulk-row-num { width: 24px; height: 24px; border-radius: 6px; background: #7c3aed; color: #fff; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

/* SEGMENT */
.segment-group { display: flex; align-items: center; border: 1px solid var(--border-main); border-radius: 50px; padding: 3px; background: var(--bg-input); overflow-x: auto; scrollbar-width: none; }
.segment-group::-webkit-scrollbar { display: none; }
.segment-btn { flex: 1; text-align: center; border: none; background: transparent; padding: 8px 14px; color: var(--text-primary); font-size: 0.82rem; font-weight: 600; cursor: pointer; border-radius: 50px; transition: all 0.18s; white-space: nowrap; }
.segment-btn.active { background: #6366f1; color: #fff; }
.segment-btn:not(.active):hover { background: rgba(99,102,241,0.08); color: #6366f1; }

/* TOAST */
.toast-wrapper { position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 260px; }
.toast-box { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 12px; border: 1px solid; font-size: 0.85rem; font-weight: 500; position: relative; overflow: hidden; }
.toast-success { background: #f0fdf4; border-color: #bbf7d0; color: #16a34a; }
.toast-error   { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
.toast-info    { background: #f0f9ff; border-color: #bae6fd; color: #0284c7; }
.toast-close { background: none; border: none; cursor: pointer; color: inherit; opacity: 0.6; margin-left: auto; font-size: 0.75rem; }
.toast-bar { position: absolute; bottom: 0; left: 0; height: 3px; animation: shrink 3s linear forwards; }
.toast-bar-success { background: #16a34a; }
.toast-bar-error   { background: #dc2626; }
.toast-bar-info    { background: #0284c7; }

@keyframes shrink { from { width: 100%; } to { width: 0%; } }
.toast-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-12px) scale(0.96); }

@media (max-width: 576px) {
  .pagination-card { flex-direction: column; padding: 12px; }
  .pagination-nav { width: 100%; justify-content: space-between; }
  .btn-prev-next { flex: 1; max-width: 48%; }
  .page-badges { width: 100%; justify-content: center; flex-wrap: wrap; }
}
</style>