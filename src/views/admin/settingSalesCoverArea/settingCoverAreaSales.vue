<script setup>
import { ref, onMounted, computed } from 'vue'
import AppModal from '@/components/AppModal.vue'
import { useConfirm } from '@/composables/useConfirm'
import { useSalesCoverageStore } from '@/stores/salesCoverageStore'
import { usePermissionStore } from '@/stores/PermissionStore'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'

const { confirm } = useConfirm()
const store = useSalesCoverageStore()
const permission = usePermissionStore()
const route      = useRoute()
const toast = useToast()


// ── PERMISSIONS ────────────────────────────
const currentUrl = computed(() => route.path.replace('/app', ''))
const canCreate  = computed(() => permission.canCreate(currentUrl.value))
const canUpdate  = computed(() => permission.canUpdate(currentUrl.value))
const canDelete  = computed(() => permission.canDelete(currentUrl.value))
const canView    = computed(() => permission.canView(currentUrl.value))


// ── FETCH AWAL ─────────────────────────────
onMounted(async () => {
  await store.fetchCoverage()
  // daftar provinsi dipakai buat filter di toolbar + level pertama di form
  if (!store.regionOptions.province.length) store.fetchRegionOptions('province')
})

const showPerPageCoverage  = ref(false)
const showStatusCoverage   = ref(false)
const showProvinceCoverage = ref(false)
const searchProvinceFilter = ref('')

// filter status coverage
const statusOptions = [
  { label: 'All Sales',       value: '' },
  { label: 'Has Coverage',    value: '1' },
  { label: 'No Coverage Yet', value: '0' },
]
const statusLabel = () =>
  statusOptions.find(o => o.value === store.filterHasCoverage)?.label ?? 'All Sales'

function changeStatusFilter(value) {
  store.filterHasCoverage = value
  showStatusCoverage.value = false
  store.changeFilter()
}

// filter provinsi
const filteredProvinceFilter = computed(() => {
  const list = store.regionOptions.province ?? []
  if (!searchProvinceFilter.value) return list
  return list.filter(p => p.label?.toLowerCase().includes(searchProvinceFilter.value.toLowerCase()))
})
const provinceFilterLabel = () =>
  store.regionOptions.province.find(p => p.value === store.filterAreaCode)?.label ?? 'All Province'

function changeProvinceFilter(value) {
  store.filterAreaCode = value
  showProvinceCoverage.value = false
  searchProvinceFilter.value = ''
  store.changeFilter()
}

// warna badge per level wilayah
const levelClass = (level) => `level-${level ?? 'province'}`

// chip di tabel: tampil max 3, sisanya "+N more"
const MAX_CHIPS = 3


// ── Add / Edit Modal States ──
const isFormModalVisible = ref(false)
const isEdit             = ref(false)
const formErrors         = ref({})
const loadingExisting    = ref(false)

// daftar wilayah di form -- SELALU daftar lengkap milik sales (disimpan pakai PUT)
// item: { area_code, level, level_label, label }
const areaList = ref([])

function resetForm() {
  formErrors.value    = {}
  selectedSales.value = null
  searchSales.value   = ''
  isOpenSales.value   = false
  areaList.value      = []
  resetRegion()
}

async function openAddModal() {
  isEdit.value = false
  resetForm()
  store.fetchSalesSelect()
  if (!store.regionOptions.province.length) store.fetchRegionOptions('province')
  isFormModalVisible.value = true
}

function openEditModal(item) {
  isEdit.value = true
  resetForm()

  selectedSales.value = { value: item.employee_id, label: item.sales_name }
  areaList.value = (item.coverages ?? []).map(toAreaItem)

  if (!store.regionOptions.province.length) store.fetchRegionOptions('province')
  isFormModalVisible.value = true
}

function closeFormModal() {
  isFormModalVisible.value = false
  resetForm()
}

// coverage dari API -> item daftar di form
function toAreaItem(c) {
  return {
    area_code:   c.area_code,
    level:       c.level,
    level_label: c.level_label ?? store.levelLabels[c.level],
    label:       c.area_label || c.area_name || c.area_code,
  }
}


// ── Sales Select ──
const selectedSales = ref(null)
const searchSales   = ref('')
const isOpenSales   = ref(false)

const filteredSales = computed(() => {
  if (!store.salesSelectData) return []
  if (!searchSales.value) return store.salesSelectData
  return store.salesSelectData.filter(s =>
    s.label?.toLowerCase().includes(searchSales.value.toLowerCase())
  )
})

function toggleSales() {
  if (isEdit.value) return  // di mode edit sales ga bisa diganti
  isOpenSales.value = !isOpenSales.value
}

// pilih sales -> langsung load wilayah yang UDAH dia punya, biar daftar
// di form selalu lengkap (kalau ga, PUT bakal ngehapus wilayah lamanya)
async function selectSales(opt) {
  selectedSales.value = opt
  isOpenSales.value   = false
  searchSales.value   = ''
  areaList.value      = []

  loadingExisting.value = true
  try {
    const detail = await store.detailCoverage(opt.value)
    areaList.value = (detail?.coverages ?? []).map(toAreaItem)
    if (areaList.value.length) {
      toast.info(`${opt.label} sudah punya ${areaList.value.length} wilayah, ditampilkan di daftar.`)
    }
  } catch (err) {
    toast.error('Gagal memuat wilayah sales ini.')
  } finally {
    loadingExisting.value = false
  }
}

