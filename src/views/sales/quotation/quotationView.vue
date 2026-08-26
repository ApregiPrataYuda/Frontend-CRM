<script setup>
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from 'vue-toastification'
import AppModal from '@/components/AppModal.vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { useMyQuotationStore } from '@/stores/myQuotationStore'

const toast = useToast()
const store = useMyQuotationStore()

const {
  searchQuery,
  quotationData, loadingQuotation, pagination,
  summaryData, loadingSummary,
  customerOptions, loadingCustomerOptions,
  productOptions, loadingProductOptions,
  quotationDetail, loadingDetail, loadingSave, loadingAction,
} = storeToRefs(store)

onMounted(() => {
  store.fetchQuotations(store.buildUrl())
  store.fetchSummary()
})

// ════════════════════════════════════════════
// FORM: BUAT / EDIT QUOTATION (satu modal dipakai buat dua-duanya --
// quotation boleh diedit bebas, tidak ada approval workflow)
// ════════════════════════════════════════════
const showFormModal = ref(false)
const isEditing  = ref(false)
const editingId  = ref(null)

function emptyForm() {
  return {
    customer_id: null,
    customer_company_name: '',
    customer_address: '',
    customer_pic_name: '',
    quotation_no: '',
    customer_ref: '',
    payment_terms: '',
    quotation_date: new Date().toISOString().slice(0, 10),
    pages: '',
    validity: '',
    delivery_time: '',
    term: '',
    ppn: 0,
    signature: '',
  }
}
const form = ref(emptyForm())

let itemKeyCounter = 0
function newItemRow() {
  itemKeyCounter += 1
  return { key: itemKeyCounter, odoo_product_id: null, description: '', quantity: 1, unit: '', unit_price: 0 }
}
const items = ref([newItemRow()])

function addItemRow() {
  items.value.push(newItemRow())
}
function removeItemRow(key) {
  if (items.value.length <= 1) return
  items.value = items.value.filter((r) => r.key !== key)
}

// ── CUSTOMER: combobox cari & pilih dari master customers CRM (wajib
// pilih dari daftar -- customer_id itu foreign key). Milih salah satu
// hasil auto-fill Nama Perusahaan/Alamat/PIC (field snapshot, tetap
// boleh diedit manual sesudahnya). ──
const customerSearchInput = ref('')
const showCustomerSuggestions = ref(false)
let customerSearchTimeout = null

function onCustomerInput() {
  form.value.customer_id = null
  showCustomerSuggestions.value = true
  clearTimeout(customerSearchTimeout)
  customerSearchTimeout = setTimeout(() => store.fetchCustomerOptions(customerSearchInput.value), 400)
}
function focusCustomerInput() {
  showCustomerSuggestions.value = true
  if (customerOptions.value.length === 0) store.fetchCustomerOptions('')
}
function blurCustomerInput() {
  showCustomerSuggestions.value = false
}
function selectCustomerOption(opt) {
  form.value.customer_id = opt.id
  form.value.customer_company_name = opt.label ?? ''
  form.value.customer_address = opt.address ?? ''
  form.value.customer_pic_name = opt.contact_name ?? ''
  customerSearchInput.value = opt.label ?? ''
  showCustomerSuggestions.value = false
}
function resetCustomerSelection() {
  form.value.customer_id = null
  customerSearchInput.value = ''
  showCustomerSuggestions.value = true
  store.fetchCustomerOptions('')
}

// ── PRODUCT per baris item: combobox cari dari katalog odoo_products,
// ATAU boleh ketik manual (deskripsi bebas) kalau memang belum ada di
// katalog -- konsekuensinya baris itu tidak akan bisa ikut ke-push ke
// Odoo (lihat catatan di QuotationController::pushQuotationToOdoo()). ──
const activeProductRowKey = ref(null)
const showProductSuggestions = ref(false)
let productSearchTimeout = null

