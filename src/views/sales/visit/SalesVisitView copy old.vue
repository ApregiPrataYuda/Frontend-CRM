<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { useToast }    from 'vue-toastification'
import AppModal        from '@/components/AppModal.vue'


import { useVisitDataStore }      from '@/stores/VisitSalesStore'
import { useLeadsVisitStore }     from '@/stores/leadsVisitStore'
import { useCustomersVisitStore } from '@/stores/customersVisitStore'
import { usePermissionStore } from '@/stores/PermissionStore'

const router = useRouter()
const route  = useRoute()
const toast               = useToast()
const visitDataStore      = useVisitDataStore()
const leadsVisitStore     = useLeadsVisitStore()
const customersVisitStore = useCustomersVisitStore()
const permission  = usePermissionStore()


// ── PERMISSIONS ───────────────────────────────────────
const currentUrl = computed(() => route.path.replace('/app', ''))
const canCreate  = computed(() => permission.canCreate(currentUrl.value))
const canUpdate  = computed(() => permission.canUpdate(currentUrl.value))
const canDelete  = computed(() => permission.canDelete(currentUrl.value))
const canView    = computed(() => permission.canView(currentUrl.value))

// ── Store refs ──
const {
  visitsData, loadingVisits, pagination, searchVisits, sort,
  visitsDetail, loadingDetail, loadingVisitNow,
  activeVisitId, activeVisitCustId,
  activeVisitLeadId, activeVisitCustomersId,
} = storeToRefs(visitDataStore)

const {
  leadsData, loadingLeads,
  pagination: leadPagination,
  searchLeads, activeLeadPhase,
} = storeToRefs(leadsVisitStore)

const {
  customersData, loadingCustomers,
  pagination: customersPagination,
  searchCustomers, activeCustomerPhase,
} = storeToRefs(customersVisitStore)

// ── Toolbar dropdowns ──
const showPerPageMenu = ref(false)
const showSortByMenu  = ref(false)
const showSortDirMenu = ref(false)

// ── View mode (card / table) ──
const viewMode = ref('card') // default tampilan: card

const sortByOptions = [
  { label: 'Created Date', value: 'created_at'   },
  { label: 'Visit Code',   value: 'visit_code'   },
  { label: 'Company',      value: 'company_name' },
]
const sortByLabel = computed(() =>
  sortByOptions.find(o => o.value === sort.value.column)?.label ?? 'Created Date'
)

const photoBase = `${import.meta.env.VITE_STORAGE_URL}/`

// ════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════
onMounted(async () => {
  visitDataStore.fetchVisits(visitDataStore.buildUrl())
  updateCurrentDateTime()
  clockInterval = setInterval(updateCurrentDateTime, 1000)
  await restoreActiveState()
})

onUnmounted(() => {
  clearInterval(clockInterval)
  stopCamera()
})

watch(searchVisits, visitDataStore.searchWithDelay)

// ════════════════════════════════════════════
// CLOCK
// ════════════════════════════════════════════
const currentDateTime = ref('')
let   clockInterval   = null

function updateCurrentDateTime() {
  currentDateTime.value = new Date().toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function nowFormatted() {
  return new Date().toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

// ════════════════════════════════════════════
// RESTORE ACTIVE STATE
// ════════════════════════════════════════════
async function restoreActiveState() {
  await visitDataStore.fetchVisits(visitDataStore.buildUrl())

  const activeLeadVisit = visitsData.value.find(
    v => v.visit_type === 'LEAD' && v.check_out_at === null
  )
  if (activeLeadVisit) {
    visitDataStore.activeVisitLeadId = activeLeadVisit.lead_id
    visitDataStore.activeVisitId     = activeLeadVisit.id
    activeLeadPhase.value = activeLeadVisit.check_in_at ? 'checked_in' : 'visiting'
  } else {
    visitDataStore.activeVisitLeadId = null
    visitDataStore.activeVisitId     = null
    activeLeadPhase.value            = null
  }

  const activeCustomerVisit = visitsData.value.find(
    v => v.visit_type === 'CUSTOMER' && v.check_out_at === null
  )
  if (activeCustomerVisit) {
    visitDataStore.activeVisitCustomersId = activeCustomerVisit.customer_id
    visitDataStore.activeVisitCustId      = activeCustomerVisit.id
    activeCustomerPhase.value = activeCustomerVisit.check_in_at ? 'checked_in' : 'visiting'
  } else {
    visitDataStore.activeVisitCustomersId = null
    visitDataStore.activeVisitCustId      = null
    activeCustomerPhase.value             = null
  }
}

// ════════════════════════════════════════════
// CAMERA (shared)
// ════════════════════════════════════════════
const videoRef          = ref(null)
const canvasRef         = ref(null)
const cameraStream      = ref(null)
const capturedPhoto     = ref(null)
const currentLocation   = ref({ latitude: null, longitude: null, address: '' })
const isGettingLocation = ref(false)
const locationReady     = ref(false)
const selectedVisit     = ref(null)
const loadingCheckIn    = ref(false)

async function startCamera() {
  try {
    stopCamera()
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
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
  ctx.fillText(`🏢 ${selectedVisit.value?.company_name || 'Visit Sales'}`, 20, canvas.height - 75)
  ctx.font = '20px Arial'
  ctx.fillText(`🕒 ${currentDateTime.value}`, 20, canvas.height - 45)
  ctx.font = '18px Arial'
  wrapText(ctx, `📍 ${currentLocation.value.address || 'Location unavailable'}`, 20, canvas.height - 18, canvas.width - 40, 22)

  capturedPhoto.value = canvas.toDataURL('image/jpeg', 1)
  stopCamera()
}

async function retakePhoto() {
  capturedPhoto.value = null
  await startCamera()
}

// ════════════════════════════════════════════
// DETAIL MODAL
// ════════════════════════════════════════════
const showDetailModal = ref(false)

async function openDetail(id) {
  showDetailModal.value = true
  await visitDataStore.detailVisits(id)
}
function closeDetail() {
  showDetailModal.value       = false
  visitDataStore.visitsDetail = null
}

// ════════════════════════════════════════════
// LEADS LIST MODAL
// ════════════════════════════════════════════
const showLeadForm = ref(false)

function openLeadForm() {
  showLeadForm.value = true
  leadsVisitStore.fetchLeadsVisit()
}
function closeLeadModal() { showLeadForm.value = false }

// ════════════════════════════════════════════
// LEAD — VISIT NOW
// ════════════════════════════════════════════
const showVisitNowModal = ref(false)
const selectedLead      = ref(null)

function visitNow(item) { selectedLead.value = item; showVisitNowModal.value = true }
function closeVisitNowModal() {
  if (loadingVisitNow.value) return
  showVisitNowModal.value = false; selectedLead.value = null
}
async function confirmVisitNow() {
  if (!selectedLead.value) return
  const { success, message } = await visitDataStore.startVisit(selectedLead.value.id)
  if (success) {
    toast.success(message)
    activeLeadPhase.value = 'visiting'
    closeVisitNowModal()
    visitDataStore.fetchVisits(visitDataStore.buildUrl())
    leadsVisitStore.fetchLeadsVisit()
  } else { toast.error(message) }
}

// ════════════════════════════════════════════
// LEAD — CHECK IN
// ════════════════════════════════════════════
const showCheckInModal = ref(false)

async function checkIn(item) {
  selectedVisit.value = item; capturedPhoto.value = null
  showCheckInModal.value = true
  await nextTick(); await startCamera(); await getCurrentLocation()
}
function closeCheckInModal() {
  showCheckInModal.value = false; capturedPhoto.value = null; stopCamera()
}
async function submitCheckIn() {
  if (!activeVisitId.value) { toast.error('Visit belum dimulai. Lakukan "Visit Now" terlebih dahulu.'); return }
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
    const result = await visitDataStore.submitCheckIn(activeVisitId.value, formData)
    if (result.success) {
      toast.success(result.message)
      activeLeadPhase.value = 'checked_in'
      closeCheckInModal()
      visitDataStore.fetchVisits(visitDataStore.buildUrl())
    } else { toast.error(result.message) }
  } catch (err) { console.error(err); toast.error('Gagal check in')
  } finally { loadingCheckIn.value = false }
}

// ════════════════════════════════════════════
// LEAD — CHECK OUT
// ════════════════════════════════════════════
const showCheckOutModal    = ref(false)
const selectedCheckOut     = ref(null)
const checkOutNotes        = ref('')
const checkOutResponse     = ref('')
const localCheckOutLoading = ref(false)

const leadResponseOptions = [
  { value: 'potential_customers',   label: 'Potential Customers',   icon: 'fa-solid fa-seedling',     color: 'emerald' },
  { value: 'consideration_stage',   label: 'Consideration Stage',   icon: 'fa-solid fa-comments',     color: 'blue'    },
  { value: 'prospective_customers', label: 'Prospective Customers', icon: 'fa-solid fa-star',         color: 'indigo'  },
  { value: 'failed',                label: 'Failed',                icon: 'fa-solid fa-circle-xmark', color: 'rose'    },
  { value: 'convert_to_customer',   label: 'Convert To Customer',   icon: 'fa-solid fa-rocket',       color: 'amber'   },
]

const isLeadCheckOutValid     = computed(() => checkOutNotes.value.trim().length > 0 && checkOutResponse.value !== '')
const selectedLeadResponseOpt = computed(() => leadResponseOptions.find(o => o.value === checkOutResponse.value) ?? null)

function checkOut(item) {
  selectedCheckOut.value = item; checkOutNotes.value = ''; checkOutResponse.value = ''
  showCheckOutModal.value = true
}
function closeCheckOutModal() {
  if (localCheckOutLoading.value) return
  showCheckOutModal.value = false; selectedCheckOut.value = null
  checkOutNotes.value = ''; checkOutResponse.value = ''
}
async function submitCheckOut() {
  if (!isLeadCheckOutValid.value) return
  const visitId = activeVisitId.value ?? selectedCheckOut.value?.id
  if (!visitId) { toast.error('Visit ID tidak ditemukan.'); return }
  localCheckOutLoading.value = true
  const result = await visitDataStore.submitCheckOut(visitId, {
    notes: checkOutNotes.value, customer_response: checkOutResponse.value,
  })
  localCheckOutLoading.value = false
  if (result.success) {
    activeLeadPhase.value = null
    toast.success(result.message ?? 'Check out success!')
    closeCheckOutModal()
    visitDataStore.fetchVisits(visitDataStore.buildUrl())
    leadsVisitStore.fetchLeadsVisit(leadsVisitStore.buildUrl())
  } else { toast.error(result.message) }
}

// ════════════════════════════════════════════
// CUSTOMERS LIST MODAL
// ════════════════════════════════════════════
const showCustomerForm = ref(false)

function openCustomerForm() {
  showCustomerForm.value = true
  customersVisitStore.fetchCustomersVisit()
}
function closeCustomerModal() { showCustomerForm.value = false }

// ════════════════════════════════════════════
// CUSTOMER — VISIT NOW
// ════════════════════════════════════════════
const showVisitCustNowModal = ref(false)
const selectedCust          = ref(null)

function visitNowCust(item) { selectedCust.value = item; showVisitCustNowModal.value = true }
function closeVisitCustNowModal() {
  if (loadingVisitNow.value) return
  showVisitCustNowModal.value = false; selectedCust.value = null
}

// ── branchId: null = visit ke head office, terisi = visit ke branch tertentu ──
async function confirmVisitCustNow() {
  if (!selectedCust.value) return

  const branchId = selectedCust.value.target_type === 'branch'
    ? Number(selectedCust.value.branch_id)
    : null

  console.log('Start visit payload:', {
    customer_id: selectedCust.value.id,
    target_type: selectedCust.value.target_type,
    branch_id: branchId,
  })

  const { success, message } = await visitDataStore.startVisitCustomers(
    selectedCust.value.id,
    branchId
  )

  if (success) {
    toast.success(message)
    activeCustomerPhase.value = 'visiting'
    closeVisitCustNowModal()
    visitDataStore.fetchVisits(visitDataStore.buildUrl())
  } else {
    toast.error(message)
  }
}

// ════════════════════════════════════════════
// CUSTOMER — CHECK IN
// ════════════════════════════════════════════
const showCheckInModalCustomers = ref(false)

async function checkInCustomers(item) {
  selectedVisit.value = item; capturedPhoto.value = null
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
      activeCustomerPhase.value = 'checked_in'
      toast.success(result.message)
      closeCheckInModalCustomers()
      visitDataStore.fetchVisits(visitDataStore.buildUrl())
    } else { toast.error(result.message) }
  } catch (err) { console.error(err); toast.error('Failed check in customer')
  } finally { loadingCheckIn.value = false }
}

