<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { usePermissionStore } from '@/stores/permissionStore'
import { useDataAttendanceStore } from '@/stores/AttendanceFreeLocationStore'

const route = useRoute()
const toast = useToast()

const permission = usePermissionStore()
const store = useDataAttendanceStore()

// ── PERMISSIONS ─────────────────────────────
const currentUrl = computed(() => route.path.replace('/app', ''))
const canCreate = computed(() => permission.canCreate(currentUrl.value))
const canUpdate = computed(() => permission.canUpdate(currentUrl.value))
const canDelete = computed(() => permission.canDelete(currentUrl.value))
const canView   = computed(() => permission.canView(currentUrl.value))

// ── DATE & TIME ─────────────────────────────
const currentDate = ref('')
const currentTime = ref('')
let timer = null

const updateDateTime = () => {
  const now = new Date()
  currentDate.value = now
    .toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    .replace(',', ' /')
  currentTime.value = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// ── CAMERA ──────────────────────────────────
const videoRef = ref(null)
const photo = ref(null)
let stream = null

const startCamera = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false,
    })
    if (videoRef.value) {
      videoRef.value.srcObject = stream
    }
  } catch (err) {
    toast.error('Tidak dapat mengakses kamera')
    console.error(err)
  }
}

const stopCamera = () => {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop())
    stream = null
  }
}

// ── LOCATION ────────────────────────────────
const latitude      = ref(null)
const longitude     = ref(null)
const accuracy      = ref(15)
const locationStatus = ref('Waiting photo...')
const address       = ref('')
const locationName  = ref('')

