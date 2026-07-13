<template>
    <div class="activity-dashboard container-fluid py-4">

        <!-- =========================
            HEADER
        ========================== -->

        <div class="d-flex justify-content-between align-items-center flex-wrap mb-4">

            <div>

                <h2 class="fw-bold mb-1">
                    Activity Dashboard
                </h2>

                <p class="text-muted mb-0">
                    Monitor all CRM activities performed by your sales team.
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

        <!-- =========================
            KPI
        ========================== -->

        <div class="row g-4 mb-4">

            <div class="col-lg-6">

                <div class="kpi-card card-indigo">

                    <div class="kpi-icon">

                        <i class="ti ti-activity"></i>

                    </div>

                    <div>

                        <small>Total Activity</small>

                        <h2>

                            {{ dashboard.summary.total_activity }}

                        </h2>

                        <span class="kpi-text">

                            CRM Activity Recorded

                        </span>

                    </div>

                </div>

            </div>

            <div class="col-lg-6">

                <div class="kpi-card card-success">

                    <div class="kpi-icon">

                        <i class="ti ti-calendar-event"></i>

                    </div>

                    <div>

                        <small>Today's Activity</small>

                        <h2>

                            {{ dashboard.summary.today_activity }}

                        </h2>

                        <span class="kpi-text">

                            Activity Today

                        </span>

                    </div>

                </div>

            </div>

        </div>

        <!-- =========================
            CHART
        ========================== -->

        <div class="row g-4 mb-4">

            <!-- Activity Distribution -->

            <div class="col-lg-5">

                <div class="card dashboard-card h-100">

                    <div class="card-header">

                        <div class="d-flex justify-content-between align-items-center">

                            <div>

                                <h5 class="mb-0">

                                    Activity Distribution

                                </h5>

                                <small class="text-muted">

                                    Activity Type

                                </small>

                            </div>

                            <span class="badge bg-primary">

                                {{ dashboard.activity_type.length }}

                                Types

                            </span>

                        </div>

                    </div>

                    <div class="card-body">

                        <div class="chart-container">

                            <Doughnut
                                :data="activityTypeChart"
                                :options="doughnutOptions"
                            />

                        </div>

                        <hr>

                        <div
                            v-for="item in dashboard.activity_type"
                            :key="item.activity_type"
                            class="activity-stat">

                            <div>

                                <span
                                    class="activity-color"
                                    :class="activityDot(item.activity_type)">
                                </span>

                                {{ item.activity_type }}

                            </div>

                            <strong>

                                {{ item.total }}

                            </strong>

                        </div>

                    </div>

                </div>

            </div>

            <!-- Daily Trend -->

            <div class="col-lg-7">

                <div class="card dashboard-card h-100">

                    <div class="card-header">

                        <div class="d-flex justify-content-between align-items-center">

                            <div>

                                <h5 class="mb-0">

                                    Daily Activity Trend

                                </h5>

                                <small class="text-muted">

                                    Daily CRM Activity

                                </small>

                            </div>

                            <span class="badge bg-success">

                                {{ dashboard.summary.total_activity }}

                            </span>

                        </div>

                    </div>

                    <div class="card-body">

                        <div class="chart-container-lg">

                            <Line
                                :data="dailyTrendChart"
                                :options="lineOptions"
                            />

                        </div>

                    </div>

                </div>

            </div>

        </div>

        <!-- =========================
            TOP SALES + ACTIVITY FEED
        ========================== -->

        <div class="row g-4">

            <!-- Top Sales Activity -->

            <div class="col-lg-5">

                <div class="card dashboard-card h-100">

                    <div class="card-header">

                        <div class="d-flex justify-content-between align-items-center">

                            <div>

                                <h5 class="mb-0">

                                    Top Sales Activity

                                </h5>

                                <small class="text-muted">

                                    Ranked by Total Activity

                                </small>

                            </div>

                        </div>

                    </div>

                    <div class="card-body">

                        <div
                            v-for="(sale, index) in dashboard.top_sales"
                            :key="sale.id_user"
                            class="sales-item">

                            <div class="rank">

                                <i
                                    v-if="index === 0"
                                    class="ti ti-trophy text-warning">
                                </i>

                                <i
                                    v-else-if="index === 1"
                                    class="ti ti-medal text-secondary">
                                </i>

                                <i
                                    v-else-if="index === 2"
                                    class="ti ti-medal text-orange">
                                </i>

                                <span v-else>

                                    {{ index + 1 }}

                                </span>

                            </div>

                            <div class="flex-grow-1">

                                <strong class="text-capitalize">

                                    {{ sale.fullname }}

                                </strong>

                                <div class="text-muted small">

                                    {{ sale.total_activity }} Activity

                                </div>

                            </div>

                            <span class="badge bg-primary">

                                {{ sale.total_activity }}

                            </span>

                        </div>

                        <div
                            v-if="!dashboard.top_sales.length"
                            class="text-muted text-center py-4">

                            No sales activity yet.

                        </div>

                    </div>

                </div>

            </div>

            <!-- Latest Activity -->

            <div class="col-lg-7">

                <div class="card dashboard-card h-100">

                    <div class="card-header">

                        <div class="d-flex justify-content-between align-items-center">

                            <div>

                                <h5 class="mb-0">

                                    Latest Activity

                                </h5>

                                <small class="text-muted">

                                    Recent CRM Activity

                                </small>

                            </div>

                            <span class="badge bg-primary">

                                {{ dashboard.latest_activity.length }}

                                Activity

                            </span>

                        </div>

                    </div>

                    <div class="card-body">

                        <div class="activity-feed">

                            <div
                                v-for="item in dashboard.latest_activity"
                                :key="item.id"
                                class="feed-card">

                                <div class="feed-header">

                                    <span class="feed-title">

                                        {{ item.title }}

                                    </span>

                                    <span
                                        class="badge"
                                        :class="activityBadge(item.activity_type)">

                                        {{ item.activity_type }}

                                    </span>

                                </div>

                                <div class="feed-description">

                                    {{ item.description }}

                                </div>

                                <div class="feed-footer">

                                    <span>

                                        <i class="ti ti-user me-1"></i>

                                        {{ item.sales_name }}

                                    </span>

                                    <span>

                                        <i class="ti ti-building me-1"></i>

                                        {{ item.customer_name }}

                                    </span>

                                    <span>

                                        <i class="ti ti-clock me-1"></i>

                                        {{ formatDateTime(item.activity_at) }}

                                    </span>

                                </div>

                            </div>

                            <div
                                v-if="!dashboard.latest_activity.length"
                                class="text-muted text-center py-4">

                                No recent activity.

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    </div>
</template>


