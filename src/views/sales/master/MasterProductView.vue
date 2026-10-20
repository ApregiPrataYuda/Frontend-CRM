<script setup>
import { ref, onMounted } from 'vue'
import AppModal from '@/components/AppModal.vue'
import ProductQrCode from '@/components/ProductQrCode.vue'
import { useProductStore } from '@/stores/productStore'
import { useToast } from 'vue-toastification'

const store = useProductStore()
const toast = useToast()

onMounted(async () => {
  store.fetchFilters()
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

// ── BADGE STOK (sama dengan aplikasi mobile) ──
// stock_status dari API: in_stock / low (<= batas) / out / untracked
// Angka = stok siap jual (WH + GRN + Consignment), sama dengan kotak di detail.
function stockBadge(p) {
  const uom = p.uom ? ` ${p.uom}` : ''
  switch (p.stock_status) {
    case 'in_stock': return { cls: 'in',   label: `Stok: ${store.formatStock(p.stock_ready)}${uom}` }
    case 'low':      return { cls: 'low',  label: `Stok: ${store.formatStock(p.stock_ready)}${uom}` }
    case 'out':      return { cls: 'out',  label: 'Out of stock' }
    default:         return { cls: 'untracked', label: 'Stok tidak dilacak' }
  }
}

// ── PAGINATION ──
async function goTo(url) {
  try {
    await store.fetchProducts(url)
  } catch (err) {
    toast.error('Gagal memuat halaman product.')
  }
}

// ── DETAIL MODAL ──
const isDetailVisible = ref(false)
const activeTab       = ref('detail')   // detail / sold / purchase
const showQr          = ref(false)      // panel QR code (dibuat di browser dari SKU, tidak disimpan)

async function openDetail(item) {
  activeTab.value       = 'detail'
  showQr.value          = false
  isDetailVisible.value = true
  try {
    await store.fetchProductDetail(item.id)
    store.fetchOrderStatus(item.id)   // bagian Status Order di tab Detail (tidak ditunggu)
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal memuat detail product.')
    isDetailVisible.value = false
  }
}

function closeDetail() {
  isDetailVisible.value = false
}

// ── TAB SOLD / PURCHASE ──
async function switchTab(tab) {
  activeTab.value = tab
  const id = store.productDetail?.id
  if (!id) return

  try {
    if (tab === 'sold')     await store.openSoldTab(id)
    if (tab === 'purchase' && !store.purchase.loaded) await store.fetchPurchases(id)
    if (tab === 'invoice' && !store.invoice.loaded) await store.fetchInvoices(id)
    if (tab === 'delivery' && !store.delivery.loaded) await store.fetchDeliveries(id)
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal memuat data.')
  }
}

async function reloadSold(append = false) {
  try {
    await store.fetchSold(store.productDetail.id, append)
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal memuat data penjualan.')
  }
}

function setSoldType(type) {
  if (store.sold.type === type) return
  store.sold.type = type
  reloadSold()
}

async function reloadPurchases(append = false) {
  try {
    await store.fetchPurchases(store.productDetail.id, append)
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal memuat data purchase.')
  }
}

// ── TAB INVOICE ──
async function reloadInvoices(append = false) {
  store.closeInvoiceDetail()
  try {
    await store.fetchInvoices(store.productDetail.id, append)
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal memuat invoice.')
  }
}

function setInvoiceType(type) {
  if (store.invoice.type === type) return
  store.invoice.type = type
  reloadInvoices()
}

async function openInvoice(invoiceId) {
  try {
    await store.fetchInvoiceDetail(invoiceId)
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal memuat detail invoice.')
  }
}

// Label badge status invoice (warna dari kelas inv-badge-<status>; label dari API)
function invoiceStatusLabel(item) {
  return item.status_label || item.status
}

// ── TAB DELIVERY ──
async function reloadDeliveries(append = false) {
  store.closeDeliveryDetail()
  try {
    await store.fetchDeliveries(store.productDetail.id, append)
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal memuat data pengiriman.')
  }
}

function setDeliveryType(type) {
  if (store.delivery.type === type) return
  store.delivery.type = type
  reloadDeliveries()
}

async function openDelivery(deliveryId) {
  try {
    await store.fetchDeliveryDetail(deliveryId)
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal memuat detail pengiriman.')
  }
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

      <!-- ===== CHIP FILTER (sama dengan mobile; disembunyikan bila datanya kosong) ===== -->
      <div v-if="store.filterOptions.brands.length || store.filterOptions.categories.length" class="chip-filters">
        <div v-if="store.filterOptions.brands.length" class="chip-row">
          <span class="chip-label">Brand</span>
          <button class="chip" :class="{ active: !store.selectedBrand }" @click="store.selectBrand(null)">All</button>
          <button
            v-for="b in store.filterOptions.brands" :key="b.id"
            class="chip" :class="{ active: store.selectedBrand === b.id }"
            :title="b.name"
            @click="store.selectBrand(b.id)"
          >{{ b.short_name }}</button>
        </div>
        <div v-if="store.filterOptions.categories.length" class="chip-row">
          <span class="chip-label">Category</span>
          <button class="chip" :class="{ active: !store.selectedCateg }" @click="store.selectCategory(null)">All</button>
          <button
            v-for="c in store.filterOptions.categories" :key="c.id"
            class="chip" :class="{ active: store.selectedCateg === c.id }"
            :title="c.name"
            @click="store.selectCategory(c.id)"
          >{{ c.short_name }}</button>
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
        <div v-if="store.searchProduct || store.selectedBrand || store.selectedCateg">Tidak ada product yang cocok dengan pencarian / filter.</div>
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

        <div class="product-name">{{ p.name }}</div>
        <div class="product-sub">
          <span v-if="p.brand">{{ p.brand.short_name }} · </span>{{ p.sku || '-' }}
        </div>
        <div class="product-meta">
          <span v-if="p.category"><font-awesome-icon icon="tags" /> {{ p.category }}</span>
          <span v-if="p.uom"><font-awesome-icon icon="ruler" /> {{ p.uom }}</span>
        </div>

        <div class="product-foot">
          <div class="price-value">{{ store.formatCurrency(p.price) }}</div>
          <span
            class="stock-badge"
            :class="stockBadge(p).cls"
            :title="p.stock_status === 'untracked' ? 'Product ini belum dicentang Track Inventory di Odoo, jadi stoknya tidak dihitung.' : 'Stok siap jual: WH + GRN + Consignment'"
          >{{ stockBadge(p).label }}</span>
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
            <th style="width:150px" class="text-end">STOK</th>
            <th style="width:80px; text-align:center">DETAIL</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, index) in store.productsData" :key="p.id" class="data-row clickable" @click="openDetail(p)">
            <td class="td-no">{{ (store.pagination.current_page - 1) * store.pagination.per_page + index + 1 }}.</td>
            <td class="mono">{{ p.sku || '-' }}</td>
            <td class="font-semibold">{{ p.name }}</td>
            <td class="td-muted">{{ p.brand?.short_name || '-' }}</td>
            <td class="td-muted">{{ p.category || '-' }}</td>
            <td class="td-muted">{{ p.uom || '-' }}</td>
            <td class="td-price text-end">{{ store.formatCurrency(p.price) }}</td>
            <td class="td-stock text-end">
              <span
                class="stock-badge"
                :class="stockBadge(p).cls"
                :title="p.stock_status === 'untracked' ? 'Product ini belum dicentang Track Inventory di Odoo, jadi stoknya tidak dihitung.' : 'Stok siap jual: WH + GRN + Consignment'"
              >{{ p.stock_status === 'untracked' ? 'Tidak dilacak' : (p.stock_status === 'out' ? 'Out of stock' : store.formatStock(p.stock_ready)) }}</span>
            </td>
            <td style="text-align:center">
              <button class="act-btn act-info" title="Detail" @click.stop="openDetail(p)">
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
          <button
            class="btn-qr"
            :class="{ active: showQr }"
            :disabled="!store.productDetail.sku"
            :title="store.productDetail.sku ? 'Tampilkan QR code dari SKU' : 'Product belum punya SKU'"
            @click="showQr = !showQr"
          >QR Code</button>
        </div>

        <!-- ===== QR CODE dari SKU (dibuat di browser, tidak disimpan; bisa di-download PNG) ===== -->
        <ProductQrCode
          v-if="showQr && store.productDetail.sku"
          :value="store.productDetail.sku"
          :title="store.productDetail.name"
        />

        <!-- ===== TAB (sama dengan mobile: Detail / Sold / Purchase) ===== -->
        <div class="detail-tabs" role="tablist">
          <button
            v-for="t in [{ v: 'detail', l: 'Detail' }, { v: 'sold', l: 'Sold' }, { v: 'purchase', l: 'Purchase' }, { v: 'invoice', l: 'Invoice' }, { v: 'delivery', l: 'Delivery' }]"
            :key="t.v"
            class="detail-tab"
            :class="{ active: activeTab === t.v }"
            role="tab"
            :aria-selected="activeTab === t.v"
            @click="switchTab(t.v)"
          >{{ t.l }}</button>
        </div>

        <!-- ===== TAB DETAIL (isi tidak diubah) ===== -->
        <template v-if="activeTab === 'detail'">
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

          <!-- ===== STATUS ORDER (SO terbaru berisi product ini, 4 tahap) ===== -->
          <div class="loc-title">Status order</div>
          <div v-if="store.orderStatus.loading" class="tx-empty">
            <font-awesome-icon icon="spinner" spin /> Memuat status order...
          </div>
          <div v-else-if="!store.orderStatus.items.length" class="tx-empty">
            {{ store.orderStatus.scope === 'own' ? 'Belum ada order (SO) Anda untuk product ini.' : 'Belum ada order (SO) untuk product ini.' }}
          </div>
          <div v-else class="os-list">
            <div v-for="o in store.orderStatus.items" :key="o.order_id" class="os-card">
              <div class="os-title">
                <span class="mono">{{ o.order_number }}</span> · {{ o.customer || '-' }}
              </div>
              <div class="os-sub">{{ store.formatShortDate(o.date) }} · {{ o.salesperson || '-' }} · {{ store.formatCurrency(o.amount_total) }}</div>
              <div class="os-steps">
                <div
                  v-for="(s, i) in o.stages"
                  :key="s.key"
                  class="os-step"
                  :class="`os-${s.status}`"
                  :title="s.status === 'in_progress' ? `${s.label}: sebagian` : s.label"
                >
                  <div class="os-track">
                    <span class="os-line" :class="{ hidden: i === 0, on: s.status === 'done' }"></span>
                    <span class="os-dot"></span>
                    <span class="os-line" :class="{ hidden: i === o.stages.length - 1, on: o.stages[i + 1]?.status === 'done' }"></span>
                  </div>
                  <div class="os-label">{{ s.label }}</div>
                </div>
              </div>
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

        <!-- ===== TAB SOLD (Quotation + SO per bulan) ===== -->
        <template v-else-if="activeTab === 'sold'">
          <div class="tx-toolbar">
            <div class="tx-summary">
              <template v-if="store.sold.summary">
                <strong>{{ store.sold.summary.transaction_count }} transaksi</strong>
                · {{ store.formatCurrency(store.sold.summary.total_amount) }}
                <span v-if="store.sold.summary.quotation_count" class="tx-summary-sub">
                  · {{ store.sold.summary.quotation_count }} quotation
                </span>
              </template>
              <template v-else>&nbsp;</template>
            </div>
            <label class="month-pick">
              <input v-model="store.sold.month" type="month" @change="reloadSold()" />
            </label>
          </div>

          <div class="tx-filter">
            <button
              v-for="t in [{ v: 'all', l: 'Semua' }, { v: 'so', l: 'SO' }, { v: 'quotation', l: 'Quotation' }]"
              :key="t.v"
              class="chip" :class="{ active: store.sold.type === t.v }"
              @click="setSoldType(t.v)"
            >{{ t.l }}</button>
          </div>

          <div v-if="store.sold.loading && !store.sold.items.length" class="tx-empty">
            <font-awesome-icon icon="spinner" spin /> Memuat data...
          </div>
          <div v-else-if="!store.sold.items.length" class="tx-empty">
            {{ store.sold.scope === 'own' ? 'Belum ada penjualan Anda di bulan ini.' : 'Belum ada penjualan di bulan ini.' }}
          </div>
          <div v-else class="tx-list">
            <div v-for="tx in store.sold.items" :key="tx.order_id" class="tx-row">
              <div class="tx-main">
                <div class="tx-name">{{ tx.customer || '-' }}</div>
                <div class="tx-sub">
                  {{ store.formatShortDate(tx.date) }} · {{ tx.salesperson || '-' }}
                </div>
                <div class="tx-sub mono">{{ tx.order_number }}</div>
              </div>
              <div class="tx-side">
                <div class="tx-amount">{{ store.formatCurrency(tx.amount) }}</div>
                <div class="tx-meta">
                  <span class="tx-badge" :class="tx.type">{{ tx.type_label }}</span>
                  qty {{ store.formatStock(tx.qty) }}
                </div>
              </div>
            </div>
            <button v-if="store.sold.next" class="btn-more" :disabled="store.sold.loading" @click="reloadSold(true)">
              <font-awesome-icon v-if="store.sold.loading" icon="spinner" spin />
              Muat lebih banyak
            </button>
          </div>
          <div class="tx-note">Total hanya dari SO (Quotation tidak dihitung). Nilai sesudah pajak.</div>
        </template>

        <!-- ===== TAB PURCHASE (PO per bulan) ===== -->
        <template v-else-if="activeTab === 'purchase'">
          <div class="tx-toolbar">
            <div class="tx-summary">
              <template v-if="store.purchase.summary">
                <strong>{{ store.purchase.summary.purchase_count }} purchase</strong>
                · {{ store.formatStock(store.purchase.summary.total_qty) }} unit
                <span v-if="store.purchase.summary.total_amount !== null" class="tx-summary-sub">
                  · {{ store.formatCurrency(store.purchase.summary.total_amount) }}
                </span>
              </template>
              <template v-else>&nbsp;</template>
            </div>
            <label class="month-pick">
              <input v-model="store.purchase.month" type="month" @change="reloadPurchases()" />
            </label>
          </div>

          <div v-if="store.purchase.loading && !store.purchase.items.length" class="tx-empty">
            <font-awesome-icon icon="spinner" spin /> Memuat data...
          </div>
          <div v-else-if="!store.purchase.items.length" class="tx-empty">
            Belum ada pembelian di bulan ini.
          </div>
          <div v-else class="tx-list">
            <div v-for="po in store.purchase.items" :key="po.po_id" class="tx-row">
              <div class="tx-main">
                <div class="tx-name">{{ po.vendor || '-' }}</div>
                <div class="tx-sub mono">{{ po.po_number }} · {{ store.formatShortDate(po.date) }}</div>
              </div>
              <div class="tx-side">
                <div v-if="po.amount !== null" class="tx-amount">{{ store.formatCurrency(po.amount) }}</div>
                <div class="tx-meta">qty {{ store.formatStock(po.qty) }}<span v-if="po.uom"> {{ po.uom }}</span></div>
              </div>
            </div>
            <button v-if="store.purchase.next" class="btn-more" :disabled="store.purchase.loading" @click="reloadPurchases(true)">
              <font-awesome-icon v-if="store.purchase.loading" icon="spinner" spin />
              Muat lebih banyak
            </button>
          </div>
          <div class="tx-note">Hanya PO yang sudah dikonfirmasi. Nilai sesudah pajak.</div>
        </template>

        <!-- ===== TAB INVOICE (invoice berisi product ini per bulan) ===== -->
        <template v-else-if="activeTab === 'invoice'">

          <!-- Detail satu invoice -->
          <div v-if="store.loadingInvoiceDetail" class="tx-empty">
            <font-awesome-icon icon="spinner" spin /> Memuat detail invoice...
          </div>

          <template v-else-if="store.invoiceDetail">
            <button class="btn-back" @click="store.closeInvoiceDetail()">
              <font-awesome-icon icon="circle-left" /> Kembali ke daftar invoice
            </button>

            <div class="inv-head">
              <div>
                <div class="inv-number">
                  {{ store.invoiceDetail.number || 'Draft (belum bernomor)' }}
                  <span class="inv-type">{{ store.invoiceDetail.type_label }}</span>
                </div>
                <div class="tx-sub">{{ store.invoiceDetail.partner || '-' }} · {{ store.invoiceDetail.company }}</div>
              </div>
              <span class="inv-badge" :class="`inv-badge-${store.invoiceDetail.status}`">
                {{ invoiceStatusLabel(store.invoiceDetail) }}
              </span>
            </div>

            <div class="inv-grid">
              <div><span class="inv-label">Tanggal invoice</span>{{ store.formatShortDate(store.invoiceDetail.invoice_date) }}</div>
              <div><span class="inv-label">Jatuh tempo</span>
                <span :class="{ 'text-danger-strong': store.invoiceDetail.is_overdue }">{{ store.formatShortDate(store.invoiceDetail.due_date) }}</span>
              </div>
              <div><span class="inv-label">Sales person</span>{{ store.invoiceDetail.salesperson || '-' }}</div>
              <div><span class="inv-label">Referensi</span>{{ store.invoiceDetail.reference || '-' }}</div>
            </div>

            <div class="inv-totals">
              <div class="inv-total-row"><span>Sebelum pajak</span><span>{{ store.formatCurrency(store.invoiceDetail.amount_untaxed) }}</span></div>
              <div class="inv-total-row"><span>Pajak</span><span>{{ store.formatCurrency(store.invoiceDetail.amount_tax) }}</span></div>
              <div class="inv-total-row inv-total-main"><span>Total</span><span>{{ store.formatCurrency(store.invoiceDetail.invoice_total) }}</span></div>
              <template v-if="store.invoiceDetail.state === 'posted'">
                <div class="inv-total-row"><span>Sudah dibayar</span><span>{{ store.formatCurrency(store.invoiceDetail.amount_paid) }}</span></div>
                <div class="inv-total-row inv-total-due" :class="{ 'text-danger-strong': store.invoiceDetail.is_overdue }">
                  <span>Sisa tagihan</span><span>{{ store.formatCurrency(store.invoiceDetail.amount_due) }}</span>
                </div>
              </template>
            </div>

            <template v-if="store.invoiceDetail.payments?.length">
              <div class="loc-title">Pembayaran</div>
              <div class="inv-payments">
                <div v-for="pm in store.invoiceDetail.payments" :key="pm.odoo_id" class="inv-payment">
                  <div class="tx-main">
                    <div class="tx-name mono">{{ pm.number || '-' }}</div>
                    <div class="tx-sub">
                      {{ store.formatShortDate(pm.date) }} · {{ pm.journal || '-' }}
                      <span v-if="pm.is_matched"> · cocok dengan bank</span>
                    </div>
                  </div>
                  <div class="tx-amount">{{ store.formatCurrency(pm.amount) }}</div>
                </div>
              </div>
            </template>

            <div v-if="store.invoiceDetail.sale_orders.length || store.invoiceDetail.purchase_orders.length || store.invoiceDetail.reversed_from || store.invoiceDetail.credit_notes.length" class="inv-links">
              <span v-for="so in store.invoiceDetail.sale_orders" :key="'so' + so.odoo_id" class="inv-chip">SO {{ so.number }}</span>
              <span v-for="po in store.invoiceDetail.purchase_orders" :key="'po' + po.odoo_id" class="inv-chip">PO {{ po.number }}</span>
              <button v-if="store.invoiceDetail.reversed_from" class="inv-chip inv-chip-link" @click="openInvoice(store.invoiceDetail.reversed_from.invoice_id)">
                Invoice asal {{ store.invoiceDetail.reversed_from.number }}
              </button>
              <button v-for="cn in store.invoiceDetail.credit_notes" :key="'cn' + cn.invoice_id" class="inv-chip inv-chip-link" @click="openInvoice(cn.invoice_id)">
                Credit note {{ cn.number }}
              </button>
            </div>

            <div class="loc-title">Baris invoice</div>
            <div class="inv-lines">
              <template v-for="line in store.invoiceDetail.lines" :key="line.line_id">
                <div v-if="line.display_type === 'line_section'" class="inv-line-section">{{ line.name }}</div>
                <div v-else-if="line.display_type === 'line_note'" class="inv-line-note">{{ line.name }}</div>
                <div v-else class="inv-line" :class="{ 'inv-line-current': line.product_id === store.productDetail.id }">
                  <div class="tx-main">
                    <div class="tx-name">{{ line.product_name || line.name }}</div>
                    <div class="tx-sub">
                      {{ store.formatStock(line.quantity) }} {{ line.uom }} × {{ store.formatCurrency(line.price_unit) }}
                      <span v-if="line.discount"> · diskon {{ store.formatStock(line.discount) }}%</span>
                    </div>
                  </div>
                  <div class="tx-amount">{{ store.formatCurrency(line.price_total) }}</div>
                </div>
              </template>
            </div>
          </template>

          <!-- Daftar invoice -->
          <template v-else>
            <div class="tx-toolbar">
              <div class="tx-summary">
                <template v-if="store.invoice.summary">
                  <strong>{{ store.invoice.summary.invoice_count }} invoice</strong>
                  · {{ store.formatCurrency(store.invoice.summary.total_amount) }}
                  <span class="tx-summary-sub">
                    · {{ store.invoice.summary.unpaid_count }} belum lunas
                    <span v-if="store.invoice.summary.amount_due"> (sisa {{ store.formatCurrency(store.invoice.summary.amount_due) }})</span>
                    <span v-if="store.invoice.summary.overdue_count" class="text-danger-strong">· {{ store.invoice.summary.overdue_count }} lewat jatuh tempo</span>
                    <span v-if="store.invoice.summary.refund_count"> · {{ store.invoice.summary.refund_count }} credit note</span>
                    <span v-if="store.invoice.summary.draft_count"> · {{ store.invoice.summary.draft_count }} draft</span>
                  </span>
                </template>
                <template v-else>&nbsp;</template>
              </div>
              <label class="month-pick">
                <input v-model="store.invoice.month" type="month" @change="reloadInvoices()" />
              </label>
            </div>

            <div class="tx-filter">
              <button
                v-for="t in [{ v: 'customer', l: 'Customer' }, { v: 'vendor', l: 'Vendor' }, { v: 'all', l: 'Semua' }]"
                :key="t.v"
                class="chip" :class="{ active: store.invoice.type === t.v }"
                @click="setInvoiceType(t.v)"
              >{{ t.l }}</button>
            </div>

            <div v-if="store.invoice.loading && !store.invoice.items.length" class="tx-empty">
              <font-awesome-icon icon="spinner" spin /> Memuat data...
            </div>
            <div v-else-if="!store.invoice.items.length" class="tx-empty">
              Belum ada invoice di bulan ini.
            </div>
            <div v-else class="tx-list">
              <div
                v-for="inv in store.invoice.items"
                :key="inv.invoice_id"
                class="tx-row clickable"
                role="button"
                tabindex="0"
                @click="openInvoice(inv.invoice_id)"
                @keydown.enter="openInvoice(inv.invoice_id)"
              >
                <div class="tx-main">
                  <div class="tx-name">{{ inv.partner || '-' }}</div>
                  <div class="tx-sub mono">{{ inv.number || 'Draft' }} · {{ inv.type_label }}</div>
                  <div class="tx-sub">
                    {{ store.formatShortDate(inv.invoice_date) }}
                    <span v-if="inv.due_date"> · jatuh tempo <span :class="{ 'text-danger-strong': inv.is_overdue }">{{ store.formatShortDate(inv.due_date) }}</span></span>
                  </div>
                </div>
                <div class="tx-side">
                  <div class="tx-amount">{{ inv.is_refund ? '−' : '' }}{{ store.formatCurrency(inv.amount) }}</div>
                  <div class="tx-meta">
                    <span class="inv-badge" :class="`inv-badge-${inv.status}`">{{ invoiceStatusLabel(inv) }}</span>
                    qty {{ store.formatStock(inv.qty) }}
                  </div>
                  <div v-if="inv.amount_paid > 0 && inv.amount_due > 0" class="tx-sub">
                    sisa {{ store.formatCurrency(inv.amount_due) }}
                  </div>
                </div>
              </div>
              <button v-if="store.invoice.next" class="btn-more" :disabled="store.invoice.loading" @click="reloadInvoices(true)">
                <font-awesome-icon v-if="store.invoice.loading" icon="spinner" spin />
                Muat lebih banyak
              </button>
            </div>
            <div class="tx-note">Ringkasan hanya dari invoice yang sudah diposting; credit note mengurangi total. Sisa tagihan dihitung dari pembayaran yang tercatat. Nilai sesudah pajak. Klik invoice untuk melihat detail.</div>
          </template>
        </template>

        <!-- ===== TAB DELIVERY (surat jalan / penerimaan berisi product ini per bulan) ===== -->
        <template v-else-if="activeTab === 'delivery'">

          <!-- Detail satu transfer -->
          <div v-if="store.loadingDeliveryDetail" class="tx-empty">
            <font-awesome-icon icon="spinner" spin /> Memuat detail pengiriman...
          </div>

          <template v-else-if="store.deliveryDetail">
            <button class="btn-back" @click="store.closeDeliveryDetail()">
              <font-awesome-icon icon="circle-left" /> Kembali ke daftar pengiriman
            </button>

            <div class="inv-head">
              <div>
                <div class="inv-number">
                  {{ store.deliveryDetail.number }}
                  <span class="inv-type">{{ store.deliveryDetail.type_label }}</span>
                </div>
                <div class="tx-sub">{{ store.deliveryDetail.partner || '-' }} · {{ store.deliveryDetail.company }}</div>
              </div>
              <span class="dlv-badge" :class="`dlv-badge-${store.deliveryDetail.status}`">
                {{ store.deliveryDetail.state_label }}
              </span>
            </div>

            <div class="inv-grid">
              <div><span class="inv-label">Tanggal rencana</span>
                <span :class="{ 'text-danger-strong': store.deliveryDetail.is_late }">{{ store.formatDate(store.deliveryDetail.scheduled_date) }}</span>
              </div>
              <div><span class="inv-label">Tanggal selesai</span>{{ store.formatDate(store.deliveryDetail.date_done) }}</div>
              <div><span class="inv-label">Dari</span>{{ store.deliveryDetail.from_location || '-' }}</div>
              <div><span class="inv-label">Ke</span>{{ store.deliveryDetail.to_location || '-' }}</div>
              <div><span class="inv-label">Operasi</span>{{ store.deliveryDetail.operation || '-' }}</div>
              <div><span class="inv-label">No. resi</span>{{ store.deliveryDetail.tracking_ref || '-' }}</div>
            </div>

            <div v-if="store.deliveryDetail.sale_order || store.deliveryDetail.purchase_order || store.deliveryDetail.backorder_of || store.deliveryDetail.backorders.length" class="inv-links">
              <span v-if="store.deliveryDetail.sale_order" class="inv-chip">SO {{ store.deliveryDetail.sale_order.number }}</span>
              <span v-if="store.deliveryDetail.purchase_order" class="inv-chip">PO {{ store.deliveryDetail.purchase_order.number }}</span>
              <button v-if="store.deliveryDetail.backorder_of" class="inv-chip inv-chip-link" @click="openDelivery(store.deliveryDetail.backorder_of.delivery_id)">
                Backorder dari {{ store.deliveryDetail.backorder_of.number }}
              </button>
              <button v-for="b in store.deliveryDetail.backorders" :key="'bo' + b.delivery_id" class="inv-chip inv-chip-link" @click="openDelivery(b.delivery_id)">
                Backorder {{ b.number }}
              </button>
            </div>

            <div class="loc-title">Barang</div>
            <div class="inv-lines">
              <div
                v-for="line in store.deliveryDetail.lines"
                :key="line.line_id"
                class="inv-line"
                :class="{ 'inv-line-current': line.product_id === store.productDetail.id }"
              >
                <div class="tx-main">
                  <div class="tx-name">{{ line.product_name || line.description }}</div>
                  <div class="tx-sub">Diminta {{ store.formatStock(line.qty_demand) }} {{ line.uom }}</div>
                </div>
                <div class="tx-side">
                  <div class="tx-amount" :class="{ 'dlv-qty-short': line.qty_done < line.qty_demand && store.deliveryDetail.state === 'done' }">
                    {{ store.formatStock(line.qty_done) }} {{ line.uom }}
                  </div>
                  <div class="tx-sub">{{ store.deliveryDetail.type === 'incoming' ? 'diterima' : 'dikirim' }}</div>
                </div>
              </div>
            </div>
          </template>

          <!-- Daftar transfer -->
          <template v-else>
            <div class="tx-toolbar">
              <div class="tx-summary">
                <template v-if="store.delivery.summary">
                  <strong>{{ store.delivery.summary.done_count }} selesai</strong>
                  · {{ store.formatStock(store.delivery.summary.qty_done) }} unit
                  <span class="tx-summary-sub">
                    · {{ store.delivery.summary.open_count }} belum selesai
                    <span v-if="store.delivery.summary.qty_open"> ({{ store.formatStock(store.delivery.summary.qty_open) }} unit)</span>
                    <span v-if="store.delivery.summary.late_count" class="text-danger-strong">· {{ store.delivery.summary.late_count }} terlambat</span>
                  </span>
                </template>
                <template v-else>&nbsp;</template>
              </div>
              <label class="month-pick">
                <input v-model="store.delivery.month" type="month" @change="reloadDeliveries()" />
              </label>
            </div>

            <div class="tx-filter">
              <button
                v-for="t in [{ v: 'outgoing', l: 'Pengiriman' }, { v: 'incoming', l: 'Penerimaan' }, { v: 'all', l: 'Semua' }]"
                :key="t.v"
                class="chip" :class="{ active: store.delivery.type === t.v }"
                @click="setDeliveryType(t.v)"
              >{{ t.l }}</button>
            </div>

            <div v-if="store.delivery.loading && !store.delivery.items.length" class="tx-empty">
              <font-awesome-icon icon="spinner" spin /> Memuat data...
            </div>
            <div v-else-if="!store.delivery.items.length" class="tx-empty">
              Belum ada pengiriman di bulan ini.
            </div>
            <div v-else class="tx-list">
              <div
                v-for="d in store.delivery.items"
                :key="d.delivery_id"
                class="tx-row clickable"
                role="button"
                tabindex="0"
                @click="openDelivery(d.delivery_id)"
                @keydown.enter="openDelivery(d.delivery_id)"
              >
                <div class="tx-main">
                  <div class="tx-name">{{ d.partner || '-' }}</div>
                  <div class="tx-sub mono">{{ d.number }} · {{ d.type_label }}</div>
                  <div class="tx-sub">
                    <template v-if="d.date_done">Selesai {{ store.formatShortDate(d.date_done) }}</template>
                    <template v-else>Rencana <span :class="{ 'text-danger-strong': d.is_late }">{{ store.formatShortDate(d.scheduled_date) }}</span></template>
                    <span v-if="d.origin"> · {{ d.origin }}</span>
                  </div>
                </div>
                <div class="tx-side">
                  <div class="tx-amount">{{ store.formatStock(d.qty_done) }} / {{ store.formatStock(d.qty_demand) }} {{ d.uom }}</div>
                  <div class="tx-meta">
                    <span class="dlv-badge" :class="`dlv-badge-${d.status}`">{{ d.state_label }}</span>
                  </div>
                </div>
              </div>
              <button v-if="store.delivery.next" class="btn-more" :disabled="store.delivery.loading" @click="reloadDeliveries(true)">
                <font-awesome-icon v-if="store.delivery.loading" icon="spinner" spin />
                Muat lebih banyak
              </button>
            </div>
            <div class="tx-note">Qty ditampilkan sebagai terkirim / diminta untuk product ini. Transfer batal tidak ditampilkan. Klik untuk melihat detail.</div>
          </template>
        </template>
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

/* ===== CHIP FILTER (brand / kategori / jenis transaksi) ===== */
.chip-filters { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-main); }
.chip-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.chip-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); min-width: 70px; }
.chip { padding: 5px 12px; border-radius: 99px; border: 1px solid var(--border-main); background: var(--bg-card); color: var(--text-primary); font-size: 0.78rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
.chip:hover { border-color: #6366f1; color: #6366f1; }
.chip.active { background: #6366f1; border-color: #6366f1; color: #fff; }

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

/* ===== BADGE STOK (sama dengan mobile) ===== */
.stock-badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; white-space: nowrap; }
.stock-badge.in        { background: rgba(34,197,94,0.12);  color: #16a34a; }
.stock-badge.low       { background: rgba(245,158,11,0.15); color: #d97706; }
.stock-badge.out       { background: rgba(239,68,68,0.12);  color: #dc2626; }
.stock-badge.untracked { background: var(--bg-input); color: var(--text-muted); border: 1px dashed var(--border-main); font-weight: 600; cursor: help; }

.stock-info { display: flex; gap: 10px; align-items: flex-start; margin-top: 14px; padding: 12px 14px; border-radius: 10px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.3); font-size: 0.82rem; line-height: 1.5; color: var(--text-primary); }
.stock-info svg { color: #d97706; margin-top: 3px; flex-shrink: 0; }

/* ===== STATE CARD (loading/empty, dipakai bareng Card & Table) ===== */
.state-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); padding: 40px; text-align: center; color: var(--text-muted); }

/* ===== CARD VIEW ===== */
.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; align-content: start; }
.product-card {
  background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 12px; padding: 14px 16px;
  box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: column; gap: 6px;
}
.product-image {
  height: 140px; margin: -14px -16px 6px; border-radius: 12px 12px 0 0; overflow: hidden;
  background: var(--bg-input); display: flex; align-items: center; justify-content: center;
  border-bottom: 1px solid var(--border-main);
}
.product-image img { width: 100%; height: 100%; object-fit: contain; }
.product-image-empty { font-size: 2.2rem; color: var(--text-muted); opacity: 0.25; }
.product-name { font-size: 0.92rem; font-weight: 700; color: var(--text-primary); line-height: 1.35; }
.product-sub { font-size: 0.78rem; color: var(--text-muted); }
.product-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.76rem; color: var(--text-muted); }
.product-meta span { display: inline-flex; align-items: center; gap: 5px; }
.product-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; padding-top: 10px; border-top: 1px solid var(--border-main); }
.price-value { font-size: 0.95rem; font-weight: 800; color: var(--text-primary); white-space: nowrap; }
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
.btn-qr { margin-left: auto; flex-shrink: 0; padding: 6px 12px; border: 1px solid #6366f1; border-radius: 8px; background: transparent; color: #6366f1; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.15s; }
.btn-qr:hover:not(:disabled), .btn-qr.active { background: #6366f1; color: #fff; }
.btn-qr:disabled { opacity: 0.4; cursor: not-allowed; }
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

/* ===== TAB DI MODAL (Detail / Sold / Purchase) ===== */
.detail-tabs { display: flex; gap: 22px; margin-top: 16px; border-bottom: 1px solid var(--border-main); }
.detail-tab { padding: 8px 2px; border: none; background: none; color: var(--text-muted); font-size: 0.86rem; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 0.15s; }
.detail-tab:hover { color: #6366f1; }
.detail-tab.active { color: #6366f1; border-bottom-color: #6366f1; font-weight: 700; }

/* ===== LIST SOLD / PURCHASE ===== */
.tx-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
.tx-summary { font-size: 0.84rem; color: var(--text-primary); }
.tx-summary-sub { color: var(--text-muted); }
.month-pick { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border: 1px solid var(--border-main); border-radius: 99px; background: var(--bg-input); color: #6366f1; font-size: 0.8rem; font-weight: 600; }
.month-pick input { border: none; background: transparent; color: var(--text-primary); font-size: 0.8rem; font-weight: 600; outline: none; font-family: inherit; }
.tx-filter { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
.tx-list { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; max-height: 360px; overflow-y: auto; }
.tx-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 12px 14px; border: 1px solid var(--border-main); border-radius: 10px; background: var(--bg-card); }
.tx-main { min-width: 0; }
.tx-name { font-size: 0.86rem; font-weight: 700; color: var(--text-primary); }
.tx-sub { font-size: 0.76rem; color: var(--text-muted); margin-top: 3px; }
.tx-side { text-align: right; white-space: nowrap; }
.tx-amount { font-size: 0.86rem; font-weight: 800; color: var(--text-primary); }
.tx-meta { display: inline-flex; align-items: center; gap: 6px; font-size: 0.74rem; color: var(--text-muted); margin-top: 4px; }
.tx-badge { padding: 1px 8px; border-radius: 99px; font-size: 0.66rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
.tx-badge.so        { background: rgba(34,197,94,0.12); color: #16a34a; }
.tx-badge.quotation { background: rgba(245,158,11,0.15); color: #d97706; }
.tx-empty { margin-top: 14px; padding: 28px 12px; text-align: center; font-size: 0.84rem; color: var(--text-muted); border: 1px dashed var(--border-main); border-radius: 10px; }
.tx-note { margin-top: 10px; font-size: 0.72rem; color: var(--text-muted); }
.btn-more { align-self: center; display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; border: 1px solid var(--border-main); border-radius: 8px; background: var(--bg-input); color: #6366f1; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
.btn-more:hover:not(:disabled) { border-color: #6366f1; }
.btn-more:disabled { opacity: 0.6; cursor: not-allowed; }

/* ===== TAB INVOICE ===== */
.inv-badge { padding: 1px 8px; border-radius: 99px; font-size: 0.66rem; font-weight: 700; white-space: nowrap; }
.inv-badge-draft      { background: var(--bg-input); color: var(--text-muted); border: 1px solid var(--border-main); }
.inv-badge-unpaid     { background: rgba(245,158,11,0.15); color: #d97706; }
.inv-badge-partial    { background: rgba(245,158,11,0.15); color: #b45309; }
.inv-badge-overdue    { background: rgba(239,68,68,0.12);  color: #dc2626; }
.inv-badge-in_payment { background: rgba(59,130,246,0.12); color: #2563eb; }
.inv-badge-paid       { background: rgba(34,197,94,0.12);  color: #16a34a; }
.inv-badge-reversed   { background: rgba(139,92,246,0.12); color: #7c3aed; }
.text-danger-strong { color: #dc2626; font-weight: 700; }
.tx-row.clickable { cursor: pointer; transition: border-color 0.15s; }
.tx-row.clickable:hover { border-color: rgba(99,102,241,0.45); }
.btn-back { display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; padding: 4px 0; border: none; background: none; color: #6366f1; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
.inv-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-top: 8px; }
.inv-number { font-size: 0.95rem; font-weight: 800; color: var(--text-primary); }
.inv-type { margin-left: 6px; font-size: 0.7rem; font-weight: 700; color: #6366f1; text-transform: uppercase; }
.inv-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 14px; margin-top: 12px; font-size: 0.82rem; color: var(--text-primary); }
.inv-label { display: block; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
.inv-totals { margin-top: 12px; padding: 10px 12px; border: 1px solid var(--border-main); border-radius: 10px; background: var(--bg-input); }
.inv-total-row { display: flex; justify-content: space-between; font-size: 0.82rem; padding: 3px 0; color: var(--text-primary); }
.inv-total-main { font-weight: 800; border-top: 1px solid var(--border-main); margin-top: 4px; padding-top: 6px; }
.inv-total-due { font-weight: 800; }
.inv-payments { display: flex; flex-direction: column; gap: 6px; }
.inv-payment { display: flex; justify-content: space-between; gap: 12px; padding: 8px 12px; border: 1px solid var(--border-main); border-radius: 8px; background: rgba(34,197,94,0.04); }
.inv-links { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.inv-chip { padding: 3px 10px; border-radius: 99px; border: 1px solid var(--border-main); background: var(--bg-card); font-size: 0.74rem; font-weight: 600; color: var(--text-primary); }
.inv-chip-link { cursor: pointer; color: #6366f1; border-color: rgba(99,102,241,0.4); }
.inv-chip-link:hover { background: rgba(99,102,241,0.08); }
.inv-lines { display: flex; flex-direction: column; gap: 6px; max-height: 300px; overflow-y: auto; }
.inv-line { display: flex; justify-content: space-between; gap: 12px; padding: 10px 12px; border: 1px solid var(--border-main); border-radius: 8px; }
.inv-line-current { border-color: rgba(99,102,241,0.5); background: rgba(99,102,241,0.05); }
.inv-line-section { font-size: 0.8rem; font-weight: 800; color: var(--text-primary); padding: 6px 2px 0; }
.inv-line-note { font-size: 0.76rem; font-style: italic; color: var(--text-muted); white-space: pre-line; padding: 0 2px; }

/* ===== TAB DELIVERY ===== */
.dlv-badge { padding: 1px 8px; border-radius: 99px; font-size: 0.66rem; font-weight: 700; white-space: nowrap; }
.dlv-badge-draft   { background: var(--bg-input); color: var(--text-muted); border: 1px solid var(--border-main); }
.dlv-badge-waiting { background: rgba(245,158,11,0.15); color: #d97706; }
.dlv-badge-ready   { background: rgba(59,130,246,0.12); color: #2563eb; }
.dlv-badge-late    { background: rgba(239,68,68,0.12);  color: #dc2626; }
.dlv-badge-done    { background: rgba(34,197,94,0.12);  color: #16a34a; }
.dlv-badge-cancel  { background: var(--bg-input); color: var(--text-muted); text-decoration: line-through; }
.dlv-qty-short { color: #d97706; }

/* ===== STATUS ORDER (stepper seperti desain mobile) ===== */
.os-list { display: flex; flex-direction: column; gap: 8px; }
.os-card { padding: 12px 14px; border: 1px solid var(--border-main); border-radius: 10px; background: var(--bg-card); }
.os-title { font-size: 0.84rem; font-weight: 700; color: var(--text-primary); }
.os-sub { font-size: 0.74rem; color: var(--text-muted); margin-top: 2px; }
.os-steps { display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 10px; }
.os-step { display: flex; flex-direction: column; align-items: center; }
.os-track { display: flex; align-items: center; width: 100%; }
.os-line { flex: 1; height: 2px; background: var(--border-main); }
.os-line.on { background: #16a34a; }
.os-line.hidden { visibility: hidden; }
.os-dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--border-main); background: var(--bg-card); flex-shrink: 0; }
.os-done .os-dot { background: #16a34a; border-color: #16a34a; }
.os-in_progress .os-dot { border-color: #16a34a; background: linear-gradient(90deg, #16a34a 50%, var(--bg-card) 50%); }
.os-label { margin-top: 4px; font-size: 0.68rem; color: var(--text-muted); text-align: center; line-height: 1.2; }
.os-done .os-label, .os-in_progress .os-label { color: var(--text-primary); }

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
  .chip-label { min-width: 100%; }
  .inv-grid { grid-template-columns: 1fr; }
}
</style>