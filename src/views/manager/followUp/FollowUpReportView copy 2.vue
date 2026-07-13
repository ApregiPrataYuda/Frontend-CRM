<template>
  <div class="followup-dashboard container-fluid py-4">

    <!-- ================= HEADER ================= -->

    <div class="d-flex justify-content-between align-items-center flex-wrap mb-4">

      <div>

        <h2 class="fw-bold mb-1">
          Follow Up Dashboard
        </h2>

        <p class="text-muted mb-0">
          Team Follow Up Monitoring
        </p>

      </div>

      <div class="d-flex gap-2">

        <button class="btn btn-light border">

          <i class="ti ti-calendar me-2"></i>

          {{ currentMonthLabel }}

        </button>

        <button
          class="btn btn-primary"
          :disabled="loading"
          @click="refresh">

          <i
            class="ti ti-refresh me-2"
            :class="{ 'spin-icon': loading }">
          </i>

          {{ loading ? 'Refreshing...' : 'Refresh' }}

        </button>

      </div>

    </div>

    <!-- ================= LOADING ================= -->

    <div
      v-if="loading && !hasData"
      class="sp-loading-wrap">

      <div class="spinner"></div>

      <span>
        Loading Follow Up Dashboard...
      </span>

    </div>

    <template v-else>

      <!-- ================= KPI ================= -->

      <div class="row g-4 mb-4">

        <!-- Total Follow Up -->

        <div class="col-xl col-lg-6 col-md-6">

          <div class="kpi-card bg-indigo">

            <div class="kpi-icon">

              <i class="fas fa-phone"></i>

            </div>

            <div class="flex-grow-1 ms-3">

              <small>Total Follow Up</small>

              <h2>

                {{ dashboard.summary?.total_follow_up ?? 0 }}

              </h2>

              <div class="kpi-footer">

                <i class="ti ti-trending-up me-1"></i>

                All Activities

              </div>

            </div>

          </div>

        </div>

        <!-- Pending -->

        <div class="col-xl col-lg-6 col-md-6">

          <div class="kpi-card bg-warning">

            <div class="kpi-icon">

              <i class="ti ti-clock-hour-4"></i>

            </div>

            <div class="flex-grow-1 ms-3">

              <small>Pending</small>

              <h2>

                {{ dashboard.summary?.pending ?? 0 }}

              </h2>

              <div class="kpi-footer">

                {{ pendingRate }}%

                Pending

              </div>

            </div>

          </div>

        </div>

        <!-- Done -->

        <div class="col-xl col-lg-6 col-md-6">

          <div class="kpi-card bg-success">

            <div class="kpi-icon">

              <i class="ti ti-circle-check"></i>

            </div>

            <div class="flex-grow-1 ms-3">

              <small>Completed</small>

              <h2>

                {{ dashboard.summary?.done ?? 0 }}

              </h2>

              <div class="kpi-footer">

                {{ completionRate }}%

                Completed

              </div>

            </div>

          </div>

        </div>

        <!-- Overdue -->

        <div class="col-xl col-lg-6 col-md-6">

          <div class="kpi-card bg-danger">

            <div class="kpi-icon">

              <i class="ti ti-alert-circle"></i>

            </div>

            <div class="flex-grow-1 ms-3">

              <small>Overdue</small>

              <h2>

                {{ dashboard.summary?.overdue ?? 0 }}

              </h2>

              <div class="kpi-footer">

                {{ overdueRate }}%

                Need Attention

              </div>

            </div>

          </div>

        </div>

        <!-- Cancelled -->

        <div class="col-xl col-lg-6 col-md-6">

          <div class="kpi-card bg-secondary">

            <div class="kpi-icon">

              <i class="ti ti-circle-x"></i>

            </div>

            <div class="flex-grow-1 ms-3">

              <small>Cancelled</small>

              <h2>

                {{ dashboard.summary?.cancelled ?? 0 }}

              </h2>

              <div class="kpi-footer">

                {{ cancelledRate }}%

                Cancelled

              </div>

            </div>

          </div>

        </div>

      </div>

      <!-- ================= TOP PERFORMER + TEAM SUMMARY ================= -->

      <div class="row g-4 mb-4">

        <!-- TOP PERFORMER -->

        <div class="col-xl-5">

          <div class="card border-0 shadow-sm h-100">

            <div class="card-header bg-white">

              <h4 class="mb-0">

                🏆 Top Follow Up Performer

              </h4>

            </div>

            <div class="card-body">

              <div
                v-if="!bestSales"
                class="empty-state">

                No Top Performer

              </div>

              <template v-else>

                <div class="top-user">

                  <div class="avatar-xl">

                    <i class="ti ti-user"></i>

                  </div>

                  <h3 class="mt-3 mb-1">

                    {{ bestSales.fullname }}

                  </h3>

                  <p class="text-muted mb-4">

                    Best Sales Follow Up This Month

                  </p>

                  <div class="score-circle">

                    {{ bestSales.total_follow_up }}

                  </div>

                </div>

                <div class="row mt-4 text-center">

                  <div class="col">

                    <h4>

                      {{ bestSales.total_follow_up }}

                    </h4>

                    <small>

                      Follow Up

                    </small>

                  </div>

                  <div class="col">

                    <h4>

                      {{ dashboard.summary.pending }}

                    </h4>

                    <small>

                      Pending

                    </small>

                  </div>

                  <div class="col">

                    <h4>

                      {{ dashboard.summary.done }}

                    </h4>

                    <small>

                      Done

                    </small>

                  </div>

                </div>

              </template>

            </div>

          </div>

        </div>

        <!-- TEAM SUMMARY -->

        <div class="col-xl-7">

          <div class="card border-0 shadow-sm h-100">

            <div class="card-header bg-white">

              <h4 class="mb-0">

                Team Summary

              </h4>

            </div>

            <div class="card-body">

              <!-- Pending -->

              <div class="summary-item">

                <div>

                  Pending Follow Up

                </div>

                <strong>

                  {{ dashboard.summary.pending }}

                </strong>

              </div>

              <div class="progress mb-4">

                <div
                  class="progress-bar bg-warning"
                  :style="{ width: pendingRate + '%' }">
                </div>

              </div>

              <!-- Done -->

              <div class="summary-item">

                <div>

                  Completed

                </div>

                <strong>

                  {{ dashboard.summary.done }}

                </strong>

              </div>

              <div class="progress mb-4">

                <div
                  class="progress-bar bg-success"
                  :style="{ width: completionRate + '%' }">
                </div>

              </div>

              <!-- Overdue -->

              <div class="summary-item">

                <div>

                  Overdue

                </div>

                <strong>

                  {{ dashboard.summary.overdue }}

                </strong>

              </div>

              <div class="progress mb-4">

                <div
                  class="progress-bar bg-danger"
                  :style="{ width: overdueRate + '%' }">
                </div>

              </div>

              <!-- Cancelled -->

              <div class="summary-item">

                <div>

                  Cancelled

                </div>

                <strong>

                  {{ dashboard.summary.cancelled }}

                </strong>

              </div>

              <div class="progress mb-4">

                <div
                  class="progress-bar bg-secondary"
                  :style="{ width: cancelledRate + '%' }">
                </div>

              </div>

              <!-- Closed -->

              <div class="summary-item">

                <div>

                  Closed

                </div>

                <strong>

                  {{ dashboard.summary.closed }}

                </strong>

              </div>

              <div class="progress">

                <div
                  class="progress-bar bg-primary"
                  :style="{ width: closedRate + '%' }">
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

            <!-- ================= DAILY TREND ================= -->

      <div class="row g-4 mb-4">

        <!-- Daily Trend -->

        <div class="col-xl-8">

          <div class="card border-0 shadow-sm h-100">

            <div class="card-header bg-white d-flex justify-content-between align-items-center">

              <div>

                <h4 class="mb-1">

                  📈 Daily Follow Up Trend

                </h4>

                <small class="text-muted">

                  Daily Follow Up Activity

                </small>

              </div>

              <span class="badge bg-primary">

                {{ dashboard.daily_trend.length }}

                Days

              </span>

            </div>

            <div class="card-body">

              <div
                v-if="!dashboard.daily_trend.length"
                class="empty-state">

                <i class="ti ti-chart-line"></i>

                <h5 class="mt-3">

                  No Trend Available

                </h5>

              </div>

              <template v-else>

                <div class="chart-wrapper">

                  <canvas
                    ref="dailyTrendChart"
                    height="130">
                  </canvas>

                </div>

              </template>

            </div>

          </div>

        </div>

        <!-- Follow Up Status -->

        <div class="col-xl-4">

          <div class="card border-0 shadow-sm h-100">

            <div class="card-header bg-white">

              <h4 class="mb-0">

                📊 Follow Up Status

              </h4>

            </div>

            <div class="card-body">

              <div class="chart-wrapper">

                <canvas
                  ref="statusChart"
                  height="240">
                </canvas>

              </div>

              <div class="row mt-4">

                <div class="col-6 mb-3">

                  <div class="status-box">

                    <div class="status-dot bg-warning"></div>

                    <div>

                      <small>

                        Pending

                      </small>

                      <h5>

                        {{ dashboard.summary.pending }}

                      </h5>

                    </div>

                  </div>

                </div>

                <div class="col-6 mb-3">

                  <div class="status-box">

                    <div class="status-dot bg-success"></div>

                    <div>

                      <small>

                        Done

                      </small>

                      <h5>

                        {{ dashboard.summary.done }}

                      </h5>

                    </div>

                  </div>

                </div>

                <div class="col-6">

                  <div class="status-box">

                    <div class="status-dot bg-danger"></div>

                    <div>

                      <small>

                        Overdue

                      </small>

                      <h5>

                        {{ dashboard.summary.overdue }}

                      </h5>

                    </div>

                  </div>

                </div>

                <div class="col-6">

                  <div class="status-box">

                    <div class="status-dot bg-secondary"></div>

                    <div>

                      <small>

                        Cancelled

                      </small>

                      <h5>

                        {{ dashboard.summary.cancelled }}

                      </h5>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      <!-- ================= ACTIVITY ================= -->

      <div class="row g-4 mb-4">

        <div class="col-12">

          <div class="card border-0 shadow-sm">

            <div class="card-header bg-white d-flex justify-content-between align-items-center">

              <div>

                <h4 class="mb-1">

                  📞 Activity Type

                </h4>

                <small class="text-muted">

                  Follow Up Activity Distribution

                </small>

              </div>

            </div>

            <div class="card-body">

              <div
                v-if="!activity.length"
                class="empty-state">

                No Activity Data

              </div>

              <template v-else>

                <div class="chart-wrapper mb-5">

                  <canvas
                    ref="activityChart"
                    height="110">
                  </canvas>

                </div>

                <div class="row">

                  <div
                    class="col-xl-4 col-md-6 mb-4"
                    v-for="item in activity"
                    :key="item.follow_up_type">

                    <div class="activity-card">

                      <div class="d-flex justify-content-between mb-2">

                        <strong>

                          {{ item.follow_up_type }}

                        </strong>

                        <span class="badge bg-primary">

                          {{ item.total }}

                        </span>

                      </div>

                      <div class="progress">

                        <div
                          class="progress-bar bg-primary"
                          :style="{
                            width:item.percentage+'%'
                          }">

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              </template>

            </div>

          </div>

        </div>

      </div>

            <!-- ================= LEADERBOARD ================= -->

      <div class="card border-0 shadow-sm mb-4">

        <div class="card-header bg-white d-flex justify-content-between align-items-center">

          <div>

            <h4 class="mb-1">

              🏆 Sales Leaderboard

            </h4>

            <small class="text-muted">

              Ranking Based On Total Follow Up

            </small>

          </div>

          <span class="badge bg-primary">

            {{ dashboard.top_sales.length }}

            Sales

          </span>

        </div>

        <div class="card-body">

          <div
            v-if="!dashboard.top_sales.length"
            class="empty-state">

            No Sales Ranking

          </div>

          <div
            v-else
            class="ranking-item"
            v-for="(item,index) in dashboard.top_sales"
            :key="item.id_user">

            <!-- Rank -->

            <div class="rank">

              {{ medal(index) }}

            </div>

            <!-- Avatar -->

            <div class="avatar">

              <i class="ti ti-user"></i>

            </div>

            <!-- Name -->

            <div class="flex-grow-1 ms-3">

              <div class="fw-bold">

                {{ item.fullname }}

              </div>

              <small class="text-muted">

                {{ item.total_follow_up }}

                Follow Up

              </small>

              <div class="progress mt-2">

                <div
                  class="progress-bar bg-primary"
                  :style="{
                    width:
                    (item.total_follow_up /
                    Math.max(...dashboard.top_sales.map(s=>s.total_follow_up),1))*100
                    +'%'
                  }">

                </div>

              </div>

            </div>

            <!-- Score -->

            <div class="score">

              {{ item.total_follow_up }}

            </div>

          </div>

        </div>

      </div>

      <!-- ================= OVERDUE FOLLOW UP ================= -->

      <div class="card border-0 shadow-sm">

        <div class="card-header bg-white d-flex justify-content-between align-items-center">

          <div>

            <h4 class="mb-1">

              🚨 Overdue Follow Up

            </h4>

            <small class="text-muted">

              Need Immediate Attention

            </small>

          </div>

          <span class="badge bg-danger">

            {{ dashboard.overdue_list.length }}

            Items

          </span>

        </div>

        <div class="card-body">

          <div
            v-if="!dashboard.overdue_list.length"
            class="empty-state">

            <i
              class="ti ti-circle-check text-success"
              style="font-size:60px">
            </i>

            <h5 class="mt-3">

              Great Job 🎉

            </h5>

            <p>

              There are no overdue follow ups.

            </p>

          </div>

          <div
            v-else
            class="row g-4">

            <div
              class="col-xl-6"
              v-for="item in dashboard.overdue_list"
              :key="item.follow_up_code">

              <div class="overdue-modern-card">

                <div class="overdue-ribbon">

                  {{ item.overdue_days }}

                  Days

                </div>

                <div class="mb-3">

                  <h5 class="fw-bold mb-1">

                    {{ item.follow_up_code }}

                  </h5>

                  <small class="text-muted">

                    {{ item.customer_name }}

                  </small>

                </div>

                <div class="row g-3">

                  <div class="col-6">

                    <small class="text-muted">

                      Sales

                    </small>

                    <div class="fw-semibold">

                      {{ item.sales_name }}

                    </div>

                  </div>

                  <div class="col-6">

                    <small class="text-muted">

                      Type

                    </small>

                    <div class="fw-semibold">

                      {{ item.follow_up_type }}

                    </div>

                  </div>

                  <div class="col-6">

                    <small class="text-muted">

                      Schedule

                    </small>

                    <div>

                      {{ formatDateTime(item.follow_up_at) }}

                    </div>

                  </div>

                  <div class="col-6">

                    <small class="text-muted">

                      Status

                    </small>

                    <div>

                      <span
                        class="badge"
                        :class="statusClass(item.status)">

                        {{ item.status }}

                      </span>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </template>

  </div>

