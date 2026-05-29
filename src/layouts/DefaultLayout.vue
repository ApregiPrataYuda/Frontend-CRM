<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'
import AppBreadcrumb from '../components/AppBreadcrumb.vue'


const sidebarVisible = ref(true)
const isMobile = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth < 768
  // Auto hide sidebar on mobile
  sidebarVisible.value = window.innerWidth >= 768
}

function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<template>
  <div>
    <!-- Overlay gelap saat sidebar buka di mobile -->
    <div
      v-if="isMobile && sidebarVisible"
      class="sidebar-overlay"
      @click="sidebarVisible = false"
    />

    <AppSidebar
      :visible="sidebarVisible"
      :unfoldable="false"
    />

    <div
      class="wrapper d-flex flex-column min-vh-100"
      :style="{
        marginLeft: !isMobile && sidebarVisible ? '240px' : '0px',
        transition: 'margin-left 0.3s ease',
        background: 'var(--bg-main)',
      }"
    >
      <AppHeader @toggle-sidebar="toggleSidebar" />
      <div class="body flex-grow-1 px-3 py-3 px-md-4 py-md-4">
        <!-- <AppBreadcrumb />  -->
        <router-view />
      </div>

      <AppFooter />
    </div>
  </div>
</template>

<style scoped>
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1030;
  backdrop-filter: blur(2px);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
</style>