<script setup>
import { ref, computed } from 'vue'

import {
    Chart as ChartJS,
    ArcElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler
} from 'chart.js'

import {
    Doughnut,
    Line
} from 'vue-chartjs'

ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler
)

const loading = ref(false)

const dashboard = ref({

    summary:{
        total_activity:16,
        today_activity:0
    },

    activity_type:[
        {
            activity_type:'CREATE',
            total:8
        },
        {
            activity_type:'RESULT_SUBMITTED',
            total:2
        },
        {
            activity_type:'EXECUTED',
            total:1
        },
        {
            activity_type:'FOLLOW_UP_CREATED',
            total:1
        },
        {
            activity_type:'LEAD_CONVERTED',
            total:1
        },
        {
            activity_type:'NEED_FOLLOW_UP',
            total:1
        },
        {
            activity_type:'NEXT_FOLLOW_UP_CREATED',
            total:1
        },
        {
            activity_type:'DEAL_CLOSED',
            total:1
        }
    ],

    top_sales:[
        {
            id_user:3,
            fullname:'bortley england',
            total_activity:8
        },
        {
            id_user:2,
            fullname:'sputnix norwey',
            total_activity:5
        },
        {
            id_user:4,
            fullname:'willson denmark',
            total_activity:2
        }
    ],

    daily_trend:[
        {
            date:'2026-07-09',
            total:16
        }
    ],

    latest_activity:[
        {
            id:16,
            activity_type:'CREATE',
            title:'Follow Up Created Result Visit Customer',
            description:'Follow up generated automatically after visit Customer VIS-202607-00008',
            activity_at:'2026-07-09 15:16:19',
            sales_name:'sputnix norwey',
            customer_name:'PT Perwira Arthabaja Pasifik (Perwira Steel)'
        },
        {
            id:15,
            activity_type:'CREATE',
            title:'Follow Up Created Result Visit Customer',
            description:'Follow up generated automatically after visit Customer VIS-202607-00007',
            activity_at:'2026-07-09 11:14:49',
            sales_name:'willson denmark',
            customer_name:'PT Sugizindo'
        },
        {
            id:14,
            activity_type:'CREATE',
            title:'Follow Up Created Result Visit Customer',
            description:'Follow up generated automatically after visit Customer VIS-202607-00006',
            activity_at:'2026-07-09 11:09:16',
            sales_name:'willson denmark',
            customer_name:'Asalta Mandiri Agung. PT'
        },
        {
            id:12,
            activity_type:'EXECUTED',
            title:'Follow Up Done',
            description:'Follow up telah diselesaikan',
            activity_at:'2026-07-09 10:58:58',
            sales_name:'sputnix norwey',
            customer_name:'PT Perwira Arthabaja Pasifik (Perwira Steel)'
        },
        {
            id:13,
            activity_type:'LEAD_CONVERTED',
            title:'Lead Converted',
            description:'Lead berhasil dikonversi menjadi customer',
            activity_at:'2026-07-09 10:58:58',
            sales_name:'sputnix norwey',
            customer_name:'PT Perwira Arthabaja Pasifik (Perwira Steel)'
        },
        {
            id:9,
            activity_type:'NEED_FOLLOW_UP',
            title:'Need Another Follow Up',
            description:'Customer requires further follow up',
            activity_at:'2026-07-09 10:48:08',
            sales_name:'bortley england',
            customer_name:'PT. Mayora Indah Tbk / Jayanti'
        },
        {
            id:8,
            activity_type:'RESULT_SUBMITTED',
            title:'Follow Up Completed',
            description:'Kesepakatan Belum terjadi di jadwaklan ulang',
            activity_at:'2026-07-09 10:48:08',
            sales_name:'bortley england',
            customer_name:'PT. Mayora Indah Tbk / Jayanti'
        },
        {
            id:10,
            activity_type:'NEXT_FOLLOW_UP_CREATED',
            title:'Next Follow Up Scheduled',
            description:'System created next follow up',
            activity_at:'2026-07-09 10:48:08',
            sales_name:'bortley england',
            customer_name:'PT. Mayora Indah Tbk / Jayanti'
        },
        {
            id:11,
            activity_type:'FOLLOW_UP_CREATED',
            title:'New Follow Up Created',
            description:'Generated automatically',
            activity_at:'2026-07-09 10:48:08',
            sales_name:'bortley england',
            customer_name:'PT. Mayora Indah Tbk / Jayanti'
        },
        {
            id:7,
            activity_type:'DEAL_CLOSED',
            title:'Deal Closed Successfully',
            description:'Customer converted to deal',
            activity_at:'2026-07-09 10:46:55',
            sales_name:'bortley england',
            customer_name:'PT. Nipama Mandiri'
        },
        {
            id:6,
            activity_type:'RESULT_SUBMITTED',
            title:'Follow Up Completed',
            description:'Pembelian Berhasil',
            activity_at:'2026-07-09 10:46:55',
            sales_name:'bortley england',
            customer_name:'PT. Nipama Mandiri'
        },
        {
            id:5,
            activity_type:'CREATE',
            title:'Follow Up Created Result Visit Customer',
            description:'Follow up generated automatically after visit Customer VIS-202607-00005',
            activity_at:'2026-07-09 10:42:32',
            sales_name:'bortley england',
            customer_name:'PT. Mayora Indah Tbk / Jayanti'
        },
        {
            id:4,
            activity_type:'CREATE',
            title:'Follow Up Created Result Visit Customer',
            description:'Follow up generated automatically after visit Customer VIS-202607-00004',
            activity_at:'2026-07-09 10:37:35',
            sales_name:'bortley england',
            customer_name:'PT. Nipama Mandiri'
        },
        {
            id:2,
            activity_type:'CREATE',
            title:'Follow Up Created Result Visit Customer',
            description:'Follow up generated automatically after visit Customer VIS-202607-00002',
            activity_at:'2026-07-09 10:27:08',
            sales_name:'sputnix norwey',
            customer_name:'PT. KENCANA GEMILANG (MIYAKO)'
        },
        {
            id:1,
            activity_type:'CREATE',
            title:'Follow Up Created Result Visit Customer',
            description:'Follow up generated automatically after visit Customer VIS-202607-00001',
            activity_at:'2026-07-09 10:22:00',
            sales_name:'sputnix norwey',
            customer_name:'PT. Paragon Technology And Innovation - Jatake 2'
        }
    ]

})

