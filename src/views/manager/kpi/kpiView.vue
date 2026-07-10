<template>

<div class="kpi-dashboard container-fluid py-4">

    <!-- ==========================================================
        HEADER
    =========================================================== -->

    <div class="dashboard-header mb-4">

        <div class="row align-items-center">

            <!-- LEFT -->

            <div class="col-lg-8">

                <div class="d-flex align-items-center gap-3">

                    <div class="header-icon">

                        <i class="fa-solid fa-chart-simple"></i>

                    </div>

                    <div>

                        <span class="dashboard-label text-primary">

                            SALES PERFORMANCE

                        </span>

                        <h2 class="dashboard-title">

                            Executive KPI Dashboard

                        </h2>

                        <p class="dashboard-subtitle mb-0">

                            Monitor your sales performance, CRM activity and business growth in real time.

                        </p>

                    </div>

                </div>

            </div>

            <!-- RIGHT -->

            <div class="col-lg-4">

                <div class="header-action">

                    <button class="btn btn-light btn-header">

                        <i class="fa-solid fa-calendar-days me-2"></i>

                        July 2026

                    </button>

                    <button
                        class="btn btn-primary btn-header"
                        @click="refresh">

                        <i class="fa-solid fa-rotate-right me-2"></i>

                        Refresh

                    </button>

                </div>

            </div>

        </div>

        <hr class="my-4">

        <!-- =====================================================
            QUICK SUMMARY
        ====================================================== -->

        <div class="row g-3">

            <div class="col-lg-3">

                <div class="mini-stat">

                    <small>

                        Last Update

                    </small>

                    <h6>

                        10 Jul 2026

                    </h6>

                </div>

            </div>

            <div class="col-lg-3">

                <div class="mini-stat">

                    <small>

                        Conversion Rate

                    </small>

                    <h6 class="text-success">

                        {{ dashboard.kpi.conversion_rate }}%

                    </h6>

                </div>

            </div>

            <div class="col-lg-3">

                <div class="mini-stat">

                    <small>

                        Active Customer

                    </small>

                    <h6>

                        {{ dashboard.summary.customer }}

                    </h6>

                </div>

            </div>

            <div class="col-lg-3">

                <div class="mini-stat">

                    <small>

                        CRM Health

                    </small>

                    <h6 class="text-primary">

                        Excellent

                    </h6>

                </div>

            </div>

        </div>

    </div>

    <!-- ==========================================================
        KPI ROW 1
    =========================================================== -->

    <div class="row g-4 mb-4">

        <!-- LEAD -->

        <div class="col-xl-3 col-md-6">

            <div class="kpi-card card-blue">

                <div class="kpi-content">

                    <small>

                        Lead

                    </small>

                    <h2>

                        {{ dashboard.summary.lead }}

                    </h2>

                    <span>

                        Total Lead

                    </span>

                </div>

                <div class="kpi-icon">

                    <i class="fa-solid fa-user-plus"></i>

                </div>

            </div>

        </div>

        <!-- CUSTOMER -->

        <div class="col-xl-3 col-md-6">

            <div class="kpi-card card-green">

                <div class="kpi-content">

                    <small>

                        Customer

                    </small>

                    <h2>

                        {{ dashboard.summary.customer }}

                    </h2>

                    <span>

                        Active Customer

                    </span>

                </div>

                <div class="kpi-icon">

                    <i class="fa-solid fa-building"></i>

                </div>

            </div>

        </div>

        <!-- VISIT -->

        <div class="col-xl-3 col-md-6">

            <div class="kpi-card card-purple">

                <div class="kpi-content">

                    <small>

                        Visit

                    </small>

                    <h2>

                        {{ dashboard.summary.visit }}

                    </h2>

                    <span>

                        Customer Visit

                    </span>

                </div>

                <div class="kpi-icon">

                    <i class="fa-solid fa-map-location-dot"></i>

                </div>

            </div>

        </div>

        <!-- FOLLOW UP -->

        <div class="col-xl-3 col-md-6">

            <div class="kpi-card card-orange">

                <div class="kpi-content">

                    <small>

                        Follow Up

                    </small>

                    <h2>

                        {{ dashboard.summary.follow_up }}

                    </h2>

                    <span>

                        Active Follow Up

                    </span>

                </div>

                <div class="kpi-icon">

                    <i class="fa-solid fa-list-check"></i>

                </div>

            </div>

        </div>

    </div>

    <!-- ==========================================================
        NEXT
        KPI ROW 2
    =========================================================== -->
        <!-- ==========================================================
        KPI ROW 2
    =========================================================== -->

    <div class="row g-4 mb-4">

        <!-- CONVERSION -->

        <div class="col-xl-3 col-md-6">

            <div class="analytics-card">

                <div class="analytics-icon bg-success">

                    <i class="fa-solid fa-arrow-trend-up"></i>

                </div>

                <div class="analytics-content">

                    <small>

                        Conversion Rate

                    </small>

                    <h2>

                        {{ dashboard.kpi.conversion_rate }}%

                    </h2>

                    <div class="progress mt-3">

                        <div

                            class="progress-bar bg-success"

                            :style="{

                                width:

                                dashboard.kpi.conversion_rate+'%'

                            }">

                        </div>

                    </div>

                    <div class="analytics-footer">

                        Lead → Customer

                    </div>

                </div>

            </div>

        </div>

        <!-- COMPLAINT -->

        <div class="col-xl-3 col-md-6">

            <div class="analytics-card">

                <div class="analytics-icon bg-danger">

                    <i class="fa-solid fa-circle-exclamation"></i>

                </div>

                <div class="analytics-content">

                    <small>

                        Complaint Rate

                    </small>

                    <h2>

                        {{ dashboard.kpi.complaint_rate }}%

                    </h2>

                    <div class="progress mt-3">

                        <div

                            class="progress-bar bg-danger"

                            :style="{

                                width:

                                dashboard.kpi.complaint_rate+'%'

                            }">

                        </div>

                    </div>

                    <div class="analytics-footer">

                        Customer Complaint

                    </div>

                </div>

            </div>

        </div>

        <!-- POTENTIAL -->

        <div class="col-xl-3 col-md-6">

            <div class="analytics-card">

                <div class="analytics-icon bg-info">

                    <i class="fa-solid fa-sack-dollar"></i>

                </div>

                <div class="analytics-content">

                    <small>

                        Potential Rate

                    </small>

                    <h2>

                        {{ dashboard.kpi.potential_rate }}%

                    </h2>

                    <div class="progress mt-3">

                        <div

                            class="progress-bar bg-info"

                            :style="{

                                width:

                                dashboard.kpi.potential_rate+'%'

                            }">

                        </div>

                    </div>

                    <div class="analytics-footer">

                        Sales Opportunity

                    </div>

                </div>

            </div>

        </div>

        <!-- OVERDUE -->

        <div class="col-xl-3 col-md-6">

            <div class="analytics-card">

                <div class="analytics-icon bg-warning">

                    <i class="fa-solid fa-clock"></i>

                </div>

                <div class="analytics-content">

                    <small>

                        Overdue Follow Up

                    </small>

                    <h2>

                        {{ dashboard.summary.overdue_follow_up }}

                    </h2>

                    <div class="progress mt-3">

                        <div

                            class="progress-bar bg-warning"

                            :style="{

                                width:

                                (dashboard.summary.overdue_follow_up*10)+'%'

                            }">

                        </div>

                    </div>

                    <div class="analytics-footer">

                        Need Immediate Action

                    </div>

                </div>

            </div>

        </div>

    </div>

    <!-- ==========================================================
        TOP PERFORMANCE
    =========================================================== -->

    <div class="row g-4 mb-4">

        <!-- TOP SALES -->

        <div class="col-xl-6">

            <div class="dashboard-card">

                <div class="card-header-custom">

                    <h5>

                        <i class="fa-solid fa-trophy text-warning me-2"></i>

                        Top Sales

                    </h5>

                </div>

                <div class="card-body-custom">

                    <div class="top-profile">

                        <div class="profile-avatar">

                            {{ dashboard.top_sales.fullname.charAt(0).toUpperCase() }}

                        </div>

                        <div class="profile-content">

                            <h4>

                                {{ dashboard.top_sales.fullname }}

                            </h4>

                            <p>

                                Sales Champion This Month

                            </p>

                            <span class="badge bg-success">

                                {{ dashboard.top_sales.total_visit }}

                                Visit

                            </span>

                        </div>

                    </div>

                </div>

            </div>

        </div>

        <!-- TOP CUSTOMER -->

        <div class="col-xl-6">

            <div class="dashboard-card">

                <div class="card-header-custom">

                    <h5>

                        <i class="fa-solid fa-building text-primary me-2"></i>

                        Top Customer

                    </h5>

                </div>

                <div class="card-body-custom">

                    <div class="top-profile">

                        <div class="profile-avatar bg-primary">

                            <i class="fa-solid fa-building"></i>

                        </div>

                        <div class="profile-content">

                            <h4>

                                {{ dashboard.top_customer.company_name }}

                            </h4>

                            <p>

                                {{ dashboard.top_customer.customer_code }}

                            </p>

                            <span class="badge bg-primary">

                                {{ dashboard.top_customer.total_visit }}

                                Visit

                            </span>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    </div>

    <!-- ==========================================================
        NEXT :
        MANAGER INSIGHT
    =========================================================== -->
        <!-- ==========================================================
        MANAGER INSIGHT
    =========================================================== -->

    <div class="row">

        <div class="col-12">

            <div class="dashboard-card">

                <div class="card-header-custom">

                    <div class="d-flex justify-content-between align-items-center">

                        <div>

                            <h5 class="mb-1">

                                <i class="fa-solid fa-lightbulb text-warning me-2"></i>

                                Manager Insight

                            </h5>

                            <small class="text-muted">

                                Smart recommendations based on current KPI

                            </small>

                        </div>

                        <span class="badge bg-primary">

                            {{ dashboard.insight.length }}

                            Insight

                        </span>

                    </div>

                </div>

                <div class="card-body-custom">

                    <template v-if="dashboard.insight.length">

                        <div
                            v-for="(item,index) in dashboard.insight"
                            :key="index"
                            class="insight-card"
                            :class="{

                                warning:item.type==='warning',

                                success:item.type==='success',

                                info:item.type==='info',

                                danger:item.type==='danger'

                            }">

                            <!-- ICON -->

                            <div class="insight-icon">

                                <i

                                    v-if="item.type==='warning'"

                                    class="fa-solid fa-triangle-exclamation">

                                </i>

                                <i

                                    v-else-if="item.type==='success'"

                                    class="fa-solid fa-circle-check">

                                </i>

                                <i

                                    v-else-if="item.type==='danger'"

                                    class="fa-solid fa-circle-xmark">

                                </i>

                                <i

                                    v-else

                                    class="fa-solid fa-circle-info">

                                </i>

                            </div>

                            <!-- CONTENT -->

                            <div class="flex-grow-1">

                                <h5>

                                    {{ item.title }}

                                </h5>

                                <p>

                                    {{ item.message }}

                                </p>

                            </div>

                            <!-- STATUS -->

                            <div>

                                <span

                                    class="badge"

                                    :class="{

                                        'bg-warning text-dark':item.type==='warning',

                                        'bg-success':item.type==='success',

                                        'bg-danger':item.type==='danger',

                                        'bg-info':item.type==='info'

                                    }">

                                    {{ item.type.toUpperCase() }}

                                </span>

                            </div>

                        </div>

                    </template>

                    <template v-else>

                        <div class="empty-chart">

                            <i class="fa-solid fa-lightbulb"></i>

                            <h4>

                                No Insight Available

                            </h4>

                            <p>

                                There are no recommendations for this period.

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

    ArcElement,

    Tooltip,

    Legend,

    CategoryScale,

    LinearScale,

    BarElement

} from 'chart.js'

