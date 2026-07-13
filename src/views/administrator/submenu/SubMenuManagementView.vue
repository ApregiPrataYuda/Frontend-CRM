<script setup>
import { ref, computed, onMounted } from 'vue'
import AppModal       from '@/components/AppModal.vue'
import { useConfirm } from '@/composables/useConfirm'
import { useToast }   from 'vue-toastification'
import { useSubMenuStore }    from '@/stores/subMenuStore'
import { usePermissionStore } from '@/stores/PermissionStore'
import { useRoute }           from 'vue-router'

const { confirm } = useConfirm()
const toast       = useToast()
const store       = useSubMenuStore()
const permission  = usePermissionStore()
const route       = useRoute()

// ── PERMISSIONS ────────────────────────────
const currentUrl = computed(() => route.path.replace('/app', ''))
const canCreate  = computed(() => permission.canCreate(currentUrl.value))
const canUpdate  = computed(() => permission.canUpdate(currentUrl.value))
const canDelete  = computed(() => permission.canDelete(currentUrl.value))
const canView    = computed(() => permission.canView(currentUrl.value))

// ── FETCH AWAL ─────────────────────────────
onMounted(async () => {
  await store.fetchSubMenus()
  await store.fetchMenuSelect()
  await store.fetchSubMenuSelect()
})

// ── DROPDOWN TOOLBAR ───────────────────────
const showExportMenu  = ref(false)
const showImportMenu  = ref(false)
const showPerPageMenu = ref(false)
const showSortByMenu  = ref(false)
const showSortDirMenu = ref(false)

const sortByOptions = [
  { label: 'Created Date', value: 'created_at' },
  { label: 'Title',        value: 'title' },
  { label: 'URL',          value: 'url' },
]
const sortByLabel = () =>
  sortByOptions.find(o => o.value === store.sort.column)?.label ?? 'Created Date'

function exportCSV() {
  const header = 'ID,Title,URL,Icon,Status\n'
  const rows   = store.subMenusData.map(m =>
    `${m.id_submenu},"${m.title}","${m.url}","${m.icon}","${m.is_active ? 'Active' : 'Inactive'}"`
  ).join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'submenus.csv'; a.click()
  URL.revokeObjectURL(url)
  showExportMenu.value = false
}

// ── MODAL ADD/EDIT ─────────────────────────
const isAddModalVisible = ref(false)
const isEdit            = ref(false)
const editId            = ref(null)
const formErrors        = ref({})

const form = ref({
  id_menu:   '',
  title:     '',
  url:       '',
  icon:      '',
  parent_id: '',
  is_active: '',
  noted:     '',
})

// Select Menu
const selectedMenu = ref(null)
const searchMenu   = ref('')
const isOpenMenu   = ref(false)

const filteredMenus = computed(() => {
  if (!store.menuSelectData) return []
  if (!searchMenu.value) return store.menuSelectData
  return store.menuSelectData.filter(m =>
    m.menu?.toLowerCase().includes(searchMenu.value.toLowerCase())
  )
})

function selectMenu(menu) {
  selectedMenu.value  = menu
  form.value.id_menu  = menu.id_menu
  isOpenMenu.value    = false
  searchMenu.value    = ''
}

function clearMenu() {
  selectedMenu.value = null
  form.value.id_menu = ''
}

// Select Parent Submenu
const selectedParent = ref(null)
const searchParent   = ref('')
const isOpenParent   = ref(false)

const filteredParents = computed(() => {
  if (!store.subMenuSelectData) return []
  if (!searchParent.value) return store.subMenuSelectData
  return store.subMenuSelectData.filter(m =>
    m.title?.toLowerCase().includes(searchParent.value.toLowerCase())
  )
})

function selectParent(sub) {
  selectedParent.value  = sub
  form.value.parent_id  = sub.id_submenu
  isOpenParent.value    = false
  searchParent.value    = ''
}

function clearParent() {
  selectedParent.value = null
  form.value.parent_id = ''
}

// Select Status
const selectedStatus  = ref(null)
const isOpenStatus    = ref(false)
const statusOptions   = [
  { value: true,  label: 'Active' },
  { value: false, label: 'Inactive' },
]

function selectStatus(opt) {
  selectedStatus.value  = opt
  form.value.is_active  = opt.value
  isOpenStatus.value    = false
}

