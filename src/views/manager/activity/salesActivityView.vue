<script setup>
import { ref, onMounted, computed } from 'vue'
import * as XLSX from 'xlsx'
import AppModal from '@/components/AppModal.vue'
import { useSalesActivityStore } from '@/stores/SalesActivityStore'
import { usePermissionStore } from '@/stores/PermissionStore'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'

const store      = useSalesActivityStore()
const permission = usePermissionStore()
const route      = useRoute()
const toast      = useToast()

// ── PERMISSIONS ────────────────────────────
const currentUrl = computed(() => route.path.replace('/app', ''))
const canView     = computed(() => permission.canView(currentUrl.value))

// ── FETCH AWAL ─────────────────────────────
onMounted(async () => {
  try {
    await store.refreshAll()
  } catch (err) {
    toast.error('Gagal memuat data sales activity.')
  }
})

// ── DROPDOWN OPEN/CLOSE STATE ──────────────
const showRangeMenu   = ref(false)
const showFilterMenu  = ref(false)
const showStatusMenu  = ref(false)
const showExportMenu  = ref(false)
const showPerPageMenu = ref(false)
const showSortByMenu  = ref(false)
const showSortDirMenu = ref(false)

const typeFilterLabel = () =>
  store.typeOptions.find(o => o.value === store.typeFilter)?.label ?? 'Semua Tipe'

const statusFilterLabel = () =>
  store.statusOptions.find(o => o.value === store.statusFilter)?.label ?? 'Semua Status'

const sortByLabel = () =>
  store.sortOptions.find(o => o.value === store.sort.column)?.label ?? 'Waktu'

const rangePresetLabel = () => {
  if (store.rangePreset === 'custom') return 'Custom Range'
  return store.rangePresetOptions.find(o => o.value === store.rangePreset)?.label ?? 'Rentang Lain'
}

// ── CUSTOM RANGE (form lokal sebelum di-"Terapkan" ke store) ──
const customStart = ref('')
const customEnd   = ref('')

function applyCustomRange() {
  if (!customStart.value || !customEnd.value) return
  store.applyCustomRange(customStart.value, customEnd.value)
  showRangeMenu.value = false
}

function selectDay(key) {
  store.selectDay(key)
}

function selectRangePreset(key) {
  store.selectRangePreset(key)
  showRangeMenu.value = false
}

function handleReset() {
  customStart.value = ''
  customEnd.value = ''
  store.resetFilters()
}

