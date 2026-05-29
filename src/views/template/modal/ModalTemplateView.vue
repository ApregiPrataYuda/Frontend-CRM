<script setup>
import { ref } from 'vue'
import AppModal   from '@/components/AppModal.vue'
import AppConfirm from '@/components/AppConfirm.vue'

// ===== MODAL STATE =====
const modals = ref({
  basic:    false,
  form:     false,
  large:    false,
  image:    false,
  steps:    false,
})

// ===== FORM =====
const form = ref({ name: '', email: '', role: '', status: 'Active' })

// ===== STEPS MODAL =====
const currentStep = ref(1)
const totalSteps  = 3
const steps = [
  { label: 'Info Dasar',  icon: 'user' },
  { label: 'Detail',      icon: 'list' },
  { label: 'Konfirmasi',  icon: 'check' },
]
function nextStep() { if (currentStep.value < totalSteps) currentStep.value++ }
function prevStep() { if (currentStep.value > 1) currentStep.value-- }
function closeSteps() { modals.value.steps = false; currentStep.value = 1 }

// ===== CONFIRM STATE =====
const confirm = ref({
  show:        false,
  type:        'danger',
  title:       '',
  message:     '',
  detail:      '',
  confirmText: '',
  cancelText:  'Batal',
  loading:     false,
  resolve:     null,
})

function openConfirm(options) {
  return new Promise(resolve => {
    confirm.value = {
      show:        true,
      type:        options.type        ?? 'danger',
      title:       options.title       ?? 'Konfirmasi',
      message:     options.message     ?? 'Apakah kamu yakin?',
      detail:      options.detail      ?? '',
      confirmText: options.confirmText ?? 'Ya, Lanjutkan',
      cancelText:  options.cancelText  ?? 'Batal',
      loading:     false,
      resolve,
    }
  })
}
function onConfirm() {
  confirm.value.loading = true
  setTimeout(() => {
    confirm.value.show    = false
    confirm.value.loading = false
    confirm.value.resolve?.(true)
  }, 800)
}
function onCancel() {
  confirm.value.show = false
  confirm.value.resolve?.(false)
}

// ===== RESULT LOG =====
const logs = ref([])
function addLog(msg, type = 'success') {
  logs.value.unshift({ msg, type, time: new Date().toLocaleTimeString('id-ID') })
  if (logs.value.length > 6) logs.value.pop()
}

// ===== DEMO ACTIONS =====
async function demoDelete() {
  const ok = await openConfirm({
    type:        'danger',
    title:       'Hapus Data?',
    message:     'Data yang dihapus tidak bisa dikembalikan.',
    detail:      '"Budi Santoso"',
    confirmText: 'Ya, Hapus',
  })
  addLog(ok ? '🗑️ Data berhasil dihapus' : '↩️ Hapus dibatalkan', ok ? 'success' : 'cancel')
}

async function demoLogout() {
  const ok = await openConfirm({
    type:        'warning',
    title:       'Keluar dari Aplikasi?',
    message:     'Kamu harus login kembali untuk mengakses aplikasi.',
    confirmText: 'Ya, Keluar',
  })
  addLog(ok ? '🚪 User logout' : '↩️ Logout dibatalkan', ok ? 'success' : 'cancel')
}

async function demoInfo() {
  const ok = await openConfirm({
    type:        'info',
    title:       'Sinkronisasi Data?',
    message:     'Proses ini akan memperbarui semua data dari server.',
    confirmText: 'Mulai Sync',
  })
  addLog(ok ? '🔄 Sinkronisasi dimulai' : '↩️ Sync dibatalkan', ok ? 'success' : 'cancel')
}

async function demoSuccess() {
  const ok = await openConfirm({
    type:        'success',
    title:       'Publish Data?',
    message:     'Data akan dipublikasikan dan bisa dilihat semua user.',
    confirmText: 'Publish Sekarang',
  })
  addLog(ok ? '✅ Data dipublish' : '↩️ Publish dibatalkan', ok ? 'success' : 'cancel')
}

