<script setup>
import { ref } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { isDark, toggleTheme } = useTheme()

// ===== ACTIVE TAB =====
const activeTab = ref('general')

const tabs = [
  { key: 'general',   label: 'General',      icon: 'gear' },
  { key: 'account',   label: 'Akun',         icon: 'user' },
  { key: 'security',  label: 'Keamanan',     icon: 'shield-halved' },
  { key: 'notif',     label: 'Notifikasi',   icon: 'bell' },
  { key: 'appearance',label: 'Tampilan',     icon: 'palette' },
  { key: 'danger',    label: 'Danger Zone',  icon: 'triangle-exclamation' },
]

// ===== GENERAL =====
const general = ref({
  appName:    'PT SATU DUA',
  appUrl:     'https://ptsatudua.com',
  timezone:   'Asia/Jakarta',
  language:   'id',
  dateFormat: 'DD/MM/YYYY',
})

// ===== ACCOUNT =====
const account = ref({
  name:       'Admin',
  email:      'admin@ptsatudua.com',
  phone:      '081234567890',
  department: 'Management',
  bio:        '',
})

// ===== SECURITY =====
const security = ref({
  currentPassword: '',
  newPassword:     '',
  confirmPassword: '',
})
const showPass = ref({ current: false, new: false, confirm: false })

// ===== NOTIFIKASI =====
const notif = ref({
  emailNewLead:     true,
  emailReport:      false,
  emailSystem:      true,
  pushNewLead:      true,
  pushReport:       true,
  pushSystem:       false,
  reminderFollowup: true,
  reminderMeeting:  false,
})

// ===== APPEARANCE =====
const appearance = ref({
  theme:       isDark.value ? 'dark' : 'light',
  sidebarColor:'default',
  fontSize:    'medium',
  compact:     false,
})

// ===== SAVE =====
const saving = ref(false)
const saved  = ref(false)

async function handleSave() {
  saving.value = true
  await new Promise(r => setTimeout(r, 800))
  saving.value = false
  saved.value  = true
  setTimeout(() => saved.value = false, 2500)
}

function applyTheme(val) {
  appearance.value.theme = val
  if ((val === 'dark') !== isDark.value) toggleTheme()
}
</script>

