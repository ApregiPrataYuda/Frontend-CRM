<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { authService } from '@/services/authServices'
import { useAuthStore } from '@/stores/authStore'

const { isDark, toggleTheme } = useTheme()
const authStore = useAuthStore()
const sessions = ref([])

// ===== ACTIVE TAB =====
const activeTab = ref('account')
const avatarPreview = ref(null)
const avatarFile = ref(null) 
const fileInput = ref(null)

const tabs = [
  { key: 'account', label: 'Account', icon: 'user' },
  { key: 'security', label: 'Security', icon: 'shield-halved' },
]

// ===== Photo Profile =====
const IMAGE_BASE_URL = import.meta.env.VITE_STORAGE_URL + '/users/'

const currentPhotoUrl = computed(() =>
  authStore.user?.image
    ? IMAGE_BASE_URL + authStore.user.image
    : null
)

const userInitials = computed(() => {
  const name = authStore.user?.fullname?.trim()
  if (!name) return 'AD'

  const words = name.split(/\s+/)

  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase()
  }
  return (words[0][0] + words[1][0]).toUpperCase()
})

const userRole = computed(() =>
  authStore.user?.role?.role
    ? authStore.user.role.role.charAt(0).toUpperCase() +
      authStore.user.role.role.slice(1)
    : 'User'
)

