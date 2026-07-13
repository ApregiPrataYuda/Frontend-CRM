<template>

    <div class="customer-dashboard container-fluid py-4">

        <!-- =======================================================
            HEADER
        ======================================================== -->

        <div class="d-flex justify-content-between align-items-center flex-wrap mb-4">

            <div>

                <h2 class="fw-bold mb-1">

                    Customer Dashboard

                </h2>

                <p class="text-muted mb-0">

                    Customer Growth & Sales Monitoring

                </p>

            </div>

            <div class="d-flex gap-2">

                <button class="btn btn-light border">

                    <i class="ti ti-calendar me-2"></i>

                    {{ currentMonthLabel }}

                </button>

                <button
                    class="btn btn-primary"
                    :disabled="loadingCustomer"
                    @click="refresh">

                    <i
                        class="ti ti-refresh me-2"
                        :class="{ 'spin-icon': loadingCustomer }">
                    </i>

                    {{ loadingCustomer ? 'Refreshing...' : 'Refresh' }}

                </button>

            </div>

        </div>

        <!-- =======================================================
            LOADING
        ======================================================== -->

        <div
            v-if="loadingCustomer && !hasData"
            class="sp-loading-wrap">

            <div class="spinner"></div>

            <span>

                Loading Customer Dashboard...

            </span>

        </div>

        <template v-else>

            <!-- =======================================================
                KPI
            ======================================================== -->

            <div class="row g-4 mb-4">

                <!-- TOTAL CUSTOMER -->

                <div class="col-xl col-md-6">

                    <div class="kpi-card card-indigo">

                        <div class="kpi-icon">

                            <i class="ti ti-users"></i>

                        </div>

                        <div>

                            <small>Total Customer</small>

                            <h2>

                                {{ dashboard.summary.total_customer }}

                            </h2>

                            <div class="kpi-footer">

                                Total Registered Customer

                            </div>

                        </div>

                    </div>

                </div>

                <!-- NEW -->

                <div class="col-xl col-md-6">

                    <div class="kpi-card card-success">

                        <div class="kpi-icon">

                            <i class="ti ti-user-plus"></i>

                        </div>

                        <div>

                            <small>New Customer</small>

                            <h2>

                                {{ dashboard.summary.new_customer }}

                            </h2>

                            <div class="kpi-footer">

                                {{ newRate.toFixed(1) }}%

                                Growth

                            </div>

                        </div>

                    </div>

                </div>

                <!-- ACTIVE -->

                <div class="col-xl col-md-6">

                    <div class="kpi-card card-info">

                        <div class="kpi-icon">

                            <i class="ti ti-user-check"></i>

                        </div>

                        <div>

                            <small>Active Customer</small>

                            <h2>

                                {{ dashboard.summary.active_customer }}

                            </h2>

                            <div class="kpi-footer">

                                {{ activeRate.toFixed(1) }}%

                                Active

                            </div>

                        </div>

                    </div>

                </div>

            </div>

            <!-- =======================================================
                MINI STATUS
            ======================================================== -->

            <div class="row g-4 mb-4">

                <div class="col-lg-4">

                    <div class="mini-stat">

                        <div class="mini-stat-icon icon-slate">

                            <i class="ti ti-moon"></i>

                        </div>

                        <div>

                            <small>

                                Dormant Customer

                            </small>

                            <h4>

                                {{ dashboard.summary.dormant_customer }}

                            </h4>

                        </div>

                    </div>

                </div>

                <div class="col-lg-4">

                    <div class="mini-stat">

                        <div class="mini-stat-icon icon-dark">

                            <i class="ti ti-power"></i>

                        </div>

                        <div>

                            <small>

                                Inactive Customer

                            </small>

                            <h4>

                                {{ dashboard.summary.inactive_customer }}

                            </h4>

                        </div>

                    </div>

                </div>

                <div class="col-lg-4">

                    <div class="mini-stat">

                        <div class="mini-stat-icon icon-danger">

                            <i class="ti ti-user-x"></i>

                        </div>

                        <div>

                            <small>

                                Lost Customer

                            </small>

                            <h4>

                                {{ dashboard.summary.lost_customer }}

                            </h4>

                        </div>

                    </div>

                </div>

            </div>

                        <!-- =======================================================
                CHART
            ======================================================== -->

            <div class="row g-4 mb-4">

                <!-- LEAD SOURCE -->

                <div class="col-xl-5">

                    <div class="card border-0 shadow-sm h-100">

                        <div class="card-header bg-white d-flex justify-content-between align-items-center">

                            <div>

                                <h4 class="mb-1">

                                    🎯 Lead Source Distribution

                                </h4>

                                <small class="text-muted">

                                    Customer Acquisition Channel

                                </small>

                            </div>

                            <span class="badge bg-primary">

                                {{ dashboard.lead_source.length }}

                                Sources

                            </span>

                        </div>

                        <div class="card-body">

                            <div
                                v-if="!dashboard.lead_source.length"
                                class="empty-state">

                                <i class="ti ti-chart-pie"></i>

                                <h5 class="mt-3">

                                    No Lead Source

                                </h5>

                            </div>

                            <template v-else>

                                <div class="chart-wrapper">

                                    <Doughnut
                                        :data="leadSourceChart"
                                        :options="doughnutOptions"
                                    />

                                </div>

                                <div class="mt-4">

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

                            </template>

                        </div>

                    </div>

                </div>

                <!-- CUSTOMER GROWTH -->

                <div class="col-xl-7">

                    <div class="card border-0 shadow-sm h-100">

                        <div class="card-header bg-white d-flex justify-content-between align-items-center">

                            <div>

                                <h4 class="mb-1">

                                    📈 Customer Growth

                                </h4>

                                <small class="text-muted">

                                    Daily Customer Acquisition

                                </small>

                            </div>

                            <span class="badge bg-success">

                                {{ dashboard.summary.total_customer }}

                            </span>

                        </div>

                        <div class="card-body">

                            <div
                                v-if="!dashboard.customer_growth.length"
                                class="empty-state">

                                <i class="ti ti-chart-line"></i>

                                <h5 class="mt-3">

                                    No Growth Data

                                </h5>

                            </div>

                            <template v-else>

                                <div class="chart-wrapper">

                                    <Line
                                        :data="customerGrowthChart"
                                        :options="lineOptions"
                                    />

                                </div>

                            </template>

                        </div>

                    </div>

                </div>

            </div>

                        <!-- =======================================================
                TOP SALES + TOP CUSTOMER
            ======================================================== -->

            <div class="row g-4 mb-4">

                <!-- ===================================================
                    TOP SALES
                ==================================================== -->

                <div class="col-xl-5">

                    <div class="card border-0 shadow-sm h-100">

                        <div class="card-header bg-white">

                            <div class="d-flex justify-content-between align-items-center">

                                <div>

                                    <h4 class="mb-1">

                                        🏆 Top Sales

                                    </h4>

                                    <small class="text-muted">

                                        Ranked by Customer Acquisition

                                    </small>

                                </div>

                                <span class="badge bg-primary">

                                    {{ dashboard.top_sales.length }}

                                    Sales

                                </span>

                            </div>

                        </div>

                        <div class="card-body">

                            <div
                                v-if="!dashboard.top_sales.length"
                                class="empty-state">

                                <i class="ti ti-users"></i>

                                <h5 class="mt-3">

                                    No Sales Data

                                </h5>

                            </div>

                            <template v-else>

                                <div
                                    class="ranking-item"
                                    v-for="(item,index) in dashboard.top_sales"
                                    :key="item.id_user">

                                    <div class="rank">

                                        {{ medal(index) }}

                                    </div>

                                    <div class="avatar">

                                        <i class="ti ti-user"></i>

                                    </div>

                                    <div class="flex-grow-1 ms-3">

                                        <div class="fw-bold text-capitalize">

                                            {{ item.fullname }}

                                        </div>

                                        <small class="text-muted">

                                            {{ item.total_customer }}

                                            Customer

                                        </small>

                                        <div class="progress mt-2">

                                            <div
                                                class="progress-bar bg-primary"
                                                :style="{

                                                    width:

                                                    (

                                                        item.total_customer

                                                        /

                                                        Math.max(

                                                            ...dashboard.top_sales.map(

                                                                s=>s.total_customer

                                                            ),

                                                            1

                                                        )

                                                    )*100+'%'

                                                }">

                                            </div>

                                        </div>

                                    </div>

                                    <div class="score">

                                        {{ item.total_customer }}

                                    </div>

                                </div>

                            </template>

                        </div>

                    </div>

                </div>

                <!-- ===================================================
                    TOP CUSTOMER
                ==================================================== -->

                <div class="col-xl-7">

                    <div class="card border-0 shadow-sm h-100">

                        <div class="card-header bg-white">

                            <div class="d-flex justify-content-between align-items-center">

                                <div>

                                    <h4 class="mb-1">

                                        ⭐ Top Customer

                                    </h4>

                                    <small class="text-muted">

                                        Highest Visit Frequency

                                    </small>

                                </div>

                                <span class="badge bg-success">

                                    {{ dashboard.top_customer.length }}

                                </span>

                            </div>

                        </div>

                        <div class="card-body">

                            <div
                                v-if="!dashboard.top_customer.length"
                                class="empty-state">

                                <i class="ti ti-building"></i>

                                <h5 class="mt-3">

                                    No Customer

                                </h5>

                            </div>

                            <template v-else>

                                <div class="row g-3">

                                    <div
                                        class="col-lg-6"
                                        v-for="item in dashboard.top_customer"
                                        :key="item.customer_code">

                                        <div class="feed-card">

                                            <div class="feed-header">

                                                <div>

                                                    <h6
                                                        class="mb-1 fw-bold">

                                                        {{ item.company_name }}

                                                    </h6>

                                                    <small
                                                        class="text-muted">

                                                        {{ item.customer_code }}

                                                    </small>

                                                </div>

                                                <span
                                                    class="badge bg-success">

                                                    {{ item.total_visit }}

                                                    Visit

                                                </span>

                                            </div>

                                            <div
                                                class="progress mt-3">

                                                <div
                                                    class="progress-bar bg-success"
                                                    :style="{

                                                        width:

                                                        (

                                                            item.total_visit

                                                            /

                                                            Math.max(

                                                                ...dashboard.top_customer.map(

                                                                    c=>c.total_visit

                                                                ),

                                                                1

                                                            )

                                                        )*100+'%'

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

                        <!-- =======================================================
                CUSTOMER LIST
            ======================================================== -->

            <div class="card border-0 shadow-sm">

                <div class="card-header bg-white">

                    <div class="d-flex justify-content-between align-items-center">

                        <div>

                            <h4 class="mb-1">

                                📋 Customer List

                            </h4>

                            <small class="text-muted">

                                Registered Customer Directory

                            </small>

                        </div>

                        <span class="badge bg-primary">

                            {{ dashboard.customer_list.length }}

                            Customer

                        </span>

                    </div>

                </div>

                <div class="card-body p-0">

                    <div
                        v-if="!dashboard.customer_list.length"
                        class="empty-state">

                        <i class="ti ti-users"></i>

                        <h5 class="mt-3">

                            No Customer Found

                        </h5>

                    </div>

                    <div
                        v-else
                        class="table-responsive">

                        <table class="table customer-table align-middle mb-0">

                            <thead>

                                <tr>

                                    <th>Customer</th>

                                    <th>Contact</th>

                                    <th>Status</th>

                                    <th>Lead Source</th>

                                    <th>Sales</th>

                                    <th>Created</th>

                                </tr>

                            </thead>

                            <tbody>

                                <tr
                                    v-for="item in dashboard.customer_list"
                                    :key="item.customer_code">

                                    <!-- CUSTOMER -->

                                    <td>

                                        <div class="d-flex align-items-center">

                                            <div class="avatar">

                                                <i class="ti ti-building"></i>

                                            </div>

                                            <div class="ms-3">

                                                <div class="fw-bold">

                                                    {{ item.company_name }}

                                                </div>

                                                <small class="text-muted">

                                                    {{ item.customer_code }}

                                                </small>

                                            </div>

                                        </div>

                                    </td>

                                    <!-- CONTACT -->

                                    <td>

                                        <div>

                                            <div class="fw-semibold">

                                                {{ item.contact_name }}

                                            </div>

                                            <small class="text-muted">

                                                {{ item.phone }}

                                            </small>

                                        </div>

                                    </td>

                                    <!-- STATUS -->

                                    <td>

                                        <span
                                            class="badge"
                                            :class="statusBadge(item.customer_status)">

                                            {{ item.customer_status }}

                                        </span>

                                    </td>

                                    <!-- LEAD SOURCE -->

                                    <td>

                                        <span
                                            class="badge"
                                            :class="leadSourceBadge(item.lead_source)">

                                            {{ item.lead_source }}

                                        </span>

                                    </td>

                                    <!-- SALES -->

                                    <td>

                                        <div class="d-flex align-items-center">

                                            <div
                                                class="avatar avatar-sm">

                                                <i class="ti ti-user"></i>

                                            </div>

                                            <span
                                                class="ms-2 text-capitalize">

                                                {{ item.sales_name }}

                                            </span>

                                        </div>

                                    </td>

                                    <!-- CREATED -->

                                    <td>

                                        <small class="text-muted">

                                            {{ formatDateTime(item.created_at) }}

                                        </small>

                                    </td>

                                </tr>

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        </template>

    </div>

