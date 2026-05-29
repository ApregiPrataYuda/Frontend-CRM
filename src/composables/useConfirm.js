import { ref } from 'vue'

const state = ref({
  show:        false,
  type:        'danger',
  title:       '',
  message:     '',
  detail:      '',
  confirmText: 'Ya, Lanjutkan',
  cancelText:  'Batal',
  loading:     false,
  resolve:     null,
})

export function useConfirm() {
  function confirm(options = {}) {
    return new Promise(resolve => {
      state.value = {
        show:        true,
        type:        options.type        ?? 'danger',
        title:       options.title       ?? 'Konfirmasi',
        message:     options.message     ?? 'Apakah kamu yakin?',
        detail:      options.detail      ?? '',
        confirmText: options.confirmText ?? 'Ya, Lanjutkan',
        cancelText:  options.cancelText  ?? 'Batal',
        loading:     false,
        resolve,
      }
    })
  }

  function onConfirm() {
    state.value.loading = true
    setTimeout(() => {
      state.value.show    = false
      state.value.loading = false
      state.value.resolve?.(true)
    }, 300)
  }

  function onCancel() {
    state.value.show = false
    state.value.resolve?.(false)
  }

  return { state, confirm, onConfirm, onCancel }
}