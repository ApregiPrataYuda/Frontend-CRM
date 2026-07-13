<template>

<div class="complaint-dashboard container-fluid py-4">

    <!-- ==========================================================
        HEADER
    =========================================================== -->

    <div class="dashboard-header mb-4">

        <div class="row align-items-center">

            <!-- Left -->

            <div class="col-lg-8">

                <div class="d-flex align-items-center gap-3">

                    <div class="header-icon">

                        <i class="fa-solid fa-file-circle-exclamation"></i>

                    </div>

                    <div>

                        <span class="dashboard-label">

                            CUSTOMER SERVICE

                        </span>

                        <h2 class="dashboard-title">

                            Complaint Dashboard

                        </h2>

                        <p class="dashboard-subtitle mb-0">

                            Monitor customer complaints and service quality in real time.

                        </p>

                    </div>

                </div>

            </div>

            <!-- Right -->

            <div class="col-lg-4">

                <div class="header-action">

                    <button class="btn btn-light btn-header">

                        <i class="fa-solid fa-calendar-days me-2"></i>

                        July 2026

                    </button>

                    <button
                        class="btn btn-primary btn-header"
                        :disabled="complaintStore.loadingComplaint"
                        @click="refresh">

                        <i class="fa-solid fa-rotate-right me-2"></i>

                        Refresh

                    </button>

                </div>

            </div>

        </div>

        <hr class="my-4">

        <!-- MINI SUMMARY -->

        <div class="row g-3">

            <div class="col-lg-3 col-md-6">

                <div class="mini-stat">

                    <small>

                        Last Update

                    </small>

                    <h6>

                        {{ lastUpdateText }}

                    </h6>

                </div>

            </div>

            <div class="col-lg-3 col-md-6">

                <div class="mini-stat">

                    <small>

                        Monitoring Period

                    </small>

                    <h6>

                        July 2026

                    </h6>

                </div>

            </div>

            <div class="col-lg-3 col-md-6">

                <div class="mini-stat">

                    <small>

                        Complaint Rate

                    </small>

                    <h6>

                        {{ dashboard.summary.complaint_rate }} %

                    </h6>

                </div>

            </div>

            <div class="col-lg-3 col-md-6">

                <div class="mini-stat">

                    <small>

                        Service Status

                    </small>

                    <h6 :class="serviceStatusColor">

                        {{ serviceStatusText }}

                    </h6>

                </div>

            </div>

        </div>

    </div>

    <!-- ==========================================================
        ERROR STATE
    =========================================================== -->

    <div
        v-if="complaintStore.errorComplaint"
        class="alert alert-danger">

        Gagal memuat data complaint. Silakan coba refresh kembali.

    </div>

    <!-- ==========================================================
        KPI
    =========================================================== -->

    <div class="row g-4 mb-4">

        <!-- Total Visit -->

        <div class="col-xl-4 col-md-6">

            <div class="kpi-card card-primary">

                <div class="kpi-content">

                    <small>

                        Total Visit

                    </small>

                    <h2>

                        {{ dashboard.summary.total_visit }}

                    </h2>

                    <div class="kpi-footer">

                        <span>

                            Customer Visit

                        </span>

                    </div>

                </div>

                <div class="kpi-icon">

                    <i class="fa-solid fa-map-location-dot"></i>

                </div>

            </div>

        </div>

        <!-- Complaint -->

        <div class="col-xl-4 col-md-6">

            <div class="kpi-card card-danger">

                <div class="kpi-content">

                    <small>

                        Total Complaint

                    </small>

                    <h2>

                        {{ dashboard.summary.total_complaint }}

                    </h2>

                    <div class="kpi-footer">

                        <span>

                            Customer Complaint

                        </span>

                    </div>

                </div>

                <div class="kpi-icon">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                </div>

            </div>

        </div>

        <!-- Rate -->

        <div class="col-xl-4 col-md-12">

            <div class="kpi-card card-warning">

                <div class="kpi-content">

                    <small>

                        Complaint Rate

                    </small>

                    <h2>

                        {{ dashboard.summary.complaint_rate }}%

                    </h2>

                    <div class="progress mt-3">

                        <div
                            class="progress-bar bg-light"
                            role="progressbar"
                            :style="{
                                width: dashboard.summary.complaint_rate + '%'
                            }">

                        </div>

                    </div>

                    <div class="d-flex justify-content-between mt-2">

                        <small>

                            Complaint Ratio

                        </small>

                        <small>

                            {{ dashboard.summary.complaint_rate }}%

                        </small>

                    </div>

                </div>

                <div class="kpi-icon">

                    <i class="fa-solid fa-chart-pie"></i>

                </div>

            </div>

        </div>

    </div>

    <!-- ==========================================================
        CHART SECTION
    =========================================================== -->

    <div class="row g-4 mb-4">

        <!-- ======================================================
            DAILY COMPLAINT TREND
        ======================================================= -->

        <div class="col-xl-8">

            <div class="dashboard-card h-100">

                <div class="card-header-custom">

                    <div class="d-flex justify-content-between align-items-center">

                        <div>

                            <h5 class="mb-1">

                                <i class="fa-solid fa-chart-line text-primary me-2"></i>

                                Daily Complaint Trend

                            </h5>

                            <small class="text-muted">

                                Daily complaint activity

                            </small>

                        </div>

                        <span class="badge bg-primary">

                            {{ dashboard.daily_trend.length }}

                            Days

                        </span>

                    </div>

                </div>

                <div class="card-body-custom">

                    <template v-if="complaintStore.hasDailyTrend">

                        <div class="chart-container-lg">

                            <Line
                                :data="complaintStore.dailyTrendChart"
                                :options="lineOptions"
                            />

                        </div>

                    </template>

                    <template v-else>

                        <div class="empty-chart">

                            <i class="fa-solid fa-chart-line"></i>

                            <h5>

                                No Trend Data

                            </h5>

                            <p>

                                There is no complaint trend for this period.

                            </p>

                        </div>

                    </template>

                </div>

            </div>

        </div>

        <!-- ======================================================
            COMPLAINT PERCENTAGE
        ======================================================= -->

        <div class="col-xl-4">

            <div class="dashboard-card h-100">

                <div class="card-header-custom">

                    <div class="d-flex justify-content-between align-items-center">

                        <div>

                            <h5 class="mb-1">

                                <i class="fa-solid fa-chart-pie text-danger me-2"></i>

                                Complaint Percentage

                            </h5>

                            <small class="text-muted">

                                Complaint vs Visit

                            </small>

                        </div>

                    </div>

                </div>

                <div class="card-body-custom">

                    <template v-if="dashboard.summary.total_visit > 0">

                        <div class="chart-container">

                            <Doughnut
                                :data="complaintStore.percentageChart"
                                :options="doughnutOptions"
                            />

                        </div>

                        <hr>

                        <div class="percentage-item">

                            <div>

                                <span class="dot dot-danger"></span>

                                Complaint

                            </div>

                            <strong>

                                {{ dashboard.summary.complaint_rate }}%

                            </strong>

                        </div>

                        <div class="percentage-item">

                            <div>

                                <span class="dot dot-success"></span>

                                No Complaint

                            </div>

                            <strong>

                                {{ complaintStore.noComplaintRate }}%

                            </strong>

                        </div>

                        <div class="percentage-item">

                            <div>

                                <span class="dot dot-primary"></span>

                                Total Visit

                            </div>

                            <strong>

                                {{ dashboard.summary.total_visit }}

                            </strong>

                        </div>

                        <div class="percentage-item">

                            <div>

                                <span class="dot dot-warning"></span>

                                Complaint

                            </div>

                            <strong>

                                {{ dashboard.summary.total_complaint }}

                            </strong>

                        </div>

                    </template>

                    <template v-else>

                        <div class="empty-chart">

                            <i class="fa-solid fa-face-smile"></i>

                            <h5>

                                Excellent Service

                            </h5>

                            <p>

                                There are no complaint records during this period.

                            </p>

                        </div>

                    </template>

                </div>

            </div>

        </div>

    </div>

    <!-- ==========================================================
        COMPLAINT ANALYTICS
    =========================================================== -->

    <div class="row g-4 mb-4">

        <!-- =====================================================
            COMPLAINT PER SALES
        ====================================================== -->

        <div class="col-xl-6">

            <div class="dashboard-card h-100">

                <div class="card-header-custom">

                    <div class="d-flex justify-content-between align-items-center">

                        <div>

                            <h5 class="mb-1">

                                <i class="fa-solid fa-ranking-star text-primary me-2"></i>

                                Complaint Per Sales

                            </h5>

                            <small class="text-muted">

                                Top sales with complaint cases

                            </small>

                        </div>

                        <span class="badge bg-primary">

                            {{ dashboard.complaint_per_sales.length }}

                            Sales

                        </span>

                    </div>

                </div>

                <div class="card-body-custom">

                    <template v-if="complaintStore.hasComplaintPerSales">

                        <div
                            v-for="(item,index) in dashboard.complaint_per_sales"
                            :key="item.id_user"
                            class="leaderboard-item">

                            <div class="leader-left">

                                <div class="leader-rank">

                                    {{ index + 1 }}

                                </div>

                                <div
                                    class="leader-avatar"
                                    :style="{ background: complaintStore.getAvatarColor(item.fullname) }">

                                    {{ complaintStore.getInitials(item.fullname) }}

                                </div>

                                <div>

                                    <div class="leader-title">

                                        {{ item.fullname }}

                                    </div>

                                    <small class="text-muted">

                                        Sales Executive

                                    </small>

                                </div>

                            </div>

                            <div class="leader-right">

                                <h5>

                                    {{ item.total_complaint }}

                                </h5>

                                <small>

                                    Complaint

                                </small>

                            </div>

                        </div>

                    </template>

                    <template v-else>

                        <div class="empty-chart">

                            <i class="fa-solid fa-user-group"></i>

                            <h5>

                                No Complaint

                            </h5>

                            <p>

                                No complaint data per sales.

                            </p>

                        </div>

                    </template>

                </div>

            </div>

        </div>

        <!-- =====================================================
            COMPLAINT PER CUSTOMER
        ====================================================== -->

        <div class="col-xl-6">

            <div class="dashboard-card h-100">

                <div class="card-header-custom">

                    <div class="d-flex justify-content-between align-items-center">

                        <div>

                            <h5 class="mb-1">

                                <i class="fa-solid fa-building text-danger me-2"></i>

                                Complaint Per Customer

                            </h5>

                            <small class="text-muted">

                                Customers with complaint records

                            </small>

                        </div>

                        <span class="badge bg-danger">

                            {{ dashboard.complaint_per_customer.length }}

                            Customer

                        </span>

                    </div>

                </div>

                <div class="card-body-custom">

                    <template v-if="complaintStore.hasComplaintPerCustomer">

                        <div
                            v-for="(item,index) in complaintStore.complaintPerCustomer"
                            :key="index"
                            class="customer-item">

                            <div class="customer-avatar">

                                <i class="fa-solid fa-building"></i>

                            </div>

                            <div class="customer-content">

                                <div class="customer-name">

                                    {{ item.customer_name }}

                                </div>

                                <div class="progress mt-2">

                                    <div
                                        class="progress-bar bg-danger"
                                        :style="{ width: item.percent + '%' }">

                                    </div>

                                </div>

                            </div>

                            <div class="customer-value">

                                {{ item.total_complaint }}

                            </div>

                        </div>

                    </template>

                    <template v-else>

                        <div class="empty-chart">

                            <i class="fa-solid fa-face-smile"></i>

                            <h5>

                                Excellent

                            </h5>

                            <p>

                                No customer complaint available.

                            </p>

                        </div>

                    </template>

                </div>

            </div>

        </div>

    </div>

    <!-- ==========================================================
        LATEST COMPLAINT
    =========================================================== -->

    <div class="row">

        <div class="col-12">

            <div class="dashboard-card">

                <div class="card-header-custom">

                    <div class="d-flex justify-content-between align-items-center">

                        <div>

                            <h5 class="mb-1">

                                <i class="fa-solid fa-clock-rotate-left text-danger me-2"></i>

                                Latest Complaint Timeline

                            </h5>

                            <small class="text-muted">

                                Latest customer complaint activities

                            </small>

                        </div>

                        <span class="badge bg-danger">

                            {{ dashboard.latest_complaint.length }}

                            Records

                        </span>

                    </div>

                </div>

                <div class="card-body-custom">

                    <template v-if="complaintStore.hasLatestComplaint">

                        <div class="timeline">

                            <div
                                v-for="item in dashboard.latest_complaint"
                                :key="item.visit_code"
                                class="timeline-item">

                                <!-- Timeline Dot -->

                                <div class="timeline-dot">

                                    <i class="fa-solid fa-triangle-exclamation"></i>

                                </div>

                                <!-- Timeline Content -->

                                <div class="timeline-content">

                                    <div
                                        class="d-flex justify-content-between align-items-start flex-wrap mb-2">

                                        <div>

                                            <h6 class="mb-1 fw-bold">

                                                {{ item.complaint_detail }}

                                            </h6>

                                            <span
                                                class="badge"
                                                :class="complaintStore.visitResultBadge(item.visit_result)">

                                                {{ complaintStore.formatVisitResult(item.visit_result) }}

                                            </span>

                                        </div>

                                        <small class="text-muted">

                                            {{ complaintStore.formatDateTime(item.visit_at) }}

                                        </small>

                                    </div>

                                    <div class="row">

                                        <div class="col-lg-4">

                                            <small class="text-muted">

                                                Customer

                                            </small>

                                            <div class="fw-semibold">

                                                {{ item.customer_name }}

                                            </div>

                                        </div>

                                        <div class="col-lg-4">

                                            <small class="text-muted">

                                                Sales

                                            </small>

                                            <div class="fw-semibold">

                                                {{ item.sales_name }}

                                            </div>

                                        </div>

                                        <div class="col-lg-4">

                                            <small class="text-muted">

                                                Visit Code

                                            </small>

                                            <div>

                                                <span class="badge bg-warning text-dark">

                                                    {{ item.visit_code }}

                                                </span>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </template>

                    <!-- EMPTY -->

                    <template v-else>

                        <div class="empty-chart">

                            <i
                                class="fa-solid fa-circle-check text-success">

                            </i>

                            <h4 class="mt-3">

                                Excellent Service

                            </h4>

                            <p class="text-muted">

                                There are no complaint records for this period.

                            </p>

                        </div>

                    </template>

                </div>

            </div>

        </div>

    </div>

