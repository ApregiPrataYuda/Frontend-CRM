<template>
  <div class="dashboard-manager container-fluid py-4">

    <!-- ================= HEADER ================= -->
    <div class="d-flex justify-content-between align-items-center flex-wrap mb-4">
      <div>
        <h2 class="fw-bold mb-1">Dashboard Manager Sales</h2>
        <p class="text-secondary mb-0">
          {{ periodText }}
        </p>
      </div>

      <button class="btn btn-primary" :disabled="loading" @click="refresh">
        <i class="ti ti-refresh me-2" :class="{ 'spin-icon': loading }"></i>
        {{ loading ? 'Memuat...' : 'Refresh' }}
      </button>
    </div>

    <!-- ================= LOADING (first load) ================= -->
    <div v-if="loading && !hasData" class="dm-loading-wrap">
      <div class="spinner"></div>
      <span>Memuat dashboard...</span>
    </div>

    <template v-else>

      <!-- ================= SUMMARY ================= -->

      <div class="row g-4">

        <!-- Lead -->
        <div class="col-xl-3 col-lg-6">
          <div class="summary-card card-lead">

            <div class="summary-icon">
              <i class="ti ti-target-arrow"></i>
            </div>

            <div class="summary-content">
              <small>Total Lead</small>
              <h2>{{ dashboard.lead?.total ?? 0 }}</h2>
              <span>Bulan ini</span>
            </div>

          </div>
        </div>

        <!-- Customer -->
        <div class="col-xl-3 col-lg-6">
          <div class="summary-card card-customer">

            <div class="summary-icon">
              <i class="ti ti-building-store"></i>
            </div>

            <div class="summary-content">
              <small>Total Customer</small>
              <h2>{{ dashboard.customer?.total ?? 0 }}</h2>
              <span>Customer Aktif</span>
            </div>

          </div>
        </div>

        <!-- Sales -->
        <div class="col-xl-3 col-lg-6">
          <div class="summary-card card-sales">

            <div class="summary-icon">
              <i class="ti ti-users"></i>
            </div>

            <div class="summary-content">
              <small>Sales Active</small>
              <h2>{{ dashboard.sales?.active ?? 0 }}</h2>
              <span>Sales Aktif</span>
            </div>

          </div>
        </div>

        <!-- Visit Today -->
        <div class="col-xl-3 col-lg-6">
          <div class="summary-card card-visit">

            <div class="summary-icon">
              <i class="ti ti-map-pin"></i>
            </div>

            <div class="summary-content">
              <small>Visit Hari Ini</small>
              <h2>{{ dashboard.visit?.today ?? 0 }}</h2>
              <span>Kunjungan</span>
            </div>

          </div>
        </div>

        <!-- Visit Month -->
        <div class="col-xl-3 col-lg-6">
          <div class="summary-card card-month">

            <div class="summary-icon">
              <i class="ti ti-calendar-event"></i>
            </div>

            <div class="summary-content">
              <small>Visit Bulan Ini</small>
              <h2>{{ dashboard.visit?.this_month ?? 0 }}</h2>
              <span>Total Visit</span>
            </div>

          </div>
        </div>

        <!-- Growth -->
        <div class="col-xl-3 col-lg-6">
          <div class="summary-card card-growth">

            <div class="summary-icon">
              <i class="ti ti-chart-line"></i>
            </div>

            <div class="summary-content">
              <small>Growth</small>
              <h2>{{ dashboard.visit?.growth ?? 0 }}%</h2>
              <span>vs Bulan Lalu</span>
            </div>

          </div>
        </div>

        <!-- Follow Up -->
        <div class="col-xl-3 col-lg-6">
          <div class="summary-card card-follow">

            <div class="summary-icon">
              <i class="ti ti-bell-ringing"></i>
            </div>

            <div class="summary-content">
              <small>Follow Up</small>
              <h2>{{ dashboard.follow_up?.today ?? 0 }}</h2>
              <span>Hari Ini</span>
            </div>

          </div>
        </div>

        <!-- Overdue -->
        <div class="col-xl-3 col-lg-6">
          <div class="summary-card card-overdue">

            <div class="summary-icon">
              <i class="ti ti-clock-exclamation"></i>
            </div>

            <div class="summary-content">
              <small>Overdue</small>
              <h2>{{ dashboard.follow_up?.overdue ?? 0 }}</h2>
              <span>Belum Follow Up</span>
            </div>

          </div>
        </div>

      </div>

      <!-- ================= SECOND ROW ================= -->

      <div class="row mt-2">

        <!-- Activity -->
        <div class="col-lg-8">

          <div class="card shadow-sm border-0">

            <div class="card-header bg-white">
              <h4 class="mb-0">
                Ringkasan Aktivitas Bulan Ini
              </h4>
            </div>

            <div class="card-body">

              <div class="activity-item">

                <div class="d-flex justify-content-between">
                  <span>Total Lead</span>
                  <strong>{{ dashboard.lead?.total ?? 0 }}</strong>
                </div>

                <div class="progress mt-2">
                  <div
                    class="progress-bar bg-primary"
                    :style="{ width: leadWidth }">
                  </div>
                </div>

              </div>

              <div class="activity-item mt-4">

                <div class="d-flex justify-content-between">
                  <span>Total Customer</span>
                  <strong>{{ dashboard.customer?.total ?? 0 }}</strong>
                </div>

                <div class="progress mt-2">
                  <div
                    class="progress-bar bg-success"
                    :style="{ width: customerWidth }">
                  </div>
                </div>

              </div>

              <div class="activity-item mt-4">

                <div class="d-flex justify-content-between">
                  <span>Total Visit</span>
                  <strong>{{ dashboard.visit?.this_month ?? 0 }}</strong>
                </div>

                <div class="progress mt-2">
                  <div
                    class="progress-bar bg-info"
                    :style="{ width: visitWidth }">
                  </div>
                </div>

              </div>

              <div class="activity-item mt-4">

                <div class="d-flex justify-content-between">
                  <span>Sales Active</span>
                  <strong>{{ dashboard.sales?.active ?? 0 }}</strong>
                </div>

                <div class="progress mt-2">
                  <div
                    class="progress-bar bg-warning"
                    :style="{ width: salesWidth }">
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

        <!-- Right Widget -->
        <div class="col-lg-4">

          <!-- Follow Up -->

          <div class="card shadow-sm border-0 mb-4">

            <div class="card-header bg-white">
              <h4 class="mb-0">
                Follow Up
              </h4>
            </div>

            <div class="card-body">

              <div
                class="widget-box bg-warning-subtle">

                <div>

                  <h3>{{ dashboard.follow_up?.today ?? 0 }}</h3>

                  <small>Follow Up Hari Ini</small>

                </div>

                <i class="ti ti-bell-ringing"></i>

              </div>

              <div
                class="widget-box bg-danger-subtle mt-3">

                <div>

                  <h3>{{ dashboard.follow_up?.overdue ?? 0 }}</h3>

                  <small>Overdue</small>

                </div>

                <i class="ti ti-alert-circle"></i>

              </div>

              <div class="widget-status mt-3">
                {{ followUpStatus }}
              </div>

            </div>

          </div>

          <!-- Visit Summary -->

          <div class="card shadow-sm border-0">

            <div class="card-header bg-white">

              <h4 class="mb-0">

                Visit Summary

              </h4>

            </div>

            <div class="card-body">

              <div class="visit-summary">

                <div class="visit-row">

                  <span>Hari Ini</span>

                  <strong>{{ dashboard.visit?.today ?? 0 }}</strong>

                </div>

                <div class="visit-row">

                  <span>Bulan Ini</span>

                  <strong>{{ dashboard.visit?.this_month ?? 0 }}</strong>

                </div>

                <div class="visit-row">

                  <span>Growth</span>

                  <strong :style="{ color: growthColor }">
                    {{ growthPositive ? '▲' : '▼' }} {{ dashboard.visit?.growth ?? 0 }}%
                  </strong>

                </div>

              </div>

              <div class="widget-status mt-2">
                {{ visitStatus }}
              </div>

            </div>

          </div>

        </div>

      </div>

    </template>

  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { useExecutiveSummaryDashboardStore } from '@/stores/executiveSummaryDashboard'

