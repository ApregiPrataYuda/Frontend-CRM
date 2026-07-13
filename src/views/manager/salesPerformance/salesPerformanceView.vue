<template>
  <div class="sales-performance-page container-fluid py-4">

    <!-- ================= HEADER ================= -->
    <div class="d-flex justify-content-between align-items-center flex-wrap mb-4">

      <div>
        <h2 class="fw-bold mb-1">
          Sales Performance Dashboard
        </h2>

        <p class="text-muted mb-0">
          Team Performance Overview
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

          <i class="ti ti-refresh me-2" :class="{ 'spin-icon': loading }"></i>

          {{ loading ? 'Memuat...' : 'Refresh' }}

        </button>

      </div>

    </div>

    <!-- ================= LOADING (first load) ================= -->
    <div v-if="loading && !hasData" class="sp-loading-wrap">
      <div class="spinner"></div>
      <span>Memuat data performa sales...</span>
    </div>

    <template v-else>

      <!-- ================= KPI ================= -->

      <div class="row g-4 mb-4">

        <div class="col-xl-3 col-md-6">

          <div class="kpi-card bg-indigo">

            <div class="kpi-icon">

              <i class="ti ti-users"></i>

            </div>

            <div>

              <small>Total Sales</small>

              <h2>
                {{ dashboard.summary?.total_sales ?? 0 }}
              </h2>

            </div>

          </div>

        </div>

        <div class="col-xl-3 col-md-6">

          <div class="kpi-card bg-green">

            <div class="kpi-icon">

              <i class="ti ti-user-check"></i>

            </div>

            <div>

              <small>Active Sales</small>

              <h2>
                {{ dashboard.summary?.active_sales ?? 0 }}
              </h2>

            </div>

          </div>

        </div>

        <div class="col-xl-3 col-md-6">

          <div class="kpi-card bg-blue">

            <div class="kpi-icon">

              <i class="ti ti-map-pin"></i>

            </div>

            <div>

              <small>Total Visit</small>

              <h2>
                {{ dashboard.summary?.total_visit ?? 0 }}
              </h2>

            </div>

          </div>

        </div>

        <div class="col-xl-3 col-md-6">

          <div class="kpi-card bg-orange">

            <div class="kpi-icon">

              <i class="ti ti-building-store"></i>

            </div>

            <div>

              <small>Total Customer</small>

              <h2>
                {{ dashboard.summary?.total_customer ?? 0 }}
              </h2>

            </div>

          </div>

        </div>

      </div>

      <!-- ================= SECOND ROW ================= -->

      <div class="row g-4 mb-4">

        <!-- TOP PERFORMER -->

        <div class="col-xl-5">

          <div class="card border-0 shadow-sm h-100">

            <div class="card-header bg-white">

              <h4 class="mb-0">

                🏆 Top Performer

              </h4>

            </div>

            <div class="card-body">

              <div v-if="!dashboard.top_performer" class="empty-state">
                Belum ada data performer
              </div>

              <template v-else>

                <div class="top-user">

                  <img
                    class="avatar-xl"
                    :src="dashboard.top_performer.image_url"
                    :alt="dashboard.top_performer.fullname"
                  >

                  <h3 class="mt-3 mb-1">

                    {{ dashboard.top_performer.fullname }}

                  </h3>

                  <p class="text-muted">

                    {{ dashboard.top_performer.email }}

                  </p>

                  <div class="score-circle">

                    {{ dashboard.top_performer.performance_score }}

                  </div>

                </div>

                <div class="row mt-4 text-center">

                  <div class="col">

                    <h4>

                      {{ dashboard.top_performer.total_visit }}

                    </h4>

                    <small>Visit</small>

                  </div>

                  <div class="col">

                    <h4>

                      {{ dashboard.top_performer.total_follow_up }}

                    </h4>

                    <small>Follow Up</small>

                  </div>

                  <div class="col">

                    <h4>

                      {{ dashboard.top_performer.total_customer }}

                    </h4>

                    <small>Customer</small>

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

              <div class="summary-item">

                <div>

                  Active Sales

                </div>

                <strong>

                  {{ dashboard.summary?.active_sales ?? 0 }}

                </strong>

              </div>

              <div class="progress mb-4">

                <div
                  class="progress-bar bg-success"
                  :style="{ width: totalActivePercentage + '%' }"
                ></div>

              </div>

              <div class="summary-item">

                <div>

                  Inactive Sales

                </div>

                <strong>

                  {{ dashboard.summary?.inactive_sales ?? 0 }}

                </strong>

              </div>

              <div class="progress mb-4">

                <div
                  class="progress-bar bg-danger"
                  :style="{ width: totalInactivePercentage + '%' }"
                ></div>

              </div>

              <div class="summary-item">

                <div>

                  Total Follow Up

                </div>

                <strong>

                  {{ dashboard.summary?.total_follow_up ?? 0 }}

                </strong>

              </div>

              <div class="progress mb-4">

                <div
                  class="progress-bar bg-warning"
                  :style="{ width: followUpWidth + '%' }"
                ></div>

              </div>

              <div class="summary-item">

                <div>

                  Total Customer

                </div>

                <strong>

                  {{ dashboard.summary?.total_customer ?? 0 }}

                </strong>

              </div>

              <div class="progress">

                <div
                  class="progress-bar bg-primary"
                  :style="{ width: customerWidth + '%' }"
                ></div>

              </div>

            </div>

          </div>

        </div>

      </div>

      <!-- ================= LEADERBOARD ================= -->

      <div class="card border-0 shadow-sm">

        <div class="card-header bg-white d-flex justify-content-between">

          <h4 class="mb-0">

            Sales Leaderboard

          </h4>

          <span class="badge bg-primary">

            {{ dashboard.ranking?.length ?? 0 }}

            Sales

          </span>

        </div>

        <div class="card-body">

          <div v-if="!dashboard.ranking?.length" class="empty-state">
            Belum ada data ranking sales
          </div>

          <div
            v-else
            class="ranking-item"
            v-for="(item,index) in dashboard.ranking"
            :key="item.id_user">

            <div class="rank">

              <span>{{ medal(index) }}</span>

            </div>

            <img
              class="avatar"
              :src="item.image_url"
              :alt="item.fullname"
            >

            <div class="flex-grow-1 ms-3">

              <div class="fw-bold">

                {{ item.fullname }}

              </div>

              <small class="text-muted">

                {{ item.email }}

              </small>

              <div class="progress mt-2">

                <div
                  class="progress-bar bg-primary"
                  :style="{width:item.score_percent+'%'}"
                ></div>

              </div>

            </div>

            <div class="text-center px-3">

              <div class="small text-muted">

                Visit

              </div>

              <strong>

                {{ item.total_visit }}

              </strong>

            </div>

            <div class="text-center px-3">

              <div class="small text-muted">

                Follow Up

              </div>

              <strong>

                {{ item.total_follow_up }}

              </strong>

            </div>

            <div class="text-center px-3">

              <div class="small text-muted">

                Customer

              </div>

              <strong>

                {{ item.total_customer }}

              </strong>

            </div>

            <div class="score" :class="scoreBadge(item.performance_score)">

              {{ item.performance_score }}

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
import { useSalesPerformanceDashboardStore } from '@/stores/salesPerformanceDashboard'

