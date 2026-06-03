<script setup>
import {
  CHeader,
  CHeaderNav,
  CContainer,
  CButton,
} from '@coreui/vue'

import { useTheme } from '@/composables/useTheme'
import { ref, onMounted, onUnmounted, computed  } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useSettingAppStore } from '@/stores/settingAppStore'
const settingStore = useSettingAppStore()

const { isDark, toggleTheme } = useTheme()

const router = useRouter()
const authStore = useAuthStore()

defineEmits(['toggle-sidebar'])

const showDropdown = ref(false)

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function goTo(path) {
  showDropdown.value = false
  router.push(path)
}

async function logout() {

  showDropdown.value = false

  try {

    await authStore.logout()

    router.push('/login')

  } catch (error) {

    console.error('Logout gagal:', error)
  }
}

// Tutup dropdown kalau klik di luar
function handleClickOutside(e) {

  if (!e.target.closest('.user-chip-wrapper')) {

    showDropdown.value = false
  }
}

onMounted(() =>
  document.addEventListener('click', handleClickOutside)
)

onUnmounted(() =>
  document.removeEventListener('click', handleClickOutside)
)


// Tambah computed untuk photo
const IMAGE_BASE_URL = 'http://127.0.0.1:8000/storage/users/'

const photoUrl = computed(() =>
  authStore.user?.image
    ? IMAGE_BASE_URL + authStore.user.image
    : null
)

const userAvatar = computed(() =>
  authStore.user?.fullname?.substring(0, 2).toUpperCase() || 'AD'
)

const userName = computed(() =>
  authStore.user?.fullname || 'User'
)

const userRole = computed(() =>
  authStore.user?.role?.role
    ? authStore.user.role.role.charAt(0).toUpperCase() +
      authStore.user.role.role.slice(1)
    : 'User'
)

const pageTitle = computed(() => {
  return router.currentRoute.value.meta.title || router.currentRoute.value.name || 'PT SATU DUA'
})
</script>

<template>
  <CHeader position="sticky" class="mb-4 crm-header">
    <CContainer fluid class="d-flex align-items-center justify-content-between px-3">

      <!-- Left -->
      <div class="d-flex align-items-center gap-2">
  <CButton
    variant="ghost"
    @click="$emit('toggle-sidebar')"
    class="toggle-btn"
  >
    <font-awesome-icon icon="bars" />
  </CButton>
  <small class="header-title">{{ pageTitle }}</small>
</div>

      <!-- Right -->
      <CHeaderNav class="d-flex align-items-center gap-2">

        <!-- Theme Toggle -->
        <button class="theme-toggle" @click="toggleTheme" :title="isDark ? 'Light Mode' : 'Dark Mode'">
          <span class="toggle-track" :class="{ dark: isDark }">
            <span class="toggle-thumb">
              <font-awesome-icon :icon="isDark ? 'moon' : 'sun'" />
            </span>
          </span>
        </button>

        <!-- <div class="header-divider" /> -->

        <!-- User Chip + Dropdown -->
        <div class="user-chip-wrapper">
          <div class="user-chip" @click="toggleDropdown">
            <div class="user-avatar">
              <img
                v-if="photoUrl"
                :src="photoUrl"
                :alt="userName"
                class="avatar-img"
                @error="$event.target.style.display = 'none'"
              />
              <span v-else>{{ userAvatar }}</span>
            </div>
            <div class="user-chip-info d-none d-md-block">
              <div class="user-chip-name">{{ userName }}</div>
              <div class="user-chip-role">{{ userRole }}</div>
            </div>
            <font-awesome-icon
              icon="chevron-down"
              class="chip-arrow"
              :class="{ rotated: showDropdown }"
            />
          </div>

          <!-- Dropdown -->
          <div class="user-dropdown" :class="{ show: showDropdown }">

            <!-- Header dropdown -->
            <div class="dropdown-header">
              <div class="dropdown-avatar">
              <img
                v-if="photoUrl"
                :src="photoUrl"
                :alt="userName"
                class="avatar-img"
                @error="$event.target.style.display = 'none'"
              />
                <span v-else>{{ userAvatar }}</span>
              </div>
              <div>
                <div class="dropdown-name">{{ userName }}</div>
                <div class="dropdown-email">{{ authStore.user?.email || 'mailNotFound@example.com' }}</div>
              </div>
            </div>

            <div class="dropdown-divider" />

            <!-- Menu items -->
            <button class="dropdown-item" @click="goTo('/app/profile')">
              <span class="dropdown-item-icon" style="color: #6366f1; background: rgba(99,102,241,0.1)">
                <font-awesome-icon icon="circle-user" />
              </span>
              Profile Saya
            </button>

            <button class="dropdown-item" @click="goTo('/app/settings')">
              <span class="dropdown-item-icon" style="color: #f59e0b; background: rgba(245,158,11,0.1)">
                <font-awesome-icon icon="gear" />
              </span>
              Settings
            </button>

            <button class="dropdown-item" @click="goTo('/app/dashboard')">
              <span class="dropdown-item-icon" style="color: #38bdf8; background: rgba(56,189,248,0.1)">
                <font-awesome-icon icon="gauge" />
              </span>
              Dashboard
            </button>

            <div class="dropdown-divider" />

            <button class="dropdown-item item-logout" @click="logout">
              <span class="dropdown-item-icon" style="color: #ef4444; background: rgba(239,68,68,0.1)">
                <font-awesome-icon icon="right-from-bracket" />
              </span>
              Logout
            </button>

          </div>
        </div>

      </CHeaderNav>
    </CContainer>
  </CHeader>
