<script setup>
import { ref, onMounted, computed } from 'vue'
import AppModal from '@/components/AppModal.vue'
import { useConfirm } from '@/composables/useConfirm'
import { useMenuStore } from '@/stores/menuStore'
import { usePermissionStore } from '@/stores/permissionStore'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'

const { confirm } = useConfirm()
const store = useMenuStore()
const permission = usePermissionStore()
const route      = useRoute()
const toast = useToast()


// ── PERMISSIONS ────────────────────────────
const currentUrl = computed(() => route.path.replace('/app', ''))
const canCreate  = computed(() => permission.canCreate(currentUrl.value))
const canUpdate  = computed(() => permission.canUpdate(currentUrl.value))
const canDelete  = computed(() => permission.canDelete(currentUrl.value))
const canView    = computed(() => permission.canView(currentUrl.value))


// ── FETCH AWAL ─────────────────────────────
onMounted(() => store.fetchMenus())

// ── EXPORT ─────────────────────────────────
const showExportMenu  = ref(false)
const showImportMenu  = ref(false)
const showPerPageMenu = ref(false)
const showSortByMenu  = ref(false)
const showSortDirMenu = ref(false)

const sortByOptions = [
  { label: 'Created Date', value: 'created_at' },
  { label: 'Menu Name',    value: 'menu' },
]
const sortByLabel = () =>
  sortByOptions.find(o => o.value === store.sort.column)?.label ?? 'Created Date'

function exportCSV() {
  const header = 'ID,Menu,Created\n'
  const rows   = store.menusData.map(m =>
    `${m.id_menu},"${m.menu}","${m.created_at}"`
  ).join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'menus.csv'; a.click()
  URL.revokeObjectURL(url)
  showExportMenu.value = false
}

// ── MODAL ADD/EDIT ─────────────────────────
const isAddModalVisible = ref(false)
const isEdit            = ref(false)
const selectedEditMenu  = ref(null)
const form = ref({ menu: '' })
const formErrors = ref({})

function openAddModal() {
  isEdit.value          = false
  selectedEditMenu.value = null
  form.value            = { menu: '' }
  formErrors.value      = {}
  isAddModalVisible.value = true
}

function openEditModal(item) {
  isEdit.value          = true
  selectedEditMenu.value = item
  form.value            = { menu: item.menu }
  formErrors.value      = {}
  isAddModalVisible.value = true
}

function closeAddModal() {
  isAddModalVisible.value = false
  store.errorMenu = null
}


// ── SUBMIT ADD/EDIT ──
async function submitAddData() {
  formErrors.value = {}
  if (!form.value.menu.trim()) {
    formErrors.value.menu = 'The menu name is mandatory'
    return
  }
  try {
    if (isEdit.value) {
      await store.updateMenu(selectedEditMenu.value.id_menu, form.value)
      toast.success('Menu updated successfully!')       
    } else {
      await store.storeMenu(form.value)
      toast.success('Menu added successfully!')    
    }
    closeAddModal()
  } catch (err) {
    if (store.errorMenu) formErrors.value = store.errorMenu
    toast.error('Failed to save menu!')          
  }
}

// ── MODAL DETAIL ───────────────────────────
const isDetailModalVisible = ref(false)
const detailItem           = ref(null)

async function openDetailModal(item) {
  isDetailModalVisible.value = true
  await store.detailMenu(item.id_menu)
  detailItem.value = store.menuDetail
}

function closeDetailModal() {
  isDetailModalVisible.value = false
  detailItem.value = null
}

