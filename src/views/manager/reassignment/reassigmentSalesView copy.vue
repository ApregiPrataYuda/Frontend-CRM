<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import AppModal from '@/components/AppModal.vue'
import { useReassignSalesStore } from '@/stores/reassignSalesStore'

const store = useReassignSalesStore()

const {
  customersData,
  loadingCustomers,
  salesOptions,
  pagination,
  searchKeyword,
  reassigningCustomer,
  reassigningBranch,
} = storeToRefs(store)

//────────────────────────────────────────────
// LIFECYCLE
//────────────────────────────────────────────

onMounted(async () => {
  await store.fetchCustomers()
  await store.fetchSales()
})

//────────────────────────────────────────────
// SEARCH
//────────────────────────────────────────────

function handleSearch(e) {
  store.searchWithDelay(e.target.value)
}

//────────────────────────────────────────────
// PAGINATION
//────────────────────────────────────────────

function nextPage() {
  if (!pagination.value.next_page_url) return
  store.fetchCustomers(pagination.value.next_page_url)
}

function prevPage() {
  if (!pagination.value.prev_page_url) return
  store.fetchCustomers(pagination.value.prev_page_url)
}

//────────────────────────────────────────────
// TOAST
//────────────────────────────────────────────

const toast = ref({ show: false, type: '', message: '' })
let toastTimer = null

function showToast(type, message) {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { show: true, type, message }
  toastTimer = setTimeout(() => { toast.value.show = false }, 3000)
}

//────────────────────────────────────────────
// REASSIGN MODAL
//────────────────────────────────────────────

const reassignModal     = ref(false)
const reassignTarget    = ref(null) // { type: 'customer' | 'branch', id, name, currentSalesId, currentSalesName }
const selectedSalesId   = ref(null)
const reassignReason    = ref('')
const isOpenSalesSelect = ref(false)
const searchSales       = ref('')
const reassignError     = ref('')

const filteredSales = computed(() => {
  if (!searchSales.value) return salesOptions.value
  return salesOptions.value.filter(s =>
    s.fullname.toLowerCase().includes(searchSales.value.toLowerCase())
  )
})

function openReassignCustomer(customer) {
  reassignTarget.value = {
    type: 'customer',
    id: customer.id,
    name: customer.company_name,
    currentSalesId: customer.assigned_to,
    currentSalesName: customer.assigned_name ?? 'Belum ada sales',
  }
  selectedSalesId.value = null
  reassignReason.value  = ''
  reassignError.value   = ''
  reassignModal.value   = true
}

function openReassignBranch(customer, branch) {
  reassignTarget.value = {
    type: 'branch',
    id: branch.id,
    name: `${customer.company_name} — ${branch.branch_name}`,
    currentSalesId: branch.assigned_to,
    currentSalesName: branch.assigned_name ?? 'Belum ada sales',
  }
  selectedSalesId.value = null
  reassignReason.value  = ''
  reassignError.value   = ''
  reassignModal.value   = true
}

function closeReassignModal() {
  reassignModal.value     = false
  reassignTarget.value    = null
  isOpenSalesSelect.value = false
  searchSales.value       = ''
  reassignError.value     = ''
}

function toggleSalesDropdown() {
  isOpenSalesSelect.value = !isOpenSalesSelect.value
  if (!isOpenSalesSelect.value) searchSales.value = ''
}

function selectSales(sales) {
  selectedSalesId.value   = sales.id_user
  isOpenSalesSelect.value = false
  searchSales.value       = ''
}

function getSelectedSalesName() {
  return salesOptions.value.find(s => s.id_user === selectedSalesId.value)?.fullname ?? ''
}

async function confirmReassign() {
  if (!selectedSalesId.value || !reassignTarget.value) return

  reassignError.value = ''

  const payload = {
    new_sales_id: selectedSalesId.value,
    reason: reassignReason.value || null,
  }

  try {
    if (reassignTarget.value.type === 'customer') {
      await store.reassignCustomer(reassignTarget.value.id, payload)
      showToast('success', 'Customer berhasil dipindahkan ke sales baru!')
    } else {
      await store.reassignBranch(reassignTarget.value.id, payload)
      showToast('success', 'Cabang berhasil dipindahkan ke sales baru!')
    }
    closeReassignModal()
  } catch (e) {
    reassignError.value = e?.response?.data?.message ?? 'Gagal memindahkan sales, coba lagi.'
  }
}

