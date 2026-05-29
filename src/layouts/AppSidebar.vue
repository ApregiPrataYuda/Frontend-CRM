<script setup>
import {
  CSidebar,
  CSidebarBrand,
  CSidebarNav,
  CNavGroup,
} from '@coreui/vue'
import { useRoute, RouterLink } from 'vue-router'
import { computed, onMounted }  from 'vue'
import { useTheme }             from '@/composables/useTheme'
import { useSidebarStore }      from '@/stores/sidebarStore'
import { useAuthStore }         from '@/stores/authStore'
import { useSettingAppStore }   from '@/stores/settingAppStore'

const settingStore = useSettingAppStore()
const { isDark }   = useTheme()
const route        = useRoute()
const sidebarStore = useSidebarStore()
const authStore    = useAuthStore()

const storageUrl = import.meta.env.VITE_STORAGE_URL ?? ''

defineProps({
  visible:    Boolean,
  unfoldable: Boolean,
})
const emit = defineEmits(['update:visible'])

const colorScheme = computed(() => isDark.value ? 'dark' : 'light')
const menus       = computed(() => sidebarStore.sections)

onMounted(() => {
  // ── Fetch sidebar menu ──
  if (!sidebarStore.sections.length) {
    const roleId = authStore.user?.role_id
    const userId = authStore.user?.id
    sidebarStore.fetchMenus(roleId, userId)
  }

  // ── Fetch setting app ──
  if (!settingStore.settingAppData.length) {
    settingStore.fetchSettingApp()
  }
})

/* helpers */
function isActive(path)                { return route.path === path }
function isParentActive(children = []) { return children.some(c => route.path.startsWith(c.to)) }

/* ── USER INFO ── */
const IMAGE_BASE_URL = 'http://127.0.0.1:8000/storage/users/'

const photoUrl   = computed(() => authStore.user?.image ? IMAGE_BASE_URL + authStore.user.image : null)
const userAvatar = computed(() => authStore.user?.fullname?.substring(0, 2).toUpperCase() || 'AD')
const userName   = computed(() => authStore.user?.fullname || 'User')
const userRole   = computed(() => {
  const r = authStore.user?.role?.role
  return r ? r.charAt(0).toUpperCase() + r.slice(1) : 'User'
})

/* ── BRAND LOGO ──
   Prioritas: appLogoSmall → appLogo → null (tampilkan ikon)
*/
const brandLogoUrl = computed(() => {
  const file = settingStore.appLogoSmall || settingStore.appLogo
  if (!file) return null
  if (file.startsWith('http')) return file
  return `${storageUrl}/app-setting/${file}`
})
</script>

<template>
  <CSidebar
    position="fixed"
    :colorScheme="colorScheme"
    :visible="visible"
    :unfoldable="unfoldable"
    class="crm-sidebar"
    @visible-change="emit('update:visible', $event)"
  >
    <!-- ── BRAND ── -->
    <CSidebarBrand class="crm-brand">
      <!-- Logo dari DB (jika sudah ada) -->
      <img
        v-if="brandLogoUrl"
        :src="brandLogoUrl"
        :alt="settingStore.appName"
        class="brand-logo"
        @error="$event.target.style.display = 'none'"
      />
      <!-- Fallback ikon sementara data belum ter-fetch -->
      <font-awesome-icon
        v-else
        :icon="['fas', 'chart-line']"
        class="brand-icon"
      />

      <!-- Nama app dari DB, default 'My App' saat belum ter-fetch -->
      <span class="brand-text">{{ settingStore.appName }}</span>
    </CSidebarBrand>

    <!-- ── NAVIGATION ── -->
    <CSidebarNav class="crm-nav">

      <div v-if="sidebarStore.loading" class="sidebar-loading">
        <span class="loading-dot" /><span class="loading-dot" /><span class="loading-dot" />
      </div>

      <div v-else-if="sidebarStore.error" class="sidebar-error">
        <font-awesome-icon :icon="['fas', 'triangle-exclamation']" />
        <span>Failed to load menu</span>
        <button @click="sidebarStore.fetchMenus(authStore.user?.role_id, authStore.user?.id)">
          Try again
        </button>
      </div>

      <template v-else v-for="section in menus" :key="section.section">
        <div class="nav-section-title">{{ section.section }}</div>

        <template v-for="item in section.items" :key="item.id_submenu">
          <!-- GROUP -->
          <CNavGroup
            v-if="item.children"
            :visible="isParentActive(item.children)"
            class="crm-nav-group"
          >
            <template #togglerContent>
              <div
                class="nav-item nav-item-parent"
                :class="{ 'parent-active': isParentActive(item.children) }"
              >
                <span class="nav-item-icon">
                  <font-awesome-icon :icon="['fas', item.icon]" />
                </span>
                <span class="nav-item-label">{{ item.label }}</span>
              </div>
            </template>

            <RouterLink
              v-for="child in item.children"
              :key="child.id_submenu"
              :to="child.to"
              custom
              v-slot="{ navigate, href }"
            >
              <a
                :href="href"
                @click="navigate"
                class="nav-item nav-item-child"
                :class="{ active: isActive(child.to) }"
              >
                <span class="nav-item-icon child-icon">
                  <font-awesome-icon :icon="['fas', child.icon]" />
                </span>
                <span class="nav-item-label">{{ child.label }}</span>
              </a>
            </RouterLink>
          </CNavGroup>

          <!-- SINGLE ITEM -->
          <RouterLink
            v-else
            :to="item.to"
            custom
            v-slot="{ navigate, href }"
          >
            <a
              :href="href"
              @click="navigate"
              class="nav-item"
              :class="{ active: isActive(item.to) }"
            >
              <span class="nav-item-icon">
                <font-awesome-icon :icon="['fas', item.icon]" />
              </span>
              <span class="nav-item-label">{{ item.label }}</span>
            </a>
          </RouterLink>
        </template>
      </template>

    </CSidebarNav>

    <!-- ── FOOTER ── -->
    <div class="sidebar-footer">
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

      <div class="user-info">
        <div class="user-name">{{ userName }}</div>
        <div class="user-role">{{ userRole }}</div>
      </div>

      <button class="logout-btn" title="Logout" @click="authStore.logout">
        <font-awesome-icon :icon="['fas', 'right-from-bracket']" />
      </button>
    </div>
  </CSidebar>
