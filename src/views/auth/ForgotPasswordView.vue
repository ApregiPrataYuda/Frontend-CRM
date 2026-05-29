<!-- <script setup>
import { ref, computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { isDark } = useTheme()

const email = ref('')
const loading = ref(false)
const errorMessage = ref('')
const isSuccess = ref(false) // State untuk mendeteksi email sukses terkirim

const themeClass = computed(() =>
  isDark.value ? 'dark-theme' : 'light-theme'
)

async function handleForgotPassword() {
  errorMessage.value = ''

  if (!email.value) {
    errorMessage.value = 'Email wajib diisi'
    return
  }

  try {
    loading.value = true

    // simulasi API Kirim Link Reset Password
    await new Promise(resolve => setTimeout(resolve, 1500))

    console.log('FORGOT PASSWORD EMAIL =>', email.value)
    
    // Aktifkan state sukses
    isSuccess.value = true
  }
  catch (err) {
    errorMessage.value = 'Gagal mengirim email reset. Pastikan email terdaftar.'
  }
  finally {
    loading.value = false
  }
}
</script> -->


<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/authStore'

const { isDark } = useTheme()

const authStore = useAuthStore()

const {
  loading,
  error,
  successMessage
} = storeToRefs(authStore)

const email = ref('')
const errorMessage = ref('')
const isSuccess = ref(false)

const themeClass = computed(() =>
  isDark.value ? 'dark-theme' : 'light-theme'
)

// VALIDASI EMAIL
function validateEmail() {

  errorMessage.value = ''

  if (!email.value) {

    errorMessage.value = 'Email wajib diisi'

    return false
  }

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email.value)) {

    errorMessage.value =
      'Format email tidak valid'

    return false
  }

  return true
}

// HANDLE FORGOT PASSWORD
async function handleForgotPassword() {

  if (!validateEmail()) return

  try {

    await authStore.forgotPassword({
      email: email.value
    })

    isSuccess.value = true

  } catch (err) {

    errorMessage.value =
      err.response?.data?.errors?.email?.[0] ||
      err.response?.data?.message ||
      error.value ||
      'Gagal mengirim email reset password'
  }
}

// RESET FORM
function resendEmail() {

  isSuccess.value = false
  email.value = ''
  errorMessage.value = ''
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
            <h1>Karya Suite App</h1>
            <p>CRM & Sales Management Platform</p>
          </div>
        </div>

        <div class="hero-text">
          <h2>Secure Your Account</h2>
          <p>
            Jangan khawatir jika Anda melupakan password Anda. Kami akan membantu 
            mengirimkan langkah-langkah pemulihan akun dengan aman.
          </p>
        </div>
      </div>
    </div>

    <div class="login-right">
      <div class="right-wrapper">

        <div v-if="!isSuccess" class="login-header">
          <h2>Forgot Password? 🔒</h2>
          <p>Masukkan email Anda untuk menerima link reset password</p>
        </div>

        <div class="login-card">

          <div v-if="isSuccess" class="success-state">
            <div class="success-icon-wrapper">
              <font-awesome-icon :icon="['fas', 'paper-plane']" class="success-icon" />
            </div>
            
            <h2>Check Your Email</h2>
            <p>
              Kami telah mengirimkan instruksi beserta link reset password ke 
              <strong>{{ email }}</strong>. Silakan periksa folder inbox atau spam Anda.
            </p>

            <button type="button" class="login-btn outline-btn" @click="isSuccess = false; email = ''">
              Kirim Ulang Email
            </button>
          </div>

          <div v-else>
            <Transition name="fade">
              <div v-if="errorMessage" class="error-box">
                {{ errorMessage }}
              </div>
            </Transition>

            <form @submit.prevent="handleForgotPassword">

              <div class="form-group">
                <label>Email Address</label>
                <div class="input-wrapper">
                  <font-awesome-icon :icon="['fas', 'envelope']" class="input-icon" />
                  <input
                    v-model="email"
                    type="email"
                    placeholder="admin@email.com"
                    :disabled="loading"
                    @input="errorMessage = ''"
                  />
                </div>
              </div>

              <button
                  type="submit"
                  class="login-btn"
                  :disabled="loading"
                >
                  <font-awesome-icon
                    v-if="loading"
                    :icon="['fas', 'spinner']"
                    class="spin"
                  />

                  <span>
                    {{ loading
                      ? 'Sending Link...'
                      : 'Send Reset Link'
                    }}
                  </span>
                </button>

            </form>
          </div>
        </div>

        <div class="login-footer">
          <router-link to="/login" class="back-link">
            <font-awesome-icon :icon="['fas', 'arrow-left']" /> Kembali ke Login
          </router-link>
        </div>

        <div class="login-footer copyright">
          © 2026 Karya Suite App
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
   LEFT SIDE (30% Rasio)
======================================== */
.login-left {
  flex: 7; /* Mengambil 30% lebar layar */
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
  margin-bottom: 40px; /* Disesuaikan ke 40px agar pas di area 30% */
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
  font-size: 2.2rem; /* Disesuaikan ke 2.2rem agar proporsional */
  line-height: 1.2;
  margin-bottom: 20px;
  font-weight: 800;
}

.hero-text p {
  font-size: 1.05rem;
  line-height: 1.8;
  opacity: 0.9;
}

/* ========================================
   RIGHT SIDE & WRAPPER (70% Rasio)
========================================= */
.login-right {
  flex: 3; /* Mengambil 70% lebar layar */
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
========================================= */
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

/* ========================================
   BUTTON PRIMARY
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
   SUCCESS STATE SPECIFIC STYLE
======================================== */
.success-state {
  text-align: center;
}

.success-icon-wrapper {
  width: 70px;
  height: 70px;
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.success-icon {
  font-size: 1.8rem;
}

.success-state h2 {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-primary, #1e293b);
  margin-bottom: 12px;
}

.success-state p {
  color: var(--text-secondary, #64748b);
  line-height: 1.6;
  font-size: 0.95rem;
  margin-bottom: 24px;
}

/* OUTLINE BUTTON (Kirim Ulang Email) */
.outline-btn {
  background: transparent !important;
  border: 2px solid #6366f1 !important;
  color: #6366f1 !important;
}

.outline-btn:hover {
  background: rgba(99, 102, 241, 0.05) !important;
  box-shadow: none !important;
}

/* ========================================
   FOOTER TEXT & LINKS
======================================== */
.login-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 0.88rem;
}

.back-link {
  color: var(--text-secondary, #64748b);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: #6366f1;
}

.back-link svg {
  margin-right: 4px;
}

.copyright {
  margin-top: 12px;
  font-size: 0.8rem;
  color: var(--text-secondary, #64748b);
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