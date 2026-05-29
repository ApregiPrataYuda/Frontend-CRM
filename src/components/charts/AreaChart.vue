<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Filler
} from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler)

const props = defineProps({
  labels:  { type: Array,  default: () => [] },
  data:    { type: Array,  default: () => [] },
  color:   { type: String, default: '#6366f1' },
  title:   { type: String, default: '' },
})

const canvas = ref(null)
let chart    = null

function initChart() {
  if (chart) chart.destroy()
  chart = new Chart(canvas.value, {
    type: 'line',
    data: {
      labels: props.labels,
      datasets: [{
        data:            props.data,
        borderColor:     props.color,
        backgroundColor: props.color + '22',
        borderWidth:     2.5,
        pointRadius:     0,
        pointHoverRadius:5,
        tension:         0.4,
        fill:            true,
      }]
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
        y: {
          grid: { color: 'rgba(128,128,128,0.08)' },
          ticks: { font: { size: 10 } },
          beginAtZero: true,
        }
      }
    }
  })
}

onMounted(() => initChart())
onUnmounted(() => { if (chart) chart.destroy() })
watch(() => props.data, () => initChart(), { deep: true })
</script>

<template>
  <div class="area-wrap">
    <div class="area-title">{{ title }}</div>
    <div class="area-canvas">
      <canvas ref="canvas" />
    </div>
  </div>
</template>

<style scoped>
.area-wrap  { display: flex; flex-direction: column; gap: 12px; }
.area-title { font-size: 0.88rem; font-weight: 700; color: var(--text-primary); }
.area-canvas { height: 160px; }
</style>