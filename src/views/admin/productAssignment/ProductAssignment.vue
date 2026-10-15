<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConfirm } from '@/composables/useConfirm'
import { useProductAssignmentStore } from '@/stores/ProductAssignmentStore'
import { usePermissionStore } from '@/stores/PermissionStore'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'

const { confirm } = useConfirm()
const toast       = useToast()
const store       = useProductAssignmentStore()
const permission  = usePermissionStore()
const route       = useRoute()

// ── PERMISSIONS ────────────────────────────
// Assign memakai hak Create/Update, lepas assignment memakai hak Delete.
// Backend tetap menolak (403) role selain Administrator/Manager/admin/Supervisor.
const currentUrl  = computed(() => route.path.replace('/app', ''))
const canAssign   = computed(() => permission.canCreate(currentUrl.value) || permission.canUpdate(currentUrl.value))
const canUnassign = computed(() => permission.canDelete(currentUrl.value))

// ── FETCH AWAL ─────────────────────────────
onMounted(() => {
  store.fetchSales()
  store.fetchSyncStatus()
  if (store.selectedSalesId) store.fetchProducts()
})

// ── SYNC PRODUCT + PO DARI ODOO ────────────
// Sync bisa makan waktu (product + gambar + stok + PO), jangan tutup halaman sampai selesai.
async function handleSync() {
  toast.info('Sync product dan PO dimulai, mohon tunggu sampai selesai...')

  const result = await store.syncProducts()

  if (result.ok) toast.success(`Sync berhasil. Product: ${result.total ?? '-'}, PO: ${result.totalPo ?? '-'}`)
  else           toast.error(result.message)
}

// ── DROPDOWN TOGGLES ───────────────────────
const showSalesMenu   = ref(false)
const showPerPageMenu = ref(false)

// ── PILIH SALES ────────────────────────────
const salesKeyword = ref('')

const filteredSales = computed(() => {
  const q = salesKeyword.value.trim().toLowerCase()
  if (!q) return store.salesOptions
  return store.salesOptions.filter(s =>
    s.fullname?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
  )
})

function chooseSales(item) {
  store.selectSales(item.id_user)
  showSalesMenu.value = false
  salesKeyword.value  = ''
}

// ── TAB VIEW ───────────────────────────────
const viewOptions = computed(() => [
  { value: 'mine',       label: store.selectedSales ? `Milik ${firstName(store.selectedSales.fullname)}` : 'Milik sales' },
  { value: 'unassigned', label: 'Belum dipegang' },
  { value: 'all',        label: 'Semua product' },
])

const emptyText = computed(() => {
  if (store.searchProduct)           return `Tidak ada product yang cocok dengan "${store.searchProduct}"`
  if (store.view === 'mine')         return `${store.selectedSales?.fullname} belum memegang product. Buka tab "Belum dipegang" untuk mulai assign.`
  if (store.view === 'unassigned')   return 'Semua product sudah dipegang minimal satu sales'
  return 'Belum ada product. Jalankan sync product dari Odoo terlebih dahulu.'
})

// ── RESET ──────────────────────────────────
function handleReset() {
  showSalesMenu.value   = false
  showPerPageMenu.value = false
  store.resetFilters()
}

// ── ASSIGN / UNASSIGN ──────────────────────
const isHeldBySelected = (item) =>
  item.assigned_sales.some(h => h.id_user === store.selectedSalesId)

async function bulkAssign() {
  const name   = store.selectedSales.fullname
  const result = await store.assignSelected()

  if (!result.ok) return toast.error(result.message)

  toast.success(result.changed
    ? `${result.changed} product berhasil di-assign ke ${name}`
    : `Semua product terpilih sudah dipegang ${name}`)
}

async function bulkUnassign() {
  const name = store.selectedSales.fullname

  const isConfirmed = await confirm({
    type:        'danger',
    title:       'Lepas Product dari Sales',
    message:     `Lepas ${store.selectedCount} product dari ${name}?`,
    detail:      `${name} tidak akan melihat product ini lagi di aplikasi mobile.`,
    confirmText: 'Yes, Unassign',
    cancelText:  'Cancel',
  })
  if (!isConfirmed) return

  const result = await store.unassignSelected()

  if (result.ok) toast.success(`${result.changed} product dilepas dari ${name}`)
  else           toast.error(result.message)
}