function clearStatus() {
  selectedStatus.value = null
  form.value.is_active = ''
}

function getError(field) {
  if (!formErrors.value || typeof formErrors.value !== 'object') return null
  return Array.isArray(formErrors.value[field])
    ? formErrors.value[field][0]
    : formErrors.value[field] ?? null
}

async function openCreate() {
  isEdit.value   = false
  editId.value   = null
  formErrors.value = {}
  form.value = { id_menu: '', title: '', url: '', icon: '', parent_id: '', is_active: '', noted: '' }
  selectedMenu.value   = null
  selectedParent.value = null
  selectedStatus.value = null
  store.errorSubMenu   = null
  isAddModalVisible.value = true
}

async function openEdit(id) {
  isEdit.value     = true
  editId.value     = id
  formErrors.value = {}
  store.errorSubMenu = null

  const detail = await store.fetchSubMenuDetail(id)
  if (!detail) return

  form.value = {
    id_menu:   detail.id_menu   ?? '',
    title:     detail.title     ?? '',
    url:       detail.url       ?? '',
    icon:      detail.icon      ?? '',
    parent_id: detail.parent_id ?? '',
    is_active: detail.is_active ?? '',
    noted:     detail.noted     ?? '',
  }

  selectedMenu.value   = store.menuSelectData.find(m => m.id_menu === detail.id_menu) ?? null
  selectedParent.value = store.subMenuSelectData.find(m => m.id_submenu === detail.parent_id) ?? null
  selectedStatus.value = statusOptions.find(o => o.value === detail.is_active) ?? null

  isAddModalVisible.value = true
}

function closeModal() {
  isAddModalVisible.value = false
  store.errorSubMenu      = null
  selectedMenu.value      = null
  selectedParent.value    = null
  selectedStatus.value    = null
  formErrors.value        = {}
}

async function submitForm() {
  formErrors.value = {}

  if (!form.value.title.trim()) {
    formErrors.value.title = 'Title is required'
    return
  }
  if (!form.value.id_menu) {
    formErrors.value.id_menu = 'Menu is required'
    return
  }

  let success = false
  if (isEdit.value) {
    success = await store.updateSubMenu(editId.value, form.value)
  } else {
    success = await store.saveSubMenu(form.value)
  }

  if (success) {
    closeModal()
    toast.success(isEdit.value ? 'The submenu has been successfully updated!' : 'The submenu has been successfully added!')
  } else {
    if (store.errorSubMenu && typeof store.errorSubMenu === 'object') {
      formErrors.value = store.errorSubMenu
    }
    toast.error('Failed to save submenu!')
  }
}

