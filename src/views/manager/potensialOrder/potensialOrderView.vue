<template>

<div class="potential-dashboard container-fluid py-4">

    <!-- ==========================================================
        HEADER
    =========================================================== -->

    <div class="dashboard-header mb-4">

        <div class="row align-items-center">

            <!-- Left -->

            <div class="col-lg-8">

                <div class="d-flex align-items-center gap-3">

                    <div class="header-icon success">

                        <i class="fa-solid fa-sack-dollar"></i>

                    </div>

                    <div>

                        <span class="dashboard-label text-success">

                            SALES OPPORTUNITY

                        </span>

                        <h2 class="dashboard-title">

                            Potential Order Dashboard

                        </h2>

                        <p class="dashboard-subtitle mb-0">

                            Monitor sales opportunities, forecast revenue, and closing performance.

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
                        class="btn btn-success btn-header"
                        @click="refresh">

                        <i class="fa-solid fa-rotate-right me-2"></i>

                        Refresh

                    </button>

                </div>

            </div>

        </div>

        <hr class="my-4">

        <!-- SUMMARY -->

        <div class="row g-3">

            <div class="col-lg-3 col-md-6">

                <div class="mini-stat">

                    <small>

                        Last Update

                    </small>

                    <h6>

                        10 Jul 2026

                    </h6>

                </div>

            </div>

            <div class="col-lg-3 col-md-6">

                <div class="mini-stat">

                    <small>

                        Forecast Revenue

                    </small>

                    <h6 class="text-success">

                        Rp 1.25 B

                    </h6>

                </div>

            </div>

            <div class="col-lg-3 col-md-6">

                <div class="mini-stat">

                    <small>

                        Potential Rate

                    </small>

                    <h6>

                        {{ dashboard.summary.potential_rate }}%

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

        </div>

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

                        Customer Visit

                    </div>

                </div>

                <div class="kpi-icon">

                    <i class="fa-solid fa-map-location-dot"></i>

                </div>

            </div>

        </div>

        <!-- Potential Order -->

        <div class="col-xl-4 col-md-6">

            <div class="kpi-card card-success">

                <div class="kpi-content">

                    <small>

                        Potential Order

                    </small>

                    <h2>

                        {{ dashboard.summary.total_potential_order }}

                    </h2>

                    <div class="kpi-footer d-flex justify-content-between">

                        <span>

                            Sales Opportunity

                        </span>

                        <strong>

                            Rp 1.25 B

                        </strong>

                    </div>

                </div>

                <div class="kpi-icon">

                    <i class="fa-solid fa-sack-dollar"></i>

                </div>

            </div>

        </div>

        <!-- Potential Rate -->

        <div class="col-xl-4 col-md-12">

            <div class="kpi-card card-emerald">

                <div class="kpi-content">

                    <small>

                        Potential Rate

                    </small>

                    <h2>

                        {{ dashboard.summary.potential_rate }}%

                    </h2>

                    <div class="progress mt-3">

                        <div
                            class="progress-bar bg-light"
                            role="progressbar"
                            :style="{

                                width:

                                dashboard.summary.potential_rate + '%'

                            }">

                        </div>

                    </div>

                    <div
                        class="d-flex justify-content-between mt-2">

                        <small>

                            Visit Conversion

                        </small>

                        <small>

                            {{ dashboard.summary.potential_rate }}%

                        </small>

                    </div>

                </div>

                <div class="kpi-icon">

                    <i class="fa-solid fa-chart-line"></i>

                </div>

            </div>

        </div>

    </div>

    <!-- ==========================================================
        NEXT :
        DAILY TREND
        POTENTIAL PERCENTAGE
    =========================================================== -->
        <!-- ==========================================================
        CHART SECTION
    =========================================================== -->

    <div class="row g-4 mb-4">

        <!-- =====================================================
            DAILY POTENTIAL TREND
        ====================================================== -->

        <div class="col-xl-8">

            <div class="dashboard-card h-100">

                <div class="card-header-custom">

                    <div class="d-flex justify-content-between align-items-center">

                        <div>

                            <h5 class="mb-1">

                                <i class="fa-solid fa-chart-line text-success me-2"></i>

                                Daily Potential Trend

                            </h5>

                            <small class="text-muted">

                                Daily potential order generated

                            </small>

                        </div>

                        <span class="badge bg-success">

                            {{ dashboard.daily_trend.length }}

                            Days

                        </span>

                    </div>

                </div>

                <div class="card-body-custom">

                    <template v-if="dashboard.daily_trend.length">

                        <div class="chart-container-lg">

                            <Line
                                :data="dailyTrendChart"
                                :options="lineOptions"
                            />

                        </div>

                        <div class="row mt-4">

                            <div class="col-md-4">

                                <div class="trend-summary">

                                    <small>Total Potential</small>

                                    <h4>

                                        {{ dashboard.summary.total_potential_order }}

                                    </h4>

                                </div>

                            </div>

                            <div class="col-md-4">

                                <div class="trend-summary">

                                    <small>Visit</small>

                                    <h4>

                                        {{ dashboard.summary.total_visit }}

                                    </h4>

                                </div>

                            </div>

                            <div class="col-md-4">

                                <div class="trend-summary">

                                    <small>Conversion</small>

                                    <h4 class="text-success">

                                        {{ dashboard.summary.potential_rate }}%

                                    </h4>

                                </div>

                            </div>

                        </div>

                    </template>

                    <template v-else>

                        <div class="empty-chart">

                            <i class="fa-solid fa-chart-line"></i>

                            <h5>

                                No Potential Trend

                            </h5>

                            <p>

                                There is no potential order activity during this period.

                            </p>

                        </div>

                    </template>

                </div>

            </div>

        </div>

        <!-- =====================================================
            POTENTIAL PERCENTAGE
        ====================================================== -->

        <div class="col-xl-4">

            <div class="dashboard-card h-100">

                <div class="card-header-custom">

                    <div>

                        <h5 class="mb-1">

                            <i class="fa-solid fa-chart-pie text-success me-2"></i>

                            Potential Percentage

                        </h5>

                        <small class="text-muted">

                            Opportunity Distribution

                        </small>

                    </div>

                </div>

                <div class="card-body-custom">

                    <template v-if="dashboard.summary.total_visit > 0">

                        <div class="chart-container">

                            <Doughnut
                                :data="percentageChart"
                                :options="doughnutOptions"
                            />

                        </div>

                        <div class="text-center mt-3">

                            <h2 class="fw-bold text-success">

                                {{ dashboard.summary.potential_rate }}%

                            </h2>

                            <small class="text-muted">

                                Opportunity Rate

                            </small>

                        </div>

                        <hr>

                        <div class="percentage-item">

                            <div>

                                <span class="dot dot-success"></span>

                                Potential

                            </div>

                            <strong>

                                {{ dashboard.summary.total_potential_order }}

                            </strong>

                        </div>

                        <div class="percentage-item">

                            <div>

                                <span class="dot dot-primary"></span>

                                Visit

                            </div>

                            <strong>

                                {{ dashboard.summary.total_visit }}

                            </strong>

                        </div>

                        <div class="percentage-item">

                            <div>

                                <span class="dot dot-warning"></span>

                                Not Potential

                            </div>

                            <strong>

                                {{ dashboard.summary.total_visit - dashboard.summary.total_potential_order }}

                            </strong>

                        </div>

                    </template>

                    <template v-else>

                        <div class="empty-chart">

                            <i class="fa-solid fa-seedling"></i>

                            <h5>

                                No Opportunity

                            </h5>

                            <p>

                                No potential order has been recorded.

                            </p>

                        </div>

                    </template>

                </div>

            </div>

        </div>

    </div>

    <!-- ==========================================================
        NEXT :
        POTENTIAL PER SALES
        POTENTIAL PER CUSTOMER
    =========================================================== -->
        <!-- ==========================================================
        PERFORMANCE
    =========================================================== -->

    <div class="row g-4 mb-4">

        <!-- =====================================================
            TOP SALES OPPORTUNITY
        ====================================================== -->

        <div class="col-xl-6">

            <div class="dashboard-card h-100">

                <div class="card-header-custom">

                    <div class="d-flex justify-content-between align-items-center">

                        <div>

                            <h5 class="mb-1">

                                <i class="fa-solid fa-trophy text-warning me-2"></i>

                                Top Sales Opportunity

                            </h5>

                            <small class="text-muted">

                                Sales with highest potential order

                            </small>

                        </div>

                        <span class="badge bg-success">

                            {{ dashboard.potential_per_sales.length }}

                            Sales

                        </span>

                    </div>

                </div>

                <div class="card-body-custom">

                    <template v-if="dashboard.potential_per_sales.length">

                        <div

                            v-for="(item,index) in dashboard.potential_per_sales"

                            :key="item.id_user"

                            class="sales-rank-card"

                        >

                            <div class="sales-rank">

                                <div
                                    class="rank-circle"

                                    :class="{

                                        gold:index===0,

                                        silver:index===1,

                                        bronze:index===2

                                    }">

                                    {{ index+1 }}

                                </div>

                            </div>

                            <div class="sales-avatar">

                                {{ item.sales_name.charAt(0) }}

                            </div>

                            <div class="flex-grow-1">

                                <div class="fw-bold">

                                    {{ item.sales_name }}

                                </div>

                                <small class="text-muted">

                                    Sales Executive

                                </small>

                                <div class="progress mt-2">

                                    <div

                                        class="progress-bar bg-success"

                                        :style="{

                                            width:

                                            (item.total /

                                            dashboard.summary.total_potential_order *100)

                                            +'%'

                                        }">

                                    </div>

                                </div>

                            </div>

                            <div class="text-end">

                                <h4 class="mb-0 text-success">

                                    {{ item.total }}

                                </h4>

                                <small>

                                    Potential

                                </small>

                            </div>

                        </div>

                    </template>

                    <template v-else>

                        <div class="empty-chart">

                            <i class="fa-solid fa-user-group"></i>

                            <h5>

                                No Sales Data

                            </h5>

                            <p>

                                No sales opportunity available.

                            </p>

                        </div>

                    </template>

                </div>

            </div>

        </div>

        <!-- =====================================================
            TOP CUSTOMER
        ====================================================== -->

        <div class="col-xl-6">

            <div class="dashboard-card h-100">

                <div class="card-header-custom">

                    <div class="d-flex justify-content-between align-items-center">

                        <div>

                            <h5 class="mb-1">

                                <i class="fa-solid fa-building text-primary me-2"></i>

                                Top Customer Opportunity

                            </h5>

                            <small class="text-muted">

                                Customer with biggest opportunity

                            </small>

                        </div>

                        <span class="badge bg-primary">

                            {{ dashboard.potential_per_customer.length }}

                            Customer

                        </span>

                    </div>

                </div>

                <div class="card-body-custom">

                    <template

                        v-if="dashboard.potential_per_customer.length"

                    >

                        <div

                            v-for="item in dashboard.potential_per_customer"

                            :key="item.customer_name"

                            class="customer-card"

                        >

                            <div class="customer-icon">

                                <i class="fa-solid fa-building"></i>

                            </div>

                            <div class="flex-grow-1">

                                <div class="fw-semibold">

                                    {{ item.customer_name }}

                                </div>

                                <small class="text-muted">

                                    Opportunity Customer

                                </small>

                                <div class="progress mt-2">

                                    <div

                                        class="progress-bar bg-primary"

                                        :style="{

                                            width:

                                            (item.total /

                                            dashboard.summary.total_potential_order*100)

                                            +'%'

                                        }">

                                    </div>

                                </div>

                            </div>

                            <div class="text-end">

                                <h4 class="mb-0">

                                    {{ item.total }}

                                </h4>

                                <small>

                                    Opportunity

                                </small>

                            </div>

                        </div>

                    </template>

                    <template v-else>

                        <div class="empty-chart">

                            <i class="fa-solid fa-building"></i>

                            <h5>

                                No Customer

                            </h5>

                            <p>

                                No customer opportunity available.

                            </p>

                        </div>

                    </template>

                </div>

            </div>

        </div>

    </div>

    <!-- ==========================================================
        NEXT :
        LATEST POTENTIAL ORDER
    =========================================================== -->

        <!-- ==========================================================
        LATEST POTENTIAL ORDER
    =========================================================== -->

    <div class="row">

        <div class="col-12">

            <div class="dashboard-card">

                <div class="card-header-custom">

                    <div class="d-flex justify-content-between align-items-center">

                        <div>

                            <h5 class="mb-1">

                                <i class="fa-solid fa-clock-rotate-left text-success me-2"></i>

                                Latest Potential Order

                            </h5>

                            <small class="text-muted">

                                Latest sales opportunities generated

                            </small>

                        </div>

                        <span class="badge bg-success">

                            {{ dashboard.latest_potential_order.length }}

                            Opportunities

                        </span>

                    </div>

                </div>

                <div class="card-body-custom">

                    <template

                        v-if="dashboard.latest_potential_order.length"

                    >

                        <div class="timeline">

                            <div

                                v-for="item in dashboard.latest_potential_order"

                                :key="item.id"

                                class="timeline-item"

                            >

                                <!-- DOT -->

                                <div class="timeline-dot success">

                                    <i class="fa-solid fa-sack-dollar"></i>

                                </div>

                                <!-- CONTENT -->

                                <div class="timeline-content">

                                    <div class="d-flex justify-content-between align-items-start flex-wrap">

                                        <div>

                                            <h5 class="mb-1">

                                                {{ item.title }}

                                            </h5>

                                            <span class="badge bg-success">

                                                Potential Order

                                            </span>

                                        </div>

                                        <small class="text-muted">

                                            {{ formatDateTime(item.created_at) }}

                                        </small>

                                    </div>

                                    <p class="text-muted mt-3">

                                        {{ item.description }}

                                    </p>

                                    <div class="row mt-4">

                                        <div class="col-lg-3">

                                            <small class="text-muted">

                                                Customer

                                            </small>

                                            <div class="fw-semibold">

                                                {{ item.customer_name }}

                                            </div>

                                        </div>

                                        <div class="col-lg-3">

                                            <small class="text-muted">

                                                Sales

                                            </small>

                                            <div class="fw-semibold">

                                                {{ item.sales_name }}

                                            </div>

                                        </div>

                                        <div class="col-lg-3">

                                            <small class="text-muted">

                                                Estimated Value

                                            </small>

                                            <div class="fw-bold text-success">

                                                {{ item.estimated_value }}

                                            </div>

                                        </div>

                                        <div class="col-lg-3">

                                            <small class="text-muted">

                                                Expected Closing

                                            </small>

                                            <div class="fw-semibold">

                                                {{ item.expected_closing }}

                                            </div>

                                        </div>

                                    </div>

                                    <hr>

                                    <div class="d-flex justify-content-between align-items-center">

                                        <div>

                                            <small class="text-muted">

                                                Probability

                                            </small>

                                        </div>

                                        <div>

                                            <span

                                                class="badge"

                                                :class="{

                                                    'bg-success':item.probability>=80,

                                                    'bg-warning text-dark':item.probability>=50 && item.probability<80,

                                                    'bg-danger':item.probability<50

                                                }"

                                            >

                                                {{ item.probability }}%

                                            </span>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </template>

                    <!-- EMPTY -->

                    <template v-else>

                        <div class="empty-chart">

                            <i class="fa-solid fa-seedling text-success"></i>

                            <h4 class="mt-3">

                                No Potential Order

                            </h4>

                            <p class="text-muted">

                                There are no sales opportunities during this period.

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

    ref,
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

