<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useSalesTargetStore } from '@/stores/salesTargetStore'
import { useToast } from 'vue-toastification'

const store = useSalesTargetStore()
const toast = useToast()

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i) // -2 s/d +2 dari tahun berjalan

onMounted(async () => {
  await loadAll()
})

async function loadAll() {
  try {
    await Promise.all([
      store.fetchTargets(),
      store.fetchSummary(),
      loadSalesOptions(), // full list buat dropdown "Sales" di form (lihat bawah)
    ])
  } catch (err) {
    toast.error('Gagal memuat data target penjualan.')
  }
}

// ── DROPDOWN OPEN/CLOSE STATE ──
const showYearMenu    = ref(false)
const showPerPageMenu = ref(false)

function changeYear(year) {
  showYearMenu.value = false
  store.changePeriodYear(year)
  store.fetchSummary({ period_year: year })
}

// ── FORM MODAL (create / edit) ──
const showFormModal = ref(false)
const formMode      = ref('create') // 'create' | 'edit'
const submitting    = ref(false)

const emptyForm = () => ({
  id: null,
  sales_id: '',
  period_year: currentYear,
  target_type: 'total', // 'total' | 'customer' | 'brand' | 'category'
  odoo_customer_id: '',
  odoo_product_id: '',
  categ_id: '',
  categ_name: '',
  target_amount: '',
  notes: '',
})
const form = reactive(emptyForm())
const formErrors = ref({})

// ── SEARCHABLE DROPDOWN: Sales / Customer Odoo / Brand / Kategori ──
// Pola SAMA PERSIS kayak yang dipakai di form Tambah/Edit Target Visit
// (visitTargetView.vue) -- tombol "form-select-btn" yang nampilin label
// terpilih, diklik buka panel "drop-menu-full" berisi <input> pencarian
// + list yang bisa di-scroll.
//
// Bedanya cuma di sumber datanya:
// - Sales   : daftar sales biasanya cuma puluhan orang, jadi di-load PENUH
//             sekali (onMounted, lihat loadSalesOptions() di bawah), terus
//             difilter di FRONTEND (computed filteredSalesOptions) -- ga
//             nge-hit API tiap ngetik. Sama kayak salesList di
//             visitTargetView.vue.
// - Customer Odoo : DI-SCOPE ke Sales yang lagi dipilih (baru bisa dibuka
//             setelah form.sales_id keisi) -- endpoint
//             /sales-targets/options/customers?sales_id=X&search=...
//             cuma balikin customer yang jadi tanggung jawab sales itu
//             (lewat CustomerSalesAssignmentOdoo), listnya dicari di
//             backend tiap ngetik. Pola SAMA PERSIS kayak "Pilih Customer"
//             di form Target Visit yang baru keisi setelah Sales dipilih.
// - Brand (Product) & Kategori : TIDAK di-scope ke Sales (product/kategori
//             ga "dimiliki" sales tertentu) -- listnya dicari di backend
//             tiap ngetik, sama gayanya kayak panel Customer, cuma tanpa
//             guard "harus pilih Sales dulu".
//
// Field mana yang dipakai ditentuin dari form.target_type ('total' |
// 'customer' | 'brand' | 'category') -- cuma SALAH SATU dari
// odoo_customer_id / odoo_product_id / categ_id yang boleh keisi pas
// submit (dijaga di selectTargetType() & submitForm(), didobel lagi di
// backend lewat SalesTargetValidationStore + CHECK constraint DB).
const showSalesPicker    = ref(false)
const showCustomerPicker = ref(false)
const showBrandPicker    = ref(false)
const showCategoryPicker = ref(false)

const salesSearch    = ref('') // teks di kotak cari dalam panel Sales (filter lokal)
const customerSearch = ref('') // teks di kotak cari dalam panel Customer (query ke server)
const brandSearch    = ref('') // teks di kotak cari dalam panel Brand (query ke server)
const categorySearch = ref('') // teks di kotak cari dalam panel Kategori (query ke server)
let customerSearchTimeout = null
let brandSearchTimeout    = null
let categorySearchTimeout = null

const filteredSalesOptions = computed(() => {
  const q = salesSearch.value.trim().toLowerCase()
  return q
    ? store.salesOptions.filter(o => o.label.toLowerCase().includes(q))
    : store.salesOptions
})

const selectedSalesLabel = computed(() =>
  store.salesOptions.find(o => o.value === form.sales_id)?.label || 'Pilih Sales'
)

// label pilihan TERPILIH per dimensi -- disimpen terpisah (bukan computed
// dari list), soalnya list di store cuma nampung hasil pencarian TERAKHIR
// (server search), bukan seluruh katalog.
const selectedCustomerLabel = ref('Pilih customer...')
const selectedBrandLabel    = ref('Pilih brand (product)...')
const selectedCategoryLabel = ref('Pilih kategori...')

async function loadSalesOptions() {
  await store.fetchSalesOptions()
}

