<script setup>
import { onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({
  show:        { type: Boolean, default: false },
  type:        { type: String,  default: 'danger' }, // danger | warning | info | success
  title:       { type: String,  default: 'Konfirmasi' },
  message:     { type: String,  default: 'Apakah kamu yakin?' },
  detail:      { type: String,  default: '' },
  confirmText: { type: String,  default: 'Ya, Lanjutkan' },
  cancelText:  { type: String,  default: 'Batal' },
  loading:     { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])

const config = {
  danger:  { icon: 'trash-can',             color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  warning: { icon: 'triangle-exclamation',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  info:    { icon: 'circle-info',            color: '#38bdf8', bg: 'rgba(56,189,248,0.1)' },
  success: { icon: 'circle-check',           color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
}

// Dibungkus computed agar reaktif saat props.type berubah dinamis
const c = computed(() => config[props.type] ?? config.danger)

function onKeydown(e) {
  if (e.key === 'Escape' && props.show) emit('cancel')
  if (e.key === 'Enter'  && props.show && !props.loading) emit('confirm')
}
onMounted(()  => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div v-if="show" class="confirm-overlay" @click.self="emit('cancel')">
        <div class="confirm-box">

          <div class="confirm-icon" :style="{ background: c.bg, color: c.color }">
            <font-awesome-icon :icon="c.icon" />
          </div>

          <div class="confirm-title">{{ title }}</div>
          <div class="confirm-message">{{ message }}</div>
          <div v-if="detail" class="confirm-detail">{{ detail }}</div>

          <div class="confirm-actions">
            <button class="btn-cancel" @click="emit('cancel')" :disabled="loading">
              {{ cancelText }}
            </button>
            <button
              class="btn-confirm"
              :style="{ background: c.color }" :disabled="loading"
              @click="emit('confirm')"
            >
              <font-awesome-icon v-if="loading" icon="spinner" spin />
              <font-awesome-icon v-else :icon="c.icon" /> {{ confirmText }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 2100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(3px);
}
.confirm-box {
  background: var(--bg-card);
  border-radius: 16px;
  width: 100%;
  max-width: 360px;
  padding: 28px 24px 24px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
}
.confirm-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  margin-bottom: 4px;
}
.confirm-title {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
}
.confirm-message {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.6;
  padding: 0 8px;
}
.confirm-detail {
  font-size: 0.78rem;
  color: var(--text-muted);
  background: var(--bg-main);
  border: 1px solid var(--border-main);
  border-radius: 8px;
  padding: 8px 14px;
  width: 100%;
  font-weight: 600;
}
.confirm-actions {
  display: flex;
  gap: 10px;
  width: 100%;
  margin-top: 8px;
}
.btn-cancel {
  flex: 1;
  padding: 10px;
  background: var(--bg-main);
  color: var(--text-muted);
  border: 1px solid var(--border-main);
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-cancel:hover:not(:disabled) { background: var(--border-main); }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-confirm {
  flex: 1;
  padding: 10px;
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  transition: filter 0.15s;
}
.btn-confirm:hover:not(:disabled) { filter: brightness(1.1); }
.btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

/* Transition */
.confirm-enter-active,
.confirm-leave-active { transition: opacity 0.2s ease; }
.confirm-enter-active .confirm-box,
.confirm-leave-active .confirm-box { transition: transform 0.22s ease, opacity 0.2s ease; }
.confirm-enter-from,
.confirm-leave-to { opacity: 0; }
.confirm-enter-from .confirm-box,
.confirm-leave-to .confirm-box { transform: scale(0.9); opacity: 0; }

@media (max-width: 480px) {
  .confirm-box  { padding: 20px 16px 16px; }
  .confirm-icon { width: 52px; height: 52px; font-size: 1.3rem; }
  .confirm-actions { flex-direction: column; }
  .btn-cancel,
  .btn-confirm  { width: 100%; justify-content: center; }
}
</style>