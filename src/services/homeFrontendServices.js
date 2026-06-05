// // import api from './api'

// // export const homeFrontendServices = {


// //     // untuk home
// //   async getHomeStats() {
// //     const response = await api.get('/dashboard/home-stats')
// //     return response
// //   },


// //   async getDataMapsRealtime() {
// //     const response = await api.get('/data-visits-leads-map')
// //     return response
// //   },


// //    async getDataVisitAllData(params = {}) {
// //     const response = await api.get('/data-visits-all-data', { params })
// //     return response
// //   },


// //   async getDataVisitAllData(params = {}) {
// //     const response = await api.get('/data-visits-all-data', { params })
// //     return response
// //   },

// // }


// import api from './api'

// export const homeFrontendServices = {

//   // untuk home
//   async getHomeStats() {
//     const response = await api.get('/dashboard/home-stats')
//     return response
//   },

//   async getDataMapsRealtime() {
//     const response = await api.get('/data-visits-leads-map')
//     return response
//   },

//   async getDataVisitAllData(params = {}) {
//     const response = await api.get('/data-visits-all-data', { params })
//     return response
//   },

//   async getDataVisitAllData(params = {}) {
//     const response = await api.get('/data-visits-all-data', { params })
//     return response
//   },

//   // =========================
//   // Dashboard CRM
//   // =========================

//   async getSummary(month) {
//     const response = await api.get('/dashboard/summary', {
//       params: { month }
//     })
//     return response
//   },

//   async getVisitChart(period, month) {
//     const response = await api.get('/dashboard/visit-chart', {
//       params: {
//         period,
//         month
//       }
//     })
//     return response
//   },

//   async getTopSales(month) {
//     const response = await api.get('/dashboard/top-sales', {
//       params: { month }
//     })
//     return response
//   },

//   async getConversionRate(month) {
//     const response = await api.get('/dashboard/conversion-rate', {
//       params: { month }
//     })
//     return response
//   },

//   async getConversionRateCustomers(month) {
//     const response = await api.get('/dashboard/conversion-rate-customers', {
//       params: { month }
//     })
//     return response
//   },

//   async getVisitStatus(dateFrom, dateTo) {
//     const response = await api.get('/dashboard/visit-status', {
//       params: {
//         date_from: dateFrom,
//         date_to: dateTo
//       }
//     })
//     return response
//   },

//   async getRecentActivity(month) {
//     const response = await api.get('/dashboard/recent-activity', {
//       params: { month }
//     })
//     return response
//   }

// }

import api from './api'

export const homeFrontendServices = {

  // untuk home
  async getHomeStats() {
    const response = await api.get('/dashboard/home-stats')
    return response
  },

  async getDataMapsRealtime() {
    const response = await api.get('/data-visits-leads-map')
    return response
  },

  async getDataVisitAllData(params = {}) {
    const response = await api.get('/data-visits-all-data', { params })
    return response
  },

  // =========================
  // Dashboard CRM
  // =========================

  async getSummary(month) {
    const response = await api.get('/dashboard/summary', {
      params: { month }
    })
    return response
  },

  async getVisitChart(period, month) {
    const response = await api.get('/dashboard/visit-chart', {
      params: { period, month }
    })
    return response
  },

  async getTopSales(month) {
    const response = await api.get('/dashboard/top-sales', {
      params: { month }
    })
    return response
  },

  async getConversionRate(month) {
    const response = await api.get('/dashboard/conversion-rate', {
      params: { month }
    })
    return response
  },

  async getConversionRateCustomers(month) {
    const response = await api.get('/dashboard/conversion-rate-customers', {
      params: { month }
    })
    return response
  },

  async getVisitStatus(dateFrom, dateTo) {
    const response = await api.get('/dashboard/visit-status', {
      params: {
        date_from: dateFrom,
        date_to: dateTo
      }
    })
    return response
  },

  async getRecentActivity(month) {
    const response = await api.get('/dashboard/recent-activity', {
      params: { month }
    })
    return response
  },

  // =========================
  // Activity Feed (Baru)
  // =========================

  async getActivityVisits(month, page) {
    const response = await api.get('/dashboard/activity-visits', {
      params: { month, page }
    })
    return response
  },

  async getActivityFollowUps(month, page) {
    const response = await api.get('/dashboard/activity-follow-ups', {
      params: { month, page }
    })
    return response
  }
}