const authStore = useAuthStore()
const store     = useExecutiveSummaryDashboardStore()

// ── STORE REFS ──
const {
  summary: dashboard,
  loadingSummary: loading,
  leadWidth,
  customerWidth,
  visitWidth,
  salesWidth,
  followUpStatus,
  visitStatus,
  growthPositive,
  growthColor,
  periodText,
} = storeToRefs(store)

// true kalau data sudah pernah diisi (dipakai supaya loading pertama full-screen,
// tapi saat refresh berikutnya data lama tetap tampil sambil loading)
const hasData = computed(() => !!dashboard.value?.period?.start_date)

// ── INIT ──
onMounted(async () => {
  if (!authStore.user) await authStore.fetchProfile()
  await store.fetchSummary(authStore.user?.id_user)
})

// ── REFRESH ──
const refresh = async () => {
  await store.fetchSummary(authStore.user?.id_user)
}
</script>

<style scoped>

/* =====================================================
   Dashboard
===================================================== */

.dashboard-manager{
    min-height:100vh;
    background:#f5f7fb;
}

/* =====================================================
   Loading (first load)
===================================================== */

.dm-loading-wrap{
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:14px;
    padding:80px 0;
    color:#6b7280;
}

.spinner{
    width:36px;
    height:36px;
    border:3px solid #e5e7eb;
    border-top-color:#6366f1;
    border-radius:50%;
    animation:spin .7s linear infinite;
}