function clearSales() {
  if (isEdit.value) return
  selectedSales.value = null
  areaList.value      = []
}


function getError(field) {
  if (!formErrors.value || typeof formErrors.value !== 'object') return null
  return Array.isArray(formErrors.value[field])
    ? formErrors.value[field][0]
    : formErrors.value[field] ?? null
}


// ── REGION PICKER (province → city → district → village) ──
// pilih sampai level mana aja, lalu klik "Add Area" -> yang masuk daftar
// adalah level PALING BAWAH yang dipilih (misal cuma pilih province =
// 1 provinsi penuh)
const regionLevels = [
  { key: 'province', label: 'Province',       placeholder: 'Select Province...' },
  { key: 'city',     label: 'City / Regency', placeholder: 'All City...' },
  { key: 'district', label: 'District',       placeholder: 'All District...' },
  { key: 'village',  label: 'Village',        placeholder: 'All Village...' },
]
const levelKeys = regionLevels.map(l => l.key)

const regionSelected = ref({ province: null, city: null, district: null, village: null })
const regionOpen     = ref({ province: false, city: false, district: false, village: false })
const regionSearch   = ref({ province: '', city: '', district: '', village: '' })

const filteredRegion = (level) => {
  const list = store.regionOptions[level] ?? []
  const keyword = regionSearch.value[level]?.toLowerCase()
  if (!keyword) return list
  return list.filter(o => o.label?.toLowerCase().includes(keyword))
}

const isRegionDisabled = (level) => {
  const idx = levelKeys.indexOf(level)
  return idx > 0 && !regionSelected.value[levelKeys[idx - 1]]
}

function toggleRegion(level) {
  if (isRegionDisabled(level)) return
  regionOpen.value[level] = !regionOpen.value[level]
}

function resetRegionBelow(level) {
  const idx = levelKeys.indexOf(level)
  levelKeys.slice(idx + 1).forEach(k => {
    regionSelected.value[k] = null
    regionSearch.value[k]   = ''
    store.regionOptions[k]  = []
  })
}

async function selectRegion(level, opt) {
  regionSelected.value[level] = opt
  regionOpen.value[level]     = false
  regionSearch.value[level]   = ''

  resetRegionBelow(level)

  const next = levelKeys[levelKeys.indexOf(level) + 1]
  if (next) await store.fetchRegionOptions(next, opt.value)
}

function clearRegion(level) {
  regionSelected.value[level] = null
  resetRegionBelow(level)
}

function resetRegion() {
  levelKeys.forEach(k => {
    regionSelected.value[k] = null
    regionOpen.value[k]     = false
    regionSearch.value[k]   = ''
    if (k !== 'province') store.regionOptions[k] = []
  })
}

// level paling bawah yang udah dipilih di picker
const deepestRegion = computed(() => {
  for (let i = levelKeys.length - 1; i >= 0; i--) {
    const sel = regionSelected.value[levelKeys[i]]
    if (sel) return { level: levelKeys[i], ...sel }
  }
  return null
})

// label lengkap dari picker, misal "KOTA BANDUNG, JAWA BARAT"
const pickerLabel = computed(() => {
  return levelKeys
    .map(k => regionSelected.value[k]?.label)
    .filter(Boolean)
    .reverse()
    .join(', ')
})

// kode induk dari 1 kode, misal 3273010 -> ['32', '3273']
const ancestorCodes = (code) => [2, 4, 6].filter(len => len < code.length).map(len => code.slice(0, len))
// tambah wilayah ke daftar -- aturan SAMA kayak backend (applyCoverage):
// - kode yang sama ditolak
// - kalau induknya udah ada di daftar, ditolak (redundan)
// - kalau anak-anaknya udah ada di daftar, anak-anaknya digabung ke induk ini
function addArea() {
  formErrors.value = {}

  const picked = deepestRegion.value
  if (!picked) {
    formErrors.value = { area_codes: 'Pilih minimal Province dulu!' }
    return
  }

  const code = picked.value

  if (areaList.value.some(a => a.area_code === code)) {
    toast.warning('Wilayah ini sudah ada di daftar.')
    return
  }

  const parents = ancestorCodes(code)
  const coveredBy = areaList.value.find(a => parents.includes(a.area_code))
  if (coveredBy) {
    toast.warning(`Sudah tercakup oleh ${coveredBy.label}.`)
    return
  }

  const children = areaList.value.filter(a => a.area_code.length > code.length && a.area_code.startsWith(code))
  if (children.length) {
    areaList.value = areaList.value.filter(a => !children.includes(a))
    toast.info(`${children.length} wilayah di bawahnya digabung ke wilayah ini.`)
  }

  areaList.value.push({
    area_code:   code,
    level:       picked.level,
    level_label: store.levelLabels[picked.level],
    label:       pickerLabel.value,
  })

  // urutkan biar wilayah yang berdekatan ikut berdekatan
  areaList.value.sort((a, b) => a.area_code.localeCompare(b.area_code))

  resetRegion()
}

