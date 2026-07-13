<script setup>
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

import AppModal from '@/components/AppModal.vue'
import { useConfirm } from '@/composables/useConfirm'

import { useApprovalCustomersStore } from '@/stores/approvalCustomersStore'
import { usePermissionStore } from '@/stores/PermissionStore'

const { confirm } = useConfirm()

const store = useApprovalCustomersStore()
const permission = usePermissionStore()
const route = useRoute()

const {
    approvalCustomersData,
    loadingApprovalCustomers,
    approvingCustomer,
    rejectingCustomer,
    searchApprovalCustomers,
    pagination,
    sort,
} = storeToRefs(store)


//────────────────────────────────────────────
// PERMISSION
//────────────────────────────────────────────

const currentUrl = computed(() =>
    route.path.replace('/app', '')
)

const canView = computed(() =>
    permission.canView(currentUrl.value)
)

const canApprove = computed(() =>
    permission.canUpdate(currentUrl.value)
)


//────────────────────────────────────────────
// VIEW MODE
//────────────────────────────────────────────

const VIEW_MODE_KEY = 'approval_customer_view'

const viewMode = ref(
    localStorage.getItem(VIEW_MODE_KEY) || 'card'
)

function setViewMode(mode) {

    viewMode.value = mode

    localStorage.setItem(
        VIEW_MODE_KEY,
        mode
    )

}


//────────────────────────────────────────────
// LIFECYCLE
//────────────────────────────────────────────

onMounted(async () => {

    await store.fetchApprovalCustomers()

})


//────────────────────────────────────────────
// TOOLBAR
//────────────────────────────────────────────

const showPerPage = ref(false)

const showSortBy = ref(false)

const showSortDir = ref(false)

const sortByOptions = [

    {
        label: 'Created Date',
        value: 'created_at'
    },

    {
        label: 'Company Name',
        value: 'company_name'
    },

]

const sortByLabel = () => {

    return sortByOptions.find(x =>

        x.value === store.sort.column

    )?.label ?? 'Created Date'

}



//────────────────────────────────────────────
// APPROVE
//────────────────────────────────────────────

const approveModal = ref(false)

const selectedCustomer = ref(null)

function openApproveModal(item) {

    selectedCustomer.value = item

    approveModal.value = true

}

function closeApproveModal() {

    approveModal.value = false

    selectedCustomer.value = null

}

async function approveCustomer() {

    if (!selectedCustomer.value)
        return

    try {

        await store.approveCustomer(
            selectedCustomer.value.id
        )

        closeApproveModal()

    } catch (e) {

        console.error(e)

    }

}



//────────────────────────────────────────────
// REJECT
//────────────────────────────────────────────

const rejectModal = ref(false)

const rejectReason = ref('')

function openRejectModal(item) {

    selectedCustomer.value = item

    rejectReason.value = ''

    rejectModal.value = true

}

function closeRejectModal() {

    rejectModal.value = false

    selectedCustomer.value = null

    rejectReason.value = ''

}

async function rejectCustomer() {

    if (!selectedCustomer.value)
        return

    try {

        await store.rejectCustomer(

            selectedCustomer.value.id,

            {
                approval_note: rejectReason.value
            }

        )

        closeRejectModal()

    } catch (e) {

        console.error(e)

    }

}



//────────────────────────────────────────────
// DETAIL
//────────────────────────────────────────────

const detailModal = ref(false)

const detailCustomer = ref(null)

function openDetail(item) {

    detailCustomer.value = item

    detailModal.value = true

}

function closeDetail() {

    detailCustomer.value = null

    detailModal.value = false

}



//────────────────────────────────────────────
// SEARCH
//────────────────────────────────────────────

function handleSearch(e) {

    store.searchWithDelay(
        e.target.value
    )

}



//────────────────────────────────────────────
// PAGINATION
//────────────────────────────────────────────

function nextPage() {

    if (!pagination.value.next_page_url)
        return

    store.fetchApprovalCustomers(
        pagination.value.next_page_url
    )

}

function prevPage() {

    if (!pagination.value.prev_page_url)
        return

    store.fetchApprovalCustomers(
        pagination.value.prev_page_url
    )

}



//────────────────────────────────────────────
// BADGE
//────────────────────────────────────────────

function approvalBadge(status) {

    switch (status) {

        case 'pending':

            return 'bg-warning'

        case 'approved':

            return 'bg-success'

        case 'rejected':

            return 'bg-danger'

        default:

            return 'bg-secondary'

    }

}



//────────────────────────────────────────────
// AVATAR
//────────────────────────────────────────────

const avatarPalette = [

    '#6366f1',

    '#0ea5e9',

    '#10b981',

    '#ef4444',

    '#8b5cf6',

    '#f59e0b',

]

function getInitials(name) {

    if (!name)
        return '?'

    const parts = name.split(' ')

    return (

        (parts[0]?.charAt(0) ?? '') +

        (parts[1]?.charAt(0) ?? '')

    ).toUpperCase()

}

function getAvatarColor(name) {

    if (!name)
        return avatarPalette[0]

    let hash = 0

    for (let i = 0; i < name.length; i++) {

        hash =

            name.charCodeAt(i) +

            ((hash << 5) - hash)

    }

    return avatarPalette[
        Math.abs(hash) %
        avatarPalette.length
    ]

}
</script>