/* ==========================================================
STATE
========================================================== */

const loading = ref(false)

/* ==========================================================
DASHBOARD
========================================================== */

const dashboard = ref({

    summary:{

        total_visit:126,

        total_potential_order:42,

        potential_rate:33.3

    },

    daily_trend:[

        {

            date:'01 Jul',

            total:2

        },

        {

            date:'02 Jul',

            total:5

        },

        {

            date:'03 Jul',

            total:3

        },

        {

            date:'04 Jul',

            total:6

        },

        {

            date:'05 Jul',

            total:4

        },

        {

            date:'06 Jul',

            total:8

        },

        {

            date:'07 Jul',

            total:5

        },

        {

            date:'08 Jul',

            total:4

        },

        {

            date:'09 Jul',

            total:5

        }

    ],

    potential_per_sales:[

        {

            id_user:1,

            sales_name:'John Smith',

            total:18

        },

        {

            id_user:2,

            sales_name:'Michael Johnson',

            total:13

        },

        {

            id_user:3,

            sales_name:'Anderson Lee',

            total:11

        }

    ],

    potential_per_customer:[

        {

            customer_name:'PT Astra International',

            total:18

        },

        {

            customer_name:'PT Panasonic',

            total:13

        },

        {

            customer_name:'PT Toyota Motor',

            total:11

        }

    ],

    latest_potential_order:[

        {

            id:1,

            title:'Potential Order Created',

            description:'Customer is interested in purchasing industrial pipe products.',

            customer_name:'PT Astra International',

            sales_name:'John Smith',

            estimated_value:'Rp 325.000.000',

            probability:90,

            expected_closing:'25 Jul 2026',

            created_at:'2026-07-10 09:15:00'

        },

        {

            id:2,

            title:'Quotation Submitted',

            description:'Quotation has been sent to customer.',

            customer_name:'PT Panasonic',

            sales_name:'Michael Johnson',

            estimated_value:'Rp 180.000.000',

            probability:70,

            expected_closing:'28 Jul 2026',

            created_at:'2026-07-09 15:30:00'

        },

        {

            id:3,

            title:'Negotiation',

            description:'Customer requested price adjustment before purchase.',

            customer_name:'PT Toyota Motor',

            sales_name:'Anderson Lee',

            estimated_value:'Rp 150.000.000',

            probability:55,

            expected_closing:'30 Jul 2026',

            created_at:'2026-07-08 13:10:00'

        }

    ]

})

