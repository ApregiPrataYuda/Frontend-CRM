<script setup>
const reports = [
  {
    title: 'Monthly Sales Summary',
    department: 'Sales',
    created_by: 'Admin',
    status: 'Published',
    date: '20 Mei 2026',
  },
  {
    title: 'Employee Performance',
    department: 'HR',
    created_by: 'Manager',
    status: 'Draft',
    date: '18 Mei 2026',
  },
  {
    title: 'Finance Cashflow',
    department: 'Finance',
    created_by: 'Finance Team',
    status: 'Published',
    date: '15 Mei 2026',
  },
]
</script>

<template>
  <div class="reports-page">

    <div class="page-header">
      <div>
        <h1>Reports Manager (ALL)</h1>
        <p>Manage and monitor all reports</p>
      </div>

      <button class="btn-primary">
        <font-awesome-icon icon="plus" />
        Create Report
      </button>
    </div>

    <div class="table-card">

      <table class="report-table">

        <thead>
          <tr>
            <th>Report</th>
            <th>Department</th>
            <th>Created By</th>
            <th>Date</th>
            <th>Status</th>
            <th width="120">Action</th>
          </tr>
        </thead>

        <tbody>

          <tr
            v-for="(report, index) in reports"
            :key="index"
          >
            <td>
              <div class="report-title">
                <font-awesome-icon icon="file-lines" />
                {{ report.title }}
              </div>
            </td>

            <td>{{ report.department }}</td>

            <td>{{ report.created_by }}</td>

            <td>{{ report.date }}</td>

            <td>
              <span
                class="badge"
                :class="report.status === 'Published'
                  ? 'success'
                  : 'warning'"
              >
                {{ report.status }}
              </span>
            </td>

            <td>
              <div class="actions">
                <button class="btn-icon">
                  <font-awesome-icon icon="eye" />
                </button>

                <button class="btn-icon edit">
                  <font-awesome-icon icon="pen" />
                </button>

                <button class="btn-icon delete">
                  <font-awesome-icon icon="trash" />
                </button>
              </div>
            </td>
          </tr>

        </tbody>

      </table>

    </div>

  </div>
</template>

<style scoped>
.reports-page {
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

.table-card {
  background: var(--bg-card);
  border-radius: 14px;
  border: 1px solid var(--border-main);
  overflow-x: auto;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
}

.report-table th,
.report-table td {
  padding: 16px;
  border-bottom: 1px solid var(--border-main);
}

.report-table th {
  background: var(--bg-main);
  font-size: 0.82rem;
  color: var(--text-muted);
}

.report-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.badge {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.success {
  background: rgba(34,197,94,0.1);
  color: #16a34a;
}

.warning {
  background: rgba(245,158,11,0.1);
  color: #d97706;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: rgba(99,102,241,0.1);
  color: #6366f1;
  cursor: pointer;
}

.edit {
  background: rgba(245,158,11,0.1);
  color: #d97706;
}

.delete {
  background: rgba(239,68,68,0.1);
  color: #ef4444;
}
</style>