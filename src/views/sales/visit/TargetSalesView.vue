<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useMyVisitTargetStore } from '@/stores/myVisitTargetStore'
import { useVisitDataStore } from '@/stores/visitSalesStore'
import { useCustomersVisitStore } from '@/stores/customersVisitStore'
import { useToast } from 'vue-toastification'
import AppModal from '@/components/AppModal.vue'
import RichTextEditor from '@/components/RichTextEditor.vue'

const store = useMyVisitTargetStore()
const toast = useToast()

// ── VISIT (reuse logic dari Customer Master / Sales Visit page -- jangan
// diubah, cuma dipasang ulang di sini biar konsisten satu sumber kebenaran) ──
const visitDataStore      = useVisitDataStore()
const customersVisitStore = useCustomersVisitStore()

const { activeVisitCustomersId, activeVisitCustId, loadingVisitNow } = storeToRefs(visitDataStore)
const { activeCustomerPhase } = storeToRefs(customersVisitStore)

// nama sales diambil dari baris target itu sendiri (semua row pasti sales_name-nya
// sama, karena endpoint /sales/visit-targets sudah di-scope ke user yang login) --
// biar nggak perlu gantung ke authStore/profile yang bentuknya belum tentu sama.
const myName = computed(() => store.targets[0]?.sales_name || 'Sales')

onMounted(async () => {
  updateCurrentDateTime()
  clockInterval = setInterval(updateCurrentDateTime, 1000)
  try {
    await store.fetchMyTargets()
  } catch (err) {
    toast.error('Gagal memuat target visit.')
  }
  await restoreActiveCustomerVisit() // ← biar tombol Visit/Check In/Check Out langsung sesuai status aktif, tanpa perlu Visit Now ulang kalau baru pindah halaman
})

onUnmounted(() => {
  clearInterval(clockInterval)
  stopCamera()
})

function colorForType(type) {
  return type === 'branch' ? '#0d9488' : '#6366f1'
}

async function restoreActiveCustomerVisit() {
  try {
    await visitDataStore.fetchVisits(visitDataStore.buildUrl())
    const activeCustomerVisit = visitDataStore.visitsData.find(
      v => v.visit_type === 'CUSTOMER' && v.check_out_at === null
    )
    if (activeCustomerVisit) {
      visitDataStore.activeVisitCustomersId = activeCustomerVisit.customer_id
      visitDataStore.activeVisitCustId      = activeCustomerVisit.id
      activeCustomerPhase.value = activeCustomerVisit.check_in_at ? 'checked_in' : 'visiting'
    } else {
      visitDataStore.activeVisitCustomersId = null
      visitDataStore.activeVisitCustId      = null
      activeCustomerPhase.value = null
    }
  } catch (err) {
    console.error('Gagal restore status visit aktif:', err)
  }
}

// ════════════════════════════════════════════════════════════
// TOMBOL VISIT (konsepnya sama persis dengan Customer Master --
// modal konfirmasi simpel "Yes, Visit Now" yang manggil
// startVisitCustomers(customerId, branchId) dari visitSalesStore.js)
// ════════════════════════════════════════════════════════════
const showVisitNowModal = ref(false)
const selectedVisitItem = ref(null)

function isBranchRow(row) {
  return row.target_type === 'branch'
}

// Nonaktifin tombol "Visit" kalau target-nya (customer head office ATAU
// branch) belum punya titik lokasi sendiri -- DETEKSI DARI latitude/longitude,
// samain konsepnya dengan hasCoordinates() di SalesVisitData.vue &
// CustomersManagement.vue. Query backend (BuildsVisitTargetQuery) udah
// nyertain latitude/longitude yang sudah di-resolve sesuai target_type.
function hasCoordinates(row) {
  return row.latitude != null && row.longitude != null
}

// Cuma SATU target yang boleh nunjukin tombol Check In/Check Out di satu
// waktu -- yaitu target yang customer-nya lagi divisit aktif sekarang
// (activeVisitCustomersId). Target lain tetap nunjukin tombol "Visit"
// (otomatis disabled karena ada activeVisitCustomersId, lihat template).
function isRowActive(row) {
  return !!activeVisitCustomersId.value && activeVisitCustomersId.value === row.visit_customer_id
}

function openVisitNow(row) {
  if (!hasCoordinates(row)) {
    toast.error('Titik lokasi (Latitude/Longitude) belum diisi. Lengkapi dulu di Customer Master sebelum bisa divisit.')
    return
  }
  selectedVisitItem.value = row
  showVisitNowModal.value = true
}

function closeVisitNowModal() {
  if (loadingVisitNow.value) return
  showVisitNowModal.value = false
  selectedVisitItem.value = null
}

