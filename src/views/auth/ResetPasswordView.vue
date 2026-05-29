<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()

const { isDark } = useTheme()

const authStore = useAuthStore()

const {
  loading,
  error
} = storeToRefs(authStore)

// ========================================
// FORM
// ========================================
const form = ref({
  email: route.query.email || '',
  token: route.query.token || '',
  password: '',
  password_confirmation: ''
})

const errors = ref({
  password: '',
  password_confirmation: '',
  general: ''
})

const success = ref(false)

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const themeClass = computed(() =>
  isDark.value ? 'dark-theme' : 'light-theme'
)

// ========================================
// VALIDATION
// ========================================
function validate() {

  errors.value = {
    password: '',
    password_confirmation: '',
    general: ''
  }

  if (!form.value.password) {

    errors.value.password =
      'Password wajib diisi'

    return false
  }

  if (form.value.password.length < 6) {

    errors.value.password =
      'Password minimal 6 karakter'

    return false
  }

  if (!form.value.password_confirmation) {

    errors.value.password_confirmation =
      'Konfirmasi password wajib diisi'

    return false
  }

  if (
    form.value.password !==
    form.value.password_confirmation
  ) {

    errors.value.password_confirmation =
      'Konfirmasi password tidak cocok'

    return false
  }

  return true
}

// ========================================
// SUBMIT
// ========================================
async function handleResetPassword() {

  if (!validate()) return

  try {

    await authStore.resetPassword({
      token: form.value.token,
      email: form.value.email,
      password: form.value.password,
      password_confirmation:
        form.value.password_confirmation
    })

    success.value = true

    setTimeout(() => {

      router.push('/login')

    }, 2500)

  } catch (err) {

    errors.value.general =
      err.response?.data?.message ||
      error.value ||
      'Reset password gagal'
  }
}
</script>

<template>
  <div
    class="login-page"
    :class="themeClass"
  >

    <!-- ========================================
         LEFT SIDE
    ========================================= -->
    <div class="login-left">

      <div class="overlay"></div>

      <div class="left-content">

        <div class="brand-wrapper">

          <div class="brand-logo">
            <font-awesome-icon
              :icon="['fas', 'shield-halved']"
              class="fallback-icon"
            />
          </div>

          <div>
            <h1>Karya Suite App</h1>
            <p>
              CRM & Sales Management Platform
            </p>
          </div>

        </div>

        <div class="hero-text">

          <h2>Create New Password</h2>

          <p>
            Buat password baru yang aman
            untuk melindungi akun Anda dan
            menjaga akses tetap aman.
          </p>

        </div>

      </div>

    </div>

    <!-- ========================================
         RIGHT SIDE
    ========================================= -->
    <div class="login-right">

      <div class="right-wrapper">

        <!-- HEADER -->
        <div
          v-if="!success"
          class="login-header"
        >

          <h2>Reset Password 🔐</h2>

          <p>
            Silakan masukkan password baru
            Anda
          </p>

        </div>

        <!-- CARD -->
        <div class="login-card">

          <!-- SUCCESS -->
          <div
            v-if="success"
            class="success-state"
          >

            <div class="success-icon-wrapper">

              <font-awesome-icon
                :icon="['fas', 'circle-check']"
                class="success-icon"
              />

            </div>

            <h2>Password Berhasil Direset</h2>

            <p>
              Password akun Anda berhasil
              diperbarui.
              Anda akan diarahkan ke halaman
              login dalam beberapa detik.
            </p>

            <button
              class="login-btn"
              @click="router.push('/login')"
            >
              Kembali ke Login
            </button>

          </div>

          <!-- FORM -->
          <div v-else>

            <!-- ERROR -->
            <Transition name="fade">

              <div
                v-if="errors.general"
                class="error-box"
              >
                {{ errors.general }}
              </div>

            </Transition>

            <form
              @submit.prevent="
                handleResetPassword
              "
            >

              <!-- PASSWORD -->
              <div class="form-group">

                <label>Password Baru</label>

                <div class="input-wrapper">

                  <font-awesome-icon
                    :icon="['fas', 'lock']"
                    class="input-icon"
                  />

                  <input
                    v-model="form.password"
                    :type="
                      showPassword
                        ? 'text'
                        : 'password'
                    "
                    placeholder="Masukkan password baru"
                  />

                  <button
                    type="button"
                    class="toggle-password"
                    @click="
                      showPassword =
                      !showPassword
                    "
                  >

                    <font-awesome-icon
                      :icon="
                        showPassword
                          ? ['fas', 'eye-slash']
                          : ['fas', 'eye']
                      "
                    />

                  </button>

                </div>

                <small
                  v-if="errors.password"
                  class="field-error"
                >
                  {{ errors.password }}
                </small>

              </div>

              <!-- CONFIRM PASSWORD -->
              <div class="form-group">

                <label>
                  Konfirmasi Password
                </label>

                <div class="input-wrapper">

                  <font-awesome-icon
                    :icon="['fas', 'lock']"
                    class="input-icon"
                  />

                  <input
                    v-model="
                      form.password_confirmation
                    "
                    :type="
                      showConfirmPassword
                        ? 'text'
                        : 'password'
                    "
                    placeholder="Ulangi password baru"
                  />

                  <button
                    type="button"
                    class="toggle-password"
                    @click="
                      showConfirmPassword =
                      !showConfirmPassword
                    "
                  >

                    <font-awesome-icon
                      :icon="
                        showConfirmPassword
                          ? ['fas', 'eye-slash']
                          : ['fas', 'eye']
                      "
                    />

                  </button>

                </div>

                <small
                  v-if="
                    errors.password_confirmation
                  "
                  class="field-error"
                >
                  {{
                    errors.password_confirmation
                  }}
                </small>

              </div>

              <!-- BUTTON -->
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
                  {{
                    loading
                      ? 'Processing...'
                      : 'Reset Password'
                  }}
                </span>

              </button>

            </form>

          </div>

        </div>

        <!-- FOOTER -->
        <div class="login-footer">

          <router-link
            to="/login"
            class="back-link"
          >

            <font-awesome-icon
              :icon="['fas', 'arrow-left']"
            />

            Kembali ke Login

          </router-link>

        </div>

        <div
          class="login-footer copyright"
        >
          © 2026 Karya Suite App
        </div>

      </div>

    </div>

  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  background: var(--bg-body, #f8fafc);
}

