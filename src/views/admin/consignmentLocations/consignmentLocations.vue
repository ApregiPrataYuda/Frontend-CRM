<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useConsignmentLocationStore } from '@/stores/ConsignmentLocationStores'

const toast = useToast()
const store = useConsignmentLocationStore()

onMounted(async () => {
  await store.fetchCompanies()
  store.fetchLocations(1)
  store.fetchSyncStatus()
})

// ── SYNC ───────────────────────────────────
async function handleSync() {
  toast.info('Sync lokasi dari Odoo dimulai...')
  const r = await store.syncLocations()
  r.ok ? toast.success(`Sync lokasi berhasil. Total lokasi: ${r.total ?? '-'}`) : toast.error(r.message)
}

// ── TOGGLE KONSINYASI ──────────────────────
async function toggleConsignment(loc) {
  const r = await store.updateLocation(loc, { is_consignment: !loc.is_consignment })
  r.ok ? toast.success(loc.is_consignment ? 'Tanda konsinyasi dilepas' : 'Ditandai sebagai konsinyasi') : toast.error(r.message)
}

// ── PILIH CUSTOMER ─────────────────────────
const editingId     = ref(null)
const partnerSearch = ref('')
const partnerOpts   = ref([])
let partnerTimeout  = null

function openPartner(loc) {
  editingId.value = editingId.value === loc.id ? null : loc.id
  partnerSearch.value = ''
  partnerOpts.value = []
  if (editingId.value) loadPartners()
}

function loadPartners() {
  clearTimeout(partnerTimeout)
  partnerTimeout = setTimeout(async () => {
    partnerOpts.value = await store.searchPartners(partnerSearch.value)
  }, 400)
}

async function choosePartner(loc, partner) {
  const r = await store.updateLocation(loc, { partner_odoo_id: partner ? partner.id : null, is_consignment: true })
  editingId.value = null
  r.ok ? toast.success(partner ? `Dipetakan ke ${partner.name}` : 'Pemetaan customer dilepas') : toast.error(r.message)
}

async function useSuggestion(loc, s) {
  const r = await store.updateLocation(loc, { partner_odoo_id: s.id, is_consignment: true })
  r.ok ? toast.success(`Dipetakan ke ${s.name}`) : toast.error(r.message)
}

// ── INTERVAL HITUNG ────────────────────────
async function saveInterval(loc, value) {
  const v = value === '' || value === null ? null : Number(value)
  if (v !== null && (!Number.isInteger(v) || v < 1 || v > 365)) return toast.error('Interval 1–365 hari')
  const r = await store.updateLocation(loc, { count_interval_days: v })
  if (!r.ok) toast.error(r.message)
}

// ── PAKAI SEMUA SARAN ──────────────────────
const showSkipped = ref(false)

async function handleApplyAll() {
  const r = await store.applyAllSuggestions()
  if (!r.ok) return toast.error(r.message)
  r.applied ? toast.success(r.message) : toast.info(r.message)
  showSkipped.value = r.skipped > 0
}

const filterOptions = [
  { value: 'all',         label: 'Semua lokasi' },
  { value: 'consignment', label: 'Konsinyasi' },
  { value: 'unmapped',    label: 'Belum ada customer' },
  { value: 'vehicle',     label: 'Mobil (canvas)' },
]

// ── MOBIL CANVAS ───────────────────────────
const salesEditingId = ref(null)
const salesSearch    = ref('')
const salesOpts      = ref([])
let salesTimeout     = null

async function toggleVehicle(loc) {
  const r = await store.updateLocation(loc, { is_vehicle: !loc.is_vehicle })
  r.ok ? toast.success(loc.is_vehicle ? 'Tanda mobil dilepas' : 'Ditandai sebagai mobil canvas') : toast.error(r.message)
}

function openSales(loc) {
  salesEditingId.value = salesEditingId.value === loc.id ? null : loc.id
  salesSearch.value = ''
  salesOpts.value = []
  if (salesEditingId.value) loadSales()
}

function loadSales() {
  clearTimeout(salesTimeout)
  salesTimeout = setTimeout(async () => { salesOpts.value = await store.searchSales(salesSearch.value) }, 400)
}