<template>

<div class="h-100 d-flex flex-column">

    <!-- =========================
         BREADCRUMB
    ========================== -->

    <div class="breadcrumb-card mb-2">

        <div class="breadcrumb-left">

            <h4 class="breadcrumb-title">

                <font-awesome-icon icon="circle-check" />

                Customer Approval

            </h4>

            <div class="breadcrumb-path">

                <span class="breadcrumb-item">

                    <font-awesome-icon icon="house" />

                    Home

                </span>

                <font-awesome-icon
                    icon="chevron-right"
                    class="breadcrumb-separator"
                />

                <span class="breadcrumb-item active">

                    Customer Approval

                </span>

            </div>

        </div>

    </div>


    <!-- =========================
         CONTROLS
    ========================== -->

    <div class="controls-card">

        <div class="controls-row">

            <div class="controls-left">

                <!-- PER PAGE -->

                <div class="showing-wrap">

                    <font-awesome-icon
                        icon="list"
                        class="text-muted-color"
                    />

                    <span class="showing-label">

                        Showing

                    </span>

                    <div class="drop-wrap">

                        <button
                            class="btn-select"
                            @click="showPerPage=!showPerPage"
                        >

                            {{ pagination.per_page }}

                            <font-awesome-icon
                                icon="chevron-down"
                                class="btn-arrow"
                            />

                        </button>

                        <div
                            class="drop-menu"
                            :class="{show:showPerPage}"
                        >

                            <div class="drop-label">

                                Per Page

                            </div>

                            <div class="perpage-grid">

                                <button

                                    v-for="item in [5,10,25,50]"

                                    :key="item"

                                    class="perpage-opt"

                                    :class="{

                                        active:pagination.per_page===item

                                    }"

                                    @click="

                                        pagination.per_page=item;

                                        showPerPage=false;

                                        store.changePageSize();

                                    "

                                >

                                    {{ item }}

                                </button>

                            </div>

                        </div>

                    </div>

                </div>


                <!-- VIEW -->

                <div class="view-toggle">

                    <button

                        class="view-toggle-btn"

                        :class="{

                            active:viewMode==='card'

                        }"

                        @click="setViewMode('card')"

                    >

                        <font-awesome-icon icon="table-cells"/>

                        Card

                    </button>

                    <button

                        class="view-toggle-btn"

                        :class="{

                            active:viewMode==='table'

                        }"

                        @click="setViewMode('table')"

                    >

                        <font-awesome-icon icon="list"/>

                        Table

                    </button>

                </div>

            </div>



            <div class="controls-right">

                <!-- SEARCH -->

                <div class="search-wrap">

                    <input

                        type="text"

                        class="search-input"

                        placeholder="Search Customer..."

                        :value="searchApprovalCustomers"

                        @input="handleSearch"

                    />

                    <button class="search-btn">

                        <font-awesome-icon
                            icon="magnifying-glass"
                        />

                    </button>

                </div>


                <!-- SORT -->

                <div class="sort-wrap">

                    <span class="showing-label">

                        Sort

                    </span>

                    <div class="drop-wrap">

                        <button

                            class="btn-select"

                            @click="showSortBy=!showSortBy"

                        >

                            {{ sortByLabel() }}

                            <font-awesome-icon
                                icon="chevron-down"
                                class="btn-arrow"
                            />

                        </button>

                        <div

                            class="drop-menu"

                            :class="{show:showSortBy}"

                        >

                            <div class="drop-label">

                                Sort By

                            </div>

                            <button

                                v-for="item in sortByOptions"

                                :key="item.value"

                                class="drop-item"

                                :class="{

                                    active:sort.column===item.value

                                }"

                                @click="

                                    store.toggleSort(item.value);

                                    showSortBy=false;

                                "

                            >

                                {{ item.label }}

                            </button>

                        </div>

                    </div>


                    <div class="drop-wrap">

                        <button

                            class="btn-select"

                            @click="showSortDir=!showSortDir"

                        >

                            {{ sort.direction }}

                            <font-awesome-icon
                                icon="chevron-down"
                                class="btn-arrow"
                            />

                        </button>

                        <div

                            class="drop-menu"

                            :class="{show:showSortDir}"

                        >

                            <button

                                class="drop-item"

                                @click="

                                    sort.direction='asc';

                                    showSortDir=false;

                                    store.changeSorting();

                                "

                            >

                                Asc

                            </button>

                            <button

                                class="drop-item"

                                @click="

                                    sort.direction='desc';

                                    showSortDir=false;

                                    store.changeSorting();

                                "

                            >

                                Desc

                            </button>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    </div>



    <!-- =========================
         CONTENT
    ========================== -->

    <div class="content-card flex-grow-1 overflow-auto mb-3">

       <!-- =========================
         LOADING
    ========================== -->

    <div
        v-if="loadingApprovalCustomers"
        class="state-wrap"
    >
        <div class="spinner-custom"></div>
    </div>


    <!-- =========================
         EMPTY
    ========================== -->

    <div
        v-else-if="!approvalCustomersData.length"
        class="state-wrap"
    >

        <div class="empty-state">

            <img
                src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif"
                class="empty-img"
            >

            <h5 class="empty-title">

                Tidak Ada Approval

            </h5>

            <p class="empty-text">

                Saat ini tidak ada customer yang menunggu approval.

            </p>

        </div>

    </div>


    <!-- =========================
         CARD VIEW
    ========================== -->

    <div
        v-else-if="viewMode==='card'"
        class="customer-grid"
    >

        <div

            v-for="item in approvalCustomersData"

            :key="item.id"

            class="customer-card"

        >

            <div class="cc-top">

                <div

                    class="cc-avatar"

                    :style="{

                        background:getAvatarColor(item.company_name)

                    }"

                >

                    {{ getInitials(item.company_name) }}

                </div>

                <div class="cc-headinfo">

                    <div class="cc-name">

                        {{ item.company_name }}

                    </div>

                    <div class="cc-code">

                        {{ item.customer_code }}

                    </div>

                </div>

                <div class="cc-break"></div>

                <span

                    class="status-badge"

                    :class="approvalBadge(item.approval_status)"

                >

                    {{ item.approval_status }}

                </span>

            </div>


            <div class="cc-body">

                <div class="cc-row">

                    <font-awesome-icon icon="user"/>

                    {{ item.contact_name }}

                </div>

                <div class="cc-row">

                    <font-awesome-icon icon="envelope"/>

                    {{ item.email }}

                </div>

                <div class="cc-row">

                    <font-awesome-icon icon="phone"/>

                    {{ item.phone }}

                </div>

                <div class="cc-row">

                    <font-awesome-icon icon="industry"/>

                    {{ item.industry_name }}

                </div>

              <div class="cc-row sales-row">
    <font-awesome-icon icon="user-tie" class="sales-icon"/>

    <div class="sales-info">
        <span class="sales-label">
            Sales
        </span>

        <strong>
            {{ item.owner_name }}
        </strong>
    </div>