</template>

<script setup>

import {
    computed,
    onMounted
} from 'vue'

import {
    storeToRefs
} from 'pinia'

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

import { useAuthStore } from '@/stores/authStore'
import { useCustomersDashboardStore } from '@/stores/customersDashboard'

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

// =====================================================
// STORE
// =====================================================

const authStore = useAuthStore()

const customerStore = useCustomersDashboardStore()

const {

    dashboard,

    loadingCustomer,

    hasData,

    activeRate,

    newRate,

    inactiveRate,

    dormantRate,

    lostRate,

    bestSales

} = storeToRefs(customerStore)

const {

    fetchCustomers,

    medal,

    formatDate,

    formatDateTime,

    statusBadge,

    leadSourceBadge,

    leadSourceDot

} = customerStore

// =====================================================
// HEADER
// =====================================================

const currentMonthLabel = computed(() => {

    return new Date().toLocaleDateString(

        'id-ID',

        {

            month: 'long',

            year: 'numeric'

        }

    )

})

// =====================================================
// LOAD
// =====================================================

onMounted(() => {

    fetchCustomers(

        authStore.user.id

    )

})

// =====================================================
// LEAD SOURCE CHART
// =====================================================

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
                '#8B5CF6',
                '#10B981',
                '#EF4444',
                '#64748B'

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