async function rowAssign(item) {
  const result = await store.assignOne(item.id)

  if (result.ok) toast.success(`${item.name} di-assign ke ${store.selectedSales.fullname}`)
  else           toast.error(result.message)
}

async function rowUnassign(item) {
  const result = await store.unassignOne(item.id)

  if (result.ok) toast.success(`${item.name} dilepas dari ${store.selectedSales.fullname}`)
  else           toast.error(result.message)
}

// ── HELPERS ────────────────────────────────
const firstName = (name = '') => name.split(' ')[0] || name
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <!-- ── BREADCRUMB + SYNC ── -->
    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="table-list" /> Product Assignment
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" /> Dashboard
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Product Assignment</span>
        </div>
      </div>

      <div class="sync-info">
        <div class="sync-text">
          <span v-if="store.syncing" class="sync-status running">
            <font-awesome-icon icon="spinner" spin /> Sync sedang berjalan...
          </span>
          <span v-else-if="store.syncStatus.status === 'failed'" class="sync-status failed" :title="store.syncStatus.last_error">
            <font-awesome-icon icon="circle-info" /> Sync terakhir gagal
          </span>
          <span v-if="store.syncStatus.last_success_at" class="sync-last">
            Terakhir berhasil: {{ store.formatDateTime(store.syncStatus.last_success_at) }}
          </span>
          <span v-else-if="!store.syncing" class="sync-last">Belum pernah sync</span>
        </div>

        <button class="btn-toolbar btn-purple" :disabled="store.syncing" @click="handleSync">
          <font-awesome-icon v-if="store.syncing" icon="spinner" spin />
          <font-awesome-icon v-else icon="rotate" />
          {{ store.syncing ? 'Menyinkronkan...' : 'Sync Data Odoo' }}
        </button>
      </div>
    </div>

    <!-- ── TOOLBAR TOP: pilih sales ── -->
    <div class="toolbar-top">
      <div class="toolbar-left">
        <span class="showing-label">Sales:</span>

        <div class="drop-wrap">
          <button class="btn-select btn-sales" @click="showSalesMenu = !showSalesMenu">
            <span v-if="store.selectedSales" class="sales-picked">
              {{ store.selectedSales.fullname }}
              <span class="count-pill">{{ store.selectedSales.assigned_products }} product</span>
            </span>
            <span v-else class="text-muted-color">
              {{ store.loadingSales ? 'Loading...' : '-- Select Sales --' }}
            </span>
            <font-awesome-icon icon="chevron-down" class="btn-arrow" />
          </button>

          <div class="drop-menu drop-sales" :class="{ show: showSalesMenu }">
            <div class="drop-label">Pilih Sales</div>
            <input
              v-model="salesKeyword"
              type="text"
              class="form-input drop-search"
              placeholder="Cari nama atau email..."
            />
            <div class="drop-scroll">
              <div v-if="!filteredSales.length" class="drop-empty">
                {{ store.salesOptions.length ? 'Sales tidak ditemukan' : 'Belum ada user role sales' }}
              </div>
              <button
                v-for="item in filteredSales"
                :key="item.id_user"
                class="drop-item"
                :class="{ active: store.selectedSalesId === item.id_user }"
                @click="chooseSales(item)"
              >
                <span class="sales-option">
                  <span class="sales-name">{{ item.fullname }}</span>
                  <span class="sales-email">{{ item.email }}</span>
                </span>
                <span class="count-pill">{{ item.assigned_products }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <button class="btn-toolbar btn-orange" :disabled="!store.selectedSalesId" @click="handleReset">
        <font-awesome-icon icon="rotate-left" /> Reset
      </button>
    </div>

    <!-- ── BELUM PILIH SALES ── -->
    <div v-if="!store.selectedSales" class="table-card flex-grow-1 mb-3">
      <div class="td-center">
        <div class="empty-state">
          <img
            src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif"
            alt="Pilih sales"
            class="empty-img"
          />
          <div class="empty-text">Pilih sales terlebih dahulu</div>
          <div class="empty-sub">
            Product yang di-assign hanya terlihat oleh sales tersebut di aplikasi mobile.
            Sales tanpa product tidak melihat product apa pun.
          </div>
        </div>
      </div>
    </div>

    <template v-else>

      <!-- ── CONTROLS ROW ── -->
      <div class="controls-card">
        <div class="controls-row">
          <div class="controls-left">
            <div class="showing-wrap">
              <font-awesome-icon icon="list" class="text-muted-color" />
              <span class="showing-label">Showing:</span>
              <div class="drop-wrap">
                <button class="btn-select" @click="showPerPageMenu = !showPerPageMenu">
                  {{ store.pagination.per_page }}
                  <font-awesome-icon icon="chevron-down" class="btn-arrow" />
                </button>
                <div class="drop-menu" :class="{ show: showPerPageMenu }">
                  <div class="drop-label">Per halaman</div>
                  <div class="perpage-grid">
                    <button
                      v-for="opt in [10, 25, 50, 100]" :key="opt"
                      class="perpage-opt"
                      :class="{ active: store.pagination.per_page === opt }"
                      @click="store.pagination.per_page = opt; store.changePageSize(); showPerPageMenu = false"
                    >{{ opt }}</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="view-tabs" role="tablist">
              <button
                v-for="opt in viewOptions"
                :key="opt.value"
                class="view-tab"
                :class="{ active: store.view === opt.value }"
                role="tab"
                :aria-selected="store.view === opt.value"
                @click="store.changeView(opt.value)"
              >{{ opt.label }}</button>
            </div>
          </div>

          <div class="controls-right">
            <div class="search-wrap">
              <input
                v-model="store.searchProduct"
                type="text"
                placeholder="Nama, SKU, barcode..."
                class="search-input"
                @input="store.searchWithDelay()"
              />
              <button class="search-btn">
                <font-awesome-icon icon="magnifying-glass" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── BAR AKSI (muncul saat ada product dicentang) ── -->
      <div v-if="store.selectedCount" class="selection-bar">
        <span class="selection-text">
          <strong>{{ store.selectedCount }}</strong> product dipilih
          <button class="btn-link" @click="store.clearSelection()">Batalkan pilihan</button>
        </span>
        <div class="selection-actions">
          <button
            v-if="canAssign && store.view !== 'mine'"
            class="btn-toolbar btn-purple"
            :disabled="store.savingAssignment"
            @click="bulkAssign"
          >
            <font-awesome-icon v-if="store.savingAssignment" icon="spinner" spin />
            <font-awesome-icon v-else icon="plus" />
            Assign ke {{ firstName(store.selectedSales.fullname) }}
          </button>
          <button
            v-if="canUnassign && store.view !== 'unassigned'"
            class="btn-toolbar btn-red"
            :disabled="store.savingAssignment"
            @click="bulkUnassign"
          >
            <font-awesome-icon icon="trash-can" />
            Lepas dari {{ firstName(store.selectedSales.fullname) }}
          </button>
        </div>
      </div>

      <!-- ── TABLE ── -->
      <div class="table-card flex-grow-1 overflow-auto mb-3">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:44px">
                <input
                  type="checkbox"
                  class="row-check"
                  :checked="store.allOnPageSelected"
                  :disabled="!store.productData.length"
                  aria-label="Pilih semua product di halaman ini"
                  @change="store.toggleSelectPage()"
                />
              </th>
              <th style="width:70px">NO.</th>
              <th>Product</th>
              <th>Category</th>
              <th style="width:140px; text-align:right">Price</th>
              <th>Assigned Sales</th>
              <th style="width:100px; text-align:center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>

            <!-- Loading -->
            <tr v-if="store.loadingProducts">
              <td colspan="7" class="td-center">
                <div style="display:flex; justify-content:center;">
                  <div class="spinner-custom"></div>
                </div>
              </td>
            </tr>

            <!-- Empty -->
            <tr v-else-if="!store.productData.length">
              <td colspan="7" class="td-center">
                <div class="empty-state">
                  <img
                    src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif"
                    alt="No data found"
                    class="empty-img"
                  />
                  <div class="empty-text">{{ emptyText }}</div>
                </div>
              </td>
            </tr>

            <!-- Data -->
            <template v-else>
              <tr
                v-for="(item, index) in store.productData"
                :key="item.id"
                class="data-row"
                :class="{ 'row-selected': store.isSelected(item.id) }"
              >
                <td>
                  <input
                    type="checkbox"
                    class="row-check"
                    :checked="store.isSelected(item.id)"
                    :aria-label="`Pilih ${item.name}`"
                    @change="store.toggleSelect(item.id)"
                  />
                </td>
                <td class="td-no">
                  {{ (store.pagination.current_page - 1) * store.pagination.per_page + index + 1 }}.
                </td>
                <td class="td-name">
                  <div class="product-name">{{ item.name }}</div>
                  <div v-if="item.sku" class="product-sku">SKU {{ item.sku }}</div>
                </td>
                <td class="td-muted">{{ item.category || '-' }}</td>
                <td class="td-muted" style="text-align:right; white-space:nowrap">
                  {{ store.formatPrice(item.price) }}
                </td>
                <td>
                  <span v-if="!item.assigned_sales.length" class="td-muted">Belum ada</span>
                  <span
                    v-for="h in item.assigned_sales"
                    :key="h.id_user"
                    class="sales-chip"
                    :class="{ current: h.id_user === store.selectedSalesId }"
                  >{{ h.fullname }}</span>
                </td>
                <td class="td-actions">
                  <button
                    v-if="isHeldBySelected(item) && canUnassign"
                    class="act-btn act-delete"
                    :title="`Lepas dari ${store.selectedSales.fullname}`"
                    :disabled="store.savingAssignment"
                    @click="rowUnassign(item)"
                  >
                    <font-awesome-icon icon="trash-can" />
                  </button>
                  <button
                    v-else-if="!isHeldBySelected(item) && canAssign"
                    class="act-btn act-info"
                    :title="`Assign ke ${store.selectedSales.fullname}`"
                    :disabled="store.savingAssignment"
                    @click="rowAssign(item)"
                  >
                    <font-awesome-icon icon="plus" />
                  </button>
                </td>
              </tr>
            </template>

          </tbody>
        </table>
      </div>

      <!-- ── PAGINATION ── -->
      <div class="pagination-card">
        <div class="pagination-nav">
          <button
            class="btn-prev-next"
            :disabled="!store.pagination.prev_page_url || store.loadingProducts"
            @click="store.fetchProducts(store.pagination.prev_page_url)"
          >
            <font-awesome-icon icon="circle-left" /> Prev
          </button>
          <button
            class="btn-prev-next"
            :disabled="!store.pagination.next_page_url || store.loadingProducts"
            @click="store.fetchProducts(store.pagination.next_page_url)"
          >
            Next <font-awesome-icon icon="circle-right" />
          </button>
        </div>
        <div class="page-badges">
          <span class="page-badge">
            {{ store.productData.length }} DATA | ON PAGE {{ store.pagination.current_page }}
          </span>
          <span class="page-badge">TOTAL: {{ store.pagination.total }}</span>
        </div>
      </div>

    </template>
  </div>
</template>

<style scoped>
/* ── CSS VARIABLES ── */
.h-100 {
  --text-muted:    #64748b;
  --primary-color: #6366f1;
}

/* ── BREADCRUMB ── */
.breadcrumb-card { background: var(--bg-card); border-radius: 10px; padding: 16px 18px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

/* ── SYNC ── */
.sync-info { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.sync-text { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.sync-last { font-size: 0.78rem; color: var(--text-muted); white-space: nowrap; }
.sync-status { display: inline-flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 700; white-space: nowrap; }
.sync-status.running { color: #6366f1; }
.sync-status.failed { color: #ef4444; cursor: help; }

/* ── TOOLBAR TOP ── */
.toolbar-top { display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); border-radius: 10px; padding: 12px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); flex-wrap: wrap; gap: 8px; }
.toolbar-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.btn-toolbar { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: none; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; transition: all 0.18s ease; white-space: nowrap; }
.btn-toolbar:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover:not(:disabled) { background: #4f46e5; }
.btn-orange { background: #f59e0b; color: #fff; }
.btn-orange:hover:not(:disabled) { background: #d97706; }
.btn-red { background: #ef4444; color: #fff; }
.btn-red:hover:not(:disabled) { background: #dc2626; }
.btn-arrow { font-size: 0.6rem; opacity: 0.7; }

/* ── PILIH SALES ── */
.btn-sales { min-width: 260px; justify-content: space-between; }
.sales-picked { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; }
.count-pill { padding: 2px 8px; border-radius: 99px; font-size: 0.7rem; font-weight: 700; background: rgba(99,102,241,0.1); color: #6366f1; white-space: nowrap; }
.drop-sales { min-width: 300px; }
.drop-search { margin-bottom: 8px; padding: 7px 10px; font-size: 0.82rem; }
.drop-scroll { max-height: 280px; overflow-y: auto; }
.drop-empty { padding: 10px; font-size: 0.82rem; color: var(--text-muted); text-align: center; }
.sales-option { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.sales-name { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sales-email { font-size: 0.74rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ── CONTROLS ── */
.controls-card { background: var(--bg-card); border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); }
.controls-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.controls-left, .controls-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.showing-wrap { display: flex; align-items: center; gap: 6px; font-size: 0.84rem; color: var(--text-primary); font-weight: 600; }
.showing-label { white-space: nowrap; color: var(--text-muted); font-size: 0.83rem; }
.text-muted-color { color: var(--text-muted); }
.search-wrap { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.search-input { padding: 7px 12px; border: none; background: transparent; color: var(--text-primary); font-size: 0.84rem; outline: none; width: 200px; }
.search-input::placeholder { color: var(--text-muted); }
.search-btn { padding: 7px 12px; background: #6366f1; color: #fff; border: none; cursor: pointer; }
.search-btn:hover { background: #4f46e5; }

/* ── TAB VIEW ── */
.view-tabs { display: inline-flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.view-tab { padding: 7px 14px; border: none; background: transparent; color: var(--text-muted); font-size: 0.82rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
.view-tab + .view-tab { border-left: 1px solid var(--border-main); }
.view-tab:hover { color: #6366f1; }
.view-tab.active { background: #6366f1; color: #fff; }

/* ── DROPDOWN ── */
.drop-wrap { position: relative; }
.btn-select { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.83rem; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
.btn-select:hover { border-color: #6366f1; color: #6366f1; }
.drop-menu { position: absolute; top: calc(100% + 6px); left: 0; min-width: 160px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 10px; z-index: 300; opacity: 0; transform: translateY(-6px); pointer-events: none; transition: all 0.18s ease; }
.drop-menu.show { opacity: 1; transform: translateY(0); pointer-events: all; }
.drop-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; padding: 0 4px; }
.drop-item { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: none; border: none; border-radius: 7px; color: var(--text-primary); font-size: 0.84rem; cursor: pointer; text-align: left; }
.drop-item:hover { background: var(--bg-nav-hover); }
.drop-item.active { color: #6366f1; font-weight: 600; background: rgba(99,102,241,0.08); }
.perpage-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.perpage-opt { padding: 5px 10px; border: 1px solid var(--border-main); border-radius: 6px; background: var(--bg-input); color: var(--text-primary); font-size: 0.82rem; cursor: pointer; }
.perpage-opt:hover  { border-color: #6366f1; color: #6366f1; }
.perpage-opt.active { background: #6366f1; border-color: #6366f1; color: #fff; font-weight: 700; }

/* ── BAR AKSI ── */
.selection-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); border-radius: 10px; padding: 10px 16px; margin-bottom: 12px; }
.selection-text { font-size: 0.85rem; color: var(--text-primary); }
.selection-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-link { margin-left: 10px; padding: 0; border: none; background: none; color: #6366f1; font-size: 0.82rem; font-weight: 600; cursor: pointer; text-decoration: underline; }

/* ── TABLE ── */
.table-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.data-table thead tr { background: var(--bg-input); border-bottom: 2px solid var(--border-main); position: sticky; top: 0; z-index: 2; }
.data-table th { padding: 12px 18px; text-align: left; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap; }
.data-table tbody tr { border-bottom: 1px solid var(--border-main); transition: background 0.15s; }
.data-table tbody tr:last-child { border-bottom: none; }
.data-row:hover { background: var(--bg-nav-hover); }
.row-selected { background: rgba(99,102,241,0.05); }
.data-table td { padding: 13px 18px; vertical-align: middle; color: var(--text-primary); }
.td-no { color: var(--text-muted); font-weight: 600; }
.td-name { min-width: 240px; }
.td-muted { color: var(--text-muted); font-size: 0.84rem; }
.td-center { text-align: center; padding: 40px; color: var(--text-muted); }
.td-actions { text-align: center; white-space: nowrap; }
.row-check { width: 16px; height: 16px; accent-color: #6366f1; cursor: pointer; }

.product-name { font-weight: 600; }
.product-sku { font-size: 0.76rem; color: var(--text-muted); margin-top: 2px; }

.sales-chip { display: inline-block; margin: 2px 4px 2px 0; padding: 3px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; background: var(--bg-input); color: var(--text-muted); border: 1px solid var(--border-main); white-space: nowrap; }
.sales-chip.current { background: rgba(99,102,241,0.08); color: #4f46e5; border-color: rgba(99,102,241,0.25); }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.empty-img   { width: 160px; opacity: 0.85; border-radius: 8px; }
.empty-text  { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
.empty-sub   { max-width: 380px; font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; }

.spinner-custom { width: 32px; height: 32px; border: 3px solid var(--border-main); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── ACTION BUTTONS ── */
.act-btn { width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s ease; margin: 0 2px; background: transparent; }
.act-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.act-delete       { color: #ef4444; border-color: #ef4444; }
.act-delete:hover:not(:disabled) { background: #ef4444; color: #fff; }
.act-info         { color: #6366f1; border-color: #6366f1; }
.act-info:hover:not(:disabled)   { background: #6366f1; color: #fff; }

/* ── PAGINATION ── */
.pagination-card { background: var(--bg-card); border-radius: 10px; padding: 14px 18px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: row-reverse; align-items: center; justify-content: space-between; gap: 12px; }
.pagination-nav { display: flex; align-items: center; gap: 8px; }
.btn-prev-next { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; min-width: 85px; justify-content: center; transition: background 0.18s ease; }
.btn-prev-next:hover:not(:disabled) { background: #4f46e5; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badges { display: flex; gap: 8px; align-items: center; }
.page-badge { padding: 7px 14px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); background: var(--bg-input); white-space: nowrap; }

/* ── FORM (input pencarian di dropdown sales) ── */
.form-input { border: 1px solid var(--border-main); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); outline: none; transition: border 0.18s; width: 100%; box-sizing: border-box; }
.form-input:focus { border-color: #6366f1; }

@media (max-width: 900px) {
  .breadcrumb-card { flex-direction: column; align-items: flex-start; }
  .sync-text { align-items: flex-start; }
}

@media (max-width: 576px) {
  .btn-sales { min-width: 0; width: 100%; }
  .drop-sales { min-width: 260px; }
  .view-tabs { width: 100%; }
  .view-tab { flex: 1; padding: 7px 8px; }
  .search-input { width: 100%; }
  .pagination-card { flex-direction: column; padding: 12px; gap: 12px; }
  .pagination-nav { width: 100%; justify-content: space-between; }
  .btn-prev-next { flex: 1; max-width: 48%; padding: 10px 14px; }
  .page-badges { width: 100%; justify-content: center; flex-wrap: wrap; }
  .page-badge { flex: 1; text-align: center; font-size: 0.7rem; }
}
</style>