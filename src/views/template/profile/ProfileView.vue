<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

const isEditing = ref(false)

const IMAGE_BASE_URL = 'http://127.0.0.1:8000/storage/users/'

/* =========================
   PROFILE DATA
========================= */

const profile = computed(() => ({
  name: authStore.user?.fullname || 'Admin',

  role: authStore.user?.role?.role
    ? authStore.user.role.role.charAt(0).toUpperCase() +
      authStore.user.role.role.slice(1)
    : 'User',

  email: authStore.user?.email || '-',

  phone: authStore.user?.employee?.no_hp || '-',

  department:
    authStore.user?.division?.name_division || '-',

  company:
    authStore.user?.groups?.name_group || '-',

  location:
    authStore.user?.employee?.alamat || '-',

  gender:
    authStore.user?.employee?.jenis_kelamin === 'L'
      ? 'Laki-laki'
      : 'Perempuan',

  birthPlace:
    authStore.user?.employee?.tempat_lahir || '-',

  birthDate:
    authStore.user?.employee?.tanggal_lahir || '-',

  nik:
    authStore.user?.employee?.nik || '-',

  statusEmployee:
    authStore.user?.employee?.status_karyawan || '-',

  attendanceMode:
    authStore.user?.employee?.attendance_mode || '-',

  joinDate:
    authStore.user?.employee?.tanggal_masuk
      ? new Date(
          authStore.user.employee.tanggal_masuk
        ).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '-',

  avatar:
    authStore.user?.fullname
      ?.substring(0, 2)
      .toUpperCase() || 'AD',

  image: authStore.user?.image
    ? IMAGE_BASE_URL + authStore.user.image
    : null,
}))

/* =========================
   FORM EDIT
========================= */

const form = ref({})

function startEdit() {
  form.value = { ...profile.value }
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
}

async function saveEdit() {
  try {

    console.log(form.value)

    // TODO:
    // API update profile

    isEditing.value = false

  } catch (error) {

    console.error(error)
  }
}

/* =========================
   STATS DUMMY
========================= */

const stats = [
  {
    label: 'Total Leads',
    value: '128',
    icon: 'user',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
  },
  {
    label: 'Customers',
    value: '64',
    icon: 'users',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
  },
  {
    label: 'Reports Dibuat',
    value: '32',
    icon: 'file-lines',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
  },
  {
    label: 'Task Selesai',
    value: '97%',
    icon: 'chart-line',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.1)',
  },
]

/* =========================
   ACTIVITIES DUMMY
========================= */

const activities = [
  {
    action: 'Menambah lead baru',
    time: '2 menit lalu',
    icon: 'user-plus',
    color: '#6366f1',
  },
  {
    action: 'Update data customer',
    time: '1 jam lalu',
    icon: 'pen',
    color: '#22c55e',
  },
  {
    action: 'Upload report bulanan',
    time: '3 jam lalu',
    icon: 'file-lines',
    color: '#f59e0b',
  },
]
</script>

<template>
  <div class="profile-page">

    <div class="profile-grid">

      <!-- LEFT -->
      <div class="profile-left">

        <!-- PROFILE CARD -->
        <div class="profile-card">

          <div class="profile-cover" />

          <div class="profile-body">

            <!-- AVATAR -->
            <div class="profile-avatar">

              <img
                v-if="profile.image"
                :src="profile.image"
                :alt="profile.name"
                class="avatar-img"
              />

              <span v-else>
                {{ profile.avatar }}
              </span>

            </div>

            <!-- NAME -->
            <div class="profile-name">
              {{ profile.name }}
            </div>

            <!-- ROLE -->
            <div class="profile-role">
              {{ profile.role }}
            </div>

            <!-- TAG -->
            <div class="profile-tags">

              <span class="tag tag-green">
                <font-awesome-icon
                  icon="circle"
                  style="font-size:0.45rem"
                />
                Online
              </span>

              <span class="tag tag-purple">
                {{ profile.department }}
              </span>

            </div>

            <!-- META -->
            <div class="profile-meta">

              <div class="meta-item">
                <font-awesome-icon
                  icon="envelope"
                  class="meta-icon"
                />
                {{ profile.email }}
              </div>

              <div class="meta-item">
                <font-awesome-icon
                  icon="phone"
                  class="meta-icon"
                />
                {{ profile.phone }}
              </div>

              <div class="meta-item">
                <font-awesome-icon
                  icon="building"
                  class="meta-icon"
                />
                {{ profile.company }}
              </div>

              <div class="meta-item">
                <font-awesome-icon
                  icon="location-dot"
                  class="meta-icon"
                />
                {{ profile.location }}
              </div>

            </div>

            <!-- BUTTON -->
            <button
              class="btn-edit-profile"
              @click="startEdit"
            >
              <font-awesome-icon icon="pen" />
              Edit Profile
            </button>

          </div>
        </div>

        

      </div>

      <!-- RIGHT -->
      <div class="profile-right">

        <!-- EDIT FORM -->
        <div
          v-if="isEditing"
          class="detail-card"
        >

          

          <div class="form-grid">

            <div class="form-group">
              <label>Nama Lengkap</label>
              <input
                v-model="form.name"
                type="text"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Email</label>
              <input
                v-model="form.email"
                type="email"
                class="form-input"
              />
            </div>

           

            

            

            

          </div>

          <div class="form-actions">

            <button
              class="btn-cancel"
              @click="cancelEdit"
            >
              Batal
            </button>

            <button
              class="btn-save"
              @click="saveEdit"
            >
              <font-awesome-icon icon="check" />
              Simpan
            </button>

          </div>

        </div>

        <!-- DETAIL -->
        <div
          v-else
          class="detail-card"
        >

          <div class="card-title">
            <font-awesome-icon icon="circle-info" />
            Informasi Akun
          </div>

          <div class="info-list">

            <div class="info-row">
              <span class="info-label">Nama Lengkap</span>
              <span class="info-value">{{ profile.name }}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Username</span>
              <span class="info-value">
                {{ authStore.user?.username }}
              </span>
            </div>

            <div class="info-row">
              <span class="info-label">Email</span>
              <span class="info-value">{{ profile.email }}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Role</span>
              <span class="info-value">{{ profile.role }}</span>
            </div>

            <div class="info-row">
              <span class="info-label">NIK</span>
              <span class="info-value">{{ profile.nik }}</span>
            </div>

            <div class="info-row">
              <span class="info-label">No HP</span>
              <span class="info-value">{{ profile.phone }}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Division</span>
              <span class="info-value">
                {{ profile.department }}
              </span>
            </div>

            <div class="info-row">
              <span class="info-label">Perusahaan</span>
              <span class="info-value">
                {{ profile.company }}
              </span>
            </div>

            <div class="info-row">
              <span class="info-label">Jenis Kelamin</span>
              <span class="info-value">
                {{ profile.gender }}
              </span>
            </div>

            <div class="info-row">
              <span class="info-label">Tempat Lahir</span>
              <span class="info-value">
                {{ profile.birthPlace }}
              </span>
            </div>

            <div class="info-row">
              <span class="info-label">Tanggal Lahir</span>
              <span class="info-value">
                {{ profile.birthDate }}
              </span>
            </div>

            <div class="info-row">
              <span class="info-label">Alamat</span>
              <span class="info-value">
                {{ profile.location }}
              </span>
            </div>

            <div class="info-row">
              <span class="info-label">Status Karyawan</span>
              <span class="info-value">
                {{ profile.statusEmployee }}
              </span>
            </div>

            <div class="info-row">
              <span class="info-label">Attendance</span>
              <span class="info-value">
                {{ profile.attendanceMode }}
              </span>
            </div>

            <div class="info-row">
              <span class="info-label">Tanggal Masuk</span>
              <span class="info-value">
                {{ profile.joinDate }}
              </span>
            </div>

            <div class="info-row">
              <span class="info-label">Status Akun</span>

              <span class="badge-active">
                {{
                  authStore.user?.is_active
                    ? 'Aktif'
                    : 'Nonaktif'
                }}
              </span>
            </div>

          </div>

        </div>

        

      </div>

    </div>

  </div>
