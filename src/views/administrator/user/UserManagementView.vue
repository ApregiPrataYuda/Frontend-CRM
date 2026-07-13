<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'

import AppModal from '@/components/AppModal.vue'
import { useConfirm } from '@/composables/useConfirm'
import { useUserStore } from '@/stores/userStore'
import { useAccessSubMenuStore } from '@/stores/accessSubMenuStore'
import { usePermissionStore } from '@/stores/PermissionStore'

const route           = useRoute()
const toast           = useToast()
const store           = useUserStore()
const accessSubMenu   = useAccessSubMenuStore()
const permission      = usePermissionStore()
const { confirm }     = useConfirm()

/* ─────────────────────────────────────────
 * PERMISSION
 * ───────────────────────────────────────── */
const currentUrl = computed(() => route.path.replace('/app', ''))
const canCreate  = computed(() => permission.canCreate(currentUrl.value))
const canUpdate  = computed(() => permission.canUpdate(currentUrl.value))
const canDelete  = computed(() => permission.canDelete(currentUrl.value))
const canView    = computed(() => permission.canView(currentUrl.value))

/* ─────────────────────────────────────────
 * LIFECYCLE
 * ───────────────────────────────────────── */
onMounted(async () => {
  await store.fetchUsers()
  window.addEventListener('click', closeAllMenus)
})

onUnmounted(() => {
  window.removeEventListener('click', closeAllMenus)
  // FIX #1 — bersihkan timeout & abort request yang masih pending saat komponen di-unmount
  store.clearSearchTimeout()
})

/* ─────────────────────────────────────────
 * DROPDOWN TOGGLES
 * ───────────────────────────────────────── */
const showExportMenu  = ref(false)
const showImportMenu  = ref(false)
const showSortByMenu  = ref(false)
const showSortDirMenu = ref(false)
const showPerPageMenu = ref(false)

function closeAllMenus() {
  showExportMenu.value  = false
  showImportMenu.value  = false
  showSortByMenu.value  = false
  showSortDirMenu.value = false
  showPerPageMenu.value = false
}

function toggleDropdown(event, key) {
  event.stopPropagation()
  const map = {
    export:  showExportMenu,
    import:  showImportMenu,
    sortBy:  showSortByMenu,
    sortDir: showSortDirMenu,
    perPage: showPerPageMenu,
  }
  const target = map[key]
  if (!target) return
  const current = target.value
  closeAllMenus()
  target.value = !current
}

/* ─────────────────────────────────────────
 * SORTING
 * ───────────────────────────────────────── */
const sortByOptions = [
  { label: 'Created Date', value: 'created_at' },
  { label: 'Full Name',    value: 'fullname' },
  { label: 'Email',        value: 'email' },
]

const sortByLabel = computed(() =>
  sortByOptions.find(i => i.value === store.sort.column)?.label ?? 'Created Date'
)

function changeSort(column) {
  store.sort.column = column
  store.changeSorting()
  showSortByMenu.value = false
}

function changeSortDir(dir) {
  store.sort.direction = dir
  store.changeSorting()
  showSortDirMenu.value = false
}

/* ─────────────────────────────────────────
 * PAGINATION
 * ───────────────────────────────────────── */
function changePerPage(value) {
  store.pagination.per_page = value
  store.changePageSize()
  showPerPageMenu.value = false
}

function nextPage() {
  if (store.pagination.current_page < store.pagination.last_page) {
    store.pagination.current_page++
    store.fetchUsers(store.buildUrl())
  }
}

function prevPage() {
  if (store.pagination.current_page > 1) {
    store.pagination.current_page--
    store.fetchUsers(store.buildUrl())
  }
}

/* ─────────────────────────────────────────
 * RESET & EXPORT
 * ───────────────────────────────────────── */
function handleReset() { store.resetFilters() }

function exportCSV() {
  showExportMenu.value = false
  toast.info('Export CSV process...')
}
function exportExcel() {
  showExportMenu.value = false
  toast.info('Export Excel process...')
}
function exportPDF() {
  showExportMenu.value = false
  toast.info('Export PDF process...')
}

/* ─────────────────────────────────────────
 * IMAGE HANDLING
 * ───────────────────────────────────────── */
const imageFile    = ref(null)
const imagePreview = ref(null)

function onChangeImage(e) {
  const file = e.target.files[0]
  if (!file) return

  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    toast.error('Format hanya JPG / PNG')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    toast.error('Ukuran file maksimal 2MB')
    return
  }
  // Revoke blob URL lama sebelum buat yang baru
  if (imageFile.value && imagePreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(imagePreview.value)
  }
  imageFile.value    = file
  imagePreview.value = URL.createObjectURL(file)
}

function resetImage() {
  // Hanya revoke jika itu blob URL (hasil createObjectURL), bukan URL dari server
  if (imagePreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(imagePreview.value)
  }
  imageFile.value    = null
  imagePreview.value = null
}

/* ─────────────────────────────────────────
 * ADD / EDIT MODAL
 * ───────────────────────────────────────── */
