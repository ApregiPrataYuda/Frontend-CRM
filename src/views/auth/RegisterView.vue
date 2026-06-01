<script setup>
import { ref, computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { isDark } = useTheme()

const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const themeClass = computed(() =>
  isDark.value ? 'dark-theme' : 'light-theme'
)

async function handleRegister() {
  errorMessage.value = ''

  if (!form.value.name || !form.value.email || !form.value.password || !form.value.confirmPassword) {
    errorMessage.value = 'Semua field wajib diisi'
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = 'Konfirmasi password tidak cocok'
    return
  }

  if (!form.value.agreeTerms) {
    errorMessage.value = 'Anda harus menyetujui Syarat & Ketentuan'
    return
  }

  try {
    loading.value = true

    // simulasi API Register
    await new Promise(resolve => setTimeout(resolve, 1500))

    console.log('REGISTER DATA =>', form.value)
    
    // contoh redirect setelah sukses
    // router.push('/login')
  }
  catch (err) {
    errorMessage.value = 'Registrasi gagal, silakan coba lagi'
  }
  finally {
    loading.value = false
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
          <h2>Join Us and Grow Faster</h2>
          <p>
            Mulai kelola leads, otomatisasi sales report, dan tingkatkan performa 
            tim kamu dalam satu platform terintegrasi.
          </p>
        </div>
      </div>
    </div>

    <div class="login-right">
      <div class="right-wrapper">

        <div class="login-header">
          <h2>Create Account ✨</h2>
          <p>Daftar akun baru untuk memulai</p>
        </div>

        <div class="login-card">

          <Transition name="fade">
            <div v-if="errorMessage" class="error-box">
              {{ errorMessage }}
            </div>
          </Transition>

          <form @submit.prevent="handleRegister">

            <div class="form-group">
              <label>Nama Lengkap</label>
              <div class="input-wrapper">
                <font-awesome-icon :icon="['fas', 'user']" class="input-icon" />
                <input v-model="form.name" type="text" placeholder="John Doe" />
              </div>
            </div>

            <div class="form-group">
              <label>Email</label>
              <div class="input-wrapper">
                <font-awesome-icon :icon="['fas', 'envelope']" class="input-icon" />
                <input v-model="form.email" type="email" placeholder="nama@email.com" />
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
                <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                  <font-awesome-icon :icon="showPassword ? ['fas', 'eye-slash'] : ['fas', 'eye']" />
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>Konfirmasi Password</label>
              <div class="input-wrapper">
                <font-awesome-icon :icon="['fas', 'lock']" class="input-icon" />
                <input 
                  v-model="form.confirmPassword" 
                  :type="showConfirmPassword ? 'text' : 'password'" 
                  placeholder="••••••••" 
                />
                <button type="button" class="toggle-password" @click="showConfirmPassword = !showConfirmPassword">
                  <font-awesome-icon :icon="showConfirmPassword ? ['fas', 'eye-slash'] : ['fas', 'eye']" />
                </button>
              </div>
            </div>

            <div class="form-options">
              <label class="remember-me">
                <input v-model="form.agreeTerms" type="checkbox" />
                <span>Saya setuju dengan <a href="#" class="inline-link">Syarat & Ketentuan</a></span>
              </label>
            </div>

            <button type="submit" class="login-btn" :disabled="loading">
              <font-awesome-icon v-if="loading" :icon="['fas', 'spinner']" class="spin" />
              <span>{{ loading ? 'Registering...' : 'Sign Up' }}</span>
            </button>

          </form>
        </div>

        <div class="login-footer">
          Sudah punya akun? 
          <router-link to="/login" class="auth-link">Login sekarang</router-link>
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
  margin-bottom: 40px; /* Dikurangi menjadi 40px agar pas di area 30% */
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
  font-size: 2.2rem; /* Disesuaikan ke 2.2rem agar tidak terpotong kaku */
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
   OPTIONS / LINKS
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

.inline-link {
  color: #6366f1;
  text-decoration: none;
  font-weight: 600;
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

/* ========================================
   BUTTON SIGN UP
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