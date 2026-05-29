// src/composables/useIdleTimer.js
import { ref, onMounted, onUnmounted } from 'vue'

export function useIdleTimer(options = {}) {
  const {
    timeout  = 30 * 60 * 1000,
    onIdle   = () => {},
    onActive = () => {},
  } = options

  const isIdle     = ref(false)
  let   idleTimer  = null
  let   hasStarted = false

  const events = [
    'mousemove',
    'mousedown',
    'keypress',
    'touchstart',
    'scroll',
    'click',
  ]

  const resetTimer = () => {
    clearTimeout(idleTimer)

    // Hanya panggil onActive jika user memang sedang idle sebelumnya
    if (hasStarted && isIdle.value) {
      isIdle.value = false
      onActive()
    }

    idleTimer = setTimeout(() => {
      isIdle.value = true
      onIdle()
    }, timeout)

    hasStarted = true
  }

  onMounted(() => {
    events.forEach(e => window.addEventListener(e, resetTimer))
    resetTimer()
  })

  onUnmounted(() => {
    events.forEach(e => window.removeEventListener(e, resetTimer))
    clearTimeout(idleTimer)
  })

  return { isIdle }
}