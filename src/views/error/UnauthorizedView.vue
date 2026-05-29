<script setup>
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()

const backToDashboard = computed(() => {
  const roleMap = {
    1: '/app/administrator-dashboard',
    2: '/app/sales-home',
    3: '/app/manager-home',
  }
  return roleMap[auth.roleId] || '/login'
})
const { isDark } = useTheme()

const themeClass = computed(() =>
  isDark.value ? 'dark-theme' : 'light-theme'
)
</script>

<template>
  <div class="error-page" :class="themeClass">
    <div class="error-container">
      
      <div class="illustration-wrapper">
        <div class="glow-effect"></div>
        <!-- Mengubah kode error menjadi 403 (Forbidden) atau 401 (Unauthorized) -->
        <h1 class="error-code">403</h1>
      </div>

      <div class="error-content">
        <h2>Akses Ditolak 🚫</h2>
        <p>
          Maaf, Anda tidak memiliki izin atau hak akses yang cukup untuk melihat halaman ini. 
          Silakan hubungi administrator jika Anda merasa ini adalah sebuah kesalahan.
        </p>
      </div>

      <div class="action-wrapper">
       <router-link 
        :to="backToDashboard" 
        class="btn-primary"
      >
        <font-awesome-icon :icon="['fas', 'house']" />
        <span>Back to Dashboard</span>
      </router-link>
        
        <router-link to="/login" class="btn-secondary">
          <font-awesome-icon :icon="['fas', 'arrow-left']" />
          <span>Kembali Login</span>
        </router-link>
      </div>

      <div class="error-footer">
        © 2026 PT SATU DUA • CRM Platform
      </div>

    </div>
  </div>
</template>

<style scoped>
/* ========================================
   PAGE LAYOUT
======================================== */
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-body, #f8fafc);
  padding: 24px;
  overflow: hidden;
  position: relative;
}

.error-container {
  width: 100%;
  max-width: 520px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
}

/* ========================================
   404 BIG TEXT & GLOW EFFECT
======================================== */
.illustration-wrapper {
  position: relative;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-code {
  font-size: 8rem;
  font-weight: 900;
  line-height: 1;
  margin: 0;
  letter-spacing: -2px;
  background: linear-gradient(135deg, #4f46e5, #6366f1, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: float 4s ease-in-out infinite;
}

.glow-effect {
  position: absolute;
  width: 180px;
  height: 180px;
  background: rgba(99, 102, 241, 0.15);
  filter: blur(50px);
  border-radius: 50%;
  z-index: -1;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

@keyframes float {
  0%, 100% { transform: translateY(0px); } 
  50%      { transform: translateY(-10px); }
}

/* ========================================
   TEXT CONTENT
======================================== */
.error-content h2 {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-primary, #1e293b);
  margin-bottom: 12px;
}

.error-content p {
  font-size: 1rem;
  color: var(--text-secondary, #64748b);
  line-height: 1.6;
  max-width: 440px;
  margin: 0 auto 32px;
}

/* ========================================
   BUTTONS
======================================== */
.action-wrapper {
  display: flex;
  gap: 16px;
  width: 100%;
  justify-content: center;
  margin-bottom: 48px;
}

.btn-primary, .btn-secondary {
  height: 48px;
  padding: 0 24px;
  border-radius: 14px;
  font-weight: 600;
  font-size: 0.92rem;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
}

.btn-secondary {
  background: var(--bg-card, #ffffff);
  color: var(--text-primary, #1e293b);
  border: 1px solid var(--border-sidebar, #e2e8f0);
}

.btn-secondary:hover {
  transform: translateY(-2px);
  background: var(--bg-body, #f8fafc);
  border-color: #6366f1;
  color: #6366f1;
}

/* ========================================
   FOOTER
======================================== */
.error-footer {
  font-size: 0.8rem;
  color: var(--text-secondary, #64748b);
  opacity: 0.7;
}

/* ========================================
   RESPONSIVE DESIGN
======================================== */
@media (max-width: 576px) {
  .error-code {
    font-size: 6rem;
  }
  .error-content h2 {
    font-size: 1.6rem;
  }
  .action-wrapper {
    flex-direction: column;
    width: 100%;
    max-width: 280px;
    gap: 12px;
  }
  .btn-primary, .btn-secondary {
    width: 100%;
  }
}
</style>