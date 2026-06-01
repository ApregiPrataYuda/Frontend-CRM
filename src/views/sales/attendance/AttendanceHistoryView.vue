<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAttendanceReportHistory } from '@/stores/attendanceReportHistoryStore'
import { storeToRefs } from 'pinia'

const router = useRouter()
const store = useAttendanceReportHistory()

const { historyData, loading, error, pagination, search, perPage,
        detailData, loadingDetail, previewPhoto,
        isEmpty, hasPrev, hasNext } = storeToRefs(store)

// Destructure function langsung dari store
const {
  fetchMyHistory, fetchDetail, clearDetail,
  openPhotoPreview, closePhotoPreview,
  prevPage, nextPage, goToPage,
  onSearchChange, onPerPageChange, resetFilters,
  getAttendanceTypeConfig,   
  getStatusConfig,
  getDeviceConfig,
  shortLocation,
  formatDate,
  formatTime,
} = store  

onMounted(() => store.fetchMyHistory())

// ── Photo modal ──
const showPhotoModal = ref(false)

function openPhoto(url) {
  store.openPhotoPreview(url)
  showPhotoModal.value = true
}
function closePhoto() {
  store.closePhotoPreview()
  showPhotoModal.value = false
}

// ── Detail modal ──
const showDetailModal = ref(false)

async function openDetail(id) {
  showDetailModal.value = true
  await store.fetchDetail(id)
}
function closeDetail() {
  showDetailModal.value = false
  store.clearDetail()
}

// ── Photo URL helper ──
function photoUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path  // ← kalau sudah full URL (dari /show)
  return `${import.meta.env.VITE_STORAGE_URL}/attendance/photos/${path}` // ← filename only
}
</script>

