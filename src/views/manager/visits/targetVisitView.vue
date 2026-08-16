<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import AppModal from '@/components/AppModal.vue'
import { useVisitTargetStore } from '@/stores/visitTargetStore'
import { usePermissionStore } from '@/stores/PermissionStore'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import { visitTargetServices } from '@/services/visitTargetServices'
import api from '@/services/api'

const store        = useVisitTargetStore()
const permission   = usePermissionStore()
const route        = useRoute()
const toast        = useToast()
const { confirm }  = useConfirm()

// ── PERMISSIONS ────────────────────────────
const currentUrl = computed(() => route.path.replace('/app', ''))
const canView     = computed(() => permission.canView(currentUrl.value))

// ── DROPDOWN OPTIONS: Sales / Customer / Branch ──
// Endpoint dikonfirmasi:
//   - Sales : GET /leads/select/user-sales (Leads::selectUserByDivision).
//   - Customer : GET /manager/visit-targets/support/customers?sales_id=X (endpoint
//     baru, sengaja DI-SCOPE ke customer milik/assigned sales yang lagi dipilih --
//     bukan dari /customers-masters yang ternyata di-scope ke user yang login
//     sendiri, jadi selalu kosong kalau dipanggil sebagai Manager). Makanya
//     Customer BARU keisi setelah Sales dipilih (lihat selectSalesOption()).
//   - Branch : TIDAK ADA endpoint global -- yang ada cuma GET /customers/{id}/branches
//     (branch PER customer). Karena customer-nya sendiri udah di-scope ke sales
//     yang dipilih, branch-nya otomatis ikut ke-scope juga.
const salesList    = ref([])
const customerList = ref([])
const branchList   = ref([])
const loadingOptions   = ref(false) // loading sales (awal)
const loadingCustomers = ref(false) // loading customer (abis pilih sales)
const loadingBranches  = ref(false) // loading branch (abis pilih customer)

async function loadDropdownOptions() {
  loadingOptions.value = true
  try {
    const salesRes = await api.get('/leads/select/user-sales')
    const rows = salesRes.data?.data?.data ?? salesRes.data?.data ?? salesRes.data ?? []
    salesList.value = rows.map(u => ({ id: u.id_user ?? u.id, name: u.fullname ?? u.name }))
  } catch (err) {
    console.error('Gagal load daftar sales:', err)
  } finally {
    loadingOptions.value = false
  }
}

// customer di-scope ke sales yang dipilih (lihat catatan di atas)
async function loadCustomersForSales(salesId) {
  customerList.value = []
  if (!salesId) return
  loadingCustomers.value = true
  try {
    const res = await visitTargetServices.getCustomersBySales(salesId)
    const rows = res.data?.data ?? []
    customerList.value = rows.map(c => ({ id: c.id, name: c.company_name ?? c.name }))
  } catch (err) {
    console.error('Gagal load daftar customer buat sales ini:', err)
    toast.error('Gagal memuat daftar customer untuk sales ini.')
  } finally {
    loadingCustomers.value = false
  }
}

// branch tergantung customer yang dipilih (nggak ada endpoint global-nya)
async function loadBranchesForCustomer(customerId) {
  branchList.value = []
  if (!customerId) return
  loadingBranches.value = true
  try {
    const res = await api.get(`/customers/${customerId}/branches`)
    const rows = res.data?.data?.data ?? res.data?.data ?? []
    branchList.value = rows.map(b => ({ id: b.id, name: b.branch_name ?? b.name }))
  } catch (err) {
    console.error('Gagal load daftar branch:', err)
  } finally {
    loadingBranches.value = false
  }
}

// ── FETCH AWAL ─────────────────────────────
onMounted(async () => {
  await loadDropdownOptions()
  try {
    await store.refreshAll()
  } catch (err) {
    toast.error('Gagal memuat data target visit.')
  }
})

// ── DROPDOWN OPEN/CLOSE STATE (UI) ──────────
const showStatusMenu  = ref(false)
const showSortByMenu  = ref(false)
const showSortDirMenu = ref(false)
const showPerPageMenu = ref(false)

const statusLabel = () => store.statusOptions.find(o => o.value === store.statusFilter)?.label ?? 'Semua Status'
const sortByLabel = () => store.sortOptions.find(o => o.value === store.sort.column)?.label ?? 'Terbaru'

function handleReset() {
  store.resetFilters()
}

// ── AVATAR ──
const AVATAR_COLORS = ['6366f1', 'f59e0b', '0d9488', '8b5cf6', 'ec4899', '3b82f6']
function colorForName(name) {
  if (!name) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
function avatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Sales')}&background=${colorForName(name)}&color=fff&bold=true`
}