const isUserModalVisible = ref(false)
const isEdit             = ref(false)
const selectedUser       = ref(null)

const emptyForm = () => ({
  fullname:  '',
  username:  '',
  email:     '',
  password:  '',
  role_id:   null,
  divisi_id: null,
  group_id:  null,
  is_active: 1,
})

const form = ref(emptyForm())

async function openAddModal() {
  isEdit.value             = false
  selectedUser.value       = null
  form.value               = emptyForm()
  store.errorUser          = null
  resetImage()
  isUserModalVisible.value = true
  await store.fetchFormOptions()
}

async function openEditModal(user) {
  isEdit.value       = true
  selectedUser.value = user
  store.errorUser    = null
  form.value         = emptyForm()
  resetImage()
  isUserModalVisible.value = true

  // FIX #7 — nextTick dihapus, tidak diperlukan di sini
  await store.fetchFormOptions()

  form.value = {
    fullname:  user.fullname  ?? '',
    username:  user.username  ?? '',
    email:     user.email     ?? '',
    password:  '',
    role_id:   user.role_id         ? Number(user.role_id)           : null,
    divisi_id: user.division?.id    ? Number(user.division.id)       : null,
    group_id:  user.groups?.id_group ? Number(user.groups.id_group)  : null,
    is_active: user.is_active ? 1 : 0,
  }

  // Tampilkan preview foto existing (ini URL dari server, bukan blob — tidak perlu revoke)
  if (user.image && user.image !== 'default.png') {
    imagePreview.value = store.getImageUrl(user.image, user.fullname)
  }
}

function closeUserModal() {
  isUserModalVisible.value = false
  store.errorUser          = null
  resetImage()
}

// FIX #8 — client-side validation yang lebih lengkap
async function submitUserForm() {
  if (!form.value.fullname.trim()) {
    toast.error('Full name harus diisi!')
    return
  }
  if (!form.value.username.trim()) {
    toast.error('Username harus diisi!')
    return
  }
  if (!form.value.email.trim()) {
    toast.error('Email harus diisi!')
    return
  }
  if (!isEdit.value && !form.value.password) {
    toast.error('Password harus diisi untuk user baru!')
    return
  }
  if (!form.value.role_id) {
    toast.error('Role harus dipilih!')
    return
  }

  const payload = { ...form.value }
  if (!payload.password) delete payload.password
  if (imageFile.value) payload.image = imageFile.value

  if (isEdit.value && selectedUser.value) {
    const ok = await store.updateUser(selectedUser.value.id_user, payload)
    if (ok) { toast.success('User updated successfully'); closeUserModal() }
  } else {
    const ok = await store.saveUser(payload)
    if (ok) { toast.success('User added successfully'); closeUserModal() }
  }
}

/* ─────────────────────────────────────────
 * DETAIL MODAL
 * ───────────────────────────────────────── */
const isDetailModalVisible = ref(false)
const detailUser           = ref(null)

function openDetailModal(user) {
  detailUser.value           = user
  isDetailModalVisible.value = true
}

function closeDetailModal() {
  isDetailModalVisible.value = false
  detailUser.value           = null
}

/* ─────────────────────────────────────────
 * DELETE
 * FIX #5 — rename handleDeleteUser agar tidak shadow store.deleteUser
 * ───────────────────────────────────────── */
async function handleDeleteUser(user) {
  const isConfirmed = await confirm({
    type:        'danger',
    title:       'Delete User',
    message:     `Delete "${user.fullname}"?`,
    detail:      'This action cannot be undone.',
    confirmText: 'Delete',
    cancelText:  'Cancel',
  })
  if (!isConfirmed) return

  const ok = await store.deleteUser(user.id_user)
  if (ok) toast.success('User deleted successfully')
}

/* ─────────────────────────────────────────
 * ACCESS SUBMENU MODAL
 * ───────────────────────────────────────── */
const isAccessModalVisible = ref(false)
const accessTargetUser     = ref(null)

async function openAccessModal(user) {
  accessTargetUser.value     = user
  isAccessModalVisible.value = true
  await accessSubMenu.setUserId(user.id_user)
}

function closeAccessModal() {
  isAccessModalVisible.value = false
  accessTargetUser.value     = null
}