/* ==========================================================
FORMAT DATETIME
========================================================== */

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

    ).format(

        new Date(date)

    )

}

/* ==========================================================
REFRESH
========================================================== */

const refresh=()=>{

    loading.value=true

    setTimeout(()=>{

        loading.value=false

    },700)

}

/* ==========================================================
LINE CHART
========================================================== */

const dailyTrendChart = computed(() => ({

    labels: dashboard.value.daily_trend.map(
        item => item.date
    ),

    datasets: [

        {

            label: 'Potential Order',

            data: dashboard.value.daily_trend.map(
                item => item.total
            ),

            borderColor: '#10B981',

            backgroundColor: 'rgba(16,185,129,.12)',

            fill: true,

            tension: .4,

            borderWidth: 3,

            pointRadius: 5,

            pointHoverRadius: 8,

            pointBackgroundColor: '#10B981',

            pointBorderColor: '#ffffff',

            pointBorderWidth: 2

        }

    ]

}))

/* ==========================================================
DOUGHNUT CHART
========================================================== */

const percentageChart = computed(() => ({

    labels: [

        'Potential',

        'No Potential'

    ],

    datasets: [

        {

            data: [

                dashboard.value.summary.total_potential_order,

                dashboard.value.summary.total_visit -

                dashboard.value.summary.total_potential_order

            ],

            backgroundColor: [

                '#10B981',

                '#E2E8F0'

            ],

            borderWidth: 0,

            hoverOffset: 10

        }

    ]

}))

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

            titleColor: '#fff',

            bodyColor: '#fff',

            padding: 12,

            displayColors: false

        }

    },

    scales: {

        x: {

            grid: {

                display: false

            },

            ticks: {

                color: '#64748B'

            }

        },

        y: {

            beginAtZero: true,

            ticks: {

                precision: 0,

                color: '#64748B'

            },

            grid: {

                color: '#EDF2F7'

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

            backgroundColor: '#1E293B',

            titleColor: '#fff',

            bodyColor: '#fff'

        }

    }

}

