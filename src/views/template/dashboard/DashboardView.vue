<script setup>
import DonutChart from '@/components/charts/DonutChart.vue'
import LineChart  from '@/components/charts/LineChart.vue'
import BarChart   from '@/components/charts/BarChart.vue'
import AreaChart  from '@/components/charts/AreaChart.vue'

const stats = [
  { label: 'Total Leads',       value: '128',     icon: 'user',       color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  trend: '+12%', up: true },
  { label: 'Active Customers',  value: '64',      icon: 'users',      color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   trend: '+8%',  up: true },
  { label: 'Revenue',           value: 'Rp 48jt', icon: 'chart-line', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', trend: '+23%', up: true },
  { label: 'Follow-up Pending', value: '12',      icon: 'bell',       color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  trend: '-3%',  up: false },
]

const recentLeads = [
  { id: 1, name: 'Budi Santoso',  email: 'budi@mail.com', status: 'New',       statusClass: 'badge-new' },
  { id: 2, name: 'Siti Rahayu',   email: 'siti@mail.com', status: 'Contacted', statusClass: 'badge-contacted' },
  { id: 3, name: 'Andi Wijaya',   email: 'andi@mail.com', status: 'Qualified', statusClass: 'badge-qualified' },
  { id: 4, name: 'Dewi Kusuma',   email: 'dewi@mail.com', status: 'Lost',      statusClass: 'badge-lost' },
]

const pipeline = [
  { label: 'New Lead',    value: 80, color: '#6366f1', count: 42 },
  { label: 'Contacted',  value: 60, color: '#38bdf8', count: 31 },
  { label: 'Qualified',  value: 45, color: '#f59e0b', count: 23 },
  { label: 'Closed Won', value: 30, color: '#22c55e', count: 12 },
]

const activities = [
  { name: 'Budi Santoso',  action: 'ditambahkan sebagai lead baru',  time: '2 menit lalu',  icon: 'user-plus',  color: '#6366f1' },
  { name: 'Siti Rahayu',   action: 'status diubah ke Contacted',     time: '1 jam lalu',    icon: 'pen',        color: '#22c55e' },
  { name: 'Andi Wijaya',   action: 'berhasil di-qualify',            time: '3 jam lalu',    icon: 'check',      color: '#f59e0b' },
  { name: 'Dewi Kusuma',   action: 'ditandai sebagai Lost',          time: '5 jam lalu',    icon: 'xmark',      color: '#ef4444' },
]


// Donut: Status Lead
const donutLeads = {
  labels: ['New', 'Contacted', 'Qualified', 'Lost'],
  data:   [42, 31, 23, 12],
  colors: ['#6366f1', '#38bdf8', '#22c55e', '#ef4444'],
  total:  108,
  sub:    'Total Leads',
}

// Donut: Revenue Source  
const donutRevenue = {
  labels: ['Direct', 'Referral', 'Online', 'Partner'],
  data:   [45, 25, 20, 10],
  colors: ['#6366f1', '#f59e0b', '#22c55e', '#38bdf8'],
  total:  'Rp 48jt',
  sub:    'Total Revenue',
}

// Line: Leads per bulan
const lineData = {
  labels:   ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'],
  datasets: [
    { label: 'Leads',     data: [30,45,38,60,52,70,65,80,72,90,85,95], color: '#6366f1' },
    { label: 'Customers', data: [20,30,25,40,35,50,45,55,50,65,60,70], color: '#22c55e' },
  ]
}

// Bar: Revenue per kuartal
const barData = {
  labels:   ['Q1', 'Q2', 'Q3', 'Q4'],
  datasets: [
    { label: 'Target',   data: [40, 50, 60, 70], color: '#6366f1' },
    { label: 'Aktual',   data: [35, 48, 65, 58], color: '#22c55e' },
  ]
}

// Area: Konversi rate
const areaData = {
  labels: ['Sen','Sel','Rab','Kam','Jum','Sab'],
  data:   [65, 72, 68, 80, 75, 90],
  color:  '#f59e0b',
}
</script>

<template>
  <div class="dashboard">

    <!-- ===== STAT CARDS ===== -->
    <div class="stats-grid">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="stat-card"
      >
        <div class="stat-top">
          <div class="stat-icon" :style="{ background: stat.bg, color: stat.color }">
            <font-awesome-icon :icon="stat.icon" />
          </div>
          <span class="stat-trend" :class="stat.up ? 'trend-up' : 'trend-down'">
            <font-awesome-icon :icon="stat.up ? 'arrow-trend-up' : 'arrow-trend-down'" />
            {{ stat.trend }}
          </span>
        </div>
        <div class="stat-value">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
        <div class="stat-bar">
          <div class="stat-bar-fill" :style="{ background: stat.color, width: '65%' }" />
        </div>
      </div>
    </div>

    <!-- ===== ROW 2 ===== -->
    <div class="dash-grid">

      <!-- Recent Leads -->
      <div class="dash-card">
        <div class="card-header">
          <div class="card-title">
            <span class="card-title-icon" style="background: rgba(99,102,241,0.1); color: #6366f1;">
              <font-awesome-icon icon="user" />
            </span>
            Recent Leads
          </div>
          <button class="card-action">
            Lihat Semua
            <font-awesome-icon icon="arrow-right" />
          </button>
        </div>

        <div class="leads-table">
          <div class="leads-head">
            <span>Nama</span>
            <span>Email</span>
            <span>Status</span>
          </div>
          <div
            v-for="lead in recentLeads"
            :key="lead.id"
            class="leads-row"
          >
            <div class="lead-name">
              <div class="lead-avatar">{{ lead.name.charAt(0) }}</div>
              <span>{{ lead.name }}</span>
            </div>
            <span class="lead-email">{{ lead.email }}</span>
            <span class="status-badge" :class="lead.statusClass">{{ lead.status }}</span>
          </div>
        </div>
      </div>

      <!-- Pipeline -->
      <div class="dash-card">
        <div class="card-header">
          <div class="card-title">
            <span class="card-title-icon" style="background: rgba(245,158,11,0.1); color: #f59e0b;">
              <font-awesome-icon icon="chart-line" />
            </span>
            Pipeline Stage
          </div>
        </div>

        <div class="pipeline-list">
          <div v-for="stage in pipeline" :key="stage.label" class="pipeline-item">
            <div class="pipeline-info">
              <div class="pipeline-dot" :style="{ background: stage.color }" />
              <span class="pipeline-label">{{ stage.label }}</span>
              <span class="pipeline-count">{{ stage.count }}</span>
              <span class="pipeline-pct">{{ stage.value }}%</span>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{ width: stage.value + '%', background: stage.color }"
              />
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ===== ROW 3 ===== -->
    <div class="dash-grid-3">

      <!-- ===== CHART ROW ===== -->
      <div class="chart-grid">
    <!-- Line Chart -->
    <div class="dash-card chart-wide mb-2">
      <div class="card-header">
        <div class="card-title">
          <span class="card-title-icon" style="background:rgba(99,102,241,0.1);color:#6366f1">
            <font-awesome-icon icon="chart-line" />
          </span>
          Leads & Customers per Bulan
        </div>
        <div class="chart-period">
          <button class="period-btn active">2026</button>
          <button class="period-btn">2025</button>
        </div>
      </div>
      <LineChart :labels="lineData.labels" :datasets="lineData.datasets" />
    </div>

    <!-- Donut: Status -->
    <div class="dash-card">
      <div class="card-header">
        <div class="card-title">
          <span class="card-title-icon" style="background:rgba(99,102,241,0.1);color:#6366f1">
            <font-awesome-icon icon="chart-pie" />
          </span>
          Status Lead
        </div>
      </div>
      <DonutChart
        :labels="donutLeads.labels"
        :data="donutLeads.data"
        :colors="donutLeads.colors"
        :total="donutLeads.total"
        :subtitle="donutLeads.sub"
      />
    </div>
  </div>

<!-- ===== CHART ROW 2 ===== -->
<div class="chart-grid-3">

  <!-- Bar Chart -->
  <div class="dash-card chart-wide mb-2">
    <div class="card-header">
      <div class="card-title">
        <span class="card-title-icon" style="background:rgba(34,197,94,0.1);color:#22c55e">
          <font-awesome-icon icon="chart-bar" />
        </span>
        Revenue vs Target per Kuartal
      </div>
    </div>
    <BarChart :labels="barData.labels" :datasets="barData.datasets" />
  </div>

  <!-- Donut: Revenue -->
  <div class="dash-card mb-2">
    <div class="card-header">
      <div class="card-title">
        <span class="card-title-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b">
          <font-awesome-icon icon="chart-pie" />
        </span>
        Sumber Revenue
      </div>
    </div>
    <DonutChart
      :labels="donutRevenue.labels"
      :data="donutRevenue.data"
      :colors="donutRevenue.colors"
      :total="donutRevenue.total"
      :subtitle="donutRevenue.sub"
    />
  </div>

  <!-- Area Chart -->
  <div class="dash-card">
    <div class="card-header">
      <div class="card-title">
        <span class="card-title-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b">
          <font-awesome-icon icon="arrow-trend-up" />
        </span>
        Konversi Rate Minggu Ini
      </div>
    </div>
    <AreaChart
      :labels="areaData.labels"
      :data="areaData.data"
      :color="areaData.color"
    />
    <div class="area-footer">
      <div class="area-stat">
        <span class="area-stat-val" style="color:#f59e0b">75.8%</span>
        <span class="area-stat-label">Rata-rata</span>
      </div>
      <div class="area-stat">
        <span class="area-stat-val" style="color:#22c55e">90%</span>
        <span class="area-stat-label">Tertinggi</span>
      </div>
      <div class="area-stat">
        <span class="area-stat-val" style="color:#ef4444">65%</span>
        <span class="area-stat-label">Terendah</span>
      </div>
    </div>
  </div>

</div>




    </div>

  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ===== STATS GRID ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
@media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px)  { .stats-grid { grid-template-columns: 1fr; } }

