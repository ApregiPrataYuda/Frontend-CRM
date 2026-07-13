<template>
    <div class="conversion-dashboard container-fluid py-4">

        <!-- =========================
            HEADER
        ========================== -->

        <div class="d-flex justify-content-between align-items-center flex-wrap mb-4">

            <div>

                <h2 class="fw-bold mb-1">
                    Conversion Dashboard
                </h2>

                <p class="text-muted mb-0">
                    Monitor how leads convert into customers across your sales team.
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

            <div class="col-lg-3 col-md-6">

                <div class="kpi-card card-indigo">

                    <div class="kpi-icon">

                        <i class="ti ti-target-arrow"></i>

                    </div>

                    <div>

                        <small>Total Lead</small>

                        <h2>

                            {{ dashboard.summary.total_lead }}

                        </h2>

                        <span class="kpi-text">

                            Leads Recorded

                        </span>

                    </div>

                </div>

            </div>

            <div class="col-lg-3 col-md-6">

                <div class="kpi-card card-success">

                    <div class="kpi-icon">

                        <i class="ti ti-circle-check"></i>

                    </div>

                    <div>

                        <small>Converted</small>

                        <h2>

                            {{ dashboard.summary.converted }}

                        </h2>

                        <span class="kpi-text">

                            Became Customer

                        </span>

                    </div>

                </div>

            </div>

            <div class="col-lg-3 col-md-6">

                <div class="kpi-card card-rose">

                    <div class="kpi-icon">

                        <i class="ti ti-circle-x"></i>

                    </div>

                    <div>

                        <small>Not Converted</small>

                        <h2>

                            {{ dashboard.summary.not_converted }}

                        </h2>

                        <span class="kpi-text">

                            Still In Progress

                        </span>

                    </div>

                </div>

            </div>

            <div class="col-lg-3 col-md-6">

                <div class="kpi-card card-violet">

                    <div class="kpi-icon">

                        <i class="ti ti-percentage"></i>

                    </div>

                    <div>

                        <small>Conversion Rate</small>

                        <h2>

                            {{ dashboard.summary.conversion_rate }}%

                        </h2>

                        <div class="kpi-progress">

                            <div
                                class="kpi-progress-fill"
                                :style="{ width: dashboard.summary.conversion_rate + '%' }">
                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>

        <!-- =========================
            CHART
        ========================== -->

        <div class="row g-4 mb-4">

            <!-- Sales Conversion -->

            <div class="col-lg-5">

                <div class="card dashboard-card h-100">

                    <div class="card-header">

                        <div class="d-flex justify-content-between align-items-center">

                            <div>

                                <h5 class="mb-0">

                                    Sales Conversion

                                </h5>

                                <small class="text-muted">

                                    Ranked by Leads Converted

                                </small>

                            </div>

                        </div>

                    </div>

                    <div class="card-body">

                        <div
                            v-for="(sale, index) in dashboard.sales_conversion"
                            :key="sale.id_user"
                            class="sales-item">

                            <div class="rank">

                                <i
                                    v-if="index === 0 && sale.total_conversion > 0"
                                    class="ti ti-trophy text-warning">
                                </i>

                                <i
                                    v-else-if="index === 1 && sale.total_conversion > 0"
                                    class="ti ti-medal text-secondary">
                                </i>

                                <i
                                    v-else-if="index === 2 && sale.total_conversion > 0"
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

                                    {{ sale.total_conversion }} Conversion

                                </div>

                            </div>

                            <span
                                class="badge"
                                :class="sale.total_conversion > 0 ? 'bg-primary' : 'badge-secondary'">

                                {{ sale.total_conversion }}

                            </span>

                        </div>

                        <div
                            v-if="!dashboard.sales_conversion.length"
                            class="text-muted text-center py-4">

                            No conversion data yet.

                        </div>

                    </div>

                </div>

            </div>

            <!-- Daily Conversion Trend -->

            <div class="col-lg-7">

                <div class="card dashboard-card h-100">

                    <div class="card-header">

                        <div class="d-flex justify-content-between align-items-center">

                            <div>

                                <h5 class="mb-0">

                                    Daily Conversion Trend

                                </h5>

                                <small class="text-muted">

                                    Leads Converted Over Time

                                </small>

                            </div>

                            <span class="badge bg-success">

                                {{ dashboard.summary.converted }}

                            </span>

                        </div>

                    </div>

                    <div class="card-body">

                        <div class="chart-container-lg">

                            <Line
                                :data="dailyConversionChart"
                                :options="lineOptions"
                            />

                        </div>

                    </div>

                </div>

            </div>

        </div>

        <!-- =========================
            LATEST CONVERSION
        ========================== -->

        <div class="row g-4">

            <div class="col-12">

                <div class="card dashboard-card">

                    <div class="card-header">

                        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">

                            <div>

                                <h5 class="mb-0">

                                    Latest Conversion

                                </h5>

                                <small class="text-muted">

                                    Recently Converted Customers

                                </small>

                            </div>

                            <div class="d-flex gap-2">

                                <span
                                    v-for="item in dashboard.customer_status"
                                    :key="item.customer_status"
                                    class="badge"
                                    :class="statusBadge(item.customer_status)">

                                    {{ item.customer_status }}: {{ item.total }}

                                </span>

                            </div>

                        </div>

                    </div>

                    <div class="card-body">

                        <div class="activity-feed">

                            <div
                                v-for="item in dashboard.latest_conversion"
                                :key="item.customer_code"
                                class="feed-card">

                                <div class="feed-header">

                                    <span class="feed-title">

                                        {{ item.company_name }}

                                    </span>

                                    <span
                                        class="badge"
                                        :class="statusBadge(item.customer_status)">

                                        {{ item.customer_status }}

                                    </span>

                                </div>

                                <div class="feed-footer">

                                    <span>

                                        <i class="ti ti-id me-1"></i>

                                        {{ item.customer_code }}

                                    </span>

                                    <span>

                                        <i class="ti ti-user me-1"></i>

                                        {{ item.sales_name }}

                                    </span>

                                    <span>

                                        <i class="ti ti-clock me-1"></i>

                                        {{ formatDateTime(item.created_at) }}

                                    </span>

                                </div>

                            </div>

                            <div
                                v-if="!dashboard.latest_conversion.length"
                                class="text-muted text-center py-4">

                                No conversions yet.

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
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler
} from 'chart.js'

