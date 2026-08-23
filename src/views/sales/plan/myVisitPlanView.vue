<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useVisitPlanStore } from '@/stores/visitPlanStore'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from 'vue-toastification'
import AppModal from '@/components/AppModal.vue'

const store   = useVisitPlanStore()
const { confirm } = useConfirm()
const toast   = useToast()

const {
  currentMonth, plans, followUps, stats, loading, error,
  savingPlan, updatingPlan, deletingPlan, errorVisitPlan,
  itemsByDate, totalItemsThisMonth,
  myCustomers, loadingMyCustomers,
} = storeToRefs(store)

onMounted(async () => {
  try {
    // daftar customer milik sales ini nggak gantung ke bulan aktif, jadi
    // cukup diambil sekali aja bareng fetch pertama.
    await Promise.all([store.fetchPlans(), store.fetchMyCustomers()])
  } catch (err) {
    toast.error('Gagal memuat planning kunjungan.')
  }
})

// ══════════════════════════════════════════════════════════
// KALENDER (custom Vue, tanpa library eksternal) -- Senin-first
// ══════════════════════════════════════════════════════════
const weekdayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const monthNamesFull = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const todayStr = computed(() => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
})

const monthLabel = computed(() => {
  const [y, m] = currentMonth.value.split('-')
  return `${monthNamesFull[Number(m) - 1]} ${y}`
})

// filler hari-hari bulan sebelum/sesudah SENGAJA dibikin non-interaktif
// (dateStr: null) -- biar Sales nggak bisa nambah rencana "nyasar" ke
// tanggal yang keliatan tapi sebenarnya beda bulan.
const calendarCells = computed(() => {
  const [yearStr, monthStr] = currentMonth.value.split('-')
  const year  = Number(yearStr)
  const month = Number(monthStr) // 1-12

  const firstOfMonth  = new Date(year, month - 1, 1)
  const daysInMonth   = new Date(year, month, 0).getDate()
  const prevMonthDays = new Date(year, month - 1, 0).getDate()

  // getDay(): 0=Minggu..6=Sabtu -> digeser jadi 0=Senin..6=Minggu
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7

  const cells = []

  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, dateStr: null, inMonth: false, isToday: false })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, dateStr, inMonth: true, isToday: dateStr === todayStr.value })
  }

  const remainder = cells.length % 7
  if (remainder !== 0) {
    const fillCount = 7 - remainder
    for (let d = 1; d <= fillCount; d++) {
      cells.push({ day: d, dateStr: null, inMonth: false, isToday: false })
    }
  }

  return cells
})

function shiftMonth(delta) {
  const [y, m] = currentMonth.value.split('-').map(Number)
  const dateObj = new Date(y, (m - 1) + delta, 1)
  const newY = dateObj.getFullYear()
  const newM = String(dateObj.getMonth() + 1).padStart(2, '0')
  store.changeMonth(`${newY}-${newM}`)
}
function prevMonth() { shiftMonth(-1) }
function nextMonth() { shiftMonth(1) }
function goToday() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  store.changeMonth(`${y}-${m}`)
}
function onMonthInputChange(val) {
  store.changeMonth(val)
}

function chipClass(item) {
  if (item.type === 'follow_up') return 'chip-followup'
  return 'chip-plan-' + (item.status || 'planned')
}

function statusLabel(item) {
  const s = (item.status || '').toUpperCase()
  const map = {
    PLANNED: 'Planned', DONE: 'Done', CANCELLED: 'Cancelled',
    PENDING: 'Pending', CLOSED: 'Closed',
  }
  return map[s] || item.status
}
function statusClass(item) {
  const s = (item.status || '').toLowerCase()
  if (s === 'done') return 'status-done'
  if (s === 'cancelled' || s === 'closed') return 'status-cancelled'
  return 'status-planned'
}

function formatTime(ts) {
  if (!ts) return '-'
  return String(ts).slice(11, 16)
}

// ══════════════════════════════════════════════════════════
// MODAL DETAIL HARI -- list item + form tambah/edit rencana
// ══════════════════════════════════════════════════════════
const showDayModal   = ref(false)
const selectedDate   = ref(null)
const editingPlanId  = ref(null)
const formData       = ref({ title: '', notes: '', status: 'planned' })
const selectedCustomer   = ref(null)