</div>

</template>

<script setup>

import {

    computed,
    onMounted

} from 'vue'

import {

    Chart as ChartJS,

    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,

    ArcElement,

    Tooltip,
    Legend,
    Filler

} from 'chart.js'

import {

    Line,
    Doughnut

} from 'vue-chartjs'

import { useComplaintDashboardStore } from '@/stores/complaintDashboard'
// Sesuaikan import ini dengan store auth/user yang sudah ada di project kamu,
// dipakai untuk mengirim ?user_id= ke API seperti store dashboard lain.
import { useAuthStore } from '@/stores/authStore'

ChartJS.register(

    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,

    ArcElement,

    Tooltip,
    Legend,
    Filler

)

const complaintStore = useComplaintDashboardStore()
const authStore       = useAuthStore()

// Data mentah dari store, dipakai langsung di template
const dashboard = computed(() => complaintStore.dashboard)

/* ==========================================================
LAST UPDATE & SERVICE STATUS
========================================================== */

const lastUpdateText = computed(() => {
    const latest = dashboard.value.latest_complaint[0]
    return latest ? complaintStore.formatDateTime(latest.visit_at) : '-'
})

// Threshold sederhana untuk label kualitas servis berdasarkan complaint rate
const serviceStatusText = computed(() => {
    const rate = dashboard.value.summary.complaint_rate ?? 0
    if (rate === 0) return 'Excellent'
    if (rate <= 10) return 'Good'
    if (rate <= 25) return 'Needs Attention'
    return 'Critical'
})