// ════════════════════════════════════════════
// CUSTOMER — CHECK OUT
// ════════════════════════════════════════════
const showCheckOutCustomerModal = ref(false)
const selectedCustomerCheckOut  = ref(null)
const loadingCustomerCheckOut   = ref(false)

const customerResponses = [
  { value: 'maintained',        label: 'Relationship Maintained', desc: 'Routine visit / engagement',       icon: 'fa-solid fa-handshake'           },
  { value: 'improved',          label: 'Relationship Improved',   desc: 'Positive development',             icon: 'fa-solid fa-arrow-trend-up'      },
  { value: 'upsell_identified', label: 'Upsell Identified',       desc: 'Additional opportunity found',    icon: 'fa-solid fa-sack-dollar'          },
  { value: 'renewal_discussed', label: 'Renewal Discussed',       desc: 'Contract renewal / continuation', icon: 'fa-solid fa-file-signature'       },
  { value: 'complaint_handled', label: 'Complaint Handled',       desc: 'Issue addressed / resolved',      icon: 'fa-solid fa-triangle-exclamation' },
  { value: 'at_risk',           label: 'Customer At Risk',        desc: 'Low usage / negative signal',     icon: 'fa-solid fa-circle-exclamation'   },
  { value: 'no_progress',       label: 'No Progress',             desc: 'No significant outcome',          icon: 'fa-solid fa-minus'                },
]
const followUpTypes = ['CALL', 'VISIT', 'WHATSAPP', 'EMAIL', 'MEETING']

const customerCheckOutForm = ref({
  notes: '', customer_response: '',
  has_complaint: false, complaint_detail: '',
  has_potential_order: false, potential_order_detail: '',
  follow_up_at: '', follow_up_notes: '', follow_up_type: '',
})

const tomorrow = computed(() => {
  const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]
})

const showCustomerComplaintSection      = computed(() => ['complaint_handled', 'at_risk'].includes(customerCheckOutForm.value.customer_response))
const showCustomerPotentialOrderSection = computed(() => ['upsell_identified', 'improved'].includes(customerCheckOutForm.value.customer_response))
const isCustomerCheckOutValid           = computed(() => {
  const f = customerCheckOutForm.value
  if (!f.notes.trim() || !f.customer_response || !f.follow_up_at || !f.follow_up_type) return false
  if (f.has_complaint       && !f.complaint_detail.trim())       return false
  if (f.has_potential_order && !f.potential_order_detail.trim()) return false
  return true
})

watch(() => customerCheckOutForm.value.customer_response, (val) => {
  customerCheckOutForm.value.has_complaint       = ['complaint_handled', 'at_risk'].includes(val)
  customerCheckOutForm.value.has_potential_order = ['upsell_identified', 'improved'].includes(val)
  if (!customerCheckOutForm.value.has_complaint)       customerCheckOutForm.value.complaint_detail = ''
  if (!customerCheckOutForm.value.has_potential_order) customerCheckOutForm.value.potential_order_detail = ''
})

function openCustomerCheckOut(item) {
  selectedCustomerCheckOut.value = item
  customerCheckOutForm.value = {
    notes: '', customer_response: '', has_complaint: false, complaint_detail: '',
    has_potential_order: false, potential_order_detail: '',
    follow_up_at: '', follow_up_notes: '', follow_up_type: '',
  }
  showCheckOutCustomerModal.value = true
}
function closeCustomerCheckOutModal() {
  showCheckOutCustomerModal.value = false; selectedCustomerCheckOut.value = null
  customerCheckOutForm.value = {
    notes: '', customer_response: '', has_complaint: false, complaint_detail: '',
    has_potential_order: false, potential_order_detail: '',
    follow_up_at: '', follow_up_notes: '', follow_up_type: '',
  }
}
async function submitCustomerCheckOut() {
  const visitId = activeVisitCustId.value ?? selectedCustomerCheckOut.value?.id
  if (!visitId) { toast.error('Visit ID tidak ditemukan.'); return }
  const f = customerCheckOutForm.value
  loadingCustomerCheckOut.value = true
  try {
    const result = await visitDataStore.submitCheckOutCustomers(visitId, {
      notes: f.notes, customer_response: f.customer_response,
      has_complaint: f.has_complaint, complaint_detail: f.complaint_detail,
      has_potential_order: f.has_potential_order, potential_order_detail: f.potential_order_detail,
      follow_up_at: f.follow_up_at, follow_up_notes: f.follow_up_notes, follow_up_type: f.follow_up_type,
    })
    if (result.success) {
      activeCustomerPhase.value = null
      toast.success(result.message || 'Check out customer berhasil')
      closeCustomerCheckOutModal()
      visitDataStore.fetchVisits(visitDataStore.buildUrl())
    } else { toast.error(result.message || 'Gagal check out customer') }
  } catch (err) { console.error(err); toast.error('Terjadi kesalahan saat check out customer')
  } finally { loadingCustomerCheckOut.value = false }
}


function getResultClass(result) {
  const map = {
    potential_customers : 'result-emerald',
    maintained          : 'result-emerald',
    consideration_stage : 'result-blue',
    improved            : 'result-blue',
    prospective_customers: 'result-indigo',
    renewal_discussed   : 'result-indigo',
    failed              : 'result-rose',
    at_risk             : 'result-rose',
    convert_to_customer : 'result-amber',
    upsell_identified   : 'result-amber',
    complaint_handled   : 'result-orange',
    no_progress         : 'result-slate',
  }
  return map[result] ?? 'result-slate'
}

function getResultIcon(result) {
  const map = {
    potential_customers  : 'seedling',
    consideration_stage  : 'comments',
    prospective_customers: 'star',
    failed               : 'circle-xmark',
    convert_to_customer  : 'rocket',
    maintained           : 'handshake',
    improved             : 'arrow-trend-up',
    upsell_identified    : 'sack-dollar',
    renewal_discussed    : 'file-signature',
    complaint_handled    : 'triangle-exclamation',
    at_risk              : 'circle-exclamation',
    no_progress          : 'minus',
  }
  return map[result] ?? 'tag'
}