function removeArea(code) {
  areaList.value = areaList.value.filter(a => a.area_code !== code)
}


// ── SUBMIT ──
async function submitCoverage() {
  formErrors.value = {}

  // validasi client side
  if (!selectedSales.value)
    return formErrors.value = { employee_id: 'Sales wajib dipilih!' }
  if (!isEdit.value && !areaList.value.length)
    return formErrors.value = { area_codes: 'Tambahkan minimal 1 wilayah!' }

  // mode edit + daftar kosong = hapus semua wilayah -> konfirmasi dulu
  if (isEdit.value && !areaList.value.length) {
    const ok = await confirm({
      type: 'danger',
      title: 'Hapus Semua Wilayah',
      message: `Semua wilayah milik "${selectedSales.value.label}" akan dihapus.`,
      detail: 'Sales ini tidak akan punya wilayah coverage sama sekali.',
      confirmText: 'Yes, Remove All',
      cancelText: 'Cancel'
    })
    if (!ok) return
  }

  try {
    const res = await store.syncCoverage(
      selectedSales.value.value,
      areaList.value.map(a => a.area_code)
    )

    const summary = res?.data?.summary
    const added   = summary?.added?.length ?? 0
    const removed = summary?.removed?.length ?? 0

    toast.success(
      isEdit.value
        ? `Coverage diperbarui (${added} ditambah, ${removed} dihapus).`
        : `Coverage berhasil disimpan (${added} wilayah ditambah).`
    )
    closeFormModal()
  } catch (err) {
    // error 422 dari laravel -- key-nya bisa "area_codes.0", ambil pesan pertama
    if (store.errorCoverage) {
      const errors = store.errorCoverage
      const areaError = Object.keys(errors).find(k => k.startsWith('area_codes'))
      formErrors.value = areaError
        ? { area_codes: errors[areaError] }
        : errors
    } else {
      toast.error(err.response?.data?.message ?? 'Terjadi kesalahan, coba lagi.')
    }
  }
}


// ── Detail Modal ──
const isDetailModalVisible = ref(false)
const detailItem           = ref(null)

async function openDetailModal(item) {
  isDetailModalVisible.value = true
  detailItem.value = null
  await store.detailCoverage(item.employee_id)
  detailItem.value = store.coverageDetail
}

function closeDetailModal() {
  isDetailModalVisible.value = false
  detailItem.value = null
}

function editFromDetail() {
  const item = detailItem.value
  closeDetailModal()
  openEditModal(item)
}

// hapus 1 wilayah dari modal detail
async function deleteArea(coverage) {
  const isConfirmed = await confirm({
    type: 'danger',
    title: 'Hapus Wilayah',
    message: `Hapus wilayah "${coverage.area_label || coverage.area_name}" dari ${detailItem.value.sales_name}?`,
    detail: 'Wilayah ini tidak lagi menjadi tanggung jawab sales tersebut.',
    confirmText: 'Yes, Delete',
    cancelText: 'Cancel'
  })

  if (!isConfirmed) return

  try {
    await store.deleteCoverage(coverage.id)
    await store.detailCoverage(detailItem.value.employee_id)
    detailItem.value = store.coverageDetail
    toast.success('Wilayah berhasil dihapus!')
  } catch (err) {
    toast.error('Gagal menghapus wilayah, coba lagi.')
  }
}
</script>

