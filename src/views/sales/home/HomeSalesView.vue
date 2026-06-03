<script setup>
import { ref, onMounted, onUnmounted, computed  } from 'vue'
import AppModal from '@/components/AppModal.vue'
import { useConfirm } from '@/composables/useConfirm'
import { usePermissionStore } from '@/stores/permissionStore'
import { useAuthStore } from '@/stores/authStore'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'

const { confirm } = useConfirm()
const permission = usePermissionStore()
const route      = useRoute()
const toast = useToast()
const authStore = useAuthStore()


// ── PERMISSIONS ────────────────────────────
const currentUrl = computed(() => route.path.replace('/app', ''))
const canCreate  = computed(() => permission.canCreate(currentUrl.value))
const canUpdate  = computed(() => permission.canUpdate(currentUrl.value))
const canDelete  = computed(() => permission.canDelete(currentUrl.value))
const canView    = computed(() => permission.canView(currentUrl.value))


const fullNameUser = computed(() =>
  authStore.user?.fullname || 'User'
)



const stats = [
  {
    title: 'Target Bulanan',
    value: '72%',
    icon: 'bullseye',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
  },
  {
    title: 'Leads Hari Ini',
    value: '18',
    icon: 'user-plus',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
  },
  {
    title: 'Follow Up',
    value: '9',
    icon: 'phone',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
  },
  {
    title: 'Closing',
    value: 'Rp 32JT',
    icon: 'wallet',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.1)',
  },
]

const activities = [
  {
    title: 'Meeting with PT Nusantara',
    desc: 'Presentation product CRM',
    time: '09:00 AM',
  },
  {
    title: 'Follow up customer',
    desc: 'PT Maju Bersama',
    time: '11:30 AM',
  },
  {
    title: 'Send quotation',
    desc: 'Invoice quotation sent',
    time: '01:00 PM',
  },
]

const customers = [
  {
    name: 'PT Digital Nusantara',
    status: 'Hot Lead',
  },
  {
    name: 'CV Maju Jaya',
    status: 'Negotiation',
  },
  {
    name: 'PT Sinar Abadi',
    status: 'Follow Up',
  },
]
</script>

<template>
  <div class="dashboard-page">

    <div class="dashboard-header">

      <div>
        <h1 class="page-title">
          Welcome Back, {{ fullNameUser }} 👋
        </h1>

        <p class="page-subtitle">
          Manage your leads and sales activity today.
        </p>
      </div>

      <button class="btn-primary">
        <font-awesome-icon icon="plus" />
        Add Lead
      </button>

    </div>

    <!-- STATS -->
    <div class="stats-grid">

      <div
        v-for="stat in stats"
        :key="stat.title"
        class="stat-card"
      >

        <div
          class="stat-icon"
          :style="{
            background: stat.bg,
            color: stat.color
          }"
        >
          <font-awesome-icon :icon="stat.icon" />
        </div>

        <div>
          <div class="stat-value">
            {{ stat.value }}
          </div>

          <div class="stat-title">
            {{ stat.title }}
          </div>
        </div>

      </div>

    </div>

    <!-- CONTENT -->
    <div class="content-grid">

      <!-- LEFT -->
      <div class="left-content">

        <div class="card">

          <div class="card-header">
            <h3>Today's Activity</h3>
          </div>

          <div class="activity-list">

            <div
              v-for="(activity, index) in activities"
              :key="index"
              class="activity-item"
            >

              <div class="activity-dot"></div>

              <div class="activity-content">
                <div class="activity-title">
                  {{ activity.title }}
                </div>

                <div class="activity-desc">
                  {{ activity.desc }}
                </div>

                <div class="activity-time">
                  {{ activity.time }}
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      <!-- RIGHT -->
      <div class="right-content">

        <div class="card">

          <div class="card-header">
            <h3>Customer Pipeline</h3>
          </div>

          <div class="sales-list">

            <div
              v-for="(customer, index) in customers"
              :key="index"
              class="sales-item"
            >

              <div class="sales-avatar">
                {{ customer.name.charAt(0) }}
              </div>

              <div class="sales-info">
                <div class="sales-name">
                  {{ customer.name }}
                </div>

                <div class="sales-total">
                  {{ customer.status }}
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

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
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
}

.page-subtitle {
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.btn-primary {
  height: 44px;
  padding: 0 18px;
  border: none;
  border-radius: 10px;
  background: #6366f1;
  color: white;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* STATS */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-title {
  margin-top: 4px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* CONTENT */
.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.left-content,
.right-content {
  display: flex;
  flex-direction: column;
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
  margin-bottom: 18px;
}

.card-header h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

/* OVERVIEW */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.overview-item {
  padding: 16px;
  border-radius: 12px;
  background: var(--bg-main);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.overview-item span {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.overview-item strong {
  font-size: 1.2rem;
  color: var(--text-primary);
}

/* ACTIVITY */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.activity-item {
  display: flex;
  gap: 14px;
}

.activity-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #6366f1;
  margin-top: 6px;
}

.activity-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.activity-desc {
  margin-top: 4px;
  font-size: 0.82rem;
  color: var(--text-muted);
}

.activity-time {
  margin-top: 6px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* SALES */
.sales-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sales-item {
  display: flex;
  align-items: center;
  gap: 14px;
}

.sales-avatar {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(99,102,241,0.1);
  color: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.sales-info {
  flex: 1;
}

.sales-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.sales-total {
  margin-top: 4px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.sales-target {
  font-size: 0.85rem;
  font-weight: 700;
  color: #16a34a;
}

/* QUICK ACTION */
.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.quick-btn {
  height: 48px;
  border: 1px solid var(--border-main);
  border-radius: 12px;
  background: var(--bg-main);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.quick-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
}

/* RESPONSIVE */
@media (max-width: 992px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 576px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    grid-template-columns: 1fr;
  }
}
</style>