function demoSaveForm() {
  addLog(`💾 Form disimpan — ${form.value.name || 'tanpa nama'}`, 'success')
  modals.value.form = false
}
</script>

<template>
  <div class="demo-page">

    <!-- ===== HEADING ===== -->
    <div class="demo-heading">
      <div>
        <div class="demo-title">Modal & Confirm Dialog</div>
        <div class="demo-sub">Contoh penggunaan AppModal dan AppConfirm di seluruh halaman</div>
      </div>
    </div>

    <div class="demo-grid">

      <!-- ===== KIRI: DEMO CARDS ===== -->
      <div class="demo-left">

        <!-- MODAL SECTION -->
        <div class="section-card">
          <div class="section-head">
            <span class="section-icon" style="background:rgba(99,102,241,0.1);color:#6366f1">
              <font-awesome-icon icon="window-restore" />
            </span>
            <div>
              <div class="section-title">AppModal</div>
              <div class="section-desc">Modal generik dengan berbagai ukuran dan konten</div>
            </div>
          </div>

          <div class="btn-grid">

            <!-- Basic -->
            <div class="demo-item">
              <div class="demo-item-info">
                <div class="demo-item-title">Basic Modal</div>
                <div class="demo-item-desc">Modal sederhana dengan teks</div>
              </div>
              <button class="btn-demo btn-purple" @click="modals.basic = true">
                <font-awesome-icon icon="eye" /> Lihat
              </button>
            </div>

            <!-- Form -->
            <div class="demo-item">
              <div class="demo-item-info">
                <div class="demo-item-title">Modal Form</div>
                <div class="demo-item-desc">Modal dengan input form dan footer</div>
              </div>
              <button class="btn-demo btn-purple" @click="modals.form = true">
                <font-awesome-icon icon="eye" /> Lihat
              </button>
            </div>

            <!-- Large -->
            <div class="demo-item">
              <div class="demo-item-info">
                <div class="demo-item-title">Modal Large</div>
                <div class="demo-item-desc">Modal ukuran besar untuk konten panjang</div>
              </div>
              <button class="btn-demo btn-purple" @click="modals.large = true">
                <font-awesome-icon icon="eye" /> Lihat
              </button>
            </div>

            <!-- Steps -->
            <div class="demo-item">
              <div class="demo-item-info">
                <div class="demo-item-title">Modal Steps / Wizard</div>
                <div class="demo-item-desc">Modal multi-step dengan progress</div>
              </div>
              <button class="btn-demo btn-purple" @click="modals.steps = true">
                <font-awesome-icon icon="eye" /> Lihat
              </button>
            </div>

          </div>
        </div>

        <!-- CONFIRM SECTION -->
        <div class="section-card">
          <div class="section-head">
            <span class="section-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b">
              <font-awesome-icon icon="circle-question" />
            </span>
            <div>
              <div class="section-title">AppConfirm</div>
              <div class="section-desc">Konfirmasi aksi dengan 4 tipe berbeda</div>
            </div>
          </div>

          <div class="btn-grid">

            <div class="demo-item">
              <div class="demo-item-info">
                <div class="demo-item-title">
                  <span class="type-badge badge-danger">danger</span>
                  Konfirmasi Hapus
                </div>
                <div class="demo-item-desc">Dipakai sebelum menghapus data</div>
              </div>
              <button class="btn-demo btn-red" @click="demoDelete">
                <font-awesome-icon icon="trash-can" /> Coba
              </button>
            </div>

            <div class="demo-item">
              <div class="demo-item-info">
                <div class="demo-item-title">
                  <span class="type-badge badge-warning">warning</span>
                  Konfirmasi Logout
                </div>
                <div class="demo-item-desc">Dipakai untuk aksi berisiko</div>
              </div>
              <button class="btn-demo btn-orange" @click="demoLogout">
                <font-awesome-icon icon="right-from-bracket" /> Coba
              </button>
            </div>

            <div class="demo-item">
              <div class="demo-item-info">
                <div class="demo-item-title">
                  <span class="type-badge badge-info">info</span>
                  Konfirmasi Sync
                </div>
                <div class="demo-item-desc">Dipakai untuk aksi yang perlu konfirmasi</div>
              </div>
              <button class="btn-demo btn-blue" @click="demoInfo">
                <font-awesome-icon icon="rotate" /> Coba
              </button>
            </div>

            <div class="demo-item">
              <div class="demo-item-info">
                <div class="demo-item-title">
                  <span class="type-badge badge-success">success</span>
                  Konfirmasi Publish
                </div>
                <div class="demo-item-desc">Dipakai untuk konfirmasi aksi positif</div>
              </div>
              <button class="btn-demo btn-green" @click="demoSuccess">
                <font-awesome-icon icon="circle-check" /> Coba
              </button>
            </div>

          </div>
        </div>

      </div>

      <!-- ===== KANAN: CODE + LOG ===== -->
      <div class="demo-right">

        <!-- Activity Log -->
        <div class="section-card">
          <div class="section-head">
            <span class="section-icon" style="background:rgba(34,197,94,0.1);color:#22c55e">
              <font-awesome-icon icon="terminal" />
            </span>
            <div>
              <div class="section-title">Activity Log</div>
              <div class="section-desc">Hasil aksi yang kamu lakukan</div>
            </div>
          </div>

          <div class="log-wrap">
            <div v-if="logs.length === 0" class="log-empty">
              <font-awesome-icon icon="clock-rotate-left" />
              <span>Belum ada aksi. Coba klik tombol di sebelah kiri.</span>
            </div>
            <div
              v-for="(log, i) in logs"
              :key="i"
              class="log-item"
              :class="`log-${log.type}`"
            >
              <span class="log-msg">{{ log.msg }}</span>
              <span class="log-time">{{ log.time }}</span>
            </div>
          </div>
        </div>

        <!-- Contoh Code -->
        <div class="section-card">
          <div class="section-head">
            <span class="section-icon" style="background:rgba(56,189,248,0.1);color:#38bdf8">
              <font-awesome-icon icon="code" />
            </span>
            <div>
              <div class="section-title">Cara Pakai</div>
              <div class="section-desc">Copy-paste ke view kamu</div>
            </div>
          </div>

          <div class="code-tabs">
            <div class="code-label">AppModal</div>
            <pre class="code-block"><code>{{ modalCode }}</code></pre>

            <div class="code-label" style="margin-top:16px">AppConfirm (programatik)</div>
            <pre class="code-block"><code>{{ confirmCode }}</code></pre>
          </div>
        </div>

      </div>
    </div>

    <!-- ==========================================
         MODAL INSTANCES
    =========================================== -->

    <!-- 1. Basic Modal -->
    <AppModal
      :show="modals.basic"
      title="Basic Modal"
      icon="circle-info"
      size="sm"
      @close="modals.basic = false"
    >
      <div class="basic-content">
        <p>Ini adalah contoh modal paling sederhana. Hanya berisi teks biasa tanpa form atau action khusus.</p>
        <p>Modal ini bisa ditutup dengan klik di luar, klik tombol ✕, atau tekan <kbd>ESC</kbd>.</p>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="modals.basic = false">Tutup</button>
      </template>
    </AppModal>

    <!-- 2. Form Modal -->
    <AppModal
      :show="modals.form"
      title="Tambah User Baru"
      icon="user-plus"
      size="md"
      @close="modals.form = false"
    >
      <div class="form-grid-2">
        <div class="form-group">
          <label>Nama Lengkap</label>
          <input v-model="form.name" class="form-input" placeholder="Nama lengkap" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="form.email" type="email" class="form-input" placeholder="email@example.com" />
        </div>
        <div class="form-group">
          <label>Role</label>
          <select v-model="form.role" class="form-input">
            <option value="">-- Pilih Role --</option>
            <option>Admin</option>
            <option>Sales</option>
            <option>Manager</option>
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select v-model="form.status" class="form-input">
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="modals.form = false">Batal</button>
        <button class="btn-save" @click="demoSaveForm">
          <font-awesome-icon icon="check" /> Simpan
        </button>
      </template>
    </AppModal>

    <!-- 3. Large Modal -->
    <AppModal
      :show="modals.large"
      title="Detail Laporan Bulanan"
      icon="file-lines"
      size="lg"
      @close="modals.large = false"
    >
      <div class="large-content">
        <div class="info-row-lg" v-for="row in largeRows" :key="row.label">
          <span class="info-label-lg">{{ row.label }}</span>
          <span class="info-value-lg">{{ row.value }}</span>
        </div>
        <div class="summary-box">
          <div class="summary-title">Ringkasan</div>
          <p>Performa bulan ini menunjukkan peningkatan signifikan dibanding bulan lalu. Total leads bertambah 23% dengan conversion rate yang stabil di angka 68%. Revenue mencapai target dengan realisasi 112% dari projection awal.</p>
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="modals.large = false">Tutup</button>
        <button class="btn-save">
          <font-awesome-icon icon="download" /> Export PDF
        </button>
      </template>
    </AppModal>

    <!-- 4. Steps Modal -->
    <AppModal
      :show="modals.steps"
      title="Setup Akun Baru"
      icon="wand-magic-sparkles"
      size="md"
      :persistent="true"
      @close="closeSteps"
    >
      <!-- Progress Steps -->
      <div class="steps-progress">
        <div
          v-for="(step, i) in steps"
          :key="i"
          class="step-item"
          :class="{
            'step-done':   i + 1 < currentStep,
            'step-active': i + 1 === currentStep,
          }"
        >
          <div class="step-circle">
            <font-awesome-icon v-if="i + 1 < currentStep" icon="check" />
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span class="step-label">{{ step.label }}</span>
          <div v-if="i < steps.length - 1" class="step-line" />
        </div>
      </div>

      <!-- Step Content -->
      <div class="step-content">
        <div v-if="currentStep === 1">
          <div class="form-group">
            <label>Nama Lengkap</label>
            <input class="form-input" placeholder="Masukkan nama lengkap" />
          </div>
          <div class="form-group" style="margin-top:12px">
            <label>Email</label>
            <input class="form-input" type="email" placeholder="email@example.com" />
          </div>
        </div>
        <div v-if="currentStep === 2">
          <div class="form-group">
            <label>Departemen</label>
            <select class="form-input">
              <option>Management</option>
              <option>Sales</option>
              <option>IT</option>
            </select>
          </div>
          <div class="form-group" style="margin-top:12px">
            <label>Role</label>
            <select class="form-input">
              <option>Admin</option>
              <option>User</option>
            </select>
          </div>
        </div>
        <div v-if="currentStep === 3">
          <div class="confirm-summary">
            <font-awesome-icon icon="circle-check" class="summary-icon" />
            <div class="summary-text">Semua data sudah lengkap!</div>
            <div class="summary-sub">Klik Selesai untuk menyimpan akun baru.</div>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeSteps">Batal</button>
        <div style="display:flex;gap:8px">
          <button v-if="currentStep > 1" class="btn-prev" @click="prevStep">
            <font-awesome-icon icon="arrow-left" /> Kembali
          </button>
          <button v-if="currentStep < totalSteps" class="btn-save" @click="nextStep">
            Lanjut <font-awesome-icon icon="arrow-right" />
          </button>
          <button v-if="currentStep === totalSteps" class="btn-save" @click="() => { addLog('✅ Akun baru berhasil dibuat', 'success'); closeSteps() }">
            <font-awesome-icon icon="check" /> Selesai
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ===== GLOBAL CONFIRM ===== -->
    <AppConfirm
      :show="confirm.show"
      :type="confirm.type"
      :title="confirm.title"
      :message="confirm.message"
      :detail="confirm.detail"
      :confirm-text="confirm.confirmText"
      :cancel-text="confirm.cancelText"
      :loading="confirm.loading"
      @confirm="onConfirm"
      @cancel="onCancel"
    />

  </div>