function toggleSalesPicker() {
  showSalesPicker.value = !showSalesPicker.value
  if (showSalesPicker.value) salesSearch.value = ''
}
function selectSalesOption(opt) {
  const changedSales = form.sales_id !== opt.value
  form.sales_id = opt.value
  showSalesPicker.value = false
  salesSearch.value = ''

  // ganti sales -> customer yang kepilih sebelumnya (kalau ada) belum
  // tentu jadi tanggung jawab sales yang baru, jadi direset. Cuma relevan
  // buat tipe 'customer' (Brand/Kategori ga di-scope ke sales).
  if (changedSales && form.target_type === 'customer') {
    form.odoo_customer_id = ''
    selectedCustomerLabel.value = 'Pilih customer...'
    store.customerOptions.splice(0, store.customerOptions.length)
  }
}

function toggleCustomerPicker() {
  if (!form.sales_id) return // guard tambahan -- tombolnya juga udah didisable di template
  showCustomerPicker.value = !showCustomerPicker.value
  if (showCustomerPicker.value) {
    customerSearch.value = ''
    store.fetchCustomerOptions('', form.sales_id) // isi awal panel begitu dibuka
  }
}
function onCustomerSearchInput() {
  clearTimeout(customerSearchTimeout)
  customerSearchTimeout = setTimeout(() => {
    store.fetchCustomerOptions(customerSearch.value, form.sales_id)
  }, 350)
}
function selectCustomerOption(opt) {
  form.odoo_customer_id = opt.value
  selectedCustomerLabel.value = opt.label
  showCustomerPicker.value = false
  customerSearch.value = ''
}

// ── PICKER BRAND (Product Odoo) -- TIDAK di-scope ke Sales ──
function toggleBrandPicker() {
  showBrandPicker.value = !showBrandPicker.value
  if (showBrandPicker.value) {
    brandSearch.value = ''
    store.fetchProductOptions('')
  }
}
function onBrandSearchInput() {
  clearTimeout(brandSearchTimeout)
  brandSearchTimeout = setTimeout(() => {
    store.fetchProductOptions(brandSearch.value)
  }, 350)
}
function selectBrandOption(opt) {
  form.odoo_product_id = opt.value
  selectedBrandLabel.value = opt.label
  showBrandPicker.value = false
  brandSearch.value = ''
}

// ── PICKER KATEGORI -- TIDAK di-scope ke Sales ──
function toggleCategoryPicker() {
  showCategoryPicker.value = !showCategoryPicker.value
  if (showCategoryPicker.value) {
    categorySearch.value = ''
    store.fetchCategoryOptions('')
  }
}
function onCategorySearchInput() {
  clearTimeout(categorySearchTimeout)
  categorySearchTimeout = setTimeout(() => {
    store.fetchCategoryOptions(categorySearch.value)
  }, 350)
}
function selectCategoryOption(opt) {
  form.categ_id = opt.value
  form.categ_name = opt.label
  selectedCategoryLabel.value = opt.label
  showCategoryPicker.value = false
  categorySearch.value = ''
}

// ── GANTI TIPE TARGET (Total / Customer / Brand / Kategori) ──
// 1 baris target cuma boleh isi SALAH SATU dimensi -- makanya tiap ganti
// tab, 3 field dimensi (odoo_customer_id/odoo_product_id/categ_id+name)
// direset semua, biar ga ketinggalan nilai lama dari tab sebelumnya.
function selectTargetType(type) {
  form.target_type = type
  form.odoo_customer_id = ''
  form.odoo_product_id = ''
  form.categ_id = ''
  form.categ_name = ''
  selectedCustomerLabel.value = 'Pilih customer...'
  selectedBrandLabel.value = 'Pilih brand (product)...'
  selectedCategoryLabel.value = 'Pilih kategori...'
  showCustomerPicker.value = false
  showBrandPicker.value = false
  showCategoryPicker.value = false
}

function resetPickers() {
  showSalesPicker.value = false
  showCustomerPicker.value = false
  showBrandPicker.value = false
  showCategoryPicker.value = false
  salesSearch.value = ''
  customerSearch.value = ''
  brandSearch.value = ''
  categorySearch.value = ''
  selectedCustomerLabel.value = 'Pilih customer...'
  selectedBrandLabel.value = 'Pilih brand (product)...'
  selectedCategoryLabel.value = 'Pilih kategori...'
}

function openCreateModal() {
  formMode.value = 'create'
  Object.assign(form, emptyForm())
  form.period_year = store.filterPeriodYear || currentYear
  formErrors.value = {}
  resetPickers()
  showFormModal.value = true
}

function openEditModal(target) {
  formMode.value = 'edit'
  const targetType = target.target_type || (target.is_total_target ? 'total' : 'customer')
  Object.assign(form, {
    id: target.id,
    sales_id: target.sales_id,
    period_year: target.period_year,
    target_type: targetType,
    odoo_customer_id: target.odoo_customer_id ?? '',
    odoo_product_id: target.odoo_product_id ?? '',
    categ_id: target.categ_id ?? '',
    categ_name: target.categ_name ?? '',
    target_amount: target.target_amount,
    notes: target.notes ?? '',
  })
  formErrors.value = {}
  resetPickers()
  if (targetType === 'customer') {
    selectedCustomerLabel.value = target.customer_name || ('#' + target.odoo_customer_id)
  } else if (targetType === 'brand') {
    selectedBrandLabel.value = target.product_name || ('#' + target.odoo_product_id)
  } else if (targetType === 'category') {
    selectedCategoryLabel.value = target.categ_name || ('#' + target.categ_id)
  }
  showFormModal.value = true
}

