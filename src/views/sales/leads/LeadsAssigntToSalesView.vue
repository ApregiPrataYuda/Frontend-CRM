<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import AppModal from '@/components/AppModal.vue'
import { useConfirm } from '@/composables/useConfirm'
import { leadAssignStore } from '@/stores/leadAssignStore'
import { usePermissionStore } from '@/stores/permissionStore'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'

const { confirm } = useConfirm()
const store      = leadAssignStore()
const permission = usePermissionStore()
const route      = useRoute()
const toast      = useToast()

// ── PERMISSIONS ──
const currentUrl = computed(() => route.path.replace('/app', ''))
const canCreate  = computed(() => permission.canCreate(currentUrl.value))
const canUpdate  = computed(() => permission.canUpdate(currentUrl.value))
const canDelete  = computed(() => permission.canDelete(currentUrl.value))
const canView    = computed(() => permission.canView(currentUrl.value))

// ── FETCH AWAL ──
onMounted(async () => {
  store.fetchLeads(store.buildUrl())
  await store.fetchSalesSelect()
  await store.fetchIndustrySelect()
  await store.fetchCategorySelect()
})

// ── TOOLBAR STATE ──
const showExportMenu  = ref(false)
const showImportMenu  = ref(false)
const showPerPageMenu = ref(false)
const showSortByMenu  = ref(false)
const showSortDirMenu = ref(false)

const sortByOptions = [
  { label: 'Created Date', value: 'created_at'   },
  { label: 'Company Name', value: 'company_name' },
]
const sortByLabel = computed(() =>
  sortByOptions.find(o => o.value === store.sort.column)?.label ?? 'Created Date'
)

function handleReset() { store.resetFilters() }

// ── SEARCH watch ──
watch(() => store.searchLeads, store.searchWithDelay)

// ═══════════════════════════════════════
// FORM ADD / EDIT
// ═══════════════════════════════════════
const isAddModalVisible = ref(false)
const isEditMode        = ref(false)
const editId            = ref(null)
const formLoading       = ref(false)

const defaultForm = {
  company_name     : '',
  contact_name     : '',
  email            : '',
  phone            : '',
  industry_id      : '',
  lead_category_id : '',
  lead_source      : '',
  lead_status      : 'New',
  assigned_to      : '',
  visibility_type  : 'PUBLIC',
  notes            : '',
  address          : '',
}
const formData = ref({ ...defaultForm })

// ── Form: Select Sales ──
const isOpenFormSales    = ref(false)
const searchFormSales    = ref('')
const selectedFormSales  = ref(null)
const formSalesRef       = ref(null)

const filteredFormSales = computed(() => {
  if (!store.salesSelectData) return []
  if (!searchFormSales.value) return store.salesSelectData
  return store.salesSelectData.filter(u =>
    u.name?.toLowerCase().includes(searchFormSales.value.toLowerCase())
  )
})
function toggleFormSalesDropdown() {
  isOpenFormSales.value = !isOpenFormSales.value
  if (!isOpenFormSales.value) searchFormSales.value = ''
}
function selectFormSales(user) {
  selectedFormSales.value    = user
  formData.value.assigned_to = user.id_user
  isOpenFormSales.value      = false
  searchFormSales.value      = ''
}
function clearFormSales() {
  selectedFormSales.value    = null
  formData.value.assigned_to = ''
}
function handleFormSalesClickOutside(e) {
  if (formSalesRef.value && !formSalesRef.value.contains(e.target)) {
    isOpenFormSales.value = false
    searchFormSales.value = ''
  }
}

// ── Form: Select Industry ──
const isOpenFormIndustry   = ref(false)
const searchFormIndustry   = ref('')
const selectedFormIndustry = ref(null)
const formIndustryRef      = ref(null)

const filteredFormIndustry = computed(() => {
  if (!store.industrySelectData) return []
  if (!searchFormIndustry.value) return store.industrySelectData
  return store.industrySelectData.filter(o =>
    o.name?.toLowerCase().includes(searchFormIndustry.value.toLowerCase())
  )
})
function toggleFormIndustryDropdown() {
  isOpenFormIndustry.value = !isOpenFormIndustry.value
  if (!isOpenFormIndustry.value) searchFormIndustry.value = ''
}
function selectFormIndustry(ind) {
  selectedFormIndustry.value = ind
  formData.value.industry_id = ind.id
  isOpenFormIndustry.value   = false
  searchFormIndustry.value   = ''
}
function clearFormIndustry() {
  selectedFormIndustry.value = null
  formData.value.industry_id = ''
}
function handleFormIndustryClickOutside(e) {
  if (formIndustryRef.value && !formIndustryRef.value.contains(e.target)) {
    isOpenFormIndustry.value = false
    searchFormIndustry.value = ''
  }
}

// ── Form: Select Category ──
const isOpenFormCategory   = ref(false)
const searchFormCategory   = ref('')
const selectedFormCategory = ref(null)
const formCategoryRef      = ref(null)

const filteredFormCategory = computed(() => {
  if (!store.categorySelectData) return []
  if (!searchFormCategory.value) return store.categorySelectData
  return store.categorySelectData.filter(o =>
    o.name?.toLowerCase().includes(searchFormCategory.value.toLowerCase())
  )
})
function toggleFormCategoryDropdown() {
  isOpenFormCategory.value = !isOpenFormCategory.value
  if (!isOpenFormCategory.value) searchFormCategory.value = ''
}
function selectFormCategory(cat) {
  selectedFormCategory.value      = cat
  formData.value.lead_category_id = cat.id
  isOpenFormCategory.value        = false
  searchFormCategory.value        = ''
}
function clearFormCategory() {
  selectedFormCategory.value      = null
  formData.value.lead_category_id = ''
}
function handleFormCategoryClickOutside(e) {
  if (formCategoryRef.value && !formCategoryRef.value.contains(e.target)) {
    isOpenFormCategory.value = false
    searchFormCategory.value = ''
  }
}