// ── helpers ──
const canVisitNow = (item) => !item.visit_started_at && !item.check_in_at
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <!-- BREADCRUMB -->
    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="location-dot" /> Sales Visit Data
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item"><font-awesome-icon icon="house" /> Dashboard</span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Sales Visit Page</span>
        </div>
      </div>
    </div>

    <!-- TOOLBAR — 3 Action Buttons -->
    <div class="toolbar-top">
      <div class="toolbar-center">

        <template v-if="canCreate">
          <button class="btn-toolbar btn-purple" @click="openLeadForm">
            <font-awesome-icon icon="people-arrows" />
            <span class="btn-label">Visit Leads</span>
            <font-awesome-icon icon="location-arrow" class="btn-arrow-icon" />
          </button>

          <button class="btn-toolbar btn-purple" @click="openCustomerForm">
            <font-awesome-icon icon="handshake" />
            <span class="btn-label">Visit Customers</span>
            <font-awesome-icon icon="location-arrow" class="btn-arrow-icon" />
          </button>

          <button class="btn-toolbar btn-purple" @click="() => $router.push({ name: 'SalesFollowUp' })">
            <font-awesome-icon icon="phone-volume" />
            <span class="btn-label">Follow Up</span>
            <font-awesome-icon icon="location-arrow" class="btn-arrow-icon" />
          </button>
        </template>

        <div v-else class="no-access-info">
          <div class="alert alert-danger" role="alert">
            <font-awesome-icon icon="circle-info" />
            Anda tidak memiliki akses untuk membuat data visit!
          </div>
        </div>

      </div>
    </div>

    <!-- CONTROLS -->
    <div class="controls-card">
      <div class="controls-row">
        <div class="controls-left">
          <div class="showing-wrap">
            <font-awesome-icon icon="list" class="text-muted-color" />
            <span class="showing-label">Showing:</span>
            <div class="drop-wrap">
              <button class="btn-select" @click="showPerPageMenu = !showPerPageMenu">
                {{ pagination.per_page }} <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showPerPageMenu }">
                <div class="drop-label">Per halaman</div>
                <div class="perpage-grid">
                  <button
                    v-for="opt in [10, 25, 50, 100]" :key="opt"
                    class="perpage-opt" :class="{ active: pagination.per_page === opt }"
                    @click="pagination.per_page = opt; visitDataStore.changePageSize(); showPerPageMenu = false"
                  >{{ opt }}</button>
                </div>
              </div>
            </div>
          </div>

          <!-- TOGGLE VIEW: CARD / TABLE -->
          <div class="view-toggle">
            <button
              class="view-toggle-btn"
              :class="{ active: viewMode === 'card' }"
              @click="viewMode = 'card'"
              title="Tampilan Card"
            >
              <font-awesome-icon icon="table-cells" /> Card
            </button>
            <button
              class="view-toggle-btn"
              :class="{ active: viewMode === 'table' }"
              @click="viewMode = 'table'"
              title="Tampilan Table"
            >
              <font-awesome-icon icon="list" /> Table
            </button>
          </div>

          <button class="btn-toolbar btn-orange" @click="visitDataStore.resetFilters()">
            <font-awesome-icon icon="rotate-left" /> Reset
          </button>
        </div>

        <div class="controls-right">
          <div class="search-wrap">
            <input v-model="searchVisits" type="text" placeholder="Search visit..." class="search-input" />
            <button class="search-btn"><font-awesome-icon icon="magnifying-glass" /></button>
          </div>
          <div class="sort-wrap">
            <span class="showing-label">Sort:</span>
            <div class="drop-wrap">
              <button class="btn-select" @click="showSortByMenu = !showSortByMenu">
                {{ sortByLabel }} <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showSortByMenu }">
                <div class="drop-label">Sort By</div>
                <button
                  v-for="opt in sortByOptions" :key="opt.value"
                  class="drop-item" :class="{ active: sort.column === opt.value }"
                  @click="visitDataStore.toggleSort(opt.value); showSortByMenu = false"
                >{{ opt.label }}</button>
              </div>
            </div>
            <div class="drop-wrap">
              <button class="btn-select" @click="showSortDirMenu = !showSortDirMenu">
                {{ sort.direction.toUpperCase() }} <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-right" :class="{ show: showSortDirMenu }">
                <div class="drop-label">Urutan</div>
                <button
                  v-for="opt in ['desc', 'asc']" :key="opt"
                  class="drop-item" :class="{ active: sort.direction === opt }"
                  @click="sort.direction = opt; visitDataStore.fetchVisits(visitDataStore.buildUrl()); showSortDirMenu = false"
                >{{ opt.toUpperCase() }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════
         TABLE VIEW
         ══════════════════════════════════════════ -->
    <div v-if="viewMode === 'table'" class="table-card flex-grow-1 overflow-auto mb-3">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:60px">NO.</th>
            <th>Type</th>
            <th>Result Visit</th>
            <th>Visit Code</th>
            <th>Company</th>
            <th>Visit Time</th>
            <th>Check In</th>
            <th>Check Out</th>
            <th>To Check In</th>
            <th>To Check Out</th>
            <th>Duration</th>
            <th style="width:160px; text-align:center">ACTIONS</th>
          </tr>
        </thead>
        <tbody>

          <!-- LOADING -->
          <tr v-if="loadingVisits">
            <td colspan="12" class="td-center">
              <div style="display:flex;justify-content:center;">
                <div class="spinner-custom"></div>
              </div>
            </td>
          </tr>

          <!-- EMPTY -->
          <tr v-else-if="visitsData.length === 0">
            <td colspan="12" class="td-center">
             <div class="empty-state">
                <img src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif"
                  alt="No data" class="empty-img" />
                <div class="empty-text">No data found</div>
              </div>
            </td>
          </tr>

          <!-- DATA -->
          <tr
            v-else
            v-for="(visit, index) in visitsData"
            :key="visit.id"
            class="data-row"
          >
            <td class="td-no">{{ index + 1 + pagination.per_page * (pagination.current_page - 1) }}.</td>

            <!-- TYPE -->
            <td>
              <span class="visit-type-badge" :class="visit.visit_type === 'LEAD' ? 'type-lead' : 'type-customer'">
                <font-awesome-icon :icon="visit.visit_type === 'LEAD' ? 'user-clock' : 'building-user'" />
                {{ visit.visit_type }}
              </span>
            </td>

            <!-- RESULT -->
            <td>
              <span v-if="visit.visit_result" class="result-badge" :class="getResultClass(visit.visit_result)">
                <font-awesome-icon :icon="getResultIcon(visit.visit_result)" />
                {{ visit.visit_result?.replaceAll('_', ' ')?.replace(/\b\w/g, l => l.toUpperCase()) }}
              </span>
              <span v-else class="badge-empty">—</span>
            </td>

            <td class="td-name">{{ visit.visit_code }}</td>

            <!-- COMPANY + BRANCH INFO -->
            <td class="td-name" style="text-transform:capitalize">
              {{ visit.company_name }}
              <div v-if="visit.target_type === 'BRANCH'" class="td-sub text-primary" style="text-transform:none">
                <font-awesome-icon icon="code-branch" />
                {{ visit.branch_name }}<span v-if="visit.branch_city"> — {{ visit.branch_city }}</span>
              </div>
            </td>

            <!-- VISIT TIME -->
            <td>
              <div class="time-cell">
                <div class="time-icon"><font-awesome-icon icon="calendar" /></div>
                <div>
                  <p class="td-name">{{ visitDataStore.formatDateTime(visit.visit_at) }}</p>
                  <p class="td-muted">Scheduled Visit</p>
                </div>
              </div>
            </td>

            <!-- CHECK IN -->
            <td>
              <div v-if="visit.check_in_at" class="checkin-badge">
                <font-awesome-icon icon="right-to-bracket" />
                {{ visitDataStore.formatDateTime(visit.check_in_at) }}
              </div>
              <span v-else class="badge-empty">Not Checked In Yet</span>
            </td>

            <!-- CHECK OUT -->
            <td>
              <div v-if="visit.check_out_at" class="checkout-badge">
                <font-awesome-icon icon="right-from-bracket" />
                {{ visitDataStore.formatDateTime(visit.check_out_at) }}
              </div>
              <span v-else class="badge-empty">Not Checked Out Yet</span>
            </td>

            <td class="td-name">{{ visitDataStore.formatDuration(visit.time_from_visit_to_check_in) }}</td>
            <td class="td-name">{{ visitDataStore.formatDuration(visit.time_from_check_in_to_check_out) }}</td>
            <td class="td-name">{{ visitDataStore.formatDuration(visit.total_time_result) }}</td>

            <!-- ACTIONS -->
            <td class="td-actions">
              <button class="act-btn act-info" title="Detail" @click="openDetail(visit.id)">
                <font-awesome-icon icon="eye" />
              </button>
            </td>
          </tr>

        </tbody>
      </table>
    </div>

    <!-- ══════════════════════════════════════════
         CARD VIEW
         ══════════════════════════════════════════ -->
    <div v-else class="card-grid-wrap flex-grow-1 overflow-auto mb-3">

      <!-- LOADING -->
      <div v-if="loadingVisits" class="td-center" style="padding:40px 0">
        <div class="spinner-custom" style="margin:0 auto"></div>
      </div>

      <!-- EMPTY -->
      <div v-else-if="visitsData.length === 0" class="empty-state">
        <img src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif" alt="No data" class="empty-img" />
        <div class="empty-text">No data found</div>
      </div>

      <!-- CARDS -->
      <div v-else class="visit-card-grid">
        <div
          v-for="(visit, index) in visitsData"
          :key="visit.id"
          class="visit-card"
        >
          <div class="visit-card-header">
            <span class="visit-type-badge" :class="visit.visit_type === 'LEAD' ? 'type-lead' : 'type-customer'">
              <font-awesome-icon :icon="visit.visit_type === 'LEAD' ? 'user-clock' : 'building-user'" />
              {{ visit.visit_type }}
            </span>
            <span v-if="visit.visit_result" class="result-badge" :class="getResultClass(visit.visit_result)">
              <font-awesome-icon :icon="getResultIcon(visit.visit_result)" />
              {{ visit.visit_result?.replaceAll('_', ' ')?.replace(/\b\w/g, l => l.toUpperCase()) }}
            </span>
            <span v-else class="badge-empty">—</span>
          </div>

          <p class="visit-card-company">{{ visit.company_name }}</p>
          <p v-if="visit.target_type === 'BRANCH'" class="td-sub text-primary" style="margin:0">
            <font-awesome-icon icon="code-branch" />
            {{ visit.branch_name }}<span v-if="visit.branch_city"> — {{ visit.branch_city }}</span>
          </p>
          <p class="visit-card-code">{{ visit.visit_code }}</p>

          <div class="visit-card-info">
            <div class="visit-card-row">
              <font-awesome-icon icon="calendar" class="visit-card-icon" />
              <div>
                <p class="td-name" style="margin:0">{{ visitDataStore.formatDateTime(visit.visit_at) }}</p>
                <p class="td-muted" style="margin:0">Scheduled Visit</p>
              </div>
            </div>

            <div class="visit-card-row">
              <div v-if="visit.check_in_at" class="checkin-badge">
                <font-awesome-icon icon="right-to-bracket" />
                {{ visitDataStore.formatDateTime(visit.check_in_at) }}
              </div>
              <span v-else class="badge-empty">Not Checked In Yet</span>
            </div>

            <div class="visit-card-row">
              <div v-if="visit.check_out_at" class="checkout-badge">
                <font-awesome-icon icon="right-from-bracket" />
                {{ visitDataStore.formatDateTime(visit.check_out_at) }}
              </div>
              <span v-else class="badge-empty">Not Checked Out Yet</span>
            </div>
          </div>

          <div class="visit-card-durations">
            <div class="dur-item">
              <span class="dur-label">To Check In</span>
              <span class="dur-value">{{ visitDataStore.formatDuration(visit.time_from_visit_to_check_in) }}</span>
            </div>
            <div class="dur-item">
              <span class="dur-label">To Check Out</span>
              <span class="dur-value">{{ visitDataStore.formatDuration(visit.time_from_check_in_to_check_out) }}</span>
            </div>
            <div class="dur-item">
              <span class="dur-label">Duration</span>
              <span class="dur-value">{{ visitDataStore.formatDuration(visit.total_time_result) }}</span>
            </div>
          </div>

          <div class="visit-card-footer">
            <button class="act-btn act-info" title="Detail" @click="openDetail(visit.id)">
              <font-awesome-icon icon="eye" /> Detail
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- PAGINATION -->
    <div class="pagination-card">
      <div class="pagination-nav">
        <button
          class="btn-prev-next"
          :disabled="!pagination.prev_page_url"
          @click="visitDataStore.fetchVisits(pagination.prev_page_url)"
        >
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button
          class="btn-prev-next"
          :disabled="!pagination.next_page_url"
          @click="visitDataStore.fetchVisits(pagination.next_page_url)"
        >
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">Hal {{ pagination.current_page }} / {{ pagination.last_page }}</span>
        <span class="page-badge">TOTAL: {{ pagination.total }}</span>
      </div>
    </div>


    <!-- ══════════════════════════════════════════
         DETAIL MODAL
         ══════════════════════════════════════════ -->
    <AppModal
      :show="showDetailModal"
      title="Detail Visit"
      icon="circle-info"
      size="lg"
      @close="closeDetail"
    >
      <div v-if="loadingDetail" class="td-center">
        <div class="spinner-wrap"><div class="spinner"></div><span>Loading...</span></div>
      </div>
      <template v-else-if="visitsDetail">
        <div class="detail-list">
          <div class="detail-row">
            <span class="detail-label">Visit Code</span>
            <span class="detail-value mono">{{ visitsDetail.visit_code }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Company</span>
            <span class="detail-badge">{{ visitsDetail.company_name }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Sales</span>
            <span class="detail-value">{{ visitsDetail.sales_name }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Type</span>
            <span class="detail-value">{{ visitsDetail.visit_type }}</span>
          </div>

          <!-- ═══ TARGET: HEAD OFFICE / BRANCH ═══ -->
          <div v-if="visitsDetail.target_type" class="detail-row">
            <span class="detail-label">Target</span>
            <span class="target-type-badge" :class="visitsDetail.target_type === 'BRANCH' ? 'target-branch' : 'target-hq'">
              <font-awesome-icon :icon="visitsDetail.target_type === 'BRANCH' ? 'code-branch' : 'building'" />
              {{ visitsDetail.target_type === 'BRANCH' ? 'Branch' : 'Head Office' }}
            </span>
          </div>
          <div v-if="visitsDetail.target_type === 'BRANCH'" class="detail-row">
            <span class="detail-label">Nama Cabang</span>
            <span class="detail-value">{{ visitsDetail.branch_name }} — {{ visitsDetail.branch_city ?? '-' }}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value">{{ visitsDetail.visit_status }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Visit Result</span>
            <span class="detail-value">{{ visitsDetail.visit_result ?? '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Visit At</span>
            <span class="detail-value">{{ visitDataStore.formatDateTime(visitsDetail.visit_at) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Check In</span>
            <span class="detail-value">{{ visitDataStore.formatDateTime(visitsDetail.check_in_at) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Check Out</span>
            <span class="detail-value">{{ visitDataStore.formatDateTime(visitsDetail.check_out_at) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Duration</span>
            <span class="detail-value">{{ visitDataStore.formatDuration(visitsDetail.total_time_result) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Location</span>
            <span class="detail-value">{{ visitsDetail.gps_snapshot ?? '-' }}</span>
          </div>
          <div class="detail-row" style="flex-direction:column; align-items:flex-start; gap:8px">
            <span class="detail-label">Notes</span>
            <p style="font-size:0.85rem; color:var(--text-primary); margin:0">{{ visitsDetail.notes || '-' }}</p>
          </div>
          <div v-if="visitsDetail.photo" style="margin-top:8px">
            <span class="detail-label" style="display:block; margin-bottom:8px">Photo</span>
            <img :src="photoBase + visitsDetail.photo" style="width:100%; border-radius:10px; object-fit:contain; max-height:280px;" />
          </div>
          <div v-if="visitsDetail.latitude" style="margin-top:8px">
            
            <a :href="`https://www.google.com/maps?q=${visitsDetail.latitude},${visitsDetail.longitude}`"
              target="_blank"
              style="font-size:0.84rem; color:#6366f1; font-weight:600"
            >
              <font-awesome-icon icon="map-location-dot" /> Open in Google Maps →
            </a>
          </div>
        </div>
      </template>
      <template #footer>
        <button class="btn-cancel" @click="closeDetail">Close</button>
      </template>
    </AppModal>


    <!-- ══════════════════════════════════════════
         LEADS LIST MODAL
         ══════════════════════════════════════════ -->
    <AppModal
      :show="showLeadForm"
      title="Data Leads Ready To Visit"
      icon="people-arrows"
      size="xl"
      @close="closeLeadModal"
    >
      <!-- Toolbar -->
      <div class="modal-toolbar">
        <div class="showing-wrap">
          <span class="showing-label">Showing:</span>
          <select
            v-model="leadPagination.per_page"
            @change="leadsVisitStore.changePageSize()"
            class="form-input" style="width:auto; padding:6px 10px"
          >
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </div>
        <div class="search-wrap">
          <input
            v-model="searchLeads"
            @input="leadsVisitStore.searchLeadsWithDelay(searchLeads)"
            placeholder="Search company..."
            class="search-input"
          />
          <button class="search-btn"><font-awesome-icon icon="magnifying-glass" /></button>
        </div>
      </div>

      <!-- Table -->
      <div style="overflow-x:auto; margin-top:12px">
        <table class="data-table">
          <thead>
            <tr>
              <th>No</th><th>Company</th><th>Contact</th>
              <th>Address</th><th>Phone</th><th>Status</th>
              <th style="text-align:center">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingLeads">
              <td colspan="7" class="td-center">
                <div class="spinner-wrap"><div class="spinner"></div><span>Loading leads...</span></div>
              </td>
            </tr>
            <tr v-else-if="leadsData.length === 0">
              <td colspan="7" class="td-center">📭 Tidak ada leads yang siap dikunjungi</td>
            </tr>
            <tr
              v-else
              v-for="(item, index) in leadsData"
              :key="item.id"
              class="data-row"
              :class="activeVisitLeadId === item.id ? 'row-active-lead' : ''"
            >
              <td class="td-no">{{ index + 1 + leadPagination.per_page * (leadPagination.current_page - 1) }}.</td>
              <td>
                <p class="td-name">{{ item.company_name ?? '-' }}</p>
                <p class="td-muted" style="font-family:monospace">{{ item.lead_code ?? '' }}</p>
              </td>
              <td>{{ item.contact_name ?? '-' }}</td>
              <td style="max-width:180px">
                <p class="td-muted" style="overflow:hidden; white-space:nowrap; text-overflow:ellipsis" :title="item.address">
                  {{ item.address || '—' }}
                </p>
              </td>
              <td>{{ item.phone ?? '-' }}</td>
              <td><span class="badge-source">{{ item.status ?? 'New' }}</span></td>
              <td class="td-actions">
                <!-- Row lain -->
                <template v-if="activeVisitLeadId !== item.id">
                  <button
                    @click="visitNow(item)"
                    :disabled="loadingVisitNow || activeVisitLeadId !== null"
                    class="act-visit-btn"
                    :class="activeVisitLeadId !== null ? 'disabled' : ''"
                    :title="activeVisitLeadId !== null ? 'Selesaikan visit aktif terlebih dahulu' : ''"
                  >
                    <font-awesome-icon icon="location-dot" /> Visit Now
                  </button>
                </template>
                <!-- Row aktif -->
                <template v-else>
                  <span class="badge-active-ping">
                    <span class="ping-dot"></span> ACTIVE
                  </span>
                  <button
                    v-if="activeLeadPhase === 'visiting'"
                    @click="checkIn(item)"
                    class="act-visit-btn emerald"
                  >
                    <font-awesome-icon icon="right-to-bracket" /> Check In
                  </button>
                  <button
                    v-if="activeLeadPhase === 'checked_in'"
                    @click="checkOut(item)"
                    class="act-visit-btn rose"
                  >
                    <font-awesome-icon icon="right-from-bracket" /> Check Out
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="modal-pagination">
        <span class="td-muted" style="font-size:0.82rem">
          Total: {{ leadPagination.total }}
        </span>
        <div class="pagination-nav">
          <button
            class="btn-prev-next"
            :disabled="!leadPagination.prev_page_url"
            @click="leadsVisitStore.fetchLeadsVisit(leadPagination.prev_page_url)"
          ><font-awesome-icon icon="circle-left" /> Prev</button>
          <button
            class="btn-prev-next"
            :disabled="!leadPagination.next_page_url"
            @click="leadsVisitStore.fetchLeadsVisit(leadPagination.next_page_url)"
          >Next <font-awesome-icon icon="circle-right" /></button>
        </div>
      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeLeadModal">Close</button>
      </template>
    </AppModal>


    <!-- ══════════════════════════════════════════
         LEAD — VISIT NOW MODAL
         ══════════════════════════════════════════ -->
    <AppModal
      :show="showVisitNowModal && !!selectedLead"
      title="Visit Confirmation"
      icon="map-pin"
      size="sm"
      @close="closeVisitNowModal"
    >
      <div v-if="selectedLead" class="form-container-gap">
        <div class="detail-info-box">
          <p class="detail-box-label">Lead yang akan dikunjungi</p>
          <p style="font-weight:700; font-size:0.95rem">{{ selectedLead.company_name }}</p>
          <p class="td-muted">{{ selectedLead.contact_name }} · {{ selectedLead.address ?? '-' }}</p>
        </div>
        <div class="detail-list">
          <div class="detail-row">
            <span class="detail-label">Phone</span>
            <span class="detail-value">{{ selectedLead.phone ?? '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value">{{ selectedLead.status ?? 'New' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Waktu Mulai</span>
            <span class="detail-value">{{ nowFormatted() }}</span>
          </div>
        </div>
        <div class="warning-box">
          <font-awesome-icon icon="triangle-exclamation" />
          Setelah visit dimulai, sistem akan mencatat waktu kunjungan secara otomatis.
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeVisitNowModal" :disabled="loadingVisitNow">Cancel</button>
        <button class="btn-save" @click="confirmVisitNow" :disabled="loadingVisitNow">
          <font-awesome-icon v-if="loadingVisitNow" icon="spinner" spin />
          <font-awesome-icon v-else icon="map-pin" />
          {{ loadingVisitNow ? 'Processing...' : 'Yes, Visit Now' }}
        </button>
      </template>
    </AppModal>


    <!-- ══════════════════════════════════════════
         LEAD — CHECK IN MODAL
         ══════════════════════════════════════════ -->
    <AppModal
      :show="showCheckInModal"
      title="Check In Lead"
      icon="right-to-bracket"
      size="xl"
      @close="closeCheckInModal"
    >
      <div class="checkin-grid">
        <!-- Camera -->
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

        <!-- Info -->
        <div class="form-container-gap">
          <div class="detail-list">
            <div class="detail-row">
              <span class="detail-label">Date & Time</span>
              <span class="detail-value">{{ currentDateTime }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Company</span>
              <span class="detail-value">{{ selectedVisit?.company_name ?? '-' }}</span>
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
          <div v-if="capturedPhoto" class="success-box">
            <font-awesome-icon icon="circle-check" /> Photo berhasil diambil. Siap untuk submit.
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeCheckInModal">Cancel</button>
        <button
          class="btn-save"
          @click="submitCheckIn"
          :disabled="loadingCheckIn || !capturedPhoto"
        >
          <font-awesome-icon v-if="loadingCheckIn" icon="spinner" spin />
          <font-awesome-icon v-else icon="cloud-arrow-up" />
          {{ loadingCheckIn ? 'Submitting...' : 'Submit Check In' }}
        </button>
      </template>
    </AppModal>


    <!-- ══════════════════════════════════════════
         LEAD — CHECK OUT MODAL
         ══════════════════════════════════════════ -->
    <AppModal
      :show="showCheckOutModal"
      title="Check Out Visit"
      icon="right-from-bracket"
      size="md"
      @close="closeCheckOutModal"
    >
      <div class="form-container-gap">
        <div class="form-group">
          <label>Notes on Visit Results <span style="color:#ef4444">*</span></label>
          <textarea
            v-model="checkOutNotes"
            rows="4"
            placeholder="Write a note here..."
            class="form-input form-textarea"
          ></textarea>
        </div>
        <div class="form-group">
          <label>Update Status (Response Lead) <span style="color:#ef4444">*</span></label>
          <div class="response-grid">
            <button
              v-for="opt in leadResponseOptions" :key="opt.value"
              type="button"
              @click="checkOutResponse = opt.value"
              class="response-btn"
              :class="[checkOutResponse === opt.value ? `response-active-${opt.color}` : '', opt.value === 'convert_to_customer' ? 'col-span-2' : '']"
            >
              <font-awesome-icon :icon="opt.icon.replace('fa-solid fa-', '')" />
              <span>{{ opt.label }}</span>
            </button>
          </div>
        </div>
        <div v-if="selectedLeadResponseOpt" class="info-box">
          <font-awesome-icon :icon="selectedLeadResponseOpt.icon.replace('fa-solid fa-', '')" />
          <span><strong>{{ selectedLeadResponseOpt.label }}</strong>
            <span v-if="selectedLeadResponseOpt.value === 'convert_to_customer'"> — Lead akan dikonversi menjadi Customer.</span>
            <span v-else-if="selectedLeadResponseOpt.value === 'failed'"> — Status lead akan diubah menjadi Failed.</span>
            <span v-else> — Follow up otomatis akan dibuat dalam 3 hari.</span>
          </span>
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeCheckOutModal" :disabled="localCheckOutLoading">Cancel</button>
        <button
          class="btn-save"
          @click="submitCheckOut"
          :disabled="!isLeadCheckOutValid || localCheckOutLoading"
        >
          <font-awesome-icon v-if="localCheckOutLoading" icon="spinner" spin />
          <font-awesome-icon v-else icon="cloud-arrow-up" />
          {{ localCheckOutLoading ? 'Saving...' : 'Save Check Out' }}
        </button>
      </template>
    </AppModal>


    <!-- ══════════════════════════════════════════
         CUSTOMERS LIST MODAL
         ══════════════════════════════════════════ -->
    <AppModal
      :show="showCustomerForm"
      title="Data Customers Ready To Visit"
      icon="handshake"
      size="xl"
      @close="closeCustomerModal"
     >
      <div class="modal-toolbar">
        <div class="showing-wrap">
          <span class="showing-label">Showing:</span>
          <select
            v-model="customersPagination.per_page"
            @change="customersVisitStore.changePageSize()"
            class="form-input" style="width:auto; padding:6px 10px"
          >
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </div>
        <div class="search-wrap">
          <input
            v-model="searchCustomers"
            @input="customersVisitStore.searchCustomersWithDelay(searchCustomers)"
            placeholder="Search customer..."
            class="search-input"
          />
          <button class="search-btn"><font-awesome-icon icon="magnifying-glass" /></button>
        </div>
      </div>

      <div style="overflow-x:auto; margin-top:12px">
        <table class="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Target</th>
              <th>Company</th>
              <th>Kontak</th>
              <th>Address</th>
              <th style="text-align:center">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingCustomers">
              <td colspan="7" class="td-center">
                <div class="spinner-wrap"><div class="spinner"></div><span>Loading customers...</span></div>
              </td>
            </tr>
            <tr v-else-if="customersData.length === 0">
              <td colspan="7" class="td-center">📭 Tidak ada customers yang siap dikunjungi</td>
            </tr>
            <tr
              v-else
              v-for="(item, index) in customersData"
              :key="item.target_type === 'branch' ? `branch-${item.branch_id}` : item.id"
              class="data-row"
              :class="activeVisitCustomersId === item.id ? 'row-active-customer' : ''"
            >
              <td class="td-no">{{ index + 1 + customersPagination.per_page * (customersPagination.current_page - 1) }}.</td>

              <!-- ═══ TARGET TYPE BADGE ═══ -->
              <td>
                <span
                  class="target-type-badge"
                  :class="item.target_type === 'branch' ? 'target-branch' : 'target-hq'"
                >
                  <font-awesome-icon :icon="item.target_type === 'branch' ? 'code-branch' : 'building'" />
                  {{ item.target_type === 'branch' ? 'Branch' : 'Head Office' }}
                </span>
              </td>

              <!-- ═══ COMPANY (+ nama branch & kota kalau target branch) ═══ -->
              <td>
                <p class="td-name">{{ item.company_name ?? '-' }}</p>
                <p class="td-muted" style="font-family:monospace">{{ item.customer_code ?? '-' }}</p>
                <p v-if="item.target_type === 'branch'" class="td-sub text-primary" style="margin:2px 0 0">
                  <font-awesome-icon icon="code-branch" />
                  {{ item.branch_name ?? '-' }}<span v-if="item.city"> — {{ item.city }}</span>
                </p>
              </td>

              <!-- ═══ KONTAK (bisa banyak) ═══ -->
              <td style="max-width:220px">
                <div v-if="item.contacts?.length">
                  <div v-for="ct in item.contacts" :key="ct.id" class="contact-mini-row">
                    <span class="fw-semibold">{{ ct.name }}</span> <br>
                    <span v-if="ct.is_primary" class="contact-primary-tag">Kontak Utama</span>
                    <span v-if="ct.position" class="td-muted"> · {{ ct.position }}</span>
                    <div v-if="ct.phone" class="td-muted" style="font-size:0.76rem">{{ ct.phone }}</div>
                  </div>
                </div>
                <span v-else class="td-muted">{{ item.contact_name ?? '-' }}</span>
              </td>

              <!-- ═══ ADDRESS ═══ -->
              <td style="max-width:180px">
                <p class="td-muted" style="overflow:hidden; white-space:nowrap; text-overflow:ellipsis" :title="item.address">
                  {{ item.address || '—' }}
                </p>
              </td>

              <td class="td-actions">
                <template v-if="activeVisitCustomersId !== item.id">
                  <button
                    v-if="canVisitNow(item)"
                    @click="visitNowCust(item)"
                    :disabled="loadingVisitNow || activeVisitCustomersId !== null"
                    class="act-visit-btn"
                    :class="activeVisitCustomersId !== null ? 'disabled' : 'slate'"
                  >
                    <font-awesome-icon icon="location-dot" /> Visit Now
                  </button>
                </template>
                <template v-else>
                  <span class="badge-active-ping emerald">
                    <span class="ping-dot emerald-dot"></span> ACTIVE
                  </span>
                  <button
                    v-if="activeCustomerPhase === 'visiting'"
                    @click="checkInCustomers(item)"
                    class="act-visit-btn emerald"
                  >
                    <font-awesome-icon icon="right-to-bracket" /> Check In
                  </button>
                  <button
                    v-if="activeCustomerPhase === 'checked_in'"
                    @click="openCustomerCheckOut(item)"
                    class="act-visit-btn rose"
                  >
                    <font-awesome-icon icon="right-from-bracket" /> Check Out
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-pagination">
        <span class="td-muted" style="font-size:0.82rem">Total: {{ customersPagination.total }}</span>
        <div class="pagination-nav">
          <button class="btn-prev-next" :disabled="!customersPagination.prev_page_url" @click="customersVisitStore.fetchCustomersVisit(customersPagination.prev_page_url)">
            <font-awesome-icon icon="circle-left" /> Prev
          </button>
          <button class="btn-prev-next" :disabled="!customersPagination.next_page_url" @click="customersVisitStore.fetchCustomersVisit(customersPagination.next_page_url)">
            Next <font-awesome-icon icon="circle-right" />
          </button>
        </div>
      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeCustomerModal">Close</button>
      </template>
    </AppModal>


    <!-- ══════════════════════════════════════════
         CUSTOMER — VISIT NOW MODAL
         ══════════════════════════════════════════ -->
    <AppModal
      :show="showVisitCustNowModal && !!selectedCust"
      title="Visit Confirmation Customer"
      icon="location-dot"
      size="sm"
      @close="closeVisitCustNowModal"
    >
      <div v-if="selectedCust" class="form-container-gap">
        <div class="detail-info-box">
          <p class="detail-box-label">Customer yang akan dikunjungi</p>
          <p style="font-weight:700; font-size:0.95rem">{{ selectedCust.company_name }}</p>

          <!-- ═══ TARGET: BRANCH atau HEAD OFFICE ═══ -->
          <p v-if="selectedCust.target_type === 'branch'" class="td-muted text-primary" style="font-weight:600">
            <font-awesome-icon icon="code-branch" />
            {{ selectedCust.branch_name }}<span v-if="selectedCust.city"> — {{ selectedCust.city }}</span>
          </p>
          <p v-else class="td-muted text-primary" style="font-weight:600">
            <font-awesome-icon icon="building" /> Head Office
          </p>

          <p class="td-muted">{{ selectedCust.contact_name }}</p>
          <p class="td-muted">{{ selectedCust.address ?? '-' }}</p>
        </div>
        <div class="detail-list">
          <div class="detail-row">
            <span class="detail-label">Phone</span>
            <span class="detail-value">{{ selectedCust.phone ?? '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value">{{ selectedCust.status ?? '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Waktu Mulai</span>
            <span class="detail-value">{{ nowFormatted() }}</span>
          </div>
        </div>
        <div class="warning-box">
          <font-awesome-icon icon="triangle-exclamation" />
          Setelah visit dimulai, sistem akan mencatat waktu kunjungan secara otomatis.
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeVisitCustNowModal" :disabled="loadingVisitNow">Cancel</button>
        <button class="btn-save btn-emerald" @click="confirmVisitCustNow" :disabled="loadingVisitNow">
          <font-awesome-icon v-if="loadingVisitNow" icon="spinner" spin />
          <font-awesome-icon v-else icon="location-dot" />
          {{ loadingVisitNow ? 'Processing...' : 'Yes, Visit Now' }}
        </button>
      </template>
    </AppModal>


    <!-- ══════════════════════════════════════════
         CUSTOMER — CHECK IN MODAL
         ══════════════════════════════════════════ -->
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
            class="btn-save btn-emerald" style="width:100%; padding:14px; justify-content:center; margin-top:10px"
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
              <span class="detail-value">{{ selectedVisit?.company_name ?? '-' }}</span>
            </div>
            <div class="detail-row" style="flex-direction:column; align-items:flex-start; gap:4px">
              <span class="detail-label">Location GPS</span>
              <div v-if="isGettingLocation" class="td-muted"><font-awesome-icon icon="spinner" spin /> Detecting location...</div>
              <div v-else-if="locationReady" style="font-size:0.84rem">{{ currentLocation.address }}</div>
              <div v-else style="font-size:0.84rem; color:#ef4444"><font-awesome-icon icon="circle-exclamation" /> Failed to get location</div>
            </div>
          </div>
          <div v-if="capturedPhoto" class="success-box">
            <font-awesome-icon icon="circle-check" /> Photo berhasil diambil. Siap untuk submit.
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeCheckInModalCustomers">Cancel</button>
        <button class="btn-save btn-emerald" @click="submitCheckInCustomers" :disabled="loadingCheckIn || !capturedPhoto">
          <font-awesome-icon v-if="loadingCheckIn" icon="spinner" spin />
          <font-awesome-icon v-else icon="cloud-arrow-up" />
          {{ loadingCheckIn ? 'Submitting...' : 'Submit Check In' }}
        </button>
      </template>
    </AppModal>


    <!-- ══════════════════════════════════════════
         CUSTOMER — CHECK OUT MODAL
         ══════════════════════════════════════════ -->
    <AppModal
      :show="showCheckOutCustomerModal && !!selectedCustomerCheckOut"
      title="Check Out Customer"
      icon="right-from-bracket"
      size="lg"
      @close="closeCustomerCheckOutModal"
    >
      <div class="form-container-gap">
        <!-- Customer info -->
        <div v-if="selectedCustomerCheckOut" class="detail-info-box">
          <p class="detail-box-label">Customer</p>
          <p style="font-weight:700">{{ selectedCustomerCheckOut.company_name }}</p>
          <p class="td-muted">{{ selectedCustomerCheckOut.contact_name }}</p>
        </div>

        <!-- Notes -->
        <div class="form-group">
          <label>Notes on Visit Result <span style="color:#ef4444">*</span></label>
          <textarea v-model="customerCheckOutForm.notes" rows="4" placeholder="Write visit result here..." class="form-input form-textarea"></textarea>
        </div>

        <!-- Customer Response -->
        <div class="form-group">
          <label>Customer Response <span style="color:#ef4444">*</span></label>
          <div class="response-grid" style="grid-template-columns: repeat(2, 1fr)">
            <label
              v-for="item in customerResponses" :key="item.value"
              class="response-btn"
              :class="customerCheckOutForm.customer_response === item.value ? 'response-active-emerald' : ''"
              style="cursor:pointer"
            >
              <input v-model="customerCheckOutForm.customer_response" type="radio" :value="item.value" style="display:none" />
              <font-awesome-icon :icon="item.icon.replace('fa-solid fa-', '')" />
              <div>
                <p style="font-weight:600; margin:0; font-size:0.84rem">{{ item.label }}</p>
                <p style="font-size:0.72rem; color:var(--text-muted); margin:0">{{ item.desc }}</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Complaint (conditional) -->
        <div v-if="showCustomerComplaintSection" class="form-group">
          <label style="color:#ef4444">Complaint Detail <span>*</span></label>
          <textarea v-model="customerCheckOutForm.complaint_detail" rows="3" placeholder="Describe customer complaint..." class="form-input form-textarea" style="border-color:#fca5a5"></textarea>
        </div>

        <!-- Potential Order (conditional) -->
        <div v-if="showCustomerPotentialOrderSection" class="form-group">
          <label style="color:#d97706">Potential Order Detail <span>*</span></label>
          <textarea v-model="customerCheckOutForm.potential_order_detail" rows="3" placeholder="Describe potential order..." class="form-input form-textarea" style="border-color:#fcd34d"></textarea>
        </div>

        <!-- Follow Up -->
        <div class="form-group">
          <label>Follow Up Date <span style="color:#ef4444">*</span></label>
          <input v-model="customerCheckOutForm.follow_up_at" type="date" :min="tomorrow" class="form-input" />
        </div>

        <div class="form-group">
          <label>Follow Up Type <span style="color:#ef4444">*</span></label>
          <div style="display:flex; flex-wrap:wrap; gap:8px">
            <button
              v-for="type in followUpTypes" :key="type"
              type="button"
              @click="customerCheckOutForm.follow_up_type = type"
              class="segment-btn"
              :class="{ active: customerCheckOutForm.follow_up_type === type }"
              style="flex:unset; padding:8px 14px; border-radius:8px"
            >{{ type }}</button>
          </div>
        </div>

        <div class="form-group">
          <label>Follow Up Notes</label>
          <textarea v-model="customerCheckOutForm.follow_up_notes" rows="3" placeholder="Write next follow up notes..." class="form-input form-textarea"></textarea>
        </div>

        <!-- Progress indicator -->
        <div style="display:flex; align-items:center; gap:8px; font-size:0.78rem; color:var(--text-muted)">
          <span style="width:8px;height:8px;border-radius:50%;display:inline-block" :style="customerCheckOutForm.notes.trim() ? 'background:#10b981' : 'background:#e2e8f0'"></span>
          <span style="width:8px;height:8px;border-radius:50%;display:inline-block" :style="customerCheckOutForm.customer_response ? 'background:#10b981' : 'background:#e2e8f0'"></span>
          <span style="width:8px;height:8px;border-radius:50%;display:inline-block" :style="customerCheckOutForm.follow_up_at && customerCheckOutForm.follow_up_type ? 'background:#10b981' : 'background:#e2e8f0'"></span>
          <span>{{ isCustomerCheckOutValid ? '✓ Siap disimpan' : 'Lengkapi form' }}</span>
        </div>
      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeCustomerCheckOutModal" :disabled="loadingCustomerCheckOut">Cancel</button>
        <button
          class="btn-save btn-emerald"
          @click="submitCustomerCheckOut"
          :disabled="loadingCustomerCheckOut || !isCustomerCheckOutValid"
        >
          <font-awesome-icon v-if="loadingCustomerCheckOut" icon="spinner" spin />
          <font-awesome-icon v-else icon="floppy-disk" />
          {{ loadingCustomerCheckOut ? 'Saving...' : 'Save Check Out' }}
        </button>
      </template>
    </AppModal>

    <!-- HIDDEN CANVAS -->
    <canvas ref="canvasRef" style="display:none"></canvas>

  </div>
</template>

<style scoped>
/* ── Inherit semua CSS dari kode lama ── */
.h-100 { --text-muted: #64748b; --primary-color: #6366f1; }
.form-container-gap { display: flex; flex-direction: column; gap: 14px; }

/* Spinner */
.spinner-wrap { display:flex; flex-direction:column; align-items:center; gap:10px; color:var(--text-muted); }
.spinner { width:24px; height:24px; border:3px solid #e2e8f0; border-top-color:#6366f1; border-radius:50%; animation:spin 0.7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

/* Badge extras */
.visit-type-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:99px; font-size:0.75rem; font-weight:700; }
.type-lead     { background:#6366f1; color:#fff; }
.type-customer { background:#d1fae5; color:#065f46; border:1px solid #a7f3d0; }

.result-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:8px; font-size:0.75rem; font-weight:600; }
.badge-empty  { font-size:0.78rem; padding:3px 8px; background:var(--bg-input); border-radius:6px; color:var(--text-muted); }
.badge-source { padding:3px 10px; border-radius:6px; background:var(--bg-input); color:var(--text-muted); font-size:0.78rem; font-weight:600; }

.checkin-badge  { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:8px; background:#d1fae5; color:#065f46; font-size:0.78rem; font-weight:600; }
.checkout-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:8px; background:#fee2e2; color:#991b1b; font-size:0.78rem; font-weight:600; }

/* Time cell */
.time-cell { display:flex; align-items:center; gap:8px; }
.time-icon { width:32px; height:32px; border-radius:8px; background:#eff6ff; color:#3b82f6; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

/* Active row */
.row-active-lead     { background:#eff6ff !important; border-left:3px solid #6366f1; }
.row-active-customer { background:#ecfdf5 !important; border-left:3px solid #10b981; }

/* Visit action buttons */
.act-visit-btn {
  display:inline-flex; align-items:center; gap:5px;
  padding:5px 12px; border-radius:7px; border:none;
  font-size:0.78rem; font-weight:600; cursor:pointer; transition:all 0.18s;
  background:#6366f1; color:#fff; white-space:nowrap;
}
.act-visit-btn:hover { background:#4f46e5; }
.act-visit-btn.emerald { background:#10b981; }
.act-visit-btn.emerald:hover { background:#059669; }
.act-visit-btn.rose { background:#ef4444; }
.act-visit-btn.rose:hover { background:#dc2626; }
.act-visit-btn.slate { background:#475569; }
.act-visit-btn.slate:hover { background:#334155; }
.act-visit-btn.disabled { background:#e2e8f0; color:#94a3b8; cursor:not-allowed; }

/* Active ping badge */
.badge-active-ping {
  display:inline-flex; align-items:center; gap:5px;
  padding:3px 8px; border-radius:99px;
  background:#dbeafe; color:#1d4ed8; border:1px solid #93c5fd;
  font-size:0.68rem; font-weight:700;
}
.badge-active-ping.emerald { background:#d1fae5; color:#065f46; border-color:#6ee7b7; }
.ping-dot { width:6px; height:6px; border-radius:50%; background:#3b82f6; animation:ping-anim 1s ease-in-out infinite; }
.ping-dot.emerald-dot { background:#10b981; }
@keyframes ping-anim { 0%,100%{opacity:1} 50%{opacity:0.3} }

/* Modal toolbar */
.modal-toolbar { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; }
.modal-pagination { display:flex; justify-content:space-between; align-items:center; margin-top:14px; flex-wrap:wrap; gap:8px; }

/* Camera */
.camera-section { display:flex; flex-direction:column; }
.camera-wrap { position:relative; border-radius:16px; overflow:hidden; background:#000; aspect-ratio:16/9; }
.camera-video { width:100%; height:100%; object-fit:cover; display:block; }
.live-badge { position:absolute; top:10px; left:10px; display:inline-flex; align-items:center; gap:6px; padding:4px 10px; background:#ef4444; color:#fff; border-radius:99px; font-size:0.72rem; font-weight:700; }
.live-dot { width:7px; height:7px; border-radius:50%; background:#fff; animation:ping-anim 1s infinite; }

.checkin-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
@media (max-width: 640px) { .checkin-grid { grid-template-columns:1fr; } }

/* Info/warning/success boxes */
.detail-info-box  { background:var(--bg-input); border:1px solid var(--border-main); border-radius:10px; padding:14px 16px; }
.detail-box-label { font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-muted); margin-bottom:6px; }
.warning-box  { display:flex; align-items:flex-start; gap:8px; padding:10px 14px; background:#fffbeb; border:1px solid #fcd34d; border-radius:8px; font-size:0.82rem; color:#92400e; }
.info-box     { display:flex; align-items:flex-start; gap:8px; padding:10px 14px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; font-size:0.82rem; color:#1e40af; }
.success-box  { display:flex; align-items:center; gap:8px; padding:12px 14px; background:#d1fae5; border:1px solid #6ee7b7; border-radius:8px; font-size:0.84rem; color:#065f46; font-weight:600; }

/* Response grid (check out) */
.response-grid { display:grid; grid-template-columns:repeat(2, 1fr); gap:8px; }
.col-span-2 { grid-column:span 2; }
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
.response-active-blue    { border-color:#3b82f6 !important; background:#dbeafe !important; color:#1e40af !important; }
.response-active-indigo  { border-color:#6366f1 !important; background:#e0e7ff !important; color:#3730a3 !important; }
.response-active-rose    { border-color:#ef4444 !important; background:#fee2e2 !important; color:#991b1b !important; }
.response-active-amber   { border-color:#f59e0b !important; background:#fef3c7 !important; color:#92400e !important; }

/* Buttons extra */
.btn-save { display:inline-flex; align-items:center; gap:7px; padding:8px 18px; background:#6366f1; color:#fff; border:none; border-radius:8px; font-size:0.85rem; font-weight:600; cursor:pointer; transition:all 0.2s; }
.btn-save:hover:not(:disabled) { background:#4f46e5; }
.btn-save:disabled { opacity:0.5; cursor:not-allowed; }
.btn-save.btn-emerald { background:#10b981; }
.btn-save.btn-emerald:hover:not(:disabled) { background:#059669; }


/* Sistem Warna & Wrapper Global */
.h-100 {
  --text-muted: #64748b;
  --primary-color: #6366f1;
}

.form-container-gap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ===== BREADCRUMB ===== */
.breadcrumb-card {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 16px 18px;
  box-shadow: 0 1px 3px var(--shadow-color);
}
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

/* ===== TOOLBAR TOP ===== */
.toolbar-top {
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--bg-card);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px var(--shadow-color);
}

.toolbar-center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  width: 100%;
}

.btn-toolbar {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex: 0 1 auto;
}

.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover { background: #4f46e5; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
.btn-purple:active { transform: translateY(0); }

.btn-arrow-icon { font-size: 0.75rem; opacity: 0.8; }
.btn-orange { background: #f59e0b; color: #fff; }
.btn-orange:hover { background: #d97706; }
.btn-arrow { font-size: 0.6rem; opacity: 0.7; }

/* ===== CONTROLS ROW ===== */
.controls-card {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px var(--shadow-color);
}
.controls-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.controls-left, .controls-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.showing-wrap { display: flex; align-items: center; gap: 6px; font-size: 0.84rem; color: var(--text-primary); font-weight: 600; }
.showing-label { white-space: nowrap; color: var(--text-muted); font-size: 0.83rem; }
.text-muted-color { color: var(--text-muted); }
.search-wrap { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.search-input { padding: 7px 12px; border: none; background: transparent; color: var(--text-primary); font-size: 0.84rem; outline: none; width: 200px; }
.search-input::placeholder { color: var(--text-muted); }
.search-btn { padding: 7px 12px; background: #6366f1; color: #fff; border: none; cursor: pointer; }
.search-btn:hover { background: #4f46e5; }
.sort-wrap { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

/* ===== VIEW TOGGLE (Card/Table) ===== */
.view-toggle {
  display: flex;
  gap: 4px;
  background: var(--bg-input);
  border: 1px solid var(--border-main);
  border-radius: 8px;
  padding: 3px;
}
.view-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}
.view-toggle-btn:hover { color: #6366f1; }
.view-toggle-btn.active { background: #6366f1; color: #fff; }

/* ===== CARD GRID ===== */
.card-grid-wrap { background: transparent; }
.visit-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}
.visit-card {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px var(--shadow-color);
  transition: box-shadow 0.18s ease, transform 0.18s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.visit-card:hover { box-shadow: 0 6px 16px rgba(0,0,0,0.08); transform: translateY(-2px); }

.visit-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.visit-card-company {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-primary);
  margin: 0;
  text-transform: capitalize;
}
.visit-card-code {
  font-family: monospace;
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 0;
}
.visit-card-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid var(--border-main);
  border-bottom: 1px solid var(--border-main);
  padding: 10px 0;
}
.visit-card-row { display: flex; align-items: center; gap: 8px; }
.visit-card-icon { color: #3b82f6; width: 16px; }

.visit-card-durations {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.dur-item { display: flex; flex-direction: column; gap: 2px; text-align: center; }
.dur-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 700; }
.dur-value { font-size: 0.8rem; font-weight: 600; color: var(--text-primary); }

.visit-card-footer { display: flex; justify-content: flex-end; }
.visit-card-footer .act-btn {
  width: auto;
  padding: 6px 14px;
  gap: 6px;
  border-radius: 8px;
}

/* ===== DROPDOWN CORE ===== */
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
  min-width: 160px;
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
.drop-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; padding: 0 4px; }
.drop-item { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: none; border: none; border-radius: 7px; color: var(--text-primary); font-size: 0.84rem; cursor: pointer; text-align: left; }
.drop-item:hover { background: var(--bg-nav-hover); }
.drop-item.active { color: #6366f1; font-weight: 600; background: rgba(99,102,241,0.08); }
.perpage-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.perpage-opt { padding: 5px 10px; border: 1px solid var(--border-main); border-radius: 6px; background: var(--bg-input); color: var(--text-primary); font-size: 0.82rem; cursor: pointer; }
.perpage-opt:hover  { border-color: #6366f1; color: #6366f1; }
.perpage-opt.active { background: #6366f1; border-color: #6366f1; color: #fff; font-weight: 700; }

/* ===== DATA TABLE ===== */
.table-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.data-table thead tr { background: var(--bg-input); border-bottom: 2px solid var(--border-main); position: sticky; top: 0; z-index: 2; }
.data-table th { padding: 12px 18px; text-align: left; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap; }
.data-table tbody tr { border-bottom: 1px solid var(--border-main); transition: background 0.15s; }
.data-table tbody tr:last-child { border-bottom: none; }
.data-row:hover { background: var(--bg-nav-hover); }
.data-table td { padding: 13px 18px; vertical-align: middle; color: var(--text-primary); }
.td-no { color: var(--text-muted); font-weight: 600; }
.td-name { font-weight: 500; }
.td-muted { color: var(--text-muted); font-size: 0.84rem; }
.td-sub { color: var(--text-muted); font-size: 0.78rem; margin-top: 2px; }
.td-center { text-align: center; padding: 40px; color: var(--text-muted); }
.td-actions { text-align: center; white-space: nowrap; }

/* ACTION BUTTONS */
.act-btn { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; transition: all 0.18s ease; margin: 0 2px; background: transparent; }
.act-edit         { color: #f59e0b; border-color: #f59e0b; }
.act-edit:hover   { background: #f59e0b; color: #fff; }
.act-delete       { color: #ef4444; border-color: #ef4444; }
.act-delete:hover { background: #ef4444; color: #fff; }
.act-info         { color: #6366f1; border-color: #6366f1; }
.act-info:hover   { background: #6366f1; color: #fff; }

/* ===== PAGINATION BASE ===== */
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
.pagination-nav { display: flex; align-items: center; gap: 8px; }
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
}

/* ===== TAMPILAN MOBILE RESPONSIVE ===== */
@media (max-width: 576px) {
  .pagination-card { flex-direction: column; padding: 12px; gap: 12px; }
  .pagination-nav { width: 100%; justify-content: space-between; }
  .btn-prev-next { flex: 1; max-width: 48%; padding: 10px 14px; }
  .page-badges { width: 100%; justify-content: center; flex-wrap: wrap; }
  .page-badge { flex: 1; text-align: center; font-size: 0.7rem; }
  .visit-card-grid { grid-template-columns: 1fr; }
}

/* ── SPINNER & EMPTY ── */
.spinner-custom { width: 2rem; height: 2rem; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 24px 0; gap: 8px; }
.empty-img { max-width: 200px; height: auto; opacity: 0.85; }
.empty-text { font-size: 0.9rem; font-weight: 600; color: var(--text-muted); }

/* ===== FORM STANDARD COMPONENTS ===== */
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.form-input { padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.875rem; background: var(--bg-input); color: var(--text-primary); outline: none; transition: border 0.18s; width: 100%; }
.form-input:focus { border-color: #6366f1; }
.form-textarea { resize: none; min-height: 90px; line-height: 1.5; }

/* MODAL FOOTER BUTTONS */
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
.btn-cancel:hover {
  background: var(--border-main);
  color: var(--text-primary);
}

/* DETAIL MODAL CONTENT */
.detail-list { display: flex; flex-direction: column; }
.detail-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-main); gap: 12px; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.detail-value { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); }
.mono { font-family: monospace; font-weight: 700; }
.detail-badge { font-size: 0.82rem; font-weight: 600; padding: 3px 12px; border-radius: 6px; background: rgba(99,102,241,0.1); color: #6366f1; border: 1px solid rgba(99,102,241,0.2); }
.badge-active { font-size: 0.75rem; font-weight: 600; padding: 3px 10px; border-radius: 99px; background: rgba(34,197,94,0.1); color: #16a34a; }

/* ===== SEGMENTED PILL ===== */
.segment-group {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-main);
  border-radius: 50px;
  padding: 4px;
  background: var(--bg-input);
  width: 100%;
  max-width: 500px;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.segment-group::-webkit-scrollbar { display: none; }
.segment-btn {
  flex: 1;
  text-align: center;
  border: none;
  background: transparent;
  padding: 10px 16px;
  color: var(--text-primary);
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 50px;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.segment-btn:hover:not(.active) { background: rgba(99, 102, 241, 0.08); color: #6366f1; }
.segment-btn.active { background: #6366f1; color: #fff; box-shadow: 0 2px 6px rgba(99, 102, 241, 0.25); }

/* ── TARGET TYPE BADGE ── */
.target-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.74rem;
  font-weight: 700;
  white-space: nowrap;
}
.target-hq     { background: #e0e7ff; color: #3730a3; }
.target-branch { background: #fef3c7; color: #92400e; }

/* ── KONTAK MINI (list dalam tabel) ── */
.contact-mini-row {
  padding: 4px 0;
  border-bottom: 1px dashed var(--border-main);
  font-size: 0.8rem;
}
.contact-mini-row:last-child { border-bottom: none; }
.contact-primary-tag {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 99px;
  background: rgba(99,102,241,0.12);
  color: #6366f1;
  margin-left: 4px;
}

/* Tablet (≤ 768px) */
@media (max-width: 768px) {
  .toolbar-center { gap: 8px; }
  .btn-toolbar { flex: 1 1 calc(33.33% - 8px); justify-content: center; padding: 10px 12px; font-size: 0.82rem; min-width: 100px; }
}

/* Mobile (≤ 480px) */
@media (max-width: 480px) {
  .toolbar-center { flex-direction: column; gap: 8px; }
  .btn-toolbar { flex: 1 1 100%; width: 100%; padding: 11px 16px; font-size: 0.85rem; justify-content: center; }
}

/* Layar sangat kecil (≤ 360px) */
@media (max-width: 360px) {
  .btn-toolbar { flex: 1 1 100%; width: 100%; padding: 10px 14px; font-size: 0.8rem; gap: 6px; justify-content: center; }
}

.result-emerald { background:#d1fae5; color:#065f46; }
.result-blue    { background:#dbeafe; color:#1e40af; }
.result-indigo  { background:#e0e7ff; color:#3730a3; }
.result-rose    { background:#fee2e2; color:#991b1b; }
.result-amber   { background:#fef3c7; color:#92400e; }
.result-orange  { background:#ffedd5; color:#9a3412; }
.result-slate   { background:#f1f5f9; color:#475569; }
</style>