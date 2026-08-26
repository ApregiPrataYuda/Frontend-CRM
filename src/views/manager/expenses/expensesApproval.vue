<script setup>
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from 'vue-toastification'
import AppModal from '@/components/AppModal.vue'
import { useExpenseApprovalStore } from '@/stores/expenseApprovalStore'

const toast = useToast()
const store = useExpenseApprovalStore()

const {
  filterStatus, filterCategory, searchQuery,
  expenseData, loadingExpense, pagination,
  summaryData, loadingSummary,
  categoryOptions,
  expenseDetail, loadingDetail, loadingAction,
} = storeToRefs(store)

onMounted(() => {
  store.fetchExpenses(store.buildUrl())
  store.fetchSummary()
  store.fetchCategoryOptions()
})

// ── DROPDOWN TOGGLES ──
const showStatusMenu   = ref(false)
const showCategoryMenu = ref(false)

const statusLabelMap = { pending: 'Pending', approved: 'Approved', rejected: 'Ditolak' }
const statusLabel   = computed(() => filterStatus.value ? (statusLabelMap[filterStatus.value] ?? filterStatus.value) : 'Semua Status')
const categoryLabel = computed(() => filterCategory.value || 'Semua Kategori')

// ════════════════════════════════════════════
// DETAIL MODAL
// ════════════════════════════════════════════
const showDetailModal = ref(false)
async function openDetail(id) {
  showDetailModal.value = true
  await store.fetchDetail(id)
}
function closeDetail() {
  showDetailModal.value = false
  store.expenseDetail = null
}

// ════════════════════════════════════════════
// APPROVE
// ════════════════════════════════════════════
async function approveExpense(item) {
  const result = await store.approveExpense(item.id)
  if (result.success) {
    toast.success(result.message)
    store.fetchExpenses(store.buildUrl())
    store.fetchSummary()
    if (showDetailModal.value && expenseDetail.value?.id === item.id) {
      await store.fetchDetail(item.id)
    }
  } else {
    toast.error(result.message)
  }
}

// ════════════════════════════════════════════
// REJECT (butuh alasan via modal)
// ════════════════════════════════════════════
const showRejectModal = ref(false)
const rejectTarget = ref(null)
const rejectReason = ref('')

function openRejectModal(item) {
  rejectTarget.value = item
  rejectReason.value = ''
  showRejectModal.value = true
}
function closeRejectModal() {
  if (loadingAction.value) return
  showRejectModal.value = false
  rejectTarget.value = null
  rejectReason.value = ''
}
const isRejectValid = computed(() => rejectReason.value.trim().length > 0)

async function submitReject() {
  if (!isRejectValid.value || !rejectTarget.value) return
  const result = await store.rejectExpense(rejectTarget.value.id, rejectReason.value.trim())
  if (result.success) {
    toast.success(result.message)
    closeRejectModal()
    store.fetchExpenses(store.buildUrl())
    store.fetchSummary()
    if (showDetailModal.value) closeDetail()
  } else {
    toast.error(result.message)
  }
}

// ════════════════════════════════════════════
// RETRY PUSH KE ODOO (buat expense approved yang odoo_push_status='failed')
// ════════════════════════════════════════════
async function retryPush(item) {
  const result = await store.retryPushExpense(item.id)
  if (result.success) {
    toast.success(result.message)
  } else {
    toast.error(result.message)
  }
  store.fetchExpenses(store.buildUrl())
  store.fetchSummary()
  if (showDetailModal.value && expenseDetail.value?.id === item.id) {
    await store.fetchDetail(item.id)
  }
}