/* ==========================================================
LOAD DASHBOARD
========================================================== */

const loadDashboard = async () => {

    loading.value = true

    try {

        /*
        const { data } = await axios.get(

            '/api/dashboard/manager/potential-order'

        )

        dashboard.value = data.data
        */

        console.log('Potential Dashboard Loaded')

    }

    catch(error){

        console.error(error)

    }

    finally{

        loading.value = false

    }

}

/* ==========================================================
LIFECYCLE
========================================================== */

onMounted(() => {

    loadDashboard()

})

</script>

<style scoped>

/* ==========================================================
PAGE
========================================================== */

.potential-dashboard{

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

    border:1px solid #edf2f7;

    box-shadow:
        0 15px 40px rgba(15,23,42,.06);

}

/* Background Decoration */

.dashboard-header::before{

    content:"";

    position:absolute;

    width:360px;

    height:360px;

    border-radius:50%;

    background:
        radial-gradient(
            rgba(16,185,129,.08),
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
            rgba(34,197,94,.08),
            transparent
        );

    left:-80px;

    bottom:-80px;

}

/* ==========================================================
HEADER ICON
========================================================== */

.header-icon{

    width:78px;

    height:78px;

    border-radius:22px;

    display:flex;

    justify-content:center;

    align-items:center;

    color:#fff;

    font-size:34px;

    flex-shrink:0;

}

