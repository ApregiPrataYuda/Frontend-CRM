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

                    July 2026

                </button>

                <button
                    class="btn btn-primary"
                    @click="refresh">

                    <i class="ti ti-refresh me-2"></i>

                    Refresh

                </button>

            </div>

        </div>

        <!-- ================= KPI ================= -->

        <div class="row g-4 mb-4">

            <div class="col-xl col-md-6">

                <div class="kpi-card card-indigo">

                    <div class="kpi-icon">

                        <i class="ti ti-phone"></i>

                    </div>

                    <div>

                        <small>Total Follow Up</small>

                        <h2>{{ dashboard.summary.total_follow_up }}</h2>

                    </div>

                </div>

            </div>

            <div class="col-xl col-md-6">

                <div class="kpi-card card-warning">

                    <div class="kpi-icon">

                        <i class="ti ti-clock-hour-4"></i>

                    </div>

                    <div>

                        <small>Pending</small>

                        <h2>{{ dashboard.summary.pending }}</h2>

                    </div>

                </div>

            </div>

            <div class="col-xl col-md-6">

                <div class="kpi-card card-success">

                    <div class="kpi-icon">

                        <i class="ti ti-circle-check"></i>

                    </div>

                    <div>

                        <small>Done</small>

                        <h2>{{ dashboard.summary.done }}</h2>

                    </div>

                </div>

            </div>

            <div class="col-xl col-md-6">

                <div class="kpi-card card-danger">

                    <div class="kpi-icon">

                        <i class="ti ti-alert-circle"></i>

                    </div>

                    <div>

                        <small>Overdue</small>

                        <h2>{{ dashboard.summary.overdue }}</h2>

                    </div>

                </div>

            </div>

            <div class="col-xl col-md-6">

                <div class="kpi-card card-secondary">

                    <div class="kpi-icon">

                        <i class="ti ti-circle-x"></i>

                    </div>

                    <div>

                        <small>Cancelled</small>

                        <h2>{{ dashboard.summary.cancelled }}</h2>

                    </div>

                </div>

            </div>

        </div>

        <!-- ================= CHART ================= -->

        <div class="row g-4 mb-4">

            <!-- Activity Type -->

            <div class="col-lg-6">

                <div class="card shadow-sm border-0">

                    <div class="card-header bg-white">

                        <h4 class="mb-0">

                            Activity Type

                        </h4>

                    </div>

                    <div class="card-body">

                        <div
                            v-for="item in dashboard.activity"
                            :key="item.follow_up_type"
                            class="activity-item">

                            <div
                                class="d-flex justify-content-between mb-2">

                                <strong>

                                    {{ item.follow_up_type }}

                                </strong>

                                <span>

                                    {{ item.total }}

                                </span>

                            </div>

                            <div class="progress">

                                <div
                                    class="progress-bar bg-primary"
                                    :style="{
                                        width:item.percentage+'%'
                                    }"
                                ></div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

            <!-- Daily Trend -->

            <div class="col-lg-6">

                <div class="card shadow-sm border-0 h-100">

                    <div class="card-header bg-white">

                        <h4 class="mb-0">

                            Daily Trend

                        </h4>

                    </div>

                    <div class="card-body">

                        <div class="chart-placeholder">

                            <i class="ti ti-chart-line"></i>

                            <h5>

                                Daily Trend Chart

                            </h5>

                            <p class="text-muted">

                                ApexCharts will be placed here

                            </p>

                        </div>

                    </div>

                </div>

            </div>

        </div>

        <!-- ================= BOTTOM ================= -->

        <div class="row g-4">

            <!-- Top Sales -->

            <div class="col-lg-5">

                <div class="card border-0 shadow-sm">

                    <div class="card-header bg-white">

                        <h4 class="mb-0">

                            Top Sales Follow Up

                        </h4>

                    </div>

                    <div class="card-body">

                        <div
                            class="sales-item"
                            v-for="(item,index) in dashboard.top_sales"
                            :key="item.id_user">

                            <div class="rank">

                                <span v-if="index==0">🥇</span>

                                <span v-else-if="index==1">🥈</span>

                                <span v-else-if="index==2">🥉</span>

                                <span v-else>

                                    {{ index+1 }}

                                </span>

                            </div>

                            <div class="flex-grow-1">

                                <div class="fw-bold">

                                    {{ item.fullname }}

                                </div>

                                <small class="text-muted">

                                    {{ item.total_follow_up }} Follow Up

                                </small>

                            </div>

                            <div class="badge bg-primary">

                                {{ item.total_follow_up }}

                            </div>

                        </div>

                    </div>

                </div>

            </div>

            <!-- Overdue -->

            <div class="col-lg-7">

                <div class="card border-0 shadow-sm">

                    <div class="card-header bg-white">

                        <h4 class="mb-0">

                            Overdue Follow Up

                        </h4>

                    </div>

                    <div class="card-body">

                        <div
                            class="overdue-card"
                            v-for="item in dashboard.overdue_list"
                            :key="item.follow_up_code">

                            <div
                                class="d-flex justify-content-between">

                                <div>

                                    <div class="fw-bold">

                                        {{ item.follow_up_code }}

                                    </div>

                                    <div class="text-muted">

                                        {{ item.customer_name }}

                                    </div>

                                </div>

                                <span class="badge bg-danger">

                                    {{ item.overdue_days }} Days

                                </span>

                            </div>

                            <hr>

                            <div class="row">

                                <div class="col-md-4">

                                    <strong>Sales</strong>

                                    <div>

                                        {{ item.sales_name }}

                                    </div>

                                </div>

                                <div class="col-md-4">

                                    <strong>Type</strong>

                                    <div>

                                        {{ item.follow_up_type }}

                                    </div>

                                </div>

                                <div class="col-md-4">

                                    <strong>Status</strong>

                                    <div>

                                        <span
                                            class="badge bg-warning">

                                            {{ item.status }}

                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>

                        <div
                            v-if="dashboard.overdue_list.length===0"
                            class="text-center py-5">

                            <i
                                class="ti ti-circle-check text-success"
                                style="font-size:60px"></i>

                            <h5 class="mt-3">

                                No Overdue Follow Up

                            </h5>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const loading = ref(false)