function closeModal() {
  if (submitting.value) return
  showFormModal.value = false
}

async function submitForm() {
  formErrors.value = {}

  if (!form.sales_id) {
    formErrors.value.sales_id = 'ID Sales wajib diisi.'
  }
  if (!form.period_year) {
    formErrors.value.period_year = 'Tahun wajib diisi.'
  }
  if (form.target_amount === '' || form.target_amount === null || Number(form.target_amount) < 0) {
    formErrors.value.target_amount = 'Target harus diisi angka >= 0.'
  }
  if (form.target_type === 'customer' && !form.odoo_customer_id) {
    formErrors.value.odoo_customer_id = 'Pilih customer dulu.'
  }
  if (form.target_type === 'brand' && !form.odoo_product_id) {
    formErrors.value.odoo_product_id = 'Pilih brand (product) dulu.'
  }
  if (form.target_type === 'category' && !form.categ_id) {
    formErrors.value.categ_id = 'Pilih kategori dulu.'
  }
  if (Object.keys(formErrors.value).length > 0) return

  // Cuma kirim SALAH SATU dimensi sesuai form.target_type -- yang lain
  // dipaksa null, biar konsisten sama aturan "1 baris cuma 1 dimensi" di
  // backend (SalesTargetValidationStore + CHECK constraint DB).
  const payload = {
    sales_id: Number(form.sales_id),
    period_year: Number(form.period_year),
    odoo_customer_id: form.target_type === 'customer' && form.odoo_customer_id !== ''
      ? Number(form.odoo_customer_id) : null,
    odoo_product_id: form.target_type === 'brand' && form.odoo_product_id !== ''
      ? Number(form.odoo_product_id) : null,
    categ_id: form.target_type === 'category' && form.categ_id !== ''
      ? Number(form.categ_id) : null,
    categ_name: form.target_type === 'category' ? (form.categ_name || null) : null,
    target_amount: Number(form.target_amount),
    notes: form.notes || null,
  }

  submitting.value = true
  try {
    if (formMode.value === 'create') {
      await store.createTarget(payload)
      toast.success('Target penjualan berhasil dibuat.')
    } else {
      await store.updateTarget(form.id, payload)
      toast.success('Target penjualan berhasil diupdate.')
    }
    await store.fetchSummary()
    showFormModal.value = false
  } catch (err) {
    const res = err.response?.data
    if (res?.errors) {
      // errors dari FormRequest validation (kalau ada) -- tampilin per field
      Object.entries(res.errors).forEach(([field, msgs]) => {
        formErrors.value[field] = Array.isArray(msgs) ? msgs[0] : msgs
      })
    }
    toast.error(res?.message || 'Gagal menyimpan target penjualan.')
  } finally {
    submitting.value = false
  }
}

// ── DELETE CONFIRM MODAL ──
const showDeleteModal = ref(false)
const targetToDelete  = ref(null)

function askDelete(target) {
  targetToDelete.value = target
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!targetToDelete.value) return
  try {
    await store.deleteTarget(targetToDelete.value.id)
    toast.success('Target penjualan berhasil dihapus.')
    await store.fetchSummary()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal menghapus target penjualan.')
  } finally {
    showDeleteModal.value = false
    targetToDelete.value = null
  }
}

// ── PROGRESS BAR HELPER ──
function progressColor(percent) {
  if (percent >= 100) return 'good'
  if (percent >= 50) return 'mid'
  return 'low'
}

// ── DETAIL MODAL (breakdown di balik angka "Tercapai") ──
const showDetailModal = ref(false)

async function openDetailModal(target) {
  showDetailModal.value = true
  try {
    await store.fetchTargetDetail(target.id)
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal memuat detail target.')
    showDetailModal.value = false
  }
}
function closeDetailModal() {
  showDetailModal.value = false
}

