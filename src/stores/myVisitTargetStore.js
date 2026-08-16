import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { myVisitTargetServices } from '@/services/myVisitTargetServices'

function defaultMonth() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}` // format buat <input type="month">
}

export const useMyVisitTargetStore = defineStore('myVisitTarget', () => {

  // ── PERIODE (bulan aktif) ──
  const periodMonth = ref(defaultMonth())
  const periodMonthParam = computed(() => `${periodMonth.value}-01`)

  // ── DATA ──
  const targets = ref([])
  const loading = ref(false)
  const error = ref(null)

  // ── STAT TURUNAN (dihitung dari `targets`, dipakai buat hero summary) ──
  const totalTargets = computed(() => targets.value.length)
  const achievedCount = computed(() => targets.value.filter(r => r.is_achieved).length)
  const totalVisitsDone = computed(() => targets.value.reduce((sum, r) => sum + (r.achieved_count ?? 0), 0))
  const totalVisitsPlanned = computed(() => targets.value.reduce((sum, r) => sum + (r.target_count ?? 0), 0))
  const avgPercentage = computed(() => {
    if (!targets.value.length) return 0
    const total = targets.value.reduce((sum, r) => sum + (r.percentage ?? 0), 0)
    return Math.round(total / targets.value.length)
  })

  // sama kayak dummy di desain: belum tercapai duluan, diurutkan yang paling
  // deket ke target (persentase tertinggi) di atas; yang udah tercapai turun
  // ke bawah.
  const sortedTargets = computed(() => {
    return [...targets.value].sort((a, b) => {
      if (a.is_achieved !== b.is_achieved) return a.is_achieved ? 1 : -1
      return (b.percentage ?? 0) - (a.percentage ?? 0)
    })
  })

  // ── FETCH ──
  const fetchMyTargets = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await myVisitTargetServices.getMyTargets(periodMonthParam.value)
      const result = response.data
      targets.value = Array.isArray(result.data) ? result.data : []
    } catch (err) {
      console.error('Gagal fetch target visit saya:', err)
      error.value = 'Gagal memuat target visit.'
    } finally {
      loading.value = false
    }
  }

  // ── GANTI BULAN ──
  const changeMonth = (val) => {
    periodMonth.value = val
    fetchMyTargets()
  }

  return {
    // state
    periodMonth, periodMonthParam,
    targets, loading, error,
    // turunan
    totalTargets, achievedCount, totalVisitsDone, totalVisitsPlanned, avgPercentage,
    sortedTargets,
    // actions
    fetchMyTargets, changeMonth,
  }
})