const authStore = useAuthStore()
const store     = useSalesPerformanceDashboardStore()

// ── STORE REFS ──
const {
  performance: dashboard,
  loadingPerformance: loading,
  totalActivePercentage,
  totalInactivePercentage,
} = storeToRefs(store)

const { scoreBadge, medal } = store

// true kalau data sudah pernah keisi (biar refresh berikutnya gak nge-blank layar)
const hasData = computed(() => !!dashboard.value?.ranking?.length || !!dashboard.value?.top_performer)

// lebar progress follow up & customer di Team Summary (relatif terhadap nilai tertinggi di antara keduanya)
const followUpWidth = computed(() => {
  const fu = dashboard.value.summary?.total_follow_up ?? 0
  const cs = dashboard.value.summary?.total_customer ?? 0
  const max = Math.max(fu, cs, 1)
  return (fu / max) * 100
})

const customerWidth = computed(() => {
  const fu = dashboard.value.summary?.total_follow_up ?? 0
  const cs = dashboard.value.summary?.total_customer ?? 0
  const max = Math.max(fu, cs, 1)
  return (cs / max) * 100
})

const currentMonthLabel = computed(() => {
  return new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
})

// ── INIT ──
onMounted(async () => {
  if (!authStore.user) await authStore.fetchProfile()
  await store.fetchPerformance(authStore.user?.id_user)
})

// ── REFRESH ──
const refresh = async () => {
  await store.fetchPerformance(authStore.user?.id_user)
}
</script>


<style scoped>

/* =========================================================
   PAGE
========================================================= */

.sales-performance-page{
    background:#f4f7fb;
    min-height:100vh;
}

/* =========================================================
   LOADING (first load)
========================================================= */

