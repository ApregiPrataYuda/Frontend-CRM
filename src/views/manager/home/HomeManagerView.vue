<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { usePermissionStore } from '@/stores/PermissionStore'
import { useDashboardManagerStore } from '@/stores/dashboardManagerStore'

const route      = useRoute()
const authStore  = useAuthStore()
const permission = usePermissionStore()
const dashboard  = useDashboardManagerStore()

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

// ── DATA FROM STORE ──
const summary        = computed(() => dashboard.stats.summary ?? {})
const salesPerf      = computed(() => dashboard.stats.sales_performance ?? [])
const overdueList    = computed(() => dashboard.stats.overdue_follow_ups ?? [])
const visitsToday    = computed(() => dashboard.stats.visits_today ?? [])
const inactiveSales  = computed(() => dashboard.stats.inactive_sales ?? [])
const conversion     = computed(() => dashboard.stats.conversion ?? {})

// ── HELPERS ──
const targetTypeClass = (type) => {
  return type === 'CUSTOMER' ? 'badge-customer' : 'badge-lead'
}

const formatDate = (dt) => {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const formatTimeOnly = (dt) => {
  if (!dt) return '-'
  return new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

const visitDuration = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return '-'
  const diff = (new Date(checkOut) - new Date(checkIn)) / 1000
  const m = Math.floor(diff / 60)
  const s = Math.floor(diff % 60)
  return `${m}m ${s}s`
}

const overdueAge = (dt) => {
  if (!dt) return ''
  const diff = (Date.now() - new Date(dt)) / (1000 * 60 * 60 * 24)
  const days = Math.floor(diff)
  if (days === 0) return 'Hari ini'
  return `${days} hari lalu`
}

const initials = (name) => {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const avatarColor = (name) => {
  const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899']
  let hash = 0
  for (let c of (name ?? '')) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

const fuIcon = (type) => {
  const map = { CALL: '📞', EMAIL: '✉️', WHATSAPP: '💬', MEETING: '👥', VISIT: '📍', OTHER: '•' }
  return map[type] ?? '•'
}
</script>

<template>
  <div class="dm-page">

    <!-- ── LOADING ── -->
    <div v-if="dashboard.loadingStats" class="dm-loading">
      <div class="spinner"></div>
      <span>Memuat dashboard...</span>
    </div>

    <template v-else>

      <!-- ── HEADER ── -->
      <div class="dm-header">
        <div>
          <h1 class="dm-title">Selamat Datang, {{ fullNameUser }} 👋</h1>
          <p class="dm-subtitle">Pantau performa tim & aktivitas bisnis — {{ currentMonth }}</p>
        </div>
        <div class="dm-header-badges">
          <span v-if="inactiveSales.length" class="badge-alert">
            ⚠️ {{ inactiveSales.length }} Sales Tidak Aktif
          </span>
          <span v-if="summary.overdue_follow_ups" class="badge-overdue">
            🔴 {{ summary.overdue_follow_ups }} Follow Up Terlambat
          </span>
        </div>
      </div>

      <!-- ── SUMMARY CARDS ── -->
      <div class="summary-grid">

        <div class="sum-card sum-indigo">
          <div class="sum-icon">🎯</div>
          <div class="sum-val">{{ summary.leads_this_month ?? 0 }}</div>
          <div class="sum-lbl">Lead Bulan Ini</div>
        </div>

        <div class="sum-card sum-green">
          <div class="sum-icon">🏆</div>
          <div class="sum-val">{{ summary.customers_this_month ?? 0 }}</div>
          <div class="sum-lbl">Customer Baru</div>
        </div>

        <div class="sum-card sum-blue">
          <div class="sum-icon">📍</div>
          <div class="sum-val">{{ summary.visits_today ?? 0 }}</div>
          <div class="sum-lbl">Kunjungan Hari Ini</div>
        </div>

        <div class="sum-card sum-amber">
          <div class="sum-icon">📅</div>
          <div class="sum-val">{{ summary.visits_this_month ?? 0 }}</div>
          <div class="sum-lbl">Kunjungan Bulan Ini</div>
        </div>

        <div class="sum-card sum-purple">
          <div class="sum-icon">🤝</div>
          <div class="sum-val">{{ summary.deals_this_month ?? 0 }}</div>
          <div class="sum-lbl">Deals Bulan Ini</div>
        </div>

        <div class="sum-card sum-red">
          <div class="sum-icon">⏰</div>
          <div class="sum-val">{{ summary.overdue_follow_ups ?? 0 }}</div>
          <div class="sum-lbl">Overdue Follow Up</div>
        </div>

      </div>

      <!-- ── CONVERSION STATS ── -->
      <div class="conv-section">
        <div class="conv-card">
          <div class="conv-header">
            <h3>Konversi & Pencapaian</h3>
          </div>
          <div class="conv-body">

            <div class="conv-item">
              <div class="conv-meta">
                <span>Lead → Customer</span>
                <strong>{{ conversion.lead_rate ?? 0 }}%</strong>
              </div>
              <div class="conv-bar-track">
                <div
                  class="conv-bar-fill fill-indigo"
                  :style="{ width: (conversion.lead_rate ?? 0) + '%' }"
                ></div>
              </div>
              <div class="conv-detail">
                {{ conversion.converted_leads ?? 0 }} dari {{ conversion.total_leads ?? 0 }} lead dikonversi
              </div>
            </div>

            <div class="conv-item">
              <div class="conv-meta">
                <span>Deal Rate</span>
                <strong>{{ conversion.deal_rate ?? 0 }}%</strong>
              </div>
              <div class="conv-bar-track">
                <div
                  class="conv-bar-fill fill-green"
                  :style="{ width: (conversion.deal_rate ?? 0) + '%' }"
                ></div>
              </div>
              <div class="conv-detail">
                {{ conversion.deals ?? 0 }} deals dari {{ conversion.total_customers ?? 0 }} customer
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- ── MAIN GRID ── -->
      <div class="main-grid">

        <!-- LEFT: Sales Performance + Visits Today -->
        <div class="col-left">

          <!-- Sales Performance -->
          <div class="card">
            <div class="card-hd">
              <h3>Performa Sales</h3>
              <span class="card-badge">Bulan Ini</span>
            </div>
            <div v-if="salesPerf.length === 0" class="empty-state">Belum ada data</div>
            <div v-else class="sales-perf-list">
              <div
                v-for="(s, i) in salesPerf"
                :key="s.sales_id"
                class="sp-row"
              >
                <div class="sp-rank" :class="i < 3 ? `rank-${i+1}` : ''">{{ i + 1 }}</div>
                <div
                  class="sp-avatar"
                  :style="{ background: avatarColor(s.sales_name) }"
                >
                  <img
                    v-if="s.sales_photo_url && !s.sales_photo_url.includes('default')"
                    :src="s.sales_photo_url"
                    :alt="s.sales_name"
                    @error="e => e.target.style.display='none'"
                  />
                  <span v-else>{{ initials(s.sales_name) }}</span>
                </div>
                <div class="sp-info">
                  <div class="sp-name">{{ s.sales_name }}</div>
                  <div class="sp-stats">
                    <span class="sp-tag tag-done">✓ {{ s.done }} selesai</span>
                    <span v-if="s.ongoing" class="sp-tag tag-ongoing">⏳ {{ s.ongoing }}</span>
                    <span v-if="s.planned" class="sp-tag tag-planned">📅 {{ s.planned }}</span>
                  </div>
                </div>
                <div class="sp-right">
                  <div class="sp-total">{{ s.total_visits }} kunjungan</div>
                  <div class="sp-deals" :class="s.deals > 0 ? 'deals-yes' : 'deals-no'">
                    {{ s.deals }} deals
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Visits Today -->
          <div class="card">
            <div class="card-hd">
              <h3>Kunjungan Hari Ini</h3>
              <span class="card-badge card-badge-blue">{{ visitsToday.length }} kunjungan</span>
            </div>
            <div v-if="visitsToday.length === 0" class="empty-state">Belum ada kunjungan hari ini</div>
            <div v-else class="visit-list">
              <div
                v-for="v in visitsToday"
                :key="v.id"
                class="visit-row"
              >
                <div
                  class="vr-avatar"
                  :style="{ background: avatarColor(v.sales_name) }"
                >
                  <img
                    v-if="v.sales_photo_url && !v.sales_photo_url.includes('default')"
                    :src="v.sales_photo_url"
                    :alt="v.sales_name"
                    @error="e => e.target.style.display='none'"
                  />
                  <span v-else>{{ initials(v.sales_name) }}</span>
                </div>
                <div class="vr-info">
                  <div class="vr-company">{{ v.company_name }}</div>
                  <div class="vr-sales">oleh {{ v.sales_name }}</div>
                  <div class="vr-time">
                    {{ formatTimeOnly(v.check_in_at) }} – {{ formatTimeOnly(v.check_out_at) }}
                    <span class="vr-dur">⏱ {{ visitDuration(v.check_in_at, v.check_out_at) }}</span>
                  </div>
                </div>
                <div class="vr-right">
                  <span :class="['badge-target', targetTypeClass(v.target_type)]">
                    {{ v.target_type }}
                  </span>
                  <span class="badge-done-visit">✓ DONE</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- RIGHT: Overdue + Inactive -->
        <div class="col-right">

          <!-- Overdue Follow Ups -->
          <div class="card card-danger">
            <div class="card-hd">
              <h3>⏰ Follow Up Terlambat</h3>
              <span class="card-badge card-badge-red">{{ overdueList.length }}</span>
            </div>
            <div v-if="overdueList.length === 0" class="empty-state">Tidak ada yang terlambat 🎉</div>
            <div v-else class="fu-list">
              <div
                v-for="fu in overdueList"
                :key="fu.id"
                class="fu-row"
              >
                <div class="fu-left">
                  <div class="fu-type-icon">{{ fuIcon(fu.follow_up_type) }}</div>
                </div>
                <div class="fu-body">
                  <div class="fu-subject">{{ fu.subject }}</div>
                  <div class="fu-company">🏢 {{ fu.company_name }}</div>
                  <div class="fu-meta">
                    <span v-if="fu.sales_name" class="fu-sales">👤 {{ fu.sales_name }}</span>
                    <span :class="['badge-target', targetTypeClass(fu.target_type)]">
                      {{ fu.target_type }}
                    </span>
                  </div>
                  <div class="fu-date">
                    📅 {{ formatDate(fu.follow_up_at) }}
                    <span class="fu-age">{{ overdueAge(fu.follow_up_at) }}</span>
                  </div>
                </div>
                <div class="fu-status">
                  <span class="badge-pending">{{ fu.status }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Inactive Sales -->
          <div v-if="inactiveSales.length" class="card card-warning">
            <div class="card-hd">
              <h3>⚠️ Sales Tidak Aktif</h3>
              <span class="card-badge card-badge-amber">{{ inactiveSales.length }}</span>
            </div>
            <div class="inactive-list">
              <div
                v-for="s in inactiveSales"
                :key="s.id_user"
                class="inactive-row"
              >
                <div
                  class="inactive-avatar"
                  :style="{ background: avatarColor(s.fullname) }"
                >
                  <img
                    v-if="s.photo_url && !s.photo_url.includes('default')"
                    :src="s.photo_url"
                    :alt="s.fullname"
                    @error="e => e.target.style.display='none'"
                  />
                  <span v-else>{{ initials(s.fullname) }}</span>
                </div>
                <div class="inactive-info">
                  <div class="inactive-name">{{ s.fullname }}</div>
                  <div class="inactive-desc">Belum ada aktivitas bulan ini</div>
                </div>
                <span class="badge-inactive">Tidak Aktif</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </template>

  </div>
</template>

<style scoped>
/* ── BASE ── */
.dm-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 40px;
}

/* ── LOADING ── */
.dm-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 80px 0;
  color: var(--text-muted);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border-main);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── HEADER ── */
.dm-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.dm-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
}

.dm-subtitle {
  margin-top: 6px;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.dm-header-badges {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.badge-alert {
  padding: 6px 14px;
  border-radius: 20px;
  background: rgba(245, 158, 11, 0.12);
  color: #b45309;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.badge-overdue {
  padding: 6px 14px;
  border-radius: 20px;
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid rgba(239, 68, 68, 0.25);
}

/* ── SUMMARY GRID ── */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
}

.sum-card {
  border-radius: 16px;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid transparent;
  transition: transform 0.15s;
}

.sum-card:hover {
  transform: translateY(-2px);
}

.sum-icon { font-size: 1.4rem; }
.sum-val  { font-size: 1.8rem; font-weight: 800; }
.sum-lbl  { font-size: 0.78rem; font-weight: 500; opacity: 0.8; }

.sum-indigo { background: rgba(99,102,241,0.1);  border-color: rgba(99,102,241,0.2);  color: #6366f1; }
.sum-green  { background: rgba(34,197,94,0.1);   border-color: rgba(34,197,94,0.2);   color: #16a34a; }
.sum-blue   { background: rgba(56,189,248,0.1);  border-color: rgba(56,189,248,0.2);  color: #0284c7; }
.sum-amber  { background: rgba(245,158,11,0.1);  border-color: rgba(245,158,11,0.2);  color: #b45309; }
.sum-purple { background: rgba(139,92,246,0.1);  border-color: rgba(139,92,246,0.2);  color: #7c3aed; }
.sum-red    { background: rgba(239,68,68,0.1);   border-color: rgba(239,68,68,0.2);   color: #dc2626; }

/* ── CONVERSION ── */
.conv-section { display: grid; }

.conv-card {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: 16px;
  padding: 20px;
}

.conv-header {
  margin-bottom: 20px;
}

.conv-header h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.conv-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.conv-item { display: flex; flex-direction: column; gap: 8px; }

.conv-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conv-meta span  { font-size: 0.85rem; color: var(--text-muted); }
.conv-meta strong { font-size: 1rem; font-weight: 700; color: var(--text-primary); }

.conv-bar-track {
  height: 8px;
  border-radius: 99px;
  background: var(--bg-main, #f1f5f9);
  overflow: hidden;
}

.conv-bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.6s ease;
}

.fill-indigo { background: linear-gradient(90deg, #818cf8, #6366f1); }
.fill-green  { background: linear-gradient(90deg, #4ade80, #16a34a); }

.conv-detail {
  font-size: 0.78rem;
  color: var(--text-muted);
}

/* ── MAIN GRID ── */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 20px;
  align-items: start;
}

.col-left,
.col-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── CARD ── */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: 16px;
  padding: 20px;
}

.card-danger {
  border-color: rgba(239, 68, 68, 0.2);
}

.card-warning {
  border-color: rgba(245, 158, 11, 0.2);
}

.card-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.card-hd h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.card-badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(99,102,241,0.1);
  color: #6366f1;
}

.card-badge-blue  { background: rgba(56,189,248,0.1); color: #0284c7; }
.card-badge-red   { background: rgba(239,68,68,0.1);  color: #dc2626; }
.card-badge-amber { background: rgba(245,158,11,0.1); color: #b45309; }

/* ── EMPTY STATE ── */
.empty-state {
  text-align: center;
  padding: 28px 0;
  color: var(--text-muted);
  font-size: 0.85rem;
}

/* ── SALES PERFORMANCE ── */
.sales-perf-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sp-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: var(--bg-main, #f8fafc);
  transition: background 0.15s;
}

.sp-row:hover {
  background: rgba(99,102,241,0.06);
}

.sp-rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 6px;
  background: var(--border-main);
  color: var(--text-muted);
  flex-shrink: 0;
}

.rank-1 { background: #fbbf24; color: #fff; }
.rank-2 { background: #94a3b8; color: #fff; }
.rank-3 { background: #cd7c4f; color: #fff; }

.sp-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  color: white;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
}

.sp-avatar img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}

.sp-info { flex: 1; min-width: 0; }

.sp-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: capitalize;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sp-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.sp-tag {
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 500;
}

.tag-done    { background: rgba(34,197,94,0.12);  color: #16a34a; }
.tag-ongoing { background: rgba(245,158,11,0.12); color: #b45309; }
.tag-planned { background: rgba(99,102,241,0.12); color: #6366f1; }

.sp-right { text-align: right; flex-shrink: 0; }

.sp-total {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
}

.sp-deals {
  font-size: 0.75rem;
  margin-top: 2px;
  font-weight: 500;
}

.deals-yes { color: #16a34a; }
.deals-no  { color: var(--text-muted); }

/* ── VISITS TODAY ── */
.visit-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.visit-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: var(--bg-main, #f8fafc);
  transition: background 0.15s;
}

.visit-row:hover {
  background: rgba(56,189,248,0.06);
}

.vr-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
}

.vr-avatar img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.vr-info { flex: 1; min-width: 0; }

.vr-company {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vr-sales {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 2px;
  text-transform: capitalize;
}

.vr-time {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.vr-dur {
  background: rgba(99,102,241,0.1);
  color: #6366f1;
  padding: 1px 7px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
}

.vr-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.badge-done-visit {
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 20px;
  background: rgba(34,197,94,0.12);
  color: #16a34a;
  font-weight: 600;
}

/* ── OVERDUE FOLLOW UPS ── */
.fu-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 4px;
}

.fu-list::-webkit-scrollbar { width: 4px; }
.fu-list::-webkit-scrollbar-track { background: transparent; }
.fu-list::-webkit-scrollbar-thumb { background: var(--border-main); border-radius: 4px; }

.fu-row {
  display: flex;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(239,68,68,0.04);
  border: 1px solid rgba(239,68,68,0.1);
  transition: background 0.15s;
}

.fu-row:hover {
  background: rgba(239,68,68,0.08);
}

.fu-left { flex-shrink: 0; }

.fu-type-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  background: rgba(239,68,68,0.1);
  border-radius: 8px;
}

.fu-body { flex: 1; min-width: 0; }

.fu-subject {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fu-company {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fu-meta {
  display: flex;
  gap: 6px;
  margin-top: 4px;
  flex-wrap: wrap;
  align-items: center;
}

.fu-sales {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-transform: capitalize;
}

.fu-date {
  margin-top: 5px;
  font-size: 0.72rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}

.fu-age {
  background: rgba(239,68,68,0.12);
  color: #dc2626;
  padding: 1px 7px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
}

.fu-status { flex-shrink: 0; }

.badge-pending {
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 20px;
  background: rgba(245,158,11,0.12);
  color: #b45309;
  font-weight: 600;
}

/* ── TARGET TYPE BADGES ── */
.badge-target {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 600;
}

.badge-customer { background: rgba(99,102,241,0.12); color: #6366f1; }
.badge-lead     { background: rgba(34,197,94,0.12);  color: #16a34a; }

/* ── INACTIVE SALES ── */
.inactive-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.inactive-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(245,158,11,0.05);
  border: 1px solid rgba(245,158,11,0.15);
}

.inactive-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
}

.inactive-avatar img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.inactive-info { flex: 1; }

.inactive-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: capitalize;
}

.inactive-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.badge-inactive {
  font-size: 0.72rem;
  padding: 3px 10px;
  border-radius: 20px;
  background: rgba(245,158,11,0.15);
  color: #b45309;
  font-weight: 600;
  flex-shrink: 0;
}

/* ── RESPONSIVE ── */
@media (max-width: 1200px) {
  .summary-grid { grid-template-columns: repeat(3, 1fr); }
  .main-grid    { grid-template-columns: 1fr; }
  .col-right    { display: grid; grid-template-columns: 1fr 1fr; }
}

@media (max-width: 768px) {
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .conv-body    { grid-template-columns: 1fr; }
  .col-right    { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
  .summary-grid { grid-template-columns: 1fr 1fr; }
  .dm-title     { font-size: 1.3rem; }
}
</style>