.header-icon.success{

    background:
        linear-gradient(
            135deg,
            #059669,
            #10b981
        );

    box-shadow:
        0 18px 35px rgba(16,185,129,.30);

}

.dashboard-label{

    font-size:.78rem;

    font-weight:700;

    letter-spacing:1px;

}

.dashboard-title{

    margin:6px 0;

    font-size:2rem;

    font-weight:700;

    color:#0f172a;

}

.dashboard-subtitle{

    color:#64748b;

    font-size:.95rem;

}

/* ==========================================================
HEADER ACTION
========================================================== */

.header-action{

    display:flex;

    justify-content:flex-end;

    align-items:center;

    gap:12px;

}

.btn-header{

    padding:10px 18px;

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

    transform:translateY(-4px);

    background:#fff;

    box-shadow:
        0 12px 25px rgba(15,23,42,.06);

}

.mini-stat small{

    display:block;

    color:#94a3b8;

    margin-bottom:8px;

}

.mini-stat h6{

    margin:0;

    font-size:1.05rem;

    font-weight:700;

    color:#0f172a;

}

/* ==========================================================
KPI CARD
========================================================== */

.kpi-card{

    position:relative;

    overflow:hidden;

    min-height:180px;

    border-radius:22px;

    display:flex;

    justify-content:space-between;

    align-items:center;

    padding:26px;

    color:#fff;

    transition:.35s;

    cursor:pointer;

}