.spin-icon{
    display:inline-block;
    animation:spin .7s linear infinite;
}

@keyframes spin{
    to{ transform:rotate(360deg); }
}


/* =====================================================
   Summary Card
===================================================== */

.summary-card{

    position:relative;

    overflow:hidden;

    border-radius:18px;

    padding:24px;

    color:#fff;

    min-height:150px;

    display:flex;

    justify-content:space-between;

    align-items:center;

    transition:.35s;

    cursor:pointer;

    box-shadow:0 10px 30px rgba(0,0,0,.08);

}

.summary-card:hover{

    transform:translateY(-8px);

    box-shadow:0 20px 45px rgba(0,0,0,.15);

}


/* =====================================================
   Gradient
===================================================== */

.card-lead{

    background:linear-gradient(135deg,#4f46e5,#6366f1);

}

.card-customer{

    background:linear-gradient(135deg,#059669,#10b981);

}

.card-sales{

    background:linear-gradient(135deg,#7c3aed,#9333ea);

}

.card-visit{

    background:linear-gradient(135deg,#2563eb,#3b82f6);

}

.card-month{

    background:linear-gradient(135deg,#0891b2,#06b6d4);

}

.card-growth{

    background:linear-gradient(135deg,#0f766e,#14b8a6);

}

.card-follow{

    background:linear-gradient(135deg,#d97706,#f59e0b);

}

.card-overdue{

    background:linear-gradient(135deg,#dc2626,#ef4444);

}


/* =====================================================
   Icon
===================================================== */

.summary-icon{

    width:70px;

    height:70px;

    border-radius:18px;

    background:rgba(255,255,255,.18);

    display:flex;

    align-items:center;

    justify-content:center;

    font-size:34px;

    backdrop-filter:blur(6px);

}


/* =====================================================
   Content
===================================================== */

.summary-content{

    text-align:right;

}

.summary-content small{

    opacity:.85;

    font-size:.9rem;

}

.summary-content h2{

    margin:10px 0;

    font-size:40px;

    font-weight:700;

}

.summary-content span{

    font-size:.9rem;

    opacity:.85;

}


/* =====================================================
   Circle Decoration
===================================================== */

.summary-card::before{

    content:'';

    position:absolute;

    width:160px;

    height:160px;

    background:rgba(255,255,255,.08);

    border-radius:50%;

    top:-60px;

    right:-50px;

}

.summary-card::after{

    content:'';

    position:absolute;

    width:120px;

    height:120px;

    background:rgba(255,255,255,.05);

    border-radius:50%;

    bottom:-45px;

    left:-40px;

}


/* =====================================================
   Card
===================================================== */

.card{

    border:none;

    border-radius:18px;

    box-shadow:0 8px 25px rgba(0,0,0,.06);

}

.card-header{

    border:none;

    background:#fff;

    padding:22px;

}

.card-header h4{

    font-weight:700;

    margin:0;

}

.card-body{

    padding:24px;

}


/* =====================================================
   Activity
===================================================== */

.activity-item{

    margin-bottom:18px;

}

.activity-item:last-child{

    margin-bottom:0;

}


/* =====================================================
   Progress
===================================================== */

.progress{

    height:10px;

    border-radius:30px;

    background:#edf2f7;

}

.progress-bar{

    border-radius:30px;

    transition:1s;

}


/* =====================================================
   Widget
===================================================== */

.widget-box{

    display:flex;

    justify-content:space-between;

    align-items:center;

    padding:20px;

    border-radius:15px;

}

.widget-box h3{

    font-size:32px;

    font-weight:700;

    margin-bottom:6px;

}

.widget-box small{

    color:#666;

}

.widget-box i{

    font-size:42px;

    opacity:.7;

}

.widget-status{

    font-size:.8rem;

    color:#6b7280;

    text-align:center;

    font-weight:500;

}


/* =====================================================
   Visit Summary
===================================================== */

.visit-row{

    display:flex;

    justify-content:space-between;

    align-items:center;

    padding:14px 0;

    border-bottom:1px solid #ececec;

}

.visit-row:last-child{

    border-bottom:none;

}

.visit-row span{

    color:#6b7280;

}

.visit-row strong{

    font-size:18px;

}


/* =====================================================
   Refresh Button
===================================================== */

.btn-primary{

    border:none;

    border-radius:12px;

    padding:10px 22px;

    font-weight:600;

    transition:.3s;

}

.btn-primary:hover{

    transform:translateY(-2px);

}

.btn-primary:disabled{

    opacity:.7;

    cursor:not-allowed;

    transform:none;

}


/* =====================================================
   Animation
===================================================== */

.summary-card{

    animation:fadeInUp .5s ease;

}

@keyframes fadeInUp{

    from{

        opacity:0;

        transform:translateY(20px);

    }

    to{

        opacity:1;

        transform:translateY(0);

    }

}


/* =====================================================
   Responsive
===================================================== */

@media (max-width:1200px){

    .summary-content h2{

        font-size:34px;

    }

}

@media (max-width:992px){

    .summary-card{

        min-height:135px;

    }

    .summary-icon{

        width:60px;

        height:60px;

        font-size:28px;

    }

}

@media (max-width:768px){

    .summary-card{

        padding:20px;

    }

    .summary-content h2{

        font-size:30px;

    }

    .summary-icon{

        width:55px;

        height:55px;

        font-size:24px;

    }

}

@media (max-width:576px){

    .dashboard-manager{

        padding:15px;

    }

    .summary-card{

        min-height:120px;

    }

    .summary-content h2{

        font-size:26px;

    }

    .widget-box{

        padding:16px;

    }

}


/* =====================================================
   Scrollbar
===================================================== */

::-webkit-scrollbar{

    width:8px;

}

::-webkit-scrollbar-thumb{

    background:#d1d5db;

    border-radius:20px;

}

::-webkit-scrollbar-thumb:hover{

    background:#9ca3af;

}

</style>