function statusBadgeClass(status) {
  return { pending: 'status-pending', approved: 'status-approved', rejected: 'status-rejected' }[status] ?? ''
}
function odooBadge(item) {
  if (item.status !== 'approved') return { icon: 'minus', cls: 'odoo-na', text: '-' }
  if (item.odoo_push_status === 'pushed') return { icon: 'circle-check', cls: 'odoo-ok', text: 'Terkirim ke Odoo' }
  if (item.odoo_push_status === 'failed') return { icon: 'circle-exclamation', cls: 'odoo-fail', text: 'Gagal push' }
  return { icon: 'clock', cls: 'odoo-na', text: 'Menunggu' }
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <!-- BREADCRUMB -->
    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title"><font-awesome-icon icon="money-check-dollar" /> Approval Expenses</h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item"><font-awesome-icon icon="house" /> Dashboard</span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Approval Expenses</span>
        </div>
      </div>
    </div>

    <!-- SUMMARY -->
    <div class="summary-grid mb-2">
      <div class="summary-card warn">
        <p class="summary-label">Menunggu Approval</p>
        <p class="summary-value amber">{{ summaryData.total_pending }}</p>
      </div>
      <div class="summary-card">
        <p class="summary-label">Disetujui</p>
        <p class="summary-value green">{{ summaryData.total_approved }}</p>
      </div>
      <div class="summary-card">
        <p class="summary-label">Ditolak</p>
        <p class="summary-value red">{{ summaryData.total_rejected }}</p>
      </div>
      <div class="summary-card" :class="{ danger: summaryData.total_failed_push > 0 }">
        <p class="summary-label">Push ke Odoo Gagal</p>
        <p class="summary-value" :class="summaryData.total_failed_push > 0 ? 'red' : ''">{{ summaryData.total_failed_push }}</p>
      </div>
      <div class="summary-card">
        <p class="summary-label">Total Nominal Disetujui</p>
        <p class="summary-value">{{ store.formatCurrency(summaryData.total_amount_approved) }}</p>
      </div>
    </div>

    <!-- CONTROLS -->
    <div class="controls-card mb-2">
      <div class="controls-row">
        <div class="controls-left">
          <div class="drop-wrap">
            <button class="btn-select" @click="showStatusMenu = !showStatusMenu">
              {{ statusLabel }} <font-awesome-icon icon="chevron-down" class="btn-arrow" />
            </button>
            <div class="drop-menu" :class="{ show: showStatusMenu }">
              <button class="drop-item" :class="{ active: !filterStatus }" @click="store.changeStatusFilter(''); showStatusMenu = false">Semua Status</button>
              <button class="drop-item" :class="{ active: filterStatus === 'pending' }" @click="store.changeStatusFilter('pending'); showStatusMenu = false">Pending</button>
              <button class="drop-item" :class="{ active: filterStatus === 'approved' }" @click="store.changeStatusFilter('approved'); showStatusMenu = false">Approved</button>
              <button class="drop-item" :class="{ active: filterStatus === 'rejected' }" @click="store.changeStatusFilter('rejected'); showStatusMenu = false">Ditolak</button>
            </div>
          </div>

          <div class="drop-wrap">
            <button class="btn-select" @click="showCategoryMenu = !showCategoryMenu">
              {{ categoryLabel }} <font-awesome-icon icon="chevron-down" class="btn-arrow" />
            </button>
            <div class="drop-menu" :class="{ show: showCategoryMenu }">
              <button class="drop-item" :class="{ active: !filterCategory }" @click="store.changeCategoryFilter(''); showCategoryMenu = false">Semua Kategori</button>
              <button v-for="opt in categoryOptions" :key="opt.value" class="drop-item" :class="{ active: filterCategory === opt.value }" @click="store.changeCategoryFilter(opt.value); showCategoryMenu = false">{{ opt.label }}</button>
            </div>
          </div>
        </div>
        <div class="controls-right">
          <div class="search-wrap">
            <input v-model="searchQuery" @input="store.searchWithDelay(searchQuery)" type="text" placeholder="Cari nama sales / keterangan..." class="search-input" />
            <button class="search-btn"><font-awesome-icon icon="magnifying-glass" /></button>
          </div>
        </div>
      </div>
    </div>

    <!-- TABLE -->
    <div class="table-card flex-grow-1 overflow-auto mb-3">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:50px">NO.</th>
            <th>Sales</th><th>Tanggal</th><th>Kategori</th><th>Nominal</th>
            <th>Keterangan</th><th>Kunjungan</th><th>Status</th><th>Odoo</th>
            <th style="width:150px; text-align:center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loadingExpense"><td colspan="10" class="td-center"><div class="spinner-custom" style="margin:0 auto"></div></td></tr>
          <tr v-else-if="expenseData.length === 0"><td colspan="10" class="td-center">Tidak ada data expense</td></tr>
          <tr v-else v-for="(item, index) in expenseData" :key="item.id" class="data-row">
            <td class="td-no">{{ index + 1 + pagination.per_page * (pagination.current_page - 1) }}.</td>
            <td class="td-name">{{ item.sales_name ?? '-' }}</td>
            <td class="td-muted">{{ store.formatDate(item.expense_date) }}</td>
            <td><span class="cat-chip">{{ item.category }}</span></td>
            <td class="amount">{{ store.formatCurrency(item.amount) }}</td>
            <td class="td-muted" style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap" :title="item.description">{{ item.description || '-' }}</td>
            <td class="td-muted">{{ item.location_name ?? '-' }}</td>
            <td><span class="status-badge" :class="statusBadgeClass(item.status)">{{ statusLabelMap[item.status] ?? item.status }}</span></td>
            <td>
              <span class="odoo-badge" :class="odooBadge(item).cls" :title="item.odoo_push_error || ''">
                <font-awesome-icon :icon="odooBadge(item).icon" /> {{ odooBadge(item).text }}
              </span>
            </td>
            <td class="td-actions">
              <button class="act-btn act-info" title="Detail" @click="openDetail(item.id)"><font-awesome-icon icon="eye" /></button>
              <template v-if="item.status === 'pending'">
                <button class="act-btn act-approve" title="Approve" :disabled="loadingAction" @click="approveExpense(item)"><font-awesome-icon icon="check" /></button>
                <button class="act-btn act-delete" title="Reject" :disabled="loadingAction" @click="openRejectModal(item)"><font-awesome-icon icon="xmark" /></button>
              </template>
              <button v-if="item.status === 'approved' && item.odoo_push_status === 'failed'" class="act-btn act-retry" title="Kirim Ulang ke Odoo" :disabled="loadingAction" @click="retryPush(item)">
                <font-awesome-icon icon="rotate-right" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PAGINATION -->
    <div class="pagination-card">
      <div class="pagination-nav">
        <button class="btn-prev-next" :disabled="!pagination.prev_page_url" @click="store.fetchExpenses(pagination.prev_page_url)"><font-awesome-icon icon="circle-left" /> Prev</button>
        <button class="btn-prev-next" :disabled="!pagination.next_page_url" @click="store.fetchExpenses(pagination.next_page_url)">Next <font-awesome-icon icon="circle-right" /></button>
      </div>
      <div class="page-badges">
        <span class="page-badge">Page {{ pagination.current_page }} / {{ pagination.last_page }}</span>
        <span class="page-badge">TOTAL: {{ pagination.total }}</span>
      </div>
    </div>

    <!-- ══════════════ MODAL: DETAIL ══════════════ -->
    <AppModal :show="showDetailModal" title="Detail Expense" icon="circle-info" size="md" @close="closeDetail">
      <div v-if="loadingDetail" class="td-center"><div class="spinner-wrap"><div class="spinner"></div><span>Loading...</span></div></div>
      <div v-else-if="expenseDetail" class="detail-list">
        <div class="detail-row"><span class="detail-label">Sales</span><span class="detail-value">{{ expenseDetail.sales_name ?? '-' }}</span></div>
        <div class="detail-row"><span class="detail-label">Tanggal</span><span class="detail-value">{{ store.formatDate(expenseDetail.expense_date) }}</span></div>
        <div class="detail-row"><span class="detail-label">Kategori</span><span class="cat-chip">{{ expenseDetail.category }}</span></div>
        <div class="detail-row"><span class="detail-label">Nominal</span><span class="detail-value">{{ store.formatCurrency(expenseDetail.amount) }}</span></div>
        <div class="detail-row" style="flex-direction:column; align-items:flex-start; gap:6px">
          <span class="detail-label">Keterangan</span>
          <div style="font-size:0.85rem">{{ expenseDetail.description || '-' }}</div>
        </div>
        <div class="detail-row"><span class="detail-label">Kunjungan</span><span class="detail-value">{{ expenseDetail.location_name ?? '-' }}</span></div>
        <div class="detail-row"><span class="detail-label">Status</span><span class="status-badge" :class="statusBadgeClass(expenseDetail.status)">{{ statusLabelMap[expenseDetail.status] ?? expenseDetail.status }}</span></div>
        <div v-if="expenseDetail.status === 'rejected'" class="detail-row" style="flex-direction:column; align-items:flex-start; gap:6px">
          <span class="detail-label">Alasan Ditolak</span>
          <div style="font-size:0.85rem; color:#991b1b">{{ expenseDetail.rejection_reason }}</div>
        </div>
        <div v-if="expenseDetail.status === 'approved'" class="detail-row">
          <span class="detail-label">Status Odoo</span>
          <span class="odoo-badge" :class="odooBadge(expenseDetail).cls">
            <font-awesome-icon :icon="odooBadge(expenseDetail).icon" /> {{ odooBadge(expenseDetail).text }}
          </span>
        </div>
        <div v-if="expenseDetail.odoo_push_status === 'failed'" class="detail-row" style="flex-direction:column; align-items:flex-start; gap:6px">
          <span class="detail-label">Pesan Error Odoo</span>
          <div style="font-size:0.82rem; color:#991b1b">{{ expenseDetail.odoo_push_error }}</div>
        </div>
        <div v-if="expenseDetail.attachment_url" style="margin-top:8px">
          <span class="detail-label" style="display:block; margin-bottom:8px">Lampiran</span>
          <img :src="expenseDetail.attachment_url" style="width:100%; border-radius:10px; object-fit:contain; max-height:280px;" />
        </div>
      </div>
      <template #footer>
        <template v-if="expenseDetail && expenseDetail.status === 'pending'">
          <button class="btn-cancel" :disabled="loadingAction" @click="openRejectModal(expenseDetail)">
            <font-awesome-icon icon="xmark" /> Reject
          </button>
          <button class="btn-save btn-approve" :disabled="loadingAction" @click="approveExpense(expenseDetail)">
            <font-awesome-icon v-if="loadingAction" icon="spinner" spin />
            <font-awesome-icon v-else icon="check" />
            Approve
          </button>
        </template>
        <template v-else-if="expenseDetail && expenseDetail.status === 'approved' && expenseDetail.odoo_push_status === 'failed'">
          <button class="btn-cancel" @click="closeDetail">Close</button>
          <button class="btn-save btn-retry" :disabled="loadingAction" @click="retryPush(expenseDetail)">
            <font-awesome-icon v-if="loadingAction" icon="spinner" spin />
            <font-awesome-icon v-else icon="rotate-right" />
            Kirim Ulang ke Odoo
          </button>
        </template>
        <button v-else class="btn-cancel" @click="closeDetail">Close</button>
      </template>
    </AppModal>

    <!-- ══════════════ MODAL: REJECT (butuh alasan) ══════════════ -->
    <AppModal :show="showRejectModal" title="Tolak Expense" icon="xmark" size="sm" @close="closeRejectModal">
      <div class="form-container-gap">
        <p style="font-size:0.85rem; color:var(--text-muted); margin:0">
          Anda akan menolak expense
          <strong>{{ rejectTarget?.sales_name ?? '' }}</strong> sebesar
          <strong>{{ store.formatCurrency(rejectTarget?.amount) }}</strong>.
          Alasan penolakan wajib diisi agar sales tahu apa yang perlu diperbaiki.
        </p>
        <div class="form-group">
          <label>Alasan Ditolak <span style="color:#ef4444">*</span></label>
          <textarea v-model="rejectReason" rows="4" class="form-input form-textarea" placeholder="Contoh: Nominal tidak sesuai dengan struk yang dilampirkan"></textarea>
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeRejectModal" :disabled="loadingAction">Batal</button>
        <button class="btn-save btn-reject" @click="submitReject" :disabled="!isRejectValid || loadingAction">
          <font-awesome-icon v-if="loadingAction" icon="spinner" spin />
          <font-awesome-icon v-else icon="xmark" />
          {{ loadingAction ? 'Memproses...' : 'Tolak Expense' }}
        </button>
      </template>
    </AppModal>

  </div>
</template>

<style scoped>
.h-100 { --text-muted: #64748b; }
.form-container-gap { display: flex; flex-direction: column; gap: 14px; }

.breadcrumb-card { background: var(--bg-card); border-radius: 10px; padding: 16px 18px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

.summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
.summary-card { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; padding: 14px 16px; box-shadow: 0 1px 3px var(--shadow-color); }
.summary-card.warn { border-color: #fcd34d; background: #fffbeb; }
.summary-card.danger { border-color: #fca5a5; background: #fef2f2; }
.summary-label { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted); margin: 0 0 6px; }
.summary-value { font-size: 1.3rem; font-weight: 800; margin: 0; }
.summary-value.amber { color: #b45309; }
.summary-value.green { color: #16a34a; }
.summary-value.red { color: #ef4444; }

.controls-card { background: var(--bg-card); border-radius: 10px; padding: 14px 16px; box-shadow: 0 1px 3px var(--shadow-color); }
.controls-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.controls-left, .controls-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.search-wrap { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.search-input { padding: 7px 12px; border: none; background: transparent; color: var(--text-primary); font-size: 0.84rem; outline: none; width: 220px; }
.search-btn { padding: 7px 12px; background: #6366f1; color: #fff; border: none; cursor: pointer; }

.drop-wrap { position: relative; }
.btn-select { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.83rem; font-weight: 500; cursor: pointer; white-space: nowrap; }
.btn-arrow { font-size: 0.6rem; opacity: 0.7; }
.drop-menu { position: absolute; top: calc(100% + 6px); left: 0; min-width: 200px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 10px; z-index: 200; opacity: 0; transform: translateY(-6px); pointer-events: none; transition: all 0.18s ease; }
.drop-menu.show { opacity: 1; transform: translateY(0); pointer-events: all; }
.drop-item { width: 100%; display: block; padding: 8px 10px; background: none; border: none; border-radius: 7px; color: var(--text-primary); font-size: 0.84rem; cursor: pointer; text-align: left; }
.drop-item:hover { background: var(--bg-nav-hover); }
.drop-item.active { color: #6366f1; font-weight: 600; background: rgba(99,102,241,0.08); }

.table-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.data-table thead tr { background: var(--bg-input); border-bottom: 2px solid var(--border-main); position: sticky; top: 0; z-index: 2; }
.data-table th { padding: 12px 18px; text-align: left; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap; }
.data-table tbody tr { border-bottom: 1px solid var(--border-main); }
.data-table td { padding: 13px 18px; vertical-align: middle; color: var(--text-primary); }
.data-row:hover { background: var(--bg-nav-hover); }
.td-no { color: var(--text-muted); font-weight: 600; }
.td-name { font-weight: 700; }
.td-muted { color: var(--text-muted); font-size: 0.84rem; }
.td-center { text-align: center; padding: 40px; color: var(--text-muted); }
.td-actions { text-align: center; white-space: nowrap; }
.amount { font-weight: 700; }

.act-btn { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; margin: 0 2px; background: transparent; }
.act-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.act-info { color: #6366f1; border-color: #6366f1; }
.act-info:hover { background: #6366f1; color: #fff; }
.act-approve { color: #16a34a; border-color: #16a34a; }
.act-approve:hover:not(:disabled) { background: #16a34a; color: #fff; }
.act-delete { color: #ef4444; border-color: #ef4444; }
.act-delete:hover:not(:disabled) { background: #ef4444; color: #fff; }
.act-retry { color: #b45309; border-color: #b45309; }
.act-retry:hover:not(:disabled) { background: #b45309; color: #fff; }

.cat-chip { display: inline-flex; padding: 3px 10px; border-radius: 6px; background: #eef2ff; color: #3730a3; font-size: 0.74rem; font-weight: 700; white-space: nowrap; }
.status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 99px; font-size: 0.72rem; font-weight: 800; white-space: nowrap; }
.status-pending  { background: #fef3c7; color: #b45309; }
.status-approved { background: #dcfce7; color: #16a34a; }
.status-rejected { background: #fee2e2; color: #ef4444; }
.odoo-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 0.76rem; font-weight: 700; }
.odoo-ok { color: #16a34a; }
.odoo-fail { color: #ef4444; cursor: help; }
.odoo-na { color: var(--text-muted); font-weight: 500; }

.pagination-card { background: var(--bg-card); border-radius: 10px; padding: 14px 18px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: row-reverse; align-items: center; justify-content: space-between; gap: 12px; }
.pagination-nav { display: flex; align-items: center; gap: 8px; }
.btn-prev-next { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; min-width: 85px; justify-content: center; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badges { display: flex; gap: 8px; align-items: center; }
.page-badge { padding: 7px 14px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); background: var(--bg-input); white-space: nowrap; }

.spinner-custom { width: 2rem; height: 2rem; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.spinner-wrap { display:flex; flex-direction:column; align-items:center; gap:10px; color:var(--text-muted); }
.spinner { width:24px; height:24px; border:3px solid #e2e8f0; border-top-color:#6366f1; border-radius:50%; animation:spin 0.7s linear infinite; }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.form-input { padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.875rem; background: var(--bg-input); color: var(--text-primary); outline: none; width: 100%; }
.form-textarea { resize: none; min-height: 90px; }

.detail-list { display: flex; flex-direction: column; }
.detail-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-main); gap: 12px; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.detail-value { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); }

.btn-cancel { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #ef4444; color: #fff; border: 1px solid #dc2626; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-cancel:hover:not(:disabled) { background: #dc2626; }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-save:hover:not(:disabled) { background: #4f46e5; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-approve { background: #16a34a; }
.btn-approve:hover:not(:disabled) { background: #15803d; }
.btn-reject { background: #ef4444; }
.btn-reject:hover:not(:disabled) { background: #dc2626; }
.btn-retry { background: #b45309; }
.btn-retry:hover:not(:disabled) { background: #92400e; }
</style>