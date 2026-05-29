// src/stores/useSidebarStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { sidebarService } from '@/services/sidebarService'

/* ──────────────────────────────────────────
   HELPER: bersihkan string icon dari API
   "nav-icon fas fa-tasks"  → "tasks"
   "nav-icon fa fa-cogs"    → "cogs"
   "gauge"                  → "gauge"
   null / undefined         → "circle"
────────────────────────────────────────── */
function cleanIcon(raw) {
  if (!raw) return 'circle-dot'
  // Ambil bagian terakhir setelah spasi, lalu hapus prefix "fa-"
  const parts = raw.trim().split(/\s+/)
  const last  = parts[parts.length - 1]
  return last.replace(/^fa-/, '') || 'circle-dot'
}



/* ──────────────────────────────────────────
   HELPER: map label section header
   "administrator" → "Administrator"
   "sales"         → "Sales & Reports"
   "manager"       → "Manager & Reports"
────────────────────────────────────────── */
function sectionLabel(menuName = '') {
  const lower = menuName.toLowerCase()
  if (lower.includes('admin'))   return 'Administrator'
  if (lower.includes('sales'))   return 'Sales & Reports'
  if (lower.includes('manager')) return 'Manager & Reports'
  // Fallback: capitalize first letter
  return menuName.charAt(0).toUpperCase() + menuName.slice(1)
}

/* ──────────────────────────────────────────
   HELPER: map satu submenu item dari API kode tanpa prefix app/url
   (bekerja untuk level-2 maupun level-3)
────────────────────────────────────────── */
// function mapItem(raw) {
//   const hasChildren = Array.isArray(raw.children) && raw.children.length > 0

//   return {
//     id_submenu: raw.id_submenu,
//     label:      raw.title,
//     icon:       cleanIcon(raw.icon),
//     // Jika punya children, url-nya tidak dipakai (jadi dropdown toggle)
//     to:         hasChildren ? null : raw.url,
//     children:   hasChildren ? raw.children.map(mapItem) : null,
//   }
// }


//  HELPER: map satu submenu item dari API kode dengan  prefix app/url
//    (bekerja untuk level-2 maupun level-3)
function mapItem(raw) {
  const hasChildren = Array.isArray(raw.children) && raw.children.length > 0

  return {
    id_submenu: raw.id_submenu,
    label:      raw.title,
    icon:       cleanIcon(raw.icon),
    // ← Tambah prefix /app di sini
    to:         hasChildren ? null : '/app' + raw.url,
    children:   hasChildren ? raw.children.map(mapItem) : null,
  }
}

/* ══════════════════════════════════════════
   PINIA STORE
══════════════════════════════════════════ */
export const useSidebarStore = defineStore('sidebar', () => {
  const sections = ref([])   // array of { section, items[] }
  const loading  = ref(false)
  const error    = ref(null)

  /* ── Rehydrate dari localStorage ── */
  // const cached = localStorage.getItem('sidebar_sections')
  // if (cached) {
  //   try { sections.value = JSON.parse(cached) }
  //   catch { localStorage.removeItem('sidebar_sections') }
  // }
    // ← Rehydrate dari localStorage saat store pertama kali dibuat
  try {
    const cached = localStorage.getItem('sidebar_sections')
    if (cached) sections.value = JSON.parse(cached)
  } catch {
    localStorage.removeItem('sidebar_sections')
  }

  /* ────────────────────────────────────
     fetchMenus — panggil kedua API lalu
     gabungkan menjadi format sidebar
  ──────────────────────────────────── */
  const fetchMenus = async (roleId, userId) => {
    if (!roleId) return
    loading.value = true
    error.value   = null

    try {
      // ① Ambil daftar menu section (administrator, sales, manager)
      const menuRes  = await sidebarService.getMenuByRole(roleId)
      const rawMenus = Array.isArray(menuRes?.data) ? menuRes.data : []

      if (!rawMenus.length) {
        sections.value = []
        return
      }

      // ② Kumpulkan semua id_menu
      const menuIds = rawMenus.map(m => m.id_menu)

      // ③ Ambil semua submenu sekaligus (satu call)
      const submenuRes  = await sidebarService.getSubmenus(menuIds, userId)
      const rawSubmenus = Array.isArray(submenuRes?.data) ? submenuRes.data : []

      // ④ Kelompokkan submenu berdasarkan id_menu
      //    { 1: [...], 2: [...], 3: [...] }
      const byMenu = rawSubmenus.reduce((acc, sub) => {
        const key = sub.id_menu
        if (!acc[key]) acc[key] = []
        acc[key].push(sub)
        return acc
      }, {})

      // ⑤ Bangun struktur akhir sections[]
      sections.value = rawMenus
        .map(menuHeader => {
          const items = (byMenu[menuHeader.id_menu] || []).map(mapItem)
          return {
            section: sectionLabel(menuHeader.menu),
            items,
          }
        })
        .filter(s => s.items.length > 0)   // buang section kosong

      // ⑥ Cache ke localStorage
      localStorage.setItem('sidebar_sections', JSON.stringify(sections.value))

    } catch (err) {
      console.error('[SidebarStore] Gagal fetch sidebar:', err)
      error.value = err?.message || 'Gagal memuat menu'
      sections.value = []
    } finally {
      loading.value = false
    }
  }

  const clearMenus = () => {
    sections.value = []
    localStorage.removeItem('sidebar_sections')
  }

  return { sections, loading, error, fetchMenus, clearMenus }
})