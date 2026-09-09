<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/authStore'
import { useOdooSettingsStore } from '@/stores/odooSettingsStore'

const toast     = useToast()
const authStore = useAuthStore()
const odooStore = useOdooSettingsStore()

// ── AKSES ──────────────────────────────────
// Halaman ini cuma untuk role_id = 1 (Administrator/IT), konsisten
// dengan aturan company-scope di seluruh sistem: role_id = 1 selalu
// dikecualikan dari filter company karena dia yang justru ngatur
// pengaturan lintas company di sini. Backend (OdooSettingsController)
// juga cek ulang role ini sendiri -- guard di sini cuma buat UX.
const isAdmin = computed(() => authStore.user?.role_id === 1)

onMounted(() => {
  if (isAdmin.value) {
    odooStore.fetchSettings()
  }
})

// ── API KEY SHOW/HIDE ──────────────────────
const showApiKey = ref(false)
function toggleApiKeyVisibility() {
  showApiKey.value = !showApiKey.value
}

// ── GLOBAL CONNECTION ──────────────────────
function errorText(err, fallback) {
  if (!err) return fallback
  if (typeof err === 'string') return err
  // errors dari Laravel FormRequest -- ambil pesan pertama yang ada
  const firstField = Object.values(err)[0]
  return Array.isArray(firstField) ? firstField[0] : fallback
}

async function handleTestConnection() {
  const ok = await odooStore.testConnection()
  if (ok) {
    toast.success('Koneksi ke Odoo berhasil')
  } else {
    toast.error(errorText(odooStore.errorConnection, 'Koneksi ke Odoo gagal'))
  }
}

async function handleSaveConnection() {
  const ok = await odooStore.saveConnection()
  if (ok) {
    toast.success('Pengaturan koneksi Odoo berhasil disimpan')
  } else {
    toast.error(errorText(odooStore.errorConnection, 'Gagal menyimpan pengaturan koneksi'))
  }
}

// ── COMPANY MAPPING ──────────────────────
function isMapped(row) {
  return row.odoo_company_id !== null && row.odoo_company_id !== undefined
}

function startEdit(row) {
  odooStore.startEditCompany(row)
}

function cancelEdit(row) {
  odooStore.cancelEditCompany(row)
}

