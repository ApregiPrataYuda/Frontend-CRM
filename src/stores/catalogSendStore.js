import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { catalogSendServices } from '@/services/catalogSendServices'

// ── Store untuk fitur "Kirim Catalog" di halaman Sales (Email beneran
// lewat SMTP, atau catat log WhatsApp -- pengiriman WA aktualnya
// lewat wa.me link yang dibuka di client, lihat buildWhatsappLink()). ──
export const useCatalogSendStore = defineStore('catalogSend', () => {

  const sendingEmail    = ref(false)
  const loggingWhatsapp = ref(false)
  const errorSend       = ref(null)

  // ── Riwayat pengiriman -- dipakai modal "Riwayat Kirim" di halaman
  // Sales (filters.sender_id di-set ke id user login supaya cuma lihat
  // riwayat kirim miliknya sendiri, lihat productCatalogSalesView.vue). ──
  const sendLogsData = ref([])
  const loadingSendLogs = ref(false)
  const pagination = reactive({
    current_page: 1,
    per_page: 10,
    prev_page_url: null,
    next_page_url: null,
    last_page: 1,
    total: 0,
  })
  const filters = reactive({
    sender_id: '',
    channel: '',
  })

  const clearFieldError = (field) => {
    if (!errorSend.value) return
    const updated = { ...errorSend.value }
    delete updated[field]
    errorSend.value = Object.keys(updated).length ? updated : null
  }

  // ───────────────── SEND EMAIL ─────────────────
  const sendCatalogEmail = async (payload) => {
    sendingEmail.value = true
    errorSend.value = null

    try {
      await catalogSendServices.sendEmail(payload)
      return true

    } catch (error) {

      if (error.response?.status === 422) {
        errorSend.value = error.response.data.errors
      } else {
        errorSend.value = { _general: [error.response?.data?.message ?? 'Gagal mengirim catalog via email'] }
      }

      return false

    } finally {
      sendingEmail.value = false
    }
  }

  // ───────────────── LOG WHATSAPP ─────────────────
  const logCatalogWhatsapp = async (payload) => {
    loggingWhatsapp.value = true
    errorSend.value = null

    try {
      await catalogSendServices.logWhatsapp(payload)
      return true

    } catch (error) {

      if (error.response?.status === 422) {
        errorSend.value = error.response.data.errors
      } else {
        errorSend.value = { _general: [error.response?.data?.message ?? 'Gagal mencatat pengiriman WhatsApp'] }
      }

      return false

    } finally {
      loggingWhatsapp.value = false
    }
  }

  // ───────────────── RIWAYAT (opsional) ─────────────────
  const fetchSendLogs = async (url = null) => {
    loadingSendLogs.value = true

    try {
      let finalUrl = url

      if (!finalUrl) {
        const params = new URLSearchParams({
          page: pagination.current_page,
          per_page: pagination.per_page,
        })
        if (filters.sender_id) params.append('sender_id', filters.sender_id)
        if (filters.channel) params.append('channel', filters.channel)

        finalUrl = `/catalog-send-logs?${params.toString()}`
      }

      const response = await catalogSendServices.getByUrl(finalUrl)
      const result = response.data

      const dataArray = Array.isArray(result.data) ? result.data : result.data?.data ?? []
      sendLogsData.value.splice(0, sendLogsData.value.length, ...dataArray)

      const pag = result.pagination ?? result.data?.pagination
      if (pag) {
        pagination.current_page = pag.current_page
        pagination.per_page = pag.per_page
        pagination.prev_page_url = pag.prev_page_url
        pagination.next_page_url = pag.next_page_url
        pagination.last_page = pag.last_page
        pagination.total = pag.total
      }

    } catch (error) {
      console.error('Gagal fetch riwayat kirim catalog:', error)
    } finally {
      loadingSendLogs.value = false
    }
  }

  // ───────────────── BUILD WA LINK ─────────────────
  // ── Normalisasi nomor HP Indonesia ke format wa.me (62xxxxxxxxxx,
  // tanpa +/spasi/strip, tanpa leading 0). Lalu buka wa.me dengan pesan
  // yang sudah disusun (nama produk + link catalog kalau bukan upload,
  // atau catatan "PDF terlampir" kalau upload -- untuk upload, link
  // langsung ke file public disk disertakan juga supaya penerima WA
  // tetap bisa akses filenya). ──
  const normalizePhone = (phone) => {
    let digits = (phone || '').replace(/\D/g, '')
    if (digits.startsWith('0')) digits = '62' + digits.slice(1)
    if (!digits.startsWith('62')) digits = '62' + digits
    return digits
  }

  // ── catalogUrl diisi oleh PEMANGGIL (bukan dibaca dari catalog.full_url
  // -- store ini sengaja tidak bergantung ke catalogMediaStore supaya
  // tetap independen; pemanggil resolve URL-nya dulu lewat
  // catalogMediaStore.getMediaUrl(catalog), baru dioper ke sini). ──
  const buildWhatsappLink = ({ phone, product, catalog, catalogUrl = null }) => {
    const waPhone = normalizePhone(phone)

    let message = `Halo, berikut catalog produk *${product?.name ?? ''}* dari kami.`

    if (catalog?.title) {
      message += `\n${catalog.title}`
    }

    if (catalogUrl) {
      message += `\n${catalogUrl}`
    }

    const encodedMessage = encodeURIComponent(message)

    return `https://wa.me/${waPhone}?text=${encodedMessage}`
  }

  return {
    sendingEmail,
    loggingWhatsapp,
    errorSend,

    sendLogsData,
    loadingSendLogs,
    pagination,
    filters,

    clearFieldError,
    sendCatalogEmail,
    logCatalogWhatsapp,
    fetchSendLogs,

    normalizePhone,
    buildWhatsappLink,
  }
})