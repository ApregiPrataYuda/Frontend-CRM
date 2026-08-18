<script setup>
import { ref, onMounted } from 'vue'
import { useProductStore } from '@/stores/productStore'
import { useToast } from 'vue-toastification'

const store = useProductStore()
const toast = useToast()

onMounted(async () => {
  try {
    await store.fetchProducts()
  } catch (err) {
    toast.error('Gagal memuat data product.')
  }
})

// ── VIEW MODE (Card / Table) ──
const viewMode = ref('card')

// ── DROPDOWN OPEN/CLOSE STATE ──
const showPerPageMenu = ref(false)
const showSortByMenu  = ref(false)
const showSortDirMenu = ref(false)

const sortByLabel = () =>
  store.sortOptions.find(o => o.value === store.sort.column)?.label ?? 'Nama Produk'

// ── SYNC SEKARANG ──
// CATATAN: tombol ini SELALU ditampilkan di sini (ga ada pengecekan role
// Manager/Sales di frontend), karena project ini belum kasih tau field
// role user login disimpan di store mana. Backend (ProductController@sync)
// SUDAH aman -- kalau yang klik bukan Manager, request-nya di-reject 403
// dan toast error di bawah bakal muncul. Kalau kamu mau tombol ini juga
// DISEMBUNYIKAN dari Sales (bukan cuma direject di backend), kasih tau
// nama store/field buat cek role user login-nya, biar saya tambahin
// v-if di tombolnya.
async function handleSync() {
  if (store.syncing) return
  try {
    const result = await store.syncProducts()
    toast.success(`Sync berhasil. Total product: ${result?.total_products ?? '-'}.`)
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal sync product dari Odoo.')
  }
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="box-open" />
          Product Catalog
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" />
            Dashboard
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Product</span>
        </div>
      </div>

      <div class="sync-info">
        <span v-if="store.lastSyncedAt" class="sync-last">
          <font-awesome-icon icon="clock" /> Terakhir sync: {{ store.formatDate(store.lastSyncedAt) }}
        </span>
        <button class="btn-toolbar btn-purple" :disabled="store.syncing" @click="handleSync">
          <font-awesome-icon v-if="store.syncing" icon="spinner" spin />
          <font-awesome-icon v-else icon="rotate" />
          {{ store.syncing ? 'Menyinkronkan...' : 'Sync Sekarang' }}
        </button>
      </div>
    </div>

    <div class="controls-card">
      <div class="controls-row">
        <div class="controls-left">
          <div class="view-toggle">
            <button class="view-btn" :class="{ active: viewMode === 'card' }" @click="viewMode = 'card'">
              <font-awesome-icon icon="table-cells" /> Card
            </button>
            <button class="view-btn" :class="{ active: viewMode === 'table' }" @click="viewMode = 'table'">
              <font-awesome-icon icon="list" /> Table
            </button>
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
                    v-for="opt in [10,25,50,100]" :key="opt"
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
              :value="store.searchProduct"
              type="text"
              placeholder="Cari nama / kode / barcode produk..."
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
                <button v-for="opt in ['asc', 'desc']" :key="opt" class="drop-item"
                  :class="{ active: store.sort.direction === opt }"
                  @click="store.sort.direction = opt; store.changeSorting(); showSortDirMenu = false">{{ opt === 'asc' ? 'Asc' : 'Desc' }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-title">
      <font-awesome-icon icon="boxes-stacked" />
      <span>Daftar Product</span>
      <span class="count">{{ store.pagination.total }}</span>
    </div>

    <!-- ===== LOADING / EMPTY (dipakai bareng buat Card & Table) ===== -->
    <div v-if="store.loadingProducts" class="state-card mb-3">
      <font-awesome-icon icon="spinner" spin /> Memuat data...
    </div>
    <div v-else-if="store.productsData.length === 0" class="state-card mb-3">
      <div class="empty-state">
        <font-awesome-icon icon="inbox" class="empty-icon" />
        <div>Belum ada data product. Klik "Sync Sekarang" buat ambil data dari Odoo.</div>
      </div>
    </div>

    <!-- ===== CARD VIEW ===== -->
    <div v-else-if="viewMode === 'card'" class="product-grid flex-grow-1 overflow-auto mb-3">
      <div v-for="p in store.productsData" :key="p.id" class="product-card">
        <div class="product-card-head">
          <span class="mono product-code">{{ p.default_code || '-' }}</span>
        </div>
        <div class="product-name">{{ p.name }}</div>
        <div class="product-meta">
          <span v-if="p.category"><font-awesome-icon icon="tags" /> {{ p.category }}</span>
          <span v-if="p.uom"><font-awesome-icon icon="ruler" /> {{ p.uom }}</span>
        </div>
        <!-- BARCODE / HARGA JUAL / HARGA POKOK / STOK di-hidden dulu sesuai request,
             belum dihapus total field-nya di store/API -- gampang dimunculin lagi
             kalau nanti dibutuhin, tinggal un-comment blok ini. -->
        <!--
        <div v-if="p.barcode" class="product-barcode mono">
          <font-awesome-icon icon="barcode" /> {{ p.barcode }}
        </div>
        <div class="product-price-row">
          <div class="price-block">
            <div class="price-label">Harga Jual</div>
            <div class="price-value">{{ store.formatCurrency(p.list_price) }}</div>
          </div>
          <div class="price-block muted">
            <div class="price-label">Harga Pokok</div>
            <div class="price-value">{{ store.formatCurrency(p.standard_price) }}</div>
          </div>
        </div>
        -->
      </div>
    </div>

    <!-- ===== TABLE VIEW ===== -->
    <div v-else class="table-card flex-grow-1 overflow-auto mb-3">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:56px">NO.</th>
            <th style="width:120px">KODE / SKU</th>
            <th>NAMA PRODUK</th>
            <th style="width:160px">KATEGORI</th>
            <th style="width:90px">SATUAN</th>
            <!-- BARCODE / HARGA JUAL / HARGA POKOK / STOK di-hidden dulu sesuai
                 request -- lihat catatan yang sama di blok Card View di atas. -->
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, index) in store.productsData" :key="p.id" class="data-row">
            <td class="td-no">{{ (store.pagination.current_page - 1) * store.pagination.per_page + index + 1 }}.</td>
            <td class="mono">{{ p.default_code || '-' }}</td>
            <td class="font-semibold">{{ p.name }}</td>
            <td class="td-muted">{{ p.category || '-' }}</td>
            <td class="td-muted">{{ p.uom || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination-card">
      <div class="pagination-nav">
        <button
          class="btn-prev-next"
          :disabled="store.pagination.current_page === 1"
          @click="store.fetchProducts(store.pagination.prev_page_url)"
        >
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button
          class="btn-prev-next"
          :disabled="store.pagination.current_page === store.pagination.last_page"
          @click="store.fetchProducts(store.pagination.next_page_url)"
        >
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">{{ store.productsData.length }} DATA | PAGE {{ store.pagination.current_page }}</span>
        <span class="page-badge">TOTAL: {{ store.pagination.total }}</span>
      </div>
    </div>

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
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
}
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

.sync-info { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.sync-last { font-size: 0.78rem; color: var(--text-muted); display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }

.btn-toolbar {
  display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border: none; border-radius: 8px;
  font-size: 0.83rem; font-weight: 700; cursor: pointer; transition: all 0.18s ease; white-space: nowrap;
}
.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover:not(:disabled) { background: #4f46e5; }
.btn-purple:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-arrow { font-size: 0.6rem; opacity: 0.7; }

/* ===== CONTROLS ===== */
.controls-card { background: var(--bg-card); border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); }
.controls-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.controls-left, .controls-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

/* ===== VIEW TOGGLE (Card/Table) ===== */
.view-toggle { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; }
.view-btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; background: var(--bg-input);
  color: var(--text-muted); border: none; font-size: 0.83rem; font-weight: 600; cursor: pointer; transition: all 0.15s;
}
.view-btn + .view-btn { border-left: 1px solid var(--border-main); }
.view-btn.active { background: #6366f1; color: #fff; }
.view-btn:not(.active):hover { color: #6366f1; }
.showing-wrap { display: flex; align-items: center; gap: 6px; font-size: 0.84rem; color: var(--text-primary); font-weight: 600; }
.showing-label { white-space: nowrap; color: var(--text-muted); font-size: 0.83rem; }
.text-muted-color { color: var(--text-muted); }

.search-wrap { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.search-input { padding: 7px 12px; border: none; background: transparent; color: var(--text-primary); font-size: 0.84rem; outline: none; width: 240px; }
.search-input::placeholder { color: var(--text-muted); }
.search-btn { padding: 7px 12px; background: #6366f1; color: #fff; border: none; cursor: pointer; }
.search-btn:hover { background: #4f46e5; }
.sort-wrap { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

.drop-wrap { position: relative; }
.btn-select {
  display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; background: var(--bg-input);
  color: var(--text-primary); border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.83rem;
  font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.15s;
}
.btn-select:hover { border-color: #6366f1; color: #6366f1; }
.drop-menu {
  position: absolute; top: calc(100% + 6px); left: 0; min-width: 170px; background: var(--bg-card);
  border: 1px solid var(--border-main); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 10px; z-index: 200; opacity: 0; transform: translateY(-6px); pointer-events: none; transition: all 0.18s ease;
}
.drop-right { left: auto; right: 0; }
.drop-menu.show { opacity: 1; transform: translateY(0); pointer-events: all; }
.drop-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; padding: 0 4px; }
.drop-item {
  width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: none; border: none;
  border-radius: 7px; color: var(--text-primary); font-size: 0.84rem; cursor: pointer; transition: background 0.15s; text-align: left;
}
.drop-item:hover { background: var(--bg-nav-hover); }
.drop-item.active { color: #6366f1; font-weight: 600; background: rgba(99,102,241,0.08); }
.perpage-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.perpage-opt { padding: 5px 10px; border: 1px solid var(--border-main); border-radius: 6px; background: var(--bg-input); color: var(--text-primary); font-size: 0.82rem; cursor: pointer; transition: all 0.15s; }
.perpage-opt:hover { border-color: #6366f1; color: #6366f1; }
.perpage-opt.active { background: #6366f1; border-color: #6366f1; color: #fff; font-weight: 700; }

/* ===== SECTION TITLE ===== */
.section-title { display: flex; align-items: center; gap: 8px; font-size: 0.92rem; font-weight: 700; margin: 4px 2px 8px; }
.section-title .count { font-size: 0.76rem; color: #6366f1; background: rgba(99,102,241,0.1); padding: 2px 9px; border-radius: 20px; font-weight: 700; }

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
.td-muted { color: var(--text-muted); font-size: 0.84rem; }
.td-center { text-align: center; padding: 40px; color: var(--text-muted); }
.font-semibold { font-weight: 600; }
.mono { font-family: monospace; font-size: 0.8rem; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--text-muted); }
.empty-icon { font-size: 2rem; opacity: 0.3; }

.stock-chip { font-weight: 700; padding: 2px 10px; border-radius: 20px; background: rgba(34,197,94,0.12); color: #16a34a; white-space: nowrap; }
.stock-chip.low { background: rgba(239,68,68,0.1); color: #ef4444; }

/* ===== STATE CARD (loading/empty, dipakai bareng Card & Table) ===== */
.state-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); padding: 40px; text-align: center; color: var(--text-muted); }

/* ===== CARD VIEW ===== */
.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; align-content: start; }
.product-card {
  background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; padding: 14px 16px;
  box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: column; gap: 8px;
}
.product-card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.product-code { font-size: 0.76rem; color: var(--text-muted); }
.product-name { font-size: 0.92rem; font-weight: 700; color: var(--text-primary); line-height: 1.35; }
.product-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.78rem; color: var(--text-muted); }
.product-meta span { display: inline-flex; align-items: center; gap: 5px; }
.product-barcode { font-size: 0.76rem; color: var(--text-muted); display: inline-flex; align-items: center; gap: 5px; }
.product-price-row { display: flex; gap: 10px; padding-top: 8px; border-top: 1px solid var(--border-main); margin-top: 2px; }
.price-block { flex: 1; }
.price-block.muted .price-value { color: var(--text-muted); }
.price-label { font-size: 0.66rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
.price-value { font-size: 0.88rem; font-weight: 700; color: var(--text-primary); margin-top: 2px; }

/* ===== PAGINATION ===== */
.pagination-card { background: var(--bg-card); border-radius: 10px; padding: 14px 18px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: row-reverse; align-items: center; justify-content: space-between; gap: 12px; }
.pagination-nav { display: flex; align-items: center; gap: 8px; }
.btn-prev-next { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; min-width: 85px; justify-content: center; transition: background 0.18s ease; }
.btn-prev-next:hover:not(:disabled) { background: #4f46e5; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badges { display: flex; gap: 8px; align-items: center; }
.page-badge { padding: 7px 14px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); background: var(--bg-input); white-space: nowrap; letter-spacing: 0.04em; }

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