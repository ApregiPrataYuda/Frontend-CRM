<script setup>
import { ref, onMounted, watchEffect } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useSettingAppStore } from '@/stores/settingAppStore'
import AppConfirm from '@/components/AppConfirm.vue'
import { useConfirm } from '@/composables/useConfirm'
import { useIdleTimer } from '@/composables/useIdleTimer'
import { useToast } from 'vue-toastification'

const auth = useAuthStore() // ✅ BENAR
const toast = useToast()

const settingStore = useSettingAppStore()
const { state, onConfirm, onCancel } = useConfirm()

watchEffect(() => {
  document.title = settingStore.appName
})

// ── IDLE WARNING STATE ─────────────────────
const showIdleWarning = ref(false)
const isUserOnModal = ref(false)
let warningTimeout = null

const closeIdleWarning = () => {
  showIdleWarning.value = false
  isUserOnModal.value = false
  clearTimeout(warningTimeout)
}

const handleIdle = async () => {
  if (!auth.isLoggedIn) return

  showIdleWarning.value = true
  isUserOnModal.value = true

  warningTimeout = setTimeout(async () => {
    showIdleWarning.value = false
    isUserOnModal.value = false

    await auth.logout()

    toast.warning('Sesi Anda berakhir karena tidak ada aktivitas.')
  }, 5 * 1000)
}

const handleActive = () => {
  if (isUserOnModal.value) return
  closeIdleWarning()
}

const handleLogoutIdle = async () => {
  clearTimeout(warningTimeout)

  showIdleWarning.value = false
  isUserOnModal.value = false

  await auth.logout()
}

useIdleTimer({
  timeout: 30 * 60 * 1000,
  //  timeout: 10 * 1000,  buat test
  onIdle: handleIdle,
  onActive: handleActive,
})

onMounted(async () => {
  if (typeof auth.hydrate === 'function') {
    await auth.hydrate()
  }
})
</script>
<template>
  <router-view />

  <AppConfirm
    :show="state.show"
    :type="state.type"
    :title="state.title"
    :message="state.message"
    :detail="state.detail"
    :confirm-text="state.confirmText"
    :cancel-text="state.cancelText"
    :loading="state.loading"
    @confirm="onConfirm"
    @cancel="onCancel"
  />

  <!-- Idle Warning Modal -->
  <div class="idle-overlay" v-if="showIdleWarning">
    <div class="idle-modal">
      <div class="idle-icon">
        <font-awesome-icon :icon="['fas', 'clock']" />
      </div>
      <h3>Sesi Akan Berakhir</h3>
      <p>
        Anda tidak aktif selama beberapa saat.<br />
        Sesi akan otomatis berakhir dalam <strong>60 detik</strong>.
      </p>
      <div class="idle-actions">
        <button class="btn-stay" @click="closeIdleWarning">
          <font-awesome-icon :icon="['fas', 'rotate']" /> Tetap Disini
        </button>
        <button class="btn-logout-idle" @click="handleLogoutIdle">
          <font-awesome-icon :icon="['fas', 'right-from-bracket']" /> Logout
        </button>
      </div>
    </div>
  </div>
</template>

<style>
.idle-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 99999; backdrop-filter: blur(4px);
}
.idle-modal {
  background: var(--bg-card, #fff); border-radius: 16px; padding: 32px 28px;
  max-width: 380px; width: 90%; text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: slideUp 0.3s ease;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.idle-icon {
  width: 64px; height: 64px; border-radius: 50%; background: rgba(99,102,241,0.1);
  color: #6366f1; font-size: 1.8rem; display: flex; align-items: center;
  justify-content: center; margin: 0 auto 16px;
}
.idle-modal h3 { font-size: 1.1rem; font-weight: 700; color: var(--text-primary, #111827); margin: 0 0 8px; }
.idle-modal p  { font-size: 0.875rem; color: var(--text-muted, #6b7280); margin: 0 0 24px; line-height: 1.6; }
.idle-actions  { display: flex; gap: 10px; justify-content: center; }
.btn-stay {
  display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px;
  background: #6366f1; color: #fff; border: none; border-radius: 8px;
  font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: background 0.15s;
}
.btn-stay:hover { background: #4f46e5; }
.btn-logout-idle {
  display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px;
  background: transparent; color: #ef4444; border: 1px solid #ef4444;
  border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.15s;
}
.btn-logout-idle:hover { background: #ef4444; color: #fff; }
</style>