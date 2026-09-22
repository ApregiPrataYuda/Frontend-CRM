<script setup>
import { ref, computed, onMounted } from 'vue'
import AppModal from '@/components/AppModal.vue'
import { useConfirm } from '@/composables/useConfirm'
import { useContactStore, SOURCE_TYPE_OPTIONS, LINKABLE_SOURCE_TYPE_OPTIONS } from '@/stores/contactStore'
import { useContactTypeStore } from '@/stores/contactTypeStore'
import { usePermissionStore } from '@/stores/PermissionStore'
import { useAuthStore } from '@/stores/authStore'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'

const { confirm } = useConfirm()
const toast            = useToast()
const contactStore     = useContactStore()
const contactTypeStore = useContactTypeStore()
const permission       = usePermissionStore()
const authStore        = useAuthStore()
const route            = useRoute()

// ── PERMISSIONS ────────────────────────────
// Sama seperti halaman Contact Admin/Manager: data yang ditampilkan tetap
// SEMUA contact perusahaan (tidak difilter per-sales), tapi khusus di
// halaman Sales ini tombol Edit/Delete/Unlink dibatasi lagi lewat
// isOwner() di bawah -- cuma boleh untuk contact yang sales ini buat/link
// sendiri (created_by === user login). Data milik sales lain tetap boleh
// DILIHAT (Detail), cuma tidak bisa diubah/dihapus dari sini.
const currentUrl = computed(() => route.path.replace('/app', ''))
const canCreate  = computed(() => permission.canCreate(currentUrl.value))
const canUpdate  = computed(() => permission.canUpdate(currentUrl.value))
const canDelete  = computed(() => permission.canDelete(currentUrl.value))
const canView    = computed(() => permission.canView(currentUrl.value))

// ── OWNERSHIP (khusus halaman Sales) ────────
// created_by di setiap row contact (lihat ContactResources.php) dibanding
// dengan ID user yang lagi login (authStore.user.id, sudah dinormalisasi
// dari id/id_user waktu login -- lihat authStore.js). Pakai String(...)
// biar aman kalau salah satu sisi angka & satunya string.
const currentUserId = computed(() => authStore.user?.id ?? null)

function isOwner(item) {
  return item?.created_by != null
    && currentUserId.value != null
    && String(item.created_by) === String(currentUserId.value)
}

// Edit standalone: harus (1) bukan linked contact (aturan lama, backend
// juga menolak 403), DAN (2) contact ini dibuat oleh sales yang lagi login.
function canEditRow(item) {
  return canUpdate.value && !item.source_type && isOwner(item)
}

// Delete/Unlink: hanya untuk contact (standalone ATAU linked) yang
// dibuat/di-link oleh sales yang lagi login sendiri.
function canDeleteRow(item) {
  return canDelete.value && isOwner(item)
}

// ── STATUS OPTIONS ──────────────────────────
// Asumsi 2 nilai (mengikuti default 'Active' di migration contacts) --
// sesuaikan kalau ternyata ada status lain di backend.
const statusOptions = ['Active', 'Inactive']

// ── FETCH AWAL ─────────────────────────────
onMounted(() => {
  contactStore.fetchContacts()
  // dipakai untuk dropdown filter "Type" & pilihan jenis di form standalone
  contactTypeStore.fetchAllContactTypes()
})

// Jenis yang boleh dipilih manual di form standalone (bukan yang reserved)
const selectableContactTypes = computed(
  () => contactTypeStore.allContactTypes.filter(t => !t.is_system)
)

// ── Untuk dropdown "Filter Type": sama seperti LINKABLE_SOURCE_TYPE_OPTIONS,
// jenis reserved "Customer" masih disembunyikan karena saat ini link
// dari sumber itu belum dibuka -- filter yang pasti hasilnya kosong
// cuma bikin bingung. Jenis reserved "Customer Contact", "Branch Contact"
// (PIC), dan "Lead" tetap tampil karena ketiganya aktif dipakai, dan
// semua jenis custom (Principle, Competitor, dll) tetap tampil semua. ──
const filterableContactTypes = computed(() =>
  contactTypeStore.allContactTypes.filter(t => {
    if (!t.is_system) return true
    return (
      t.system_source_type === 'customer_contact' ||
      t.system_source_type === 'branch_contact' ||
      t.system_source_type === 'lead'
    )
  })
)

// ── DROPDOWN TOGGLES ───────────────────────
const showPerPageMenu   = ref(false)
const showSortByMenu    = ref(false)
const showSortDirMenu   = ref(false)
const showTypeFilter    = ref(false)
const showSourceFilter  = ref(false)
const showStatusFilter  = ref(false)
const showAddChoiceMenu = ref(false)

// ── VIEW MODE (Card / Table) ───────────────
// Ikut konvensi halaman Sales lain (mis. CustomersManagement.vue):
// diingat per browser lewat localStorage, beda dari halaman Contact
// Admin/Manager yang sengaja tidak menyimpannya.
const VIEW_MODE_KEY = 'contact_view_mode'
const viewMode = ref(localStorage.getItem(VIEW_MODE_KEY) || 'card')

function setViewMode(mode) {
  viewMode.value = mode
  localStorage.setItem(VIEW_MODE_KEY, mode)
}

// ── SORT OPTIONS ───────────────────────────
const sortByOptions = [
  { label: 'Created Date',  value: 'created_at' },
  { label: 'Name/Company',  value: 'company_name' },
  { label: 'Status',        value: 'status' },
]
const sortByLabel = computed(
  () => sortByOptions.find(o => o.value === contactStore.sort.column)?.label ?? 'Created Date'
)

const typeFilterLabel = computed(() => {
  if (!contactStore.filters.contact_type_id) return 'All Types'
  return contactTypeStore.allContactTypes.find(
    t => String(t.id) === String(contactStore.filters.contact_type_id)
  )?.name ?? 'All Types'
})

const sourceFilterLabel = computed(() => {
  if (!contactStore.filters.source_type) return 'All Sources'
  return SOURCE_TYPE_OPTIONS.find(o => o.value === contactStore.filters.source_type)?.label ?? 'All Sources'
})

// ── RESET ──────────────────────────────────
function handleReset() {
  showPerPageMenu.value  = false
  showSortByMenu.value   = false
  showSortDirMenu.value  = false
  showTypeFilter.value   = false
  showSourceFilter.value = false
  showStatusFilter.value = false
  contactStore.resetFilters()
}

