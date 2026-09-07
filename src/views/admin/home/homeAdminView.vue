<template>
  <div class="dashboard-page">

    <!-- WELCOME BANNER -->
    <div class="welcome-banner">
      <h1 class="page-title">
        Welcome Back, Admin 👋
      </h1>

      <p class="page-subtitle">
        Here's what's happening with your CRM system today.
      </p>
    </div>

  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* WELCOME BANNER */
.welcome-banner {
  position: relative;
  overflow: hidden;
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: 16px;
  padding: 40px 32px;
}

.welcome-banner::before {
  content: '';
  position: absolute;
  top: -60px;
  right: -60px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.12);
}

.welcome-banner::after {
  content: '';
  position: absolute;
  bottom: -80px;
  right: 60px;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: rgba(56, 189, 248, 0.1);
}

.page-title {
  position: relative;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
}

.page-subtitle {
  position: relative;
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 0.95rem;
  max-width: 480px;
}

/* RESPONSIVE */
@media (max-width: 576px) {
  .welcome-banner {
    padding: 28px 20px;
  }

  .page-title {
    font-size: 1.4rem;
  }
}
</style>