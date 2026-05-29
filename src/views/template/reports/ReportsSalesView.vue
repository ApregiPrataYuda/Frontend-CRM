<script setup>
const salesReports = [
  {
    customer: 'PT Maju Bersama',
    sales: 'Budi Santoso',
    total: 'Rp 12.500.000',
    status: 'Paid',
    date: '20 Mei 2026',
  },
  {
    customer: 'CV Digital Nusantara',
    sales: 'Andi Saputra',
    total: 'Rp 8.250.000',
    status: 'Pending',
    date: '19 Mei 2026',
  },
  {
    customer: 'PT Sinar Jaya',
    sales: 'Rina Putri',
    total: 'Rp 15.000.000',
    status: 'Paid',
    date: '18 Mei 2026',
  },
]
</script>

<template>
  <div class="sales-page">

    <!-- HEADER -->
    <div class="page-header">

      <div>
        <h1>Sales Reports</h1>
        <p>Monitor sales transaction reports</p>
      </div>

      <button class="btn-primary">
        <font-awesome-icon icon="download" />
        Export Report
      </button>

    </div>

    <!-- STATS -->
    <div class="stats-grid">

      <div class="stat-card">
        <div class="stat-icon blue">
          <font-awesome-icon icon="chart-line" />
        </div>
        <div>
          <div class="stat-value">Rp 120JT</div>
          <div class="stat-label">Total Revenue</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon green">
          <font-awesome-icon icon="circle-check" />
        </div>
        <div>
          <div class="stat-value">32</div>
          <div class="stat-label">Transactions</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon orange">
          <font-awesome-icon icon="clock" />
        </div>
        <div>
          <div class="stat-value">5</div>
          <div class="stat-label">Pending Payment</div>
        </div>
      </div>

    </div>

    <!-- TABLE -->
    <div class="table-card">

      <table class="sales-table">

        <thead>
          <tr>
            <th>Customer</th>
            <th>Sales</th>
            <th>Total</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>

          <tr
            v-for="(item, index) in salesReports"
            :key="index"
          >
            <td>{{ item.customer }}</td>

            <td>{{ item.sales }}</td>

            <td class="price">{{ item.total }}</td>

            <td>{{ item.date }}</td>

            <td>
              <span
                class="badge"
                :class="item.status === 'Paid'
                  ? 'paid'
                  : 'pending'"
              >
                {{ item.status }}
              </span>
            </td>
          </tr>

        </tbody>

      </table>

    </div>

  </div>
</template>

<style scoped>
.sales-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-header h1 {
  font-size: 1.5rem;
  color: var(--text-primary);
}

.page-header p {
  color: var(--text-muted);
  margin-top: 4px;
}

.btn-primary {
  height: 42px;
  padding: 0 18px;
  border: none;
  border-radius: 10px;
  background: #6366f1;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

/* STATS */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: 14px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.blue {
  background: rgba(99,102,241,0.1);
  color: #6366f1;
}

.green {
  background: rgba(34,197,94,0.1);
  color: #16a34a;
}

.orange {
  background: rgba(245,158,11,0.1);
  color: #d97706;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-top: 4px;
}

/* TABLE */
.table-card {
  background: var(--bg-card);
  border-radius: 14px;
  border: 1px solid var(--border-main);
  overflow-x: auto;
}

.sales-table {
  width: 100%;
  border-collapse: collapse;
}

.sales-table th,
.sales-table td {
  padding: 16px;
  border-bottom: 1px solid var(--border-main);
}

.sales-table th {
  background: var(--bg-main);
  font-size: 0.82rem;
  color: var(--text-muted);
}

.price {
  font-weight: 700;
  color: #16a34a;
}

.badge {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.paid {
  background: rgba(34,197,94,0.1);
  color: #16a34a;
}

.pending {
  background: rgba(245,158,11,0.1);
  color: #d97706;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>