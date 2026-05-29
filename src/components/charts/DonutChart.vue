<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js'

Chart.register(DoughnutController, ArcElement, Tooltip, Legend)

const props = defineProps({
  labels:  { type: Array,  default: () => [] },
  data:    { type: Array,  default: () => [] },
  colors:  { type: Array,  default: () => [] },
  title:   { type: String, default: '' },
  total:   { type: [String, Number], default: '' },
  subtitle:{ type: String, default: '' },
})

const canvas = ref(null)
let chart    = null

function initChart() {
  if (chart) chart.destroy()
  chart = new Chart(canvas.value, {
    type: 'doughnut',
    data: {
      labels:   props.labels,
      datasets: [{
        data:            props.data,
        backgroundColor: props.colors,
        borderWidth:     3,
        borderColor:     'transparent',
        hoverOffset:     6,
      }]
    },
    options: {
      cutout:     '72%',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed}`
          }
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
  <div class="donut-wrap">
    <div class="donut-title">{{ title }}</div>
    <div class="donut-chart-area">
      <canvas ref="canvas" />
      <div class="donut-center">
        <div class="donut-total">{{ total }}</div>
        <div class="donut-sub">{{ subtitle }}</div>
      </div>
    </div>
    <div class="donut-legend">
      <div v-for="(label, i) in labels" :key="i" class="legend-item">
        <span class="legend-dot" :style="{ background: colors[i] }" />
        <span class="legend-label">{{ label }}</span>
        <span class="legend-val">{{ data[i] }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.donut-wrap { display: flex; flex-direction: column; gap: 16px; }
.donut-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
}
.donut-chart-area {
  position: relative;
  width: 180px;
  height: 180px;
  margin: 0 auto;
}
.donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.donut-total {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}
.donut-sub {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 4px;
}
.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.legend-label {
  flex: 1;
  font-size: 0.8rem;
  color: var(--text-muted);
}
.legend-val {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
}
</style>