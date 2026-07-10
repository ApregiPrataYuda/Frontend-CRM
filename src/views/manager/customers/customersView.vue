<template>
    <div class="customer-dashboard container-fluid py-4">

        <!-- =========================
            HEADER
        ========================== -->

        <div class="d-flex justify-content-between align-items-center flex-wrap mb-4">

            <div>

                <h2 class="fw-bold mb-1">
                    Customer Dashboard
                </h2>

                <p class="text-muted mb-0">
                    Monitor customer growth and lead performance for your sales team.
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
            KPI - MAIN
        ========================== -->

        <div class="row g-4 mb-4">

            <div class="col-lg-4">

                <div class="kpi-card card-indigo">

                    <div class="kpi-icon">

                        <i class="ti ti-users"></i>

                    </div>

                    <div>

                        <small>Total Customer</small>

                        <h2>

                            {{ dashboard.summary.total_customer }}

                        </h2>

                        <span class="kpi-text">

                            Customers Recorded

                        </span>

                    </div>

                </div>

            </div>

            <div class="col-lg-4">

                <div class="kpi-card card-success">

                    <div class="kpi-icon">

                        <i class="ti ti-user-plus"></i>

                    </div>

                    <div>

                        <small>New Customer</small>

                        <h2>

                            {{ dashboard.summary.new_customer }}

                        </h2>

                        <span class="kpi-text">

                            Added This Month

                        </span>

                    </div>

                </div>

            </div>

            <div class="col-lg-4">

                <div class="kpi-card card-cyan">

                    <div class="kpi-icon">

                        <i class="ti ti-user-check"></i>

                    </div>

                    <div>

                        <small>Active Customer</small>

                        <h2>

                            {{ dashboard.summary.active_customer }}

                        </h2>

                        <span class="kpi-text">

                            Currently Active

                        </span>

                    </div>

                </div>

            </div>

        </div>

        <!-- =========================
            KPI - STATUS BREAKDOWN
        ========================== -->

        <div class="row g-4 mb-4">

            <div class="col-lg-4">

                <div class="mini-stat">

                    <div class="mini-stat-icon icon-slate">

                        <i class="ti ti-moon"></i>

                    </div>

                    <div>

                        <small>Dormant Customer</small>

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

                        <small>Inactive Customer</small>

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

                        <small>Lost Customer</small>

                        <h4>

                            {{ dashboard.summary.lost_customer }}

                        </h4>

                    </div>

                </div>

            </div>

        </div>

        <!-- =========================
            CHART
        ========================== -->

        <div class="row g-4 mb-4">

            <!-- Lead Source Distribution -->

            <div class="col-lg-5">

                <div class="card dashboard-card h-100">

                    <div class="card-header">

                        <div class="d-flex justify-content-between align-items-center">

                            <div>

                                <h5 class="mb-0">

                                    Lead Source Distribution

                                </h5>

                                <small class="text-muted">

                                    Where Customers Come From

                                </small>

                            </div>

                            <span class="badge bg-primary">

                                {{ dashboard.lead_source.length }}

                                Sources

                            </span>

                        </div>

                    </div>

                    <div class="card-body">

                        <div class="chart-container">

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

            <!-- Customer Growth -->

            <div class="col-lg-7">

                <div class="card dashboard-card h-100">

                    <div class="card-header">

                        <div class="d-flex justify-content-between align-items-center">

                            <div>

                                <h5 class="mb-0">

                                    Customer Growth Trend

                                </h5>

                                <small class="text-muted">

                                    New Customers Over Time

                                </small>

                            </div>

                            <span class="badge bg-success">

                                {{ dashboard.summary.total_customer }}

                            </span>

                        </div>

                    </div>

                    <div class="card-body">

                        <div class="chart-container-lg">

                            <Line
                                :data="customerGrowthChart"
                                :options="lineOptions"
                            />

                        </div>

                    </div>

                </div>

            </div>

        </div>

        <!-- =========================
            TOP SALES + TOP CUSTOMER
        ========================== -->

        <div class="row g-4 mb-4">

            <!-- Top Sales -->

            <div class="col-lg-5">

                <div class="card dashboard-card h-100">

                    <div class="card-header">

                        <div class="d-flex justify-content-between align-items-center">

                            <div>

                                <h5 class="mb-0">

                                    Top Sales by Customer

                                </h5>

                                <small class="text-muted">

                                    Ranked by Customers Acquired

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

                                    {{ sale.total_customer }} Customer

                                </div>

                            </div>

                            <span class="badge bg-primary">

                                {{ sale.total_customer }}

                            </span>

                        </div>

                        <div
                            v-if="!dashboard.top_sales.length"
                            class="text-muted text-center py-4">

                            No sales data yet.

                        </div>

                    </div>

                </div>

            </div>

            <!-- Top Customer -->

            <div class="col-lg-7">

                <div class="card dashboard-card h-100">

                    <div class="card-header">

                        <div class="d-flex justify-content-between align-items-center">

                            <div>

                                <h5 class="mb-0">

                                    Top Customers

                                </h5>

                                <small class="text-muted">

                                    Ranked by Visit Frequency

                                </small>

                            </div>

                            <span class="badge bg-primary">

                                {{ dashboard.top_customer.length }}

                                Customer

                            </span>

                        </div>

                    </div>

                    <div class="card-body">

                        <div class="activity-feed">

                            <div
                                v-for="item in dashboard.top_customer"
                                :key="item.customer_code"
                                class="feed-card feed-card-sm">

                                <div class="feed-header">

                                    <span class="feed-title">

                                        {{ item.company_name }}

                                    </span>

                                    <span class="badge badge-success">

                                        {{ item.total_visit }} Visit

                                    </span>

                                </div>

                                <div class="text-muted small">

                                    <i class="ti ti-id me-1"></i>

                                    {{ item.customer_code }}

                                </div>

                            </div>

                            <div
                                v-if="!dashboard.top_customer.length"
                                class="text-muted text-center py-4">

                                No customer data yet.

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>

        <!-- =========================
            CUSTOMER LIST
        ========================== -->

        <div class="row g-4">

            <div class="col-12">

                <div class="card dashboard-card">

                    <div class="card-header">

                        <div class="d-flex justify-content-between align-items-center">

                            <div>

                                <h5 class="mb-0">

                                    Customer List

                                </h5>

                                <small class="text-muted">

                                    All Registered Customers

                                </small>

                            </div>

                            <span class="badge bg-primary">

                                {{ dashboard.customer_list.length }}

                                Customer

                            </span>

                        </div>

                    </div>

                    <div class="card-body p-0">

                        <div class="table-responsive">

                            <table class="table table-hover align-middle mb-0 customer-table">

                                <thead>

                                    <tr>

                                        <th>Code</th>

                                        <th>Company</th>

                                        <th>Contact</th>

                                        <th>Phone</th>

                                        <th>Status</th>

                                        <th>Source</th>

                                        <th>Sales</th>

                                        <th>Created At</th>

                                    </tr>

                                </thead>

                                <tbody>

                                    <tr
                                        v-for="item in dashboard.customer_list"
                                        :key="item.customer_code">

                                        <td class="text-muted">

                                            {{ item.customer_code }}

                                        </td>

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

                                            <span
                                                class="badge"
                                                :class="statusBadge(item.customer_status)">

                                                {{ item.customer_status }}

                                            </span>

                                        </td>

                                        <td>

                                            <span
                                                class="badge"
                                                :class="leadSourceBadge(item.lead_source)">

                                                {{ item.lead_source }}

                                            </span>

                                        </td>

                                        <td class="text-capitalize">

                                            {{ item.sales_name }}

                                        </td>

                                        <td class="text-muted">

                                            {{ formatDateTime(item.created_at) }}

                                        </td>

                                    </tr>

                                    <tr v-if="!dashboard.customer_list.length">

                                        <td
                                            colspan="8"
                                            class="text-center text-muted py-4">

                                            No customers found.

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
        total_customer:11,
        new_customer:11,
        active_customer:11,
        dormant_customer:0,
        inactive_customer:0,
        lost_customer:0
    },

    customer_status:[
        {
            customer_status:'Active',
            total:11
        }
    ],

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

    top_sales:[
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

    customer_growth:[
        {
            date:'2026-07-08',
            total:2
        },
        {
            date:'2026-07-09',
            total:9
        }
    ],

    top_customer:[
        {
            customer_code:'CUST-20260709-001',
            company_name:'PT. Paragon Technology And Innovation - Jatake 2',
            total_visit:1
        },
        {
            customer_code:'CUST-20260709-002',
            company_name:'PT. KENCANA GEMILANG (MIYAKO)',
            total_visit:1
        },
        {
            customer_code:'CUST-20260709-004',
            company_name:'PT. Nipama Mandiri',
            total_visit:1
        },
        {
            customer_code:'CUST-20260709-005',
            company_name:'PT. Mayora Indah Tbk / Jayanti',
            total_visit:1
        },
        {
            customer_code:'CUST-20260709-007',
            company_name:'PT Perwira Arthabaja Pasifik (Perwira Steel)',
            total_visit:1
        },
        {
            customer_code:'CUST-20260709-008',
            company_name:'Asalta Mandiri Agung. PT',
            total_visit:1
        },
        {
            customer_code:'CUST-20260709-009',
            company_name:'PT Sugizindo',
            total_visit:1
        }
    ],

    customer_list:[
        {
            customer_code:'CUST-20260709-009',
            company_name:'PT Sugizindo',
            contact_name:'bembi',
            phone:'089873795444',
            customer_status:'Active',
            lead_source:'Referral',
            sales_name:'willson denmark',
            created_at:'2026-07-09 11:13:32'
        },
        {
            customer_code:'CUST-20260709-008',
            company_name:'Asalta Mandiri Agung. PT',
            contact_name:'johanes',
            phone:'089873795643',
            customer_status:'Active',
            lead_source:'Referral',
            sales_name:'willson denmark',
            created_at:'2026-07-09 11:06:25'
        },
        {
            customer_code:'CUST-20260709-007',
            company_name:'PT Perwira Arthabaja Pasifik (Perwira Steel)',
            contact_name:'tono',
            phone:'089873794532',
            customer_status:'Active',
            lead_source:'Cold Call',
            sales_name:'sputnix norwey',
            created_at:'2026-07-09 10:58:58'
        },
        {
            customer_code:'CUST-20260709-006',
            company_name:'PT. Karenu Indah (HELI Forklift Indonesia)',
            contact_name:'mark',
            phone:'089873456788',
            customer_status:'Active',
            lead_source:'Referral',
            sales_name:'bortley england',
            created_at:'2026-07-09 10:45:43'
        },
        {
            customer_code:'CUST-20260709-005',
            company_name:'PT. Mayora Indah Tbk / Jayanti',
            contact_name:'yanti',
            phone:'08987379654',
            customer_status:'Active',
            lead_source:'Website',
            sales_name:'bortley england',
            created_at:'2026-07-09 10:41:06'
        },
        {
            customer_code:'CUST-20260709-004',
            company_name:'PT. Nipama Mandiri',
            contact_name:'joko',
            phone:'08987379453',
            customer_status:'Active',
            lead_source:'Website',
            sales_name:'bortley england',
            created_at:'2026-07-09 10:36:14'
        },
        {
            customer_code:'CUST-20260709-003',
            company_name:'PT. Windu Persada Cargo (WPC)',
            contact_name:'rizal',
            phone:'089873795432',
            customer_status:'Active',
            lead_source:'Social Media',
            sales_name:'sputnix norwey',
            created_at:'2026-07-09 10:33:43'
        },
        {
            customer_code:'CUST-20260709-002',
            company_name:'PT. KENCANA GEMILANG (MIYAKO)',
            contact_name:'Brians',
            phone:'089873795432',
            customer_status:'Active',
            lead_source:'Other',
            sales_name:'sputnix norwey',
            created_at:'2026-07-09 10:24:10'
        },
        {
            customer_code:'CUST-20260709-001',
            company_name:'PT. Paragon Technology And Innovation - Jatake 2',
            contact_name:'tomi',
            phone:'08987379432',
            customer_status:'Active',
            lead_source:'Referral',
            sales_name:'sputnix norwey',
            created_at:'2026-07-09 10:17:49'
        },
        {
            customer_code:'CUST-000001',
            company_name:'PT Maju Jaya',
            contact_name:'Andi Saputra',
            phone:'081234567890',
            customer_status:'Active',
            lead_source:'Website',
            sales_name:'apregi pratayuda',
            created_at:'2026-07-08 17:28:52'
        },
        {
            customer_code:'CUST-000002',
            company_name:'PT Sukses Makmur',
            contact_name:'Budi Santoso',
            phone:'081298765432',
            customer_status:'Active',
            lead_source:'Referral',
            sales_name:'willson denmark',
            created_at:'2026-07-08 17:28:52'
        }
    ]

})