/*
|--------------------------------------------------------------------------
| Doughnut Chart
|--------------------------------------------------------------------------
*/

const activityTypeChart = computed(() => ({

    labels: dashboard.value.activity_type.map(
        item => item.activity_type
    ),

    datasets:[
        {

            data: dashboard.value.activity_type.map(
                item => item.total
            ),

            backgroundColor:[
                '#6366F1',
                '#F59E0B',
                '#10B981',
                '#06B6D4',
                '#8B5CF6',
                '#FB923C',
                '#0EA5E9',
                '#EF4444'
            ],

            borderWidth:0,

            hoverOffset:8

        }

    ]

}))

const doughnutOptions={

    responsive:true,

    maintainAspectRatio:false,

    cutout:'72%',

    plugins:{

        legend:{
            display:false
        }

    }

}

/*
|--------------------------------------------------------------------------
| Line Chart
|--------------------------------------------------------------------------
*/

const dailyTrendChart = computed(() => ({

    labels: dashboard.value.daily_trend.map(
        item => item.date
    ),

    datasets:[

        {

            label:'Activity',

            data: dashboard.value.daily_trend.map(
                item => item.total
            ),

            borderColor:'#4F46E5',

            backgroundColor:'rgba(99,102,241,.12)',

            fill:true,

            tension:.35,

            pointRadius:5,

            pointHoverRadius:8

        }

    ]

}))

