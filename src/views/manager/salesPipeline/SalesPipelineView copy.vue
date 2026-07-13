<template>

    <div class="pipeline-dashboard container-fluid py-4">

        <!-- =======================================================
            HEADER
        ======================================================== -->

        <div class="d-flex justify-content-between align-items-center flex-wrap mb-4">

            <div>

                <h2 class="fw-bold mb-1">

                    Sales Pipeline Dashboard

                </h2>

                <p class="text-muted mb-0">

                    Lead Conversion Monitoring

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

                        <i class="ti ti-target-arrow"></i>

                    </div>

                    <div>

                        <small>Total Lead</small>

                        <h2>

                            {{ dashboard.summary.total_lead }}

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

                        <small>Converted</small>

                        <h2>

                            {{ dashboard.summary.converted_lead }}

                        </h2>

                    </div>

                </div>

            </div>

            <div class="col-xl col-md-6">

                <div class="kpi-card card-warning">

                    <div class="kpi-icon">

                        <i class="ti ti-hourglass"></i>

                    </div>

                    <div>

                        <small>Open Lead</small>

                        <h2>

                            {{ dashboard.summary.open_lead }}

                        </h2>

                    </div>

                </div>

            </div>

            <div class="col-xl col-md-6">

                <div class="kpi-card card-info">

                    <div class="kpi-icon">

                        <i class="ti ti-chart-line"></i>

                    </div>

                    <div>

                        <small>Conversion Rate</small>

                        <h2>

                            {{ dashboard.summary.conversion_rate }}%

                        </h2>

                    </div>

                </div>

            </div>

        </div>

        <!-- =======================================================
            CHART
        ======================================================== -->

        <div class="row g-4 mb-4">

            <!-- Lead Source -->

            <div class="col-lg-4">

                <div class="card border-0 shadow-sm h-100">

                    <div class="card-header bg-white">

                        <h4 class="mb-0">

                            Lead Source

                        </h4>

                    </div>

                    <div class="card-body">

                        <div class="chart-box">

                            <Doughnut
                                :data="leadSourceChart"
                                :options="doughnutOptions"
                            />

                        </div>

                    </div>

                </div>

            </div>

            <!-- Monthly Conversion -->

            <div class="col-lg-8">

                <div class="card border-0 shadow-sm h-100">

                    <div class="card-header bg-white">

                        <h4 class="mb-0">

                            Monthly Conversion

                        </h4>

                    </div>

                    <div class="card-body">

                        <div class="chart-box">

                            <Line
                                :data="monthlyConversionChart"
                                :options="lineOptions"
                            />

                        </div>

                    </div>

                </div>

            </div>

        </div>

        <!-- =======================================================
            MIDDLE
        ======================================================== -->

        <div class="row g-4 mb-4">

            <!-- Pipeline Per Sales -->

            <div class="col-lg-6">

                <div class="card border-0 shadow-sm">

                    <div class="card-header bg-white">

                        <h4 class="mb-0">

                            Pipeline Per Sales

                        </h4>

                    </div>

                    <div class="card-body">

                        <div
                            class="pipeline-item"
                            v-for="item in dashboard.pipeline_per_sales"
                            :key="item.id_user">

                            <div class="d-flex justify-content-between">

                                <strong>

                                    {{ item.fullname }}

                                </strong>

                                <span>

                                    {{ item.total_customer }}

                                </span>

                            </div>

                            <div class="progress mt-2">

                                <div
                                    class="progress-bar bg-primary"
                                    :style="{width:item.percent+'%'}"
                                ></div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

            <!-- Customer Status -->

            <div class="col-lg-6">

                <div class="card border-0 shadow-sm">

                    <div class="card-header bg-white">

                        <h4 class="mb-0">

                            Customer Status

                        </h4>

                    </div>

                    <div class="card-body">

                        <div class="chart-box">

                            <Doughnut
                                :data="customerStatusChart"
                                :options="doughnutOptions"
                            />

                        </div>

                    </div>

                </div>

            </div>

        </div>

        <!-- =======================================================
            LATEST CUSTOMER
        ======================================================== -->

        <div class="card border-0 shadow-sm">

            <div class="card-header bg-white">

                <h4 class="mb-0">

                    Latest Customer

                </h4>

            </div>

            <div class="card-body">

                <div
                    class="customer-item"
                    v-for="customer in dashboard.latest_customer"
                    :key="customer.customer_code">

                    <div class="timeline-dot"></div>

                    <div class="customer-content">

                        <div
                            class="d-flex justify-content-between flex-wrap">

                            <div>

                                <div class="fw-bold">

                                    {{ customer.company_name }}

                                </div>

                                <small class="text-muted">

                                    {{ customer.customer_code }}

                                </small>

                            </div>

                            <span class="badge bg-success">

                                {{ customer.customer_status }}

                            </span>

                        </div>

                        <div class="mt-2 text-muted">

                            <i class="ti ti-user me-2"></i>

                            {{ customer.sales_name }}

                        </div>

                        <div class="mt-2 text-muted">

                            <i class="ti ti-calendar me-2"></i>

                            {{ formatDateTime(customer.created_at) }}

                        </div>

                    </div>

                </div>

                <div
                    v-if="dashboard.latest_customer.length===0"
                    class="text-center py-5">

                    <i
                        class="ti ti-building-off"
                        style="font-size:60px"></i>

                    <h5 class="mt-3">

                        No Customer

                    </h5>

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
        total_lead:4,
        converted_lead:3,
        open_lead:1,
        conversion_rate:75
    },

    lead_source:[
        {
            lead_source:'Referral',
            total:5
        },
        {
            lead_source:'Website',
            total:3
        },
        {
            lead_source:'Cold Call',
            total:1
        },
        {
            lead_source:'Other',
            total:1
        },
        {
            lead_source:'Social Media',
            total:1
        }
    ],

    customer_status:[
        {
            customer_status:'Active',
            total:11
        }
    ],

    pipeline_per_sales:[
        {
            id_user:2,
            fullname:'sputnix norwey',
            total_customer:4
        },
        {
            id_user:3,
            fullname:'bortley england',
            total_customer:3
        },
        {
            id_user:4,
            fullname:'willson denmark',
            total_customer:3
        },
        {
            id_user:1,
            fullname:'apregi pratayuda',
            total_customer:1
        }
    ],

    monthly_conversion:[
        {
            date:'2026-07-08',
            total:2
        },
        {
            date:'2026-07-09',
            total:9
        }
    ],

    latest_customer:[
        {
            customer_code:'CUST-20260709-009',
            company_name:'PT Sugizindo',
            sales_name:'willson denmark',
            customer_status:'Active',
            created_at:'2026-07-09 11:13:32'
        },
        {
            customer_code:'CUST-20260709-008',
            company_name:'Asalta Mandiri Agung. PT',
            sales_name:'willson denmark',
            customer_status:'Active',
            created_at:'2026-07-09 11:06:25'
        },
        {
            customer_code:'CUST-20260709-007',
            company_name:'PT Perwira Arthabaja Pasifik',
            sales_name:'sputnix norwey',
            customer_status:'Active',
            created_at:'2026-07-09 10:58:58'
        }
    ]

})

