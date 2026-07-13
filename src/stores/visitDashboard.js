import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { managerDashboardServices } from '@/services/homeDashboardManagerServices'

export const useVisitDashboardStore = defineStore('visitDashboard', () => {

    // =============================================
    // STATE
    // =============================================

    const dashboard = ref({

        summary:{
            total_visit:0,
            done:0,
            ongoing:0,
            checked_in:0,
            cancelled:0,
            complaint:0,
            potential_order:0,
            average_duration_minutes:0
        },

        visit_result:[],

        top_sales:[],

        daily_trend:[],

        visit_list:[]

    })

    const loadingVisit = ref(false)

    const errorVisit = ref(null)

    // =============================================
    // GETTERS
    // =============================================

    const completionRate = computed(()=>{

        const total = dashboard.value.summary.total_visit

        if(!total) return 0

        return (

            dashboard.value.summary.done

            /

            total

        ) * 100

    })

    const totalComplaint = computed(()=>{

        return dashboard.value.summary.complaint

    })

    const totalPotentialOrder = computed(()=>{

        return dashboard.value.summary.potential_order

    })

    const totalVisit = computed(()=>{

        return dashboard.value.summary.total_visit

    })

    const averageDuration = computed(()=>{

        return dashboard.value.summary.average_duration_minutes

    })

    // =============================================
    // ACTION
    // =============================================

    const fetchVisitDashboard = async(userId)=>{

        loadingVisit.value = true

        errorVisit.value = null

        try{

            const response = await managerDashboardServices.getDashboardVisit(userId)

            const data = response.data.data ?? {}

            dashboard.value={

                summary:data.summary ?? dashboard.value.summary,

                visit_result:data.visit_result ?? [],

                top_sales:data.top_sales ?? [],

                daily_trend:data.daily_trend ?? [],

                visit_list:data.visit_list ?? []

            }

        }

        catch(err){

            console.error('Visit Dashboard Error',err)

            errorVisit.value=err

        }

        finally{

            loadingVisit.value=false

        }

    }

    // =============================================
    // HELPER
    // =============================================

    const medal=(index)=>{

        if(index===0) return '🥇'

        if(index===1) return '🥈'

        if(index===2) return '🥉'

        return '#'+(index+1)

    }

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

    const visitResultBadge=(result)=>{

        switch(result){

            case 'complaint_handled':

                return 'bg-danger'

            case 'upsell_identified':

                return 'bg-warning text-dark'

            case 'improved':

                return 'bg-success'

            default:

                return 'bg-primary'

        }

    }

    return{

        dashboard,

        loadingVisit,

        errorVisit,

        completionRate,

        totalComplaint,

        totalPotentialOrder,

        totalVisit,

        averageDuration,

        fetchVisitDashboard,

        medal,

        formatDateTime,

        visitResultBadge

    }

})