const lineOptions={

    responsive:true,

    maintainAspectRatio:false,

    plugins:{

        legend:{
            display:false
        }

    },

    scales:{

        y:{
            beginAtZero:true,
            ticks:{
                precision:0
            }
        }

    }

}

/*
|--------------------------------------------------------------------------
| Formatter
|--------------------------------------------------------------------------
*/

const formatDateTime=(date)=>{

    return new Intl.DateTimeFormat(
        'id-ID',
        {

            day:'2-digit',

            month:'short',

            year:'numeric',

            hour:'2-digit',

            minute:'2-digit'

        }

    ).format(new Date(date))

}

/*
|--------------------------------------------------------------------------
| Badge
|--------------------------------------------------------------------------
*/

const activityBadge=(type)=>{

    switch(type){

        case 'CREATE':
            return 'badge-primary'

        case 'EXECUTED':
            return 'badge-success'

        case 'RESULT_SUBMITTED':
            return 'badge-warning'

        case 'FOLLOW_UP_CREATED':
            return 'badge-info'

        case 'NEXT_FOLLOW_UP_CREATED':
            return 'badge-secondary'

        case 'LEAD_CONVERTED':
            return 'badge-purple'

        case 'DEAL_CLOSED':
            return 'badge-danger'

        case 'NEED_FOLLOW_UP':
            return 'badge-orange'

        default:
            return 'badge-dark'

    }

}

/*
|--------------------------------------------------------------------------
| Dot Color
|--------------------------------------------------------------------------
*/

const activityDot=(type)=>{

    switch(type){

        case 'CREATE':
            return 'dot-primary'

        case 'EXECUTED':
            return 'dot-success'

        case 'RESULT_SUBMITTED':
            return 'dot-warning'

        case 'FOLLOW_UP_CREATED':
            return 'dot-info'

        case 'NEXT_FOLLOW_UP_CREATED':
            return 'dot-secondary'

        case 'LEAD_CONVERTED':
            return 'dot-purple'

        case 'DEAL_CLOSED':
            return 'dot-danger'

        case 'NEED_FOLLOW_UP':
            return 'dot-orange'

        default:
            return 'dot-dark'

    }

}

/*
|--------------------------------------------------------------------------
| Refresh
|--------------------------------------------------------------------------
*/

const refresh=()=>{

    loading.value=true

    setTimeout(()=>{

        loading.value=false

    },800)

}

/*
|--------------------------------------------------------------------------
| Future API
|--------------------------------------------------------------------------
*/

// const loadDashboard = async () => {
//
//     loading.value = true
//
//     try {
//
//         const { data } = await axios.get(
//             '/dashboard/manager/activity'
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

.activity-dashboard{

    min-height:100vh;

    background:#f5f7fb;

}

/* ==========================================================
    CARD
========================================================== */

.dashboard-card{

    border:none;

    border-radius:18px;

    box-shadow:0 10px 30px rgba(15,23,42,.08);

    overflow:hidden;

}

.dashboard-card .card-header{

    background:#fff;

    border-bottom:1px solid #edf2f7;

    padding:20px 24px;

}

.dashboard-card .card-body{

    padding:24px;

}

/* ==========================================================
    KPI
========================================================== */

.kpi-card{

    position:relative;

    overflow:hidden;

    min-height:145px;

    border-radius:18px;

    display:flex;

    justify-content:space-between;

    align-items:center;

    padding:24px;

    color:#fff;

    transition:.35s;

    cursor:pointer;

}

.kpi-card:hover{

    transform:translateY(-6px);

    box-shadow:0 20px 35px rgba(0,0,0,.18);

}