<template>
  <div class="settings-page">

    <!-- Page Title -->
    <div class="settings-heading">
      <div>
        <div class="settings-title">Settings</div>
        <div class="settings-sub">Kelola preferensi dan konfigurasi akun kamu</div>
      </div>
      <button class="btn-save" :disabled="saving" @click="handleSave">
        <font-awesome-icon :icon="saving ? 'spinner' : saved ? 'check' : 'floppy-disk'" :spin="saving" />
        {{ saving ? 'Menyimpan...' : saved ? 'Tersimpan!' : 'Simpan Perubahan' }}
      </button>
    </div>

    <div class="settings-layout">

      <!-- ===== SIDEBAR TAB ===== -->
      <div class="settings-nav">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="nav-tab"
          :class="{ active: activeTab === tab.key, danger: tab.key === 'danger' }"
          @click="activeTab = tab.key"
        >
          <span class="nav-tab-icon">
            <font-awesome-icon :icon="tab.icon" />
          </span>
          {{ tab.label }}
        </button>
      </div>

      <!-- ===== CONTENT ===== -->
      <div class="settings-content">

        <!-- GENERAL -->
        <div v-if="activeTab === 'general'" class="settings-card">
          <div class="card-section-title">
            <font-awesome-icon icon="gear" />
            Pengaturan Umum
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>Nama Aplikasi</label>
              <input v-model="general.appName" class="form-input" placeholder="Nama aplikasi" />
            </div>
            <div class="form-group">
              <label>URL Aplikasi</label>
              <input v-model="general.appUrl" class="form-input" placeholder="https://..." />
            </div>
            <div class="form-group">
              <label>Timezone</label>
              <select v-model="general.timezone" class="form-input">
                <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Bahasa</label>
              <select v-model="general.language" class="form-input">
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </select>
            </div>
            <div class="form-group">
              <label>Format Tanggal</label>
              <select v-model="general.dateFormat" class="form-input">
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        <!-- ACCOUNT -->
        <div v-if="activeTab === 'account'" class="settings-card">
          <div class="card-section-title">
            <font-awesome-icon icon="user" />
            Informasi Akun
          </div>

          <!-- Avatar -->
          <div class="avatar-section">
            <div class="avatar-preview">AD</div>
            <div class="avatar-info">
              <div class="avatar-name">Admin</div>
              <div class="avatar-role">Super Admin</div>
              <button class="btn-avatar">
                <font-awesome-icon icon="camera" />
                Ganti Foto
              </button>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Nama Lengkap</label>
              <input v-model="account.name" class="form-input" placeholder="Nama lengkap" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input v-model="account.email" type="email" class="form-input" placeholder="email@example.com" />
            </div>
            <div class="form-group">
              <label>No. Telepon</label>
              <input v-model="account.phone" class="form-input" placeholder="08xxxxxxxxxx" />
            </div>
            <div class="form-group">
              <label>Departemen</label>
              <select v-model="account.department" class="form-input">
                <option>Management</option>
                <option>Sales</option>
                <option>Marketing</option>
                <option>IT</option>
                <option>Finance</option>
              </select>
            </div>
            <div class="form-group form-full">
              <label>Bio</label>
              <textarea
                v-model="account.bio"
                class="form-input form-textarea"
                placeholder="Ceritakan sedikit tentang kamu..."
                rows="3"
              />
            </div>
          </div>
        </div>

        <!-- SECURITY -->
        <div v-if="activeTab === 'security'" class="settings-card">
          <div class="card-section-title">
            <font-awesome-icon icon="shield-halved" />
            Keamanan Akun
          </div>

          <!-- Password -->
          <div class="section-block">
            <div class="block-label">Ganti Password</div>
            <div class="form-grid">
              <div class="form-group form-full">
                <label>Password Saat Ini</label>
                <div class="input-eye">
                  <input
                    v-model="security.currentPassword"
                    :type="showPass.current ? 'text' : 'password'"
                    class="form-input"
                    placeholder="••••••••"
                  />
                  <button class="eye-btn" @click="showPass.current = !showPass.current">
                    <font-awesome-icon :icon="showPass.current ? 'eye-slash' : 'eye'" />
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label>Password Baru</label>
                <div class="input-eye">
                  <input
                    v-model="security.newPassword"
                    :type="showPass.new ? 'text' : 'password'"
                    class="form-input"
                    placeholder="••••••••"
                  />
                  <button class="eye-btn" @click="showPass.new = !showPass.new">
                    <font-awesome-icon :icon="showPass.new ? 'eye-slash' : 'eye'" />
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
                  <button class="eye-btn" @click="showPass.confirm = !showPass.confirm">
                    <font-awesome-icon :icon="showPass.confirm ? 'eye-slash' : 'eye'" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Session Info -->
          <div class="section-block">
            <div class="block-label">Sesi Aktif</div>
            <div class="session-list">
              <div class="session-item active-session">
                <div class="session-icon">
                  <font-awesome-icon icon="desktop" />
                </div>
                <div class="session-info">
                  <div class="session-device">Chrome — Windows 11</div>
                  <div class="session-detail">Jakarta, Indonesia · Aktif sekarang</div>
                </div>
                <span class="session-badge">Sesi Ini</span>
              </div>
              <div class="session-item">
                <div class="session-icon">
                  <font-awesome-icon icon="mobile-screen" />
                </div>
                <div class="session-info">
                  <div class="session-device">Safari — iPhone 14</div>
                  <div class="session-detail">Jakarta, Indonesia · 2 jam lalu</div>
                </div>
                <button class="btn-revoke">Cabut</button>
              </div>
            </div>
          </div>

          <!-- 2FA -->
          <div class="section-block">
            <div class="block-label">Two-Factor Authentication</div>
            <div class="toggle-row">
              <div class="toggle-info">
                <div class="toggle-title">Aktifkan 2FA</div>
                <div class="toggle-desc">Tambahkan lapisan keamanan ekstra pada akun kamu</div>
              </div>
              <label class="switch">
                <input type="checkbox" />
                <span class="switch-track" />
              </label>
            </div>
          </div>
        </div>

        <!-- NOTIFIKASI -->
        <div v-if="activeTab === 'notif'" class="settings-card">
          <div class="card-section-title">
            <font-awesome-icon icon="bell" />
            Preferensi Notifikasi
          </div>

          <!-- Email -->
          <div class="section-block">
            <div class="block-label">
              <font-awesome-icon icon="envelope" style="color:#6366f1" />
              Notifikasi Email
            </div>
            <div class="toggle-list">
              <div class="toggle-row">
                <div class="toggle-info">
                  <div class="toggle-title">Lead Baru</div>
                  <div class="toggle-desc">Email saat ada lead baru masuk</div>
                </div>
                <label class="switch">
                  <input type="checkbox" v-model="notif.emailNewLead" />
                  <span class="switch-track" />
                </label>
              </div>
              <div class="toggle-row">
                <div class="toggle-info">
                  <div class="toggle-title">Laporan Mingguan</div>
                  <div class="toggle-desc">Ringkasan performa setiap minggu</div>
                </div>
                <label class="switch">
                  <input type="checkbox" v-model="notif.emailReport" />
                  <span class="switch-track" />
                </label>
              </div>
              <div class="toggle-row">
                <div class="toggle-info">
                  <div class="toggle-title">Update Sistem</div>
                  <div class="toggle-desc">Informasi maintenance dan update</div>
                </div>
                <label class="switch">
                  <input type="checkbox" v-model="notif.emailSystem" />
                  <span class="switch-track" />
                </label>
              </div>
            </div>
          </div>

          <!-- Push -->
          <div class="section-block">
            <div class="block-label">
              <font-awesome-icon icon="bell" style="color:#f59e0b" />
              Notifikasi Push
            </div>
            <div class="toggle-list">
              <div class="toggle-row">
                <div class="toggle-info">
                  <div class="toggle-title">Lead Baru</div>
                  <div class="toggle-desc">Push notif saat ada lead baru</div>
                </div>
                <label class="switch">
                  <input type="checkbox" v-model="notif.pushNewLead" />
                  <span class="switch-track" />
                </label>
              </div>
              <div class="toggle-row">
                <div class="toggle-info">
                  <div class="toggle-title">Laporan Siap</div>
                  <div class="toggle-desc">Notif saat laporan selesai dibuat</div>
                </div>
                <label class="switch">
                  <input type="checkbox" v-model="notif.pushReport" />
                  <span class="switch-track" />
                </label>
              </div>
              <div class="toggle-row">
                <div class="toggle-info">
                  <div class="toggle-title">Alert Sistem</div>
                  <div class="toggle-desc">Push notif untuk status sistem</div>
                </div>
                <label class="switch">
                  <input type="checkbox" v-model="notif.pushSystem" />
                  <span class="switch-track" />
                </label>
              </div>
            </div>
          </div>

          <!-- Reminder -->
          <div class="section-block">
            <div class="block-label">
              <font-awesome-icon icon="clock" style="color:#22c55e" />
              Pengingat
            </div>
            <div class="toggle-list">
              <div class="toggle-row">
                <div class="toggle-info">
                  <div class="toggle-title">Follow-up Lead</div>
                  <div class="toggle-desc">Ingatkan follow-up lead yang belum dikontak</div>
                </div>
                <label class="switch">
                  <input type="checkbox" v-model="notif.reminderFollowup" />
                  <span class="switch-track" />
                </label>
              </div>
              <div class="toggle-row">
                <div class="toggle-info">
                  <div class="toggle-title">Pengingat Meeting</div>
                  <div class="toggle-desc">Notif 30 menit sebelum meeting</div>
                </div>
                <label class="switch">
                  <input type="checkbox" v-model="notif.reminderMeeting" />
                  <span class="switch-track" />
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- APPEARANCE -->
        <div v-if="activeTab === 'appearance'" class="settings-card">
          <div class="card-section-title">
            <font-awesome-icon icon="palette" />
            Tampilan & Tema
          </div>

          <!-- Theme -->
          <div class="section-block">
            <div class="block-label">Mode Tema</div>
            <div class="theme-grid">
              <button
                class="theme-opt"
                :class="{ active: appearance.theme === 'light' }"
                @click="applyTheme('light')"
              >
                <div class="theme-preview theme-light">
                  <div class="preview-sidebar" />
                  <div class="preview-content">
                    <div class="preview-bar" />
                    <div class="preview-bar short" />
                  </div>
                </div>
                <span class="theme-label">
                  <font-awesome-icon icon="sun" />
                  Light
                </span>
              </button>

              <button
                class="theme-opt"
                :class="{ active: appearance.theme === 'dark' }"
                @click="applyTheme('dark')"
              >
                <div class="theme-preview theme-dark">
                  <div class="preview-sidebar" />
                  <div class="preview-content">
                    <div class="preview-bar" />
                    <div class="preview-bar short" />
                  </div>
                </div>
                <span class="theme-label">
                  <font-awesome-icon icon="moon" />
                  Dark
                </span>
              </button>
            </div>
          </div>

          <!-- Font Size -->
          <div class="section-block">
            <div class="block-label">Ukuran Font</div>
            <div class="radio-group">
              <label v-for="opt in ['small','medium','large']" :key="opt" class="radio-opt">
                <input type="radio" v-model="appearance.fontSize" :value="opt" />
                <span class="radio-label">{{ opt.charAt(0).toUpperCase() + opt.slice(1) }}</span>
              </label>
            </div>
          </div>

          <!-- Compact Mode -->
          <div class="section-block">
            <div class="block-label">Layout</div>
            <div class="toggle-row">
              <div class="toggle-info">
                <div class="toggle-title">Compact Mode</div>
                <div class="toggle-desc">Kurangi padding dan spacing untuk tampilan lebih padat</div>
              </div>
              <label class="switch">
                <input type="checkbox" v-model="appearance.compact" />
                <span class="switch-track" />
              </label>
            </div>
          </div>
        </div>

        <!-- DANGER ZONE -->
        <div v-if="activeTab === 'danger'" class="settings-card danger-card">
          <div class="card-section-title danger-title">
            <font-awesome-icon icon="triangle-exclamation" />
            Danger Zone
          </div>
          <p class="danger-desc">
            Tindakan di bawah ini bersifat permanen dan tidak bisa dibatalkan. Harap berhati-hati.
          </p>

          <div class="danger-list">
            <div class="danger-item">
              <div class="danger-item-info">
                <div class="danger-item-title">Reset Data</div>
                <div class="danger-item-desc">Hapus semua data leads dan customers. Akun tetap aktif.</div>
              </div>
              <button class="btn-danger-outline">
                <font-awesome-icon icon="rotate-left" />
                Reset Data
              </button>
            </div>

            <div class="danger-item">
              <div class="danger-item-info">
                <div class="danger-item-title">Nonaktifkan Akun</div>
                <div class="danger-item-desc">Akun tidak bisa login sampai diaktifkan kembali oleh admin.</div>
              </div>
              <button class="btn-danger-outline">
                <font-awesome-icon icon="ban" />
                Nonaktifkan
              </button>
            </div>

            <div class="danger-item danger-item-red">
              <div class="danger-item-info">
                <div class="danger-item-title">Hapus Akun</div>
                <div class="danger-item-desc">Hapus permanen seluruh data akun. Tindakan ini tidak bisa dibatalkan.</div>
              </div>
              <button class="btn-danger-solid">
                <font-awesome-icon icon="trash-can" />
                Hapus Akun
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== PAGE ===== */
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
.btn-save:hover:not(:disabled) { background: #4f46e5; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

/* ===== LAYOUT ===== */
.settings-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 768px) { .settings-layout { grid-template-columns: 1fr; } }