</template>

<style scoped>
.profile-page {
  padding: 4px 0;
}

.profile-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  align-items: start;
}

@media (max-width: 768px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}

.profile-left,
.profile-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* CARD */

.profile-card,
.stats-card,
.detail-card {
  background: var(--bg-card);
  border-radius: 12px;
  box-shadow: 0 1px 3px var(--shadow-color);
  overflow: hidden;
}

/* PROFILE */

.profile-cover {
  height: 90px;
  background: linear-gradient(135deg, #6366f1, #818cf8);
}

.profile-body {
  padding: 0 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.profile-avatar {
  width: 78px;
  height: 78px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: #fff;
  font-size: 1.4rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid var(--bg-card);
  margin-top: -38px;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-name {
  margin-top: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.profile-role {
  margin-top: 2px;
  font-size: 0.82rem;
  color: var(--text-muted);
}

.profile-tags {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.tag {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.tag-green {
  background: rgba(34,197,94,0.1);
  color: #16a34a;
}

.tag-purple {
  background: rgba(99,102,241,0.1);
  color: #6366f1;
}

.profile-meta {
  width: 100%;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.82rem;
  color: var(--text-muted);
}

.meta-icon {
  width: 14px;
  color: #6366f1;
}

.btn-edit-profile {
  margin-top: 18px;
  width: 100%;
  padding: 10px;
  background: rgba(99,102,241,0.1);
  color: #6366f1;
  border: 1px solid rgba(99,102,241,0.2);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

/* STATS */

.stats-card {
  padding: 18px;
}

.card-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title svg {
  color: #6366f1;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.stat-item {
  background: var(--bg-main);
  border-radius: 10px;
  padding: 14px;
  text-align: center;
}

.stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  margin: 0 auto 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.72rem;
  color: var(--text-muted);
}

/* DETAIL */

.detail-card {
  padding: 20px;
}

.info-list {
  display: flex;
  flex-direction: column;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-main);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.info-value {
  font-size: 0.84rem;
  color: var(--text-primary);
  font-weight: 500;
  text-align: right;
}

.badge-active {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(34,197,94,0.1);
  color: #16a34a;
}

/* FORM */

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 20px;
}

@media (max-width: 500px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 600;
}

.form-input {
  padding: 10px 12px;
  border: 1px solid var(--border-main);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  padding: 9px 18px;
  border-radius: 8px;
  border: 1px solid var(--border-main);
  background: var(--bg-main);
  color: var(--text-muted);
  cursor: pointer;
}

.btn-save {
  padding: 9px 18px;
  border-radius: 8px;
  border: none;
  background: #6366f1;
  color: #fff;
  cursor: pointer;
}

/* ACTIVITY */

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 8px;
  border-radius: 8px;
}

.activity-item:hover {
  background: var(--bg-nav-hover);
}

.activity-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.activity-info {
  flex: 1;
}

.activity-action {
  font-size: 0.84rem;
  font-weight: 500;
  color: var(--text-primary);
}

.activity-time {
  font-size: 0.74rem;
  color: var(--text-muted);
  margin-top: 2px;
}
</style>