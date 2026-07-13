import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { managerDashboardServices } from '@/services/homeDashboardManagerServices'

export const useCustomersDashboardStore = defineStore(
    'customersDashboard',
    () => {

        // =====================================================
        // STATE
        // =====================================================

        const dashboard = ref({

            summary:{

                total_customer:0,

                new_customer:0,

                active_customer:0,

                dormant_customer:0,

                inactive_customer:0,

                lost_customer:0

            },

            customer_status:[],

            lead_source:[],

            top_sales:[],

            customer_growth:[],

            top_customer:[],

            customer_list:[]

        })

        const loadingCustomer = ref(false)

        const errorCustomer = ref(null)

        // =====================================================
        // GETTER
        // =====================================================

        const hasData = computed(()=>{

            return dashboard.value.customer_list.length > 0

        })

        const totalCustomer = computed(()=>{

            return dashboard.value.summary.total_customer

        })

        const activeRate = computed(()=>{

            const total = dashboard.value.summary.total_customer

            if(!total) return 0

            return (

                dashboard.value.summary.active_customer

                /

                total

            ) * 100

        })

        const newRate = computed(()=>{

            const total = dashboard.value.summary.total_customer

            if(!total) return 0

            return (

                dashboard.value.summary.new_customer

                /

                total

            ) * 100

        })

        const inactiveRate = computed(()=>{

            const total = dashboard.value.summary.total_customer

            if(!total) return 0

            return (

                dashboard.value.summary.inactive_customer

                /

                total

            ) * 100

        })

                const dormantRate = computed(() => {

            const total = dashboard.value.summary.total_customer

            if (!total) return 0

            return (

                dashboard.value.summary.dormant_customer

                /

                total

            ) * 100

        })

        const lostRate = computed(() => {

            const total = dashboard.value.summary.total_customer

            if (!total) return 0

            return (

                dashboard.value.summary.lost_customer

                /

                total

            ) * 100

        })

        const growthCategories = computed(() => {

            return dashboard.value.customer_growth.map(

                item => item.date

            )

        })

        const growthSeries = computed(() => {

            return dashboard.value.customer_growth.map(

                item => item.total

            )

        })

        const bestSales = computed(() => {

            return dashboard.value.top_sales[0] ?? null

        })

        // =====================================================
        // ACTION
        // =====================================================

        const fetchCustomers = async (userId) => {

            loadingCustomer.value = true

            errorCustomer.value = null

            try {

                const response =
                    await managerDashboardServices.getDashboardCustomers(
                        userId
                    )

                const data = response.data.data ?? {}

                dashboard.value = {

                    summary:
                        data.summary ??
                        dashboard.value.summary,

                    customer_status:
                        data.customer_status ?? [],

                    lead_source:
                        data.lead_source ?? [],

                    top_sales:
                        data.top_sales ?? [],

                    customer_growth:
                        data.customer_growth ?? [],

                    top_customer:
                        data.top_customer ?? [],

                    customer_list:
                        data.customer_list ?? []

                }

            }

            catch (err) {

                console.error(

                    'Customer Dashboard Error',

                    err

                )

                errorCustomer.value = err

            }

            finally {

                loadingCustomer.value = false

            }

        }

        // =====================================================
        // HELPER
        // =====================================================

        const medal = (index) => {

            if (index === 0) return '🥇'

            if (index === 1) return '🥈'

            if (index === 2) return '🥉'

            return '#' + (index + 1)

        }

        const formatDate = (date) => {

            return new Intl.DateTimeFormat(

                'id-ID',

                {

                    day: '2-digit',

                    month: 'short',

                    year: 'numeric'

                }

            ).format(new Date(date))

        }

        const formatDateTime = (date) => {

            return new Intl.DateTimeFormat(

                'id-ID',

                {

                    day: '2-digit',

                    month: 'short',

                    year: 'numeric',

                    hour: '2-digit',

                    minute: '2-digit'

                }

            ).format(new Date(date))

        }

                const statusBadge = (status) => {

            switch (status) {

                case 'Active':
                    return 'badge-success'

                case 'Dormant':
                    return 'badge-secondary'

                case 'Inactive':
                    return 'badge-dark'

                case 'Lost':
                    return 'badge-danger'

                default:
                    return 'badge-primary'

            }

        }

        const leadSourceBadge = (source) => {

            switch (source) {

                case 'Referral':
                    return 'badge-primary'

                case 'Website':
                    return 'badge-info'

                case 'Cold Call':
                    return 'badge-warning'

                case 'Social Media':
                    return 'badge-purple'

                case 'Email':
                    return 'badge-success'

                default:
                    return 'badge-secondary'

            }

        }

        const leadSourceDot = (source) => {

            switch (source) {

                case 'Referral':
                    return 'dot-primary'

                case 'Website':
                    return 'dot-info'

                case 'Cold Call':
                    return 'dot-warning'

                case 'Social Media':
                    return 'dot-purple'

                case 'Email':
                    return 'dot-success'

                default:
                    return 'dot-secondary'

            }

        }

        return {

            // =========================
            // STATE
            // =========================

            dashboard,

            loadingCustomer,

            errorCustomer,

            // =========================
            // GETTER
            // =========================

            hasData,

            totalCustomer,

            activeRate,

            newRate,

            inactiveRate,

            dormantRate,

            lostRate,

            growthCategories,

            growthSeries,

            bestSales,

            // =========================
            // ACTION
            // =========================

            fetchCustomers,

            // =========================
            // HELPER
            // =========================

            medal,

            formatDate,

            formatDateTime,

            statusBadge,

            leadSourceBadge,

            leadSourceDot

        }

    }

)