</template>

<style scoped>
.crm-sidebar {
  width: 240px !important;
  background: var(--bg-sidebar) !important;
  border-right: 1px solid var(--border-sidebar) !important;
  display: flex !important;
  flex-direction: column !important;
  z-index: 1031 !important;
}
:deep(.sidebar-toggler), :deep(.c-sidebar-toggler) { display: none !important; }

/* BRAND */
.crm-brand {
  padding: 0 20px !important;
  display: flex !important;
  align-items: center !important;
  gap: 12px;
  border-bottom: 1px solid var(--border-sidebar) !important;
  min-height: 64px;
  flex-shrink: 0;
}
.brand-logo  { width: 28px; height: 28px; object-fit: contain; flex-shrink: 0; border-radius: 4px; }
.brand-icon  { font-size: 1.2rem; color: #6366f1; flex-shrink: 0; }
.brand-text  { font-size: 0.95rem; font-weight: 700; letter-spacing: 0.1em; color: var(--text-sidebar); white-space: nowrap; }

/* NAV */
.crm-nav { padding: 8px 12px !important; flex: 1 !important; overflow-y: auto !important; overflow-x: hidden !important; min-height: 0; }
.nav-section-title { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.14em; color: var(--text-section-title); padding: 18px 8px 6px; text-transform: uppercase; user-select: none; }

/* NAV ITEM */
.nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 8px; margin-bottom: 2px; cursor: pointer; color: var(--text-sidebar); font-size: 0.875rem; font-weight: 500; transition: all 0.18s ease; border-left: 3px solid transparent; user-select: none; text-decoration: none; }
.nav-item:hover  { background: var(--bg-nav-hover); color: var(--text-primary); }
.nav-item.active { background: var(--bg-nav-active); color: var(--text-sidebar-active); font-weight: 600; border-left: 3px solid #6366f1; }
.nav-item.active .nav-item-icon { color: var(--text-sidebar-active); }
.nav-item-label { flex: 1; }
.nav-item-parent.parent-active { color: var(--text-primary); font-weight: 600; }
.nav-item-child  { padding-left: 20px; margin-left: 12px; border-left: 1px solid var(--border-sidebar); border-radius: 0 8px 8px 0; font-size: 0.84rem; }
.nav-item-child:hover  { border-left-color: rgba(99,102,241,0.4); }
.nav-item-child.active { border-left: 1px solid #6366f1; }
.nav-item-icon { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0; }
.child-icon    { font-size: 0.78rem !important; opacity: 0.7; }

/* FOOTER */
.sidebar-footer { padding: 14px 16px; border-top: 1px solid var(--border-sidebar); display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.user-avatar { position: relative; width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #818cf8); color: #fff; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
.avatar-img  { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.user-info   { flex: 1; overflow: hidden; }
.user-name   { font-size: 0.82rem; font-weight: 600; color: var(--text-sidebar); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-role   { font-size: 0.7rem; color: var(--text-section-title); margin-top: 1px; }
.logout-btn  { background: none; border: none; color: var(--text-section-title); padding: 6px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; transition: all 0.18s ease; flex-shrink: 0; }
.logout-btn:hover { color: #ef4444; background: rgba(239,68,68,0.1); }

/* COREUI FIX */
:deep(.nav-group-toggle) { padding: 0 !important; background: transparent !important; }
:deep(.nav-group-toggle::after) { margin-right: 12px; }
:deep(.nav-group.show .nav-group-toggle::after) { transform: rotate(90deg); }
:deep(.nav-group-items) { margin-top: 2px; }

/* LOADING / ERROR */
.sidebar-loading { display: flex; justify-content: center; gap: 6px; padding: 24px 0; }
.loading-dot     { width: 6px; height: 6px; border-radius: 50%; background: #6366f1; animation: pulse 1.2s ease-in-out infinite; }
.loading-dot:nth-child(2) { animation-delay: 0.2s; }
.loading-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.1); } }
.sidebar-error        { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px 16px; color: #ef4444; font-size: 0.8rem; text-align: center; }
.sidebar-error button { background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.3); color: #6366f1; padding: 4px 12px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; }
</style>