// ── DELETE ─────────────────────────────────
async function openDeleteModal(item) {
  const ok = await confirm({
    type:        'danger',
    title:       'Delete Menu',
    message:     `Are you sure you want to delete the menu "${item.menu}"?`,
    detail:      'This action cannot be undone.',
    confirmText: 'Yes, Delete',
    cancelText:  'Cancel',
  })
  if (ok) {
    try {
      await store.deleteMenu(item.id_menu)
      toast.success('Menu deleted successfully!')        
    } catch {
      toast.error('Failed to delete menu!')           
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
          <font-awesome-icon icon="table-list" /> Menu Management
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" /> Dashboard
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Menu Management</span>
        </div>
      </div>
    </div>

    <!-- ── TOOLBAR TOP ──────────────────────── -->
    <div class="toolbar-top">
      <div class="toolbar-left">

        <!-- Export -->
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

        <!-- Import -->
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

          <!-- Per Page -->
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

          <!-- Add -->
          <button v-if="canCreate" class="btn-toolbar btn-purple" @click="openAddModal">
            <font-awesome-icon icon="plus" /> Add Menu
          </button>

        </div>

        <div class="controls-right">

          <!-- Search -->
          <div class="search-wrap">
            <input
              :value="store.searchMenus"
              type="text"
              placeholder="Cari menu..."
              class="search-input"
              @input="store.searchWithDelay($event.target.value)"
            />
            <button class="search-btn">
              <font-awesome-icon icon="magnifying-glass" />
            </button>
          </div>

          <!-- Sort -->
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
            <th style="width:70px">NO.</th>
            <th>MENU NAME</th>
            <th style="width:220px">CREATED</th>
            <th style="width:220px">UPDATED</th>
            <th style="width:140px; text-align:center">ACTIONS</th>
          </tr>
        </thead>
        <tbody>

        <!-- Loading -->
        <tr v-if="store.loadingMenus">
          <td colspan="8" class="td-center">
            <div style="display: flex; justify-content: center;">
              <div class="spinner-custom"></div>
            </div>
          </td>
        </tr>

          <!-- Empty -->
          <tr v-else-if="!store.menusData.length">
              <td colspan="5" class="td-center">
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
            
          <!-- Data -->
          <tr
            v-else
            v-for="(item, index) in store.menusData"
            :key="item.id_menu"
            class="data-row"
          >
            <td class="td-no">
              {{ (store.pagination.current_page - 1) * store.pagination.per_page + index + 1 }}.
            </td>
            <td class="td-name">
              <span class="menu-badge">{{ item.menu }}</span>
            </td>
            <td class="td-muted">{{ store.formatDate(item.created_at) }}</td>
            <td class="td-muted">{{ store.formatDate(item.updated_at) }}</td>
            <td class="td-actions">
  <button
    v-if="canUpdate"
    class="act-btn act-edit"
    @click="openEditModal(item)"
    title="Edit"
  >
    <font-awesome-icon icon="pen-to-square" />
  </button>

  <button
    v-if="canDelete"
    class="act-btn act-delete"
    @click="openDeleteModal(item)"
    title="Hapus"
  >
    <font-awesome-icon icon="trash-can" />
  </button>

  <button
    v-if="canView"
    class="act-btn act-info"
    @click="openDetailModal(item)"
    title="Detail"
  >
    <font-awesome-icon icon="circle-info" />
  </button>
</td>
          </tr>

        </tbody>
      </table>
    </div>

    <!-- ── PAGINATION ───────────────────────── -->
    <div class="pagination-card">
      <div class="pagination-nav">
        <button
          class="btn-prev-next"
          :disabled="store.pagination.current_page === 1"
          @click="store.fetchMenus(store.pagination.prev_page_url)"
        >
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button
          class="btn-prev-next"
          :disabled="store.pagination.current_page === store.pagination.last_page"
          @click="store.fetchMenus(store.pagination.next_page_url)"
        >
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">
          {{ store.menusData.length }} DATA | PAGE {{ store.pagination.current_page }}
        </span>
        <span class="page-badge">TOTAL: {{ store.pagination.total }}</span>
      </div>
    </div>

    <!-- ── MODAL ADD/EDIT ───────────────────── -->
    <AppModal
      :show="isAddModalVisible"
      :title="isEdit ? 'Edit Menu' : 'Tambah Menu'"
      :icon="isEdit ? 'pen' : 'plus'"
      size="md"
      @close="closeAddModal"
    >
      <div class="form-container-gap">
        <div class="form-group">
          <label>Nama Menu <span style="color:#ef4444">*</span></label>
          <input
            v-model="form.menu"
            class="form-input"
            :class="{ 'is-error': formErrors.menu }"
            placeholder="Contoh: administrator, sales, manager"
            @keyup.enter="submitAddData"
          />
          <p class="error-msg" v-if="formErrors.menu">
            {{ Array.isArray(formErrors.menu) ? formErrors.menu[0] : formErrors.menu }}
          </p>
        </div>
      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeAddModal">Batal</button>
        <button
          class="btn-save"
          @click="submitAddData"
          :disabled="store.savingMenu || store.updatingMenu"
        >
          <font-awesome-icon
            v-if="store.savingMenu || store.updatingMenu"
            icon="spinner" spin
          />
          <font-awesome-icon v-else icon="check" />
          {{ isEdit ? 'Update' : 'Simpan' }}
        </button>
      </template>
    </AppModal>

    <!-- ── MODAL DETAIL ─────────────────────── -->
    <AppModal
      :show="isDetailModalVisible"
      title="Detail Menu"
      icon="circle-info"
      size="md"
      @close="closeDetailModal"
    >
     
      <div v-if="store.loadingDetail" class="td-center">
        <div style="display: flex; justify-content: center; padding: 24px 0;">
          <div class="spinner-custom"></div>
        </div>
      </div>
        
      
      <div v-else class="detail-list">
        <div class="detail-row">
          <span class="detail-label">Nama Menu</span>
          <span class="detail-badge">{{ detailItem?.menu }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Dibuat</span>
          <span class="detail-value">{{ store.formatDate(detailItem?.created_at) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Diupdate</span>
          <span class="detail-value">{{ store.formatDate(detailItem?.updated_at) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status</span>
          <span class="badge-active">Active</span>
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeDetailModal">Tutup</button>
      </template>
    </AppModal>

  </div>
</template>

<style scoped>

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

.menu-badge {
  display: inline-block;
  padding: 3px 12px;
  background: rgba(99,102,241,0.1);
  color: #6366f1;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 600;
  border: 1px solid rgba(99,102,241,0.2);
}

/* di <style scoped> */
.spinner-custom {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(99, 102, 241, 0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}


/* tambah di style scoped */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
  gap: 8px;
}

.empty-img {
  max-width: 200px;
  height: auto;
  opacity: 0.85;
}

.empty-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-muted);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.form-input.is-error { border-color: #ef4444; }
.error-msg { font-size: 0.8rem; color: #ef4444; margin: 0; }
</style>