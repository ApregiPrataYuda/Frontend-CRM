<script setup>
import { ref, onMounted, computed } from 'vue'
import AppModal from '@/components/AppModal.vue'
import { useConfirm } from '@/composables/useConfirm'
import { useEmployeStore } from '@/stores/employeStore'
import { usePermissionStore } from '@/stores/permissionStore'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'

const { confirm } = useConfirm()
const store = useEmployeStore()
const permission = usePermissionStore()
const route      = useRoute()
const toast = useToast()


// ── PERMISSIONS ────────────────────────────
const currentUrl = computed(() => route.path.replace('/app', ''))
const canCreate  = computed(() => permission.canCreate(currentUrl.value))
const canUpdate  = computed(() => permission.canUpdate(currentUrl.value))
const canDelete  = computed(() => permission.canDelete(currentUrl.value))
const canView    = computed(() => permission.canView(currentUrl.value))


// ── FETCH AWAL ─────────────────────────────

onMounted(async () => {
  await store.fetchEmploye()
  await store.fetchUserSelect()
})

const showExportEmploye  = ref(false)
const showImportEmploye  = ref(false)
const showPerPageEmploye = ref(false)
const showSortByEmploye  = ref(false)
const showSortDirEmploye = ref(false)

const sortByOptions = [
  { label: 'Created Date', value: 'created_at' },
  { label: 'Employe NIK',    value: 'nik' },
]
const sortByLabel = () =>
  sortByOptions.find(o => o.value === store.sort.column)?.label ?? 'Created Date'










// Add / Edit Modal States
// ── Add / Edit Modal States ──
const isAddModalVisible  = ref(false)
const isEdit             = ref(false)
const selectedEditItem   = ref(null)
const formErrors        = ref({})

const form = ref({
  user_id:          '',
  nik:              '',
  tempat_lahir:     '',
  tanggal_lahir:    '',
  jenis_kelamin:    'L',
  no_hp:            '',
  tanggal_masuk:    '',
  office_id:        '',
  attendance_mode:  'FREE',
  status_karyawan:  'CONTRACT',
  alamat:           '',
})

const resetForm = () => {
  form.value = {
    user_id: '', nik: '', tempat_lahir: '', tanggal_lahir: '',
    jenis_kelamin: 'L', no_hp: '', tanggal_masuk: '',
    office_id: '', attendance_mode: '', status_karyawan: '', alamat: '',
  }
  // reset select states
  selectedUser.value       = null
  selectedGender.value     = null
  selectedOffice.value     = null
  selectedAttendance.value = null
  selectedStatus.value     = null
}



function openAddModal() {
  isEdit.value = false
  selectedEditItem.value = null
  resetForm()
  store.fetchUserSelect()
  store.fetchOfficeSelect()  // ← tambah ini
  isAddModalVisible.value = true
}

async function openEditModal(item) {
  isEdit.value           = true
  selectedEditItem.value = item

  form.value = {
    user_id:         item.user_id,
    nik:             item.nik,
    tempat_lahir:    item.tempat_lahir,
    tanggal_lahir:   item.tanggal_lahir,
    jenis_kelamin:   item.jenis_kelamin,
    no_hp:           item.no_hp,
    tanggal_masuk:   item.tanggal_masuk,
    office_id:       item.office_id,
    attendance_mode: item.attendance_mode,
    status_karyawan: item.status_karyawan,
    alamat:          item.alamat,
  }

  // fetch dulu, baru sync
  await Promise.all([
    store.fetchUserSelect(),
    store.fetchOfficeSelect(),
  ])

  // sync semua custom select
  selectedUser.value       = store.userSelectData.find(u => u.id_user === item.user_id) ?? null
  selectedGender.value     = store.statusGender.find(g => g.value === item.jenis_kelamin) ?? null
  selectedOffice.value     = store.officeSelectData.find(o => o.id === item.office_id) ?? null
  selectedAttendance.value = store.AttendanceMode.find(a => a.value === item.attendance_mode) ?? null
  selectedStatus.value     = store.statusJobsEmploye.find(s => s.value === item.status_karyawan) ?? null

  isAddModalVisible.value = true
}

const closeAddModal = () => {
  isAddModalVisible.value = false
  resetForm()
}






// for form select user
const selectedUser = ref(null)
const searchUser   = ref('')
const isOpenUser   = ref(false)

const filteredUsers = computed(() => {
  if (!store.userSelectData) return []
  if (!searchUser.value) return store.userSelectData
  return store.userSelectData.filter(m =>
    m.fullname?.toLowerCase().includes(searchUser.value.toLowerCase())
  )
})

function selectUser(user) {
  selectedUser.value  = user
  form.value.user_id  = user.id_user  // ← fix, bukan id_menu
  isOpenUser.value    = false
  searchUser.value    = ''
}

function clearUser() {
  selectedUser.value = null
  form.value.user_id = ''  // ← fix, bukan id_menu
}