/* ========================================
   LEFT SIDE
======================================== */
.login-left {
  flex: 7;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background:
    linear-gradient(
      135deg,
      #4f46e5,
      #6366f1,
      #818cf8
    );
}

.overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      circle at top right,
      rgba(255,255,255,0.15),
      transparent 40%
    );
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
  margin-bottom: 40px;
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
  font-size: 2.2rem;
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
   RIGHT SIDE
======================================== */
.login-right {
  flex: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background:
    var(--bg-body, #f8fafc);
}

.right-wrapper {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
}

/* ========================================
   HEADER
======================================== */
.login-header {
  margin-bottom: 24px;
}

.login-header h2 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color:
    var(--text-primary, #1e293b);
}

.login-header p {
  margin-top: 6px;
  font-size: 0.95rem;
  color:
    var(--text-secondary, #64748b);
}

/* ========================================
   CARD
======================================== */
.login-card {
  width: 100%;
  background:
    var(--bg-card, #ffffff);
  border-radius: 20px;
  padding: 40px;
  box-shadow:
    0 4px 6px -1px rgba(0,0,0,0.02),
    0 10px 15px -3px rgba(210,214,219,0.25),
    0 20px 25px -5px rgba(210,214,219,0.08);

  border:
    1px solid
    var(--border-sidebar, #edf2f7);
}

/* ========================================
   ERROR
======================================== */
.error-box {
  padding: 14px 16px;
  border-radius: 12px;
  background:
    rgba(239,68,68,0.1);

  border:
    1px solid
    rgba(239,68,68,0.15);

  color: #ef4444;
  font-size: 0.88rem;
  margin-bottom: 20px;
}

.field-error {
  display: block;
  margin-top: 8px;
  color: #ef4444;
  font-size: 0.8rem;
}

/* ========================================
   FORM
======================================== */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  color:
    var(--text-primary, #1e293b);
}

.input-wrapper {
  position: relative;
}

.input-wrapper input {
  width: 100%;
  height: 50px;
  border-radius: 14px;
  border:
    1px solid
    var(--border-sidebar, #e2e8f0);

  background:
    var(--bg-card, #ffffff);

  padding: 0 48px;
  color:
    var(--text-primary, #1e293b);

  outline: none;
  transition: all 0.2s ease;
  font-size: 0.92rem;
}

.input-wrapper input:focus {
  border-color: #6366f1;

  box-shadow:
    0 0 0 4px
    rgba(99,102,241,0.12);
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color:
    var(--text-secondary, #64748b);
}

.toggle-password {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  cursor: pointer;
  color:
    var(--text-secondary, #64748b);
}

/* ========================================
   BUTTON
======================================== */
.login-btn {
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 14px;

  background:
    linear-gradient(
      135deg,
      #4f46e5,
      #6366f1
    );

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

  box-shadow:
    0 10px 24px
    rgba(99,102,241,0.25);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* ========================================
   SUCCESS
======================================== */
.success-state {
  text-align: center;
}

.success-icon-wrapper {
  width: 72px;
  height: 72px;

  margin: 0 auto 24px;

  border-radius: 50%;

  background:
    rgba(34,197,94,0.1);

  color: #22c55e;

  display: flex;
  align-items: center;
  justify-content: center;
}

.success-icon {
  font-size: 2rem;
}

.success-state h2 {
  font-size: 1.5rem;
  margin-bottom: 12px;

  color:
    var(--text-primary, #1e293b);
}

.success-state p {
  line-height: 1.7;
  color:
    var(--text-secondary, #64748b);

  margin-bottom: 24px;
}

/* ========================================
   FOOTER
======================================== */
.login-footer {
  margin-top: 24px;
  text-align: center;
}

.back-link {
  color:
    var(--text-secondary, #64748b);

  text-decoration: none;
  font-weight: 600;
}

.back-link:hover {
  color: #6366f1;
}

.copyright {
  margin-top: 12px;
  font-size: 0.8rem;
  opacity: 0.7;
}

/* ========================================
   ANIMATION
======================================== */
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform:
      translateY(-50%)
      rotate(0deg);
  }

  to {
    transform:
      translateY(-50%)
      rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ========================================
   RESPONSIVE
======================================== */
@media (max-width: 992px) {

  .login-left {
    display: none;
  }

  .login-right {
    width: 100%;
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
    font-size: 1.5rem;
  }
}
</style>