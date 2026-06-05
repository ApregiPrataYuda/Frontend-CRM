import { defineStore } from 'pinia'
import { ref } from 'vue'
import { homeFrontendServices } from '@/services/homeFrontendServices'

export const useActivityStore = defineStore('activity', () => {

  /* ==========================
   * VISITS
   * ========================== */

  const activityVisits = ref([])
  const totalVisits = ref(0)
  const hasMoreVisits = ref(false)
  const loadingActivityVisits = ref(false)

  /* ==========================
   * FOLLOW UPS
   * ========================== */

  const activityFollowUps = ref([])
  const totalFollowUps = ref(0)
  const hasMoreFollowUps = ref(false)
  const loadingActivityFollowUps = ref(false)

  /* ==========================
   * FETCH VISITS
   * ========================== */

  const fetchActivityVisits = async (
    month,
    page = 1,
    append = false
  ) => {

    loadingActivityVisits.value = true

    try {

      const response =
        await homeFrontendServices.getActivityVisits(
          month,
          page
        )

      const payload = response.data.data

      const rows = payload.data ?? []

      activityVisits.value = append
        ? [...activityVisits.value, ...rows]
        : rows

      totalVisits.value =
        payload.total ?? 0

      hasMoreVisits.value =
        payload.has_more ?? false

      return payload

    } catch (err) {

      console.error(
        'Gagal fetch visits:',
        err
      )

      return null

    } finally {

      loadingActivityVisits.value = false

    }
  }

  /* ==========================
   * FETCH FOLLOW UPS
   * ========================== */

  const fetchActivityFollowUps = async (
    month,
    page = 1,
    append = false
  ) => {

    loadingActivityFollowUps.value = true

    try {

      const response =
        await homeFrontendServices.getActivityFollowUps(
          month,
          page
        )

      const payload = response.data.data

      const rows = payload.data ?? []

      activityFollowUps.value = append
        ? [...activityFollowUps.value, ...rows]
        : rows

      totalFollowUps.value =
        payload.total ?? 0

      hasMoreFollowUps.value =
        payload.has_more ?? false

      return payload

    } catch (err) {

      console.error(
        'Gagal fetch follow ups:',
        err
      )

      return null

    } finally {

      loadingActivityFollowUps.value = false

    }
  }

  return {

    activityVisits,
    activityFollowUps,

    totalVisits,
    totalFollowUps,

    hasMoreVisits,
    hasMoreFollowUps,

    loadingActivityVisits,
    loadingActivityFollowUps,

    fetchActivityVisits,
    fetchActivityFollowUps
  }
})