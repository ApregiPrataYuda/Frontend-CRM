<script setup>
import { ref, onMounted, computed } from 'vue'
import AppModal from '@/components/AppModal.vue'
import { useConfirm } from '@/composables/useConfirm'
import { useCustomersBranchApprovalStore } from '@/stores/customersBranchStore'
import { storeToRefs } from 'pinia'

const { confirm } = useConfirm()
const store = useCustomersBranchApprovalStore()

const {
  branchesData, loadingBranches, searchBranches,
  pagination, sort, approvalStatus,
  approvingBranch, rejectingBranch,
} = storeToRefs(store)

// ── VIEW MODE (CARD / TABLE) ──────────────────────────
const VIEW_MODE_KEY = 'branch_approval_view_mode'
const viewMode = ref(localStorage.getItem(VIEW_MODE_KEY) || 'card')

function setViewMode(mode) {
  viewMode.value = mode
  localStorage.setItem(VIEW_MODE_KEY, mode)
}

// ── AVATAR HELPERS (samakan dengan halaman customer) ──
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
onMounted(() => {
  store.fetchBranches()
})

// ── TOOLBAR TOGGLES ───────────────────────────────────
const showPerPage  = ref(false)
const showSortBy   = ref(false)
const showSortDir  = ref(false)
const showFilter   = ref(false)

const sortByOptions = [
  { label: 'Created Date', value: 'created_at' },
  { label: 'Branch Name',  value: 'branch_name' },
  { label: 'Company Name', value: 'company_name' },
]
const sortByLabel = () =>
  sortByOptions.find(o => o.value === store.sort.column)?.label ?? 'Created Date'