const isSaving = computed(() =>
  reassignTarget.value?.type === 'customer' ? reassigningCustomer.value : reassigningBranch.value
)

//────────────────────────────────────────────
// AVATAR
//────────────────────────────────────────────

const avatarPalette = ['#6366f1', '#0ea5e9', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b']

function getInitials(name) {
  if (!name) return '?'
  const parts = name.split(' ')
  return ((parts[0]?.charAt(0) ?? '') + (parts[1]?.charAt(0) ?? '')).toUpperCase()
}

function getAvatarColor(name) {
  if (!name) return avatarPalette[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return avatarPalette[Math.abs(hash) % avatarPalette.length]
}
</script>

<template>
<div class="h-100 d-flex flex-column">

  <!-- ═══ BREADCRUMB ═══ -->
  <div class="breadcrumb-card mb-2">
    <div class="breadcrumb-left">
      <h4 class="breadcrumb-title">
        <font-awesome-icon icon="right-left" /> Sales Reassignment
      </h4>
      <div class="breadcrumb-path">
        <span class="breadcrumb-item"><font-awesome-icon icon="house" /> Home</span>
        <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
        <span class="breadcrumb-item active">Pindah Sales</span>
      </div>
    </div>
  </div>

  <!-- ═══ CONTROLS ═══ -->
  <div class="controls-card">
    <div class="controls-row">
      <div class="controls-left">
        <div class="showing-wrap">
          <font-awesome-icon icon="list" class="text-muted-color" />
          <span class="showing-label">Total Customer:</span>
          <strong>{{ pagination.total }}</strong>
        </div>
      </div>
      <div class="controls-right">
        <div class="search-wrap">
          <input
            :value="searchKeyword"
            type="text"
            class="search-input"
            placeholder="Cari customer atau sales..."
            @input="handleSearch"
          />
          <button class="search-btn"><font-awesome-icon icon="magnifying-glass" /></button>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══ CONTENT: CARD LIST ═══ -->
  <div class="content-card flex-grow-1 overflow-auto mb-3">

    <!-- LOADING -->
    <div v-if="loadingCustomers" class="state-wrap">
      <div class="spinner-custom"></div>
    </div>

    <!-- EMPTY -->
    <div v-else-if="!customersData.length" class="state-wrap">
      <div class="empty-state">
        <h5 class="empty-title">Belum Ada Data Customer</h5>
        <p class="empty-text">Tidak ada customer yang bisa dipindahkan sales-nya.</p>
      </div>
    </div>

    <!-- GRID -->
    <div v-else class="customer-grid">
      <div v-for="item in customersData" :key="item.id" class="customer-card">

        <div class="cc-top">
          <div class="cc-avatar" :style="{ background: getAvatarColor(item.company_name) }">
            {{ getInitials(item.company_name) }}
          </div>
          <div class="cc-headinfo">
            <div class="cc-name">{{ item.company_name }}</div>
            <div class="cc-code">{{ item.customer_code }}</div>
          </div>
          <div class="cc-break"></div>
          <span v-if="item.branch_count > 0" class="detail-badge">
            <font-awesome-icon icon="code-branch" /> {{ item.branch_count }} Cabang
          </span>
        </div>

        <!-- SALES HEAD COMPANY -->
        <div class="cc-body">
          <div class="cc-row sales-row">
            <font-awesome-icon icon="user-tie" class="sales-icon" />
            <div class="sales-info">
              <span class="sales-label">Sales Pemegang</span>
              <strong>{{ item.assigned_name ?? 'Belum ada sales' }}</strong>
            </div>
          </div>
        </div>

        <div class="cc-footer">
          <span class="cc-date">Head Company</span>
          <div class="cc-actions">
            <button class="act-btn act-reassign" title="Pindah Sales" @click="openReassignCustomer(item)">
              <font-awesome-icon icon="right-left" />
            </button>
          </div>
        </div>

        <!-- LIST BRANCH (kalau ada) -->
        <div v-if="item.branches?.length" class="branch-mini-list">
          <div v-for="branch in item.branches" :key="branch.id" class="branch-mini-item">
            <div class="bmi-info">
              <font-awesome-icon icon="code-branch" class="cc-icon" />
              <div>
                <div class="bmi-name">{{ branch.branch_name }}</div>
                <div class="bmi-sales">{{ branch.assigned_name ?? 'Belum ada sales' }}</div>
              </div>
            </div>
            <button
              class="act-btn act-reassign act-reassign-sm"
              title="Pindah Sales Cabang"
              @click="openReassignBranch(item, branch)"
            >
              <font-awesome-icon icon="right-left" />
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- ═══ PAGINATION ═══ -->
  <div class="pagination-card">
    <div class="pagination-nav">
      <button class="btn-prev-next" :disabled="pagination.current_page === 1" @click="prevPage">
        <font-awesome-icon icon="circle-left" /> Prev
      </button>
      <button class="btn-prev-next" :disabled="pagination.current_page === pagination.last_page" @click="nextPage">
        Next <font-awesome-icon icon="circle-right" />
      </button>
    </div>
    <div class="page-badges">
      <span class="page-badge">{{ customersData.length }} DATA | PAGE {{ pagination.current_page }}</span>
      <span class="page-badge">TOTAL: {{ pagination.total }}</span>
    </div>
  </div>

  <!-- ═══ MODAL REASSIGN ═══ -->
  <AppModal
    :show="reassignModal"
    title="Pindahkan ke Sales Baru"
    icon="right-left"
    size="sm"
    @close="closeReassignModal"
  >
    <div v-if="reassignTarget" class="form-container-gap">

      <div class="reassign-context">
        <div class="reassign-context-label">Memindahkan</div>
        <div class="reassign-context-name">{{ reassignTarget.name }}</div>
        <div class="reassign-context-current">
          Saat ini dipegang oleh <strong>{{ reassignTarget.currentSalesName }}</strong>
        </div>
      </div>

      <div class="form-group">
        <label>Sales Baru <span class="required">*</span></label>
        <div class="cs-wrap">
          <div class="custom-select" :class="{ open: isOpenSalesSelect }" @click="toggleSalesDropdown">
            <span v-if="!selectedSalesId" class="cs-placeholder">Pilih Sales...</span>
            <span v-else class="cs-tag">{{ getSelectedSalesName() }}</span>
            <font-awesome-icon icon="chevron-down" class="cs-arrow" :class="{ rotated: isOpenSalesSelect }" />
          </div>
          <div v-if="isOpenSalesSelect" class="cs-dropdown">
            <div class="cs-search-wrap">
              <input v-model="searchSales" placeholder="Cari sales..." class="cs-search" @click.stop />
            </div>
            <div class="cs-list">
              <div v-if="!filteredSales.length" class="cs-empty">Tidak ditemukan</div>
              <div
                v-for="s in filteredSales" :key="s.id_user"
                class="cs-item"
                :class="{
                  active: selectedSalesId === s.id_user,
                  disabled: s.id_user === reassignTarget.currentSalesId,
                }"
                @click="s.id_user !== reassignTarget.currentSalesId && selectSales(s)"
              >
                {{ s.fullname }}
                <span v-if="s.id_user === reassignTarget.currentSalesId" class="cs-current-tag">(saat ini)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Alasan (opsional)</label>
        <textarea
          v-model="reassignReason"
          class="form-input form-textarea"
          rows="3"
          placeholder="Contoh: sales lama tidak follow up..."
        />
      </div>

      <div v-if="reassignError" class="form-error">
        {{ reassignError }}
      </div>

    </div>

    <template #footer>
      <button class="btn-cancel" @click="closeReassignModal">Cancel</button>
      <button class="btn-save" :disabled="!selectedSalesId || isSaving" @click="confirmReassign">
        <font-awesome-icon v-if="isSaving" icon="spinner" spin />
        <font-awesome-icon v-else icon="right-left" />
        {{ isSaving ? 'Memproses...' : 'Pindahkan' }}
      </button>
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

/* ── BREADCRUMB ── */
.breadcrumb-card { background: var(--bg-card); border-radius: 10px; padding: 16px 18px; box-shadow: 0 1px 3px var(--shadow-color); }
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

/* ── SPINNER & EMPTY ── */
.state-wrap { display: flex; justify-content: center; padding: 40px 0; }
.spinner-custom { width: 2rem; height: 2rem; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 24px 0; gap: 8px; }
.empty-text { font-size: 0.9rem; font-weight: 600; color: var(--text-muted); }
.empty-title { margin-top: 12px; margin-bottom: 6px; font-size: 20px; font-weight: 700; color: var(--text-primary); }

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

/* ── CONTENT WRAPPER ── */
.content-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); overflow: auto; }