// ── EXPORT EXCEL ──
// Karena data di tabel di-paginate server-side, export nge-fetch SEMUA halaman
// yang cocok sama filter/rentang aktif (lewat store.fetchAllActivitiesForExport),
// baru dirender jadi file .xlsx pakai SheetJS (paket `xlsx` — install dulu kalau
// belum ada: npm install xlsx).
async function exportExcel() {
  showExportMenu.value = false
  if (store.exportingExcel) return
  store.exportingExcel = true
  try {
    const rows = await store.fetchAllActivitiesForExport()

    if (!rows.length) {
      toast.info('Tidak ada data aktivitas untuk diexport pada filter ini.')
      return
    }

    const sheetData = rows.map((a, idx) => ({
      'No':               idx + 1,
      'Sales':             a.sales_name,
      'Aktivitas':         getBadgeLabel(a.activity_type),
      'No Ref':            a.ref_code || '-',
      'Target':            a.target_name || '-',
      'Keterangan Target': a.target_note || '',
      'Tanggal':           a.activity_date,
      'Waktu':             a.activity_time,
      'Status':            getStatusLabel(a.status),
      'Catatan':           a.note ? a.note.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '',
    }))

    const worksheet = XLSX.utils.json_to_sheet(sheetData)
    worksheet['!cols'] = [
      { wch: 5 }, { wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 28 }, { wch: 16 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 45 },
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Activity')

    const suffix = store.viewMode === 'day' ? store.dayKey : (store.rangePreset || 'range')
    XLSX.writeFile(workbook, `sales-activity-${suffix}.xlsx`)
  } catch (err) {
    console.error('Gagal export Excel:', err)
    toast.error('Gagal export ke Excel, coba lagi.')
  } finally {
    store.exportingExcel = false
  }
}

// ── AVATAR (nama sales dari backend belum ada warna, jadi digenerate lokal) ──
const AVATAR_COLORS = ['6366f1', 'f59e0b', '0d9488', '8b5cf6', 'ec4899', '3b82f6', 'ef4444', '22c55e']
function colorForName(name) {
  if (!name) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
function avatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Sales')}&background=${colorForName(name)}&color=fff&bold=true`
}

// ── FORMAT TANGGAL SINGKAT UTK KOLOM TABEL ──
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
function fmtShortDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

// ── HELPER LABEL/IKON AKTIVITAS ──
const badgeIconMap  = { visit: 'map-location-dot', followup: 'calendar-check', direct: 'phone' }
const badgeClassMap = { visit: 'activity-visit', followup: 'activity-followup', direct: 'activity-direct' }
const badgeLabelMap = { visit: 'Visit', followup: 'Follow Up', direct: 'Direct' }
const getBadgeIcon  = (type) => badgeIconMap[type] ?? 'circle'
const getBadgeClass = (type) => badgeClassMap[type] ?? ''
const getBadgeLabel = (type) => badgeLabelMap[type] ?? type

// hasil kunjungan (visits.customer_response)
const visitResponseLabelMap = { improved: 'Improved', maintained: 'Maintained', no_progress: 'No Progress' }
const getVisitResponseLabel = (val) => visitResponseLabelMap[val] ?? val

// hasil follow up/direct (follow_ups.result) — vocabulary beda dari visit
const resultLabelMap = {
  NO_RESPONSE: 'No Response', STILL_CONSIDERING: 'Still Considering',
  INTERESTED: 'Interested', NOT_INTERESTED: 'Not Interested', DEAL: 'Deal',
}
const resultClassMap = {
  NO_RESPONSE: 'no_progress', STILL_CONSIDERING: 'maintained',
  INTERESTED: 'improved', NOT_INTERESTED: 'no_progress', DEAL: 'deal',
}
const getResultLabel = (val) => resultLabelMap[val] ?? val
const getResultClass = (val) => resultClassMap[val] ?? ''

// status follow up (PENDING/DONE/CANCELLED/CLOSED)
const statusLabelMap = { PENDING: 'Pending', DONE: 'Selesai', CANCELLED: 'Dibatalkan', CLOSED: 'Ditutup' }
const statusClassMap = { PENDING: 'status-pending', DONE: 'status-done', CANCELLED: 'status-cancelled', CLOSED: 'status-closed' }
const getStatusLabel = (val) => statusLabelMap[val] ?? val
const getStatusClass = (val) => statusClassMap[val] ?? ''

function isTruthy(val) {
  return val === true || val === 1 || val === '1' || val === 't' || val === 'true'
}

// ── SANITIZE RICH TEXT ──────────────────────
// Field notes/complaint_detail/potential_order_detail/next_visit_notes disimpan
// sebagai HTML dari rich text editor (sama seperti di Visits::getVisitTargetMap()),
// jadi tidak boleh di-interpolate mentah ({{ }}) karena akan nampilin tag <p> dsb
// apa adanya. Kalau kamu sudah punya composable sanitizeRichText yang dipakai di
// halaman Live Field Tracker, ganti fungsi ini dengan import composable itu biar
// konsisten satu sumber — signature-nya sama (string HTML in, string HTML aman out).
function sanitizeRichText(html) {
  if (!html) return ''
  let clean = String(html)
  // buang <script>/<style> beserta isinya
  clean = clean.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
  // buang atribut event handler (onclick, onerror, dst)
  clean = clean.replace(/\son\w+\s*=\s*"[^"]*"/gi, '').replace(/\son\w+\s*=\s*'[^']*'/gi, '')
  // buang javascript: di href/src
  clean = clean.replace(/(href|src)\s*=\s*"javascript:[^"]*"/gi, '$1="#"')
  clean = clean.replace(/(href|src)\s*=\s*'javascript:[^']*'/gi, "$1='#'")
  return clean
}

// ── MODAL DETAIL AKTIVITAS ──
const isDetailModalVisible = ref(false)
const detailActivityMeta   = ref(null) // simpan row tabel yg diklik (utk sales_name/badge/waktu di header modal)
const detailType           = ref(null)

async function openDetailModal(item) {
  detailActivityMeta.value = item
  detailType.value = item.activity_type
  isDetailModalVisible.value = true
  try {
    await store.fetchActivityDetail(item.activity_type, item.id)
  } catch (err) {
    toast.error('Gagal memuat detail aktivitas.')
    isDetailModalVisible.value = false
  }
}

function closeDetailModal() {
  isDetailModalVisible.value = false
  detailActivityMeta.value = null
  detailType.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="chart-line" />
          Sales Activity Dashboard
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" />
            Dashboard
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Sales Activity</span>
        </div>
      </div>
      <span class="manager-only-chip">
        <font-awesome-icon icon="user-shield" /> Manager Only
      </span>
    </div>

    <div class="toolbar-top">
      <div class="toolbar-left">
        <div class="segment-group">
          <button
            type="button"
            class="segment-btn" :class="{ active: store.viewMode === 'day' && store.dayKey === 'today', today: true }"
            @click="selectDay('today')"
          >
            <span class="segment-dot"></span> Hari Ini
          </button>
          <button
            type="button"
            class="segment-btn" :class="{ active: store.viewMode === 'day' && store.dayKey === 'yesterday' }"
            @click="selectDay('yesterday')"
          >
            <span class="segment-dot"></span> Kemarin
          </button>
        </div>

        <div class="drop-wrap">
          <button class="btn-select" @click="showRangeMenu = !showRangeMenu">
            <font-awesome-icon icon="calendar-days" />
            {{ store.viewMode === 'range' ? rangePresetLabel() : 'Rentang Lain' }}
            <font-awesome-icon icon="chevron-down" class="btn-arrow" />
          </button>
          <div class="drop-menu range-drop-menu" :class="{ show: showRangeMenu }">
            <div class="drop-label">Preset Rentang</div>
            <button v-for="opt in store.rangePresetOptions" :key="opt.value" class="drop-item"
              :class="{ active: store.rangePreset === opt.value }"
              @click="selectRangePreset(opt.value)">
              <font-awesome-icon icon="calendar-week" /> {{ opt.label }}
            </button>

            <div class="drop-label" style="margin-top:10px">Custom Range</div>
            <div class="custom-range-fields">
              <input type="date" v-model="customStart" class="date-input" />
              <span class="custom-range-sep">–</span>
              <input type="date" v-model="customEnd" class="date-input" />
            </div>
            <button class="btn-toolbar btn-purple custom-range-apply" @click="applyCustomRange">
              <font-awesome-icon icon="check" /> Terapkan
            </button>
          </div>
        </div>
      </div>

      <button class="btn-toolbar btn-orange" @click="handleReset">
        <font-awesome-icon icon="rotate-left" /> Reset
      </button>
    </div>

    <div v-if="store.viewMode === 'range'" class="range-info-chip mb-2">
      <font-awesome-icon icon="calendar-week" />
      Menampilkan: <strong>{{ rangePresetLabel() }}</strong>
      &nbsp;·&nbsp; {{ fmtShortDate(store.summary.start_date) }} – {{ fmtShortDate(store.summary.end_date) }}
      ({{ store.summary.days }} hari)
    </div>

    <div class="controls-card">
      <div class="controls-row">
        <div class="controls-left">
          <div class="drop-wrap">
            <button class="btn-select" @click="showFilterMenu = !showFilterMenu">
              <font-awesome-icon icon="filter" /> {{ typeFilterLabel() }} <font-awesome-icon icon="chevron-down" class="btn-arrow" />
            </button>
            <div class="drop-menu" :class="{ show: showFilterMenu }">
              <div class="drop-label">Tipe Aktivitas</div>
              <button v-for="opt in store.typeOptions" :key="opt.value" class="drop-item"
                :class="{ active: store.typeFilter === opt.value }"
                @click="store.changeTypeFilter(opt.value); showFilterMenu = false">{{ opt.label }}</button>
            </div>
          </div>

          <div class="drop-wrap">
            <button class="btn-select" @click="showStatusMenu = !showStatusMenu">
              <font-awesome-icon icon="list-check" /> {{ statusFilterLabel() }} <font-awesome-icon icon="chevron-down" class="btn-arrow" />
            </button>
            <div class="drop-menu" :class="{ show: showStatusMenu }">
              <div class="drop-label">Status</div>
              <button v-for="opt in store.statusOptions" :key="opt.value" class="drop-item"
                :class="{ active: store.statusFilter === opt.value }"
                @click="store.changeStatusFilter(opt.value); showStatusMenu = false">{{ opt.label }}</button>
            </div>
          </div>

          <div class="drop-wrap">
            <button class="btn-toolbar btn-purple" @click="showExportMenu = !showExportMenu">
              <font-awesome-icon icon="upload" /> Exports
              <font-awesome-icon icon="chevron-down" class="btn-arrow" />
            </button>
            <div class="drop-menu" :class="{ show: showExportMenu }">
              <div class="drop-label">Export Data</div>
              <button class="drop-item">
                <font-awesome-icon icon="file-csv" style="color:#22c55e" /> Export CSV
              </button>
              <button class="drop-item" :disabled="store.exportingExcel" @click="exportExcel">
                <font-awesome-icon v-if="store.exportingExcel" icon="spinner" spin style="color:#16a34a" />
                <font-awesome-icon v-else icon="file-excel" style="color:#16a34a" />
                {{ store.exportingExcel ? 'Mengexport...' : 'Export Excel' }}
              </button>
              <button class="drop-item">
                <font-awesome-icon icon="file-pdf" style="color:#ef4444" /> Export PDF
              </button>
            </div>
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
                    v-for="opt in [5,10,25,50]" :key="opt"
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
              :value="store.searchActivity"
              type="text"
              placeholder="Cari nama sales / target..."
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
                <button v-for="opt in ['desc', 'asc']" :key="opt" class="drop-item"
                  :class="{ active: store.sort.direction === opt }"
                  @click="store.sort.direction = opt; store.changeSorting(); showSortDirMenu = false">{{ opt === 'asc' ? 'Asc' : 'Desc' }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="stat-grid mb-2">
      <div class="stat-tile">
        <div class="stat-tile-top">
          <span class="stat-label">{{ store.viewMode === 'day' && store.dayKey === 'today' ? 'Sales Aktif' : 'Sales Beraktivitas' }}</span>
          <span class="stat-icon" style="background:rgba(34,197,94,0.12);color:#22c55e"><font-awesome-icon icon="signal" /></span>
        </div>
        <div class="stat-value">{{ store.loadingSummary ? '–' : store.summary.stats.active_sales }}</div>
        <div class="stat-sub">dari {{ store.summary.stats.total_sales }} total sales</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile-top">
          <span class="stat-label">Visit</span>
          <span class="stat-icon" style="background:rgba(99,102,241,0.12);color:#6366f1"><font-awesome-icon icon="map-location-dot" /></span>
        </div>
        <div class="stat-value">{{ store.loadingSummary ? '–' : store.summary.stats.visits }}</div>
        <div class="stat-sub">{{ store.summary.start_date === store.summary.end_date ? fmtShortDate(store.summary.start_date) : `${fmtShortDate(store.summary.start_date)} – ${fmtShortDate(store.summary.end_date)}` }}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile-top">
          <span class="stat-label">Follow Up</span>
          <span class="stat-icon" style="background:rgba(245,158,11,0.12);color:#b45309"><font-awesome-icon icon="calendar-check" /></span>
        </div>
        <div class="stat-value">{{ store.loadingSummary ? '–' : store.summary.stats.followups }}</div>
        <div class="stat-sub">Berdasarkan jadwal/selesai</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile-top">
          <span class="stat-label">Direct</span>
          <span class="stat-icon" style="background:rgba(13,148,136,0.12);color:#0d9488"><font-awesome-icon icon="phone" /></span>
        </div>
        <div class="stat-value">{{ store.loadingSummary ? '–' : store.summary.stats.direct }}</div>
        <div class="stat-sub">Call / WhatsApp / Email</div>
      </div>
    </div>

    <div class="mb-2">
      <div class="section-title">
        <font-awesome-icon icon="satellite-dish" />
        <span v-if="store.viewMode === 'day'">{{ store.dayKey === 'today' ? 'Sales Sedang Aktif' : 'Rekap Aktivitas Sales' }}</span>
        <span v-else>Leaderboard Sales</span>
        <span class="count">{{ store.summary.roster.length }}</span>
        <span v-if="store.viewMode === 'day' && store.dayKey !== 'today'" class="hint">— histori, bukan status real-time</span>
        <span v-if="store.viewMode === 'range'" class="hint">— akumulasi {{ store.summary.days }} hari, diurutkan dari paling aktif</span>
      </div>

      <div v-if="store.loadingSummary" class="td-center" style="padding:24px 0;">
        <font-awesome-icon icon="spinner" spin /> Memuat...
      </div>

      <div v-else-if="!store.summary.roster.length" class="empty-detail-note" style="padding:8px 2px;">
        <font-awesome-icon icon="circle-info" /> Belum ada aktivitas sales pada periode ini.
      </div>

      <div v-else-if="store.viewMode === 'day'" class="roster">
        <div v-for="s in store.summary.roster" :key="s.sales_id" class="sales-card">
          <template v-if="s.is_live">
            <div class="sales-card-head">
              <div class="avatar-wrap">
                <img class="avatar" :src="avatarUrl(s.sales_name)" />
                <span class="live-dot pulse"></span>
              </div>
              <div>
                <div class="sales-name">{{ s.sales_name }}</div>
                <div class="sales-status live">● Sedang Aktif</div>
              </div>
            </div>
            <div class="sales-current-target">
              <font-awesome-icon icon="location-dot" /> {{ s.current_target || '-' }}
            </div>
          </template>
          <template v-else>
            <div class="sales-card-head">
              <div class="avatar-wrap">
                <img class="avatar" :src="avatarUrl(s.sales_name)" />
                <span class="live-dot recap"></span>
              </div>
              <div>
                <div class="sales-name">{{ s.sales_name }}</div>
                <div class="sales-status">Aktivitas terakhir {{ s.last_activity_at ? s.last_activity_at.substring(11, 16) : '-' }}</div>
              </div>
            </div>
            <div class="sales-recap-counts">
              <span v-if="s.counts.visit" class="recap-chip v">{{ s.counts.visit }} Visit</span>
              <span v-if="s.counts.followup" class="recap-chip f">{{ s.counts.followup }} Follow Up</span>
              <span v-if="s.counts.direct" class="recap-chip d">{{ s.counts.direct }} Direct</span>
            </div>
          </template>
        </div>
      </div>

      <div v-else class="leaderboard-list">
        <div v-for="(s, idx) in store.summary.roster" :key="s.sales_id" class="leaderboard-row">
          <span class="leaderboard-rank">#{{ idx + 1 }}</span>
          <img class="avatar" :src="avatarUrl(s.sales_name)" />
          <span class="leaderboard-name">{{ s.sales_name }}</span>
          <span class="sales-recap-counts">
            <span v-if="s.counts.visit" class="recap-chip v">{{ s.counts.visit }} Visit</span>
            <span v-if="s.counts.followup" class="recap-chip f">{{ s.counts.followup }} Follow Up</span>
            <span v-if="s.counts.direct" class="recap-chip d">{{ s.counts.direct }} Direct</span>
          </span>
          <span class="leaderboard-total">{{ s.total }} total</span>
        </div>
      </div>
    </div>

    <div class="mb-2">
      <div class="section-title">
        <font-awesome-icon icon="calendar-day" />
        <span>Follow Up Reminder</span>
        <span class="count">{{ (store.summary.follow_up_reminders ?? []).length }}</span>
        <span class="hint">— follow up yang jatuh tempo pada {{ store.viewMode === 'day' ? 'tanggal ini' : 'rentang ini' }} &amp; masih pending</span>
      </div>

      <div v-if="!store.loadingSummary && !(store.summary.follow_up_reminders ?? []).length" class="empty-detail-note" style="padding:8px 2px;">
        <font-awesome-icon icon="circle-info" /> Tidak ada follow up yang jatuh tempo pada periode ini.
      </div>

      <div v-else-if="(store.summary.follow_up_reminders ?? []).length" class="reminder-list">
        <div
          v-for="r in store.summary.follow_up_reminders ?? []" :key="r.id"
          class="reminder-row" :class="{ overdue: r.is_overdue }"
        >
          <img class="avatar" :src="avatarUrl(r.sales_name)" />
          <div class="reminder-main">
            <div class="reminder-top">
              <span class="reminder-name">{{ r.sales_name }}</span>
              <span class="reminder-badge" :class="{ overdue: r.is_overdue }">
                <font-awesome-icon :icon="r.is_overdue ? 'triangle-exclamation' : 'calendar-day'" />
                {{ r.is_overdue ? 'Overdue' : 'Jatuh Tempo' }} · {{ fmtShortDate(r.follow_up_date) }}
              </span>
            </div>
            <div class="reminder-target">
              <font-awesome-icon icon="location-dot" /> {{ r.target_name || '-' }}
              <span v-if="r.target_note" class="td-muted">({{ r.target_note }})</span>
              <span class="activity-badge" :class="getBadgeClass(r.follow_up_type === 'VISIT' ? 'followup' : 'direct')" style="margin-left:6px;">
                {{ r.follow_up_type }}
              </span>
            </div>
            <div v-if="r.subject" class="reminder-subject">{{ r.subject }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-title">
      <font-awesome-icon icon="list-check" />
      <span v-if="store.viewMode === 'day'">{{ store.dayKey === 'today' ? 'Aktivitas Terbaru' : `Aktivitas Tanggal ${fmtShortDate(store.summary.start_date)}` }}</span>
      <span v-else>Aktivitas dalam Rentang ({{ fmtShortDate(store.summary.start_date) }} – {{ fmtShortDate(store.summary.end_date) }})</span>
    </div>

    <div class="table-card flex-grow-1 overflow-auto mb-3">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:56px">NO.</th>
            <th>SALES</th>
            <th style="width:140px">AKTIVITAS</th>
            <th style="width:110px">NO REF</th>
            <th>TARGET</th>
            <th style="width:100px">TANGGAL</th>
            <th style="width:90px">WAKTU</th>
            <th style="width:110px">STATUS</th>
            <th>CATATAN</th>
            <th style="width:90px; text-align:center">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.loadingActivities">
            <td colspan="10" class="td-center">
              <font-awesome-icon icon="spinner" spin /> Memuat data...
            </td>
          </tr>
          <tr v-else-if="store.activitiesData.length === 0">
            <td colspan="10" class="td-center">
              <div class="empty-state">
                <font-awesome-icon icon="inbox" class="empty-icon" />
                <div>Tidak ada aktivitas yang cocok dengan filter/pencarian</div>
              </div>
            </td>
          </tr>
          <tr v-else v-for="(a, index) in store.activitiesData" :key="`${a.activity_type}-${a.id}`" class="data-row">
            <td class="td-no">{{ (store.pagination.current_page - 1) * store.pagination.per_page + index + 1 }}.</td>
            <td>
              <div class="row-sales">
                <img :src="avatarUrl(a.sales_name)" />
                <span>{{ a.sales_name }}</span>
              </div>
            </td>
            <td>
              <span class="activity-badge" :class="getBadgeClass(a.activity_type)">
                <font-awesome-icon :icon="getBadgeIcon(a.activity_type)" /> {{ getBadgeLabel(a.activity_type) }}
              </span>
            </td>
            <td class="td-muted mono">{{ a.ref_code || '-' }}</td>
            <td>{{ a.target_name || '-' }} <span v-if="a.target_note" class="td-muted">({{ a.target_note }})</span></td>
            <td class="td-muted">{{ fmtShortDate(a.activity_date) }}</td>
            <td class="td-muted">{{ a.activity_time }}</td>
            <td>
              <span class="result-chip" :class="getStatusClass(a.status)">{{ getStatusLabel(a.status) }}</span>
            </td>
            <td class="td-note">{{ a.note }}</td>
            <td class="td-actions">
              <button class="act-btn act-info" title="Detail" @click="openDetailModal(a)">
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
          :disabled="store.pagination.current_page === 1"
          @click="store.fetchActivities(store.pagination.prev_page_url)"
        >
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button
          class="btn-prev-next"
          :disabled="store.pagination.current_page === store.pagination.last_page"
          @click="store.fetchActivities(store.pagination.next_page_url)"
        >
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">{{ store.activitiesData.length }} DATA | PAGE {{ store.pagination.current_page }}</span>
        <span class="page-badge">TOTAL: {{ store.pagination.total }}</span>
      </div>
    </div>

    <!-- Detail Modal -->
    <AppModal
      :show="isDetailModalVisible"
      title="Detail Aktivitas"
      icon="circle-info"
      size="md"
      @close="closeDetailModal"
    >
      <div v-if="store.loadingDetail" style="display:flex; justify-content:center; padding:32px;">
        <div class="spinner-custom"></div>
      </div>

      <div v-else-if="store.activityDetail" class="detail-list">

        <div style="display:flex; align-items:center; gap:12px; padding-bottom:14px; border-bottom:1px solid var(--border-main); margin-bottom:4px;">
          <img
            :src="avatarUrl(store.activityDetail.sales_name)"
            style="width:44px; height:44px; border-radius:50%; object-fit:cover; border:2px solid var(--border-main);"
          />
          <div style="flex:1;">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <span style="font-weight:700; font-size:0.95rem; color:var(--text-primary);">{{ store.activityDetail.sales_name }}</span>
              <span v-if="store.activityDetail.no_reference || store.activityDetail.visit_code || store.activityDetail.follow_up_code" class="ref-code-chip">
                # {{ store.activityDetail.no_reference || store.activityDetail.visit_code || store.activityDetail.follow_up_code }}
              </span>
            </div>
            <div style="font-size:0.78rem; color:var(--text-muted);">
              <span class="activity-badge" :class="getBadgeClass(detailType)">
                <font-awesome-icon :icon="getBadgeIcon(detailType)" /> {{ getBadgeLabel(detailType) }}
              </span>
              &nbsp;·&nbsp; {{ detailActivityMeta?.activity_date ? fmtShortDate(detailActivityMeta.activity_date) : '' }}
            </div>
          </div>
        </div>

        <div class="detail-row">
          <span class="detail-label">Target</span>
          <span class="detail-value font-semibold">{{ store.activityDetail.target_name || '-' }}</span>
        </div>
        <div v-if="store.activityDetail.address" class="detail-row">
          <span class="detail-label">Alamat</span>
          <span class="detail-value">{{ store.activityDetail.address }}</span>
        </div>
        <div v-if="store.activityDetail.phone" class="detail-row">
          <span class="detail-label">Telepon</span>
          <span class="detail-value"><a :href="`tel:${store.activityDetail.phone}`">{{ store.activityDetail.phone }}</a></span>
        </div>
        <div v-if="store.activityDetail.email" class="detail-row">
          <span class="detail-label">Email</span>
          <span class="detail-value"><a :href="`mailto:${store.activityDetail.email}`">{{ store.activityDetail.email }}</a></span>
        </div>

        <!-- ===== DETAIL KHUSUS VISIT ===== -->
        <template v-if="detailType === 'visit'">
          <div v-if="store.activityDetail.visit_at || store.activityDetail.check_in_at || store.activityDetail.check_out_at">
            <div class="detail-section-title" style="margin-top:10px;"><font-awesome-icon icon="clock" /> Timeline</div>
            <div class="timeline-grid">
              <div class="timeline-chip">
                <div class="timeline-chip-label">Visit</div>
                <div class="timeline-chip-value">{{ store.activityDetail.visit_at || '–' }}</div>
              </div>
              <div class="timeline-chip">
                <div class="timeline-chip-label">Check-in</div>
                <div class="timeline-chip-value">{{ store.activityDetail.check_in_at || '–' }}</div>
              </div>
              <div class="timeline-chip">
                <div class="timeline-chip-label">Check-out</div>
                <div class="timeline-chip-value">{{ store.activityDetail.check_out_at || 'Belum' }}</div>
              </div>
            </div>
            <div v-if="store.activityDetail.dur_to_check_in" class="duration-grid">
              <div class="duration-chip">
                <div class="duration-chip-label">Menuju → Check-in</div>
                <div class="duration-chip-value">{{ store.activityDetail.dur_to_check_in }}</div>
              </div>
              <div class="duration-chip">
                <div class="duration-chip-label">Check-in → Check-out</div>
                <div class="duration-chip-value">{{ store.activityDetail.dur_check_in_to_out || '–' }}</div>
              </div>
              <div class="duration-chip">
                <div class="duration-chip-label">Total Durasi</div>
                <div class="duration-chip-value">{{ store.activityDetail.dur_total || '–' }}</div>
              </div>
            </div>
          </div>

          <div v-if="store.activityDetail.photo_url">
            <div class="detail-section-title" style="margin-top:10px;"><font-awesome-icon icon="camera" /> Foto Kunjungan</div>
            <img class="visit-photo-img" :src="store.activityDetail.photo_url" />
          </div>

          <div v-if="store.activityDetail.response || store.activityDetail.notes">
            <div class="detail-section-title" style="margin-top:10px;"><font-awesome-icon icon="clipboard-check" /> Hasil</div>
            <div v-if="store.activityDetail.response" class="result-row">
              <span class="result-chip" :class="store.activityDetail.response">{{ getVisitResponseLabel(store.activityDetail.response) }}</span>
            </div>
            <div v-if="store.activityDetail.notes" class="rich-text" v-html="sanitizeRichText(store.activityDetail.notes)"></div>
          </div>

          <div v-if="isTruthy(store.activityDetail.has_complaint)" class="alert-box alert-danger">
            <font-awesome-icon icon="triangle-exclamation" />
            <div><strong>Ada Komplain</strong><div class="rich-text" v-html="sanitizeRichText(store.activityDetail.complaint_detail)"></div></div>
          </div>

          <div v-if="isTruthy(store.activityDetail.has_potential_order)" class="alert-box alert-success">
            <font-awesome-icon icon="sack-dollar" />
            <div><strong>Potensi Order</strong><div class="rich-text" v-html="sanitizeRichText(store.activityDetail.potential_order_detail)"></div></div>
          </div>

          <div v-if="store.activityDetail.next_visit_at">
            <div class="detail-section-title" style="margin-top:10px;"><font-awesome-icon icon="calendar-plus" /> Kunjungan / Follow Up Selanjutnya</div>
            <div class="next-visit-card">
              <div class="next-visit-row">
                <span class="next-visit-date"><font-awesome-icon icon="calendar-day" /> {{ store.formatDate(store.activityDetail.next_visit_at) }}</span>
                <span v-if="store.activityDetail.next_visit_type" class="next-visit-type">{{ store.activityDetail.next_visit_type }}</span>
              </div>
              <div v-if="store.activityDetail.next_visit_notes" class="next-visit-notes rich-text" v-html="sanitizeRichText(store.activityDetail.next_visit_notes)"></div>
            </div>
          </div>
          <div v-else class="empty-detail-note">
            <font-awesome-icon icon="circle-info" /> Belum ada jadwal kunjungan/follow up selanjutnya.
          </div>

          <a v-if="store.activityDetail.check_out_file_url" :href="store.activityDetail.check_out_file_url" target="_blank" class="checkout-file-link">
            <font-awesome-icon icon="paperclip" /> Lihat file check-out
          </a>
        </template>

        <!-- ===== DETAIL KHUSUS FOLLOW UP / DIRECT ===== -->
        <template v-else>
          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="result-chip" :class="getStatusClass(store.activityDetail.status)">{{ getStatusLabel(store.activityDetail.status) }}</span>
          </div>
          <div v-if="store.activityDetail.subject" class="detail-row">
            <span class="detail-label">Subjek</span>
            <span class="detail-value">{{ store.activityDetail.subject }}</span>
          </div>
          <div v-if="store.activityDetail.next_follow_up_at">
            <div class="detail-section-title" style="margin-top:10px;"><font-awesome-icon icon="calendar-plus" /> Follow Up Selanjutnya</div>
            <div class="next-visit-card">
              <div class="next-visit-row">
                <span class="next-visit-date"><font-awesome-icon icon="calendar-day" /> {{ store.formatDate(store.activityDetail.next_follow_up_at) }}</span>
                <span v-if="store.activityDetail.follow_up_type" class="next-visit-type">{{ store.activityDetail.follow_up_type }}</span>
              </div>
              <div v-if="store.activityDetail.completed_time" class="next-visit-notes">
                <font-awesome-icon icon="circle-check" /> Sudah diselesaikan pukul {{ store.activityDetail.completed_time }}
              </div>
            </div>
          </div>
          <div v-else class="empty-detail-note">
            <font-awesome-icon icon="circle-info" /> Belum ada jadwal follow up selanjutnya.
          </div>

          <div v-if="store.activityDetail.response || store.activityDetail.notes">
            <div class="detail-section-title" style="margin-top:10px;"><font-awesome-icon icon="clipboard-check" /> Hasil</div>
            <div v-if="store.activityDetail.response" class="result-row">
              <span class="result-chip" :class="getResultClass(store.activityDetail.response)">{{ getResultLabel(store.activityDetail.response) }}</span>
            </div>
            <div v-if="store.activityDetail.notes" class="rich-text" v-html="sanitizeRichText(store.activityDetail.notes)"></div>
          </div>
        </template>
      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeDetailModal">Close</button>
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

.breadcrumb-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.breadcrumb-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
}

.breadcrumb-title svg {
  color: #6366f1;
}

.breadcrumb-path {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.breadcrumb-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--text-muted);
  font-weight: 500;
}

.breadcrumb-item.active {
  color: #6366f1;
  font-weight: 700;
}

.breadcrumb-separator {
  font-size: 0.7rem;
  color: var(--text-muted);
  opacity: 0.6;
}

.manager-only-chip {
  display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 20px;
  background: rgba(99,102,241,0.1); color: #6366f1; font-size: 0.74rem; font-weight: 700;
}

.toolbar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-card);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px var(--shadow-color);
  flex-wrap: wrap;
  gap: 8px;
}
.toolbar-left { display: flex; gap: 8px; flex-wrap: wrap; flex: 1; min-width: 240px; align-items: center; }
.btn-toolbar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: none;
  border-radius: 8px;
  font-size: 0.83rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}
