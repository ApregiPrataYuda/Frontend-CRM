<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'

import AppModal from '@/components/AppModal.vue'
import { useConfirm } from '@/composables/useConfirm'
import { useSettingAppStore } from '@/stores/settingAppStore'
import { usePermissionStore } from '@/stores/PermissionStore'

const { confirm } = useConfirm()
const toast       = useToast()
const route       = useRoute()

const store      = useSettingAppStore()
const permission = usePermissionStore()

// Storage URL untuk gambar
const storageUrl = import.meta.env.VITE_STORAGE_URL ?? ''


// ─────────────────────────────────────────────
// PERMISSION
// ─────────────────────────────────────────────
const currentUrl = computed(() => route.path.replace('/app', ''))
const canCreate  = computed(() => permission.canCreate(currentUrl.value))
const canUpdate  = computed(() => permission.canUpdate(currentUrl.value))
const canDelete  = computed(() => permission.canDelete(currentUrl.value))
const canView    = computed(() => permission.canView(currentUrl.value))

// ─────────────────────────────────────────────
// LIFECYCLE
// ─────────────────────────────────────────────
onMounted(async () => {
  await store.fetchSettingApp()
})

onBeforeUnmount(() => {
  revokeAllPreviews()
})

// ─────────────────────────────────────────────
// DROPDOWN STATE
// ─────────────────────────────────────────────
const showExportMenu  = ref(false)
const showPerPageMenu = ref(false)

// ─────────────────────────────────────────────
// RESET
// ─────────────────────────────────────────────
async function handleReset() {
  showExportMenu.value  = false
  showPerPageMenu.value = false
  store.resetFilters()
}

// ─────────────────────────────────────────────
// IMAGE HELPER
// ─────────────────────────────────────────────
function imgUrl(filename) {
  if (!filename) return null
  if (filename.startsWith('http')) return filename
  return `${storageUrl}/app-setting/${filename}`
}

// ─────────────────────────────────────────────
// IMAGE PREVIEW MODAL (klik untuk perbesar)
// ─────────────────────────────────────────────
const showImagePreview = ref(false)
const previewImageUrl  = ref(null)

function openImagePreview(url) {
  previewImageUrl.value  = url
  showImagePreview.value = true
}
function closeImagePreview() {
  showImagePreview.value = false
  previewImageUrl.value  = null
}

// ─────────────────────────────────────────────
// DETAIL MODAL
// ─────────────────────────────────────────────
const isDetailModalVisible = ref(false)
const detailItem           = ref(null)

function openDetailModal(item) {
  detailItem.value           = item
  isDetailModalVisible.value = true
}
function closeDetailModal() {
  detailItem.value           = null
  isDetailModalVisible.value = false
}

// ─────────────────────────────────────────────
// EDIT MODAL
// ─────────────────────────────────────────────
const isEditModalVisible = ref(false)

// Form data — clone dari row agar tidak mutate langsung
const editForm = ref({})

// File baru yang dipilih user (null = tidak ganti)
const logoFile       = ref(null)
const logoSmallFile  = ref(null)
const faviconFile    = ref(null)

// Preview URL untuk file baru (object URL)
const logoPreview       = ref(null)
const logoSmallPreview  = ref(null)
const faviconPreview    = ref(null)

function revokeAllPreviews() {
  if (logoPreview.value)      URL.revokeObjectURL(logoPreview.value)
  if (logoSmallPreview.value) URL.revokeObjectURL(logoSmallPreview.value)
  if (faviconPreview.value)   URL.revokeObjectURL(faviconPreview.value)
  logoPreview.value      = null
  logoSmallPreview.value = null
  faviconPreview.value   = null
}

function openEditModal(item) {
  revokeAllPreviews()
  logoFile.value      = null
  logoSmallFile.value = null
  faviconFile.value   = null
  editForm.value      = { ...item }   // clone
  store.errorSettingApp = null
  isEditModalVisible.value = true
}

function closeEditModal() {
  isEditModalVisible.value = false
  store.errorSettingApp    = null
  revokeAllPreviews()
}

// Handler file logo
function handleLogoChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (logoPreview.value) URL.revokeObjectURL(logoPreview.value)
  logoFile.value    = file
  logoPreview.value = URL.createObjectURL(file)
}
function handleLogoSmallChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (logoSmallPreview.value) URL.revokeObjectURL(logoSmallPreview.value)
  logoSmallFile.value    = file
  logoSmallPreview.value = URL.createObjectURL(file)
}
function handleFaviconChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (faviconPreview.value) URL.revokeObjectURL(faviconPreview.value)
  faviconFile.value    = file
  faviconPreview.value = URL.createObjectURL(file)
}