const dashboard = ref({

    summary: {
        total_follow_up: 12,
        pending: 8,
        done: 4,
        cancelled: 0,
        closed: 0,
        overdue: 2
    },

    activity: [
        {
            follow_up_type: 'CALL',
            total: 1
        },
        {
            follow_up_type: 'EMAIL',
            total: 1
        },
        {
            follow_up_type: 'MEETING',
            total: 1
        },
        {
            follow_up_type: 'VISIT',
            total: 4
        },
        {
            follow_up_type: 'WHATSAPP',
            total: 5
        }
    ],

    result: [],

    top_sales: [
        {
            id_user: 1,
            fullname: 'apregi pratayuda',
            total_follow_up: 3
        },
        {
            id_user: 2,
            fullname: 'sputnix norwey',
            total_follow_up: 3
        },
        {
            id_user: 3,
            fullname: 'bortley england',
            total_follow_up: 2
        },
        {
            id_user: 4,
            fullname: 'willson denmark',
            total_follow_up: 2
        }
    ],

    overdue_list: [
        {
            follow_up_code: 'FU-20260708-XVYR5X',
            customer_name: 'PT Maju Jaya',
            sales_name: 'apregi pratayuda',
            follow_up_type: 'CALL',
            follow_up_at: '2026-07-07 17:28:52',
            status: 'PENDING',
            overdue_days: 3
        },
        {
            follow_up_code: 'FU-20260708-WUXZJP',
            customer_name: 'PT Maju Jaya',
            sales_name: 'apregi pratayuda',
            follow_up_type: 'EMAIL',
            follow_up_at: '2026-07-07 17:28:52',
            status: 'PENDING',
            overdue_days: 3
        }
    ],

    daily_trend: [
        {
            date: '2026-07-07',
            total: 3
        },
        {
            date: '2026-07-10',
            total: 7
        },
        {
            date: '2026-07-12',
            total: 1
        },
        {
            date: '2026-07-13',
            total: 1
        }
    ]

})