const serviceStatusColor = computed(() => {
    const rate = dashboard.value.summary.complaint_rate ?? 0
    if (rate === 0) return 'text-success'
    if (rate <= 10) return 'text-primary'
    if (rate <= 25) return 'text-warning'
    return 'text-danger'
})

/* ==========================================================
LINE OPTION
========================================================== */

const lineOptions = {

    responsive: true,

    maintainAspectRatio: false,

    interaction: {

        intersect: false,

        mode: 'index'

    },

    plugins: {

        legend: {

            display: false

        },

        tooltip: {

            backgroundColor: '#1E293B',

            padding: 12,

            displayColors: false

        }

    },

    scales: {

        x: {

            grid: {

                display: false

            }

        },

        y: {

            beginAtZero: true,

            ticks: {

                precision: 0

            },

            grid: {

                color: '#EEF2F7'

            }

        }

    }

}

/* ==========================================================
DOUGHNUT OPTION
========================================================== */

const doughnutOptions = {

    responsive: true,

    maintainAspectRatio: false,

    cutout: '72%',

    plugins: {

        legend: {

            display: false

        },

        tooltip: {

            backgroundColor: '#1E293B'

        }

    }

}

/* ==========================================================
LOAD & REFRESH
========================================================== */

const loadDashboard = () => {
    complaintStore.fetchComplaint(authStore.user?.id)
}