</div>

            </div>


            <div class="cc-footer">

                <span class="cc-date">

                    <font-awesome-icon icon="calendar"/>

                    {{ store.formatDate(item.created_at) }}

                </span>

                <!-- <div class="cc-actions">

                    <button

                        v-if="canApprove"

                        class="act-btn act-approve"

                        @click="openApproveModal(item)"

                    >

                        <font-awesome-icon icon="circle-check"/>

                    </button>

                    <button

                        v-if="canApprove"

                        class="act-btn act-reject"

                        @click="openRejectModal(item)"

                    >

                        <font-awesome-icon icon="circle-xmark"/>

                    </button>

                    <button

                        class="act-btn act-info"

                        @click="openDetail(item)"

                    >

                        <font-awesome-icon icon="circle-info"/>

                    </button>

                </div> -->

                <div class="cc-actions">

    <template v-if="item.approval_status === 'pending'">

        <button
            v-if="canApprove"
            class="act-btn act-approve"
            @click="openApproveModal(item)"
        >
            <font-awesome-icon icon="circle-check"/>
        </button>

        <button
            v-if="canApprove"
            class="act-btn act-reject"
            @click="openRejectModal(item)"
        >
            <font-awesome-icon icon="circle-xmark"/>
        </button>

    </template>

    <button
        class="act-btn act-info"
        @click="openDetail(item)"
    >
        <font-awesome-icon icon="circle-info"/>
    </button>

</div>

            </div>

        </div>

    </div>


    <!-- =========================
         TABLE VIEW
    ========================== -->

    <table

        v-else

        class="data-table"

    >

        <thead>

            <tr>

                <th>No</th>

                <th>Customer Code</th>

                <th>Company</th>

                <th>Contact</th>

                <th>Status</th>

                <th>Created</th>

                <th style="width:170px;text-align:center">

                    Action

                </th>

            </tr>

        </thead>

       <tbody>

<tr
    v-for="(item,index) in approvalCustomersData"
    :key="item.id"
>

    <td>
        {{
            (pagination.current_page-1)
            *
            pagination.per_page
            +
            index
            +
            1
        }}
    </td>

    <!-- CUSTOMER -->
    <td>

        <div class="fw-semibold">
            {{ item.company_name }}
        </div>

        <div class="td-sub">
            {{ item.customer_code }}
        </div>

        <div class="td-sub">
            {{ item.industry_name }}
        </div>

    </td>

    <!-- CONTACT -->
    <td>

        <div class="fw-semibold">
            {{ item.contact_name || '-' }}
        </div>

        <div class="td-sub">
            {{ item.email || '-' }}
        </div>

        <div class="td-sub">
            {{ item.phone || '-' }}
        </div>

    </td>

    <!-- SALES -->
    <td>

        <div class="fw-semibold">
            {{ item.owner_name }}
        </div>

        <div class="td-sub">
            Sales Owner
        </div>

    </td>

    <!-- STATUS -->
    <td>

        <span
            class="status-badge"
            :class="approvalBadge(item.approval_status)"
        >
            {{ item.approval_status }}
        </span>

    </td>

    <!-- CREATED -->
    <td>

        {{ store.formatDate(item.created_at) }}

    </td>

    <!-- ACTION -->
    <td class="td-actions">

        <template v-if="item.approval_status === 'pending'">

            <button
                v-if="canApprove"
                class="act-btn act-approve"
                @click="openApproveModal(item)"
            >
                <font-awesome-icon icon="circle-check"/>
            </button>

            <button
                v-if="canApprove"
                class="act-btn act-reject"
                @click="openRejectModal(item)"
            >
                <font-awesome-icon icon="circle-xmark"/>
            </button>

        </template>

        <button
            class="act-btn act-info"
            @click="openDetail(item)"
        >
            <font-awesome-icon icon="circle-info"/>
        </button>

    </td>