// ── DELETE ─────────────────────────────────
async function openDeleteModal(item) {
  const ok = await confirm({
    type:        'danger',
    title:       'Delete Submenu',
    message:     `Are you sure you want to delete the submenu? "${item.title}"?`,
    detail:      'This action cannot be undone.',
    confirmText: 'Yes, Delete',
    cancelText:  'Cancelled',
  })
  if (ok) {
    const success = await store.deleteSubMenu(item.id_submenu)
    if (success) {
      toast.success('The submenu has been successfully deleted!')
    } else {
      toast.error('Failed to delete submenu!')
    }
  }
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <!-- ── BREADCRUMB ───────────────────────── -->
    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="table-list" /> Submenu Management
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" /> Dashboard
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Submenu Management</span>
        </div>
      </div>
    </div>

    <!-- ── TOOLBAR TOP ──────────────────────── -->
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
              <font-awesome-icon icon="file-csv" style="color:#22c55e" /> CSV
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
              <font-awesome-icon icon="file-csv" style="color:#22c55e" /> CSV
            </button>
          </div>
        </div>

      </div>

      <button class="btn-toolbar btn-orange" @click="store.resetFilters()">
        <font-awesome-icon icon="rotate-left" /> Reset
      </button>
    </div>

    <!-- ── CONTROLS ─────────────────────────── -->
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
                    v-for="opt in [5, 10, 25, 50]" :key="opt"
                    class="perpage-opt"
                    :class="{ active: store.pagination.per_page === opt }"
                    @click="store.pagination.per_page = opt; showPerPageMenu = false; store.changePageSize()"
                  >{{ opt }}</button>
                </div>
              </div>
            </div>
          </div>

          <button v-if="canCreate" class="btn-toolbar btn-purple" @click="openCreate">
            <font-awesome-icon icon="plus" /> Add Submenu
          </button>

        </div>

        <div class="controls-right">

          <div class="search-wrap">
            <input
              :value="store.searchSubMenus"
              type="text"
              placeholder="Cari submenu..."
              class="search-input"
              @input="store.searchSubMenus = $event.target.value; store.searchWithDelay()"
            />
            <button class="search-btn">
              <font-awesome-icon icon="magnifying-glass" />
            </button>
          </div>

          <div class="sort-wrap">
            <span class="showing-label">Sort:</span>

            <div class="drop-wrap">
              <button class="btn-select" @click="showSortByMenu = !showSortByMenu">
                {{ sortByLabel() }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
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
                {{ store.sort.direction === 'asc' ? 'Asc' : 'Desc' }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-right" :class="{ show: showSortDirMenu }">
                <div class="drop-label">Urutan</div>
                <button
                  v-for="opt in ['desc', 'asc']" :key="opt"
                  class="drop-item"
                  :class="{ active: store.sort.direction === opt }"
                  @click="store.sort.direction = opt; store.changeSorting(); showSortDirMenu = false"
                >{{ opt === 'asc' ? 'Asc' : 'Desc' }}</button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- ── TABLE ────────────────────────────── -->
    <div class="table-card flex-grow-1 overflow-auto mb-3">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:60px">NO.</th>
            <th>MENU</th>
            <th>TITLE</th>
            <th>URL</th>
            <th>ICON</th>
            <th>PARENT</th>
            <th style="width:100px">STATUS</th>
            <th style="width:120px; text-align:center">ACTIONS</th>
          </tr>
        </thead>
        <tbody>

          <!-- Loading -->
          <tr v-if="store.loadingSubMenus">
            <td colspan="8" class="td-center">
              <div style="display: flex; justify-content: center;">
                <div class="spinner-custom"></div>
              </div>
            </td>
          </tr>

          <!-- Empty -->
          <tr v-else-if="!store.subMenusData.length">
            <td colspan="8" class="td-center">
              <div class="empty-state">
                <font-awesome-icon icon="inbox" class="empty-icon" />
                <div>Tidak ada data ditemukan</div>
              </div>
            </td>
          </tr>

          <!-- Data -->
          <template v-else v-for="(item, index) in store.subMenusData" :key="item.id_submenu">

            <!-- PARENT ROW -->
            <tr class="data-row">
              <td class="td-no">
                {{ (store.pagination.current_page - 1) * store.pagination.per_page + index + 1 }}.
              </td>
              <td>
                <span class="menu-badge">{{ item.menu?.menu }}</span>
              </td>
              <td class="td-name">{{ item.title }}</td>
              <td class="td-muted">{{ item.url }}</td>
              <td class="td-muted">
                <i :class="item.icon"></i>
                <span class="icon-text">{{ item.icon }}</span>
              </td>
              <td class="td-muted">—</td>
              <td>
                <span :class="item.is_active ? 'badge-active' : 'badge-inactive'">
                  {{ item.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="td-actions">
                <button v-if="canUpdate" class="act-btn act-edit" @click="openEdit(item.id_submenu)" title="Edit">
                  <font-awesome-icon icon="pen-to-square" />
                </button>
                <button v-if="canDelete" class="act-btn act-delete" @click="openDeleteModal(item)" title="Hapus">
                  <font-awesome-icon icon="trash-can" />
                </button>
              </td>
            </tr>

            <!-- CHILD ROWS -->
            <tr
              v-for="child in item.children"
              :key="child.id_submenu"
              class="data-row child-row"
            >
              <td class="td-no"></td>
              <td>
                <span class="menu-badge">{{ child.menu?.menu }}</span>
              </td>
              <td class="td-name">
                <span class="child-prefix">↳</span> {{ child.title }}
              </td>
              <td class="td-muted">{{ child.url }}</td>
              <td class="td-muted">
                <i :class="child.icon"></i>
                <span class="icon-text">{{ child.icon }}</span>
              </td>
              <td class="td-muted">{{ item.title }}</td>
              <td>
                <span :class="child.is_active ? 'badge-active' : 'badge-inactive'">
                  {{ child.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="td-actions">
                <button v-if="canUpdate" class="act-btn act-edit" @click="openEdit(child.id_submenu)" title="Edit">
                  <font-awesome-icon icon="pen-to-square" />
                </button>
                <button v-if="canDelete" class="act-btn act-delete" @click="openDeleteModal(child)" title="Hapus">
                  <font-awesome-icon icon="trash-can" />
                </button>
              </td>
            </tr>

          </template>

        </tbody>
      </table>
    </div>

    <!-- ── PAGINATION ───────────────────────── -->
    <div class="pagination-card">
      <div class="pagination-nav">
        <button
          class="btn-prev-next"
          :disabled="store.pagination.current_page === 1"
          @click="store.fetchSubMenus(store.pagination.prev_page_url)"
        >
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button
          class="btn-prev-next"
          :disabled="store.pagination.current_page === store.pagination.last_page"
          @click="store.fetchSubMenus(store.pagination.next_page_url)"
        >
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">
          {{ store.subMenusData.length }} DATA | PAGE {{ store.pagination.current_page }}
        </span>
        <span class="page-badge">TOTAL: {{ store.pagination.total }}</span>
      </div>
    </div>

    <!-- ── MODAL ADD/EDIT ───────────────────── -->
    <AppModal
      :show="isAddModalVisible"
      :title="isEdit ? 'Edit Submenu' : 'Tambah Submenu'"
      :icon="isEdit ? 'pen' : 'plus'"
      size="lg"
      @close="closeModal"
    >
      <div class="form-container-gap">
        <div class="form-grid">

          <!-- Title -->
          <div class="form-group">
            <label>Title <span class="required">*</span></label>
            <input
              v-model="form.title"
              class="form-input"
              :class="{ 'is-error': getError('title') }"
              placeholder="Contoh: Dashboard Admin"
            />
            <p class="error-msg" v-if="getError('title')">{{ getError('title') }}</p>
          </div>

          <!-- Select Menu -->
          <div class="form-group">
            <label>Menu <span class="required">*</span></label>
            <div class="custom-select" :class="{ 'is-error': getError('id_menu') }">
              <div class="custom-select-trigger" @click="isOpenMenu = !isOpenMenu">
                <span v-if="!selectedMenu" class="placeholder">Pilih Menu...</span>
                <span v-else class="selected-tag">
                  {{ selectedMenu.menu }}
                  <button type="button" @click.stop="clearMenu">x</button>
                </span>
                <font-awesome-icon icon="chevron-down" class="select-arrow" :class="{ rotated: isOpenMenu }" />
              </div>
              <div class="custom-select-dropdown" v-if="isOpenMenu">
                <input
                  v-model="searchMenu"
                  type="text"
                  placeholder="Cari menu..."
                  class="select-search"
                  @click.stop
                />
                <div class="select-options">
                  <p v-if="!filteredMenus.length" class="select-empty">Tidak ditemukan</p>
                  <div
                    v-for="menu in filteredMenus"
                    :key="menu.id_menu"
                    class="select-option"
                    :class="{ active: selectedMenu?.id_menu === menu.id_menu }"
                    @click="selectMenu(menu)"
                  >{{ menu.menu }}</div>
                </div>
              </div>
            </div>
            <p class="error-msg" v-if="getError('id_menu')">{{ getError('id_menu') }}</p>
          </div>

          <!-- URL -->
          <div class="form-group">
            <label>URL</label>
            <input
              v-model="form.url"
              class="form-input"
              :class="{ 'is-error': getError('url') }"
              placeholder="/contoh-url"
            />
            <p class="error-msg" v-if="getError('url')">{{ getError('url') }}</p>
          </div>

          <!-- Icon -->
          <div class="form-group">
            <label>Icon</label>
            <input
              v-model="form.icon"
              class="form-input"
              :class="{ 'is-error': getError('icon') }"
              placeholder="nav-icon fas fa-home"
            />
            <p class="error-msg" v-if="getError('icon')">{{ getError('icon') }}</p>
          </div>

          <!-- Select Parent -->
          <div class="form-group">
            <label>Parent Submenu</label>
            <div class="custom-select">
              <div class="custom-select-trigger" @click="isOpenParent = !isOpenParent">
                <span v-if="!selectedParent" class="placeholder">Pilih Parent (opsional)...</span>
                <span v-else class="selected-tag">
                  {{ selectedParent.title }}
                  <button type="button" @click.stop="clearParent">×</button>
                </span>
                <font-awesome-icon icon="chevron-down" class="select-arrow" :class="{ rotated: isOpenParent }" />
              </div>
              <div class="custom-select-dropdown" v-if="isOpenParent">
                <input
                  v-model="searchParent"
                  type="text"
                  placeholder="Cari submenu..."
                  class="select-search"
                  @click.stop
                />
                <div class="select-options">
                  <p v-if="!filteredParents.length" class="select-empty">Tidak ditemukan</p>
                  <div
                    v-for="sub in filteredParents"
                    :key="sub.id_submenu"
                    class="select-option"
                    :class="{ active: selectedParent?.id_submenu === sub.id_submenu }"
                    @click="selectParent(sub)"
                  >{{ sub.title }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Status -->
          <div class="form-group">
            <label>Status</label>
            <div class="custom-select" :class="{ 'is-error': getError('is_active') }">
              <div class="custom-select-trigger" @click="isOpenStatus = !isOpenStatus">
                <span v-if="!selectedStatus" class="placeholder">Pilih Status...</span>
                <span v-else class="selected-tag">
                  {{ selectedStatus.label }}
                  <button type="button" @click.stop="clearStatus">×</button>
                </span>
                <font-awesome-icon icon="chevron-down" class="select-arrow" :class="{ rotated: isOpenStatus }" />
              </div>
              <div class="custom-select-dropdown" v-if="isOpenStatus">
                <div class="select-options">
                  <div
                    v-for="opt in statusOptions"
                    :key="opt.value"
                    class="select-option"
                    :class="{ active: selectedStatus?.value === opt.value }"
                    @click="selectStatus(opt)"
                  >{{ opt.label }}</div>
                </div>
              </div>
            </div>
            <p class="error-msg" v-if="getError('is_active')">{{ getError('is_active') }}</p>
          </div>

          <!-- Description -->
          <div class="form-group form-full">
            <label>Description</label>
            <textarea
              v-model="form.noted"
              class="form-input form-textarea"
              rows="3"
              placeholder="Deskripsi submenu..."
            ></textarea>
          </div>

        </div>
      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeModal">Batal</button>
        <button
          class="btn-save"
          @click="submitForm"
          :disabled="store.savingSubMenu || store.updatingSubMenu"
        >
          <font-awesome-icon
            v-if="store.savingSubMenu || store.updatingSubMenu"
            icon="spinner" spin
          />
          <font-awesome-icon v-else icon="check" />
          {{ isEdit ? 'Update' : 'Simpan' }}
        </button>
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
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-full { grid-column: 1 / -1; }


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
.btn-toolbar { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: none; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; transition: all 0.18s ease; white-space: nowrap; }
.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover { background: #4f46e5; }
.btn-orange { background: #f59e0b; color: #fff; }
.btn-orange:hover { background: #d97706; }
.btn-arrow { font-size: 0.6rem; opacity: 0.7; }

/* CONTROLS */
.controls-card { background: var(--bg-card); border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); }
.controls-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.controls-left, .controls-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.showing-wrap { display: flex; align-items: center; gap: 6px; font-size: 0.84rem; color: var(--text-primary); font-weight: 600; }
.showing-label { white-space: nowrap; color: var(--text-muted); font-size: 0.83rem; }
.text-muted-color { color: var(--text-muted); }
.search-wrap { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.search-input { padding: 7px 12px; border: none; background: transparent; color: var(--text-primary); font-size: 0.84rem; outline: none; width: 200px; }
.search-btn { padding: 7px 12px; background: #6366f1; color: #fff; border: none; cursor: pointer; }
.sort-wrap { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

/* DROPDOWN */
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
.perpage-opt.active { background: #6366f1; border-color: #6366f1; color: #fff; font-weight: 700; }

/* TABLE */
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

/* CHILD ROW */
.child-row { background: rgba(99,102,241,0.02); }
.child-prefix { color: #6366f1; font-weight: 700; margin-right: 4px; }

/* BADGES */
.menu-badge { display: inline-block; padding: 3px 10px; background: rgba(99,102,241,0.1); color: #6366f1; border-radius: 20px; font-size: 0.78rem; font-weight: 600; border: 1px solid rgba(99,102,241,0.2); }
.badge-active { display: inline-block; padding: 3px 10px; background: rgba(34,197,94,0.1); color: #16a34a; border-radius: 20px; font-size: 0.78rem; font-weight: 600; }
.badge-inactive { display: inline-block; padding: 3px 10px; background: rgba(239,68,68,0.1); color: #ef4444; border-radius: 20px; font-size: 0.78rem; font-weight: 600; }
.icon-text { font-size: 0.75rem; color: var(--text-muted); margin-left: 4px; }

/* ACTION BUTTONS */
.act-btn { width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s ease; margin: 0 2px; background: transparent; }
.act-edit { color: #f59e0b; border-color: #f59e0b; }
.act-edit:hover { background: #f59e0b; color: #fff; }
.act-delete { color: #ef4444; border-color: #ef4444; }
.act-delete:hover { background: #ef4444; color: #fff; }

/* PAGINATION */
.pagination-card { background: var(--bg-card); border-radius: 10px; padding: 14px 18px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: row-reverse; align-items: center; justify-content: space-between; gap: 12px; }
.pagination-nav { display: flex; align-items: center; gap: 8px; }
.btn-prev-next { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; min-width: 85px; justify-content: center; transition: background 0.18s ease; }
.btn-prev-next:hover:not(:disabled) { background: #4f46e5; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badges { display: flex; gap: 8px; align-items: center; }
.page-badge { padding: 7px 14px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); background: var(--bg-input); white-space: nowrap; }

/* FORM */
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.required { color: #ef4444; }
.form-input { padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.875rem; background: var(--bg-input); color: var(--text-primary); outline: none; transition: border 0.18s; width: 100%; }
.form-input:focus { border-color: #6366f1; }
.form-input.is-error { border-color: #ef4444; }
.form-textarea { resize: none; min-height: 80px; }
.error-msg { font-size: 0.8rem; color: #ef4444; margin: 0; }

/* CUSTOM SELECT */
.custom-select { position: relative; }
.custom-select-trigger {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; border: 1px solid var(--border-main);
  border-radius: 8px; background: var(--bg-input);
  cursor: pointer; min-height: 40px; transition: border 0.15s;
}
.custom-select-trigger:hover { border-color: #6366f1; }
.custom-select.is-error .custom-select-trigger { border-color: #ef4444; }
.placeholder { font-size: 0.875rem; color: var(--text-muted); }
.selected-tag {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 2px 8px; background: rgba(99,102,241,0.1);
  color: #6366f1; border-radius: 6px; font-size: 0.82rem; font-weight: 600;
}
.selected-tag button { background: none; border: none; color: #6366f1; cursor: pointer; font-size: 1rem; line-height: 1; padding: 0; }
.select-arrow { font-size: 0.65rem; color: var(--text-muted); transition: transform 0.2s; }
.select-arrow.rotated { transform: rotate(180deg); }
.custom-select-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  background: var(--bg-card); border: 1px solid var(--border-main);
  border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 500; overflow: hidden;
}
.select-search { width: 100%; padding: 8px 12px; border: none; border-bottom: 1px solid var(--border-main); background: var(--bg-input); font-size: 0.84rem; outline: none; color: var(--text-primary); }
.select-options { max-height: 180px; overflow-y: auto; padding: 6px; }
.select-option { padding: 8px 10px; border-radius: 6px; font-size: 0.84rem; cursor: pointer; color: var(--text-primary); transition: background 0.15s; }
.select-option:hover { background: var(--bg-nav-hover); }
.select-option.active { background: rgba(99,102,241,0.1); color: #6366f1; font-weight: 600; }
.select-empty { text-align: center; color: var(--text-muted); font-size: 0.82rem; padding: 12px 0; }

/* MODAL FOOTER BUTTONS */
.btn-cancel { padding: 8px 18px; background: var(--bg-main, #f1f5f9); color: var(--text-muted); border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
.btn-cancel:hover { background: var(--border-main); color: var(--text-primary); }
.btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-save:hover { background: #4f46e5; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

/* EMPTY & SPINNER */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px 0; }
.empty-icon { font-size: 2rem; color: var(--text-muted); }
.spinner-custom { width: 2rem; height: 2rem; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 576px) {
  .form-grid { grid-template-columns: 1fr; }
  .form-full { grid-column: 1; }
}
</style>