/*
|--------------------------------------------------------------------------
| Activity Percentage
|--------------------------------------------------------------------------
*/

const maxActivity = computed(() => {

    return Math.max(
        ...dashboard.value.activity.map(i => i.total),
        1
    )

})

dashboard.value.activity = dashboard.value.activity.map(item => ({

    ...item,

    percentage: (
        item.total /
        maxActivity.value
    ) * 100

}))

/*
|--------------------------------------------------------------------------
| Summary
|--------------------------------------------------------------------------
*/

const completionRate = computed(() => {

    return (
        (
            dashboard.value.summary.done /
            dashboard.value.summary.total_follow_up
        ) * 100
    ).toFixed(1)

})

const pendingRate = computed(() => {

    return (
        (
            dashboard.value.summary.pending /
            dashboard.value.summary.total_follow_up
        ) * 100
    ).toFixed(1)

})

const overdueRate = computed(() => {

    return (
        (
            dashboard.value.summary.overdue /
            dashboard.value.summary.total_follow_up
        ) * 100
    ).toFixed(1)

})

/*
|--------------------------------------------------------------------------
| Chart Data
|--------------------------------------------------------------------------
*/

const trendCategories = computed(() => {

    return dashboard.value.daily_trend.map(item => item.date)

})

const trendSeries = computed(() => {

    return dashboard.value.daily_trend.map(item => item.total)

})

/*
|--------------------------------------------------------------------------
| Formatter
|--------------------------------------------------------------------------
*/

const formatDate = date => {

    return new Date(date).toLocaleDateString(
        'id-ID',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }
    )

}

const formatDateTime = date => {

    return new Date(date).toLocaleString(
        'id-ID'
    )

}

/*
|--------------------------------------------------------------------------
| Badge Color
|--------------------------------------------------------------------------
*/

const statusClass = status => {

    switch (status) {

        case 'DONE':
            return 'bg-success'

        case 'PENDING':
            return 'bg-warning'

        case 'CANCELLED':
            return 'bg-danger'

        case 'CLOSED':
            return 'bg-primary'

        default:
            return 'bg-secondary'

    }

}

/*
|--------------------------------------------------------------------------
| Overdue Color
|--------------------------------------------------------------------------
*/

const overdueClass = days => {

    if (days >= 7)
        return 'text-danger'

    if (days >= 3)
        return 'text-warning'

    return 'text-success'

}

/*
|--------------------------------------------------------------------------
| Refresh
|--------------------------------------------------------------------------
*/

const refresh = () => {

    loading.value = true

    setTimeout(() => {

        loading.value = false

        console.log('Dashboard refreshed')

    }, 1000)

}

/*
|--------------------------------------------------------------------------
| Future API
|--------------------------------------------------------------------------
*/

// import axios from '@/plugins/axios'
//
// const loadDashboard = async () => {
//
//     loading.value = true
//
//     try {
//
//         const { data } = await axios.get(
//             '/dashboard/manager/follow-up'
//         )
//
//         dashboard.value = data.data
//
//     } finally {
//
//         loading.value = false
//
//     }
//
// }

</script>

<style scoped>

/* ==========================================================
   PAGE
========================================================== */

.followup-dashboard{

    background:#f5f7fb;

    min-height:100vh;

}

/* ==========================================================
   CARD
========================================================== */

.card{

    border:none;

    border-radius:18px;

    overflow:hidden;

    box-shadow:0 10px 30px rgba(15,23,42,.08);

}

.card-header{

    background:#fff;

    padding:22px 24px;

    border-bottom:1px solid #edf2f7;

}

.card-body{

    padding:24px;

}

/* ==========================================================
   KPI
========================================================== */

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

    box-shadow:0 18px 35px rgba(0,0,0,.18);

}

.kpi-card::before{

    content:"";

    position:absolute;

    width:170px;

    height:170px;

    border-radius:50%;

    background:rgba(255,255,255,.08);

    right:-60px;

    top:-70px;

}

