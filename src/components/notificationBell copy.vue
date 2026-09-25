<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notificationStore'

// ── Komponen lonceng notifikasi, ditaruh di topbar layout (mis.
// DefaultLayout.vue), berdampingan dengan menu user/avatar. Standalone
// -- tidak butuh props. Asumsi initEcho() sudah dipanggil sekali di
// level aplikasi (mis. main.js atau App.vue setelah login sukses),
// jadi event real-time (lihat @/plugins/echo.js) otomatis masuk ke
// notificationStore tanpa komponen ini perlu tahu detail Echo-nya. ──

const notificationStore = useNotificationStore()
const router = useRouter()

const isOpen = ref(false)
const wrapRef = ref(null)

function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    notificationStore.myPagination.current_page = 1
    notificationStore.myPagination.per_page = 8
    notificationStore.fetchMyNotifications()
  }
}

function closeDropdown() {
  isOpen.value = false
}

function onClickOutside(e) {
  if (wrapRef.value && !wrapRef.value.contains(e.target)) {
    closeDropdown()
  }
}

async function onClickItem(item) {
  if (!item.is_read) {
    await notificationStore.markAsRead(item.id)
  }
  closeDropdown()
  router.push('/app/notification-center')
}

async function onMarkAllRead() {
  await notificationStore.markAllAsRead()
}

function categoryIcon(category) {
  if (category === 'reminder') return 'clock'
  if (category === 'agenda') return 'calendar-days'
  return 'bullhorn'
}

let pollTimer = null

onMounted(() => {
  notificationStore.fetchUnreadCount()
  document.addEventListener('click', onClickOutside)

  // ── Fallback polling tiap 30 detik -- jaga-jaga kalau koneksi
  // WebSocket (Reverb) putus/belum jalan, badge tetap ke-update walau
  // agak telat. Tidak konflik dengan event real-time: keduanya sama-sama
  // cuma nge-update angka/list yang sama. ──
  pollTimer = setInterval(() => {
    notificationStore.fetchUnreadCount()
  }, 30000)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <div class="notif-bell-wrap" ref="wrapRef">
    <button class="notif-bell-btn" @click="toggleDropdown" title="Notifications">
      <font-awesome-icon icon="bell" />
      <span v-if="notificationStore.unreadCount > 0" class="notif-badge">
        {{ notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount }}
      </span>
    </button>

    <div class="notif-dropdown" :class="{ show: isOpen }">
      <div class="notif-dropdown-header">
        <span>Notifications</span>
        <button
          v-if="notificationStore.unreadCount > 0"
          class="notif-mark-all"
          @click="onMarkAllRead"
        >Mark all read</button>
      </div>

      <div class="notif-dropdown-body">
        <div v-if="notificationStore.loadingMyNotifications" class="notif-empty">
          <div class="notif-spinner"></div>
        </div>

        <div v-else-if="!notificationStore.myNotificationsData.length" class="notif-empty">
          No notifications yet
        </div>

        <div
          v-else
          v-for="item in notificationStore.myNotificationsData"
          :key="item.id"
          class="notif-item"
          :class="{ unread: !item.is_read }"
          @click="onClickItem(item)"
        >
          <div class="notif-item-icon" :class="item.category">
            <font-awesome-icon :icon="categoryIcon(item.category)" />
          </div>
          <div class="notif-item-body">
            <div class="notif-item-title">{{ item.title }}</div>
            <div class="notif-item-message">{{ item.message }}</div>
            <div class="notif-item-time">{{ item.created_at }}</div>
          </div>
          <span v-if="!item.is_read" class="notif-dot"></span>
        </div>
      </div>

      <div class="notif-dropdown-footer">
        <router-link to="/app/notification-center" @click="closeDropdown">
          View all notifications
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notif-bell-wrap { position: relative; }

.notif-bell-btn {
  position: relative;
  display: inline-flex; align-items: center; justify-content: center;
  width: 38px; height: 38px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-primary, #1e293b);
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.15s;
}
.notif-bell-btn:hover { background: var(--bg-nav-hover, rgba(0,0,0,0.06)); }

.notif-badge {
  position: absolute; top: 2px; right: 2px;
  min-width: 16px; height: 16px; padding: 0 4px;
  border-radius: 999px;
  background: #ef4444; color: #fff;
  font-size: 0.62rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  line-height: 1;
}

.notif-dropdown {
  position: absolute; top: calc(100% + 10px); right: 0;
  width: 340px; max-width: 90vw;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border-main, #e2e8f0);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.14);
  z-index: 500;
  opacity: 0; transform: translateY(-8px);
  pointer-events: none;
  transition: all 0.18s ease;
}
.notif-dropdown.show { opacity: 1; transform: translateY(0); pointer-events: all; }

.notif-dropdown-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-main, #e2e8f0);
  font-size: 0.86rem; font-weight: 700;
  color: var(--text-primary, #1e293b);
}
.notif-mark-all {
  background: none; border: none; cursor: pointer;
  font-size: 0.72rem; font-weight: 600;
  color: #6366f1;
}
.notif-mark-all:hover { text-decoration: underline; }

.notif-dropdown-body { max-height: 360px; overflow-y: auto; }

.notif-empty {
  padding: 30px 14px; text-align: center;
  font-size: 0.82rem; color: var(--text-muted, #64748b);
}
.notif-spinner {
  width: 24px; height: 24px; margin: 0 auto;
  border: 3px solid var(--border-main, #e2e8f0);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: notif-spin 0.7s linear infinite;
}
@keyframes notif-spin { to { transform: rotate(360deg); } }

.notif-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-main, #f1f5f9);
  transition: background 0.15s;
  position: relative;
}
.notif-item:last-child { border-bottom: none; }
.notif-item:hover { background: var(--bg-nav-hover, #f8fafc); }
.notif-item.unread { background: rgba(99,102,241,0.05); }

.notif-item-icon {
  flex-shrink: 0;
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem;
  background: rgba(99,102,241,0.1); color: #6366f1;
}
.notif-item-icon.reminder { background: rgba(245,158,11,0.1); color: #f59e0b; }
.notif-item-icon.agenda { background: rgba(16,185,129,0.1); color: #10b981; }

.notif-item-body { flex: 1; min-width: 0; }
.notif-item-title {
  font-size: 0.82rem; font-weight: 700;
  color: var(--text-primary, #1e293b);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.notif-item-message {
  font-size: 0.76rem; color: var(--text-muted, #64748b);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}
.notif-item-time { font-size: 0.68rem; color: var(--text-muted, #94a3b8); margin-top: 2px; }

.notif-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #6366f1; flex-shrink: 0; margin-top: 4px;
}

.notif-dropdown-footer {
  padding: 10px 14px;
  text-align: center;
  border-top: 1px solid var(--border-main, #e2e8f0);
}
.notif-dropdown-footer a {
  font-size: 0.8rem; font-weight: 600; color: #6366f1; text-decoration: none;
}
.notif-dropdown-footer a:hover { text-decoration: underline; }
</style>