<script setup>
import { onMounted, computed } from 'vue'
import { useMyVisitTargetStore } from '@/stores/myVisitTargetStore'
import { useToast } from 'vue-toastification'

const store = useMyVisitTargetStore()
const toast = useToast()

// nama sales diambil dari baris target itu sendiri (semua row pasti sales_name-nya
// sama, karena endpoint /sales/visit-targets sudah di-scope ke user yang login) --
// biar nggak perlu gantung ke authStore/profile yang bentuknya belum tentu sama.
const myName = computed(() => store.targets[0]?.sales_name || 'Sales')

onMounted(async () => {
  try {
    await store.fetchMyTargets()
  } catch (err) {
    toast.error('Gagal memuat target visit.')
  }
})

function colorForType(type) {
  return type === 'branch' ? '#0d9488' : '#6366f1'
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="bullseye" />
          Target Visit Saya
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" />
            Dashboard
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Target Visit</span>
        </div>
      </div>
      <span class="sales-chip">
        <font-awesome-icon icon="user" /> {{ myName }}
      </span>
    </div>

    <div class="toolbar-top">
      <div class="month-picker-wrap">
        <font-awesome-icon icon="calendar-days" class="month-picker-icon" />
        <input
          type="month"
          :value="store.periodMonth"
          class="month-picker-input"
          @change="store.changeMonth($event.target.value)"
        />
      </div>
      <div class="toolbar-hint">
        <font-awesome-icon icon="circle-info" /> Target ini dikasih sama Manager kamu, di-update otomatis tiap kali kamu selesai visit.
      </div>
    </div>

    <div v-if="store.loading" class="td-center-loading">
      <font-awesome-icon icon="spinner" spin /> Memuat data target visit...
    </div>

    <template v-else>
      <!-- ── HERO SUMMARY ── -->
      <div class="hero-summary mb-2">
        <div class="hero-ring-wrap">
          <svg viewBox="0 0 120 120" class="hero-ring">
            <circle cx="60" cy="60" r="52" class="hero-ring-track" />
            <circle
              cx="60" cy="60" r="52" class="hero-ring-fill"
              :style="{ strokeDasharray: 326.7, strokeDashoffset: 326.7 - (326.7 * store.avgPercentage / 100) }"
            />
          </svg>
          <div class="hero-ring-label">
            <div class="hero-ring-value">{{ store.avgPercentage }}%</div>
            <div class="hero-ring-sub">Rata-rata</div>
          </div>
        </div>

        <div class="hero-stats">
          <div class="hero-stat-item">
            <div class="hero-stat-value">{{ store.totalVisitsDone }} / {{ store.totalVisitsPlanned }}</div>
            <div class="hero-stat-label">Total Kunjungan (dari semua target)</div>
          </div>
          <div class="hero-stat-item">
            <div class="hero-stat-value">{{ store.achievedCount }} / {{ store.totalTargets }}</div>
            <div class="hero-stat-label">Target Sudah Tercapai</div>
          </div>
          <div class="hero-stat-item">
            <div class="hero-stat-value">{{ store.totalTargets - store.achievedCount }}</div>
            <div class="hero-stat-label">Masih Berjalan</div>
          </div>
        </div>
      </div>

      <div class="section-title">
        <font-awesome-icon icon="list-check" />
        <span>Daftar Target Bulan Ini</span>
        <span class="count">{{ store.totalTargets }}</span>
      </div>

      <div class="target-grid flex-grow-1 overflow-auto mb-3">
        <div v-if="store.sortedTargets.length === 0" class="empty-state">
          <font-awesome-icon icon="inbox" class="empty-icon" />
          <div>Belum ada target visit buat bulan ini.</div>
        </div>

        <div v-else v-for="row in store.sortedTargets" :key="row.id" class="target-card" :class="{ done: row.is_achieved }">
          <div class="target-card-top">
            <span class="activity-badge" :style="{ background: colorForType(row.target_type) + '20', color: colorForType(row.target_type) }">
              <font-awesome-icon :icon="row.target_type === 'branch' ? 'code-branch' : 'building'" />
              {{ row.target_note }}
            </span>
            <span class="result-chip" :class="row.is_achieved ? 'status-done' : 'status-pending'">
              <font-awesome-icon :icon="row.is_achieved ? 'circle-check' : 'hourglass-half'" />
              {{ row.is_achieved ? 'Tercapai' : 'Berjalan' }}
            </span>
          </div>

          <div class="target-card-name">{{ row.target_name }}</div>

          <div class="target-progress-row">
            <div class="progress-bar-track">
              <div class="progress-bar-fill" :class="{ done: row.is_achieved }" :style="{ width: Math.min(row.percentage, 100) + '%' }"></div>
            </div>
            <span class="progress-cell-label">{{ row.achieved_count }}/{{ row.target_count }} kunjungan · {{ row.percentage }}%</span>
          </div>

          <div v-if="row.notes" class="target-card-note">
            <font-awesome-icon icon="note-sticky" /> {{ row.notes }}
          </div>

          <div class="target-card-foot">
            Dibuat oleh {{ row.created_by_name }}
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<style scoped>
.breadcrumb-card {
  background: var(--bg-card); border-radius: 10px; padding: 16px 18px; margin-bottom: 12px;
  box-shadow: 0 1px 3px var(--shadow-color); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
}
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }
.sales-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 20px; background: rgba(13,148,136,0.1); color: #0d9488; font-size: 0.74rem; font-weight: 700; }