const summaryRows = computed(() => store.summaryData)
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="bullseye" />
          Target Penjualan
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" />
            Dashboard
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Target Penjualan</span>
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
        <button class="btn-toolbar btn-purple" @click="openCreateModal">
          <font-awesome-icon icon="plus" /> Tambah Target
        </button>
      </div>
    </div>

    <!-- ===== RINGKASAN PENCAPAIAN ===== -->
    <div class="section-title">
      <font-awesome-icon icon="chart-line" />
      <span>Ringkasan Pencapaian {{ store.filterPeriodYear }}</span>
    </div>

    <div v-if="store.loadingSummary" class="state-card mb-3">
      <font-awesome-icon icon="spinner" spin /> Memuat ringkasan...
    </div>
    <div v-else-if="summaryRows.length === 0" class="state-card mb-3">
      <div class="empty-state">
        <font-awesome-icon icon="inbox" class="empty-icon" />
        <div>Belum ada target total untuk tahun {{ store.filterPeriodYear }}.</div>
      </div>
    </div>
    <div v-else class="summary-grid mb-3">
      <div v-for="row in summaryRows" :key="row.sales_id" class="summary-card">
        <div class="summary-head">
          <span class="summary-name">{{ row.sales_name }}</span>
          <span class="summary-percent" :class="progressColor(row.achievement_percent)">
            {{ row.achievement_percent }}%
          </span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :class="progressColor(row.achievement_percent)"
            :style="{ width: Math.min(row.achievement_percent, 100) + '%' }"></div>
        </div>
        <div class="summary-amounts">
          <span>{{ store.formatCurrency(row.achieved_amount) }}</span>
          <span class="text-muted-color"> / {{ store.formatCurrency(row.target_amount) }}</span>
        </div>
      </div>
    </div>

    <!-- ===== CONTROLS ===== -->
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
        </div>

        <div class="controls-right">
          <div class="search-wrap">
            <input
              :value="store.searchQuery"
              type="text"
              placeholder="Cari nama sales / customer..."
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
      <span>Daftar Target</span>
      <span class="count">{{ store.pagination.total }}</span>
    </div>

    <!-- ===== LOADING / EMPTY ===== -->
    <div v-if="store.loadingTargets" class="state-card mb-3">
      <font-awesome-icon icon="spinner" spin /> Memuat data...
    </div>
    <div v-else-if="store.targetsData.length === 0" class="state-card mb-3">
      <div class="empty-state">
        <font-awesome-icon icon="inbox" class="empty-icon" />
        <div>Belum ada target penjualan untuk tahun {{ store.filterPeriodYear }}. Klik "Tambah Target" buat bikin baru.</div>
      </div>
    </div>

    <!-- ===== TABLE VIEW ===== -->
    <div v-else class="table-card flex-grow-1 overflow-auto mb-3">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:56px">NO.</th>
            <th>SALES</th>
            <th>TARGET UNTUK</th>
            <th style="width:150px">TARGET</th>
            <th style="width:150px">TERCAPAI</th>
            <th style="width:160px">PROGRESS</th>
            <th style="width:100px">AKSI</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(t, index) in store.targetsData" :key="t.id" class="data-row">
            <td class="td-no">{{ (store.pagination.current_page - 1) * store.pagination.per_page + index + 1 }}.</td>
            <td class="font-semibold">{{ t.sales_name || ('#' + t.sales_id) }}</td>
            <td>
              <span v-if="t.target_type === 'brand'" class="brand-chip">
                <font-awesome-icon icon="tag" /> {{ t.product_name || ('#' + t.odoo_product_id) }}
              </span>
              <span v-else-if="t.target_type === 'category'" class="category-chip">
                <font-awesome-icon icon="folder-tree" /> {{ t.categ_name || ('#' + t.categ_id) }}
              </span>
              <span v-else-if="t.target_type === 'customer'" class="td-muted">{{ t.customer_name || ('#' + t.odoo_customer_id) }}</span>
              <span v-else class="total-chip">TOTAL</span>
            </td>
            <td>{{ store.formatCurrency(t.target_amount) }}</td>
            <td>{{ store.formatCurrency(t.achieved_amount) }}</td>
            <td>
              <div class="progress-track table-progress">
                <div class="progress-fill" :class="progressColor(t.achievement_percent)"
                  :style="{ width: Math.min(t.achievement_percent, 100) + '%' }"></div>
              </div>
              <span class="progress-label" :class="progressColor(t.achievement_percent)">{{ t.achievement_percent }}%</span>
            </td>
            <td>
              <div class="action-btns">
                <button class="btn-icon" title="Detail" @click="openDetailModal(t)">
                  <font-awesome-icon icon="eye" />
                </button>
                <button class="btn-icon" title="Edit" @click="openEditModal(t)">
                  <font-awesome-icon icon="pen" />
                </button>
                <button class="btn-icon btn-icon-danger" title="Hapus" @click="askDelete(t)">
                  <font-awesome-icon icon="trash" />
                </button>
              </div>
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
          @click="store.fetchTargets(store.pagination.prev_page_url)"
        >
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button
          class="btn-prev-next"
          :disabled="store.pagination.current_page === store.pagination.last_page"
          @click="store.fetchTargets(store.pagination.next_page_url)"
        >
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">{{ store.targetsData.length }} DATA | PAGE {{ store.pagination.current_page }}</span>
        <span class="page-badge">TOTAL: {{ store.pagination.total }}</span>
      </div>
    </div>

    <!-- ===== MODAL: FORM CREATE/EDIT ===== -->
    <div v-if="showFormModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-box">
        <div class="modal-head">
          <h5>{{ formMode === 'create' ? 'Tambah Target Penjualan' : 'Edit Target Penjualan' }}</h5>
          <button class="modal-close" @click="closeModal"><font-awesome-icon icon="xmark" /></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Sales <span class="req">*</span></label>
            <div class="drop-wrap drop-wrap-full">
              <button
                type="button" class="form-select-btn" :class="{ 'is-invalid': formErrors.sales_id }"
                :disabled="store.loadingSalesOptions"
                @click="toggleSalesPicker"
              >
                <span>{{ store.loadingSalesOptions ? 'Memuat...' : selectedSalesLabel }}</span>
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-menu-full" :class="{ show: showSalesPicker }">
                <input v-model="salesSearch" type="text" class="drop-search-input" placeholder="Cari nama sales..." />
                <div class="drop-scroll-list">
                  <button
                    v-for="opt in filteredSalesOptions" :key="opt.value"
                    type="button" class="drop-item" :class="{ active: form.sales_id === opt.value }"
                    @click="selectSalesOption(opt)"
                  >{{ opt.label }}</button>
                  <div v-if="filteredSalesOptions.length === 0" class="drop-empty">Tidak ditemukan</div>
                </div>
              </div>
            </div>
            <div class="form-hint">Daftar sales (role Sales, aktif) -- diambil dari ms_users.</div>
            <div v-if="formErrors.sales_id" class="form-error">{{ formErrors.sales_id }}</div>
          </div>

          <div class="form-group">
            <label>Tahun <span class="req">*</span></label>
            <input type="number" class="form-input" v-model="form.period_year" placeholder="2026" />
            <div v-if="formErrors.period_year" class="form-error">{{ formErrors.period_year }}</div>
          </div>

          <div class="form-group">
            <label>Tipe Target <span class="req">*</span></label>
            <div class="type-tabs">
              <button type="button" class="type-tab" :class="{ active: form.target_type === 'total' }" @click="selectTargetType('total')">
                <font-awesome-icon icon="layer-group" /> Total
              </button>
              <button type="button" class="type-tab" :class="{ active: form.target_type === 'customer' }" @click="selectTargetType('customer')">
                <font-awesome-icon icon="building" /> Customer
              </button>
              <button type="button" class="type-tab" :class="{ active: form.target_type === 'brand' }" @click="selectTargetType('brand')">
                <font-awesome-icon icon="tag" /> Brand
              </button>
              <button type="button" class="type-tab" :class="{ active: form.target_type === 'category' }" @click="selectTargetType('category')">
                <font-awesome-icon icon="folder-tree" /> Kategori
              </button>
            </div>
            <div class="form-hint">Total = target gabungan semua customer. Pilih Customer/Brand/Kategori kalau target ini khusus untuk 1 dimensi tertentu.</div>
          </div>

          <div v-if="form.target_type === 'customer'" class="form-group">
            <label>Customer <span class="req">*</span></label>
            <div class="drop-wrap drop-wrap-full">
              <button
                type="button" class="form-select-btn" :class="{ 'is-invalid': formErrors.odoo_customer_id }"
                :disabled="!form.sales_id"
                @click="toggleCustomerPicker"
              >
                <span>{{ form.sales_id ? selectedCustomerLabel : 'Pilih Sales dulu' }}</span>
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-menu-full" :class="{ show: showCustomerPicker }">
                <input
                  v-model="customerSearch" type="text" class="drop-search-input"
                  placeholder="Cari nama customer..." @input="onCustomerSearchInput"
                />
                <div class="drop-scroll-list">
                  <div v-if="store.loadingCustomerOptions" class="drop-empty">
                    <font-awesome-icon icon="spinner" spin /> Mencari...
                  </div>
                  <template v-else>
                    <button
                      v-for="opt in store.customerOptions" :key="opt.value"
                      type="button" class="drop-item" :class="{ active: form.odoo_customer_id === opt.value }"
                      @click="selectCustomerOption(opt)"
                    >{{ opt.label }}</button>
                    <div v-if="store.customerOptions.length === 0" class="drop-empty">
                      Sales ini belum punya customer
                    </div>
                  </template>
                </div>
              </div>
            </div>
            <div class="form-hint">Cuma customer yang di-assign ke Sales ini yang muncul (realisasinya dihitung dari situ).</div>
            <div v-if="formErrors.odoo_customer_id" class="form-error">{{ formErrors.odoo_customer_id }}</div>
          </div>

          <div v-if="form.target_type === 'brand'" class="form-group">
            <label>Brand (Product) <span class="req">*</span></label>
            <div class="drop-wrap drop-wrap-full">
              <button
                type="button" class="form-select-btn" :class="{ 'is-invalid': formErrors.odoo_product_id }"
                @click="toggleBrandPicker"
              >
                <span>{{ selectedBrandLabel }}</span>
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-menu-full" :class="{ show: showBrandPicker }">
                <input
                  v-model="brandSearch" type="text" class="drop-search-input"
                  placeholder="Cari nama/kode product..." @input="onBrandSearchInput"
                />
                <div class="drop-scroll-list">
                  <div v-if="store.loadingProductOptions" class="drop-empty">
                    <font-awesome-icon icon="spinner" spin /> Mencari...
                  </div>
                  <template v-else>
                    <button
                      v-for="opt in store.productOptions" :key="opt.value"
                      type="button" class="drop-item" :class="{ active: form.odoo_product_id === opt.value }"
                      @click="selectBrandOption(opt)"
                    >{{ opt.label }}</button>
                    <div v-if="store.productOptions.length === 0" class="drop-empty">Tidak ditemukan</div>
                  </template>
                </div>
              </div>
            </div>
            <div class="form-hint">Target khusus 1 product (Brand), dihitung dari transaksi customer-customer Sales ini untuk product tersebut.</div>
            <div v-if="formErrors.odoo_product_id" class="form-error">{{ formErrors.odoo_product_id }}</div>
          </div>

          <div v-if="form.target_type === 'category'" class="form-group">
            <label>Kategori <span class="req">*</span></label>
            <div class="drop-wrap drop-wrap-full">
              <button
                type="button" class="form-select-btn" :class="{ 'is-invalid': formErrors.categ_id }"
                @click="toggleCategoryPicker"
              >
                <span>{{ selectedCategoryLabel }}</span>
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-menu-full" :class="{ show: showCategoryPicker }">
                <input
                  v-model="categorySearch" type="text" class="drop-search-input"
                  placeholder="Cari nama kategori..." @input="onCategorySearchInput"
                />
                <div class="drop-scroll-list">
                  <div v-if="store.loadingCategoryOptions" class="drop-empty">
                    <font-awesome-icon icon="spinner" spin /> Mencari...
                  </div>
                  <template v-else>
                    <button
                      v-for="opt in store.categoryOptions" :key="opt.value"
                      type="button" class="drop-item" :class="{ active: form.categ_id === opt.value }"
                      @click="selectCategoryOption(opt)"
                    >{{ opt.label }}</button>
                    <div v-if="store.categoryOptions.length === 0" class="drop-empty">Tidak ditemukan</div>
                  </template>
                </div>
              </div>
            </div>
            <div class="form-hint">Target khusus 1 kategori product (gabungan semua brand di kategori itu).</div>
            <div v-if="formErrors.categ_id" class="form-error">{{ formErrors.categ_id }}</div>
          </div>

          <div class="form-group">
            <label>Target (Rp) <span class="req">*</span></label>
            <input type="number" class="form-input" v-model="form.target_amount" placeholder="500000000" />
            <div v-if="formErrors.target_amount" class="form-error">{{ formErrors.target_amount }}</div>
          </div>

          <div class="form-group">
            <label>Catatan</label>
            <textarea class="form-input" rows="3" v-model="form.notes" placeholder="Opsional"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-toolbar btn-outline" :disabled="submitting" @click="closeModal">Batal</button>
          <button class="btn-toolbar btn-purple" :disabled="submitting" @click="submitForm">
            <font-awesome-icon v-if="submitting" icon="spinner" spin />
            {{ submitting ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===== MODAL: CONFIRM DELETE ===== -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-box modal-sm">
        <div class="modal-head">
          <h5>Hapus Target?</h5>
          <button class="modal-close" @click="showDeleteModal = false"><font-awesome-icon icon="xmark" /></button>
        </div>
        <div class="modal-body">
          <p>Yakin mau hapus target penjualan ini? Data yang sudah dihapus bisa dipulihkan lewat database (soft delete).</p>
        </div>
        <div class="modal-footer">
          <button class="btn-toolbar btn-outline" @click="showDeleteModal = false">Batal</button>
          <button class="btn-toolbar btn-danger" :disabled="store.deleting" @click="confirmDelete">
            <font-awesome-icon v-if="store.deleting" icon="spinner" spin />
            {{ store.deleting ? 'Menghapus...' : 'Ya, Hapus' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===== MODAL: DETAIL TARGET (breakdown di balik angka Tercapai) ===== -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
      <div class="modal-box modal-lg">
        <div class="modal-head">
          <h5>Detail Target</h5>
          <button class="modal-close" @click="closeDetailModal"><font-awesome-icon icon="xmark" /></button>
        </div>
        <div class="modal-body">

          <div v-if="store.loadingDetail" class="state-card">
            <font-awesome-icon icon="spinner" spin /> Memuat detail...
          </div>

          <template v-else-if="store.targetDetail">
            <div class="detail-head">
              <div>
                <div class="detail-sales-name">{{ store.targetDetail.target.sales_name }}</div>
                <div class="detail-sub">
                  Tahun {{ store.targetDetail.target.period_year }} &middot;
                  <span v-if="store.targetDetail.type === 'total'">Target Total (semua customer)</span>
                  <span v-else-if="store.targetDetail.type === 'customer'">{{ store.targetDetail.target.customer_name }}</span>
                  <span v-else-if="store.targetDetail.type === 'brand'">Brand: {{ store.targetDetail.target.product_name }}</span>
                  <span v-else>Kategori: {{ store.targetDetail.target.categ_name }}</span>
                </div>
              </div>
              <span class="summary-percent" :class="progressColor(store.targetDetail.target.achievement_percent)">
                {{ store.targetDetail.target.achievement_percent }}%
              </span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" :class="progressColor(store.targetDetail.target.achievement_percent)"
                :style="{ width: Math.min(store.targetDetail.target.achievement_percent, 100) + '%' }"></div>
            </div>
            <div class="detail-amounts">
              {{ store.formatCurrency(store.targetDetail.target.achieved_amount) }}
              <span class="text-muted-color"> / {{ store.formatCurrency(store.targetDetail.target.target_amount) }}</span>
            </div>

            <!-- TARGET PER-CUSTOMER / PER-BRAND: daftar transaksi -->
            <template v-if="store.targetDetail.type === 'customer' || store.targetDetail.type === 'brand'">
              <div class="detail-section-title">Rincian Transaksi</div>
              <div v-if="store.targetDetail.transactions.length === 0" class="state-card">
                Belum ada transaksi di tahun ini.
              </div>
              <div v-else class="detail-tx-list">
                <div v-for="(tx, i) in store.targetDetail.transactions" :key="i" class="detail-tx-item">
                  <div class="detail-tx-top">
                    <span class="detail-tx-code">{{ tx.order_name || '-' }}</span>
                    <span class="detail-tx-date">{{ store.formatDate(tx.order_date) }}</span>
                  </div>
                  <div v-if="store.targetDetail.type === 'brand'" class="detail-tx-customer">
                    <font-awesome-icon icon="building" /> {{ tx.customer_name }}
                  </div>
                  <div class="detail-tx-product">
                    <span v-if="tx.product_code" class="mono">[{{ tx.product_code }}]</span>
                    {{ tx.product_name || '-' }}
                  </div>
                  <div class="detail-tx-bottom">
                    <span>Qty: {{ tx.qty }}</span>
                    <span>Harga: {{ store.formatCurrency(tx.price_unit) }}</span>
                    <span class="font-semibold">{{ store.formatCurrency(tx.subtotal) }}</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- TARGET PER-KATEGORI: breakdown per product -->
            <template v-else-if="store.targetDetail.type === 'category'">
              <div class="detail-section-title">Breakdown per Product</div>
              <div v-if="store.targetDetail.products.length === 0" class="state-card">
                Belum ada transaksi di kategori ini.
              </div>
              <div v-else class="table-card">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>PRODUCT</th>
                      <th style="width:120px">TRANSAKSI</th>
                      <th style="width:170px">TERCAPAI</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="p in store.targetDetail.products" :key="p.odoo_product_id" class="data-row">
                      <td class="font-semibold">{{ p.product_name }}</td>
                      <td class="td-muted">{{ p.transaction_count }}x</td>
                      <td>{{ store.formatCurrency(p.achieved_amount) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>

            <!-- TARGET TOTAL: breakdown per customer -->
            <template v-else>
              <div class="detail-section-title">Breakdown per Customer</div>
              <div v-if="store.targetDetail.customers.length === 0" class="state-card">
                Sales ini belum punya customer assignment.
              </div>
              <div v-else class="table-card">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>CUSTOMER</th>
                      <th style="width:120px">TRANSAKSI</th>
                      <th style="width:170px">TERCAPAI</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="c in store.targetDetail.customers" :key="c.odoo_customer_id" class="data-row">
                      <td class="font-semibold">{{ c.customer_name }}</td>
                      <td class="td-muted">{{ c.transaction_count }}x</td>
                      <td>{{ store.formatCurrency(c.achieved_amount) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
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

.btn-toolbar {
  display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border: none; border-radius: 8px;
  font-size: 0.83rem; font-weight: 700; cursor: pointer; transition: all 0.18s ease; white-space: nowrap;
}
.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover:not(:disabled) { background: #4f46e5; }
.btn-purple:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-outline { background: transparent; color: var(--text-primary); border: 1px solid var(--border-main); }
.btn-outline:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; }
.btn-danger { background: #ef4444; color: #fff; }
.btn-danger:hover:not(:disabled) { background: #dc2626; }
.btn-arrow { font-size: 0.6rem; opacity: 0.7; }

/* ===== CONTROLS ===== */
.controls-card { background: var(--bg-card); border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); }
.controls-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.controls-left, .controls-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.showing-wrap { display: flex; align-items: center; gap: 6px; font-size: 0.84rem; color: var(--text-primary); font-weight: 600; }
.search-wrap { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.search-input { padding: 7px 12px; border: none; background: transparent; color: var(--text-primary); font-size: 0.84rem; outline: none; width: 240px; }
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
  position: absolute; top: calc(100% + 6px); left: 0; min-width: 170px; background: var(--bg-card);
  border: 1px solid var(--border-main); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 10px; z-index: 200; opacity: 0; transform: translateY(-6px); pointer-events: none; transition: all 0.18s ease;
}
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

/* ===== STATE CARD ===== */
.state-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); padding: 40px; text-align: center; color: var(--text-muted); }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--text-muted); }
.empty-icon { font-size: 2rem; opacity: 0.3; }

/* ===== SUMMARY CARDS ===== */
.summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
.summary-card { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; padding: 14px 16px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: column; gap: 8px; }
.summary-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.summary-name { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); }
.summary-percent { font-size: 0.8rem; font-weight: 800; }
.summary-amounts { font-size: 0.8rem; color: var(--text-primary); font-weight: 600; }

.progress-track { height: 8px; border-radius: 20px; background: var(--bg-input); overflow: hidden; }
.progress-fill { height: 100%; border-radius: 20px; transition: width 0.3s ease; }
.progress-fill.good, .summary-percent.good, .progress-label.good { color: #16a34a; }
.progress-fill.good { background: #22c55e; }
.progress-fill.mid, .summary-percent.mid, .progress-label.mid { color: #d97706; }
.progress-fill.mid { background: #f59e0b; }
.progress-fill.low, .summary-percent.low, .progress-label.low { color: #ef4444; }
.progress-fill.low { background: #ef4444; }

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
.font-semibold { font-weight: 600; }
.total-chip { font-size: 0.72rem; font-weight: 700; padding: 2px 10px; border-radius: 20px; background: rgba(99,102,241,0.1); color: #6366f1; }
.brand-chip, .category-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 0.72rem; font-weight: 700; padding: 2px 10px; border-radius: 20px; white-space: nowrap; }
.brand-chip { background: rgba(217,119,6,0.12); color: #b45309; }
.category-chip { background: rgba(13,148,136,0.12); color: #0d9488; }
.table-progress { width: 100px; display: inline-block; margin-right: 8px; vertical-align: middle; }
.progress-label { font-size: 0.76rem; font-weight: 700; vertical-align: middle; }

.action-btns { display: flex; gap: 6px; }
.btn-icon { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--border-main); background: var(--bg-input); color: var(--text-muted); border-radius: 7px; cursor: pointer; transition: all 0.15s; }
.btn-icon:hover { border-color: #6366f1; color: #6366f1; }
.btn-icon-danger:hover { border-color: #ef4444; color: #ef4444; }

/* ===== PAGINATION ===== */
.pagination-card { background: var(--bg-card); border-radius: 10px; padding: 14px 18px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: row-reverse; align-items: center; justify-content: space-between; gap: 12px; }
.pagination-nav { display: flex; align-items: center; gap: 8px; }
.btn-prev-next { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; min-width: 85px; justify-content: center; transition: background 0.18s ease; }
.btn-prev-next:hover:not(:disabled) { background: #4f46e5; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badges { display: flex; gap: 8px; align-items: center; }
.page-badge { padding: 7px 14px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); background: var(--bg-input); white-space: nowrap; letter-spacing: 0.04em; }

/* ===== MODAL ===== */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55); display: flex; align-items: center;
  justify-content: center; z-index: 1000; padding: 16px;
}
.modal-box { background: var(--bg-card); border-radius: 12px; width: 100%; max-width: 480px; max-height: 90vh; overflow: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.25); }
.modal-sm { max-width: 400px; }
.modal-lg { max-width: 640px; }

/* ===== DETAIL MODAL ===== */
.detail-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.detail-sales-name { font-size: 1rem; font-weight: 800; color: var(--text-primary); }
.detail-sub { font-size: 0.8rem; color: var(--text-muted); margin-top: 2px; }
.detail-amounts { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin: 8px 0 16px; }
.detail-section-title { font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 8px; }

.detail-tx-list { display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; }
.detail-tx-item { background: var(--bg-input); border: 1px solid var(--border-main); border-radius: 8px; padding: 10px 12px; }
.detail-tx-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.detail-tx-code { font-weight: 700; color: #6366f1; font-size: 0.82rem; }
.detail-tx-date { font-size: 0.76rem; color: var(--text-muted); white-space: nowrap; }
.detail-tx-customer { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin: 2px 0; display: flex; align-items: center; gap: 6px; }
.detail-tx-product { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin: 4px 0; }
.detail-tx-bottom { display: flex; gap: 14px; flex-wrap: wrap; font-size: 0.78rem; color: var(--text-muted); }
.modal-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border-main); }
.modal-head h5 { margin: 0; font-size: 1rem; font-weight: 800; color: var(--text-primary); }
.modal-close { background: none; border: none; color: var(--text-muted); font-size: 1rem; cursor: pointer; }
.modal-close:hover { color: var(--text-primary); }
.modal-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
.modal-body p { margin: 0; color: var(--text-primary); font-size: 0.9rem; line-height: 1.5; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px; border-top: 1px solid var(--border-main); }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.82rem; font-weight: 700; color: var(--text-primary); }
.req { color: #ef4444; }
.form-input { padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.88rem; outline: none; font-family: inherit; }
.form-input:focus { border-color: #6366f1; }
.form-hint { font-size: 0.74rem; color: var(--text-muted); }
.form-error { font-size: 0.76rem; color: #ef4444; font-weight: 600; }

/* ===== SEARCHABLE DROPDOWN (Sales / Customer Odoo di form modal) ===== */
/* Pola sama persis kayak visitTargetView.vue punya "Pilih Sales/Customer". */
.drop-wrap-full { width: 100%; position: relative; }
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
  font-family: inherit;
}
.drop-search-input:focus { border-color: #6366f1; }
.drop-scroll-list { max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.drop-empty { padding: 10px; text-align: center; font-size: 0.8rem; color: var(--text-muted); font-style: italic; }

/* ===== TIPE TARGET (Total / Customer / Brand / Kategori) ===== */
.type-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.type-tab {
  display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px;
  border: 1px solid var(--border-main); background: var(--bg-input); color: var(--text-primary);
  font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: inherit;
}
.type-tab:hover { border-color: #6366f1; color: #6366f1; }
.type-tab.active { background: #6366f1; border-color: #6366f1; color: #fff; }

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