function getError(field) {
  if (!formErrors.value || typeof formErrors.value !== 'object') return null
  return Array.isArray(formErrors.value[field])
    ? formErrors.value[field][0]
    : formErrors.value[field] ?? null
}


// Select select gender
const selectedGender  = ref(null)
const isOpenGender    = ref(false)
const GenderOptions   = [
  { value: 'L',  label: 'Male' },
  { value: 'P', label: 'Female' },
]

function selectGender(opt) {
  selectedGender.value  = opt
  form.value.jenis_kelamin  = opt.value
  isOpenGender.value    = false
}

function clearGender() {
  selectedGender.value = null
  form.value.jenis_kelamin = ''
}


// Office Select
const selectedOffice  = ref(null)
const isOpenOffice    = ref(false)

function selectOffice(opt) {
  selectedOffice.value   = opt
  form.value.office_id   = opt.id
  isOpenOffice.value     = false
}
function clearOffice() {
  selectedOffice.value = null
  form.value.office_id = ''
}

// Attendance Mode Select
const selectedAttendance = ref(null)
const isOpenAttendance   = ref(false)

function selectAttendance(opt) {
  selectedAttendance.value      = opt
  form.value.attendance_mode    = opt.value
  isOpenAttendance.value        = false
}
function clearAttendance() {
  selectedAttendance.value   = null
  form.value.attendance_mode = ''
}

// Employee Status Select
const selectedStatus = ref(null)
const isOpenStatus   = ref(false)

function selectStatus(opt) {
  selectedStatus.value       = opt
  form.value.status_karyawan = opt.value
  isOpenStatus.value         = false
}
function clearStatus() {
  selectedStatus.value       = null
  form.value.status_karyawan = ''
}


async function submitAddData() {
  formErrors.value = {}

  // validasi client side
  if (!form.value.user_id)             return formErrors.value = { user_id: 'User wajib dipilih!' }
  if (!form.value.nik.trim())          return formErrors.value = { nik: 'NIK wajib diisi!' }
  if (!form.value.no_hp.trim())        return formErrors.value = { no_hp: 'No. HP wajib diisi!' }
  if (!form.value.office_id)           return formErrors.value = { office_id: 'Office wajib dipilih!' }
  if (!form.value.attendance_mode)     return formErrors.value = { attendance_mode: 'Attendance mode wajib dipilih!' }
  if (!form.value.status_karyawan)     return formErrors.value = { status_karyawan: 'Status karyawan wajib dipilih!' }

  try {
    if (isEdit.value && selectedEditItem.value) {
      await store.updateEmploye(selectedEditItem.value.id_employee, form.value)
      toast.success('Data employee berhasil diupdate!')
    } else {
      await store.storeEmploye(form.value)
      toast.success('Data employee berhasil ditambahkan!')
    }
    closeAddModal()
  } catch (err) {
    // error 422 dari laravel (validasi server)
    if (store.errorEmploye) {
      formErrors.value = store.errorEmploye
    } else {
      toast.error('Terjadi kesalahan, coba lagi.')
    }
  }
}



// Detail Modal States
const isDetailModalVisible = ref(false)
const detailItem           = ref(null)

async function openDetailModal(item) {
  isDetailModalVisible.value = true
  await store.detailEmploye(item.id_employee)
  detailItem.value = store.employeDetail
}

function closeDetailModal() {
  isDetailModalVisible.value = false
  detailItem.value = null
}

// Mengganti fungsionalitas Delete lama menggunakan async/await useConfirm
async function openDeleteModal(item) {
  const isConfirmed = await confirm({
    type: 'danger',
    title: 'Hapus Data Employee',
    message: `Yakin ingin menghapus employee "${item.user.fullname}"?`,
    detail: 'Tindakan ini tidak bisa dibatalkan dan akan menghapus data secara permanen.',
    confirmText: 'Yes, Delete',
    cancelText: 'Cancel'
  })

  if (isConfirmed) {
    try {
      await store.deleteEmploye(item.id_employee)
      toast.success(`Employee "${item.user.fullname}" berhasil dihapus!`)
    } catch (err) {
      toast.error('Gagal menghapus employee, coba lagi.')
    }
  }
}
</script>

