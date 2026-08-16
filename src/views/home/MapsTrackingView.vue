<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { useHomeFrontendStore } from '@/stores/homeFrontendStore'

// ── DARK MODE LOKAL ──
const isDark = ref(false)
const toggleTheme = () => { isDark.value = !isDark.value }

// ── ROUTER ──
const router = useRouter()
const goToLogin = () => router.push('/login')

// ── STORE ──
const store = useHomeFrontendStore()

// ── MAP STATE ──
const mapRef              = ref(null)
const mapInstance         = ref(null)
const googleMarkers       = ref([])
const activePolylines     = ref([])
const AdvancedMarkerElement = ref(null)
const pollingInterval     = ref(null)
const lastUpdated         = ref('-')
const isExporting         = ref(false)

// ── RESPONSIVE HELPER ──
// Konsep layout SAMA persis di semua ukuran layar (sidebar + peta berdampingan,
// legend = kartu pojok kanan atas). Yang beda hanya default state-nya di mobile,
// supaya peta tetap jadi fokus utama dan tidak ada yang menutupi peta.
const isMobileViewport = () => typeof window !== 'undefined' && window.innerWidth <= 768

// ── UI STATE ──
const selectedVisit    = ref(null)
// Di mobile, sidebar default collapsed (persis seperti saat user menekan tombol
// collapse di desktop) supaya peta langsung terlihat penuh saat halaman dibuka.
const sidebarCollapsed = ref(isMobileViewport())
// BARU: toolbar filter (Date/Sales/Status/Type/Reset/dll) bisa "di-split" —
// dilipat jadi cuma satu handle tipis supaya peta dapat ruang vertikal lebih
// lebar, lalu tap handle-nya lagi untuk membuka filter itu kembali. Default
// terlipat di mobile (layar sempit), tapi tetap terbuka di desktop.
const toolbarCollapsed = ref(isMobileViewport())
const search           = ref('')
const selectedSalesId  = ref('')
const selectedStatus   = ref('')
const selectedType     = ref('') // ⬅️ BARU: filter type LEAD / HEAD_OFFICE / BRANCH

const today    = new Date().toISOString().split('T')[0]
const dateFrom = ref(today)
const dateTo   = ref(today)

const showDateFilter   = ref(false)
const showSalesFilter  = ref(false)
const showStatusFilter = ref(false)
const showTypeFilter   = ref(false) // ⬅️ BARU

// ── LEGEND ──
// Legend tetap kartu pojok kanan atas seperti di desktop (konsepnya tidak berubah).
// Di mobile saja, defaultnya disembunyikan di balik tombol toggle kecil supaya
// tidak langsung menutupi marker/peta begitu halaman dibuka.
const legendOpen = ref(!isMobileViewport())
const toggleLegend = () => { legendOpen.value = !legendOpen.value }
const handleViewportResize = () => {
  // Kalau user memutar layar / resize melewati breakpoint ke desktop, tampilkan lagi
  if (!isMobileViewport()) {
    legendOpen.value = true
    toolbarCollapsed.value = false
  }
}

// ── COMPUTED — dari store ──
const visits = computed(() => store.visibleMapMarkers)

const salesList = computed(() => {
  const map = {}
  visits.value.forEach(v => {
    if (v.sales_id && !map[v.sales_id])
      map[v.sales_id] = { id: v.sales_id, name: v.sales_name }
  })
  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name))
})

const filteredVisits = computed(() => {
  const q = search.value.toLowerCase()
  return visits.value.filter(v => {
    const matchSearch = v.sales_name?.toLowerCase().includes(q) || v.target_name?.toLowerCase().includes(q)
    const matchSales  = selectedSalesId.value === '' || v.sales_id == selectedSalesId.value
    const matchStatus = selectedStatus.value  === '' || v.visit_status_label === selectedStatus.value
    const matchType    = selectedType.value    === '' || v.target_type === selectedType.value
    return matchSearch && matchSales && matchStatus && matchType
  })
})

const statusSummary = computed(() => {
  const planned = visits.value.filter(v => v.visit_status_label === 'BELUM_CHECK_IN').length
  const ongoing = visits.value.filter(v => v.visit_status_label === 'SEDANG_CHECK_IN').length
  const done    = visits.value.filter(v => v.visit_status_label === 'SELESAI').length
  return [
    { label: 'Planned', count: planned, cls: 'pill-planned' },
    { label: 'On-Site', count: ongoing, cls: 'pill-ongoing' },
    { label: 'Done',    count: done,    cls: 'pill-done'    },
  ]
})

// ── HELPERS: STATUS ──
const statusClass = (label) => {
  if (label === 'BELUM_CHECK_IN')  return 'status-planned'
  if (label === 'SEDANG_CHECK_IN') return 'status-ongoing'
  if (label === 'SELESAI')         return 'status-done'
  return 'status-unknown'
}
const statusLabel = (label) => {
  if (label === 'BELUM_CHECK_IN')  return 'Planned'
  if (label === 'SEDANG_CHECK_IN') return 'On-Site'
  if (label === 'SELESAI')         return 'Done'
  return label
}

// ── HELPERS: TYPE (LEAD / HEAD_OFFICE / BRANCH) ──
// target_type dari backend sekarang: 'LEAD' | 'HEAD_OFFICE' | 'BRANCH'
// Fallback 'CUSTOMER' tetap dihandle untuk kompatibilitas data lama.
const typeBadgeClass = (type) => {
  if (type === 'LEAD')   return 'badge-lead'
  if (type === 'BRANCH') return 'badge-branch'
  return 'badge-customer' // HEAD_OFFICE / CUSTOMER (lama)
}
const typeLabel = (type) => {
  if (type === 'HEAD_OFFICE') return 'HEAD OFFICE CUSTOMER'
  if (type === 'BRANCH')      return 'BRANCH CUSTOMER'
  return type
}
// dipakai di marker (innerHTML string), karena marker dirender manual bukan lewat template
const typeColor = (type) => {
  if (type === 'LEAD')   return { bg: 'rgba(99,102,241,0.1)', text: '#6366f1', border: '#6366f144' }
  if (type === 'BRANCH') return { bg: 'rgba(249,115,22,0.1)', text: '#f97316', border: '#f9731644' }
  return { bg: 'rgba(34,197,94,0.1)', text: '#16a34a', border: '#16a34a44' } // HEAD_OFFICE / CUSTOMER
}

const formatTime = (dt) => {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
}
// BARU: label hasil kunjungan (customer_response) dari backend
const customerResponseLabel = (val) => {
  const map = {
    potential_customers:   'Calon Pelanggan Potensial',
    consideration_stage:   'Tahap Pertimbangan',
    prospective_customers: 'Calon Pelanggan Prospektif',
    failed:                'Gagal / Tidak Berlanjut',
    convert_to_customer:   'Berhasil Jadi Customer',
  }
  return map[val] || val
}

// BARU: notes / complaint_detail / potential_order_detail diisi lewat editor
// Tiptap di form input visit, jadi isinya HTML (<p>, <strong>, <ul>, dll),
// bukan teks polos. Kalau ditampilkan lewat {{ }} biasa, tag-nya ikut
// kelihatan mentah. Fungsi ini dipakai dengan v-html supaya HTML-nya
// dirender jadi teks/format normal, dengan sanitasi ringan (buang
// <script>, atribut on*, dan href javascript:) untuk jaga-jaga.
const sanitizeRichText = (html) => {
  if (!html) return ''
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href="#"')
}

// BARU: label jenis follow up / kunjungan selanjutnya
const followUpTypeLabel = (type) => {
  const map = {
    CALL:     'Telepon',
    EMAIL:    'Email',
    WHATSAPP: 'WhatsApp',
    MEETING:  'Meeting',
    VISIT:    'Kunjungan Langsung',
    OTHER:    'Lainnya',
  }
  return map[type] || type
}