</tr>

</tbody>

    </table>

    </div>
    
    
        <!-- =========================
         PAGINATION
    ========================== -->

    <div class="pagination-card">

        <div class="pagination-nav">

            <button
                class="btn-prev-next"
                :disabled="pagination.current_page===1"
                @click="prevPage"
            >
                <font-awesome-icon icon="circle-left"/>
                Prev
            </button>

            <button
                class="btn-prev-next"
                :disabled="pagination.current_page===pagination.last_page"
                @click="nextPage"
            >
                Next
                <font-awesome-icon icon="circle-right"/>
            </button>

        </div>

        <div class="page-badges">

            <span class="page-badge">
                {{ approvalCustomersData.length }}
                DATA
            </span>

            <span class="page-badge">
                PAGE {{ pagination.current_page }}
            </span>

            <span class="page-badge">
                TOTAL {{ pagination.total }}
            </span>

        </div>

    </div>



    <!-- =========================
         APPROVE MODAL
    ========================== -->

    <AppModal
        :show="approveModal"
        title="Approve Customer"
        icon="circle-check"
        size="sm"
        @close="closeApproveModal"
    >

        <div style="padding:15px 0;text-align:center">

            <font-awesome-icon
                icon="circle-check"
                style="
                    font-size:60px;
                    color:#22c55e;
                    margin-bottom:15px;
                "
            />

            <h4>

                Approve Customer?

            </h4>

            <p>

                <strong>

                    {{ selectedCustomer?.company_name }}

                </strong>

            </p>

            <p style="color:#64748b">

                Customer akan masuk ke Master Customer Sales.

            </p>

        </div>

        <template #footer>

            <button
                class="btn-cancel"
                @click="closeApproveModal"
            >
                Cancel
            </button>

            <button
                class="btn-save"
                :disabled="approvingCustomer"
                @click="approveCustomer"
            >

                <font-awesome-icon

                    v-if="approvingCustomer"

                    icon="spinner"

                    spin

                />

                <font-awesome-icon

                    v-else

                    icon="circle-check"

                />

                Approve

            </button>

        </template>

    </AppModal>



    <!-- =========================
         REJECT MODAL
    ========================== -->

    <AppModal
        :show="rejectModal"
        title="Reject Customer"
        icon="circle-xmark"
        size="md"
        @close="closeRejectModal"
    >

        <div class="form-group">

            <label>

                Reject Reason

            </label>

            <textarea

                v-model="rejectReason"

                rows="5"

                class="form-input form-textarea"

                placeholder="Masukkan alasan reject..."

            />

        </div>

        <template #footer>

            <button

                class="btn-cancel"

                @click="closeRejectModal"

            >

                Cancel

            </button>

            <button

                class="btn-save"

                style="background:#ef4444"

                :disabled="rejectingCustomer"

                @click="rejectCustomer"

            >

                <font-awesome-icon

                    v-if="rejectingCustomer"

                    icon="spinner"

                    spin

                />

                <font-awesome-icon

                    v-else

                    icon="circle-xmark"

                />

                Reject

            </button>

        </template>

    </AppModal>



    <!-- =========================
         DETAIL MODAL
    ========================== -->

    <AppModal

        :show="detailModal"

        title="Customer Detail"

        icon="circle-info"

        size="lg"

        @close="closeDetail"

    >

        <template v-if="detailCustomer">

            <div class="detail-banner">

                <span class="detail-banner-code">

                    {{ detailCustomer.customer_code }}

                </span>

                <h3 class="detail-banner-name">

                    {{ detailCustomer.company_name }}

                </h3>

                <span class="detail-banner-industry">

                    {{ detailCustomer.industry_name }}

                </span>

            </div>


            <div class="detail-list">

                <div class="detail-row">

                    <span class="detail-label">

                        Contact

                    </span>

                    <span class="detail-value">

                        {{ detailCustomer.contact_name }}

                    </span>

                </div>

                <div class="detail-row">

                    <span class="detail-label">

                        Email

                    </span>

                    <span class="detail-value">

                        {{ detailCustomer.email }}

                    </span>

                </div>

                <div class="detail-row">

                    <span class="detail-label">

                        Phone

                    </span>

                    <span class="detail-value">

                        {{ detailCustomer.phone }}

                    </span>

                </div>

                <div class="detail-row">

                    <span class="detail-label">

                        Industry

                    </span>

                    <span class="detail-value">

                        {{ detailCustomer.industry_name }}

                    </span>

                </div>

                <div class="detail-row">

                    <span class="detail-label">

                        Lead Category

                    </span>

                    <span class="detail-value">

                        {{ detailCustomer.lead_category_name }}

                    </span>

                </div>

                <div class="detail-row">

                    <span class="detail-label">

                        Sales

                    </span>

                    <span class="detail-value">

                        {{ detailCustomer.owner_name }}

                    </span>

                </div>

                <div class="detail-row">

                    <span class="detail-label">

                        Status

                    </span>

                    <span
                        class="status-badge"
                        :class="approvalBadge(detailCustomer.approval_status)"
                    >
                        {{ detailCustomer.approval_status }}
                    </span>

                </div>

                <div
                    v-if="detailCustomer.notes"
                    class="detail-row"
                >

                    <span class="detail-label">

                        Notes

                    </span>

                    <span class="detail-value">

                        {{ detailCustomer.notes }}

                    </span>

                </div>

            </div>

        </template>

        <template #footer>

            <button
                class="btn-cancel"
                @click="closeDetail"
            >

                Close

            </button>

        </template>

    </AppModal>

