<script setup>
import { ref, computed } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

import { useSettingAppStore } from '@/stores/settingAppStore'
const settingStore = useSettingAppStore()

const router = useRouter()
const authStore = useAuthStore()

const { isDark } = useTheme()

const form = ref({
  email: '',
  password: '',
  remember: false,
})

const showPassword = ref(false)

const themeClass = computed(() =>
  isDark.value ? 'dark-theme' : 'light-theme'
)


async function handleLogin() {
  authStore.error = null

  if (!form.value.email || !form.value.password) {
    authStore.error = 'Email dan password wajib diisi'
    return
  }

  try {
    await authStore.login({
      email: form.value.email,
      password: form.value.password,
    })

    // Langsung pakai redirectUrl dari store (sudah di-prepend /app)
    router.push(authStore.redirectUrl)

  } catch (err) {
    console.error(err)
  }
}
</script>


<template>
  <div class="login-page" :class="themeClass">

    <div class="login-left">
      <div class="overlay"></div>
      <div class="left-content">

        <div class="brand-wrapper">
          <div class="brand-logo">
            <font-awesome-icon :icon="['fas', 'chart-line']" class="fallback-icon" />
          </div>
          <div>
            <h1>PT. Duta Indomandiri.</h1>
            <p>CRM & Sales Management Platform</p>
          </div>
        </div>

        <div class="hero-text">
          <h2>Manage Your Business Smarter</h2>
          <p>
            Pantau leads, customer, sales report, dan performa tim dalam satu dashboard modern.
          </p>
        </div>

      </div>
    </div>

    <div class="login-right">
      <div class="right-wrapper">

        <div class="login-header">
          <h2>Welcome Back 👋</h2>
          <p>Silakan login ke akun anda</p>
        </div>

        <div class="login-card">
          
          <Transition name="fade">
           <div v-if="authStore.error" class="error-box">
              {{ authStore.error }}
            </div>
          </Transition>

          <form @submit.prevent="handleLogin">

            <div class="form-group">
              <label>Email</label>
              <div class="input-wrapper">
                <font-awesome-icon :icon="['fas', 'envelope']" class="input-icon" />
                <input v-model="form.email" type="email" placeholder="admin@email.com" />
              </div>
            </div>

            <div class="form-group">
              <label>Password</label>
              <div class="input-wrapper">
                <font-awesome-icon :icon="['fas', 'lock']" class="input-icon" />
                <input 
                  v-model="form.password" 
                  :type="showPassword ? 'text' : 'password'" 
                  placeholder="••••••••" 
                />
                <button 
                  type="button" 
                  class="toggle-password" 
                  @click="showPassword = !showPassword"
                >
                  <font-awesome-icon v-if="showPassword" :icon="['fas', 'eye-slash']" />
                  <font-awesome-icon v-else :icon="['fas', 'eye']" />
                </button>
              </div>
            </div>

            <div class="form-options">
              <label class="remember-me">
                <input v-model="form.remember" type="checkbox" />
                <span>Remember me</span>
              </label>
              <router-link to="/forgot-password">Forgot Password?</router-link>
            </div>

            <button
                  type="submit"
                  class="login-btn"
                  :disabled="authStore.loading"
                >
              <font-awesome-icon  v-if="authStore.loading" :icon="['fas', 'spinner']" class="spin" />
              <span>{{ authStore.loading ? 'Signing In...' : 'Sign In' }}</span>
            </button>

           

          </form>
        </div>

        <div class="login-footer">
          Belum punya akun? 
          <router-link to="/register" class="auth-link">Daftar sekarang</router-link>
        </div>

        <div class="login-footer copyright">
          © 2026 PT. Duta Indomandiri.
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
/* ========================================
   PAGE
======================================== */
.login-page {
  min-height: 100vh;
  display: flex;
  background: var(--bg-body, #f8fafc);
}

/* ========================================
   LEFT SIDE
======================================== */
.login-left {
  flex: 7; /* Mengambil 3 dari total 10 bagian (30%) */
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: linear-gradient(135deg, #4f46e5, #6366f1, #818cf8);
}

.overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, rgba(255,255,255,0.15), transparent 40%);
}