// ============================================================
// ADD STANDALONE (Principle, Competitor, dll)
// ============================================================
const isStandaloneModalVisible = ref(false)
const isEditStandalone          = ref(false)
const selectedEditItem          = ref(null)

const form = ref({
  contact_type_id: '',
  company_name: '',
  contact_name: '',
  email: [''],
  phone: [''],
  address: '',
  notes: '',
  status: 'Active',
})

// ── Loading kecil khusus untuk fetch detail di openEditStandaloneModal
// (lihat catatan di bawah) -- dipakai buat disable tombol Save sebentar
// supaya user tidak submit sebelum data email/phone yang fresh selesai
// dimuat. ──
const loadingEditDetail = ref(false)

// ── email/phone sekarang array (multi-value). Helper ini menyeragamkan
// nilai apa pun (array asli dari detail Eloquent, string tunggal lama,
// atau string "diratakan" hasil listing/card -- lihat ContactController::
// index()) jadi array yang siap dipakai form. Selalu minimal 1 elemen
// (boleh string kosong) supaya selalu ada 1 input yang tampil di form. ──
function toMultiValueArray(value) {
  if (Array.isArray(value)) {
    return value.length ? [...value] : ['']
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map(v => v.trim()).filter(Boolean)
  }
  return ['']
}

// ── Buang entry kosong & duplikat sebelum dikirim ke backend. Backend
// (ContactValidationRequest::normalizeMultiValue) sebenarnya sudah jaga
// hal yang sama, ini cuma supaya payload yang dikirim juga bersih. ──
function cleanMultiValueArray(arr) {
  return [...new Set((arr || []).map(v => (v ?? '').trim()).filter(Boolean))]
}

function addEmailField() {
  form.value.email.push('')
}
function removeEmailField(idx) {
  form.value.email.splice(idx, 1)
  if (!form.value.email.length) form.value.email.push('')
}
function addPhoneField() {
  form.value.phone.push('')
}
function removePhoneField(idx) {
  form.value.phone.splice(idx, 1)
  if (!form.value.phone.length) form.value.phone.push('')
}

function openAddStandaloneModal() {
  showAddChoiceMenu.value = false
  isEditStandalone.value  = false
  selectedEditItem.value  = null
  form.value = {
    contact_type_id: '',
    company_name: '',
    contact_name: '',
    email: [''],
    phone: [''],
    address: '',
    notes: '',
    status: 'Active',
  }
  contactStore.errorContact       = null
  isStandaloneModalVisible.value  = true
}

async function openEditStandaloneModal(item) {
  // ── Contact hasil link datanya live dari sumber lain -- tidak boleh
  // diedit langsung dari sini (backend juga menolak 403). Tombol edit
  // di tabel sudah di-disable untuk baris linked, guard ini jaga-jaga. ──
  if (item.source_type) {
    toast.error('Linked contact cannot be edited directly. Update it from its original source.')
    return
  }
  // ── Guard tambahan khusus halaman Sales: cuma boleh edit contact
  // yang dia buat sendiri. Tombol di template sudah di-disable untuk
  // kasus ini, guard ini jaga-jaga kalau dipanggil dari tempat lain. ──
  if (!isOwner(item)) {
    toast.error('You can only edit contacts you created yourself.')
    return
  }
  isEditStandalone.value = true
  selectedEditItem.value = item

  // ── Isi form dulu pakai data dari baris list/card supaya modal
  // langsung terbuka tanpa menunggu (email/phone di sini masih versi
  // "diratakan" jadi 1 teks gabungan koma -- lihat ContactController::
  // index()), lalu ditimpa dengan data detail yang FRESH begitu selesai
  // di-fetch (email/phone jadi array asli). Ini supaya kalau contact
  // punya lebih dari 1 email/phone, tidak lossy round-trip lewat versi
  // yang sudah diratakan untuk tampilan. ──
  form.value = {
    contact_type_id: item.contact_type_id ?? '',
    company_name: item.company_name ?? '',
    contact_name: item.contact_name ?? '',
    email: toMultiValueArray(item.email),
    phone: toMultiValueArray(item.phone),
    address: item.address ?? '',
    notes: item.notes ?? '',
    status: item.status ?? 'Active',
  }
  contactStore.errorContact      = null
  isStandaloneModalVisible.value = true

  loadingEditDetail.value = true
  const detail = await contactStore.fetchContactDetail(item.id)
  loadingEditDetail.value = false

  // Guard: kalau user keburu tutup modal atau pindah ke edit item lain
  // sebelum fetch ini selesai, jangan timpa form yang sedang aktif.
  if (!isStandaloneModalVisible.value || selectedEditItem.value?.id !== item.id) return

  if (detail) {
    form.value.email = toMultiValueArray(detail.email)
    form.value.phone = toMultiValueArray(detail.phone)
  }
}

function closeStandaloneModal() {
  isStandaloneModalVisible.value = false
  contactStore.errorContact      = null
}

async function submitStandaloneForm() {
  if (!form.value.contact_type_id) {
    toast.error('Contact type is required!')
    return
  }
  if (!form.value.company_name.trim()) {
    toast.error('Company name is required!')
    return
  }

  const payload = {
    ...form.value,
    email: cleanMultiValueArray(form.value.email),
    phone: cleanMultiValueArray(form.value.phone),
  }

  if (isEditStandalone.value && selectedEditItem.value) {
    const ok = await contactStore.updateContactStandalone(selectedEditItem.value.id, payload)
    if (ok) { toast.success('Contact updated successfully'); closeStandaloneModal() }
  } else {
    const ok = await contactStore.saveContactStandalone(payload)
    if (ok) { toast.success('Contact added successfully'); closeStandaloneModal() }
  }
}

// ============================================================
// LINK DARI DATA EXISTING
// ============================================================
const isLinkModalVisible = ref(false)
const linkSourceType     = ref('')
const linkSearchKeyword  = ref('')
const linkSelectedItem   = ref(null)
const linkNotes          = ref('')
const linkStatus         = ref('Active')

function openLinkModal() {
  showAddChoiceMenu.value = false
  linkSourceType.value    = ''
  linkSearchKeyword.value = ''
  linkSelectedItem.value  = null
  linkNotes.value         = ''
  linkStatus.value        = 'Active'
  contactStore.errorContact = null
  contactStore.clearSourceOptions()
  isLinkModalVisible.value = true
}