async function confirmVisitNow() {
  const item = selectedVisitItem.value
  if (!item) return

  // visit_customer_id sudah di-resolve dari backend -- selalu ID customer
  // head office, baik target ini tipe customer maupun branch (lihat
  // penjelasan di BuildsVisitTargetQuery.php).
  const customerId = item.visit_customer_id
  const branchId   = isBranchRow(item) ? item.branch_id : null

  if (!customerId) {
    toast.error('Data customer tidak lengkap untuk memulai visit.')
    return
  }

  const { success, message } = await visitDataStore.startVisitCustomers(customerId, branchId)
  if (success) {
    toast.success(message)
    closeVisitNowModal()
    await restoreActiveCustomerVisit() // ← tarik ulang status biar tombol langsung ganti ke Check In, nggak perlu refresh
  } else {
    toast.error(message)
  }
}

// ════════════════════════════════════════════════════════════
// CAMERA + GPS (copy persis dari Customer Master / Sales Visit page)
// ════════════════════════════════════════════════════════════
const videoRef          = ref(null)
const canvasRef         = ref(null)
const cameraStream      = ref(null)
const capturedPhoto     = ref(null)
const currentLocation   = ref({ latitude: null, longitude: null, address: '' })
const isGettingLocation = ref(false)
const locationReady     = ref(false)
const loadingCheckIn    = ref(false)
const currentDateTime   = ref('')
let   clockInterval     = null

function updateCurrentDateTime() {
  currentDateTime.value = new Date().toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

async function startCamera() {
  try {
    stopCamera()
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    })
    cameraStream.value = stream
    await nextTick()
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      await videoRef.value.play()
    }
  } catch (err) { console.error('Camera error:', err) }
}

function stopCamera() {
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach(t => t.stop())
    cameraStream.value = null
  }
}