// ── click outside listeners ──
onMounted(() => {
  document.addEventListener('click', handleFormSalesClickOutside)
  document.addEventListener('click', handleFormIndustryClickOutside)
  document.addEventListener('click', handleFormCategoryClickOutside)
  document.addEventListener('click', handleAssignSalesClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', handleFormSalesClickOutside)
  document.removeEventListener('click', handleFormIndustryClickOutside)
  document.removeEventListener('click', handleFormCategoryClickOutside)
  document.removeEventListener('click', handleAssignSalesClickOutside)
})

// ── error helper ──
function getError(field) {
  if (!store.errorForm || typeof store.errorForm !== 'object') return null
  return store.errorForm[field]?.[0] ?? null
}

function resetForm() {
  formData.value             = { ...defaultForm }
  store.errorForm            = null
  selectedFormSales.value    = null
  selectedFormIndustry.value = null
  selectedFormCategory.value = null
  isEditMode.value           = false
  editId.value               = null
}

function openAddModal() {
  resetForm()
  isAddModalVisible.value = true
}

function closeAddModal() {
  isAddModalVisible.value = false
  resetForm()
}

function openEditModal(lead) {
  isEditMode.value = true
  editId.value     = lead.id

  formData.value = {
    company_name     : lead.company_name     ?? '',
    contact_name     : lead.contact_name     ?? '',
    email            : lead.email            ?? '',
    phone            : lead.phone            ?? '',
    industry_id      : lead.industry_id      ?? '',
    lead_category_id : lead.lead_category_id ?? '',
    lead_source      : lead.lead_source      ?? '',
    lead_status      : lead.lead_status      ?? 'New',
    assigned_to      : lead.assigned_to      ?? '',
    visibility_type  : lead.visibility_type  ?? 'PUBLIC',
    notes            : lead.notes            ?? '',
    address          : lead.address          ?? '',
  }

  selectedFormIndustry.value =
    store.industrySelectData.find(i => i.id === lead.industry_id) || null
  selectedFormCategory.value =
    store.categorySelectData.find(c => c.id === lead.lead_category_id) || null
  selectedFormSales.value =
    store.salesSelectData.find(s => s.id_user === lead.assigned_to) || null

  isAddModalVisible.value = true
}

async function handleStore() {
  formLoading.value = true
  try {
    if (isEditMode.value) {
      await store.updateLead(editId.value, formData.value)
      toast.success('Lead berhasil diupdate!')
    } else {
      await store.storeLeadWithAssign(formData.value)
      toast.success('Lead berhasil ditambahkan & di-assign!')
    }
    closeAddModal()
  } catch (err) {
    if (err.response?.status === 422) {
      toast.error('Periksa kembali isian form.')
    } else {
      toast.error('Terjadi kesalahan, coba lagi.')
    }
  } finally {
    formLoading.value = false
  }
}

// ═══════════════════════════════════════
// MODAL ASSIGN (existing lead)
// ═══════════════════════════════════════
const showAssignModal  = ref(false)
const assignTargetLead = ref(null)
const assignLoading    = ref(false)
const assignVisibility = ref('PUBLIC')

const isOpenAssignSales   = ref(false)
const searchAssignSales   = ref('')
const selectedAssignSales = ref(null)
const assignSalesRef      = ref(null)

const filteredAssignSales = computed(() => {
  if (!store.salesSelectData) return []
  if (!searchAssignSales.value) return store.salesSelectData
  return store.salesSelectData.filter(u =>
    u.name?.toLowerCase().includes(searchAssignSales.value.toLowerCase())
  )
})
function toggleAssignSalesDropdown() {
  isOpenAssignSales.value = !isOpenAssignSales.value
  if (!isOpenAssignSales.value) searchAssignSales.value = ''
}
function selectAssignSales(user) {
  selectedAssignSales.value = user
  isOpenAssignSales.value   = false
  searchAssignSales.value   = ''
}
function clearAssignSales() { selectedAssignSales.value = null }
function handleAssignSalesClickOutside(e) {
  if (assignSalesRef.value && !assignSalesRef.value.contains(e.target)) {
    isOpenAssignSales.value = false
    searchAssignSales.value = ''
  }
}

function openAssignModal(lead) {
  assignTargetLead.value = lead
  assignVisibility.value = 'PUBLIC'
  selectedAssignSales.value = lead.assigned_to
    ? (store.salesSelectData ?? []).find(u => String(u.id_user) === String(lead.assigned_to)) ?? null
    : null
  showAssignModal.value = true
}
function closeAssignModal() {
  showAssignModal.value  = false
  assignTargetLead.value = null
  selectedAssignSales.value = null
  searchAssignSales.value   = ''
  assignVisibility.value    = 'PUBLIC'
}

async function handleAssign() {
  if (!selectedAssignSales.value) {
    toast.error('Pilih sales terlebih dahulu.')
    return
  }
  assignLoading.value = true
  const salesName = selectedAssignSales.value.name
  try {
    await store.assignLead(assignTargetLead.value.id, {
      assigned_to     : selectedAssignSales.value.id_user,
      visibility_type : assignVisibility.value,
    })
    closeAssignModal()
    toast.success(`Lead berhasil di-assign ke ${salesName}!`)
  } catch {
    toast.error('Gagal assign lead.')
  } finally {
    assignLoading.value = false
  }
}

// ═══════════════════════════════════════
// UNASSIGN
// ═══════════════════════════════════════
async function handleUnassign(lead) {
  const isConfirmed = await confirm({
    type        : 'danger',
    title       : 'Unassign Lead',
    message     : `Unassign lead dari "${lead.assigned_name}"?`,
    detail      : 'Lead akan kembali ke status belum di-assign.',
    confirmText : 'Yes, Unassign',
    cancelText  : 'Cancel',
  })
  if (!isConfirmed) return
  try {
    await store.unassignLead(lead.id)
    toast.success('Lead berhasil di-unassign!')
  } catch {
    toast.error('Gagal unassign, coba lagi.')
  }
}

// ═══════════════════════════════════════
// DETAIL
// ═══════════════════════════════════════
const isDetailModalVisible = ref(false)
const detailLead           = ref(null)

function openDetailModal(lead) { detailLead.value = lead; isDetailModalVisible.value = true }
function closeDetailModal()    { isDetailModalVisible.value = false; detailLead.value = null }

// ═══════════════════════════════════════
// DELETE
// ═══════════════════════════════════════
async function handleDelete(lead) {
  const isConfirmed = await confirm({
    type        : 'danger',
    title       : 'Hapus Lead',
    message     : `Yakin ingin menghapus lead "${lead.company_name}"?`,
    detail      : 'Tindakan ini tidak bisa dibatalkan.',
    confirmText : 'Yes, Delete',
    cancelText  : 'Cancel',
  })
  if (!isConfirmed) return
  try {
    await store.deleteLead(lead.id)
    toast.success('Lead berhasil dihapus!')
  } catch {
    toast.error('Gagal menghapus lead.')
  }
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <!-- BREADCRUMB -->
    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="user-plus" /> Assign Leads
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" /> Home
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Assign Leads</span>
        </div>
      </div>
    </div>

    <!-- TOOLBAR TOP -->
    <div class="toolbar-top">
      <div class="toolbar-left">
        <div class="info-badge">
          <font-awesome-icon icon="circle-info" />
          This page is for Admin / Manager only
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
                {{ store.pagination.per_page }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showPerPageMenu }">
                <div class="drop-label">Per halaman</div>
                <div class="perpage-grid">
                  <button
                    v-for="opt in [10, 25, 50, 100]" :key="opt"
                    class="perpage-opt"
                    :class="{ active: store.pagination.per_page === opt }"
                    @click="store.pagination.per_page = opt; store.changePageSize(); showPerPageMenu = false"
                  >{{ opt }}</button>
                </div>
              </div>
            </div>
          </div>
          <button v-if="canCreate" class="btn-toolbar btn-purple" @click="openAddModal">
            <font-awesome-icon icon="plus" /> Add & Assign Lead
          </button>
        </div>

        <div class="controls-right">
          <div class="search-wrap">
            <input
              v-model="store.searchLeads"
              type="text"
              placeholder="Search..."
              class="search-input"
            />
            <button class="search-btn">
              <font-awesome-icon icon="magnifying-glass" />
            </button>
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
                  class="drop-item"
                  :class="{ active: store.sort.column === opt.value }"
                  @click="store.toggleSort(opt.value); showSortByMenu = false"
                >{{ opt.label }}</button>
              </div>
            </div>
            <div class="drop-wrap">
              <button class="btn-select" @click="showSortDirMenu = !showSortDirMenu">
                {{ store.sort.direction.toUpperCase() }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-right" :class="{ show: showSortDirMenu }">
                <div class="drop-label">Urutan</div>
                <button
                  v-for="opt in ['desc', 'asc']" :key="opt"
                  class="drop-item"
                  :class="{ active: store.sort.direction === opt }"
                  @click="store.sort.direction = opt; store.fetchLeads(store.buildUrl()); showSortDirMenu = false"
                >{{ opt.toUpperCase() }}</button>
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
            <th style="width:60px">NO.</th>
            <th>Company</th>
            <th>Contact</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Source</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th style="width:180px; text-align:center">ACTIONS</th>
          </tr>
        </thead>
        <tbody>

          <!-- LOADING -->
          <tr v-if="store.loadingLeads">
            <td colspan="11" class="td-center">
              <div class="spinner-wrap">
                <div class="spinner"></div>
                <span>Loading data...</span>
              </div>
            </td>
          </tr>

          <!-- EMPTY -->
          <tr v-else-if="store.leadsData.length === 0">
            <td colspan="11" class="td-center">
              <div style="font-size:2rem; margin-bottom:8px">📭</div>
              <p>There is no leads data yet</p>
            </td>
          </tr>

          <!-- DATA ROWS -->
          <tr
            v-else
            v-for="(lead, index) in store.leadsData"
            :key="lead.id"
            class="data-row"
          >
            <td class="td-no">
              {{ index + 1 + store.pagination.per_page * (store.pagination.current_page - 1) }}.
            </td>

            <td>
              <p class="td-name">{{ lead.company_name }}</p>
              <p class="td-muted">{{ lead.industry_name ?? '-' }}</p>
            </td>

            <td class="td-name">{{ lead.contact_name }}</td>
            <td>{{ lead.email }}</td>
            <td>{{ lead.phone }}</td>


            <td>
              <span class="badge-source">{{ lead.lead_source }}</span>
            </td>

            <td>
              <span
                class="badge-status"
                :class="store.getStatusConfig(lead.lead_status).label"
              >
                <font-awesome-icon :icon="store.getStatusConfig(lead.lead_status).icon.replace('fa-solid fa-', '')" class="me-1" style="font-size:0.65rem" />
                {{ lead.lead_status }}
              </span>
            </td>

            <td>
              <div v-if="lead.assigned_name" class="assigned-badge">
                <div class="assigned-avatar">
                  <font-awesome-icon icon="user" style="font-size:0.5rem" />
                </div>
                <span>{{ lead.assigned_name }}</span>
              </div>
              <span v-else class="td-muted" style="font-style:italic">Belum di-assign</span>
            </td>

            <td class="td-actions">
              <!-- Assign / Re-assign -->
             <button
  v-if="canUpdate"
  class="act-btn act-assign"
  :title="lead.assigned_name ? 'Re-assign' : 'Assign'"
  @click="openAssignModal(lead)"
>
  <font-awesome-icon :icon="lead.assigned_name ? 'user-gear' : 'user-plus'" />
</button>
              

              <!-- Unassign -->
              <button
                v-if="canUpdate && lead.assigned_name"
                class="act-btn act-delete"
                title="Unassign"
                @click="handleUnassign(lead)"
              >
                <font-awesome-icon icon="user-minus" />
              </button>

              <!-- Detail -->
              <button
                v-if="canView"
                class="act-btn act-info"
                title="Detail"
                @click="openDetailModal(lead)"
              >
                <font-awesome-icon icon="eye" />
              </button>

              <!-- Edit -->
              <button
                v-if="canUpdate"
                class="act-btn act-edit"
                title="Edit"
                @click="openEditModal(lead)"
              >
                <font-awesome-icon icon="pen" />
              </button>

              <!-- Delete -->
              <button
                v-if="canDelete"
                class="act-btn act-delete"
                title="Delete"
                @click="handleDelete(lead)"
              >
                <font-awesome-icon icon="trash" />
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
          :disabled="!store.pagination.prev_page_url"
          @click="store.fetchLeads(store.pagination.prev_page_url)"
        >
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button
          class="btn-prev-next"
          :disabled="!store.pagination.next_page_url"
          @click="store.fetchLeads(store.pagination.next_page_url)"
        >
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">
          Hal {{ store.pagination.current_page }} / {{ store.pagination.last_page }}
        </span>
        <span class="page-badge">TOTAL: {{ store.pagination.total }}</span>
      </div>
    </div>


    <!-- ═══ MODAL ADD / EDIT ═══ -->
    <AppModal
      :show="isAddModalVisible"
      :title="isEditMode ? 'Edit Lead' : 'Add & Assign Lead'"
      :icon="isEditMode ? 'pen' : 'user-plus'"
      size="md"
      @close="closeAddModal"
    >
      <div class="form-container-gap">

        <div v-if="store.errorForm?.general" class="form-error-banner">
          <font-awesome-icon icon="triangle-exclamation" />
          {{ store.errorForm.general[0] }}
        </div>

        <!-- ── Data Lead section ── -->
        <div class="form-section-label emerald">Data Lead</div>

        <div class="form-grid-2">

          <!-- Company Name -->
          <div class="form-group col-span-2">
            <label>Company Name <span class="required">*</span></label>
            <input
              v-model="formData.company_name"
              class="form-input"
              :class="{ 'input-error': getError('company_name') }"
              placeholder="PT. Example"
            />
            <p v-if="getError('company_name')" class="field-error">{{ getError('company_name') }}</p>
          </div>

          <!-- Contact Name -->
          <div class="form-group">
            <label>Contact Name <span class="required">*</span></label>
            <input
              v-model="formData.contact_name"
              class="form-input"
              :class="{ 'input-error': getError('contact_name') }"
              placeholder="John Doe"
            />
            <p v-if="getError('contact_name')" class="field-error">{{ getError('contact_name') }}</p>
          </div>

          <!-- Phone -->
          <div class="form-group">
            <label>Phone <span class="required">*</span></label>
            <input
              v-model="formData.phone"
              class="form-input"
              :class="{ 'input-error': getError('phone') }"
              placeholder="08xxxxxxxxxx"
            />
            <p v-if="getError('phone')" class="field-error">{{ getError('phone') }}</p>
          </div>

          <!-- Email -->
          <div class="form-group col-span-2">
            <label>Email <span class="required">*</span></label>
            <input
              v-model="formData.email"
              type="email"
              class="form-input"
              :class="{ 'input-error': getError('email') }"
              placeholder="email@example.com"
            />
            <p v-if="getError('email')" class="field-error">{{ getError('email') }}</p>
          </div>

          <!-- Industry -->
          <div class="form-group">
            <label>Industry</label>
            <div class="custom-select-wrap" ref="formIndustryRef">
              <div
                class="custom-select-trigger"
                :class="{ open: isOpenFormIndustry }"
                @click="toggleFormIndustryDropdown"
              >
                <span v-if="!selectedFormIndustry" class="placeholder">Select Industry...</span>
                <span v-else class="selected-chip">
                  {{ selectedFormIndustry.name }}
                  <button class="chip-clear" @click.stop="clearFormIndustry">×</button>
                </span>
                <font-awesome-icon icon="chevron-down" class="select-arrow" :class="{ rotated: isOpenFormIndustry }" />
              </div>
              <div v-if="isOpenFormIndustry" class="custom-select-dropdown">
                <div class="select-search-wrap">
                  <input v-model="searchFormIndustry" placeholder="Cari industry..." class="select-search" @click.stop />
                </div>
                <div class="select-list">
                  <p v-if="filteredFormIndustry.length === 0" class="select-empty">Not Found</p>
                  <div
                    v-for="ind in filteredFormIndustry" :key="ind.id"
                    class="select-option"
                    :class="{ active: selectedFormIndustry?.id === ind.id }"
                    @click="selectFormIndustry(ind)"
                  >{{ ind.name }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Category -->
          <div class="form-group">
            <label>Category</label>
            <div class="custom-select-wrap" ref="formCategoryRef">
              <div
                class="custom-select-trigger"
                :class="{ open: isOpenFormCategory }"
                @click="toggleFormCategoryDropdown"
              >
                <span v-if="!selectedFormCategory" class="placeholder">Select Category...</span>
                <span v-else class="selected-chip">
                  {{ selectedFormCategory.name }}
                  <button class="chip-clear" @click.stop="clearFormCategory">×</button>
                </span>
                <font-awesome-icon icon="chevron-down" class="select-arrow" :class="{ rotated: isOpenFormCategory }" />
              </div>
              <div v-if="isOpenFormCategory" class="custom-select-dropdown">
                <div class="select-search-wrap">
                  <input v-model="searchFormCategory" placeholder="Cari category..." class="select-search" @click.stop />
                </div>
                <div class="select-list">
                  <p v-if="filteredFormCategory.length === 0" class="select-empty">Not Found</p>
                  <div
                    v-for="cat in filteredFormCategory" :key="cat.id"
                    class="select-option"
                    :class="{ active: selectedFormCategory?.id === cat.id }"
                    @click="selectFormCategory(cat)"
                  >{{ cat.name }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Lead Source -->
          <div class="form-group col-span-2">
            <label>Lead Source <span class="required">*</span></label>
            <div class="segment-group">
              <button
                v-for="src in store.leadSourceOptions" :key="src.value"
                type="button"
                class="segment-btn"
                :class="{ active: formData.lead_source === src.value }"
                @click="formData.lead_source = src.value"
              >{{ src.label }}</button>
            </div>
            <p v-if="getError('lead_source')" class="field-error">{{ getError('lead_source') }}</p>
          </div>

          <!-- Address -->
          <div class="form-group col-span-2">
            <label>Address</label>
            <textarea
              v-model="formData.address"
              class="form-input form-textarea"
              :class="{ 'input-error': getError('address') }"
              placeholder="Complete address..."
              rows="2"
            ></textarea>
            <p v-if="getError('address')" class="field-error">{{ getError('address') }}</p>
          </div>

          <!-- Notes -->
          <div class="form-group col-span-2">
            <label>Notes</label>
            <textarea
              v-model="formData.notes"
              class="form-input form-textarea"
              placeholder="Notes..."
              rows="2"
            ></textarea>
          </div>

        </div>

        <!-- ── Assign to Sales section ── -->
        <div class="form-section-label blue">Assign to Sales</div>

        <!-- Select Sales -->
        <div class="form-group">
          <label>Select Sales <span class="required">*</span></label>
          <div class="custom-select-wrap" ref="formSalesRef">
            <div
              class="custom-select-trigger"
              :class="{ open: isOpenFormSales, 'input-error': getError('assigned_to') }"
              @click="toggleFormSalesDropdown"
            >
              <span v-if="!selectedFormSales" class="placeholder">Select the sales person...</span>
              <span v-else class="selected-chip user-chip">
                <span class="user-avatar"><font-awesome-icon icon="user" style="font-size:0.55rem" /></span>
                {{ selectedFormSales.name }}
                <button class="chip-clear" @click.stop="clearFormSales">×</button>
              </span>
              <font-awesome-icon icon="chevron-down" class="select-arrow" :class="{ rotated: isOpenFormSales }" />
            </div>
            <div v-if="isOpenFormSales" class="custom-select-dropdown">
              <div class="select-search-wrap">
                <input v-model="searchFormSales" placeholder="Cari sales..." class="select-search" @click.stop />
              </div>
              <div class="select-list">
                <p v-if="filteredFormSales.length === 0" class="select-empty">Not Found</p>
                <div
                  v-for="user in filteredFormSales" :key="user.id_user"
                  class="select-option user-option"
                  :class="{ active: selectedFormSales?.id_user === user.id_user }"
                  @click="selectFormSales(user)"
                >
                  <span class="user-avatar"><font-awesome-icon icon="user" style="font-size:0.6rem" /></span>
                  <div>
                    <p style="font-weight:600; margin:0">{{ user.name }}</p>
                    <p style="font-size:0.72rem; color:var(--text-muted); margin:0">{{ user.name_division ?? '' }}</p>
                  </div>
                  <font-awesome-icon v-if="selectedFormSales?.id_user === user.id_user" icon="circle-check" style="margin-left:auto; color:#6366f1" />
                </div>
              </div>
            </div>
          </div>
          <p v-if="getError('assigned_to')" class="field-error">{{ getError('assigned_to') }}</p>
        </div>

        <!-- Visibility -->
        <div class="form-group">
          <label>Visibility</label>
          <div class="segment-group" style="max-width:260px">
            <button
              type="button"
              class="segment-btn"
              :class="{ active: formData.visibility_type === 'PUBLIC' }"
              @click="formData.visibility_type = 'PUBLIC'"
            >
              <font-awesome-icon icon="globe" /> PUBLIC
            </button>
            <button
              type="button"
              class="segment-btn"
              :class="{ active: formData.visibility_type === 'PRIVATE' }"
              @click="formData.visibility_type = 'PRIVATE'"
            >
              <font-awesome-icon icon="lock" /> PRIVATE
            </button>
          </div>
        </div>

      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeAddModal">Cancel</button>
        <button class="btn-save" :disabled="formLoading" @click="handleStore">
          <font-awesome-icon v-if="formLoading" icon="spinner" spin />
          <font-awesome-icon v-else icon="check" />
          {{ isEditMode ? 'Update Lead' : 'Save & Assign' }}
        </button>
      </template>
    </AppModal>


    <!-- ═══ MODAL ASSIGN (existing) ═══ -->
    <AppModal
      :show="showAssignModal"
      :title="assignTargetLead?.assigned_name ? 'Re-assign Lead' : 'Assign Lead'"
      icon="user-plus"
      size="sm"
      @close="closeAssignModal"
    >
      <!-- Lead info -->
      <div class="detail-info-box mb-3">
        <p class="detail-box-label">Lead yang akan di-assign</p>
        <p style="font-weight:700; margin:0">{{ assignTargetLead?.company_name }}</p>
        <p style="font-size:0.82rem; color:var(--text-muted); margin:4px 0 8px">
          {{ assignTargetLead?.contact_name }} · {{ assignTargetLead?.email }}
        </p>
        <div style="display:flex; align-items:center; gap:8px; font-size:0.82rem">
          <span style="color:var(--text-muted)">Saat ini:</span>
          <span v-if="assignTargetLead?.assigned_name" class="detail-badge">
            {{ assignTargetLead.assigned_name }}
          </span>
          <span v-else style="color:var(--text-muted); font-style:italic">Belum di-assign</span>
        </div>
      </div>

      <!-- Select Sales -->
      <div class="form-group mb-3">
        <label>Select Sales <span class="required">*</span></label>
        <div class="custom-select-wrap" ref="assignSalesRef">
          <div
            class="custom-select-trigger"
            :class="{ open: isOpenAssignSales }"
            @click="toggleAssignSalesDropdown"
          >
            <span v-if="!selectedAssignSales" class="placeholder">Select sales...</span>
            <span v-else class="selected-chip user-chip">
              <span class="user-avatar"><font-awesome-icon icon="user" style="font-size:0.55rem" /></span>
              {{ selectedAssignSales.name }}
              <button class="chip-clear" @click.stop="clearAssignSales">×</button>
            </span>
            <font-awesome-icon icon="chevron-down" class="select-arrow" :class="{ rotated: isOpenAssignSales }" />
          </div>
          <div v-if="isOpenAssignSales" class="custom-select-dropdown">
            <div class="select-search-wrap">
              <input v-model="searchAssignSales" placeholder="Cari sales..." class="select-search" @click.stop />
            </div>
            <div class="select-list">
              <p v-if="filteredAssignSales.length === 0" class="select-empty">Not Found</p>
              <div
                v-for="user in filteredAssignSales" :key="user.id_user"
                class="select-option user-option"
                :class="{ active: selectedAssignSales?.id_user === user.id_user }"
                @click="selectAssignSales(user)"
              >
                <span class="user-avatar"><font-awesome-icon icon="user" style="font-size:0.6rem" /></span>
                <div>
                  <p style="font-weight:600; margin:0">{{ user.name }}</p>
                  <p style="font-size:0.72rem; color:var(--text-muted); margin:0">{{ user.name_division ?? '' }}</p>
                </div>
                <font-awesome-icon v-if="selectedAssignSales?.id_user === user.id_user" icon="circle-check" style="margin-left:auto; color:#6366f1" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Visibility -->
      <div class="form-group">
        <label>Visibility</label>
        <div class="segment-group" style="max-width:260px">
          <button
            type="button" class="segment-btn"
            :class="{ active: assignVisibility === 'PUBLIC' }"
            @click="assignVisibility = 'PUBLIC'"
          ><font-awesome-icon icon="globe" /> PUBLIC</button>
          <button
            type="button" class="segment-btn"
            :class="{ active: assignVisibility === 'PRIVATE' }"
            @click="assignVisibility = 'PRIVATE'"
          ><font-awesome-icon icon="lock" /> PRIVATE</button>
        </div>
      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeAssignModal">Cancel</button>
        <button
          class="btn-save"
          :disabled="assignLoading || !selectedAssignSales"
          @click="handleAssign"
        >
          <font-awesome-icon v-if="assignLoading" icon="spinner" spin />
          <font-awesome-icon v-else icon="user-check" />
          {{ assignLoading ? 'Saving...' : 'Assign Now' }}
        </button>
      </template>
    </AppModal>


    <!-- ═══ MODAL DETAIL ═══ -->
    <AppModal
      :show="isDetailModalVisible"
      title="Detail Lead"
      icon="circle-info"
      size="md"
      @close="closeDetailModal"
    >
      <div class="detail-list">
        <div class="detail-row">
          <span class="detail-label">Company</span>
          <span class="detail-value">{{ detailLead?.company_name }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Contact</span>
          <span class="detail-value">{{ detailLead?.contact_name }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email</span>
          <span class="detail-value">{{ detailLead?.email }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Phone</span>
          <span class="detail-value">{{ detailLead?.phone }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Industry</span>
          <span class="detail-value">{{ detailLead?.industry_name ?? '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Category</span>
          <span class="detail-value">{{ detailLead?.category_name ?? '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Source</span>
          <span class="detail-value">{{ detailLead?.lead_source }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status</span>
          <span class="badge-status" :class="store.getStatusConfig(detailLead?.lead_status).label">
            {{ detailLead?.lead_status }}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Assigned To</span>
          <span class="detail-value">{{ detailLead?.assigned_name ?? 'Belum di-assign' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Owner</span>
          <span class="detail-value">{{ detailLead?.owner_name ?? '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Visibility</span>
          <span class="detail-value">{{ detailLead?.visibility_type }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Last Contact</span>
          <span class="detail-value">{{ detailLead?.last_contacted_at ?? '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Converted At</span>
          <span class="detail-value">{{ detailLead?.converted_at ?? '-' }}</span>
        </div>
        <div class="detail-row" style="flex-direction:column; align-items:flex-start; gap:6px">
          <span class="detail-label">Address</span>
          <div class="detail-text-box">{{ detailLead?.address ?? 'Tidak ada alamat' }}</div>
        </div>
        <div class="detail-row" style="flex-direction:column; align-items:flex-start; gap:6px; border:none">
          <span class="detail-label">Notes</span>
          <div class="detail-text-box">{{ detailLead?.notes ?? 'Tidak ada catatan' }}</div>
        </div>
      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeDetailModal">Close</button>
      </template>
    </AppModal>

  </div>
</template>

<style scoped>
/* ── Inherit semua class dari style kode lama Anda ── */
.h-100 { --text-muted: #64748b; --primary-color: #6366f1; }
.form-container-gap { display: flex; flex-direction: column; gap: 14px; }

/* Grid 2 kolom di form */
.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.col-span-2  { grid-column: span 2; }

/* Section label */
.form-section-label {
  font-size: 0.7rem; font-weight: 800; letter-spacing: 0.08em;
  text-transform: uppercase; display: flex; align-items: center; gap: 6px;
}
.form-section-label::before { content: ''; width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.form-section-label.emerald { color: #059669; }
.form-section-label.emerald::before { background: #10b981; }
.form-section-label.blue    { color: #2563eb; }
.form-section-label.blue::before    { background: #3b82f6; }

/* Error */
.form-error-banner { padding: 10px 14px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #ef4444; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; }
.input-error { border-color: #ef4444 !important; background: #fef2f2 !important; }
.field-error { color: #ef4444; font-size: 0.75rem; margin-top: 3px; }
.required { color: #ef4444; }

/* Info badge toolbar */
.info-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; font-size: 0.82rem; color: #2563eb; font-weight: 600; }

/* Spinner */
.spinner-wrap { display: flex; flex-direction: column; align-items: center; gap: 10px; color: var(--text-muted); }
.spinner { width: 26px; height: 26px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Table extras */
.td-truncate { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; max-width: 180px; }
.badge-source { padding: 3px 10px; border-radius: 6px; background: var(--bg-input, #f1f5f9); color: var(--text-muted, #64748b); font-size: 0.78rem; font-weight: 600; }
.badge-status { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; color: #fff; }
/* Bootstrap bg-* sudah handle warna, tambahan jika perlu override */

.assigned-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 99px; }
.assigned-badge span { font-size: 0.8rem; font-weight: 600; color: #1d4ed8; }
.assigned-avatar { width: 20px; height: 20px; border-radius: 50%; background: #bfdbfe; display: flex; align-items: center; justify-content: center; color: #1d4ed8; flex-shrink: 0; }

/* Assign action button (lebih lebar karena ada teks) */
.act-assign {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 6px; border: 1.5px solid #3b82f6;
  color: #3b82f6; background: transparent; cursor: pointer;
  font-size: 0.78rem; font-weight: 600; transition: all 0.18s;
}
.act-assign:hover { background: #3b82f6; color: #fff; }

/* Custom Select Dropdown */
.custom-select-wrap { position: relative; }
.custom-select-trigger {
  display: flex; align-items: center; justify-content: space-between;
  min-height: 38px; padding: 6px 12px;
  border: 1px solid var(--border-main, #e2e8f0);
  border-radius: 8px; background: var(--bg-input, #f8fafc);
  cursor: pointer; transition: border 0.18s; gap: 8px;
}
.custom-select-trigger:hover,
.custom-select-trigger.open { border-color: #6366f1; }
.custom-select-trigger.open { box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
.placeholder { font-size: 0.85rem; color: var(--text-muted, #94a3b8); flex: 1; }
.selected-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 2px 8px; border-radius: 6px;
  background: rgba(99,102,241,0.1); color: #4f46e5;
  font-size: 0.83rem; font-weight: 600;
}
.user-chip { background: #eff6ff; color: #1d4ed8; }
.chip-clear { background: none; border: none; cursor: pointer; font-size: 1rem; color: inherit; line-height: 1; padding: 0 2px; }
.select-arrow { font-size: 0.65rem; color: var(--text-muted); transition: transform 0.18s; flex-shrink: 0; }
.select-arrow.rotated { transform: rotate(180deg); }
.user-avatar { width: 22px; height: 22px; border-radius: 50%; background: #bfdbfe; display: inline-flex; align-items: center; justify-content: center; color: #1d4ed8; flex-shrink: 0; }
.user-option { display: flex; align-items: center; gap: 8px; }

.custom-select-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border-main, #e2e8f0);
  border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  z-index: 300; overflow: hidden;
}
.select-search-wrap { padding: 8px 8px 4px; }
.select-search {
  width: 100%; padding: 6px 10px; border: 1px solid var(--border-main, #e2e8f0);
  border-radius: 7px; background: var(--bg-input, #f8fafc);
  color: var(--text-primary, #334155); font-size: 0.84rem; outline: none;
}
.select-search:focus { border-color: #6366f1; }
.select-list { max-height: 160px; overflow-y: auto; padding: 4px 8px 8px; }
.select-empty { text-align: center; color: var(--text-muted); font-size: 0.84rem; padding: 10px 0; }
.select-option {
  padding: 8px 10px; border-radius: 7px; cursor: pointer;
  font-size: 0.84rem; color: var(--text-primary, #334155); transition: background 0.15s;
}
.select-option:hover { background: var(--bg-nav-hover, #f1f5f9); }
.select-option.active { background: rgba(99,102,241,0.08); color: #4f46e5; font-weight: 600; }

/* Detail modal extras */
.detail-info-box {
  background: var(--bg-input, #f8fafc); border-radius: 10px;
  padding: 14px 16px; border: 1px solid var(--border-main, #e2e8f0);
}
.detail-box-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 6px; }
.detail-text-box { background: var(--bg-input, #f8fafc); border-radius: 8px; padding: 10px 12px; font-size: 0.84rem; color: var(--text-primary); width: 100%; }

/* Sistem Warna & Wrapper Global */
.h-100 {
  /* --border-main: #e2e8f0;
  --bg-input: #f8fafc;
  --text-primary: #334155; */
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
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

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
.toolbar-left { display: flex; gap: 8px; flex-wrap: wrap; }
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

/* ===== CONTROLS ROW ===== */
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
.search-btn:hover { background: #4f46e5; }
.sort-wrap { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

/* ===== DROPDOWN CORE ===== */
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
.perpage-opt:hover  { border-color: #6366f1; color: #6366f1; }
.perpage-opt.active { background: #6366f1; border-color: #6366f1; color: #fff; font-weight: 700; }

/* ===== DATA TABLE ===== */
.table-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); overflow: auto; }
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
.td-center { text-align: center; padding: 40px; color: var(--text-muted); }
.td-actions { text-align: center; white-space: nowrap; }

/* ACTION BUTTONS */
.act-btn { width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s ease; margin: 0 2px; background: transparent; }
.act-edit         { color: #f59e0b; border-color: #f59e0b; }
.act-edit:hover   { background: #f59e0b; color: #fff; }
.act-delete       { color: #ef4444; border-color: #ef4444; }
.act-delete:hover { background: #ef4444; color: #fff; }
.act-info         { color: #6366f1; border-color: #6366f1; }
.act-info:hover   { background: #6366f1; color: #fff; }

/* ===== PAGINATION BASE ===== */
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
  transition: background 0.18s ease;
}
.btn-prev-next:hover:not(:disabled) { background: #4f46e5; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badges { display: flex; gap: 8px; align-items: center; }
.page-badge {
  padding: 7px 14px;
  border: 1px solid var(--border-main);
  border-radius: 7px;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--bg-input);
  white-space: nowrap;
}

/* ===== TAMPILAN MOBILE RESPONSIVE ===== */
@media (max-width: 576px) {
  .pagination-card { flex-direction: column; padding: 12px; gap: 12px; }
  .pagination-nav { width: 100%; justify-content: space-between; }
  .btn-prev-next { flex: 1; max-width: 48%; padding: 10px 14px; }
  .page-badges { width: 100%; justify-content: center; flex-wrap: wrap; }
  .page-badge { flex: 1; text-align: center; font-size: 0.7rem; }
}

/* ===== FORM STANDARD COMPONENTS ===== */
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.form-input { padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.875rem; background: var(--bg-input); color: var(--text-primary); outline: none; transition: border 0.18s; width: 100%; }
.form-input:focus { border-color: #6366f1; }
.form-textarea { resize: none; min-height: 90px; line-height: 1.5; }

/* MODAL FOOTER BUTTONS */
/* Cari class .btn-cancel di bagian <style scoped> file tabel kamu, lalu ganti menjadi ini: */
.btn-cancel {
  padding: 8px 18px;
  background: var(--bg-main, #f1f5f9); /* Menggunakan background dinamis, jika tidak ada fallback ke light mode */
  color: var(--text-muted);
  border: 1px solid var(--border-main);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Berikan efek hover agar lebih interaktif */
.btn-cancel:hover {
  background: var(--border-main);
  color: var(--text-primary);
}
.btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-save:hover { background: #4f46e5; }

/* DETAIL MODAL CONTENT */
.detail-list { display: flex; flex-direction: column; }
.detail-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-main); gap: 12px; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.detail-value { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); }
.mono { font-family: monospace; font-weight: 700; }
.detail-badge { font-size: 0.82rem; font-weight: 600; padding: 3px 12px; border-radius: 6px; background: rgba(99,102,241,0.1); color: #6366f1; border: 1px solid rgba(99,102,241,0.2); }
.badge-active { font-size: 0.75rem; font-weight: 600; padding: 3px 10px; border-radius: 99px; background: rgba(34,197,94,0.1); color: #16a34a; }

/* ===== NEW RESPONSIVE SEGMENTED PILL ===== */
.segment-group {
  display: flex; 
  align-items: center;
  border: 1px solid var(--border-main);
  border-radius: 50px; 
  padding: 4px; 
  background: var(--bg-input);
  width: 100%;
  max-width: 500px; 
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.segment-group::-webkit-scrollbar { display: none; }
.segment-btn {
  flex: 1; 
  text-align: center;
  border: none;
  background: transparent;
  padding: 10px 16px; 
  color: var(--text-primary);
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 50px; 
  transition: all 0.2s ease;
  white-space: nowrap; 
}
.segment-btn:hover:not(.active) { background: rgba(99, 102, 241, 0.08); color: #6366f1; }
.segment-btn.active { background: #6366f1; color: #fff; box-shadow: 0 2px 6px rgba(99, 102, 241, 0.25); }

/* ===== NEW CUSTOM PILL FILE INPUT + PREVIEW ===== */
.pill-input-container {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-main);
  border-radius: 50px;
  background: var(--bg-input);
  padding: 4px;
  width: 100%;
  max-width: 500px;
  box-sizing: border-box;
}
.hidden-input { display: none; }
.pill-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--primary-color);
  color: #ffffff;
  padding: 10px 20px;
  border-radius: 50px;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.25);
  flex-shrink: 0;
}
.pill-upload-btn:hover { background: #4f46e5; transform: translateY(-1px); }
.pill-upload-btn:active { transform: translateY(0); }

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.84rem;
  color: #94a3b8;
  padding: 0 16px;
  overflow: hidden;
  flex: 1;
}
.file-text-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.file-info.has-file { color: var(--text-primary); font-weight: 500; }

.mini-preview {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  border: 1.5px solid var(--border-main);
  background: #fff;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mini-preview img { width: 100%; height: 100%; object-fit: cover; }

/* Perbaikan Potongan Kode CSS yang Terputus sebelumnya */
.form-select {
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 1.25rem;
  padding-right: 40px;
}


</style>