const filterOptions = [
  { label: 'Semua',    value: 'all' },
  { label: 'Pending',  value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]
const filterLabel = () =>
  filterOptions.find(o => o.value === store.approvalStatus)?.label ?? 'Semua'

// ── TOAST ─────────────────────────────────────────────
const toast      = ref({ show: false, type: '', message: '' })
let   toastTimer = null

function showToast(type, message) {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { show: true, type, message }
  toastTimer  = setTimeout(() => { toast.value.show = false }, 3000)
}

// ── APPROVE ───────────────────────────────────────────
async function handleApprove(item) {
  const isConfirmed = await confirm({
    type       : 'success',
    title      : 'Setujui Cabang',
    message    : `Setujui cabang "${item.branch_name}" untuk ${item.company_name}?`,
    detail     : 'Cabang ini akan aktif dan terlihat oleh sales setelah disetujui.',
    confirmText: 'Ya, Setujui',
    cancelText : 'Cancel',
  })
  if (!isConfirmed) return

  try {
    await store.approveBranch(item.id)
    showToast('success', 'Cabang berhasil disetujui!')
  } catch {
    showToast('error', 'Gagal menyetujui cabang, coba lagi.')
  }
}

// ── REJECT (dengan modal alasan) ──────────────────────
const isRejectModalVisible = ref(false)
const rejectTarget         = ref(null)
const rejectNote            = ref('')
const rejectError          = ref(null)

function openRejectModal(item) {
  rejectTarget.value = item
  rejectNote.value    = ''
  rejectError.value   = null
  isRejectModalVisible.value = true
}

function closeRejectModal() {
  isRejectModalVisible.value = false
  rejectTarget.value = null
  rejectNote.value    = ''
  rejectError.value   = null
}

async function submitReject() {
  if (!rejectNote.value.trim()) {
    rejectError.value = 'Alasan penolakan wajib diisi.'
    return
  }
  try {
    await store.rejectBranch(rejectTarget.value.id, rejectNote.value.trim())
    showToast('success', 'Cabang berhasil ditolak.')
    closeRejectModal()
  } catch {
    showToast('error', 'Gagal menolak cabang, coba lagi.')
  }
}

// ── DETAIL MODAL ──────────────────────────────────────
const isDetailModalVisible = ref(false)
const detailItem           = ref(null)

function openDetailModal(item) {
  detailItem.value = item
  isDetailModalVisible.value = true
}
function closeDetailModal() {
  isDetailModalVisible.value = false
  detailItem.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <!-- ═══ BREADCRUMB ═══ -->
    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="code-branch" /> Approval Cabang
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" /> Home
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Approval Cabang</span>
        </div>
      </div>
    </div>

    <!-- ═══ CONTROLS ROW ═══ -->
    <div class="controls-card">
      <div class="controls-row">
        <div class="controls-left">
          <div class="showing-wrap">
            <font-awesome-icon icon="list" class="text-muted-color" />
            <span class="showing-label">Showing:</span>
            <div class="drop-wrap">
              <button class="btn-select" @click="showPerPage = !showPerPage">
                {{ store.pagination.per_page }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showPerPage }">
                <div class="drop-label">Per Halaman</div>
                <div class="perpage-grid">
                  <button
                    v-for="opt in [5, 10, 25, 50]" :key="opt"
                    class="perpage-opt"
                    :class="{ active: store.pagination.per_page === opt }"
                    @click="store.pagination.per_page = opt; showPerPage = false; store.changePageSize()"
                  >{{ opt }}</button>
                </div>
              </div>
            </div>
          </div>

          <!-- ═══ VIEW MODE TOGGLE ═══ -->
          <div class="view-toggle">
            <button
              class="view-toggle-btn"
              :class="{ active: viewMode === 'card' }"
              @click="setViewMode('card')"
            >
              <font-awesome-icon icon="table-cells" /> Card
            </button>
            <button
              class="view-toggle-btn"
              :class="{ active: viewMode === 'table' }"
              @click="setViewMode('table')"
            >
              <font-awesome-icon icon="list" /> Table
            </button>
          </div>

          <!-- ═══ FILTER STATUS ═══ -->
          <div class="drop-wrap">
            <button class="btn-select" @click="showFilter = !showFilter">
              <font-awesome-icon icon="filter" /> {{ filterLabel() }}
              <font-awesome-icon icon="chevron-down" class="btn-arrow" />
            </button>
            <div class="drop-menu" :class="{ show: showFilter }">
              <div class="drop-label">Filter Status</div>
              <button
                v-for="opt in filterOptions" :key="opt.value"
                class="drop-item"
                :class="{ active: store.approvalStatus === opt.value }"
                @click="store.changeApprovalStatus(opt.value); showFilter = false"
              >{{ opt.label }}</button>
            </div>
          </div>

          <button class="btn-toolbar btn-orange" @click="store.resetFilters()">
            <font-awesome-icon icon="rotate-left" /> Reset
          </button>
        </div>

        <div class="controls-right">
          <div class="search-wrap">
            <input
              :value="store.searchBranches"
              type="text"
              placeholder="Search Branch / Company..."
              class="search-input"
              @input="store.searchWithDelay($event.target.value)"
            />
            <button class="search-btn"><font-awesome-icon icon="magnifying-glass" /></button>
          </div>
          <div class="sort-wrap">
            <span class="showing-label">Sort:</span>
            <div class="drop-wrap">
              <button class="btn-select" @click="showSortBy = !showSortBy">
                {{ sortByLabel() }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showSortBy }">
                <div class="drop-label">Sort By</div>
                <button
                  v-for="opt in sortByOptions" :key="opt.value"
                  class="drop-item"
                  :class="{ active: store.sort.column === opt.value }"
                  @click="store.toggleSort(opt.value); showSortBy = false"
                >{{ opt.label }}</button>
              </div>
            </div>
            <div class="drop-wrap">
              <button class="btn-select" @click="showSortDir = !showSortDir">
                {{ store.sort.direction === 'asc' ? 'Asc' : 'Desc' }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-right" :class="{ show: showSortDir }">
                <div class="drop-label">Urutan</div>
                <button
                  v-for="opt in ['desc', 'asc']" :key="opt"
                  class="drop-item"
                  :class="{ active: store.sort.direction === opt }"
                  @click="store.sort.direction = opt; store.changeSorting(); showSortDir = false"
                >{{ opt === 'asc' ? 'Asc' : 'Desc' }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ CONTENT ═══ -->
    <div class="content-card flex-grow-1 overflow-auto mb-3">

      <div v-if="store.loadingBranches" class="state-wrap">
        <div class="spinner-custom"></div>
      </div>

      <div v-else-if="!store.branchesData.length" class="state-wrap">
        <div class="empty-state">
          <h5 class="empty-title">Tidak Ada Data</h5>
          <p class="empty-text">Belum ada pengajuan cabang untuk kategori ini.</p>
        </div>
      </div>

      <!-- ═══ CARD VIEW ═══ -->
      <div v-else-if="viewMode === 'card'" class="customer-grid">
        <div v-for="item in store.branchesData" :key="item.id" class="customer-card">
          <div class="cc-top">
            <div class="cc-avatar" :style="{ background: getAvatarColor(item.branch_name) }">
              {{ getInitials(item.branch_name) }}
            </div>
            <div class="cc-headinfo">
              <div class="cc-name" :title="item.branch_name">{{ item.branch_name }}</div>
              <div class="cc-code">{{ item.company_name }} · {{ item.customer_code }}</div>
            </div>
            <div class="cc-break"></div>
            <span class="status-badge cc-status" :class="store.getApprovalConfig(item.approval_status).label">
              {{ store.getApprovalConfig(item.approval_status).text }}
            </span>
          </div>

          <div class="cc-body">
            <div class="cc-row">
              <font-awesome-icon icon="location-dot" class="cc-icon" />
              <span>{{ item.address || item.city || '-' }}</span>
            </div>
            <div class="cc-row">
              <font-awesome-icon icon="user" class="cc-icon" />
              <span>Diajukan oleh: {{ item.created_by_name ?? '-' }}</span>
            </div>
          </div>

          <div class="cc-tags">
            <span v-if="item.is_main_branch" class="detail-badge">Cabang Utama</span>
          </div>

          <div class="cc-footer">
            <span class="cc-date">
              <font-awesome-icon icon="calendar" /> {{ store.formatDate(item.created_at) }}
            </span>
            <div class="cc-actions">
              <template v-if="item.approval_status === 'pending'">
                <button class="act-btn act-approve" title="Setujui" @click="handleApprove(item)">
                  <font-awesome-icon icon="check" />
                </button>
                <button class="act-btn act-delete" title="Tolak" @click="openRejectModal(item)">
                  <font-awesome-icon icon="xmark" />
                </button>
              </template>
              <button class="act-btn act-info" title="Detail" @click="openDetailModal(item)">
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
            <th>Cabang</th>
            <th>Company</th>
            <th>Diajukan Oleh</th>
            <th>Status</th>
            <th style="width:150px; text-align:center">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in store.branchesData" :key="item.id" class="data-row">
            <td class="td-no">
              {{ (store.pagination.current_page - 1) * store.pagination.per_page + index + 1 }}.
            </td>
            <td class="td-name">
              <span class="fw-bold">{{ item.branch_name }}</span>
              <div class="td-sub" v-if="item.is_main_branch">Cabang Utama</div>
            </td>
            <td class="td-name">
              {{ item.company_name }}
              <div class="td-sub">{{ item.customer_code }}</div>
            </td>
            <td class="td-name">{{ item.created_by_name ?? '-' }}</td>
            <td class="td-name">
              <span class="status-badge" :class="store.getApprovalConfig(item.approval_status).label">
                {{ store.getApprovalConfig(item.approval_status).text }}
              </span>
            </td>
            <td class="td-actions">
              <template v-if="item.approval_status === 'pending'">
                <button class="act-btn act-approve" title="Setujui" @click="handleApprove(item)">
                  <font-awesome-icon icon="check" />
                </button>
                <button class="act-btn act-delete" title="Tolak" @click="openRejectModal(item)">
                  <font-awesome-icon icon="xmark" />
                </button>
              </template>
              <button class="act-btn act-info" title="Detail" @click="openDetailModal(item)">
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
          @click="store.fetchBranches(store.pagination.prev_page_url)">
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button class="btn-prev-next" :disabled="store.pagination.current_page === store.pagination.last_page"
          @click="store.fetchBranches(store.pagination.next_page_url)">
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">{{ store.branchesData.length }} DATA | PAGE {{ store.pagination.current_page }}</span>
        <span class="page-badge">TOTAL: {{ store.pagination.total }}</span>
      </div>
    </div>


    <!-- ═══ MODAL REJECT ═══ -->
    <AppModal :show="isRejectModalVisible" title="Tolak Cabang" icon="xmark" size="sm" @close="closeRejectModal">
      <div class="form-container-gap">
        <p style="font-size:0.85rem;color:var(--text-muted);margin:0;">
          Anda akan menolak cabang <strong>{{ rejectTarget?.branch_name }}</strong>
          untuk <strong>{{ rejectTarget?.company_name }}</strong>.
        </p>
        <div class="form-group">
          <label>Alasan Penolakan <span class="required">*</span></label>
          <textarea
            v-model="rejectNote"
            class="form-input form-textarea"
            rows="3"
            placeholder="Jelaskan alasan penolakan..."
          />
          <span v-if="rejectError" class="form-error">{{ rejectError }}</span>
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeRejectModal">Cancel</button>
        <button class="btn-save" style="background:#ef4444" :disabled="rejectingBranch" @click="submitReject">
          <font-awesome-icon v-if="rejectingBranch" icon="spinner" spin />
          <font-awesome-icon v-else icon="xmark" />
          {{ rejectingBranch ? 'Menolak...' : 'Tolak Cabang' }}
        </button>
      </template>
    </AppModal>


    <!-- ═══ MODAL DETAIL ═══ -->
    <AppModal :show="isDetailModalVisible" title="Detail Cabang" icon="circle-info" size="md" @close="closeDetailModal">
      <template v-if="detailItem">
        <div class="detail-banner">
          <span class="detail-banner-code">{{ detailItem.customer_code }}</span>
          <h3 class="detail-banner-name">{{ detailItem.branch_name }}</h3>
          <span class="detail-banner-industry">{{ detailItem.company_name }}</span>
        </div>
        <div class="detail-list">
          <div class="detail-section-label">Informasi Cabang</div>
          <div class="detail-row">
            <span class="detail-label">Alamat</span>
            <span class="detail-value">{{ detailItem.address ?? '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Kota</span>
            <span class="detail-value">{{ detailItem.city ?? '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Sales</span>
            <span class="detail-value">{{ detailItem.assigned_name ?? 'Belum ditentukan' }}</span>
          </div>

          <div class="detail-section-label">Approval</div>
          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="status-badge" :class="store.getApprovalConfig(detailItem.approval_status).label">
              {{ store.getApprovalConfig(detailItem.approval_status).text }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Diajukan Oleh</span>
            <span class="detail-value">{{ detailItem.created_by_name ?? '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Diajukan Pada</span>
            <span class="detail-value">{{ store.formatDate(detailItem.submitted_for_approval_at) }}</span>
          </div>
          <div v-if="detailItem.approval_status !== 'pending'" class="detail-row">
            <span class="detail-label">Diproses Oleh</span>
            <span class="detail-value">{{ detailItem.approved_name ?? '-' }}</span>
          </div>
          <div v-if="detailItem.approval_status === 'rejected' && detailItem.approval_note" class="si-reject-note">
            <font-awesome-icon icon="circle-exclamation" />
            <div>
              <div class="si-reject-label">Alasan Ditolak:</div>
              <div class="si-reject-text">{{ detailItem.approval_note }}</div>
            </div>
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
              :icon="toast.type === 'success' ? 'circle-check' : 'circle-xmark'"
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

/* ── BREADCRUMB ── */
.breadcrumb-card { background: var(--bg-card); border-radius: 10px; padding: 16px 18px; box-shadow: 0 1px 3px var(--shadow-color); }
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

.btn-toolbar { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: none; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; transition: all 0.18s ease; white-space: nowrap; }
.btn-orange { background: #f59e0b; color: #fff; }
.btn-orange:hover { background: #d97706; }
.btn-arrow { font-size: 0.6rem; opacity: 0.7; }

/* ── SPINNER & EMPTY ── */
.state-wrap { display: flex; justify-content: center; padding: 40px 0; }
.spinner-custom { width: 2rem; height: 2rem; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 24px 0; gap: 8px; }
.empty-title{ margin-top:12px; margin-bottom:6px; font-size:20px; font-weight:700; color:var(--text-primary); }
.empty-text{ max-width:420px; text-align:center; color:var(--text-muted); line-height:1.6; }

/* ── CONTROLS ── */
.controls-card { background: var(--bg-card); border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); }
.controls-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.controls-left, .controls-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.showing-wrap { display: flex; align-items: center; gap: 6px; font-size: 0.84rem; color: var(--text-primary); font-weight: 600; }
.showing-label { white-space: nowrap; color: var(--text-muted); font-size: 0.83rem; }
.text-muted-color { color: var(--text-muted); }
.search-wrap { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.search-input { padding: 7px 12px; border: none; background: transparent; color: var(--text-primary); font-size: 0.84rem; outline: none; width: 220px; }
.search-input::placeholder { color: var(--text-muted); }
.search-btn { padding: 7px 12px; background: #6366f1; color: #fff; border: none; cursor: pointer; }
.search-btn:hover { background: #4f46e5; }
.sort-wrap { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

/* ── VIEW TOGGLE ── */
.view-toggle { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.view-toggle-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; background: transparent; border: none; color: var(--text-muted); font-size: 0.83rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; white-space: nowrap; }
.view-toggle-btn + .view-toggle-btn { border-left: 1px solid var(--border-main); }
.view-toggle-btn:hover:not(.active) { color: #6366f1; }
.view-toggle-btn.active { background: #6366f1; color: #fff; }

/* ── DROPDOWN ── */
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

/* ── CONTENT ── */
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
.td-sub { color: var(--text-muted); font-size: 0.78rem; margin-top: 2px; }
.td-actions { text-align: center; white-space: nowrap; }
.fw-bold { font-weight: 700; }
.status-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
.act-btn { width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s ease; margin: 0 2px; background: transparent; }
.act-approve      { color: #22c55e; border-color: #22c55e; }
.act-approve:hover{ background: #22c55e; color: #fff; }
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

/* ── FORM ── */
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.required { color: #ef4444; }
.form-input { padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.875rem; background: var(--bg-input); color: var(--text-primary); outline: none; transition: border 0.18s; width: 100%; box-sizing: border-box; }
.form-input:focus { border-color: #6366f1; }
.form-textarea { resize: none; min-height: 70px; line-height: 1.5; }
.form-error { font-size: 0.75rem; color: #ef4444; }

/* ── MODAL BUTTONS ── */
.btn-cancel { padding: 8px 18px; background: var(--bg-main, #f1f5f9); color: var(--text-muted); border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
.btn-cancel:hover { background: var(--border-main); color: var(--text-primary); }
.btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.18s; }
.btn-save:hover:not(:disabled) { filter: brightness(0.92); }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

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

.si-reject-note { display: flex; gap: 8px; margin-top: 10px; padding: 10px 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #b91c1c; font-size: 0.82rem; }
.si-reject-label { font-weight: 700; margin-bottom: 2px; }
.si-reject-text { line-height: 1.5; }

/* ── TOAST ── */
.toast-wrap { position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 260px; max-width: 360px; }
.toast-box { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 12px; border: 1px solid; box-shadow: 0 8px 24px rgba(0,0,0,0.12); position: relative; overflow: hidden; }
.toast-success { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
.toast-error   { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
.toast-icon { margin-top: 2px; flex-shrink: 0; }
.toast-msg { flex: 1; font-size: 0.875rem; font-weight: 500; }
.toast-close { background: none; border: none; cursor: pointer; color: inherit; opacity: 0.5; font-size: 0.8rem; }
.toast-close:hover { opacity: 1; }
.toast-progress { position: absolute; bottom: 0; left: 0; height: 3px; animation: shrink 3s linear forwards; }
.progress-success { background: #22c55e; }
.progress-error   { background: #ef4444; }
@keyframes shrink { from { width: 100%; } to { width: 0%; } }
.toast-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from { opacity: 0; transform: translateY(-16px) scale(0.95); }
.toast-leave-to { opacity: 0; transform: translateY(-8px) scale(0.97); }

@media (max-width: 768px) {
  .controls-card { padding: 12px; }
  .controls-row { flex-direction: column; align-items: stretch; gap: 10px; }
  .controls-left, .controls-right { width: 100%; justify-content: flex-start; flex-wrap: wrap; }
  .search-wrap { width: 100%; }
  .search-input { width: 100%; }
}

@media (max-width: 576px) {
  .customer-grid { grid-template-columns: 1fr; padding: 10px; gap: 10px; }
  .customer-card { padding: 12px; gap: 8px; }
  .cc-avatar { width: 38px; height: 38px; font-size: 0.78rem; }
  .cc-name { white-space: normal; overflow: visible; text-overflow: unset; line-height: 1.3; font-size: 0.88rem; }
  .cc-status { flex-basis: auto; margin-left: 48px; }
  .cc-break { display: block; flex-basis: 100%; width: 0; height: 0; }
  .pagination-card { flex-direction: column; padding: 12px; gap: 12px; }
  .pagination-nav { width: 100%; justify-content: space-between; }
  .btn-prev-next { flex: 1; max-width: 48%; padding: 10px 14px; }
  .page-badges { width: 100%; justify-content: center; flex-wrap: wrap; }
  .page-badge { flex: 1; text-align: center; font-size: 0.7rem; }
  .btn-cancel, .btn-save { width: 100%; justify-content: center; }
}
</style>