/* ==========================================================
    Progress Per Sales
========================================================== */

const maxCustomer = computed(() => {

    return Math.max(
        ...dashboard.value.pipeline_per_sales.map(
            item => item.total_customer
        ),
        1
    )

})

dashboard.value.pipeline_per_sales =
dashboard.value.pipeline_per_sales.map(item=>({

    ...item,

    percent:
        (
            item.total_customer /
            maxCustomer.value
        ) * 100

}))

/* ==========================================================
    Lead Source Doughnut
========================================================== */

const leadSourceChart = computed(() => ({

    labels:
        dashboard.value.lead_source.map(
            item => item.lead_source
        ),

    datasets:[
        {

            data:
                dashboard.value.lead_source.map(
                    item => item.total
                ),

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

/* ==========================================================
    Customer Status Doughnut
========================================================== */

const customerStatusChart = computed(() => ({

    labels:
        dashboard.value.customer_status.map(
            item => item.customer_status
        ),

    datasets:[

        {

            data:
                dashboard.value.customer_status.map(
                    item => item.total
                ),

            backgroundColor:[
                '#10B981',
                '#EF4444',
                '#F59E0B',
                '#6366F1'
            ],

            borderWidth:0

        }

    ]

}))

/* ==========================================================
    Monthly Conversion
========================================================== */

const monthlyConversionChart = computed(() => ({

    labels:
        dashboard.value.monthly_conversion.map(
            item => item.date
        ),

    datasets:[

        {

            label:'Conversion',

            data:
                dashboard.value.monthly_conversion.map(
                    item => item.total
                ),

            borderColor:'#4F46E5',

            backgroundColor:'rgba(99,102,241,.15)',

            fill:true,

            tension:.35,

            pointRadius:5,

            pointHoverRadius:7

        }

    ]

}))

/* ==========================================================
    Chart Option
========================================================== */

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

        console.log('Pipeline refreshed.')

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
//             '/dashboard/manager/pipeline'
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

.pipeline-dashboard{

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

    background:#fff;

    border-bottom:1px solid #edf2f7;

    padding:22px 24px;

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

    min-height:140px;

    border-radius:18px;

    padding:24px;

    color:#fff;

    display:flex;

    justify-content:space-between;

    align-items:center;

    transition:.35s;

    cursor:pointer;

}

.kpi-card:hover{

    transform:translateY(-8px);

    box-shadow:0 20px 35px rgba(0,0,0,.15);

}

.kpi-card::before{

    content:"";

    position:absolute;

    width:180px;

    height:180px;

    border-radius:50%;

    right:-60px;

    top:-70px;

    background:rgba(255,255,255,.08);

}

.kpi-card::after{

    content:"";

    position:absolute;

    width:120px;

    height:120px;

    border-radius:50%;

    left:-35px;

    bottom:-35px;

    background:rgba(255,255,255,.05);

}

.kpi-icon{

    width:72px;

    height:72px;

    border-radius:18px;

    background:rgba(255,255,255,.18);

    display:flex;

    align-items:center;

    justify-content:center;

    font-size:34px;

    backdrop-filter:blur(8px);

}

.kpi-card small{

    opacity:.9;

}

.kpi-card h2{

    margin-top:8px;

    font-size:40px;

    font-weight:700;

}

/* ==========================================================
   KPI COLOR
========================================================== */

.card-indigo{

    background:linear-gradient(135deg,#4F46E5,#6366F1);

}

.card-success{

    background:linear-gradient(135deg,#059669,#10B981);

}

.card-warning{

    background:linear-gradient(135deg,#D97706,#F59E0B);

}

.card-info{

    background:linear-gradient(135deg,#0284C7,#06B6D4);

}

/* ==========================================================
   CHART
========================================================== */

.chart-box{

    position:relative;

    width:100%;

    height:320px;

}

/* ==========================================================
   PIPELINE
========================================================== */

.pipeline-item{

    margin-bottom:24px;

}

.pipeline-item:last-child{

    margin-bottom:0;

}

.progress{

    height:10px;

    border-radius:20px;

    background:#edf2f7;

}

.progress-bar{

    border-radius:20px;

    transition:.8s;

}

/* ==========================================================
   CUSTOMER TIMELINE
========================================================== */

.customer-item{

    position:relative;

    display:flex;

    gap:18px;

    margin-bottom:28px;

}

.customer-item:last-child{

    margin-bottom:0;

}

.timeline-dot{

    width:14px;

    height:14px;

    background:#6366F1;

    border-radius:50%;

    margin-top:8px;

    position:relative;

    box-shadow:0 0 0 6px rgba(99,102,241,.15);

}

.timeline-dot::after{

    content:"";

    position:absolute;

    width:2px;

    background:#dbe4f0;

    top:20px;

    left:6px;

    bottom:-40px;

}

.customer-item:last-child .timeline-dot::after{

    display:none;

}

.customer-content{

    flex:1;

    background:#fff;

    border:1px solid #edf2f7;

    border-radius:16px;

    padding:18px;

    transition:.3s;

}

.customer-content:hover{

    border-color:#6366F1;

    box-shadow:0 10px 25px rgba(99,102,241,.10);

}

/* ==========================================================
   BUTTON
========================================================== */

.btn{

    border-radius:12px;

}

.btn-primary{

    background:#4F46E5;

    border:none;

}

.btn-primary:hover{

    background:#4338CA;

}

/* ==========================================================
   BADGE
========================================================== */

.badge{

    padding:8px 14px;

    border-radius:20px;

    font-weight:600;

}

/* ==========================================================
   SCROLLBAR
========================================================== */

::-webkit-scrollbar{

    width:8px;

}

::-webkit-scrollbar-thumb{

    background:#CBD5E1;

    border-radius:20px;

}

/* ==========================================================
   RESPONSIVE
========================================================== */

@media(max-width:1200px){

    .chart-box{

        height:280px;

    }

}

@media(max-width:992px){

    .kpi-card{

        min-height:120px;

    }

    .kpi-card h2{

        font-size:32px;

    }

    .kpi-icon{

        width:60px;

        height:60px;

        font-size:28px;

    }

}

@media(max-width:768px){

    .chart-box{

        height:240px;

    }

    .customer-item{

        gap:12px;

    }

}

@media(max-width:576px){

    .pipeline-dashboard{

        padding:15px;

    }

    .kpi-card{

        padding:18px;

    }

    .card-body{

        padding:18px;

    }

}

/* ==========================================================
   ANIMATION
========================================================== */

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

</style>