function closeLinkModal() {
  isLinkModalVisible.value = false
  contactStore.clearSourceOptions()
}

function onLinkSourceTypeChange() {
  linkSearchKeyword.value = ''
  linkSelectedItem.value  = null
  contactStore.clearSourceOptions()
}

function onLinkSearchInput() {
  linkSelectedItem.value = null
  contactStore.searchSource(linkSourceType.value, linkSearchKeyword.value)
}

function pickLinkOption(opt) {
  linkSelectedItem.value = opt
  contactStore.clearSourceOptions()
  linkSearchKeyword.value = opt.label
}

async function submitLinkForm() {
  if (!linkSourceType.value) {
    toast.error('Please select a data source first (Customer/Lead/etc.)!')
    return
  }
  if (!linkSelectedItem.value) {
    toast.error('Please select one of the search results!')
    return
  }

  const payload = {
    source_type: linkSourceType.value,
    source_id:   linkSelectedItem.value.id,
    notes:       linkNotes.value,
    status:      linkStatus.value,
  }

  const ok = await contactStore.linkContact(payload)
  if (ok) { toast.success('Contact linked successfully'); closeLinkModal() }
}

// ── DETAIL MODAL ───────────────────────────
const isDetailModalVisible = ref(false)

async function openDetailModal(item) {
  isDetailModalVisible.value = true
  await contactStore.fetchContactDetail(item.id)
}
function closeDetailModal() {
  isDetailModalVisible.value = false
}

// ── Tampilkan email/phone di modal Detail -- untuk contact standalone
// (Eloquent, lewat fetchContactDetail) nilainya array asli (bisa lebih
// dari 1), untuk contact linked masih string tunggal biasa (dari
// Contact::resolveSource()). Digabung jadi 1 teks dipisah koma. ──
function formatMultiValue(value) {
  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : '-'
  }
  return value || '-'
}

