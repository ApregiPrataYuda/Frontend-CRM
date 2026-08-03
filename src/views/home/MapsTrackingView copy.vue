<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, markRaw } from 'vue'
import { useHomeFrontendStore } from '@/stores/homeFrontendStore'

// ── DARK MODE LOKAL ──
const isDark = ref(false)
const toggleTheme = () => { isDark.value = !isDark.value }

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

// ── UI STATE ──
const selectedVisit    = ref(null)
const sidebarCollapsed = ref(false)
const search           = ref('')
const selectedSalesId  = ref('')
const selectedStatus   = ref('')

const today    = new Date().toISOString().split('T')[0]
const dateFrom = ref(today)
const dateTo   = ref(today)

const showDateFilter   = ref(false)
const showSalesFilter  = ref(false)
const showStatusFilter = ref(false)

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
    return matchSearch && matchSales && matchStatus
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

// ── HELPERS ──
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
const formatTime = (dt) => {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
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
  search.value          = ''
  dateFrom.value        = today
  dateTo.value          = today
  showDateFilter.value  = false
  showSalesFilter.value = false
  showStatusFilter.value = false
  await store.fetchMapData()
  lastUpdated.value = new Date().toLocaleTimeString('id-ID')
}

// ── LIFECYCLE ──
onMounted(async () => {
  await store.fetchMapData()
  lastUpdated.value = new Date().toLocaleTimeString('id-ID')
  initGoogleMaps()
  startPolling()
})
onUnmounted(() => stopPolling())

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
        <span style="font-size:8px;font-weight:700;padding:1px 4px;border-radius:3px;flex-shrink:0;background:${visit.target_type === 'LEAD' ? 'rgba(99,102,241,0.1)' : 'rgba(34,197,94,0.1)'};color:${visit.target_type === 'LEAD' ? '#6366f1' : '#16a34a'};border:1px solid ${visit.target_type === 'LEAD' ? '#6366f144' : '#16a34a44'};">${visit.target_type}</span>
        ${visit.sales_name.split(' ')[0]}
      </div>
      <div style="margin-top:2px;background:rgba(255,255,255,0.9);color:#64748b;font-size:9px;padding:1px 6px;border-radius:8px;white-space:nowrap;max-width:130px;overflow:hidden;text-overflow:ellipsis;text-align:center;">${visit.target_name}</div>
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

// Watch filter — trigger langsung saat selectedSalesId, selectedStatus, atau search berubah
watch([selectedSalesId, selectedStatus, search], () => {
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
    await store.fetchMapData()
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
    <div class="toolbar-top">
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

      </div>

      <button class="btn-toolbar btn-orange" @click="handleReset">
        <font-awesome-icon icon="rotate-left" /> Reset
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
                  <span class="type-badge" :class="visit.target_type === 'LEAD' ? 'badge-lead' : 'badge-customer'">
                    {{ visit.target_type }}
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
          <button class="btn-toolbar btn-purple" @click="store.fetchMapData()">
            <font-awesome-icon icon="rotate-right" /> Try Again
          </button>
        </div>

        <div class="map-legend-card">
          <div class="drop-label">Status</div>
          <div v-for="l in legends" :key="l.label" class="legend-row">
            <span class="legend-dot" :style="{ background: l.color }"></span>
            {{ l.label }}
          </div>
          <div class="legend-divider"></div>
          <div class="drop-label">Type</div>
          <div class="legend-row"><span class="type-badge badge-lead">LEAD</span></div>
          <div class="legend-row"><span class="type-badge badge-customer">CUSTOMER</span></div>
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
              <div class="detail-row">
                <span class="detail-label">Target</span>
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
                  <span class="type-badge" :class="selectedVisit.target_type === 'LEAD' ? 'badge-lead' : 'badge-customer'">
                    {{ selectedVisit.target_type }}
                  </span>
                  <span class="detail-value">{{ selectedVisit.target_name }}</span>
                </div>
              </div>
              <div class="detail-row" v-if="selectedVisit.target_contact">
                <span class="detail-label">Contact</span>
                <span class="detail-value">{{ selectedVisit.target_contact }}</span>
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
  display: flex; align-items: center; justify-content: space-between;
  background: var(--bg-card); border: 1px solid var(--border-main);
  border-radius: 10px; padding: 12px 16px;
  box-shadow: 0 1px 3px var(--shadow-color); flex-wrap: wrap; gap: 8px;
  transition: background 0.3s, border-color 0.3s; flex-shrink: 0;
}
.toolbar-left  { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.toolbar-right { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

.btn-toolbar { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: none; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; transition: all 0.18s ease; white-space: nowrap; }
.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover { background: #4f46e5; }
.btn-green  { background: #22c55e; color: #fff; }
.btn-green:hover { background: #16a34a; }
.btn-green:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-orange { background: #f59e0b; color: #fff; }
.btn-orange:hover { background: #d97706; }
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
  transition: width 0.3s ease, background 0.3s;
  flex-shrink: 0; overflow: hidden; min-height: 0;
}
.map-sidebar.collapsed { width: 48px; }

.sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 12px; border-bottom: 1px solid var(--border-main); min-height: 52px; flex-shrink: 0; }
.sidebar-title { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px; white-space: nowrap; }
.sidebar-count { color: #6366f1; font-style: normal; font-size: 0.8rem; background: rgba(99,102,241,0.1); padding: 1px 8px; border-radius: 20px; }
.collapse-btn { background: var(--bg-input); border: 1px solid var(--border-main); color: var(--text-muted); width: 28px; height: 28px; border-radius: 7px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; font-size: 0.75rem; }
.collapse-btn:hover { border-color: #6366f1; color: #6366f1; }

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

.modal-footer-btns { display: flex; gap: 10px; padding: 14px 20px; border-top: 1px solid var(--border-main); }
.btn-cancel { padding: 8px 18px; background: var(--bg-input); color: var(--text-muted); border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { background: var(--border-main); color: var(--text-primary); }

.modal-fade-enter-active, .modal-fade-leave-active { transition: all 0.25s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: scale(0.97); }

@keyframes spin { to { transform: rotate(360deg); } }
</style>