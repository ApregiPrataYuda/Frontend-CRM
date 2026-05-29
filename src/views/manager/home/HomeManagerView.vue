<script setup>
const stats = [
  {
    title: 'Total Revenue',
    value: 'Rp 845JT',
    icon: 'chart-line',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
  },
  {
    title: 'Sales Team',
    value: '18',
    icon: 'users',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
  },
  {
    title: 'Pending Approval',
    value: '12',
    icon: 'clock',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
  },
  {
    title: 'Growth',
    value: '+24%',
    icon: 'arrow-trend-up',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.1)',
  },
]

const approvals = [
  {
    title: 'Discount approval request',
    sales: 'Budi Santoso',
    time: '10 minutes ago',
  },
  {
    title: 'Customer refund request',
    sales: 'Rina Putri',
    time: '30 minutes ago',
  },
]

const topSales = [
  {
    name: 'Budi Santoso',
    total: 'Rp 85JT',
    target: '98%',
  },
  {
    name: 'Rina Putri',
    total: 'Rp 76JT',
    target: '91%',
  },
  {
    name: 'Andi Saputra',
    total: 'Rp 61JT',
    target: '84%',
  },
]
</script>

<template>
  <div class="dashboard-page">

    <div class="dashboard-header">

      <div>
        <h1 class="page-title">
          Welcome Back, Manager 👋
        </h1>

        <p class="page-subtitle">
          Monitor team performance and business analytics.
        </p>
      </div>

      <button class="btn-primary">
        <font-awesome-icon icon="chart-column" />
        View Analytics
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
            <h3>Business Overview</h3>
          </div>

          <div class="overview-grid">

            <div class="overview-item">
              <span>Total Transactions</span>
              <strong>3,420</strong>
            </div>

            <div class="overview-item">
              <span>Completed Orders</span>
              <strong>3,120</strong>
            </div>

            <div class="overview-item">
              <span>Conversion Rate</span>
              <strong>82%</strong>
            </div>

            <div class="overview-item">
              <span>Active Customers</span>
              <strong>1,248</strong>
            </div>

          </div>

        </div>

        <div class="card">

          <div class="card-header">
            <h3>Pending Approvals</h3>
          </div>

          <div class="activity-list">

            <div
              v-for="(item, index) in approvals"
              :key="index"
              class="activity-item"
            >

              <div class="activity-dot"></div>

              <div class="activity-content">
                <div class="activity-title">
                  {{ item.title }}
                </div>

                <div class="activity-desc">
                  Requested by {{ item.sales }}
                </div>

                <div class="activity-time">
                  {{ item.time }}
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
            <h3>Top Sales Performance</h3>
          </div>

          <div class="sales-list">

            <div
              v-for="(sales, index) in topSales"
              :key="index"
              class="sales-item"
            >

              <div class="sales-avatar">
                {{ sales.name.charAt(0) }}
              </div>

              <div class="sales-info">
                <div class="sales-name">
                  {{ sales.name }}
                </div>

                <div class="sales-total">
                  {{ sales.total }}
                </div>
              </div>

              <div class="sales-target">
                {{ sales.target }}
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