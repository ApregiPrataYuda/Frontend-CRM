<template>
  <div class="visits-wrapper">

    <div class="vd-header-zone">
      <div class="vd-header-left">
        <div class="vd-icon-pulse">
          <font-awesome-icon icon="chart-column" class="btn-arrow" />
        </div>
        <div>
          <h4 class="vd-title">Data Visits</h4>
          <span class="vd-subtitle">Histori & real-time monitoring Activity sales field</span>
        </div>
      </div>
      <!-- <CButton 
        color="success" 
        @click="exportExcel" 
        :disabled="isExporting" 
        class="vd-btn-export action-glow"
      >
        <font-awesome-icon icon="cloud-arrow-down" class="me-2" />
        {{ isExporting ? 'Mengekspor...' : 'Export ke Excel' }}
      </CButton> -->
    </div>

    <div class="vd-stats-grid mb-4">
      <div class="vd-card-stat total">
        <div class="stat-icon"><font-awesome-icon icon="layer-group" /></div>
        <div class="stat-info">
          <span class="num">{{ visitPagination.total }}</span>
          <span class="label">Total Visit</span>
        </div>
      </div>
      <div class="vd-card-stat planned">
        <div class="stat-icon"><font-awesome-icon icon="calendar-day" /></div>
        <div class="stat-info">
          <span class="num">{{ visitStats.planned }}</span>
          <span class="label">Planned</span>
        </div>
      </div>
      <div class="vd-card-stat ongoing">
        <div class="stat-icon"><font-awesome-icon icon="gauge-high" /></div>
        <div class="stat-info">
          <span class="num">{{ visitStats.ongoing }}</span>
          <span class="label">Ongoing</span>
        </div>
      </div>
      <div class="vd-card-stat done">
        <div class="stat-icon"><font-awesome-icon icon="circle-check" /></div>
        <div class="stat-info">
          <span class="num">{{ visitStats.done }}</span>
          <span class="label">Done</span>
        </div>
      </div>
      <div class="vd-card-stat lead">
        <div class="stat-icon"><font-awesome-icon icon="user-plus" /></div>
        <div class="stat-info">
          <span class="num">{{ visitStats.lead }}</span>
          <span class="label">Lead Type</span>
        </div>
      </div>
      <div class="vd-card-stat customer">
        <div class="stat-icon"><font-awesome-icon icon="briefcase" /></div>
        <div class="stat-info">
          <span class="num">{{ visitStats.customer }}</span>
          <span class="label">Customer Type</span>
        </div>
      </div>
    </div>

    <CCard class="vd-glass-card mb-4">
      <CCardBody class="vd-filter-container">
        <div class="filter-left-group">
          <div class="vd-date-picker-range">
            <font-awesome-icon icon="calendar-days" class="icon-lead" />
            <input type="date" v-model="visitFilters.dateFrom" @change="onFilterChange" class="vd-minimal-input" />
            <span class="date-arrow"><font-awesome-icon icon="arrow-right" /></span>
            <input type="date" v-model="visitFilters.dateTo" @change="onFilterChange" class="vd-minimal-input" />
          </div>
          
          <div class="select-wrapper">
            <CFormSelect v-model="visitFilters.status" @change="onFilterChange" class="vd-modern-select" size="sm">
              <option value="">All Status</option>
              <option value="PLANNED">Planned</option>
              <option value="ONGOING">Ongoing</option>
              <option value="DONE">Done</option>
            </CFormSelect>
          </div>

          <div class="select-wrapper">
            <CFormSelect v-model="visitFilters.visitType" @change="onFilterChange" class="vd-modern-select" size="sm">
              <option value="">All Types</option>
              <option value="LEAD">Lead</option>
              <option value="CUSTOMER">Customer</option>
            </CFormSelect>
          </div>
        </div>

        <div class="filter-right-group">
          <div class="vd-search-wrapper">
            <font-awesome-icon icon="magnifying-glass" class="search-icon" />
            <input
              type="text"
              v-model="visitFilters.search"
              placeholder="Search for sales, company, or code..."
              @input="onSearch"
              class="vd-search-field"
            />
            <button v-if="visitFilters.search" class="clear-search-btn" @click="clearSearch">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>
        </div>
      </CCardBody>
    </CCard>

    <CCard class="vd-glass-card no-overflow mb-4">
      <CCardBody class="p-0">

        <div v-if="loadingVisitAll" class="vd-shimmer-loading">
          <CSpinner color="primary" variant="grow" class="mb-2" />
          <!-- <span class="loading-text">Loading...</span> -->
        </div>

        <div v-else class="table-responsive custom-scrollbar">
          <table class="vd-modern-table">
            <thead>
              <tr>
                <th @click="handleSort('visit_date')" class="sortable-th">
                  <span>Date Visit</span>
                  <font-awesome-icon :icon="sortIconName('visit_date')" :class="['sort-icon', sortIconClass('visit_date')]" />
                </th>
                <th>Code Visit</th>
                <th @click="handleSort('company_name')" class="sortable-th">
                  <span>Company</span>
                  <font-awesome-icon :icon="sortIconName('company_name')" :class="['sort-icon', sortIconClass('company_name')]" />
                </th>
                <th>Sales Representative</th>
                <th>Type</th>
                <th>Progress</th>
                <th>Check-in</th>
                <th @click="handleSort('check_out')" class="sortable-th">
                  <span>Check-out</span>
                  <font-awesome-icon :icon="sortIconName('check_out')" :class="['sort-icon', sortIconClass('check_out')]" />
                </th>
                <th>Duration</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="visitAllData.length === 0">
                <td colspan="10" class="vd-empty-state">
                  <div class="empty-box">
                    <font-awesome-icon icon="folder-open" class="empty-icon animate-bounce" />
                    <h5>Belum Ada Data Kunjungan</h5>
                    <p>Sesuaikan filter waktu atau kata kunci pencarian Anda.</p>
                  </div>
                </td>
              </tr>
              <tr
                v-for="visit in visitAllData"
                :key="visit.id"
                class="vd-interactive-row"
                @click="openDetail(visit)"
              >
                <td>
                  <div class="date-cell">
                    <span class="primary-date">{{ formatDate(visit.visit_at) }}</span>
                    <span class="sub-time">
                      <font-awesome-icon icon="clock" class="me-1" />{{ formatTimeOnly(visit.visit_at) }}
                    </span>
                  </div>
                </td>
                <td>
                  <span class="vd-badge-code">{{ visit.visit_code }}</span>
                </td>
                <td>
                  <div class="company-cell">
                    <span class="comp-name">{{ visit.company_name }}</span>
                    <span class="client-contact">
                      <font-awesome-icon icon="user" class="me-1" />{{ visit.target_contact || 'N/A' }}
                    </span>
                  </div>
                </td>
                <td>
                  <div class="sales-profile-cell">
                    <div class="avatar-initial">{{ visit.sales_name?.charAt(0).toUpperCase() }}</div>
                    <span class="sales-name">{{ visit.sales_name }}</span>
                  </div>
                </td>
                <td>
                  <span :class="['pill-tag', visit.visit_type === 'LEAD' ? 'tag-lead' : 'tag-customer']">
                    {{ visit.visit_type }}
                  </span>
                </td>
                <td>
                  <span :class="['status-dot-badge', progressColorClass(visit.visit_progress)]">
                    <span class="dot"></span>
                    {{ visit.visit_progress }}
                  </span>
                </td>
                <td class="mono-time">{{ formatTimeOnly(visit.check_in_at) ?? '—' }}</td>
                <td class="mono-time">{{ formatTimeOnly(visit.check_out_at) ?? '—' }}</td>
                <td>
                  <span class="duration-badge" v-if="visit.total_time_result">
                    <font-awesome-icon icon="clock-rotate-left" class="me-1" />{{ visit.total_time_result }}
                  </span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td class="text-center" @click.stop>
                  <CButton
                    color="light"
                    class="vd-btn-action"
                    @click="openDetail(visit)"
                    title="Buka Detail Kunjungan"
                  >
                    <font-awesome-icon icon="chevron-right" class="text-primary" />
                  </CButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </CCardBody>
    </CCard>

    <CCard class="vd-glass-card">
      <CCardBody class="vd-pagination-wrapper">
        <div class="pagination-info text-secondary">
          Displaying <span class="text-dark fw-semibold">{{ visitPaginationFrom }}</span> – <span class="text-dark fw-semibold">{{ visitPaginationTo }}</span> of <span class="text-dark fw-semibold">{{ visitPagination.total }}</span> data
        </div>
        <div class="pagination-controls-group">
          <div class="per-page-selector me-2">
            <span class="label-sm me-2">Rows:</span>
            <CFormSelect v-model="visitFilters.perPage" @change="onFilterChange" class="vd-select-inline" size="sm">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </CFormSelect>
          </div>
          
          <div class="pagination-buttons">
            <button :disabled="visitPagination.currentPage <= 1" @click="goPage(1)" class="pg-nav-btn">
              <font-awesome-icon icon="angles-left" />
            </button>
            <button :disabled="visitPagination.currentPage <= 1" @click="goPage(visitPagination.currentPage - 1)" class="pg-nav-btn">
              <font-awesome-icon icon="angle-left" />
            </button>
            <div class="page-indicator">
              <span>{{ visitPagination.currentPage }}</span> / <span class="total-pgs">{{ visitPagination.lastPage }}</span>
            </div>
            <button :disabled="visitPagination.currentPage >= visitPagination.lastPage" @click="goPage(visitPagination.currentPage + 1)" class="pg-nav-btn">
              <font-awesome-icon icon="angle-right" />
            </button>
            <button :disabled="visitPagination.currentPage >= visitPagination.lastPage" @click="goPage(visitPagination.lastPage)" class="pg-nav-btn">
              <font-awesome-icon icon="angles-right" />
            </button>
          </div>
        </div>
      </CCardBody>
    </CCard>

    <CModal
      :visible="!!selectedVisit"
      @close="selectedVisit = null"
      size="lg"
      alignment="center"
      scrollable
      class="vd-modern-modal"
    >
      <CModalHeader class="border-0 pb-0">
        <CModalTitle class="vd-modal-header-title">
          <span class="modal-code-tag">{{ selectedVisit?.visit_code }}</span>
          <span v-if="selectedVisit" :class="['status-dot-badge ms-3', progressColorClass(selectedVisit.visit_progress)]">
            <span class="dot"></span> {{ selectedVisit?.visit_progress }}
          </span>
        </CModalTitle>
      </CModalHeader>

      <CModalBody v-if="selectedVisit" class="vd-modal-modern-body pt-2">

        <div v-if="selectedVisit.photo_url" class="vd-modal-banner-image mb-4">
          <img :src="selectedVisit.photo_url" alt="Foto Bukti Check-in" />
          <div class="image-overlay-label">Dokumentasi Check-in Lapangan</div>
        </div>

        <CRow class="g-4">
          <CCol :md="6">
            <div class="modal-info-section h-100">
              <div class="section-heading">
                <font-awesome-icon icon="building" class="icon-dec" />
                <h5>Profil Institusi & Kontak</h5>
              </div>
              <div class="info-item-box">
                <label>Nama Perusahaan</label>
                <div class="value-content fw-bold text-dark d-flex align-items-center">
                  <span :class="['pill-tag me-2 scale-85', selectedVisit.visit_type === 'LEAD' ? 'tag-lead' : 'tag-customer']">
                    {{ selectedVisit.visit_type }}
                  </span>
                  {{ selectedVisit.company_name }}
                </div>
              </div>
              <div class="info-item-box">
                <label>PIC / Person In Charge</label>
                <div class="value-content">{{ selectedVisit.target_contact ?? '—' }}</div>
              </div>
              <div class="info-item-box">
                <label>No. Telepon Aktif</label>
                <div class="value-content text-primary">
                  <font-awesome-icon icon="phone" class="me-2 opacity-50" />{{ selectedVisit.target_phone ?? '—' }}
                </div>
              </div>
              <div class="info-item-box">
                <label>Alamat Target Kunjungan</label>
                <div class="value-content text-secondary-dim text-sm">{{ selectedVisit.target_address ?? '—' }}</div>
              </div>
            </div>
          </CCol>

          <CCol :md="6">
            <div class="modal-info-section h-100">
              <div class="section-heading">
                <font-awesome-icon icon="stopwatch" class="icon-dec" />
                <h5>Log Timeline Kunjungan</h5>
              </div>
              <div class="info-item-box">
                <label>Sales Officer</label>
                <div class="value-content fw-semibold">
                  <font-awesome-icon icon="user" class="me-2 text-muted" />{{ selectedVisit.sales_name }}
                </div>
              </div>
              <div class="info-item-box">
                <label>Estimasi Jadwal Rencana</label>
                <div class="value-content">
                  <font-awesome-icon icon="calendar" class="me-2 text-muted" />{{ formatDateTime(selectedVisit.visit_at) }}
                </div>
              </div>
              <div class="info-item-box">
                <label>Waktu Check-In Absen</label>
                <div class="value-content text-success">
                  <font-awesome-icon icon="right-to-bracket" class="me-2 text-success" />{{ formatDateTime(selectedVisit.check_in_at) ?? '—' }}
                </div>
              </div>
              <div class="info-item-box">
                <label>Waktu Check-Out Selesai</label>
                <div class="value-content text-danger">
                  <font-awesome-icon icon="right-from-bracket" class="me-2 text-danger" />{{ formatDateTime(selectedVisit.check_out_at) ?? '—' }}
                </div>
              </div>
              <div class="info-item-box highlight-duration">
                <label>Total Durasi Pertemuan</label>
                <div class="value-content text-indigo fw-bold">
                  <font-awesome-icon icon="stopwatch" class="me-2" />{{ selectedVisit.total_time_result ?? '—' }}
                </div>
              </div>
            </div>
          </CCol>
        </CRow>

        <div class="modal-info-section full-width mt-4">
          <div class="section-heading">
            <font-awesome-icon icon="list-check" class="icon-dec" />
            <h5>Hasil Lapangan & Catatan Feedback</h5>
          </div>
          
          <CRow class="g-3">
            <CCol :md="12">
              <div class="info-item-box inner-grey">
                <label>Titik Koordinat GPS Snapshot</label>
                <div class="value-content text-monospace text-xs text-primary">
                  <font-awesome-icon icon="location-dot" class="me-1" />{{ selectedVisit.gps_snapshot ?? '—' }}
                </div>
              </div>
            </CCol>
            <CCol :md="6">
              <div class="info-item-box inner-grey">
                <label>Deskripsi Notes Ringkas</label>
                <div class="value-content text-sm">{{ selectedVisit.notes ?? '—' }}</div>
              </div>
            </CCol>
            <CCol :md="6">
              <div class="info-item-box inner-grey">
                <label>Kesimpulan Hasil Visit</label>
                <div class="value-content text-sm text-dark fw-medium">{{ selectedVisit.visit_result ?? '—' }}</div>
              </div>
            </CCol>
            <CCol :md="12">
              <div class="info-item-box inner-grey">
                <label>Tanggapan & Respon Customer</label>
                <div class="value-content text-sm italic">"{{ selectedVisit.customer_response ?? 'Tidak ada respon spesifik tertulis' }}"</div>
              </div>
            </CCol>
            
            <CCol :md="6">
              <div :class="['alert-indicator-box', selectedVisit.has_complaint ? 'danger-zone' : 'success-zone']">
                <div class="indicator-header">
                  <span class="label">Terdapat Keluhan/Komplain?</span>
                  <span :class="['badge-status-pill', selectedVisit.has_complaint ? 'danger' : 'success']">
                    {{ selectedVisit.has_complaint ? 'Ya' : 'Tidak Ada' }}
                  </span>
                </div>
                <p v-if="selectedVisit.complaint_detail" class="indicator-desc">{{ selectedVisit.complaint_detail }}</p>
              </div>
            </CCol>

            <CCol :md="6">
              <div :class="['alert-indicator-box', selectedVisit.has_potential_order ? 'success-zone' : 'secondary-zone']">
                <div class="indicator-header">
                  <span class="label">Memiliki Potensi Order?</span>
                  <span :class="['badge-status-pill', selectedVisit.has_potential_order ? 'success' : 'secondary']">
                    {{ selectedVisit.has_potential_order ? 'Ya' : 'Tidak' }}
                  </span>
                </div>
                <p v-if="selectedVisit.potential_order_detail" class="indicator-desc">{{ selectedVisit.potential_order_detail }}</p>
              </div>
            </CCol>
          </CRow>
        </div>

      </CModalBody>

      <CModalFooter class="border-0 pt-0">
        <CButton color="light" class="border" @click="selectedVisit = null">
          Tutup
        </CButton>
      </CModalFooter>
    </CModal>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useHomeFrontendStore } from '@/stores/homeFrontendStore'

