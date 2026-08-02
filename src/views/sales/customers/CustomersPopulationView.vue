<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { usecustomersPopulationStore } from '@/stores/customersPopulationStore'

const store = usecustomersPopulationStore()

const {
  customersData, loadingCustomers, searchCustomers,
  filterPurchased, pagination, sort,
  customerDetail, purchaseItems, loadingDetail,
  syncingCustomers, syncingPurchases,
} = storeToRefs(store)

onMounted(() => {
  store.fetchCustomers()
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
import { ref } from 'vue'
const showFilterMenu   = ref(false)
const showPerPageMenu  = ref(false)
const showSortByMenu   = ref(false)
const showSortDirMenu  = ref(false)

function handleReset() {
  store.resetFilters()
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
          Customer Population
        </h4>

        <div class="breadcrumb-path">
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">
            Customer Population
          </span>
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

    <div class="table-card flex-grow-1 overflow-auto mb-3">
      <table class="data-table">
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
          <tr v-if="loadingCustomers">
            <td colspan="7" class="td-center">
              <font-awesome-icon icon="spinner" spin /> Memuat data...
            </td>
          </tr>
          <tr v-else-if="customersData.length === 0">
            <td colspan="7" class="td-center">
              <div class="empty-state">
                <font-awesome-icon icon="inbox" class="empty-icon" />
                <div>Tidak ada data ditemukan</div>
              </div>
            </td>
          </tr>
          <tr v-else v-for="(customer, index) in customersData" :key="customer.id" class="data-row">
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
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--text-muted); }
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

/* Custom Form Stack Gap Alignment */
.form-container-gap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.form-input {
  padding: 9px 12px;
  border: 1px solid var(--border-main);
  border-radius: 8px;
  font-size: 0.875rem;
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
  transition: border 0.18s;
  width: 100%;
}
.form-input:focus { border-color: #6366f1; }

/* Styling Dropdown Select Custom Arrow */
.form-select {
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image:
    linear-gradient(45deg, transparent 50%, #64748b 50%),
    linear-gradient(135deg, #64748b 50%, transparent 50%);
  background-position:
    calc(100% - 20px) calc(50% - 2px),
    calc(100% - 14px) calc(50% - 2px);
  background-size: 6px 6px;
  background-repeat: no-repeat;
  padding-right: 40px;
}
.form-select:focus {
  background-image:
    linear-gradient(45deg, transparent 50%, #6366f1 50%),
    linear-gradient(135deg, #6366f1 50%, transparent 50%);
}

/* ===== STYLING SEGMENTED CONTROL PILL ===== */
.segment-group {
  display: flex;
  background: var(--bg-input);
  border: 1px solid var(--border-main);
  padding: 4px;
  border-radius: 30px; /* Membuat base melengkung penuh kapsul */
  width: 100%;
  overflow-x: auto;
}
.segment-btn {
  flex: 1;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 24px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  white-space: nowrap;
  text-align: center;
}
.segment-btn:hover:not(.active) {
  background: var(--bg-nav-hover);
}
.segment-btn.active {
  background: #6366f1; /* Menggunakan warna ungu serasi tema dashboard-mu */
  color: #ffffff;
  box-shadow: 0 3px 8px rgba(99, 102, 241, 0.35);
}

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
.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 18px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-save:hover { background: #4f46e5; }
.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 18px;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-danger:hover { background: #dc2626; }
.delete-icon-wrap {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(239,68,68,0.1);
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  margin: 0 auto 14px;
}
.modal-danger-title { font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
.modal-danger-text  { font-size: 0.84rem; color: var(--text-muted); padding: 0 10px; line-height: 1.6; }
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

/* ===== STYLING CUSTOM FILE UPLOAD ===== */
.file-upload-wrapper {
  position: relative;
  width: 100%;
}

/* Sembunyikan input file bawaan HTML yang jelek */
.file-hidden-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

/* Label pengganti sebagai container luar */
.file-custom-label {
  display: flex;
  align-items: center;
  border: 1.5px dashed var(--border-main);
  border-radius: 8px;
  padding: 4px;
  background: var(--bg-input);
  cursor: pointer;
  transition: border-color 0.15s ease;
  width: 100%;
}

.file-custom-label:hover {
  border-color: #6366f1;
}

/* Tombol Browse Ungu di bagian kiri */
.btn-browse {
  background: #6366f1;
  color: #ffffff;
  padding: 6px 14px;
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  transition: background 0.15s;
  user-select: none;
}

.file-custom-label:hover .btn-browse {
  background: #4f46e5;
}

/* Teks nama file di sebelah tombol */
.file-name-text {
  font-size: 0.85rem;
  color: var(--text-muted);
  padding-left: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
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