import {
    Line
} from 'vue-chartjs'

ChartJS.register(
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
        total_lead:2,
        converted:2,
        not_converted:0,
        conversion_rate:100
    },

    sales_conversion:[
        {
            id_user:1,
            fullname:'apregi pratayuda',
            total_conversion:1
        },
        {
            id_user:4,
            fullname:'willson denmark',
            total_conversion:1
        },
        {
            id_user:2,
            fullname:'sputnix norwey',
            total_conversion:0
        },
        {
            id_user:3,
            fullname:'bortley england',
            total_conversion:0
        }
    ],

    daily_conversion:[
        {
            date:'2026-07-10',
            total:2
        }
    ],

    customer_status:[
        {
            customer_status:'Active',
            total:2
        }
    ],

    latest_conversion:[
        {
            customer_code:'CUST-000001',
            company_name:'PT Maju Jaya',
            sales_name:'apregi pratayuda',
            customer_status:'Active',
            created_at:'2026-07-10 15:08:18'
        },
        {
            customer_code:'CUST-000002',
            company_name:'PT Sukses Makmur',
            sales_name:'willson denmark',
            customer_status:'Active',
            created_at:'2026-07-10 15:08:18'
        }
    ]

})

/*
|--------------------------------------------------------------------------
| Line Chart (Daily Conversion)
|--------------------------------------------------------------------------
*/

const dailyConversionChart = computed(() => ({

    labels: dashboard.value.daily_conversion.map(
        item => item.date
    ),

    datasets:[

        {

            label:'Converted',

            data: dashboard.value.daily_conversion.map(
                item => item.total
            ),

            borderColor:'#7C3AED',

            backgroundColor:'rgba(139,92,246,.12)',

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
| Badge - Customer Status
|--------------------------------------------------------------------------
*/

const statusBadge=(status)=>{

    switch(status){

        case 'Active':
            return 'badge-success'

        case 'Dormant':
            return 'badge-secondary'

        case 'Inactive':
            return 'badge-dark'

        case 'Lost':
            return 'badge-danger'

        default:
            return 'badge-dark'

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
//             '/api/dashboard/manager/conversion'
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

.conversion-dashboard{

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

    padding:22px;

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

    width:64px;

    height:64px;

    border-radius:16px;

    display:flex;

    align-items:center;

    justify-content:center;

    background:rgba(255,255,255,.15);

    backdrop-filter:blur(10px);

    font-size:28px;

    flex-shrink:0;

}

.kpi-card h2{

    margin:8px 0 4px;

    font-size:36px;

    font-weight:700;

}

.kpi-text{

    opacity:.9;

    font-size:.85rem;

}

.kpi-progress{

    width:100%;

    height:6px;

    border-radius:10px;

    background:rgba(255,255,255,.25);

    overflow:hidden;

    margin-top:6px;

}

.kpi-progress-fill{

    height:100%;

    border-radius:10px;

    background:#fff;

    transition:width .5s ease;

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

.card-rose{

    background:linear-gradient(135deg,#e11d48,#f43f5e);

}

.card-violet{

    background:linear-gradient(135deg,#7c3aed,#8b5cf6);

}

/* ==========================================================
    CHART
========================================================== */

.chart-container-lg{

    height:340px;

    position:relative;

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

    gap:10px;

    margin-bottom:10px;

}

.feed-title{

    font-size:16px;

    font-weight:600;

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

        font-size:30px;

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

    .chart-container-lg{

        height:240px;

    }

}

</style>