<template>
  <div class="h-100 d-flex flex-column">
    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="table-list" /> Master Employe Management
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" /> Dashboard
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Employe Table</span>
        </div>
      </div>
    </div>

    <div class="toolbar-top">
      <div class="toolbar-left">
        <div class="drop-wrap">
          <button class="btn-toolbar btn-purple" >
            <font-awesome-icon icon="upload" /> Exports
            <font-awesome-icon icon="chevron-down" class="btn-arrow" />
          </button>
          <div class="drop-menu">
            <div class="drop-label">Export Data</div>
            <button class="drop-item" >
              <font-awesome-icon icon="file-csv" style="color:#22c55e" /> Export CSV
            </button>
            <button class="drop-item" >
              <font-awesome-icon icon="file-excel" style="color:#16a34a" /> Export Excel
            </button>
            <button class="drop-item" >
              <font-awesome-icon icon="file-pdf" style="color:#ef4444" /> Export PDF
            </button>
          </div>
        </div>

        <div class="drop-wrap">
          <button class="btn-toolbar btn-purple">
            <font-awesome-icon icon="download" /> Imports
            <font-awesome-icon icon="chevron-down" class="btn-arrow" />
          </button>
          <div class="drop-menu" >
            <div class="drop-label">Import Data</div>
            <button class="drop-item">
              <font-awesome-icon icon="file-csv" style="color:#22c55e" /> Import CSV
            </button>
          </div>
        </div>
      </div>

      <button class="btn-toolbar btn-orange" @click="store.resetFilters()">
        <font-awesome-icon icon="rotate-left" /> Reset
      </button>
    </div>

    <div class="controls-card">
      <div class="controls-row">
        <div class="controls-left">
          <div class="showing-wrap">
            <font-awesome-icon icon="list" class="text-muted-color" />
            <span class="showing-label">Showing:</span>
            <div class="drop-wrap">
              <button class="btn-select" @click="showPerPageEmploye = !showPerPageEmploye">
                {{ store.pagination.per_page }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showPerPageEmploye }">
                <div class="drop-label">Per halaman</div>
                <div class="perpage-grid">
                  <button
                    v-for="opt in [5, 10, 25, 50]" :key="opt"
                    class="perpage-opt"
                    :class="{ active: store.pagination.per_page === opt }"
                    @click="store.pagination.per_page = opt; showPerPageEmploye = false; store.changePageSize()"
                  >{{ opt }}</button>
                </div>
              </div>
            </div>
          </div>

          <button class="btn-toolbar btn-purple" @click="openAddModal">
            <font-awesome-icon icon="plus" /> Add Data
          </button>
        </div>

        <div class="controls-right">
          <div class="search-wrap">
              <input
              :value="store.searchEmploye"
              type="text"
              placeholder="Search Employe..."
              class="search-input"
              @input="store.searchWithDelay($event.target.value)"
            />
            <button class="search-btn"><font-awesome-icon icon="magnifying-glass" /></button>
          </div>
          <div class="sort-wrap">
            <span class="showing-label">Sort:</span>

           <div class="drop-wrap">
              <button class="btn-select" @click="showSortByEmploye = !showSortByEmploye">
                {{ sortByLabel() }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showSortByEmploye }">
                <div class="drop-label">Sort By</div>
                <button
                  v-for="opt in sortByOptions" :key="opt.value"
                  class="drop-item"
                  :class="{ active: store.sort.column === opt.value }"
                  @click="store.toggleSort(opt.value); showSortByEmploye = false"
                >{{ opt.label }}</button>
              </div>
            </div>


            <div class="drop-wrap">
              <button class="btn-select" @click="showSortDirEmploye = !showSortDirEmploye">
                {{ store.sort.direction === 'asc' ? 'Asc' : 'Desc' }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-right" :class="{ show: showSortDirEmploye }">
                <div class="drop-label">Urutan</div>
                <button
                  v-for="opt in ['desc', 'asc']" :key="opt"
                  class="drop-item"
                  :class="{ active: store.sort.direction === opt }"
                  @click="store.sort.direction = opt; store.changeSorting(); showSortDirEmploye = false"
                >{{ opt === 'asc' ? 'Asc' : 'Desc' }}</button>
              </div>
            </div>

            
            
          </div>
        </div>
      </div>
    </div>

    <div class="table-card flex-grow-1 overflow-auto mb-3">
     <table class="data-table">
        <thead>
          <tr>
            <th style="width:44px">NO</th>
            <th style="width:100px">TYPE</th>
            <th>NAME</th>
            <th style="width:160px">USERNAME / NIK</th>
            <th style="width:200px">EMAIL</th>
            <th style="width:180px">GROUP COMPANY & PHOTO</th>
            <th style="width:140px">DIVISION</th>
            <th style="width:110px; text-align:center">ACTIONS</th>
          </tr>
        </thead>
            <tbody>

              <!-- Loading -->
              <tr v-if="store.loadingEmploye">
                <td colspan="8" class="td-center">
                  <div style="display:flex; justify-content:center;">
                    <div class="spinner-custom"></div>
                  </div>
                </td>
              </tr>

              <!-- Empty -->
              <tr v-else-if="!store.employeData.length">
                <td colspan="8" class="td-center">
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

              <template
                v-else
                v-for="(item, index) in store.employeData"
                :key="item.id_employee"
              >
                <!-- ── Baris 1: EMPLOYEE ── -->
                <tr class="row-employee">
                  <td style="text-align:center; vertical-align:middle;" rowspan="2">
                    {{ (store.pagination.current_page - 1) * store.pagination.per_page + index + 1 }}
                  </td>
                  <td>
                    <span class="type-badge type-employee">EMPLOYEE</span>
                  </td>
                  <td style="font-weight:600;">{{ item.user.fullname }}</td>
                  <td style="font-family:monospace; font-weight:500;">{{ item.nik }}</td>
                  <td style="font-weight:500;">{{ item.user.email }}</td>
                  <td>{{ item.user.group.name_group }}</td>
                  <td>{{ item.user.division.name_division }}</td>
                  


                   <td class="td-actions">
                     <button
                      class="act-btn act-edit"
                      title="Edit"
                      @click="openEditModal(item)"
                    >
                      <font-awesome-icon icon="pen-to-square" />
                    </button>

                      <button
                        class="act-btn act-delete"
                        title="Hapus"
                        @click="openDeleteModal(item)"
                      >
                        <font-awesome-icon icon="trash-can" />
                      </button>

                      <button
                        class="act-btn act-info"
                        @click="openDetailModal(item)"
                        title="Detail"
                      >
                        <font-awesome-icon icon="circle-info" />
                      </button>

                  </td>
                </tr>

                <!-- ── Baris 2: USER ── -->
                <tr class="row-user-sub">
                  <td>
                    <div style="display:flex; align-items:center; gap:6px;">
                      <span style="color:#aaa; font-size:14px;">↳</span>
                      <span class="type-badge type-user">USER</span>
                    </div>
                  </td>
                  <td class="td-muted">{{ item.user.fullname }}</td>
                  <td class="td-muted">{{ item.user.username }}</td>
                  <td class="td-muted">{{ item.user.email }}</td>
                  <td>
                    <img
                      :src="store.getImageUrl(item.user.image, item.user.fullname)"
                      :alt="item.user.fullname"
                      style="width:36px; height:36px; border-radius:50%; object-fit:cover;"
                    />
                  </td>
                  <td></td>
                </tr>
              </template>

            </tbody>
    </table>
    </div>

   <div class="pagination-card">
      <div class="pagination-nav">
        <button
          class="btn-prev-next"
          :disabled="store.pagination.current_page === 1"
          @click="store.fetchEmploye(store.pagination.prev_page_url)"
        >
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button
          class="btn-prev-next"
          :disabled="store.pagination.current_page === store.pagination.last_page"
          @click="store.fetchEmploye(store.pagination.next_page_url)"
        >
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">
          {{ store.employeData.length }} DATA | PAGE {{ store.pagination.current_page }}
        </span>
        <span class="page-badge">TOTAL: {{ store.pagination.total }}</span>
      </div>
    </div>



    


    <!-- Add/Edit Modal -->
<AppModal
  :show="isAddModalVisible"
  :title="isEdit ? 'Edit Employe' : 'Add New Employe'"
  :icon="isEdit ? 'pen' : 'plus'"
  size="md"
  @close="closeAddModal"
>
  <div class="form-container-gap">

   
    <div class="form-group">
  <label>User <span class="required">*</span></label>
  <div class="custom-select" :class="{ 'is-error': getError('user_id') }">
    <div class="custom-select-trigger" @click="isOpenUser = !isOpenUser">
      <span v-if="!selectedUser" class="placeholder">Select User...</span>
      <span v-else class="selected-tag">
        {{ selectedUser.fullname }}
        <button type="button" @click.stop="clearUser">x</button>
      </span>
      <font-awesome-icon icon="chevron-down" class="select-arrow" :class="{ rotated: isOpenUser }" />
    </div>
    <div class="custom-select-dropdown" v-if="isOpenUser">
      <input
        v-model="searchUser"
        type="text"
        placeholder="search user..."
        class="select-search"
        @click.stop
      />
      <div class="select-options">
        <p v-if="!filteredUsers.length" class="select-empty">Not found</p>
        <div
          v-for="users in filteredUsers"
          :key="users.id_user"
          class="select-option"
          :class="{ active: selectedUser?.id_user === users.id_user }"
          @click="selectUser(users)"
        >
          {{ users.fullname }}
        </div>
      </div>
    </div>
  </div>
  <p v-if="getError('user_id')" class="error-text">{{ getError('user_id') }}</p>
</div>


<!-- NIK -->
<div class="form-group">
  <label>NIK <span class="required">*</span></label>
  <input
    v-model="form.nik"
    class="form-input"
    :class="{ 'is-error': getError('nik') }"
    placeholder="e.g. EMP-001"
  />
  <p v-if="getError('nik')" class="error-msg">{{ getError('nik') }}</p>
</div>


    <!-- Row 2: Place of Birth & Date of Birth -->
    <div class="form-row-2">
      <div class="form-group">
        <label>Place of Birth</label>
        <input v-model="form.tempat_lahir" class="form-input" placeholder="e.g. Jakarta" />
      </div>
      <div class="form-group">
        <label>Date of Birth</label>
        <input v-model="form.tanggal_lahir" type="date" class="form-input" />
      </div>
    </div>

    <!-- Row 3: Gender & No. Mobile Phone -->
    <div class="form-row-2">


          <div class="form-group">
            <label>Status</label>
            <div class="custom-select" :class="{ 'is-error': getError('is_active') }">
              <div class="custom-select-trigger" @click="isOpenGender = !isOpenGender">
                <span v-if="!selectedGender" class="placeholder">SELECT GENDER...</span>
                <span v-else class="selected-tag">
                  {{ selectedGender.label }}
                  <button type="button" @click.stop="clearGender">×</button>
                </span>
                <font-awesome-icon icon="chevron-down" class="select-arrow" :class="{ rotated: isOpenGender }" />
              </div>
              <div class="custom-select-dropdown" v-if="isOpenGender">
                <div class="select-options">
                  <div
                    v-for="opt in GenderOptions"
                    :key="opt.value"
                    class="select-option"
                    :class="{ active: selectedGender?.value === opt.value }"
                    @click="selectGender(opt)"
                  >{{ opt.label }}</div>
                </div>
              </div>
            </div>
            <p class="error-msg" v-if="getError('jenis_kelamin')">{{ getError('jenis_kelamin') }}</p>
          </div>


      <div class="form-group">
        <label>No. Mobile Phone</label>
        <input v-model="form.no_hp" class="form-input" placeholder="e.g. 08123456789" />
      </div>
    </div>

   
    <!-- Row 4: Date Join & Office -->
<div class="form-row-2">
  <div class="form-group">
    <label>Date Join</label>
    <input v-model="form.tanggal_masuk" type="date" class="form-input" />
  </div>

  <!-- Office Custom Select -->
  <div class="form-group">
    <label>Office Employee <span class="required">*</span></label>
    <div class="custom-select" :class="{ 'is-error': getError('office_id') }">
      <div class="custom-select-trigger" @click="isOpenOffice = !isOpenOffice">
        <span v-if="!selectedOffice" class="placeholder">Select Office...</span>
        <span v-else class="selected-tag">
          {{ selectedOffice.office_name }}
          <button type="button" @click.stop="clearOffice">×</button>
        </span>
        <font-awesome-icon icon="chevron-down" class="select-arrow" :class="{ rotated: isOpenOffice }" />
      </div>
      <div class="custom-select-dropdown" v-if="isOpenOffice">
        <div class="select-options">
          <p v-if="!store.officeSelectData.length" class="select-empty">Not found</p>
          <div
            v-for="opt in store.officeSelectData"
            :key="opt.id"
            class="select-option"
            :class="{ active: selectedOffice?.id === opt.id }"
            @click="selectOffice(opt)"
          >{{ opt.office_name }}</div>
        </div>
      </div>
    </div>
    <p v-if="getError('office_id')" class="error-msg">{{ getError('office_id') }}</p>
  </div>
</div>

<!-- Row 5: Attendance Mode & Employee Status -->
<div class="form-row-2">

  <!-- Attendance Mode Custom Select -->
  <div class="form-group">
    <label>Attendance Mode <span class="required">*</span></label>
    <div class="custom-select" :class="{ 'is-error': getError('attendance_mode') }">
      <div class="custom-select-trigger" @click="isOpenAttendance = !isOpenAttendance">
        <span v-if="!selectedAttendance" class="placeholder">Select Mode...</span>
        <span v-else class="selected-tag">
          {{ selectedAttendance.label }}
          <button type="button" @click.stop="clearAttendance">×</button>
        </span>
        <font-awesome-icon icon="chevron-down" class="select-arrow" :class="{ rotated: isOpenAttendance }" />
      </div>
      <div class="custom-select-dropdown" v-if="isOpenAttendance">
        <div class="select-options">
          <div
            v-for="opt in store.AttendanceMode"
            :key="opt.value"
            class="select-option"
            :class="{ active: selectedAttendance?.value === opt.value }"
            @click="selectAttendance(opt)"
          >{{ opt.label }}</div>
        </div>
      </div>
    </div>
    <p v-if="getError('attendance_mode')" class="error-msg">{{ getError('attendance_mode') }}</p>
  </div>

  <!-- Employee Status Custom Select -->
  <div class="form-group">
    <label>Employee Status <span class="required">*</span></label>
    <div class="custom-select" :class="{ 'is-error': getError('status_karyawan') }">
      <div class="custom-select-trigger" @click="isOpenStatus = !isOpenStatus">
        <span v-if="!selectedStatus" class="placeholder">Select Status...</span>
        <span v-else class="selected-tag">
          {{ selectedStatus.label }}
          <button type="button" @click.stop="clearStatus">×</button>
        </span>
        <font-awesome-icon icon="chevron-down" class="select-arrow" :class="{ rotated: isOpenStatus }" />
      </div>
      <div class="custom-select-dropdown" v-if="isOpenStatus">
        <div class="select-options">
          <div
            v-for="opt in store.statusJobsEmploye"
            :key="opt.value"
            class="select-option"
            :class="{ active: selectedStatus?.value === opt.value }"
            @click="selectStatus(opt)"
          >{{ opt.label }}</div>
        </div>
      </div>
    </div>
    <p v-if="getError('status_karyawan')" class="error-msg">{{ getError('status_karyawan') }}</p>
  </div>
</div>

<!-- Address -->
<div class="form-group">
  <label>Address</label>
  <textarea
    v-model="form.alamat"
    class="form-input form-textarea"
    rows="3"
    placeholder="e.g. Jl. Merdeka No. 123, Jakarta"
  ></textarea>
  <p v-if="getError('alamat')" class="error-msg">{{ getError('alamat') }}</p>
</div>

  </div>

 <template #footer>
  <button class="btn-cancel" @click="closeAddModal" :disabled="store.savingEmploye || store.updatingEmploye">
    Cancel
  </button>
  <button class="btn-save" @click="submitAddData" :disabled="store.savingEmploye || store.updatingEmploye">
    <span v-if="store.savingEmploye || store.updatingEmploye" class="btn-spinner"></span>
    <font-awesome-icon v-else icon="check" />
    {{ isEdit
      ? (store.updatingEmploye ? 'Updating...' : 'Update')
      : (store.savingEmploye  ? 'Saving...'  : 'Save Data')
    }}
  </button>
</template>
</AppModal>




    <!-- Detail Modal -->
    <AppModal
  :show="isDetailModalVisible"
  title="Employee Details"
  icon="circle-info"
  size="md"
  @close="closeDetailModal"
>
  <!-- Loading -->
  <div v-if="store.loadingDetail" style="display:flex; justify-content:center; padding:32px;">
    <div class="spinner-custom"></div>
  </div>

  <div v-else-if="detailItem" class="detail-list">

    <!-- Header: Avatar + Nama + Status -->
    <div style="display:flex; align-items:center; gap:14px; padding-bottom:16px; border-bottom:1px solid var(--border-main); margin-bottom:4px;">
      <img
        :src="store.getImageUrl(detailItem.user.image, detailItem.user.fullname)"
        :alt="detailItem.user.fullname"
        style="width:52px; height:52px; border-radius:50%; object-fit:cover; border:2px solid var(--border-main);"
      />
      <div style="flex:1;">
        <div style="font-weight:700; font-size:1rem; color:var(--text-primary);">{{ detailItem.user.fullname }}</div>
        <div style="font-size:0.82rem; color:var(--text-muted);">@{{ detailItem.user.username }} · {{ detailItem.user.email }}</div>
      </div>
      <span :class="detailItem.user.is_active ? 'badge-active' : 'badge-inactive'">
        {{ detailItem.user.is_active ? 'Active' : 'Inactive' }}
      </span>
    </div>

    <!-- USER INFO -->
    <div class="detail-section-label">User Information</div>

    <div class="detail-row">
      <span class="detail-label">NIK</span>
      <span class="detail-value mono">{{ detailItem.nik }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">Gender</span>
      <span class="detail-badge">{{ detailItem.jenis_kelamin === 'L' ? 'Male' : 'Female' }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">Place of Birth</span>
      <span class="detail-value">{{ detailItem.tempat_lahir }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">Date of Birth</span>
      <span class="detail-value">{{ store.formatDate(detailItem.tanggal_lahir) }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">No. HP</span>
      <span class="detail-value">{{ detailItem.no_hp }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">Address</span>
      <span class="detail-value" style="text-align:right; max-width:60%;">{{ detailItem.alamat }}</span>
    </div>

    <!-- EMPLOYMENT INFO -->
    <div class="detail-section-label" style="margin-top:8px;">Employment Information</div>

    <div class="detail-row">
      <span class="detail-label">Date Join</span>
      <span class="detail-value">{{ store.formatDate(detailItem.tanggal_masuk) }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">Employee Status</span>
      <span class="detail-badge" :style="{
        background: detailItem.status_karyawan === 'PERMANENT' ? 'rgba(34,197,94,0.1)' : 'rgba(251,191,36,0.1)',
        color:      detailItem.status_karyawan === 'PERMANENT' ? '#16a34a' : '#b45309',
        border:     detailItem.status_karyawan === 'PERMANENT' ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(251,191,36,0.2)',
      }">{{ detailItem.status_karyawan }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">Attendance Mode</span>
      <span class="detail-badge" style="background:rgba(99,102,241,0.1); color:#6366f1; border:1px solid rgba(99,102,241,0.2);">
        {{ detailItem.attendance_mode }}
      </span>
    </div>

    <!-- ORGANIZATION -->
    <div class="detail-section-label" style="margin-top:8px;">Organization</div>

    <div class="detail-row">
      <span class="detail-label">Office</span>
      <span class="detail-badge">{{ detailItem.office.office_name }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">Group</span>
      <span class="detail-badge">{{ detailItem.user.group.name_group }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">Division</span>
      <span class="detail-badge">{{ detailItem.user.division.name_division }}</span>
    </div>

    <!-- TIMESTAMPS -->
    <div class="detail-section-label" style="margin-top:8px;">Record Info</div>

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
    <button class="btn-cancel" @click="closeDetailModal">Close</button>
    <button class="btn-save" @click="openEditModal(detailItem); closeDetailModal()">
      <font-awesome-icon icon="pen-to-square" /> Edit
    </button>
  </template>
</AppModal>
  </div>
</template>

<style scoped>
/* Sistem Warna & Wrapper Global */
.h-100 {
  /* --border-main: #e2e8f0;
  --bg-input: #f8fafc;
  --text-primary: #334155; */
  --text-muted: #64748b;
  --primary-color: #6366f1;
}

.form-container-gap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ===== BREADCRUMB ===== */
.breadcrumb-card {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 16px 18px;
  box-shadow: 0 1px 3px var(--shadow-color);
}
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

/* ===== TOOLBAR TOP ===== */
.toolbar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-card);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px var(--shadow-color);
  flex-wrap: wrap;
  gap: 8px;
}
.toolbar-left { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-toolbar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: none;
  border-radius: 8px;
  font-size: 0.83rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}
.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover { background: #4f46e5; }
.btn-orange { background: #f59e0b; color: #fff; }
.btn-orange:hover { background: #d97706; }
.btn-arrow { font-size: 0.6rem; opacity: 0.7; }

/* ===== CONTROLS ROW ===== */
.controls-card {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px var(--shadow-color);
}
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
.sort-wrap { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

/* ===== DROPDOWN CORE ===== */
.drop-wrap { position: relative; }
.btn-select {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  background: var(--bg-input);
  color: var(--text-primary);
  border: 1px solid var(--border-main);
  border-radius: 7px;
  font-size: 0.83rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.btn-select:hover { border-color: #6366f1; color: #6366f1; }
.drop-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 160px;
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 10px;
  z-index: 200;
  opacity: 0;
  transform: translateY(-6px);
  pointer-events: none;
  transition: all 0.18s ease;
}
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

/* ===== DATA TABLE ===== */
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
.td-muted { color: var(--text-muted); font-size: 0.84rem; }
.td-center { text-align: center; padding: 40px; color: var(--text-muted); }
.td-actions { text-align: center; white-space: nowrap; }

/* ACTION BUTTONS */
.act-btn { width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s ease; margin: 0 2px; background: transparent; }
.act-edit         { color: #f59e0b; border-color: #f59e0b; }
.act-edit:hover   { background: #f59e0b; color: #fff; }
.act-delete       { color: #ef4444; border-color: #ef4444; }
.act-delete:hover { background: #ef4444; color: #fff; }
.act-info         { color: #6366f1; border-color: #6366f1; }
.act-info:hover   { background: #6366f1; color: #fff; }

/* ===== PAGINATION BASE ===== */
.pagination-card {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 14px 18px;
  box-shadow: 0 1px 3px var(--shadow-color);
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.pagination-nav { display: flex; align-items: center; gap: 8px; }
.btn-prev-next {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  min-width: 85px;
  justify-content: center;
  transition: background 0.18s ease;
}
.btn-prev-next:hover:not(:disabled) { background: #4f46e5; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badges { display: flex; gap: 8px; align-items: center; }
.page-badge {
  padding: 7px 14px;
  border: 1px solid var(--border-main);
  border-radius: 7px;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--bg-input);
  white-space: nowrap;
}

/* ===== TAMPILAN MOBILE RESPONSIVE ===== */
@media (max-width: 576px) {
  .pagination-card { flex-direction: column; padding: 12px; gap: 12px; }
  .pagination-nav { width: 100%; justify-content: space-between; }
  .btn-prev-next { flex: 1; max-width: 48%; padding: 10px 14px; }
  .page-badges { width: 100%; justify-content: center; flex-wrap: wrap; }
  .page-badge { flex: 1; text-align: center; font-size: 0.7rem; }
}

/* ===== FORM STANDARD COMPONENTS ===== */
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.required { color: #ef4444; }
.form-input { padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.875rem; background: var(--bg-input); color: var(--text-primary); outline: none; transition: border 0.18s; width: 100%; }
.form-input:focus { border-color: #6366f1; }
.form-input.is-error { border-color: #ef4444; }
.form-textarea { resize: none; min-height: 80px; }
.error-msg { font-size: 0.8rem; color: #ef4444; margin: 0; }


/* CUSTOM SELECT */
.custom-select { position: relative; }
.custom-select-trigger {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; border: 1px solid var(--border-main);
  border-radius: 8px; background: var(--bg-input);
  cursor: pointer; min-height: 40px; transition: border 0.15s;
}
.custom-select-trigger:hover { border-color: #6366f1; }
.custom-select.is-error .custom-select-trigger { border-color: #ef4444; }
.placeholder { font-size: 0.875rem; color: var(--text-muted); }
.selected-tag {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 2px 8px; background: rgba(99,102,241,0.1);
  color: #6366f1; border-radius: 6px; font-size: 0.82rem; font-weight: 600;
}
.selected-tag button { background: none; border: none; color: #6366f1; cursor: pointer; font-size: 1rem; line-height: 1; padding: 0; }
.select-arrow { font-size: 0.65rem; color: var(--text-muted); transition: transform 0.2s; }
.select-arrow.rotated { transform: rotate(180deg); }
.custom-select-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  background: var(--bg-card); border: 1px solid var(--border-main);
  border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 500; overflow: hidden;
}
.select-search { width: 100%; padding: 8px 12px; border: none; border-bottom: 1px solid var(--border-main); background: var(--bg-input); font-size: 0.84rem; outline: none; color: var(--text-primary); }
.select-options { max-height: 180px; overflow-y: auto; padding: 6px; }
.select-option { padding: 8px 10px; border-radius: 6px; font-size: 0.84rem; cursor: pointer; color: var(--text-primary); transition: background 0.15s; }
.select-option:hover { background: var(--bg-nav-hover); }
.select-option.active { background: rgba(99,102,241,0.1); color: #6366f1; font-weight: 600; }
.select-empty { text-align: center; color: var(--text-muted); font-size: 0.82rem; padding: 12px 0; }
/* MODAL FOOTER BUTTONS */
/* Cari class .btn-cancel di bagian <style scoped> file tabel kamu, lalu ganti menjadi ini: */
.btn-cancel {
  padding: 8px 18px;
  background: var(--bg-main, #f1f5f9); /* Menggunakan background dinamis, jika tidak ada fallback ke light mode */
  color: var(--text-muted);
  border: 1px solid var(--border-main);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Berikan efek hover agar lebih interaktif */
.btn-cancel:hover {
  background: var(--border-main);
  color: var(--text-primary);
}
.btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-save:hover { background: #4f46e5; }

/* DETAIL MODAL CONTENT */
.detail-list { display: flex; flex-direction: column; }
.detail-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-main); gap: 12px; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.detail-value { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); }
.mono { font-family: monospace; font-weight: 700; }
.detail-badge { font-size: 0.82rem; font-weight: 600; padding: 3px 12px; border-radius: 6px; background: rgba(99,102,241,0.1); color: #6366f1; border: 1px solid rgba(99,102,241,0.2); }
.badge-active { font-size: 0.75rem; font-weight: 600; padding: 3px 10px; border-radius: 99px; background: rgba(34,197,94,0.1); color: #16a34a; }

/* ===== NEW RESPONSIVE SEGMENTED PILL ===== */
.segment-group {
  display: flex; 
  align-items: center;
  border: 1px solid var(--border-main);
  border-radius: 50px; 
  padding: 4px; 
  background: var(--bg-input);
  width: 100%;
  max-width: 500px; 
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.segment-group::-webkit-scrollbar { display: none; }
.segment-btn {
  flex: 1; 
  text-align: center;
  border: none;
  background: transparent;
  padding: 10px 16px; 
  color: var(--text-primary);
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 50px; 
  transition: all 0.2s ease;
  white-space: nowrap; 
}
.segment-btn:hover:not(.active) { background: rgba(99, 102, 241, 0.08); color: #6366f1; }
.segment-btn.active { background: #6366f1; color: #fff; box-shadow: 0 2px 6px rgba(99, 102, 241, 0.25); }

/* ===== NEW CUSTOM PILL FILE INPUT + PREVIEW ===== */
.pill-input-container {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-main);
  border-radius: 50px;
  background: var(--bg-input);
  padding: 4px;
  width: 100%;
  max-width: 500px;
  box-sizing: border-box;
}
.hidden-input { display: none; }
.pill-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--primary-color);
  color: #ffffff;
  padding: 10px 20px;
  border-radius: 50px;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.25);
  flex-shrink: 0;
}
.pill-upload-btn:hover { background: #4f46e5; transform: translateY(-1px); }
.pill-upload-btn:active { transform: translateY(0); }

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.84rem;
  color: #94a3b8;
  padding: 0 16px;
  overflow: hidden;
  flex: 1;
}
.file-text-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.file-info.has-file { color: var(--text-primary); font-weight: 500; }

.mini-preview {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  border: 1.5px solid var(--border-main);
  background: #fff;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mini-preview img { width: 100%; height: 100%; object-fit: cover; }

/* Perbaikan Potongan Kode CSS yang Terputus sebelumnya */
.form-select {
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 1.25rem;
  padding-right: 40px;
}

.spinner-custom {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(99, 102, 241, 0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.user-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--border-main); box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: block; margin: 0 auto; }

.row-employee {
  background: var(--color-bg-primary, #fff);
  border-top: 1px solid #e5e7eb;
}

.row-user-sub {
  background: var(--color-bg-secondary, #f9fafb);
}

.type-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
  letter-spacing: 0.3px;
}

.type-employee {
  background: #6366f1;
  color: #fff;
}

.type-user {
  background: #e5e7eb;
  color: #555;
}

/* tambah di style scoped */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
  gap: 8px;
}

.empty-img {
  max-width: 200px;
  height: auto;
  opacity: 0.85;
}

.empty-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-muted);
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.btn-save:disabled  { background: #a5b4fc; cursor: not-allowed; opacity: 0.8; }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}

.detail-section-label {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6366f1;
  padding: 8px 0 4px;
  border-bottom: 1px solid var(--border-main);
  margin-bottom: 2px;
}

.badge-inactive {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 99px;
  background: rgba(239,68,68,0.1);
  color: #dc2626;
}
</style>