const refresh = () => {
    loadDashboard()
}

onMounted(()=>{

    loadDashboard()

})

</script>

<style scoped>
/* ==========================================================
PAGE
========================================================== */

.complaint-dashboard{

    min-height:100vh;

    background:#f5f7fb;

    padding-bottom:30px;

}

/* ==========================================================
HEADER
========================================================== */

.dashboard-header{

    position:relative;

    overflow:hidden;

    background:#ffffff;

    border-radius:24px;

    padding:30px;

    border:1px solid #eef2f7;

    box-shadow:
        0 15px 40px rgba(15,23,42,.06);

}

.dashboard-header::before{

    content:"";

    position:absolute;

    width:360px;

    height:360px;

    border-radius:50%;

    background:

        radial-gradient(

            rgba(239,68,68,.08),

            transparent

        );

    right:-140px;

    top:-140px;

}

.dashboard-header::after{

    content:"";

    position:absolute;

    width:220px;

    height:220px;

    border-radius:50%;

    background:

        radial-gradient(

            rgba(59,130,246,.08),

            transparent

        );

    left:-80px;

    bottom:-80px;

}

/* ==========================================================
HEADER ICON
========================================================== */

.header-icon{

    width:76px;

    height:76px;

    border-radius:20px;

    display:flex;

    justify-content:center;

    align-items:center;

    font-size:34px;

    color:#fff;

    background:

        linear-gradient(

            135deg,

            #ef4444,

            #dc2626

        );

    box-shadow:

        0 15px 30px rgba(239,68,68,.28);

}

