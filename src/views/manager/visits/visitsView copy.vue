<template>

    <div class="visit-dashboard container-fluid py-4">

        <!-- =======================================================
            HEADER
        ======================================================== -->

        <div class="d-flex justify-content-between align-items-center flex-wrap mb-4">

            <div>

                <h2 class="fw-bold mb-1">

                    Visit Dashboard

                </h2>

                <p class="text-muted mb-0">

                    Sales Visit Monitoring

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

        <!-- =======================================================
            KPI
        ======================================================== -->

        <div class="row g-4 mb-4">

            <div class="col-xl col-md-6">

                <div class="kpi-card card-indigo">

                    <div class="kpi-icon">

                        <i class="ti ti-map-pin"></i>

                    </div>

                    <div>

                        <small>Total Visit</small>

                        <h2>

                            {{ dashboard.summary.total_visit }}

                        </h2>

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

                        <h2>

                            {{ dashboard.summary.done }}

                        </h2>

                    </div>

                </div>

            </div>

            <div class="col-xl col-md-6">

                <div class="kpi-card card-danger">

                    <div class="kpi-icon">

                        <i class="ti ti-alert-circle"></i>

                    </div>

                    <div>

                        <small>Complaint</small>

                        <h2>

                            {{ dashboard.summary.complaint }}

                        </h2>

                    </div>

                </div>

            </div>

            <div class="col-xl col-md-6">

                <div class="kpi-card card-warning">

                    <div class="kpi-icon">

                        <i class="ti ti-shopping-cart-plus"></i>

                    </div>

                    <div>

                        <small>Potential Order</small>

                        <h2>

                            {{ dashboard.summary.potential_order }}

                        </h2>

                    </div>

                </div>

            </div>

            <div class="col-xl col-md-6">

                <div class="kpi-card card-info">

                    <div class="kpi-icon">

                        <i class="ti ti-clock-hour-4"></i>

                    </div>

                    <div>

                        <small>Avg Duration</small>

                        <h2>

                            {{ dashboard.summary.average_duration_minutes }}

                        </h2>

                    </div>

                </div>

            </div>

        </div>

        <!-- =======================================================
            CHART
        ======================================================== -->

        <div class="row g-4 mb-4">

            <div class="col-lg-5">

                <div class="card border-0 shadow-sm h-100">

                    <div class="card-header bg-white">

                        <h4 class="mb-0">

                            Visit Result

                        </h4>

                    </div>

                    <div class="card-body">

                        <div class="chart-box">

                            <Doughnut
                                :data="visitResultChart"
                                :options="doughnutOptions"
                            />

                        </div>

                    </div>

                </div>

            </div>

            <div class="col-lg-7">

                <div class="card border-0 shadow-sm h-100">

                    <div class="card-header bg-white">

                        <h4 class="mb-0">

                            Daily Trend

                        </h4>

                    </div>

                    <div class="card-body">

                        <div class="chart-box">

                            <Line
                                :data="dailyTrendChart"
                                :options="lineOptions"
                            />

                        </div>

                    </div>

                </div>

            </div>

        </div>

        <!-- =======================================================
            BOTTOM
        ======================================================== -->

        <div class="row g-4">

            <!-- TOP SALES -->

            <div class="col-lg-4">

                <div class="card border-0 shadow-sm">

                    <div class="card-header bg-white">

                        <h4 class="mb-0">

                            Top Sales Visit

                        </h4>

                    </div>

                    <div class="card-body">

                        <div
                            v-for="(item,index) in dashboard.top_sales"
                            :key="item.id_user"
                            class="sales-item">

                            <div class="rank">

                                <span v-if="index==0">🥇</span>

                                <span v-else-if="index==1">🥈</span>

                                <span v-else-if="index==2">🥉</span>

                                <span v-else>#{{ index+1 }}</span>

                            </div>

                            <div class="flex-grow-1">

                                <div class="fw-bold">

                                    {{ item.fullname }}

                                </div>

                                <small class="text-muted">

                                    {{ item.total_visit }} Visit

                                </small>

                            </div>

                            <div class="badge bg-primary">

                                {{ item.total_visit }}

                            </div>

                        </div>

                    </div>

                </div>

            </div>

            <!-- RECENT VISIT -->

            <div class="col-lg-8">

                <div class="card border-0 shadow-sm">

                    <div class="card-header bg-white">

                        <h4 class="mb-0">

                            Recent Visit

                        </h4>

                    </div>

                    <div class="card-body">

                        <div
                            class="visit-item"
                            v-for="visit in dashboard.visit_list"
                            :key="visit.visit_code">

                            <div class="visit-left">

                                <div class="visit-dot"></div>

                            </div>

                            <div class="visit-content">

                                <div
                                    class="d-flex justify-content-between flex-wrap">

                                    <div>

                                        <div class="fw-bold">

                                            {{ visit.customer_name }}

                                        </div>

                                        <small class="text-muted">

                                            {{ visit.visit_code }}

                                        </small>

                                    </div>

                                    <span class="badge bg-success">

                                        {{ visit.visit_status }}

                                    </span>

                                </div>

                                <div class="mt-2 text-muted">

                                    <i class="ti ti-user me-2"></i>

                                    {{ visit.sales_name }}

                                </div>

                                <div class="mt-1 text-muted">

                                    <i class="ti ti-calendar me-2"></i>

                                    {{ formatDateTime(visit.visit_at) }}

                                </div>

                                <div class="mt-3 d-flex gap-2 flex-wrap">

                                    <span class="badge bg-primary">

                                        {{ visit.visit_result }}

                                    </span>

                                    <span
                                        v-if="visit.has_complaint"
                                        class="badge bg-danger">

                                        Complaint

                                    </span>

                                    <span
                                        v-if="visit.has_potential_order"
                                        class="badge bg-warning text-dark">

                                        Potential Order

                                    </span>

                                </div>

                            </div>

                        </div>

                        <div
                            v-if="dashboard.visit_list.length===0"
                            class="text-center py-5">

                            <i
                                class="ti ti-map-pin-off text-secondary"
                                style="font-size:60px"></i>

                            <h5 class="mt-3">

                                No Visit Data

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
        total_visit:8,
        done:8,
        ongoing:0,
        checked_in:0,
        cancelled:0,
        complaint:1,
        potential_order:2,
        average_duration_minutes:1.6
    },

    visit_result:[
        {
            visit_result:'complaint_handled',
            total:1
        },
        {
            visit_result:'improved',
            total:1
        },
        {
            visit_result:'maintained',
            total:4
        },
        {
            visit_result:'potential_customers',
            total:1
        },
        {
            visit_result:'upsell_identified',
            total:1
        }
    ],

    top_sales:[
        {
            id_user:2,
            fullname:'sputnix norwey',
            total_visit:4
        },
        {
            id_user:3,
            fullname:'bortley england',
            total_visit:2
        },
        {
            id_user:4,
            fullname:'willson denmark',
            total_visit:2
        }
    ],

    daily_trend:[
        {
            date:'2026-07-09',
            total:8
        }
    ],

    visit_list:[
        {
            visit_code:'VIS-202607-00008',
            customer_name:'PT Perwira Arthabaja Pasifik',
            sales_name:'sputnix norwey',
            visit_at:'2026-07-09 15:13:04',
            visit_status:'DONE',
            visit_result:'maintained',
            has_complaint:false,
            has_potential_order:false
        },
        {
            visit_code:'VIS-202607-00007',
            customer_name:'PT Sugizindo',
            sales_name:'willson denmark',
            visit_at:'2026-07-09 11:13:55',
            visit_status:'DONE',
            visit_result:'maintained',
            has_complaint:false,
            has_potential_order:false
        },
        {
            visit_code:'VIS-202607-00005',
            customer_name:'PT Mayora',
            sales_name:'bortley england',
            visit_at:'2026-07-09 10:41:19',
            visit_status:'DONE',
            visit_result:'upsell_identified',
            has_complaint:false,
            has_potential_order:true
        }
    ]

})