// ── MODAL CREATE / EDIT ──
const isFormModalVisible = ref(false)
const formMode = ref('create') // 'create' | 'edit'
const form = reactive({
  id: null,
  sales_id: null,
  sales_name: '',
  target_type: 'customer', // 'customer' | 'branch'
  customer_id: null,
  branch_parent_customer_id: null, // cuma dipakai buat nyari daftar branch, TIDAK dikirim ke backend
  branch_id: null,
  target_name: '',
  target_count: 1,
  notes: '',
})
const formErrors = ref({})

function resetForm() {
  form.id = null
  form.sales_id = null
  form.sales_name = ''
  form.target_type = 'customer'
  form.customer_id = null
  form.branch_parent_customer_id = null
  form.branch_id = null
  form.target_name = ''
  form.target_count = 1
  form.notes = ''
  formErrors.value = {}
  customerList.value = []
  branchList.value = []
  showSalesPicker.value = false
  showCustPicker.value = false
  showBranchParentPicker.value = false
  showBranchPicker.value = false
  salesSearch.value = ''
  custSearch.value = ''
  branchParentSearch.value = ''
  branchSearch.value = ''
}

// dipanggil setelah pilih customer di dropdown "Pilih Customer (induk branch)"
function onBranchParentChange() {
  form.branch_id = null
  loadBranchesForCustomer(form.branch_parent_customer_id)
}

// ── SEARCHABLE DROPDOWN: Sales / Customer / Branch-induk / Branch ──
// Pola sama kayak drop-wrap/drop-menu yang udah dipakai di filter status/sort
// di atas, cuma ditambah <input> pencarian di dalam drop-menu-nya.
const showSalesPicker  = ref(false)
const showCustPicker   = ref(false)
const showBranchParentPicker = ref(false)
const showBranchPicker = ref(false)

const salesSearch        = ref('')
const custSearch         = ref('')
const branchParentSearch = ref('')
const branchSearch       = ref('')

const filteredSalesList = computed(() => {
  const q = salesSearch.value.trim().toLowerCase()
  return q ? salesList.value.filter(s => s.name.toLowerCase().includes(q)) : salesList.value
})
const filteredCustomerList = computed(() => {
  const q = custSearch.value.trim().toLowerCase()
  return q ? customerList.value.filter(c => c.name.toLowerCase().includes(q)) : customerList.value
})
const filteredBranchParentList = computed(() => {
  const q = branchParentSearch.value.trim().toLowerCase()
  return q ? customerList.value.filter(c => c.name.toLowerCase().includes(q)) : customerList.value
})
const filteredBranchList = computed(() => {
  const q = branchSearch.value.trim().toLowerCase()
  return q ? branchList.value.filter(b => b.name.toLowerCase().includes(q)) : branchList.value
})

const selectedSalesLabel        = computed(() => salesList.value.find(s => s.id === form.sales_id)?.name || 'Pilih Sales')
const selectedCustomerLabel     = computed(() => customerList.value.find(c => c.id === form.customer_id)?.name || 'Pilih Customer')
const selectedBranchParentLabel = computed(() => customerList.value.find(c => c.id === form.branch_parent_customer_id)?.name || 'Pilih Customer')
const selectedBranchLabel       = computed(() => branchList.value.find(b => b.id === form.branch_id)?.name || 'Pilih Branch')

function selectSalesOption(s) {
  form.sales_id = s.id
  showSalesPicker.value = false
  salesSearch.value = ''

  // ganti sales -> reset pilihan customer/branch sebelumnya (kemungkinan besar
  // nggak relevan lagi buat sales yang baru), terus load ulang daftar customer
  // yang jadi tanggung jawab sales ini aja.
  form.customer_id = null
  form.branch_parent_customer_id = null
  form.branch_id = null
  branchList.value = []
  loadCustomersForSales(s.id)
}
function selectCustomerOption(c) {
  form.customer_id = c.id
  showCustPicker.value = false
  custSearch.value = ''
}
function selectBranchParentOption(c) {
  form.branch_parent_customer_id = c.id
  showBranchParentPicker.value = false
  branchParentSearch.value = ''
  onBranchParentChange()
}
function selectBranchOption(b) {
  form.branch_id = b.id
  showBranchPicker.value = false
  branchSearch.value = ''
}

function openCreateModal() {
  formMode.value = 'create'
  resetForm()
  isFormModalVisible.value = true
}

function openEditModal(row) {
  formMode.value = 'edit'
  formErrors.value = {}
  form.id = row.id
  form.sales_id = row.sales_id
  form.sales_name = row.sales_name
  form.target_type = row.target_type
  form.target_name = row.target_name
  form.target_count = row.target_count
  form.notes = row.notes
  isFormModalVisible.value = true
}

