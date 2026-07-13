import api from './api'

export const managerDashboardServices = {

  async getDashboard(userId) {
    const response = await api.get('/dashboard/manager', {
      params: { user_id: userId },
    })
    return response
  },


  async getDashboardSummaryExecutive(userId) {
    const response = await api.get('/dashboard/manager/executive-summary', {
      params: { user_id: userId },
    })
    return response
  },

  async getDashboardSalesPerformance(userId) {
    const response = await api.get('/dashboard/manager/sales-performance', {
      params: { user_id: userId },
    })
    return response
  },

  async getDashboardFollowUp(userId) {
    const response = await api.get('/dashboard/manager/follow-up', {
      params: { user_id: userId },
    })
    return response
  },


  async getDashboardVisit(userId) {
    const response = await api.get('/dashboard/manager/visit', {
      params: { user_id: userId },
    })
    return response
  },


async getDashboardCustomers(userId) {
  const response = await api.get('/dashboard/manager/customers', {
    params: {
      user_id: userId,
    },
  })
  return response
},


async getDashboardLeads(userId) {
  const response = await api.get('/dashboard/manager/lead-analytics', {
    params: {
      user_id: userId,
    },
  })
  return response
},

async getDashboardActivity(userId) {
  const response = await api.get('/dashboard/manager/activity', {
    params: {
      user_id: userId,
    },
  })
  return response
},

async getDashboardPipeline(userId) {
  const response = await api.get('/dashboard/manager/pipeline', {
    params: {
      user_id: userId,
    },
  })
  return response
},


async getDashboardComplaint(userId) {
  const response = await api.get('/dashboard/manager/complaint', {
    params: {
      user_id: userId,
    },
  })
  return response
},


async getDashboardPotentialOrders(userId) {
  const response = await api.get('/dashboard/manager/potential-order', {
    params: {
      user_id: userId,
    },
  })
  return response
},

async getDashboardKpi(userId) {
  const response = await api.get('/dashboard/manager/kpi', {
    params: {
      user_id: userId,
    },
  })
  return response
},


async getDashboardConversion(userId) {
  const response = await api.get('/dashboard/manager/conversion', {
    params: {
      user_id: userId,
    },
  })
  return response
}

}