.dashboard-label{

    color:#dc2626;

    font-size:.78rem;

    font-weight:700;

    letter-spacing:1px;

}

.dashboard-title{

    font-size:2rem;

    font-weight:700;

    color:#0f172a;

    margin:6px 0;

}

.dashboard-subtitle{

    color:#64748b;

    font-size:.95rem;

}

/* ==========================================================
HEADER BUTTON
========================================================== */

.header-action{

    display:flex;

    justify-content:flex-end;

    align-items:center;

    gap:12px;

}

.btn-header{

    padding:11px 18px;

    border-radius:12px;

    font-weight:600;

    transition:.25s;

}

.btn-header:hover{

    transform:translateY(-2px);

}

/* ==========================================================
MINI STAT
========================================================== */

.mini-stat{

    background:#f8fafc;

    border:1px solid #edf2f7;

    border-radius:16px;

    padding:18px;

    transition:.3s;

}

.mini-stat:hover{

    background:#ffffff;

    transform:translateY(-4px);

    box-shadow:

        0 12px 24px rgba(15,23,42,.06);

}

.mini-stat small{

    display:block;

    color:#94a3b8;

    font-size:.8rem;

    margin-bottom:8px;

}

.mini-stat h6{

    margin:0;

    color:#0f172a;

    font-weight:700;

    font-size:1.05rem;

}

