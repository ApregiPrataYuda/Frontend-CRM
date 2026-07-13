<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { usePermissionStore } from '@/stores/PermissionStore'
import { useDashboardSalesStore } from '@/stores/dashboardSalesStore'

const route      = useRoute()
const authStore  = useAuthStore()
const permission = usePermissionStore()
const dashboard  = useDashboardSalesStore()

// ── PERMISSIONS ──
const currentUrl = computed(() => route.path.replace('/app', ''))
const canCreate  = computed(() => permission.canCreate(currentUrl.value))
const canUpdate  = computed(() => permission.canUpdate(currentUrl.value))
const canDelete  = computed(() => permission.canDelete(currentUrl.value))
const canView    = computed(() => permission.canView(currentUrl.value))

// ── USER ──
const fullNameUser = computed(() => authStore.user?.fullname || 'User')

const currentMonth = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })
onMounted(async () => {
  if (!authStore.user) await authStore.fetchProfile()
  await dashboard.fetchDashboard(authStore.user?.id_user)
})
</script>

<template>
  <div class="dashboard-page">

    <!-- HEADER -->
    <div class="dashboard-header">
      <div>
        <h1 class="page-title">
          Welcome Back, {{ fullNameUser }} 👋
        </h1>
        <p class="page-subtitle">
          Kelola leads dan aktivitas penjualan kamu hari ini.
        </p>
      </div>
    </div>

    <!-- LOADING -->
    <div v-if="dashboard.loadingStats" class="loading-state">
      <font-awesome-icon icon="fa-solid fa-spinner" spin />
      Memuat data dashboard...
    </div>

    <template v-else>

      <!-- WELCOME CARD -->
      <div class="welcome-card">
        <div class="welcome-body">
          <p class="welcome-month">{{ currentMonth }}</p>
          <p class="welcome-desc">
            Kamu sudah menyelesaikan
            <strong>{{ dashboard.stats.target?.actual ?? 0 }}</strong>
            dari
            <strong>{{ dashboard.stats.target?.target ?? 20 }}</strong>
            target visit bulan ini
            <span v-if="dashboard.stats.ranking?.rank !== '-'">
              dan berada di posisi
              <strong class="rank-highlight">#{{ dashboard.stats.ranking?.rank }}</strong>
              dari {{ dashboard.stats.ranking?.total_sales }} sales.
            </span>
          </p>
          <div class="achievement-wrap">
            <div class="achievement-labels">
              <span>Achievement</span>
              <span :style="{ color: dashboard.achievementColor }">
                {{ dashboard.stats.target?.achievement ?? 0 }}%
              </span>
            </div>
            <div class="achievement-track">
              <div
                class="achievement-fill"
                :style="{
                  width: Math.min(dashboard.stats.target?.achievement ?? 0, 100) + '%',
                  background: dashboard.achievementColor,
                }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- STAT CARDS -->
      <div class="stats-grid">

        <div class="stat-card">
          <div class="stat-icon" style="background:#eeedff; color:#696cff">
            <font-awesome-icon icon="fa-solid fa-location-dot" />
          </div>
          <div>
            <div class="stat-value" style="color:#696cff">
              {{ dashboard.stats.visits_today?.length ?? 0 }}
            </div>
            <div class="stat-title">Visit Hari Ini</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background:#fff8e1; color:#ffab00">
            <font-awesome-icon icon="fa-solid fa-trophy" />
          </div>
          <div>
            <div class="stat-value" style="color:#ffab00">
              #{{ dashboard.stats.ranking?.rank ?? '-' }}
            </div>
            <div class="stat-title">Ranking Bulan Ini</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background:#ffe8e5; color:#ff3e1d">
            <font-awesome-icon icon="fa-solid fa-circle-exclamation" />
          </div>
          <div>
            <div class="stat-value" style="color:#ff3e1d">
              {{ dashboard.overdueCount }}
            </div>
            <div class="stat-title">Follow Up Overdue</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background:#eafbdf; color:#71dd37">
            <font-awesome-icon icon="fa-solid fa-circle-check" />
          </div>
          <div>
            <div class="stat-value" style="color:#71dd37">
              {{ dashboard.stats.ranking?.done_visits ?? 0 }}
            </div>
            <div class="stat-title">Visit Done Bulan Ini</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background:#eeedff; color:#696cff">
            <font-awesome-icon icon="fa-solid fa-user-plus" />
          </div>
          <div>
            <div class="stat-value" style="color:#696cff">
              {{ dashboard.stats.total_leads ?? 0 }}
            </div>
            <div class="stat-title">Total My Leads</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background:#e0f7fc; color:#03c3ec">
            <font-awesome-icon icon="fa-solid fa-users" />
          </div>
          <div>
            <div class="stat-value" style="color:#03c3ec">
              {{ dashboard.stats.total_customers ?? 0 }}
            </div>
            <div class="stat-title">Total My Customers</div>
          </div>
        </div>

      </div>

      <!-- VISIT & FOLLOW UP -->
      <div class="content-grid">

        <!-- VISIT HARI INI -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <font-awesome-icon icon="fa-solid fa-location-dot" style="color:#696cff" />
              Visit Hari Ini
            </div>
            <span class="count-badge">{{ dashboard.stats.visits_today?.length ?? 0 }}</span>
          </div>

          <div class="visit-list">
            <div
              v-for="visit in dashboard.stats.visits_today"
              :key="visit.id"
              class="visit-item"
            >
              <div class="visit-left">
                <span
                  class="type-badge"
                  :class="visit.target_type === 'LEAD' ? 'badge-lead' : 'badge-customer'"
                >
                  {{ visit.target_type }}
                </span>
                <div>
                  <div class="item-name">{{ visit.company_name }}</div>
                  <div class="item-time">{{ dashboard.formatTime(visit.visit_at) }}</div>
                </div>
              </div>
              <span class="progress-badge" :class="dashboard.progressClass(visit.visit_progress)">
                {{ visit.visit_progress }}
              </span>
            </div>

            <div v-if="!dashboard.stats.visits_today?.length" class="empty-state">
              <font-awesome-icon icon="fa-solid fa-map" />
              <p>Tidak ada visit hari ini</p>
            </div>
          </div>
        </div>

        <!-- FOLLOW UP PENDING -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <font-awesome-icon icon="fa-solid fa-phone" style="color:#ff3e1d" />
              Follow Up Pending
            </div>
            <span class="count-badge danger">{{ dashboard.stats.follow_ups?.length ?? 0 }}</span>
          </div>

          <div class="fu-list">
            <div
              v-for="fu in dashboard.stats.follow_ups"
              :key="fu.id"
              class="fu-item"
              :class="{ overdue: fu.is_overdue }"
            >
              <div class="fu-left">
                <div class="fu-type-icon" :class="dashboard.fuTypeClass(fu.follow_up_type)">
                  <i :class="dashboard.fuTypeIcon(fu.follow_up_type)" />
                </div>
                <div>
                  <div class="item-name">{{ fu.company_name }}</div>
                  <div class="item-sub">{{ fu.subject ?? '-' }}</div>
                  <div class="item-time" :class="{ 'text-danger': fu.is_overdue }">
                    <font-awesome-icon icon="fa-solid fa-clock" />
                    {{ dashboard.formatTime(fu.follow_up_at) }}
                    <span v-if="fu.is_overdue" class="overdue-tag">OVERDUE</span>
                  </div>
                </div>
              </div>
              <span
                class="type-badge"
                :class="fu.target_type === 'LEAD' ? 'badge-lead' : 'badge-customer'"
              >
                {{ fu.target_type }}
              </span>
            </div>

            <div v-if="!dashboard.stats.follow_ups?.length" class="empty-state">
              <font-awesome-icon icon="fa-solid fa-circle-check" />
              <p>Semua follow up selesai 🎉</p>
            </div>
          </div>
        </div>

      </div>

      <!-- TARGET & LEADERBOARD -->
      <div class="content-grid">

        <!-- TARGET VS AKTUAL -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <font-awesome-icon icon="fa-solid fa-chart-bar" style="color:#03c3ec" />
              Target vs Aktual
            </div>
            <span class="month-label">{{ currentMonth }}</span>
          </div>

          <div class="target-summary">
            <div class="target-item">
              <div class="target-num">{{ dashboard.stats.target?.actual ?? 0 }}</div>
              <div class="target-label">Aktual</div>
            </div>
            <div class="target-divider" />
            <div class="target-item">
              <div class="target-num muted">{{ dashboard.stats.target?.target ?? 20 }}</div>
              <div class="target-label">Target</div>
            </div>
            <div class="target-divider" />
            <div class="target-item">
              <div class="target-num" :style="{ color: dashboard.achievementColor }">
                {{ dashboard.stats.target?.achievement ?? 0 }}%
              </div>
              <div class="target-label">Achievement</div>
            </div>
          </div>

          <div class="mini-chart">
            <div
              v-for="d in dashboard.stats.target?.per_day"
              :key="d.day"
              class="mini-bar-wrap"
            >
              <div
                class="mini-bar"
                :style="{
                  height: (d.total / dashboard.maxPerDay * 100) + '%',
                  background: '#696cff',
                }"
                :title="`Tgl ${d.day}: ${d.total} visit`"
              />
              <div class="mini-bar-label">{{ d.day }}</div>
            </div>
            <div v-if="!dashboard.stats.target?.per_day?.length" class="empty-state">
              <font-awesome-icon icon="fa-solid fa-chart-bar" />
              <p>Belum ada data</p>
            </div>
          </div>
        </div>

        <!-- LEADERBOARD -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <font-awesome-icon icon="fa-solid fa-trophy" style="color:#ffab00" />
              Leaderboard Bulan Ini
            </div>
          </div>

          <div class="leaderboard-list">
            <div
              v-for="(s, i) in dashboard.stats.ranking?.leaderboard"
              :key="s.sales_id"
              class="lb-item"
              :class="{ 'my-row': s.sales_id == authStore.user?.id_user }"
            >
              <div class="lb-rank" :class="'rank-' + (i + 1)">{{ i + 1 }}</div>
              <img :src="s.sales_photo_url" class="lb-avatar" alt="" />
              <div class="lb-info">
                <div class="lb-name">
                  {{ s.sales_name }}
                  <span v-if="s.sales_id == authStore.user?.id_user" class="you-badge">You</span>
                </div>
                <div class="lb-track">
                  <div
                    class="lb-bar"
                    :style="{
                      width: (s.total_visits / dashboard.maxVisits * 100) + '%',
                      background: dashboard.barColor(i),
                    }"
                  />
                </div>
              </div>
              <div class="lb-stats">
                <div class="lb-total" :style="{ color: dashboard.barColor(i) }">
                  {{ s.total_visits }}
                </div>
                <div class="lb-done">{{ s.done }} done</div>
              </div>
            </div>

            <div v-if="!dashboard.stats.ranking?.leaderboard?.length" class="empty-state">
              <font-awesome-icon icon="fa-solid fa-trophy" />
              <p>Belum ada data leaderboard</p>
            </div>
          </div>
        </div>

      </div>

    </template>

  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* HEADER */
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}
.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-primary);
}
.page-subtitle {
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 0.92rem;
}