/* ===== NAV ===== */
.settings-nav {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 1px 3px var(--shadow-color);
  display: flex;
  flex-direction: column;
  gap: 2px;
  position: sticky;
  top: 80px;
}
@media (max-width: 768px) {
  .settings-nav { flex-direction: row; flex-wrap: wrap; position: static; }
}
.nav-tab {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  border: none;
  background: none;
  color: var(--text-muted);
  font-size: 0.84rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  width: 100%;
}
.nav-tab:hover { background: var(--bg-nav-hover); color: var(--text-primary); }
.nav-tab.active {
  background: rgba(99,102,241,0.1);
  color: #6366f1;
  font-weight: 700;
}
.nav-tab.danger { color: #ef4444; }
.nav-tab.danger:hover { background: rgba(239,68,68,0.08); }
.nav-tab.danger.active { background: rgba(239,68,68,0.1); color: #ef4444; }
.nav-tab-icon {
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

/* ===== CARD ===== */
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
.card-section-title svg { color: #6366f1; }

/* ===== FORM ===== */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
.form-full { grid-column: span 2; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.form-input {
  padding: 9px 12px;
  border: 1px solid var(--border-main);
  border-radius: 8px;
  font-size: 0.875rem;
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
  transition: border 0.18s;
  width: 100%;
}
.form-input:focus { border-color: #6366f1; }
.form-textarea { resize: vertical; min-height: 80px; font-family: inherit; }

/* ===== SECTION BLOCK ===== */
.section-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.block-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* ===== AVATAR ===== */
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
  font-size: 1.3rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.avatar-name { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }
.avatar-role { font-size: 0.78rem; color: var(--text-muted); margin-top: 2px; }
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
  transition: all 0.15s;
}
.btn-avatar:hover { background: #6366f1; color: #fff; }

/* ===== PASSWORD INPUT ===== */
.input-eye {
  position: relative;
  display: flex;
}
.input-eye .form-input { padding-right: 40px; }
.eye-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
}

/* ===== SESSION ===== */
.session-list { display: flex; flex-direction: column; gap: 8px; }
.session-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 9px;
  background: var(--bg-main);
  border: 1px solid var(--border-main);
}
.active-session { border-color: rgba(99,102,241,0.3); background: rgba(99,102,241,0.05); }
.session-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: var(--bg-card);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  flex-shrink: 0;
}
.session-info { flex: 1; }
.session-device { font-size: 0.84rem; font-weight: 600; color: var(--text-primary); }
.session-detail { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
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
  transition: all 0.15s;
}
.btn-revoke:hover { background: #ef4444; color: #fff; }

/* ===== TOGGLE / SWITCH ===== */
.toggle-list { display: flex; flex-direction: column; gap: 0; }
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-main);
}
.toggle-row:last-child { border-bottom: none; }
.toggle-info { flex: 1; }
.toggle-title { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
.toggle-desc  { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }

.switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
.switch input { opacity: 0; width: 0; height: 0; }
.switch-track {
  position: absolute;
  inset: 0;
  background: var(--border-main);
  border-radius: 99px;
  cursor: pointer;
  transition: background 0.25s;
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
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.switch input:checked + .switch-track { background: #6366f1; }
.switch input:checked + .switch-track::before { transform: translateX(20px); }

/* ===== THEME PICKER ===== */
.theme-grid { display: flex; gap: 14px; flex-wrap: wrap; }
.theme-opt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 2px solid var(--border-main);
  border-radius: 12px;
  background: var(--bg-input);
  cursor: pointer;
  transition: all 0.18s;
}
.theme-opt:hover { border-color: #818cf8; }
.theme-opt.active {
  border-color: #6366f1;
  background: rgba(99,102,241,0.06);
}
.theme-preview {
  width: 120px;
  height: 72px;
  border-radius: 8px;
  display: flex;
  overflow: hidden;
}
.theme-light { background: #f1f5f9; }
.theme-dark  { background: #13151f; }
.preview-sidebar {
  width: 30px;
  height: 100%;
}
.theme-light .preview-sidebar { background: #fff; }
.theme-dark  .preview-sidebar { background: #0f1117; }
.preview-content {
  flex: 1;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.preview-bar {
  height: 8px;
  border-radius: 4px;
}
.preview-bar.short { width: 60%; }
.theme-light .preview-bar { background: #e2e8f0; }
.theme-dark  .preview-bar { background: #1e2130; }
.theme-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* ===== RADIO ===== */
.radio-group { display: flex; gap: 12px; flex-wrap: wrap; }
.radio-opt {
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
}
.radio-opt input { accent-color: #6366f1; width: 15px; height: 15px; }
.radio-label { font-size: 0.84rem; color: var(--text-primary); font-weight: 500; }

/* ===== DANGER ZONE ===== */
.danger-card { border: 1px solid rgba(239,68,68,0.2); }
.danger-title { color: #ef4444 !important; }
.danger-title svg { color: #ef4444 !important; }
.danger-desc {
  font-size: 0.83rem;
  color: var(--text-muted);
  margin: -16px 0 0;
}
.danger-list { display: flex; flex-direction: column; gap: 0; }
.danger-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-main);
  flex-wrap: wrap;
}
.danger-item:last-child { border-bottom: none; padding-bottom: 0; }
.danger-item-red .danger-item-title { color: #ef4444; }
.danger-item-info { flex: 1; }
.danger-item-title { font-size: 0.88rem; font-weight: 700; color: var(--text-primary); }
.danger-item-desc  { font-size: 0.78rem; color: var(--text-muted); margin-top: 3px; }
.btn-danger-outline {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  border: 1.5px solid rgba(239,68,68,0.4);
  border-radius: 8px;
  background: rgba(239,68,68,0.06);
  color: #ef4444;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.btn-danger-outline:hover { background: #ef4444; color: #fff; border-color: #ef4444; }
.btn-danger-solid {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}
.btn-danger-solid:hover { background: #dc2626; }
</style>