.stat-card {
  background: var(--bg-card);
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 1px 3px var(--shadow-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: default;
}
.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px var(--shadow-color);
}
.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}
.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 99px;
}
.trend-up   { background: rgba(34,197,94,0.1);  color: #16a34a; }
.trend-down { background: rgba(239,68,68,0.1);  color: #dc2626; }
.stat-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
  margin-top: 4px;
}
.stat-label {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 500;
}
.stat-bar {
  height: 4px;
  background: var(--border-main);
  border-radius: 99px;
  overflow: hidden;
  margin-top: 4px;
}
.stat-bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.8s ease;
}

/* ===== DASH GRID ===== */
.dash-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
}
@media (max-width: 768px) { .dash-grid { grid-template-columns: 1fr; } }

.dash-grid-3 {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
}
@media (max-width: 768px) {
  .dash-grid-3 { grid-template-columns: 1fr; }
  .dash-grid-3 .dash-card[style*="span 2"] { grid-column: span 1; }
}

/* ===== CARD BASE ===== */
.dash-card {
  background: var(--bg-card);
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 1px 3px var(--shadow-color);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
}
.card-title-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}
.card-action {
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  color: #6366f1;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: gap 0.15s;
}
.card-action:hover { gap: 8px; }

/* ===== LEADS TABLE ===== */
.leads-head {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr;
  padding: 8px 12px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-muted);
  background: var(--bg-input);
  border-radius: 8px;
  margin-bottom: 4px;
}
.leads-row {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  transition: background 0.15s;
}
.leads-row:hover { background: var(--bg-nav-hover); }
.lead-name {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-primary);
}
.lead-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.lead-email {
  font-size: 0.8rem;
  color: var(--text-muted);
}
.status-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 99px;
  white-space: nowrap;
  display: inline-block;
}
.badge-new       { background: rgba(99,102,241,0.1); color: #6366f1; }
.badge-contacted { background: rgba(245,158,11,0.1); color: #d97706; }
.badge-qualified { background: rgba(34,197,94,0.1);  color: #16a34a; }
.badge-lost      { background: rgba(239,68,68,0.1);  color: #dc2626; }

/* ===== PIPELINE ===== */
.pipeline-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.pipeline-item { display: flex; flex-direction: column; gap: 6px; }
.pipeline-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pipeline-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.pipeline-label {
  flex: 1;
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-primary);
}
.pipeline-count {
  font-size: 0.78rem;
  color: var(--text-muted);
  background: var(--bg-input);
  padding: 2px 8px;
  border-radius: 99px;
}
.pipeline-pct {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted);
  min-width: 36px;
  text-align: right;
}
.progress-track {
  height: 7px;
  background: var(--border-main);
  border-radius: 99px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.8s ease;
}

/* ===== QUICK STATS ===== */
.quick-stats {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 20px;
  background: var(--bg-main);
  border-radius: 10px;
  overflow: hidden;
}
.qs-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  gap: 4px;
}
.qs-label {
  font-size: 0.68rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
}
.qs-value {
  font-size: 1rem;
  font-weight: 800;
}
.qs-divider {
  width: 1px;
  height: 36px;
  background: var(--border-main);
}

/* Mini Chart */
.mini-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 60px;
  margin-bottom: 6px;
}
.mini-bar {
  flex: 1;
  border-radius: 4px 4px 0 0;
  transition: height 0.6s ease;
  min-height: 4px;
}
.mini-chart-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: var(--text-muted);
}

/* ===== ACTIVITY ===== */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 10px;
  border-radius: 9px;
  transition: background 0.15s;
}
.activity-item:hover { background: var(--bg-nav-hover); }
.act-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  flex-shrink: 0;
}
.act-content { flex: 1; }
.act-text {
  font-size: 0.83rem;
  color: var(--text-primary);
  line-height: 1.4;
}
.act-text strong { font-weight: 700; }
.act-time {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 2px;
}
.act-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>