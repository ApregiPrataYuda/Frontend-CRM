<script setup>
import { computed } from 'vue'
import { usePermissionStore } from '@/stores/permissionStore'
import { useRoute } from 'vue-router'

const permission = usePermissionStore()
const route      = useRoute()

const currentUrl = computed(() => route.path.replace('/app', ''))

const canView   = computed(() => permission.canView(currentUrl.value))
const canCreate = computed(() => permission.canCreate(currentUrl.value))
const canUpdate = computed(() => permission.canUpdate(currentUrl.value))
const canDelete = computed(() => permission.canDelete(currentUrl.value))
</script>

<template>
  <button v-if="canCreate">+ Tambah</button>
  <button v-if="canUpdate">Edit</button>
  <button v-if="canDelete">Hapus</button>
  <button v-if="canView">Detail</button>
</template>