<script setup>
import { ref, computed, onMounted } from 'vue'
import AppModal from '@/components/AppModal.vue'
import { useConfirm } from '@/composables/useConfirm'
import { useCabangStore } from '@/stores/cabangStore'
import { usePermissionStore } from '@/stores/PermissionStore'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'

const { confirm } = useConfirm()
const toast       = useToast()
const cabangStore  = useCabangStore()
const permission  = usePermissionStore()
const route       = useRoute()

// ── PERMISSIONS ────────────────────────────
const currentUrl = computed(() => route.path.replace('/app', ''))
const canCreate  = computed(() => permission.canCreate(currentUrl.value))
const canUpdate  = computed(() => permission.canUpdate(currentUrl.value))
const canDelete  = computed(() => permission.canDelete(currentUrl.value))
const canView    = computed(() => permission.canView(currentUrl.value))

// ── FETCH AWAL ─────────────────────────────
onMounted(() => cabangStore.fetchCabang())

// ── DROPDOWN TOGGLES ───────────────────────
const showExportMenu  = ref(false)
const showImportMenu  = ref(false)
const showPerPageMenu = ref(false)
const showSortByMenu  = ref(false)
const showSortDirMenu = ref(false)

// ── SORT OPTIONS ───────────────────────────
const sortByOptions = [
  { label: 'Created Date',  value: 'created_at' },
  { label: 'Nama Cabang',   value: 'cabang' },
]
const sortByLabel = computed(
  () => sortByOptions.find(o => o.value === cabangStore.sort.column)?.label ?? 'Created Date'
)

// ── RESET ──────────────────────────────────
function handleReset() {
  showExportMenu.value  = false
  showImportMenu.value  = false
  showPerPageMenu.value = false
  showSortByMenu.value  = false
  showSortDirMenu.value = false
  cabangStore.resetFilters()
}

// ── EXPORT ─────────────────────────────────
function exportCSV() {
  const header = 'ID,Cabang,Alamat,No Telp,Created\n'
  const rows   = cabangStore.cabangData
    .map(c => `${c.id_cabang},"${c.cabang}","${c.alamat || ''}","${c.no_telp || ''}","${cabangStore.formatDate(c.created_at)}"`)
    .join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'master-cabang.csv'; a.click()
  URL.revokeObjectURL(url)
  showExportMenu.value = false
}
function exportExcel() { showExportMenu.value = false }
function exportPDF()   { showExportMenu.value = false }

// ── ADD / EDIT MODAL ───────────────────────
const isAddModalVisible = ref(false)
const isEdit             = ref(false)
const selectedEditCabang = ref(null)
const newCabangName      = ref('')
const newCabangAlamat    = ref('')
const newCabangNoTelp    = ref('')

function openAddModal() {
  isEdit.value              = false
  selectedEditCabang.value  = null
  newCabangName.value       = ''
  newCabangAlamat.value     = ''
  newCabangNoTelp.value     = ''
  cabangStore.errorCabang   = null
  isAddModalVisible.value   = true
}

function openEditModal(item) {
  isEdit.value             = true
  selectedEditCabang.value = item
  newCabangName.value      = item.cabang
  newCabangAlamat.value    = item.alamat || ''
  newCabangNoTelp.value    = item.no_telp || ''
  cabangStore.errorCabang  = null
  isAddModalVisible.value  = true
}

function closeAddModal() {
  isAddModalVisible.value = false
  cabangStore.errorCabang = null
}

async function submitAddData() {
  if (!newCabangName.value.trim()) {
    toast.error('Nama cabang wajib diisi!')
    return
  }
  if (!newCabangAlamat.value.trim()) {
    toast.error('Alamat cabang wajib diisi!')
    return
  }
  if (!newCabangNoTelp.value.trim()) {
    toast.error('No telp cabang wajib diisi!')
    return
  }

  const payload = {
    cabang:   newCabangName.value.trim(),
    alamat:   newCabangAlamat.value.trim(),
    no_telp:  newCabangNoTelp.value.trim(),
  }

  if (isEdit.value && selectedEditCabang.value) {
    const ok = await cabangStore.updateCabang(selectedEditCabang.value.id_cabang, payload)
    if (ok) { toast.success('Cabang berhasil diperbarui'); closeAddModal() }
  } else {
    const ok = await cabangStore.saveCabang(payload)
    if (ok) { toast.success('Cabang berhasil ditambahkan'); closeAddModal() }
  }
}