import {

    Doughnut,

    Bar

} from 'vue-chartjs'

ChartJS.register(

    ArcElement,

    Tooltip,

    Legend,

    CategoryScale,

    LinearScale,

    BarElement

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

        lead:2,

        customer:2,

        visit:0,

        visit_today:0,

        follow_up:3,

        overdue_follow_up:2,

        complaint:0,

        potential_order:0

    },

    kpi:{

        conversion_rate:100,

        complaint_rate:0,

        potential_rate:0

    },

    top_sales:{

        id_user:1,

        fullname:'Apregi Pratayuda',

        total_visit:0

    },

    top_customer:{

        customer_code:'CUST-000001',

        company_name:'PT Maju Jaya',

        total_visit:0

    },

    insight:[

        {

            type:'warning',

            title:'Follow Up Overdue',

            message:'2 follow up belum dikerjakan.'

        },

        {

            type:'info',

            title:'Top Sales',

            message:'Apregi Pratayuda menjadi sales paling aktif bulan ini.'

        }

    ]

})

/* ==========================================================
OVERALL SCORE
========================================================== */

const overallScore = computed(()=>{

    let score = 100

    score -= dashboard.value.summary.overdue_follow_up * 5

    score -= dashboard.value.kpi.complaint_rate

    score += dashboard.value.kpi.conversion_rate * .10

    score += dashboard.value.kpi.potential_rate * .05

    if(score>100){

        score=100

    }

    if(score<0){

        score=0

    }

    return Math.round(score)

})

