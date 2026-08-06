<script setup>
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usecustomersPopulationStore } from '@/stores/customersPopulationStore'

const store = usecustomersPopulationStore()

const {
  customersData, loadingCustomers, searchCustomers,
  filterPurchased, pagination, sort,
  customerDetail, purchaseItems, loadingDetail,
  syncingCustomers, syncingPurchases,
  summaryData, loadingSummary,
} = storeToRefs(store)

onMounted(() => {
  store.fetchCustomers()
  store.fetchSummary()
})

// ── DASHBOARD: COMPUTED ──
const totalCustomers   = computed(() => summaryData.value?.total_customers ?? 0)
const totalPurchased   = computed(() => summaryData.value?.total_purchased ?? 0)
const totalNotPurchase = computed(() => summaryData.value?.total_not_purchased ?? 0)
const totalTransaksi   = computed(() => summaryData.value?.total_transaksi ?? 0)
const topCustomers     = computed(() => summaryData.value?.top_customers ?? [])

const purchasedPercent = computed(() => {
  if (!totalCustomers.value) return 0
  return Math.round((totalPurchased.value / totalCustomers.value) * 100)
})

const donutGradient = computed(() => {
  const p = purchasedPercent.value
  return `conic-gradient(#6366f1 0% ${p}%, #e2e8f0 ${p}% 100%)`
})

const maxTopTransaksi = computed(() => {
  if (!topCustomers.value.length) return 1
  return Math.max(...topCustomers.value.map(c => c.total_transaksi || 0), 1)
})

// ── FILTER OPTIONS ──
const filterOptions = [
  { label: 'All Customer', value: 'all' },
  { label: 'Has Purchased', value: 'has_purchased' },
]
const filterLabel = () =>
  filterOptions.find(o => o.value === filterPurchased.value)?.label ?? 'All Customer'

// ── SORT OPTIONS ──
const sortByOptions = [
  { label: 'Created Date', value: 'created_at' },
  { label: 'Customer Name', value: 'name' },
  { label: 'Total Transaksi', value: 'total_transaksi' },
]
const sortByLabel = () =>
  sortByOptions.find(o => o.value === sort.value.column)?.label ?? 'Created Date'

// ── DROPDOWN STATE ──
const showFilterMenu   = ref(false)
const showPerPageMenu  = ref(false)
const showSortByMenu   = ref(false)
const showSortDirMenu  = ref(false)

function handleReset() {
  store.resetFilters()
}

// ── VIEW MODE (CARD / TABLE) ──
const VIEW_MODE_KEY = 'customers_population_view_mode'
const viewMode = ref(localStorage.getItem(VIEW_MODE_KEY) || 'card')

function setViewMode(mode) {
  viewMode.value = mode
  localStorage.setItem(VIEW_MODE_KEY, mode)
}

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

// ── DETAIL MODAL ──
const isDetailModalVisible = ref(false)

async function openDetailModal(customer) {
  isDetailModalVisible.value = true
  await store.detailCustomer(customer.odoo_partner_id)
}
function closeDetailModal() {
  isDetailModalVisible.value = false
  customerDetail.value = null
  purchaseItems.value = []
}

// ── SYNC ──
async function handleSyncCustomers() {
  try {
    await store.syncCustomers()
  } catch (e) {
    alert('Gagal sync customer, coba lagi.')
  }
}
async function handleSyncPurchases() {
  try {
    await store.syncCustomerPurchases()
  } catch (e) {
    alert('Gagal sync data pembelian, coba lagi.')
  }
}