</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  DoughnutController,
  ArcElement,
  BarController,
  BarElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

import { useAuthStore } from '@/stores/authStore'
import { useFollowUpDashboardStore } from '@/stores/followUpDashboard'

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  DoughnutController,
  ArcElement,
  BarController,
  BarElement,
  Tooltip,
  Legend,
  Filler
)

const authStore = useAuthStore()
const store = useFollowUpDashboardStore()

const {
  followUp: dashboard,
  loadingFollowUp: loading,

  hasData,

  activity,

  completionRate,
  pendingRate,
  overdueRate,
  cancelledRate,
  closedRate,

  trendCategories,
  trendSeries,

  bestSales

} = storeToRefs(store)

const {
  fetchFollowUp,
  medal,
  statusClass,
  formatDateTime
} = store

const currentMonthLabel = computed(() => {
  return new Date().toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric'
  })
})

/*
|--------------------------------------------------------------------------
| Chart Refs
|--------------------------------------------------------------------------
*/

const dailyTrendChart = ref(null)
const statusChart = ref(null)
const activityChart = ref(null)

let dailyTrendInstance = null
let statusInstance = null
let activityInstance = null

/*
|--------------------------------------------------------------------------
| Destroy Chart
|--------------------------------------------------------------------------
*/

const destroyCharts = () => {

  if (dailyTrendInstance) {
    dailyTrendInstance.destroy()
    dailyTrendInstance = null
  }

  if (statusInstance) {
    statusInstance.destroy()
    statusInstance = null
  }

  if (activityInstance) {
    activityInstance.destroy()
    activityInstance = null
  }

}