/* ── CARD ── */
.customer-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; padding: 16px; }
.customer-card { display: flex; flex-direction: column; gap: 10px; border: 1px solid var(--border-main); border-radius: 12px; background: var(--bg-card); padding: 14px; transition: all 0.18s ease; }
.customer-card:hover { box-shadow: 0 6px 18px rgba(0,0,0,0.08); border-color: #6366f1; }
.cc-top { display: flex; align-items: flex-start; gap: 10px; flex-wrap: wrap; }
.cc-avatar { width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }
.cc-headinfo { flex: 1; min-width: 0; }
.cc-name { font-weight: 700; font-size: 0.92rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cc-code { font-family: monospace; font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }
.cc-break { display: none; }
.cc-body { display: flex; flex-direction: column; gap: 6px; }
.cc-row { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--text-primary); }
.cc-icon { color: var(--text-muted); width: 14px; flex-shrink: 0; }
.cc-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px dashed var(--border-main); }
.cc-date { font-size: 0.72rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.cc-actions { display: flex; gap: 4px; }

.sales-row { padding-top: 4px; }
.sales-info { display: flex; flex-direction: column; line-height: 1.2; }
.sales-label { font-size: 11px; color: var(--text-muted); }
.sales-icon { color: #6366f1; }

.detail-badge { font-size: 0.72rem; font-weight: 600; padding: 3px 10px; border-radius: 6px; background: rgba(99,102,241,0.1); color: #6366f1; border: 1px solid rgba(99,102,241,0.2); white-space: nowrap; }

/* ── BRANCH MINI LIST ── */
.branch-mini-list { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
.branch-mini-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; background: var(--bg-input); border-radius: 8px; }
.bmi-info { display: flex; align-items: center; gap: 8px; min-width: 0; }
.bmi-name { font-size: 0.8rem; font-weight: 600; color: var(--text-primary); }
.bmi-sales { font-size: 0.72rem; color: var(--text-muted); }

/* ── ACTION BUTTON ── */
.act-btn { width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s ease; background: transparent; flex-shrink: 0; }
.act-reassign { color: #f59e0b; border-color: #f59e0b; }
.act-reassign:hover { background: #f59e0b; color: #fff; }
.act-reassign-sm { width: 26px; height: 26px; font-size: 0.72rem; }

/* ── PAGINATION ── */
.pagination-card { background: var(--bg-card); border-radius: 10px; padding: 14px 18px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: row-reverse; align-items: center; justify-content: space-between; gap: 12px; }
.pagination-nav { display: flex; align-items: center; gap: 8px; }
.btn-prev-next { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; min-width: 85px; justify-content: center; transition: background 0.18s ease; }
.btn-prev-next:hover:not(:disabled) { background: #4f46e5; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badges { display: flex; gap: 8px; align-items: center; }
.page-badge { padding: 7px 14px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); background: var(--bg-input); white-space: nowrap; }

/* ── REASSIGN CONTEXT BOX ── */
.reassign-context { background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.15); border-radius: 8px; padding: 10px 12px; }
.reassign-context-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.reassign-context-name { font-weight: 700; font-size: 0.9rem; color: var(--text-primary); margin: 2px 0; }
.reassign-context-current { font-size: 0.78rem; color: var(--text-muted); }

/* ── FORM ── */
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.required { color: #ef4444; }
.form-input { padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.875rem; background: var(--bg-input); color: var(--text-primary); outline: none; width: 100%; box-sizing: border-box; }
.form-textarea { resize: none; min-height: 70px; line-height: 1.5; }
.form-error { font-size: 0.75rem; color: #ef4444; }

/* ── CUSTOM SELECT ── */
.cs-wrap { display: flex; flex-direction: column; }
.custom-select { display: flex; align-items: center; justify-content: space-between; min-height: 40px; padding: 6px 10px; border: 1px solid var(--border-main); border-radius: 8px; background: var(--bg-input); cursor: pointer; }
.custom-select.open { border-color: #6366f1; }
.cs-placeholder { font-size: 0.875rem; color: var(--text-muted); flex: 1; }
.cs-tag { font-size: 0.875rem; font-weight: 600; color: #6366f1; flex: 1; }
.cs-arrow { font-size: 0.65rem; color: var(--text-muted); transition: transform 0.2s; }
.cs-arrow.rotated { transform: rotate(180deg); }
.cs-dropdown { position: static; margin-top: 4px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.10); overflow: hidden; }
.cs-search-wrap { padding: 8px; border-bottom: 1px solid var(--border-main); }
.cs-search { width: 100%; padding: 7px 10px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.84rem; background: var(--bg-input); color: var(--text-primary); outline: none; box-sizing: border-box; }
.cs-list { max-height: 180px; overflow-y: auto; padding: 4px; }
.cs-empty { text-align: center; padding: 12px; font-size: 0.84rem; color: var(--text-muted); }
.cs-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; border-radius: 7px; font-size: 0.84rem; cursor: pointer; color: var(--text-primary); }
.cs-item:hover { background: var(--bg-nav-hover); }
.cs-item.active { background: rgba(99,102,241,0.08); color: #6366f1; font-weight: 600; }
.cs-item.disabled { opacity: 0.45; cursor: not-allowed; }
.cs-current-tag { font-size: 0.68rem; color: var(--text-muted); }

/* ── MODAL BUTTONS ── */
.btn-cancel { padding: 8px 18px; background: var(--bg-main, #f1f5f9); color: var(--text-muted); border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-cancel:hover { background: var(--border-main); color: var(--text-primary); }
.btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-save:hover:not(:disabled) { background: #4f46e5; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

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

@keyframes shrink { from { width: 100%; } to { width: 0%; } }
.toast-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from { opacity: 0; transform: translateY(-16px) scale(0.95); }
.toast-leave-to { opacity: 0; transform: translateY(-8px) scale(0.97); }

@media (max-width: 768px) {
  .breadcrumb-card { padding: 12px 14px; }
  .breadcrumb-title { font-size: 1rem; }
  .controls-card { padding: 12px; }
  .controls-row { flex-direction: column; align-items: stretch; gap: 10px; }
  .controls-left, .controls-right { width: 100%; }
  .search-wrap { width: 100%; }
  .search-input { width: 100%; }
}

@media (max-width: 576px) {
  .customer-grid { grid-template-columns: 1fr; padding: 10px; gap: 10px; }
  .customer-card { padding: 12px; gap: 8px; }
  .cc-avatar { width: 38px; height: 38px; font-size: 0.78rem; }
  .cc-name { white-space: normal; overflow: visible; text-overflow: unset; line-height: 1.3; font-size: 0.88rem; }

  .pagination-card { flex-direction: column; padding: 12px; gap: 12px; }
  .pagination-nav { width: 100%; justify-content: space-between; }
  .btn-prev-next { flex: 1; max-width: 48%; padding: 10px 14px; }
  .page-badges { width: 100%; justify-content: center; flex-wrap: wrap; }
  .page-badge { flex: 1; text-align: center; font-size: 0.7rem; }

  .btn-cancel, .btn-save { width: 100%; justify-content: center; }
}
</style>