function closeFormModal() {
  isFormModalVisible.value = false
}

async function submitForm() {
  formErrors.value = {}

  if (formMode.value === 'create') {
    if (!form.sales_id) {
      formErrors.value.sales_id = ['Sales wajib dipilih.']
      return
    }
    if (form.target_type === 'customer' && !form.customer_id) {
      formErrors.value.customer_id = ['Customer wajib dipilih.']
      return
    }
    if (form.target_type === 'branch' && !form.branch_id) {
      formErrors.value.branch_id = ['Branch wajib dipilih.']
      return
    }
  }

  if (!form.target_count || form.target_count < 1) {
    formErrors.value.target_count = ['Jumlah target minimal 1.']
    return
  }

  try {
    if (formMode.value === 'create') {
      await store.createTarget({
        sales_id: form.sales_id,
        customer_id: form.target_type === 'customer' ? form.customer_id : null,
        branch_id: form.target_type === 'branch' ? form.branch_id : null,
        target_count: form.target_count,
        period_month: store.periodMonthParam,
        notes: form.notes || null,
      })
      toast.success('Target visit berhasil dibuat.')
    } else {
      await store.updateTarget(form.id, {
        target_count: form.target_count,
        notes: form.notes || null,
      })
      toast.success('Target visit berhasil diupdate.')
    }
    closeFormModal()
  } catch (err) {
    const backendErrors = err.response?.data?.errors
    if (backendErrors) {
      formErrors.value = backendErrors
    }
    toast.error(err.response?.data?.message || 'Gagal menyimpan target visit.')
  }
}