async function handlePermissionChange(row) {
  await accessSubMenu.autoSavePermission(row)
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <!-- ── BREADCRUMB ── -->
    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="users" /> User Management
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" /> Dashboard
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">User Table</span>
        </div>
      </div>
    </div>

    <!-- ── TOOLBAR TOP ── -->
    <div class="toolbar-top">
      <div class="toolbar-left">

        <div class="drop-wrap">
          <button class="btn-toolbar btn-purple" @click="toggleDropdown($event, 'export')">
            <font-awesome-icon icon="upload" /> Exports
            <font-awesome-icon icon="chevron-down" class="btn-arrow" />
          </button>
          <div class="drop-menu" :class="{ show: showExportMenu }">
            <div class="drop-label">Export Data</div>
            <button class="drop-item" @click="exportCSV">
              <font-awesome-icon icon="file-csv"   style="color:#22c55e" /> Export CSV
            </button>
            <button class="drop-item" @click="exportExcel">
              <font-awesome-icon icon="file-excel" style="color:#16a34a" /> Export Excel
            </button>
            <button class="drop-item" @click="exportPDF">
              <font-awesome-icon icon="file-pdf"   style="color:#ef4444" /> Export PDF
            </button>
          </div>
        </div>

        <div class="drop-wrap">
          <button class="btn-toolbar btn-purple" @click="toggleDropdown($event, 'import')">
            <font-awesome-icon icon="download" /> Imports
            <font-awesome-icon icon="chevron-down" class="btn-arrow" />
          </button>
          <div class="drop-menu" :class="{ show: showImportMenu }">
            <div class="drop-label">Import Data</div>
            <button class="drop-item">
              <font-awesome-icon icon="file-csv" style="color:#22c55e" /> Import CSV
            </button>
          </div>
        </div>

      </div>

      <button class="btn-toolbar btn-orange" :disabled="store.loadingUsers" @click="handleReset">
        <font-awesome-icon icon="rotate-left" /> Reset
      </button>
    </div>

    <!-- ── CONTROLS ROW ── -->
    <div class="controls-card">
      <div class="controls-row">

        <div class="controls-left">
          <button v-if="canCreate" class="btn-toolbar btn-purple" @click="openAddModal">
            <font-awesome-icon icon="plus" /> Add User
          </button>
        </div>

        <div class="controls-right">

          <!-- Search -->
          <div class="search-wrap">
            <input
              :value="store.searchUsers"
              :disabled="store.loadingUsers"
              type="text"
              placeholder="Search users..."
              class="search-input"
              @input="store.searchWithDelay($event.target.value)"
            />
            <button class="search-btn" :disabled="store.loadingUsers">
              <font-awesome-icon icon="magnifying-glass" />
            </button>
          </div>

          <!-- Sort By -->
          <div class="sort-wrap">
            <div class="drop-wrap">
              <button class="btn-select" @click="toggleDropdown($event, 'sortBy')">
                {{ sortByLabel }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showSortByMenu }">
                <div class="drop-label">Sort By</div>
                <button
                  v-for="opt in sortByOptions" :key="opt.value"
                  class="drop-item"
                  :class="{ active: store.sort.column === opt.value }"
                  @click="changeSort(opt.value)"
                >{{ opt.label }}</button>
              </div>
            </div>

            <!-- Sort Dir -->
            <div class="drop-wrap">
              <button class="btn-select" @click="toggleDropdown($event, 'sortDir')">
                {{ store.sort.direction.toUpperCase() }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-right" :class="{ show: showSortDirMenu }">
                <div class="drop-label">Direction</div>
                <button
                  v-for="opt in ['asc', 'desc']" :key="opt"
                  class="drop-item"
                  :class="{ active: store.sort.direction === opt }"
                  @click="changeSortDir(opt)"
                >{{ opt.toUpperCase() }}</button>
              </div>
            </div>

            <!-- Per Page -->
            <div class="drop-wrap">
              <button class="btn-select" @click="toggleDropdown($event, 'perPage')">
                {{ store.pagination.per_page }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-right" :class="{ show: showPerPageMenu }">
                <div class="drop-label">Per Page</div>
                <div class="perpage-grid">
                  <button
                    v-for="num in [10, 25, 50, 100]" :key="num"
                    class="perpage-opt"
                    :class="{ active: store.pagination.per_page === num }"
                    @click="changePerPage(num)"
                  >{{ num }}</button>
                </div>
              </div>
            </div>
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
            <th>FULL NAME</th>
            <th>EMAIL</th>
            <th>ROLE</th>
            <th>DIVISION</th>
            <th>GROUP</th>
            <th style="width:70px; text-align:center">PHOTO</th>
            <th style="width:130px">CREATED</th>
            <th style="width:130px">UPDATED</th>
            <th style="text-align:center; width:160px">ACTIONS</th>
          </tr>
        </thead>
        <tbody>

          <!-- Loading -->
          <tr v-if="store.loadingUsers">
            <td colspan="10" class="td-center">
              <div class="d-flex justify-content-center">
                <div class="spinner-custom"></div>
              </div>
            </td>
          </tr>

          <!-- Empty -->
          <tr v-else-if="!store.usersData.length">
            <td colspan="10" class="td-center">
              <div class="empty-state">
                <font-awesome-icon icon="inbox" class="empty-icon" />
                <div class="empty-text">No data found</div>
              </div>
            </td>
          </tr>

          <!-- Data -->
          <tr
            v-else
            v-for="(item, index) in store.usersData"
            :key="item.id_user"
            class="data-row"
          >
            <td class="td-no">
              {{ ((store.pagination.current_page - 1) * store.pagination.per_page) + index + 1 }}.
            </td>
            <td class="td-bold">{{ item.fullname }}</td>
            <td class="td-muted">{{ item.email }}</td>
            <td>
              <span class="badge-role">{{ item.role?.role ?? '-' }}</span>
            </td>
            <td>
              <span class="badge-division">{{ item.division?.name_division ?? '-' }}</span>
            </td>
            <td>
              <span class="badge-group">{{ item.groups?.name_group ?? '-' }}</span>
            </td>
            <td style="text-align:center">
              <img
                :src="store.getImageUrl(item.image, item.fullname)"
                :alt="item.fullname"
                class="user-avatar"
              />
            </td>
            <td class="td-muted">{{ store.formatDate(item.created_at) }}</td>
            <td class="td-muted">{{ store.formatDate(item.updated_at) }}</td>

            <td class="td-actions">
              <button v-if="canUpdate" class="act-btn act-edit"    title="Edit"   @click="openEditModal(item)">
                <font-awesome-icon icon="pen-to-square" />
              </button>
              <!-- FIX #5 — pakai handleDeleteUser, bukan deleteUser -->
              <button v-if="canDelete" class="act-btn act-delete"  title="Hapus"  :disabled="store.deletingUser" @click="handleDeleteUser(item)">
                <font-awesome-icon icon="trash-can" />
              </button>
              <button v-if="canView"   class="act-btn act-info"    title="Detail" @click="openDetailModal(item)">
                <font-awesome-icon icon="circle-info" />
              </button>
              <button v-if="canUpdate" class="act-btn act-access"  title="Access SubMenu" @click="openAccessModal(item)">
                <font-awesome-icon icon="shield-halved" />
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
          :disabled="store.pagination.current_page === 1 || store.loadingUsers"
          @click="prevPage"
        >
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button
          class="btn-prev-next"
          :disabled="store.pagination.current_page === store.pagination.last_page || store.loadingUsers"
          @click="nextPage"
        >
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>

      <div class="page-badges">
        <span class="page-badge">{{ store.usersData.length }} DATA</span>
        <span class="page-badge">PAGE {{ store.pagination.current_page }} / {{ store.pagination.last_page }}</span>
        <span class="page-badge">TOTAL: {{ store.pagination.total }}</span>
      </div>
    </div>

    <!-- ════════════════════════════════════════
         MODAL ADD / EDIT USER
    ════════════════════════════════════════ -->
    <AppModal
      :show="isUserModalVisible"
      :title="isEdit ? 'Edit User' : 'Add New User'"
      :icon="isEdit ? 'pen' : 'user-plus'"
      size="lg"
      @close="closeUserModal"
    >
      <!-- Loading options -->
      <div v-if="store.loadingOptions" class="td-center" style="padding: 24px;">
        <div class="spinner-custom" style="margin: 0 auto;"></div>
        <p style="margin-top:10px; font-size:0.82rem; color:var(--text-muted)">Memuat opsi form...</p>
      </div>

      <div v-else class="form-container-gap">

        <!-- Row 1: Fullname + Username -->
        <div class="form-grid-2">
          <div class="form-group">
            <label>Full Name</label>
            <input
              v-model="form.fullname"
              class="form-input"
              :class="{ 'input-error': store.errorUser?.fullname }"
              placeholder="e.g. Budi Santoso"
              @input="store.clearFieldError('fullname')"
            />
            <!-- FIX #2 — clearFieldError hanya clear error field ini -->
            <span v-if="store.errorUser?.fullname" class="field-error">{{ store.errorUser.fullname[0] }}</span>
          </div>

          <div class="form-group">
            <label>Username</label>
            <input
              v-model="form.username"
              class="form-input"
              :class="{ 'input-error': store.errorUser?.username }"
              placeholder="e.g. budi_s"
              @input="store.clearFieldError('username')"
            />
            <span v-if="store.errorUser?.username" class="field-error">{{ store.errorUser.username[0] }}</span>
          </div>
        </div>

        <!-- Row 2: Email + Password -->
        <div class="form-grid-2">
          <div class="form-group">
            <label>Email</label>
            <input
              v-model="form.email"
              type="email"
              class="form-input"
              :class="{ 'input-error': store.errorUser?.email }"
              placeholder="e.g. budi@email.com"
              @input="store.clearFieldError('email')"
            />
            <span v-if="store.errorUser?.email" class="field-error">{{ store.errorUser.email[0] }}</span>
          </div>

          <div class="form-group">
            <label>
              Password
              <span v-if="isEdit" class="label-hint">(kosongkan jika tidak diubah)</span>
            </label>
            <input
              v-model="form.password"
              type="password"
              class="form-input"
              :class="{ 'input-error': store.errorUser?.password }"
              placeholder="••••••••"
              @input="store.clearFieldError('password')"
            />
            <span v-if="store.errorUser?.password" class="field-error">{{ store.errorUser.password[0] }}</span>
          </div>
        </div>

        <!-- Row 3: Role + Division -->
        <div class="form-grid-2">
          <div class="form-group">
            <label>Role</label>
            <select
              v-model="form.role_id"
              class="form-input form-select"
              :class="{ 'input-error': store.errorUser?.role_id }"
              @change="store.clearFieldError('role_id')"
            >
              <option :value="null" disabled>-- Pilih Role --</option>
              <option
                v-for="r in store.rolesOptions"
                :key="r.id_role"
                :value="r.id_role"
              >{{ r.role }}</option>
            </select>
            <span v-if="store.errorUser?.role_id" class="field-error">{{ store.errorUser.role_id[0] }}</span>
          </div>

          <div class="form-group">
            <label>Division</label>
            <select
              v-model="form.divisi_id"
              class="form-input form-select"
              :class="{ 'input-error': store.errorUser?.divisi_id }"
              @change="store.clearFieldError('divisi_id')"
            >
              <option :value="null" disabled>-- Pilih Division --</option>
              <option
                v-for="d in store.divisionsOptions"
                :key="d.id"
                :value="d.id"
              >{{ d.name_division }}</option>
            </select>
            <span v-if="store.errorUser?.divisi_id" class="field-error">{{ store.errorUser.divisi_id[0] }}</span>
          </div>
        </div>

        <!-- Row 4: Group + Status -->
        <div class="form-grid-2">
          <div class="form-group">
            <label>Group</label>
            <select
              v-model="form.group_id"
              class="form-input form-select"
              :class="{ 'input-error': store.errorUser?.group_id }"
              @change="store.clearFieldError('group_id')"
            >
              <option :value="null" disabled>-- Pilih Group --</option>
              <option
                v-for="g in store.groupsOptions"
                :key="g.id_group"
                :value="g.id_group"
              >{{ g.name_group }}</option>
            </select>
            <span v-if="store.errorUser?.group_id" class="field-error">{{ store.errorUser.group_id[0] }}</span>
          </div>

          <div class="form-group">
            <label>Status</label>
            <select v-model="form.is_active" class="form-input form-select">
              <option
                v-for="s in store.statusStatis"
                :key="s.value"
                :value="s.value"
              >{{ s.label }}</option>
            </select>
          </div>
        </div>

        <!-- Row 5: Photo -->
        <div class="form-group">
          <label>Foto Profil</label>
          <div class="photo-upload-wrap">
            <!-- Preview -->
            <img
              :src="imagePreview || store.getImageUrl(null, form.fullname || 'User')"
              :alt="form.fullname"
              class="photo-preview"
            />
            <!-- Upload area -->
            <div class="photo-upload-info">
              <input
                type="file"
                id="user-photo-input"
                accept="image/png,image/jpeg"
                class="hidden-input"
                @change="onChangeImage"
              />
              <label for="user-photo-input" class="btn-toolbar btn-purple" style="cursor:pointer; font-size:0.8rem;">
                <font-awesome-icon icon="upload" /> Pilih Foto
              </label>
              <p class="photo-hint">Format: JPG, PNG — Max 2MB</p>
              <p v-if="imageFile" class="photo-filename">
                <font-awesome-icon icon="check" style="color:#16a34a" /> {{ imageFile.name }}
              </p>
              <span v-if="store.errorUser?.image" class="field-error">{{ store.errorUser.image[0] }}</span>
            </div>
          </div>
        </div>

      </div>

      <template #footer>
        <button class="btn-cancel" :disabled="store.savingUser || store.updatingUser" @click="closeUserModal">
          Cancel
        </button>
        <button
          class="btn-save"
          :disabled="store.savingUser || store.updatingUser || store.loadingOptions"
          @click="submitUserForm"
        >
          <font-awesome-icon v-if="store.savingUser || store.updatingUser" icon="spinner" spin />
          <font-awesome-icon v-else icon="check" />
          {{ isEdit
            ? (store.updatingUser ? 'Updating...' : 'Update')
            : (store.savingUser   ? 'Saving...'   : 'Save Data') }}
        </button>
      </template>
    </AppModal>

    <!-- ════════════════════════════════════════
         MODAL DETAIL USER
    ════════════════════════════════════════ -->
    <AppModal
      :show="isDetailModalVisible"
      title="Detail User"
      icon="circle-info"
      size="md"
      @close="closeDetailModal"
    >
      <div v-if="detailUser" class="detail-user-wrap">

        <!-- Avatar + Identitas -->
        <div class="detail-header">
          <img
            :src="store.getImageUrl(detailUser.image, detailUser.fullname)"
            :alt="detailUser.fullname"
            class="detail-avatar"
          />
          <div class="detail-identity">
            <p class="detail-name">{{ detailUser.fullname }}</p>
            <p class="detail-username">@{{ detailUser.username }}</p>
            <span
              class="detail-status-badge"
              :class="detailUser.is_active ? 'badge-active' : 'badge-inactive'"
            >
              {{ detailUser.is_active ? 'Aktif' : 'Non-Aktif' }}
            </span>
          </div>
        </div>

        <!-- Info List -->
        <div class="detail-list">
          <div class="detail-row">
            <span class="detail-label">Email</span>
            <span class="detail-value">{{ detailUser.email }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Role</span>
            <span class="badge-role">{{ detailUser.role?.role ?? '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Division</span>
            <span class="badge-division">{{ detailUser.division?.name_division ?? '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Group</span>
            <span class="badge-group">{{ detailUser.groups?.name_group ?? '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Created At</span>
            <span class="detail-value">{{ store.formatDate(detailUser.created_at) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Updated At</span>
            <span class="detail-value">{{ store.formatDate(detailUser.updated_at) }}</span>
          </div>
        </div>

      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeDetailModal">Close</button>
      </template>
    </AppModal>

    <!-- ════════════════════════════════════════
         MODAL ACCESS USER TO SUBMENU
    ════════════════════════════════════════ -->
    <div v-if="isAccessModalVisible" class="modal-overlay" @click.self="closeAccessModal">
      <div class="modal-access-box modal-access-xl mt-5">

        <!-- Header -->
        <div class="modal-access-header">
          <div class="modal-access-title">
            <font-awesome-icon icon="shield-halved" class="modal-access-icon" />
            Access User to SubMenu
          </div>
          <button class="modal-close-btn" @click="closeAccessModal">
            <font-awesome-icon icon="xmark" />
          </button>
        </div>

        <!-- Body -->
        <div class="modal-access-body">

          <!-- User Info -->
          <div class="access-role-info">
            <img
              :src="store.getImageUrl(accessTargetUser?.image, accessTargetUser?.fullname)"
              :alt="accessTargetUser?.fullname"
              class="access-user-avatar"
            />
            <div>
              <p class="access-user-name">{{ accessTargetUser?.fullname }}</p>
              <p class="access-user-email">{{ accessTargetUser?.email }}</p>
            </div>
          </div>

          <!-- Toolbar: per-page + search + reset -->
          <div class="access-toolbar">
            <div class="access-toolbar-left">
              <div class="showing-wrap">
                <span class="showing-label">Showing:</span>
                <div class="drop-wrap">
                  <select
                    v-model.number="accessSubMenu.pagination.per_page"
                    class="btn-select"
                    style="appearance:auto;"
                    @change="accessSubMenu.changePageSize()"
                  >
                    <option :value="10">10</option>
                    <option :value="25">25</option>
                    <option :value="50">50</option>
                    <option :value="100">100</option>
                  </select>
                </div>
              </div>

              <button class="btn-toolbar btn-orange" style="padding:6px 12px;" @click="accessSubMenu.resetFilters()">
                <font-awesome-icon icon="rotate-left" /> Reset
              </button>
            </div>

            <div class="access-toolbar-right">
              <div class="search-wrap">
                <input
                  :value="accessSubMenu.searchAccessSubMenu"
                  type="text"
                  placeholder="Search submenu..."
                  class="search-input"
                  @input="accessSubMenu.searchWithDelay($event.target.value)"
                />
                <button class="search-btn"><font-awesome-icon icon="magnifying-glass" /></button>
              </div>
            </div>
          </div>

          <!-- Table -->
          <div class="access-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width:50px; text-align:center">#</th>
                  <th>MENU</th>
                  <th>SUBMENU</th>
                  <th style="width:70px; text-align:center">VIEW</th>
                  <th style="width:70px; text-align:center">CREATE</th>
                  <th style="width:70px; text-align:center">UPDATE</th>
                  <th style="width:70px; text-align:center">DELETE</th>
                </tr>
              </thead>
              <tbody>

                <!-- Loading -->
                <tr v-if="accessSubMenu.loadingAccessSubMenu">
                  <td colspan="7" class="td-center">
                    <div style="display:flex; justify-content:center;">
                      <div class="spinner-custom"></div>
                    </div>
                  </td>
                </tr>

                <!-- Empty -->
                <tr v-else-if="!accessSubMenu.accessSubMenuData.length">
                  <td colspan="7" class="td-center">
                    <div class="empty-state">
                      <font-awesome-icon icon="inbox" class="empty-icon" />
                      <div class="empty-text">Data akses tidak ditemukan</div>
                    </div>
                  </td>
                </tr>

                <!-- Data -->
                <tr
                  v-else
                  v-for="(row, index) in accessSubMenu.accessSubMenuData"
                  :key="`${row.id_user}-${row.id_submenu}`"
                  class="data-row"
                >
                  <td class="td-no" style="text-align:center">
                    {{ index + 1 + accessSubMenu.pagination.per_page * (accessSubMenu.pagination.current_page - 1) }}
                  </td>
                  <td class="td-bold">{{ row.menu_name ?? '-' }}</td>
                  <td class="td-muted">{{ row.submenu_name ?? '-' }}</td>

                  <!-- 4 Checkbox Permission -->
                  <td style="text-align:center">
                    <input
                      type="checkbox"
                      v-model="row.can_view"
                      class="perm-check"
                      @change="handlePermissionChange(row)"
                    />
                  </td>
                  <td style="text-align:center">
                    <input
                      type="checkbox"
                      v-model="row.can_create"
                      class="perm-check"
                      @change="handlePermissionChange(row)"
                    />
                  </td>
                  <td style="text-align:center">
                    <input
                      type="checkbox"
                      v-model="row.can_update"
                      class="perm-check"
                      @change="handlePermissionChange(row)"
                    />
                  </td>
                  <td style="text-align:center">
                    <input
                      type="checkbox"
                      v-model="row.can_delete"
                      class="perm-check"
                      @change="handlePermissionChange(row)"
                    />
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

          <p class="access-note">
            <font-awesome-icon icon="circle-info" />
            Checklist untuk mengatur hak akses user (View, Create, Update, Delete) per submenu.
          </p>

        </div>

        <!-- Footer Pagination -->
        <div class="modal-access-footer">
          <div class="pagination-nav">
            <button
              class="btn-prev-next"
              :disabled="!accessSubMenu.pagination.prev_page_url || accessSubMenu.loadingAccessSubMenu"
              @click="accessSubMenu.fetchAccessSubMenu(accessSubMenu.pagination.prev_page_url)"
            >
              <font-awesome-icon icon="circle-left" /> Prev
            </button>
            <button
              class="btn-prev-next"
              :disabled="!accessSubMenu.pagination.next_page_url || accessSubMenu.loadingAccessSubMenu"
              @click="accessSubMenu.fetchAccessSubMenu(accessSubMenu.pagination.next_page_url)"
            >
              Next <font-awesome-icon icon="circle-right" />
            </button>
          </div>

          <div class="page-badges">
            <span class="page-badge">
              {{ accessSubMenu.accessSubMenuData.length }} DATA | PAGE {{ accessSubMenu.pagination.current_page }}
            </span>
            <span class="page-badge">TOTAL: {{ accessSubMenu.pagination.total }}</span>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
/* ── CSS VARIABLES ── */
.h-100 {
  --text-muted:    #64748b;
  --primary-color: #6366f1;
}
.form-container-gap { display: flex; flex-direction: column; gap: 14px; }

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
.btn-toolbar:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover:not(:disabled) { background: #4f46e5; }
.btn-orange { background: #f59e0b; color: #fff; }
.btn-orange:hover:not(:disabled) { background: #d97706; }
.btn-arrow { font-size: 0.6rem; opacity: 0.7; }

/* ── CONTROLS ── */
.controls-card { background: var(--bg-card); border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); }
.controls-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.controls-left, .controls-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.showing-wrap { display: flex; align-items: center; gap: 6px; font-size: 0.84rem; color: var(--text-primary); font-weight: 600; }
.showing-label { white-space: nowrap; color: var(--text-muted); font-size: 0.83rem; }
.search-wrap { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.search-input { padding: 7px 12px; border: none; background: transparent; color: var(--text-primary); font-size: 0.84rem; outline: none; width: 200px; }
.search-input::placeholder { color: var(--text-muted); }
.search-btn { padding: 7px 12px; background: #6366f1; color: #fff; border: none; cursor: pointer; }
.search-btn:hover { background: #4f46e5; }
.sort-wrap { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

/* ── DROPDOWN ── */
.drop-wrap { position: relative; }
.btn-select { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.83rem; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
.btn-select:hover { border-color: #6366f1; color: #6366f1; }
.drop-menu { position: absolute; top: calc(100% + 6px); left: 0; min-width: 160px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 10px; z-index: 300; opacity: 0; transform: translateY(-6px); pointer-events: none; transition: all 0.18s ease; }
.drop-right { left: auto; right: 0; }
.drop-menu.show { opacity: 1; transform: translateY(0); pointer-events: all; }
.drop-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; padding: 0 4px; }
.drop-item { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: none; border: none; border-radius: 7px; color: var(--text-primary); font-size: 0.84rem; cursor: pointer; text-align: left; }
.drop-item:hover { background: var(--bg-nav-hover); }
.drop-item.active { color: #6366f1; font-weight: 600; background: rgba(99,102,241,0.08); }
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

/* Badges tabel */
.badge-role     { display: inline-block; padding: 2px 9px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; background: rgba(59,130,246,0.1);  color: #2563eb; border: 1px solid rgba(59,130,246,0.2); }
.badge-division { display: inline-block; padding: 2px 9px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; background: rgba(139,92,246,0.1); color: #7c3aed; border: 1px solid rgba(139,92,246,0.2); }
.badge-group    { display: inline-block; padding: 2px 9px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; background: rgba(16,185,129,0.1); color: #059669; border: 1px solid rgba(16,185,129,0.2); }

/* User avatar tabel */
.user-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--border-main); box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: block; margin: 0 auto; }

/* Empty state */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.empty-icon  { font-size: 2.5rem; color: var(--border-main); }
.empty-text  { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }

/* Spinner */
.spinner-custom { width: 32px; height: 32px; border: 3px solid var(--border-main); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── ACTION BUTTONS ── */
.act-btn { width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s ease; margin: 0 2px; background: transparent; }
.act-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.act-edit         { color: #f59e0b; border-color: #f59e0b; }
.act-edit:hover   { background: #f59e0b; color: #fff; }
.act-delete       { color: #ef4444; border-color: #ef4444; }
.act-delete:hover { background: #ef4444; color: #fff; }
.act-info         { color: #6366f1; border-color: #6366f1; }
.act-info:hover   { background: #6366f1; color: #fff; }
.act-access       { color: #8b5cf6; border-color: #8b5cf6; }
.act-access:hover { background: #8b5cf6; color: #fff; }

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
.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 560px) { .form-grid-2 { grid-template-columns: 1fr; } }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; display: flex; align-items: center; gap: 6px; }
.label-hint { font-size: 0.7rem; font-weight: 500; color: #f59e0b; text-transform: none; letter-spacing: 0; }

.form-input { padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.875rem; background: var(--bg-input); color: var(--text-primary); outline: none; transition: border 0.18s; width: 100%; box-sizing: border-box; }
.form-input:focus { border-color: #6366f1; }
.input-error { border-color: #ef4444 !important; }
.field-error { font-size: 0.75rem; color: #ef4444; }

.form-select {
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 1.25rem;
  padding-right: 36px;
}

/* Photo upload */
.photo-upload-wrap { display: flex; align-items: center; gap: 16px; }
.photo-preview { width: 72px; height: 72px; border-radius: 12px; object-fit: cover; border: 2px solid var(--border-main); flex-shrink: 0; }
.photo-upload-info { display: flex; flex-direction: column; gap: 6px; }
.photo-hint { font-size: 0.75rem; color: var(--text-muted); margin: 0; }
.photo-filename { font-size: 0.75rem; color: #059669; margin: 0; font-weight: 500; }
.hidden-input { display: none; }

/* ── MODAL FOOTER ── */
.btn-cancel { padding: 8px 18px; background: var(--bg-main, #f1f5f9); color: var(--text-muted); border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover:not(:disabled) { background: var(--border-main); color: var(--text-primary); }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.18s; }
.btn-save:hover:not(:disabled) { background: #4f46e5; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── DETAIL MODAL ── */
.detail-user-wrap { display: flex; flex-direction: column; gap: 0; }
.detail-header { display: flex; align-items: center; gap: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--border-main); margin-bottom: 4px; }
.detail-avatar { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; border: 2px solid var(--border-main); flex-shrink: 0; }
.detail-identity { display: flex; flex-direction: column; gap: 4px; }
.detail-name { font-size: 1rem; font-weight: 800; color: var(--text-primary); margin: 0; }
.detail-username { font-size: 0.82rem; color: var(--text-muted); margin: 0; }
.detail-status-badge { display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 2px 10px; border-radius: 99px; }
.badge-active   { background: rgba(16,185,129,0.1); color: #059669; }
.badge-inactive { background: rgba(239,68,68,0.1);  color: #dc2626; }

.detail-list { display: flex; flex-direction: column; }
.detail-row { display: flex; align-items: center; justify-content: space-between; padding: 11px 0; border-bottom: 1px solid var(--border-main); gap: 12px; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.detail-value { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); }

/* ══════════════════════════════════════════
   ACCESS SUBMENU MODAL — Custom Overlay
══════════════════════════════════════════ */
.modal-overlay {
  position: fixed; inset: 0; z-index: 500;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}

.modal-access-box {
  background: var(--bg-card);
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.modal-access-xl { max-width: 900px; }

.modal-access-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--border-main); flex-shrink: 0;
}
.modal-access-title { display: flex; align-items: center; gap: 10px; font-size: 1rem; font-weight: 800; color: var(--text-primary); }
.modal-access-icon { color: #8b5cf6; font-size: 1.1rem; }
.modal-close-btn { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; background: var(--bg-input); border: 1px solid var(--border-main); border-radius: 7px; cursor: pointer; color: var(--text-muted); transition: all 0.15s; }
.modal-close-btn:hover { background: #ef4444; border-color: #ef4444; color: #fff; }

.modal-access-body { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }

/* User info strip */
.access-role-info { display: flex; align-items: center; gap: 12px; background: var(--bg-input); border: 1px solid var(--border-main); border-radius: 10px; padding: 10px 14px; }
.access-user-avatar { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; border: 1.5px solid var(--border-main); flex-shrink: 0; }
.access-user-name  { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.access-user-email { font-size: 0.78rem; color: var(--text-muted); margin: 0; }

/* Toolbar modal */
.access-toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.access-toolbar-left  { display: flex; align-items: center; gap: 8px; }
.access-toolbar-right { display: flex; align-items: center; gap: 8px; }

.access-table-wrap { border: 1px solid var(--border-main); border-radius: 10px; overflow: hidden; }
.access-table-wrap .data-table thead tr { position: static; }

/* Permission checkboxes */
.perm-check { width: 16px; height: 16px; cursor: pointer; accent-color: #8b5cf6; }

.access-note { font-size: 0.78rem; color: var(--text-muted); font-style: italic; display: flex; align-items: center; gap: 6px; margin: 0; }

.modal-access-footer {
  padding: 14px 20px; border-top: 1px solid var(--border-main);
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; flex-shrink: 0;
}
</style>