async function getCurrentLocation() {
  isGettingLocation.value = true
  locationReady.value     = false
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async pos => {
        currentLocation.value.latitude  = pos.coords.latitude
        currentLocation.value.longitude = pos.coords.longitude
        try {
          const r    = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`)
          const data = await r.json()
          currentLocation.value.address = data.display_name || 'Lokasi tidak ditemukan'
          locationReady.value = true
        } catch {
          currentLocation.value.address = 'Lokasi gagal diambil'
          locationReady.value = false
        }
        isGettingLocation.value = false
        resolve()
      },
      err => { isGettingLocation.value = false; locationReady.value = false; reject(err) },
      { enableHighAccuracy: true }
    )
  })
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = ''
  for (let n = 0; n < words.length; n++) {
    const testLine  = line + words[n] + ' '
    const testWidth = ctx.measureText(testLine).width
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y); line = words[n] + ' '; y += lineHeight
    } else { line = testLine }
  }
  ctx.fillText(line, x, y)
}

async function capturePhoto() {
  const canvas = canvasRef.value
  const video  = videoRef.value
  if (!canvas || !video) return
  const ctx = canvas.getContext('2d')
  canvas.width = video.videoWidth; canvas.height = video.videoHeight
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  const overlayH = 120
  const gradient = ctx.createLinearGradient(0, canvas.height - overlayH, 0, canvas.height)
  gradient.addColorStop(0, 'rgba(0,0,0,0)')
  gradient.addColorStop(1, 'rgba(0,0,0,0.85)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, canvas.height - overlayH, canvas.width, overlayH)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 28px Arial'
  ctx.fillText(`${selectedVisitItem.value?.company_name || 'Visit Sales'}`, 20, canvas.height - 75)
  ctx.font = '20px Arial'
  ctx.fillText(`${currentDateTime.value}`, 20, canvas.height - 45)
  ctx.font = '18px Arial'
  wrapText(ctx, `${currentLocation.value.address || 'Location unavailable'}`, 20, canvas.height - 18, canvas.width - 40, 22)

  capturedPhoto.value = canvas.toDataURL('image/jpeg', 1)
  stopCamera()
}

async function retakePhoto() {
  capturedPhoto.value = null
  await startCamera()
}

// ════════════════════════════════════════════════════════════
// CHECK IN
// ════════════════════════════════════════════════════════════
const showCheckInModalCustomers = ref(false)

async function checkInCustomer(item) {
  selectedVisitItem.value = item
  capturedPhoto.value = null
  showCheckInModalCustomers.value = true
  await nextTick(); await startCamera(); await getCurrentLocation()
}

function closeCheckInModalCustomers() {
  showCheckInModalCustomers.value = false; capturedPhoto.value = null; stopCamera()
}

async function submitCheckInCustomers() {
  if (!activeVisitCustId.value) { toast.error('Visit belum dimulai. Lakukan "Visit Now" terlebih dahulu.'); return }
  loadingCheckIn.value = true
  try {
    const response = await fetch(capturedPhoto.value)
    const blob     = await response.blob()
    const file     = new File([blob], `checkin-${Date.now()}.jpg`, { type: 'image/jpeg' })
    const formData = new FormData()
    formData.append('latitude',     currentLocation.value.latitude)
    formData.append('longitude',    currentLocation.value.longitude)
    formData.append('gps_snapshot', currentLocation.value.address)
    formData.append('photo',        file)
    const result = await visitDataStore.submitCheckInCustomer(activeVisitCustId.value, formData)
    if (result.success) {
      toast.success(result.message)
      closeCheckInModalCustomers()
      await restoreActiveCustomerVisit() // ← samain sumber kebenarannya, biar konsisten sama Visit Now di atas
    } else if (result.outsideRadius) {
      // PHASE 3: GPS di luar radius customer/cabang -- backend nolak total
      // (422, gak ada lagi jalur konfirmasi), langsung tutup modal + tampilin
      // pesan jarak & radius-nya biar sales tau harus ke lokasi yang benar dulu.
      toast.error(result.message)
      closeCheckInModalCustomers()
    } else if (result.missingCoordinates) {
      // Customer/cabang belum punya Lat/Long sama sekali -- gak ada yang
      // bisa dikonfirmasi sales, harus dilengkapi dulu di Customer Master.
      toast.error(result.message)
      closeCheckInModalCustomers()
    } else { toast.error(result.message) }
  } catch (err) { console.error(err); toast.error('Failed check in customer')
  } finally { loadingCheckIn.value = false }
}

// ════════════════════════════════════════════════════════════
// CHECK OUT
// ════════════════════════════════════════════════════════════
const showCheckOutCustomerModal = ref(false)
const loadingCustomerCheckOut   = ref(false)

const customerResponses = [
  { value: 'maintained', label: 'Relationship Maintained / ', desc: 'Regular Visit', icon: 'fa-solid fa-handshake' },
  { value: 'improved', label: 'Growth Potential /', desc: 'Upsell Identified Additional, increase potential has been identified.', icon: 'fa-solid fa-arrow-trend-up' },
  { value: 'complaint_handled', label: 'Outstanding Issue / ', desc: 'Issue requires further attention', icon: 'fa-solid fa-triangle-exclamation' },
  { value: 'no_progress', label: 'No Progress', desc: 'Low engagement, negative feedback, or no significant progress', icon: 'fa-solid fa-circle-exclamation' },
]
const followUpTypes = ['CALL', 'VISIT', 'WHATSAPP', 'EMAIL', 'MEETING']

function emptyCustomerCheckOutForm() {
  return {
    no_reference: '', notes: '', customer_response: '',
    has_complaint: false, complaint_detail: '',
    has_potential_order: false, potential_order_detail: '',
    follow_up_at: '', follow_up_notes: '', follow_up_type: '',
    check_out_file: null,
  }
}

const customerCheckOutForms = ref([emptyCustomerCheckOutForm()])

const tomorrowDateTime = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(0, 0, 0, 0)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00`
})

function isRichTextEmpty(html) {
  if (!html) return true
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length === 0
}

function isCustomerResultValid(form) {
  if (!form.no_reference.trim() || isRichTextEmpty(form.notes) || !form.customer_response || !form.follow_up_at || !form.follow_up_type) return false
  if (form.has_complaint && isRichTextEmpty(form.complaint_detail)) return false
  if (form.has_potential_order && isRichTextEmpty(form.potential_order_detail)) return false
  return true
}

const isCustomerCheckOutValid = computed(() =>
  customerCheckOutForms.value.length > 0 && customerCheckOutForms.value.every(isCustomerResultValid)
)

function addCustomerCheckOutResult() {
  customerCheckOutForms.value.push(emptyCustomerCheckOutForm())
}

function removeCustomerCheckOutResult(index) {
  if (customerCheckOutForms.value.length === 1) return
  customerCheckOutForms.value.splice(index, 1)
}

function onCheckOutFileChange(event, form) {
  form.check_out_file = event.target.files?.[0] ?? null
}

function selectCustomerResponse(form, value) {
  form.customer_response = value
  form.has_complaint = ['complaint_handled', 'at_risk'].includes(value)
  form.has_potential_order = ['upsell_identified', 'improved'].includes(value)
  if (!form.has_complaint) form.complaint_detail = ''
  if (!form.has_potential_order) form.potential_order_detail = ''
}

function openCustomerCheckOut(item) {
  selectedVisitItem.value = item
  customerCheckOutForms.value = [emptyCustomerCheckOutForm()]
  showCheckOutCustomerModal.value = true
}

function closeCustomerCheckOutModal() {
  if (loadingCustomerCheckOut.value) return
  showCheckOutCustomerModal.value = false
}

async function submitCustomerCheckOut() {
  const visitId = activeVisitCustId.value
  if (!visitId) { toast.error('Visit ID tidak ditemukan.'); return }
  if (!isCustomerCheckOutValid.value) return

  loadingCustomerCheckOut.value = true
  try {
    const formData = new FormData()
    customerCheckOutForms.value.forEach((form, index) => {
      const key = `results[${index}]`
      formData.append(`${key}[no_reference]`, form.no_reference)
      formData.append(`${key}[notes]`, form.notes)
      formData.append(`${key}[customer_response]`, form.customer_response)
      formData.append(`${key}[has_complaint]`, form.has_complaint ? '1' : '0')
      formData.append(`${key}[complaint_detail]`, form.complaint_detail || '')
      formData.append(`${key}[has_potential_order]`, form.has_potential_order ? '1' : '0')
      formData.append(`${key}[potential_order_detail]`, form.potential_order_detail || '')
      formData.append(`${key}[follow_up_at]`, form.follow_up_at)
      formData.append(`${key}[follow_up_notes]`, form.follow_up_notes || '')
      formData.append(`${key}[follow_up_type]`, form.follow_up_type)
      if (form.check_out_file) formData.append(`${key}[check_out_file]`, form.check_out_file)
    })

    const result = await visitDataStore.submitCheckOutCustomers(visitId, formData)
    if (result.success) {
      toast.success(result.message || 'Check out customer berhasil')
      showCheckOutCustomerModal.value = false
      customerCheckOutForms.value = [emptyCustomerCheckOutForm()]
      await restoreActiveCustomerVisit() // ← reset status biar tombol balik jadi "Visit" lagi tanpa refresh
    } else toast.error(result.message || 'Gagal check out customer')
  } catch (err) {
    console.error(err)
    toast.error('Terjadi kesalahan saat check out customer')
  } finally {
    loadingCustomerCheckOut.value = false
  }
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="bullseye" />
          Target Visit Saya
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" />
            Dashboard
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Target Visit</span>
        </div>
      </div>
      <span class="sales-chip">
        <font-awesome-icon icon="user" /> {{ myName }}
      </span>
    </div>

    <div class="toolbar-top">
      <div class="month-picker-wrap">
        <font-awesome-icon icon="calendar-days" class="month-picker-icon" />
        <input
          type="month"
          :value="store.periodMonth"
          class="month-picker-input"
          @change="store.changeMonth($event.target.value)"
        />
      </div>
      <div class="toolbar-hint">
        <font-awesome-icon icon="circle-info" /> Target ini dikasih sama Manager kamu, di-update otomatis tiap kali kamu selesai visit.
      </div>
    </div>

    <div v-if="store.loading" class="td-center-loading">
      <font-awesome-icon icon="spinner" spin /> Memuat data target visit...
    </div>

    <template v-else>
      <!-- ── HERO SUMMARY ── -->
      <div class="hero-summary mb-2">
        <div class="hero-ring-wrap">
          <svg viewBox="0 0 120 120" class="hero-ring">
            <circle cx="60" cy="60" r="52" class="hero-ring-track" />
            <circle
              cx="60" cy="60" r="52" class="hero-ring-fill"
              :style="{ strokeDasharray: 326.7, strokeDashoffset: 326.7 - (326.7 * store.avgPercentage / 100) }"
            />
          </svg>
          <div class="hero-ring-label">
            <div class="hero-ring-value">{{ store.avgPercentage }}%</div>
            <div class="hero-ring-sub">Rata-rata</div>
          </div>
        </div>

        <div class="hero-stats">
          <div class="hero-stat-item">
            <div class="hero-stat-value">{{ store.totalVisitsDone }} / {{ store.totalVisitsPlanned }}</div>
            <div class="hero-stat-label">Total Kunjungan (dari semua target)</div>
          </div>
          <div class="hero-stat-item">
            <div class="hero-stat-value">{{ store.achievedCount }} / {{ store.totalTargets }}</div>
            <div class="hero-stat-label">Target Visit Sudah Tercapai</div>
          </div>
          <div class="hero-stat-item">
            <div class="hero-stat-value">{{ store.totalTargets - store.achievedCount }}</div>
            <div class="hero-stat-label">Target Visit Masih Berjalan</div>
          </div>
        </div>
      </div>

      <div class="section-title">
        <font-awesome-icon icon="list-check" />
        <span>Daftar Target Bulan Ini</span>
        <span class="count">{{ store.totalTargets }}</span>
      </div>

      <div class="target-grid flex-grow-1 overflow-auto mb-3">
        <div v-if="store.sortedTargets.length === 0" class="empty-state">
          <font-awesome-icon icon="inbox" class="empty-icon" />
          <div>Belum ada target visit buat bulan ini.</div>
        </div>

        <div v-else v-for="row in store.sortedTargets" :key="row.id" class="target-card" :class="{ done: row.is_achieved }">
          <div class="target-card-top">
            <span class="activity-badge" :style="{ background: colorForType(row.target_type) + '20', color: colorForType(row.target_type) }">
              <font-awesome-icon :icon="row.target_type === 'branch' ? 'code-branch' : 'building'" />
              {{ row.target_note }}
            </span>
            <span class="result-chip" :class="row.is_achieved ? 'status-done' : 'status-pending'">
              <font-awesome-icon :icon="row.is_achieved ? 'circle-check' : 'hourglass-half'" />
              {{ row.is_achieved ? 'Tercapai' : 'Berjalan' }}
            </span>
          </div>

          <div class="target-card-name">{{ row.target_name }}</div>

          <div class="target-progress-row">
            <div class="progress-bar-track">
              <div class="progress-bar-fill" :class="{ done: row.is_achieved }" :style="{ width: Math.min(row.percentage, 100) + '%' }"></div>
            </div>
            <span class="progress-cell-label">{{ row.achieved_count }}/{{ row.target_count }} kunjungan · {{ row.percentage }}%</span>
          </div>

          <!-- ── TOMBOL VISIT / CHECK IN / CHECK OUT (3-state, konsep sama
               persis seperti di Customer Master) ── -->
          <div class="target-card-actions">
            <template v-if="!isRowActive(row)">
              <button
                class="visit-btn"
                :disabled="loadingVisitNow || !!activeVisitCustomersId || !hasCoordinates(row)"
                :title="activeVisitCustomersId ? 'Selesaikan visit aktif dahulu' : (!hasCoordinates(row) ? 'Titik lokasi (Latitude/Longitude) belum diisi. Lengkapi dulu di Customer Master.' : 'Visit')"
                @click="openVisitNow(row)"
              >
                <font-awesome-icon icon="location-dot" /> Visit
              </button>
            </template>
            <template v-else>
              <button
                v-if="activeCustomerPhase === 'visiting'"
                class="visit-btn checkin-btn"
                @click="checkInCustomer(row)"
              >
                <font-awesome-icon icon="right-to-bracket" /> Check In
              </button>
              <button
                v-if="activeCustomerPhase === 'checked_in'"
                class="visit-btn checkout-btn"
                @click="openCustomerCheckOut(row)"
              >
                <font-awesome-icon icon="right-from-bracket" /> Check Out
              </button>
            </template>
          </div>

          <div v-if="row.notes" class="target-card-note">
            <font-awesome-icon icon="note-sticky" /> {{ row.notes }}
          </div>

          <div class="target-card-foot">
            Dibuat oleh {{ row.created_by_name }}
          </div>
        </div>
      </div>
    </template>

    <!-- MODAL VISIT CONFIRMATION (reuse startVisitCustomers dari Sales Visit,
         sama persis konsepnya dengan modal di CustomersManagement.vue) -->
    <AppModal
      :show="showVisitNowModal && !!selectedVisitItem"
      title="Visit Confirmation"
      icon="location-dot"
      size="sm"
      @close="closeVisitNowModal"
    >
      <div v-if="selectedVisitItem" class="form-container-gap">
        <div class="visit-confirm-box">
          <p class="detail-section-label" style="padding-top:0;border-top:none;margin-top:0">Customers to be visited</p>
          <p style="font-weight:700; font-size:0.95rem">{{ selectedVisitItem.company_name }}</p>
          <p v-if="isBranchRow(selectedVisitItem)" class="td-sub text-primary" style="margin-top:2px">
            <font-awesome-icon icon="code-branch" />
            {{ selectedVisitItem.branch_name }}<span v-if="selectedVisitItem.city"> — {{ selectedVisitItem.city }}</span>
          </p>
          <p v-else class="td-sub text-primary" style="margin-top:2px">
            <font-awesome-icon icon="building" /> Head Office
          </p>
        </div>
        <div class="detail-list">
          <div class="detail-row">
            <span class="detail-label">Contact</span>
            <span class="detail-value">{{ selectedVisitItem.contact_name ?? '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value">{{ selectedVisitItem.customer_status ?? '-' }}</span>
          </div>
        </div>
        <div class="visit-warning-box">
          <font-awesome-icon icon="triangle-exclamation" />
          Once the visit starts, the system will automatically record the visit time.
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeVisitNowModal" :disabled="loadingVisitNow">Cancel</button>
        <button class="btn-save" @click="confirmVisitNow" :disabled="loadingVisitNow">
          <font-awesome-icon v-if="loadingVisitNow" icon="spinner" spin />
          <font-awesome-icon v-else icon="location-dot" />
          {{ loadingVisitNow ? 'Processing...' : 'Yes, Visit Now' }}
        </button>
      </template>
    </AppModal>

    <!-- MODAL CHECK IN CUSTOMER (copy persis dari Customer Master) -->
    <AppModal
      :show="showCheckInModalCustomers"
      title="Check In Customer"
      icon="right-to-bracket"
      size="xl"
      @close="closeCheckInModalCustomers"
    >
      <div class="checkin-grid">
        <div class="camera-section">
          <div class="camera-wrap">
            <video v-if="!capturedPhoto" ref="videoRef" autoplay playsinline muted class="camera-video"></video>
            <img v-else :src="capturedPhoto" class="camera-video" />
            <div v-if="!capturedPhoto" class="live-badge">
              <span class="live-dot"></span> LIVE CAMERA
            </div>
          </div>
          <button
            v-if="!capturedPhoto"
            @click="capturePhoto"
            :disabled="!locationReady || isGettingLocation"
            class="btn-save" style="width:100%; padding:14px; justify-content:center; margin-top:10px"
          >
            <template v-if="isGettingLocation">
              <font-awesome-icon icon="spinner" spin /> Detecting GPS...
            </template>
            <template v-else>
              <font-awesome-icon icon="camera" /> Take Photo
            </template>
          </button>
          <button
            v-if="capturedPhoto"
            @click="retakePhoto"
            class="btn-cancel" style="width:100%; padding:14px; text-align:center; margin-top:10px"
          >
            <font-awesome-icon icon="rotate" /> Retake Photo
          </button>
        </div>

        <div class="form-container-gap">
          <div class="detail-list">
            <div class="detail-row">
              <span class="detail-label">Date & Time</span>
              <span class="detail-value">{{ currentDateTime }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Company</span>
              <span class="detail-value">{{ selectedVisitItem?.company_name ?? '-' }}</span>
            </div>
            <div class="detail-row" style="flex-direction:column; align-items:flex-start; gap:4px">
              <span class="detail-label">Location GPS</span>
              <div v-if="isGettingLocation" class="td-muted">
                <font-awesome-icon icon="spinner" spin /> Detecting location...
              </div>
              <div v-else-if="locationReady" style="font-size:0.84rem; color:var(--text-primary)">
                {{ currentLocation.address }}
              </div>
              <div v-else style="font-size:0.84rem; color:#ef4444">
                <font-awesome-icon icon="circle-exclamation" /> Failed to get location
              </div>
            </div>
          </div>
          <div v-if="capturedPhoto" class="visit-confirm-box" style="color:#065f46; background:#d1fae5; border-color:#6ee7b7;">
            <font-awesome-icon icon="circle-check" /> Photo berhasil diambil. Siap untuk submit.
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeCheckInModalCustomers">Cancel</button>
        <button
          class="btn-save"
          @click="submitCheckInCustomers"
          :disabled="loadingCheckIn || !capturedPhoto"
        >
          <font-awesome-icon v-if="loadingCheckIn" icon="spinner" spin />
          <font-awesome-icon v-else icon="cloud-arrow-up" />
          {{ loadingCheckIn ? 'Submitting...' : 'Submit Check In' }}
        </button>
      </template>
    </AppModal>

    <canvas ref="canvasRef" style="display:none"></canvas>

    <!-- MODAL CHECK OUT CUSTOMER (copy persis dari Customer Master) -->
    <AppModal
      :show="showCheckOutCustomerModal"
      title="Check Out Customer"
      icon="right-from-bracket"
      size="lg"
      @close="closeCustomerCheckOutModal"
    >
      <div class="form-container-gap">
        <div v-if="selectedVisitItem" class="visit-confirm-box">
          <p style="font-weight:700">{{ selectedVisitItem.company_name }}</p>
          <p class="td-muted">{{ selectedVisitItem.contact_name }}</p>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px">
          <div>
            <p class="detail-section-label" style="border-top:none;padding-top:0;margin-top:0">Hasil Kunjungan</p>
            <p class="td-muted" style="margin:3px 0 0">Satu form untuk setiap nomor referensi.</p>
          </div>
          <button type="button" class="btn-save" @click="addCustomerCheckOutResult">
            <font-awesome-icon icon="plus" /> Tambah Form Check Out
          </button>
        </div>

        <div
          v-for="(form, index) in customerCheckOutForms"
          :key="index"
          class="visit-confirm-box"
          style="display:flex; flex-direction:column; gap:14px"
        >
          <div style="display:flex; justify-content:space-between; align-items:center; gap:12px">
            <strong style="color:#ef4444">Form Check Out Customer {{ index + 1 }}</strong>
            <button
              v-if="customerCheckOutForms.length > 1"
              type="button"
              class="btn-cancel"
              @click="removeCustomerCheckOutResult(index)"
            > <font-awesome-icon icon="trash-can" /> Hapus</button>
          </div>

          <div class="form-group">
            <label>No. Reference <span class="required">*</span></label>
            <input v-model.trim="form.no_reference" type="text" maxlength="100" placeholder="Masukkan nomor referensi..." class="form-input" />
          </div>

          <div class="form-group">
            <label>Upload File / Foto Check Out</label>
            <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif" class="form-input" @change="onCheckOutFileChange($event, form)" />
            <small v-if="form.check_out_file" class="td-muted">File dipilih: {{ form.check_out_file.name }}</small>
          </div>

          <div class="form-group">
            <label>Notes on Visit Result <span class="required">*</span></label>
            <RichTextEditor v-model="form.notes" placeholder="Write visit result here..." />
          </div>

          <div class="form-group">
            <label>Customer Response <span class="required">*</span></label>
            <div class="response-grid">
              <button
                v-for="item in customerResponses"
                :key="item.value"
                type="button"
                class="response-btn"
                :class="form.customer_response === item.value ? 'response-active-emerald' : ''"
                @click="selectCustomerResponse(form, item.value)"
              >
                <font-awesome-icon :icon="item.icon.replace('fa-solid fa-', '')" />
                <div><p style="font-weight:600; margin:0; font-size:0.84rem">{{ item.label }}</p><p style="font-size:0.72rem; color:var(--text-muted); margin:0">{{ item.desc }}</p></div>
              </button>
            </div>
          </div>

          <div v-if="form.has_complaint" class="form-group">
            <label style="color:#ef4444">Complaint / Issue <span>*</span></label>
            <RichTextEditor v-model="form.complaint_detail" placeholder="Describe customer complaint or issue..." />
          </div>

          <div v-if="form.has_potential_order" class="form-group">
            <label style="color:#d97706">Additional Notes <span>*</span></label>
            <RichTextEditor v-model="form.potential_order_detail" placeholder="Explain potential order or future plan..." />
          </div>

          <div class="form-group">
            <label>Follow Up Date / Next Action Plan Date <span class="required">*</span></label>
            <input v-model="form.follow_up_at" type="datetime-local" :min="tomorrowDateTime" class="form-input" />
          </div>

          <div class="form-group">
            <label>Follow Up Type <span class="required">*</span></label>
            <div style="display:flex; flex-wrap:wrap; gap:8px">
              <button v-for="type in followUpTypes" :key="type" type="button" @click="form.follow_up_type = type" class="pill-btn" :class="{ active: form.follow_up_type === type }">{{ type }}</button>
            </div>
          </div>

          <div class="form-group">
            <label>Follow Up Notes</label>
            <RichTextEditor v-model="form.follow_up_notes" placeholder="Write next follow up notes..." />
          </div>

          <span style="font-size:0.78rem; color:var(--text-muted)">{{ isCustomerResultValid(form) ? '✔️ form siap disimpan' : 'Lengkapi form referensi ini' }}</span>
        </div>

      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeCustomerCheckOutModal" :disabled="loadingCustomerCheckOut">Cancel</button>
        <button
          class="btn-save"
          @click="submitCustomerCheckOut"
          :disabled="loadingCustomerCheckOut || !isCustomerCheckOutValid"
        >
          <font-awesome-icon v-if="loadingCustomerCheckOut" icon="spinner" spin />
          <font-awesome-icon v-else icon="floppy-disk" />
          {{ loadingCustomerCheckOut ? 'Saving...' : 'Save Check Out' }}
        </button>
      </template>
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
.sales-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 20px; background: rgba(13,148,136,0.1); color: #0d9488; font-size: 0.74rem; font-weight: 700; }

.toolbar-top {
  display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); border-radius: 10px;
  padding: 12px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); flex-wrap: wrap; gap: 10px;
}
.month-picker-wrap { display: flex; align-items: center; gap: 8px; padding: 7px 12px; background: var(--bg-input); border: 1px solid var(--border-main); border-radius: 8px; }
.month-picker-icon { color: #6366f1; }
.month-picker-input { border: none; background: transparent; color: var(--text-primary); font-size: 0.85rem; font-weight: 600; outline: none; }
.toolbar-hint { font-size: 0.78rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }

.td-center-loading { text-align: center; padding: 60px 0; color: var(--text-muted); font-size: 0.9rem; }

/* ===== HERO SUMMARY (ring + stat) ===== */
.hero-summary {
  background: var(--bg-card); border-radius: 12px; padding: 20px 24px; box-shadow: 0 1px 3px var(--shadow-color);
  display: flex; align-items: center; gap: 28px; flex-wrap: wrap;
}
.hero-ring-wrap { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
.hero-ring { width: 120px; height: 120px; transform: rotate(-90deg); }
.hero-ring-track { fill: none; stroke: var(--bg-input); stroke-width: 10; }
.hero-ring-fill { fill: none; stroke: #6366f1; stroke-width: 10; stroke-linecap: round; transition: stroke-dashoffset 0.4s ease; }
.hero-ring-label { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.hero-ring-value { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); }
.hero-ring-sub { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }

.hero-stats { display: flex; gap: 28px; flex-wrap: wrap; flex: 1; }
.hero-stat-item { display: flex; flex-direction: column; gap: 4px; }
.hero-stat-value { font-size: 1.4rem; font-weight: 800; color: var(--text-primary); }
.hero-stat-label { font-size: 0.76rem; color: var(--text-muted); font-weight: 500; max-width: 180px; }

.section-title { display: flex; align-items: center; gap: 8px; font-size: 0.92rem; font-weight: 700; margin: 4px 2px 8px; }
.section-title .count { font-size: 0.76rem; color: #6366f1; background: rgba(99,102,241,0.1); padding: 2px 9px; border-radius: 20px; font-weight: 700; }

/* ===== TARGET CARDS ===== */
.target-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; align-content: start; }
.target-card {
  background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 12px; padding: 16px;
  box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: column; gap: 10px;
}
.target-card.done { border-color: rgba(34,197,94,0.35); background: rgba(34,197,94,0.03); }
.target-card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.target-card-name { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }

.activity-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 0.7rem; font-weight: 700; padding: 3px 9px; border-radius: 20px; white-space: nowrap; }

.result-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 0.7rem; font-weight: 700; padding: 3px 9px; border-radius: 20px; white-space: nowrap; }
.result-chip.status-pending { background: rgba(245,158,11,0.12); color: #b45309; }
.result-chip.status-done { background: rgba(34,197,94,0.12); color: #16a34a; }

.target-progress-row { display: flex; flex-direction: column; gap: 6px; }
.progress-bar-track { height: 9px; border-radius: 20px; background: var(--bg-input); overflow: hidden; }
.progress-bar-fill { height: 100%; border-radius: 20px; background: #6366f1; transition: width 0.3s ease; }
.progress-bar-fill.done { background: #22c55e; }
.progress-cell-label { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }

/* ===== TOMBOL VISIT / CHECK IN / CHECK OUT ===== */
.target-card-actions { display: flex; justify-content: flex-end; gap: 8px; }
.visit-btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 8px;
  border: none; background: #6366f1; color: #fff; font-size: 0.78rem; font-weight: 700; cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;
}
.visit-btn:hover:not(:disabled) { background: #4f46e5; }
.visit-btn:disabled { opacity: 0.45; cursor: not-allowed; background: #94a3b8; }
.visit-btn.checkin-btn { background: #10b981; }
.visit-btn.checkin-btn:hover:not(:disabled) { background: #059669; }
.visit-btn.checkout-btn { background: #ef4444; }
.visit-btn.checkout-btn:hover:not(:disabled) { background: #dc2626; }

.target-card-note { font-size: 0.78rem; color: var(--text-muted); background: var(--bg-input); border-radius: 8px; padding: 8px 10px; display: flex; gap: 6px; align-items: flex-start; }
.target-card-foot { font-size: 0.7rem; color: var(--text-muted); opacity: 0.8; }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--text-muted); padding: 60px 0; grid-column: 1 / -1; }
.empty-icon { font-size: 2.2rem; opacity: 0.3; }

/* ===== MODAL: shared bits (copy dari Customer Master, dipakai modal Visit/Check In/Check Out) ===== */
.form-container-gap { display: flex; flex-direction: column; gap: 14px; }
.td-muted { color: var(--text-muted); font-size: 0.84rem; }
.td-sub { color: var(--text-muted); font-size: 0.78rem; margin-top: 2px; }
.text-primary { color: #6366f1 !important; }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; display: flex; align-items: center; gap: 8px; }
.required { color: #ef4444; }
.form-input { padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.875rem; background: var(--bg-input); color: var(--text-primary); outline: none; transition: border 0.18s; width: 100%; box-sizing: border-box; }
.form-input:focus { border-color: #6366f1; }

.btn-cancel { padding: 8px 18px; background: var(--bg-main, #f1f5f9); color: var(--text-muted); border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
.btn-cancel:hover { background: var(--border-main); color: var(--text-primary); }
.btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.18s; }
.btn-save:hover:not(:disabled) { background: #4f46e5; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

.pill-btn { padding: 6px 14px; border: 1px solid var(--border-main); border-radius: 20px; background: var(--bg-input); color: var(--text-primary); font-size: 0.82rem; font-weight: 500; cursor: pointer; transition: all 0.15s; }
.pill-btn:hover { border-color: #6366f1; color: #6366f1; }
.pill-btn.active { background: #6366f1; border-color: #6366f1; color: #fff; font-weight: 600; }

.detail-list { display: flex; flex-direction: column; }
.detail-section-label { font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.09em; color: #6366f1; padding: 12px 0 4px; border-top: 1px solid var(--border-main); margin-top: 8px; }
.detail-section-label:first-child { margin-top: 0; border-top: none; }
.detail-row { display: flex; align-items: flex-start; justify-content: space-between; padding: 9px 0; border-bottom: 1px dashed var(--border-main); gap: 12px; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); flex-shrink: 0; }
.detail-value { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); text-align: right; }

.visit-confirm-box { background: var(--bg-input); border: 1px solid var(--border-main); border-radius: 10px; padding: 14px 16px; }
.visit-warning-box { display:flex; align-items:flex-start; gap:8px; padding:10px 14px; background:#fffbeb; border:1px solid #fcd34d; border-radius:8px; font-size:0.82rem; color:#92400e; }

.checkin-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
@media (max-width: 640px) { .checkin-grid { grid-template-columns:1fr; } }
.camera-section { display:flex; flex-direction:column; }
.camera-wrap { position:relative; border-radius:16px; overflow:hidden; background:#000; aspect-ratio:16/9; }
.camera-video { width:100%; height:100%; object-fit:cover; display:block; }
.live-badge { position:absolute; top:10px; left:10px; display:inline-flex; align-items:center; gap:6px; padding:4px 10px; background:#ef4444; color:#fff; border-radius:99px; font-size:0.72rem; font-weight:700; }
.live-dot { width:7px; height:7px; border-radius:50%; background:#fff; animation:ping-anim 1s infinite; }
@keyframes ping-anim { 0%,100%{opacity:1} 50%{opacity:0.3} }

.response-grid { display:grid; grid-template-columns:repeat(2, 1fr); gap:8px; }
.response-btn {
  display:flex; align-items:center; gap:8px;
  padding:10px 12px; border-radius:10px;
  border:1.5px solid var(--border-main);
  background:var(--bg-input); cursor:pointer;
  font-size:0.82rem; font-weight:500; transition:all 0.18s;
  color:var(--text-primary); text-align:left;
}
.response-btn:hover { border-color:#6366f1; color:#6366f1; }
.response-active-emerald { border-color:#10b981 !important; background:#d1fae5 !important; color:#065f46 !important; }

@media (max-width: 700px) {
  .hero-summary { flex-direction: column; align-items: flex-start; }
  .hero-stats { gap: 18px; }
  .checkin-grid { grid-template-columns:1fr; }
  .response-grid { grid-template-columns:1fr; }
}
</style>