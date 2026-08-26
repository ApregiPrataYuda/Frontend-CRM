<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from 'vue-toastification'
import AppModal from '@/components/AppModal.vue'
import { useQuotationManagerStore } from '@/stores/quotationManagerStore'

const toast = useToast()
const store = useQuotationManagerStore()

const {
  searchQuery,
  quotationData, loadingQuotation, pagination,
  summaryData, loadingSummary,
  quotationDetail, loadingDetail,
} = storeToRefs(store)

onMounted(() => {
  store.fetchQuotations(store.buildUrl())
  store.fetchSummary()
})

// ════════════════════════════════════════════
// DETAIL (read-only -- Manager/Admin cuma monitoring, tidak ada
// edit/hapus/push di sini)
// ════════════════════════════════════════════
const showDetailModal = ref(false)
async function openDetail(id) {
  showDetailModal.value = true
  await store.fetchDetail(id)
}
function closeDetail() {
  showDetailModal.value = false
  store.quotationDetail = null
}

// ════════════════════════════════════════════
// DOWNLOAD PDF (bukan aksi ubah data, jadi tetap boleh dari sisi Manager)
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
        <h4 class="breadcrumb-title"><font-awesome-icon icon="file-signature" /> Monitoring Quotations</h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item"><font-awesome-icon icon="house" /> Dashboard</span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Quotations</span>
        </div>
      </div>
      <span class="readonly-note"><font-awesome-icon icon="lock" /> Read-only — hanya lihat & download PDF</span>
    </div>

    <!-- SUMMARY -->
    <div class="summary-grid mb-2">
      <div class="summary-card">
        <p class="summary-label">Total Quotation (Semua Sales)</p>
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
            <input v-model="searchQuery" @input="store.searchWithDelay(searchQuery)" type="text" placeholder="Cari no. quotation / customer / nama sales..." class="search-input" />
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
            <th>No. Quotation</th><th>Sales</th><th>Customer</th><th>Tanggal</th>
            <th>Net Amount</th><th>Status Odoo</th><th style="width:100px; text-align:center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loadingQuotation"><td colspan="8" class="td-center"><div class="spinner-custom" style="margin:0 auto"></div></td></tr>
          <tr v-else-if="quotationData.length === 0"><td colspan="8" class="td-center">Tidak ada data quotation</td></tr>
          <tr v-else v-for="(item, index) in quotationData" :key="item.id" class="data-row">
            <td class="td-no">{{ index + 1 + pagination.per_page * (pagination.current_page - 1) }}.</td>
            <td class="td-name">{{ item.quotation_no }}</td>
            <td class="td-muted">{{ item.sales_name ?? '-' }}</td>
            <td class="td-muted">{{ item.customer_company_name }}</td>
            <td class="td-muted">{{ store.formatDate(item.quotation_date) }}</td>
            <td class="amount">{{ store.formatCurrency(item.net_amount) }}</td>
            <td>
              <span class="odoo-badge" :class="odooBadge(item).cls" :title="item.odoo_push_error || ''">
                <font-awesome-icon :icon="odooBadge(item).icon" /> {{ odooBadge(item).text }}
              </span>
            </td>
            <td class="td-actions">
              <button class="act-btn act-info" title="Detail" @click="openDetail(item.id)"><font-awesome-icon icon="eye" /></button>
              <button class="act-btn act-pdf" title="Download PDF" @click="downloadPdf(item)"><font-awesome-icon icon="file-pdf" /></button>
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

    <!-- ══════════════ MODAL: DETAIL (read-only) ══════════════ -->
    <AppModal :show="showDetailModal" title="Detail Quotation" icon="circle-info" size="lg" @close="closeDetail">
      <div v-if="loadingDetail" class="td-center"><div class="spinner-wrap"><div class="spinner"></div><span>Loading...</span></div></div>
      <div v-else-if="quotationDetail" class="detail-list">
        <div class="detail-row"><span class="detail-label">No. Quotation</span><span class="detail-value">{{ quotationDetail.quotation_no }}</span></div>
        <div class="detail-row"><span class="detail-label">Sales</span><span class="detail-value">{{ quotationDetail.sales_name ?? '-' }}</span></div>
        <div class="detail-row"><span class="detail-label">Customer</span><span class="detail-value">{{ quotationDetail.customer_company_name }}</span></div>
        <div class="detail-row"><span class="detail-label">Alamat</span><span class="detail-value">{{ quotationDetail.customer_address || '-' }}</span></div>
        <div class="detail-row"><span class="detail-label">PIC</span><span class="detail-value">{{ quotationDetail.customer_pic_name || '-' }}</span></div>
        <div class="detail-row"><span class="detail-label">Tanggal</span><span class="detail-value">{{ store.formatDate(quotationDetail.quotation_date) }}</span></div>
        <div class="detail-row"><span class="detail-label">Customer Ref</span><span class="detail-value">{{ quotationDetail.customer_ref }}</span></div>
        <div class="detail-row"><span class="detail-label">Payment Terms</span><span class="detail-value">{{ quotationDetail.payment_terms }}</span></div>
        <div class="detail-row"><span class="detail-label">Validity</span><span class="detail-value">{{ quotationDetail.validity }}</span></div>
        <div class="detail-row"><span class="detail-label">Delivery Time</span><span class="detail-value">{{ quotationDetail.delivery_time }}</span></div>

        <div class="items-table-wrap" style="margin-top:6px">
          <table class="items-view-table">
            <thead>
              <tr><th>Deskripsi</th><th>Qty</th><th>Satuan</th><th>Harga Satuan</th><th>Total</th></tr>
            </thead>
            <tbody>
              <tr v-for="it in quotationDetail.items" :key="it.id">
                <td>{{ it.description }}</td>
                <td>{{ it.quantity }}</td>
                <td>{{ it.unit }}</td>
                <td>{{ store.formatCurrency(it.unit_price) }}</td>
                <td>{{ store.formatCurrency(it.total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="totals-box" style="margin-top:10px">
          <div class="totals-row"><span class="t-label">Sub Total</span><span class="t-value">{{ store.formatCurrency(quotationDetail.sub_total) }}</span></div>
          <div class="totals-row"><span class="t-label">PPN</span><span class="t-value">{{ store.formatCurrency(quotationDetail.ppn) }}</span></div>
          <div class="totals-row net-row"><span class="t-label">Net Amount</span><span class="t-value">{{ store.formatCurrency(quotationDetail.net_amount) }}</span></div>
        </div>

        <div class="detail-row" style="margin-top:6px">
          <span class="detail-label">Status Odoo</span>
          <span class="odoo-badge" :class="odooBadge(quotationDetail).cls">
            <font-awesome-icon :icon="odooBadge(quotationDetail).icon" /> {{ odooBadge(quotationDetail).text }}
          </span>
        </div>
        <div v-if="quotationDetail.odoo_push_status === 'failed'" class="detail-row" style="flex-direction:column; align-items:flex-start; gap:6px">
          <span class="detail-label">Pesan Error Odoo</span>
          <div style="font-size:0.82rem; color:#991b1b">{{ quotationDetail.odoo_push_error }}</div>
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeDetail">Close</button>
        <button v-if="quotationDetail" class="btn-save" @click="downloadPdf(quotationDetail)">
          <font-awesome-icon icon="file-pdf" /> Download PDF
        </button>
      </template>
    </AppModal>

  </div>
</template>

<style scoped>
.h-100 { --text-muted: #64748b; }

.breadcrumb-card { background: var(--bg-card); border-radius: 10px; padding: 16px 18px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }
.readonly-note { display: inline-flex; align-items: center; gap: 7px; padding: 7px 14px; border-radius: 8px; background: var(--bg-input); border: 1px solid var(--border-main); color: var(--text-muted); font-size: 0.8rem; font-weight: 600; }

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
.act-info { color: #6366f1; border-color: #6366f1; }
.act-info:hover { background: #6366f1; color: #fff; }
.act-pdf { color: #0d9488; border-color: #0d9488; }
.act-pdf:hover { background: #0d9488; color: #fff; }

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

.detail-list { display: flex; flex-direction: column; }
.detail-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-main); gap: 12px; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.detail-value { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); text-align: right; }

.items-table-wrap { border: 1px solid var(--border-main); border-radius: 8px; overflow: auto; }
.items-view-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; min-width: 520px; }
.items-view-table thead tr { background: var(--bg-input); }
.items-view-table th { padding: 8px 10px; text-align: left; font-size: 0.68rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.05em; text-transform: uppercase; }
.items-view-table td { padding: 8px 10px; border-top: 1px solid var(--border-main); }

.totals-box { align-self: flex-end; width: 100%; max-width: 320px; display: flex; flex-direction: column; gap: 4px; background: var(--bg-input); border: 1px solid var(--border-main); border-radius: 8px; padding: 12px 14px; }
.totals-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 4px 0; }
.totals-row .t-label { font-size: 0.78rem; color: var(--text-muted); font-weight: 600; }
.totals-row .t-value { font-size: 0.88rem; font-weight: 700; color: var(--text-primary); }
.net-row { border-top: 1.5px solid var(--border-main); margin-top: 4px; padding-top: 8px; }
.net-row .t-value { font-size: 1rem; font-weight: 800; color: #6366f1; }

.btn-cancel { padding: 8px 18px; background: #ef4444; color: #fff; border: 1px solid #dc2626; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-cancel:hover { background: #dc2626; }
.btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-save:hover { background: #4f46e5; }
</style>