/* ==========================================================
GRADE
========================================================== */

const overallGrade = computed(()=>{

    if(overallScore.value>=90){

        return 'A+'

    }

    if(overallScore.value>=80){

        return 'A'

    }

    if(overallScore.value>=70){

        return 'B'

    }

    if(overallScore.value>=60){

        return 'C'

    }

    return 'D'

})

/* ==========================================================
FORMAT NUMBER
========================================================== */

const formatNumber=(value)=>{

    return new Intl.NumberFormat(

        'id-ID'

    ).format(value)

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
OVERALL KPI SCORE CHART
========================================================== */

const overallScoreChart = computed(() => ({

    labels: [

        'Score',

        'Remaining'

    ],

    datasets: [

        {

            data: [

                overallScore.value,

                100 - overallScore.value

            ],

            backgroundColor: [

                '#2563EB',

                '#E5E7EB'

            ],

            borderWidth: 0,

            hoverOffset: 6

        }

    ]

}))

/* ==========================================================
KPI COMPARISON CHART
========================================================== */

const kpiComparisonChart = computed(() => ({

    labels: [

        'Lead',

        'Customer',

        'Visit',

        'Follow Up',

        'Complaint',

        'Potential'

    ],

    datasets: [

        {

            label:'Total',

            data:[

                dashboard.value.summary.lead,

                dashboard.value.summary.customer,

                dashboard.value.summary.visit,

                dashboard.value.summary.follow_up,

                dashboard.value.summary.complaint,

                dashboard.value.summary.potential_order

            ],

            borderRadius:8,

            backgroundColor:[

                '#2563EB',

                '#10B981',

                '#8B5CF6',

                '#F59E0B',

                '#EF4444',

                '#06B6D4'

            ]

        }

    ]

}))

/* ==========================================================
DOUGHNUT OPTION
========================================================== */

const doughnutOptions = {

    responsive:true,

    maintainAspectRatio:false,

    cutout:'78%',

    plugins:{

        legend:{

            display:false

        },

        tooltip:{

            backgroundColor:'#0F172A',

            titleColor:'#fff',

            bodyColor:'#fff'

        }

    }

}

/* ==========================================================
BAR OPTION
========================================================== */

const barOptions = {

    responsive:true,

    maintainAspectRatio:false,

    plugins:{

        legend:{

            display:false

        }

    },

    scales:{

        x:{

            grid:{

                display:false

            }

        },

        y:{

            beginAtZero:true,

            ticks:{

                precision:0

            },

            grid:{

                color:'#EEF2F7'

            }

        }

    }

}

/* ==========================================================
LOAD KPI DASHBOARD
========================================================== */

const loadDashboard = async()=>{

    loading.value=true

    try{

        /*
        const { data } = await axios.get(

            '/api/dashboard/manager/kpi'

        )

        dashboard.value=data.data
        */

        console.log(

            'Executive KPI Dashboard Loaded'

        )

    }

    catch(error){

        console.error(error)

    }

    finally{

        loading.value=false

    }

}

/* ==========================================================
LIFECYCLE
========================================================== */

onMounted(()=>{

    loadDashboard()

})

</script>

<style scoped>
/* ==========================================================
PAGE
========================================================== */

.kpi-dashboard{

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

.dashboard-header::before{

    content:"";

    position:absolute;

    width:360px;

    height:360px;

    border-radius:50%;

    background:
        radial-gradient(
            rgba(37,99,235,.08),
            transparent
        );

    right:-120px;

    top:-120px;

}

.dashboard-header::after{

    content:"";

    position:absolute;

    width:220px;

    height:220px;

    border-radius:50%;

    background:
        radial-gradient(
            rgba(16,185,129,.08),
            transparent
        );

    left:-70px;

    bottom:-70px;

}

/* ==========================================================
HEADER ICON
========================================================== */

.header-icon{

    width:80px;

    height:80px;

    border-radius:22px;

    display:flex;

    justify-content:center;

    align-items:center;

    font-size:34px;

    color:#fff;

    background:
        linear-gradient(
            135deg,
            #2563EB,
            #3B82F6
        );

    box-shadow:
        0 18px 35px rgba(37,99,235,.30);

}

.dashboard-label{

    font-size:.8rem;

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

}

/* ==========================================================
BUTTON
========================================================== */

.header-action{

    display:flex;

    justify-content:flex-end;

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

    background:#ffffff;

    box-shadow:
        0 10px 24px rgba(15,23,42,.05);

}

.mini-stat small{

    display:block;

    color:#94a3b8;

    margin-bottom:8px;

}

.mini-stat h6{

    margin:0;

    font-weight:700;

    font-size:1.05rem;

}

/* ==========================================================
KPI CARD
========================================================== */

.kpi-card{

    position:relative;

    overflow:hidden;

    border-radius:22px;

    color:#fff;

    min-height:180px;

    padding:26px;

    display:flex;

    justify-content:space-between;

    align-items:center;

    transition:.35s;

    cursor:pointer;

}

.kpi-card:hover{

    transform:translateY(-8px);

    box-shadow:
        0 25px 45px rgba(0,0,0,.18);

}

.kpi-card::before{

    content:"";

    position:absolute;

    width:180px;

    height:180px;

    border-radius:50%;

    background:rgba(255,255,255,.08);

    right:-60px;

    top:-60px;

}

.kpi-card::after{

    content:"";

    position:absolute;

    width:120px;

    height:120px;

    border-radius:50%;

    background:rgba(255,255,255,.05);

    left:-30px;

    bottom:-30px;

}

/* ==========================================================
CONTENT
========================================================== */

.kpi-content{

    position:relative;

    z-index:2;

}

.kpi-content small{

    display:block;

    opacity:.9;

}

.kpi-content h2{

    margin:10px 0;

    font-size:42px;

    font-weight:700;

}

.kpi-content span{

    opacity:.9;

    font-size:.9rem;

}

/* ==========================================================
ICON
========================================================== */

.kpi-icon{

    position:relative;

    z-index:2;

    width:72px;

    height:72px;

    border-radius:18px;

    display:flex;

    justify-content:center;

    align-items:center;

    font-size:28px;

    background:rgba(255,255,255,.15);

    backdrop-filter:blur(10px);

}

/* ==========================================================
COLOR
========================================================== */

.card-blue{

    background:
        linear-gradient(
            135deg,
            #2563EB,
            #3B82F6
        );

}

.card-green{

    background:
        linear-gradient(
            135deg,
            #059669,
            #10B981
        );

}

.card-purple{

    background:
        linear-gradient(
            135deg,
            #7C3AED,
            #A855F7
        );

}

.card-orange{

    background:
        linear-gradient(
            135deg,
            #EA580C,
            #FB923C
        );

}

/* ==========================================================
PROGRESS
========================================================== */

.progress{

    height:8px;

    border-radius:999px;

    background:#E5E7EB;

    overflow:hidden;

}

.progress-bar{

    border-radius:999px;

}

/* ==========================================================
ANIMATION
========================================================== */

.dashboard-header,

.kpi-card{

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
/* ==========================================================
ANALYTICS CARD
========================================================== */

.analytics-card{

    background:#ffffff;

    border-radius:22px;

    border:1px solid #edf2f7;

    padding:24px;

    box-shadow:0 10px 35px rgba(15,23,42,.05);

    transition:.3s;

    height:100%;

}

.analytics-card:hover{

    transform:translateY(-5px);

    box-shadow:0 18px 40px rgba(15,23,42,.08);

}

.analytics-icon{

    width:62px;

    height:62px;

    border-radius:18px;

    display:flex;

    justify-content:center;

    align-items:center;

    color:#fff;

    font-size:24px;

    margin-bottom:18px;

}

.analytics-content small{

    display:block;

    color:#94a3b8;

    margin-bottom:8px;

}

.analytics-content h2{

    margin:0;

    font-size:38px;

    font-weight:700;

    color:#0f172a;

}

.analytics-footer{

    margin-top:12px;

    color:#64748b;

    font-size:.9rem;

    font-weight:500;

}

/* ==========================================================
DASHBOARD CARD
========================================================== */

.dashboard-card{

    background:#ffffff;

    border-radius:22px;

    border:1px solid #edf2f7;

    overflow:hidden;

    box-shadow:0 10px 35px rgba(15,23,42,.05);

    transition:.3s;

    height:100%;

}

.dashboard-card:hover{

    transform:translateY(-5px);

    box-shadow:0 18px 40px rgba(15,23,42,.08);

}

.card-header-custom{

    padding:22px 24px;

    border-bottom:1px solid #edf2f7;

}

.card-header-custom h5{

    margin:0;

    font-size:1.1rem;

    font-weight:700;

    color:#0f172a;

}

.card-body-custom{

    padding:24px;

}

/* ==========================================================
TOP PROFILE
========================================================== */

.top-profile{

    display:flex;

    align-items:center;

    gap:22px;

}

.profile-avatar{

    width:90px;

    height:90px;

    border-radius:50%;

    display:flex;

    justify-content:center;

    align-items:center;

    background:linear-gradient(

        135deg,

        #2563eb,

        #3b82f6

    );

    color:#fff;

    font-size:34px;

    font-weight:700;

    flex-shrink:0;

    box-shadow:0 15px 35px rgba(37,99,235,.25);

}

.profile-avatar.bg-primary{

    border-radius:22px;

}

.profile-content{

    flex:1;

}

.profile-content h4{

    margin:0 0 8px;

    font-size:1.35rem;

    font-weight:700;

    color:#0f172a;

}

.profile-content p{

    margin-bottom:14px;

    color:#64748b;

}

/* ==========================================================
OVERALL SCORE
========================================================== */

.score-card{

    background:linear-gradient(

        135deg,

        #2563eb,

        #3b82f6

    );

    color:#fff;

    border-radius:22px;

    padding:26px;

    text-align:center;

    position:relative;

    overflow:hidden;

}

.score-card::before{

    content:"";

    position:absolute;

    width:180px;

    height:180px;

    border-radius:50%;

    background:rgba(255,255,255,.08);

    right:-70px;

    top:-70px;

}

.score-value{

    font-size:60px;

    font-weight:700;

    line-height:1;

}

.score-grade{

    margin-top:10px;

    font-size:28px;

    font-weight:700;

}

.score-text{

    margin-top:12px;

    opacity:.9;

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
BADGE
========================================================== */

.badge{

    padding:8px 16px;

    border-radius:999px;

    font-weight:600;

}

/* ==========================================================
GLASS EFFECT
========================================================== */

.glass-card{

    backdrop-filter:blur(12px);

    background:rgba(255,255,255,.85);

    border:1px solid rgba(255,255,255,.4);

}

/* ==========================================================
SHADOW UTIL
========================================================== */

.shadow-soft{

    box-shadow:

        0 12px 30px rgba(15,23,42,.08);

}

.shadow-hover{

    transition:.3s;

}

.shadow-hover:hover{

    box-shadow:

        0 20px 45px rgba(15,23,42,.12);

}


/* ==========================================================
MANAGER INSIGHT
========================================================== */

.insight-card{

    display:flex;

    align-items:flex-start;

    gap:20px;

    padding:22px;

    border-radius:18px;

    margin-bottom:18px;

    border:1px solid #edf2f7;

    transition:.3s;

    background:#ffffff;

}

.insight-card:last-child{

    margin-bottom:0;

}

.insight-card:hover{

    transform:translateX(6px);

    box-shadow:0 15px 35px rgba(15,23,42,.08);

}

.insight-icon{

    width:56px;

    height:56px;

    border-radius:16px;

    display:flex;

    justify-content:center;

    align-items:center;

    font-size:22px;

    flex-shrink:0;

}

/* ==========================================================
WARNING
========================================================== */

.insight-card.warning{

    border-left:5px solid #f59e0b;

}

.insight-card.warning .insight-icon{

    background:#FEF3C7;

    color:#D97706;

}

/* ==========================================================
SUCCESS
========================================================== */

.insight-card.success{

    border-left:5px solid #10B981;

}

.insight-card.success .insight-icon{

    background:#D1FAE5;

    color:#059669;

}

/* ==========================================================
INFO
========================================================== */

.insight-card.info{

    border-left:5px solid #2563EB;

}

.insight-card.info .insight-icon{

    background:#DBEAFE;

    color:#2563EB;

}

/* ==========================================================
DANGER
========================================================== */

.insight-card.danger{

    border-left:5px solid #EF4444;

}

.insight-card.danger .insight-icon{

    background:#FEE2E2;

    color:#DC2626;

}

/* ==========================================================
INSIGHT CONTENT
========================================================== */

.insight-card h5{

    margin:0 0 8px;

    font-size:1.05rem;

    font-weight:700;

    color:#0f172a;

}

.insight-card p{

    margin:0;

    color:#64748b;

    line-height:1.6;

}

/* ==========================================================
EMPTY STATE
========================================================== */

.empty-chart{

    min-height:320px;

    display:flex;

    flex-direction:column;

    justify-content:center;

    align-items:center;

    text-align:center;

    color:#94A3B8;

}

.empty-chart i{

    font-size:64px;

    margin-bottom:20px;

    color:#CBD5E1;

}

.empty-chart h4{

    margin-bottom:10px;

    color:#334155;

    font-weight:700;

}

.empty-chart p{

    max-width:340px;

    line-height:1.6;

}

/* ==========================================================
UTILITY
========================================================== */

.text-success{

    color:#10B981 !important;

}

.text-danger{

    color:#EF4444 !important;

}

.text-warning{

    color:#F59E0B !important;

}

.text-primary{

    color:#2563EB !important;

}

.text-muted{

    color:#64748B !important;

}

/* ==========================================================
RESPONSIVE
========================================================== */

@media (max-width:1200px){

    .profile-avatar{

        width:74px;

        height:74px;

        font-size:28px;

    }

}

@media (max-width:992px){

    .header-action{

        justify-content:flex-start;

        margin-top:20px;

    }

    .top-profile{

        flex-direction:column;

        text-align:center;

    }

}

@media (max-width:768px){

    .dashboard-header{

        padding:20px;

    }

    .dashboard-title{

        font-size:1.6rem;

    }

    .header-icon{

        width:64px;

        height:64px;

        font-size:28px;

    }

    .kpi-card{

        min-height:160px;

    }

    .kpi-content h2{

        font-size:34px;

    }

    .analytics-content h2{

        font-size:30px;

    }

    .insight-card{

        flex-direction:column;

        text-align:center;

    }

    .insight-icon{

        margin:auto;

    }

}

@media (max-width:576px){

    .dashboard-title{

        font-size:1.4rem;

    }

    .header-action{

        flex-direction:column;

        align-items:stretch;

    }

    .btn-header{

        width:100%;

    }

    .profile-avatar{

        width:64px;

        height:64px;

        font-size:24px;

    }

    .chart-container{

        height:240px;

    }

    .chart-container-lg{

        height:280px;

    }

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

::-webkit-scrollbar-thumb:hover{

    background:#94A3B8;

}
</style>