.left-content {
  position: relative;
  z-index: 2;
  max-width: 520px;
  color: white;
}

.brand-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 60px;
}

.brand-logo {
  width: 58px;
  height: 58px;
  border-radius: 16px;
  background: rgba(255,255,255,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.fallback-icon {
  font-size: 1.6rem;
}

.brand-wrapper h1 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
}

.brand-wrapper p {
  margin: 4px 0 0;
  opacity: 0.8;
}

.hero-text h2 {
  font-size: 3rem;
  line-height: 1.1;
  margin-bottom: 20px;
  font-weight: 800;
}

.hero-text p {
  font-size: 1.05rem;
  line-height: 1.8;
  opacity: 0.9;
}

/* ========================================
   RIGHT SIDE & WRAPPER
======================================== */
.login-right {
  flex: 3; /* Mengambil 7 dari total 10 bagian (70%) */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--bg-body, #f8fafc);
}

.right-wrapper {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
}

.login-header {
  margin-bottom: 24px;
}

.login-header h2 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary, #1e293b);
}

.login-header p {
  margin-top: 6px;
  font-size: 0.95rem;
  color: var(--text-secondary, #64748b);
}

/* ========================================
   MODERN CARD EFFECT
======================================== */
.login-card {
  width: 100%;
  background: var(--bg-card, #ffffff);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.02),
    0 10px 15px -3px rgba(210, 214, 219, 0.25),
    0 20px 25px -5px rgba(210, 214, 219, 0.08);
  border: 1px solid var(--border-sidebar, #edf2f7);
}

/* ========================================
   ERROR BOX
======================================== */
.error-box {
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.15);
  color: #ef4444;
  font-size: 0.88rem;
  margin-bottom: 20px;
}

/* ========================================
   FORM GROUPS & INPUTS
======================================== */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary, #1e293b);
}

.input-wrapper {
  position: relative;
}

.input-wrapper input {
  width: 100%;
  height: 50px;
  border-radius: 14px;
  border: 1px solid var(--border-sidebar, #e2e8f0);
  background: var(--bg-card, #ffffff);
  padding: 0 48px;
  color: var(--text-primary, #1e293b);
  outline: none;
  transition: all 0.2s ease;
  font-size: 0.92rem;
}

.input-wrapper input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary, #64748b);
}

.toggle-password {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: var(--text-secondary, #64748b);
  cursor: pointer;
}

/* ========================================
   OPTIONS (Remember Me & Forgot Password)
======================================== */
.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  color: var(--text-secondary, #64748b);
  cursor: pointer;
}

.form-options a {
  font-size: 0.88rem;
  color: #6366f1;
  text-decoration: none;
  font-weight: 600;
}

/* ========================================
   BUTTON SIGN IN
======================================== */
.login-btn {
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(99, 102, 241, 0.25);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ========================================
   FOOTER TEXT
======================================== */
.login-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 0.88rem;
  color: var(--text-secondary, #64748b);
}

.auth-link {
  color: #6366f1;
  text-decoration: none;
  font-weight: 600;
}

.copyright {
  margin-top: 12px;
  font-size: 0.8rem;
  opacity: 0.7;
}

/* ========================================
   ANIMATION
======================================== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ========================================
   RESPONSIVE DESIGN
======================================== */
@media (max-width: 992px) {
  .login-left {
    display: none;
  }
  .login-right {
    width: 100%;
    min-width: unset;
  }
}

@media (max-width: 576px) {
  .login-right {
    padding: 20px;
  }
  .login-card {
    padding: 30px 20px;
  }
  .login-header h2 {
    font-size: 1.6rem;
  }
}
</style>