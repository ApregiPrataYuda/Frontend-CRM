<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useDashboardStore } from '@/stores/dashboardHomeStore'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)
const dashboardStore = useDashboardStore()

const selectedMonth = ref(
  `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
)

const lastUpdated = ref('--:--')
const visitChartRef = ref(null)
let visitChart = null

// ── COMPUTED PROPERTIES ──
const summaryCards = computed(() => [
  {
    title: 'Leads Baru',
    value: dashboardStore.summary.total_leads ?? 0,
    color: 'primary',
    icon: 'user-plus'
  },
  {
    title: 'Customer Baru',
    value: dashboardStore.summary.total_customers ?? 0,
    color: 'info',
    icon: 'users'
  },
  {
    title: 'Visit Hari Ini',
    value: dashboardStore.summary.visits_today ?? 0,
    color: 'danger',
    icon: 'location-dot'
  },
  {
    title: 'Total Visit',
    value: dashboardStore.summary.visits_this_month ?? 0,
    color: 'success',
    icon: 'calendar-check',
    sub:
      dashboardStore.summary.visit_growth > 0
        ? `▲ ${dashboardStore.summary.visit_growth}% bulan lalu`
        : null
  },
  {
    title: 'Sales Aktif',
    value: dashboardStore.summary.active_sales_today ?? 0,
    color: 'warning',
    icon: 'briefcase'
  }
])

const topSales = computed(() =>
  (dashboardStore.topSales || []).map(item => ({
    id: item.sales_id,
    name: item.sales_name,
    total: item.total_visits,
    progress: Number(item.completion_rate),
    photo: item.sales_photo_url
  }))
)

const activities = computed(() =>
  (dashboardStore.recentActivity || []).map(item => ({
    id: item.id,
    name: item.sales_name,
    company: item.company_name,
    photo: item.sales_photo_url,
    status: item.visit_progress
  }))
)

const conversion = computed(() => dashboardStore.conversion || {})
const visitStatus = computed(() => dashboardStore.visitStatus || {})

// ── RENDER CHART (BAR STYLE & API INTEGRATED) ──
const renderVisitChart = () => {
  if (!visitChartRef.value) return

  if (visitChart) {
    visitChart.destroy()
  }

  // Ambil data dari state visitChart di Pinia Store
  // Kita beri proteksi Array.isArray untuk memastikan tipenya aman saat di-map
  const rawData = dashboardStore.visitChart
  const apiData = Array.isArray(rawData) ? rawData : (rawData?.data || [])
  
  // Map data API menjadi array untuk Chart.js
  const chartLabels = apiData.map(item => item.label_tanggal || '') 
  const chartValues = apiData.map(item => item.total || 0)        

  visitChart = new Chart(visitChartRef.value, {
    type: 'bar', 
    data: {
      labels: chartLabels, 
      datasets: [
        {
          label: 'Total Visit',
          data: chartValues, 
          backgroundColor: 'rgba(115, 103, 240, 0.8)', 
          borderColor: '#7367f0',
          borderWidth: 1,
          borderRadius: 4 
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  })
}

// ── LOAD DATA DASHBOARD ──
const loadDashboard = async () => {
  try {
    // Memanggil fungsi gabungan yang sudah menangani semua hit API beserta periodenya
    await dashboardStore.fetchAllDashboard(selectedMonth.value, 'month')

    lastUpdated.value = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })

    // Panggil render chart setelah data siap dan DOM selesai diupdate
    nextTick(() => {
      renderVisitChart()
    })
  } catch (err) {
    console.error('Gagal memuat data dashboard:', err)
  }
}

// ── LIFECYCLE & WATCHERS ──
onMounted(() => {
  loadDashboard()
})

watch(selectedMonth, () => {
  loadDashboard()
})
</script>


<template>
  <div class="dashboard-page">

    <CCard class="dashboard-header mb-4">
      <CCardBody class="d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h4 class="fw-bold mb-1">Dashboard Sales</h4>
          <p class="text-medium-emphasis mb-0">
            Ringkasan performa sales dan kunjungan
          </p>
        </div>

        <div class="d-flex gap-3 align-items-center">
          <input
            type="month"
            v-model="selectedMonth"
            class="form-control"
            style="width:180px"
          />

          <CBadge color="success" shape="rounded-pill">
            Updated {{ lastUpdated }}
          </CBadge>
        </div>
      </CCardBody>
    </CCard>

    <CRow class="g-4 mb-4">
      <CCol
        v-for="card in summaryCards"
        :key="card.title"
        md="6"
        xl
      >
        <CCard class="stat-card border-0">
          <CCardBody>

            <div
              class="stat-icon"
              :class="'bg-' + card.color + '-subtle'"
            >
              <font-awesome-icon
                :icon="card.icon"
                class="stat-fa-icon"
              />
            </div>

            <div class="stat-label">
              {{ card.title }}
            </div>

            <div
              class="stat-value"
              :class="'text-' + card.color"
            >
              {{ card.value }}
            </div>

            <small
              v-if="card.sub"
              class="text-success fw-semibold"
            >
              {{ card.sub }}
            </small>

          </CCardBody>
        </CCard>
      </CCol>
    </CRow>

    <CRow class="g-4 mb-4">

      <CCol lg="8">
        <CCard class="modern-card">
          <CCardBody>

            <div class="section-header">
              <div>
                <h6 class="fw-bold mb-1">
                  Grafik Kunjungan
                </h6>
                <span class="text-medium-emphasis">
                  Tren visit bulanan
                </span>
              </div>
            </div>

            <div class="chart-container">
              <canvas ref="visitChartRef"></canvas>
            </div>

          </CCardBody>
        </CCard>
      </CCol>

      <CCol lg="4">
        <CCard class="modern-card h-100">
          <CCardBody>
            <div class="section-header mb-4">
              <div>
                <h6 class="fw-bold mb-1">
                  Status Kunjungan
                </h6>
                <span class="text-medium-emphasis">
                  Rekap visit bulan ini
                </span>
              </div>
            </div>

            <div class="status-circle mb-4">
              {{ visitStatus.total_visits ?? 0 }}
            </div>

            <div class="mt-4">
              <div class="status-row">
                <span class="text-medium-emphasis">Selesai (Done)</span>
                <strong class="text-success">{{ visitStatus.done ?? 0 }}</strong>
              </div>
              <div class="status-row">
                <span class="text-medium-emphasis">Tertunda (Pending)</span>
                <strong class="text-warning">{{ visitStatus.pending ?? 0 }}</strong>
              </div>
              <div class="status-row">
                <span class="text-medium-emphasis">Dibatalkan (Canceled)</span>
                <strong class="text-danger">{{ visitStatus.canceled ?? 0 }}</strong>
              </div>
            </div>

          </CCardBody>
        </CCard>
      </CCol>

    </CRow>

    <CRow class="g-4">

      <CCol lg="4">
        <CCard class="modern-card h-100">
          <CCardBody>

            <h6 class="fw-bold mb-4">
              Top Sales
            </h6>

            <div
              v-for="sales in topSales"
              :key="sales.id"
              class="sales-item"
            >
              <img
                :src="sales.photo"
                class="avatar"
              >

              <div class="flex-grow-1">
                <div class="fw-semibold">
                  {{ sales.name }}
                </div>

                <CProgress
                  :value="sales.progress"
                  :height="6"
                  class="mt-2"
                />
              </div>

              <strong>
                {{ sales.total }}
              </strong>
            </div>

          </CCardBody>
        </CCard>
      </CCol>

      <CCol lg="4">
        <CCard class="modern-card h-100">
          <CCardBody class="text-center">

            <h6 class="fw-bold">
              Conversion Rate
            </h6>

            <div class="conversion-rate">
              {{ conversion.conversion_rate ?? 0 }}%
            </div>

            <div class="row mt-4">
              <div class="col">
                <h5>
                  {{ conversion.total_leads ?? 0 }}
                </h5>
                <small>Total Lead</small>
              </div>

              <div class="col">
                <h5 class="text-primary">
                  {{ conversion.total_converted ?? 0 }}
                </h5>
                <small>Converted</small>
              </div>
            </div>

          </CCardBody>
        </CCard>
      </CCol>

      <CCol lg="4">
        <CCard class="modern-card h-100">
          <CCardBody>

            <h6 class="fw-bold mb-4">
              Aktivitas Terbaru
            </h6>

            <div
              v-for="item in activities"
              :key="item.id"
              class="activity-item"
            >
              <img
                :src="item.photo"
                class="avatar"
              >

              <div>
                <div class="fw-semibold">
                  {{ item.name }}
                </div>

                <small class="text-medium-emphasis">
                  {{ item.company }}
                </small>
              </div>

              <CBadge
                :color="item.status === 'DONE' ? 'success' : 'warning'"
                class="ms-auto"
              >
                {{ item.status }}
              </CBadge>
            </div>

          </CCardBody>
        </CCard>
      </CCol>

    </CRow>
  </div>
</template>

<style scoped>

.dashboard-page{
  padding:24px;
}

.dashboard-header{
  border:none;
  border-radius:20px;
  box-shadow:0 4px 24px rgba(15,23,42,.06);
}

.modern-card{
  border:none;
  border-radius:20px;
  box-shadow:0 4px 24px rgba(15,23,42,.08);
}

.stat-card{
  border-radius:20px;
  transition:.3s;
  box-shadow:0 4px 24px rgba(15,23,42,.08);
}

.stat-card:hover{
  transform:translateY(-4px);
}

.stat-icon{
  width:56px;
  height:56px;
  border-radius:16px;
  display:flex;
  align-items:center;
  justify-content:center;
  margin-bottom:12px;
}

.stat-fa-icon{
  font-size:24px;
}

.bg-primary-subtle .stat-fa-icon{
  color:var(--cui-primary);
}

.bg-info-subtle .stat-fa-icon{
  color:var(--cui-info);
}

.bg-success-subtle .stat-fa-icon{
  color:var(--cui-success);
}

.bg-warning-subtle .stat-fa-icon{
  color:var(--cui-warning);
}

.bg-danger-subtle .stat-fa-icon{
  color:var(--cui-danger);
}

.stat-label{
  color:#64748b;
  font-size:13px;
}

.stat-value{
  font-size:28px;
  font-weight:700;
}

.chart-placeholder{
  height:320px;
  border-radius:16px;
  background:#f8fafc;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:700;
  color:#64748b;
}

.status-circle{
  width:180px;
  height:180px;
  margin:auto;
  border-radius:50%;
  background:linear-gradient(
    135deg,
    #5856d6,
    #7367f0
  );
  color:white;
  font-size:36px;
  font-weight:700;
  display:flex;
  align-items:center;
  justify-content:center;
}

.status-row{
  display:flex;
  justify-content:space-between;
  margin-bottom:12px;
}

.sales-item{
  display:flex;
  align-items:center;
  gap:12px;
  margin-bottom:18px;
}

.avatar{
  width:42px;
  height:42px;
  border-radius:50%;
  object-fit:cover;
}

.conversion-rate{
  font-size:64px;
  font-weight:800;
  color:#7367f0;
}

.activity-item{
  display:flex;
  align-items:center;
  gap:12px;
  margin-bottom:18px;
}


.chart-container {
  position: relative;
  height: 300px; /* Atur tinggi chart sesuai keinginan */
  width: 100%;
}

@media(max-width:768px){

  .dashboard-page{
    padding:16px;
  }

  .conversion-rate{
    font-size:48px;
  }

  .status-circle{
    width:150px;
    height:150px;
    font-size:28px;
  }

}
</style>