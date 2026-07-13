<template>
    <div class="lead-dashboard container-fluid py-4">

        <!-- =========================
            HEADER
        ========================== -->

        <div class="d-flex justify-content-between align-items-center flex-wrap mb-4">

            <div>

                <h2 class="fw-bold mb-1">
                    Lead Analytics Dashboard
                </h2>

                <p class="text-muted mb-0">
                    Track lead volume, sources, and conversion performance.
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

                <div class="kpi-card card-cyan">

                    <div class="kpi-icon">

                        <i class="ti ti-sparkles"></i>

                    </div>

                    <div>

                        <small>New Lead</small>

                        <h2>

                            {{ dashboard.summary.new_lead }}

                        </h2>

                        <span class="kpi-text">

                            Added This Month

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

                <div class="kpi-card card-amber">

                    <div class="kpi-icon">

                        <i class="ti ti-hourglass"></i>

                    </div>

                    <div>

                        <small>Open Lead</small>

                        <h2>

                            {{ dashboard.summary.open_lead }}

                        </h2>

                        <span class="kpi-text">

                            Still In Pipeline

                        </span>

                    </div>

                </div>

            </div>

        </div>

        <!-- =========================
            CONVERSION RATE BANNER
        ========================== -->

        <div class="row g-4 mb-4">

            <div class="col-12">

                <div class="rate-banner">

                    <div class="rate-banner-icon">

                        <i class="ti ti-percentage"></i>

                    </div>

                    <div class="rate-banner-body">

                        <div class="d-flex justify-content-between align-items-baseline flex-wrap gap-2">

                            <div>

                                <small>Conversion Rate</small>

                                <h3>

                                    {{ dashboard.summary.conversion_rate }}%

                                </h3>

                            </div>

                            <span class="text-muted small">

                                {{ dashboard.summary.converted }} of {{ dashboard.summary.total_lead }} leads converted

                            </span>

                        </div>

                        <div class="rate-progress">

                            <div
                                class="rate-progress-fill"
                                :style="{ width: dashboard.summary.conversion_rate + '%' }">
                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>

        <!-- =========================
            BREAKDOWN CHARTS
        ========================== -->

        <div class="row g-4 mb-4">

            <!-- Lead Source -->

            <div class="col-lg-4">

                <div class="card dashboard-card h-100">

                    <div class="card-header">

                        <h5 class="mb-0">

                            Lead Source

                        </h5>

                        <small class="text-muted">

                            Where Leads Come From

                        </small>

                    </div>

                    <div class="card-body">

                        <div class="chart-container-sm">

                            <Doughnut
                                :data="leadSourceChart"
                                :options="doughnutOptions"
                            />

                        </div>

                        <hr>

                        <div
                            v-for="item in dashboard.lead_source"
                            :key="item.lead_source"
                            class="activity-stat">

                            <div>

                                <span
                                    class="activity-color"
                                    :class="leadSourceDot(item.lead_source)">
                                </span>

                                {{ item.lead_source }}

                            </div>

                            <strong>

                                {{ item.total }}

                            </strong>

                        </div>

                    </div>

                </div>

            </div>

            <!-- Lead Category -->

            <div class="col-lg-4">

                <div class="card dashboard-card h-100">

                    <div class="card-header">

                        <h5 class="mb-0">

                            Lead Category

                        </h5>

                        <small class="text-muted">

                            Hot, Warm, Cold Leads

                        </small>

                    </div>

                    <div class="card-body">

                        <div class="chart-container-sm">

                            <Doughnut
                                :data="leadCategoryChart"
                                :options="doughnutOptions"
                            />

                        </div>

                        <hr>

                        <div
                            v-for="item in dashboard.lead_category"
                            :key="item.name"
                            class="activity-stat">

                            <div>

                                <span
                                    class="activity-color"
                                    :class="leadCategoryDot(item.name)">
                                </span>

                                {{ item.name }}

                            </div>

                            <strong>

                                {{ item.total }}

                            </strong>

                        </div>

                    </div>

                </div>

            </div>

            <!-- Lead Industry -->

            <div class="col-lg-4">

                <div class="card dashboard-card h-100">

                    <div class="card-header">

                        <h5 class="mb-0">

                            Lead Industry

                        </h5>

                        <small class="text-muted">

                            Industry Breakdown

                        </small>

                    </div>

                    <div class="card-body">

                        <div class="chart-container-sm">

                            <Doughnut
                                :data="leadIndustryChart"
                                :options="doughnutOptions"
                            />

                        </div>

                        <hr>

                        <div
                            v-for="item in dashboard.lead_industry"
                            :key="item.name"
                            class="activity-stat">

                            <div>

                                <span
                                    class="activity-color"
                                    :class="leadIndustryDot(item.name)">
                                </span>

                                {{ item.name }}

                            </div>

                            <strong>

                                {{ item.total }}

                            </strong>

                        </div>

                    </div>

                </div>

            </div>

        </div>

        <!-- =========================
            LEAD PER SALES + DAILY TREND
        ========================== -->

        <div class="row g-4 mb-4">

            <!-- Lead per Sales -->

            <div class="col-lg-5">

                <div class="card dashboard-card h-100">

                    <div class="card-header">

                        <h5 class="mb-0">

                            Lead per Sales

                        </h5>

                        <small class="text-muted">

                            Ranked by Leads Assigned

                        </small>

                    </div>

                    <div class="card-body">

                        <div
                            v-for="(sale, index) in dashboard.lead_per_sales"
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

                                    {{ sale.total_lead }} Lead

                                </div>

                            </div>

                            <span class="badge bg-primary">

                                {{ sale.total_lead }}

                            </span>

                        </div>

                        <div
                            v-if="!dashboard.lead_per_sales.length"
                            class="text-muted text-center py-4">

                            No leads assigned yet.

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

                                    Daily Lead Trend

                                </h5>

                                <small class="text-muted">

                                    New Leads Over Time

                                </small>

                            </div>

                            <span class="badge bg-success">

                                {{ dashboard.summary.total_lead }}

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
            LATEST LEAD
        ========================== -->

        <div class="row g-4">

            <div class="col-12">

                <div class="card dashboard-card">

                    <div class="card-header">

                        <div class="d-flex justify-content-between align-items-center">

                            <div>

                                <h5 class="mb-0">

                                    Latest Lead

                                </h5>

                                <small class="text-muted">

                                    Recently Captured Leads

                                </small>

                            </div>

                            <span class="badge bg-primary">

                                {{ dashboard.latest_lead.length }}

                                Lead

                            </span>

                        </div>

                    </div>

                    <div class="card-body p-0">

                        <div class="table-responsive">

                            <table class="table table-hover align-middle mb-0 lead-table">

                                <thead>

                                    <tr>

                                        <th>Company</th>

                                        <th>Contact</th>

                                        <th>Phone</th>

                                        <th>Email</th>

                                        <th>Source</th>

                                        <th>Status</th>

                                        <th>Sales</th>

                                        <th>Created At</th>

                                    </tr>

                                </thead>

                                <tbody>

                                    <tr
                                        v-for="item in dashboard.latest_lead"
                                        :key="item.id">

                                        <td class="fw-semibold">

                                            {{ item.company_name }}

                                        </td>

                                        <td>

                                            {{ item.contact_name }}

                                        </td>

                                        <td>

                                            {{ item.phone }}

                                        </td>

                                        <td>

                                            {{ item.email }}

                                        </td>

                                        <td>

                                            <span
                                                class="badge"
                                                :class="leadSourceBadge(item.lead_source)">

                                                {{ item.lead_source }}

                                            </span>

                                        </td>

                                        <td>

                                            <span
                                                class="badge"
                                                :class="leadStatusBadge(item.lead_status)">

                                                {{ item.lead_status }}

                                            </span>

                                        </td>

                                        <td class="text-capitalize">

                                            <span v-if="item.sales_name">

                                                {{ item.sales_name }}

                                            </span>

                                            <span
                                                v-else
                                                class="text-muted fst-italic">

                                                Unassigned

                                            </span>

                                        </td>

                                        <td class="text-muted">

                                            {{ formatDateTime(item.created_at) }}

                                        </td>

                                    </tr>

                                    <tr v-if="!dashboard.latest_lead.length">

                                        <td
                                            colspan="8"
                                            class="text-center text-muted py-4">

                                            No leads found.

                                        </td>

                                    </tr>

                                </tbody>

                            </table>

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
        total_lead:2,
        new_lead:2,
        converted:2,
        open_lead:0,
        conversion_rate:100
    },

    lead_source:[
        {
            lead_source:'Referral',
            total:1
        },
        {
            lead_source:'Website',
            total:1
        }
    ],

    lead_category:[
        {
            name:'Hot Lead',
            total:1
        },
        {
            name:'Warm Lead',
            total:1
        }
    ],

    lead_industry:[
        {
            name:'Manufacture',
            total:1
        },
        {
            name:'Retail',
            total:1
        }
    ],

    lead_per_sales:[
        {
            id_user:2,
            fullname:'sputnix norwey',
            total_lead:1
        }
    ],

    daily_trend:[
        {
            date:'2026-07-10',
            total:2
        }
    ],

    latest_lead:[
        {
            id:1,
            company_name:'PT Maju Jaya',
            contact_name:'Andi Saputra',
            phone:'081234567890',
            email:'andi@majujaya.co.id',
            lead_source:'Website',
            lead_status:'Converted',
            sales_name:null,
            created_at:'2026-07-10 15:08:18'
        },
        {
            id:2,
            company_name:'PT Sukses Makmur',
            contact_name:'Budi Santoso',
            phone:'081298765432',
            email:'budi@suksesmakmur.co.id',
            lead_source:'Referral',
            lead_status:'Converted',
            sales_name:'sputnix norwey',
            created_at:'2026-07-10 15:08:18'
        }
    ]

})