</template>

<script>
// Data untuk large modal
export default {
  data() {
    return {
      largeRows: [
        { label: 'Periode',         value: 'April 2026' },
        { label: 'Total Leads',     value: '128 leads' },
        { label: 'Converted',       value: '87 leads (68%)' },
        { label: 'Revenue',         value: 'Rp 48.000.000' },
        { label: 'Target',          value: 'Rp 42.800.000' },
        { label: 'Realisasi',       value: '112%' },
        { label: 'Top Sales',       value: 'Budi Santoso' },
        { label: 'Status Laporan',  value: 'Final' },
      ],
      modalCode: `<AppModal
  :show="showModal"
  title="Judul Modal"
  icon="plus"
  size="md"
  @close="showModal = false"
>
  <!-- Konten -->
  <p>Isi modal di sini</p>

  <template #footer>
    <button @click="showModal = false">Batal</button>
    <button @click="handleSave">Simpan</button>
  </template>
</AppModal>`,
      confirmCode: `const ok = await openConfirm({
  type:        'danger',
  title:       'Hapus Data?',
  message:     'Data tidak bisa dikembalikan.',
  detail:      '"Nama Item"',
  confirmText: 'Ya, Hapus',
})

if (ok) {
  // lanjut proses hapus
}`,
    }
  }
}
</script>

