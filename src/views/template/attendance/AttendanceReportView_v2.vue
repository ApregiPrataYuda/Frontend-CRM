<template>
  <div class="attendance-page">
    <div class="page-header">
      <h4>Absensi / <span>Laporan Kehadiran Saya</span></h4>
    </div>

    <div class="profile-card mb-2">
      <div class="profile-left">
        <div class="avatar">AP</div>
        <div>
          <div class="name">apregi pratayuda</div>
          <div class="email">administrator@example.com</div>
        </div>
      </div>

      <div class="filters">
        <select class="form-select"><option>Mei</option></select>
        <select class="form-select"><option>2026</option></select>
        <button class="btn-export">Export</button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card" v-for="item in stats" :key="item.label">
        <div class="stat-value">{{ item.value }}</div>
        <div class="stat-label">{{ item.label }}</div>
      </div>
    </div>

    <div class="report-card mt-3">
      <div class="report-title">
        <h5>Rekap Absensi — Mei 2026</h5>
        <div class="report-user">apregi pratayuda</div>
      </div>

      <button class="history-btn">Lihat Riwayat</button>

      <div class="table-wrap">
        <table class="attendance-table">
          <thead>
            <tr>
              <th rowspan="2">NO</th>
              <th rowspan="2">NAMA</th>
              <th rowspan="2">EMAIL</th>

              <th v-for="d in days" :key="'h'+d.day">
                {{ d.day }}
              </th>

              <th rowspan="2" class="head-h">H</th>
              <th rowspan="2" class="head-t">T</th>
              <th rowspan="2" class="head-l">L</th>
              <th rowspan="2" class="head-n">N</th>
              <th rowspan="2" class="head-a">A</th>

              <th rowspan="2" class="head-total">
                TOTAL<br>HADIR
              </th>
            </tr>

            <tr>
              <th
                v-for="d in days"
                :key="'d'+d.day"
                :class="d.weekend ? 'weekend' : 'workday'"
              >
                {{ d.name }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>1</td>
              <td>apregi pratayuda</td>
              <td>administrator@example.com</td>

              <td
                v-for="d in days"
                :key="'s'+d.day"
                :class="statusClass(d.status)"
              >
                {{ d.status }}
              </td>

              <td class="sum-h">0</td>
              <td class="sum-t">2</td>
              <td class="sum-l">10</td>
              <td class="sum-n">0</td>
              <td class="sum-a">19</td>
              <td class="sum-total">3</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="signature">
        <div>Jakarta, 1 Juni 2026</div>
        <div>Mengetahui,</div>
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
const stats = [
  { label: 'Hadir', value: 3 },
  { label: 'Ontime', value: 0 },
  { label: 'Terlambat', value: 2 },
  { label: 'Checkout', value: 3 },
  { label: 'Libur Nasional', value: 0 },
  { label: 'Absen', value: 19 }
]

const names = ['JUM','SAB','MIN','SEN','SEL','RAB','KAM']

const days = Array.from({ length: 31 }, (_, i) => ({
  day: i + 1,
  name: names[i % 7],
  weekend: [1,2].includes(i % 7),
  status:
    i === 13 ? 'H'
    : i === 14 ? 'T'
    : [1,2,8,9,15,16,22,23,29,30].includes(i) ? 'L'
    : ''
}))

const statusClass = (s) => {
  if (s === 'H') return 'status-h'
  if (s === 'T') return 'status-t'
  if (s === 'L') return 'status-l'
  return ''
}
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
</style>