<template>
  <div class="h-100 d-flex flex-column">
    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="map-location-dot" /> Sales Coverage Area
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" /> Dashboard
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Sales Coverage Table</span>
        </div>
      </div>
    </div>

    <div class="toolbar-top">
      <div class="toolbar-left">
        <!-- Filter status coverage -->
        <div class="drop-wrap">
          <button class="btn-select" @click="showStatusCoverage = !showStatusCoverage">
            <font-awesome-icon icon="filter" /> {{ statusLabel() }}
            <font-awesome-icon icon="chevron-down" class="btn-arrow" />
          </button>
          <div class="drop-menu" :class="{ show: showStatusCoverage }">
            <div class="drop-label">Coverage Status</div>
            <button
              v-for="opt in statusOptions" :key="opt.value"
              class="drop-item"
              :class="{ active: store.filterHasCoverage === opt.value }"
              @click="changeStatusFilter(opt.value)"
            >{{ opt.label }}</button>
          </div>
        </div>

        <!-- Filter provinsi -->
        <div class="drop-wrap">
          <button class="btn-select" @click="showProvinceCoverage = !showProvinceCoverage">
            <font-awesome-icon icon="location-dot" /> {{ provinceFilterLabel() }}
            <font-awesome-icon icon="chevron-down" class="btn-arrow" />
          </button>
          <div class="drop-menu drop-scroll" :class="{ show: showProvinceCoverage }">
            <div class="drop-label">Province</div>
            <input
              v-model="searchProvinceFilter"
              type="text"
              placeholder="search province..."
              class="drop-search"
            />
            <button
              class="drop-item"
              :class="{ active: !store.filterAreaCode }"
              @click="changeProvinceFilter('')"
            >All Province</button>
            <button
              v-for="opt in filteredProvinceFilter" :key="opt.value"
              class="drop-item"
              :class="{ active: store.filterAreaCode === opt.value }"
              @click="changeProvinceFilter(opt.value)"
            >{{ opt.label }}</button>
          </div>
        </div>
      </div>

      <button class="btn-toolbar btn-orange" @click="store.resetFilters()">
        <font-awesome-icon icon="rotate-left" /> Reset
      </button>
    </div>

    <div class="controls-card">
      <div class="controls-row">
        <div class="controls-left">
          <div class="showing-wrap">
            <font-awesome-icon icon="list" class="text-muted-color" />
            <span class="showing-label">Showing:</span>
            <div class="drop-wrap">
              <button class="btn-select" @click="showPerPageCoverage = !showPerPageCoverage">
                {{ store.pagination.per_page }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showPerPageCoverage }">
                <div class="drop-label">Per halaman</div>
                <div class="perpage-grid">
                  <button
                    v-for="opt in [5, 10, 25, 50]" :key="opt"
                    class="perpage-opt"
                    :class="{ active: store.pagination.per_page === opt }"
                    @click="store.pagination.per_page = opt; showPerPageCoverage = false; store.changePageSize()"
                  >{{ opt }}</button>
                </div>
              </div>
            </div>
          </div>

          <button v-if="canCreate" class="btn-toolbar btn-purple" @click="openAddModal">
            <font-awesome-icon icon="plus" /> Add Coverage
          </button>
        </div>

        <div class="controls-right">
          <div class="search-wrap">
            <input
              :value="store.searchCoverage"
              type="text"
              placeholder="Search Sales / NIK..."
              class="search-input"
              @input="store.searchWithDelay($event.target.value)"
            />
            <button class="search-btn"><font-awesome-icon icon="magnifying-glass" /></button>
          </div>
        </div>
      </div>
    </div>

    <div class="table-card flex-grow-1 overflow-auto mb-3">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:44px">NO</th>
            <th style="width:220px">SALES</th>
            <th style="width:140px">NIK</th>
            <th style="width:110px; text-align:center">TOTAL AREA</th>
            <th>COVERAGE AREA</th>
            <th style="width:110px; text-align:center">ACTIONS</th>
          </tr>
        </thead>
        <tbody>

          <!-- Loading -->
          <tr v-if="store.loadingCoverage">
            <td colspan="6" class="td-center">
              <div style="display:flex; justify-content:center;">
                <div class="spinner-custom"></div>
              </div>
            </td>
          </tr>

          <!-- Empty -->
          <tr v-else-if="!store.coverageData.length">
            <td colspan="6" class="td-center">
              <div class="empty-state">
                <img
                  src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif"
                  alt="No data found"
                  class="empty-img"
                />
                <div class="empty-text">No data found</div>
              </div>
            </td>
          </tr>

          <tr
            v-else
            v-for="(item, index) in store.coverageData"
            :key="item.employee_id"
            class="data-row"
          >
            <td class="td-no" style="text-align:center;">
              {{ (store.pagination.current_page - 1) * store.pagination.per_page + index + 1 }}
            </td>
            <td style="font-weight:600;">{{ item.sales_name }}</td>
            <td style="font-family:monospace; font-weight:500;">{{ item.nik }}</td>
            <td style="text-align:center;">
              <span class="count-badge" :class="{ 'count-zero': !item.total_coverage }">
                {{ item.total_coverage }}
              </span>
            </td>
            <td>
              <span v-if="!item.total_coverage" class="td-muted">Belum ada wilayah</span>
              <div v-else class="chip-wrap">
                <span
                  v-for="c in item.coverages.slice(0, MAX_CHIPS)"
                  :key="c.id"
                  class="area-chip"
                  :class="levelClass(c.level)"
                  :title="c.area_label"
                >
                  <span class="chip-level">{{ c.level_label }}</span>
                  {{ c.area_name }}
                </span>
                <span v-if="item.coverages.length > MAX_CHIPS" class="area-chip chip-more">
                  +{{ item.coverages.length - MAX_CHIPS }} more
                </span>
              </div>
            </td>

            <td class="td-actions">
              <button
                v-if="canUpdate"
                class="act-btn act-edit"
                title="Edit Coverage"
                @click="openEditModal(item)"
              >
                <font-awesome-icon icon="pen-to-square" />
              </button>

              <button
                v-if="canView"
                class="act-btn act-info"
                title="Detail"
                @click="openDetailModal(item)"
              >
                <font-awesome-icon icon="circle-info" />
              </button>
            </td>
          </tr>

        </tbody>
      </table>
    </div>

    <div class="pagination-card">
      <div class="pagination-nav">
        <button
          class="btn-prev-next"
          :disabled="store.pagination.current_page === 1"
          @click="store.goToPage(store.pagination.current_page - 1)"
        >
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button
          class="btn-prev-next"
          :disabled="store.pagination.current_page >= store.pagination.last_page"
          @click="store.goToPage(store.pagination.current_page + 1)"
        >
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">
          {{ store.coverageData.length }} DATA | PAGE {{ store.pagination.current_page }}
        </span>
        <span class="page-badge">TOTAL: {{ store.pagination.total }}</span>
      </div>
    </div>


    <!-- Add/Edit Coverage Modal -->
    <AppModal
      :show="isFormModalVisible"
      :title="isEdit ? 'Edit Sales Coverage' : 'Add Sales Coverage'"
      :icon="isEdit ? 'pen' : 'plus'"
      size="md"
      @close="closeFormModal"
    >
      <div class="form-container-gap">

        <!-- Sales -->
        <div class="form-group">
          <label>Sales <span class="required">*</span></label>
          <div
            class="custom-select"
            :class="{ 'is-error': getError('employee_id'), 'is-disabled': isEdit }"
          >
            <div class="custom-select-trigger" @click="toggleSales">
              <span v-if="!selectedSales" class="placeholder">Select Sales...</span>
              <span v-else class="selected-tag">
                {{ selectedSales.label }}
                <button v-if="!isEdit" type="button" @click.stop="clearSales">×</button>
              </span>
              <font-awesome-icon v-if="!isEdit" icon="chevron-down" class="select-arrow" :class="{ rotated: isOpenSales }" />
            </div>
            <div class="custom-select-dropdown" v-if="isOpenSales">
              <input
                v-model="searchSales"
                type="text"
                placeholder="search sales..."
                class="select-search"
                @click.stop
              />
              <div class="select-options">
                <p v-if="!filteredSales.length" class="select-empty">Not found</p>
                <div
                  v-for="opt in filteredSales"
                  :key="opt.value"
                  class="select-option"
                  :class="{ active: selectedSales?.value === opt.value }"
                  @click="selectSales(opt)"
                >{{ opt.label }}</div>
              </div>
            </div>
          </div>
          <p v-if="getError('employee_id')" class="error-msg">{{ getError('employee_id') }}</p>
        </div>

        <!-- Region picker -->
        <div class="picker-box" :class="{ 'is-locked': !selectedSales }">
          <div class="picker-title">
            <font-awesome-icon icon="location-dot" /> Pick Area
            <span class="picker-hint">pilih sampai level mana saja, lalu klik Add Area</span>
          </div>

          <div class="form-row-2">
            <div v-for="lvl in regionLevels" :key="lvl.key" class="form-group">
              <label>{{ lvl.label }}</label>
              <div class="custom-select" :class="{ 'is-disabled': isRegionDisabled(lvl.key) }">
                <div class="custom-select-trigger" @click="toggleRegion(lvl.key)">
                  <span v-if="!regionSelected[lvl.key]" class="placeholder">
                    {{ store.regionLoading[lvl.key] ? 'Loading...' : lvl.placeholder }}
                  </span>
                  <span v-else class="selected-tag">
                    {{ regionSelected[lvl.key].label }}
                    <button type="button" @click.stop="clearRegion(lvl.key)">×</button>
                  </span>
                  <font-awesome-icon icon="chevron-down" class="select-arrow" :class="{ rotated: regionOpen[lvl.key] }" />
                </div>
                <div class="custom-select-dropdown" v-if="regionOpen[lvl.key]">
                  <input
                    v-model="regionSearch[lvl.key]"
                    type="text"
                    :placeholder="`search ${lvl.label.toLowerCase()}...`"
                    class="select-search"
                    @click.stop
                  />
                  <div class="select-options">
                    <p v-if="store.regionLoading[lvl.key]" class="select-empty">Loading...</p>
                    <p v-else-if="!filteredRegion(lvl.key).length" class="select-empty">Not found</p>
                    <div
                      v-for="opt in filteredRegion(lvl.key)"
                      :key="opt.value"
                      class="select-option"
                      :class="{ active: regionSelected[lvl.key]?.value === opt.value }"
                      @click="selectRegion(lvl.key, opt)"
                    >{{ opt.label }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="picker-footer">
            <span class="picker-preview">
              <template v-if="deepestRegion">
                <span class="chip-level">{{ store.levelLabels[deepestRegion.level] }}</span>
                {{ pickerLabel }}
              </template>
              <template v-else>Belum ada wilayah dipilih</template>
            </span>
            <button
              type="button"
              class="btn-toolbar btn-purple"
              :disabled="!deepestRegion || !selectedSales"
              @click="addArea"
            >
              <font-awesome-icon icon="plus" /> Add Area
            </button>
          </div>
        </div>

        <!-- Daftar wilayah -->
        <div class="form-group">
          <label>
            Coverage Area <span class="required" v-if="!isEdit">*</span>
            <span class="area-count">({{ areaList.length }})</span>
          </label>

          <div class="area-list" :class="{ 'is-error': getError('area_codes') }">
            <div v-if="loadingExisting" style="display:flex; justify-content:center; padding:16px;">
              <div class="spinner-custom"></div>
            </div>
            <p v-else-if="!areaList.length" class="select-empty">Belum ada wilayah di daftar</p>
            <div
              v-else
              v-for="area in areaList"
              :key="area.area_code"
              class="area-row"
            >
              <span class="area-chip" :class="levelClass(area.level)">
                <span class="chip-level">{{ area.level_label }}</span>
              </span>
              <span class="area-label">{{ area.label }}</span>
              <span class="area-code mono">{{ area.area_code }}</span>
              <button type="button" class="act-btn act-delete" title="Remove" @click="removeArea(area.area_code)">
                <font-awesome-icon icon="xmark" />
              </button>
            </div>
          </div>
          <p v-if="getError('area_codes')" class="error-msg">{{ getError('area_codes') }}</p>
        </div>

      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeFormModal" :disabled="store.savingCoverage">
          Cancel
        </button>
        <button class="btn-save" @click="submitCoverage" :disabled="store.savingCoverage || loadingExisting">
          <span v-if="store.savingCoverage" class="btn-spinner"></span>
          <font-awesome-icon v-else icon="check" />
          {{ store.savingCoverage ? 'Saving...' : (isEdit ? 'Update' : 'Save Data') }}
        </button>
      </template>
    </AppModal>


    <!-- Detail Modal -->
    <AppModal
      :show="isDetailModalVisible"
      title="Sales Coverage Details"
      icon="circle-info"
      size="md"
      @close="closeDetailModal"
    >
      <!-- Loading -->
      <div v-if="store.loadingDetail && !detailItem" style="display:flex; justify-content:center; padding:32px;">
        <div class="spinner-custom"></div>
      </div>

      <div v-else-if="detailItem" class="detail-list">

        <!-- Header -->
        <div style="display:flex; align-items:center; gap:14px; padding-bottom:16px; border-bottom:1px solid var(--border-main); margin-bottom:4px;">
          <div class="detail-avatar">
            <font-awesome-icon icon="user-tie" />
          </div>
          <div style="flex:1;">
            <div style="font-weight:700; font-size:1rem; color:var(--text-primary);">{{ detailItem.sales_name }}</div>
            <div style="font-size:0.82rem; color:var(--text-muted);">NIK: {{ detailItem.nik }}</div>
          </div>
          <span class="count-badge" :class="{ 'count-zero': !detailItem.total_coverage }">
            {{ detailItem.total_coverage }} AREA
          </span>
        </div>

        <div class="detail-section-label">Coverage Area</div>

        <p v-if="!detailItem.coverages?.length" class="select-empty">Sales ini belum punya wilayah</p>

        <div
          v-for="c in detailItem.coverages"
          :key="c.id"
          class="detail-row"
        >
          <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
            <span class="area-chip" :class="levelClass(c.level)" style="align-self:flex-start;">
              <span class="chip-level">{{ c.level_label }}</span>
            </span>
            <span class="detail-value">{{ c.area_label || c.area_name }}</span>
            <span class="area-code mono">{{ c.area_code }} · added {{ store.formatDate(c.created_at) }}</span>
          </div>
          <button
            v-if="canDelete"
            class="act-btn act-delete"
            title="Hapus wilayah"
            :disabled="store.deletingCoverage"
            @click="deleteArea(c)"
          >
            <font-awesome-icon icon="trash-can" />
          </button>
        </div>

      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeDetailModal">Close</button>
        <button v-if="canUpdate && detailItem" class="btn-save" @click="editFromDetail">
          <font-awesome-icon icon="pen-to-square" /> Edit
        </button>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
/* Sistem Warna & Wrapper Global */
.h-100 {
  --text-muted: #64748b;
  --primary-color: #6366f1;
}

.form-container-gap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ===== BREADCRUMB ===== */
.breadcrumb-card {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 16px 18px;
  box-shadow: 0 1px 3px var(--shadow-color);
}
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

/* ===== TOOLBAR TOP ===== */
.toolbar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-card);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px var(--shadow-color);
  flex-wrap: wrap;
  gap: 8px;
}
.toolbar-left { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-toolbar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: none;
  border-radius: 8px;
  font-size: 0.83rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}
