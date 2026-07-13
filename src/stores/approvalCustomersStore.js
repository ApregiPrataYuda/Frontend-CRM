import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { customersServices } from '@/services/customerApprovalServices'

export const useApprovalCustomersStore = defineStore('approvalCustomers', () => {

    // ─────────────────────────────────────────────
    // STATE
    // ─────────────────────────────────────────────

    const approvalCustomersData = ref([])

    const loadingApprovalCustomers = ref(false)

    const approvingCustomer = ref(false)

    const rejectingCustomer = ref(false)

    const errorApprovalCustomers = ref(null)

    const searchApprovalCustomers = ref('')

    let searchTimeout = null

    const pagination = reactive({
        current_page: 1,
        per_page: 10,
        prev_page_url: null,
        next_page_url: null,
        last_page: 1,
        total: 0,
    })

    const sort = reactive({
        column: 'created_at',
        direction: 'desc',
    })

    const allowedSortColumns = [
        'company_name',
        'created_at'
    ]

    // ─────────────────────────────────────────────
    // BUILD URL
    // ─────────────────────────────────────────────

    const buildUrl = () => {

        const params = new URLSearchParams()

        if (searchApprovalCustomers.value)
            params.append('search', searchApprovalCustomers.value)

        if (pagination.current_page)
            params.append('page', pagination.current_page)

        if (pagination.per_page)
            params.append('per_page', pagination.per_page)

        if (sort.column) {
            params.append('sort_by', sort.column)
            params.append('sort_dir', sort.direction)
        }

        return `/customer-approval?${params.toString()}`
    }

    // ─────────────────────────────────────────────
    // FETCH
    // ─────────────────────────────────────────────

    const fetchApprovalCustomers = async (url = null) => {

        loadingApprovalCustomers.value = true

        try {

            const finalUrl = url || buildUrl()

            const response = await customersServices.getByUrl(finalUrl)

            const result = response.data

            const dataArray = Array.isArray(result.data)
                ? result.data
                : result.data?.data ?? []

            approvalCustomersData.value.splice(
                0,
                approvalCustomersData.value.length,
                ...dataArray
            )

            const pag = result.pagination ?? result.data?.pagination

            if (pag) {

                pagination.current_page = pag.current_page
                pagination.per_page = pag.per_page
                pagination.prev_page_url = pag.prev_page_url
                pagination.next_page_url = pag.next_page_url
                pagination.last_page = pag.last_page
                pagination.total = pag.total

            }

        } catch (error) {

            console.error(error)

        } finally {

            loadingApprovalCustomers.value = false

        }

    }

    // ─────────────────────────────────────────────
    // APPROVE
    // ─────────────────────────────────────────────

    const approveCustomer = async (id) => {

        approvingCustomer.value = true

        try {

            await customersServices.approveCustomer(id)

            await fetchApprovalCustomers(buildUrl())

        } finally {

            approvingCustomer.value = false

        }

    }

    // ─────────────────────────────────────────────
    // REJECT
    // ─────────────────────────────────────────────

    const rejectCustomer = async (id, payload) => {

        rejectingCustomer.value = true

        try {

            await customersServices.rejectCustomer(id, payload)

            await fetchApprovalCustomers(buildUrl())

        } finally {

            rejectingCustomer.value = false

        }

    }

    // ─────────────────────────────────────────────
    // SEARCH
    // ─────────────────────────────────────────────

    const searchWithDelay = (value) => {

        clearTimeout(searchTimeout)

        searchApprovalCustomers.value = value

        pagination.current_page = 1

        searchTimeout = setTimeout(() => {

            fetchApprovalCustomers(buildUrl())

        }, 500)

    }

    // ─────────────────────────────────────────────
    // PAGE SIZE
    // ─────────────────────────────────────────────

    const changePageSize = () => {

        pagination.current_page = 1

        fetchApprovalCustomers(buildUrl())

    }

    // ─────────────────────────────────────────────
    // SORTING
    // ─────────────────────────────────────────────

    const changeSorting = () => {

        pagination.current_page = 1

        fetchApprovalCustomers(buildUrl())

    }

    const toggleSort = (column) => {

        if (!allowedSortColumns.includes(column))
            return

        if (sort.column === column) {

            sort.direction =
                sort.direction === 'asc'
                    ? 'desc'
                    : 'asc'

        } else {

            sort.column = column

            sort.direction = 'asc'

        }

        changeSorting()

    }

    // ─────────────────────────────────────────────
    // RESET
    // ─────────────────────────────────────────────

    const resetFilters = () => {

        searchApprovalCustomers.value = ''

        pagination.current_page = 1

        pagination.per_page = 10

        sort.column = 'created_at'

        sort.direction = 'desc'

        fetchApprovalCustomers(buildUrl())

    }

    // ─────────────────────────────────────────────
    // FORMAT DATE
    // ─────────────────────────────────────────────

    const formatDate = (dateStr) => {

        if (!dateStr)
            return '-'

        const date = new Date(dateStr)

        if (isNaN(date.getTime()))
            return '-'

        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: '2-digit',
        })

    }

    // ─────────────────────────────────────────────
    // STATUS BADGE
    // ─────────────────────────────────────────────

    const getApprovalStatus = (status) => {

        const map = {

            pending: {
                label: 'bg-warning',
                icon: 'fa-solid fa-clock'
            },

            approved: {
                label: 'bg-success',
                icon: 'fa-solid fa-circle-check'
            },

            rejected: {
                label: 'bg-danger',
                icon: 'fa-solid fa-circle-xmark'
            },

        }

        return map[status] ?? {
            label: 'bg-secondary',
            icon: 'fa-solid fa-circle'
        }

    }

    return {

        approvalCustomersData,

        loadingApprovalCustomers,

        approvingCustomer,

        rejectingCustomer,

        errorApprovalCustomers,

        searchApprovalCustomers,

        pagination,

        sort,

        buildUrl,

        fetchApprovalCustomers,

        approveCustomer,

        rejectCustomer,

        searchWithDelay,

        changePageSize,

        changeSorting,

        toggleSort,

        resetFilters,

        formatDate,

        getApprovalStatus,

    }

})