/* LOADING */
.loading-state {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 40px;
  justify-content: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* WELCOME CARD */
.welcome-card {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: 16px;
  padding: 20px 24px;
}
.welcome-month {
  font-size: 0.78rem;
  font-weight: 600;
  color: #696cff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}
.welcome-desc {
  font-size: 0.92rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 14px;
}
.welcome-desc strong { color: var(--text-primary); }
.rank-highlight { color: #ffab00; }
.achievement-wrap { max-width: 480px; }
.achievement-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-bottom: 6px;
  font-weight: 500;
}
.achievement-track {
  height: 8px;
  background: var(--border-main);
  border-radius: 8px;
  overflow: hidden;
}
.achievement-fill {
  height: 100%;
  border-radius: 8px;
  transition: width 0.8s ease;
}

/* STATS GRID */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: 14px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.07);
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}
.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1;
}
.stat-title {
  margin-top: 5px;
  font-size: 0.78rem;
  color: var(--text-muted);
}

/* CONTENT GRID */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* CARD */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: 16px;
  padding: 20px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}
.month-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* BADGES */
.count-badge {
  background: #eeedff;
  color: #696cff;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 20px;
}
.count-badge.danger { background: #ffe8e5; color: #ff3e1d; }

.type-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}
.badge-lead     { background: rgba(105,108,255,0.12); color: #696cff; }
.badge-customer { background: rgba(3,195,236,0.12);   color: #0ea5e9; }

.progress-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  white-space: nowrap;
}
.badge-planned { background: rgba(255,171,0,0.15);  color: #d97706; }
.badge-ongoing { background: rgba(3,195,236,0.15);  color: #0ea5e9; }
.badge-done    { background: rgba(113,221,55,0.15); color: #16a34a; }
.badge-unknown { background: rgba(156,163,175,0.2); color: #6b7280; }

/* VISIT LIST */
.visit-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.visit-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-main);
  border-radius: 10px;
}
.visit-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* FOLLOW UP LIST */
.fu-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.fu-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-main);
  border-radius: 10px;
  border-left: 3px solid transparent;
}
.fu-item.overdue {
  border-left-color: #ff3e1d;
  background: rgba(255,62,29,0.04);
}
.fu-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  min-width: 0;
}
.fu-type-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 0.85rem;
}
.fu-call    { background: rgba(105,108,255,0.12); color: #696cff; }
.fu-email   { background: rgba(255,171,0,0.12);   color: #d97706; }
.fu-wa      { background: rgba(37,211,102,0.12);  color: #16a34a; }
.fu-meeting { background: rgba(3,195,236,0.12);   color: #0ea5e9; }
.fu-visit   { background: rgba(255,62,29,0.12);   color: #dc2626; }
.fu-other   { background: rgba(156,163,175,0.15); color: #6b7280; }

.item-name { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); }
.item-sub  {
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}
.item-time {
  font-size: 0.72rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}
.text-danger { color: #ff3e1d !important; }
.overdue-tag {
  background: #ff3e1d;
  color: #fff;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
}

/* TARGET */
.target-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}
.target-item { text-align: center; }
.target-num  {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
}
.target-num.muted { color: var(--text-muted); }
.target-label { font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }
.target-divider { width: 1px; height: 36px; background: var(--border-main); }

/* MINI CHART */
.mini-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 80px;
  padding-top: 8px;
}
.mini-bar-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}
.mini-bar {
  width: 100%;
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height 0.5s ease;
}
.mini-bar-label {
  font-size: 0.6rem;
  color: var(--text-muted);
  margin-top: 4px;
}

/* LEADERBOARD */
.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.lb-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  transition: background 0.15s;
}
.lb-item:hover { background: var(--bg-main); }
.lb-item.my-row {
  background: rgba(105,108,255,0.08);
  border: 1px solid rgba(105,108,255,0.2);
}
.lb-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--bg-main);
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.rank-1 { background: #fef3c7; color: #d97706; }
.rank-2 { background: #f1f5f9; color: #475569; }
.rank-3 { background: #fde8d8; color: #c2410c; }
.lb-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-main);
  flex-shrink: 0;
}
.lb-info { flex: 1; min-width: 0; }
.lb-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}
.you-badge {
  font-size: 0.6rem;
  font-weight: 700;
  background: #696cff;
  color: #fff;
  padding: 1px 6px;
  border-radius: 20px;
}
.lb-track {
  height: 4px;
  background: var(--border-main);
  border-radius: 4px;
  margin-top: 6px;
}
.lb-bar { height: 100%; border-radius: 4px; transition: width 0.8s ease; }
.lb-stats { text-align: right; flex-shrink: 0; }
.lb-total { font-size: 0.9rem; font-weight: 700; }
.lb-done  { font-size: 0.65rem; color: var(--text-muted); }

/* EMPTY */
.empty-state {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
}
.empty-state svg { font-size: 1.6rem; display: block; margin: 0 auto 6px; }
.empty-state p { margin: 0; font-size: 0.8rem; }

/* RESPONSIVE */
@media (max-width: 1024px) {
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .stats-grid    { grid-template-columns: repeat(2, 1fr); }
  .content-grid  { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr; }
}
</style>