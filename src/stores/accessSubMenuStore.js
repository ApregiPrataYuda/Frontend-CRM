import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { accessSubMenuService } from '@/services/accessSubMenuServices'

export const useAccessSubMenuStore = defineStore('accessSubMenu', () => {

  // ── STATE ──
  const accessSubMenuData    = ref([])
  const loadingAccessSubMenu = ref(false)
  const searchAccessSubMenu  = ref('')

  const searchTimeout   = ref(null)

  // FIX (bug "kadang hapus akses ga kehapus"): SEBELUMNYA cuma ada 1
  // `autoSaveTimeout` ref TUNGGAL buat SELURUH tabel -- jadi tiap kali
  // checkbox di baris MANAPUN di-toggle, clearTimeout() di baris itu ikut
  // MEMBATALKAN timer pending punya baris LAIN yang belum sempat kekirim
  // (kalau di-toggle beruntun < 300ms, misal user klik checkbox row A lalu
  // buru-buru klik checkbox row B), sehingga perubahan row A HILANG SAMA
  // SEKALI, tidak pernah nyampe ke backend -- padahal checkbox-nya sendiri
  // di UI sudah kelihatan ke-uncheck (v-model langsung ke object row-nya).
  //
  // SEKARANG pakai Map, di-key per id_submenu -- tiap baris py timer
  // debounce sendiri-sendiri, jadi toggle di baris lain TIDAK LAGI
  // membatalkan timer baris yang lain. Tiap entry-nya nyimpen bukan cuma
  // timeoutId, tapi juga fungsi `run` buat NGIRIM SEKARANG JUGA (dipakai
  // pas clearAllAutoSaveTimeouts() di-panggil sebelum 300ms-nya habis --
  // lihat penjelasan di situ).
  const autoSaveTimeouts = ref(new Map())

  const userId = ref(null)

  const pagination = reactive({
    current_page:  1,
    per_page:      10,
    prev_page_url: null,
    next_page_url: null,
    last_page:     1,
    total:         0,
  })

  // sort state dipertahankan untuk UI, tapi tidak dikirim ke backend
  // sampai nama kolom yang valid dikonfirmasi dari controller Laravel
  const sort = reactive({
    column:    'title',
    direction: 'asc',
  })

  const allowedSortColumns = ['title', 'created_at']

  // ── BUILD URL ──
  // CATATAN: sort_by & sort_dir sengaja tidak dikirim karena backend menolak 422.
  // Cek controller Laravel — ada Rule::in([...]) pada validasi sort_by.
  // Setelah tahu nama kolom yang diizinkan, uncomment blok sort di bawah.
  const buildUrl = () => {
    const params = new URLSearchParams()
    if (searchAccessSubMenu.value) params.append('search',   searchAccessSubMenu.value)
    if (pagination.current_page)   params.append('page',     pagination.current_page)
    if (pagination.per_page)       params.append('per_page', pagination.per_page)
    // Aktifkan setelah konfirmasi nama kolom dari backend:
    // if (sort.column) {
    //   params.append('sort_by',  sort.column)
    //   params.append('sort_dir', sort.direction)
    // }
    return `/users/${userId.value}/submenu-access?${params.toString()}`
  }

  // ── FETCH ──
  const fetchAccessSubMenu = async (url = null) => {
    if (!userId.value) return
    loadingAccessSubMenu.value = true
    try {
      const finalUrl = url || buildUrl()
      const response = await accessSubMenuService.getByUrl(finalUrl)
      const result   = response.data

      const dataArray = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? []

      accessSubMenuData.value = dataArray

      const pag = result.pagination ?? result.data?.pagination
      if (pag) {
        pagination.current_page  = pag.current_page
        pagination.per_page      = pag.per_page
        pagination.prev_page_url = pag.prev_page_url
        pagination.next_page_url = pag.next_page_url
        pagination.last_page     = pag.last_page
        pagination.total         = pag.total
      }
    } catch (err) {
      console.error('Gagal fetch access submenu:', err)
    } finally {
      loadingAccessSubMenu.value = false
    }
  }

  // ── SET USER & FETCH ──
  const setUserId = async (id) => {
    // Ganti user target -- bersihkan dulu SEMUA timer autosave yang masih
    // pending dari user SEBELUMNYA (kalau modal ditutup lalu dibuka lagi
    // buat user lain dalam waktu < 300ms). Tanpa ini, timer lama bisa
    // nembak SETELAH userId.value sudah berubah ke user baru -- lihat
    // penjelasan lengkap di autoSavePermission() soal kenapa userId juga
    // di-capture di awal (bukan dibaca ulang pas timer baru nyala).
    clearAllAutoSaveTimeouts()

    userId.value               = id
    searchAccessSubMenu.value  = ''
    pagination.current_page    = 1
    pagination.per_page        = 10
    sort.column                = 'title'
    sort.direction              = 'asc'
    await fetchAccessSubMenu()
  }

  // ── SEARCH WITH DELAY ──
  const searchWithDelay = (val) => {
    if (searchTimeout.value) clearTimeout(searchTimeout.value)
    searchAccessSubMenu.value = val
    pagination.current_page   = 1
    searchTimeout.value = setTimeout(() => {
      fetchAccessSubMenu(buildUrl())
    }, 500)
  }

  // ── CHANGE PAGE SIZE ──
  const changePageSize = () => {
    pagination.current_page = 1
    fetchAccessSubMenu(buildUrl())
  }

  // ── SORTING ──
  const changeSorting = () => {
    pagination.current_page = 1
    fetchAccessSubMenu(buildUrl())
  }

  const toggleSort = (col) => {
    if (!allowedSortColumns.includes(col)) return
    if (sort.column === col) {
      sort.direction = sort.direction === 'asc' ? 'desc' : 'asc'
    } else {
      sort.column    = col
      sort.direction = 'asc'
    }
    changeSorting()
  }

  // ── RESET FILTERS ──
  const resetFilters = () => {
    searchAccessSubMenu.value = ''
    pagination.per_page       = 10
    pagination.current_page   = 1
    sort.column                = 'title'
    sort.direction              = 'asc'
    fetchAccessSubMenu(buildUrl())
  }

  // ── AUTO SAVE PERMISSION ──
  // FIX (bug "kadang hapus akses ga kehapus") -- 2 perubahan dari versi
  // sebelumnya:
  //   1. Timer debounce sekarang di-key per id_submenu (pakai Map), BUKAN
  //      1 timer tunggal buat seluruh tabel -- supaya toggle di baris lain
  //      tidak lagi membatalkan timer baris yang sedang berjalan.
  //   2. userId di-CAPTURE ke variabel lokal (targetUserId) SAAT checkbox
  //      di-klik, bukan dibaca ulang dari userId.value pas timer-nya baru
  //      nyala 300ms kemudian -- soalnya kalau user sempat tutup modal &
  //      buka lagi buat user LAIN dalam rentang < 300ms itu, userId.value
  //      sudah keburu ganti, dan tanpa capture ini perubahan bisa nyasar
  //      kesimpan ke user yang salah.
  const autoSavePermission = (submenu) => {
    if (!userId.value) return Promise.resolve('no-user')

    const targetUserId = userId.value
    const key           = submenu.id_submenu

    // Kalau baris ini sudah py timer pending (user toggle beruntun di
    // baris YANG SAMA), batalkan yang lama -- ini debounce normal, cuma
    // kirim versi TERAKHIR-nya. Baris LAIN tidak tersentuh sama sekali.
    const existing = autoSaveTimeouts.value.get(key)
    if (existing) clearTimeout(existing.timeoutId)

    const payload = {
      can_view:   submenu.can_view   ? 1 : 0,
      can_create: submenu.can_create ? 1 : 0,
      can_update: submenu.can_update ? 1 : 0,
      can_delete: submenu.can_delete ? 1 : 0,
    }

    return new Promise((resolve) => {
      const run = async () => {
        autoSaveTimeouts.value.delete(key)
        try {
          await accessSubMenuService.savePermission(targetUserId, key, payload)
          resolve('success')
        } catch (err) {
          console.error('Gagal save permission:', err)
          resolve('error')
        }
      }

      const timeoutId = setTimeout(run, 300)
      autoSaveTimeouts.value.set(key, { timeoutId, run })
    })
  }

  // ── FLUSH + BERSIHKAN SEMUA TIMER AUTOSAVE YANG MASIH PENDING ──
  // Dipanggil pas modal Access SubMenu ditutup, pas ganti ke user lain
  // (setUserId()), dan pas komponen di-unmount. SENGAJA tidak cuma
  // clearTimeout() (itu bakal DIAM-DIAM MEMBUANG perubahan checkbox
  // terakhir yang belum sempat "settle" 300ms -- gejala yang sama persis
  // yang lagi kita perbaiki), tapi jalankan run()-nya SEKARANG JUGA supaya
  // perubahan terakhir tetap terkirim ke backend sebelum ditinggal/pindah
  // user.
  const clearAllAutoSaveTimeouts = () => {
    autoSaveTimeouts.value.forEach((entry) => {
      clearTimeout(entry.timeoutId)
      entry.run()
    })
    autoSaveTimeouts.value.clear()
  }

  return {
    accessSubMenuData,
    loadingAccessSubMenu,
    searchAccessSubMenu,
    pagination,
    sort,
    userId,
    fetchAccessSubMenu,
    setUserId,
    buildUrl,
    searchWithDelay,
    changePageSize,
    changeSorting,
    toggleSort,
    resetFilters,
    autoSavePermission,
    clearAllAutoSaveTimeouts,
  }
})