/*
|--------------------------------------------------------------------------
| Init
|--------------------------------------------------------------------------
*/

onMounted(async () => {

  if (!authStore.user) {
    await authStore.fetchProfile()
  }

  await fetchFollowUp(
    authStore.user?.id_user
  )

})

onBeforeUnmount(() => {

  destroyCharts()

})

watch(
  dashboard,
  async () => {

    await nextTick()

    destroyCharts()

    createDailyTrendChart()
    createStatusChart()
    createActivityChart()

  },
  {
    deep: true
  }
)

const refresh = async () => {

  await fetchFollowUp(
    authStore.user?.id_user
  )

}

/*
|--------------------------------------------------------------------------
| Daily Trend Chart
|--------------------------------------------------------------------------
*/

const createDailyTrendChart = () => {

  if (!dailyTrendChart.value) return

  dailyTrendInstance = new Chart(
    dailyTrendChart.value,
    {
      type: 'line',

      data: {

        labels: trendCategories.value,

        datasets: [
          {
            label: 'Follow Up',

            data: trendSeries.value,

            borderColor: '#4f46e5',

            backgroundColor: 'rgba(79,70,229,.12)',

            fill: true,

            tension: .35,

            pointRadius: 5,

            pointHoverRadius: 7,

            borderWidth: 3
          }
        ]

      },

      options: {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

          legend: {
            display: false
          }

        },

        scales: {

          y: {

            beginAtZero: true,

            ticks: {
              precision: 0
            },

            grid: {
              color: '#eef2f7'
            }

          },

          x: {

            grid: {
              display: false
            }

          }

        }

      }

    }
  )

}

