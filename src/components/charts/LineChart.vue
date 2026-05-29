<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Filler
} from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler)

const props = defineProps({
  labels:  { type: Array,  default: () => [] },
  datasets:{ type: Array,  default: () => [] }, // [{ label, data, color }]
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
      datasets: props.datasets.map(ds => ({
        label:           ds.label,
        data:            ds.data,
        borderColor:     ds.color,
        backgroundColor: ds.color + '18',
        borderWidth:     2.5,
        pointRadius:     4,
        pointHoverRadius:6,
        pointBackgroundColor: ds.color,
        tension:         0.4,
        fill:            true,
      }))
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: props.datasets.length > 1,
          position: 'top',
          labels: { boxWidth: 10, usePointStyle: true, pointStyle: 'circle' }
        },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } }
        },
        y: {
          grid: { color: 'rgba(128,128,128,0.1)' },
          ticks: { font: { size: 11 } },
          beginAtZero: true,
        }
      }
    }
  })
}

onMounted(() => initChart())
onUnmounted(() => { if (chart) chart.destroy() })
watch(() => props.datasets, () => initChart(), { deep: true })
</script>

<template>
  <div class="line-wrap">
    <div class="line-title">{{ title }}</div>
    <div class="line-canvas">
      <canvas ref="canvas" />
    </div>
  </div>
</template>

<style scoped>
.line-wrap  { display: flex; flex-direction: column; gap: 12px; }
.line-title { font-size: 0.88rem; font-weight: 700; color: var(--text-primary); }
.line-canvas { height: 200px; position: relative; }
</style>