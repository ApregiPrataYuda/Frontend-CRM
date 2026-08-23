<script setup>
import { ref, computed, onMounted } from 'vue'
import { useReportProductBySalesStore } from '@/stores/reportProductBySalesStore'
import { useToast } from 'vue-toastification'

const store = useReportProductBySalesStore()
const toast = useToast()

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 3 + i) // -3 s/d +1 dari tahun berjalan

onMounted(async () => {
  try {
    await Promise.all([
      store.fetchReport(),
      store.fetchSummary(),
      store.fetchSalesOptions(), // full list, difilter di frontend (sama pola Sales Target)
    ])
  } catch (err) {
    toast.error('Gagal memuat laporan product by sales.')
  }
})

// ── DROPDOWN OPEN/CLOSE STATE ──
const showYearMenu    = ref(false)
const showPerPageMenu = ref(false)
const showSalesFilter = ref(false)
const showCategFilter = ref(false)

const salesFilterSearch = ref('')
const categFilterSearch = ref('')
let categFilterTimeout = null

const filteredSalesFilterOptions = computed(() => {
  const q = salesFilterSearch.value.trim().toLowerCase()
  return q
    ? store.salesOptions.filter(o => o.label.toLowerCase().includes(q))
    : store.salesOptions
})

const selectedSalesFilterLabel = computed(() =>
  store.salesOptions.find(o => o.value === store.filterSalesId)?.label || 'Semua Sales'
)
const selectedCategFilterLabel = computed(() =>
  store.categoryOptions.find(o => o.value === store.filterCategId)?.label || 'Semua Kategori'
)

async function changeYear(year) {
  showYearMenu.value = false
  try {
    await store.changePeriodYear(year)
  } catch (err) {
    toast.error('Gagal memuat ulang laporan.')
  }
}

function toggleSalesFilter() {
  showSalesFilter.value = !showSalesFilter.value
  if (showSalesFilter.value) salesFilterSearch.value = ''
}
async function pickSalesFilter(value) {
  showSalesFilter.value = false
  salesFilterSearch.value = ''
  try {
    await store.changeSalesFilter(value)
  } catch (err) {
    toast.error('Gagal memuat ulang laporan.')
  }
}

function toggleCategFilter() {
  showCategFilter.value = !showCategFilter.value
  if (showCategFilter.value) {
    categFilterSearch.value = ''
    store.fetchCategoryOptions('')
  }
}
function onCategFilterSearchInput() {
  clearTimeout(categFilterTimeout)
  categFilterTimeout = setTimeout(() => {
    store.fetchCategoryOptions(categFilterSearch.value)
  }, 350)
}
async function pickCategFilter(value) {
  showCategFilter.value = false
  categFilterSearch.value = ''
  try {
    await store.changeCategFilter(value)
  } catch (err) {
    toast.error('Gagal memuat ulang laporan.')
  }
}

// ── DETAIL MODAL (rincian transaksi di balik 1 baris rekap) ──
const showDetailModal = ref(false)