/* ==========================================================
    Doughnut Chart
========================================================== */

const visitResultChart = computed(() => ({

    labels: dashboard.value.visit_result.map(item=>item.visit_result),

    datasets:[

        {

            data: dashboard.value.visit_result.map(item=>item.total),

            backgroundColor:[
                '#6366F1',
                '#10B981',
                '#F59E0B',
                '#EF4444',
                '#06B6D4'
            ],

            borderWidth:0

        }

    ]

}))

const doughnutOptions={

    responsive:true,

    maintainAspectRatio:false,

    cutout:'70%',

    plugins:{

        legend:{

            position:'bottom'

        }

    }

}

/* ==========================================================
    Line Chart
========================================================== */

const dailyTrendChart=computed(()=>({

    labels:dashboard.value.daily_trend.map(item=>item.date),

    datasets:[

        {

            label:'Visit',

            data:dashboard.value.daily_trend.map(item=>item.total),

            borderColor:'#4F46E5',

            backgroundColor:'rgba(99,102,241,.15)',

            fill:true,

            tension:.35,

            pointRadius:5,

            pointHoverRadius:7

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

/* ==========================================================
    Summary
========================================================== */

const completionRate=computed(()=>{

    return (

        dashboard.value.summary.done

        /

        dashboard.value.summary.total_visit

    )*100

})

/* ==========================================================
    Formatter
========================================================== */

const formatDateTime=(date)=>{

    return new Date(date).toLocaleString(

        'id-ID',

        {

            day:'2-digit',

            month:'short',

            year:'numeric',

            hour:'2-digit',

            minute:'2-digit'

        }

    )

}

/* ==========================================================
    Refresh
========================================================== */

const refresh=()=>{

    loading.value=true

    setTimeout(()=>{

        loading.value=false

        console.log('Dashboard refreshed')

    },800)

}

/* ==========================================================
    Future API
========================================================== */

// import axios from '@/plugins/axios'
//
// const loadDashboard = async () => {
//
//     loading.value = true
//
//     try {
//
//         const { data } = await axios.get(
//
//             '/dashboard/manager/visit'
//
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

.visit-dashboard{
    min-height:100vh;
    background:#f5f7fb;
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
    padding:22px 24px;
    background:#fff;
    border-bottom:1px solid #edf2f7;
}

.card-body{
    padding:24px;
}

/* ==========================================================
   KPI CARD
========================================================== */

.kpi-card{

    position:relative;

    overflow:hidden;

    display:flex;

    justify-content:space-between;

    align-items:center;

    min-height:140px;

    padding:24px;

    border-radius:18px;

    color:#fff;

    cursor:pointer;

    transition:.35s;

}

.kpi-card:hover{

    transform:translateY(-8px);

    box-shadow:0 18px 40px rgba(0,0,0,.15);

}

.kpi-card::before{

    content:"";

    position:absolute;

    width:170px;

    height:170px;

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

    left:-40px;

    bottom:-40px;

}

.kpi-icon{

    width:72px;

    height:72px;

    border-radius:18px;

    background:rgba(255,255,255,.18);

    display:flex;

    justify-content:center;

    align-items:center;

    font-size:32px;

    backdrop-filter:blur(8px);

}

.kpi-card small{

    opacity:.9;

}

.kpi-card h2{

    margin-top:10px;

    font-size:40px;

    font-weight:700;

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

.card-danger{

    background:linear-gradient(135deg,#dc2626,#ef4444);

}

.card-warning{

    background:linear-gradient(135deg,#d97706,#f59e0b);

}

.card-info{

    background:linear-gradient(135deg,#0284c7,#06b6d4);

}

/* ==========================================================
   CHART
========================================================== */

.chart-box{

    position:relative;

    width:100%;

    height:340px;

}

/* ==========================================================
   TOP SALES
========================================================== */

.sales-item{

    display:flex;

    align-items:center;

    gap:18px;

    padding:16px;

    border-radius:14px;

    transition:.3s;

    margin-bottom:14px;

}

.sales-item:last-child{

    margin-bottom:0;

}

.sales-item:hover{

    background:#f8fafc;

    transform:translateX(8px);

}

.rank{

    width:45px;

    text-align:center;

    font-size:24px;

    font-weight:bold;

}

/* ==========================================================
   VISIT TIMELINE
========================================================== */

.visit-item{

    position:relative;

    display:flex;

    gap:18px;

    margin-bottom:28px;

}

.visit-item:last-child{

    margin-bottom:0;

}

.visit-left{

    width:30px;

    display:flex;

    justify-content:center;

    position:relative;

}

.visit-left::after{

    content:"";

    position:absolute;

    top:22px;

    bottom:-32px;

    width:2px;

    background:#dbe4f0;

}

.visit-item:last-child .visit-left::after{

    display:none;

}

.visit-dot{

    width:14px;

    height:14px;

    border-radius:50%;

    background:#4f46e5;

    margin-top:8px;

    box-shadow:0 0 0 6px rgba(79,70,229,.12);

}

.visit-content{

    flex:1;

    background:#fff;

    border:1px solid #edf2f7;

    border-radius:16px;

    padding:18px;

    transition:.3s;

}

.visit-content:hover{

    border-color:#6366f1;

    box-shadow:0 12px 25px rgba(79,70,229,.10);

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

@media(max-width:1200px){

    .chart-box{

        height:300px;

    }

}

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

    .chart-box{

        height:260px;

    }

    .sales-item{

        flex-wrap:wrap;

    }

    .visit-item{

        gap:12px;

    }

    .visit-content{

        padding:15px;

    }

}

@media(max-width:576px){

    .visit-dashboard{

        padding:16px;

    }

    .kpi-card{

        padding:18px;

    }

    .card-body{

        padding:18px;

    }

    .chart-box{

        height:220px;

    }

}

</style>