// ── DROPDOWN CUSTOMER (cuma nampilin customer milik sales ini sendiri,
// diambil sekali lewat myCustomers terus difilter client-side di sini) ──
const showCustomerDropdown  = ref(false)
const customerDropdownSearch = ref('')
const filteredMyCustomers = computed(() => {
  const q = customerDropdownSearch.value.trim().toLowerCase()
  if (!q) return myCustomers.value
  return myCustomers.value.filter(c => (c.company_name || '').toLowerCase().includes(q))
})

const dayModalTitle = computed(() => {
  if (!selectedDate.value) return ''
  const [y, m, d] = selectedDate.value.split('-').map(Number)
  const dateObj = new Date(y, m - 1, d)
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  return `${dayNames[dateObj.getDay()]}, ${d} ${monthNamesFull[m - 1]} ${y}`
})

const dayItems = computed(() => {
  if (!selectedDate.value) return []
  return itemsByDate.value[selectedDate.value] || []
})

function resetForm() {
  formData.value = { title: '', notes: '', status: 'planned' }
  selectedCustomer.value = null
  showCustomerDropdown.value = false
  customerDropdownSearch.value = ''
  editingPlanId.value = null
  errorVisitPlan.value = null
}

function openDayModal(cell) {
  selectedDate.value = cell.dateStr
  resetForm()
  showDayModal.value = true
}
function closeDayModal() {
  showDayModal.value = false
  selectedDate.value = null
  resetForm()
}

function pickCustomer(c) {
  selectedCustomer.value = c
  showCustomerDropdown.value = false
  customerDropdownSearch.value = ''
}
function clearCustomer() {
  selectedCustomer.value = null
}

function startEditPlan(item) {
  editingPlanId.value = item.id
  formData.value = {
    title: item.title,
    notes: item.notes || '',
    status: item.status || 'planned',
  }
  if (item.customer_id) {
    selectedCustomer.value = {
      id: item.customer_id,
      company_name: item.title,
      customer_code: item.customer_code,
    }
  } else {
    selectedCustomer.value = null
  }
  showCustomerDropdown.value = false
  customerDropdownSearch.value = ''
}
function cancelEditPlan() {
  resetForm()
}

function getError(field) {
  if (!errorVisitPlan.value || typeof errorVisitPlan.value !== 'object') return null
  return errorVisitPlan.value[field]?.[0] ?? null
}

async function submitPlanForm() {
  const payload = {
    customer_id: selectedCustomer.value ? selectedCustomer.value.id : null,
    title: selectedCustomer.value ? null : (formData.value.title || null),
    plan_date: selectedDate.value,
    notes: formData.value.notes || null,
  }
  if (editingPlanId.value) {
    payload.status = formData.value.status
  }

  try {
    if (editingPlanId.value) {
      await store.updatePlan(editingPlanId.value, payload)
      toast.success('Rencana kunjungan berhasil diperbarui!')
    } else {
      await store.createPlan(payload)
      toast.success('Rencana kunjungan berhasil ditambahkan!')
    }
    resetForm()
  } catch (err) {
    if (err.response?.status !== 422) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan rencana kunjungan, coba lagi.')
    }
  }
}