// ── PAGINATION NAV ──
function goPrev() {
  if (pagination.value.prev_page_url) {
    store.fetchCustomers(pagination.value.prev_page_url.replace(/^.*\/api/, ''))
  }
}
function goNext() {
  if (pagination.value.next_page_url) {
    store.fetchCustomers(pagination.value.next_page_url.replace(/^.*\/api/, ''))
  }
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="table-list" />
          Customer History Transaksi
        </h4>

        <div class="breadcrumb-path">
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">
            Customer History Transaksi
          </span>
        </div>
      </div>
    </div>

    <!-- ═══ DASHBOARD ═══ -->
    <div class="dashboard-wrap mb-2">

      <!-- KARTU RINGKASAN -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-icon stat-icon-indigo">
            <font-awesome-icon icon="users" />
          </div>
          <div class="stat-info">
            <div class="stat-value">
              <template v-if="loadingSummary">...</template>
              <template v-else>{{ totalCustomers.toLocaleString('id-ID') }}</template>
            </div>
            <div class="stat-label">Total Customer</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon-green">
            <font-awesome-icon icon="circle-check" />
          </div>
          <div class="stat-info">
            <div class="stat-value">
              <template v-if="loadingSummary">...</template>
              <template v-else>{{ totalPurchased.toLocaleString('id-ID') }}</template>
            </div>
            <div class="stat-label">Sudah Beli</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon-amber">
            <font-awesome-icon icon="circle-xmark" />
          </div>
          <div class="stat-info">
            <div class="stat-value">
              <template v-if="loadingSummary">...</template>
              <template v-else>{{ totalNotPurchase.toLocaleString('id-ID') }}</template>
            </div>
            <div class="stat-label">Belum Beli</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon-pink">
            <font-awesome-icon icon="cart-shopping" />
          </div>
          <div class="stat-info">
            <div class="stat-value">
              <template v-if="loadingSummary">...</template>
              <template v-else>{{ totalTransaksi.toLocaleString('id-ID') }}</template>
            </div>
            <div class="stat-label">Total Transaksi</div>
          </div>
        </div>
      </div>

      <!-- CHART -->
      <div class="chart-grid">

        <!-- DONUT: Sudah Beli vs Belum Beli -->
        <div class="chart-card">
          <div class="chart-card-title">Proporsi Customer</div>
          <div v-if="loadingSummary" class="state-wrap"><div class="spinner-custom"></div></div>
          <div v-else class="donut-wrap">
            <div class="donut" :style="{ background: donutGradient }">
              <div class="donut-hole">
                <span class="donut-percent">{{ purchasedPercent }}%</span>
                <span class="donut-caption">Sudah Beli</span>
              </div>
            </div>
            <div class="donut-legend">
              <div class="legend-item">
                <span class="legend-dot" style="background:#6366f1"></span>
                Sudah Beli ({{ totalPurchased.toLocaleString('id-ID') }})
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background:#e2e8f0"></span>
                Belum Beli ({{ totalNotPurchase.toLocaleString('id-ID') }})
              </div>
            </div>
          </div>
        </div>

        <!-- BAR: Top 5 Customer -->
        <div class="chart-card chart-card-wide">
          <div class="chart-card-title">Top Customer by Transaksi</div>
          <div v-if="loadingSummary" class="state-wrap"><div class="spinner-custom"></div></div>
          <div v-else-if="!topCustomers.length" class="state-wrap">
            <span class="text-muted-color">Belum ada data</span>
          </div>
          <div v-else class="bar-list">
            <div v-for="(c, idx) in topCustomers" :key="idx" class="bar-row">
              <div class="bar-label" :title="c.name">{{ c.name }}</div>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{ width: (c.total_transaksi / maxTopTransaksi * 100) + '%' }"
                ></div>
              </div>
              <div class="bar-value">{{ c.total_transaksi }}x</div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <div class="toolbar-top">
      <div class="toolbar-left">
        <button class="btn-toolbar btn-purple" :disabled="syncingCustomers" @click="handleSyncCustomers">
          <font-awesome-icon :icon="syncingCustomers ? 'spinner' : 'rotate'" :spin="syncingCustomers" />
          {{ syncingCustomers ? 'Syncing...' : 'Sync Customer' }}
        </button>
        <button class="btn-toolbar btn-orange" :disabled="syncingPurchases" @click="handleSyncPurchases">
          <font-awesome-icon :icon="syncingPurchases ? 'spinner' : 'rotate'" :spin="syncingPurchases" />
          {{ syncingPurchases ? 'Syncing...' : 'Sync Purchases' }}
        </button>
      </div>
    </div>

    <div class="controls-card">
      <div class="controls-row">
        <div class="controls-left">
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
                    v-for="opt in [5,10,25,50]" :key="opt"
                    class="perpage-opt" :class="{ active: pagination.per_page === opt }"
                    @click="pagination.per_page = opt; showPerPageMenu = false; store.changePageSize()"
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

          <div class="drop-wrap">
            <button class="btn-select" @click="showFilterMenu = !showFilterMenu">
              <font-awesome-icon icon="filter" />
              {{ filterLabel() }} <font-awesome-icon icon="chevron-down" class="btn-arrow" />
            </button>
            <div class="drop-menu" :class="{ show: showFilterMenu }">
              <div class="drop-label">Filter Customer</div>
              <button v-for="opt in filterOptions" :key="opt.value" class="drop-item"
                :class="{ active: filterPurchased === opt.value }"
                @click="store.changeFilter(opt.value); showFilterMenu = false">{{ opt.label }}</button>
            </div>
          </div>
        </div>

        <div class="controls-right">
          <div class="search-wrap">
            <input
              :value="searchCustomers"
              type="text"
              placeholder="Cari nama, email, telepon..."
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
                <button v-for="opt in sortByOptions" :key="opt.value" class="drop-item"
                  :class="{ active: sort.column === opt.value }"
                  @click="sort.column = opt.value; showSortByMenu = false; store.changeSorting()">{{ opt.label }}</button>
              </div>
            </div>
            <div class="drop-wrap">
              <button class="btn-select" @click="showSortDirMenu = !showSortDirMenu">
                {{ sort.direction === 'asc' ? 'Asc' : 'Desc' }} <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-right" :class="{ show: showSortDirMenu }">
                <div class="drop-label">Urutan</div>
                <button v-for="opt in [{l:'Desc',v:'desc'},{l:'Asc',v:'asc'}]" :key="opt.v" class="drop-item"
                  :class="{ active: sort.direction === opt.v }"
                  @click="sort.direction = opt.v; showSortDirMenu = false; store.changeSorting()">{{ opt.l }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="content-card flex-grow-1 overflow-auto mb-3">

      <!-- LOADING (shared) -->
      <div v-if="loadingCustomers" class="state-wrap">
        <div class="spinner-custom"></div>
      </div>

      <!-- EMPTY (shared) -->
      <div v-else-if="customersData.length === 0" class="state-wrap">
        <div class="empty-state">
          <font-awesome-icon icon="inbox" class="empty-icon" />
          <div>Tidak ada data ditemukan</div>
        </div>
      </div>

      <!-- ═══ CARD VIEW (DEFAULT) ═══ -->
      <div v-else-if="viewMode === 'card'" class="customer-grid">
        <div v-for="(customer, index) in customersData" :key="customer.id" class="customer-card">
          <div class="cc-top">
            <div class="cc-avatar" :style="{ background: getAvatarColor(customer.name) }">
              {{ getInitials(customer.name) }}
            </div>
            <div class="cc-headinfo">
              <div class="cc-name" :title="customer.name">{{ customer.name }}</div>
              <div class="cc-code">
                No. {{ (pagination.current_page - 1) * pagination.per_page + index + 1 }}
              </div>
            </div>
            <div class="cc-break"></div>
            <span v-if="customer.has_purchased" class="badge-active cc-status">Sudah Beli</span>
            <span v-else class="table-role-badge cc-status">Belum Beli</span>
          </div>

          <div class="cc-body">
            <div class="cc-row">
              <font-awesome-icon icon="envelope" class="cc-icon" />
              <span>{{ customer.email && customer.email !== '0' ? customer.email : '-' }}</span>
            </div>
            <div class="cc-row">
              <font-awesome-icon icon="phone" class="cc-icon" />
              <span>{{ customer.phone && customer.phone !== '0' ? customer.phone : '-' }}</span>
            </div>
          </div>

          <div class="cc-transaksi">
            <font-awesome-icon icon="cart-shopping" />
            <span>{{ customer.total_transaksi }}x Transaksi</span>
          </div>

          <div class="cc-footer">
            <span class="cc-date">&nbsp;</span>
            <div class="cc-actions">
              <button class="act-btn act-info" @click="openDetailModal(customer)" title="Detail">
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
            <th>CUSTOMER NAME</th>
            <th style="width:180px">EMAIL</th>
            <th style="width:160px">PHONE</th>
            <th style="width:140px">STATUS</th>
            <th style="width:120px">TRANSAKSI</th>
            <th style="width:100px; text-align:center">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(customer, index) in customersData" :key="customer.id" class="data-row">
            <td class="td-no">{{ (pagination.current_page - 1) * pagination.per_page + index + 1 }}.</td>
            <td class="td-name">{{ customer.name }}</td>
            <td class="td-muted">{{ customer.email && customer.email !== '0' ? customer.email : '-' }}</td>
            <td class="td-muted">{{ customer.phone && customer.phone !== '0' ? customer.phone : '-' }}</td>
            <td>
              <span v-if="customer.has_purchased" class="badge-active">Sudah Beli</span>
              <span v-else class="table-role-badge">Belum Beli</span>
            </td>
            <td class="td-muted">{{ customer.total_transaksi }}x</td>
            <td class="td-actions">
              <button class="act-btn act-info" @click="openDetailModal(customer)" title="Detail">
                <font-awesome-icon icon="circle-info" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination-card">
      <div class="pagination-nav">
        <button class="btn-prev-next" :disabled="!pagination.prev_page_url" @click="goPrev">
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button class="btn-prev-next" :disabled="!pagination.next_page_url" @click="goNext">
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">{{ customersData.length }} DATA | ON PAGE {{ pagination.current_page }}</span>
        <span class="page-badge">TOTAL: {{ pagination.total }}</span>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="isDetailModalVisible" class="modal-overlay" @click.self="closeDetailModal">
        <div class="modal-box">
          <div class="modal-header">
            <h5 class="modal-title">
              <font-awesome-icon icon="circle-info" /> Customer Purchase Detail
            </h5>
            <button class="modal-close" @click="closeDetailModal">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>
          <div class="modal-body">
            <div v-if="loadingDetail" class="td-center py-4">
              <font-awesome-icon icon="spinner" spin /> Memuat detail...
            </div>
            <template v-else>
              <div class="detail-list mb-3">
                <div class="detail-row">
                  <span class="detail-label">Customer Name</span>
                  <span class="detail-value font-semibold">{{ customerDetail?.name }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Total Transaksi</span>
                  <span class="detail-badge">{{ customerDetail?.total_transaksi }}x</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Status</span>
                  <span v-if="customerDetail?.has_purchased" class="badge-active">Sudah Beli</span>
                  <span v-else class="table-role-badge">Belum Beli</span>
                </div>
              </div>

              <div v-if="purchaseItems.length === 0" class="empty-state py-3">
                <font-awesome-icon icon="inbox" class="empty-icon" />
                <div>Belum ada riwayat pembelian</div>
              </div>

              <div v-else class="purchase-list">
                <div v-for="(item, idx) in purchaseItems" :key="idx" class="purchase-item">
                  <div class="purchase-item-header">
                    <span class="purchase-order-name">{{ item.order_name }}</span>
                    <span class="purchase-date">{{ store.formatDate(item.order_date) }}</span>
                  </div>
                  <div class="purchase-product-name">{{ item.product_name }}</div>
                  <div class="purchase-meta">
                    <span>Qty: {{ item.qty }}</span>
                    <span>Harga: {{ store.formatCurrency(item.price_unit) }}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeDetailModal">Close</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* ===== BREADCRUMB ===== */
.breadcrumb-card {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 16px 18px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px var(--shadow-color);
}

.breadcrumb-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.breadcrumb-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
}

.breadcrumb-title svg {
  color: #6366f1;
}

.breadcrumb-path {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.breadcrumb-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--text-muted);
  font-weight: 500;
}

.breadcrumb-item.active {
  color: #6366f1;
  font-weight: 700;
}

.breadcrumb-separator {
  font-size: 0.7rem;
  color: var(--text-muted);
  opacity: 0.6;
}

/* ===== DASHBOARD ===== */
.dashboard-wrap { display: flex; flex-direction: column; gap: 12px; }

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--bg-card);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px var(--shadow-color);
}
.stat-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}
.stat-icon-indigo { background: rgba(99,102,241,0.12); color: #6366f1; }
.stat-icon-green  { background: rgba(34,197,94,0.12);  color: #16a34a; }
.stat-icon-amber  { background: rgba(245,158,11,0.12); color: #d97706; }
.stat-icon-pink   { background: rgba(236,72,153,0.12); color: #db2777; }
.stat-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.stat-value { font-size: 1.35rem; font-weight: 800; color: var(--text-primary); line-height: 1.1; }
.stat-label { font-size: 0.78rem; color: var(--text-muted); font-weight: 600; white-space: nowrap; }

.chart-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 12px;
}
.chart-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px var(--shadow-color);
}
.chart-card-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 14px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── DONUT ── */
.donut-wrap { display: flex; flex-direction: column; align-items: center; gap: 14px; }
.donut {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}
.donut-hole {
  width: 104px;
  height: 104px;
  border-radius: 50%;
  background: var(--bg-card);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.donut-percent { font-size: 1.3rem; font-weight: 800; color: var(--text-primary); }
.donut-caption { font-size: 0.68rem; color: var(--text-muted); font-weight: 600; }
.donut-legend { display: flex; flex-direction: column; gap: 6px; width: 100%; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--text-primary); }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

/* ── BAR CHART ── */
.bar-list { display: flex; flex-direction: column; gap: 12px; }
.bar-row { display: grid; grid-template-columns: 140px 1fr 50px; align-items: center; gap: 10px; }
.bar-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bar-track {
  height: 10px;
  border-radius: 6px;
  background: var(--bg-input);
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 6px;
  background: linear-gradient(90deg, #6366f1, #818cf8);
  transition: width 0.4s ease;
}
.bar-value { font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-align: right; }

@media (max-width: 768px) {
  .chart-grid { grid-template-columns: 1fr; }
  .bar-row { grid-template-columns: 90px 1fr 40px; }
}

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
.controls-card {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px var(--shadow-color);
}
.controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.controls-left, .controls-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.showing-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.84rem;
  color: var(--text-primary);
  font-weight: 600;
}
.showing-label { white-space: nowrap; color: var(--text-muted); font-size: 0.83rem; }
.text-muted-color { color: var(--text-muted); }
.search-wrap {
  display: flex;
  border: 1px solid var(--border-main);
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-input);
}
.search-input {
  padding: 7px 12px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.84rem;
  outline: none;
  width: 200px;
}
.search-input::placeholder { color: var(--text-muted); }
.search-btn {
  padding: 7px 12px;
  background: #6366f1;
  color: #fff;
  border: none;
  cursor: pointer;
}
.search-btn:hover { background: #4f46e5; }
.sort-wrap { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
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
.drop-label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 6px;
  padding: 0 4px;
}
.drop-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: none;
  border: none;
  border-radius: 7px;
  color: var(--text-primary);
  font-size: 0.84rem;
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
}
.drop-item:hover { background: var(--bg-nav-hover); }
.drop-item.active { color: #6366f1; font-weight: 600; background: rgba(99,102,241,0.08); }
.perpage-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.perpage-opt {
  padding: 5px 10px;
  border: 1px solid var(--border-main);
  border-radius: 6px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.15s;
}
.perpage-opt:hover  { border-color: #6366f1; color: #6366f1; }
.perpage-opt.active { background: #6366f1; border-color: #6366f1; color: #fff; font-weight: 700; }

/* ── VIEW TOGGLE (CARD / TABLE) ── */
.view-toggle {
  display: flex;
  border: 1px solid var(--border-main);
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-input);
}
.view-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.83rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.view-toggle-btn + .view-toggle-btn { border-left: 1px solid var(--border-main); }
.view-toggle-btn:hover:not(.active) { color: #6366f1; }
.view-toggle-btn.active { background: #6366f1; color: #fff; }

/* ── CONTENT WRAPPER (CARD / TABLE) ── */
.content-card {
  background: var(--bg-card);
  border-radius: 10px;
  box-shadow: 0 1px 3px var(--shadow-color);
  overflow: auto;
}
.state-wrap { display: flex; justify-content: center; padding: 40px 0; }
.spinner-custom {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(99,102,241,0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── CARD VIEW ── */
.customer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
  padding: 16px;
}
.customer-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid var(--border-main);
  border-radius: 12px;
  background: var(--bg-card);
  padding: 14px;
  transition: all 0.18s ease;
}
.customer-card:hover {
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);
  border-color: #6366f1;
  transform: translateY(-2px);
}
.cc-top { display: flex; align-items: flex-start; gap: 10px; flex-wrap: wrap; }
.cc-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}
.cc-headinfo { flex: 1; min-width: 0; }
.cc-name {
  font-weight: 700;
  font-size: 0.92rem;
  color: var(--text-primary);
  white-space: normal;
  overflow-wrap: break-word;
  word-break: break-word;
  line-height: 1.3;
}
.cc-code { font-family: monospace; font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }
.cc-status { flex-shrink: 0; }
.cc-break { display: none; }
.cc-body { display: flex; flex-direction: column; gap: 6px; }
.cc-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cc-icon { color: var(--text-muted); width: 14px; flex-shrink: 0; }
.cc-transaksi {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  align-self: flex-start;
  padding: 5px 12px;
  border-radius: 8px;
  background: rgba(99,102,241,0.12);
  border: 1px solid rgba(99,102,241,0.25);
  color: #6366f1;
  font-size: 0.82rem;
  font-weight: 700;
}
.cc-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px dashed var(--border-main);
}
.cc-date { display: inline-flex; align-items: center; gap: 6px; font-size: 0.72rem; color: var(--text-muted); font-weight: 600; }
.cc-actions { display: flex; gap: 4px; }

.table-card {
  background: var(--bg-card);
  border-radius: 10px;
  box-shadow: 0 1px 3px var(--shadow-color);
  overflow: auto;
}
.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.data-table thead tr {
  background: var(--bg-input);
  border-bottom: 2px solid var(--border-main);
  position: sticky;
  top: 0;
  z-index: 2;
}
.data-table th {
  padding: 12px 18px;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  white-space: nowrap;
}
.data-table tbody tr { border-bottom: 1px solid var(--border-main); transition: background 0.15s; }
.data-table tbody tr:last-child { border-bottom: none; }
.data-row:hover { background: var(--bg-nav-hover); }
.data-table td { padding: 13px 18px; vertical-align: middle; color: var(--text-primary); }
.td-no     { color: var(--text-muted); font-weight: 600; }
.td-name   { font-weight: 500; }
.td-muted  { color: var(--text-muted); font-size: 0.84rem; }
.td-center { text-align: center; padding: 40px; color: var(--text-muted); }
.td-actions { text-align: center; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--text-muted); padding: 24px 0; }
.empty-icon  { font-size: 2rem; opacity: 0.3; }
.act-btn {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1.5px solid;
  cursor: pointer;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s ease;
  margin: 0 2px;
  background: transparent;
}
.act-edit         { color: #f59e0b; border-color: #f59e0b; }
.act-edit:hover   { background: #f59e0b; color: #fff; }
.act-delete       { color: #ef4444; border-color: #ef4444; }
.act-delete:hover { background: #ef4444; color: #fff; }
.act-info         { color: #6366f1; border-color: #6366f1; }
.act-info:hover   { background: #6366f1; color: #fff; }

.table-role-badge {
  font-size: 0.78rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--bg-input);
  border: 1px solid var(--border-main);
  color: var(--text-primary);
}

/* ===== PAGINATION BASE (Desktop & Tablet) ===== */
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
.pagination-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}
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
  letter-spacing: 0.04em;
}

/* ===== TAMPILAN MOBILE RESPONSIVE (Layar HP) ===== */
@media (max-width: 576px) {
  .customer-grid { grid-template-columns: 1fr; padding: 10px; gap: 10px; }
  .customer-card { padding: 12px; gap: 8px; }
  .cc-avatar { width: 38px; height: 38px; font-size: 0.78rem; }
  .cc-name { white-space: normal; overflow: visible; text-overflow: unset; line-height: 1.3; font-size: 0.88rem; }
  .cc-status { flex-basis: auto; margin-left: 48px; }
  .cc-break { display: block; flex-basis: 100%; width: 0; height: 0; }
  .cc-row { white-space: normal; }
  .act-btn { width: 34px; height: 34px; }

  .pagination-card {
    flex-direction: column;
    padding: 12px;
    gap: 12px;
  }
  .pagination-nav {
    width: 100%;
    justify-content: space-between;
  }
  .btn-prev-next {
    flex: 1;
    max-width: 48%;
    padding: 10px 14px;
  }
  .page-badges {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }
  .page-badge {
    flex: 1;
    text-align: center;
    font-size: 0.7rem;
  }
}

@media (max-width: 768px) {
  .controls-row { flex-direction: column; align-items: stretch; gap: 10px; }
  .controls-left, .controls-right { width: 100%; justify-content: flex-start; flex-wrap: wrap; }
  .showing-wrap { flex: 1 1 auto; }
  .view-toggle { flex: 1 1 auto; }
  .view-toggle-btn { flex: 1; justify-content: center; }
  .search-wrap { width: 100%; }
  .search-input { width: 100%; }
  .sort-wrap { width: 100%; }
  .sort-wrap .drop-wrap { flex: 1; }
  .sort-wrap .btn-select { width: 100%; justify-content: space-between; }
}

/* ===== MODAL BASE & COMPONENT RENDER ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(2px);
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal-box {
  background: var(--bg-card);
  border-radius: 14px;
  width: 100%;
  max-width: 460px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: slideUp 0.22s ease;
}
.modal-sm { max-width: 360px; }
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border-main);
}
.modal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
.modal-title svg { color: #6366f1; }
.modal-close {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1rem;
  padding: 4px 6px;
  border-radius: 6px;
  transition: all 0.15s;
}
.modal-close:hover { background: var(--bg-nav-hover); color: var(--text-primary); }
.modal-body { padding: 20px; }
.modal-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 14px 20px;
  border-top: 1px solid var(--border-main);
}
.justify-content-center { justify-content: center !important; }

.btn-cancel {
  padding: 8px 18px;
  background: var(--bg-main);
  color: var(--text-muted);
  border: 1px solid var(--border-main);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-cancel:hover { background: var(--border-main); }

.detail-list { display: flex; flex-direction: column; }
.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-main);
  gap: 12px;
}
.detail-row:last-child { border-bottom: none; }
.detail-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}
.detail-value { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); }
.font-semibold { font-weight: 600; }
.mono { font-family: monospace; font-weight: 700; }
.detail-badge {
  font-size: 0.82rem;
  font-weight: 600;
  padding: 3px 12px;
  border-radius: 6px;
  background: rgba(99,102,241,0.1);
  color: #6366f1;
  border: 1px solid rgba(99,102,241,0.2);
}
.badge-active {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 99px;
  background: rgba(34,197,94,0.1);
  color: #16a34a;
}

.purchase-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 320px;
  overflow-y: auto;
}
.purchase-item {
  border: 1px solid var(--border-main);
  border-radius: 8px;
  padding: 10px 12px;
  background: var(--bg-input);
}
.purchase-item-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 4px;
}
.purchase-order-name { font-weight: 700; color: #6366f1; }
.purchase-product-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.purchase-meta {
  display: flex;
  gap: 14px;
  font-size: 0.78rem;
  color: var(--text-muted);
}
</style>