/* ==========================================================
KPI CARD
========================================================== */

.kpi-card{

    position:relative;

    overflow:hidden;

    min-height:170px;

    border-radius:22px;

    padding:26px;

    color:#fff;

    display:flex;

    justify-content:space-between;

    align-items:center;

    transition:.35s;

    cursor:pointer;

}

.kpi-card:hover{

    transform:translateY(-8px);

    box-shadow:

        0 22px 40px rgba(0,0,0,.18);

}

/* background decoration */

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

    left:-40px;

    bottom:-40px;

}

/* ==========================================================
KPI CONTENT
========================================================== */

.kpi-content{

    position:relative;

    z-index:2;

}

.kpi-content small{

    display:block;

    opacity:.92;

    font-size:.9rem;

}

.kpi-content h2{

    font-size:42px;

    font-weight:700;

    margin:10px 0 8px;

}

.kpi-footer{

    display:flex;

    align-items:center;

    gap:8px;

    opacity:.9;

    font-size:.9rem;

}

/* ==========================================================
KPI ICON
========================================================== */

.kpi-icon{

    position:relative;

    z-index:2;

    width:74px;

    height:74px;

    border-radius:18px;

    display:flex;

    justify-content:center;

    align-items:center;

    font-size:30px;

    background:rgba(255,255,255,.15);

    backdrop-filter:blur(12px);

}

/* ==========================================================
KPI COLOR
========================================================== */

.card-primary{

    background:

        linear-gradient(

            135deg,

            #2563eb,

            #3b82f6

        );

}

.card-danger{

    background:

        linear-gradient(

            135deg,

            #dc2626,

            #ef4444

        );

}

.card-warning{

    background:

        linear-gradient(

            135deg,

            #ea580c,

            #fb923c

        );

}

/* ==========================================================
BOOTSTRAP PROGRESS
========================================================== */

.progress{

    height:8px;

    background:rgba(255,255,255,.20);

    border-radius:999px;

    overflow:hidden;

}

.progress-bar{

    border-radius:999px;

}


/* ==========================================================
DASHBOARD CARD
========================================================== */

.dashboard-card{

    background:#ffffff;

    border-radius:22px;

    border:1px solid #edf2f7;

    box-shadow:0 10px 35px rgba(15,23,42,.06);

    overflow:hidden;

    transition:.3s;

}

.dashboard-card:hover{

    transform:translateY(-5px);

    box-shadow:0 20px 45px rgba(15,23,42,.10);

}

.card-header-custom{

    padding:22px 24px;

    border-bottom:1px solid #edf2f7;

    background:#fff;

}

.card-header-custom h5{

    margin:0;

    font-size:1.05rem;

    font-weight:700;

    color:#0f172a;

}

.card-header-custom small{

    color:#94a3b8;

}

.card-body-custom{

    padding:24px;

}

/* ==========================================================
CHART
========================================================== */

.chart-container{

    position:relative;

    height:280px;

}

.chart-container-lg{

    position:relative;

    height:360px;

}

/* ==========================================================
PERCENTAGE
========================================================== */

.percentage-item{

    display:flex;

    justify-content:space-between;

    align-items:center;

    padding:12px 0;

    border-bottom:1px dashed #edf2f7;

}

.percentage-item:last-child{

    border-bottom:none;

}

.dot{

    width:10px;

    height:10px;

    border-radius:50%;

    display:inline-block;

    margin-right:10px;

}