.btn-toolbar:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover:not(:disabled) { background: #4f46e5; }
.btn-orange { background: #f59e0b; color: #fff; }
.btn-orange:hover { background: #d97706; }
.btn-arrow { font-size: 0.6rem; opacity: 0.7; }

/* ===== CONTROLS ROW ===== */
.controls-card {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px var(--shadow-color);
}
.controls-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.controls-left, .controls-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.showing-wrap { display: flex; align-items: center; gap: 6px; font-size: 0.84rem; color: var(--text-primary); font-weight: 600; }
.showing-label { white-space: nowrap; color: var(--text-muted); font-size: 0.83rem; }
.text-muted-color { color: var(--text-muted); }
.search-wrap { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.search-input { padding: 7px 12px; border: none; background: transparent; color: var(--text-primary); font-size: 0.84rem; outline: none; width: 220px; }
.search-input::placeholder { color: var(--text-muted); }
.search-btn { padding: 7px 12px; background: #6366f1; color: #fff; border: none; cursor: pointer; }
.search-btn:hover { background: #4f46e5; }

/* ===== DROPDOWN CORE ===== */
.drop-wrap { position: relative; }
.btn-select {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  background: var(--bg-input);
  color: var(--text-primary);
  border: 1px solid var(--border-main);
  border-radius: 7px;
  font-size: 0.83rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.btn-select:hover { border-color: #6366f1; color: #6366f1; }
.drop-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 180px;
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 10px;
  z-index: 200;
  opacity: 0;
  transform: translateY(-6px);
  pointer-events: none;
  transition: all 0.18s ease;
}
.drop-menu.show { opacity: 1; transform: translateY(0); pointer-events: all; }
.drop-scroll { max-height: 320px; overflow-y: auto; min-width: 240px; }
.drop-search { width: 100%; padding: 6px 10px; margin-bottom: 6px; border: 1px solid var(--border-main); border-radius: 6px; background: var(--bg-input); color: var(--text-primary); font-size: 0.82rem; outline: none; }
.drop-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; padding: 0 4px; }
.drop-item { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: none; border: none; border-radius: 7px; color: var(--text-primary); font-size: 0.84rem; cursor: pointer; text-align: left; }
.drop-item:hover { background: var(--bg-nav-hover); }
.drop-item.active { color: #6366f1; font-weight: 600; background: rgba(99,102,241,0.08); }
.perpage-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.perpage-opt { padding: 5px 10px; border: 1px solid var(--border-main); border-radius: 6px; background: var(--bg-input); color: var(--text-primary); font-size: 0.82rem; cursor: pointer; }
.perpage-opt:hover  { border-color: #6366f1; color: #6366f1; }
.perpage-opt.active { background: #6366f1; border-color: #6366f1; color: #fff; font-weight: 700; }

/* ===== DATA TABLE ===== */
.table-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.data-table thead tr { background: var(--bg-input); border-bottom: 2px solid var(--border-main); position: sticky; top: 0; z-index: 2; }
.data-table th { padding: 12px 18px; text-align: left; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap; }
.data-table tbody tr { border-bottom: 1px solid var(--border-main); transition: background 0.15s; }
.data-table tbody tr:last-child { border-bottom: none; }
.data-row:hover { background: var(--bg-nav-hover); }
.data-table td { padding: 13px 18px; vertical-align: middle; color: var(--text-primary); }
.td-no { color: var(--text-muted); font-weight: 600; }
.td-muted { color: var(--text-muted); font-size: 0.84rem; }
.td-center { text-align: center; padding: 40px; color: var(--text-muted); }
.td-actions { text-align: center; white-space: nowrap; }

/* ACTION BUTTONS */
.act-btn { width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s ease; margin: 0 2px; background: transparent; flex-shrink: 0; }
.act-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.act-edit         { color: #f59e0b; border-color: #f59e0b; }
.act-edit:hover   { background: #f59e0b; color: #fff; }
.act-delete       { color: #ef4444; border-color: #ef4444; }
.act-delete:hover { background: #ef4444; color: #fff; }
.act-info         { color: #6366f1; border-color: #6366f1; }
.act-info:hover   { background: #6366f1; color: #fff; }

/* ===== COVERAGE CHIPS ===== */
.chip-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
.area-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  border: 1px solid transparent;
  white-space: nowrap;
}
.chip-level {
  font-size: 0.62rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.8;
}
.level-province { background: rgba(99,102,241,0.1);  color: #6366f1; border-color: rgba(99,102,241,0.2); }
.level-city     { background: rgba(14,165,233,0.1);  color: #0284c7; border-color: rgba(14,165,233,0.2); }
.level-district { background: rgba(34,197,94,0.1);   color: #16a34a; border-color: rgba(34,197,94,0.2); }
.level-village  { background: rgba(245,158,11,0.1);  color: #b45309; border-color: rgba(245,158,11,0.2); }
.chip-more      { background: var(--bg-input); color: var(--text-muted); border-color: var(--border-main); }

.count-badge {
  display: inline-block;
  min-width: 32px;
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 0.78rem;
  font-weight: 700;
  background: rgba(99,102,241,0.1);
  color: #6366f1;
}
.count-zero { background: rgba(239,68,68,0.1); color: #dc2626; }

/* ===== PAGINATION BASE ===== */
.pagination-card {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 14px 18px;
  box-shadow: 0 1px 3px var(--shadow-color);
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.pagination-nav { display: flex; align-items: center; gap: 8px; }
.btn-prev-next {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  min-width: 85px;
  justify-content: center;
  transition: background 0.18s ease;
}
.btn-prev-next:hover:not(:disabled) { background: #4f46e5; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badges { display: flex; gap: 8px; align-items: center; }
.page-badge {
  padding: 7px 14px;
  border: 1px solid var(--border-main);
  border-radius: 7px;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--bg-input);
  white-space: nowrap;
}

/* ===== TAMPILAN MOBILE RESPONSIVE ===== */
@media (max-width: 576px) {
  .pagination-card { flex-direction: column; padding: 12px; gap: 12px; }
  .pagination-nav { width: 100%; justify-content: space-between; }
  .btn-prev-next { flex: 1; max-width: 48%; padding: 10px 14px; }
  .page-badges { width: 100%; justify-content: center; flex-wrap: wrap; }
  .page-badge { flex: 1; text-align: center; font-size: 0.7rem; }
  .form-row-2 { grid-template-columns: 1fr; }
  .search-input { width: 160px; }
}

/* ===== FORM STANDARD COMPONENTS ===== */
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.required { color: #ef4444; }
.error-msg { font-size: 0.8rem; color: #ef4444; margin: 0; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.mono { font-family: monospace; }

/* CUSTOM SELECT */
.custom-select { position: relative; }
.custom-select-trigger {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; border: 1px solid var(--border-main);
  border-radius: 8px; background: var(--bg-input);
  cursor: pointer; min-height: 40px; transition: border 0.15s;
}
.custom-select-trigger:hover { border-color: #6366f1; }
.custom-select.is-error .custom-select-trigger { border-color: #ef4444; }
.custom-select.is-disabled .custom-select-trigger { opacity: 0.55; cursor: not-allowed; }
.custom-select.is-disabled .custom-select-trigger:hover { border-color: var(--border-main); }
.placeholder { font-size: 0.875rem; color: var(--text-muted); }
.selected-tag {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 2px 8px; background: rgba(99,102,241,0.1);
  color: #6366f1; border-radius: 6px; font-size: 0.82rem; font-weight: 600;
}
.selected-tag button { background: none; border: none; color: #6366f1; cursor: pointer; font-size: 1rem; line-height: 1; padding: 0; }
.select-arrow { font-size: 0.65rem; color: var(--text-muted); transition: transform 0.2s; }
.select-arrow.rotated { transform: rotate(180deg); }
.custom-select-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  background: var(--bg-card); border: 1px solid var(--border-main);
  border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 500; overflow: hidden;
}
.select-search { width: 100%; padding: 8px 12px; border: none; border-bottom: 1px solid var(--border-main); background: var(--bg-input); font-size: 0.84rem; outline: none; color: var(--text-primary); }
.select-options { max-height: 180px; overflow-y: auto; padding: 6px; }
.select-option { padding: 8px 10px; border-radius: 6px; font-size: 0.84rem; cursor: pointer; color: var(--text-primary); transition: background 0.15s; }
.select-option:hover { background: var(--bg-nav-hover); }
.select-option.active { background: rgba(99,102,241,0.1); color: #6366f1; font-weight: 600; }
.select-empty { text-align: center; color: var(--text-muted); font-size: 0.82rem; padding: 12px 0; margin: 0; }

/* ===== REGION PICKER ===== */
.picker-box {
  border: 1px dashed var(--border-main);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--bg-input);
}
.picker-box.is-locked { opacity: 0.55; pointer-events: none; }
.picker-title { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 700; color: #6366f1; flex-wrap: wrap; }
.picker-hint { font-size: 0.72rem; font-weight: 500; color: var(--text-muted); }
.picker-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.picker-preview { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-primary); font-weight: 500; }

/* ===== AREA LIST (di form) ===== */
.area-count { font-weight: 600; color: #6366f1; text-transform: none; letter-spacing: 0; }
.area-list {
  border: 1px solid var(--border-main);
  border-radius: 8px;
  max-height: 240px;
  overflow-y: auto;
  padding: 6px;
}
.area-list.is-error { border-color: #ef4444; }
.area-row { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 6px; }
.area-row:hover { background: var(--bg-nav-hover); }
.area-label { flex: 1; font-size: 0.84rem; color: var(--text-primary); font-weight: 500; }
.area-code { font-size: 0.75rem; color: var(--text-muted); }

/* MODAL FOOTER BUTTONS */
.btn-cancel {
  padding: 8px 18px;
  background: var(--bg-main, #f1f5f9);
  color: var(--text-muted);
  border: 1px solid var(--border-main);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-cancel:hover { background: var(--border-main); color: var(--text-primary); }
.btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-save:hover { background: #4f46e5; }
.btn-save:disabled  { background: #a5b4fc; cursor: not-allowed; opacity: 0.8; }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}

/* DETAIL MODAL CONTENT */
.detail-list { display: flex; flex-direction: column; }
.detail-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-main); gap: 12px; }
.detail-row:last-child { border-bottom: none; }
.detail-value { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); }
.detail-avatar {
  width: 52px; height: 52px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(99,102,241,0.1); color: #6366f1; font-size: 1.3rem;
  border: 2px solid var(--border-main);
}
.detail-section-label {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6366f1;
  padding: 8px 0 4px;
  border-bottom: 1px solid var(--border-main);
  margin-bottom: 2px;
}

.spinner-custom {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(99, 102, 241, 0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
  gap: 8px;
}
.empty-img { max-width: 200px; height: auto; opacity: 0.85; }
.empty-text { font-size: 0.9rem; font-weight: 600; color: var(--text-muted); }
</style>