/*
|--------------------------------------------------------------------------
| Follow Up Status Doughnut
|--------------------------------------------------------------------------
*/

const createStatusChart = () => {

  if (!statusChart.value) return

  statusInstance = new Chart(
    statusChart.value,
    {

      type: 'doughnut',

      data: {

        labels: [
          'Pending',
          'Done',
          'Cancelled',
          'Closed',
          'Overdue'
        ],

        datasets: [
          {

            data: [

              dashboard.value.summary.pending,

              dashboard.value.summary.done,

              dashboard.value.summary.cancelled,

              dashboard.value.summary.closed,

              dashboard.value.summary.overdue

            ],

            backgroundColor: [

              '#f59e0b',

              '#10b981',

              '#64748b',

              '#3b82f6',

              '#ef4444'

            ],

            borderWidth: 0,

            hoverOffset: 8

          }
        ]

      },

      options: {

        responsive: true,

        maintainAspectRatio: false,

        cutout: '70%',

        plugins: {

          legend: {

            position: 'bottom',

            labels: {

              boxWidth: 12,

              padding: 18

            }

          }

        }

      }

    }
  )

}

/*
|--------------------------------------------------------------------------
| Activity Horizontal Bar
|--------------------------------------------------------------------------
*/

const createActivityChart = () => {

  if (!activityChart.value) return

  activityInstance = new Chart(
    activityChart.value,
    {

      type: 'bar',

      data: {

        labels: activity.value.map(
          item => item.follow_up_type
        ),

        datasets: [
          {

            label: 'Total',

            data: activity.value.map(
              item => item.total
            ),

            backgroundColor: '#4f46e5',

            borderRadius: 10,

            borderSkipped: false,

            barThickness: 18

          }
        ]

      },

      options: {

        indexAxis: 'y',

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

          legend: {
            display: false
          }

        },

        scales: {

          x: {

            beginAtZero: true,

            ticks: {
              precision: 0
            },

            grid: {
              color: '#eef2f7'
            }

          },

          y: {

            grid: {
              display: false
            }

          }

        }

      }

    }
  )

}
</script>