.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover { background: #4f46e5; }
.btn-orange { background: #f59e0b; color: #fff; }
.btn-orange:hover { background: #d97706; }
.btn-arrow { font-size: 0.6rem; opacity: 0.7; }
.controls-card {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px var(--shadow-color);
}
.controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.controls-left, .controls-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.showing-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.84rem;
  color: var(--text-primary);
  font-weight: 600;
}
.showing-label { white-space: nowrap; color: var(--text-muted); font-size: 0.83rem; }
.text-muted-color { color: var(--text-muted); }
.search-wrap {
  display: flex;
  border: 1px solid var(--border-main);
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-input);
}
.search-input {
  padding: 7px 12px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.84rem;
  outline: none;
  width: 200px;
}
.search-input::placeholder { color: var(--text-muted); }
.search-btn {
  padding: 7px 12px;
  background: #6366f1;
  color: #fff;
  border: none;
  cursor: pointer;
}
.search-btn:hover { background: #4f46e5; }
.sort-wrap { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.drop-wrap { position: relative; }
.btn-select {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  background: var(--bg-input);
  color: var(--text-primary);
  border: 1px solid var(--border-main);
  border-radius: 7px;
  font-size: 0.83rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.btn-select:hover { border-color: #6366f1; color: #6366f1; }
.drop-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 170px;
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 10px;
  z-index: 200;
  opacity: 0;
  transform: translateY(-6px);
  pointer-events: none;
  transition: all 0.18s ease;
}
.drop-right { left: auto; right: 0; }
.drop-menu.show { opacity: 1; transform: translateY(0); pointer-events: all; }
.range-drop-menu { min-width: 260px; }
.drop-label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 6px;
  padding: 0 4px;
}
.drop-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: none;
  border: none;
  border-radius: 7px;
  color: var(--text-primary);
  font-size: 0.84rem;
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
}
.drop-item:hover { background: var(--bg-nav-hover); }
.drop-item.active { color: #6366f1; font-weight: 600; background: rgba(99,102,241,0.08); }
.perpage-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.perpage-opt {
  padding: 5px 10px;
  border: 1px solid var(--border-main);
  border-radius: 6px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.15s;
}
.perpage-opt:hover  { border-color: #6366f1; color: #6366f1; }
.perpage-opt.active { background: #6366f1; border-color: #6366f1; color: #fff; font-weight: 700; }

/* ===== CUSTOM RANGE ===== */
.custom-range-fields { display: flex; align-items: center; gap: 6px; padding: 0 4px 8px; }
.custom-range-sep { color: var(--text-muted); font-size: 0.8rem; }
.date-input {
  flex: 1; min-width: 0; padding: 6px 8px; border: 1px solid var(--border-main); border-radius: 7px;
  background: var(--bg-input); color: var(--text-primary); font-size: 0.8rem; outline: none;
}
.date-input:focus { border-color: #6366f1; }
.custom-range-apply { width: 100%; justify-content: center; margin-top: 2px; }

/* ===== RANGE INFO CHIP ===== */
.range-info-chip {
  display: flex; align-items: center; gap: 8px; background: rgba(99,102,241,0.08);
  border: 1px solid rgba(99,102,241,0.2); color: #4338ca; border-radius: 10px;
  padding: 9px 14px; font-size: 0.82rem;
}

/* ===== STAT TILES ===== */
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.stat-tile { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; padding: 16px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: column; gap: 6px; }
.stat-tile-top { display: flex; align-items: center; justify-content: space-between; }
.stat-icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; flex-shrink: 0; }
.stat-label { font-size: 0.76rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
.stat-value { font-size: 1.7rem; font-weight: 800; }
.stat-sub { font-size: 0.76rem; color: var(--text-muted); }

.section-title { display: flex; align-items: center; gap: 8px; font-size: 0.92rem; font-weight: 700; margin: 4px 2px 8px; }
.section-title .count { font-size: 0.76rem; color: #6366f1; background: rgba(99,102,241,0.1); padding: 2px 9px; border-radius: 20px; font-weight: 700; }
.section-title .hint { font-size: 0.74rem; font-weight: 500; color: var(--text-muted); }

/* ===== SALES ROSTER ===== */
.roster { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 4px; }
.sales-card { flex-shrink: 0; width: 200px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; padding: 14px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: column; gap: 8px; }
.sales-card-head { display: flex; align-items: center; gap: 10px; }
.avatar-wrap { position: relative; flex-shrink: 0; }
.avatar { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-main); display: block; }
.live-dot { position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; border-radius: 50%; background: #22c55e; border: 2px solid #fff; }
.live-dot.pulse::after { content: ''; position: absolute; inset: 0; border-radius: 50%; background: #22c55e; opacity: 0.6; animation: pulse 1.6s ease-out infinite; }
.live-dot.recap { background: var(--text-muted); }
@keyframes pulse { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2.4); opacity: 0; } }
.sales-name { font-size: 0.86rem; font-weight: 700; }
.sales-status { font-size: 0.72rem; color: var(--text-muted); }
.sales-status.live { color: #16a34a; font-weight: 700; }
.sales-current-target { font-size: 0.74rem; background: var(--bg-input); border-radius: 7px; padding: 6px 8px; color: var(--text-primary); display: flex; align-items: center; gap: 6px; }
.sales-current-target svg { color: #6366f1; }
.sales-recap-counts { display: flex; gap: 6px; flex-wrap: wrap; }
.recap-chip { font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 20px; }
.recap-chip.v { background: rgba(99,102,241,0.1); color: #6366f1; }
.recap-chip.f { background: rgba(245,158,11,0.12); color: #b45309; }
.recap-chip.d { background: rgba(13,148,136,0.12); color: #0d9488; }

/* ===== LEADERBOARD (mode rentang) ===== */
.leaderboard-list { display: flex; flex-direction: column; gap: 8px; }
.leaderboard-row {
  display: flex; align-items: center; gap: 10px; background: var(--bg-card); border: 1px solid var(--border-main);
  border-radius: 10px; padding: 10px 14px; box-shadow: 0 1px 3px var(--shadow-color); flex-wrap: wrap;
}
.leaderboard-rank { font-weight: 800; color: var(--text-muted); width: 28px; flex-shrink: 0; }
.leaderboard-name { font-weight: 700; flex: 1; min-width: 120px; }
.leaderboard-total { font-size: 0.74rem; font-weight: 700; color: #6366f1; background: rgba(99,102,241,0.1); padding: 3px 10px; border-radius: 20px; white-space: nowrap; }

/* ===== FOLLOW UP REMINDER ===== */
.reminder-list { display: flex; flex-direction: column; gap: 8px; }
.reminder-row {
  display: flex; align-items: flex-start; gap: 10px; background: var(--bg-card); border: 1px solid var(--border-main);
  border-radius: 10px; padding: 10px 14px; box-shadow: 0 1px 3px var(--shadow-color);
}
.reminder-row.overdue { border-color: rgba(239,68,68,0.35); background: rgba(239,68,68,0.04); }
.reminder-row .avatar { width: 36px; height: 36px; flex-shrink: 0; }
.reminder-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.reminder-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.reminder-name { font-weight: 700; font-size: 0.86rem; }
.reminder-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 0.7rem; font-weight: 700; padding: 3px 9px; border-radius: 20px; white-space: nowrap; background: rgba(245,158,11,0.12); color: #b45309; }
.reminder-badge.overdue { background: rgba(239,68,68,0.12); color: #ef4444; }
.reminder-target { font-size: 0.8rem; color: var(--text-primary); display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.reminder-subject { font-size: 0.78rem; color: var(--text-muted); }

/* activity type badge — warna + ikon + label, tidak mengandalkan warna saja */
.activity-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 0.7rem; font-weight: 700; padding: 3px 9px; border-radius: 20px; white-space: nowrap; }
.activity-visit     { background: rgba(99,102,241,0.1);  color: #6366f1; }
.activity-followup  { background: rgba(245,158,11,0.12); color: #b45309; }
.activity-direct    { background: rgba(13,148,136,0.12); color: #0d9488; }

.table-card {
  background: var(--bg-card);
  border-radius: 10px;
  box-shadow: 0 1px 3px var(--shadow-color);
  overflow: auto;
}
.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.data-table thead tr {
  background: var(--bg-input);
  border-bottom: 2px solid var(--border-main);
  position: sticky;
  top: 0;
  z-index: 2;
}
.data-table th {
  padding: 12px 18px;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  white-space: nowrap;
}
.data-table tbody tr { border-bottom: 1px solid var(--border-main); transition: background 0.15s; }
.data-table tbody tr:last-child { border-bottom: none; }
.data-row:hover { background: var(--bg-nav-hover); }
.data-table td { padding: 13px 18px; vertical-align: middle; color: var(--text-primary); }
.td-no     { color: var(--text-muted); font-weight: 600; }
.td-muted  { color: var(--text-muted); font-size: 0.84rem; }
.td-center { text-align: center; padding: 40px; color: var(--text-muted); }
.td-actions { text-align: center; }
.td-note { color: var(--text-muted); max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mono { font-family: monospace; font-size: 0.8rem; }
.row-sales { display: flex; align-items: center; gap: 8px; }
.row-sales img { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; }
.row-sales span { font-weight: 600; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--text-muted); }
.empty-icon  { font-size: 2rem; opacity: 0.3; }
.act-btn {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1.5px solid;
  cursor: pointer;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s ease;
  margin: 0 2px;
  background: transparent;
}
.act-info         { color: #6366f1; border-color: #6366f1; }
.act-info:hover   { background: #6366f1; color: #fff; }

/* ===== PAGINATION ===== */
.pagination-card {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 14px 18px;
  box-shadow: 0 1px 3px var(--shadow-color);
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.pagination-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-prev-next {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  min-width: 85px;
  justify-content: center;
  transition: background 0.18s ease;
}
.btn-prev-next:hover:not(:disabled) { background: #4f46e5; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }

.page-badges { display: flex; gap: 8px; align-items: center; }
.page-badge {
  padding: 7px 14px;
  border: 1px solid var(--border-main);
  border-radius: 7px;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--bg-input);
  white-space: nowrap;
  letter-spacing: 0.04em;
}

/* ===== TAMPILAN MOBILE RESPONSIVE ===== */
@media (max-width: 900px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
  .td-note { max-width: 140px; }
  .timeline-grid, .duration-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 576px) {
  .pagination-card {
    flex-direction: column;
    padding: 12px;
    gap: 12px;
  }
  .pagination-nav {
    width: 100%;
    justify-content: space-between;
  }
  .btn-prev-next {
    flex: 1;
    max-width: 48%;
    padding: 10px 14px;
  }
  .page-badges {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }
  .page-badge {
    flex: 1;
    text-align: center;
    font-size: 0.7rem;
  }
}
@media (max-width: 520px) {
  .timeline-grid, .duration-grid { grid-template-columns: 1fr 1fr; }
}

.btn-cancel {
  padding: 8px 18px;
  background: var(--bg-main, #f1f5f9);
  color: var(--text-muted);
  border: 1px solid var(--border-main);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-cancel:hover { background: var(--border-main); color: var(--text-primary); }

.detail-list { display: flex; flex-direction: column; }
.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-main);
  gap: 12px;
}
.detail-row:last-child { border-bottom: none; }
.detail-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  white-space: nowrap;
}
.detail-value { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); text-align: right; }
.detail-value a { color: #6366f1; text-decoration: none; }
.detail-value a:hover { text-decoration: underline; }
.font-semibold { font-weight: 600; }
.ref-code-chip {
  font-family: monospace;
  font-size: 0.72rem;
  font-weight: 700;
  color: #6366f1;
  background: rgba(99,102,241,0.1);
  padding: 2px 8px;
  border-radius: 6px;
  white-space: nowrap;
}

/* ===== DETAIL AKTIVITAS ===== */
.detail-section-title { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.timeline-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.timeline-chip { background: var(--bg-input); border-radius: 8px; padding: 8px 10px; }
.timeline-chip-label { font-size: 0.68rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
.timeline-chip-value { font-size: 0.84rem; font-weight: 700; margin-top: 2px; }
.duration-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
.duration-chip { background: rgba(99,102,241,0.07); border-radius: 8px; padding: 8px 10px; text-align: center; }
.duration-chip-label { font-size: 0.66rem; color: var(--text-muted); font-weight: 600; }
.duration-chip-value { font-size: 0.86rem; font-weight: 800; color: #6366f1; margin-top: 2px; font-family: monospace; }
.visit-photo-img { width: 100%; max-height: 220px; object-fit: cover; border-radius: 10px; border: 1px solid var(--border-main); display: block; }
.result-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.result-chip { font-size: 0.7rem; font-weight: 700; padding: 3px 10px; border-radius: 20px; display: inline-block; }
.result-chip.improved { background: rgba(34,197,94,0.12); color: #16a34a; }
.result-chip.maintained { background: rgba(99,102,241,0.1); color: #6366f1; }
.result-chip.no_progress { background: rgba(239,68,68,0.1); color: #ef4444; }
.result-chip.deal { background: rgba(34,197,94,0.15); color: #15803d; }
.result-chip.status-pending { background: rgba(245,158,11,0.12); color: #b45309; }
.result-chip.status-done { background: rgba(34,197,94,0.12); color: #16a34a; }
.result-chip.status-cancelled { background: rgba(239,68,68,0.1); color: #ef4444; }
.result-chip.status-closed { background: rgba(100,116,139,0.12); color: #475569; }
.rich-text { font-size: 0.84rem; line-height: 1.5; color: var(--text-primary); }
.rich-text :deep(p) { margin: 0 0 6px; }
.rich-text :deep(p:last-child) { margin-bottom: 0; }
.rich-text :deep(ul), .rich-text :deep(ol) { margin: 0 0 6px; padding-left: 20px; }
.rich-text :deep(strong) { font-weight: 700; }
.rich-text :deep(a) { color: #6366f1; }
.alert-box { border-radius: 10px; padding: 10px 12px; font-size: 0.82rem; display: flex; gap: 8px; align-items: flex-start; }
.alert-danger { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
.alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
.next-visit-card { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); border-radius: 10px; padding: 10px 12px; }
.next-visit-row { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; }
.next-visit-date { font-weight: 700; color: #b45309; }
.next-visit-type { font-size: 0.7rem; font-weight: 700; background: rgba(245,158,11,0.15); color: #b45309; padding: 2px 8px; border-radius: 20px; }
.next-visit-notes { font-size: 0.8rem; color: var(--text-primary); margin-top: 4px; }
.checkout-file-link { display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #6366f1; text-decoration: none; }
.checkout-file-link:hover { text-decoration: underline; }
.empty-detail-note { font-size: 0.8rem; color: var(--text-muted); font-style: italic; }

.spinner-custom {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(99, 102, 241, 0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== SEGMENTED CONTROL PILL (tab tanggal) ===== */
.segment-group {
  display: flex;
  background: var(--bg-input);
  border: 1px solid var(--border-main);
  padding: 4px;
  border-radius: 30px;
  overflow-x: auto;
}
.segment-btn {
  flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  padding: 8px 14px;
  background: transparent;
  border: none;
  border-radius: 24px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  white-space: nowrap;
  text-align: center;
}
.segment-btn:hover:not(.active) {
  background: var(--bg-nav-hover);
}
.segment-btn.active {
  background: #6366f1;
  color: #ffffff;
  box-shadow: 0 3px 8px rgba(99, 102, 241, 0.35);
}
.segment-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--border-main); }
.segment-btn.active .segment-dot { background: rgba(255,255,255,0.85); }
.segment-btn.today.active .segment-dot { background: #22c55e; box-shadow: 0 0 0 3px rgba(255,255,255,0.35); }
</style>