import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mySalesTargetServices } from '@/services/mySalesTargetServices'

export const useMySalesTargetStore = defineStore('mySalesTarget', () => {

  // ── PERIODE (tahun aktif) ──
  const currentYear = new Date().getFullYear()
  const periodYear = ref(currentYear)
  // -2 s/d +1 dari tahun berjalan -- cukup buat lihat target tahun lalu/sekarang/depan
  const yearOptions = Array.from({ length: 4 }, (_, i) => currentYear - 2 + i)

  // ── DATA ──
  const targets = ref([])
  const loading = ref(false)
  const error   = ref(null)

  // ── STAT TURUNAN (dihitung dari `targets`, dipakai buat hero summary) ──
  const totalTargets  = computed(() => targets.value.length)
  const achievedCount = computed(() => targets.value.filter(r => (r.achievement_percent ?? 0) >= 100).length)

  const totalTargetAmount   = computed(() => targets.value.reduce((sum, r) => sum + (r.target_amount ?? 0), 0))
  const totalAchievedAmount = computed(() => targets.value.reduce((sum, r) => sum + (r.achieved_amount ?? 0), 0))

  const avgPercentage = computed(() => {
    if (!targets.value.length) return 0
    const total = targets.value.reduce((sum, r) => sum + (r.achievement_percent ?? 0), 0)
    return Math.round(total / targets.value.length)
  })

  // sama kayak pola di Target Visit Saya: yang belum tercapai duluan
  // (diurutkan persentase tertinggi di atas), yang udah tercapai turun
  // ke bawah.
  const sortedTargets = computed(() => {
    return [...targets.value].sort((a, b) => {
      const aDone = (a.achievement_percent ?? 0) >= 100
      const bDone = (b.achievement_percent ?? 0) >= 100
      if (aDone !== bDone) return aDone ? 1 : -1
      return (b.achievement_percent ?? 0) - (a.achievement_percent ?? 0)
    })
  })

  // ── FETCH ──
  const fetchMyTargets = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await mySalesTargetServices.getMyTargets(periodYear.value)
      const result = response.data
      const dataArray = Array.isArray(result.data) ? result.data : result.data?.data ?? []
      targets.value = dataArray
    } catch (err) {
      console.error('Gagal fetch target penjualan saya:', err)
      error.value = 'Gagal memuat target penjualan.'
    } finally {
      loading.value = false
    }
  }

  // ── GANTI TAHUN ──
  const changeYear = (year) => {
    periodYear.value = Number(year)
    fetchMyTargets()
  }

  // ── FORMAT ──
  const formatCurrency = (val) => {
    const num = Number(val ?? 0)
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num)
  }

  return {
    // state
    periodYear, yearOptions,
    targets, loading, error,
    // turunan
    totalTargets, achievedCount, totalTargetAmount, totalAchievedAmount, avgPercentage,
    sortedTargets,
    // actions
    fetchMyTargets, changeYear,
    formatCurrency,
  }
})