async function confirmDeletePlan(item) {
  const isConfirmed = await confirm({
    type: 'danger',
    title: 'Hapus Rencana Kunjungan',
    message: `Yakin ingin menghapus rencana "${item.title}"?`,
    detail: 'Tindakan ini tidak bisa dibatalkan.',
    confirmText: 'Yes, Delete',
    cancelText: 'Cancel',
  })
  if (!isConfirmed) return

  try {
    await store.deletePlan(item.id)
    toast.success('Rencana kunjungan berhasil dihapus!')
    if (editingPlanId.value === item.id) resetForm()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal menghapus, coba lagi.')
  }
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="calendar-days" />
          Planning Kunjungan Sales
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" />
            Dashboard
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Planning Kunjungan</span>
        </div>
      </div>
    </div>

    <div class="toolbar-top">
      <div class="month-nav">
        <button type="button" class="month-nav-btn" @click="prevMonth">
          <font-awesome-icon icon="chevron-left" />
        </button>
        <div class="month-picker-wrap">
          <font-awesome-icon icon="calendar-days" class="month-picker-icon" />
          <input
            type="month"
            :value="currentMonth"
            class="month-picker-input"
            @change="onMonthInputChange($event.target.value)"
          />
        </div>
        <button type="button" class="month-nav-btn" @click="nextMonth">
          <font-awesome-icon icon="chevron-right" />
        </button>
        <button type="button" class="btn-today" @click="goToday">Hari Ini</button>
      </div>
      <div class="toolbar-hint">
        <font-awesome-icon icon="circle-info" />
        Klik salah satu tanggal buat lihat atau tambah rencana kunjungan kamu di tanggal itu.
      </div>
    </div>

    <div class="stats-bar mb-2">
      <div class="stat-chip stat-planned">
        <font-awesome-icon icon="calendar-check" />
        <span>{{ stats.planned }} Planned</span>
      </div>
      <div class="stat-chip stat-done">
        <font-awesome-icon icon="circle-check" />
        <span>{{ stats.done }} Done</span>
      </div>
      <div class="stat-chip stat-cancelled">
        <font-awesome-icon icon="circle-xmark" />
        <span>{{ stats.cancelled }} Cancelled</span>
      </div>
      <div class="stat-chip stat-pending">
        <font-awesome-icon icon="hourglass-half" />
        <span>{{ stats.pending }} Pending</span>
      </div>
      <div class="stat-chip stat-closed">
        <font-awesome-icon icon="lock" />
        <span>{{ stats.closed }} Closed</span>
      </div>
      <div class="stat-chip stat-total">
        <font-awesome-icon icon="layer-group" />
        <span>{{ totalItemsThisMonth }} Total Item Bulan Ini</span>
      </div>
    </div>

    <div v-if="loading" class="td-center-loading">
      <font-awesome-icon icon="spinner" spin /> Memuat planning kunjungan...
    </div>

    <div v-else class="calendar-card flex-grow-1 overflow-auto mb-3">
      <div class="calendar-month-label">{{ monthLabel }}</div>

      <div class="calendar-grid">
        <div v-for="wd in weekdayLabels" :key="wd" class="calendar-weekday">{{ wd }}</div>

        <div
          v-for="(cell, idx) in calendarCells"
          :key="idx"
          class="calendar-cell"
          :class="{ 'not-in-month': !cell.inMonth, 'is-today': cell.isToday }"
          @click="cell.inMonth && openDayModal(cell)"
        >
          <span class="cell-day-number">{{ cell.day }}</span>

          <div v-if="cell.inMonth && (itemsByDate[cell.dateStr] || []).length" class="cell-items">
            <span
              v-for="item in (itemsByDate[cell.dateStr] || []).slice(0, 3)"
              :key="item.type + '-' + item.id"
              class="cell-item-chip"
              :class="chipClass(item)"
            >
              {{ item.title }}
            </span>
            <span v-if="(itemsByDate[cell.dateStr] || []).length > 3" class="cell-more">
              +{{ (itemsByDate[cell.dateStr] || []).length - 3 }} lagi
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DETAIL HARI (list item + form tambah/edit rencana) -->
    <AppModal
      :show="showDayModal"
      :title="dayModalTitle"
      icon="calendar-day"
      size="md"
      @close="closeDayModal"
    >
      <div class="form-container-gap">

        <div class="plan-list-section">
          <div class="plan-list-title">
            Item di tanggal ini <span class="count">{{ dayItems.length }}</span>
          </div>

          <div v-if="dayItems.length === 0" class="empty-state-sm">
            <font-awesome-icon icon="inbox" />
            Belum ada rencana atau follow up di tanggal ini.
          </div>

          <div v-for="item in dayItems" :key="item.type + '-' + item.id" class="plan-item-card">
            <div class="plan-item-top">
              <span class="plan-type-badge" :class="item.type === 'plan' ? 'type-plan' : 'type-followup'">
                <font-awesome-icon :icon="item.type === 'plan' ? 'calendar-check' : 'phone-volume'" />
                {{ item.type === 'plan' ? 'Rencana Saya' : 'Follow Up' }}
              </span>
              <span class="plan-status-badge" :class="statusClass(item)">{{ statusLabel(item) }}</span>
            </div>

            <div class="plan-item-title">{{ item.title }}</div>

            <div v-if="item.type === 'follow_up'" class="plan-item-sub">
              <font-awesome-icon icon="clock" /> {{ formatTime(item.follow_up_at) }} · {{ item.follow_up_type }}
            </div>

            <div v-if="item.notes" class="plan-item-notes">
              <font-awesome-icon icon="note-sticky" /> {{ item.notes }}
            </div>

            <div v-if="item.type === 'plan'" class="plan-item-actions">
              <button type="button" class="icon-btn" title="Edit" @click="startEditPlan(item)">
                <font-awesome-icon icon="pen-to-square" />
              </button>
              <button type="button" class="icon-btn danger" title="Hapus" @click="confirmDeletePlan(item)">
                <font-awesome-icon icon="trash" />
              </button>
            </div>
          </div>
        </div>

        <div class="plan-form-box">
          <div class="plan-form-title">{{ editingPlanId ? 'Edit Rencana' : 'Tambah Rencana Baru' }}</div>

          <div class="form-group">
            <label>Customer <span class="opt-label">(opsional -- cuma customer yang kamu pegang)</span></label>

            <div v-if="!selectedCustomer" class="drop-wrap full-width">
              <button
                type="button"
                class="btn-select full-width"
                @click="showCustomerDropdown = !showCustomerDropdown"
              >
                <span>Pilih customer saya...</span>
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-company full-width" :class="{ show: showCustomerDropdown }">
                <div class="drop-label">Customer Saya</div>
                <input
                  v-model="customerDropdownSearch"
                  type="text"
                  class="form-input"
                  style="margin-bottom:8px"
                  placeholder="Cari customer..."
                />
                <div class="cs-list">
                  <button
                    v-for="c in filteredMyCustomers" :key="c.id"
                    type="button"
                    class="drop-item"
                    @click="pickCustomer(c)"
                  >{{ c.company_name }}</button>
                  <div v-if="loadingMyCustomers" class="td-sub" style="padding:6px 4px">Memuat...</div>
                  <div v-else-if="!filteredMyCustomers.length" class="td-sub" style="padding:6px 4px">Belum ada customer yang kamu pegang.</div>
                </div>
              </div>
            </div>

            <div v-else class="branch-locked-notice">
              <div>
                <div style="font-weight:700">{{ selectedCustomer.company_name }}</div>
                <div style="font-size:0.72rem;color:var(--text-muted)">{{ selectedCustomer.customer_code }}</div>
              </div>
              <button type="button" class="btn-cancel" style="padding:4px 10px" @click="clearCustomer">Ganti</button>
            </div>
          </div>

          <div class="form-group" v-if="!selectedCustomer">
            <label>Judul Rencana <span class="required">*</span></label>
            <input
              v-model="formData.title"
              class="form-input"
              :class="{ 'input-error': getError('title') }"
              placeholder="misal: Survey calon customer area Cilegon"
            />
            <span v-if="getError('title')" class="form-error">{{ getError('title') }}</span>
          </div>

          <div class="form-group" v-if="editingPlanId">
            <label>Status</label>
            <select v-model="formData.status" class="form-input">
              <option value="planned">Planned</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div class="form-group">
            <label>Catatan</label>
            <textarea v-model="formData.notes" class="form-input" rows="2" placeholder="Catatan tambahan (opsional)"></textarea>
          </div>

          <div class="plan-form-actions">
            <button v-if="editingPlanId" type="button" class="btn-cancel" @click="cancelEditPlan">Batal Edit</button>
            <button type="button" class="btn-save" :disabled="savingPlan || updatingPlan" @click="submitPlanForm">
              <font-awesome-icon v-if="savingPlan || updatingPlan" icon="spinner" spin />
              <font-awesome-icon v-else :icon="editingPlanId ? 'floppy-disk' : 'plus'" />
              {{ (savingPlan || updatingPlan) ? 'Menyimpan...' : (editingPlanId ? 'Update Rencana' : 'Tambah Rencana') }}
            </button>
          </div>
        </div>

      </div>
    </AppModal>

  </div>
</template>

<style scoped>
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

.toolbar-top {
  display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); border-radius: 10px;
  padding: 12px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); flex-wrap: wrap; gap: 10px;
}
.month-nav { display: flex; align-items: center; gap: 8px; }
.month-nav-btn {
  width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border-main); background: var(--bg-input);
  color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.18s ease;
}
.month-nav-btn:hover { background: var(--border-main); }
.month-picker-wrap { display: flex; align-items: center; gap: 8px; padding: 7px 12px; background: var(--bg-input); border: 1px solid var(--border-main); border-radius: 8px; }
.month-picker-icon { color: #6366f1; }
.month-picker-input { border: none; background: transparent; color: var(--text-primary); font-size: 0.85rem; font-weight: 600; outline: none; }
.btn-today {
  padding: 7px 14px; border-radius: 8px; border: 1px solid #6366f1; background: rgba(99,102,241,0.08); color: #6366f1;
  font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.18s ease;
}
.btn-today:hover { background: rgba(99,102,241,0.16); }
.toolbar-hint { font-size: 0.78rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }

.stats-bar { display: flex; flex-wrap: wrap; gap: 10px; }
.stat-chip {
  display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border-radius: 10px;
  background: var(--bg-card); box-shadow: 0 1px 3px var(--shadow-color); font-size: 0.82rem; font-weight: 700; color: var(--text-primary);
}
.stat-planned svg { color: #6366f1; }
.stat-done svg { color: #16a34a; }
.stat-cancelled svg { color: #ef4444; }
.stat-pending svg { color: #b45309; }
.stat-closed svg { color: #64748b; }
.stat-total svg { color: #0d9488; }

.td-center-loading { text-align: center; padding: 60px 0; color: var(--text-muted); font-size: 0.9rem; }

/* ===== KALENDER ===== */
.calendar-card { background: var(--bg-card); border-radius: 12px; padding: 18px; box-shadow: 0 1px 3px var(--shadow-color); }
.calendar-month-label { font-size: 1rem; font-weight: 800; color: var(--text-primary); margin-bottom: 12px; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
.calendar-weekday { text-align: center; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 4px; }

.calendar-cell {
  min-height: 92px; border: 1px solid var(--border-main); border-radius: 8px; padding: 6px; cursor: pointer;
  display: flex; flex-direction: column; gap: 4px; transition: background 0.15s ease; background: var(--bg-main, transparent);
}
.calendar-cell:hover { background: var(--bg-input); }
.calendar-cell.not-in-month { opacity: 0.35; cursor: default; pointer-events: none; }
.calendar-cell.is-today { border-color: #6366f1; border-width: 2px; }
.cell-day-number { font-size: 0.78rem; font-weight: 700; color: var(--text-primary); }

.cell-items { display: flex; flex-direction: column; gap: 3px; }
.cell-item-chip {
  font-size: 0.66rem; font-weight: 600; padding: 2px 6px; border-radius: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cell-item-chip.chip-plan-planned { background: rgba(99,102,241,0.14); color: #4f46e5; }
.cell-item-chip.chip-plan-done { background: rgba(34,197,94,0.14); color: #16a34a; }
.cell-item-chip.chip-plan-cancelled { background: rgba(239,68,68,0.12); color: #dc2626; }
.cell-item-chip.chip-followup { background: rgba(13,148,136,0.14); color: #0d9488; }
.cell-more { font-size: 0.64rem; color: var(--text-muted); font-weight: 600; padding-left: 2px; }

/* ===== MODAL: LIST ITEM DI HARI TERPILIH ===== */
.plan-list-section { display: flex; flex-direction: column; gap: 8px; }
.plan-list-title { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 700; color: var(--text-primary); }
.plan-list-title .count { font-size: 0.72rem; color: #6366f1; background: rgba(99,102,241,0.1); padding: 2px 9px; border-radius: 20px; font-weight: 700; }
.empty-state-sm { display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 0.82rem; padding: 14px 0; }

.plan-item-card {
  border: 1px solid var(--border-main); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; background: var(--bg-input);
}
.plan-item-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.plan-type-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 0.68rem; font-weight: 700; padding: 3px 9px; border-radius: 20px; white-space: nowrap; }
.plan-type-badge.type-plan { background: rgba(99,102,241,0.12); color: #4f46e5; }
.plan-type-badge.type-followup { background: rgba(13,148,136,0.12); color: #0d9488; }

.plan-status-badge { display: inline-flex; align-items: center; font-size: 0.68rem; font-weight: 700; padding: 3px 9px; border-radius: 20px; white-space: nowrap; }
.plan-status-badge.status-planned { background: rgba(245,158,11,0.12); color: #b45309; }
.plan-status-badge.status-done { background: rgba(34,197,94,0.12); color: #16a34a; }
.plan-status-badge.status-cancelled { background: rgba(239,68,68,0.12); color: #dc2626; }

.plan-item-title { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); }
.plan-item-sub { font-size: 0.76rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }
.plan-item-notes { font-size: 0.78rem; color: var(--text-muted); background: var(--bg-card); border-radius: 8px; padding: 7px 9px; display: flex; gap: 6px; align-items: flex-start; }
.plan-item-actions { display: flex; gap: 8px; justify-content: flex-end; }

.icon-btn {
  width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-main); background: var(--bg-card);
  color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.18s ease;
}
.icon-btn:hover { background: var(--border-main); color: var(--text-primary); }
.icon-btn.danger:hover { background: rgba(239,68,68,0.12); color: #dc2626; border-color: rgba(239,68,68,0.3); }

/* ===== MODAL: FORM TAMBAH/EDIT RENCANA ===== */
.plan-form-box { border-top: 1px dashed var(--border-main); padding-top: 14px; display: flex; flex-direction: column; gap: 12px; }
.plan-form-title { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); }
.plan-form-actions { display: flex; justify-content: flex-end; gap: 10px; }
.opt-label { text-transform: none; font-weight: 500; color: var(--text-muted); }

/* ===== FORM & AUTOCOMPLETE (reuse pola Customer Product Population) ===== */
.form-container-gap { display: flex; flex-direction: column; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.required { color: #ef4444; }
.form-input {
  padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.875rem; background: var(--bg-input);
  color: var(--text-primary); outline: none; transition: border 0.18s; width: 100%; box-sizing: border-box; resize: vertical; font-family: inherit;
}
.form-input:focus { border-color: #6366f1; }
.input-error { border-color: #ef4444 !important; background: #fef2f2 !important; }
.form-error { font-size: 0.75rem; color: #ef4444; }

.td-sub { color: var(--text-muted); font-size: 0.78rem; margin-top: 2px; }

.cs-list { max-height: 200px; overflow-y: auto; padding: 4px; }
.branch-locked-notice { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border: 1px solid #6366f1; background: rgba(99,102,241,0.06); border-radius: 8px; }

/* ===== DROPDOWN CUSTOMER (reuse pola dropdown "per company" Product Population) ===== */
.full-width { width: 100%; box-sizing: border-box; }
.drop-wrap { position: relative; }
.btn-select { display: inline-flex; align-items: center; gap: 6px; padding: 9px 12px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.85rem; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
.btn-select.full-width { justify-content: space-between; }
.btn-select:hover { border-color: #6366f1; color: #6366f1; }
.btn-arrow { font-size: 0.6rem; opacity: 0.7; }
.drop-menu { position: absolute; top: calc(100% + 6px); left: 0; min-width: 220px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 10px; z-index: 200; opacity: 0; transform: translateY(-6px); pointer-events: none; transition: all 0.18s ease; }
.drop-menu.show { opacity: 1; transform: translateY(0); pointer-events: all; }
.drop-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; padding: 0 4px; }
.drop-item { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: none; border: none; border-radius: 7px; color: var(--text-primary); font-size: 0.84rem; cursor: pointer; text-align: left; }
.drop-item:hover { background: var(--bg-nav-hover); }

.btn-cancel { padding: 8px 18px; background: var(--bg-main, #f1f5f9); color: var(--text-muted); border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
.btn-cancel:hover { background: var(--border-main); color: var(--text-primary); }
.btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.18s; }
.btn-save:hover:not(:disabled) { background: #4f46e5; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 700px) {
  .calendar-cell { min-height: 70px; }
  .cell-item-chip { display: none; }
}
</style>