const getAddressFromLatLng = async (lat, lng) => {
  try {
    address.value = 'Detecting address...'
    const res = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lng}`)
    const data = await res.json()
    address.value = data.display_name || 'Address not found'
    locationName.value = address.value
  } catch {
    address.value = 'Failed to get address'
    locationName.value = 'Unknown location'
  }
}

const getLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      locationStatus.value = 'Not supported'
      return resolve()
    }
    locationStatus.value = 'Detecting location...'
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        latitude.value  = pos.coords.latitude
        longitude.value = pos.coords.longitude
        accuracy.value  = pos.coords.accuracy
        locationStatus.value = 'Location detected'
        await getAddressFromLatLng(latitude.value, longitude.value)
        resolve()
      },
      () => {
        locationStatus.value = 'Failed to detect location'
        resolve()
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 0 },
    )
  })

// ── PHOTO ────────────────────────────────────
const rawCanvas = ref(null)
const isProcessingPhoto = ref(false)

const wrapText = (ctx, text, maxWidth) => {
  const words = text.split(' ')
  const lines = []
  let cur = ''
  words.forEach((word) => {
    const test = cur + word + ' '
    if (ctx.measureText(test).width > maxWidth && cur !== '') {
      lines.push(cur)
      cur = word + ' '
    } else {
      cur = test
    }
  })
  lines.push(cur)
  return lines
}

const finalizePhoto = async () => {
  const canvas = rawCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const padding = 20
  const lineH = 26
  const maxW = canvas.width - padding * 2

  ctx.font = '16px Arial'

  const lines = [
    ...wrapText(ctx, `📍 ${address.value}`, maxW),
    `🕒 ${currentDate.value} ${currentTime.value}`,
  ]

  const boxH = lines.length * lineH + padding * 2
  const boxY = canvas.height - boxH

  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.fillRect(0, boxY, canvas.width, boxH)
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'top'
  lines.forEach((line, i) => {
    ctx.fillText(line, padding, boxY + padding + i * lineH)
  })

  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.9))
  photo.value = new File([blob], `attendance_${Date.now()}.jpg`, { type: 'image/jpeg' })
}

const takePhoto = async () => {
  if (!videoRef.value) return
  isProcessingPhoto.value = true
  try {
    const canvas = document.createElement('canvas')
    canvas.width  = videoRef.value.videoWidth
    canvas.height = videoRef.value.videoHeight
    canvas.getContext('2d').drawImage(videoRef.value, 0, 0, canvas.width, canvas.height)
    rawCanvas.value = canvas

    const quickBlob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.7))
    photo.value = new File([quickBlob], 'attendance_preview.jpg', { type: 'image/jpeg' })

    await getLocation()
    await finalizePhoto()
  } catch (err) {
    console.error(err)
    toast.error('Gagal mengambil foto')
  } finally {
    isProcessingPhoto.value = false
  }
}

const photoPreview = computed(() =>
  photo.value ? URL.createObjectURL(photo.value) : null
)

// ── MODAL STATES ─────────────────────────────
const showPresensiModal = ref(false)
const showDetailModal   = ref(false)
const attendanceType    = ref(null)
const detailType        = ref('IN')

function openPresensi(type) {
  attendanceType.value  = type
  photo.value           = null
  latitude.value        = null
  longitude.value       = null
  address.value         = ''
  locationStatus.value  = 'Waiting photo...'
  showPresensiModal.value = true
  setTimeout(() => startCamera(), 100)
}

function closePresensi() {
  stopCamera()
  photo.value           = null
  latitude.value        = null
  longitude.value       = null
  address.value         = ''
  locationStatus.value  = 'Waiting photo...'
  showPresensiModal.value = false
}

async function openDetail(id, type) {
  detailType.value      = type
  showDetailModal.value = true
  await store.fetchAttendanceDetail(id)
}

// ── DROPDOWN STATES ──────────────────────────
const showSortByMenu  = ref(false)
const showSortDirMenu = ref(false)
const showPerPageMenu = ref(false)

// ── LIFECYCLE ────────────────────────────────
onMounted(async () => {
  updateDateTime()
  timer = setInterval(updateDateTime, 1000)
  try {
    await store.checkToday()
    await store.fetchAttendance(store.buildUrl())
  } catch (err) {
    console.error(err)
  }
})

onUnmounted(() => {
  clearInterval(timer)
  stopCamera()
})

// ── DATA ─────────────────────────────────────
const formatDateID = (dateStr) => {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr))
}

const photoBaseUrl = 'http://localhost:8000/storage/attendance/photos/'

const groupedAttendance = computed(() => {
  const groups = {}
  const raw = store.attendancesData || []

  raw.forEach((item) => {
    const key = item.attendance_date
    if (!groups[key]) {
      groups[key] = {
        rawDate: key,
        formattedDate: formatDateID(key),
        in: null,
        out: null,
        attendance_status: item.attendance_status,
      }
    }

    const obj = {
      id: item.id,
      time: item.attendance_time?.substring(0, 5) ?? '-',
      location: item.location_name,
      photo: item.photo_path ? photoBaseUrl + item.photo_path : null,
      status: item.attendance_status,
    }

    if (item.attendance_type === 'IN') {
      groups[key].in = obj
      groups[key].attendance_status = item.attendance_status
    }
    if (item.attendance_type === 'OUT') {
      groups[key].out = obj
    }
  })

  return Object.values(groups).sort(
    (a, b) => new Date(b.rawDate) - new Date(a.rawDate),
  )
})

// ── SEARCH ───────────────────────────────────
// ✅ Tidak pakai watch — langsung handler dengan debounce lokal
let searchTimer = null
const onSearch = (val) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    store.searchWithDelay(val)
  }, 0) // debounce sudah ada di store, ini hanya trigger
}

// ── SUBMIT ───────────────────────────────────
const saving = computed(() => store.isSubmitting)

const attendanceTypeLabel = computed(() =>
  attendanceType.value === 'IN' ? 'Check In' : 'Check Out'
)

const isSubmitDisabled = computed(() =>
  saving.value ||
  isProcessingPhoto.value ||
  !photo.value ||
  !latitude.value ||
  !longitude.value
)

const submitAttendance = async () => {
  if (saving.value) return

  if (!latitude.value || !longitude.value) {
    toast.warning('Lokasi belum tersedia')
    return
  }
  if (!photo.value) {
    toast.warning('Foto wajib diambil')
    return
  }

  try {
    await store.submitAttendance({
      attendance_type: attendanceType.value,
      latitude:        latitude.value,
      longitude:       longitude.value,
      accuracy:        accuracy.value,
      location_name:   locationName.value,
      photo_path:      photo.value,
      device_type:     'WEB',
    })
    toast.success(`Attendance ${attendanceType.value} berhasil!`)
    closePresensi()
    await store.checkToday()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Attendance gagal')
  }
}

// ── IMAGE PREVIEW ─────────────────────────────
const showImgPreview = ref(false)
const previewImgUrl  = ref(null)

function openImg(url) {
  previewImgUrl.value  = url
  showImgPreview.value = true
}

function closeImg() {
  showImgPreview.value = false
  previewImgUrl.value  = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <!-- ── BREADCRUMB ── -->
    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="clock" /> Attendance Presensi
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" /> Dashboard
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Attendance</span>
        </div>
      </div>
    </div>

    <!-- ── FORM ATTENDANCE CARD ── -->
    <div class="attend-card mb-3">
      <div class="attend-left">
        <span class="attend-label">Form Attendance</span>

        <div class="attend-date-pill">
          <font-awesome-icon icon="calendar-days" class="attend-date-icon" />
          {{ currentDate }}
        </div>

        <div class="attend-time">{{ currentTime }}</div>

        <div class="attend-status-row">
          <span
            class="status-chip"
            :class="
              store.attendanceStatus === 'CHECKED_OUT' ? 'chip-complete'
            : store.attendanceStatus === 'CHECKED_IN'  ? 'chip-in'
            : 'chip-none'
            "
          >
            <font-awesome-icon
              :icon="
                store.attendanceStatus === 'CHECKED_OUT' ? 'circle-check'
              : store.attendanceStatus === 'CHECKED_IN'  ? 'right-to-bracket'
              : 'clock'
              "
            />
            {{
              store.attendanceStatus === 'CHECKED_OUT' ? 'Sudah Absen Lengkap'
            : store.attendanceStatus === 'CHECKED_IN'  ? 'Sudah Check In'
            : 'Belum Absen Hari Ini'
            }}
          </span>
        </div>
      </div>

      <div class="attend-right">
        <!-- IN: disable jika sudah CHECKED_IN atau CHECKED_OUT -->
        <button
          class="btn-attend btn-attend-in"
          :disabled="
            store.attendanceStatus === 'CHECKED_IN' ||
            store.attendanceStatus === 'CHECKED_OUT'
          "
          @click="openPresensi('IN')"
        >
          <font-awesome-icon icon="camera" />
          Presensi IN
        </button>

        <!-- OUT: aktif HANYA jika CHECKED_IN -->
        <button
          class="btn-attend btn-attend-out"
          :disabled="store.attendanceStatus !== 'CHECKED_IN'"
          @click="openPresensi('OUT')"
        >
          <font-awesome-icon icon="camera" />
          Presensi OUT
        </button>

        <div v-if="store.attendanceStatus === 'CHECKED_OUT'" class="attend-done-badge">
          <font-awesome-icon icon="circle-check" />
          You are absent today
        </div>
      </div>
    </div>

    <!-- ── CONTROLS ROW ── -->
    <div class="controls-card">
      <div class="controls-row">
        <div class="controls-left">

          <!-- Per page -->
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
                    v-for="opt in [10, 25, 50, 100]"
                    :key="opt"
                    class="perpage-opt"
                    :class="{ active: store.pagination.per_page === opt }"
                    @click="store.pagination.per_page = opt; store.changePageSize(); showPerPageMenu = false"
                  >{{ opt }}</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Reset -->
          <button class="btn-toolbar btn-orange" @click="store.resetFilters()">
            <font-awesome-icon icon="rotate-left" /> Reset
          </button>
        </div>

        <div class="controls-right">

          <!-- ✅ Search — pakai :value + @input, bukan v-model -->
          <div class="search-wrap">
            <input
              :value="store.searchAttendances"
              @input="onSearch($event.target.value)"
              type="text"
              placeholder="Search by date / year / time..."
              class="search-input"
              style="width:240px;"
            />
            <button class="search-btn">
              <font-awesome-icon icon="magnifying-glass" />
            </button>
          </div>

          <!-- Sort -->
          <div class="sort-wrap">
            <span class="showing-label">Sort:</span>

            <!-- Sort by column -->
            <div class="drop-wrap">
              <button class="btn-select" @click="showSortByMenu = !showSortByMenu">
                {{ store.sort.column === 'attendance_date' ? 'By Date' : 'By Created' }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showSortByMenu }">
                <div class="drop-label">Sort By</div>
                <button
                  v-for="opt in [
                    { label: 'By Date',    value: 'attendance_date' },
                    { label: 'By Created', value: 'created_at' },
                  ]"
                  :key="opt.value"
                  class="drop-item"
                  :class="{ active: store.sort.column === opt.value }"
                  @click="store.sort.column = opt.value; store.changeSorting(); showSortByMenu = false"
                >{{ opt.label }}</button>
              </div>
            </div>

            <!-- Sort direction -->
            <div class="drop-wrap">
              <button class="btn-select" @click="showSortDirMenu = !showSortDirMenu">
                {{ store.sort.direction.toUpperCase() }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-right" :class="{ show: showSortDirMenu }">
                <div class="drop-label">Direction</div>
                <button
                  v-for="opt in [
                    { label: 'DESC', value: 'desc' },
                    { label: 'ASC',  value: 'asc' },
                  ]"
                  :key="opt.value"
                  class="drop-item"
                  :class="{ active: store.sort.direction === opt.value }"
                  @click="store.sort.direction = opt.value; store.changeSorting(); showSortDirMenu = false"
                >{{ opt.label }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── TABLE ── -->
    <div class="table-card flex-grow-1 overflow-auto mb-3">
      <div class="table-card-title">
        <font-awesome-icon icon="table-list" />
        Your Data Attendance
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width:60px">NO.</th>
            <th style="width:160px">DATE</th>
            <th>PRESENSI IN</th>
            <th>PRESENSI OUT</th>
            <th style="width:130px; text-align:center">STATUS</th>
            <th style="width:120px; text-align:center">DETAILS</th>
          </tr>
        </thead>
        <tbody>

          <!-- ✅ Fix typo: loadingAttendances (pakai 's') -->
          <tr v-if="store.loadingAttendances">
            <td colspan="6" class="td-center">
              <div style="display:flex; justify-content:center;">
                <div class="spinner-custom"></div>
              </div>
            </td>
          </tr>

          <tr v-else-if="!groupedAttendance.length">
            <td colspan="6" class="td-center">
              <div class="empty-state">
                <img
                  src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif"
                  class="empty-img"
                  alt="no data"
                />
                <div class="empty-text">Attendance data not found</div>
              </div>
            </td>
          </tr>

          <tr
            v-else
            v-for="(group, index) in groupedAttendance"
            :key="group.rawDate"
            class="data-row"
          >
            <td class="td-no">{{ index + 1 }}.</td>

            <td>
              <div class="date-main">{{ group.formattedDate }}</div>
              <div class="date-raw">{{ group.rawDate }}</div>
            </td>

            <!-- PRESENSI IN -->
            <td>
              <div v-if="group.in" class="attend-cell">
                <img
                  v-if="group.in.photo"
                  :src="group.in.photo"
                  class="attend-thumb"
                  @click="openImg(group.in.photo)"
                  title="Klik untuk perbesar"
                />
                <div v-else class="attend-no-photo">
                  <font-awesome-icon icon="camera" />
                </div>
                <div class="attend-cell-info">
                  <div class="attend-time-in">
                    {{ group.in.time }}
                    <span v-if="group.attendance_status === 'LATE'" class="badge-late">
                      <font-awesome-icon icon="clock" /> Late
                    </span>
                  </div>
                  <div class="attend-loc">
                    <font-awesome-icon icon="location-dot" class="loc-icon" />
                    {{ group.in.location }}
                  </div>
                  <button v-if="group.in.photo" class="see-photo-btn" @click="openImg(group.in.photo)">
                    <font-awesome-icon icon="eye" /> See Photo
                  </button>
                </div>
              </div>
              <span v-else class="no-attend">--:--</span>
            </td>

            <!-- PRESENSI OUT -->
            <td>
              <div v-if="group.out" class="attend-cell">
                <img
                  v-if="group.out.photo"
                  :src="group.out.photo"
                  class="attend-thumb"
                  @click="openImg(group.out.photo)"
                  title="Klik untuk perbesar"
                />
                <div v-else class="attend-no-photo">
                  <font-awesome-icon icon="camera" />
                </div>
                <div class="attend-cell-info">
                  <div class="attend-time-out">{{ group.out.time }}</div>
                  <div class="attend-loc">
                    <font-awesome-icon icon="location-dot" class="loc-icon" />
                    {{ group.out.location }}
                  </div>
                  <button v-if="group.out.photo" class="see-photo-btn out" @click="openImg(group.out.photo)">
                    <font-awesome-icon icon="eye" /> See Photo
                  </button>
                </div>
              </div>
              <span v-else class="no-attend">--:--</span>
            </td>

            <!-- STATUS -->
            <td style="text-align:center;">
              <span
                class="status-badge"
                :class="{
                  'status-complete': group.attendance_status === 'COMPLETED',
                  'status-late':     group.attendance_status === 'LATE',
                  'status-ready':    group.attendance_status === 'READY',
                  'status-rejected': group.attendance_status === 'REJECTED',
                  'status-default':  !['COMPLETED','LATE','READY','REJECTED'].includes(group.attendance_status),
                }"
              >
                <font-awesome-icon
                  :icon="
                    group.attendance_status === 'COMPLETED' ? 'circle-check'
                  : group.attendance_status === 'LATE'      ? 'clock'
                  : group.attendance_status === 'READY'     ? 'hourglass-half'
                  : group.attendance_status === 'REJECTED'  ? 'circle-xmark'
                  : 'circle'
                  "
                />
                {{ group.attendance_status }}
              </span>
            </td>

            <!-- DETAILS -->
            <td style="text-align:center;">
              <div class="detail-btns">
                <button
                  v-if="group.in"
                  class="detail-btn detail-btn-in"
                  title="Detail IN"
                  @click="openDetail(group.in.id, 'IN')"
                >
                  <font-awesome-icon icon="eye" />
                  <span class="detail-badge-label">IN</span>
                </button>
                <button
                  v-if="group.out"
                  class="detail-btn detail-btn-out"
                  title="Detail OUT"
                  @click="openDetail(group.out.id, 'OUT')"
                >
                  <font-awesome-icon icon="eye" />
                  <span class="detail-badge-label">OUT</span>
                </button>
              </div>
            </td>
          </tr>

        </tbody>
      </table>
    </div>

    <!-- ── PAGINATION ── -->
    <div class="pagination-card">
      <div class="pagination-nav">
        <button
          class="btn-prev-next"
          :disabled="!store.pagination.prev_page_url || store.loadingAttendances"
          @click="store.fetchAttendance(store.pagination.prev_page_url)"
        >
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button
          class="btn-prev-next"
          :disabled="!store.pagination.next_page_url || store.loadingAttendances"
          @click="store.fetchAttendance(store.pagination.next_page_url)"
        >
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">
          {{ groupedAttendance.length }} DATA | PAGE {{ store.pagination.current_page }}
        </span>
        <span class="page-badge">TOTAL: {{ store.pagination.total }}</span>
      </div>
    </div>

    <!-- ════════════════════════════════════════
         MODAL PRESENSI
    ════════════════════════════════════════ -->
    <div v-if="showPresensiModal" class="modal-overlay mt-5" @click.self="closePresensi">
      <div class="modal-presensi-box">

        <div class="modal-pres-header">
          <div class="modal-pres-title">
            <font-awesome-icon icon="camera" class="pres-icon" />
            Presensi {{ attendanceTypeLabel }}
          </div>
          <button class="modal-close-btn" @click="closePresensi">
            <font-awesome-icon icon="xmark" />
          </button>
        </div>

        <div class="modal-pres-body">
          <div class="pres-grid">

            <!-- LEFT: Camera -->
            <div class="pres-col">
              <div class="pres-section-title">
                <font-awesome-icon icon="video" /> Camera
              </div>
              <div class="pres-hint">
                <font-awesome-icon icon="circle-info" />
                Aktifkan kamera & lokasi, lalu ambil selfie.
              </div>
              <div class="camera-box">
                <video ref="videoRef" autoplay playsinline class="camera-video"></video>
              </div>
              <button class="btn-take-photo" @click="takePhoto" :disabled="isProcessingPhoto">
                <font-awesome-icon
                  :icon="isProcessingPhoto ? 'spinner' : 'camera'"
                  :spin="isProcessingPhoto"
                />
                {{ isProcessingPhoto ? 'Processing...' : 'Ambil Foto' }}
              </button>
            </div>

            <!-- RIGHT: Result + Info -->
            <div class="pres-col">
              <div class="pres-section-title">
                <font-awesome-icon icon="image" /> Hasil Foto
              </div>
              <div class="photo-result-box">
                <img v-if="photoPreview" :src="photoPreview" class="photo-result-img" alt="Foto presensi" />
                <div v-else class="photo-placeholder">
                  <div v-if="isProcessingPhoto" class="processing-indicator">
                    <font-awesome-icon icon="spinner" spin />
                    <span>Mendeteksi lokasi...</span>
                  </div>
                  <div v-else>
                    <font-awesome-icon icon="image" class="photo-ph-icon" />
                    <p>Belum ada foto</p>
                  </div>
                </div>
              </div>

              <div class="info-list">
                <div class="info-row">
                  <span class="info-label"><font-awesome-icon icon="clock" /> Waktu</span>
                  <span class="info-value">{{ currentTime }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label"><font-awesome-icon icon="location-dot" /> Koordinat</span>
                  <span v-if="photo && latitude && longitude" class="info-value info-ok">
                    {{ latitude.toFixed(5) }}, {{ longitude.toFixed(5) }}
                  </span>
                  <span v-else class="info-value info-wait">
                    <font-awesome-icon icon="spinner" spin /> Ambil foto dulu...
                  </span>
                </div>
                <div class="info-row">
                  <span class="info-label"><font-awesome-icon icon="signal" /> Akurasi GPS</span>
                  <span
                    v-if="photo && latitude"
                    class="info-value"
                    :class="accuracy <= 200 ? 'info-ok' : 'info-warn'"
                  >
                    {{ accuracy?.toFixed(0) }}m
                    <span>({{ accuracy <= 200 ? '✓ Bagus' : '⚠ Rendah' }})</span>
                  </span>
                  <span v-else class="info-value info-wait">
                    <font-awesome-icon icon="spinner" spin /> –
                  </span>
                </div>
                <div class="info-row">
                  <span class="info-label"><font-awesome-icon icon="map" /> Alamat</span>
                  <span
                    v-if="photo && address && address !== 'Detecting address...'"
                    class="info-value info-ok"
                    style="font-size:0.78rem; text-align:right; max-width:180px;"
                  >{{ address }}</span>
                  <span v-else-if="photo" class="info-value info-wait">
                    <font-awesome-icon icon="spinner" spin /> Mendeteksi...
                  </span>
                  <span v-else class="info-value info-wait">–</span>
                </div>
                <div class="info-row">
                  <span class="info-label"><font-awesome-icon icon="right-to-bracket" /> Tipe</span>
                  <span class="info-value" :class="attendanceType === 'IN' ? 'info-in' : 'info-out'">
                    Attendance {{ attendanceType }}
                  </span>
                </div>
                <div class="readiness-bar" :class="isSubmitDisabled ? 'readiness-wait' : 'readiness-ok'">
                  <font-awesome-icon :icon="isSubmitDisabled ? 'circle-exclamation' : 'circle-check'" />
                  {{ isSubmitDisabled ? 'Ambil selfie & izinkan lokasi' : 'Siap dikirim!' }}
                </div>
              </div>
            </div>

          </div>
        </div>

        <div class="modal-pres-footer">
          <button class="btn-cancel" @click="closePresensi">
            <font-awesome-icon icon="arrow-left" /> Batal
          </button>
          <button
            class="btn-submit-attend"
            :disabled="isSubmitDisabled"
            @click="submitAttendance"
          >
            <font-awesome-icon :icon="saving ? 'spinner' : 'paper-plane'" :spin="saving" />
            {{ saving ? 'Processing...' : 'Submit Attendance' }}
          </button>
        </div>

      </div>
    </div>

    <!-- ════════════════════════════════════════
         MODAL DETAIL
    ════════════════════════════════════════ -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal-detail-box">

        <div class="modal-pres-header">
          <div class="modal-pres-title" :class="detailType === 'IN' ? 'title-in' : 'title-out'">
            <font-awesome-icon :icon="detailType === 'IN' ? 'right-to-bracket' : 'right-from-bracket'" />
            Detail Attendance {{ detailType }}
          </div>
          <button class="modal-close-btn" @click="showDetailModal = false">
            <font-awesome-icon icon="xmark" />
          </button>
        </div>

        <div class="modal-detail-body">
          <div v-if="store.loadingDetail" class="td-center">
            <div class="spinner-custom" style="margin:0 auto;"></div>
          </div>

          <div v-else-if="store.attendanceDetail" class="detail-content">
            <div class="detail-section">
              <div class="detail-section-title">
                <font-awesome-icon icon="user" /> Employee Information
              </div>
              <div class="detail-grid-3">
                <div class="detail-field">
                  <span class="detail-field-label">Full Name</span>
                  <span class="detail-field-value">{{ store.attendanceDetail.user?.fullname }}</span>
                </div>
                <div class="detail-field">
                  <span class="detail-field-label">Email</span>
                  <span class="detail-field-value">{{ store.attendanceDetail.user?.email }}</span>
                </div>
                <div class="detail-field">
                  <span class="detail-field-label">NIK</span>
                  <span class="detail-field-value mono">{{ store.attendanceDetail.employee?.nik ?? '-' }}</span>
                </div>
              </div>
            </div>

            <div
              class="detail-section"
              :class="detailType === 'IN' ? 'section-in' : 'section-out'"
            >
              <div
                class="detail-section-title"
                :class="detailType === 'IN' ? 'title-in' : 'title-out'"
              >
                <font-awesome-icon :icon="detailType === 'IN' ? 'right-to-bracket' : 'right-from-bracket'" />
                Attendance {{ detailType }}
              </div>
              <div class="detail-grid-2">
                <div class="detail-field">
                  <span class="detail-field-label">Tanggal</span>
                  <span class="detail-field-value">{{ store.attendanceDetail.attendance_date }}</span>
                </div>
                <div class="detail-field">
                  <span class="detail-field-label">Waktu</span>
                  <span class="detail-field-value">{{ store.attendanceDetail.attendance_time }}</span>
                </div>
                <div class="detail-field">
                  <span class="detail-field-label">Status</span>
                  <span class="status-badge status-ready">{{ store.attendanceDetail.attendance_status }}</span>
                </div>
                <div class="detail-field">
                  <span class="detail-field-label">Mode</span>
                  <span class="detail-field-value">{{ store.attendanceDetail.attendance_mode }}</span>
                </div>
                <div class="detail-field">
                  <span class="detail-field-label">Device</span>
                  <span class="detail-field-value">{{ store.attendanceDetail.device_type }}</span>
                </div>
                <div class="detail-field">
                  <span class="detail-field-label">Akurasi</span>
                  <span class="detail-field-value">
                    {{ store.attendanceDetail.accuracy }}m — {{ store.attendanceDetail.accuracy_status }}
                  </span>
                </div>
              </div>
              <div class="detail-field" style="margin-top:10px;">
                <span class="detail-field-label">
                  <font-awesome-icon icon="location-dot" /> Lokasi
                </span>
                <span class="detail-field-value">{{ store.attendanceDetail.location_name }}</span>
                <span class="detail-coords">
                  Lat: {{ store.attendanceDetail.latitude }} | Long: {{ store.attendanceDetail.longitude }}
                </span>
              </div>
            </div>
          </div>

          <div v-else class="td-center">Data tidak tersedia</div>
        </div>

        <div class="modal-pres-footer">
          <button class="btn-cancel" @click="showDetailModal = false">Close</button>
        </div>
      </div>
    </div>

    <!-- ── IMAGE PREVIEW ── -->
    <Transition name="fade">
      <div v-if="showImgPreview" class="img-overlay" @click="closeImg">
        <div class="img-preview-wrap" @click.stop>
          <img :src="previewImgUrl" class="img-preview-full" />
          <button class="img-close-btn" @click="closeImg">
            <font-awesome-icon icon="xmark" />
          </button>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
/* ── CSS VARIABLES ── */
.h-100 { --text-muted: #64748b; --primary-color: #6366f1; }

/* ── BREADCRUMB ── */
.breadcrumb-card { background: var(--bg-card); border-radius: 10px; padding: 16px 18px; box-shadow: 0 1px 3px var(--shadow-color); margin-bottom: 12px; }
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

/* ── ATTEND CARD ── */
.attend-card { background: var(--bg-card); border-radius: 12px; padding: 20px 24px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px; border-left: 4px solid #6366f1; }
.attend-left  { display: flex; flex-direction: column; gap: 10px; }
.attend-right { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.attend-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); }
.attend-date-pill { display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--border-main); padding: 6px 14px; border-radius: 99px; font-size: 0.875rem; font-weight: 500; color: var(--text-primary); background: var(--bg-input); }
.attend-date-icon { color: #6366f1; }
.attend-time { font-size: 2.8rem; font-weight: 700; color: var(--text-primary); letter-spacing: 2px; font-variant-numeric: tabular-nums; }
.attend-status-row { display: flex; align-items: center; }
.status-chip { display: inline-flex; align-items: center; gap: 7px; padding: 5px 14px; border-radius: 99px; font-size: 0.8rem; font-weight: 600; }
.chip-none     { background: rgba(239,68,68,0.1);  color: #dc2626; border: 1px solid rgba(239,68,68,0.2); }
.chip-in       { background: rgba(245,158,11,0.1); color: #d97706; border: 1px solid rgba(245,158,11,0.2); }
.chip-complete { background: rgba(16,185,129,0.1); color: #059669; border: 1px solid rgba(16,185,129,0.2); }
.btn-attend { display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; border-radius: 9px; font-size: 0.875rem; font-weight: 700; cursor: pointer; transition: all 0.18s ease; min-width: 160px; justify-content: center; border: 2px solid; }
.btn-attend:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-attend-in  { background: transparent; border-color: #6366f1; color: #6366f1; }
.btn-attend-in:hover:not(:disabled)  { background: #6366f1; color: #fff; }
.btn-attend-out { background: transparent; border-color: #059669; color: #059669; }
.btn-attend-out:hover:not(:disabled) { background: #059669; color: #fff; }
.attend-done-badge { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; border-radius: 8px; background: rgba(16,185,129,0.1); color: #059669; font-size: 0.82rem; font-weight: 600; border: 1px solid rgba(16,185,129,0.2); }

/* ── CONTROLS ── */
.controls-card { background: var(--bg-card); border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); }
.controls-row  { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.controls-left, .controls-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.showing-wrap  { display: flex; align-items: center; gap: 6px; font-size: 0.84rem; color: var(--text-primary); font-weight: 600; }
.showing-label { white-space: nowrap; color: var(--text-muted); font-size: 0.83rem; }
.text-muted-color { color: var(--text-muted); }
.search-wrap   { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.search-input  { padding: 7px 12px; border: none; background: transparent; color: var(--text-primary); font-size: 0.84rem; outline: none; }
.search-input::placeholder { color: var(--text-muted); }
.search-btn    { padding: 7px 12px; background: #6366f1; color: #fff; border: none; cursor: pointer; }
.search-btn:hover { background: #4f46e5; }
.sort-wrap     { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.btn-toolbar   { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: none; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; transition: all 0.18s ease; white-space: nowrap; }
.btn-orange    { background: #f59e0b; color: #fff; }
.btn-orange:hover { background: #d97706; }
.drop-wrap  { position: relative; }
.btn-select { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.83rem; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
.btn-select:hover { border-color: #6366f1; color: #6366f1; }
.drop-menu  { position: absolute; top: calc(100% + 6px); left: 0; min-width: 150px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 10px; z-index: 300; opacity: 0; transform: translateY(-6px); pointer-events: none; transition: all 0.18s ease; }
.drop-right { left: auto; right: 0; }
.drop-menu.show { opacity: 1; transform: translateY(0); pointer-events: all; }
.drop-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; padding: 0 4px; }
.drop-item  { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: none; border: none; border-radius: 7px; color: var(--text-primary); font-size: 0.84rem; cursor: pointer; text-align: left; }
.drop-item:hover  { background: var(--bg-nav-hover); }
.drop-item.active { color: #6366f1; font-weight: 600; background: rgba(99,102,241,0.08); }
.btn-arrow { font-size: 0.6rem; opacity: 0.7; }
.perpage-grid  { display: flex; flex-wrap: wrap; gap: 6px; }
.perpage-opt   { padding: 5px 10px; border: 1px solid var(--border-main); border-radius: 6px; background: var(--bg-input); color: var(--text-primary); font-size: 0.82rem; cursor: pointer; }
.perpage-opt:hover  { border-color: #6366f1; color: #6366f1; }
.perpage-opt.active { background: #6366f1; border-color: #6366f1; color: #fff; font-weight: 700; }

/* ── TABLE ── */
.table-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); overflow: auto; }
.table-card-title { padding: 14px 18px 10px; font-size: 0.85rem; font-weight: 700; color: var(--text-primary); border-bottom: 1px solid var(--border-main); display: flex; align-items: center; gap: 8px; }
.table-card-title svg { color: #6366f1; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.data-table thead tr { background: var(--bg-input); border-bottom: 2px solid var(--border-main); position: sticky; top: 0; z-index: 2; }
.data-table th { padding: 12px 18px; text-align: left; font-size: 0.72rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap; }
.data-table tbody tr { border-bottom: 1px solid var(--border-main); transition: background 0.15s; }
.data-table tbody tr:last-child { border-bottom: none; }
.data-row:hover { background: var(--bg-nav-hover); }
.data-table td  { padding: 12px 18px; vertical-align: middle; color: var(--text-primary); }
.td-no     { color: var(--text-muted); font-weight: 600; }
.td-center { text-align: center; padding: 40px; color: var(--text-muted); }
.date-main { font-weight: 600; font-size: 0.875rem; color: var(--text-primary); }
.date-raw  { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
.attend-cell { display: flex; align-items: center; gap: 10px; }
.attend-thumb { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; border: 1.5px solid var(--border-main); cursor: pointer; flex-shrink: 0; transition: transform 0.15s; }
.attend-thumb:hover { transform: scale(1.08); }
.attend-no-photo { width: 44px; height: 44px; border-radius: 8px; background: var(--bg-input); border: 1.5px dashed var(--border-main); display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 1rem; flex-shrink: 0; }
.attend-cell-info { display: flex; flex-direction: column; gap: 2px; }
.attend-time-in  { font-size: 1.15rem; font-weight: 800; color: #6366f1; display: flex; align-items: center; gap: 6px; }
.attend-time-out { font-size: 1.15rem; font-weight: 800; color: #059669; }
.attend-loc { font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.loc-icon { color: #ef4444; }
.badge-late { font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 99px; background: rgba(245,158,11,0.1); color: #d97706; border: 1px solid rgba(245,158,11,0.25); }
.see-photo-btn { display: inline-flex; align-items: center; gap: 4px; font-size: 0.72rem; font-weight: 600; color: #6366f1; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); border-radius: 5px; padding: 2px 8px; cursor: pointer; transition: all 0.15s; margin-top: 2px; }
.see-photo-btn:hover { background: #6366f1; color: #fff; }
.see-photo-btn.out { color: #059669; background: rgba(5,150,105,0.08); border-color: rgba(5,150,105,0.2); }
.see-photo-btn.out:hover { background: #059669; color: #fff; }
.no-attend { color: var(--text-muted); font-style: italic; font-size: 0.85rem; }
.status-badge    { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 99px; font-size: 0.72rem; font-weight: 700; }
.status-complete { background: rgba(16,185,129,0.1); color: #059669; border: 1px solid rgba(16,185,129,0.2); }
.status-late     { background: rgba(245,158,11,0.1); color: #d97706; border: 1px solid rgba(245,158,11,0.2); }
.status-ready    { background: rgba(59,130,246,0.1);  color: #2563eb; border: 1px solid rgba(59,130,246,0.2); }
.status-rejected { background: rgba(239,68,68,0.1);  color: #dc2626; border: 1px solid rgba(239,68,68,0.2); }
.status-default  { background: var(--bg-input); color: var(--text-muted); border: 1px solid var(--border-main); }
.detail-btns { display: flex; align-items: center; justify-content: center; gap: 8px; }
.detail-btn  { position: relative; width: 34px; height: 34px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; transition: all 0.18s ease; background: transparent; }
.detail-btn-in  { color: #6366f1; border-color: #6366f1; }
.detail-btn-in:hover  { background: #6366f1; color: #fff; }
.detail-btn-out { color: #059669; border-color: #059669; }
.detail-btn-out:hover { background: #059669; color: #fff; }
.detail-badge-label { position: absolute; top: -8px; right: -8px; font-size: 0.6rem; font-weight: 800; padding: 1px 5px; border-radius: 99px; background: #6366f1; color: #fff; line-height: 1.4; }
.detail-btn-out .detail-badge-label { background: #059669; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.empty-img   { width: 160px; opacity: 0.85; border-radius: 8px; }
.empty-text  { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
.spinner-custom { width: 32px; height: 32px; border: 3px solid var(--border-main); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── PAGINATION ── */
.pagination-card { background: var(--bg-card); border-radius: 10px; padding: 14px 18px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: row-reverse; align-items: center; justify-content: space-between; gap: 12px; }
.pagination-nav  { display: flex; align-items: center; gap: 8px; }
.btn-prev-next   { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; min-width: 85px; justify-content: center; transition: background 0.18s ease; }
.btn-prev-next:hover:not(:disabled) { background: #4f46e5; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badges { display: flex; gap: 8px; align-items: center; }
.page-badge  { padding: 7px 14px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); background: var(--bg-input); white-space: nowrap; }
@media (max-width: 576px) {
  .pagination-card { flex-direction: column; }
  .pagination-nav  { width: 100%; justify-content: space-between; }
  .btn-prev-next   { flex: 1; }
  .page-badges     { width: 100%; justify-content: center; flex-wrap: wrap; }
}

/* ── MODAL ── */
.modal-overlay { position: fixed; inset: 0; z-index: 600; background: rgba(0,0,0,0.48); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal-pres-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border-main); flex-shrink: 0; }
.modal-pres-title { display: flex; align-items: center; gap: 10px; font-size: 1rem; font-weight: 800; color: var(--text-primary); }
.pres-icon  { color: #6366f1; }
.title-in   { color: #6366f1; }
.title-out  { color: #059669; }
.modal-close-btn { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; background: var(--bg-input); border: 1px solid var(--border-main); border-radius: 7px; cursor: pointer; color: var(--text-muted); transition: all 0.15s; }
.modal-close-btn:hover { background: #ef4444; border-color: #ef4444; color: #fff; }
.modal-pres-footer { padding: 14px 20px; border-top: 1px solid var(--border-main); display: flex; justify-content: flex-end; gap: 10px; flex-shrink: 0; }
.modal-presensi-box { background: var(--bg-card); border-radius: 14px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); width: 100%; max-width: 860px; max-height: 92vh; display: flex; flex-direction: column; overflow: hidden; }
.modal-pres-body { flex: 1; overflow-y: auto; padding: 20px; }
.pres-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 640px) { .pres-grid { grid-template-columns: 1fr; } }
.pres-col { display: flex; flex-direction: column; gap: 12px; }
.pres-section-title { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }
.pres-hint { display: flex; align-items: center; gap: 8px; padding: 9px 12px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); border-radius: 8px; font-size: 0.79rem; color: #d97706; }
.camera-box { border-radius: 10px; overflow: hidden; background: #000; aspect-ratio: 4/3; }
.camera-video { width: 100%; height: 100%; object-fit: cover; }
.btn-take-photo { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; background: #6366f1; color: #fff; border: none; border-radius: 9px; font-size: 0.875rem; font-weight: 700; cursor: pointer; transition: background 0.18s; width: 100%; }
.btn-take-photo:hover:not(:disabled) { background: #4f46e5; }
.btn-take-photo:disabled { opacity: 0.5; cursor: not-allowed; }
.photo-result-box { border-radius: 10px; overflow: hidden; background: var(--bg-input); border: 1.5px dashed var(--border-main); aspect-ratio: 4/3; display: flex; align-items: center; justify-content: center; }
.photo-result-img { width: 100%; height: 100%; object-fit: contain; }
.photo-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--text-muted); }
.photo-ph-icon { font-size: 2.5rem; opacity: 0.3; }
.photo-placeholder p { font-size: 0.82rem; margin: 0; }
.processing-indicator { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #f59e0b; font-size: 0.82rem; }
.info-list { display: flex; flex-direction: column; gap: 8px; }
.info-row  { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--border-main); }
.info-row:last-child { border-bottom: none; }
.info-label { font-size: 0.78rem; font-weight: 600; color: var(--text-muted); white-space: nowrap; display: flex; align-items: center; gap: 5px; }
.info-value { font-size: 0.82rem; font-weight: 500; color: var(--text-primary); text-align: right; }
.info-ok   { color: #059669; font-weight: 700; }
.info-wait { color: var(--text-muted); font-style: italic; }
.info-warn { color: #d97706; }
.info-in   { color: #6366f1; font-weight: 700; }
.info-out  { color: #059669; font-weight: 700; }
.readiness-bar { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 9px; border-radius: 8px; font-size: 0.82rem; font-weight: 600; margin-top: 4px; }
.readiness-wait { background: rgba(245,158,11,0.1); color: #d97706; border: 1px solid rgba(245,158,11,0.2); }
.readiness-ok   { background: rgba(16,185,129,0.1); color: #059669; border: 1px solid rgba(16,185,129,0.2); }
.btn-submit-attend { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 9px 22px; background: #6366f1; color: #fff; border: none; border-radius: 9px; font-size: 0.875rem; font-weight: 700; cursor: pointer; transition: background 0.18s; }
.btn-submit-attend:hover:not(:disabled) { background: #4f46e5; }
.btn-submit-attend:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-cancel { padding: 8px 18px; background: var(--bg-main, #f1f5f9); color: var(--text-muted); border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 7px; }
.btn-cancel:hover { background: var(--border-main); color: var(--text-primary); }
.modal-detail-box { background: var(--bg-card); border-radius: 14px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); width: 100%; max-width: 640px; max-height: 92vh; display: flex; flex-direction: column; overflow: hidden; }
.modal-detail-body { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.detail-content { display: flex; flex-direction: column; gap: 16px; }
.detail-section { background: var(--bg-input); border-radius: 10px; padding: 14px 16px; border: 1px solid var(--border-main); }
.section-in  { border-left: 3px solid #6366f1; }
.section-out { border-left: 3px solid #059669; }
.detail-section-title { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
.detail-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.detail-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
@media (max-width: 480px) { .detail-grid-2, .detail-grid-3 { grid-template-columns: 1fr; } }
.detail-field { display: flex; flex-direction: column; gap: 3px; }
.detail-field-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.detail-field-value { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); }
.detail-coords { font-size: 0.72rem; color: var(--text-muted); font-family: monospace; margin-top: 2px; }
.mono { font-family: monospace; }

/* ── IMAGE PREVIEW ── */
.img-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.82); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; cursor: zoom-out; }
.img-preview-wrap { position: relative; cursor: default; }
.img-preview-full { max-width: 90vw; max-height: 90vh; border-radius: 10px; box-shadow: 0 20px 60px rgba(0,0,0,0.4); display: block; object-fit: contain; }
.img-close-btn { position: absolute; top: -13px; right: -13px; width: 30px; height: 30px; background: #ef4444; color: #fff; border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
.img-close-btn:hover { background: #dc2626; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>