</div>

</template>


<style scoped>
.h-100 {
  --text-muted   : #64748b;
  --primary-color: #6366f1;
}

.form-container-gap { display: flex; flex-direction: column; gap: 14px; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

/* ── BREADCRUMB ── */
.breadcrumb-card { background: var(--bg-card); border-radius: 10px; padding: 16px 18px; box-shadow: 0 1px 3px var(--shadow-color); }
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

/* ── TOOLBAR ── */
.toolbar-top { display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); border-radius: 10px; padding: 12px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); flex-wrap: wrap; gap: 8px; }
.toolbar-left { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-toolbar { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: none; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; transition: all 0.18s ease; white-space: nowrap; }
.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover { background: #4f46e5; }
.btn-orange { background: #f59e0b; color: #fff; }
.btn-orange:hover { background: #d97706; }
.btn-arrow { font-size: 0.6rem; opacity: 0.7; }

/* ── SPINNER & EMPTY ── */
.state-wrap { display: flex; justify-content: center; padding: 40px 0; }
.spinner-custom { width: 2rem; height: 2rem; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 24px 0; gap: 8px; }
.empty-img { max-width: 200px; height: auto; opacity: 0.85; }
.empty-text { font-size: 0.9rem; font-weight: 600; color: var(--text-muted); }

/* ── CONTROLS ── */
.controls-card { background: var(--bg-card); border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); }
.controls-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.controls-left, .controls-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.showing-wrap { display: flex; align-items: center; gap: 6px; font-size: 0.84rem; color: var(--text-primary); font-weight: 600; }
.showing-label { white-space: nowrap; color: var(--text-muted); font-size: 0.83rem; }
.text-muted-color { color: var(--text-muted); }
.search-wrap { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.search-input { padding: 7px 12px; border: none; background: transparent; color: var(--text-primary); font-size: 0.84rem; outline: none; width: 200px; }
.search-input::placeholder { color: var(--text-muted); }
.search-btn { padding: 7px 12px; background: #6366f1; color: #fff; border: none; cursor: pointer; }
.search-btn:hover { background: #4f46e5; }
.sort-wrap { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

/* ── VIEW TOGGLE (CARD / TABLE) ── */
.view-toggle { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.view-toggle-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; background: transparent; border: none; color: var(--text-muted); font-size: 0.83rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; white-space: nowrap; }
.view-toggle-btn + .view-toggle-btn { border-left: 1px solid var(--border-main); }
.view-toggle-btn:hover:not(.active) { color: #6366f1; }
.view-toggle-btn.active { background: #6366f1; color: #fff; }

/* ── DROPDOWN TOOLBAR ── */
.drop-wrap { position: relative; }
.btn-select { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.83rem; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
.btn-select:hover { border-color: #6366f1; color: #6366f1; }
.drop-menu { position: absolute; top: calc(100% + 6px); left: 0; min-width: 160px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 10px; z-index: 200; opacity: 0; transform: translateY(-6px); pointer-events: none; transition: all 0.18s ease; }
.drop-right { left: auto; right: 0; }
.drop-menu.show { opacity: 1; transform: translateY(0); pointer-events: all; }
.drop-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; padding: 0 4px; }
.drop-item { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: none; border: none; border-radius: 7px; color: var(--text-primary); font-size: 0.84rem; cursor: pointer; text-align: left; }
.drop-item:hover { background: var(--bg-nav-hover); }
.drop-item.active { color: #6366f1; font-weight: 600; background: rgba(99,102,241,0.08); }
.perpage-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.perpage-opt { padding: 5px 10px; border: 1px solid var(--border-main); border-radius: 6px; background: var(--bg-input); color: var(--text-primary); font-size: 0.82rem; cursor: pointer; }
.perpage-opt:hover { border-color: #6366f1; color: #6366f1; }
.perpage-opt.active { background: #6366f1; border-color: #6366f1; color: #fff; font-weight: 700; }

/* ── CONTENT WRAPPER (CARD / TABLE) ── */
.content-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); overflow: auto; }

/* ── CARD VIEW ── */
.customer-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 14px; padding: 16px; }
.customer-card { display: flex; flex-direction: column; gap: 10px; border: 1px solid var(--border-main); border-radius: 12px; background: var(--bg-card); padding: 14px; transition: all 0.18s ease; }
.customer-card:hover { box-shadow: 0 6px 18px rgba(0,0,0,0.08); border-color: #6366f1; transform: translateY(-2px); }
.cc-top { display: flex; align-items: flex-start; gap: 10px; flex-wrap: wrap; }
.cc-avatar { width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }
.cc-headinfo { flex: 1; min-width: 0; }
.cc-name { font-weight: 700; font-size: 0.92rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cc-code { font-family: monospace; font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }
.cc-status { flex-shrink: 0; }
.cc-break { display: none; }
.cc-body { display: flex; flex-direction: column; gap: 6px; }
.cc-row { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cc-icon { color: var(--text-muted); width: 14px; flex-shrink: 0; }
.cc-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.cc-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px dashed var(--border-main); }
.cc-date { display: inline-flex; align-items: center; gap: 6px; font-size: 0.72rem; color: var(--text-muted); font-weight: 600; }
.cc-actions { display: flex; gap: 4px; }

/* ── TABLE VIEW ── */
.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.data-table thead tr { background: var(--bg-input); border-bottom: 2px solid var(--border-main); position: sticky; top: 0; z-index: 2; }
.data-table th { padding: 12px 18px; text-align: left; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap; }
.data-table tbody tr { border-bottom: 1px solid var(--border-main); transition: background 0.15s; }
.data-table tbody tr:last-child { border-bottom: none; }
.data-row:hover { background: var(--bg-nav-hover); }
.data-table td { padding: 13px 18px; vertical-align: middle; color: var(--text-primary); }
.td-no { color: var(--text-muted); font-weight: 600; }
.td-name { font-weight: 500; }
.td-muted { color: var(--text-muted); font-size: 0.84rem; }
.td-sub { color: var(--text-muted); font-size: 0.78rem; margin-top: 2px; }
.td-actions { text-align: center; white-space: nowrap; }
.mono-text { font-family: monospace; font-size: 0.82rem; }
.fw-bold { font-weight: 700; }
.status-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
.badge-lead-source { display: inline-block; padding: 2px 8px; border-radius: 5px; background: var(--bg-input); color: var(--text-muted); font-size: 0.75rem; font-weight: 600; }
.act-btn { width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s ease; margin: 0 2px; background: transparent; }
.act-edit         { color: #f59e0b; border-color: #f59e0b; }
.act-edit:hover   { background: #f59e0b; color: #fff; }
.act-delete       { color: #ef4444; border-color: #ef4444; }
.act-delete:hover { background: #ef4444; color: #fff; }
.act-info         { color: #6366f1; border-color: #6366f1; }
.act-info:hover   { background: #6366f1; color: #fff; }

/* ── PAGINATION ── */
.pagination-card { background: var(--bg-card); border-radius: 10px; padding: 14px 18px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: row-reverse; align-items: center; justify-content: space-between; gap: 12px; }
.pagination-nav { display: flex; align-items: center; gap: 8px; }
.btn-prev-next { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; min-width: 85px; justify-content: center; transition: background 0.18s ease; }
.btn-prev-next:hover:not(:disabled) { background: #4f46e5; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badges { display: flex; gap: 8px; align-items: center; }
.page-badge { padding: 7px 14px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); background: var(--bg-input); white-space: nowrap; }

/* ── FORM ── (satu deklarasi, tidak duplikat) */
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.required { color: #ef4444; }
.form-input { padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.875rem; background: var(--bg-input); color: var(--text-primary); outline: none; transition: border 0.18s; width: 100%; box-sizing: border-box; }
.form-input:focus { border-color: #6366f1; }
.form-textarea { resize: none; min-height: 70px; line-height: 1.5; }
.input-error { border-color: #ef4444 !important; background: #fef2f2 !important; }
.form-error { font-size: 0.75rem; color: #ef4444; }

/* ── MODAL BUTTONS ── */
.btn-cancel { padding: 8px 18px; background: var(--bg-main, #f1f5f9); color: var(--text-muted); border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
.btn-cancel:hover { background: var(--border-main); color: var(--text-primary); }
.btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.18s; }
.btn-save:hover:not(:disabled) { background: #4f46e5; }
.btn-save.btn-save-edit { background: #f59e0b; }
.btn-save.btn-save-edit:hover:not(:disabled) { background: #d97706; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

/* ════════════════════════════════════════════════
   CUSTOM SELECT — FIX DROPDOWN TEMBUS MODAL
   
   Sebelumnya: .cs-dropdown { position: absolute }
               → keluar dari flow, tembus modal
   
   Sesudah   : .cs-dropdown { position: static }
               → inline, push konten ke bawah,
                 tidak pernah keluar dari modal
   
   .cs-wrap  : wrapper trigger + dropdown, jadi
               target click-outside detection
════════════════════════════════════════════════ */
.cs-wrap { display: flex; flex-direction: column; }

.custom-select {
  display: flex; align-items: center; justify-content: space-between;
  min-height: 40px; padding: 6px 10px;
  border: 1px solid var(--border-main); border-radius: 8px;
  background: var(--bg-input); cursor: pointer; transition: border 0.18s;
}
.custom-select:hover,
.custom-select.open { border-color: #6366f1; }
.custom-select.has-error { border-color: #ef4444; background: #fef2f2; }

.cs-placeholder { font-size: 0.875rem; color: var(--text-muted); flex: 1; }
.cs-tag {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 2px 8px; background: rgba(99,102,241,0.1); color: #6366f1;
  border-radius: 6px; font-size: 0.82rem; font-weight: 600; flex: 1;
}
.cs-tag button { background: none; border: none; cursor: pointer; color: inherit; font-size: 0.9rem; line-height: 1; padding: 0; }
.cs-arrow { font-size: 0.65rem; color: var(--text-muted); transition: transform 0.2s; flex-shrink: 0; margin-left: 6px; }
.cs-arrow.rotated { transform: rotate(180deg); }

/* KEY FIX: position static, bukan absolute */
.cs-dropdown {
  position: static;
  margin-top: 4px;
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  overflow: hidden;
}

.cs-search-wrap { padding: 8px; border-bottom: 1px solid var(--border-main); }
.cs-search { width: 100%; padding: 7px 10px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.84rem; background: var(--bg-input); color: var(--text-primary); outline: none; box-sizing: border-box; }
.cs-search:focus { border-color: #6366f1; }
.cs-list { max-height: 180px; overflow-y: auto; padding: 4px; }
.cs-empty { text-align: center; padding: 12px; font-size: 0.84rem; color: var(--text-muted); }
.cs-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 7px; font-size: 0.84rem; cursor: pointer; color: var(--text-primary); }
.cs-item:hover { background: var(--bg-nav-hover); }
.cs-item.active { background: rgba(99,102,241,0.08); color: #6366f1; font-weight: 600; }
.cs-check { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; color: #6366f1; flex-shrink: 0; }

/* ── PILL BUTTONS ── */
.pill-btn-group { display: flex; flex-wrap: wrap; gap: 6px; }
.pill-btn { padding: 6px 14px; border: 1px solid var(--border-main); border-radius: 20px; background: var(--bg-input); color: var(--text-primary); font-size: 0.82rem; font-weight: 500; cursor: pointer; transition: all 0.15s; }
.pill-btn:hover { border-color: #6366f1; color: #6366f1; }
.pill-btn.active { background: #6366f1; border-color: #6366f1; color: #fff; font-weight: 600; }

/* ── SEGMENT GROUP ── */
.segment-group { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.segment-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 10px; border: none; background: transparent; color: var(--text-primary); font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.18s; }
.segment-btn:hover:not(.active) { background: rgba(99,102,241,0.06); color: #6366f1; }
.segment-btn.active { background: #6366f1; color: #fff; }

/* ── DETAIL MODAL ── */
.detail-banner { background: linear-gradient(135deg, #1e3a5f, #2563eb); border-radius: 10px; padding: 16px 18px; margin-bottom: 16px; }
.detail-banner-code { font-family: monospace; font-size: 0.75rem; color: #93c5fd; display: block; }
.detail-banner-name { margin: 4px 0; color: #fff; font-size: 1.05rem; font-weight: 700; }
.detail-banner-industry { font-size: 0.78rem; color: #bfdbfe; }
.detail-list { display: flex; flex-direction: column; }
.detail-section-label { font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.09em; color: #6366f1; padding: 12px 0 4px; border-top: 1px solid var(--border-main); margin-top: 8px; }
.detail-section-label:first-child { margin-top: 0; border-top: none; }
.detail-row { display: flex; align-items: flex-start; justify-content: space-between; padding: 9px 0; border-bottom: 1px dashed var(--border-main); gap: 12px; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); flex-shrink: 0; }
.detail-value { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); text-align: right; }
.detail-badge { font-size: 0.8rem; font-weight: 600; padding: 3px 10px; border-radius: 6px; background: rgba(99,102,241,0.1); color: #6366f1; border: 1px solid rgba(99,102,241,0.2); }

/* ── TOAST ── */
.toast-wrap { position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 260px; max-width: 360px; }
.toast-box { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 12px; border: 1px solid; box-shadow: 0 8px 24px rgba(0,0,0,0.12); position: relative; overflow: hidden; }
.toast-success { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
.toast-error   { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
.toast-info    { background: #f8fafc; border-color: #e2e8f0; color: #475569; }
.toast-icon { margin-top: 2px; flex-shrink: 0; }
.toast-msg { flex: 1; font-size: 0.875rem; font-weight: 500; }
.toast-close { background: none; border: none; cursor: pointer; color: inherit; opacity: 0.5; font-size: 0.8rem; }
.toast-close:hover { opacity: 1; }
.toast-progress { position: absolute; bottom: 0; left: 0; height: 3px; animation: shrink 3s linear forwards; }
.progress-success { background: #22c55e; }
.progress-error   { background: #ef4444; }
.progress-info    { background: #94a3b8; }


.empty-title{
    margin-top:12px;
    margin-bottom:6px;
    font-size:20px;
    font-weight:700;
    color:var(--text-primary);
}

.empty-text{
    max-width:420px;
    text-align:center;
    color:var(--text-muted);
    line-height:1.6;
}

/* ======================================================
   APPROVAL BUTTON
====================================================== */

.act-approve{
    color:#22c55e;
    border:1.5px solid #22c55e;
}

.act-approve:hover{
    background:#22c55e;
    color:#fff;
}

.act-reject{
    color:#ef4444;
    border:1.5px solid #ef4444;
}

.act-reject:hover{
    background:#ef4444;
    color:#fff;
}

.sales-row{
    margin-top:6px;
    padding-top:8px;
    border-top:1px dashed var(--border-main);
}

.sales-info{
    display:flex;
    flex-direction:column;
    line-height:1.2;
}

.sales-label{
    font-size:11px;
    color:var(--text-muted);
}

.sales-icon{
    color:#6366f1;
}


/* ======================================================
   APPROVAL BADGE
====================================================== */

.bg-warning{
    background:#fef3c7;
    color:#b45309;
}

.bg-success{
    background:#dcfce7;
    color:#15803d;
}

.bg-danger{
    background:#fee2e2;
    color:#b91c1c;
}

.bg-secondary{
    background:#e5e7eb;
    color:#374151;
}


/* ======================================================
   APPROVAL MODAL
====================================================== */

.approval-icon{
    width:80px;
    height:80px;
    margin:auto;
    border-radius:50%;
    display:flex;
    align-items:center;
    justify-content:center;
    background:#dcfce7;
    color:#16a34a;
    font-size:42px;
    margin-bottom:18px;
}

.reject-icon{
    width:80px;
    height:80px;
    margin:auto;
    border-radius:50%;
    display:flex;
    align-items:center;
    justify-content:center;
    background:#fee2e2;
    color:#dc2626;
    font-size:42px;
    margin-bottom:18px;
}


/* ======================================================
   APPROVAL STATUS BADGE
====================================================== */

.status-pending{
    background:#fef3c7;
    color:#b45309;
}

.status-approved{
    background:#dcfce7;
    color:#15803d;
}

.status-rejected{
    background:#fee2e2;
    color:#b91c1c;
}

@keyframes shrink { from { width: 100%; } to { width: 0%; } }
.toast-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from { opacity: 0; transform: translateY(-16px) scale(0.95); }
.toast-leave-to { opacity: 0; transform: translateY(-8px) scale(0.97); }

@media (max-width: 768px) {
  /* ── BREADCRUMB ── */
  .breadcrumb-card { padding: 12px 14px; }
  .breadcrumb-title { font-size: 1rem; }

  /* ── TOOLBAR TOP ── */
  .toolbar-top { flex-direction: column; align-items: stretch; padding: 10px 12px; }
  .toolbar-left { width: 100%; }
  .toolbar-left .drop-wrap { flex: 1; }
  .toolbar-left .btn-toolbar { width: 100%; justify-content: center; }
  .toolbar-top > .btn-orange { width: 100%; justify-content: center; }
  .drop-menu { left: 0; right: 0; min-width: 0; }

  /* ── CONTROLS ROW ── */
  .controls-card { padding: 12px; }
  .controls-row { flex-direction: column; align-items: stretch; gap: 10px; }
  .controls-left, .controls-right { width: 100%; justify-content: flex-start; }
  .controls-left { flex-wrap: wrap; }
  .showing-wrap { flex: 1 1 auto; }
  .view-toggle { flex: 1 1 auto; }
  .view-toggle-btn { flex: 1; justify-content: center; }
  .controls-left > .btn-toolbar { width: 100%; justify-content: center; order: 3; }
  .search-wrap { width: 100%; }
  .search-input { width: 100%; }
  .sort-wrap { width: 100%; }
  .sort-wrap .drop-wrap { flex: 1; }
  .sort-wrap .btn-select { width: 100%; justify-content: space-between; }
}

@media (max-width: 576px) {
  .customer-grid { grid-template-columns: 1fr; padding: 10px; gap: 10px; }

  /* ── CARD: cegah nama & status badge bertabrakan ── */
  .customer-card { padding: 12px; gap: 8px; }
  .cc-avatar { width: 38px; height: 38px; font-size: 0.78rem; }
  .cc-name { white-space: normal; overflow: visible; text-overflow: unset; line-height: 1.3; font-size: 0.88rem; }
  .cc-status { flex-basis: auto; margin-left: 48px; }
  .cc-break { display: block; flex-basis: 100%; width: 0; height: 0; }
  .cc-row { white-space: normal; }
  .act-btn { width: 34px; height: 34px; }

  .pagination-card { flex-direction: column; padding: 12px; gap: 12px; }
  .pagination-nav { width: 100%; justify-content: space-between; }
  .btn-prev-next { flex: 1; max-width: 48%; padding: 10px 14px; }
  .page-badges { width: 100%; justify-content: center; flex-wrap: wrap; }
  .page-badge { flex: 1; text-align: center; font-size: 0.7rem; }
  .form-row-2 { grid-template-columns: 1fr; }

  /* ── MODAL FOOTER: tombol full width bertumpuk ── */
  .btn-cancel, .btn-save { width: 100%; justify-content: center; }
}
</style>