// ── DELETE ── (pola sama kayak openDeleteModal() di CustomersView kamu)
async function handleDelete(row) {
  const isConfirmed = await confirm({
    type       : 'danger',
    title      : 'Hapus Target Visit',
    message    : `Yakin mau hapus target visit "${row.sales_name}" ke "${row.target_name}"?`,
    detail     : 'Data progress kunjungan yang sudah tercatat tetap ada di riwayat visit, cuma target ini yang dihapus dan tidak bisa dikembalikan.',
    confirmText: 'Yes, Delete',
    cancelText : 'Cancel',
  })

  if (isConfirmed) {
    try {
      await store.deleteTarget(row.id)
      toast.success('Target visit berhasil dihapus.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus target visit.')
    }
  }
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="bullseye" />
          Target Visit
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" />
            Dashboard
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Target Visit</span>
        </div>
      </div>
      <span class="manager-only-chip">
        <font-awesome-icon icon="user-shield" /> Manager Only
      </span>
    </div>

    <div class="toolbar-top">
      <div class="toolbar-left">
        <div class="month-picker-wrap">
          <font-awesome-icon icon="calendar-days" class="month-picker-icon" />
          <input
            type="month"
            :value="store.periodMonth"
            class="month-picker-input"
            @change="store.changeMonth($event.target.value)"
          />
        </div>
        <button class="btn-toolbar btn-orange" @click="handleReset">
          <font-awesome-icon icon="rotate-left" /> Reset
        </button>
      </div>

      <button class="btn-toolbar btn-purple" @click="openCreateModal">
        <font-awesome-icon icon="plus" /> Tambah Target
      </button>
    </div>

    <div class="stat-grid mb-2">
      <div class="stat-tile">
        <div class="stat-tile-top">
          <span class="stat-label">Total Target</span>
          <span class="stat-icon" style="background:rgba(99,102,241,0.12);color:#6366f1"><font-awesome-icon icon="bullseye" /></span>
        </div>
        <div class="stat-value">{{ store.loadingSummary ? '–' : store.summary.total_targets }}</div>
        <div class="stat-sub">bulan ini</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile-top">
          <span class="stat-label">Sales Diberi Target</span>
          <span class="stat-icon" style="background:rgba(13,148,136,0.12);color:#0d9488"><font-awesome-icon icon="users" /></span>
        </div>
        <div class="stat-value">{{ store.loadingSummary ? '–' : store.summary.unique_sales }}</div>
        <div class="stat-sub">orang</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile-top">
          <span class="stat-label">Target Tercapai</span>
          <span class="stat-icon" style="background:rgba(34,197,94,0.12);color:#22c55e"><font-awesome-icon icon="circle-check" /></span>
        </div>
        <div class="stat-value">{{ store.loadingSummary ? '–' : `${store.summary.achieved_count} / ${store.summary.total_targets}` }}</div>
        <div class="stat-sub">sudah 100%</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile-top">
          <span class="stat-label">Rata-rata Pencapaian</span>
          <span class="stat-icon" style="background:rgba(245,158,11,0.12);color:#b45309"><font-awesome-icon icon="chart-line" /></span>
        </div>
        <div class="stat-value">{{ store.loadingSummary ? '–' : `${store.summary.avg_percentage}%` }}</div>
        <div class="stat-sub">semua target bulan ini</div>
      </div>
    </div>

    <div class="controls-card">
      <div class="controls-row">
        <div class="controls-left">
          <div class="drop-wrap">
            <button class="btn-select" @click="showStatusMenu = !showStatusMenu">
              <font-awesome-icon icon="filter" /> {{ statusLabel() }} <font-awesome-icon icon="chevron-down" class="btn-arrow" />
            </button>
            <div class="drop-menu" :class="{ show: showStatusMenu }">
              <div class="drop-label">Status Pencapaian</div>
              <button v-for="opt in store.statusOptions" :key="opt.value" class="drop-item"
                :class="{ active: store.statusFilter === opt.value }"
                @click="store.changeStatusFilter(opt.value); showStatusMenu = false">{{ opt.label }}</button>
            </div>
          </div>

          <div class="showing-wrap">
            <font-awesome-icon icon="list" class="text-muted-color" />
            <span class="showing-label">Showing:</span>
            <div class="drop-wrap">
              <button class="btn-select" @click="showPerPageMenu = !showPerPageMenu">
                {{ store.pagination.per_page }} <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showPerPageMenu }">
                <div class="drop-label">Per halaman</div>
                <div class="perpage-grid">
                  <button
                    v-for="opt in [5,10,25,50]" :key="opt"
                    class="perpage-opt" :class="{ active: store.pagination.per_page === opt }"
                    @click="store.pagination.per_page = opt; showPerPageMenu = false; store.changePageSize()"
                  >{{ opt }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="controls-right">
          <div class="search-wrap">
            <input
              :value="store.searchQuery"
              type="text"
              placeholder="Cari nama sales / target..."
              class="search-input"
              @input="store.searchWithDelay($event.target.value)"
            />
            <button class="search-btn"><font-awesome-icon icon="magnifying-glass" /></button>
          </div>
          <div class="sort-wrap">
            <span class="showing-label">Sort:</span>
            <div class="drop-wrap">
              <button class="btn-select" @click="showSortByMenu = !showSortByMenu">
                {{ sortByLabel() }} <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showSortByMenu }">
                <div class="drop-label">Sort By</div>
                <button v-for="opt in store.sortOptions" :key="opt.value" class="drop-item"
                  :class="{ active: store.sort.column === opt.value }"
                  @click="store.toggleSort(opt.value); showSortByMenu = false">{{ opt.label }}</button>
              </div>
            </div>
            <div class="drop-wrap">
              <button class="btn-select" @click="showSortDirMenu = !showSortDirMenu">
                {{ store.sort.direction === 'asc' ? 'Asc' : 'Desc' }} <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-right" :class="{ show: showSortDirMenu }">
                <div class="drop-label">Urutan</div>
                <button v-for="opt in ['desc', 'asc']" :key="opt" class="drop-item"
                  :class="{ active: store.sort.direction === opt }"
                  @click="store.sort.direction = opt; store.changeSorting(); showSortDirMenu = false">{{ opt === 'asc' ? 'Asc' : 'Desc' }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="table-card flex-grow-1 overflow-auto mb-3">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:56px">NO.</th>
            <th>SALES</th>
            <th>TARGET</th>
            <th style="width:100px; text-align:center">JML TARGET</th>
            <th style="width:220px">PROGRESS</th>
            <th style="width:130px">STATUS</th>
            <th>CATATAN</th>
            <th style="width:90px; text-align:center">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.loadingList">
            <td colspan="8" class="td-center">
              <font-awesome-icon icon="spinner" spin /> Memuat data...
            </td>
          </tr>
          <tr v-else-if="store.targetsData.length === 0">
            <td colspan="8" class="td-center">
              <div class="empty-state">
                <font-awesome-icon icon="inbox" class="empty-icon" />
                <div>Belum ada target visit yang cocok dengan filter ini</div>
              </div>
            </td>
          </tr>
          <tr v-else v-for="(row, index) in store.targetsData" :key="row.id" class="data-row">
            <td class="td-no">{{ (store.pagination.current_page - 1) * store.pagination.per_page + index + 1 }}.</td>
            <td>
              <div class="row-sales">
                <img :src="avatarUrl(row.sales_name)" />
                <span>{{ row.sales_name }}</span>
              </div>
            </td>
            <td>
              {{ row.target_name }}
              <span class="activity-badge" :class="row.target_type === 'branch' ? 'activity-followup' : 'activity-visit'" style="margin-left:6px;">
                {{ row.target_note }}
              </span>
            </td>
            <td class="td-center" style="font-weight:700;">{{ row.target_count }}x</td>
            <td>
              <div class="progress-cell">
                <div class="progress-bar-track">
                  <div class="progress-bar-fill" :class="{ done: row.is_achieved }" :style="{ width: Math.min(row.percentage, 100) + '%' }"></div>
                </div>
                <span class="progress-cell-label">{{ row.achieved_count }}/{{ row.target_count }} · {{ row.percentage }}%</span>
              </div>
            </td>
            <td>
              <span class="result-chip" :class="row.is_achieved ? 'status-done' : 'status-pending'">
                <font-awesome-icon :icon="row.is_achieved ? 'circle-check' : 'hourglass-half'" />
                {{ row.is_achieved ? 'Tercapai' : 'Belum Tercapai' }}
              </span>
            </td>
            <td class="td-note">{{ row.notes || '-' }}</td>
            <td class="td-actions">
              <button class="act-btn act-edit" title="Edit" @click="openEditModal(row)">
                <font-awesome-icon icon="pen" />
              </button>
              <button class="act-btn act-delete" title="Hapus" @click="handleDelete(row)">
                <font-awesome-icon icon="trash" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination-card">
      <div class="pagination-nav">
        <button
          class="btn-prev-next"
          :disabled="store.pagination.current_page === 1"
          @click="store.fetchByUrl(store.pagination.prev_page_url)"
        >
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button
          class="btn-prev-next"
          :disabled="store.pagination.current_page === store.pagination.last_page"
          @click="store.fetchByUrl(store.pagination.next_page_url)"
        >
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">{{ store.targetsData.length }} DATA | PAGE {{ store.pagination.current_page }}</span>
        <span class="page-badge">TOTAL: {{ store.pagination.total }}</span>
      </div>
    </div>

    <!-- Modal Create/Edit -->
    <AppModal
      :show="isFormModalVisible"
      :title="formMode === 'create' ? 'Tambah Target Visit' : 'Edit Target Visit'"
      icon="bullseye"
      size="md"
      @close="closeFormModal"
    >
      <template v-if="formMode === 'create'">
        <div class="form-group">
          <label>Sales</label>
          <div class="drop-wrap drop-wrap-full">
            <button type="button" class="form-select-btn" :class="{ 'is-invalid': formErrors.sales_id }" @click="showSalesPicker = !showSalesPicker">
              <span>{{ loadingOptions && !salesList.length ? 'Memuat...' : selectedSalesLabel }}</span>
              <font-awesome-icon icon="chevron-down" class="btn-arrow" />
            </button>
            <div class="drop-menu drop-menu-full" :class="{ show: showSalesPicker }">
              <input v-model="salesSearch" type="text" class="drop-search-input" placeholder="Cari nama sales..." />
              <div class="drop-scroll-list">
                <button v-for="s in filteredSalesList" :key="s.id" type="button" class="drop-item" :class="{ active: form.sales_id === s.id }" @click="selectSalesOption(s)">{{ s.name }}</button>
                <div v-if="filteredSalesList.length === 0" class="drop-empty">Tidak ditemukan</div>
              </div>
            </div>
          </div>
          <div v-if="formErrors.sales_id" class="form-error">{{ formErrors.sales_id[0] }}</div>
        </div>

        <div class="form-group">
          <label>Jenis Target</label>
          <div class="segment-group" style="max-width:260px;">
            <button type="button" class="segment-btn" :class="{ active: form.target_type === 'customer' }"
              @click="form.target_type = 'customer'; form.branch_id = null; form.branch_parent_customer_id = null; branchList = []">
              Customer
            </button>
            <button type="button" class="segment-btn" :class="{ active: form.target_type === 'branch' }"
              @click="form.target_type = 'branch'; form.customer_id = null">
              Branch
            </button>
          </div>
        </div>

        <div class="form-group" v-if="form.target_type === 'customer'">
          <label>Pilih Customer</label>
          <div class="drop-wrap drop-wrap-full">
            <button
              type="button" class="form-select-btn" :class="{ 'is-invalid': formErrors.customer_id }"
              :disabled="!form.sales_id || loadingCustomers"
              @click="showCustPicker = !showCustPicker"
            >
              <span>{{ loadingCustomers ? 'Memuat...' : (form.sales_id ? selectedCustomerLabel : 'Pilih Sales dulu') }}</span>
              <font-awesome-icon icon="chevron-down" class="btn-arrow" />
            </button>
            <div class="drop-menu drop-menu-full" :class="{ show: showCustPicker }">
              <input v-model="custSearch" type="text" class="drop-search-input" placeholder="Cari nama customer..." />
              <div class="drop-scroll-list">
                <button v-for="c in filteredCustomerList" :key="c.id" type="button" class="drop-item" :class="{ active: form.customer_id === c.id }" @click="selectCustomerOption(c)">{{ c.name }}</button>
                <div v-if="filteredCustomerList.length === 0" class="drop-empty">
                  {{ form.sales_id ? 'Sales ini belum punya customer' : 'Tidak ditemukan' }}
                </div>
              </div>
            </div>
          </div>
          <div v-if="formErrors.customer_id" class="form-error">{{ formErrors.customer_id[0] }}</div>
        </div>

        <template v-else>
          <!-- Branch nggak punya endpoint list global -- harus pilih Customer induknya dulu -->
          <div class="form-group">
            <label>Pilih Customer (induk branch)</label>
            <div class="drop-wrap drop-wrap-full">
              <button
                type="button" class="form-select-btn"
                :disabled="!form.sales_id || loadingCustomers"
                @click="showBranchParentPicker = !showBranchParentPicker"
              >
                <span>{{ loadingCustomers ? 'Memuat...' : (form.sales_id ? selectedBranchParentLabel : 'Pilih Sales dulu') }}</span>
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-menu-full" :class="{ show: showBranchParentPicker }">
                <input v-model="branchParentSearch" type="text" class="drop-search-input" placeholder="Cari nama customer..." />
                <div class="drop-scroll-list">
                  <button v-for="c in filteredBranchParentList" :key="c.id" type="button" class="drop-item" :class="{ active: form.branch_parent_customer_id === c.id }" @click="selectBranchParentOption(c)">{{ c.name }}</button>
                  <div v-if="filteredBranchParentList.length === 0" class="drop-empty">
                    {{ form.sales_id ? 'Sales ini belum punya customer' : 'Tidak ditemukan' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>Pilih Branch</label>
            <div class="drop-wrap drop-wrap-full">
              <button
                type="button" class="form-select-btn" :class="{ 'is-invalid': formErrors.branch_id }"
                :disabled="!form.branch_parent_customer_id || loadingBranches"
                @click="showBranchPicker = !showBranchPicker"
              >
                <span>{{ loadingBranches ? 'Memuat...' : (form.branch_parent_customer_id ? selectedBranchLabel : 'Pilih Customer dulu') }}</span>
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-menu-full" :class="{ show: showBranchPicker }">
                <input v-model="branchSearch" type="text" class="drop-search-input" placeholder="Cari nama branch..." />
                <div class="drop-scroll-list">
                  <button v-for="b in filteredBranchList" :key="b.id" type="button" class="drop-item" :class="{ active: form.branch_id === b.id }" @click="selectBranchOption(b)">{{ b.name }}</button>
                  <div v-if="filteredBranchList.length === 0" class="drop-empty">Tidak ditemukan</div>
                </div>
              </div>
            </div>
            <div v-if="!loadingBranches && form.branch_parent_customer_id && branchList.length === 0" class="form-hint">
              Customer ini belum punya branch.
            </div>
            <div v-if="formErrors.branch_id" class="form-error">{{ formErrors.branch_id[0] }}</div>
          </div>
        </template>

        <div class="form-group">
          <label>Bulan Target</label>
          <input type="text" :value="store.periodMonth" class="form-input" disabled />
          <div class="form-hint">Ikut bulan yang sedang dipilih di halaman ({{ store.periodMonth }}). Ganti dulu bulannya di toolbar kalau mau bikin target buat bulan lain.</div>
        </div>
      </template>

      <template v-else>
        <!-- EDIT: sales/target/bulan read-only, cuma jumlah target & catatan yang bisa diubah -->
        <div class="form-readonly-row">
          <img class="avatar" :src="avatarUrl(form.sales_name)" />
          <div>
            <div style="font-weight:700;">{{ form.sales_name }}</div>
            <div style="font-size:0.78rem; color:var(--text-muted);">
              {{ form.target_name }}
              <span class="activity-badge" :class="form.target_type === 'branch' ? 'activity-followup' : 'activity-visit'" style="margin-left:4px;">
                {{ form.target_type === 'branch' ? 'Branch' : 'Customer' }}
              </span>
            </div>
          </div>
        </div>
        <div class="empty-detail-note" style="margin-bottom:12px;">
          <font-awesome-icon icon="circle-info" /> Sales/target/bulan tidak bisa diubah. Kalau salah, hapus target ini lalu buat yang baru.
        </div>
      </template>

      <div class="form-group">
        <label>Jumlah Target (kali visit / bulan)</label>
        <input type="number" min="1" max="1000" v-model.number="form.target_count" class="form-input" :class="{ 'is-invalid': formErrors.target_count }" />
        <div v-if="formErrors.target_count" class="form-error">{{ formErrors.target_count[0] }}</div>
      </div>

      <div class="form-group">
        <label>Catatan (opsional)</label>
        <textarea v-model="form.notes" class="form-textarea" rows="3" placeholder="Contoh: fokus follow up renewal kontrak"></textarea>
      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeFormModal">Batal</button>
        <button class="btn-toolbar btn-purple" :disabled="store.submitting" @click="submitForm">
          <font-awesome-icon v-if="store.submitting" icon="spinner" spin />
          <font-awesome-icon v-else icon="check" />
          {{ formMode === 'create' ? 'Simpan Target' : 'Update Target' }}
        </button>
      </template>
    </AppModal>

  </div>
</template>

<style scoped>
.breadcrumb-card {
  background: var(--bg-card); border-radius: 10px; padding: 16px 18px; margin-bottom: 12px;
  box-shadow: 0 1px 3px var(--shadow-color); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
}
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }
.manager-only-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 20px; background: rgba(99,102,241,0.1); color: #6366f1; font-size: 0.74rem; font-weight: 700; }

.toolbar-top {
  display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); border-radius: 10px;
  padding: 12px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); flex-wrap: wrap; gap: 8px;
}
.toolbar-left { display: flex; gap: 8px; flex-wrap: wrap; flex: 1; min-width: 200px; align-items: center; }
.month-picker-wrap { display: flex; align-items: center; gap: 8px; padding: 7px 12px; background: var(--bg-input); border: 1px solid var(--border-main); border-radius: 8px; }
.month-picker-icon { color: #6366f1; }
.month-picker-input { border: none; background: transparent; color: var(--text-primary); font-size: 0.85rem; font-weight: 600; outline: none; }

.btn-toolbar { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: none; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; transition: all 0.18s ease; white-space: nowrap; }
.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover:not(:disabled) { background: #4f46e5; }
.btn-purple:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-orange { background: #f59e0b; color: #fff; }
.btn-orange:hover { background: #d97706; }
.btn-arrow { font-size: 0.6rem; opacity: 0.7; }

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

.drop-wrap { position: relative; }
.btn-select { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.83rem; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
.btn-select:hover { border-color: #6366f1; color: #6366f1; }
.drop-menu { position: absolute; top: calc(100% + 6px); left: 0; min-width: 180px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 10px; z-index: 200; opacity: 0; transform: translateY(-6px); pointer-events: none; transition: all 0.18s ease; }
.drop-right { left: auto; right: 0; }
.drop-menu.show { opacity: 1; transform: translateY(0); pointer-events: all; }
.drop-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; padding: 0 4px; }
.drop-item { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: none; border: none; border-radius: 7px; color: var(--text-primary); font-size: 0.84rem; cursor: pointer; transition: background 0.15s; text-align: left; }
.drop-item:hover { background: var(--bg-nav-hover); }
.drop-item.active { color: #6366f1; font-weight: 600; background: rgba(99,102,241,0.08); }
.perpage-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.perpage-opt { padding: 5px 10px; border: 1px solid var(--border-main); border-radius: 6px; background: var(--bg-input); color: var(--text-primary); font-size: 0.82rem; cursor: pointer; transition: all 0.15s; }
.perpage-opt:hover { border-color: #6366f1; color: #6366f1; }
.perpage-opt.active { background: #6366f1; border-color: #6366f1; color: #fff; font-weight: 700; }

.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.stat-tile { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; padding: 16px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: column; gap: 6px; }
.stat-tile-top { display: flex; align-items: center; justify-content: space-between; }
.stat-icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; flex-shrink: 0; }
.stat-label { font-size: 0.76rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
.stat-value { font-size: 1.5rem; font-weight: 800; }
.stat-sub { font-size: 0.76rem; color: var(--text-muted); }

.activity-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 0.7rem; font-weight: 700; padding: 3px 9px; border-radius: 20px; white-space: nowrap; }
.activity-visit { background: rgba(99,102,241,0.1); color: #6366f1; }
.activity-followup { background: rgba(13,148,136,0.12); color: #0d9488; }

.table-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.data-table thead tr { background: var(--bg-input); border-bottom: 2px solid var(--border-main); position: sticky; top: 0; z-index: 2; }
.data-table th { padding: 12px 18px; text-align: left; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap; }
.data-table tbody tr { border-bottom: 1px solid var(--border-main); transition: background 0.15s; }
.data-table tbody tr:last-child { border-bottom: none; }
.data-row:hover { background: var(--bg-nav-hover); }
.data-table td { padding: 13px 18px; vertical-align: middle; color: var(--text-primary); }
.td-no { color: var(--text-muted); font-weight: 600; }
.td-center { text-align: center; padding: 40px; color: var(--text-muted); }
.td-actions { text-align: center; }
.td-note { color: var(--text-muted); max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row-sales { display: flex; align-items: center; gap: 8px; }
.row-sales img { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; }
.row-sales span { font-weight: 600; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--text-muted); }
.empty-icon { font-size: 2rem; opacity: 0.3; }

.progress-cell { display: flex; flex-direction: column; gap: 5px; min-width: 160px; }
.progress-bar-track { height: 8px; border-radius: 20px; background: var(--bg-input); overflow: hidden; }
.progress-bar-fill { height: 100%; border-radius: 20px; background: #6366f1; transition: width 0.3s ease; }
.progress-bar-fill.done { background: #22c55e; }
.progress-cell-label { font-size: 0.72rem; color: var(--text-muted); font-weight: 600; }

.result-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 0.72rem; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
.result-chip.status-pending { background: rgba(245,158,11,0.12); color: #b45309; }
.result-chip.status-done { background: rgba(34,197,94,0.12); color: #16a34a; }

.act-btn { width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s ease; margin: 0 2px; background: transparent; }
.act-edit { color: #6366f1; border-color: #6366f1; }
.act-edit:hover { background: #6366f1; color: #fff; }
.act-delete { color: #ef4444; border-color: #ef4444; }
.act-delete:hover { background: #ef4444; color: #fff; }

.pagination-card { background: var(--bg-card); border-radius: 10px; padding: 14px 18px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: row-reverse; align-items: center; justify-content: space-between; gap: 12px; }
.pagination-nav { display: flex; align-items: center; gap: 8px; }
.btn-prev-next { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; min-width: 85px; justify-content: center; transition: background 0.18s ease; }
.btn-prev-next:hover:not(:disabled) { background: #4f46e5; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badges { display: flex; gap: 8px; align-items: center; }
.page-badge { padding: 7px 14px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); background: var(--bg-input); white-space: nowrap; letter-spacing: 0.04em; }

.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 0.78rem; font-weight: 700; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
.form-select, .form-input, .form-textarea { width: 100%; padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.86rem; outline: none; }
.form-select:focus, .form-input:focus, .form-textarea:focus { border-color: #6366f1; }
.form-select.is-invalid, .form-input.is-invalid { border-color: #ef4444; }
.form-textarea { resize: vertical; }
.form-error { font-size: 0.72rem; color: #ef4444; margin-top: 4px; }
.form-hint { font-size: 0.72rem; color: var(--text-muted); margin-top: 4px; }

/* ===== SEARCHABLE DROPDOWN (Sales/Customer/Branch di form modal) ===== */
.drop-wrap-full { width: 100%; }
.form-select-btn {
  width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px;
  background: var(--bg-input); color: var(--text-primary); font-size: 0.86rem; cursor: pointer; text-align: left;
}
.form-select-btn:hover:not(:disabled) { border-color: #6366f1; }
.form-select-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.form-select-btn.is-invalid { border-color: #ef4444; }
.drop-menu-full { width: 100%; left: 0; right: 0; }
.drop-search-input {
  width: 100%; padding: 7px 10px; border: 1px solid var(--border-main); border-radius: 7px;
  background: var(--bg-card); color: var(--text-primary); font-size: 0.82rem; outline: none; margin-bottom: 8px;
}
.drop-search-input:focus { border-color: #6366f1; }
.drop-scroll-list { max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.drop-empty { padding: 10px; text-align: center; font-size: 0.8rem; color: var(--text-muted); font-style: italic; }
.form-readonly-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.form-readonly-row .avatar { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; }
.empty-detail-note { font-size: 0.78rem; color: var(--text-muted); font-style: italic; }

.btn-cancel { padding: 8px 18px; background: var(--bg-main, #f1f5f9); color: var(--text-muted); border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
.btn-cancel:hover { background: var(--border-main); color: var(--text-primary); }

.segment-group { display: flex; background: var(--bg-input); border: 1px solid var(--border-main); padding: 4px; border-radius: 30px; }
.segment-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 7px 12px; background: transparent; border: none; border-radius: 24px; font-size: 0.8rem; font-weight: 600; color: var(--text-primary); cursor: pointer; transition: all 0.2s ease-in-out; }
.segment-btn.active { background: #6366f1; color: #fff; }

@media (max-width: 900px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
  .td-note { max-width: 140px; }
}
</style>