.sp-loading-wrap{
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
    border-top-color:#4f46e5;
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

.empty-state{
    text-align:center;
    padding:30px 0;
    color:#9ca3af;
    font-size:.9rem;
}

/* =========================================================
   CARD
========================================================= */

.card{
    border:none;
    border-radius:18px;
    overflow:hidden;
    box-shadow:0 10px 30px rgba(15,23,42,.08);
}

.card-header{
    background:#fff;
    border:none;
    padding:22px 24px;
}

.card-body{
    padding:24px;
}

/* =========================================================
   KPI
========================================================= */

.kpi-card{

    position:relative;

    overflow:hidden;

    border-radius:18px;

    color:#fff;

    padding:24px;

    display:flex;

    align-items:center;

    justify-content:space-between;

    min-height:140px;

    transition:.35s;

    cursor:pointer;

}

.kpi-card:hover{

    transform:translateY(-8px);

    box-shadow:0 20px 35px rgba(0,0,0,.15);

}

.kpi-card::before{

    content:'';

    position:absolute;

    width:180px;

    height:180px;

    background:rgba(255,255,255,.08);

    border-radius:50%;

    top:-80px;

    right:-60px;

}

.kpi-card::after{

    content:'';

    position:absolute;

    width:120px;

    height:120px;

    background:rgba(255,255,255,.05);

    border-radius:50%;

    bottom:-40px;

    left:-40px;

}

.kpi-icon{

    width:72px;

    height:72px;

    border-radius:18px;

    display:flex;

    align-items:center;

    justify-content:center;

    background:rgba(255,255,255,.18);

    font-size:34px;

    backdrop-filter:blur(8px);

}

.kpi-card small{

    opacity:.9;

    font-size:.9rem;

}

.kpi-card h2{

    font-size:40px;

    font-weight:700;

    margin-top:10px;

    margin-bottom:0;

}

/* =========================================================
   COLOR
========================================================= */

.bg-indigo{
    background:linear-gradient(135deg,#4f46e5,#6366f1);
}

.bg-green{
    background:linear-gradient(135deg,#059669,#10b981);
}

.bg-blue{
    background:linear-gradient(135deg,#0284c7,#38bdf8);
}

.bg-orange{
    background:linear-gradient(135deg,#d97706,#f59e0b);
}

/* =========================================================
   TOP PERFORMER
========================================================= */

.top-user{

    text-align:center;

}

.avatar-xl{

    width:130px;

    height:130px;

    border-radius:50%;

    object-fit:cover;

    border:6px solid #eef2ff;

    box-shadow:0 12px 30px rgba(0,0,0,.15);

}

.score-circle{

    width:95px;

    height:95px;

    margin:25px auto;

    border-radius:50%;

    background:linear-gradient(135deg,#4f46e5,#818cf8);

    color:#fff;

    display:flex;

    align-items:center;

    justify-content:center;

    font-size:34px;

    font-weight:bold;

    box-shadow:0 10px 30px rgba(79,70,229,.35);

}

/* =========================================================
   TEAM SUMMARY
========================================================= */

.summary-item{

    display:flex;

    justify-content:space-between;

    align-items:center;

    margin-bottom:10px;

    font-weight:600;

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

/* =========================================================
   LEADERBOARD
========================================================= */

.ranking-item{

    display:flex;

    align-items:center;

    padding:18px;

    border-radius:16px;

    transition:.3s;

    margin-bottom:14px;

    background:#fff;

}

.ranking-item:last-child{

    margin-bottom:0;

}

.ranking-item:hover{

    background:#f8fafc;

    transform:translateX(6px);

}

.rank{

    width:60px;

    font-size:26px;

    text-align:center;

    font-weight:bold;

}

.avatar{

    width:58px;

    height:58px;

    border-radius:50%;

    object-fit:cover;

    border:3px solid #eef2ff;

}

.score{

    min-width:70px;

    text-align:center;

    font-size:24px;

    font-weight:bold;

    color:#4f46e5;

    padding:4px 0;

    border-radius:12px;

}

.score.bg-success{ color:#fff; background:#16a34a; }
.score.bg-primary{ color:#fff; background:#4f46e5; }
.score.bg-warning{ color:#fff; background:#d97706; }
.score.bg-secondary{ color:#fff; background:#6b7280; }

/* =========================================================
   BUTTON
========================================================= */

.btn{

    border-radius:12px;

    padding:10px 20px;

}

.btn-primary{

    background:#4f46e5;

    border:none;

}

.btn-primary:hover{

    background:#4338ca;

}

.btn-primary:disabled{

    opacity:.7;

    cursor:not-allowed;

}

/* =========================================================
   BADGE
========================================================= */

.badge{

    padding:8px 14px;

    border-radius:20px;

}

/* =========================================================
   TITLE
========================================================= */

h2{

    font-weight:700;

}

h3{

    font-weight:700;

}

h4{

    font-weight:600;

}

/* =========================================================
   ANIMATION
========================================================= */

.kpi-card,
.card{

    animation:fadeUp .45s ease;

}

@keyframes fadeUp{

    from{

        opacity:0;

        transform:translateY(20px);

    }

    to{

        opacity:1;

        transform:translateY(0);

    }

}

/* =========================================================
   RESPONSIVE
========================================================= */

@media(max-width:1200px){

    .kpi-card h2{

        font-size:34px;

    }

}

@media(max-width:992px){

    .avatar-xl{

        width:110px;

        height:110px;

    }

    .score-circle{

        width:80px;

        height:80px;

        font-size:28px;

    }

}

@media(max-width:768px){

    .ranking-item{

        flex-wrap:wrap;

        gap:15px;

    }

    .score{

        width:100%;

        text-align:left;

    }

    .kpi-card{

        min-height:120px;

    }

    .kpi-icon{

        width:60px;

        height:60px;

        font-size:28px;

    }

    .kpi-card h2{

        font-size:30px;

    }

}

@media(max-width:576px){

    .sales-performance-page{

        padding:16px;

    }

    .kpi-card{

        padding:20px;

    }

}

/* =========================================================
   SCROLLBAR
========================================================= */

::-webkit-scrollbar{

    width:8px;

}

::-webkit-scrollbar-thumb{

    background:#cbd5e1;

    border-radius:20px;

}

::-webkit-scrollbar-thumb:hover{

    background:#94a3b8;

}

</style>