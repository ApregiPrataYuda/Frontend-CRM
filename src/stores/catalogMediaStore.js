import { defineStore } from 'pinia'
import { ref } from 'vue'
import { catalogMediaServices } from '@/services/catalogMediaServices'

// ── Store untuk modal "Kelola Media" (PDF/Video) di ProductCatalogManagement.
// Non-paginated (media per product biasanya tidak banyak), sort_order
// yang menentukan urutan tampil. buildFormData() sama persis polanya
// dengan productCatalogStore.js/userStore.js. ──
export const useCatalogMediaStore = defineStore('catalogMedia', () => {

  const mediaData = ref([])
  const loadingMedia = ref(false)

  const savingMedia = ref(false)
  const updatingMedia = ref(false)
  const deletingMedia = ref(false)
  const errorMedia = ref(null)

  const activeProductId = ref(null)

  // ───────────────── FETCH (by product_id) ─────────────────
  const fetchMediaByProduct = async (productId) => {
    activeProductId.value = productId
    loadingMedia.value = true

    try {
      const response = await catalogMediaServices.listByProduct(productId)

      const result = response.data
      const dataArray = Array.isArray(result.data) ? result.data : []

      mediaData.value.splice(0, mediaData.value.length, ...dataArray)

    } catch (error) {
      console.error('Gagal fetch media catalog:', error)
    } finally {
      loadingMedia.value = false
    }
  }

  // ───────────────── HELPER — Build FormData ─────────────────
  const buildFormData = (payload, isUpdate = false) => {
    const fd = new FormData()
    if (isUpdate) fd.append('_method', 'PUT')

    Object.entries(payload).forEach(([key, value]) => {
      if (value === null || value === undefined) return
      if (value instanceof File) {
        fd.append(key, value)
      } else if (typeof value === 'boolean') {
        fd.append(key, value ? '1' : '0')
      } else {
        fd.append(key, value)
      }
    })
    return fd
  }

  // ───────────────── clearFieldError ─────────────────
  const clearFieldError = (field) => {
    if (!errorMedia.value) return
    const updated = { ...errorMedia.value }
    delete updated[field]
    errorMedia.value = Object.keys(updated).length ? updated : null
  }

  // ───────────────── CREATE ─────────────────
  const saveMedia = async (payload) => {
    savingMedia.value = true
    errorMedia.value = null

    try {
      const fd = buildFormData(payload, false)
      await catalogMediaServices.create(fd)

      if (activeProductId.value) {
        await fetchMediaByProduct(activeProductId.value)
      }

      return true

    } catch (error) {

      if (error.response?.status === 422) {
        errorMedia.value = error.response.data.errors
      } else {
        errorMedia.value = { _general: [error.response?.data?.message ?? 'Gagal menyimpan media'] }
      }

      return false

    } finally {
      savingMedia.value = false
    }
  }

  // ───────────────── UPDATE ─────────────────
  const updateMedia = async (id, payload) => {
    updatingMedia.value = true
    errorMedia.value = null

    try {
      const fd = buildFormData(payload, true)
      await catalogMediaServices.update(id, fd)

      if (activeProductId.value) {
        await fetchMediaByProduct(activeProductId.value)
      }

      return true

    } catch (error) {

      if (error.response?.status === 422) {
        errorMedia.value = error.response.data.errors
      } else {
        errorMedia.value = { _general: [error.response?.data?.message ?? 'Gagal update media'] }
      }

      return false

    } finally {
      updatingMedia.value = false
    }
  }

  // ───────────────── DELETE ─────────────────
  const deleteMedia = async (id) => {
    deletingMedia.value = true

    try {
      await catalogMediaServices.destroy(id)

      if (activeProductId.value) {
        await fetchMediaByProduct(activeProductId.value)
      }

      return { ok: true }

    } catch (error) {

      console.error('Gagal delete media:', error)

      return {
        ok: false,
        message: error.response?.data?.message ?? 'Gagal menghapus media',
      }

    } finally {
      deletingMedia.value = false
    }
  }

  // ───────────────── RESET (dipanggil saat modal ditutup) ─────────────────
  const resetMediaState = () => {
    mediaData.value.splice(0, mediaData.value.length)
    activeProductId.value = null
    errorMedia.value = null
  }

  // ───────────────── MEDIA URL HELPER ─────────────────
  // ── Sama alasan dengan getThumbnailUrl() di productCatalogStore.js --
  // dibangun di FRONTEND dari VITE_BASE_URL, TIDAK pakai full_url dari
  // backend, supaya konsisten dengan pola getImageUrl() di userStore.js
  // yang sudah terbukti jalan. Untuk source_type='upload', kolom `url`
  // di database sudah berisi path relatif lengkap dari storage/app/public
  // (mis. "product-catalogs/media/catalog_xxx.pdf" -- lihat
  // CatalogController::store()), jadi tinggal digabung ke
  // {base}/storage/{url}. Untuk youtube/vimeo/external_link, `url` sudah
  // berupa link absolut, dipakai apa adanya. ──
  const getMediaUrl = (item) => {
    if (!item?.url) return null
    if (item.source_type !== 'upload') return item.url
    const base = import.meta.env.VITE_BASE_URL ?? 'http://127.0.0.1:8000'
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base
    return `${cleanBase}/storage/${item.url}`
  }

  return {
    mediaData,
    loadingMedia,

    savingMedia,
    updatingMedia,
    deletingMedia,
    errorMedia,

    getMediaUrl,

    activeProductId,

    fetchMediaByProduct,
    clearFieldError,
    saveMedia,
    updateMedia,
    deleteMedia,
    resetMediaState,
  }
})