.kpi-card::after{

    content:"";

    position:absolute;

    width:120px;

    height:120px;

    border-radius:50%;

    background:rgba(255,255,255,.05);

    left:-35px;

    bottom:-35px;

}

.kpi-icon{

    width:72px;

    height:72px;

    border-radius:18px;

    display:flex;

    align-items:center;

    justify-content:center;

    font-size:32px;

    background:rgba(255,255,255,.15);

    backdrop-filter:blur(8px);

}

.kpi-card h2{

    font-size:40px;

    margin:8px 0 0;

    font-weight:700;

}

.kpi-card small{

    opacity:.9;

}

/* ==========================================================
   KPI COLOR
========================================================== */

.card-indigo{

    background:linear-gradient(135deg,#4f46e5,#6366f1);

}

.card-success{

    background:linear-gradient(135deg,#059669,#10b981);

}

.card-warning{

    background:linear-gradient(135deg,#d97706,#f59e0b);

}

.card-danger{

    background:linear-gradient(135deg,#dc2626,#ef4444);

}

.card-secondary{

    background:linear-gradient(135deg,#64748b,#94a3b8);

}

/* ==========================================================
   ACTIVITY
========================================================== */

.activity-item{

    margin-bottom:25px;

}

.activity-item:last-child{

    margin-bottom:0;

}

.progress{

    height:10px;

    background:#edf2f7;

    border-radius:20px;

}

.progress-bar{

    border-radius:20px;

}

/* ==========================================================
   CHART PLACEHOLDER
========================================================== */

.chart-placeholder{

    height:330px;

    display:flex;

    flex-direction:column;

    justify-content:center;

    align-items:center;

    color:#94a3b8;

}

.chart-placeholder i{

    font-size:70px;

    margin-bottom:20px;

}

.chart-placeholder h5{

    color:#334155;

    font-weight:600;

}

/* ==========================================================
   TOP SALES
========================================================== */

.sales-item{

    display:flex;

    align-items:center;

    gap:16px;

    padding:16px;

    border-radius:14px;

    transition:.3s;

    margin-bottom:12px;

}

.sales-item:last-child{

    margin-bottom:0;

}

.sales-item:hover{

    background:#f8fafc;

    transform:translateX(6px);

}

.rank{

    width:45px;

    font-size:24px;

    text-align:center;

    font-weight:bold;

}

/* ==========================================================
   OVERDUE
========================================================== */

.overdue-card{

    border:1px solid #edf2f7;

    border-radius:16px;

    padding:20px;

    margin-bottom:18px;

    transition:.3s;

    background:#fff;

}

.overdue-card:last-child{

    margin-bottom:0;

}

.overdue-card:hover{

    border-color:#ef4444;

    box-shadow:0 10px 25px rgba(239,68,68,.10);

}

.overdue-card hr{

    margin:18px 0;

}

/* ==========================================================
   BADGE
========================================================== */

.badge{

    border-radius:30px;

    padding:8px 14px;

    font-weight:600;

}

/* ==========================================================
   BUTTON
========================================================== */

.btn{

    border-radius:12px;

}

.btn-primary{

    background:#4f46e5;

    border:none;

}

.btn-primary:hover{

    background:#4338ca;

}

/* ==========================================================
   SCROLLBAR
========================================================== */

::-webkit-scrollbar{

    width:8px;

}

::-webkit-scrollbar-thumb{

    background:#cbd5e1;

    border-radius:20px;

}

/* ==========================================================
   RESPONSIVE
========================================================== */

@media(max-width:992px){

    .kpi-card{

        min-height:120px;

    }

    .kpi-icon{

        width:60px;

        height:60px;

        font-size:28px;

    }

    .kpi-card h2{

        font-size:32px;

    }

}

@media(max-width:768px){

    .sales-item{

        flex-wrap:wrap;

    }

    .rank{

        width:auto;

    }

    .chart-placeholder{

        height:250px;

    }

}

@media(max-width:576px){

    .followup-dashboard{

        padding:15px;

    }

    .kpi-card{

        padding:18px;

    }

    .card-body{

        padding:18px;

    }

}
</style>