function onProductInput(row) {
  row.odoo_product_id = null
  activeProductRowKey.value = row.key
  showProductSuggestions.value = true
  clearTimeout(productSearchTimeout)
  productSearchTimeout = setTimeout(() => store.fetchProductOptions(row.description), 400)
}
function focusProductInput(row) {
  activeProductRowKey.value = row.key
  showProductSuggestions.value = true
  if (productOptions.value.length === 0) store.fetchProductOptions('')
}
function blurProductInput() {
  showProductSuggestions.value = false
}
function selectProductOption(row, opt) {
  row.odoo_product_id = opt.id
  row.description = opt.name ?? ''
  row.unit = opt.unit ?? ''
  row.unit_price = opt.unit_price ?? 0
  showProductSuggestions.value = false
}

// ── TOTALS (live, dihitung ulang otomatis -- backend juga menghitung
// ulang persis dengan cara sama di Quotation::recalculateTotals()) ──
function rowTotal(row) {
  return (Number(row.quantity) || 0) * (Number(row.unit_price) || 0)
}
const subTotal = computed(() => items.value.reduce((sum, r) => sum + rowTotal(r), 0))
const netAmount = computed(() => subTotal.value + (Number(form.value.ppn) || 0))

function openCreateModal() {
  form.value = emptyForm()
  items.value = [newItemRow()]
  customerSearchInput.value = ''
  isEditing.value = false
  editingId.value = null
  showFormModal.value = true
}

async function openEditModal(item) {
  isEditing.value = true
  editingId.value = item.id
  showFormModal.value = true
  await store.fetchDetail(item.id)
  const d = quotationDetail.value
  if (!d) return

  form.value = {
    customer_id: d.customer_id,
    customer_company_name: d.customer_company_name ?? '',
    customer_address: d.customer_address ?? '',
    customer_pic_name: d.customer_pic_name ?? '',
    quotation_no: d.quotation_no ?? '',
    customer_ref: d.customer_ref ?? '',
    payment_terms: d.payment_terms ?? '',
    quotation_date: d.quotation_date ?? new Date().toISOString().slice(0, 10),
    pages: d.pages ?? '',
    validity: d.validity ?? '',
    delivery_time: d.delivery_time ?? '',
    term: d.term ?? '',
    ppn: d.ppn ?? 0,
    signature: d.signature ?? '',
  }
  customerSearchInput.value = d.customer_company_name ?? ''

  items.value = (d.items && d.items.length > 0)
    ? d.items.map((it) => {
        itemKeyCounter += 1
        return {
          key: itemKeyCounter,
          odoo_product_id: it.odoo_product_id,
          description: it.description,
          quantity: it.quantity,
          unit: it.unit,
          unit_price: it.unit_price,
        }
      })
    : [newItemRow()]
}

function closeFormModal() {
  if (loadingSave.value) return
  showFormModal.value = false
  store.quotationDetail = null
}

const isFormValid = computed(() =>
  form.value.customer_id
  && form.value.quotation_no.trim()
  && form.value.customer_ref.trim()
  && form.value.payment_terms.trim()
  && form.value.quotation_date
  && form.value.validity.trim()
  && form.value.delivery_time.trim()
  && items.value.length > 0
  && items.value.every((r) => r.description.trim() && r.unit.trim() && Number(r.quantity) > 0)
)

async function submitForm() {
  if (!isFormValid.value) return

  const payload = {
    customer_id: form.value.customer_id,
    customer_company_name: form.value.customer_company_name,
    customer_address: form.value.customer_address,
    customer_pic_name: form.value.customer_pic_name,
    quotation_no: form.value.quotation_no,
    customer_ref: form.value.customer_ref,
    payment_terms: form.value.payment_terms,
    quotation_date: form.value.quotation_date,
    pages: form.value.pages || null,
    validity: form.value.validity,
    delivery_time: form.value.delivery_time,
    term: form.value.term || null,
    ppn: Number(form.value.ppn) || 0,
    signature: form.value.signature || null,
    items: items.value.map((r) => ({
      odoo_product_id: r.odoo_product_id,
      description: r.description,
      quantity: Number(r.quantity),
      unit: r.unit,
      unit_price: Number(r.unit_price),
    })),
  }

  const result = isEditing.value
    ? await store.updateQuotation(editingId.value, payload)
    : await store.createQuotation(payload)

  if (result.success) {
    toast.success(result.message)
    closeFormModal()
    store.fetchQuotations(store.buildUrl())
    store.fetchSummary()
  } else {
    toast.error(result.message)
  }
}