.kpi-card::before{

    content:"";

    position:absolute;

    width:180px;

    height:180px;

    border-radius:50%;

    background:rgba(255,255,255,.08);

    right:-70px;

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

    background:rgba(255,255,255,.15);

    backdrop-filter:blur(10px);

    font-size:32px;

}

.kpi-card h2{

    margin:8px 0 4px;

    font-size:40px;

    font-weight:700;

}

.kpi-text{

    opacity:.9;

    font-size:.85rem;

}

/* ==========================================================
    COLOR
========================================================== */

.card-indigo{

    background:linear-gradient(135deg,#4f46e5,#6366f1);

}

.card-success{

    background:linear-gradient(135deg,#059669,#10b981);

}

/* ==========================================================
    CHART
========================================================== */

.chart-container{

    height:280px;

    position:relative;

}

.chart-container-lg{

    height:340px;

    position:relative;

}

/* ==========================================================
    ACTIVITY TYPE
========================================================== */

.activity-stat{

    display:flex;

    justify-content:space-between;

    align-items:center;

    padding:10px 0;

    border-bottom:1px dashed #edf2f7;

}

.activity-stat:last-child{

    border-bottom:none;

}

.activity-color{

    width:10px;

    height:10px;

    border-radius:50%;

    display:inline-block;

    margin-right:10px;

}

/* ==========================================================
    TOP SALES
========================================================== */

.sales-item{

    display:flex;

    align-items:center;

    gap:16px;

    padding:14px;

    border-radius:14px;

    transition:.25s;

    margin-bottom:10px;

}

.sales-item:hover{

    background:#f8fafc;

    transform:translateX(6px);

}

.rank{

    width:42px;

    text-align:center;

    font-size:22px;

}

/* ==========================================================
    ACTIVITY FEED
========================================================== */

.activity-feed{

    display:flex;

    flex-direction:column;

    gap:18px;

}

.feed-card{

    position:relative;

    border:1px solid #edf2f7;

    border-radius:16px;

    padding:18px;

    transition:.3s;

    background:#fff;

}

.feed-card:hover{

    transform:translateY(-4px);

    box-shadow:0 15px 25px rgba(0,0,0,.08);

}

.feed-header{

    display:flex;

    justify-content:space-between;

    align-items:center;

    margin-bottom:10px;

}

.feed-title{

    font-size:16px;

    font-weight:600;

}

.feed-description{

    color:#64748b;

    margin-bottom:14px;

    line-height:1.6;

}

.feed-footer{

    display:flex;

    justify-content:space-between;

    flex-wrap:wrap;

    gap:10px;

    color:#64748b;

    font-size:.88rem;

}

/* ==========================================================
    BADGE
========================================================== */

.badge{

    padding:7px 14px;

    border-radius:30px;

    font-weight:600;

}

.badge-primary{

    background:#EEF2FF;

    color:#4F46E5;

}

.badge-success{

    background:#ECFDF5;

    color:#059669;

}

.badge-warning{

    background:#FEF3C7;

    color:#B45309;

}

.badge-danger{

    background:#FEE2E2;

    color:#DC2626;

}

.badge-info{

    background:#ECFEFF;

    color:#0891B2;

}

.badge-purple{

    background:#F3E8FF;

    color:#7C3AED;

}

.badge-orange{

    background:#FFF7ED;

    color:#EA580C;

}

.badge-secondary{

    background:#F1F5F9;

    color:#475569;

}

.badge-dark{

    background:#E2E8F0;

    color:#1E293B;

}

/* ==========================================================
    DOT COLOR
========================================================== */

.dot-primary{background:#4F46E5;}
.dot-success{background:#10B981;}
.dot-warning{background:#F59E0B;}
.dot-danger{background:#EF4444;}
.dot-info{background:#06B6D4;}
.dot-secondary{background:#64748B;}
.dot-purple{background:#8B5CF6;}
.dot-orange{background:#F97316;}
.dot-dark{background:#334155;}

/* ==========================================================
    BUTTON
========================================================== */

.btn{

    border-radius:12px;

}

/* ==========================================================
    ANIMATION
========================================================== */

.dashboard-card,
.kpi-card{

    animation:fadeUp .4s ease;

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

/* ==========================================================
    RESPONSIVE
========================================================== */

@media(max-width:992px){

    .kpi-card{

        min-height:120px;

    }

    .kpi-card h2{

        font-size:32px;

    }

    .chart-container-lg{

        height:280px;

    }

}

@media(max-width:768px){

    .feed-footer{

        flex-direction:column;

        align-items:flex-start;

    }

    .chart-container,

    .chart-container-lg{

        height:240px;

    }

}

</style>