const calcDuration = (checkIn, checkOut) => {
  const diff = new Date(checkOut) - new Date(checkIn)
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} menit`
  const h = Math.floor(mins / 60), m = mins % 60
  return m > 0 ? `${h} jam ${m} menit` : `${h} jam`
}
const avatarUrl = (name, photoUrl) => {
  if (photoUrl && (photoUrl.startsWith('http') || photoUrl.startsWith('/'))) return photoUrl
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=80&bold=true`
}
const markerColor = (label) => {
  if (label === 'BELUM_CHECK_IN')  return '#f59e0b'
  if (label === 'SEDANG_CHECK_IN') return '#6366f1'
  if (label === 'SELESAI')         return '#22c55e'
  return '#94a3b8'
}
const salesColor = (salesId) => {
  const colors = ['#6366f1', '#f59e0b', '#ef4444', '#22c55e', '#38bdf8', '#8b5cf6', '#f97316']
  return colors[salesId % colors.length]
}

// ── RESET FILTER ──
const handleReset = async () => {
  selectedSalesId.value = ''
  selectedStatus.value  = ''
  selectedType.value    = ''
  search.value          = ''
  dateFrom.value        = today
  dateTo.value          = today
  showDateFilter.value  = false
  showSalesFilter.value = false
  showStatusFilter.value = false
  showTypeFilter.value  = false
  await store.fetchMapData()
  lastUpdated.value = new Date().toLocaleTimeString('id-ID')
}

// ── LIFECYCLE ──
onMounted(async () => {
  await store.fetchMapData(dateFrom.value, dateTo.value)
  lastUpdated.value = new Date().toLocaleTimeString('id-ID')
  initGoogleMaps()
  startPolling()
  window.addEventListener('resize', handleViewportResize)
})
onUnmounted(() => {
  stopPolling()
  window.removeEventListener('resize', handleViewportResize)
})

// ── GOOGLE MAPS ──
const initGoogleMaps = () => {
  if (document.getElementById('google-maps-script')) {
    initMap()
    return
  }
  const script = document.createElement('script')
  script.id    = 'google-maps-script'
  script.src   = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAukPU7EoLvUeD4yGtxYkgyeOuxIgATl2A&libraries=marker,geometry&v=weekly&loading=async`
  script.async = true
  script.defer = true
  script.onload = () => initMap()
  document.head.appendChild(script)
}

const initMap = async () => {
  if (mapInstance.value || !window.google || !mapRef.value) return

  // Tunggu google.maps.importLibrary tersedia (diperlukan saat pakai loading=async)
  await new Promise(resolve => {
    const check = () => {
      if (window.google?.maps?.importLibrary) resolve()
      else setTimeout(check, 50)
    }
    check()
  })

  const [{ Map }, { AdvancedMarkerElement: AME }] = await Promise.all([
    google.maps.importLibrary('maps'),
    google.maps.importLibrary('marker'),
  ])
  AdvancedMarkerElement.value = markRaw(AME)
  const map = new Map(mapRef.value, {
    center: { lat: -6.1574, lng: 106.7110 },
    zoom: 12,
    mapId: 'b690a5c1fdb329231a42c571',
    mapTypeId: 'hybrid',
    streetViewControl: true,
    streetViewControlOptions: { position: google.maps.ControlPosition.LEFT_BOTTOM },
    fullscreenControl: true,
    fullscreenControlOptions: { position: google.maps.ControlPosition.LEFT_BOTTOM },
    zoomControl: true,
    zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
  })
  mapInstance.value = markRaw(map)
  renderMarkers()
}

// ── FETCH dengan date filter ──
const fetchWithDate = async () => {
  await store.fetchMapData(dateFrom.value, dateTo.value)
  lastUpdated.value = new Date().toLocaleTimeString('id-ID')
  showDateFilter.value = false
}

// ── MARKERS ──
const renderMarkers = () => {
  if (!mapInstance.value || !AdvancedMarkerElement.value) return

  googleMarkers.value.forEach(m => (m.map = null))
  googleMarkers.value = []

  const bounds = new google.maps.LatLngBounds()
  const sorted = [...filteredVisits.value].sort((a, b) => new Date(a.visit_at) - new Date(b.visit_at))
  const salesCounter = {}

  sorted.forEach((visit, index) => {
    if (!visit.latitude || !visit.longitude) return
    if (!salesCounter[visit.sales_id]) salesCounter[visit.sales_id] = 0
    salesCounter[visit.sales_id]++
    const number = salesCounter[visit.sales_id]
    const lat    = parseFloat(visit.latitude)
    const lng    = parseFloat(visit.longitude)
    const color  = markerColor(visit.visit_status_label)
    const tc     = typeColor(visit.target_type)

    // Label target: kalau BRANCH, tampilkan nama cabang di badge company juga
    const companyLabel = visit.target_name

    const markerEl = document.createElement('div')
    markerEl.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:pointer;transition:transform 0.2s ease;'
    markerEl.innerHTML = `
      <div style="position:relative;width:44px;height:44px;">
        <div style="position:absolute;top:-6px;left:-6px;width:18px;height:18px;border-radius:50%;background:#fff;border:2px solid ${color};color:${color};font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;z-index:10;box-shadow:0 2px 4px rgba(0,0,0,0.15);">${number}</div>
        <div style="position:absolute;inset:0;border-radius:50%;border:3px solid ${color};box-shadow:0 0 10px ${color}66;"></div>
        <img src="${avatarUrl(visit.sales_name, visit.sales_photo_url)}"
          style="width:100%;height:100%;border-radius:50%;object-fit:cover;border:2px solid white;display:block;"
          onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(visit.sales_name)}&background=6366f1&color=fff&size=44&bold=true'" />
        <div style="position:absolute;bottom:0;right:0;width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;"></div>
      </div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${color};margin-top:-1px;filter:drop-shadow(0 2px 2px rgba(0,0,0,0.15));"></div>
      <div style="margin-top:3px;background:#fff;color:#334155;font-size:10px;font-weight:600;padding:2px 7px;border-radius:10px;white-space:nowrap;border:1px solid ${color}44;box-shadow:0 2px 6px rgba(0,0,0,0.08);max-width:120px;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:4px;">
        <span style="font-size:8px;font-weight:700;padding:1px 4px;border-radius:3px;flex-shrink:0;background:${tc.bg};color:${tc.text};border:1px solid ${tc.border};">${typeLabel(visit.target_type)}</span>
        ${visit.sales_name.split(' ')[0]}
      </div>
      <div style="margin-top:2px;background:rgba(255,255,255,0.9);color:#64748b;font-size:9px;padding:1px 6px;border-radius:8px;white-space:nowrap;max-width:130px;overflow:hidden;text-overflow:ellipsis;text-align:center;">${companyLabel}</div>
    `

    markerEl.addEventListener('click', () => selectVisit(visit))
    markerEl.addEventListener('mouseenter', () => { markerEl.style.transform = 'scale(1.15) translateY(-4px)'; markerEl.style.zIndex = '999' })
    markerEl.addEventListener('mouseleave', () => { markerEl.style.transform = 'scale(1)'; markerEl.style.zIndex = '' })

    try {
      const marker = new AdvancedMarkerElement.value({
        map: mapInstance.value,
        position: { lat, lng },
        content: markerEl,
        title: `#${number} · ${visit.sales_name} - ${visit.target_name}`,
      })
      marker.addEventListener('gmp-click', () => selectVisit(visit))
      googleMarkers.value.push(markRaw(marker))
      bounds.extend({ lat, lng })
    } catch (err) {
      console.error(`Marker [${index}] FAILED:`, err)
    }
  })

  if (googleMarkers.value.length > 0)
    mapInstance.value.fitBounds(bounds, { padding: 80 })

  nextTick(() => renderPolylines())
}