async function saveEdit(row) {
  const ok = await odooStore.saveCompanyMapping(row)

  if (ok) {
    toast.success(`Company ID Odoo untuk "${row.name_group}" berhasil disimpan`)
  } else if (!row.error) {
    // row.error true = gagal validasi lokal (sudah ada pesan inline),
    // selain itu berarti gagal di sisi API -- baru munculkan toast.
    toast.error(`Gagal menyimpan mapping "${row.name_group}"`)
  }
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <!-- ── AKSES DITOLAK ── -->
    <div v-if="!isAdmin" class="panel-card access-denied">
      <font-awesome-icon icon="triangle-exclamation" class="access-denied-icon" />
      <p class="access-denied-text">Halaman ini hanya bisa diakses oleh Administrator/IT.</p>
    </div>

    <template v-else>
      <!-- ── BREADCRUMB ── -->
      <div class="breadcrumb-card mb-2">
        <div class="breadcrumb-left">
          <h4 class="breadcrumb-title">
            <font-awesome-icon icon="plug" /> Odoo Integration Settings
          </h4>
          <div class="breadcrumb-path">
            <span class="breadcrumb-item">
              <font-awesome-icon icon="house" /> Dashboard
            </span>
            <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
            <span class="breadcrumb-item active">Odoo Settings</span>
          </div>
        </div>
      </div>

      <!-- ── LOADING AWAL ── -->
      <div v-if="odooStore.loading" class="panel-card td-center">
        <div class="spinner-custom" style="margin: 20px auto;"></div>
      </div>

      <template v-else>
        <!-- ── GLOBAL CONNECTION PANEL ── -->
        <div class="panel-card mb-2">
          <div class="panel-head">
            <div class="panel-heading">
              <div class="panel-icon">
                <font-awesome-icon icon="plug" />
              </div>
              <div>
                <p class="panel-title">Global Connection</p>
                <p class="panel-subtitle">
                  Satu koneksi Odoo dipakai bersama oleh semua company. Kredensial di
                  bawah ini sama untuk seluruh CRM.
                </p>
              </div>
            </div>

            <span v-if="odooStore.testStatus === 'idle'" class="status-pill status-idle">
              Belum Ditest
            </span>
            <span v-else-if="odooStore.testStatus === 'testing'" class="status-pill status-testing">
              <font-awesome-icon icon="spinner" spin /> Menguji Koneksi...
            </span>
            <span v-else-if="odooStore.testStatus === 'success'" class="status-pill status-success">
              <font-awesome-icon icon="circle-check" /> Terhubung &middot; {{ odooStore.lastTestedLabel }}
            </span>
            <span v-else-if="odooStore.testStatus === 'error'" class="status-pill status-error">
              <font-awesome-icon icon="circle-exclamation" /> Gagal Terhubung
            </span>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Base URL</label>
              <input
                v-model="odooStore.connection.url"
                class="form-input"
                type="text"
                placeholder="https://your-instance.odoo.com"
                @input="odooStore.markConnectionDirty"
              />
            </div>

            <div class="form-group">
              <label>Database</label>
              <input
                v-model="odooStore.connection.db"
                class="form-input"
                type="text"
                placeholder="database-name"
                @input="odooStore.markConnectionDirty"
              />
            </div>

            <div class="form-group">
              <label>Username</label>
              <input
                v-model="odooStore.connection.username"
                class="form-input"
                type="text"
                placeholder="user@company.com"
                @input="odooStore.markConnectionDirty"
              />
            </div>

            <div class="form-group">
              <label>API Key</label>
              <div class="input-with-icon">
                <input
                  v-model="odooStore.connection.api_key"
                  class="form-input"
                  :type="showApiKey ? 'text' : 'password'"
                  placeholder="Odoo API key"
                  @input="odooStore.markConnectionDirty"
                />
                <button type="button" class="icon-btn-inline" @click="toggleApiKeyVisibility">
                  <font-awesome-icon :icon="showApiKey ? 'eye-slash' : 'eye'" />
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>Default Company ID</label>
              <input
                v-model="odooStore.connection.default_company_id"
                class="form-input"
                type="text"
                inputmode="numeric"
                placeholder="e.g. 2"
                @input="odooStore.markConnectionDirty"
              />
            </div>
          </div>

          <div class="panel-footer">
            <span class="helper-text">Perubahan di sini berlaku untuk semua company sekaligus.</span>
            <div class="btn-row">
              <button
                class="btn-outline-purple"
                :disabled="odooStore.testingConnection"
                @click="handleTestConnection"
              >
                <font-awesome-icon icon="plug" /> Test Connection
              </button>
              <button
                class="btn-save"
                :disabled="!odooStore.connectionDirty || odooStore.savingConnection"
                @click="handleSaveConnection"
              >
                <font-awesome-icon v-if="odooStore.savingConnection" icon="spinner" spin />
                <font-awesome-icon v-else icon="check" />
                {{ odooStore.savingConnection ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </div>

        <!-- ── COMPANY MAPPING PANEL ── -->
        <div class="table-card flex-grow-1 overflow-auto mb-3">
          <div class="panel-head table-panel-head">
            <div class="panel-heading">
              <div class="panel-icon">
                <font-awesome-icon icon="building" />
              </div>
              <div>
                <p class="panel-title">Company &rarr; Odoo Company ID Mapping</p>
                <p class="panel-subtitle">
                  Odoo mendukung multi-company dalam satu instance. Tentukan Company ID
                  Odoo untuk tiap company CRM di bawah.
                </p>
              </div>
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th style="width:70px">NO.</th>
                <th>COMPANY (CRM)</th>
                <th style="width:220px">ODOO COMPANY ID</th>
                <th style="width:150px">STATUS</th>
                <th style="width:110px; text-align:center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <!-- Empty -->
              <tr v-if="!odooStore.companies.length">
                <td colspan="5" class="td-center">Belum ada data company</td>
              </tr>

              <tr
                v-else
                v-for="(item, index) in odooStore.companies"
                :key="item.id_group"
                class="data-row"
              >
                <td class="td-no">{{ index + 1 }}.</td>
                <td class="td-name">
                  <span class="menu-badge">{{ item.name_group }}</span>
                </td>
                <td>
                  <div v-if="item.editing" class="row-edit-wrap">
                    <div>
                      <input
                        v-model="item.draft"
                        class="row-input"
                        :class="{ 'input-error': item.error }"
                        type="text"
                        inputmode="numeric"
                        placeholder="e.g. 2"
                        @input="item.error = false"
                      />
                      <div v-if="item.error" class="row-error-msg">Harus angka &ge; 1</div>
                    </div>
                    <button
                      class="act-btn act-save"
                      title="Simpan"
                      :disabled="odooStore.savingMappingId === item.id_group"
                      @click="saveEdit(item)"
                    >
                      <font-awesome-icon
                        :icon="odooStore.savingMappingId === item.id_group ? 'spinner' : 'check'"
                        :spin="odooStore.savingMappingId === item.id_group"
                      />
                    </button>
                    <button class="act-btn act-cancel" title="Batal" @click="cancelEdit(item)">
                      <font-awesome-icon icon="xmark" />
                    </button>
                  </div>
                  <span v-else class="id-value" :class="{ 'id-empty': !isMapped(item) }">
                    {{ isMapped(item) ? '#' + item.odoo_company_id : '—' }}
                  </span>
                </td>
                <td>
                  <span class="badge-active" v-if="isMapped(item)">Mapped</span>
                  <span class="badge-inactive" v-else>Not Mapped</span>
                </td>
                <td class="td-actions">
                  <button
                    v-if="!item.editing"
                    class="act-btn act-edit"
                    title="Edit"
                    @click="startEdit(item)"
                  >
                    <font-awesome-icon icon="pen-to-square" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="table-foot-note">
            Company tanpa mapping akan memakai Default Company ID di atas saat push ke Odoo.
          </div>
        </div>
      </template>
    </template>

  </div>
</template>

<style scoped>
/* ── CSS VARIABLES LOKAL ── */
.h-100 {
  --text-muted:    #64748b;
  --primary-color: #6366f1;
}

/* ── AKSES DITOLAK ── */
.access-denied { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 60px 24px; }
.access-denied-icon { font-size: 2rem; color: #f59e0b; }
.access-denied-text { color: var(--text-muted); font-size: 0.9rem; font-weight: 600; }

.td-center { text-align: center; padding: 40px; color: var(--text-muted); }
.spinner-custom { width: 32px; height: 32px; border: 3px solid var(--border-main); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── BREADCRUMB (sama seperti halaman lain) ── */
.breadcrumb-card { background: var(--bg-card); border-radius: 10px; padding: 16px 18px; box-shadow: 0 1px 3px var(--shadow-color); }
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

/* ── PANEL (koneksi global) ── */
.panel-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); padding: 20px 22px; }
.panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; flex-wrap: wrap; }
.table-panel-head { padding: 18px 20px 6px; margin-bottom: 0; }
.panel-heading { display: flex; align-items: center; gap: 10px; }
.panel-icon { width: 34px; height: 34px; border-radius: 8px; background: rgba(99,102,241,0.1); color: #6366f1; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.95rem; }
.panel-title { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.panel-subtitle { font-size: 0.8rem; color: var(--text-muted); margin: 2px 0 0; }

/* ── STATUS PILL (test connection) ── */
.status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; white-space: nowrap; }
.status-idle    { background: var(--bg-input); color: var(--text-muted); border: 1px solid var(--border-main); }
.status-testing { background: rgba(99,102,241,0.1); color: #6366f1; border: 1px solid rgba(99,102,241,0.2); }
.status-success { background: rgba(34,197,94,0.1); color: #16a34a; border: 1px solid rgba(34,197,94,0.2); }
.status-error   { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }

/* ── FORM ── */
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.form-input { padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.875rem; background: var(--bg-input); color: var(--text-primary); outline: none; transition: border 0.18s; width: 100%; box-sizing: border-box; }
.form-input:focus { border-color: #6366f1; }
.input-with-icon { position: relative; display: flex; align-items: center; }
.input-with-icon .form-input { padding-right: 38px; }
.icon-btn-inline { position: absolute; right: 6px; width: 28px; height: 28px; border: none; background: transparent; color: var(--text-muted); border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.icon-btn-inline:hover { background: var(--bg-nav-hover); color: var(--text-primary); }

/* ── PANEL FOOTER / BUTTONS ── */
.panel-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--border-main); flex-wrap: wrap; gap: 12px; }
.helper-text { font-size: 0.78rem; color: var(--text-muted); }
.btn-row { display: flex; align-items: center; gap: 10px; }

.btn-outline-purple { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 8px; font-size: 0.84rem; font-weight: 600; cursor: pointer; border: 1.5px solid #6366f1; background: transparent; color: #6366f1; transition: all 0.18s ease; }
.btn-outline-purple:hover:not(:disabled) { background: rgba(99,102,241,0.08); }
.btn-outline-purple:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.18s; }
.btn-save:hover:not(:disabled) { background: #4f46e5; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── TABLE ── */
.table-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.data-table thead tr { background: var(--bg-input); border-bottom: 2px solid var(--border-main); position: sticky; top: 0; z-index: 2; }
.data-table th { padding: 12px 18px; text-align: left; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap; }
.data-table tbody tr { border-bottom: 1px solid var(--border-main); transition: background 0.15s; }
.data-table tbody tr:last-child { border-bottom: none; }
.data-row:hover { background: var(--bg-nav-hover); }
.data-table td { padding: 13px 18px; vertical-align: middle; color: var(--text-primary); }
.td-no { color: var(--text-muted); font-weight: 600; }
.td-name { font-weight: 500; }
.td-actions { text-align: center; white-space: nowrap; }

.menu-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 0.82rem; font-weight: 600; background: rgba(99,102,241,0.08); color: #4f46e5; border: 1px solid rgba(99,102,241,0.15); }

.id-value { font-family: ui-monospace, "SF Mono", monospace; font-weight: 700; color: var(--text-primary); }
.id-empty { color: var(--text-muted); font-weight: 500; }

.badge-active   { font-size: 0.75rem; font-weight: 600; padding: 3px 10px; border-radius: 99px; background: rgba(34,197,94,0.1); color: #16a34a; }
.badge-inactive { font-size: 0.75rem; font-weight: 600; padding: 3px 10px; border-radius: 99px; background: rgba(148,163,184,0.14); color: var(--text-muted); }

.row-edit-wrap { display: flex; align-items: center; gap: 8px; }
.row-input { width: 100px; padding: 6px 8px; border: 1px solid var(--border-main); border-radius: 6px; font-size: 0.85rem; background: var(--bg-input); color: var(--text-primary); outline: none; font-family: ui-monospace, "SF Mono", monospace; }
.row-input:focus { border-color: #6366f1; }
.row-input.input-error { border-color: #ef4444; }
.row-error-msg { font-size: 0.68rem; color: #ef4444; margin-top: 3px; }

.act-btn { width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s ease; margin: 0 2px; background: transparent; }
.act-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.act-edit         { color: #f59e0b; border-color: #f59e0b; }
.act-edit:hover   { background: #f59e0b; color: #fff; }
.act-save         { color: #16a34a; border-color: #16a34a; }
.act-save:hover:not(:disabled) { background: #16a34a; color: #fff; }
.act-cancel       { color: #64748b; border-color: var(--border-main); }
.act-cancel:hover { background: var(--bg-nav-hover); }

.table-foot-note { padding: 12px 18px; font-size: 0.76rem; color: var(--text-muted); border-top: 1px solid var(--border-main); background: var(--bg-input); }

@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>