async function openDetailModal(row) {
  showDetailModal.value = true
  try {
    await store.fetchDetail(row.sales_id, row.odoo_product_id)
  } catch (err) {
    toast.error('Gagal memuat rincian transaksi.')
    showDetailModal.value = false
  }
}
function closeDetailModal() {
  showDetailModal.value = false
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="chart-column" />
          Report Product by Sales
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" />
            Dashboard
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Report Product by Sales</span>
        </div>
      </div>

      <div class="sync-info">
        <div class="drop-wrap">
          <button class="btn-select" @click="showYearMenu = !showYearMenu">
            <font-awesome-icon icon="calendar" /> Tahun {{ store.filterPeriodYear }}
            <font-awesome-icon icon="chevron-down" class="btn-arrow" />
          </button>
          <div class="drop-menu" :class="{ show: showYearMenu }">
            <div class="drop-label">Pilih Tahun</div>
            <button v-for="y in yearOptions" :key="y" class="drop-item"
              :class="{ active: store.filterPeriodYear === y }"
              @click="changeYear(y)">{{ y }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== RINGKASAN ===== -->
    <div class="section-title">
      <font-awesome-icon icon="chart-line" />
      <span>Ringkasan {{ store.filterPeriodYear }}</span>
    </div>

    <div v-if="store.loadingSummary" class="state-card mb-3">
      <font-awesome-icon icon="spinner" spin /> Memuat ringkasan...
    </div>
    <div v-else class="summary-grid mb-3">
      <div class="summary-card">
        <div class="summary-label">Total Omzet</div>
        <div class="summary-value">{{ store.formatCurrency(store.summaryData.total_omzet) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Total Qty Terjual</div>
        <div class="summary-value">{{ store.formatNumber(store.summaryData.total_qty) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Total Transaksi</div>
        <div class="summary-value">{{ store.formatNumber(store.summaryData.total_transactions) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Jumlah Product</div>
        <div class="summary-value">{{ store.formatNumber(store.summaryData.product_count) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Jumlah Sales</div>
        <div class="summary-value">{{ store.formatNumber(store.summaryData.sales_count) }}</div>
      </div>
    </div>

    <!-- ===== CONTROLS / FILTER ===== -->
    <div class="controls-card">
      <div class="controls-row">
        <div class="controls-left">
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
                    v-for="opt in [10,25,50,100]" :key="opt"
                    class="perpage-opt" :class="{ active: store.pagination.per_page === opt }"
                    @click="store.pagination.per_page = opt; showPerPageMenu = false; store.changePageSize()"
                  >{{ opt }}</button>
                </div>
              </div>
            </div>
          </div>

          <div class="drop-wrap">
            <button class="btn-select" @click="toggleSalesFilter">
              <font-awesome-icon icon="user" /> {{ selectedSalesFilterLabel }}
              <font-awesome-icon icon="chevron-down" class="btn-arrow" />
            </button>
            <div class="drop-menu drop-menu-filter" :class="{ show: showSalesFilter }">
              <input v-model="salesFilterSearch" type="text" class="drop-search-input" placeholder="Cari nama sales..." />
              <div class="drop-scroll-list">
                <button type="button" class="drop-item" :class="{ active: !store.filterSalesId }" @click="pickSalesFilter(null)">
                  Semua Sales
                </button>
                <button
                  v-for="opt in filteredSalesFilterOptions" :key="opt.value"
                  type="button" class="drop-item" :class="{ active: store.filterSalesId === opt.value }"
                  @click="pickSalesFilter(opt.value)"
                >{{ opt.label }}</button>
              </div>
            </div>
          </div>

          <div class="drop-wrap">
            <button class="btn-select" @click="toggleCategFilter">
              <font-awesome-icon icon="folder-tree" /> {{ selectedCategFilterLabel }}
              <font-awesome-icon icon="chevron-down" class="btn-arrow" />
            </button>
            <div class="drop-menu drop-menu-filter" :class="{ show: showCategFilter }">
              <input
                v-model="categFilterSearch" type="text" class="drop-search-input"
                placeholder="Cari nama kategori..." @input="onCategFilterSearchInput"
              />
              <div class="drop-scroll-list">
                <button type="button" class="drop-item" :class="{ active: !store.filterCategId }" @click="pickCategFilter(null)">
                  Semua Kategori
                </button>
                <div v-if="store.loadingCategoryOptions" class="drop-empty">
                  <font-awesome-icon icon="spinner" spin /> Mencari...
                </div>
                <template v-else>
                  <button
                    v-for="opt in store.categoryOptions" :key="opt.value"
                    type="button" class="drop-item" :class="{ active: store.filterCategId === opt.value }"
                    @click="pickCategFilter(opt.value)"
                  >{{ opt.label }}</button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="controls-right">
          <div class="search-wrap">
            <input
              :value="store.searchQuery"
              type="text"
              placeholder="Cari nama sales / product..."
              class="search-input"
              @input="store.searchWithDelay($event.target.value)"
            />
            <button class="search-btn"><font-awesome-icon icon="magnifying-glass" /></button>
          </div>
        </div>
      </div>
    </div>

    <div class="section-title">
      <font-awesome-icon icon="list-check" />
      <span>Rekap per Sales &amp; Product</span>
      <span class="count">{{ store.pagination.total }}</span>
    </div>

    <!-- ===== LOADING / EMPTY ===== -->
    <div v-if="store.loadingReport" class="state-card mb-3">
      <font-awesome-icon icon="spinner" spin /> Memuat data...
    </div>
    <div v-else-if="store.reportData.length === 0" class="state-card mb-3">
      <div class="empty-state">
        <font-awesome-icon icon="inbox" class="empty-icon" />
        <div>Belum ada transaksi product buat tahun {{ store.filterPeriodYear }} dengan filter ini.</div>
      </div>
    </div>

    <!-- ===== TABLE VIEW ===== -->
    <div v-else class="table-card flex-grow-1 overflow-auto mb-3">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:56px">NO.</th>
            <th>SALES</th>
            <th>PRODUCT</th>
            <th>KATEGORI</th>
            <th style="width:110px">QTY TERJUAL</th>
            <th style="width:150px">OMZET</th>
            <th style="width:100px">TRANSAKSI</th>
            <th style="width:80px">AKSI</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in store.reportData" :key="row.sales_id + '-' + row.odoo_product_id" class="data-row">
            <td class="td-no">{{ (store.pagination.current_page - 1) * store.pagination.per_page + index + 1 }}.</td>
            <td class="font-semibold">{{ row.sales_name || ('#' + row.sales_id) }}</td>
            <td>
              {{ row.product_name || ('#' + row.odoo_product_id) }}
              <div v-if="row.product_code" class="td-muted mono">[{{ row.product_code }}]</div>
            </td>
            <td>
              <span v-if="row.categ_name" class="category-chip">
                <font-awesome-icon icon="folder-tree" /> {{ row.categ_name }}
              </span>
              <span v-else class="td-muted">-</span>
            </td>
            <td>{{ store.formatNumber(row.total_qty) }}</td>
            <td class="font-semibold">{{ store.formatCurrency(row.total_omzet) }}</td>
            <td class="td-muted">{{ row.transaction_count }}x</td>
            <td>
              <button class="btn-icon" title="Detail" @click="openDetailModal(row)">
                <font-awesome-icon icon="eye" />
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
          @click="store.fetchReport(store.pagination.prev_page_url)"
        >
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button
          class="btn-prev-next"
          :disabled="store.pagination.current_page === store.pagination.last_page"
          @click="store.fetchReport(store.pagination.next_page_url)"
        >
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">{{ store.reportData.length }} DATA | PAGE {{ store.pagination.current_page }}</span>
        <span class="page-badge">TOTAL: {{ store.pagination.total }}</span>
      </div>
    </div>

    <!-- ===== MODAL: DETAIL (rincian transaksi) ===== -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
      <div class="modal-box modal-lg">
        <div class="modal-head">
          <h5>Rincian Transaksi</h5>
          <button class="modal-close" @click="closeDetailModal"><font-awesome-icon icon="xmark" /></button>
        </div>
        <div class="modal-body">

          <div v-if="store.loadingDetail" class="state-card">
            <font-awesome-icon icon="spinner" spin /> Memuat detail...
          </div>

          <template v-else-if="store.reportDetail">
            <div class="detail-head">
              <div>
                <div class="detail-sales-name">{{ store.reportDetail.sales_name }}</div>
                <div class="detail-sub">
                  {{ store.reportDetail.product_name }}
                  <span v-if="store.reportDetail.product_code">[{{ store.reportDetail.product_code }}]</span>
                  &middot; Tahun {{ store.reportDetail.period_year }}
                </div>
                <div v-if="store.reportDetail.categ_name" class="detail-sub">
                  <font-awesome-icon icon="folder-tree" /> {{ store.reportDetail.categ_name }}
                </div>
              </div>
            </div>
            <div class="detail-amounts">
              {{ store.formatCurrency(store.reportDetail.total_omzet) }}
              <span class="text-muted-color"> &middot; {{ store.formatNumber(store.reportDetail.total_qty) }} unit terjual</span>
            </div>

            <div class="detail-section-title">Daftar Transaksi</div>
            <div v-if="store.reportDetail.transactions.length === 0" class="state-card">
              Belum ada transaksi di tahun ini.
            </div>
            <div v-else class="detail-tx-list">
              <div v-for="(tx, i) in store.reportDetail.transactions" :key="i" class="detail-tx-item">
                <div class="detail-tx-top">
                  <span class="detail-tx-code">{{ tx.order_name || '-' }}</span>
                  <span class="detail-tx-date">{{ store.formatDate(tx.order_date) }}</span>
                </div>
                <div class="detail-tx-customer">
                  <font-awesome-icon icon="building" /> {{ tx.customer_name }}
                </div>
                <div class="detail-tx-bottom">
                  <span>Qty: {{ tx.qty }}</span>
                  <span>Harga: {{ store.formatCurrency(tx.price_unit) }}</span>
                  <span class="font-semibold">{{ store.formatCurrency(tx.subtotal) }}</span>
                </div>
              </div>
            </div>
          </template>

        </div>
        <div class="modal-footer">
          <button class="btn-toolbar btn-outline" @click="closeDetailModal">Tutup</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* ===== BREADCRUMB ===== */
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
.sync-info { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.btn-toolbar {
  display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border: none; border-radius: 8px;
  font-size: 0.83rem; font-weight: 700; cursor: pointer; transition: all 0.18s ease; white-space: nowrap;
}
.btn-outline { background: transparent; color: var(--text-primary); border: 1px solid var(--border-main); }
.btn-outline:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; }
.btn-arrow { font-size: 0.6rem; opacity: 0.7; }

/* ===== CONTROLS ===== */
.controls-card { background: var(--bg-card); border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); }
.controls-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.controls-left, .controls-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.showing-wrap { display: flex; align-items: center; gap: 6px; font-size: 0.84rem; color: var(--text-primary); font-weight: 600; }
.search-wrap { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.search-input { padding: 7px 12px; border: none; background: transparent; color: var(--text-primary); font-size: 0.84rem; outline: none; width: 220px; }
.search-input::placeholder { color: var(--text-muted); }
.search-btn { padding: 7px 12px; background: #6366f1; color: #fff; border: none; cursor: pointer; }
.search-btn:hover { background: #4f46e5; }
.showing-label { white-space: nowrap; color: var(--text-muted); font-size: 0.83rem; }
.text-muted-color { color: var(--text-muted); }

.drop-wrap { position: relative; }
.btn-select {
  display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; background: var(--bg-input);
  color: var(--text-primary); border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.83rem;
  font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.15s;
}
.btn-select:hover { border-color: #6366f1; color: #6366f1; }
.drop-menu {
  position: absolute; top: calc(100% + 6px); left: 0; min-width: 190px; background: var(--bg-card);
  border: 1px solid var(--border-main); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 10px; z-index: 200; opacity: 0; transform: translateY(-6px); pointer-events: none; transition: all 0.18s ease;
}
.drop-menu.show { opacity: 1; transform: translateY(0); pointer-events: all; }
.drop-menu-filter { min-width: 230px; }
.drop-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; padding: 0 4px; }
.drop-item {
  width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: none; border: none;
  border-radius: 7px; color: var(--text-primary); font-size: 0.84rem; cursor: pointer; transition: background 0.15s; text-align: left;
}
.drop-item:hover { background: var(--bg-nav-hover); }
.drop-item.active { color: #6366f1; font-weight: 600; background: rgba(99,102,241,0.08); }
.drop-search-input {
  width: 100%; padding: 7px 10px; border: 1px solid var(--border-main); border-radius: 7px;
  background: var(--bg-card); color: var(--text-primary); font-size: 0.82rem; outline: none; margin-bottom: 8px; font-family: inherit;
}
.drop-search-input:focus { border-color: #6366f1; }
.drop-scroll-list { max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.drop-empty { padding: 10px; text-align: center; font-size: 0.8rem; color: var(--text-muted); font-style: italic; }
.perpage-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.perpage-opt { padding: 5px 10px; border: 1px solid var(--border-main); border-radius: 6px; background: var(--bg-input); color: var(--text-primary); font-size: 0.82rem; cursor: pointer; transition: all 0.15s; }
.perpage-opt:hover { border-color: #6366f1; color: #6366f1; }
.perpage-opt.active { background: #6366f1; border-color: #6366f1; color: #fff; font-weight: 700; }

/* ===== SECTION TITLE ===== */
.section-title { display: flex; align-items: center; gap: 8px; font-size: 0.92rem; font-weight: 700; margin: 4px 2px 8px; }
.section-title .count { font-size: 0.76rem; color: #6366f1; background: rgba(99,102,241,0.1); padding: 2px 9px; border-radius: 20px; font-weight: 700; }

/* ===== STATE CARD ===== */
.state-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); padding: 40px; text-align: center; color: var(--text-muted); }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--text-muted); }
.empty-icon { font-size: 2rem; opacity: 0.3; }

/* ===== SUMMARY CARDS ===== */
.summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }
.summary-card { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; padding: 14px 16px; box-shadow: 0 1px 3px var(--shadow-color); }
.summary-label { font-size: 0.74rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px; }
.summary-value { font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }

/* ===== TABLE ===== */
.table-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.data-table thead tr { background: var(--bg-input); border-bottom: 2px solid var(--border-main); position: sticky; top: 0; z-index: 2; }
.data-table th { padding: 12px 18px; text-align: left; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap; }
.data-table tbody tr { border-bottom: 1px solid var(--border-main); transition: background 0.15s; }
.data-table tbody tr:last-child { border-bottom: none; }
.data-row:hover { background: var(--bg-nav-hover); }
.data-table td { padding: 13px 18px; vertical-align: middle; color: var(--text-primary); }
.td-no { color: var(--text-muted); font-weight: 600; }
.td-muted { color: var(--text-muted); font-size: 0.8rem; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.font-semibold { font-weight: 600; }
.category-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 0.72rem; font-weight: 700; padding: 2px 10px; border-radius: 20px; background: rgba(13,148,136,0.12); color: #0d9488; white-space: nowrap; }
.btn-icon { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--border-main); background: var(--bg-input); color: var(--text-muted); border-radius: 7px; cursor: pointer; transition: all 0.15s; }
.btn-icon:hover { border-color: #6366f1; color: #6366f1; }

/* ===== PAGINATION ===== */
.pagination-card { background: var(--bg-card); border-radius: 10px; padding: 14px 18px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: row-reverse; align-items: center; justify-content: space-between; gap: 12px; }
.pagination-nav { display: flex; align-items: center; gap: 8px; }
.btn-prev-next { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; min-width: 85px; justify-content: center; transition: background 0.18s ease; }
.btn-prev-next:hover:not(:disabled) { background: #4f46e5; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badges { display: flex; gap: 8px; align-items: center; }
.page-badge { padding: 7px 14px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); background: var(--bg-input); white-space: nowrap; letter-spacing: 0.04em; }

/* ===== MODAL ===== */
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
.modal-box { background: var(--bg-card); border-radius: 12px; width: 100%; max-width: 480px; max-height: 90vh; overflow: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.25); }
.modal-lg { max-width: 640px; }
.modal-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border-main); }
.modal-head h5 { margin: 0; font-size: 1rem; font-weight: 800; color: var(--text-primary); }
.modal-close { background: none; border: none; color: var(--text-muted); font-size: 1rem; cursor: pointer; }
.modal-close:hover { color: var(--text-primary); }
.modal-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px; border-top: 1px solid var(--border-main); }

.detail-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.detail-sales-name { font-size: 1rem; font-weight: 800; color: var(--text-primary); }
.detail-sub { font-size: 0.8rem; color: var(--text-muted); margin-top: 2px; }
.detail-amounts { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }
.detail-section-title { font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: -4px; }

.detail-tx-list { display: flex; flex-direction: column; gap: 8px; max-height: 360px; overflow-y: auto; }
.detail-tx-item { background: var(--bg-input); border: 1px solid var(--border-main); border-radius: 8px; padding: 10px 12px; }
.detail-tx-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.detail-tx-code { font-weight: 700; color: #6366f1; font-size: 0.82rem; }
.detail-tx-date { font-size: 0.76rem; color: var(--text-muted); white-space: nowrap; }
.detail-tx-customer { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin: 4px 0; display: flex; align-items: center; gap: 6px; }
.detail-tx-bottom { display: flex; gap: 14px; flex-wrap: wrap; font-size: 0.78rem; color: var(--text-muted); }

/* ===== MOBILE ===== */
@media (max-width: 900px) {
  .breadcrumb-card { flex-direction: column; align-items: flex-start; }
}
@media (max-width: 576px) {
  .pagination-card { flex-direction: column; padding: 12px; gap: 12px; }
  .pagination-nav { width: 100%; justify-content: space-between; }
  .btn-prev-next { flex: 1; max-width: 48%; padding: 10px 14px; }
  .page-badges { width: 100%; justify-content: center; flex-wrap: wrap; }
  .page-badge { flex: 1; text-align: center; font-size: 0.7rem; }
}
</style>