// ─── STORE ───────────────────────────────────────────────────────────
const store = useHomeFrontendStore()

const {
  visitAllData,
  visitPagination,
  visitFilters,
  visitStats,
  visitPaginationFrom,
  visitPaginationTo,
  loadingVisitAll,
} = storeToRefs(store)

const {
  fetchVisitAllData,
  fetchVisitAllDataExport,
  setVisitFilter,
  setVisitSort,
  setVisitPage,
} = store

// ─── LOCAL STATE ─────────────────────────────────────────────────────
const isExporting   = ref(false)
const selectedVisit = ref(null)

// ─── HELPERS ─────────────────────────────────────────────────────────
const formatDate = (dt) => {
  if (!dt) return '-'
  return new Date(dt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatTimeOnly = (dt) => {
  if (!dt) return null
  return new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

const formatDateTime = (dt) => {
  if (!dt) return null
  return new Date(dt).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Menghubungkan teks status ke CSS Modern badge
const progressColorClass = (progress) => {
  if (progress === 'PLANNED') return 'badge-planned'
  if (progress === 'ONGOING') return 'badge-ongoing'
  if (progress === 'DONE')    return 'badge-done'
  return 'badge-secondary'
}

// FontAwesome Dynamic Icon Sorting Handler
const sortIconName = (col) => {
  if (visitFilters.value.sortBy !== col) return 'sort'
  return visitFilters.value.sortDir === 'asc' ? 'sort-up' : 'sort-down'
}

const sortIconClass = (col) => {
  if (visitFilters.value.sortBy !== col) return 'op-3'
  return 'text-primary'
}

// ─── FILTER HANDLERS ─────────────────────────────────────────────────
const onFilterChange = () => {
  visitFilters.value.page = 1
  fetchVisitAllData()
}

// ─── SEARCH DEBOUNCE ─────────────────────────────────────────────────
let searchTimer = null
const onSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    visitFilters.value.page = 1
    fetchVisitAllData()
  }, 400)
}

const clearSearch = () => {
  visitFilters.value.search = ''
  visitFilters.value.page   = 1
  fetchVisitAllData()
}

// ─── SORT & PAGINATION ───────────────────────────────────────────────
const handleSort = (col) => setVisitSort(col)
const goPage = (page) => setVisitPage(page)
const openDetail = (visit) => { selectedVisit.value = visit }

// ─── EXPORT CSV ──────────────────────────────────────────────────────
const exportExcel = async () => {
  isExporting.value = true
  try {
    const rows = await fetchVisitAllDataExport()
    const headers = [
      'Kode Visit', 'Tanggal Visit', 'Perusahaan', 'Kontak', 'Telepon',
      'Sales', 'Type', 'Progress', 'Check-in', 'Check-out', 'Durasi',
      'Alamat', 'Notes', 'Hasil Visit', 'Respon Customer',
    ]
    const csvRows = [
      headers.join(';'),
      ...rows.map(v => [
        v.visit_code,
        formatDateTime(v.visit_at),
        v.company_name,
        v.target_contact    ?? '',
        v.target_phone      ?? '',
        v.sales_name,
        v.visit_type,
        v.visit_progress,
        formatDateTime(v.check_in_at)  ?? '',
        formatDateTime(v.check_out_at) ?? '',
        v.total_time_result ?? '',
        v.target_address    ?? '',
        v.notes             ?? '',
        v.visit_result      ?? '',
        v.customer_response ?? '',
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(';')),
    ]

    const csvContent = '\uFEFF' + csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href     = url
    link.download = `visit-data-${visitFilters.value.dateFrom}-to-${visitFilters.value.dateTo}.csv`
    link.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('exportExcel error:', e)
  } finally {
    isExporting.value = false
  }
}

onMounted(() => fetchVisitAllData())
</script>

<style scoped>
/* ─── DESIGN TOKENS & WRAPPER ──────────────────────────────── */
.visits-wrapper {
  padding: 32px;
  background-color: #f4f6fa;
  min-height: 100vh;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #1e293b;
}

/* ─── HEADER BAR (Glassmorphic Dark Mode Feel) ───────────────── */
/* ─── HEADER BAR (Premium Purple Feel) ───────────────── */
.vd-header-zone {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  padding: 24px 32px;
  border-radius: 20px;
  /* Menggunakan gradasi ungu modern */
  background: linear-gradient(135deg, #6366f1 0%, #6366f1 100%);
  color: #ffffff;
  /* Shadow disesuaikan dengan tone ungu */
  box-shadow: 0 20px 25px -5px rgba(76, 29, 149, 0.3), 0 8px 10px -6px rgba(76, 29, 149, 0.2);
  margin-bottom: 28px;
}

.vd-header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* Mengubah icon pulse menjadi putih semi-transparan agar menyatu dengan background ungu */
.vd-icon-pulse {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #ffffff;
}

.vd-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
}

/* Mengubah warna subtitle menjadi ungu muda agar lebih terbaca */
.vd-subtitle {
  color: #e9d5ff; 
  font-size: 13px;
}

.vd-btn-export {
  background: #10b981 !important;
  border: none !important;
  border-radius: 12px;
  padding: 12px 22px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
}
.action-glow:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4);
}