.kpi-card:hover{

    transform:translateY(-8px);

    box-shadow:
        0 24px 45px rgba(0,0,0,.16);

}

/* Decoration */

.kpi-card::before{

    content:"";

    position:absolute;

    width:190px;

    height:190px;

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

/* ==========================================================
KPI CONTENT
========================================================== */

.kpi-content{

    position:relative;

    z-index:2;

    width:100%;

}

.kpi-content small{

    opacity:.92;

    display:block;

}

.kpi-content h2{

    margin:10px 0;

    font-size:42px;

    font-weight:700;

}

.kpi-footer{

    display:flex;

    justify-content:space-between;

    align-items:center;

    font-size:.88rem;

    opacity:.95;

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
CARD COLOR
========================================================== */

.card-primary{

    background:
        linear-gradient(
            135deg,
            #2563eb,
            #3b82f6
        );

}

.card-success{

    background:
        linear-gradient(
            135deg,
            #059669,
            #10b981
        );

}

.card-emerald{

    background:
        linear-gradient(
            135deg,
            #047857,
            #34d399
        );

}

/* ==========================================================
PROGRESS
========================================================== */

.progress{

    height:8px;

    border-radius:999px;

    overflow:hidden;

    background:rgba(255,255,255,.18);

}

.progress-bar{

    border-radius:999px;

}

/* ==========================================================
BUTTON
========================================================== */

.btn{

    border-radius:12px;

}

/* ==========================================================
FADE
========================================================== */

.dashboard-header,

.kpi-card{

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

    transform:translateY(-4px);

    box-shadow:0 20px 45px rgba(15,23,42,.10);

}

.card-header-custom{

    padding:22px 24px;

    border-bottom:1px solid #edf2f7;

    background:#fff;

}

.card-header-custom h5{

    margin:0;

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
TREND SUMMARY
========================================================== */

.trend-summary{

    background:#f8fafc;

    border:1px solid #edf2f7;

    border-radius:14px;

    padding:16px;

    text-align:center;

}

.trend-summary small{

    color:#94a3b8;

}

.trend-summary h4{

    margin-top:8px;

    margin-bottom:0;

    font-weight:700;

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

.dot-success{

    background:#10b981;

}

.dot-primary{

    background:#2563eb;

}

.dot-warning{

    background:#f59e0b;

}

/* ==========================================================
TOP SALES
========================================================== */

.sales-rank-card{

    display:flex;

    align-items:center;

    gap:16px;

    padding:16px;

    border-radius:16px;

    transition:.3s;

    margin-bottom:14px;

}

.sales-rank-card:hover{

    background:#f8fafc;

    transform:translateX(6px);

}

.rank-circle{

    width:40px;

    height:40px;

    border-radius:50%;

    display:flex;

    justify-content:center;

    align-items:center;

    color:#fff;

    font-weight:700;

    background:#94a3b8;

}

.rank-circle.gold{

    background:#f59e0b;

}

.rank-circle.silver{

    background:#94a3b8;

}

.rank-circle.bronze{

    background:#b45309;

}

.sales-avatar{

    width:52px;

    height:52px;

    border-radius:50%;

    background:linear-gradient(
        135deg,
        #10b981,
        #059669
    );

    color:#fff;

    display:flex;

    justify-content:center;

    align-items:center;

    font-weight:700;

    font-size:20px;

}

/* ==========================================================
CUSTOMER
========================================================== */

.customer-card{

    display:flex;

    align-items:center;

    gap:16px;

    margin-bottom:18px;

}

.customer-icon{

    width:52px;

    height:52px;

    border-radius:16px;

    background:#d1fae5;

    color:#059669;

    display:flex;

    justify-content:center;

    align-items:center;

    font-size:22px;

}

.customer-card:last-child{

    margin-bottom:0;

}

/* ==========================================================
TIMELINE
========================================================== */

.timeline{

    position:relative;

    padding-left:30px;

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

    margin-bottom:30px;

}

.timeline-item:last-child{

    margin-bottom:0;

}

.timeline-dot{

    position:absolute;

    left:-30px;

    top:8px;

    width:32px;

    height:32px;

    border-radius:50%;

    display:flex;

    justify-content:center;

    align-items:center;

    color:#fff;

    font-size:13px;

    box-shadow:0 8px 20px rgba(16,185,129,.30);

}

.timeline-dot.success{

    background:#10b981;

}

.timeline-content{

    background:#fff;

    border:1px solid #edf2f7;

    border-radius:18px;

    padding:22px;

    transition:.3s;

}

.timeline-content:hover{

    border-color:#a7f3d0;

    box-shadow:0 15px 30px rgba(16,185,129,.08);

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

}

.empty-chart i{

    font-size:60px;

    color:#cbd5e1;

    margin-bottom:18px;

}

.empty-chart h5{

    font-weight:700;

    margin-bottom:10px;

    color:#334155;

}

.empty-chart p{

    color:#94a3b8;

    max-width:280px;

}

/* ==========================================================
BADGE
========================================================== */

.badge{

    border-radius:999px;

    padding:7px 14px;

    font-weight:600;

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

        font-size:1.5rem;

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

        padding-left:20px;

    }

    .timeline-dot{

        left:-20px;

        width:24px;

        height:24px;

        font-size:11px;

    }

    .sales-rank-card{

        flex-direction:column;

        align-items:flex-start;

    }

}

</style>