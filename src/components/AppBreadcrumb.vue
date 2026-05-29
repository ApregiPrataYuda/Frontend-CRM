<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Map path ke label yang lebih readable
const routeNames = {
  dashboard: 'Dashboard',
  leads: 'Leads',
  customers: 'Customers',
  settings: 'Settings',
  reports: 'Reports',
  monthly: 'Monthly',
  annual: 'Annual',
  manager: 'Manager',
  weekly: 'Per Week',
}

const breadcrumbs = computed(() => {
  const segments = route.path.split('/').filter(Boolean)
  const crumbs = [{ label: 'Home', to: '/dashboard' }]

  let currentPath = ''
  segments.forEach((seg, index) => {
    currentPath += `/${seg}`
    crumbs.push({
      label: routeNames[seg] || seg,
      to: currentPath,
      isLast: index === segments.length - 1,
    })
  })

  return crumbs
})
</script>

<template>
  <nav class="breadcrumb-nav" aria-label="breadcrumb">
    <ol class="breadcrumb-list">
      <li
        v-for="(crumb, index) in breadcrumbs"
        :key="index"
        class="breadcrumb-item"
        :class="{ active: crumb.isLast }"
      >
        <!-- Separator -->
        <span v-if="index > 0" class="breadcrumb-sep">
          <font-awesome-icon icon="chevron-right" />
        </span>

        <!-- Link atau teks -->
        <span
          v-if="crumb.isLast"
          class="breadcrumb-current"
        >
          {{ crumb.label }}
        </span>
        <button
          v-else
          class="breadcrumb-link"
          @click="$router.push(crumb.to)"
        >
          {{ crumb.label }}
        </button>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.breadcrumb-nav {
  margin-bottom: 20px;
}
.breadcrumb-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
  list-style: none;
  padding: 0;
  margin: 0;
}
.breadcrumb-item {
  display: flex;
  align-items: center;
}
.breadcrumb-sep {
  font-size: 0.55rem;
  /* color: var(--text-muted); */
  color: #6366f1;  
  margin: 0 6px;
  opacity: 0.5;
}

/* Home / link sebelumnya */
.breadcrumb-link {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.83rem;
  font-weight: 500;
  color: #6366f1;
  padding: 0;
  transition: color 0.15s ease;
}
.breadcrumb-link:hover {
  color: #4f46e5;
  text-decoration: underline;
}

/* Halaman aktif / terakhir */
.breadcrumb-current {
  font-size: 0.83rem;
  font-weight: 600;
  color: #6366f1;

}
</style>