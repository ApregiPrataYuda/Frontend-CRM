<script setup>
import { ref, onMounted } from 'vue'
import AppModal from '@/components/AppModal.vue'
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

// ── PAGINATION ──
async function goTo(url) {
  try {
    await store.fetchProducts(url)
  } catch (err) {
    toast.error('Gagal memuat halaman product.')
  }
}

// ── DETAIL MODAL (stok WH / GRN / Consignment) ──
const isDetailVisible = ref(false)

async function openDetail(item) {
  isDetailVisible.value = true
  try {
    await store.fetchProductDetail(item.id)
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal memuat detail product.')
    isDetailVisible.value = false
  }
}

function closeDetail() {
  isDetailVisible.value = false
}

const bucketLabel = {
  wh: 'WH',
  grn: 'GRN',
  consignment: 'Consignment',
  other: 'Lainnya',
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="box-open" />
          Product Master Integration From Odoo
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
              placeholder="Cari nama / kode / barcode / brand..."
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
        <div v-if="store.searchProduct">Tidak ada product yang cocok dengan "{{ store.searchProduct }}".</div>
        <div v-else>Belum ada product yang di-assign ke Anda. Hubungi manager Anda untuk mendapatkan akses product.</div>
      </div>
    </div>

    <!-- ===== CARD VIEW ===== -->
    <div v-else-if="viewMode === 'card'" class="product-grid flex-grow-1 overflow-auto mb-3">
      <div
        v-for="p in store.productsData"
        :key="p.id"
        class="product-card clickable"
        role="button"
        tabindex="0"
        @click="openDetail(p)"
        @keydown.enter="openDetail(p)"
      >
        <div class="product-image">
          <img v-if="p.image_url" :src="p.image_url" :alt="p.name" loading="lazy" />
          <font-awesome-icon v-else icon="box-open" class="product-image-empty" />
        </div>

        <div class="product-card-head">
          <span class="mono product-code">{{ p.sku || '-' }}</span>
          <span v-if="p.brand" class="brand-chip">{{ p.brand.name }}</span>
        </div>
        <div class="product-name">{{ p.name }}</div>
        <div class="product-meta">
          <span v-if="p.category"><font-awesome-icon icon="tags" /> {{ p.category }}</span>
          <span v-if="p.uom"><font-awesome-icon icon="ruler" /> {{ p.uom }}</span>
        </div>

        <div class="product-price-row">
          <div class="price-block">
            <div class="price-label">Harga Jual</div>
            <div class="price-value">{{ store.formatCurrency(p.price) }}</div>
          </div>
        </div>
               <div class="product-stock-row">
          <span v-if="p.is_storable" class="stock-chip" :class="{ low: Number(p.qty_available) <= 0 }">
            <font-awesome-icon icon="boxes-stacked" />
            Stok: {{ store.formatStock(p.qty_available) }}<span v-if="p.uom"> {{ p.uom }}</span>
          </span>
          <span
            v-else
            class="stock-chip untracked"
            title="Product ini belum dicentang Track Inventory di Odoo, jadi stoknya tidak dihitung."
          >
            <font-awesome-icon icon="boxes-stacked" />
            Stok tidak dilacak
          </span>
        </div>
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
            <th style="width:150px">BRAND</th>
            <th style="width:160px">KATEGORI</th>
            <th style="width:90px">SATUAN</th>
            <th style="width:130px" class="text-end">HARGA JUAL</th>
            <th style="width:110px" class="text-end">STOK</th>
            <th style="width:80px; text-align:center">DETAIL</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, index) in store.productsData" :key="p.id" class="data-row">
            <td class="td-no">{{ (store.pagination.current_page - 1) * store.pagination.per_page + index + 1 }}.</td>
            <td class="mono">{{ p.sku || '-' }}</td>
            <td class="font-semibold">{{ p.name }}</td>
            <td class="td-muted">{{ p.brand?.name || '-' }}</td>
            <td class="td-muted">{{ p.category || '-' }}</td>
            <td class="td-muted">{{ p.uom || '-' }}</td>
            <td class="td-price text-end">{{ store.formatCurrency(p.price) }}</td>
            <td class="td-stock text-end">
              <span v-if="p.is_storable" class="stock-chip" :class="{ low: Number(p.qty_available) <= 0 }">
                {{ store.formatStock(p.qty_available) }}
              </span>
              <span
                v-else
                class="stock-chip untracked"
                title="Product ini belum dicentang Track Inventory di Odoo, jadi stoknya tidak dihitung."
              >Tidak dilacak</span>
            </td>
            <td style="text-align:center">
              <button class="act-btn act-info" title="Detail" @click="openDetail(p)">
                <font-awesome-icon icon="circle-info" />
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
          :disabled="!store.pagination.prev_page_url || store.loadingProducts"
          @click="goTo(store.pagination.prev_page_url)"
        >
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button
          class="btn-prev-next"
          :disabled="!store.pagination.next_page_url || store.loadingProducts"
          @click="goTo(store.pagination.next_page_url)"
        >
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">{{ store.productsData.length }} DATA | PAGE {{ store.pagination.current_page }}</span>
        <span class="page-badge">TOTAL: {{ store.pagination.total }}</span>
      </div>
    </div>

    <!-- ===== MODAL DETAIL ===== -->
    <AppModal
      :show="isDetailVisible"
      title="Product Details"
      icon="circle-info"
      size="md"
      @close="closeDetail"
    >
      <div v-if="store.loadingDetail" class="td-center">
        <font-awesome-icon icon="spinner" spin /> Memuat detail...
      </div>

      <template v-else-if="store.productDetail">
        <div class="detail-head">
          <div class="detail-image">
            <img v-if="store.productDetail.image_url" :src="store.productDetail.image_url" :alt="store.productDetail.name" />
            <font-awesome-icon v-else icon="box-open" class="product-image-empty" />
          </div>
          <div>
            <div class="detail-title">{{ store.productDetail.name }}</div>
            <div class="detail-sub mono">SKU {{ store.productDetail.sku || '-' }}</div>
            <div class="detail-price">{{ store.formatCurrency(store.productDetail.price) }}</div>
          </div>
        </div>

        <!-- Stok per kotak (hanya product yang dilacak stoknya) -->
        <template v-if="store.productDetail.stock">
          <div class="stock-boxes">
            <div class="stock-box">
              <div class="stock-box-label">Stock WH</div>
              <div class="stock-box-value">{{ store.formatStock(store.productDetail.stock.wh) }}</div>
            </div>
            <div class="stock-box">
              <div class="stock-box-label">Stock GRN</div>
              <div class="stock-box-value">{{ store.formatStock(store.productDetail.stock.grn) }}</div>
            </div>
            <div class="stock-box">
              <div class="stock-box-label">Consignment</div>
              <div class="stock-box-value">{{ store.formatStock(store.productDetail.stock.consignment) }}</div>
            </div>
          </div>
          <div v-if="store.productDetail.stock.other > 0" class="stock-note">
            {{ store.formatStock(store.productDetail.stock.other) }} unit lain berada di lokasi yang belum dipetakan.
          </div>

          <template v-if="store.productDetail.stock.locations.length">
            <div class="loc-title">Stok per lokasi</div>
            <div class="loc-list">
              <div v-for="(loc, i) in store.productDetail.stock.locations" :key="i" class="loc-row">
                <span class="loc-name">
                  {{ loc.location }}
                  <span class="loc-bucket">{{ bucketLabel[loc.bucket] || loc.bucket }}</span>
                </span>
                <span class="loc-qty">{{ store.formatStock(loc.quantity) }}</span>
              </div>
            </div>
          </template>
        </template>

             

        <div v-else class="stock-info">
          <font-awesome-icon icon="circle-info" />
          <div>
            <strong>Stok belum tersedia.</strong>
            Product ini belum dicentang <em>Track Inventory</em> di Odoo, sehingga Stock WH, GRN,
            dan Consignment tidak dihitung. Stok akan muncul otomatis setelah pengaturan di Odoo
            diperbarui dan data di-sync ulang.
          </div>
        </div>

        

        <div class="detail-list">
          <div class="detail-row">
            <span class="detail-label">Brand</span>
            <span class="detail-value">{{ store.productDetail.brand?.name || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Product Group</span>
            <span class="detail-value">{{ store.productDetail.product_group || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Kategori</span>
            <span class="detail-value">{{ store.productDetail.category || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Satuan</span>
            <span class="detail-value">{{ store.productDetail.uom || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Barcode</span>
            <span class="detail-value mono">{{ store.productDetail.barcode || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Terakhir sync</span>
            <span class="detail-value">{{ store.formatDate(store.productDetail.last_synced_at) }}</span>
          </div>
        </div>
      </template>

      <template #footer>
        <button class="btn-cancel" @click="closeDetail">Close</button>
      </template>
    </AppModal>

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
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--text-muted); max-width: 420px; margin: 0 auto; line-height: 1.5; }
.empty-icon { font-size: 2rem; opacity: 0.3; }

.stock-chip { font-weight: 700; padding: 2px 10px; border-radius: 20px; background: rgba(34,197,94,0.12); color: #16a34a; white-space: nowrap; }
.stock-chip.low { background: rgba(239,68,68,0.1); color: #ef4444; }
.stock-chip.untracked { background: var(--bg-input); color: var(--text-muted); border: 1px dashed var(--border-main); font-weight: 600; cursor: help; }

.stock-info { display: flex; gap: 10px; align-items: flex-start; margin-top: 14px; padding: 12px 14px; border-radius: 10px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.3); font-size: 0.82rem; line-height: 1.5; color: var(--text-primary); }
.stock-info svg { color: #d97706; margin-top: 3px; flex-shrink: 0; }

/* ===== STATE CARD (loading/empty, dipakai bareng Card & Table) ===== */
.state-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); padding: 40px; text-align: center; color: var(--text-muted); }

/* ===== CARD VIEW ===== */
.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; align-content: start; }
.product-card {
  background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; padding: 14px 16px;
  box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: column; gap: 8px;
}
.product-image {
  height: 140px; margin: -14px -16px 4px; border-radius: 10px 10px 0 0; overflow: hidden;
  background: var(--bg-input); display: flex; align-items: center; justify-content: center;
  border-bottom: 1px solid var(--border-main);
}
.product-image img { width: 100%; height: 100%; object-fit: contain; }
.product-image-empty { font-size: 2.2rem; color: var(--text-muted); opacity: 0.25; }
.product-card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.product-code { font-size: 0.76rem; color: var(--text-muted); }
.brand-chip { font-size: 0.7rem; font-weight: 700; color: #6366f1; background: rgba(99,102,241,0.1); padding: 2px 8px; border-radius: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60%; }
.product-name { font-size: 0.92rem; font-weight: 700; color: var(--text-primary); line-height: 1.35; }
.product-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.78rem; color: var(--text-muted); }
.product-meta span { display: inline-flex; align-items: center; gap: 5px; }
.product-price-row { display: flex; gap: 10px; padding-top: 8px; border-top: 1px solid var(--border-main); margin-top: 2px; }
.price-block { flex: 1; }
.price-label { font-size: 0.66rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
.price-value { font-size: 0.88rem; font-weight: 700; color: var(--text-primary); margin-top: 2px; }
.product-stock-row { display: flex; padding-top: 6px; border-top: 1px solid var(--border-main); margin-top: 2px; }
.stock-chip { display: inline-flex; align-items: center; gap: 6px; }
.td-stock, .td-price { white-space: nowrap; }

/* ===== PAGINATION ===== */
.pagination-card { background: var(--bg-card); border-radius: 10px; padding: 14px 18px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: row-reverse; align-items: center; justify-content: space-between; gap: 12px; }
.pagination-nav { display: flex; align-items: center; gap: 8px; }
.btn-prev-next { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; min-width: 85px; justify-content: center; transition: background 0.18s ease; }
.btn-prev-next:hover:not(:disabled) { background: #4f46e5; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badges { display: flex; gap: 8px; align-items: center; }
.page-badge { padding: 7px 14px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); background: var(--bg-input); white-space: nowrap; letter-spacing: 0.04em; }

/* ===== DETAIL MODAL ===== */
.clickable { cursor: pointer; }
.product-card.clickable:hover { border-color: rgba(99,102,241,0.45); }
.product-card.clickable:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }
.detail-head { display: flex; gap: 14px; align-items: flex-start; }
.detail-image { width: 96px; height: 96px; flex-shrink: 0; border-radius: 10px; border: 1px solid var(--border-main); background: var(--bg-input); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.detail-image img { width: 100%; height: 100%; object-fit: contain; }
.detail-title { font-size: 0.98rem; font-weight: 800; color: var(--text-primary); line-height: 1.35; }
.detail-sub { font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; }
.detail-price { font-size: 1rem; font-weight: 800; color: #6366f1; margin-top: 6px; }
.detail-list { display: flex; flex-direction: column; margin-top: 12px; }
.detail-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-main); gap: 12px; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.detail-value { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); text-align: right; }
.stock-boxes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 14px; }
.stock-box { border: 1px solid rgba(99,102,241,0.25); background: rgba(99,102,241,0.05); border-radius: 10px; padding: 10px; text-align: center; }
.stock-box-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
.stock-box-value { font-size: 1.3rem; font-weight: 800; color: var(--text-primary); margin-top: 2px; }
.stock-note { font-size: 0.76rem; color: var(--text-muted); margin-top: 8px; }
.loc-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin: 16px 0 6px; }
.loc-list { max-height: 200px; overflow-y: auto; border: 1px solid var(--border-main); border-radius: 8px; }
.loc-row { display: flex; justify-content: space-between; gap: 10px; padding: 8px 12px; font-size: 0.8rem; border-bottom: 1px solid var(--border-main); }
.loc-row:last-child { border-bottom: none; }
.loc-name { color: var(--text-primary); }
.loc-bucket { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; color: #6366f1; margin-left: 6px; }
.loc-qty { font-weight: 700; white-space: nowrap; }
.act-btn { width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s ease; background: transparent; }
.act-info { color: #6366f1; border-color: #6366f1; }
.act-info:hover { background: #6366f1; color: #fff; }
.btn-cancel { padding: 8px 18px; background: var(--bg-main, #f1f5f9); color: var(--text-muted); border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-cancel:hover { background: var(--border-main); color: var(--text-primary); }

/* ===== MOBILE ===== */
@media (max-width: 900px) {
  .breadcrumb-card { flex-direction: column; align-items: flex-start; }
}
@media (max-width: 576px) {
  .search-input { width: 100%; }
  .stock-boxes { grid-template-columns: 1fr; }
  .pagination-card { flex-direction: column; padding: 12px; gap: 12px; }
  .pagination-nav { width: 100%; justify-content: space-between; }
  .btn-prev-next { flex: 1; max-width: 48%; padding: 10px 14px; }
  .page-badges { width: 100%; justify-content: center; flex-wrap: wrap; }
  .page-badge { flex: 1; text-align: center; font-size: 0.7rem; }
}
</style>