// ════════════════════════════════════════════
// DELETE
// ════════════════════════════════════════════
async function deleteQuotation(item) {
  if (!window.confirm(`Hapus quotation ${item.quotation_no}? Tindakan ini tidak bisa dibatalkan.`)) return
  const result = await store.deleteQuotation(item.id)
  if (result.success) {
    toast.success(result.message)
    store.fetchQuotations(store.buildUrl())
    store.fetchSummary()
  } else {
    toast.error(result.message)
  }
}

// ════════════════════════════════════════════
// PUSH KE ODOO (manual)
// ════════════════════════════════════════════
async function pushToOdoo(item) {
  const result = await store.pushToOdoo(item.id)
  if (result.success) {
    toast.success(result.message)
  } else {
    toast.error(result.message)
  }
  store.fetchQuotations(store.buildUrl())
  store.fetchSummary()
}

// ════════════════════════════════════════════
// DOWNLOAD PDF
// ════════════════════════════════════════════
async function downloadPdf(item) {
  const result = await store.downloadPdf(item)
  if (!result.success) toast.error(result.message)
}

function odooBadge(item) {
  if (item.odoo_push_status === 'pushed') return { icon: 'circle-check', cls: 'odoo-ok', text: 'Terkirim ke Odoo' }
  if (item.odoo_push_status === 'failed') return { icon: 'circle-exclamation', cls: 'odoo-fail', text: 'Gagal push' }
  return { icon: 'minus', cls: 'odoo-na', text: 'Belum di-push' }
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <!-- BREADCRUMB -->
    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title"><font-awesome-icon icon="file-signature" /> Quotation Saya</h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item"><font-awesome-icon icon="house" /> Dashboard</span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Quotations</span>
        </div>
      </div>
      <button class="btn-toolbar btn-purple" @click="openCreateModal">
        <font-awesome-icon icon="plus" /> Buat Quotation
      </button>
    </div>

    <!-- SUMMARY -->
    <div class="summary-grid mb-2">
      <div class="summary-card">
        <p class="summary-label">Total Quotation</p>
        <p class="summary-value">{{ summaryData.total_quotations }}</p>
      </div>
      <div class="summary-card">
        <p class="summary-label">Total Net Amount</p>
        <p class="summary-value">{{ store.formatCurrency(summaryData.total_net_amount) }}</p>
      </div>
      <div class="summary-card">
        <p class="summary-label">Terkirim ke Odoo</p>
        <p class="summary-value green">{{ summaryData.total_pushed }}</p>
      </div>
      <div class="summary-card" :class="{ danger: summaryData.total_failed_push > 0 }">
        <p class="summary-label">Push ke Odoo Gagal</p>
        <p class="summary-value" :class="summaryData.total_failed_push > 0 ? 'red' : ''">{{ summaryData.total_failed_push }}</p>
      </div>
    </div>

    <!-- CONTROLS -->
    <div class="controls-card mb-2">
      <div class="controls-row">
        <div class="controls-left"></div>
        <div class="controls-right">
          <div class="search-wrap">
            <input v-model="searchQuery" @input="store.searchWithDelay(searchQuery)" type="text" placeholder="Cari no. quotation / customer ref / customer..." class="search-input" />
            <button class="search-btn"><font-awesome-icon icon="magnifying-glass" /></button>
          </div>
        </div>
      </div>
    </div>

    <!-- TABLE -->
    <div class="table-card flex-grow-1 overflow-auto mb-3">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:50px">NO.</th>
            <th>No. Quotation</th><th>Customer</th><th>Tanggal</th><th>Net Amount</th>
            <th>Status Odoo</th><th style="width:160px; text-align:center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loadingQuotation"><td colspan="7" class="td-center"><div class="spinner-custom" style="margin:0 auto"></div></td></tr>
          <tr v-else-if="quotationData.length === 0"><td colspan="7" class="td-center">Belum ada data quotation</td></tr>
          <tr v-else v-for="(item, index) in quotationData" :key="item.id" class="data-row">
            <td class="td-no">{{ index + 1 + pagination.per_page * (pagination.current_page - 1) }}.</td>
            <td class="td-name">{{ item.quotation_no }}</td>
            <td class="td-muted">{{ item.customer_company_name }}</td>
            <td class="td-muted">{{ store.formatDate(item.quotation_date) }}</td>
            <td class="amount">{{ store.formatCurrency(item.net_amount) }}</td>
            <td>
              <span class="odoo-badge" :class="odooBadge(item).cls" :title="item.odoo_push_error || ''">
                <font-awesome-icon :icon="odooBadge(item).icon" /> {{ odooBadge(item).text }}
              </span>
            </td>
            <td class="td-actions">
              <button class="act-btn act-edit" title="Edit" @click="openEditModal(item)"><font-awesome-icon icon="pen" /></button>
              <button class="act-btn act-pdf" title="Download PDF" @click="downloadPdf(item)"><font-awesome-icon icon="file-pdf" /></button>
              <button class="act-btn act-push" title="Push ke Odoo" :disabled="loadingAction" @click="pushToOdoo(item)"><font-awesome-icon icon="rotate-right" /></button>
              <button class="act-btn act-delete" title="Hapus" :disabled="loadingAction" @click="deleteQuotation(item)"><font-awesome-icon icon="trash" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PAGINATION -->
    <div class="pagination-card">
      <div class="pagination-nav">
        <button class="btn-prev-next" :disabled="!pagination.prev_page_url" @click="store.fetchQuotations(pagination.prev_page_url)"><font-awesome-icon icon="circle-left" /> Prev</button>
        <button class="btn-prev-next" :disabled="!pagination.next_page_url" @click="store.fetchQuotations(pagination.next_page_url)">Next <font-awesome-icon icon="circle-right" /></button>
      </div>
      <div class="page-badges">
        <span class="page-badge">Page {{ pagination.current_page }} / {{ pagination.last_page }}</span>
        <span class="page-badge">TOTAL: {{ pagination.total }}</span>
      </div>
    </div>

    <!-- ══════════════ MODAL: BUAT / EDIT QUOTATION ══════════════ -->
    <AppModal :show="showFormModal" :title="isEditing ? 'Edit Quotation' : 'Buat Quotation'" icon="file-signature" size="xl" @close="closeFormModal">
      <div v-if="isEditing && loadingDetail" class="td-center"><div class="spinner-wrap"><div class="spinner"></div><span>Loading...</span></div></div>
      <div v-else class="form-container-gap">

        <div class="form-group">
          <label>Customer <span style="color:#ef4444">*</span></label>
          <div class="drop-wrap" style="width:100%">
            <div class="kunjungan-input-wrap">
              <font-awesome-icon icon="magnifying-glass" class="kunjungan-input-icon" />
              <input
                v-model="customerSearchInput"
                @input="onCustomerInput"
                @focus="focusCustomerInput"
                @blur="blurCustomerInput"
                type="text"
                placeholder="Cari nama customer terdaftar..."
                class="form-input kunjungan-input"
              />
              <font-awesome-icon v-if="form.customer_id" icon="circle-check" class="kunjungan-linked-icon" title="Klik untuk ganti customer" style="cursor:pointer" @mousedown.prevent="resetCustomerSelection" />
            </div>
            <div class="drop-menu" :class="{ show: showCustomerSuggestions }" style="width:100%; max-height:220px; overflow:auto">
              <div v-if="loadingCustomerOptions" class="td-muted" style="padding:8px">Mencari...</div>
              <div v-else-if="customerOptions.length === 0" class="td-muted" style="padding:8px">Customer tidak ditemukan.</div>
              <button v-else v-for="opt in customerOptions" :key="opt.id" type="button" class="drop-item" @mousedown.prevent="selectCustomerOption(opt)">{{ opt.label }}</button>
            </div>
          </div>
          <p v-if="!form.customer_id" class="kunjungan-hint">
            <font-awesome-icon icon="circle-info" /> Quotation hanya bisa dibuat untuk customer yang sudah terdaftar di master data.
          </p>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>Nama Perusahaan</label>
            <input v-model="form.customer_company_name" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>PIC / Attn</label>
            <input v-model="form.customer_pic_name" type="text" class="form-input" />
          </div>
        </div>
        <div class="form-group">
          <label>Alamat</label>
          <textarea v-model="form.customer_address" rows="2" class="form-input form-textarea"></textarea>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>No. Quotation <span style="color:#ef4444">*</span></label>
            <input v-model="form.quotation_no" type="text" placeholder="Contoh: 22005/UN/CAP" class="form-input" />
          </div>
          <div class="form-group">
            <label>Customer Ref <span style="color:#ef4444">*</span></label>
            <input v-model="form.customer_ref" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>Payment Terms <span style="color:#ef4444">*</span></label>
            <input v-model="form.payment_terms" type="text" placeholder="Contoh: 30 Hari setelah invoice" class="form-input" />
          </div>
          <div class="form-group">
            <label>Tanggal Quotation <span style="color:#ef4444">*</span></label>
            <input v-model="form.quotation_date" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label>Halaman</label>
            <input v-model="form.pages" type="text" placeholder="Jumlah Halaman (contoh: 1 page)" class="form-input" />
          </div>
          <div class="form-group">
            <label>Validity <span style="color:#ef4444">*</span></label>
            <input v-model="form.validity" type="text" placeholder="Contoh: 30 DAYS AFTER DATE OF ISSUE" class="form-input" />
          </div>
          <div class="form-group">
            <label>Delivery Time <span style="color:#ef4444">*</span></label>
            <input v-model="form.delivery_time" type="text" placeholder="Contoh: 16 WORKING WEEKS FOT CILEGON" class="form-input" />
          </div>
          <div class="form-group">
            <label>Signature</label>
            <input v-model="form.signature" type="text" placeholder="Nama Sales" class="form-input" />
          </div>
        </div>

        <!-- ═══ TERM: sekarang pakai RichTextEditor, sama kayak di form checkout ═══ -->
        <div class="form-group">
          <label>Term</label>
          <RichTextEditor v-model="form.term" placeholder="Contoh : 
Innomag Model TBMAG
PUMP TYPE/SIZE: C3-267-11100-CU0
SN. : 40602
TAG#: PX300B
" />
        </div>

        <!-- ═══ RINCIAN ITEM: dirombak jadi list card per item, bukan tabel sempit --
             biar search product-nya lega dan dropdown hasil pencariannya kelihatan
             penuh (dulu ke-crop sama overflow tabel). ═══ -->
        <div class="form-group">
          <label>Rincian Item <span style="color:#ef4444">*</span></label>

          <div class="items-list">
            <div v-for="(row, idx) in items" :key="row.key" class="item-card">
              <div class="item-card-head">
                <span class="item-index">Item #{{ idx + 1 }}</span>
                <button
                  type="button"
                  class="btn-remove-row"
                  :disabled="items.length <= 1"
                  title="Hapus Baris"
                  @click="removeItemRow(row.key)"
                >
                  <font-awesome-icon icon="trash" /> Hapus
                </button>
              </div>

              <div class="form-group">
                <label>Product / Deskripsi</label>
                <div class="product-cell">
                  <div class="kunjungan-input-wrap">
                    <font-awesome-icon icon="magnifying-glass" class="kunjungan-input-icon" />
                    <textarea
                      v-model="row.description"
                      @input="onProductInput(row)"
                      @focus="focusProductInput(row)"
                      @blur="blurProductInput"
                      rows="1"
                      placeholder="Cari product dari katalog, atau ketik manual..."
                      class="form-input kunjungan-input cell-input"
                    ></textarea>
                    <font-awesome-icon v-if="row.odoo_product_id" icon="circle-check" class="kunjungan-linked-icon" title="Terhubung ke katalog Odoo" />
                  </div>
                  <div v-if="activeProductRowKey === row.key" class="drop-menu product-drop-menu" :class="{ show: showProductSuggestions }">
                    <div v-if="loadingProductOptions" class="td-muted" style="padding:10px">Mencari...</div>
                    <div v-else-if="productOptions.length === 0" class="td-muted" style="padding:10px">Product tidak ditemukan — boleh lanjut isi manual.</div>
                    <button
                      v-else v-for="opt in productOptions" :key="opt.id" type="button"
                      class="drop-item product-drop-item"
                      @mousedown.prevent="selectProductOption(row, opt)"
                    >
                      <span class="product-drop-name">{{ opt.label ?? opt.name }}</span>
                      <span class="product-drop-meta">
                        <span v-if="opt.unit">{{ opt.unit }}</span>
                        <span v-if="opt.unit_price">&middot; {{ store.formatCurrency(opt.unit_price) }}</span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div class="item-card-grid">
                <div class="form-group">
                  <label>Qty</label>
                  <input v-model="row.quantity" type="number" min="0" step="any" class="form-input" />
                </div>
                <div class="form-group">
                  <label>Satuan</label>
                  <input v-model="row.unit" type="text" placeholder="SET/PCS/UNIT" class="form-input" />
                </div>
                <div class="form-group">
                  <label>Harga Satuan</label>
                  <input v-model="row.unit_price" type="number" min="0" step="any" class="form-input" />
                </div>
                <div class="form-group">
                  <label>Total</label>
                  <div class="item-row-total">{{ store.formatCurrency(rowTotal(row)) }}</div>
                </div>
              </div>
            </div>
          </div>

          <button type="button" class="btn-add-row" @click="addItemRow"><font-awesome-icon icon="plus" /> Tambah Baris</button>
        </div>

        <div class="totals-box">
          <div class="totals-row">
            <span class="t-label">Sub Total</span>
            <span class="t-value">{{ store.formatCurrency(subTotal) }}</span>
          </div>
          <div class="totals-row">
            <span class="t-label">PPN</span>
            <input v-model="form.ppn" type="number" min="0" step="any" class="form-input totals-ppn-input" />
          </div>
          <div class="totals-row net-row">
            <span class="t-label">Net Amount</span>
            <span class="t-value">{{ store.formatCurrency(netAmount) }}</span>
          </div>
        </div>

      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeFormModal" :disabled="loadingSave">Batal</button>
        <button class="btn-save" @click="submitForm" :disabled="!isFormValid || loadingSave">
          <font-awesome-icon v-if="loadingSave" icon="spinner" spin />
          <font-awesome-icon v-else icon="floppy-disk" />
          {{ loadingSave ? 'Menyimpan...' : (isEditing ? 'Perbarui Quotation' : 'Simpan Quotation') }}
        </button>
      </template>
    </AppModal>

  </div>
</template>

<style scoped>
.h-100 { --text-muted: #64748b; }
.form-container-gap { display: flex; flex-direction: column; gap: 14px; }

.breadcrumb-card { background: var(--bg-card); border-radius: 10px; padding: 16px 18px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

.btn-toolbar { display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; }
.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover { background: #4f46e5; }

.summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
.summary-card { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; padding: 14px 16px; box-shadow: 0 1px 3px var(--shadow-color); }
.summary-card.danger { border-color: #fca5a5; background: #fef2f2; }
.summary-label { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted); margin: 0 0 6px; }
.summary-value { font-size: 1.3rem; font-weight: 800; margin: 0; }
.summary-value.green { color: #16a34a; }
.summary-value.red { color: #ef4444; }

.controls-card { background: var(--bg-card); border-radius: 10px; padding: 14px 16px; box-shadow: 0 1px 3px var(--shadow-color); }
.controls-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.controls-left, .controls-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.search-wrap { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.search-input { padding: 7px 12px; border: none; background: transparent; color: var(--text-primary); font-size: 0.84rem; outline: none; width: 260px; }
.search-btn { padding: 7px 12px; background: #6366f1; color: #fff; border: none; cursor: pointer; }

.drop-wrap { position: relative; }
.drop-menu { position: absolute; top: calc(100% + 6px); left: 0; min-width: 200px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 10px; z-index: 200; opacity: 0; transform: translateY(-6px); pointer-events: none; transition: all 0.18s ease; }
.drop-menu.show { opacity: 1; transform: translateY(0); pointer-events: all; }
.drop-item { width: 100%; display: block; padding: 8px 10px; background: none; border: none; border-radius: 7px; color: var(--text-primary); font-size: 0.84rem; cursor: pointer; text-align: left; }
.drop-item:hover { background: var(--bg-nav-hover); }

.table-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.data-table thead tr { background: var(--bg-input); border-bottom: 2px solid var(--border-main); position: sticky; top: 0; z-index: 2; }
.data-table th { padding: 12px 18px; text-align: left; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap; }
.data-table tbody tr { border-bottom: 1px solid var(--border-main); }
.data-table td { padding: 13px 18px; vertical-align: middle; color: var(--text-primary); }
.data-row:hover { background: var(--bg-nav-hover); }
.td-no { color: var(--text-muted); font-weight: 600; }
.td-name { font-weight: 700; }
.td-muted { color: var(--text-muted); font-size: 0.84rem; }
.td-center { text-align: center; padding: 40px; color: var(--text-muted); }
.td-actions { text-align: center; white-space: nowrap; }
.amount { font-weight: 700; }

.act-btn { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; margin: 0 2px; background: transparent; }
.act-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.act-edit { color: #6366f1; border-color: #6366f1; }
.act-edit:hover { background: #6366f1; color: #fff; }
.act-pdf { color: #0d9488; border-color: #0d9488; }
.act-pdf:hover { background: #0d9488; color: #fff; }
.act-push { color: #b45309; border-color: #b45309; }
.act-push:hover:not(:disabled) { background: #b45309; color: #fff; }
.act-delete { color: #ef4444; border-color: #ef4444; }
.act-delete:hover:not(:disabled) { background: #ef4444; color: #fff; }

.odoo-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 0.76rem; font-weight: 700; }
.odoo-ok { color: #16a34a; }
.odoo-fail { color: #ef4444; cursor: help; }
.odoo-na { color: var(--text-muted); font-weight: 500; }

.pagination-card { background: var(--bg-card); border-radius: 10px; padding: 14px 18px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: row-reverse; align-items: center; justify-content: space-between; gap: 12px; }
.pagination-nav { display: flex; align-items: center; gap: 8px; }
.btn-prev-next { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; min-width: 85px; justify-content: center; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badges { display: flex; gap: 8px; align-items: center; }
.page-badge { padding: 7px 14px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); background: var(--bg-input); white-space: nowrap; }

.spinner-custom { width: 2rem; height: 2rem; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.spinner-wrap { display:flex; flex-direction:column; align-items:center; gap:10px; color:var(--text-muted); }
.spinner { width:24px; height:24px; border:3px solid #e2e8f0; border-top-color:#6366f1; border-radius:50%; animation:spin 0.7s linear infinite; }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.form-input { padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.875rem; background: var(--bg-input); color: var(--text-primary); outline: none; width: 100%; }
.form-textarea { resize: none; }
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px 14px; }

.kunjungan-input-wrap { position: relative; display: flex; align-items: center; width: 100%; }
.kunjungan-input-icon { position: absolute; left: 12px; font-size: 0.8rem; color: var(--text-muted); pointer-events: none; }
.kunjungan-input { padding-left: 32px; padding-right: 32px; }
.kunjungan-linked-icon { position: absolute; right: 12px; font-size: 0.9rem; color: #16a34a; }
.kunjungan-hint { display: flex; align-items: center; gap: 6px; margin: 0; font-size: 0.74rem; color: #b45309; }

/* ═══════════════════════════════════════════════════════
   RINCIAN ITEM -- list card per item (ganti tabel sempit lama).
   Setiap item jadi card sendiri dengan search product full-width,
   supaya dropdown hasil pencarian gak ke-crop kayak sebelumnya.
   ═══════════════════════════════════════════════════════ */
.items-list { display: flex; flex-direction: column; gap: 12px; }

.item-card {
  border: 1px solid var(--border-main);
  border-radius: 10px;
  background: var(--bg-input);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-card-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.item-index { font-size: 0.72rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #6366f1; }

.product-cell { position: relative; }
textarea.kunjungan-input.cell-input { resize: none; min-height: 40px; padding-top: 9px; }

.product-drop-menu { top: calc(100% + 6px); width: 100%; max-height: 280px; overflow: auto; z-index: 250; }
.product-drop-item { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 9px 10px; }
.product-drop-name { font-weight: 600; }
.product-drop-meta { font-size: 0.74rem; color: var(--text-muted); display: flex; gap: 4px; }

.item-card-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px 12px;
}
.item-row-total {
  padding: 9px 12px;
  border: 1px solid var(--border-main);
  border-radius: 8px;
  background: var(--bg-card);
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary);
}

@media (max-width: 720px) {
  .item-card-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 420px) {
  .item-card-grid { grid-template-columns: 1fr; }
}

.btn-remove-row { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 28px; padding: 0 10px; border-radius: 6px; border: 1.5px solid #ef4444; color: #ef4444; background: transparent; cursor: pointer; font-size: 0.75rem; font-weight: 600; }
.btn-remove-row:hover:not(:disabled) { background: #ef4444; color: #fff; }
.btn-remove-row:disabled { opacity: 0.35; cursor: not-allowed; }
.btn-add-row { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; margin-top: 8px; padding: 7px 14px; border: 1.5px dashed #6366f1; border-radius: 8px; background: transparent; color: #6366f1; font-size: 0.8rem; font-weight: 700; cursor: pointer; }
.btn-add-row:hover { background: #eef2ff; }

.totals-box { align-self: flex-end; width: 100%; max-width: 320px; display: flex; flex-direction: column; gap: 4px; background: var(--bg-input); border: 1px solid var(--border-main); border-radius: 8px; padding: 12px 14px; }
.totals-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 4px 0; }
.totals-row .t-label { font-size: 0.78rem; color: var(--text-muted); font-weight: 600; }
.totals-row .t-value { font-size: 0.88rem; font-weight: 700; color: var(--text-primary); }
.totals-ppn-input { width: 130px; text-align: right; padding: 5px 8px; font-size: 0.82rem; }
.net-row { border-top: 1.5px solid var(--border-main); margin-top: 4px; padding-top: 8px; }
.net-row .t-value { font-size: 1rem; font-weight: 800; color: #6366f1; }

.btn-cancel { padding: 8px 18px; background: #ef4444; color: #fff; border: 1px solid #dc2626; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-cancel:hover:not(:disabled) { background: #dc2626; }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-save:hover:not(:disabled) { background: #4f46e5; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
</style>