<style scoped>
.demo-page { display: flex; flex-direction: column; gap: 20px; }

.demo-heading { margin-bottom: 4px; }
.demo-title { font-size: 1.3rem; font-weight: 800; color: var(--text-primary); }
.demo-sub   { font-size: 0.83rem; color: var(--text-muted); margin-top: 2px; }

/* Grid */
.demo-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 900px) { .demo-grid { grid-template-columns: 1fr; } }
.demo-left, .demo-right { display: flex; flex-direction: column; gap: 20px; }

/* Section Card */
.section-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px var(--shadow-color);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.section-head { display: flex; align-items: center; gap: 12px; }
.section-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  flex-shrink: 0;
}
.section-title { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); }
.section-desc  { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }

/* Demo Items */
.btn-grid { display: flex; flex-direction: column; gap: 2px; }
.demo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 10px;
  border-radius: 9px;
  gap: 12px;
  transition: background 0.15s;
}
.demo-item:hover { background: var(--bg-nav-hover); }
.demo-item-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-primary);
}
.demo-item-desc { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }

/* Type Badges */
.type-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 99px;
}
.badge-danger  { background: rgba(239,68,68,0.1);  color: #ef4444; }
.badge-warning { background: rgba(245,158,11,0.1); color: #d97706; }
.badge-info    { background: rgba(56,189,248,0.1); color: #0284c7; }
.badge-success { background: rgba(34,197,94,0.1);  color: #16a34a; }

/* Demo Buttons */
.btn-demo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}
.btn-demo:hover { filter: brightness(1.1); }
.btn-purple { background: #6366f1; color: #fff; }
.btn-red    { background: #ef4444; color: #fff; }
.btn-orange { background: #f59e0b; color: #fff; }
.btn-blue   { background: #38bdf8; color: #fff; }
.btn-green  { background: #22c55e; color: #fff; }

/* Log */
.log-wrap { display: flex; flex-direction: column; gap: 6px; min-height: 120px; }
.log-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 120px;
  color: var(--text-muted);
  font-size: 0.82rem;
}
.log-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 0.82rem;
  gap: 12px;
}
.log-success { background: rgba(34,197,94,0.08);  border-left: 3px solid #22c55e; }
.log-cancel  { background: rgba(156,163,175,0.08); border-left: 3px solid #9ca3af; }
.log-msg     { font-weight: 500; color: var(--text-primary); }
.log-time    { font-size: 0.72rem; color: var(--text-muted); white-space: nowrap; }

/* Code Block */
.code-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 6px;
}
.code-block {
  background: var(--bg-main);
  border: 1px solid var(--border-main);
  border-radius: 8px;
  padding: 14px 16px;
  font-size: 0.75rem;
  color: #818cf8;
  overflow-x: auto;
  white-space: pre;
  font-family: 'Courier New', monospace;
  line-height: 1.7;
}
.code-block code { color: inherit; }

/* Form */
.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 480px) { .form-grid-2 { grid-template-columns: 1fr; } }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label {
  font-size: 0.72rem;
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
}
.form-input:focus { border-color: #6366f1; }

/* Basic content */
.basic-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 0.875rem;
  color: var(--text-muted);
  line-height: 1.7;
}
kbd {
  padding: 2px 6px;
  background: var(--bg-input);
  border: 1px solid var(--border-main);
  border-radius: 5px;
  font-size: 0.78rem;
  color: var(--text-primary);
  font-family: monospace;
}

/* Large modal */
.large-content { display: flex; flex-direction: column; gap: 0; }
.info-row-lg {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-main);
  gap: 12px;
}
.info-row-lg:last-of-type { border-bottom: none; }
.info-label-lg { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }
.info-value-lg { font-size: 0.84rem; font-weight: 600; color: var(--text-primary); }
.summary-box {
  margin-top: 16px;
  padding: 14px;
  background: var(--bg-main);
  border-radius: 9px;
  border: 1px solid var(--border-main);
}
.summary-title { font-size: 0.8rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; }
.summary-box p { font-size: 0.82rem; color: var(--text-muted); line-height: 1.7; margin: 0; }

/* Steps */
.steps-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 24px;
  position: relative;
}
.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
  flex: 1;
}
.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--border-main);
  background: var(--bg-input);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  transition: all 0.25s;
  z-index: 1;
}
.step-active .step-circle { border-color: #6366f1; background: #6366f1; color: #fff; }
.step-done   .step-circle { border-color: #22c55e; background: #22c55e; color: #fff; }
.step-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  white-space: nowrap;
}
.step-active .step-label { color: #6366f1; }
.step-done   .step-label { color: #22c55e; }
.step-line {
  position: absolute;
  top: 16px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: var(--border-main);
  z-index: 0;
}
.step-done .step-line { background: #22c55e; }
.step-content { min-height: 100px; }
.confirm-summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  text-align: center;
}
.summary-icon { font-size: 2.5rem; color: #22c55e; }
.summary-text { font-size: 1rem; font-weight: 700; color: var(--text-primary); }
.summary-sub  { font-size: 0.82rem; color: var(--text-muted); }

/* Buttons */
.btn-cancel {
  padding: 8px 18px;
  background: var(--bg-main);
  color: var(--text-muted);
  border: 1px solid var(--border-main);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 18px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-save:hover { background: #4f46e5; }
.btn-prev {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  background: var(--bg-input);
  color: var(--text-primary);
  border: 1px solid var(--border-main);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

/* ===== MOBILE RESPONSIVE ===== */
@media (max-width: 640px) {

  /* Demo item jadi vertikal */
  .demo-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .btn-demo {
    width: 100%;
    justify-content: center;
  }

  /* Section card padding lebih kecil */
  .section-card {
    padding: 14px;
  }

  /* Type badge pindah ke baris baru */
  .demo-item-title {
    flex-wrap: wrap;
  }

  /* Code block font lebih kecil */
  .code-block {
    font-size: 0.68rem;
    padding: 10px 12px;
  }

  /* Log item */
  .log-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  .log-time {
    align-self: flex-end;
  }

  /* Form grid 1 kolom */
  .form-grid-2 {
    grid-template-columns: 1fr;
  }

  /* Steps label sembunyi di mobile kecil */
  .step-label {
    display: none;
  }

  /* Large modal info row */
  .info-row-lg {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  .info-value-lg {
    text-align: left;
  }

  /* Heading */
  .demo-title { font-size: 1.1rem; }
  .demo-sub   { font-size: 0.78rem; }

  /* Section head */
  .section-head { gap: 8px; }
  .section-icon { width: 32px; height: 32px; font-size: 0.78rem; }
  .section-title { font-size: 0.84rem; }

  /* Modal footer buttons */
  .btn-cancel,
  .btn-save,
  .btn-prev {
    padding: 8px 12px;
    font-size: 0.8rem;
  }
}

@media (max-width: 380px) {
  .section-card { padding: 12px; }
  .code-block   { font-size: 0.62rem; }
  .step-circle  { width: 26px; height: 26px; font-size: 0.72rem; }
}
</style>