.dot-primary{

    background:#2563eb;

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

/* ==========================================================
LEADERBOARD SALES
========================================================== */

.leaderboard-item{

    display:flex;

    justify-content:space-between;

    align-items:center;

    padding:16px;

    border-radius:16px;

    transition:.25s;

    margin-bottom:12px;

    border:1px solid transparent;

}

.leaderboard-item:hover{

    background:#f8fafc;

    border-color:#e2e8f0;

    transform:translateX(4px);

}

.leader-left{

    display:flex;

    align-items:center;

    gap:14px;

}

.leader-rank{

    width:38px;

    height:38px;

    border-radius:50%;

    display:flex;

    justify-content:center;

    align-items:center;

    background:#2563eb;

    color:#fff;

    font-weight:700;

}

.leader-avatar{

    width:48px;

    height:48px;

    border-radius:50%;

    display:flex;

    justify-content:center;

    align-items:center;

    color:#fff;

    font-size:18px;

    font-weight:700;

}

.leader-title{

    font-weight:600;

    color:#0f172a;

}

.leader-right{

    text-align:right;

}

.leader-right h5{

    margin:0;

    color:#ef4444;

    font-weight:700;

}

/* ==========================================================
CUSTOMER
========================================================== */

.customer-item{

    display:flex;

    align-items:center;

    gap:16px;

    margin-bottom:18px;

}

.customer-avatar{

    width:48px;

    height:48px;

    border-radius:14px;

    background:#fee2e2;

    color:#dc2626;

    display:flex;

    justify-content:center;

    align-items:center;

    font-size:20px;

}

.customer-content{

    flex:1;

}

.customer-name{

    font-weight:600;

    color:#0f172a;

}

.customer-value{

    min-width:45px;

    text-align:right;

    font-weight:700;

    color:#dc2626;

}

/* ==========================================================
TIMELINE
========================================================== */

.timeline{

    position:relative;

    padding-left:28px;

}

.timeline::before{

    content:"";

    position:absolute;

    left:15px;

    top:0;

    bottom:0;

    width:2px;

    background:#e2e8f0;

}

.timeline-item{

    position:relative;

    margin-bottom:28px;

}

.timeline-item:last-child{

    margin-bottom:0;

}

.timeline-dot{

    position:absolute;

    left:-28px;

    top:10px;

    width:30px;

    height:30px;

    border-radius:50%;

    background:#ef4444;

    display:flex;

    justify-content:center;

    align-items:center;

    color:#fff;

    font-size:13px;

    box-shadow:0 5px 15px rgba(239,68,68,.35);

}

.timeline-content{

    background:#ffffff;

    border:1px solid #edf2f7;

    border-radius:16px;

    padding:20px;

    transition:.3s;

}

.timeline-content:hover{

    border-color:#fecaca;

    box-shadow:0 10px 30px rgba(239,68,68,.08);

}

/* ==========================================================
EMPTY
========================================================== */

.empty-chart{

    height:320px;

    display:flex;

    flex-direction:column;

    justify-content:center;

    align-items:center;

    text-align:center;

    color:#94a3b8;

}

.empty-chart i{

    font-size:58px;

    margin-bottom:20px;

    color:#cbd5e1;

}

.empty-chart h5{

    color:#475569;

    font-weight:700;

    margin-bottom:8px;

}

.empty-chart p{

    max-width:280px;

}

/* ==========================================================
BADGE
========================================================== */

.badge{

    padding:7px 14px;

    border-radius:999px;

    font-weight:600;

}

/* ==========================================================
ANIMATION
========================================================== */

.dashboard-card,

.kpi-card,

.dashboard-header{

    animation:fadeUp .45s ease;

}

@keyframes fadeUp{

    from{

        opacity:0;

        transform:translateY(25px);

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

    .chart-container-lg{

        height:300px;

    }

    .header-action{

        margin-top:20px;

        justify-content:flex-start;

    }

}

@media(max-width:768px){

    .dashboard-header{

        padding:20px;

    }

    .dashboard-title{

        font-size:1.6rem;

    }

    .header-icon{

        width:60px;

        height:60px;

        font-size:26px;

    }

    .chart-container,

    .chart-container-lg{

        height:240px;

    }

    .timeline{

        padding-left:18px;

    }

    .timeline-dot{

        left:-20px;

        width:24px;

        height:24px;

        font-size:11px;

    }

    .leaderboard-item{

        flex-direction:column;

        align-items:flex-start;

        gap:12px;

    }

    .leader-right{

        text-align:left;

    }

}
</style>