.toolbar-top {
  display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); border-radius: 10px;
  padding: 12px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); flex-wrap: wrap; gap: 10px;
}
.month-picker-wrap { display: flex; align-items: center; gap: 8px; padding: 7px 12px; background: var(--bg-input); border: 1px solid var(--border-main); border-radius: 8px; }
.month-picker-icon { color: #6366f1; }
.month-picker-input { border: none; background: transparent; color: var(--text-primary); font-size: 0.85rem; font-weight: 600; outline: none; }
.toolbar-hint { font-size: 0.78rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }

.td-center-loading { text-align: center; padding: 60px 0; color: var(--text-muted); font-size: 0.9rem; }

/* ===== HERO SUMMARY (ring + stat) ===== */
.hero-summary {
  background: var(--bg-card); border-radius: 12px; padding: 20px 24px; box-shadow: 0 1px 3px var(--shadow-color);
  display: flex; align-items: center; gap: 28px; flex-wrap: wrap;
}
.hero-ring-wrap { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
.hero-ring { width: 120px; height: 120px; transform: rotate(-90deg); }
.hero-ring-track { fill: none; stroke: var(--bg-input); stroke-width: 10; }
.hero-ring-fill { fill: none; stroke: #6366f1; stroke-width: 10; stroke-linecap: round; transition: stroke-dashoffset 0.4s ease; }
.hero-ring-label { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.hero-ring-value { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); }
.hero-ring-sub { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }

.hero-stats { display: flex; gap: 28px; flex-wrap: wrap; flex: 1; }
.hero-stat-item { display: flex; flex-direction: column; gap: 4px; }
.hero-stat-value { font-size: 1.4rem; font-weight: 800; color: var(--text-primary); }
.hero-stat-label { font-size: 0.76rem; color: var(--text-muted); font-weight: 500; max-width: 180px; }

.section-title { display: flex; align-items: center; gap: 8px; font-size: 0.92rem; font-weight: 700; margin: 4px 2px 8px; }
.section-title .count { font-size: 0.76rem; color: #6366f1; background: rgba(99,102,241,0.1); padding: 2px 9px; border-radius: 20px; font-weight: 700; }

/* ===== TARGET CARDS ===== */
.target-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; align-content: start; }
.target-card {
  background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 12px; padding: 16px;
  box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: column; gap: 10px;
}
.target-card.done { border-color: rgba(34,197,94,0.35); background: rgba(34,197,94,0.03); }
.target-card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.target-card-name { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }

.activity-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 0.7rem; font-weight: 700; padding: 3px 9px; border-radius: 20px; white-space: nowrap; }

.result-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 0.7rem; font-weight: 700; padding: 3px 9px; border-radius: 20px; white-space: nowrap; }
.result-chip.status-pending { background: rgba(245,158,11,0.12); color: #b45309; }
.result-chip.status-done { background: rgba(34,197,94,0.12); color: #16a34a; }

.target-progress-row { display: flex; flex-direction: column; gap: 6px; }
.progress-bar-track { height: 9px; border-radius: 20px; background: var(--bg-input); overflow: hidden; }
.progress-bar-fill { height: 100%; border-radius: 20px; background: #6366f1; transition: width 0.3s ease; }
.progress-bar-fill.done { background: #22c55e; }
.progress-cell-label { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }

.target-card-note { font-size: 0.78rem; color: var(--text-muted); background: var(--bg-input); border-radius: 8px; padding: 8px 10px; display: flex; gap: 6px; align-items: flex-start; }
.target-card-foot { font-size: 0.7rem; color: var(--text-muted); opacity: 0.8; }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--text-muted); padding: 60px 0; grid-column: 1 / -1; }
.empty-icon { font-size: 2.2rem; opacity: 0.3; }

@media (max-width: 700px) {
  .hero-summary { flex-direction: column; align-items: flex-start; }
  .hero-stats { gap: 18px; }
}
</style>