import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { visitPlanServices } from '@/services/visitPlanServices'

function defaultMonth() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}` // format buat <input type="month">
}

export const useVisitPlanStore = defineStore('visitPlan', () => {

  // ── PERIODE (bulan aktif kalender) ──
  const currentMonth = ref(defaultMonth())

  // ── DATA KALENDER ──
  // `plans`      : rencana manual milik sales ini (bisa diedit/dihapus)
  // `followUps`  : data follow_ups yang sudah ada (read-only, cuma ditampilkan)
  const plans      = ref([])
  const followUps  = ref([])
  const stats      = ref({ planned: 0, done: 0, cancelled: 0, pending: 0, closed: 0 })
  const loading    = ref(false)
  const error      = ref(null)

  // ── SAVE / UPDATE / DELETE STATE ──
  const savingPlan    = ref(false)
  const updatingPlan  = ref(false)
  const deletingPlan  = ref(false)
  const errorVisitPlan = ref(null) // validation errors (422) dari create/update

  // ── GABUNGAN plans + followUps, DIKELOMPOKKAN PER TANGGAL ──
  // key-nya "YYYY-MM-DD" (field `plan_date`, sudah disamain namanya di
  // response backend baik buat item type 'plan' maupun 'follow_up'), value-nya
  // array item di tanggal itu -- dipakai langsung sama komponen kalender buat
  // nge-render badge/jumlah item per sel tanggal.
  const itemsByDate = computed(() => {
    const map = {}
    const push = (item) => {
      const key = item.plan_date
      if (!key) return
      if (!map[key]) map[key] = []
      map[key].push(item)
    }
    plans.value.forEach(push)
    followUps.value.forEach(push)
    return map
  })

  const totalItemsThisMonth = computed(() => plans.value.length + followUps.value.length)

  // ── FETCH ──
  const fetchPlans = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await visitPlanServices.getByMonth(currentMonth.value)
      const result = response.data?.data ?? {}
      plans.value     = Array.isArray(result.plans) ? result.plans : []
      followUps.value = Array.isArray(result.follow_ups) ? result.follow_ups : []
      stats.value     = result.stats ?? { planned: 0, done: 0, cancelled: 0, pending: 0, closed: 0 }
    } catch (err) {
      console.error('Gagal fetch planning kunjungan:', err)
      error.value = 'Gagal memuat planning kunjungan.'
    } finally {
      loading.value = false
    }
  }

  // ── GANTI BULAN ──
  const changeMonth = (val) => {
    currentMonth.value = val
    fetchPlans()
  }

  // ── CREATE ──
  const createPlan = async (payload) => {
    savingPlan.value = true
    errorVisitPlan.value = null
    try {
      const res = await visitPlanServices.create(payload)
      await fetchPlans()
      return res
    } catch (err) {
      if (err.response?.status === 422) {
        errorVisitPlan.value = err.response.data.errors
      }
      throw err
    } finally {
      savingPlan.value = false
    }
  }

  // ── UPDATE ──
  const updatePlan = async (id, payload) => {
    updatingPlan.value = true
    errorVisitPlan.value = null
    try {
      const res = await visitPlanServices.update(id, payload)
      await fetchPlans()
      return res
    } catch (err) {
      if (err.response?.status === 422) {
        errorVisitPlan.value = err.response.data.errors
      }
      throw err
    } finally {
      updatingPlan.value = false
    }
  }

  // ── DELETE ──
  const deletePlan = async (id) => {
    deletingPlan.value = true
    try {
      const res = await visitPlanServices.destroy(id)
      await fetchPlans()
      return res
    } finally {
      deletingPlan.value = false
    }
  }

  // ── CUSTOMER MILIK SALES YANG LOGIN (dropdown di form tambah/edit rencana) ──
  // Diambil SEKALI (bukan per-keystroke kayak autocomplete) terus difilter di
  // frontend -- sama persis pola dropdown "per company" di Product Population.
  const myCustomers       = ref([])
  const loadingMyCustomers = ref(false)

  const fetchMyCustomers = async () => {
    loadingMyCustomers.value = true
    try {
      const res = await visitPlanServices.getCustomerSelect()
      myCustomers.value = res.data?.data ?? []
    } catch (err) {
      console.error('Gagal fetch customer milik saya:', err)
      myCustomers.value = []
    } finally {
      loadingMyCustomers.value = false
    }
  }

  return {
    // state
    currentMonth,
    plans, followUps, stats, loading, error,
    savingPlan, updatingPlan, deletingPlan, errorVisitPlan,

    // turunan
    itemsByDate, totalItemsThisMonth,

    // actions
    fetchPlans, changeMonth,
    createPlan, updatePlan, deletePlan,

    // customer milik sales (dropdown form)
    myCustomers, loadingMyCustomers, fetchMyCustomers,
  }
})