/*
|--------------------------------------------------------------------------
| Doughnut Chart (Lead Source)
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
| Line Chart (Customer Growth)
|--------------------------------------------------------------------------
*/

const customerGrowthChart = computed(() => ({

    labels: dashboard.value.customer_growth.map(
        item => item.date
    ),

    datasets:[

        {

            label:'New Customer',

            data: dashboard.value.customer_growth.map(
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
//             '/api/dashboard/manager/customers'
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

.customer-dashboard{

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

.card-cyan{

    background:linear-gradient(135deg,#0891b2,#06b6d4);

}

/* ==========================================================
    MINI STAT
========================================================== */

.mini-stat{

    display:flex;

    align-items:center;

    gap:16px;

    background:#fff;

    border:1px solid #edf2f7;

    border-radius:16px;

    padding:18px 20px;

    height:100%;

    transition:.25s;

}

.mini-stat:hover{

    transform:translateY(-4px);

    box-shadow:0 10px 20px rgba(15,23,42,.06);

}

.mini-stat small{

    color:#64748b;

    display:block;

    margin-bottom:2px;

}

.mini-stat h4{

    margin:0;

    font-weight:700;

    font-size:22px;

    color:#1e293b;

}

.mini-stat-icon{

    width:48px;

    height:48px;

    min-width:48px;

    border-radius:14px;

    display:flex;

    align-items:center;

    justify-content:center;

    font-size:22px;

    color:#fff;

}

.icon-slate{background:#94A3B8;}
.icon-dark{background:#334155;}
.icon-danger{background:#EF4444;}

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
    TOP CUSTOMER / FEED
========================================================== */

.activity-feed{

    display:flex;

    flex-direction:column;

    gap:14px;

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

.feed-card-sm{

    padding:14px 18px;

}

.feed-header{

    display:flex;

    justify-content:space-between;

    align-items:center;

    gap:10px;

    margin-bottom:6px;

}

.feed-title{

    font-size:15px;

    font-weight:600;

}

/* ==========================================================
    TABLE
========================================================== */

.customer-table{

    font-size:.92rem;

}

.customer-table thead th{

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

.customer-table tbody td{

    padding:14px 24px;

    border-bottom:1px solid #f1f5f9;

    white-space:nowrap;

}

.customer-table tbody tr:last-child td{

    border-bottom:none;

}

.customer-table tbody tr:hover{

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
.mini-stat{

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

    .chart-container,

    .chart-container-lg{

        height:240px;

    }

}

</style>