<template>
  <div class="attendance-page">

    <!-- ═══ HEADER ═══ -->
    <div class="hero-card">
      <div class="hero-inner">
        <div>
          <h4>Riwayat Absensi Saya</h4>
          <p>Data absensi akun yang sedang login</p>
        </div>
        <button class="btn-export">
          <i class="fa-solid fa-file-excel me-1"></i> Export Excel
        </button>
      </div>
    </div>

    <!-- ═══ SUMMARY ═══ -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-label">Total Record</div>
        <div class="summary-value text-indigo">{{ pagination.total }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Check In</div>
        <div class="summary-value text-green">
          {{ historyData.filter(r => r.attendance_type === 'IN').length }}
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Check Out</div>
        <div class="summary-value text-red">
          {{ historyData.filter(r => r.attendance_type === 'OUT').length }}
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Terlambat</div>
        <div class="summary-value text-yellow">
          {{ historyData.filter(r => r.attendance_status === 'LATE').length }}
        </div>
      </div>
    </div>

    <!-- ═══ TABLE CARD ═══ -->
    <div class="table-card">

      <!-- FILTER -->
      <div class="filter-bar">
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input
            v-model="search"
            @input="store.onSearchChange()"
            type="text"
            placeholder="Cari tanggal, lokasi, device..."
            class="search-input"
          />
        </div>

        <select v-model="perPage" @change="store.onPerPageChange()" class="select-input">
          <option :value="10">10</option>
          <option :value="15">15</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
        </select>

        <div class="filter-actions">
          <button @click="store.resetFilters()" class="btn-reset">Reset</button>
          <button @click="router.back()" class="btn-back">← Back</button>
        </div>
      </div>

      <!-- ERROR -->
      <div v-if="error" class="error-banner">
        <i class="fa-solid fa-circle-exclamation"></i>
        {{ error }}
        <button @click="store.fetchMyHistory()">Coba lagi</button>
      </div>

      <!-- TABLE -->
      <div class="table-wrap">
        <table class="attendance-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal</th>
              <th>Waktu</th>
              <th>Tipe</th>
              <th>Status</th>
              <th>Lokasi</th>
              <th>Device</th>
              <th>Foto</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>

            <!-- LOADING -->
            <tr v-if="loading">
              <td colspan="9" class="state-cell">
                <div class="spinner"></div>
                <span>Memuat data...</span>
              </td>
            </tr>

            <!-- EMPTY -->
            <tr v-else-if="isEmpty">
              <td colspan="9" class="state-cell">
                <div class="empty-icon">📭</div>
                <p>Belum ada riwayat absensi</p>
                <small>Coba ubah filter pencarian</small>
              </td>
            </tr>

            <!-- DATA ROWS -->
            <tr
              v-else
              v-for="(row, index) in historyData"
              :key="row.id"
              class="data-row"
              @click="openDetail(row.id)"
            >
              <!-- No -->
              <td class="td-center text-gray">
                {{ index + 1 + perPage * (pagination.current_page - 1) }}
              </td>

              <!-- Tanggal -->
              <td>
                <div class="font-semibold">{{ store.formatDate(row.attendance_date) }}</div>
                <div v-if="row.attendance_mode" class="badge badge-purple mt-1">
                  {{ row.attendance_mode }}
                </div>
              </td>

              <!-- Waktu -->
              <td class="td-center">
                {{ store.formatTime(row.attendance_time) }}
              </td>

              <!-- Tipe -->
              <td class="td-center" @click.stop>
                <span class="badge text-dark" :class="getAttendanceTypeConfig(row.attendance_type).bg">
                  {{ getAttendanceTypeConfig(row.attendance_type).label }}
                </span>
              </td>

              <!-- Status -->
              <td class="td-center" @click.stop>
                <span class="badge text-dark" :class="store.getStatusConfig(row.attendance_status).bg">
                  {{ store.getStatusConfig(row.attendance_status).label }}
                </span>
              </td>

              <!-- Lokasi -->
              <td class="td-location" :title="row.location_name">
                <!-- {{ store.shortLocation(row.location_name) }} -->
                {{ row.location_name }}
              </td>

              <!-- Device -->
              <td class="td-center" @click.stop>
                <span class="badge text-dark" :class="store.getDeviceConfig(row.device_type).bg">
                  {{ store.getDeviceConfig(row.device_type).label }}
                </span>
              </td>

              <!-- Foto -->
              <td class="td-center" @click.stop>
                <img
                  v-if="row.photo_path"
                  :src="photoUrl(row.photo_path)"
                  @click="openPhoto(photoUrl(row.photo_path))"
                  class="thumb"
                  alt="foto"
                />
                <span v-else class="text-gray">—</span>
              </td>

              <!-- Aksi -->
              <td class="td-center" @click.stop>
                <button @click="openDetail(row.id)" class="btn-detail">
                   <font-awesome-icon icon="circle-info" />
                </button>
              </td>
            </tr>

          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div class="pagination-bar">
        <span class="text-gray text-sm">
          Total {{ pagination.total }} data &nbsp;|&nbsp;
          Hal {{ pagination.current_page }} / {{ pagination.last_page }}
        </span>

        <div class="page-btns">
          <button
            @click="store.prevPage()"
            :disabled="!hasPrev"
            :class="['btn-page', !hasPrev && 'disabled']"
          >←</button>

          <button
            v-for="p in pagination.last_page"
            :key="p"
            @click="store.goToPage(p)"
            :class="['btn-page', p === pagination.current_page && 'active']"
          >{{ p }}</button>

          <button
            @click="store.nextPage()"
            :disabled="!hasNext"
            :class="['btn-page', !hasNext && 'disabled']"
          >→</button>
        </div>
      </div>

    </div>


    <!-- ═══ MODAL DETAIL ═══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDetailModal" class="modal-overlay" @click="closeDetail">
          <div class="modal-box" @click.stop>

            <!-- Loading -->
            <div v-if="loadingDetail" class="modal-loading">
              <div class="spinner"></div>
              <span>Memuat detail...</span>
            </div>

            <template v-else-if="detailData">

              <!-- Banner -->
              <div class="modal-banner">
                <button @click="closeDetail" class="modal-close">✕</button>
                <p class="modal-eyebrow">Detail Absensi</p>
                <h2 class="modal-name">{{ detailData.user?.fullname ?? '-' }}</h2>
                <p class="modal-nik">NIK: {{ detailData.employee?.nik ?? '-' }}</p>
                <div class="modal-badges">
                  <span class="badge" :class="store.getAttendanceTypeConfig(detailData.attendance_type).bg">
                    {{ store.getAttendanceTypeConfig(detailData.attendance_type).label }}
                  </span>
                  <span class="badge" :class="store.getStatusConfig(detailData.attendance_status).bg">
                    {{ store.getStatusConfig(detailData.attendance_status).label }}
                  </span>
                </div>
              </div>

              <!-- Body -->
              <div class="modal-body">

                <!-- Waktu -->
                <div class="modal-section">
                  <div class="section-title text-indigo">⏰ Waktu</div>
                  <div class="detail-grid">
                    <div>
                      <div class="detail-label">Tanggal</div>
                      <div class="detail-val">{{ store.formatDate(detailData.attendance_date) }}</div>
                    </div>
                    <div>
                      <div class="detail-label">Waktu</div>
                      <div class="detail-val">{{ store.formatTime(detailData.attendance_time) }}</div>
                    </div>
                    <div>
                      <div class="detail-label">Mode</div>
                      <span class="badge badge-purple">{{ detailData.attendance_mode ?? '-' }}</span>
                    </div>
                    <div>
                      <div class="detail-label">Device</div>
                      <span class="badge" :class="store.getDeviceConfig(detailData.device_type).bg">
                        {{ store.getDeviceConfig(detailData.device_type).label }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Lokasi -->
                <div class="modal-section">
                  <div class="section-title text-green">📍 Lokasi</div>
                  <div class="detail-box">
                    <div class="detail-label">Alamat</div>
                    <div class="detail-val">{{ detailData.location_name ?? '-' }}</div>
                    <div class="detail-grid mt-2">
                      <div>
                        <div class="detail-label">Latitude</div>
                        <div class="detail-mono">{{ detailData.latitude ?? '-' }}</div>
                      </div>
                      <div>
                        <div class="detail-label">Longitude</div>
                        <div class="detail-mono">{{ detailData.longitude ?? '-' }}</div>
                      </div>
                      <div>
                        <div class="detail-label">Akurasi</div>
                        <div class="detail-val">{{ detailData.accuracy ? detailData.accuracy + ' m' : '-' }}</div>
                      </div>
                      <div>
                        <div class="detail-label">Policy</div>
                        <span class="badge"
                          :class="detailData.policy_status === 'ALLOWED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600'">
                          {{ detailData.policy_status ?? '-' }}
                        </span>
                      </div>
                    </div>
                    <div v-if="detailData.policy_reason" class="mt-2">
                      <div class="detail-label">Policy Reason</div>
                      <div class="detail-val">{{ detailData.policy_reason }}</div>
                    </div>
                  </div>
                </div>

                <!-- Foto -->
                <div v-if="detailData.photo_path" class="modal-section">
                  <div class="section-title text-amber">📷 Foto</div>
                  <img
                    :src="photoUrl(detailData.photo_path)"
                    @click="openPhoto(photoUrl(detailData.photo_path))"
                    class="detail-photo"
                    alt="foto absen"
                  />
                </div>

                <!-- Catatan -->
                <div v-if="detailData.noted" class="modal-section">
                  <div class="section-title text-gray">📝 Catatan</div>
                  <div class="detail-box">{{ detailData.noted }}</div>
                </div>

              </div>

              <div class="modal-footer">
                <button @click="closeDetail" class="btn-close-modal">Tutup</button>
              </div>

            </template>
          </div>
        </div>
      </Transition>
    </Teleport>


    <!-- ═══ MODAL PHOTO ═══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showPhotoModal && previewPhoto"
          class="photo-overlay"
          @click="closePhoto">
          <button @click="closePhoto" class="photo-close">✕ Tutup</button>
          <img :src="previewPhoto" class="photo-preview" alt="preview" @click.stop />
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
/* ── PAGE ── */
.attendance-page { padding: 24px; background: #f5f6fa; min-height: 100vh; }

/* ── HERO ── */
.hero-card { background: linear-gradient(135deg, #6366f1, #4f46e5); border-radius: 16px; padding: 24px; margin-bottom: 20px; color: white; }
.hero-inner { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.hero-card h4 { font-size: 20px; font-weight: 700; margin: 0 0 4px; }
.hero-card p  { font-size: 13px; opacity: .8; margin: 0; }
.btn-export { background: white; color: #6366f1; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; }
.btn-export:hover { background: #f0f0ff; }

/* ── SUMMARY ── */
.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
.summary-card { background: white; border-radius: 12px; padding: 18px; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
.summary-label { font-size: 12px; color: #94a3b8; margin-bottom: 6px; }
.summary-value { font-size: 28px; font-weight: 700; }
.text-indigo { color: #6366f1; }
.text-green  { color: #22c55e; }
.text-red    { color: #ef4444; }
.text-yellow { color: #eab308; }
.text-gray   { color: #94a3b8; }

/* ── TABLE CARD ── */
.table-card { background: white; border-radius: 16px; box-shadow: 0 1px 4px rgba(0,0,0,.06); overflow: hidden; }

/* ── FILTER ── */
.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; padding: 16px; border-bottom: 1px solid #f1f5f9; background: #f8fafc; align-items: center; }
.search-wrap { position: relative; flex: 1; min-width: 200px; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 13px; }
.search-input { width: 100%; padding: 8px 12px 8px 32px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; outline: none; }
.search-input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,.15); }
.select-input { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; outline: none; }
.filter-actions { display: flex; gap: 8px; margin-left: auto; }
.btn-reset { padding: 8px 14px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; font-size: 13px; cursor: pointer; }
.btn-reset:hover { background: #f1f5f9; }
.btn-back  { padding: 8px 14px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; font-size: 13px; cursor: pointer; }
.btn-back:hover  { background: #f1f5f9; }

/* ── ERROR ── */
.error-banner { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #fef2f2; border-bottom: 1px solid #fecaca; color: #dc2626; font-size: 13px; }
.error-banner button { margin-left: auto; text-decoration: underline; font-size: 12px; background: none; border: none; color: #dc2626; cursor: pointer; }

/* ── TABLE ── */
.table-wrap { overflow-x: auto; }
.attendance-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 800px; }
.attendance-table thead tr { background: #f8fafc; }
.attendance-table th { padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid #e2e8f0; }
.attendance-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.data-row { cursor: pointer; transition: background .15s; }
.data-row:hover { background: #eef2ff; }
.data-row:nth-child(even) { background: #fafafa; }
.data-row:nth-child(even):hover { background: #eef2ff; }

.td-center   { text-align: center; }
.td-location { max-width: 160px; font-size: 12px; color: #64748b; }
.font-semibold { font-weight: 600; color: #374151; }

/* ── BADGE ── */
.badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.badge-purple { background: #ede9fe; color: #7c3aed; }

/* ── THUMB ── */
.thumb { width: 38px; height: 38px; border-radius: 8px; object-fit: cover; cursor: pointer; transition: transform .15s; display: block; margin: auto; }
.thumb:hover { transform: scale(1.1); }

/* ── BTN DETAIL ── */
.btn-detail { width: 28px; height: 28px; border: 1px solid #c7d2fe; border-radius: 6px; background: white; color: #6366f1; cursor: pointer; display: flex; align-items: center; justify-content: center; margin: auto; transition: background .15s; }
.btn-detail:hover { background: #eef2ff; }

/* ── STATE CELL ── */
.state-cell { text-align: center; padding: 60px 0; color: #94a3b8; }
.state-cell .spinner { width: 32px; height: 32px; border: 4px solid #c7d2fe; border-top-color: #6366f1; border-radius: 50%; animation: spin .7s linear infinite; margin: 0 auto 12px; }
.empty-icon { font-size: 40px; margin-bottom: 8px; }

/* ── PAGINATION ── */
.pagination-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-top: 1px solid #f1f5f9; flex-wrap: wrap; gap: 10px; }
.text-sm { font-size: 13px; }
.page-btns { display: flex; gap: 4px; flex-wrap: wrap; }
.btn-page { padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 6px; background: white; font-size: 13px; cursor: pointer; transition: background .15s; }
.btn-page:hover:not(.disabled) { background: #f1f5f9; }
.btn-page.active { background: #6366f1; color: white; border-color: #6366f1; }
.btn-page.disabled { opacity: .4; cursor: not-allowed; }

/* ── MODAL ── */
.modal-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(0,0,0,.5); backdrop-filter: blur(4px); }
.modal-box { background: white; border-radius: 24px; width: 100%; max-width: 480px; overflow: hidden; position: relative; max-height: 90vh; display: flex; flex-direction: column; }
.modal-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 60px 0; color: #94a3b8; font-size: 13px; }
.modal-loading .spinner { width: 32px; height: 32px; border: 4px solid #c7d2fe; border-top-color: #6366f1; border-radius: 50%; animation: spin .7s linear infinite; }

.modal-banner { background: linear-gradient(135deg, #4338ca, #6366f1); padding: 24px; position: relative; }
.modal-close { position: absolute; top: 14px; right: 14px; width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,.2); border: none; color: white; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; }
.modal-close:hover { background: rgba(255,255,255,.35); }
.modal-eyebrow { font-size: 10px; color: rgba(255,255,255,.7); text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px; }
.modal-name { font-size: 18px; font-weight: 700; color: white; margin: 0 0 4px; }
.modal-nik { font-size: 12px; color: rgba(255,255,255,.7); margin: 0 0 10px; }
.modal-badges { display: flex; gap: 6px; flex-wrap: wrap; }

.modal-body { padding: 16px; overflow-y: auto; flex: 1; }
.modal-section { margin-bottom: 16px; }
.section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 8px; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.detail-box { background: #f8fafc; border-radius: 12px; padding: 14px; }
.detail-label { font-size: 10px; color: #94a3b8; margin-bottom: 3px; }
.detail-val { font-size: 13px; color: #374151; font-weight: 500; }
.detail-mono { font-size: 11px; color: #64748b; font-family: monospace; }
.mt-2 { margin-top: 8px; }
.detail-photo { width: 100%; height: 200px; object-fit: cover; border-radius: 12px; cursor: pointer; transition: filter .15s; }
.detail-photo:hover { filter: brightness(.9); }

.modal-footer { padding: 12px 16px; border-top: 1px solid #f1f5f9; }
.btn-close-modal { width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 12px; background: white; color: #64748b; font-size: 13px; font-weight: 500; cursor: pointer; }
.btn-close-modal:hover { background: #f8fafc; }

/* ── PHOTO PREVIEW ── */
.photo-overlay { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.85); backdrop-filter: blur(6px); padding: 16px; }
.photo-close { position: absolute; top: 16px; right: 16px; background: none; border: none; color: white; font-size: 14px; cursor: pointer; }
.photo-close:hover { color: #d1d5db; }
.photo-preview { max-width: 400px; width: 100%; border-radius: 16px; object-fit: contain; max-height: 80vh; box-shadow: 0 20px 60px rgba(0,0,0,.5); }

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .attendance-page { padding: 12px; }
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .hero-inner { flex-direction: column; align-items: flex-start; }
  .filter-actions { margin-left: 0; }
}
@media (max-width: 480px) {
  .summary-grid { grid-template-columns: 1fr 1fr; }
  .summary-value { font-size: 22px; }
}

/* ── ANIMATION ── */
@keyframes spin { to { transform: rotate(360deg); } }
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>