<style scoped>



/* 1. KPI CARD (SOLID GRADIENT STYLE) */
.kpi-card {
  position: relative;
  display: flex;
  align-items: center;
  padding: 20px 25px;
  border-radius: 16px;
  color: #ffffff;
  overflow: hidden;
  border: none;
  min-height: 130px;
  transition: transform 0.3s ease;
}

.kpi-card:hover {
  transform: translateY(-5px);
  filter: brightness(1.1);
}

/* Efek lingkaran/gradient di dalam kartu */
.kpi-card::after {
  content: "";
  position: absolute;
  right: -20px;
  top: -20px;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  pointer-events: none;
}

/* Ikon Samping */
.kpi-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 24px;
  margin-right: 20px;
}

.kpi-card .flex-grow-1 {
  text-align: right; /* Mengikuti referensi gambar */
}

.kpi-card h2 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  color: white;
}

.kpi-card small {
  font-size: 0.9rem;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* VARIANT WARNA */
.bg-indigo { background: linear-gradient(135deg, #5d5cde 0%, #3e3cd9 100%); }
.bg-success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
.bg-primary { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
.bg-warning { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
.bg-danger  { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }


/* ==========================================================
   CHART
========================================================== */

.chart-wrapper{

    position:relative;

    width:100%;

    height:340px;

}

.chart-wrapper canvas{

    width:100%!important;

    height:100%!important;

}

/* ==========================================================
   STATUS BOX
========================================================== */

.status-box{

    display:flex;

    align-items:center;

    gap:14px;

    padding:14px 18px;

    border-radius:14px;

    background:#f8fafc;

    transition:.3s;

}

.status-box:hover{

    transform:translateY(-3px);

    box-shadow:0 12px 25px rgba(15,23,42,.08);

}

.status-dot{

    width:14px;

    height:14px;

    border-radius:50%;

    flex-shrink:0;

}

.status-box h5{

    margin:0;

    font-weight:700;

}

.status-box small{

    color:#64748b;

}

/* ==========================================================
   ACTIVITY CARD
========================================================== */

.activity-card{

    background:#fff;

    border:1px solid #edf2f7;

    border-radius:16px;

    padding:18px;

    transition:.3s;

}

.activity-card:hover{

    transform:translateY(-5px);

    border-color:#6366f1;

    box-shadow:0 12px 25px rgba(99,102,241,.12);

}

/* ==========================================================
   LEADERBOARD
========================================================== */

.ranking-item{

    display:flex;

    align-items:center;

    gap:18px;

    padding:18px;

    border-radius:18px;

    transition:.35s;

    margin-bottom:14px;

    background:#fff;

}

.ranking-item:last-child{

    margin-bottom:0;

}

.ranking-item:hover{

    transform:translateX(6px);

    background:#f8fafc;

}

.rank{

    width:55px;

    text-align:center;

    font-size:26px;

    font-weight:bold;

}

.avatar{

    width:60px;

    height:60px;

    border-radius:50%;

    background:linear-gradient(135deg,#4f46e5,#818cf8);

    color:#fff;

    display:flex;

    align-items:center;

    justify-content:center;

    font-size:28px;

    flex-shrink:0;

}

.score{

    min-width:70px;

    height:52px;

    border-radius:14px;

    display:flex;

    align-items:center;

    justify-content:center;

    background:#eef2ff;

    color:#4f46e5;

    font-size:24px;

    font-weight:700;

}

/* ==========================================================
   OVERDUE CARD
========================================================== */

.overdue-modern-card{

    position:relative;

    overflow:hidden;

    border-radius:18px;

    background:#fff;

    border:1px solid #eef2f7;

    padding:22px;

    transition:.35s;

}

.overdue-modern-card:hover{

    transform:translateY(-6px);

    box-shadow:0 18px 35px rgba(239,68,68,.12);

    border-color:#ef4444;

}

.overdue-modern-card::before{

    content:"";

    position:absolute;

    left:0;

    top:0;

    width:6px;

    height:100%;

    background:#ef4444;

}

.overdue-ribbon{

    position:absolute;

    right:18px;

    top:18px;

    background:#ef4444;

    color:#fff;

    padding:6px 14px;

    border-radius:30px;

    font-size:.85rem;

    font-weight:700;

}

/* ==========================================================
   TOP USER
========================================================== */

.top-user{

    text-align:center;

}

.avatar-xl{

    width:130px;

    height:130px;

    margin:auto;

    border-radius:50%;

    background:linear-gradient(135deg,#4f46e5,#818cf8);

    color:#fff;

    display:flex;

    align-items:center;

    justify-content:center;

    font-size:58px;

    box-shadow:0 12px 35px rgba(79,70,229,.25);

}

.score-circle{

    width:95px;

    height:95px;

    margin:22px auto;

    border-radius:50%;

    background:linear-gradient(135deg,#4f46e5,#818cf8);

    color:#fff;

    display:flex;

    align-items:center;

    justify-content:center;

    font-size:34px;

    font-weight:700;

}

/* ==========================================================
   SUMMARY
========================================================== */

.summary-item{

    display:flex;

    justify-content:space-between;

    align-items:center;

    font-weight:600;

    margin-bottom:10px;

}

.progress{

    height:10px;

    border-radius:20px;

    background:#edf2f7;

}

.progress-bar{

    border-radius:20px;

    transition:1s;

}

/* ==========================================================
   KPI FOOTER
========================================================== */

.kpi-footer{

    margin-top:12px;

    color:rgba(255,255,255,.9);

    font-size:.85rem;

}

/* ==========================================================
   EMPTY
========================================================== */

.empty-state{

    min-height:260px;

    display:flex;

    flex-direction:column;

    align-items:center;

    justify-content:center;

    color:#94a3b8;

}

.empty-state i{

    font-size:70px;

    margin-bottom:18px;

}
</style>