// =====================================================
// CUSTOMER GROWTH
// =====================================================

const customerGrowthChart = computed(() => ({

    labels: dashboard.value.customer_growth.map(

        item=>item.date

    ),

    datasets:[

        {

            label:'Customer',

            data: dashboard.value.customer_growth.map(

                item=>item.total

            ),

            borderColor:'#4F46E5',

            backgroundColor:'rgba(99,102,241,.15)',

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

// =====================================================
// REFRESH
// =====================================================

const refresh=()=>{

    fetchCustomers(

        loginStore.user.id

    )

}
// =====================================================
// END SCRIPT
// =====================================================

</script>

<style scoped>
/* ==========================================================
   PAGE
========================================================== */

.customer-dashboard{

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

    transition:.35s;

}

.card:hover{

    box-shadow:0 18px 45px rgba(15,23,42,.12);

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
   KPI CARD
========================================================== */

.kpi-card{

    position:relative;

    overflow:hidden;

    display:flex;

    justify-content:space-between;

    align-items:center;

    min-height:150px;

    padding:26px;

    border-radius:18px;

    color:#fff;

    cursor:pointer;

    transition:.35s;

}

.kpi-card:hover{

    transform:translateY(-8px);

    box-shadow:0 20px 40px rgba(0,0,0,.18);

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

    display:flex;

    justify-content:center;

    align-items:center;

    font-size:32px;

    background:rgba(255,255,255,.15);

    backdrop-filter:blur(10px);

}

.kpi-card small{

    font-size:.92rem;

    opacity:.9;

}

.kpi-card h2{

    margin-top:10px;

    margin-bottom:4px;

    font-size:40px;

    font-weight:700;

    line-height:1;

}

.kpi-footer{

    font-size:.82rem;

    opacity:.95;

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

.card-info{

    background:linear-gradient(135deg,#0891b2,#06b6d4);

}

/* ==========================================================
   MINI STAT
========================================================== */

.mini-stat{

    display:flex;

    align-items:center;

    gap:16px;

    padding:20px;

    border-radius:16px;

    background:#fff;

    border:1px solid #edf2f7;

    transition:.3s;

}

.mini-stat:hover{

    transform:translateY(-4px);

    border-color:#6366f1;

    box-shadow:0 12px 25px rgba(99,102,241,.10);

}

.mini-stat-icon{

    width:54px;

    height:54px;

    border-radius:14px;

    display:flex;

    justify-content:center;

    align-items:center;

    color:#fff;

    font-size:24px;

}

.icon-slate{

    background:#94a3b8;

}

.icon-dark{

    background:#334155;

}

.icon-danger{

    background:#ef4444;

}

.mini-stat h4{

    margin:0;

    font-weight:700;

}

.mini-stat small{

    color:#64748b;

}

/* ==========================================================
   BUTTON
========================================================== */

.btn{

    border-radius:12px;

}

.btn-primary{

    border:none;

    background:#4f46e5;

}

.btn-primary:hover{

    background:#4338ca;

}

/* ==========================================================
   LOADING
========================================================== */

.sp-loading-wrap{

    min-height:420px;

    display:flex;

    flex-direction:column;

    justify-content:center;

    align-items:center;

    color:#64748b;

}

.spinner{

    width:55px;

    height:55px;

    border-radius:50%;

    border:4px solid #e2e8f0;

    border-top-color:#4f46e5;

    animation:spin .8s linear infinite;

    margin-bottom:18px;

}

.spin-icon{

    animation:spin 1s linear infinite;

}

@keyframes spin{

    to{

        transform:rotate(360deg);

    }

}

/* ==========================================================
   EMPTY STATE
========================================================== */

.empty-state{

    min-height:260px;

    display:flex;

    flex-direction:column;

    justify-content:center;

    align-items:center;

    color:#94a3b8;

}

.empty-state i{

    font-size:68px;

    margin-bottom:18px;

}

.empty-state h5{

    color:#475569;

    font-weight:600;

}

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
   LEAD SOURCE LIST
========================================================== */

.activity-stat{

    display:flex;

    justify-content:space-between;

    align-items:center;

    padding:12px 0;

    border-bottom:1px dashed #edf2f7;

}

.activity-stat:last-child{

    border-bottom:none;

}

.activity-color{

    width:11px;

    height:11px;

    border-radius:50%;

    display:inline-block;

    margin-right:10px;

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

    background:#fff;

    border:1px solid transparent;

    margin-bottom:14px;

    transition:.35s;

}

.ranking-item:last-child{

    margin-bottom:0;

}

.ranking-item:hover{

    transform:translateX(6px);

    border-color:#e2e8f0;

    background:#f8fafc;

    box-shadow:0 14px 28px rgba(15,23,42,.08);

}

.rank{

    width:52px;

    text-align:center;

    font-size:24px;

    font-weight:700;

}

.avatar{

    width:60px;

    height:60px;

    border-radius:50%;

    background:linear-gradient(135deg,#4f46e5,#818cf8);

    display:flex;

    justify-content:center;

    align-items:center;

    color:#fff;

    font-size:28px;

    flex-shrink:0;

}

.avatar-sm{

    width:38px;

    height:38px;

    font-size:18px;

}

.score{

    min-width:70px;

    height:50px;

    border-radius:14px;

    display:flex;

    justify-content:center;

    align-items:center;

    background:#eef2ff;

    color:#4f46e5;

    font-size:22px;

    font-weight:700;

}

/* ==========================================================
   TOP CUSTOMER CARD
========================================================== */

.feed-card{

    background:#fff;

    border:1px solid #edf2f7;

    border-radius:18px;

    padding:18px;

    transition:.35s;

    position:relative;

    overflow:hidden;

}

.feed-card:hover{

    transform:translateY(-5px);

    box-shadow:0 18px 35px rgba(15,23,42,.08);

    border-color:#6366f1;

}

.feed-card::before{

    content:"";

    position:absolute;

    left:0;

    top:0;

    width:5px;

    height:100%;

    background:#10b981;

}

.feed-header{

    display:flex;

    justify-content:space-between;

    align-items:flex-start;

    gap:12px;

}

.feed-header h6{

    margin:0;

}

.feed-card small{

    color:#64748b;

}

/* ==========================================================
   PROGRESS
========================================================== */

.progress{

    height:10px;

    border-radius:30px;

    background:#edf2f7;

    overflow:hidden;

}

.progress-bar{

    border-radius:30px;

    transition:width .8s ease;

}

/* ==========================================================
   CUSTOMER TABLE
========================================================== */

.customer-table{

    font-size:.92rem;

}

.customer-table thead th{

    background:#f8fafc;

    color:#64748b;

    font-weight:700;

    font-size:.75rem;

    text-transform:uppercase;

    letter-spacing:.05em;

    border-bottom:1px solid #edf2f7;

    padding:16px 22px;

    white-space:nowrap;

}

.customer-table tbody td{

    padding:18px 22px;

    vertical-align:middle;

    border-bottom:1px solid #f1f5f9;

    white-space:nowrap;

}

.customer-table tbody tr{

    transition:.25s;

}

.customer-table tbody tr:hover{

    background:#f8fafc;

}

.customer-table tbody tr:last-child td{

    border-bottom:none;

}

/* ==========================================================
   BADGE
========================================================== */

.badge{

    border-radius:30px;

    padding:7px 14px;

    font-size:.78rem;

    font-weight:600;

    letter-spacing:.2px;

}

.badge-primary{

    background:#eef2ff;

    color:#4f46e5;

}

.badge-success{

    background:#ecfdf5;

    color:#059669;

}

.badge-warning{

    background:#fef3c7;

    color:#b45309;

}

.badge-danger{

    background:#fee2e2;

    color:#dc2626;

}

.badge-info{

    background:#ecfeff;

    color:#0891b2;

}

.badge-purple{

    background:#f3e8ff;

    color:#7c3aed;

}

.badge-secondary{

    background:#f1f5f9;

    color:#475569;

}

.badge-dark{

    background:#e2e8f0;

    color:#1e293b;

}

/* ==========================================================
   DOT
========================================================== */

.dot-primary{

    background:#4f46e5;

}

.dot-success{

    background:#10b981;

}

.dot-warning{

    background:#f59e0b;

}

.dot-danger{

    background:#ef4444;

}

.dot-info{

    background:#06b6d4;

}

.dot-secondary{

    background:#64748b;

}

.dot-purple{

    background:#8b5cf6;

}

.dot-dark{

    background:#334155;

}

/* ==========================================================
   ANIMATION
========================================================== */

.card,
.kpi-card,
.mini-stat,
.feed-card,
.ranking-item{

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
   SCROLLBAR
========================================================== */

::-webkit-scrollbar{

    width:8px;

    height:8px;

}

::-webkit-scrollbar-thumb{

    background:#cbd5e1;

    border-radius:20px;

}

::-webkit-scrollbar-track{

    background:#f8fafc;

}

/* ==========================================================
   RESPONSIVE
========================================================== */

@media(max-width:1200px){

    .chart-wrapper{

        height:300px;

    }

}

@media(max-width:992px){

    .kpi-card{

        min-height:130px;

    }

    .kpi-card h2{

        font-size:34px;

    }

    .kpi-icon{

        width:60px;

        height:60px;

        font-size:28px;

    }

    .chart-wrapper{

        height:280px;

    }

}

@media(max-width:768px){

    .chart-wrapper{

        height:240px;

    }

    .ranking-item{

        flex-wrap:wrap;

    }

    .score{

        width:100%;

    }

    .customer-table{

        min-width:900px;

    }

}

@media(max-width:576px){

    .customer-dashboard{

        padding:14px;

    }

    .card-body{

        padding:18px;

    }

    .kpi-card{

        padding:18px;

    }

    .chart-wrapper{

        height:220px;

    }

    .avatar{

        width:48px;

        height:48px;

        font-size:22px;

    }

    .avatar-sm{

        width:34px;

        height:34px;

        font-size:16px;

    }

}

/* ==========================================================
   END
========================================================== */

</style>