// ── DETAIL MODAL ───────────────────────────
const isDetailModalVisible = ref(false)

async function openDetailModal(item) {
  isDetailModalVisible.value = true
  await cabangStore.fetchCabangDetail(item.id_cabang)
}
function closeDetailModal() {
  isDetailModalVisible.value = false
}

// ── DELETE ─────────────────────────────────
async function openDeleteModal(item) {
  const isConfirmed = await confirm({
    type:        'danger',
    title:       'Hapus Data Cabang',
    message:     `Yakin ingin menghapus cabang "${item.cabang}"?`,
    detail:      'Tindakan ini tidak bisa dibatalkan dan akan menghapus data secara permanen.',
    confirmText: 'Yes, Delete',
    cancelText:  'Cancel',
  })
  if (isConfirmed) {
    const ok = await cabangStore.deleteCabang(item.id_cabang)
    if (ok) toast.success('Cabang berhasil dihapus')
    else    toast.error('Gagal menghapus cabang')
  }
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <!-- ── BREADCRUMB ── -->
    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="table-list" /> Master Cabang
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" /> Dashboard
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Cabang Table</span>
        </div>
      </div>
    </div>

    <!-- ── TOOLBAR TOP ── -->
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
              <font-awesome-icon icon="file-csv"   style="color:#22c55e" /> Export CSV
            </button>
            <button class="drop-item" @click="exportExcel">
              <font-awesome-icon icon="file-excel" style="color:#16a34a" /> Export Excel
            </button>
            <button class="drop-item" @click="exportPDF">
              <font-awesome-icon icon="file-pdf"   style="color:#ef4444" /> Export PDF
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

    <!-- ── CONTROLS ROW ── -->
    <div class="controls-card">
      <div class="controls-row">
        <div class="controls-left">
          <div class="showing-wrap">
            <font-awesome-icon icon="list" class="text-muted-color" />
            <span class="showing-label">Showing:</span>
            <div class="drop-wrap">
              <button class="btn-select" @click="showPerPageMenu = !showPerPageMenu">
                {{ cabangStore.pagination.per_page }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showPerPageMenu }">
                <div class="drop-label">Per halaman</div>
                <div class="perpage-grid">
                  <button
                    v-for="opt in [5, 10, 25, 50]" :key="opt"
                    class="perpage-opt"
                    :class="{ active: cabangStore.pagination.per_page === opt }"
                    @click="cabangStore.pagination.per_page = opt; cabangStore.changePageSize(); showPerPageMenu = false"
                  >{{ opt }}</button>
                </div>
              </div>
            </div>
          </div>

          <button v-if="canCreate" class="btn-toolbar btn-purple" @click="openAddModal">
            <font-awesome-icon icon="plus" /> Add Data
          </button>
        </div>

        <div class="controls-right">
          <div class="search-wrap">
            <input
              v-model="cabangStore.searchCabang"
              type="text"
              placeholder="Searching...."
              class="search-input"
              @input="cabangStore.searchWithDelay()"
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
                  :class="{ active: cabangStore.sort.column === opt.value }"
                  @click="cabangStore.sort.column = opt.value; cabangStore.changeSorting(); showSortByMenu = false"
                >{{ opt.label }}</button>
              </div>
            </div>

            <div class="drop-wrap">
              <button class="btn-select" @click="showSortDirMenu = !showSortDirMenu">
                {{ cabangStore.sort.direction.toUpperCase() }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-right" :class="{ show: showSortDirMenu }">
                <div class="drop-label">Urutan</div>
                <button
                  v-for="opt in [{ label: 'DESC', value: 'desc' }, { label: 'ASC', value: 'asc' }]"
                  :key="opt.value"
                  class="drop-item"
                  :class="{ active: cabangStore.sort.direction === opt.value }"
                  @click="cabangStore.sort.direction = opt.value; cabangStore.changeSorting(); showSortDirMenu = false"
                >{{ opt.label }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── TABLE ── -->
    <div class="table-card flex-grow-1 overflow-auto mb-3">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:70px">NO.</th>
            <th>CABANG</th>
            <th>ALAMAT</th>
            <th style="width:160px">NO TELP</th>
            <th style="width:200px">CREATED</th>
            <th style="width:200px">UPDATED</th>
            <th style="width:140px; text-align:center">ACTIONS</th>
          </tr>
        </thead>
        <tbody>

          <!-- Loading -->
          <tr v-if="cabangStore.loadingCabang">
            <td colspan="7" class="td-center">
              <div style="display:flex; justify-content:center;">
                <div class="spinner-custom"></div>
              </div>
            </td>
          </tr>

          <!-- Empty -->
          <tr v-else-if="!cabangStore.cabangData.length">
            <td colspan="7" class="td-center">
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
            v-for="(item, index) in cabangStore.cabangData"
            :key="item.id_cabang"
            class="data-row"
          >
            <td class="td-no">
              {{ (cabangStore.pagination.current_page - 1) * cabangStore.pagination.per_page + index + 1 }}.
            </td>
            <td class="td-name">
              <span class="menu-badge">{{ item.cabang }}</span>
            </td>
            <td class="td-muted">{{ item.alamat || '-' }}</td>
            <td class="td-muted">{{ item.no_telp || '-' }}</td>
            <td class="td-muted">{{ cabangStore.formatDate(item.created_at) }}</td>
            <td class="td-muted">{{ cabangStore.formatDate(item.updated_at) }}</td>
            <td class="td-actions">
              <!-- Edit -->
              <button
                v-if="canUpdate"
                class="act-btn act-edit"
                title="Edit"
                @click="openEditModal(item)"
              >
                <font-awesome-icon icon="pen-to-square" />
              </button>

              <!-- Delete -->
              <button
                v-if="canDelete"
                class="act-btn act-delete"
                title="Hapus"
                :disabled="cabangStore.deletingCabang"
                @click="openDeleteModal(item)"
              >
                <font-awesome-icon icon="trash-can" />
              </button>

              <!-- Detail -->
              <button
                v-if="canView"
                class="act-btn act-info"
                title="Detail"
                @click="openDetailModal(item)"
              >
                <font-awesome-icon icon="circle-info" />
              </button>
            </td>
          </tr>

        </tbody>
      </table>
    </div>

    <!-- ── PAGINATION ── -->
    <div class="pagination-card">
      <div class="pagination-nav">
        <button
          class="btn-prev-next"
          :disabled="!cabangStore.pagination.prev_page_url || cabangStore.loadingCabang"
          @click="cabangStore.fetchCabang(cabangStore.pagination.prev_page_url)"
        >
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button
          class="btn-prev-next"
          :disabled="!cabangStore.pagination.next_page_url || cabangStore.loadingCabang"
          @click="cabangStore.fetchCabang(cabangStore.pagination.next_page_url)"
        >
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">
          {{ cabangStore.cabangData.length }} DATA | ON PAGE {{ cabangStore.pagination.current_page }}
        </span>
        <span class="page-badge">TOTAL: {{ cabangStore.pagination.total }}</span>
      </div>
    </div>

    <!-- ── MODAL ADD / EDIT ── -->
    <AppModal
      :show="isAddModalVisible"
      :title="isEdit ? 'Edit Cabang' : 'Add New Cabang'"
      :icon="isEdit ? 'pen' : 'plus'"
      size="md"
      @close="closeAddModal"
    >
      <div class="form-container-gap">
        <div class="form-group">
          <label>Cabang <span style="color:#ef4444">*</span></label>
          <input
            v-model="newCabangName"
            class="form-input"
            :class="{ 'input-error': cabangStore.errorCabang?.cabang }"
            placeholder="e.g. Palembang"
            @input="cabangStore.errorCabang = null"
          />
          <span v-if="cabangStore.errorCabang?.cabang" class="field-error">
            {{ cabangStore.errorCabang.cabang[0] }}
          </span>
        </div>

        <div class="form-group">
          <label>Alamat <span style="color:#ef4444">*</span></label>
          <textarea
            v-model="newCabangAlamat"
            class="form-input form-textarea"
            :class="{ 'input-error': cabangStore.errorCabang?.alamat }"
            rows="3"
            placeholder="e.g. Jl. AH Nasution"
            @input="cabangStore.errorCabang = null"
          ></textarea>
          <span v-if="cabangStore.errorCabang?.alamat" class="field-error">
            {{ cabangStore.errorCabang.alamat[0] }}
          </span>
        </div>

        <div class="form-group">
          <label>No Telp <span style="color:#ef4444">*</span></label>
          <input
            v-model="newCabangNoTelp"
            class="form-input"
            :class="{ 'input-error': cabangStore.errorCabang?.no_telp }"
            placeholder="e.g. 0271-2789009"
            @input="cabangStore.errorCabang = null"
          />
          <span v-if="cabangStore.errorCabang?.no_telp" class="field-error">
            {{ cabangStore.errorCabang.no_telp[0] }}
          </span>
        </div>
      </div>

      <template #footer>
        <button class="btn-cancel" :disabled="cabangStore.savingCabang || cabangStore.updatingCabang" @click="closeAddModal">
          Cancel
        </button>
        <button
          class="btn-save"
          :disabled="cabangStore.savingCabang || cabangStore.updatingCabang"
          @click="submitAddData"
        >
          <font-awesome-icon v-if="cabangStore.savingCabang || cabangStore.updatingCabang" icon="spinner" spin />
          <font-awesome-icon v-else icon="check" />
          {{ isEdit
            ? (cabangStore.updatingCabang ? 'Updating...' : 'Update')
            : (cabangStore.savingCabang   ? 'Saving...'   : 'Save Data') }}
        </button>
      </template>
    </AppModal>

    <!-- ── MODAL DETAIL ── -->
    <AppModal
      :show="isDetailModalVisible"
      title="Cabang Details"
      icon="circle-info"
      size="md"
      @close="closeDetailModal"
    >
      <div v-if="cabangStore.loadingDetail" class="td-center">
        <div class="spinner-custom" style="margin: 20px auto;"></div>
      </div>
      <div v-else-if="cabangStore.cabangDetail" class="detail-list">
        <div class="detail-row">
          <span class="detail-label">Cabang ID</span>
          <span class="detail-value mono">#{{ cabangStore.cabangDetail.id_cabang }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Cabang</span>
          <span class="detail-badge">{{ cabangStore.cabangDetail.cabang }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Alamat</span>
          <span class="detail-value">{{ cabangStore.cabangDetail.alamat || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">No Telp</span>
          <span class="detail-value">{{ cabangStore.cabangDetail.no_telp || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Created At</span>
          <span class="detail-value">{{ cabangStore.formatDate(cabangStore.cabangDetail.created_at) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Updated At</span>
          <span class="detail-value">{{ cabangStore.formatDate(cabangStore.cabangDetail.updated_at) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status</span>
          <span class="badge-active">Active</span>
        </div>
      </div>
      <div v-else class="td-center">Data tidak tersedia</div>
      <template #footer>
        <button class="btn-cancel" @click="closeDetailModal">Close</button>
      </template>
    </AppModal>

  </div>
</template>

<style scoped>
/* ── CSS VARIABLES ── */
.h-100 {
  --text-muted:    #64748b;
  --primary-color: #6366f1;
}

.form-container-gap { display: flex; flex-direction: column; gap: 14px; }

/* ── BREADCRUMB ── */
.breadcrumb-card { background: var(--bg-card); border-radius: 10px; padding: 16px 18px; box-shadow: 0 1px 3px var(--shadow-color); }
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

/* ── TOOLBAR TOP ── */
.toolbar-top { display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); border-radius: 10px; padding: 12px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); flex-wrap: wrap; gap: 8px; }
.toolbar-left { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-toolbar { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: none; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; transition: all 0.18s ease; white-space: nowrap; }
.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover { background: #4f46e5; }
.btn-orange { background: #f59e0b; color: #fff; }
.btn-orange:hover { background: #d97706; }
.btn-arrow { font-size: 0.6rem; opacity: 0.7; }

/* ── CONTROLS ── */
.controls-card { background: var(--bg-card); border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); }
.controls-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.controls-left, .controls-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.showing-wrap { display: flex; align-items: center; gap: 6px; font-size: 0.84rem; color: var(--text-primary); font-weight: 600; }
.showing-label { white-space: nowrap; color: var(--text-muted); font-size: 0.83rem; }
.text-muted-color { color: var(--text-muted); }
.search-wrap { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.search-input { padding: 7px 12px; border: none; background: transparent; color: var(--text-primary); font-size: 0.84rem; outline: none; width: 180px; }
.search-input::placeholder { color: var(--text-muted); }
.search-btn { padding: 7px 12px; background: #6366f1; color: #fff; border: none; cursor: pointer; }
.search-btn:hover { background: #4f46e5; }
.sort-wrap { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

/* ── DROPDOWN ── */
.drop-wrap { position: relative; }
.btn-select { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.83rem; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
.btn-select:hover { border-color: #6366f1; color: #6366f1; }
.drop-menu { position: absolute; top: calc(100% + 6px); left: 0; min-width: 160px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 10px; z-index: 300; opacity: 0; transform: translateY(-6px); pointer-events: none; transition: all 0.18s ease; }
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

/* ── TABLE ── */
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

.menu-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 0.82rem; font-weight: 600; background: rgba(99,102,241,0.08); color: #4f46e5; border: 1px solid rgba(99,102,241,0.15); }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.empty-img   { width: 160px; opacity: 0.85; border-radius: 8px; }
.empty-text  { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }

.spinner-custom { width: 32px; height: 32px; border: 3px solid var(--border-main); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── ACTION BUTTONS ── */
.act-btn { width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s ease; margin: 0 2px; background: transparent; }
.act-btn:disabled { opacity: 0.4; cursor: not-allowed; }
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

@media (max-width: 576px) {
  .pagination-card { flex-direction: column; padding: 12px; gap: 12px; }
  .pagination-nav { width: 100%; justify-content: space-between; }
  .btn-prev-next { flex: 1; max-width: 48%; padding: 10px 14px; }
  .page-badges { width: 100%; justify-content: center; flex-wrap: wrap; }
  .page-badge { flex: 1; text-align: center; font-size: 0.7rem; }
}

/* ── FORM ── */
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.form-input { padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.875rem; background: var(--bg-input); color: var(--text-primary); outline: none; transition: border 0.18s; width: 100%; box-sizing: border-box; }
.form-input:focus { border-color: #6366f1; }
.form-textarea { resize: none; min-height: 70px; line-height: 1.5; }
.input-error { border-color: #ef4444 !important; }
.field-error { font-size: 0.75rem; color: #ef4444; margin-top: 2px; }

/* ── MODAL FOOTER BUTTONS ── */
.btn-cancel { padding: 8px 18px; background: var(--bg-main, #f1f5f9); color: var(--text-muted); border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
.btn-cancel:hover:not(:disabled) { background: var(--border-main); color: var(--text-primary); }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.18s; }
.btn-save:hover:not(:disabled) { background: #4f46e5; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── DETAIL MODAL ── */
.detail-list { display: flex; flex-direction: column; }
.detail-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-main); gap: 12px; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.detail-value { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); }
.mono { font-family: monospace; font-weight: 700; }
.detail-badge { font-size: 0.82rem; font-weight: 600; padding: 3px 12px; border-radius: 6px; background: rgba(99,102,241,0.1); color: #6366f1; border: 1px solid rgba(99,102,241,0.2); }
.badge-active { font-size: 0.75rem; font-weight: 600; padding: 3px 10px; border-radius: 99px; background: rgba(34,197,94,0.1); color: #16a34a; }
</style>