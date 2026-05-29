<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import DonutChart from '@/components/charts/DonutChart.vue'
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import AreaChart from '@/components/charts/AreaChart.vue'

import { useDashboardStore } from '@/stores/dashboardStore'

const dashboardStore = useDashboardStore()
const { dashboard, loading } = storeToRefs(dashboardStore)

onMounted(() => {
  dashboardStore.fetchDashboard()
})

/*
|--------------------------------------------------------------------------
| STATS
|--------------------------------------------------------------------------
*/
const stats = computed(() => {
  if (!dashboard.value) return []

  return [
    {
      label: 'Total Users',
      value: dashboard.value.users?.total || 0,
      icon: 'users',
      color: '#6366f1',
      bg: 'rgba(99,102,241,0.12)',
      trend: `+${dashboard.value.users?.new_this_month || 0}`,
      up: true,
      percentage: '100%' // Total acuan
    },
    {
      label: 'Active Users',
      value: dashboard.value.users?.active || 0,
      icon: 'user-check',
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.12)',
      trend: `${dashboard.value.users?.active_today || 0} today`,
      up: true,
      // Menghitung persentase user aktif secara dinamis
      percentage: dashboard.value.users?.total ? `${(dashboard.value.users.active / dashboard.value.users.total) * 100}%` : '0%'
    },
    {
      label: 'Employees',
      value: dashboard.value.employees?.total || 0,
      icon: 'id-card',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      trend: 'Employee',
      up: true,
      percentage: '100%'
    },
    {
      label: 'Storage Used',
      value: dashboard.value.storage?.used || '0B',
      icon: 'database',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.12)',
      trend: `${dashboard.value.storage?.used_percent || 0}%`,
      up: false,
      percentage: `${dashboard.value.storage?.used_percent || 0}%` // Dinamis sesuai kapasitas storage
    },
  ]
})

/*
|--------------------------------------------------------------------------
| USER ROLE DONUT
|--------------------------------------------------------------------------
*/
const donutLeads = computed(() => {
  if (!dashboard.value?.users?.per_role) {
    return { labels: [], data: [], colors: [], total: 0, sub: '' }
  }

  return {
    labels: dashboard.value.users.per_role.map(item => item.role),
    data: dashboard.value.users.per_role.map(item => item.total),
    colors: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#38bdf8'],
    total: dashboard.value.users.total || 0,
    sub: 'Users by Role',
  }
})

/*
|--------------------------------------------------------------------------
| USER GROWTH LINE
|--------------------------------------------------------------------------
*/
const lineData = computed(() => {
  if (!dashboard.value?.users) {
    return { labels: [], datasets: [] }
  }

  return {
    labels: dashboard.value.users.growth_labels || [],
    datasets: [
      {
        label: 'Users',
        data: dashboard.value.users.growth_data || [],
        color: '#6366f1',
      },
    ],
  }
})

/*
|--------------------------------------------------------------------------
| LOGIN ACTIVITY
|--------------------------------------------------------------------------
*/
const areaData = computed(() => {
  if (!dashboard.value?.login_activity) {
    return { labels: [], data: [], color: '#22c55e' }
  }

  return {
    labels: dashboard.value.login_activity.labels || [],
    data: dashboard.value.login_activity.data || [],
    color: '#22c55e',
  }
})

// Menghitung total login dengan aman
const totalLogins = computed(() => {
  return areaData.value.data.reduce((a, b) => a + b, 0)
})

/*
|--------------------------------------------------------------------------
| STORAGE BAR
|--------------------------------------------------------------------------
*/
const barData = computed(() => {
  if (!dashboard.value?.storage) {
    return { labels: [], datasets: [] }
  }

  const usedPercent = dashboard.value.storage.used_percent || 0

  return {
    labels: ['Storage'],
    datasets: [
      {
        label: 'Used',
        data: [usedPercent],
        color: '#ef4444',
      },
      {
        label: 'Free',
        data: [100 - usedPercent],
        color: '#22c55e',
      },
    ],
  }
})

/*
|--------------------------------------------------------------------------
| PIPELINE FROM ROLE
|--------------------------------------------------------------------------
*/
const pipeline = computed(() => {
  if (!dashboard.value?.users?.per_role) return []

  return dashboard.value.users.per_role.map((item, index) => ({
    label: item.role,
    value: (item.total || 0) * 10,
    count: item.total || 0,
    color: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444'][index % 4],
  }))
})
</script>