async function submitEdit() {
  try {
    const fd = new FormData()

    // Kirim semua field kecuali field path lama (akan dikirim via file baru)
    const skipKeys = ['app_logo', 'app_logo_small', 'favicon']
    Object.entries(editForm.value).forEach(([key, val]) => {
      if (skipKeys.includes(key)) return
      if (val !== null && val !== undefined) fd.append(key, val)
    })

    // File baru — hanya kirim jika user memilih file
    if (logoFile.value)      fd.append('app_logo',       logoFile.value)
    if (logoSmallFile.value) fd.append('app_logo_small', logoSmallFile.value)
    if (faviconFile.value)   fd.append('favicon',        faviconFile.value)

    // Catatan: _method: PUT ditambahkan otomatis di service

    await store.updateSettingApp(editForm.value.id, fd)

    toast.success('Setting berhasil diperbarui!')
    closeEditModal()

  } catch (err) {
    if (store.errorSettingApp) {
      const firstError = Object.values(store.errorSettingApp)[0]?.[0]
      toast.error(firstError || 'Validasi gagal')
    } else {
      toast.error(err.response?.data?.message ?? 'Gagal memperbarui setting')
    }
  }
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <!-- ── BREADCRUMB ── -->
    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="gear" /> Setting Management
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" /> Dashboard
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Setting Table</span>
        </div>
      </div>
    </div>

    <!-- ── TOOLBAR TOP ── -->
    <div class="toolbar-top">
      <div class="toolbar-left">
        <div class="drop-wrap">
          <button class="btn-toolbar btn-purple" @click="showExportMenu = !showExportMenu">
            <font-awesome-icon icon="upload" /> Exports
            <font-awesome-icon icon="chevron-down" class="btn-arrow" />
          </button>
          <div class="drop-menu" :class="{ show: showExportMenu }">
            <div class="drop-label">Export Data</div>
            <button class="drop-item"><font-awesome-icon icon="file-csv"   style="color:#22c55e" /> Export CSV</button>
            <button class="drop-item"><font-awesome-icon icon="file-excel" style="color:#16a34a" /> Export Excel</button>
            <button class="drop-item"><font-awesome-icon icon="file-pdf"   style="color:#ef4444" /> Export PDF</button>
          </div>
        </div>
      </div>

      <button class="btn-toolbar btn-orange" @click="handleReset">
        <font-awesome-icon icon="rotate-left" /> Reset
      </button>
    </div>

    <!-- ── CONTROLS ROW ── -->
    <div class="controls-card">
      <div class="controls-row">
        <div class="controls-left">
          <div class="showing-wrap">
            <font-awesome-icon icon="list" class="text-muted-color" />
            <span class="showing-label">Showing:</span>
            <div class="drop-wrap">
              <button class="btn-select" @click="showPerPageMenu = !showPerPageMenu">
                {{ store.pagination.per_page }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showPerPageMenu }">
                <div class="drop-label">Per halaman</div>
                <div class="perpage-grid">
                  <button
                    v-for="opt in [5, 10, 25, 50]" :key="opt"
                    class="perpage-opt"
                    :class="{ active: store.pagination.per_page === opt }"
                    @click="store.pagination.per_page = opt; store.changePageSize(); showPerPageMenu = false"
                  >{{ opt }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="controls-right">
          <div class="search-wrap">
            <input
              :value="store.searchSettingApp"
              type="text"
              placeholder="Search setting..."
              class="search-input"
              @input="store.searchWithDelay($event.target.value)"
            />
            <button class="search-btn">
              <font-awesome-icon icon="magnifying-glass" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── TABLE ── -->
    <div class="table-card flex-grow-1 overflow-auto mb-3">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:60px">NO.</th>
            <th>APP NAME</th>
            <th>SHORT NAME</th>
            <th>TAGLINE</th>
            <th style="width:80px; text-align:center">LOGO</th>
            <th style="width:80px; text-align:center">LOGO SMALL</th>
            <th style="width:80px; text-align:center">FAVICON</th>
            <th style="width:130px">CREATED</th>
            <th style="width:130px">UPDATED</th>
            <th style="width:110px; text-align:center">ACTIONS</th>
          </tr>
        </thead>
        <tbody>

          <!-- Loading -->
          <tr v-if="store.loadingSettingApp">
            <td colspan="10" class="td-center">
              <div style="display:flex; justify-content:center;">
                <div class="spinner-custom"></div>
              </div>
            </td>
          </tr>

          <!-- Empty -->
          <tr v-else-if="!store.settingAppData.length">
            <td colspan="10" class="td-center">
              <div class="empty-state">
                <img
                  src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif"
                  alt="No data found"
                  class="empty-img"
                />
                <div class="empty-text">No data found</div>
              </div>
            </td>
          </tr>

          <!-- Data -->
          <tr
            v-else
            v-for="(item, index) in store.settingAppData"
            :key="item.id"
            class="data-row"
          >
            <td class="td-no">
              {{ ((store.pagination.current_page - 1) * store.pagination.per_page) + index + 1 }}.
            </td>
            <td class="td-bold">{{ item.app_name }}</td>
            <td>
              <span class="menu-badge">{{ item.app_short_name }}</span>
            </td>
            <td class="td-muted">{{ item.app_tagline }}</td>

            <!-- Logo — klik untuk preview -->
            <td style="text-align:center">
              <img
                v-if="item.app_logo"
                :src="imgUrl(item.app_logo)"
                :alt="item.app_name"
                class="setting-logo"
                @click="openImagePreview(imgUrl(item.app_logo))"
              />
              <span v-else class="td-muted">-</span>
            </td>

            <!-- Logo Small -->
            <td style="text-align:center">
              <img
                v-if="item.app_logo_small"
                :src="imgUrl(item.app_logo_small)"
                :alt="item.app_name + ' small'"
                class="setting-logo"
                @click="openImagePreview(imgUrl(item.app_logo_small))"
              />
              <span v-else class="td-muted">-</span>
            </td>

            <!-- Favicon -->
            <td style="text-align:center">
              <img
                v-if="item.favicon"
                :src="imgUrl(item.favicon)"
                :alt="item.app_name + ' favicon'"
                class="setting-logo"
                @click="openImagePreview(imgUrl(item.favicon))"
              />
              <span v-else class="td-muted">-</span>
            </td>

            <td class="td-muted">{{ store.formatDate(item.created_at) }}</td>
            <td class="td-muted">{{ store.formatDate(item.updated_at) }}</td>

            <td class="td-actions">
              <button v-if="canUpdate" class="act-btn act-edit" title="Edit" @click="openEditModal(item)">
                <font-awesome-icon icon="pen-to-square" />
              </button>
              <button v-if="canView" class="act-btn act-info" title="Detail" @click="openDetailModal(item)">
                <font-awesome-icon icon="circle-info" />
              </button>
            </td>
          </tr>

        </tbody>
      </table>
    </div>

    <!-- ── PAGINATION ── -->
    <div class="pagination-card">
      <div class="pagination-nav">
        <button
          class="btn-prev-next"
          :disabled="store.pagination.current_page === 1 || store.loadingSettingApp"
          @click="store.fetchSettingApp(store.pagination.prev_page_url)"
        >
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button
          class="btn-prev-next"
          :disabled="store.pagination.current_page === store.pagination.last_page || store.loadingSettingApp"
          @click="store.fetchSettingApp(store.pagination.next_page_url)"
        >
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">PAGE {{ store.pagination.current_page }} OF {{ store.pagination.last_page }}</span>
        <span class="page-badge">TOTAL: {{ store.pagination.total }} DATA</span>
      </div>
    </div>

    <!-- ════════════════════════════════════════
         MODAL DETAIL
    ════════════════════════════════════════ -->
    <AppModal
      :show="isDetailModalVisible"
      title="Detail Setting App"
      icon="circle-info"
      size="md"
      @close="closeDetailModal"
    >
      <div v-if="detailItem" class="detail-setting-wrap">

        <!-- Header: Logo + Nama + Versi -->
        <div class="detail-setting-header">
          <div class="detail-logo-wrap">
            <img
              :src="imgUrl(detailItem.app_logo)"
              :alt="detailItem.app_name"
              class="detail-logo-img"
              @click="openImagePreview(imgUrl(detailItem.app_logo))"
            />
          </div>
          <div class="detail-app-info">
            <p class="detail-app-name">{{ detailItem.app_name }}</p>
            <p class="detail-app-short">{{ detailItem.app_short_name }}</p>
            <div class="detail-badges-row">
              <span class="badge-version">v{{ detailItem.version ?? '—' }}</span>
              <span class="badge-env" :class="'env-' + (detailItem.environment ?? 'dev')">
                {{ detailItem.environment ?? '-' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Tagline -->
        <div class="detail-row">
          <span class="detail-label">Tagline</span>
          <span class="detail-value">{{ detailItem.app_tagline || '-' }}</span>
        </div>

        <!-- Warna -->
        <div class="detail-row">
          <span class="detail-label">Primary Color</span>
          <div class="color-display">
            <span class="color-swatch" :style="{ background: detailItem.primary_color }"></span>
            <span class="detail-value">{{ detailItem.primary_color || '-' }}</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-label">Secondary Color</span>
          <div class="color-display">
            <span class="color-swatch" :style="{ background: detailItem.secondary_color }"></span>
            <span class="detail-value">{{ detailItem.secondary_color || '-' }}</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-label">Sidebar Color</span>
          <div class="color-display">
            <span class="color-swatch" :style="{ background: detailItem.sidebar_color }"></span>
            <span class="detail-value">{{ detailItem.sidebar_color || '-' }}</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-label">Navbar Color</span>
          <div class="color-display">
            <span class="color-swatch" :style="{ background: detailItem.navbar_color }"></span>
            <span class="detail-value">{{ detailItem.navbar_color || '-' }}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="detail-row">
          <span class="detail-label">Footer Text</span>
          <span class="detail-value">{{ detailItem.footer_text || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">License URL</span>
          <span class="detail-value detail-url">{{ detailItem.footer_license_url || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Docs URL</span>
          <span class="detail-value detail-url">{{ detailItem.footer_documentation_url || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Support URL</span>
          <span class="detail-value detail-url">{{ detailItem.footer_support_url || '-' }}</span>
        </div>

        <!-- Logo kecil-kecil -->
        <div class="detail-logos-row">
          <div class="detail-logo-card">
            <span class="detail-logo-caption">Logo</span>
            <img :src="imgUrl(detailItem.app_logo)" class="detail-logo-thumb" @click="openImagePreview(imgUrl(detailItem.app_logo))" />
          </div>
          <div class="detail-logo-card">
            <span class="detail-logo-caption">Logo Small</span>
            <img :src="imgUrl(detailItem.app_logo_small)" class="detail-logo-thumb" @click="openImagePreview(imgUrl(detailItem.app_logo_small))" />
          </div>
          <div class="detail-logo-card">
            <span class="detail-logo-caption">Favicon</span>
            <img :src="imgUrl(detailItem.favicon)" class="detail-logo-thumb" @click="openImagePreview(imgUrl(detailItem.favicon))" />
          </div>
        </div>

        <!-- Timestamps -->
        <div class="detail-row">
          <span class="detail-label">Created At</span>
          <span class="detail-value">{{ store.formatDate(detailItem.created_at) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Updated At</span>
          <span class="detail-value">{{ store.formatDate(detailItem.updated_at) }}</span>
        </div>

      </div>

      <template #footer>
        <button
          v-if="canUpdate"
          class="btn-save"
          style="background:#f59e0b;"
          @click="openEditModal(detailItem); closeDetailModal()"
        >
          <font-awesome-icon icon="pen-to-square" /> Edit
        </button>
        <button class="btn-cancel" @click="closeDetailModal">Close</button>
      </template>
    </AppModal>

    <!-- ════════════════════════════════════════
         MODAL EDIT — Custom overlay (banyak field)
    ════════════════════════════════════════ -->
    <div v-if="isEditModalVisible" class="modal-overlay mt-5" @click.self="closeEditModal">
      <div class="modal-edit-box">

        <!-- Header -->
        <div class="modal-edit-header">
          <div class="modal-edit-title">
            <font-awesome-icon icon="pen-to-square" class="modal-edit-icon" />
            Edit Setting App
          </div>
          <button class="modal-close-btn" @click="closeEditModal">
            <font-awesome-icon icon="xmark" />
          </button>
        </div>

        <!-- Body — scrollable -->
        <div class="modal-edit-body">

          <!-- Row 1: App Name + Short Name -->
          <div class="form-grid-2">
            <div class="form-group">
              <label>App Name</label>
              <input
                v-model="editForm.app_name"
                class="form-input"
                :class="{ 'input-error': store.errorSettingApp?.app_name }"
                placeholder="e.g. My Application"
              />
              <span v-if="store.errorSettingApp?.app_name" class="field-error">{{ store.errorSettingApp.app_name[0] }}</span>
            </div>
            <div class="form-group">
              <label>App Short Name</label>
              <input
                v-model="editForm.app_short_name"
                class="form-input"
                :class="{ 'input-error': store.errorSettingApp?.app_short_name }"
                placeholder="e.g. MAP"
              />
              <span v-if="store.errorSettingApp?.app_short_name" class="field-error">{{ store.errorSettingApp.app_short_name[0] }}</span>
            </div>
          </div>

          <!-- Row 2: Tagline -->
          <div class="form-group">
            <label>App Tagline</label>
            <input
              v-model="editForm.app_tagline"
              class="form-input"
              placeholder="e.g. Beyond Excellence"
            />
          </div>

          <!-- Row 3: 3 Logo Uploads -->
          <div class="form-group">
            <label>App Images</label>
            <div class="form-grid-3">

              <!-- Logo -->
              <div class="img-upload-card">
                <span class="img-upload-caption">Logo</span>
                <div class="img-upload-preview-wrap" @click="openImagePreview(logoPreview || imgUrl(editForm.app_logo))">
                  <img
                    :src="logoPreview || imgUrl(editForm.app_logo)"
                    class="img-upload-preview"
                    :alt="editForm.app_name"
                    @error="$event.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(editForm.app_name || 'App')}&background=random&size=128`"
                  />
                  <div class="img-upload-zoom-hint"><font-awesome-icon icon="magnifying-glass-plus" /></div>
                </div>
                <label class="img-upload-btn">
                  <font-awesome-icon icon="upload" /> Ganti
                  <input type="file" accept="image/*" class="hidden-input" @change="handleLogoChange" />
                </label>
                <span v-if="logoFile" class="img-filename">{{ logoFile.name }}</span>
              </div>

              <!-- Logo Small -->
              <div class="img-upload-card">
                <span class="img-upload-caption">Logo Small</span>
                <div class="img-upload-preview-wrap" @click="openImagePreview(logoSmallPreview || imgUrl(editForm.app_logo_small))">
                  <img
                    :src="logoSmallPreview || imgUrl(editForm.app_logo_small)"
                    class="img-upload-preview"
                    :alt="editForm.app_name + ' small'"
                    @error="$event.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(editForm.app_name || 'App')}&background=random&size=128`"
                  />
                  <div class="img-upload-zoom-hint"><font-awesome-icon icon="magnifying-glass-plus" /></div>
                </div>
                <label class="img-upload-btn">
                  <font-awesome-icon icon="upload" /> Ganti
                  <input type="file" accept="image/*" class="hidden-input" @change="handleLogoSmallChange" />
                </label>
                <span v-if="logoSmallFile" class="img-filename">{{ logoSmallFile.name }}</span>
              </div>

              <!-- Favicon -->
              <div class="img-upload-card">
                <span class="img-upload-caption">Favicon</span>
                <div class="img-upload-preview-wrap" @click="openImagePreview(faviconPreview || imgUrl(editForm.favicon))">
                  <img
                    :src="faviconPreview || imgUrl(editForm.favicon)"
                    class="img-upload-preview"
                    :alt="editForm.app_name + ' favicon'"
                    @error="$event.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(editForm.app_name || 'App')}&background=random&size=128`"
                  />
                  <div class="img-upload-zoom-hint"><font-awesome-icon icon="magnifying-glass-plus" /></div>
                </div>
                <label class="img-upload-btn">
                  <font-awesome-icon icon="upload" /> Ganti
                  <input type="file" accept="image/*" class="hidden-input" @change="handleFaviconChange" />
                </label>
                <span v-if="faviconFile" class="img-filename">{{ faviconFile.name }}</span>
              </div>

            </div>
          </div>

          <!-- Row 4: Warna — 4 color pickers (grid-2) -->
          <div class="form-group">
            <label>Warna Aplikasi</label>
            <div class="form-grid-2">

              <div class="form-group">
                <label style="font-size:0.72rem;">Primary Color</label>
                <div class="color-picker-wrap">
                  <input type="color" v-model="editForm.primary_color" class="color-input" />
                  <span class="color-value">{{ editForm.primary_color || '-' }}</span>
                  <span class="color-swatch-preview" :style="{ background: editForm.primary_color }"></span>
                </div>
              </div>

              <div class="form-group">
                <label style="font-size:0.72rem;">Secondary Color</label>
                <div class="color-picker-wrap">
                  <input type="color" v-model="editForm.secondary_color" class="color-input" />
                  <span class="color-value">{{ editForm.secondary_color || '-' }}</span>
                  <span class="color-swatch-preview" :style="{ background: editForm.secondary_color }"></span>
                </div>
              </div>

              <div class="form-group">
                <label style="font-size:0.72rem;">Sidebar Color</label>
                <div class="color-picker-wrap">
                  <input type="color" v-model="editForm.sidebar_color" class="color-input" />
                  <span class="color-value">{{ editForm.sidebar_color || '-' }}</span>
                  <span class="color-swatch-preview" :style="{ background: editForm.sidebar_color }"></span>
                </div>
              </div>

              <div class="form-group">
                <label style="font-size:0.72rem;">Navbar Color</label>
                <div class="color-picker-wrap">
                  <input type="color" v-model="editForm.navbar_color" class="color-input" />
                  <span class="color-value">{{ editForm.navbar_color || '-' }}</span>
                  <span class="color-swatch-preview" :style="{ background: editForm.navbar_color }"></span>
                </div>
              </div>

            </div>
          </div>

          <!-- Row 5: Footer Text -->
          <div class="form-group">
            <label>Footer Text</label>
            <input v-model="editForm.footer_text" class="form-input" placeholder="e.g. © 2025 My App" />
          </div>

          <!-- Row 6: Footer URLs (grid-3) -->
          <div class="form-group">
            <label>Footer URLs</label>
            <div class="form-grid-3">
              <div class="form-group">
                <label style="font-size:0.72rem;">License URL</label>
                <input v-model="editForm.footer_license_url" class="form-input" placeholder="#" />
              </div>
              <div class="form-group">
                <label style="font-size:0.72rem;">Documentation URL</label>
                <input v-model="editForm.footer_documentation_url" class="form-input" placeholder="#" />
              </div>
              <div class="form-group">
                <label style="font-size:0.72rem;">Support URL</label>
                <input v-model="editForm.footer_support_url" class="form-input" placeholder="#" />
              </div>
            </div>
          </div>

          <!-- Row 7: Version + Environment -->
          <div class="form-grid-2">
            <div class="form-group">
              <label>Version</label>
              <input v-model="editForm.version" class="form-input" placeholder="0.0.0" />
            </div>
            <div class="form-group">
              <label>Environment</label>
              <select v-model="editForm.environment" class="form-input form-select">
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </select>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="modal-edit-footer">
          <button class="btn-cancel" :disabled="store.updatingSettingApp" @click="closeEditModal">
            Cancel
          </button>
          <button
            class="btn-save"
            :disabled="store.updatingSettingApp"
            @click="submitEdit"
          >
            <font-awesome-icon v-if="store.updatingSettingApp" icon="spinner" spin />
            <font-awesome-icon v-else icon="check" />
            {{ store.updatingSettingApp ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>

      </div>
    </div>

    <!-- ════════════════════════════════════════
         IMAGE PREVIEW MODAL (klik gambar untuk perbesar)
    ════════════════════════════════════════ -->
    <Transition name="fade">
      <div
        v-if="showImagePreview"
        class="img-preview-overlay"
        @click="closeImagePreview"
      >
        <div class="img-preview-box" @click.stop>
          <img :src="previewImageUrl" class="img-preview-full" alt="Preview" />
          <button class="img-preview-close" @click="closeImagePreview">
            <font-awesome-icon icon="xmark" />
          </button>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
/* ── CSS VARIABLES ── */
.h-100 {
  --text-muted:    #64748b;
  --primary-color: #6366f1;
}

/* ── BREADCRUMB ── */
.breadcrumb-card { background: var(--bg-card); border-radius: 10px; padding: 16px 18px; box-shadow: 0 1px 3px var(--shadow-color); }
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

/* ── TOOLBAR TOP ── */
.toolbar-top { display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); border-radius: 10px; padding: 12px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); flex-wrap: wrap; gap: 8px; }
.toolbar-left { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-toolbar { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: none; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; transition: all 0.18s ease; white-space: nowrap; }
.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover { background: #4f46e5; }
.btn-orange { background: #f59e0b; color: #fff; }
.btn-orange:hover { background: #d97706; }
.btn-arrow { font-size: 0.6rem; opacity: 0.7; }

/* ── CONTROLS ── */
.controls-card { background: var(--bg-card); border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); }
.controls-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.controls-left, .controls-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.showing-wrap { display: flex; align-items: center; gap: 6px; font-size: 0.84rem; color: var(--text-primary); font-weight: 600; }
.showing-label { white-space: nowrap; color: var(--text-muted); font-size: 0.83rem; }
.text-muted-color { color: var(--text-muted); }
.search-wrap { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.search-input { padding: 7px 12px; border: none; background: transparent; color: var(--text-primary); font-size: 0.84rem; outline: none; width: 200px; }
.search-input::placeholder { color: var(--text-muted); }
.search-btn { padding: 7px 12px; background: #6366f1; color: #fff; border: none; cursor: pointer; }
.search-btn:hover { background: #4f46e5; }

/* ── DROPDOWN ── */
.drop-wrap { position: relative; }
.btn-select { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.83rem; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
.btn-select:hover { border-color: #6366f1; color: #6366f1; }
.drop-menu { position: absolute; top: calc(100% + 6px); left: 0; min-width: 160px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 10px; z-index: 200; opacity: 0; transform: translateY(-6px); pointer-events: none; transition: all 0.18s ease; }
.drop-menu.show { opacity: 1; transform: translateY(0); pointer-events: all; }
.drop-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; padding: 0 4px; }
.drop-item { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: none; border: none; border-radius: 7px; color: var(--text-primary); font-size: 0.84rem; cursor: pointer; text-align: left; }
.drop-item:hover { background: var(--bg-nav-hover); }
.perpage-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.perpage-opt { padding: 5px 10px; border: 1px solid var(--border-main); border-radius: 6px; background: var(--bg-input); color: var(--text-primary); font-size: 0.82rem; cursor: pointer; }
.perpage-opt:hover  { border-color: #6366f1; color: #6366f1; }
.perpage-opt.active { background: #6366f1; border-color: #6366f1; color: #fff; font-weight: 700; }

/* ── TABLE ── */
.table-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.data-table thead tr { background: var(--bg-input); border-bottom: 2px solid var(--border-main); position: sticky; top: 0; z-index: 2; }
.data-table th { padding: 12px 18px; text-align: left; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap; }
.data-table tbody tr { border-bottom: 1px solid var(--border-main); transition: background 0.15s; }
.data-table tbody tr:last-child { border-bottom: none; }
.data-row:hover { background: var(--bg-nav-hover); }
.data-table td { padding: 13px 18px; vertical-align: middle; color: var(--text-primary); }
.td-no   { color: var(--text-muted); font-weight: 600; }
.td-bold { font-weight: 600; }
.td-muted { color: var(--text-muted); font-size: 0.84rem; }
.td-center { text-align: center; padding: 40px; color: var(--text-muted); }
.td-actions { text-align: center; white-space: nowrap; }

.menu-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 0.82rem; font-weight: 600; background: rgba(99,102,241,0.08); color: #4f46e5; border: 1px solid rgba(99,102,241,0.15); }

/* Logo di tabel — klik untuk preview */
.setting-logo { width: 36px; height: 36px; object-fit: contain; border-radius: 6px; border: 1px solid var(--border-main); cursor: pointer; display: block; margin: 0 auto; transition: transform 0.15s; }
.setting-logo:hover { transform: scale(1.15); }

/* Empty state */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.empty-img   { width: 160px; opacity: 0.85; border-radius: 8px; }
.empty-text  { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }

/* Spinner */
.spinner-custom { width: 32px; height: 32px; border: 3px solid var(--border-main); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── ACTION BUTTONS ── */
.act-btn { width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s ease; margin: 0 2px; background: transparent; }
.act-edit       { color: #f59e0b; border-color: #f59e0b; }
.act-edit:hover { background: #f59e0b; color: #fff; }
.act-info       { color: #6366f1; border-color: #6366f1; }
.act-info:hover { background: #6366f1; color: #fff; }

/* ── PAGINATION ── */
.pagination-card { background: var(--bg-card); border-radius: 10px; padding: 14px 18px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: row-reverse; align-items: center; justify-content: space-between; gap: 12px; }
.pagination-nav { display: flex; align-items: center; gap: 8px; }
.btn-prev-next { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; min-width: 85px; justify-content: center; transition: background 0.18s ease; }
.btn-prev-next:hover:not(:disabled) { background: #4f46e5; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badges { display: flex; gap: 8px; align-items: center; }
.page-badge { padding: 7px 14px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); background: var(--bg-input); white-space: nowrap; }

@media (max-width: 576px) {
  .pagination-card { flex-direction: column; padding: 12px; gap: 12px; }
  .pagination-nav { width: 100%; justify-content: space-between; }
  .btn-prev-next { flex: 1; max-width: 48%; }
  .page-badges { width: 100%; justify-content: center; flex-wrap: wrap; }
}

/* ── FORM ── */
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.form-input { padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.875rem; background: var(--bg-input); color: var(--text-primary); outline: none; transition: border 0.18s; width: 100%; box-sizing: border-box; }
.form-input:focus { border-color: #6366f1; }
.input-error { border-color: #ef4444 !important; }
.field-error { font-size: 0.75rem; color: #ef4444; }

.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }

@media (max-width: 560px) {
  .form-grid-2 { grid-template-columns: 1fr; }
  .form-grid-3 { grid-template-columns: 1fr; }
}

.form-select {
  cursor: pointer; appearance: none; -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-repeat: no-repeat; background-position: right 12px center; background-size: 1.25rem; padding-right: 36px;
}

/* ── LOGO UPLOAD CARDS (3-grid) ── */
.img-upload-card {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  border: 1px solid var(--border-main); border-radius: 10px; padding: 12px 10px;
  background: var(--bg-input);
}
.img-upload-caption { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.img-upload-preview-wrap { position: relative; cursor: pointer; }
.img-upload-preview { width: 60px; height: 60px; border-radius: 8px; border: 1px solid var(--border-main); object-fit: contain; background: #fff; display: block; }
.img-upload-zoom-hint {
  position: absolute; inset: 0; background: rgba(0,0,0,0.35); border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 0.85rem;
  opacity: 0; transition: opacity 0.18s;
}
.img-upload-preview-wrap:hover .img-upload-zoom-hint { opacity: 1; }
.img-upload-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 12px; background: #6366f1; color: #fff;
  border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer;
  transition: background 0.15s;
}
.img-upload-btn:hover { background: #4f46e5; }
.hidden-input { display: none; }
.img-filename { font-size: 0.68rem; color: #059669; font-weight: 500; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ── COLOR PICKER ── */
.color-picker-wrap {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; border: 1px solid var(--border-main); border-radius: 8px;
  background: var(--bg-input);
}
.color-input { width: 28px; height: 28px; border-radius: 6px; cursor: pointer; border: none; padding: 0; background: none; flex-shrink: 0; }
.color-value { font-size: 0.83rem; color: var(--text-primary); font-family: monospace; flex: 1; }
.color-swatch-preview { width: 20px; height: 20px; border-radius: 4px; border: 1px solid var(--border-main); flex-shrink: 0; }

/* ── MODAL FOOTER ── */
.btn-cancel { padding: 8px 18px; background: var(--bg-main, #f1f5f9); color: var(--text-muted); border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover:not(:disabled) { background: var(--border-main); color: var(--text-primary); }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.18s; }
.btn-save:hover:not(:disabled) { background: #4f46e5; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── DETAIL MODAL ── */
.detail-setting-wrap { display: flex; flex-direction: column; gap: 0; }
.detail-setting-header { display: flex; align-items: center; gap: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--border-main); margin-bottom: 4px; }
.detail-logo-wrap { width: 72px; height: 72px; border-radius: 12px; border: 1px solid var(--border-main); overflow: hidden; flex-shrink: 0; cursor: pointer; background: #fff; }
.detail-logo-img { width: 100%; height: 100%; object-fit: contain; }
.detail-app-info { display: flex; flex-direction: column; gap: 4px; }
.detail-app-name { font-size: 1rem; font-weight: 800; color: var(--text-primary); margin: 0; }
.detail-app-short { font-size: 0.82rem; color: var(--text-muted); margin: 0; }
.detail-badges-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.badge-version { font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 99px; background: rgba(99,102,241,0.1); color: #6366f1; border: 1px solid rgba(99,102,241,0.2); }
.badge-env { font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 99px; }
.env-development { background: rgba(245,158,11,0.1); color: #d97706; }
.env-staging     { background: rgba(59,130,246,0.1); color: #2563eb; }
.env-production  { background: rgba(16,185,129,0.1); color: #059669; }

.detail-list { display: flex; flex-direction: column; }
.detail-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-main); gap: 12px; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); flex-shrink: 0; }
.detail-value { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); text-align: right; }
.detail-url { font-family: monospace; font-size: 0.78rem; word-break: break-all; }

.color-display { display: flex; align-items: center; gap: 8px; }
.color-swatch { width: 16px; height: 16px; border-radius: 4px; border: 1px solid var(--border-main); flex-shrink: 0; display: inline-block; }

.detail-logos-row { display: flex; gap: 12px; padding: 12px 0; border-top: 1px solid var(--border-main); border-bottom: 1px solid var(--border-main); margin: 4px 0; }
.detail-logo-card { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.detail-logo-caption { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); }
.detail-logo-thumb { width: 44px; height: 44px; border-radius: 8px; object-fit: contain; border: 1px solid var(--border-main); cursor: pointer; background: #fff; transition: transform 0.15s; }
.detail-logo-thumb:hover { transform: scale(1.1); }

/* ════════════════════════════════════════
   EDIT MODAL — Custom overlay
════════════════════════════════════════ */
.modal-overlay {
  position: fixed; inset: 0; z-index: 500;
  background: rgba(0,0,0,0.45); backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.modal-edit-box {
  background: var(--bg-card); border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
  width: 100%; max-width: 720px; max-height: 92vh;
  display: flex; flex-direction: column; overflow: hidden;
}
.modal-edit-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--border-main); flex-shrink: 0;
}
.modal-edit-title { display: flex; align-items: center; gap: 10px; font-size: 1rem; font-weight: 800; color: var(--text-primary); }
.modal-edit-icon  { color: #f59e0b; font-size: 1.1rem; }
.modal-close-btn { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; background: var(--bg-input); border: 1px solid var(--border-main); border-radius: 7px; cursor: pointer; color: var(--text-muted); transition: all 0.15s; }
.modal-close-btn:hover { background: #ef4444; border-color: #ef4444; color: #fff; }

.modal-edit-body { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }

.modal-edit-footer {
  padding: 14px 20px; border-top: 1px solid var(--border-main);
  display: flex; justify-content: flex-end; gap: 10px; flex-shrink: 0;
}

/* ════════════════════════════════════════
   IMAGE PREVIEW MODAL
════════════════════════════════════════ */
.img-preview-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.80); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; cursor: zoom-out;
}
.img-preview-box {
  position: relative; cursor: default;
  max-width: 90vw; max-height: 90vh;
}
.img-preview-full {
  max-width: 90vw; max-height: 90vh;
  border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  display: block; object-fit: contain;
}
.img-preview-close {
  position: absolute; top: -14px; right: -14px;
  width: 32px; height: 32px; background: #ef4444; color: #fff;
  border: none; border-radius: 50%; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.9rem; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  transition: background 0.15s;
}
.img-preview-close:hover { background: #dc2626; }

/* Vue Transition */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>