/*
|--------------------------------------------------------------------------
| Doughnut Charts
|--------------------------------------------------------------------------
*/

const leadSourceChart = computed(() => ({

    labels: dashboard.value.lead_source.map(
        item => item.lead_source
    ),

    datasets:[
        {

            data: dashboard.value.lead_source.map(
                item => item.total
            ),

            backgroundColor:[
                '#6366F1',
                '#06B6D4',
                '#F59E0B',
                '#94A3B8',
                '#8B5CF6'
            ],

            borderWidth:0,

            hoverOffset:8

        }

    ]

}))

const leadCategoryChart = computed(() => ({

    labels: dashboard.value.lead_category.map(
        item => item.name
    ),

    datasets:[
        {

            data: dashboard.value.lead_category.map(
                item => item.total
            ),

            backgroundColor:[
                '#EF4444',
                '#F59E0B',
                '#06B6D4',
                '#94A3B8'
            ],

            borderWidth:0,

            hoverOffset:8

        }

    ]

}))

const leadIndustryChart = computed(() => ({

    labels: dashboard.value.lead_industry.map(
        item => item.name
    ),

    datasets:[
        {

            data: dashboard.value.lead_industry.map(
                item => item.total
            ),

            backgroundColor:[
                '#8B5CF6',
                '#64748B',
                '#10B981',
                '#FB923C',
                '#0EA5E9'
            ],

            borderWidth:0,

            hoverOffset:8

        }

    ]

}))

