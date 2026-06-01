<template>
  <div class="attendance-page">
    <div class="page-header">
      <h4>Absensi / <span>Laporan Kehadiran Saya</span></h4>
    </div>

    <!-- PROFILE CARD -->
    <div class="profile-card mb-2">
      <div class="profile-left">
        <div class="avatar">
          <img
            v-if="user?.image && !showFallback"
            :src="`${storageUrl}/users/${user.image}`"
            :alt="user?.fullname"
            class="avatar-img"
            @error="showFallback = true"
          />
          <span v-else>{{ store.getInitials(user?.fullname) }}</span>
        </div>
        <div>
          <div class="name">{{ user?.fullname }}</div>
          <div class="email">{{ user?.email }}</div>
        </div>
      </div>

      <div class="filters">
        <select v-model="store.selectedMonth" class="form-select">
          <option v-for="m in 12" :key="m" :value="m">
            {{ new Date(0, m - 1).toLocaleString('id-ID', { month: 'long' }) }}
          </option>
        </select>

        <select v-model="store.selectedYear" class="form-select">
          <option v-for="y in 5" :key="y" :value="2022 + y">{{ 2022 + y }}</option>
        </select>

        <button class="btn-export">
          <i class="fa-regular fa-file-excel"></i> Export
        </button>
      </div>
    </div>

    <!-- HOLIDAY INFO -->
    <div class="holiday-info" v-if="holidays.length">
      📅 <b>Libur Nasional bulan ini:</b>
      <span v-for="(h, i) in holidays" :key="h.date">
        {{ h.name }} ({{ h.date }})<span v-if="i < holidays.length - 1">, </span>
      </span>
    </div>

    <!-- STATS -->
    <div class="stats-grid">
      <div class="stat-card" v-for="item in statItems" :key="item.label">
        <div class="stat-value" :style="{ color: item.color }">{{ item.value }}</div>
        <div class="stat-label">{{ item.label }}</div>
      </div>
    </div>

    <!-- REPORT CARD -->
    <div class="report-card mt-3">
      <div class="report-title">
        <h5>Rekap Absensi — {{ store.selectedMonth }}/{{ store.selectedYear }}</h5>
        <div class="report-user">{{ user?.fullname }}</div>
      </div>

      <button class="history-btn" @click="goToHistory">🔗 Lihat Riwayat</button>

      <!-- TABLE -->
      <div class="table-wrap">
        <table class="attendance-table">
          <thead>
            <tr>
              <th rowspan="2">NO</th>
              <th rowspan="2">NAMA</th>

              <th
                v-for="d in mergedDays" :key="'h' + d.day"
                :class="d.is_off ? 'head-off' : 'head-day'"
              >
                {{ d.day }}
                <div v-if="d.is_holiday" style="font-size:10px">🔴</div>
              </th>

              <th rowspan="2" class="head-h">H</th>
              <th rowspan="2" class="head-t">T</th>
              <th rowspan="2" class="head-l">L</th>
              <th rowspan="2" class="head-n">N</th>
              <th rowspan="2" class="head-a">A</th>
              <th rowspan="2" class="head-total">TOTAL<br>HADIR</th>
            </tr>

            <tr>
              <th
                v-for="d in mergedDays" :key="'d' + d.day"
                :class="d.is_weekend ? 'weekend' : (d.is_holiday ? 'head-off' : 'workday')"
                style="font-size:10px"
              >
                {{ new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short' }) }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>1</td>
              <td class="sticky-name">{{ user?.fullname }}</td>

              <td
                v-for="d in mergedDays" :key="'s' + d.day"
                :class="getClass(d)"
              >
                {{ getLabel(d) }}
              </td>

              <td class="sum-h">{{ summary.TOTAL_HADIR }}</td>
              <td class="sum-t">{{ summary.LATE }}</td>
              <td class="sum-l">{{ weekendCount }}</td>
              <td class="sum-n">{{ liburNasionalCount }}</td>
              <td class="sum-a">{{ absenCount }}</td>
              <td class="sum-total">{{ summary.TOTAL_HADIR }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- FOOTER -->
      <div class="signature">
        <p>Jakarta, {{ today }}</p>
        <p>Mengetahui,</p>
        <div class="space"></div>
        <strong>Admin HR</strong>
      </div>

      <div class="legend">
        <span class="badge hadir">H = HADIR (ONTIME)</span>
        <span class="badge telat">T = TERLAMBAT</span>
        <span class="badge libur">L = LIBUR WEEKEND</span>
        <span class="badge nasional">N = LIBUR NASIONAL</span>
        <span class="badge absen">A = ABSEN</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAttendanceReportStore } from '@/stores/attendanceReportStore'


const router = useRouter()
const store  = useAttendanceReportStore()




const holidays    = ref([])
const showFallback = ref(false)
const storageUrl  = `${import.meta.env.VITE_APP_URL}/storage`

// =======================
// UTIL
// =======================
const formatDate = (d) => {
  const date = new Date(d)
  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0')
}

const isPastDate = (dateStr) => {
  const today = new Date()
  const d     = new Date(dateStr)
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return d < today
}

const today = new Date().toLocaleDateString('id-ID', {
  day: 'numeric', month: 'long', year: 'numeric'
})

// =======================
// FETCH HOLIDAY
// =======================
const fetchHolidays = async () => {
  try {
    const res = await axios.get('/api/holidays', {
      params: { month: store.selectedMonth, year: store.selectedYear }
    })
    const raw = Array.isArray(res.data) ? res.data : []
    holidays.value = raw.map(h => ({
      date: formatDate(h.date),
      name: h.name,
    }))
  } catch (err) {
    console.error(err)
  }
}

// =======================
// COMPUTED
// =======================
// const user    = computed(() => store.reportData?.user || {})
const summary = computed(() => store.reportSummary || {})
const user = computed(() => store.reportData?.user || {})

const mergedDays = computed(() => {
  const map = {}
  holidays.value.forEach(h => { map[h.date] = h.name })

  return store.attendanceDays.map(day => {
    const date        = formatDate(day.date)
    const holidayName = map[date]
    return {
      ...day,
      is_holiday:   !!holidayName,
      holiday_name: holidayName || null,
      is_off:       day.is_weekend || !!holidayName,
    }
  })
})

const liburNasionalCount = computed(() =>
  mergedDays.value.filter(d => d.is_holiday && !d.check_in).length
)

const weekendCount = computed(() =>
  mergedDays.value.filter(d => d.is_weekend && !d.is_holiday).length
)

const absenCount = computed(() =>
  mergedDays.value.filter(d => !d.is_off && !d.check_in && isPastDate(d.date)).length
)

const statItems = computed(() => [
  { label: 'Hadir',          value: summary.value.TOTAL_HADIR,    color: '#22c55e' },
  { label: 'Ontime',         value: summary.value.ONTIME,         color: '#6366f1' },
  { label: 'Terlambat',      value: summary.value.LATE,           color: '#eab308' },
  { label: 'Checkout',       value: summary.value.TOTAL_CHECKOUT, color: '#06b6d4' },
  { label: 'Libur Nasional', value: liburNasionalCount.value,     color: '#7c3aed' },
  { label: 'Absen',          value: absenCount.value,             color: '#ef4444' },
])

// =======================
// CELL LOGIC (dari kode lama)
// =======================
// function getLabel(day) {
//   if (day.is_holiday && !day.check_in) return 'N'
//   if (day.is_weekend && !day.check_in) return 'L'
//   if (!day.check_in && !day.is_off && isPastDate(day.date)) return 'A'
//   if (!day.check_in) return ''
//   if (day.status === 'LATE') return 'T'
//   return 'H'
// }

function getLabel(day) {
  // Holiday dari API holiday (tidak dari attendance_days)
  if (day.is_holiday && !day.check_in) return 'N'

  // Gunakan status dari backend langsung
  if (day.status === 'L')         return 'L'
  if (day.status === 'LATE')      return 'T'
  if (day.status === 'COMPLETED') return 'H'

  // Status null = belum ada data
  if (!day.check_in && isPastDate(day.date) && !day.is_off) return 'A'

  // check_in ada tapi status bukan LATE/COMPLETED (edge case)
  if (day.check_in) return 'H'

  return '' // future date
}

function getClass(day) {
  if (day.is_holiday && !day.check_in)
    return 'status-n'  // purple

  if (day.status === 'L')
    return 'status-l'  // gray

  if (day.status === 'LATE')
    return 'status-t'  // yellow

  if (day.status === 'COMPLETED')
    return 'status-h'  // green

  if (!day.check_in && isPastDate(day.date) && !day.is_off)
    return 'status-a'  // red

  if (day.check_in)
    return 'status-h'  // green

  return ''
}
// =======================
// NAVIGATION
// =======================
const goToHistory = () => {
  router.push('/app/sales-timesheets-leave-reports-history')
}

// =======================
// INIT
// =======================
onMounted(async () => {
  await store.fetchMyReport()
  await fetchHolidays()
})

watch(() => [store.selectedMonth, store.selectedYear], async () => {
  await store.fetchMyReport()
  await fetchHolidays()
})
</script>

<style scoped>
.attendance-page{padding:24px;background:#f5f6fa}
.page-header h4{font-weight:700;color:#64748b}
.profile-card,.report-card,.stat-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px}
.profile-card{padding:18px;display:flex;justify-content:space-between;align-items:center}
.profile-left{display:flex;gap:12px;align-items:center}
.avatar{width:52px;height:52px;border-radius:50%;background:#eef2ff;color:#6366f1;font-weight:700;display:flex;align-items:center;justify-content:center}
.name{font-weight:700}.email{font-size:12px;color:#94a3b8}
.filters{display:flex;gap:8px}
.stat-card{text-align:center;padding:18px}
.stat-value{font-size:28px;font-weight:700;color:#6366f1}
.stat-label{font-size:12px;color:#94a3b8}
.btn-export,.history-btn{border:none;background:#ff5a36;color:#fff;padding:8px 14px;border-radius:8px}
.history-btn{background:#6366f1;margin:12px 0}
.report-card{padding:20px}
.report-title{display:flex;justify-content:space-between}
.report-user{color:#94a3b8;font-size:12px}
.table-wrap{
  overflow-x:auto;
  overflow-y:hidden;
  -webkit-overflow-scrolling:touch;
}
.attendance-table{border-collapse:collapse;width:max-content;min-width:100%}
.attendance-table th,.attendance-table td{border:1px solid #dbe2ea;padding:8px;text-align:center;font-size:12px;min-width:38px}
.attendance-table thead th{background:linear-gradient(90deg,#6a6ff5,#5f66ef);color:#fff}
.workday{background:#00b5ef!important}
.weekend{background:#ff5722!important}
.head-h{background:#6bd12c!important}.head-t{background:#f4b400!important}
.head-l{background:#8b97a3!important}.head-n{background:#7c4dff!important}
.head-a{background:#f44336!important}
.head-total{background:#5f66ef!important;min-width:80px}
.status-h{background:#dff5dd}
.status-t{background:#fff1c4}
.status-l{background:#ececec}
.sum-h{color:#6bd12c;font-weight:700}
.sum-t{color:#f4b400;font-weight:700}
.sum-l{color:#8b97a3;font-weight:700}
.sum-n{color:#7c4dff;font-weight:700}
.sum-a{color:#f44336;font-weight:700}
.sum-total{color:#5f66ef;font-weight:700}
.signature{text-align:right;color:#94a3b8;font-size:13px;margin-top:24px}
.space{height:28px}
.legend{display:flex;gap:8px;flex-wrap:wrap;margin-top:20px}
.badge{padding:6px 12px;color:#fff;border-radius:4px}
.hadir{background:#6bd12c}.telat{background:#f4b400}.libur{background:#ff5722}.nasional{background:#7c4dff}.absen{background:#f44336}
.stats-grid{
  display:grid;
  grid-template-columns:repeat(6,1fr);
  gap:14px;
}

@media (max-width:1200px){
  .stats-grid{
    grid-template-columns:repeat(3,1fr);
  }
}

@media (max-width:768px){
  .stats-grid{
    grid-template-columns:repeat(2,1fr);
  }
}

@media (max-width:480px){
  .stats-grid{
    grid-template-columns:1fr;
  }
}

@media (max-width:768px){

  .profile-card{
    flex-direction:column;
    align-items:flex-start;
    gap:16px;
  }

  .filters{
    width:100%;
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:10px;
  }

  .btn-export{
    grid-column:span 2;
    width:100%;
  }

}

@media (max-width:768px){

  .attendance-page{
    padding:12px;
  }

  .page-header h4{
    font-size:16px;
  }

  .report-card{
    padding:14px;
  }

  .stat-card{
    padding:14px;
  }

  .stat-value{
    font-size:22px;
  }

  .name{
    font-size:14px;
  }

  .email{
    font-size:11px;
  }

}

@media (max-width:480px){

  .filters{
    grid-template-columns:1fr;
  }

  .btn-export{
    grid-column:auto;
  }

  .avatar{
    width:44px;
    height:44px;
    font-size:14px;
  }

}


.holiday-info {
  background: #cffafe; color: #0e7490;
  padding: 10px 16px; border-radius: 8px;
  margin-bottom: 12px; font-size: 13px;
}
.avatar { width:52px;height:52px;border-radius:50%;background:#eef2ff;color:#6366f1;font-weight:700;display:flex;align-items:center;justify-content:center;overflow:hidden }
.avatar-img { width:100%;height:100%;object-fit:cover }
.head-off  { background:#6b7280!important;color:#fff }
.head-day  { background:linear-gradient(90deg,#6a6ff5,#5f66ef);color:#fff }
.status-h  { background:#dff5dd }
.status-t  { background:#fff1c4 }
.status-l  { background:#ececec }
.status-n  { background:#ede9fe;color:#7c3aed;font-weight:700 }
.status-a  { background:#fee2e2;color:#ef4444 }
.sticky-name { text-align:left;padding:0 8px;font-weight:600 }
</style>