// ===== Auto Capitalize Nama =====
function capitalizeWords(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function handleNameInput(event) {
  account.value.name = capitalizeWords(event.target.value)
}

// ===== Photo Profile (Update) =====
function triggerFileInput() {
  fileInput.value.click()
}

function handleFileChange(event) {
  const file = event.target.files[0]
  if (!file) return

  const validTypes = ['image/jpeg', 'image/png', 'image/jpg']
  if (!validTypes.includes(file.type)) {
    alert('Format file harus JPG atau PNG')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    alert('Ukuran file maksimal 2MB')
    return
  }

  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

// ===== ACCOUNT =====
const account = ref({
  name: '',
  email: '',
  phone: '',
  department: '',
  bio: '',
})

onMounted(() => {
  if (authStore.user) {
    account.value.name  = capitalizeWords(authStore.user.fullname || '')
    account.value.email = authStore.user.email || ''
    account.value.phone = authStore.user.employee?.no_hp || ''
  }
})

// ===== SECURITY =====
const security = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const showPass = ref({
  current: false,
  new: false,
  confirm: false,
})

// ===== SAVE =====
const saving = ref(false)
const saved = ref(false)
const securityError = ref('')

async function handleSave() {
  if (activeTab.value === 'account') {
    await saveAccount()
  } else if (activeTab.value === 'security') {
    await saveSecurity()
  }
}

async function saveAccount() {
  saving.value = true

  try {
    const formData = new FormData()
    formData.append('fullname', account.value.name)
    formData.append('email', account.value.email)
    formData.append('phone', account.value.phone)
    if (avatarFile.value) {
      formData.append('image', avatarFile.value)
    }

    const response = await authService.updateProfile(formData)

    if (response.data?.user) {
      authStore.user = response.data.user
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }

    avatarFile.value = null
    avatarPreview.value = null

    saved.value = true
  } catch (err) {
    console.error('Gagal menyimpan profil:', err)
  } finally {
    saving.value = false
    setTimeout(() => {
      saved.value = false
    }, 2500)
  }
}

async function saveSecurity() {
  securityError.value = ''

  if (!security.value.newPassword || security.value.newPassword.length < 6) {
    securityError.value = 'Password baru minimal 6 karakter.'
    return
  }
  if (security.value.newPassword !== security.value.confirmPassword) {
    securityError.value = 'Konfirmasi password tidak cocok.'
    return
  }

  saving.value = true

  try {
    await authService.updatePassword({
      password: security.value.newPassword,
      password_confirmation: security.value.confirmPassword,
    })

    security.value.newPassword = ''
    security.value.confirmPassword = ''

    saved.value = true
  } catch (err) {
    if (err.response?.data?.errors) {
      const firstError = Object.values(err.response.data.errors)[0]
      securityError.value = Array.isArray(firstError) ? firstError[0] : firstError
    } else if (err.response?.data?.message) {
      securityError.value = err.response.data.message
    } else {
      securityError.value = 'Gagal mengubah password.'
    }
    console.error('Gagal mengubah password:', err)
  } finally {
    saving.value = false
    setTimeout(() => {
      saved.value = false
    }, 2500)
  }
}

async function fetchSessions() {
  try {
    const response = await authService.getSessions()
    sessions.value = response.data.sessions
  } catch (err) {
    console.error('Gagal mengambil daftar sesi:', err)
  }
}

function formatLastActive(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  if (authStore.user) {
    account.value.name  = capitalizeWords(authStore.user.fullname || '')
    account.value.email = authStore.user.email || ''
    account.value.phone = authStore.user.employee?.no_hp || ''
  }
  fetchSessions()
})
</script>

<template>
  <div class="settings-page">

    <!-- HEADER -->
    <div class="settings-heading">
      <div>
        <div class="settings-title">Account Settings</div>
        <div class="settings-sub">
          Manage account info and login security
        </div>
      </div>

      <button
        class="btn-save"
        :disabled="saving"
        @click="handleSave"
      >
        <font-awesome-icon
          :icon="saving ? 'spinner' : saved ? 'check' : 'floppy-disk'"
          :spin="saving"
        />

        {{
          saving
            ? 'Saving...'
            : saved
              ? 'Saved!'
              : 'Save Changes'
        }}
      </button>
    </div>

    <div class="settings-layout">

      <!-- SIDEBAR -->
      <div class="settings-nav">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="nav-tab"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <span class="nav-tab-icon">
            <font-awesome-icon :icon="tab.icon" />
          </span>

          {{ tab.label }}
        </button>
      </div>

      <!-- CONTENT -->
      <div class="settings-content">

        <!-- ACCOUNT -->
        <div
          v-if="activeTab === 'account'"
          class="settings-card"
        >
          <div class="card-section-title">
            <font-awesome-icon icon="user" />
            Account Information
          </div>

          <!-- AVATAR -->
          <div class="avatar-section">
            <div
              class="avatar-preview"
              :style="(avatarPreview || currentPhotoUrl) ? {
                backgroundImage: `url(${avatarPreview || currentPhotoUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              } : {}"
            >
              <span v-if="!avatarPreview && !currentPhotoUrl">{{ userInitials }}</span>
            </div>

            <div class="avatar-info">
              <div class="avatar-name">
                {{ account.name }}
              </div>

              <div class="avatar-role">
                {{ userRole }}
              </div>

              <button class="btn-avatar" type="button" @click="triggerFileInput">
                <font-awesome-icon icon="camera" />
                Change Photo
              </button>
              <input
                ref="fileInput"
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                style="display: none"
                @change="handleFileChange"
              />
            </div>
          </div>

          <!-- FORM -->
          <div class="form-grid">

            <div class="form-group">
              <label>Full Name</label>

              <input
                v-model="account.name"
                @input="handleNameInput"
                class="form-input"
                placeholder="Full Name"
              />
            </div>

            <div class="form-group">
              <label>Email</label>

              <input
                v-model="account.email"
                type="email"
                class="form-input"
                placeholder="email@example.com"
              />
            </div>

            <div class="form-group">
              <label>Phone Number</label>

              <input
                v-model="account.phone"
                class="form-input"
                placeholder="08xxxxxxxxxx"
              />
            </div>


          </div>
        </div>

        <!-- SECURITY -->
        <div
          v-if="activeTab === 'security'"
          class="settings-card"
        >
          <div class="card-section-title">
            <font-awesome-icon icon="shield-halved" />
            Keamanan Akun
          </div>

          <!-- CHANGE PASSWORD -->
          <div class="section-block">

            <div class="block-label">
              Ganti Password
            </div>

            <div class="form-grid">

              

              <div class="form-group">
                <label>Password Baru</label>

                <div class="input-eye">
                  <input
                    v-model="security.newPassword"
                    :type="showPass.new ? 'text' : 'password'"
                    class="form-input"
                    placeholder="••••••••"
                  />

                  <button
                    class="eye-btn"
                    @click="showPass.new = !showPass.new"
                  >
                    <font-awesome-icon
                      :icon="showPass.new ? 'eye-slash' : 'eye'"
                    />
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label>Konfirmasi Password</label>

                <div class="input-eye">
                  <input
                    v-model="security.confirmPassword"
                    :type="showPass.confirm ? 'text' : 'password'"
                    class="form-input"
                    placeholder="••••••••"
                  />

                  <button
                    class="eye-btn"
                    @click="showPass.confirm = !showPass.confirm"
                   >
                    <font-awesome-icon
                      :icon="showPass.confirm ? 'eye-slash' : 'eye'"
                    />
                  </button>
                </div>
              </div>

            </div>
          </div>

          <!-- SESSION -->
          <div class="section-block">

            <div class="block-label">
              Anda Aktif di Perangkat Ini Sekarang
            </div>

            <div class="session-list">
              <div
                v-for="session in sessions"
                :key="session.id"
                class="session-item"
                :class="{ 'active-session': session.is_current }"
              >

              <div class="session-icon">
                <font-awesome-icon icon="desktop" />
              </div>

              <div class="session-info">
                <div class="session-device">
                  {{ session.device }}
                </div>
                <div class="session-detail">
                  {{ session.location || 'Unknown' }} ·
                  {{ session.is_current ? 'Aktif sekarang' : formatLastActive(session.last_active) }}
                </div>
              </div>

              <span class="session-badge">
                Sesi Ini
              </span>

            </div>

              

            </div>
          </div>

          <!-- 2FA -->
          <div class="section-block">

           

            
          </div>

        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.settings-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text-primary);
}

.settings-sub {
  font-size: 0.83rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 20px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s;
}

.btn-save:hover:not(:disabled) {
  background: #4f46e5;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.settings-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 20px;
  align-items: start;
}

@media (max-width: 768px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }
}

.settings-nav {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 1px 3px var(--shadow-color);
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: sticky;
  top: 80px;
}

@media (max-width: 768px) {
  .settings-nav {
    flex-direction: row;
    position: static;
  }
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border-radius: 9px;
  border: none;
  background: none;
  color: var(--text-muted);
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  width: 100%;
}

.nav-tab:hover {
  background: var(--bg-nav-hover);
  color: var(--text-primary);
}

.nav-tab.active {
  background: rgba(99,102,241,0.1);
  color: #6366f1;
}

.nav-tab-icon {
  width: 18px;
  text-align: center;
}

.settings-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px var(--shadow-color);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-main);
}

.card-section-title svg {
  color: #6366f1;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-full {
  grid-column: span 2;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.form-input {
  padding: 10px 12px;
  border: 1px solid var(--border-main);
  border-radius: 8px;
  font-size: 0.875rem;
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
  width: 100%;
}

.form-input:focus {
  border-color: #6366f1;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-main);
  border-radius: 10px;
}

.avatar-preview {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: #fff;
  font-size: 1.2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.avatar-role {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.btn-avatar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 6px 14px;
  background: rgba(99,102,241,0.1);
  color: #6366f1;
  border: 1px solid rgba(99,102,241,0.2);
  border-radius: 7px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.section-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.block-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.input-eye {
  position: relative;
  display: flex;
}

.input-eye .form-input {
  padding-right: 40px;
}

.eye-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 9px;
  background: var(--bg-main);
  border: 1px solid var(--border-main);
}

.active-session {
  border-color: rgba(99,102,241,0.3);
  background: rgba(99,102,241,0.05);
}

.session-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: var(--bg-card);
  display: flex;
  align-items: center;
  justify-content: center;
}

.session-info {
  flex: 1;
}

.session-device {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-primary);
}

.session-detail {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.session-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 99px;
  background: rgba(99,102,241,0.1);
  color: #6366f1;
}

.btn-revoke {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 7px;
  border: 1px solid rgba(239,68,68,0.3);
  background: rgba(239,68,68,0.06);
  color: #ef4444;
  cursor: pointer;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-main);
}

.toggle-info {
  flex: 1;
}

.toggle-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.toggle-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-track {
  position: absolute;
  inset: 0;
  background: var(--border-main);
  border-radius: 99px;
  cursor: pointer;
}

.switch-track::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  top: 3px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.25s;
}

.switch input:checked + .switch-track {
  background: #6366f1;
}

.switch input:checked + .switch-track::before {
  transform: translateX(20px);
}
</style>