// ── DELETE / UNLINK ────────────────────────
async function openDeleteModal(item) {
  // ── Guard tambahan khusus halaman Sales: cuma boleh delete/unlink
  // contact yang dia buat/link sendiri. Tombol di template sudah
  // di-disable untuk kasus ini, guard ini jaga-jaga. ──
  if (!isOwner(item)) {
    toast.error('You can only delete/unlink contacts you created yourself.')
    return
  }

  const isLinked = !!item.source_type

  const isConfirmed = await confirm({
    type:        'danger',
    title:       isLinked ? 'Unlink Contact' : 'Hapus Data Contact',
    message:     isLinked
      ? `Yakin ingin unlink contact "${item.company_name}"? Data asli di sumbernya tidak akan terhapus.`
      : `Yakin ingin menghapus contact "${item.company_name}"?`,
    detail:      'Tindakan ini tidak bisa dibatalkan.',
    confirmText: isLinked ? 'Yes, Unlink' : 'Yes, Delete',
    cancelText:  'Cancel',
  })

  if (isConfirmed) {
    const result = await contactStore.deleteContact(item.id)
    if (result.ok) toast.success(result.message || 'Success')
    else           toast.error(result.message || 'Failed to delete contact')
  }
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <!-- ── BREADCRUMB ── -->
    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="address-book" /> Contact Management
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" /> Home
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Contact</span>
        </div>
      </div>
    </div>

    <!-- ── TOOLBAR TOP ── -->
    <div class="toolbar-top">
      <div class="toolbar-left">
        <span class="toolbar-note">
          <font-awesome-icon icon="circle-info" /> Contact can be filled in manually (Principle, Competitor, etc.) or linked from existing Customer/Lead/PIC data.
        </span>
      </div>

      <button class="btn-toolbar btn-orange" @click="handleReset">
        <font-awesome-icon icon="rotate-left" /> Reset
      </button>
    </div>

    <!-- ── CONTROLS ROW ── -->
    <div class="controls-card">
      <div class="controls-row">
        <div class="controls-left">
          <div class="showing-wrap">
            <font-awesome-icon icon="list" class="text-muted-color" />
            <span class="showing-label">Showing:</span>
            <div class="drop-wrap">
              <button class="btn-select" @click="showPerPageMenu = !showPerPageMenu">
                {{ contactStore.pagination.per_page }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showPerPageMenu }">
                <div class="drop-label">Per page</div>
                <div class="perpage-grid">
                  <button
                    v-for="opt in [5, 10, 25, 50]" :key="opt"
                    class="perpage-opt"
                    :class="{ active: contactStore.pagination.per_page === opt }"
                    @click="contactStore.pagination.per_page = opt; contactStore.changePageSize(); showPerPageMenu = false"
                  >{{ opt }}</button>
                </div>
              </div>
            </div>
          </div>

          <!-- View Toggle: Card / Table -->
          <div class="view-toggle">
            <button
              class="view-toggle-btn"
              :class="{ active: viewMode === 'card' }"
              title="Card View"
              @click="setViewMode('card')"
            >
              <font-awesome-icon icon="table-cells" /> Card
            </button>
            <button
              class="view-toggle-btn"
              :class="{ active: viewMode === 'table' }"
              title="Table View"
              @click="setViewMode('table')"
            >
              <font-awesome-icon icon="table-list" /> Table
            </button>
          </div>

          <!-- Add: pilihan Standalone / Link -->
          <div class="drop-wrap" v-if="canCreate">
            <button class="btn-toolbar btn-purple" @click="showAddChoiceMenu = !showAddChoiceMenu">
              <font-awesome-icon icon="plus" /> Add Contact
              <font-awesome-icon icon="chevron-down" class="btn-arrow" />
            </button>
            <div class="drop-menu" :class="{ show: showAddChoiceMenu }">
              <div class="drop-label">Choose How to Add</div>
              <button class="drop-item" @click="openAddStandaloneModal">
                <font-awesome-icon icon="pen" style="color:#6366f1" /> Manual Input (Principle, Competitor, etc.)
              </button>
              <button class="drop-item" @click="openLinkModal">
                <font-awesome-icon icon="link" style="color:#16a34a" /> Link from Existing Data
              </button>
            </div>
          </div>
        </div>

        <div class="controls-right">
          <div class="search-wrap">
            <input
              v-model="contactStore.searchContacts"
              type="text"
              placeholder="Searching...."
              class="search-input"
              @input="contactStore.searchWithDelay()"
            />
            <button class="search-btn">
              <font-awesome-icon icon="magnifying-glass" />
            </button>
          </div>

          <div class="sort-wrap">
            <span class="showing-label">Sort:</span>
            <div class="drop-wrap">
              <button class="btn-select" @click="showSortByMenu = !showSortByMenu">
                {{ sortByLabel }} <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showSortByMenu }">
                <div class="drop-label">Sort By</div>
                <button
                  v-for="opt in sortByOptions" :key="opt.value"
                  class="drop-item"
                  :class="{ active: contactStore.sort.column === opt.value }"
                  @click="contactStore.sort.column = opt.value; contactStore.changeSorting(); showSortByMenu = false"
                >{{ opt.label }}</button>
              </div>
            </div>

            <div class="drop-wrap">
              <button class="btn-select" @click="showSortDirMenu = !showSortDirMenu">
                {{ contactStore.sort.direction.toUpperCase() }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-right" :class="{ show: showSortDirMenu }">
                <div class="drop-label">Order</div>
                <button
                  v-for="opt in [{ label: 'DESC', value: 'desc' }, { label: 'ASC', value: 'asc' }]"
                  :key="opt.value"
                  class="drop-item"
                  :class="{ active: contactStore.sort.direction === opt.value }"
                  @click="contactStore.sort.direction = opt.value; contactStore.changeSorting(); showSortDirMenu = false"
                >{{ opt.label }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FILTER ROW -->
      <div class="controls-row filter-row">
        <div class="controls-left">

          <!-- Filter Type -->
          <div class="drop-wrap">
            <button class="btn-select" @click="showTypeFilter = !showTypeFilter">
              <font-awesome-icon icon="tags" /> {{ typeFilterLabel }}
              <font-awesome-icon icon="chevron-down" class="btn-arrow" />
            </button>
            <div class="drop-menu" :class="{ show: showTypeFilter }">
              <div class="drop-label">Filter Type</div>
              <button
                class="drop-item"
                :class="{ active: !contactStore.filters.contact_type_id }"
                @click="contactStore.filters.contact_type_id = ''; contactStore.changeFilters(); showTypeFilter = false"
              >All Types</button>
              <button
                v-for="t in filterableContactTypes" :key="t.id"
                class="drop-item"
                :class="{ active: String(contactStore.filters.contact_type_id) === String(t.id) }"
                @click="contactStore.filters.contact_type_id = t.id; contactStore.changeFilters(); showTypeFilter = false"
              >{{ t.name }}</button>
            </div>
          </div>

          <!-- Filter Source -->
          <div class="drop-wrap">
            <button class="btn-select" @click="showSourceFilter = !showSourceFilter">
              <font-awesome-icon icon="diagram-project" /> {{ sourceFilterLabel }}
              <font-awesome-icon icon="chevron-down" class="btn-arrow" />
            </button>
            <div class="drop-menu" :class="{ show: showSourceFilter }">
              <div class="drop-label">Filter Source</div>
              <button
                class="drop-item"
                :class="{ active: !contactStore.filters.source_type }"
                @click="contactStore.filters.source_type = ''; contactStore.changeFilters(); showSourceFilter = false"
              >All Sources</button>
              <button
                v-for="opt in LINKABLE_SOURCE_TYPE_OPTIONS" :key="opt.value"
                class="drop-item"
                :class="{ active: contactStore.filters.source_type === opt.value }"
                @click="contactStore.filters.source_type = opt.value; contactStore.changeFilters(); showSourceFilter = false"
              >{{ opt.label }}</button>
            </div>
          </div>

          <!-- Filter Status -->
          <div class="drop-wrap">
            <button class="btn-select" @click="showStatusFilter = !showStatusFilter">
              <font-awesome-icon icon="circle-check" /> {{ contactStore.filters.status || 'All Status' }}
              <font-awesome-icon icon="chevron-down" class="btn-arrow" />
            </button>
            <div class="drop-menu" :class="{ show: showStatusFilter }">
              <div class="drop-label">Filter Status</div>
              <button
                class="drop-item"
                :class="{ active: !contactStore.filters.status }"
                @click="contactStore.filters.status = ''; contactStore.changeFilters(); showStatusFilter = false"
              >All Status</button>
              <button
                v-for="s in statusOptions" :key="s"
                class="drop-item"
                :class="{ active: contactStore.filters.status === s }"
                @click="contactStore.filters.status = s; contactStore.changeFilters(); showStatusFilter = false"
              >{{ s }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── CARD VIEW ── -->
    <div v-if="viewMode === 'card'" class="card-grid-wrap flex-grow-1 overflow-auto mb-3">

      <!-- Loading -->
      <div v-if="contactStore.loadingContacts" class="td-center">
        <div style="display:flex; justify-content:center;">
          <div class="spinner-custom"></div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="!contactStore.contactsData.length" class="empty-state" style="padding: 40px 0;">
        <img
          src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif"
          alt="No data found"
          class="empty-img"
        />
        <div class="empty-text">No data found</div>
      </div>

      <!-- Cards -->
      <div v-else class="card-grid">
        <div v-for="item in contactStore.contactsData" :key="item.id" class="contact-card">
          <div class="contact-card-top">
            <span class="menu-badge">{{ item.contact_type_name || '-' }}</span>
            <span v-if="item.status === 'Active'" class="badge-active">Active</span>
            <span v-else class="badge-inactive">{{ item.status || '-' }}</span>
          </div>

          <div class="contact-card-title">{{ item.company_name || '-' }}</div>
          <div v-if="item.parent_label" class="td-sub">under: {{ item.parent_label }}</div>

          <div class="contact-card-body">
            <div v-if="item.contact_name" class="contact-card-row">
              <font-awesome-icon icon="user" /> {{ item.contact_name }}
            </div>
            <div v-if="item.email" class="contact-card-row">
              <font-awesome-icon icon="envelope" /> {{ item.email }}
            </div>
            <div v-if="item.phone" class="contact-card-row">
              <font-awesome-icon icon="phone" /> {{ item.phone }}
            </div>
          </div>

          <div class="contact-card-footer">
            <span v-if="!item.source_type" class="badge-standalone">Standalone</span>
            <span v-else class="badge-linked">{{ contactStore.sourceLabel(item) }}</span>
            <span v-if="item.contact_code" class="td-sub mono">{{ item.contact_code }}</span>
            <span v-else-if="item.source_code" class="td-sub mono">{{ item.source_code }}</span>
          </div>

          <div class="contact-card-actions">
            <button
              v-if="canEditRow(item)"
              class="act-btn act-edit"
              title="Edit"
              @click="openEditStandaloneModal(item)"
            >
              <font-awesome-icon icon="pen-to-square" />
            </button>

            <button
              v-if="canDelete"
              class="act-btn act-delete"
              :class="{ 'act-disabled': !isOwner(item) }"
              :title="!isOwner(item) ? 'You can only delete/unlink contacts you created' : (item.source_type ? 'Unlink' : 'Delete')"
              :disabled="contactStore.deletingContact || !canDeleteRow(item)"
              @click="openDeleteModal(item)"
            >
              <font-awesome-icon :icon="item.source_type ? 'link-slash' : 'trash-can'" />
            </button>

            <button
              v-if="canView"
              class="act-btn act-info"
              title="Detail"
              @click="openDetailModal(item)"
            >
              <font-awesome-icon icon="circle-info" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── TABLE VIEW ── -->
    <div v-if="viewMode === 'table'" class="table-card flex-grow-1 overflow-auto mb-3">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:60px">NO.</th>
            <th style="width:120px">TYPE</th>
            <th>COMPANY / NAME</th>
            <th>CONTACT PERSON</th>
            <th>EMAIL</th>
            <th>PHONE</th>
            <th style="width:150px">SOURCE</th>
            <th style="width:100px; text-align:center">STATUS</th>
            <th style="width:150px">CREATED</th>
            <th style="width:150px; text-align:center">ACTIONS</th>
          </tr>
        </thead>
        <tbody>

          <!-- Loading -->
          <tr v-if="contactStore.loadingContacts">
            <td colspan="10" class="td-center">
              <div style="display:flex; justify-content:center;">
                <div class="spinner-custom"></div>
              </div>
            </td>
          </tr>

          <!-- Empty -->
          <tr v-else-if="!contactStore.contactsData.length">
            <td colspan="10" class="td-center">
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

          <!-- Data -->
          <tr
            v-else
            v-for="(item, index) in contactStore.contactsData"
            :key="item.id"
            class="data-row"
          >
            <td class="td-no">
              {{ (contactStore.pagination.current_page - 1) * contactStore.pagination.per_page + index + 1 }}.
            </td>
            <td>
              <span class="menu-badge">{{ item.contact_type_name || '-' }}</span>
            </td>
            <td class="td-name">
              {{ item.company_name || '-' }}
              <div v-if="item.parent_label" class="td-sub">under: {{ item.parent_label }}</div>
            </td>
            <td class="td-muted">{{ item.contact_name || '-' }}</td>
            <td class="td-muted">{{ item.email || '-' }}</td>
            <td class="td-muted">{{ item.phone || '-' }}</td>
            <td>
              <span v-if="!item.source_type" class="badge-standalone">Standalone</span>
              <span v-else class="badge-linked">{{ contactStore.sourceLabel(item) }}</span>
              <div v-if="item.contact_code" class="td-sub mono">{{ item.contact_code }}</div>
              <div v-else-if="item.source_code" class="td-sub mono">{{ item.source_code }}</div>
            </td>
            <td style="text-align:center">
              <span v-if="item.status === 'Active'" class="badge-active">Active</span>
              <span v-else class="badge-inactive">{{ item.status || '-' }}</span>
            </td>
            <td class="td-muted">{{ contactStore.formatDate(item.created_at) }}</td>
            <td class="td-actions">
              <!-- Edit (standalone & milik sendiri saja -- disembunyikan
                   total kalau bukan haknya, bukan cuma di-disable) -->
              <button
                v-if="canEditRow(item)"
                class="act-btn act-edit"
                title="Edit"
                @click="openEditStandaloneModal(item)"
              >
                <font-awesome-icon icon="pen-to-square" />
              </button>

              <!-- Delete / Unlink (milik sendiri saja) -->
              <button
                v-if="canDelete"
                class="act-btn act-delete"
                :class="{ 'act-disabled': !isOwner(item) }"
                :title="!isOwner(item) ? 'You can only delete/unlink contacts you created' : (item.source_type ? 'Unlink' : 'Delete')"
                :disabled="contactStore.deletingContact || !canDeleteRow(item)"
                @click="openDeleteModal(item)"
              >
                <font-awesome-icon :icon="item.source_type ? 'link-slash' : 'trash-can'" />
              </button>

              <!-- Detail -->
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

    <!-- ── PAGINATION ── -->
    <div class="pagination-card">
      <div class="pagination-nav">
        <button
          class="btn-prev-next"
          :disabled="!contactStore.pagination.prev_page_url || contactStore.loadingContacts"
          @click="contactStore.fetchContacts(contactStore.pagination.prev_page_url)"
        >
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button
          class="btn-prev-next"
          :disabled="!contactStore.pagination.next_page_url || contactStore.loadingContacts"
          @click="contactStore.fetchContacts(contactStore.pagination.next_page_url)"
        >
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">
          {{ contactStore.contactsData.length }} DATA | ON PAGE {{ contactStore.pagination.current_page }}
        </span>
        <span class="page-badge">TOTAL: {{ contactStore.pagination.total }}</span>
      </div>
    </div>

    <!-- ── MODAL ADD/EDIT STANDALONE ── -->
    <AppModal
      :show="isStandaloneModalVisible"
      :title="isEditStandalone ? 'Edit Contact' : 'Add Contact (Manual)'"
      :icon="isEditStandalone ? 'pen' : 'plus'"
      size="md"
      @close="closeStandaloneModal"
    >
      <div class="form-container-gap">
        <div class="form-group">
          <label>Contact Type</label>
          <select
            v-model="form.contact_type_id"
            class="form-input"
            :class="{ 'input-error': contactStore.errorContact?.contact_type_id }"
          >
            <option value="" disabled>-- Select Type --</option>
            <option v-for="t in selectableContactTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
          <span v-if="contactStore.errorContact?.contact_type_id" class="field-error">
            {{ contactStore.errorContact.contact_type_id[0] }}
          </span>
        </div>

        <div class="form-group">
          <label>Company Name</label>
          <input
            v-model="form.company_name"
            class="form-input"
            :class="{ 'input-error': contactStore.errorContact?.company_name }"
            placeholder="e.g. PT. Sumber Makmur"
            @input="contactStore.errorContact = null"
          />
          <span v-if="contactStore.errorContact?.company_name" class="field-error">
            {{ contactStore.errorContact.company_name[0] }}
          </span>
        </div>

        <div class="form-group">
          <label>Contact Person</label>
          <input v-model="form.contact_name" class="form-input" placeholder="PIC name (optional)" />
        </div>

        <div class="form-group">
          <label>Email</label>
          <div v-for="(em, idx) in form.email" :key="'email-' + idx" class="multi-input-row">
            <input
              v-model="form.email[idx]"
              type="email"
              class="form-input"
              placeholder="email@company.com (optional)"
            />
            <button
              v-if="form.email.length > 1"
              type="button"
              class="btn-multi-remove"
              title="Remove"
              @click="removeEmailField(idx)"
            >
              <font-awesome-icon icon="xmark" />
            </button>
          </div>
          <button type="button" class="btn-multi-add" @click="addEmailField">
            <font-awesome-icon icon="plus" /> Add another email
          </button>
          <span v-if="loadingEditDetail" class="field-hint">
            <font-awesome-icon icon="spinner" spin /> Loading latest data...
          </span>
        </div>

        <div class="form-group">
          <label>Phone</label>
          <div v-for="(ph, idx) in form.phone" :key="'phone-' + idx" class="multi-input-row">
            <input
              v-model="form.phone[idx]"
              class="form-input"
              placeholder="08xx / (021)xxx (optional)"
            />
            <button
              v-if="form.phone.length > 1"
              type="button"
              class="btn-multi-remove"
              title="Remove"
              @click="removePhoneField(idx)"
            >
              <font-awesome-icon icon="xmark" />
            </button>
          </div>
          <button type="button" class="btn-multi-add" @click="addPhoneField">
            <font-awesome-icon icon="plus" /> Add another phone
          </button>
        </div>

        <div class="form-group">
          <label>Address</label>
          <textarea v-model="form.address" class="form-input form-textarea" rows="2" placeholder="Address (optional)"></textarea>
        </div>

        <div class="form-group">
          <label>Notes</label>
          <textarea v-model="form.notes" class="form-input form-textarea" rows="2" placeholder="Additional notes (optional)"></textarea>
        </div>

        <div class="form-group">
          <label>Status</label>
          <select v-model="form.status" class="form-input">
            <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
      </div>

      <template #footer>
        <button class="btn-cancel" :disabled="contactStore.savingContact || contactStore.updatingContact" @click="closeStandaloneModal">
          Cancel
        </button>
        <button
          class="btn-save"
          :disabled="contactStore.savingContact || contactStore.updatingContact || loadingEditDetail"
          @click="submitStandaloneForm"
        >
          <font-awesome-icon v-if="contactStore.savingContact || contactStore.updatingContact" icon="spinner" spin />
          <font-awesome-icon v-else icon="check" />
          {{ isEditStandalone
            ? (contactStore.updatingContact ? 'Updating...' : 'Update')
            : (contactStore.savingContact   ? 'Saving...'   : 'Save Data') }}
        </button>
      </template>
    </AppModal>

    <!-- ── MODAL LINK DARI DATA EXISTING ── -->
    <AppModal
      :show="isLinkModalVisible"
      title="Link from Existing Data"
      icon="link"
      size="md"
      @close="closeLinkModal"
    >
      <div class="form-container-gap">
        <div class="form-group">
          <label>Data Source</label>
          <select v-model="linkSourceType" class="form-input" @change="onLinkSourceTypeChange">
            <option value="" disabled>-- Select Source --</option>
            <option v-for="opt in LINKABLE_SOURCE_TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <div class="form-group" v-if="linkSourceType">
          <label>Search Data</label>
          <input
            v-model="linkSearchKeyword"
            class="form-input"
            placeholder="Type at least 2 characters to search..."
            @input="onLinkSearchInput"
          />

          <div v-if="contactStore.loadingSourceOptions" class="picker-loading">
            <div class="spinner-custom sm"></div>
          </div>

          <div v-else-if="contactStore.sourceOptions.length" class="picker-list">
            <button
              v-for="opt in contactStore.sourceOptions" :key="opt.id"
              class="picker-item"
              type="button"
              @click="pickLinkOption(opt)"
            >
              <div class="picker-item-main">{{ opt.label }}</div>
              <div class="picker-item-sub">
                <span v-if="opt.code">{{ opt.code }}</span>
                <span v-if="opt.parent_label"> · {{ opt.parent_label }}</span>
                <span v-if="opt.email"> · {{ opt.email }}</span>
              </div>
            </button>
          </div>

          <div v-if="linkSelectedItem" class="picker-selected">
            <font-awesome-icon icon="circle-check" style="color:#16a34a" />
            Selected: <strong>{{ linkSelectedItem.label }}</strong>
          </div>
        </div>

        <div class="form-group" v-if="linkSourceType">
          <label>Notes</label>
          <textarea v-model="linkNotes" class="form-input form-textarea" rows="2" placeholder="Additional notes (optional)"></textarea>
        </div>

        <div class="form-group" v-if="linkSourceType">
          <label>Status</label>
          <select v-model="linkStatus" class="form-input">
            <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
      </div>

      <template #footer>
        <button class="btn-cancel" :disabled="contactStore.linkingContact" @click="closeLinkModal">
          Cancel
        </button>
        <button class="btn-save" :disabled="contactStore.linkingContact || !linkSelectedItem" @click="submitLinkForm">
          <font-awesome-icon v-if="contactStore.linkingContact" icon="spinner" spin />
          <font-awesome-icon v-else icon="link" />
          {{ contactStore.linkingContact ? 'Linking...' : 'Link Contact' }}
        </button>
      </template>
    </AppModal>

    <!-- ── MODAL DETAIL ── -->
    <AppModal
      :show="isDetailModalVisible"
      title="Contact Details"
      icon="circle-info"
      size="md"
      @close="closeDetailModal"
    >
      <div v-if="contactStore.loadingDetail" class="td-center">
        <div class="spinner-custom" style="margin: 20px auto;"></div>
      </div>
      <div v-else-if="contactStore.contactDetail" class="detail-list">
        <div class="detail-row">
          <span class="detail-label">Contact ID</span>
          <span class="detail-value mono">#{{ contactStore.contactDetail.id }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Type</span>
          <span class="detail-badge">{{ contactStore.contactDetail.contact_type?.name || contactStore.contactDetail.contact_type_name || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Source</span>
          <span v-if="!contactStore.contactDetail.source_type" class="badge-standalone">Standalone</span>
          <span v-else class="badge-linked">{{ contactStore.sourceLabel(contactStore.contactDetail) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Code</span>
          <span class="detail-value mono">{{ contactStore.contactDetail.contact_code || contactStore.contactDetail.source_code || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Company / Name</span>
          <span class="detail-value">{{ contactStore.contactDetail.company_name || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Contact Person</span>
          <span class="detail-value">{{ contactStore.contactDetail.contact_name || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email</span>
          <span class="detail-value">{{ formatMultiValue(contactStore.contactDetail.email) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Phone</span>
          <span class="detail-value">{{ formatMultiValue(contactStore.contactDetail.phone) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Address</span>
          <span class="detail-value">{{ contactStore.contactDetail.address || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Notes</span>
          <span class="detail-value">{{ contactStore.contactDetail.notes || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status</span>
          <span v-if="contactStore.contactDetail.status === 'Active'" class="badge-active">Active</span>
          <span v-else class="badge-inactive">{{ contactStore.contactDetail.status || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Created At</span>
          <span class="detail-value">{{ contactStore.formatDate(contactStore.contactDetail.created_at) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Updated At</span>
          <span class="detail-value">{{ contactStore.formatDate(contactStore.contactDetail.updated_at) }}</span>
        </div>
      </div>
      <div v-else class="td-center">Data not available</div>
      <template #footer>
        <button class="btn-cancel" @click="closeDetailModal">Close</button>
      </template>
    </AppModal>

  </div>
</template>

<style scoped>
/* ── CSS VARIABLES ── */
.h-100 {
  --text-muted:    #64748b;
  --primary-color: #6366f1;
}

.form-container-gap { display: flex; flex-direction: column; gap: 14px; }

/* ── BREADCRUMB ── */
.breadcrumb-card { background: var(--bg-card); border-radius: 10px; padding: 16px 18px; box-shadow: 0 1px 3px var(--shadow-color); }
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

/* ── TOOLBAR TOP ── */
.toolbar-top { display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); border-radius: 10px; padding: 12px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); flex-wrap: wrap; gap: 8px; }
.toolbar-left { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.toolbar-note { font-size: 0.78rem; color: var(--text-muted); display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.btn-toolbar { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: none; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; transition: all 0.18s ease; white-space: nowrap; }
.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover { background: #4f46e5; }
.btn-orange { background: #f59e0b; color: #fff; }
.btn-orange:hover { background: #d97706; }
.btn-arrow { font-size: 0.6rem; opacity: 0.7; }

/* ── CONTROLS ── */
.controls-card { background: var(--bg-card); border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: column; gap: 10px; }
.controls-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.filter-row { padding-top: 8px; border-top: 1px dashed var(--border-main); }
.controls-left, .controls-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.showing-wrap { display: flex; align-items: center; gap: 6px; font-size: 0.84rem; color: var(--text-primary); font-weight: 600; }
.showing-label { white-space: nowrap; color: var(--text-muted); font-size: 0.83rem; }
.text-muted-color { color: var(--text-muted); }
.search-wrap { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.search-input { padding: 7px 12px; border: none; background: transparent; color: var(--text-primary); font-size: 0.84rem; outline: none; width: 180px; }
.search-input::placeholder { color: var(--text-muted); }
.search-btn { padding: 7px 12px; background: #6366f1; color: #fff; border: none; cursor: pointer; }
.search-btn:hover { background: #4f46e5; }
.sort-wrap { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

/* ── VIEW TOGGLE (Card / Table) ── */
.view-toggle { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; }
.view-toggle-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; background: var(--bg-input); border: none; color: var(--text-muted); cursor: pointer; font-size: 0.82rem; font-weight: 600; transition: all 0.15s; }
.view-toggle-btn:hover { color: #6366f1; }
.view-toggle-btn.active { background: #6366f1; color: #fff; }
.view-toggle-btn + .view-toggle-btn { border-left: 1px solid var(--border-main); }

/* ── DROPDOWN ── */
.drop-wrap { position: relative; }
.btn-select { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.83rem; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
.btn-select:hover { border-color: #6366f1; color: #6366f1; }
.drop-menu { position: absolute; top: calc(100% + 6px); left: 0; min-width: 200px; max-height: 320px; overflow-y: auto; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 10px; z-index: 300; opacity: 0; transform: translateY(-6px); pointer-events: none; transition: all 0.18s ease; }
.drop-right { left: auto; right: 0; }
.drop-menu.show { opacity: 1; transform: translateY(0); pointer-events: all; }
.drop-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; padding: 0 4px; }
.drop-item { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: none; border: none; border-radius: 7px; color: var(--text-primary); font-size: 0.84rem; cursor: pointer; text-align: left; }
.drop-item:hover { background: var(--bg-nav-hover); }
.drop-item.active { color: #6366f1; font-weight: 600; background: rgba(99,102,241,0.08); }
.perpage-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.perpage-opt { padding: 5px 10px; border: 1px solid var(--border-main); border-radius: 6px; background: var(--bg-input); color: var(--text-primary); font-size: 0.82rem; cursor: pointer; }
.perpage-opt:hover  { border-color: #6366f1; color: #6366f1; }
.perpage-opt.active { background: #6366f1; border-color: #6366f1; color: #fff; font-weight: 700; }

/* ── TABLE ── */
.table-card { background: var(--bg-card); border-radius: 10px; box-shadow: 0 1px 3px var(--shadow-color); overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.data-table thead tr { background: var(--bg-input); border-bottom: 2px solid var(--border-main); position: sticky; top: 0; z-index: 2; }
.data-table th { padding: 12px 18px; text-align: left; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap; }
.data-table tbody tr { border-bottom: 1px solid var(--border-main); transition: background 0.15s; }
.data-table tbody tr:last-child { border-bottom: none; }
.data-row:hover { background: var(--bg-nav-hover); }
.data-table td { padding: 13px 18px; vertical-align: middle; color: var(--text-primary); }
.td-no { color: var(--text-muted); font-weight: 600; }
.td-name { font-weight: 500; }
.td-muted { color: var(--text-muted); font-size: 0.84rem; }
.td-center { text-align: center; padding: 40px; color: var(--text-muted); }
.td-actions { text-align: center; white-space: nowrap; }
.td-sub { font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }

.menu-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 0.82rem; font-weight: 600; background: rgba(99,102,241,0.08); color: #4f46e5; border: 1px solid rgba(99,102,241,0.15); }

.badge-standalone { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; background: rgba(100,116,139,0.1); color: #475569; border: 1px solid rgba(100,116,139,0.2); white-space: nowrap; }
.badge-linked     { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; background: rgba(22,163,74,0.1); color: #15803d; border: 1px solid rgba(22,163,74,0.2); white-space: nowrap; }

/* ── CARD VIEW ── */
.card-grid-wrap { background: transparent; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; align-content: start; }
.contact-card { background: var(--bg-card); border-radius: 12px; padding: 14px 16px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--border-main); transition: box-shadow 0.15s ease; }
.contact-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.1); }
.contact-card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.contact-card-title { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); line-height: 1.3; }
.contact-card-body { display: flex; flex-direction: column; gap: 4px; }
.contact-card-row { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: var(--text-muted); }
.contact-card-row svg { width: 14px; color: #6366f1; flex-shrink: 0; }
.contact-card-footer { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding-top: 8px; border-top: 1px dashed var(--border-main); }
.contact-card-actions { display: flex; justify-content: flex-end; gap: 4px; padding-top: 2px; }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.empty-img   { width: 160px; opacity: 0.85; border-radius: 8px; }
.empty-text  { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }

.spinner-custom { width: 32px; height: 32px; border: 3px solid var(--border-main); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
.spinner-custom.sm { width: 20px; height: 20px; border-width: 2px; margin: 8px auto; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── ACTION BUTTONS ── */
.act-btn { width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s ease; margin: 0 2px; background: transparent; }
.act-btn:disabled, .act-disabled { opacity: 0.35; cursor: not-allowed; }
.act-edit         { color: #f59e0b; border-color: #f59e0b; }
.act-edit:hover:not(:disabled)   { background: #f59e0b; color: #fff; }
.act-delete       { color: #ef4444; border-color: #ef4444; }
.act-delete:hover:not(:disabled) { background: #ef4444; color: #fff; }
.act-info         { color: #6366f1; border-color: #6366f1; }
.act-info:hover   { background: #6366f1; color: #fff; }

/* ── PAGINATION ── */
.pagination-card { background: var(--bg-card); border-radius: 10px; padding: 14px 18px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: row-reverse; align-items: center; justify-content: space-between; gap: 12px; }
.pagination-nav { display: flex; align-items: center; gap: 8px; }
.btn-prev-next { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; min-width: 85px; justify-content: center; transition: background 0.18s ease; }
.btn-prev-next:hover:not(:disabled) { background: #4f46e5; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badges { display: flex; gap: 8px; align-items: center; }
.page-badge { padding: 7px 14px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); background: var(--bg-input); white-space: nowrap; }

@media (max-width: 576px) {
  .pagination-card { flex-direction: column; padding: 12px; gap: 12px; }
  .pagination-nav { width: 100%; justify-content: space-between; }
  .btn-prev-next { flex: 1; max-width: 48%; padding: 10px 14px; }
  .page-badges { width: 100%; justify-content: center; flex-wrap: wrap; }
  .page-badge { flex: 1; text-align: center; font-size: 0.7rem; }
}

/* ── FORM ── */
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.form-input { padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.875rem; background: var(--bg-input); color: var(--text-primary); outline: none; transition: border 0.18s; width: 100%; box-sizing: border-box; }
.form-input:focus { border-color: #6366f1; }
.form-textarea { resize: none; min-height: 70px; line-height: 1.5; }
.input-error { border-color: #ef4444 !important; }
.field-error { font-size: 0.75rem; color: #ef4444; margin-top: 2px; }
.field-hint  { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; display: inline-flex; align-items: center; gap: 6px; }

/* ── MULTI-VALUE FIELDS (Email / Phone) ── */
.multi-input-row { display: flex; align-items: center; gap: 8px; }
.multi-input-row .form-input { flex: 1; }
.btn-multi-remove { flex-shrink: 0; width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; background: var(--bg-main, #f1f5f9); color: #ef4444; border: 1px solid var(--border-main); border-radius: 8px; cursor: pointer; transition: all 0.18s ease; }
.btn-multi-remove:hover { background: #fee2e2; border-color: #ef4444; }
.btn-multi-add { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: transparent; color: #6366f1; border: 1px dashed #6366f1; border-radius: 8px; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.18s ease; }
.btn-multi-add:hover { background: rgba(99, 102, 241, 0.08); }

/* ── MODAL FOOTER BUTTONS ── */
.btn-cancel { padding: 8px 18px; background: var(--bg-main, #f1f5f9); color: var(--text-muted); border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
.btn-cancel:hover:not(:disabled) { background: var(--border-main); color: var(--text-primary); }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.18s; }
.btn-save:hover:not(:disabled) { background: #4f46e5; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── DETAIL MODAL ── */
.detail-list { display: flex; flex-direction: column; }
.detail-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-main); gap: 12px; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.detail-value { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); text-align: right; }
.mono { font-family: monospace; font-weight: 700; }
.detail-badge { font-size: 0.82rem; font-weight: 600; padding: 3px 12px; border-radius: 6px; background: rgba(99,102,241,0.1); color: #6366f1; border: 1px solid rgba(99,102,241,0.2); }
.badge-active { font-size: 0.75rem; font-weight: 600; padding: 3px 10px; border-radius: 99px; background: rgba(34,197,94,0.1); color: #16a34a; }
.badge-inactive { font-size: 0.75rem; font-weight: 600; padding: 3px 10px; border-radius: 99px; background: rgba(100,116,139,0.12); color: #475569; }

/* ── PICKER (Link modal) ── */
.picker-loading { display: flex; justify-content: center; padding: 10px 0; }
.picker-list { display: flex; flex-direction: column; gap: 4px; max-height: 220px; overflow-y: auto; border: 1px solid var(--border-main); border-radius: 8px; padding: 6px; margin-top: 4px; }
.picker-item { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 8px 10px; background: var(--bg-input); border: 1px solid transparent; border-radius: 6px; cursor: pointer; text-align: left; width: 100%; }
.picker-item:hover { border-color: #6366f1; }
.picker-item-main { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
.picker-item-sub { font-size: 0.75rem; color: var(--text-muted); }
.picker-selected { display: flex; align-items: center; gap: 8px; font-size: 0.83rem; color: var(--text-primary); margin-top: 6px; padding: 8px 10px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: 8px; }
</style>