// ── POLYLINES ──
const renderPolylines = () => {
  if (!mapInstance.value || !window.google) return

  activePolylines.value.forEach(p => p.setMap(null))
  activePolylines.value = []

  const grouped = {}
  filteredVisits.value.forEach(v => {
    if (!v.latitude || !v.longitude) return
    if (!grouped[v.sales_id]) grouped[v.sales_id] = []
    grouped[v.sales_id].push(v)
  })

  Object.entries(grouped).forEach(([salesId, salesVisits]) => {
    if (salesVisits.length < 2) return
    const sorted = [...salesVisits].sort((a, b) => new Date(a.visit_at) - new Date(b.visit_at))
    const path   = sorted.map(v => ({ lat: parseFloat(v.latitude), lng: parseFloat(v.longitude) }))
    const line   = new google.maps.Polyline({
      path, strokeColor: salesColor(parseInt(salesId)),
      strokeOpacity: 0.5, strokeWeight: 2, map: mapInstance.value,
      icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 2 }, offset: '0', repeat: '10px' }],
    })
    activePolylines.value.push(line)
  })
}

// ── SELECT VISIT ──
const selectVisit = (visit) => {
  selectedVisit.value = visit
  if (visit.latitude && visit.longitude && mapInstance.value) {
    const pos = { lat: parseFloat(visit.latitude), lng: parseFloat(visit.longitude) }
    mapInstance.value.setZoom(11)
    setTimeout(() => {
      mapInstance.value.panTo(pos)
      setTimeout(() => mapInstance.value.setZoom(18), 600)
    }, 300)
  }
}

// ── WATCHERS ──
// Watch data baru dari store (polling / fetch)
watch(visits, () => {
  if (mapInstance.value) nextTick(() => renderMarkers())
}, { deep: true })

// Watch filter — trigger langsung saat selectedSalesId, selectedStatus, selectedType, atau search berubah
watch([selectedSalesId, selectedStatus, selectedType, search], () => {
  if (mapInstance.value) nextTick(() => renderMarkers())
})

watch(sidebarCollapsed, () => {
  setTimeout(() => {
    if (mapInstance.value && window.google)
      google.maps.event.trigger(mapInstance.value, 'resize')
  }, 350)
})

// ── POLLING ──
const startPolling = () => {
  pollingInterval.value = setInterval(async () => {
    await store.fetchMapData(dateFrom.value, dateTo.value)
    lastUpdated.value = new Date().toLocaleTimeString('id-ID')
  }, 30000)
}
const stopPolling = () => {
  if (pollingInterval.value) { clearInterval(pollingInterval.value); pollingInterval.value = null }
}