</template>

<style scoped>
/* ===== HEADER ===== */
.crm-header {
  min-height: 64px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  background: var(--bg-header) !important;
  border-bottom: 1px solid var(--border-main) !important;
  box-shadow: 0 1px 3px var(--shadow-color) !important;
}
.header-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* ===== TOGGLE SIDEBAR ===== */
.toggle-btn {
  width: 38px;
  height: 38px;
  padding: 0 !important;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px !important;
  color: var(--text-muted) !important;
  font-size: 1rem;
  background: transparent !important;
  border: none !important;
}
.toggle-btn:hover {
  background: var(--bg-icon-hover) !important;
  color: var(--text-primary) !important;
}

/* ===== DIVIDER ===== */
.header-divider {
  width: 1px;
  height: 28px;
  background: var(--border-main);
  margin: 0 4px;
}

/* ===== THEME TOGGLE ===== */
.theme-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}
.toggle-track {
  width: 52px;
  height: 28px;
  border-radius: 99px;
  background: var(--border-main);
  display: flex;
  align-items: center;
  padding: 3px;
  transition: background 0.3s ease;
}
.toggle-track.dark { background: #6366f1; }
.toggle-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: #f59e0b;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  transition: transform 0.3s ease;
}
.toggle-track.dark .toggle-thumb {
  transform: translateX(24px);
  color: #818cf8;
}

/* ===== USER CHIP ===== */
.user-chip-wrapper {
  position: relative;
}
.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s ease;
  user-select: none;
}
.user-chip:hover {
  background: var(--bg-icon-hover);
}
.user-avatar {
  width: 34px;
  height: 34px;
  min-width: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.user-chip-info { line-height: 1.2; }
.user-chip-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}
.user-chip-role {
  font-size: 0.7rem;
  color: var(--text-muted);
}
.chip-arrow {
  font-size: 0.65rem;
  color: var(--text-muted);
  transition: transform 0.25s ease;
}
.chip-arrow.rotated {
  transform: rotate(180deg);
}

/* ===== DROPDOWN ===== */
.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 230px;
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 999;
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
  transition: all 0.2s ease;
}
.user-dropdown.show {
  opacity: 1;
  transform: translateY(0);
  pointer-events: all;
}

/* Dropdown header */
.dropdown-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
}
.dropdown-avatar {
  width: 38px;
  height: 38px;
  min-width: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dropdown-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}
.dropdown-email {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 1px;
}

.dropdown-divider {
  height: 1px;
  background: var(--border-main);
  margin: 2px 0;
}

/* Dropdown items */
.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
  transition: background 0.15s ease;
  text-align: left;
}
.dropdown-item:hover {
  background: var(--bg-nav-hover);
}
.dropdown-item-icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  flex-shrink: 0;
}
.item-logout {
  color: #ef4444 !important;
}
.item-logout:hover {
  background: rgba(239,68,68,0.06) !important;
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;        /* ← bulat */
  overflow: hidden;           /* ← foto tidak keluar lingkaran */
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;    /* ← foto tidak stretch/gepeng */
  display: block;
}
</style>