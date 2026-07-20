<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  show:    { type: Boolean, default: false },
  title:   { type: String,  default: '' },
  icon:    { type: String,  default: '' },
  size:    { type: String,  default: 'md' }, // sm | md | lg | xl
  persistent: { type: Boolean, default: false }, // true = klik luar tidak tutup
  hideClose: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

function close() {
  if (!props.persistent) emit('close')
}

// Close dengan ESC
function onKeydown(e) {
  if (e.key === 'Escape' && props.show) close()
}
onMounted(()  => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="close">
        <div class="modal-box" :class="`modal-${size}`">

          <!-- Header -->
          <div class="modal-header">
            <div class="modal-title">
              <span v-if="icon" class="modal-title-icon">
                <font-awesome-icon :icon="icon" />
              </span>
              {{ title }}
            </div>
            <button v-if="!hideClose" class="modal-close" @click="emit('close')">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <slot />
          </div>

          <!-- Footer (opsional) -->
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(3px);
}
.modal-box {
  background: var(--bg-card);
  border-radius: 14px;
  width: 100%;
  box-shadow: 0 24px 60px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}
.modal-sm { max-width: 360px; }
.modal-md { max-width: 480px; }
.modal-lg { max-width: 640px; }
.modal-xl { max-width: 860px; }

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border-main);
  flex-shrink: 0;
}
.modal-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}
.modal-title-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgba(99,102,241,0.1);
  color: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
}
.modal-close {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1rem;
  width: 32px;
  height: 32px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.modal-close:hover {
  background: var(--bg-nav-hover);
  color: var(--text-primary);
}
.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid var(--border-main);
  flex-shrink: 0;
}

/* Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .modal-box,
.modal-leave-active .modal-box {
  transition: transform 0.22s ease, opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-box,
.modal-leave-to .modal-box {
  transform: translateY(20px);
  opacity: 0;
}

@media (max-width: 480px) {
  .modal-box {
    border-radius: 12px;
    max-height: 95vh;
  }
  .modal-header { padding: 14px 16px; }
  .modal-body   { padding: 14px 16px; }
  .modal-footer {
    padding: 12px 16px;
    justify-content: stretch;
  }
  .modal-footer > * { flex: 1; justify-content: center; }
}
</style>