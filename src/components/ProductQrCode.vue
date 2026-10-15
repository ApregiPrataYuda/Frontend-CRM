<script setup>
// QR code product, dibuat langsung di browser dari SKU.
// Tidak disimpan di server / database: setiap kali ditampilkan dibuat ulang (cepat, < 10 ms).
// Tombol Download membuat file PNG (QR + SKU + nama product) saat diklik.
import { ref, watch, onMounted, nextTick } from 'vue'
import QRCode from 'qrcode'

const props = defineProps({
  value: { type: String, required: true },   // isi QR = SKU
  title: { type: String, default: '' },      // nama product (untuk label di file download)
  size:  { type: Number, default: 168 },     // ukuran tampilan di layar (px)
})

const canvasEl    = ref(null)
const error       = ref(null)
const downloading = ref(false)

const QR_OPTIONS = { margin: 1, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#ffffff' } }

async function render() {
  if (!canvasEl.value || !props.value) return
  try {
    await QRCode.toCanvas(canvasEl.value, props.value, { ...QR_OPTIONS, width: props.size })
    error.value = null
  } catch (e) {
    console.error('Gagal membuat QR code:', e)
    error.value = 'QR code gagal dibuat.'
  }
}

onMounted(render)
watch(() => props.value, () => nextTick(render))

const truncate = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)
const safeFileName = (text) => text.replace(/[^a-zA-Z0-9-_]+/g, '_').replace(/^_+|_+$/g, '') || 'product'

// PNG resolusi tinggi untuk dicetak: QR 512 px + SKU + nama product di bawahnya.
async function download() {
  downloading.value = true
  try {
    const qrSize = 512
    const pad    = 32
    const textH  = props.title ? 92 : 56

    const qrCanvas = document.createElement('canvas')
    await QRCode.toCanvas(qrCanvas, props.value, { ...QR_OPTIONS, width: qrSize })

    const out = document.createElement('canvas')
    out.width  = qrSize + pad * 2
    out.height = qrSize + pad * 2 + textH

    const ctx = out.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, out.width, out.height)
    ctx.drawImage(qrCanvas, pad, pad)

    ctx.textAlign = 'center'
    ctx.fillStyle = '#111111'
    ctx.font = 'bold 30px monospace'
    ctx.fillText(truncate(props.value, 32), out.width / 2, qrSize + pad + 44)

    if (props.title) {
      ctx.fillStyle = '#444444'
      ctx.font = '20px sans-serif'
      ctx.fillText(truncate(props.title, 46), out.width / 2, qrSize + pad + 78)
    }

    const link = document.createElement('a')
    link.download = `QR-${safeFileName(props.value)}.png`
    link.href = out.toDataURL('image/png')
    link.click()
  } catch (e) {
    console.error('Gagal download QR code:', e)
    error.value = 'QR code gagal di-download.'
  } finally {
    downloading.value = false
  }
}
</script>

<template>
  <div class="qr-box">
    <canvas ref="canvasEl" class="qr-canvas" :width="size" :height="size" :aria-label="`QR code ${value}`"></canvas>
    <div class="qr-info">
      <div class="qr-label">QR Code</div>
      <div class="qr-value mono">{{ value }}</div>
      <div class="qr-hint">Scan di aplikasi mobile untuk membuka product ini.</div>
      <div v-if="error" class="qr-error">{{ error }}</div>
      <button class="btn-download" :disabled="downloading || !!error" @click="download">
        <font-awesome-icon v-if="downloading" icon="spinner" spin />
        <font-awesome-icon v-else icon="download" />
        Download PNG
      </button>
    </div>
  </div>
</template>

<style scoped>
.qr-box { display: flex; gap: 16px; align-items: center; margin-top: 14px; padding: 14px; border: 1px solid var(--border-main); border-radius: 10px; background: var(--bg-input); flex-wrap: wrap; }
.qr-canvas { background: #fff; border-radius: 8px; padding: 6px; border: 1px solid var(--border-main); }
.qr-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.qr-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.qr-value { font-size: 0.95rem; font-weight: 800; color: var(--text-primary); word-break: break-all; }
.mono { font-family: monospace; }
.qr-hint { font-size: 0.76rem; color: var(--text-muted); }
.qr-error { font-size: 0.76rem; color: #ef4444; }
.btn-download { align-self: flex-start; display: inline-flex; align-items: center; gap: 7px; margin-top: 6px; padding: 7px 14px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; }
.btn-download:hover:not(:disabled) { background: #4f46e5; }
.btn-download:disabled { opacity: 0.6; cursor: not-allowed; }
</style>