/* ─── KARTU GLASSMORPHISM ───────────────────────────────────── */
.vd-glass-card {
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 10px 15px -3px rgba(148, 163, 184, 0.08);
  transition: box-shadow 0.3s ease;
}
.vd-glass-card.no-overflow {
  overflow: hidden;
}

/* ─── DASHBOARD METRICS GRID ────────────────────────────────── */
.vd-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.vd-card-stat {
  background: #ffffff;
  padding: 20px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 10px 15px -3px rgba(148, 163, 184, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}
.vd-card-stat:hover {
  transform: translateY(-3px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
}

.vd-card-stat .stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.vd-card-stat .num {
  font-size: 26px;
  font-weight: 800;
  display: block;
  line-height: 1.1;
  color: #0f172a;
}
.vd-card-stat .label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

/* Variasi Warna Sisi Border Stat Metric */
.vd-card-stat.total { border-left: 4px solid #64748b; }
.vd-card-stat.total .stat-icon { background: #f1f5f9; color: #64748b; }

.vd-card-stat.planned { border-left: 4px solid #f59e0b; }
.vd-card-stat.planned .stat-icon { background: #fef3c7; color: #d97706; }

.vd-card-stat.ongoing { border-left: 4px solid #06b6d4; }
.vd-card-stat.ongoing .stat-icon { background: #ecfeff; color: #0891b2; }

.vd-card-stat.done { border-left: 4px solid #10b981; }
.vd-card-stat.done .stat-icon { background: #d1fae5; color: #059669; }

.vd-card-stat.lead { border-left: 4px solid #4f46e5; }
.vd-card-stat.lead .stat-icon { background: #e0e7ff; color: #4f46e5; }

.vd-card-stat.customer { border-left: 4px solid #8b5cf6; }
.vd-card-stat.customer .stat-icon { background: #f3e8ff; color: #7c3aed; }

/* ─── FILTER CONTROLS ───────────────────────────────────────── */
.vd-filter-container {
  padding: 16px 24px !important;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-left-group, .filter-right-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Date Range Minimalis */
.vd-date-picker-range {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 6px 14px;
}
.vd-date-picker-range .icon-lead {
  color: #94a3b8;
  margin-right: 8px;
}
.vd-date-picker-range .date-arrow {
  padding: 0 8px;
  color: #94a3b8;
  font-size: 12px;
}
.vd-minimal-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  color: #334155;
  font-weight: 500;
}

/* Dropdown Select Modern */
.vd-modern-select {
  border-radius: 12px !important;
  border: 1px solid #cbd5e1 !important;
  background-color: #ffffff !important;
  font-size: 13px !important;
  padding: 8px 32px 8px 12px !important;
  font-weight: 500;
  color: #334155;
  min-width: 140px;
}
.vd-modern-select:focus {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

/* Kolom Pencarian Global */
.vd-search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 300px;
}
.vd-search-wrapper .search-icon {
  position: absolute;
  left: 14px;
  color: #94a3b8;
  font-size: 14px;
}
.vd-search-field {
  width: 100%;
  padding: 8px 40px 8px 38px;
  font-size: 13px;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  outline: none;
  transition: all 0.2s ease;
}
.vd-search-field:focus {
  border-color: #3b82f6;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.clear-search-btn {
  position: absolute;
  right: 12px;
  border: none;
  background: none;
  color: #94a3b8;
}

/* ─── TABEL MODERN DENGAN DESIGN PREMIUM ────────────────────── */
.vd-modern-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
}

.vd-modern-table th {
  background: #f8fafc;
  padding: 16px 20px;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e2e8f0;
}

.vd-modern-table td {
  padding: 18px 20px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  color: #334155;
}

/* Animasi & Interaksi Row Table */
.vd-interactive-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.vd-interactive-row:hover {
  background-color: #f8fafc;
}

/* Penyusunan Teks di Kolom */
.sortable-th { cursor: pointer; }
.sortable-th:hover { color: #2563eb; }
.sort-icon { margin-left: 6px; font-size: 11px; }
.op-3 { opacity: 0.3; }

.date-cell .primary-date { font-weight: 600; display: block; color: #0f172a; }
.date-cell .sub-time { font-size: 12px; color: #94a3b8; }

.vd-badge-code {
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
}

.company-cell .comp-name { font-weight: 600; display: block; color: #0f172a; }
.company-cell .client-contact { font-size: 12px; color: #64748b; }

/* Profil Lingkaran Inisial Sales */
.sales-profile-cell { display: flex; align-items: center; gap: 10px; }
.avatar-initial {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sales-name { font-weight: 500; }

/* Komponen Tags */
.pill-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  letter-spacing: 0.3px;
}
.tag-lead { background: #e0e7ff; color: #4338ca; }
.tag-customer { background: #ccfbf1; color: #0f766e; }

/* Status Absen Dot Pulse */
.status-dot-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
}
.status-dot-badge .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.badge-planned { background: #fffbeb; color: #b45309; }
.badge-planned .dot { background: #f59e0b; }

.badge-ongoing { background: #ecfeff; color: #0369a1; }
.badge-ongoing .dot { background: #06b6d4; }

.badge-done { background: #f0fdf4; color: #15803d; }
.badge-done .dot { background: #10b981; }

.mono-time { font-family: monospace; font-size: 13px; font-weight: 500; }

.duration-badge {
  background: #f5f3ff;
  color: #6d28d9;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.vd-btn-action {
  border: 1px solid #e2e8f0 !important;
  background: #ffffff !important;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 10px;
}
.vd-btn-action:hover {
  background: #e0e7ff !important;
}

/* Empty View */
.vd-empty-state { padding: 60px 0 !important; text-align: center; }
.empty-box h5 { margin-top: 16px; font-weight: 700; color: #475569; }
.empty-box p { color: #94a3b8; font-size: 14px; }
.empty-icon { font-size: 44px; color: #cbd5e1; }

/* Shimmer Loader */
.vd-shimmer-loading {
  padding: 80px 0;
  text-align: center;
  color: #64748b;
}

/* ─── NAVIGATION PAGINATION ────────────────────────────────── */
.vd-pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px !important;
  flex-wrap: wrap;
  gap: 16px;
}
.pagination-controls-group { display: flex; align-items: center; }
.vd-select-inline {
  width: 75px !important;
  display: inline-block !important;
  border-radius: 8px !important;
}
.pagination-buttons {
  display: flex;
  align-items: center;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #ffffff;
  overflow: hidden;
}
.pg-nav-btn {
  border: none;
  background: none;
  padding: 8px 12px;
  color: #64748b;
  transition: background 0.2s;
}
.pg-nav-btn:hover:not(:disabled) { background: #f1f5f9; color: #000; }
.pg-nav-btn:disabled { opacity: 0.3; }
.page-indicator {
  padding: 0 14px;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  border-left: 1px solid #cbd5e1;
  border-right: 1px solid #cbd5e1;
}
.total-pgs { color: #94a3b8; }

/* ─── MODAL DETAIL BARU (Premium Look) ─────────────────────── */
.vd-modal-header-title { display: flex; align-items: center; }
.modal-code-tag {
  font-family: monospace;
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
}
.vd-modal-banner-image {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  max-height: 240px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
}
.vd-modal-banner-image img { width: 100%; height: 100%; object-fit: cover; }
.image-overlay-label {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  color: #fff;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
}

.modal-info-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
}
.modal-info-section .section-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.modal-info-section .section-heading h5 { margin: 0; font-size: 15px; font-weight: 700; }
.icon-dec { color: #4f46e5; font-size: 18px; }

.info-item-box {
  margin-bottom: 12px;
}
.info-item-box:last-child { margin-bottom: 0; }
.info-item-box label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.3px;
  margin-bottom: 2px;
  display: block;
}
.info-item-box .value-content { color: #334155; font-weight: 500; font-size: 14px; }
.highlight-duration {
  background: #eff6ff;
  padding: 10px;
  border-radius: 10px;
}

.inner-grey {
  background: #ffffff;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

/* Alert Boxes */
.alert-indicator-box {
  padding: 14px;
  border-radius: 12px;
  height: 100%;
}
.alert-indicator-box .indicator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.alert-indicator-box .label { font-size: 12px; font-weight: 600; }
.alert-indicator-box .indicator-desc { font-size: 13px; margin: 0; color: #475569; }

.danger-zone { background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; }
.success-zone { background: #f0fdf4; border: 1px solid #86efac; color: #166534; }
.secondary-zone { background: #f8fafc; border: 1px solid #cbd5e1; color: #475569; }

.badge-status-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}
.badge-status-pill.danger { background: #ef4444; color: #fff; }
.badge-status-pill.success { background: #22c55e; color: #fff; }
.badge-status-pill.secondary { background: #94a3b8; color: #fff; }

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar { height: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

/* ─── MEDIA QUERIES RESPONSIVE ─────────────────────────────── */
@media (max-width: 992px) {
  .vd-filter-container { flex-direction: column; align-items: stretch; }
  .filter-left-group, .filter-right-group { width: 100%; }
  .vd-search-wrapper { min-width: 100%; }
}

@media (max-width: 768px) {
  .visits-wrapper { padding: 16px; }
  .vd-header-zone { padding: 16px 20px; }
  .vd-title { font-size: 18px; }
  .vd-pagination-wrapper { flex-direction: column; align-items: flex-start; }
}
</style>