const doughnutOptions={

    responsive:true,

    maintainAspectRatio:false,

    cutout:'70%',

    plugins:{

        legend:{
            display:false
        }

    }

}

/*
|--------------------------------------------------------------------------
| Line Chart (Daily Trend)
|--------------------------------------------------------------------------
*/

const dailyTrendChart = computed(() => ({

    labels: dashboard.value.daily_trend.map(
        item => item.date
    ),

    datasets:[

        {

            label:'Lead',

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
| Badge / Dot - Lead Source
|--------------------------------------------------------------------------
*/

const leadSourceBadge=(source)=>{

    switch(source){

        case 'Referral':
            return 'badge-primary'

        case 'Website':
            return 'badge-info'

        case 'Cold Call':
            return 'badge-warning'

        case 'Other':
            return 'badge-secondary'

        case 'Social Media':
            return 'badge-purple'

        default:
            return 'badge-dark'

    }

}

const leadSourceDot=(source)=>{

    switch(source){

        case 'Referral':
            return 'dot-primary'

        case 'Website':
            return 'dot-info'

        case 'Cold Call':
            return 'dot-warning'

        case 'Other':
            return 'dot-secondary'

        case 'Social Media':
            return 'dot-purple'

        default:
            return 'dot-dark'

    }

}

/*
|--------------------------------------------------------------------------
| Dot - Lead Category
|--------------------------------------------------------------------------
*/

const leadCategoryDot=(name)=>{

    switch(name){

        case 'Hot Lead':
            return 'dot-danger'

        case 'Warm Lead':
            return 'dot-warning'

        case 'Cold Lead':
            return 'dot-info'

        default:
            return 'dot-dark'

    }

}

/*
|--------------------------------------------------------------------------
| Dot - Lead Industry
|--------------------------------------------------------------------------
*/

const leadIndustryDot=(name)=>{

    switch(name){

        case 'Manufacture':
            return 'dot-purple'

        case 'Retail':
            return 'dot-secondary'

        case 'Technology':
            return 'dot-success'

        case 'Logistics':
            return 'dot-orange'

        default:
            return 'dot-dark'

    }

}

/*
|--------------------------------------------------------------------------
| Badge - Lead Status
|--------------------------------------------------------------------------
*/

const leadStatusBadge=(status)=>{

    switch(status){

        case 'Converted':
            return 'badge-success'

        case 'New':
            return 'badge-primary'

        case 'Open':
            return 'badge-info'

        case 'Qualified':
            return 'badge-purple'

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
//             '/api/dashboard/manager/lead-analytics'
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

.lead-dashboard{

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

/* ==========================================================
    COLOR
========================================================== */

.card-indigo{

    background:linear-gradient(135deg,#4f46e5,#6366f1);

}

.card-success{

    background:linear-gradient(135deg,#059669,#10b981);

}

.card-cyan{

    background:linear-gradient(135deg,#0891b2,#06b6d4);

}

.card-amber{

    background:linear-gradient(135deg,#d97706,#f59e0b);

}

/* ==========================================================
    RATE BANNER
========================================================== */

.rate-banner{

    display:flex;

    align-items:center;

    gap:22px;

    background:#fff;

    border:1px solid #edf2f7;

    border-radius:18px;

    box-shadow:0 10px 30px rgba(15,23,42,.06);

    padding:24px;

}

.rate-banner-icon{

    width:64px;

    height:64px;

    min-width:64px;

    border-radius:16px;

    display:flex;

    align-items:center;

    justify-content:center;

    font-size:28px;

    color:#fff;

    background:linear-gradient(135deg,#7c3aed,#8b5cf6);

}

.rate-banner-body{

    flex:1;

}

.rate-banner-body small{

    color:#64748b;

    display:block;

    margin-bottom:2px;

}

.rate-banner-body h3{

    margin:0;

    font-weight:700;

    font-size:30px;

    color:#1e293b;

}

.rate-progress{

    width:100%;

    height:8px;

    border-radius:10px;

    background:#f1f5f9;

    overflow:hidden;

    margin-top:12px;

}

.rate-progress-fill{

    height:100%;

    border-radius:10px;

    background:linear-gradient(135deg,#7c3aed,#8b5cf6);

    transition:width .5s ease;

}

/* ==========================================================
    CHART
========================================================== */

.chart-container-sm{

    height:200px;

    position:relative;

}

.chart-container-lg{

    height:340px;

    position:relative;

}

/* ==========================================================
    STAT LIST
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
    SALES LIST
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
    TABLE
========================================================== */

.lead-table{

    font-size:.92rem;

}

.lead-table thead th{

    background:#f8fafc;

    color:#64748b;

    font-weight:600;

    text-transform:uppercase;

    font-size:.72rem;

    letter-spacing:.03em;

    border-bottom:1px solid #edf2f7;

    padding:14px 24px;

    white-space:nowrap;

}

.lead-table tbody td{

    padding:14px 24px;

    border-bottom:1px solid #f1f5f9;

    white-space:nowrap;

}

.lead-table tbody tr:last-child td{

    border-bottom:none;

}

.lead-table tbody tr:hover{

    background:#f8fafc;

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
.kpi-card,
.rate-banner{

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

    .chart-container-sm,

    .chart-container-lg{

        height:240px;

    }

    .rate-banner{

        flex-direction:column;

        align-items:flex-start;

    }

}

</style>