// ── EXPORT ──
const exportMap = async () => {
  isExporting.value = true
  try {
    if (!window.html2canvas) {
      await new Promise(resolve => {
        const s = document.createElement('script')
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
        s.onload = resolve
        document.head.appendChild(s)
      })
    }
    const canvas = await window.html2canvas(mapRef.value, { useCORS: true, allowTaint: true, scale: 2 })
    const link = document.createElement('a')
    link.download = `field-tracker-${dateFrom.value}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (e) {
    console.error('Export failed:', e)
  } finally {
    isExporting.value = false
  }
}

const legends = [
  { label: 'Belum Check-in', color: '#f59e0b' },
  { label: 'Sedang Check-in', color: '#6366f1' },
  { label: 'Selesai',         color: '#22c55e' },
]
</script>

<template>
  <div class="page-root" :data-theme="isDark ? 'dark' : 'light'">
  <div class="h-100 d-flex flex-column" style="padding:16px;gap:12px;box-sizing:border-box;">

    <!-- BREADCRUMB -->
    <div class="breadcrumb-card">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="map-location-dot" />
          Live Field Tracker
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" /> Home
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Realtime Maps</span>
        </div>
      </div>
      <button class="theme-toggle" @click="toggleTheme" :title="isDark ? 'Switch to Light' : 'Switch to Dark'">
        <span class="toggle-track">
          <span class="toggle-thumb">
            <font-awesome-icon :icon="isDark ? 'moon' : 'sun'" />
          </span>
        </span>
        <span class="toggle-label">{{ isDark ? 'Dark' : 'Light' }}</span>
      </button>
    </div>

    <!-- TOOLBAR -->
    <div class="toolbar-top" :class="{ collapsed: toolbarCollapsed }">
      <div class="toolbar-content" v-show="!toolbarCollapsed">
      <div class="toolbar-left">

        <!-- Date Filter -->
        <div class="drop-wrap">
          <button class="btn-toolbar btn-purple" @click="showDateFilter = !showDateFilter">
            <font-awesome-icon icon="calendar-days" />
            {{ dateFrom }} → {{ dateTo }}
            <font-awesome-icon icon="chevron-down" class="btn-arrow" />
          </button>
          <div class="drop-menu drop-wide" :class="{ show: showDateFilter }">
            <div class="drop-label">Date Filter</div>
            <div class="date-range-row">
              <div class="form-group">
                <label>From</label>
                <input type="date" v-model="dateFrom" class="form-input" />
              </div>
              <span class="date-sep">→</span>
              <div class="form-group">
                <label>To</label>
                <input type="date" v-model="dateTo" class="form-input" />
              </div>
            </div>
            <button class="btn-toolbar btn-purple w-100 mt-2" @click="fetchWithDate">
              <font-awesome-icon icon="magnifying-glass" /> Apply
            </button>
          </div>
        </div>

        <!-- Sales Filter -->
        <div class="drop-wrap">
          <button class="btn-toolbar btn-purple" @click="showSalesFilter = !showSalesFilter">
            <font-awesome-icon icon="user-tie" />
            {{ selectedSalesId ? salesList.find(s => s.id == selectedSalesId)?.name : 'All Sales' }}
            <font-awesome-icon icon="chevron-down" class="btn-arrow" />
          </button>
          <div class="drop-menu" :class="{ show: showSalesFilter }">
            <div class="drop-label">Filter Sales</div>
            <button class="drop-item" :class="{ active: selectedSalesId === '' }"
              @click="selectedSalesId = ''; showSalesFilter = false">
              <font-awesome-icon icon="users" /> All Sales
            </button>
            <button v-for="s in salesList" :key="s.id" class="drop-item"
              :class="{ active: selectedSalesId == s.id }"
              @click="selectedSalesId = s.id; showSalesFilter = false">
              <font-awesome-icon icon="user" /> {{ s.name }}
            </button>
          </div>
        </div>

        <!-- Status Filter -->
        <div class="drop-wrap">
          <button class="btn-toolbar btn-purple" @click="showStatusFilter = !showStatusFilter">
            <font-awesome-icon icon="circle-dot" />
            {{ selectedStatus ? statusLabel(selectedStatus) : 'All Status' }}
            <font-awesome-icon icon="chevron-down" class="btn-arrow" />
          </button>
          <div class="drop-menu" :class="{ show: showStatusFilter }">
            <div class="drop-label">Filter Status</div>
            <button class="drop-item" :class="{ active: selectedStatus === '' }"
              @click="selectedStatus = ''; showStatusFilter = false">
              <font-awesome-icon icon="layer-group" /> All Status
            </button>
            <button class="drop-item" :class="{ active: selectedStatus === 'BELUM_CHECK_IN' }"
              @click="selectedStatus = 'BELUM_CHECK_IN'; showStatusFilter = false">
              <span class="dot-pill dot-planned"></span> Planned
            </button>
            <button class="drop-item" :class="{ active: selectedStatus === 'SEDANG_CHECK_IN' }"
              @click="selectedStatus = 'SEDANG_CHECK_IN'; showStatusFilter = false">
              <span class="dot-pill dot-ongoing"></span> On-Site
            </button>
            <button class="drop-item" :class="{ active: selectedStatus === 'SELESAI' }"
              @click="selectedStatus = 'SELESAI'; showStatusFilter = false">
              <span class="dot-pill dot-done"></span> Done
            </button>
          </div>
        </div>

        <!-- Type Filter (BARU: LEAD / HEAD_OFFICE / BRANCH) -->
        <div class="drop-wrap">
          <button class="btn-toolbar btn-purple" @click="showTypeFilter = !showTypeFilter">
            <font-awesome-icon icon="tags" />
            {{ selectedType ? typeLabel(selectedType) : 'All Type' }}
            <font-awesome-icon icon="chevron-down" class="btn-arrow" />
          </button>
          <div class="drop-menu" :class="{ show: showTypeFilter }">
            <div class="drop-label">Filter Type</div>
            <button class="drop-item" :class="{ active: selectedType === '' }"
              @click="selectedType = ''; showTypeFilter = false">
              <font-awesome-icon icon="layer-group" /> All Type
            </button>
            <button class="drop-item" :class="{ active: selectedType === 'LEAD' }"
              @click="selectedType = 'LEAD'; showTypeFilter = false">
              <span class="type-badge badge-lead">LEAD</span>
            </button>
            <button class="drop-item" :class="{ active: selectedType === 'HEAD_OFFICE' }"
              @click="selectedType = 'HEAD_OFFICE'; showTypeFilter = false">
              <span class="type-badge badge-customer">{{ typeLabel('HEAD_OFFICE') }}</span>
            </button>
            <button class="drop-item" :class="{ active: selectedType === 'BRANCH' }"
              @click="selectedType = 'BRANCH'; showTypeFilter = false">
              <span class="type-badge badge-branch">{{ typeLabel('BRANCH') }}</span>
            </button>
          </div>
        </div>

      </div>

      <button class="btn-toolbar btn-orange" @click="handleReset">
        <font-awesome-icon icon="rotate-left" /> Reset
      </button>

      <button class="btn-toolbar btn-outline" @click="goToLogin">
        <font-awesome-icon icon="right-to-bracket" /> Login
      </button>

      <div class="toolbar-right">
        <div v-for="s in statusSummary" :key="s.label" class="stat-pill" :class="s.cls">
          <span class="pill-dot"></span>
          {{ s.count }} {{ s.label }}
        </div>
        <span class="last-update">
          <font-awesome-icon icon="rotate" :class="{ 'fa-spin': store.loadingMap }" /> Live · {{ lastUpdated }}
        </span>
        <button class="btn-toolbar btn-green" @click="exportMap" :disabled="isExporting">
          <font-awesome-icon icon="download" /> {{ isExporting ? 'Exporting...' : 'Export Map' }}
        </button>
      </div>
      </div>

      <!-- BARU: handle untuk melipat/split toolbar filter — tap untuk
           menyembunyikan seluruh baris filter supaya peta jadi lebih lebar,
           tap lagi untuk membuka filter itu kembali. -->
      <button
        class="toolbar-collapse-handle"
        @click="toolbarCollapsed = !toolbarCollapsed"
        :title="toolbarCollapsed ? 'Tampilkan Filter' : 'Sembunyikan Filter'"
      >
        <span class="handle-grip"></span>
        <font-awesome-icon :icon="toolbarCollapsed ? 'chevron-down' : 'chevron-up'" />
        <span>{{ toolbarCollapsed ? 'Tampilkan Filter' : 'Sembunyikan Filter' }}</span>
      </button>
    </div>

    <!-- MAIN LAYOUT -->
    <div class="map-main flex-grow-1">

      <!-- SIDEBAR -->
      <div class="map-sidebar" :class="{ collapsed: sidebarCollapsed }">

        <div class="sidebar-header">
          <span v-if="!sidebarCollapsed" class="sidebar-title">
            <font-awesome-icon icon="list" />
            All Visits
            <em class="sidebar-count">{{ filteredVisits.length }}</em>
          </span>
          <button class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
            <span v-if="!sidebarCollapsed" class="collapse-btn-label">Geser</span>
            <font-awesome-icon :icon="sidebarCollapsed ? 'chevron-right' : 'chevron-left'" />
          </button>
        </div>

        <template v-if="!sidebarCollapsed">
          <div class="sidebar-search">
            <input v-model="search" type="text" placeholder="Search for sales / companies..." class="search-input-map" />
            <button class="search-btn-map"><font-awesome-icon icon="magnifying-glass" /></button>
          </div>

          <div class="visit-list">
            <div
              v-for="visit in filteredVisits" :key="visit.id"
              class="visit-item" :class="{ active: selectedVisit?.id === visit.id }"
              @click="selectVisit(visit)"
            >
              <div class="visit-avatar-wrap">
                <img
                  :src="avatarUrl(visit.sales_name, visit.sales_photo_url)"
                  :alt="visit.sales_name"
                  class="visit-avatar"
                  @error="$event.target.src=avatarUrl(visit.sales_name, '')"
                />
                <span class="v-status-dot" :class="statusClass(visit.visit_status_label)"></span>
              </div>
              <div class="visit-info">
                <div class="visit-sales-name">{{ visit.sales_name }}</div>
                <div class="visit-company">
                  <span class="type-badge" :class="typeBadgeClass(visit.target_type)">
                    {{ typeLabel(visit.target_type) }}
                  </span>
                  {{ visit.target_name }}
                </div>
                <div class="visit-time-row">
                  <font-awesome-icon icon="clock" /> {{ formatTime(visit.visit_at) }}
                </div>
              </div>
              <span class="visit-status-badge" :class="statusClass(visit.visit_status_label)">
                {{ statusLabel(visit.visit_status_label) }}
              </span>
            </div>

            <div class="empty-state" v-if="filteredVisits.length === 0">
              <font-awesome-icon icon="map-pin" class="empty-icon" />
              <div>No visits found</div>
            </div>
          </div>
        </template>

      </div>

      <!-- MAP AREA -->
      <div class="map-area">
        <div ref="mapRef" style="width:100%;height:100%;"></div>

        <div class="map-loading-overlay" v-if="store.loadingMap">
          <div class="loader-ring"></div>
          <span>Loading visits...</span>
        </div>

        <div class="map-loading-overlay" v-else-if="store.errorMap">
          <font-awesome-icon icon="circle-exclamation" class="error-icon" />
          <span>Failed to load visit data</span>
          <button class="btn-toolbar btn-purple" @click="store.fetchMapData(dateFrom, dateTo)">
            <font-awesome-icon icon="rotate-right" /> Try Again
          </button>
        </div>

        <!-- Tombol toggle legend: hanya tampak di mobile (lihat media query).
             Legend card-nya sendiri konsepnya sama seperti desktop (kartu pojok
             kanan atas), cuma di mobile defaultnya tersembunyi di balik tombol ini. -->
        <button
          class="legend-toggle-btn"
          @click="toggleLegend"
          :title="legendOpen ? 'Sembunyikan Legenda' : 'Tampilkan Legenda'"
        >
          <font-awesome-icon :icon="legendOpen ? 'xmark' : 'layer-group'" />
        </button>

        <div class="map-legend-card" :class="{ 'legend-open': legendOpen }">
          <div class="drop-label">Status</div>
          <div v-for="l in legends" :key="l.label" class="legend-row">
            <span class="legend-dot" :style="{ background: l.color }"></span>
            {{ l.label }}
          </div>
          <div class="legend-divider"></div>
          <div class="drop-label">Type</div>
          <div class="legend-row"><span class="type-badge badge-lead">LEAD</span></div>
          <div class="legend-row"><span class="type-badge badge-customer">{{ typeLabel('HEAD_OFFICE') }}</span></div>
          <div class="legend-row"><span class="type-badge badge-branch">{{ typeLabel('BRANCH') }}</span></div>
        </div>
      </div>

    </div>

    <!-- MODAL DETAIL -->
    <transition name="modal-fade">
      <div class="modal-overlay" v-if="selectedVisit" @click.self="selectedVisit = null">
        <div class="modal-card">

          <div class="modal-header-strip" :class="statusClass(selectedVisit.visit_status_label)">
            <button class="modal-close" @click="selectedVisit = null">
              <font-awesome-icon icon="xmark" />
            </button>
            <div class="modal-hero-row">
              <div class="modal-avatar-wrap">
                <img
                  :src="avatarUrl(selectedVisit.sales_name, selectedVisit.sales_photo_url)"
                  class="modal-avatar"
                  @error="$event.target.src=avatarUrl(selectedVisit.sales_name, '')"
                />
                <span class="modal-avatar-ring" :class="statusClass(selectedVisit.visit_status_label)"></span>
              </div>
              <div>
                <div class="modal-sales-name">{{ selectedVisit.sales_name }}</div>
                <div class="modal-status-badge" :class="statusClass(selectedVisit.visit_status_label)">
                  <span class="pill-dot"></span>
                  {{ statusLabel(selectedVisit.visit_status_label) }}
                </div>
              </div>
            </div>
          </div>

          <div class="modal-body">
            <div class="detail-list">
              <div class="detail-row">
                <span class="detail-label">Visit Code</span>
                <span class="detail-value mono">{{ selectedVisit.visit_code }}</span>
              </div>

              <div class="detail-row" v-if="selectedVisit.no_reference">
                <span class="detail-label">No. Ref</span>
                <span class="detail-value mono">{{ selectedVisit.no_reference }}</span>
              </div>


              <div class="detail-row">
                <span class="detail-label">Target</span>
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
                  <span class="type-badge" :class="typeBadgeClass(selectedVisit.target_type)">
                    {{ typeLabel(selectedVisit.target_type) }}
                  </span>
                  <span class="detail-value">{{ selectedVisit.target_name }}</span>
                </div>
              </div>

              <!-- BARU: info induk company, khusus kalau visit ke BRANCH -->
              <div class="detail-row" v-if="selectedVisit.target_type === 'BRANCH' && selectedVisit.parent_company_name">
                <span class="detail-label">Induk Company</span>
                <span class="detail-value">{{ selectedVisit.parent_company_name }}</span>
              </div>

              <!-- BARU: kode cabang, kalau ada -->
              <div class="detail-row" v-if="selectedVisit.branch_code">
                <span class="detail-label">Kode Cabang</span>
                <span class="detail-value mono">{{ selectedVisit.branch_code }}</span>
              </div>

              <!-- BARU: kota cabang, kalau ada -->
              <div class="detail-row" v-if="selectedVisit.branch_city">
                <span class="detail-label">Kota Cabang</span>
                <span class="detail-value">{{ selectedVisit.branch_city }}</span>
              </div>

              <div class="detail-row" v-if="selectedVisit.target_contact">
                <span class="detail-label">Contact</span>
                <span class="detail-value">{{ selectedVisit.target_contact }}</span>
              </div>

              <!-- BARU: no. telepon kontak, klik untuk langsung telepon -->
              <div class="detail-row" v-if="selectedVisit.target_phone">
                <span class="detail-label">Telepon</span>
                <a :href="`tel:${selectedVisit.target_phone}`" class="detail-value detail-link">
                  {{ selectedVisit.target_phone }}
                </a>
              </div>

              <!-- BARU: email kontak, klik untuk langsung buka email client -->
              <div class="detail-row" v-if="selectedVisit.target_email">
                <span class="detail-label">Email</span>
                <a :href="`mailto:${selectedVisit.target_email}`" class="detail-value detail-link">
                  {{ selectedVisit.target_email }}
                </a>
              </div>

              <div class="detail-row">
                <span class="detail-label">Lokasi</span>
                <span class="detail-value" style="text-align:right;max-width:60%">{{ selectedVisit.gps_snapshot ?? '-' }}</span>
              </div>
            </div>

            <div class="modal-section-title">Timeline</div>
            <div class="modal-timeline">
              <div class="timeline-item">
                <div class="timeline-dot dot-plan"></div>
                <div class="timeline-content">
                  <div class="timeline-label">Planned</div>
                  <div class="timeline-time">{{ formatTime(selectedVisit.visit_at) }}</div>
                </div>
              </div>
              <div class="timeline-line"></div>
              <div class="timeline-item">
                <div class="timeline-dot" :class="selectedVisit.check_in_at ? 'dot-checkin' : 'dot-empty'"></div>
                <div class="timeline-content">
                  <div class="timeline-label">Check-in</div>
                  <div class="timeline-time">{{ formatTime(selectedVisit.check_in_at) }}</div>
                </div>
              </div>
              <div class="timeline-line"></div>
              <div class="timeline-item">
                <div class="timeline-dot" :class="selectedVisit.check_out_at ? 'dot-checkout' : 'dot-empty'"></div>
                <div class="timeline-content">
                  <div class="timeline-label">Check-out</div>
                  <div class="timeline-time">{{ formatTime(selectedVisit.check_out_at) }}</div>
                </div>
              </div>
            </div>

            <div class="duration-card" v-if="selectedVisit.check_in_at && selectedVisit.check_out_at">
              <font-awesome-icon icon="clock" />
              Durasi: <strong>{{ calcDuration(selectedVisit.check_in_at, selectedVisit.check_out_at) }}</strong>
            </div>

            <!-- BARU: foto kunjungan (diambil sales saat check-in) -->
            <template v-if="selectedVisit.photo_url">
              <div class="modal-section-title">Foto Kunjungan</div>
              <a :href="selectedVisit.photo_url" target="_blank" class="visit-photo-link">
                <img :src="selectedVisit.photo_url" alt="Foto kunjungan" class="visit-photo-img" />
              </a>
            </template>

            <!-- BARU: hasil kunjungan (notes + response sales setelah check-out) -->
            <template v-if="selectedVisit.notes || selectedVisit.customer_response">
              <div class="modal-section-title">Hasil Kunjungan</div>
              <div class="detail-list">
                <div class="detail-row" v-if="selectedVisit.customer_response">
                  <span class="detail-label">Hasil</span>
                  <span class="detail-value">{{ customerResponseLabel(selectedVisit.customer_response) }}</span>
                </div>
                <div class="detail-row" v-if="selectedVisit.notes">
                  <span class="detail-label">Catatan</span>
                  <div
                    class="detail-value rich-text"
                    style="text-align:right;max-width:60%"
                    v-html="sanitizeRichText(selectedVisit.notes)"
                  ></div>
                </div>
              </div>
            </template>

            <!-- BARU: jadwal & catatan kunjungan selanjutnya (dari follow up
                 yang dibuat otomatis saat sales check-out) -->
            <template v-if="selectedVisit.next_visit_at || selectedVisit.next_visit_notes">
              <div class="modal-section-title">Kunjungan Selanjutnya</div>
              <div class="next-visit-card">
                <div class="next-visit-row" v-if="selectedVisit.next_visit_at">
                  <font-awesome-icon icon="calendar-days" />
                  <div>
                    <div class="next-visit-date">{{ formatTime(selectedVisit.next_visit_at) }}</div>
                    <div class="next-visit-type" v-if="selectedVisit.next_visit_type">
                      {{ followUpTypeLabel(selectedVisit.next_visit_type) }}
                    </div>
                  </div>
                </div>
                <div
                  class="next-visit-notes rich-text"
                  v-if="selectedVisit.next_visit_notes"
                  v-html="sanitizeRichText(selectedVisit.next_visit_notes)"
                ></div>
              </div>
            </template>

            <!-- BARU: info komplain, kalau ada -->
            <div class="alert-box alert-danger" v-if="selectedVisit.has_complaint">
              <font-awesome-icon icon="triangle-exclamation" />
              <div>
                <strong>Ada Komplain</strong>
                <div class="rich-text" v-html="sanitizeRichText(selectedVisit.complaint_detail)"></div>
              </div>
            </div>

            <!-- BARU: info potensi order, kalau ada -->
            <div class="alert-box alert-success" v-if="selectedVisit.has_potential_order">
              <font-awesome-icon icon="circle-info" />
              <div>
                <strong>Ada Potensi Order</strong>
                <div class="rich-text" v-html="sanitizeRichText(selectedVisit.potential_order_detail)"></div>
              </div>
            </div>

            <!-- BARU: file bukti check-out, kalau sales upload dokumen -->
            <a
              v-if="selectedVisit.check_out_file_url"
              :href="selectedVisit.check_out_file_url"
              target="_blank"
              class="checkout-file-link"
            >
              <font-awesome-icon icon="paperclip" /> Lihat File Bukti Check-out
            </a>
          </div>

          <div class="modal-footer-btns">
            <a
              :href="`https://www.google.com/maps?q=${selectedVisit.latitude},${selectedVisit.longitude}`"
              target="_blank"
              class="btn-toolbar btn-purple"
              style="text-decoration:none;flex:1;justify-content:center;"
            >
              <font-awesome-icon icon="map-location-dot" /> Buka di Maps
            </a>
            <button class="btn-cancel" @click="selectedVisit = null">Tutup</button>
          </div>

        </div>
      </div>
    </transition>

  </div>
  </div>
</template>

<style scoped>
/* ══════════════════════════════════════════
   THEME VARIABLES — LIGHT & DARK LOKAL
══════════════════════════════════════════ */
.page-root {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* LIGHT */
.page-root[data-theme="light"] {
  --bg-page:      #f1f5f9;
  --bg-card:      #ffffff;
  --bg-input:     #f8fafc;
  --bg-nav-hover: #f1f5f9;
  --border-main:  #e2e8f0;
  --text-primary: #1e293b;
  --text-muted:   #64748b;
  --shadow-color: rgba(0,0,0,0.07);
}

/* DARK */
.page-root[data-theme="dark"] {
  --bg-page:      #0f1117;
  --bg-card:      #161b27;
  --bg-input:     #1e2535;
  --bg-nav-hover: #1a2232;
  --border-main:  #1e2535;
  --text-primary: #e2e8f0;
  --text-muted:   #64748b;
  --shadow-color: rgba(0,0,0,0.4);
}

/* ── BASE ── */
.h-100       { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.d-flex      { display: flex; }
.flex-column { flex-direction: column; }
.flex-grow-1 { flex: 1; min-height: 0; }
.mb-2        { margin-bottom: 12px; }
.w-100       { width: 100%; }
.mt-2        { margin-top: 8px; }

.page-root { background: var(--bg-page); transition: background 0.3s ease; }

/* ── BREADCRUMB ── */
.breadcrumb-card {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--bg-card); border-radius: 10px; padding: 16px 18px;
  box-shadow: 0 1px 3px var(--shadow-color); border: 1px solid var(--border-main);
  transition: background 0.3s, border-color 0.3s; flex-shrink: 0;
}
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

/* ── THEME TOGGLE ── */
.theme-toggle { display: flex; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; padding: 0; }
.toggle-track {
  width: 48px; height: 26px; background: var(--border-main); border-radius: 13px;
  position: relative; display: flex; align-items: center; padding: 3px;
  transition: background 0.3s; border: 1px solid var(--border-main);
}
.page-root[data-theme="dark"] .toggle-track { background: #6366f1; }
.toggle-thumb {
  width: 20px; height: 20px; background: #fff; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; color: #f59e0b;
  transition: transform 0.3s, color 0.3s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2); transform: translateX(0);
}
.page-root[data-theme="dark"] .toggle-thumb { transform: translateX(22px); color: #6366f1; }
.toggle-label { font-size: 0.78rem; font-weight: 700; color: var(--text-muted); }

/* ── TOOLBAR ── */
.toolbar-top {
  display: flex; flex-direction: column;
  background: var(--bg-card); border: 1px solid var(--border-main);
  border-radius: 10px;
  box-shadow: 0 1px 3px var(--shadow-color);
  transition: background 0.3s, border-color 0.3s; flex-shrink: 0;
}
.toolbar-content {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 8px; padding: 12px 16px;
}
.toolbar-left  { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.toolbar-right { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

/* BARU: handle "split" untuk melipat/membuka toolbar filter */
.toolbar-collapse-handle {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; padding: 6px 0; border: none; border-top: 1px solid var(--border-main);
  background: transparent; color: var(--text-muted); cursor: pointer;
  font-size: 0.72rem; font-weight: 600; border-radius: 0 0 10px 10px;
  transition: all 0.18s ease;
}
.toolbar-collapse-handle:hover { color: #6366f1; background: rgba(99,102,241,0.06); }
.toolbar-top.collapsed .toolbar-collapse-handle { border-top: none; }
.handle-grip { width: 28px; height: 3px; border-radius: 3px; background: var(--border-main); }
.toolbar-collapse-handle:hover .handle-grip { background: #6366f1; }

.btn-toolbar { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: none; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; transition: all 0.18s ease; white-space: nowrap; }
.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover { background: #4f46e5; }
.btn-green  { background: #22c55e; color: #fff; }
.btn-green:hover { background: #16a34a; }
.btn-green:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-orange { background: #f59e0b; color: #fff; }
.btn-orange:hover { background: #d97706; }
.btn-outline { background: transparent; color: var(--text-muted); border: 1px solid var(--border-main); }
.btn-outline:hover { border-color: #6366f1; color: #6366f1; background: rgba(99,102,241,0.06); }
.btn-arrow  { font-size: 0.6rem; opacity: 0.7; }

/* ── DROPDOWN ── */
.drop-wrap { position: relative; }
.drop-menu {
  position: absolute; top: calc(100% + 6px); left: 0; min-width: 180px;
  background: var(--bg-card); border: 1px solid var(--border-main);
  border-radius: 10px; box-shadow: 0 8px 24px var(--shadow-color);
  padding: 10px; z-index: 300;
  opacity: 0; transform: translateY(-6px); pointer-events: none; transition: all 0.18s ease;
}
.drop-menu.show { opacity: 1; transform: translateY(0); pointer-events: all; }
.drop-wide { min-width: 280px; }
.drop-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; padding: 0 4px; }
.drop-item { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: none; border: none; border-radius: 7px; color: var(--text-primary); font-size: 0.84rem; cursor: pointer; text-align: left; }
.drop-item:hover { background: var(--bg-nav-hover); }
.drop-item.active { color: #6366f1; font-weight: 600; background: rgba(99,102,241,0.08); }

.date-range-row { display: flex; align-items: flex-end; gap: 8px; }
.date-sep { color: var(--text-muted); padding-bottom: 10px; }
.form-group { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.form-group label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.form-input { padding: 8px 10px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.84rem; background: var(--bg-input); color: var(--text-primary); outline: none; width: 100%; }
.form-input:focus { border-color: #6366f1; }

.stat-pill { display: flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
.pill-dot     { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.pill-planned { background: rgba(245,158,11,0.12); color: #d97706; }
.pill-ongoing { background: rgba(99,102,241,0.12); color: #6366f1; }
.pill-done    { background: rgba(34,197,94,0.12);  color: #16a34a; }

.dot-pill    { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-planned { background: #f59e0b; }
.dot-ongoing { background: #6366f1; }
.dot-done    { background: #22c55e; }

.last-update { font-size: 0.78rem; color: var(--text-muted); white-space: nowrap; display: flex; align-items: center; gap: 5px; }

/* ── MAIN LAYOUT ── */
.map-main {
  display: flex; flex: 1; min-height: 0;
  border-radius: 10px; overflow: hidden;
  border: 1px solid var(--border-main);
  box-shadow: 0 1px 3px var(--shadow-color);
}

/* ── SIDEBAR ── */
.map-sidebar {
  width: 300px; background: var(--bg-card);
  border-right: 1px solid var(--border-main);
  display: flex; flex-direction: column;
  transition: width 0.3s ease, max-height 0.3s ease, background 0.3s;
  flex-shrink: 0; overflow: hidden; min-height: 0;
}
.map-sidebar.collapsed { width: 48px; }

.sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 12px; border-bottom: 1px solid var(--border-main); min-height: 52px; flex-shrink: 0; }
.sidebar-title { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px; white-space: nowrap; }
.sidebar-count { color: #6366f1; font-style: normal; font-size: 0.8rem; background: rgba(99,102,241,0.1); padding: 1px 8px; border-radius: 20px; }
.collapse-btn { background: var(--bg-input); border: 1px solid var(--border-main); color: var(--text-muted); min-width: 28px; height: 28px; padding: 0 8px; border-radius: 7px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; flex-shrink: 0; transition: all 0.2s; font-size: 0.75rem; }
.collapse-btn:hover { border-color: #6366f1; color: #6366f1; }
.collapse-btn-label { font-size: 0.74rem; font-weight: 600; white-space: nowrap; }

.sidebar-search { display: flex; border-bottom: 1px solid var(--border-main); flex-shrink: 0; }
.search-input-map { flex: 1; padding: 10px 12px; border: none; background: transparent; color: var(--text-primary); font-size: 0.84rem; outline: none; }
.search-input-map::placeholder { color: var(--text-muted); }
.search-btn-map { padding: 10px 12px; background: #6366f1; color: #fff; border: none; cursor: pointer; }
.search-btn-map:hover { background: #4f46e5; }

.visit-list { overflow-y: auto; flex: 1; min-height: 0; }
.visit-list::-webkit-scrollbar { width: 4px; }
.visit-list::-webkit-scrollbar-thumb { background: var(--border-main); border-radius: 4px; }

.visit-item { display: flex; align-items: center; gap: 10px; padding: 12px; border-bottom: 1px solid var(--border-main); cursor: pointer; transition: background 0.15s; }
.visit-item:hover { background: var(--bg-nav-hover); }
.visit-item.active { background: rgba(99,102,241,0.06); border-left: 3px solid #6366f1; padding-left: 9px; }

.visit-avatar-wrap { position: relative; flex-shrink: 0; }
.visit-avatar { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-main); display: block; }
.v-status-dot { position: absolute; bottom: 0; right: 0; width: 11px; height: 11px; border-radius: 50%; border: 2px solid var(--bg-card); }

.visit-info { flex: 1; min-width: 0; }
.visit-sales-name { font-size: 0.84rem; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.visit-company { font-size: 0.76rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.visit-time-row { font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; display: flex; align-items: center; gap: 4px; }
.visit-status-badge { font-size: 0.68rem; font-weight: 700; padding: 3px 8px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }

.status-planned { background: rgba(245,158,11,0.12); color: #d97706; }
.status-ongoing { background: rgba(99,102,241,0.12); color: #6366f1; }
.status-done    { background: rgba(34,197,94,0.12);  color: #16a34a; }
.status-unknown { background: rgba(148,163,184,0.12); color: #64748b; }

.type-badge { font-size: 0.68rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; flex-shrink: 0; }
.badge-lead     { background: rgba(99,102,241,0.1); color: #6366f1; border: 1px solid rgba(99,102,241,0.2); }
.badge-customer { background: rgba(34,197,94,0.1);  color: #16a34a; border: 1px solid rgba(34,197,94,0.2); }
/* BARU: badge khusus BRANCH (oranye, biar beda dari HEAD_OFFICE hijau) */
.badge-branch   { background: rgba(249,115,22,0.1); color: #f97316; border: 1px solid rgba(249,115,22,0.2); }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 40px 20px; color: var(--text-muted); font-size: 0.84rem; }
.empty-icon { font-size: 2rem; opacity: 0.35; }

/* ── MAP AREA ── */
.map-area { flex: 1; position: relative; min-height: 0; min-width: 0; }

.map-loading-overlay {
  position: absolute; inset: 0; background: rgba(255,255,255,0.82);
  backdrop-filter: blur(2px); display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px; z-index: 20;
  font-size: 0.9rem; color: var(--text-muted);
}
.page-root[data-theme="dark"] .map-loading-overlay { background: rgba(15,17,23,0.82); }
.loader-ring {
  width: 36px; height: 36px; border: 3px solid var(--border-main);
  border-top-color: #6366f1; border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.error-icon { font-size: 2rem; color: #ef4444; }

/* ── LEGEND ── */
.map-legend-card {
  position: absolute; top: 16px; right: 16px;
  background: var(--bg-card); border: 1px solid var(--border-main);
  border-radius: 10px; padding: 12px 14px; z-index: 10; min-width: 160px;
  box-shadow: 0 4px 16px var(--shadow-color);
  transition: background 0.3s, border-color 0.3s;
}
.legend-row { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: var(--text-muted); margin-bottom: 6px; }
.legend-row:last-child { margin-bottom: 0; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.legend-divider { border-top: 1px solid var(--border-main); margin: 8px 0; }

/* Tombol toggle & tombol tutup legend: disembunyikan di desktop, hanya
   dipakai di mobile (lihat media query di bawah) */
.legend-toggle-btn {
  display: none;
  position: absolute; top: 16px; right: 16px; z-index: 15;
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--bg-card); border: 1px solid var(--border-main);
  color: #6366f1; align-items: center; justify-content: center;
  font-size: 1rem; cursor: pointer; box-shadow: 0 4px 12px var(--shadow-color);
}

/* ── MODAL ── */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(3px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal-card { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 14px; width: 100%; max-width: 430px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden; }

.modal-header-strip { padding: 20px; position: relative; border-bottom: 1px solid var(--border-main); }
.modal-header-strip.status-planned { border-top: 3px solid #f59e0b; }
.modal-header-strip.status-ongoing { border-top: 3px solid #6366f1; }
.modal-header-strip.status-done    { border-top: 3px solid #22c55e; }
.modal-header-strip.status-unknown { border-top: 3px solid #94a3b8; }

.modal-close { position: absolute; top: 12px; right: 12px; background: var(--bg-input); border: 1px solid var(--border-main); color: var(--text-muted); width: 30px; height: 30px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.modal-close:hover { border-color: #ef4444; color: #ef4444; }

.modal-hero-row { display: flex; align-items: center; gap: 14px; }
.modal-avatar-wrap { position: relative; flex-shrink: 0; }
.modal-avatar { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-main); display: block; }
.modal-avatar-ring { position: absolute; inset: -4px; border-radius: 50%; border: 2px solid transparent; }
.modal-avatar-ring.status-planned { border-color: #f59e0b; }
.modal-avatar-ring.status-ongoing { border-color: #6366f1; }
.modal-avatar-ring.status-done    { border-color: #22c55e; }

.modal-sales-name { font-size: 1rem; font-weight: 800; color: var(--text-primary); }
.modal-status-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 0.72rem; font-weight: 700; padding: 3px 10px; border-radius: 20px; margin-top: 6px; }

.modal-body { padding: 16px 20px; max-height: 60vh; overflow-y: auto; }
.modal-body::-webkit-scrollbar { width: 4px; }
.modal-body::-webkit-scrollbar-thumb { background: var(--border-main); border-radius: 4px; }

.detail-list { display: flex; flex-direction: column; }
.detail-row { display: flex; align-items: flex-start; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-main); gap: 12px; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); white-space: nowrap; flex-shrink: 0; }
.detail-value { font-size: 0.84rem; color: var(--text-primary); text-align: right; }
.mono { font-family: monospace; font-weight: 700; color: #6366f1; font-size: 0.8rem; }
.detail-link { color: #6366f1; text-decoration: none; font-weight: 600; }
.detail-link:hover { text-decoration: underline; }

.modal-section-title { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin: 16px 0 10px; }
.modal-timeline { display: flex; align-items: center; margin-bottom: 14px; }
.timeline-item { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; }
.timeline-line { flex: 1; height: 2px; background: var(--border-main); margin-bottom: 28px; }
.timeline-dot  { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
.dot-plan    { background: #f59e0b; box-shadow: 0 0 6px rgba(245,158,11,0.4); }
.dot-checkin { background: #6366f1; box-shadow: 0 0 6px rgba(99,102,241,0.4); }
.dot-checkout{ background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.4); }
.dot-empty   { background: var(--border-main); }
.timeline-content { text-align: center; }
.timeline-label { font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.timeline-time  { font-size: 0.75rem; color: var(--text-primary); margin-top: 2px; font-family: monospace; }

.duration-card { display: flex; align-items: center; gap: 8px; background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.15); border-radius: 8px; padding: 8px 12px; font-size: 0.84rem; color: var(--text-muted); }
.duration-card svg { color: #6366f1; }
.duration-card strong { color: var(--text-primary); }

/* BARU: foto kunjungan, alert komplain/potensi order, file check-out */
.visit-photo-link { display: block; border-radius: 10px; overflow: hidden; border: 1px solid var(--border-main); margin-bottom: 14px; }
.visit-photo-img { width: 100%; max-height: 220px; object-fit: cover; display: block; }

.alert-box { display: flex; align-items: flex-start; gap: 10px; border-radius: 10px; padding: 10px 12px; font-size: 0.82rem; margin-bottom: 12px; }
.alert-box svg { margin-top: 2px; flex-shrink: 0; }
.alert-box strong { display: block; margin-bottom: 2px; }
.alert-box p { margin: 0; color: var(--text-muted); }

/* BARU: konten hasil render HTML dari editor Tiptap (notes, complaint_detail,
   potential_order_detail) — reset margin bawaan <p>/<ul>/<ol> supaya rapi
   di dalam kartu/detail-row yang sempit. */
.rich-text { line-height: 1.5; }
.rich-text :deep(p) { margin: 0 0 6px; }
.rich-text :deep(p:last-child) { margin-bottom: 0; }
.rich-text :deep(ul),
.rich-text :deep(ol) { margin: 0 0 6px; padding-left: 18px; }
.rich-text :deep(strong) { color: var(--text-primary); }
.rich-text :deep(a) { color: #6366f1; }
.alert-danger { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #ef4444; }
.alert-danger svg { color: #ef4444; }
.alert-success { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); color: #16a34a; }
.alert-success svg { color: #16a34a; }

.checkout-file-link {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.82rem; font-weight: 600; color: #6366f1;
  text-decoration: none; margin-top: 4px;
}
.checkout-file-link:hover { text-decoration: underline; }

/* BARU: kartu jadwal & catatan kunjungan selanjutnya (follow up) */
.next-visit-card {
  background: rgba(99,102,241,0.05); border: 1px solid rgba(99,102,241,0.15);
  border-radius: 10px; padding: 12px; margin-bottom: 12px;
}
.next-visit-row { display: flex; align-items: flex-start; gap: 10px; }
.next-visit-row svg { color: #6366f1; margin-top: 2px; flex-shrink: 0; }
.next-visit-date { font-size: 0.88rem; font-weight: 700; color: var(--text-primary); }
.next-visit-type { font-size: 0.74rem; color: var(--text-muted); margin-top: 1px; }
.next-visit-notes { font-size: 0.82rem; color: var(--text-muted); margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border-main); }

.modal-footer-btns { display: flex; gap: 10px; padding: 14px 20px; border-top: 1px solid var(--border-main); }
.btn-cancel { padding: 8px 18px; background: var(--bg-input); color: var(--text-muted); border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { background: var(--border-main); color: var(--text-primary); }

.modal-fade-enter-active, .modal-fade-leave-active { transition: all 0.25s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: scale(0.97); }

@keyframes spin { to { transform: rotate(360deg); } }

/* ══════════════════════════════════════════
   RESPONSIVE / MOBILE FRIENDLY
   Konsepnya SAMA seperti layar lebar: toolbar di
   atas, sidebar + peta tetap berdampingan (row),
   legend tetap kartu pojok kanan atas. Yang
   disesuaikan cuma ukuran & default state supaya
   peta tidak tertutup: sidebar default collapsed
   (sama seperti tombol collapse di desktop) dan
   legend default disembunyikan di balik tombol
   toggle kecil.
══════════════════════════════════════════ */
@media (max-width: 768px) {
  .page-root .h-100 { padding: 10px; gap: 8px; }

  .breadcrumb-card { padding: 12px 14px; }
  .breadcrumb-title { font-size: 1rem; }

  /* Toolbar: PENTING — jangan pakai overflow-x:auto di sini. Container dengan
     overflow-x auto otomatis meng-clip dropdown (.drop-menu) yang posisinya
     absolute di bawah tombol, jadi menu Date/Sales/Status/Type jadi
     kepotong & terlihat "tidak berfungsi" walau tombolnya tetap ke-klik.
     Solusinya: biarkan wrap (turun baris), bukan discroll. */
  .toolbar-content { padding: 10px; gap: 8px; }
  .toolbar-left { flex-wrap: wrap; width: 100%; }
  .btn-toolbar { padding: 7px 10px; font-size: 0.78rem; }
  .toolbar-right { width: 100%; justify-content: space-between; }
  .last-update { display: none; } /* hemat tempat, info live tetap ada di ikon rotate export */
  .drop-menu, .drop-wide { min-width: 0; width: calc(100vw - 40px); max-width: 320px; }
  .toolbar-collapse-handle span:last-child { font-size: 0.7rem; }

  /* Sidebar & peta TETAP berdampingan (row) seperti desktop — tidak ditumpuk.
     Sidebar cuma dibuat lebih ramping dan default collapsed supaya peta
     langsung dapat porsi layar yang besar. */
  .map-sidebar { width: 240px; }
  .map-sidebar.collapsed { width: 36px; }
  .sidebar-title { font-size: 0.8rem; }
  .sidebar-count { font-size: 0.74rem; }

  /* Legend: tetap kartu pojok kanan atas seperti desktop, hanya defaultnya
     disembunyikan di balik tombol bulat kecil supaya tidak menutupi peta. */
  .legend-toggle-btn { display: flex; width: 34px; height: 34px; font-size: 0.85rem; top: 10px; right: 10px; }
  .map-legend-card {
    display: none;
    top: 10px; right: 52px;
    min-width: 140px; max-width: 58vw;
    padding: 10px 12px;
  }
  .map-legend-card.legend-open { display: block; }
  .legend-row { font-size: 0.76rem; margin-bottom: 5px; }

  /* Modal detail: manfaatkan lebar layar penuh */
  .modal-overlay { padding: 12px; }
  .modal-card { max-width: 100%; max-height: 90vh; }
  .modal-body { max-height: 50vh; }
}
</style>