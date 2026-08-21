<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const storageUrl = import.meta.env.VITE_STORAGE_URL ?? ''

// ── PETA USER GUIDE PER ROLE ────────────────────────────────────────
// role_id 2 = Sales, 3 = Manager -- SAMA PERSIS sama mapping role_id
// yang udah dipakai di tempat lain (SalesTargetController,
// canManageTargets(), dll), jadi ga bikin konvensi baru.
//
// Sengaja CUMA 2 role ini yang disiapin guide-nya (role_id 1 = Admin
// TIDAK dimasukkan) -- kalau ada user Admin buka halaman ini, otomatis
// kena empty state "User Guide Belum Tersedia" (lihat activeGuide di
// bawah), BUKAN coba nge-load PDF yang gak ada (yang bakal 404).
//
// File PDF-nya sengaja file STATIS (bukan record di DB), ditaruh manual
// di server di:
//   storage/app/public/user-guides/{file}
// dan diakses lewat symlink "storage:link" yang KEMUNGKINAN BESAR udah
// aktif di project ini (soalnya foto profil user juga diakses lewat pola
// yang sama: VITE_STORAGE_URL + '/users/...' di Header.vue/Sidebar.vue).
// Kalau ternyata storage:link belum pernah dijalanin, tinggal jalanin
// `php artisan storage:link` sekali di server.
//
// Ganti/update PDF-nya nanti tinggal replace file fisiknya di server,
// ga perlu redeploy kode ini.
const GUIDE_MAP = {
  2: {
    label: 'Sales',
    file: 'user-guide-sales.pdf',
    icon: 'user-tie',
    color: '#0d9488',
    desc: 'Panduan input customer, product population, target visit, dan target penjualan untuk role Sales.',
  },
  3: {
    label: 'Manager',
    file: 'user-guide-manager.pdf',
    icon: 'user-check',
    color: '#f59e0b',
    desc: 'Panduan approval, reassignment sales, dan monitoring laporan untuk role Manager.',
  },
}

const activeGuide = computed(() => GUIDE_MAP[authStore.user?.role_id] ?? null)

const guideUrl = computed(() =>
  activeGuide.value ? `${storageUrl}/user-guides/${activeGuide.value.file}` : null
)

const roleLabel = computed(() => activeGuide.value?.label ?? 'kamu')
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <!-- ═══ BREADCRUMB ═══ -->
    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="book" /> User Guide
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" /> Home
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">User Guide</span>
        </div>
      </div>
    </div>

    <!-- ═══ CONTENT ═══ -->
    <div class="content-card flex-grow-1 overflow-auto">

      <!-- ROLE BELUM PUNYA GUIDE (jaga-jaga role_id di luar peta) -->
      <div v-if="!activeGuide" class="state-wrap">
        <div class="empty-state">
          <font-awesome-icon icon="circle-info" class="empty-icon" />
          <h5 class="empty-title">User Guide Belum Tersedia</h5>
          <p class="empty-text">Belum ada user guide yang disiapkan untuk role akun kamu saat ini.</p>
        </div>
      </div>

      <template v-else>
        <div class="guide-banner" :style="{ '--guide-color': activeGuide.color }">
          <div class="guide-icon">
            <font-awesome-icon :icon="activeGuide.icon" />
          </div>
          <div class="guide-info">
            <div class="guide-eyebrow">User Guide untuk role</div>
            <h3 class="guide-title">{{ roleLabel }}</h3>
            <p class="guide-desc">{{ activeGuide.desc }}</p>
          </div>
          <a :href="guideUrl" download target="_blank" rel="noopener" class="btn-toolbar btn-download">
            <font-awesome-icon icon="download" /> Download PDF
          </a>
        </div>

        <!-- PREVIEW PDF -->
        <div class="guide-preview-wrap">
          <div class="guide-preview-label">
            <font-awesome-icon icon="file-pdf" style="color:#ef4444" />
            Preview
            <span class="guide-preview-hint">(kalau preview tidak muncul, pakai tombol Download di atas)</span>
          </div>
          <iframe
            :src="guideUrl"
            class="guide-preview-frame"
            title="User Guide Preview"
          ></iframe>
        </div>
      </template>

    </div>

  </div>
</template>

<style scoped>
.h-100 { --text-muted: #64748b; --primary-color: #6366f1; }

/* ── BREADCRUMB (konsisten sama halaman lain) ── */
.breadcrumb-card { background: var(--bg-card); border-radius: 10px; padding: 16px 18px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

/* ── CONTENT WRAPPER ── */
.content-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); padding: 18px; display: flex; flex-direction: column; gap: 16px; }

/* ── EMPTY STATE ── */
.state-wrap { display: flex; justify-content: center; padding: 40px 0; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
.empty-icon { font-size: 2rem; color: var(--text-muted); opacity: 0.5; margin-bottom: 6px; }
.empty-title { margin: 0; font-size: 1rem; font-weight: 700; color: var(--text-primary); }
.empty-text { margin: 0; font-size: 0.85rem; color: var(--text-muted); }

/* ── GUIDE BANNER ── */
.guide-banner {
  --guide-color: #6366f1;
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  padding: 18px 20px; border-radius: 12px;
  background: color-mix(in srgb, var(--guide-color) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--guide-color) 22%, transparent);
}
.guide-icon {
  width: 52px; height: 52px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--guide-color); color: #fff; font-size: 1.3rem;
}
.guide-info { flex: 1; min-width: 200px; }
.guide-eyebrow { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--guide-color); }
.guide-title { margin: 2px 0 4px; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.guide-desc { margin: 0; font-size: 0.84rem; color: var(--text-muted); line-height: 1.5; }

.btn-toolbar { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; white-space: nowrap; text-decoration: none; transition: all 0.18s ease; }
.btn-download { background: var(--guide-color); color: #fff; }
.btn-download:hover { filter: brightness(0.92); color: #fff; }

/* ── PDF PREVIEW ── */
.guide-preview-wrap { display: flex; flex-direction: column; gap: 8px; flex: 1; min-height: 420px; }
.guide-preview-label { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; font-weight: 700; color: var(--text-primary); }
.guide-preview-hint { font-size: 0.74rem; font-weight: 500; color: var(--text-muted); }
.guide-preview-frame {
  flex: 1; width: 100%; min-height: 380px; border: 1px solid var(--border-main); border-radius: 10px; background: #f1f5f9;
}

@media (max-width: 640px) {
  .guide-banner { flex-direction: column; align-items: flex-start; }
  .btn-download { width: 100%; justify-content: center; }
}
</style>