async function chooseSales(loc, s) {
  const r = await store.updateLocation(loc, { vehicle_sales_id: s ? s.id : null })
  salesEditingId.value = null
  r.ok ? toast.success(s ? `Mobil dipakai ${s.name}` : 'Sales pemakai dilepas') : toast.error(r.message)
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <!-- ── BREADCRUMB + SYNC ── -->
    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="table-list" /> Lokasi Stok
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item"><font-awesome-icon icon="house" /> Dashboard</span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Lokasi Stok</span>
        </div>
      </div>

      <div class="sync-info">
        <div class="sync-text">
          <span v-if="store.syncing" class="sync-status running">
            <font-awesome-icon icon="spinner" spin /> Sync lokasi berjalan...
          </span>
          <span v-else-if="store.syncStatus.last_status === 'failed'" class="sync-status failed" :title="store.syncStatus.last_error">
            <font-awesome-icon icon="circle-info" /> Sync terakhir gagal
          </span>
          <span class="sync-last">
            {{ store.syncStatus.consignment }} konsinyasi dari {{ store.syncStatus.total }} lokasi ·
            sync: {{ store.formatDateTime(store.syncStatus.last_success_at) }}
          </span>
        </div>
        <button class="btn-toolbar btn-purple" :disabled="store.syncing" @click="handleSync">
          <font-awesome-icon v-if="store.syncing" icon="spinner" spin />
          <font-awesome-icon v-else icon="rotate" />
          {{ store.syncing ? 'Menyinkronkan...' : 'Sync Lokasi Odoo' }}
        </button>
      </div>
    </div>

    <!-- ── PENJELASAN ── -->
    <div class="hint-card mb-2">
      <font-awesome-icon icon="circle-info" />
      Centang <strong>Konsinyasi</strong> untuk lokasi tempat barang dititipkan di customer.
      Menandai induk (mis. <code>WHDIM/Electronic City</code>) membuat semua sub-lokasinya ikut terhitung konsinyasi di Inventory.
      Untuk Stock Count, petakan <strong>lokasi per toko</strong> ke customer / cabangnya.
      Centang <strong>Mobil</strong> untuk lokasi canvas sales (stok yang dibawa di mobil), lalu pilih sales pemakainya.
    </div>

    <!-- ── FILTER ── -->
    <div class="controls-card">
      <div class="controls-row">
        <div class="controls-left">
          <select v-model="store.filters.company_id" class="form-select-sm" @change="store.fetchLocations(1)">
            <option :value="null">Semua company</option>
            <option v-for="c in store.companies" :key="c.id" :value="c.id">
              {{ c.name }} ({{ c.consignment }}/{{ c.locations }})
            </option>
          </select>

          <div class="view-tabs">
            <button
              v-for="opt in filterOptions" :key="opt.value"
              class="view-tab" :class="{ active: store.filters.filter === opt.value }"
              @click="store.filters.filter = opt.value; store.fetchLocations(1)"
            >{{ opt.label }}</button>
          </div>
        </div>

        <div class="controls-right">
          <button class="btn-toolbar btn-outline-purple" :disabled="store.applyingAll" @click="handleApplyAll"
                  title="Petakan otomatis lokasi konsinyasi yang sarannya tepat satu customer">
            <font-awesome-icon v-if="store.applyingAll" icon="spinner" spin />
            <font-awesome-icon v-else icon="plus" />
            {{ store.applyingAll ? 'Memetakan...' : 'Pakai semua saran' }}
          </button>

        <div class="search-wrap">
          <input v-model="store.filters.search" type="text" class="search-input"
                 placeholder="Cari lokasi / customer..." @input="store.searchWithDelay()" />
          <button class="search-btn"><font-awesome-icon icon="magnifying-glass" /></button>
        </div>
        </div>
      </div>
    </div>

    <!-- ── HASIL "PAKAI SEMUA SARAN" YANG PERLU DICEK MANUAL ── -->
    <div v-if="showSkipped && store.lastSkipped.length" class="skipped-card mb-2">
      <div class="skipped-head">
        <strong>{{ store.lastSkipped.length }} lokasi perlu dipilih manual</strong>
        <button class="btn-link" @click="showSkipped = false">Tutup</button>
      </div>
      <ul class="skipped-list">
        <li v-for="s in store.lastSkipped" :key="s.id">
          <span class="loc-name">{{ s.location }}</span> <span class="td-muted">— {{ s.reason }}</span>
        </li>
      </ul>
    </div>

    <!-- ── TABEL ── -->
    <div class="table-card flex-grow-1 overflow-auto mb-3">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:110px; text-align:center">Konsinyasi</th>
            <th style="width:90px; text-align:center">Mobil</th>
            <th>Lokasi Odoo</th>
            <th>Customer / Cabang · Sales mobil</th>
            <th style="width:130px">Interval hitung</th>
            <th style="width:120px; text-align:right">Stok saat ini</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.loading">
            <td colspan="6" class="td-center"><div class="spinner-custom"></div></td>
          </tr>
          <tr v-else-if="!store.locations.length">
            <td colspan="6" class="td-center">Tidak ada lokasi. Jalankan Sync Lokasi Odoo bila daftar masih kosong.</td>
          </tr>

          <tr v-for="loc in store.locations" v-else :key="loc.id" class="data-row"
              :class="{ 'row-selected': loc.is_consignment }">
            <td style="text-align:center">
              <input type="checkbox" class="row-check" :checked="loc.is_consignment"
                     :disabled="store.savingId === loc.id" @change="toggleConsignment(loc)" />
              <div v-if="loc.inherited_consignment" class="tiny-note">ikut induk</div>
            </td>

            <td style="text-align:center">
              <input type="checkbox" class="row-check" :checked="loc.is_vehicle"
                     :disabled="store.savingId === loc.id || loc.is_consignment" @change="toggleVehicle(loc)" />
              <div v-if="loc.is_warehouse_stock" class="tiny-note">stok gudang</div>
            </td>

            <td>
              <div class="loc-name">{{ loc.complete_name }}</div>
              <div class="td-muted">{{ loc.company.name }}<span v-if="loc.warehouse && loc.warehouse !== loc.company.name"> · {{ loc.warehouse }}</span></div>
            </td>

            <td class="td-partner">
              <template v-if="loc.is_consignment || loc.inherited_consignment">
                <div class="partner-line">
                  <span v-if="loc.partner" class="sales-chip current">{{ loc.partner.name }}</span>
                  <span v-else class="td-muted">Belum dipetakan</span>
                  <button class="btn-link" :disabled="store.savingId === loc.id" @click="openPartner(loc)">
                    {{ loc.partner ? 'Ganti' : 'Pilih' }}
                  </button>
                  <button v-if="loc.partner" class="btn-link danger" :disabled="store.savingId === loc.id"
                          @click="choosePartner(loc, null)">Lepas</button>
                </div>

                <div v-if="!loc.partner && loc.suggestions.length" class="suggest-line">
                  <span class="td-muted">Saran:</span>
                  <button v-for="s in loc.suggestions" :key="s.id" class="suggest-chip"
                          :disabled="store.savingId === loc.id" @click="useSuggestion(loc, s)">
                    {{ s.name }}
                  </button>
                </div>

                <div v-if="editingId === loc.id" class="partner-picker">
                  <input v-model="partnerSearch" type="text" class="form-input" placeholder="Cari customer / cabang..."
                         @input="loadPartners()" />
                  <div class="drop-scroll">
                    <div v-if="!partnerOpts.length" class="td-muted" style="padding:8px">Ketik untuk mencari...</div>
                    <button v-for="p in partnerOpts" :key="p.id" class="drop-item" @click="choosePartner(loc, p)">
                      {{ p.name }} <span v-if="p.city" class="td-muted">· {{ p.city }}</span>
                    </button>
                  </div>
                </div>
              </template>
              <template v-else-if="loc.is_vehicle">
                <div class="partner-line">
                  <span v-if="loc.vehicle_sales" class="sales-chip current">Sales: {{ loc.vehicle_sales.name }}</span>
                  <span v-else class="td-muted">Belum ada sales pemakai</span>
                  <button class="btn-link" :disabled="store.savingId === loc.id" @click="openSales(loc)">
                    {{ loc.vehicle_sales ? 'Ganti' : 'Pilih' }}
                  </button>
                  <button v-if="loc.vehicle_sales" class="btn-link danger" :disabled="store.savingId === loc.id"
                          @click="chooseSales(loc, null)">Lepas</button>
                </div>
                <div v-if="salesEditingId === loc.id" class="partner-picker">
                  <input v-model="salesSearch" type="text" class="form-input" placeholder="Cari sales..." @input="loadSales()" />
                  <div class="drop-scroll">
                    <div v-if="!salesOpts.length" class="td-muted" style="padding:8px">Ketik untuk mencari...</div>
                    <button v-for="s in salesOpts" :key="s.id" class="drop-item" @click="chooseSales(loc, s)">{{ s.name }}</button>
                  </div>
                </div>
              </template>
              <span v-else class="td-muted">—</span>
            </td>

            <td>
              <input v-if="loc.is_consignment" || loc.inherited_consignment" type="number" min="1" max="365"
                     class="form-input interval-input" :placeholder="`${store.defaultInterval} (default)`"
                     :value="loc.count_interval_days" @change="saveInterval(loc, $event.target.value)" />
              <span v-else class="td-muted">—</span>
            </td>

            <td class="td-muted" style="text-align:right">
              {{ store.formatQty(loc.stock_qty) }}
              <div class="tiny-note">{{ loc.stock_products }} product</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── PAGINATION ── -->
    <div class="pagination-card">
      <div class="pagination-nav">
        <button class="btn-prev-next" :disabled="store.pagination.current_page <= 1 || store.loading"
                @click="store.fetchLocations(store.pagination.current_page - 1)">
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button class="btn-prev-next" :disabled="store.pagination.current_page >= store.pagination.last_page || store.loading"
                @click="store.fetchLocations(store.pagination.current_page + 1)">
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <span class="page-badge">PAGE {{ store.pagination.current_page }} / {{ store.pagination.last_page }} · TOTAL {{ store.pagination.total }}</span>
    </div>
  </div>
</template>

<style scoped>
.h-100 { --text-muted: #64748b; }
.breadcrumb-card, .controls-card, .table-card, .pagination-card, .hint-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); }
.breadcrumb-card { padding: 16px 18px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }
.sync-info { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.sync-text { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.sync-last { font-size: 0.78rem; color: var(--text-muted); }
.sync-status { font-size: 0.78rem; font-weight: 700; display: inline-flex; gap: 6px; align-items: center; }
.sync-status.running { color: #6366f1; }
.sync-status.failed { color: #ef4444; cursor: help; }
.hint-card { padding: 10px 16px; font-size: 0.82rem; color: var(--text-muted); display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
.hint-card code { font-size: 0.78rem; }
.controls-card { padding: 14px 16px; margin-bottom: 12px; }
.controls-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.controls-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.form-select-sm { padding: 7px 10px; border: 1px solid var(--border-main); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.83rem; }
.view-tabs { display: inline-flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.view-tab { padding: 7px 14px; border: none; background: transparent; color: var(--text-muted); font-size: 0.82rem; font-weight: 600; cursor: pointer; }
.view-tab + .view-tab { border-left: 1px solid var(--border-main); }
.view-tab.active { background: #6366f1; color: #fff; }
.search-wrap { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.search-input { padding: 7px 12px; border: none; background: transparent; color: var(--text-primary); font-size: 0.84rem; outline: none; width: 240px; }
.search-btn { padding: 7px 12px; background: #6366f1; color: #fff; border: none; }
.btn-toolbar { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: none; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; }
.btn-toolbar:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-purple { background: #6366f1; color: #fff; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.data-table thead tr { background: var(--bg-input); border-bottom: 2px solid var(--border-main); position: sticky; top: 0; z-index: 2; }
.data-table th { padding: 12px 16px; text-align: left; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.07em; }
.data-table td { padding: 12px 16px; vertical-align: top; color: var(--text-primary); border-bottom: 1px solid var(--border-main); }
.data-row:hover { background: var(--bg-nav-hover); }
.row-selected { background: rgba(99,102,241,0.05); }
.td-center { text-align: center; padding: 40px; color: var(--text-muted); }
.td-muted { color: var(--text-muted); font-size: 0.8rem; }
.td-partner { min-width: 280px; }
.loc-name { font-weight: 600; word-break: break-word; }
.row-check { width: 16px; height: 16px; accent-color: #6366f1; cursor: pointer; }
.tiny-note { font-size: 0.7rem; color: var(--text-muted); margin-top: 2px; }
.partner-line, .suggest-line { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.suggest-line { margin-top: 6px; }
.sales-chip { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; border: 1px solid var(--border-main); }
.sales-chip.current { background: rgba(99,102,241,0.08); color: #4f46e5; border-color: rgba(99,102,241,0.25); }
.suggest-chip { padding: 2px 8px; border-radius: 99px; border: 1px dashed #6366f1; background: transparent; color: #6366f1; font-size: 0.75rem; cursor: pointer; }
.suggest-chip:disabled { opacity: 0.5; }
.btn-link { padding: 0; border: none; background: none; color: #6366f1; font-size: 0.8rem; font-weight: 600; cursor: pointer; text-decoration: underline; }
.btn-link.danger { color: #ef4444; }
.partner-picker { margin-top: 8px; border: 1px solid var(--border-main); border-radius: 8px; padding: 8px; background: var(--bg-card); }
.form-input { width: 100%; box-sizing: border-box; padding: 6px 10px; border: 1px solid var(--border-main); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.82rem; outline: none; }
.interval-input { width: 110px; }
.drop-scroll { max-height: 220px; overflow-y: auto; margin-top: 6px; }
.drop-item { width: 100%; text-align: left; padding: 6px 8px; border: none; background: none; border-radius: 6px; color: var(--text-primary); font-size: 0.82rem; cursor: pointer; }
.drop-item:hover { background: var(--bg-nav-hover); }
.spinner-custom { width: 32px; height: 32px; margin: auto; border: 3px solid var(--border-main); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.pagination-card { padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.pagination-nav { display: flex; gap: 8px; }
.btn-prev-next { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badge { padding: 7px 14px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); background: var(--bg-input); }
.controls-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.btn-outline-purple { background: #fff; color: #6f42c1; border: 1px solid #6f42c1; }
.btn-outline-purple:hover:not(:disabled) { background: #f3edfb; }
.skipped-card { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.3); border-radius: 10px; padding: 10px 16px; font-size: 0.82rem; }
.skipped-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.skipped-list { margin: 0; padding-left: 18px; max-height: 180px; overflow-y: auto; }
@media (max-width: 768px) { .search-input { width: 100%; } .sync-text { align-items: flex-start; } }
</style>