<template>
  <div v-if="loading || !dashboard" class="loading-state">
    <div class="spinner"></div>
    <p>Loading dashboard data...</p>
  </div>

  <div v-else class="dashboard">
    <div>
      <h1 class="page-title">Welcome Back, Administrator 👋</h1>
      <p class="page-subtitle">Manage your application full access.</p>
    </div>

    <div class="stats-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat-card">
        <div class="stat-top">
          <div class="stat-icon" :style="{ background: stat.bg, color: stat.color }">
            <font-awesome-icon :icon="stat.icon" />
          </div>
          <span class="stat-trend" :class="stat.up ? 'trend-up' : 'trend-down'">
            {{ stat.trend }}
          </span>
        </div>

        <div class="stat-value">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>

        <div class="stat-bar">
          <div class="stat-bar-fill" :style="{ background: stat.color, width: stat.percentage }" />
        </div>
      </div>
    </div>

    <div class="dash-grid">
      <div class="dash-card">
        <div class="card-header">
          <div class="card-title">
            <span class="card-title-icon" style="background:rgba(99,102,241,0.1);color:#6366f1">
              <font-awesome-icon icon="users" />
            </span>
            User Roles
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
              <div class="progress-fill" :style="{ width: stage.value + '%', background: stage.color }" />
            </div>
          </div>
        </div>
      </div>

      <div class="dash-card">
        <div class="card-header">
          <div class="card-title">
            <span class="card-title-icon" style="background:rgba(239,68,68,0.1);color:#ef4444">
              <font-awesome-icon icon="database" />
            </span>
            Storage Information
          </div>
        </div>

        <div class="quick-stats">
          <div class="qs-item">
            <span class="qs-label">Total</span>
            <span class="qs-value">{{ dashboard.storage?.total }}</span>
          </div>
          <div class="qs-divider" />
          <div class="qs-item">
            <span class="qs-label">Used</span>
            <span class="qs-value" style="color:#ef4444">{{ dashboard.storage?.used }}</span>
          </div>
          <div class="qs-divider" />
          <div class="qs-item">
            <span class="qs-label">Free</span>
            <span class="qs-value" style="color:#22c55e">{{ dashboard.storage?.free }}</span>
          </div>
        </div>

        <BarChart :labels="barData.labels" :datasets="barData.datasets" />

        <div class="area-footer mt-4">
          <div class="area-stat">
            <span class="area-stat-val" style="color:#ef4444">
              {{ dashboard.storage?.used_percent }}%
            </span>
            <span class="area-stat-label">Used</span>
          </div>

          <div class="area-stat">
            <span class="area-stat-val" style="color:#22c55e">
              {{ 100 - (dashboard.storage?.used_percent || 0) }}%
            </span>
            <span class="area-stat-label">Free</span>
          </div>

          <div class="area-stat">
            <span class="area-stat-val" style="color:#6366f1">
              {{ dashboard.storage?.db_size }}
            </span>
            <span class="area-stat-label">DB Size</span>
          </div>
        </div>
      </div>
    </div>

    <div class="chart-grid">
      <div class="dash-card chart-wide">
        <div class="card-header">
          <div class="card-title">
            <span class="card-title-icon" style="background:rgba(99,102,241,0.1);color:#6366f1">
              <font-awesome-icon icon="chart-line" />
            </span>
            User Growth
          </div>
        </div>
        <LineChart :labels="lineData.labels" :datasets="lineData.datasets" />
      </div>

      <div class="dash-card">
        <div class="card-header">
          <div class="card-title">
            <span class="card-title-icon" style="background:rgba(99,102,241,0.1);color:#6366f1">
              <font-awesome-icon icon="chart-pie" />
            </span>
            User Distribution
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

    <div class="dash-card">
      <div class="card-header">
        <div class="card-title">
          <span class="card-title-icon" style="background:rgba(34,197,94,0.1);color:#22c55e">
            <font-awesome-icon icon="clock-rotate-left" />
          </span>
          Login Activity
        </div>
      </div>

      <AreaChart :labels="areaData.labels" :data="areaData.data" :color="areaData.color" />

      <div class="area-footer">
        <div class="area-stat">
          <span class="area-stat-val" style="color:#22c55e">{{ totalLogins }}</span>
          <span class="area-stat-label">Total Login</span>
        </div>

        <div class="area-stat">
          <span class="area-stat-val" style="color:#6366f1">
            {{ dashboard.login_activity?.labels?.length || 0 }}
          </span>
          <span class="area-stat-label">Active Days</span>
        </div>

        <div class="area-stat">
          <span class="area-stat-val" style="color:#f59e0b">
            {{ dashboard.users?.active || 0 }}
          </span>
          <span class="area-stat-label">Active Users</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== LOADING STATE (Baru & Lebih Sempurna) ===== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
  color: var(--text-muted);
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-main, #e2e8f0);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== DASHBOARD BASE ===== */
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
}
.page-subtitle {
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 0.95rem;
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
  background: var(--border-main, #e2e8f0);
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

.chart-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}
@media (max-width: 1024px) { .chart-grid { grid-template-columns: 1fr; } }

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
  background: var(--bg-input, #f8fafc);
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
  background: var(--border-main, #e2e8f0);
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
  margin-bottom: 20px;
  background: var(--bg-main, #f1f5f9);
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
}
.qs-value {
  font-size: 1rem;
  font-weight: 800;
}
.qs-divider {
  width: 1px;
  height: 36px;
  background: var(--border-main, #e2e8f0);
}

/* ===== FOOTER STATS ===== */
.area-footer {
  display: flex;
  justify-content: space-around;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-main, #e2e8f0);
}
.area-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.area-stat-val {
  font-size: 1.2rem;
  font-weight: 700;
}
.area-stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}
.mt-4 { margin-top: 1rem; }
</style>