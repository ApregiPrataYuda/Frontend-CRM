<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import {
  Chart, BarController, BarElement,
  LinearScale, CategoryScale, Tooltip
} from 'chart.js'

Chart.register(BarController, BarElement, LinearScale, CategoryScale, Tooltip)

const props = defineProps({
  labels:  { type: Array,  default: () => [] },
  datasets:{ type: Array,  default: () => [] }, // [{ label, data, color }]
  title:   { type: String, default: '' },
  stacked: { type: Boolean, default: false },
})

const canvas = ref(null)
let chart    = null

function initChart() {
  if (chart) chart.destroy()
  chart = new Chart(canvas.value, {
    type: 'bar',
    data: {
      labels: props.labels,
      datasets: props.datasets.map(ds => ({
        label:           ds.label,
        data:            ds.data,
        backgroundColor: ds.color + 'cc',
        borderColor:     ds.color,
        borderWidth:     0,
        borderRadius:    6,
        borderSkipped:   false,
      }))
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: props.datasets.length > 1,
          position: 'top',
          labels: { boxWidth: 10, usePointStyle: true, pointStyle: 'circle' }
        },
      },
      scales: {
        x: {
          stacked: props.stacked,
          grid: { display: false },
          ticks: { font: { size: 11 } }
        },
        y: {
          stacked: props.stacked,
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
  <div class="bar-wrap">
    <div class="bar-title">{{ title }}</div>
    <div class="bar-canvas">
      <canvas ref="canvas" />
    </div>
  </div>
</template>

<style scoped>
.bar-wrap  { display: flex; flex-direction: column; gap: 12px; }
.bar-title { font-size: 0.88rem; font-weight: 700; color: var(--text-primary); }
.bar-canvas { height: 200px; position: relative; }
</style>