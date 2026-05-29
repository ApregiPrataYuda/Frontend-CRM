import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dashboardServices } from '@/services/dashboardServices'

export const useDashboardStore = defineStore('dashboard', () => {

  const dashboard = ref({
    users: {
      total: 0,
      active: 0,
      inactive: 0,
      new_this_month: 0,
      active_today: 0,
      per_role: [],
      growth_labels: [],
      growth_data: [],
    },

    login_activity: {
      labels: [],
      data: [],
    },

    employees: {
      total: 0,
      per_mode: [],
    },

    storage: {
      total: '0 GB',
      used: '0 GB',
      free: '0 GB',
      used_percent: 0,
      db_size: '0 MB',
    },
  })

  const loading = ref(false)
  const error = ref(null)

  const fetchDashboard = async (params = {}) => {
    loading.value = true

    try {
      const response = await dashboardServices.getAll(params)

      dashboard.value = response.data.data
    } catch (err) {
      console.error(err)

      error.value =
        err.response?.data?.message ||
        'Failed load dashboard'
    } finally {
      loading.value = false
    }
  }

  return {
    dashboard,
    loading,
    error,
    fetchDashboard,
  }
})