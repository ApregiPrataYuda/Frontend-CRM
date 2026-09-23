<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'

import AppModal from '@/components/AppModal.vue'
import { useProductCatalogStore } from '@/stores/productCatalogStore'
import { useCategoryProductCatalogStore } from '@/stores/categoryProductCatalogStore'
import { useCatalogMediaStore } from '@/stores/catalogMediaStore'
import { useCatalogSendStore } from '@/stores/catalogSendStore'
import { usePermissionStore } from '@/stores/PermissionStore'
import { useAuthStore } from '@/stores/authStore'

const toast          = useToast()
const productStore    = useProductCatalogStore()
const categoryStore    = useCategoryProductCatalogStore()
const mediaStore       = useCatalogMediaStore()
const sendStore        = useCatalogSendStore()
const permission       = usePermissionStore()
const authStore        = useAuthStore()
const route            = useRoute()

// ── USER LOGIN (dipakai buat filter "Riwayat Kirim" biar Sales cuma
// lihat riwayat kirim miliknya sendiri) ──
const currentUserId = computed(() => authStore.user?.id ?? null)

// ── PERMISSIONS ── (halaman ini pada dasarnya browse + kirim untuk
// semua Sales -- canView dipakai sekadar mengikuti konvensi yang sama
// dipakai di halaman Sales lain, lihat contactView.vue) ──
const currentUrl = computed(() => route.path.replace('/app', ''))
const canView    = computed(() => permission.canView(currentUrl.value))

// ── FETCH AWAL ─────────────────────────────
onMounted(() => {
  productStore.fetchProducts()
  categoryStore.fetchCategoryOptions()
})

// ── VIEW MODE (card/table) -- persist ke localStorage, sama pola
// dengan contactView.vue ──
const VIEW_MODE_KEY = 'product_catalog_sales_view_mode'
const viewMode = ref(localStorage.getItem(VIEW_MODE_KEY) || 'card')
function setViewMode(mode) {
  viewMode.value = mode
  localStorage.setItem(VIEW_MODE_KEY, mode)
}

// ── DROPDOWN TOGGLES ───────────────────────
const showPerPageMenu = ref(false)
const showSortByMenu  = ref(false)
const showSortDirMenu = ref(false)
const showCategoryFilter = ref(false)

// ── SORT OPTIONS ───────────────────────────
const sortByOptions = [
  { label: 'Created Date', value: 'created_at' },
  { label: 'Product Name', value: 'name' },
  { label: 'Price',        value: 'price' },
]
const sortByLabel = computed(
  () => sortByOptions.find(o => o.value === productStore.sort.column)?.label ?? 'Created Date'
)

const categoryFilterLabel = computed(() => {
  if (!productStore.filters.category_id) return 'All Categories'
  return categoryStore.categoryOptions.find(o => String(o.id) === String(productStore.filters.category_id))?.name ?? 'All Categories'
})

// ── RESET ──────────────────────────────────
function handleReset() {
  showPerPageMenu.value    = false
  showSortByMenu.value     = false
  showSortDirMenu.value    = false
  showCategoryFilter.value = false
  productStore.resetFilters()
}

/* ═════════════════════════════════════════
 * DETAIL MODAL (info produk + list media)
 * ═════════════════════════════════════════ */
const isDetailModalVisible = ref(false)
const detailProduct        = ref(null)

async function openDetailModal(item) {
  detailProduct.value        = item
  isDetailModalVisible.value = true
  await mediaStore.fetchMediaByProduct(item.id)
}

function closeDetailModal() {
  isDetailModalVisible.value = false
  detailProduct.value        = null
  mediaStore.resetMediaState()
}

function mediaIcon(item) {
  return item.media_type === 'pdf' ? 'file-pdf' : 'file-video'
}

/* ═════════════════════════════════════════
 * SEND MODAL (Email / WhatsApp)
 * ═════════════════════════════════════════ */
const isSendModalVisible = ref(false)
const sendTargetProduct  = ref(null)
const sendTargetCatalog  = ref(null)

const sendForm = ref({
  channel: 'email',
  recipient_name: '',
  recipient_email: '',
  recipient_phone: '',
})

function openSendModal(product, catalog = null) {
  sendTargetProduct.value = product
  sendTargetCatalog.value = catalog
  sendForm.value = {
    channel: 'email',
    recipient_name: '',
    recipient_email: '',
    recipient_phone: '',
  }
  sendStore.errorSend = null
  isSendModalVisible.value = true
}

function closeSendModal() {
  isSendModalVisible.value = false
  sendTargetProduct.value  = null
  sendTargetCatalog.value  = null
  sendStore.errorSend      = null
}

/* ═════════════════════════════════════════
 * HISTORY MODAL (Riwayat Kirim -- log milik
 * user Sales yang sedang login)
 * ═════════════════════════════════════════ */
const isHistoryModalVisible = ref(false)

async function openHistoryModal() {
  isHistoryModalVisible.value = true
  sendStore.filters.sender_id = currentUserId.value ?? ''
  sendStore.filters.channel   = ''
  sendStore.pagination.current_page = 1
  await sendStore.fetchSendLogs()
}

function closeHistoryModal() {
  isHistoryModalVisible.value = false
}

function filterHistoryChannel(channel) {
  sendStore.filters.channel = channel
  sendStore.pagination.current_page = 1
  sendStore.fetchSendLogs()
}

function historyRecipient(item) {
  return item.channel === 'whatsapp' ? item.recipient_phone : item.recipient_email
}

async function submitSendForm() {
  if (!sendTargetProduct.value) return

  if (sendForm.value.channel === 'email' && !sendTargetCatalog.value) {
    toast.error('Pilih salah satu catalog (PDF/Video) untuk dikirim via email!')
    return
  }
  if (sendForm.value.channel === 'email' && !sendForm.value.recipient_email.trim()) {
    toast.error('Email penerima wajib diisi!')
    return
  }
  if (sendForm.value.channel === 'whatsapp' && !sendForm.value.recipient_phone.trim()) {
    toast.error('Nomor WhatsApp penerima wajib diisi!')
    return
  }

  const basePayload = {
    product_id: sendTargetProduct.value.id,
    catalog_id: sendTargetCatalog.value?.id ?? null,
    channel: sendForm.value.channel,
    recipient_name: sendForm.value.recipient_name?.trim() || null,
  }

  if (sendForm.value.channel === 'email') {
    const ok = await sendStore.sendCatalogEmail({
      ...basePayload,
      recipient_email: sendForm.value.recipient_email.trim(),
    })
    if (ok) {
      toast.success('Catalog berhasil dikirim via email')
      closeSendModal()
    }
  } else {
    // ── WhatsApp: buka wa.me link dulu (aksi pengiriman aslinya di
    // client), baru catat log-nya ke backend. ──
    const waLink = sendStore.buildWhatsappLink({
      phone: sendForm.value.recipient_phone,
      product: sendTargetProduct.value,
      catalog: sendTargetCatalog.value,
      catalogUrl: sendTargetCatalog.value ? mediaStore.getMediaUrl(sendTargetCatalog.value) : null,
    })
    window.open(waLink, '_blank')

    const ok = await sendStore.logCatalogWhatsapp({
      ...basePayload,
      recipient_phone: sendForm.value.recipient_phone.trim(),
    })
    if (ok) {
      toast.success('WhatsApp dibuka & pengiriman berhasil dicatat')
      closeSendModal()
    }
  }
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <!-- ── BREADCRUMB ── -->
    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="book-open" /> Product Catalog
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" /> Home
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Product Catalog</span>
        </div>
      </div>
    </div>

    <!-- ── TOOLBAR TOP ── -->
    <div class="toolbar-top">
      <div class="toolbar-left">
        <span class="toolbar-note">
          <font-awesome-icon icon="circle-info" /> Clik <font-awesome-icon icon="circle-info" /> on the product to see details & send the catalog to the customer.
        </span>
      </div>

      <div style="display:flex; gap:8px;">
        <button class="btn-toolbar btn-purple" @click="openHistoryModal">
          <font-awesome-icon icon="clock-rotate-left" /> History Send Catalog
        </button>
        <button class="btn-toolbar btn-orange" @click="handleReset">
          <font-awesome-icon icon="rotate-left" /> Reset
        </button>
      </div>
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
                {{ productStore.pagination.per_page }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showPerPageMenu }">
                <div class="drop-label">Per page</div>
                <div class="perpage-grid">
                  <button
                    v-for="opt in [8, 16, 24, 50]" :key="opt"
                    class="perpage-opt"
                    :class="{ active: productStore.pagination.per_page === opt }"
                    @click="productStore.pagination.per_page = opt; productStore.changePageSize(); showPerPageMenu = false"
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

          <!-- Filter Category -->
          <div class="drop-wrap">
            <button class="btn-select" @click="showCategoryFilter = !showCategoryFilter">
              <font-awesome-icon icon="sitemap" /> {{ categoryFilterLabel }}
              <font-awesome-icon icon="chevron-down" class="btn-arrow" />
            </button>
            <div class="drop-menu" :class="{ show: showCategoryFilter }">
              <div class="drop-label">Filter Category</div>
              <button
                class="drop-item"
                :class="{ active: !productStore.filters.category_id }"
                @click="productStore.filters.category_id = ''; productStore.changeFilters(); showCategoryFilter = false"
              >All Categories</button>
              <button
                v-for="opt in categoryStore.categoryOptions" :key="opt.id"
                class="drop-item"
                :class="{ active: String(productStore.filters.category_id) === String(opt.id) }"
                @click="productStore.filters.category_id = opt.id; productStore.changeFilters(); showCategoryFilter = false"
              >{{ opt.name }}</button>
            </div>
          </div>
        </div>

        <div class="controls-right">
          <div class="search-wrap">
            <input
              v-model="productStore.searchProducts"
              type="text"
              placeholder="Searching...."
              class="search-input"
              @input="productStore.searchWithDelay()"
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
                  :class="{ active: productStore.sort.column === opt.value }"
                  @click="productStore.sort.column = opt.value; productStore.changeSorting(); showSortByMenu = false"
                >{{ opt.label }}</button>
              </div>
            </div>

            <div class="drop-wrap">
              <button class="btn-select" @click="showSortDirMenu = !showSortDirMenu">
                {{ productStore.sort.direction.toUpperCase() }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu drop-right" :class="{ show: showSortDirMenu }">
                <div class="drop-label">Order</div>
                <button
                  v-for="opt in [{ label: 'DESC', value: 'desc' }, { label: 'ASC', value: 'asc' }]"
                  :key="opt.value"
                  class="drop-item"
                  :class="{ active: productStore.sort.direction === opt.value }"
                  @click="productStore.sort.direction = opt.value; productStore.changeSorting(); showSortDirMenu = false"
                >{{ opt.label }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── CARD VIEW ── -->
    <div v-if="viewMode === 'card'" class="card-grid-wrap flex-grow-1 overflow-auto mb-3">

      <!-- Loading -->
      <div v-if="productStore.loadingProducts" class="td-center">
        <div style="display:flex; justify-content:center;">
          <div class="spinner-custom"></div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="!productStore.productsData.length" class="empty-state" style="padding: 40px 0;">
        <img
          src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif"
          alt="No data found"
          class="empty-img"
        />
        <div class="empty-text">No data found</div>
      </div>

      <!-- Cards -->
      <div v-else class="card-grid">
        <div v-for="item in productStore.productsData" :key="item.id" class="product-card">
          <img :src="productStore.getThumbnailUrl(item.thumbnail_url)" :alt="item.name" class="product-card-thumb" />

          <div class="product-card-top">
            <span class="menu-badge">{{ item.category_name || '-' }}</span>
            <span class="td-sub mono">{{ item.sku }}</span>
          </div>

          <div class="product-card-title">{{ item.name }}</div>
          <div v-if="item.description" class="product-card-desc">{{ item.description }}</div>

          <div class="product-card-footer">
            <span class="product-card-price">{{ productStore.formatCurrency(item.price) }}</span>
            <span class="td-sub"><font-awesome-icon icon="photo-film" /> {{ item.catalogs_count ?? 0 }} media</span>
          </div>

          <div class="product-card-actions">
            <button v-if="canView" class="act-btn act-info" title="Detail & Kirim" @click="openDetailModal(item)">
              <font-awesome-icon icon="circle-info" /> Details & Send
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
            <th style="width:60px">THUMB</th>
            <th>SKU</th>
            <th>PRODUCT NAME</th>
            <th>CATEGORY</th>
            <th style="width:130px">PRICE</th>
            <th style="width:90px; text-align:center"># MEDIA</th>
            <th style="width:150px; text-align:center">ACTIONS</th>
          </tr>
        </thead>
        <tbody>

          <!-- Loading -->
          <tr v-if="productStore.loadingProducts">
            <td colspan="8" class="td-center">
              <div style="display:flex; justify-content:center;">
                <div class="spinner-custom"></div>
              </div>
            </td>
          </tr>

          <!-- Empty -->
          <tr v-else-if="!productStore.productsData.length">
            <td colspan="8" class="td-center">
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
            v-for="(item, index) in productStore.productsData"
            :key="item.id"
            class="data-row"
          >
            <td class="td-no">
              {{ (productStore.pagination.current_page - 1) * productStore.pagination.per_page + index + 1 }}.
            </td>
            <td>
              <img :src="productStore.getThumbnailUrl(item.thumbnail_url)" :alt="item.name" class="product-thumb" />
            </td>
            <td class="td-muted mono">{{ item.sku }}</td>
            <td class="td-name">{{ item.name }}</td>
            <td class="td-muted">{{ item.category_name || '-' }}</td>
            <td class="td-muted">{{ productStore.formatCurrency(item.price) }}</td>
            <td class="td-muted" style="text-align:center">{{ item.catalogs_count ?? 0 }}</td>
            <td class="td-actions">
              <button v-if="canView" class="act-btn act-info" title="Detail & Kirim" @click="openDetailModal(item)">
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
          :disabled="!productStore.pagination.prev_page_url || productStore.loadingProducts"
          @click="productStore.fetchProducts(productStore.pagination.prev_page_url)"
        >
          <font-awesome-icon icon="circle-left" /> Prev
        </button>
        <button
          class="btn-prev-next"
          :disabled="!productStore.pagination.next_page_url || productStore.loadingProducts"
          @click="productStore.fetchProducts(productStore.pagination.next_page_url)"
        >
          Next <font-awesome-icon icon="circle-right" />
        </button>
      </div>
      <div class="page-badges">
        <span class="page-badge">
          {{ productStore.productsData.length }} DATA | ON PAGE {{ productStore.pagination.current_page }}
        </span>
        <span class="page-badge">TOTAL: {{ productStore.pagination.total }}</span>
      </div>
    </div>

    <!-- ══════════════════════════════════════════
         MODAL DETAIL PRODUK + LIST MEDIA
    ══════════════════════════════════════════ -->
    <AppModal
      :show="isDetailModalVisible"
      :title="detailProduct?.name ?? 'Detail Produk'"
      icon="circle-info"
      size="lg"
      @close="closeDetailModal"
    >
      <div v-if="detailProduct" class="form-container-gap">

        <div class="detail-header-product">
          <img :src="productStore.getThumbnailUrl(detailProduct.thumbnail_url)" :alt="detailProduct.name" class="detail-product-thumb" />
          <div>
            <div class="menu-badge">{{ detailProduct.category_name || '-' }}</div>
            <div class="td-sub mono">{{ detailProduct.sku }}</div>
            <div class="product-card-price">{{ productStore.formatCurrency(detailProduct.price) }}</div>
          </div>
        </div>

        <p v-if="detailProduct.description" class="detail-value">{{ detailProduct.description }}</p>

        <div class="media-section-label">
          <font-awesome-icon icon="photo-film" /> Media (PDF / Video)
        </div>

        <div v-if="mediaStore.loadingMedia" class="td-center">
          <div class="spinner-custom" style="margin: 20px auto;"></div>
        </div>
        <div v-else-if="!mediaStore.mediaData.length" class="td-center">There is no media for this product yet</div>
        <div v-else class="media-list">
          <div v-for="item in mediaStore.mediaData" :key="item.id" class="media-item">
            <font-awesome-icon :icon="mediaIcon(item)" :style="{ color: item.media_type === 'pdf' ? '#ef4444' : '#6366f1' }" class="media-item-icon" />
            <div class="media-item-info">
              <div class="media-item-title">{{ item.title || (item.media_type === 'pdf' ? 'PDF' : 'Video') }}</div>
              <a v-if="mediaStore.getMediaUrl(item)" :href="mediaStore.getMediaUrl(item)" target="_blank" class="media-item-link">
                <font-awesome-icon icon="eye" /> Open / Download
              </a>
            </div>
            <button class="btn-toolbar btn-purple" style="font-size:0.78rem; padding:6px 12px;" @click="openSendModal(detailProduct, item)">
              <font-awesome-icon icon="paper-plane" /> Send
            </button>
          </div>
        </div>

      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeDetailModal">Close</button>
        <button class="btn-save" @click="openSendModal(detailProduct, null)">
          <font-awesome-icon icon="paper-plane" /> Send Catalog
        </button>
      </template>
    </AppModal>

    <!-- ══════════════════════════════════════════
         MODAL KIRIM CATALOG (Email / WhatsApp)
    ══════════════════════════════════════════ -->
    <AppModal
      :show="isSendModalVisible"
      title="Send Catalog"
      icon="paper-plane"
      size="md"
      @close="closeSendModal"
    >
      <div v-if="sendTargetProduct" class="form-container-gap">

        <div class="send-target-info">
          <span class="detail-label">Product</span>
          <span class="detail-badge">{{ sendTargetProduct.name }}</span>
        </div>
        <div v-if="sendTargetCatalog" class="send-target-info">
          <span class="detail-label">Media</span>
          <span class="td-muted">{{ sendTargetCatalog.title || sendTargetCatalog.media_type }}</span>
        </div>
        <p v-else class="toolbar-note">
          <font-awesome-icon icon="circle-info" /> Haven't selected a specific medium yet -- to send via Email, select the medium from the list in the Details modal first.
        </p>

        <div class="form-group">
          <label>Channel</label>
          <div class="channel-toggle">
            <button
              type="button"
              class="channel-btn"
              :class="{ active: sendForm.channel === 'email' }"
              @click="sendForm.channel = 'email'"
            >
              <font-awesome-icon icon="envelope" /> Email
            </button>
            <button
              type="button"
              class="channel-btn"
              :class="{ active: sendForm.channel === 'whatsapp' }"
              @click="sendForm.channel = 'whatsapp'"
            >
              <font-awesome-icon icon="comment-sms" /> WhatsApp
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>Recipient's name (opsional)</label>
          <input v-model="sendForm.recipient_name" class="form-input" placeholder="e.g. Budi Santoso" />
        </div>

        <div v-if="sendForm.channel === 'email'" class="form-group">
          <label>Recipient Email</label>
          <input
            v-model="sendForm.recipient_email"
            type="email"
            class="form-input"
            :class="{ 'input-error': sendStore.errorSend?.recipient_email }"
            placeholder="e.g. budi@email.com"
            @input="sendStore.clearFieldError('recipient_email')"
          />
          <span v-if="sendStore.errorSend?.recipient_email" class="field-error">
            {{ sendStore.errorSend.recipient_email[0] }}
          </span>
        </div>

        <div v-else class="form-group">
          <label>Recipient WhatsApp Number</label>
          <input
            v-model="sendForm.recipient_phone"
            class="form-input"
            :class="{ 'input-error': sendStore.errorSend?.recipient_phone }"
            placeholder="e.g. 08123456789"
            @input="sendStore.clearFieldError('recipient_phone')"
          />
          <span v-if="sendStore.errorSend?.recipient_phone" class="field-error">
            {{ sendStore.errorSend.recipient_phone[0] }}
          </span>
          <p class="photo-hint">Clicking "Send" will open WhatsApp with a message ready to send.</p>
        </div>

        <span v-if="sendStore.errorSend?._general" class="field-error">
          {{ sendStore.errorSend._general[0] }}
        </span>
      </div>

      <template #footer>
        <button class="btn-cancel" :disabled="sendStore.sendingEmail || sendStore.loggingWhatsapp" @click="closeSendModal">
          Cancel
        </button>
        <button
          class="btn-save"
          :disabled="sendStore.sendingEmail || sendStore.loggingWhatsapp"
          @click="submitSendForm"
        >
          <font-awesome-icon v-if="sendStore.sendingEmail || sendStore.loggingWhatsapp" icon="spinner" spin />
          <font-awesome-icon v-else icon="paper-plane" />
          {{ (sendStore.sendingEmail || sendStore.loggingWhatsapp) ? 'Sending...' : 'Send' }}
        </button>
      </template>
    </AppModal>

    <!-- ══════════════════════════════════════════
         MODAL RIWAYAT KIRIM (log milik user login)
    ══════════════════════════════════════════ -->
    <AppModal
      :show="isHistoryModalVisible"
      title="Riwayat Kirim Catalog"
      icon="clock-rotate-left"
      size="xl"
      @close="closeHistoryModal"
    >
      <div class="form-container-gap history-modal-body">

        <div class="history-filter-row">
          <button
            class="history-filter-btn"
            :class="{ active: !sendStore.filters.channel }"
            @click="filterHistoryChannel('')"
          >Semua</button>
          <button
            class="history-filter-btn"
            :class="{ active: sendStore.filters.channel === 'email' }"
            @click="filterHistoryChannel('email')"
          ><font-awesome-icon icon="envelope" /> Email</button>
          <button
            class="history-filter-btn"
            :class="{ active: sendStore.filters.channel === 'whatsapp' }"
            @click="filterHistoryChannel('whatsapp')"
          ><font-awesome-icon icon="comment-sms" /> WhatsApp</button>
        </div>

        <!-- Loading -->
        <div v-if="sendStore.loadingSendLogs" class="td-center">
          <div style="display:flex; justify-content:center;">
            <div class="spinner-custom"></div>
          </div>
        </div>

        <!-- Empty -->
        <div v-else-if="!sendStore.sendLogsData.length" class="empty-state" style="padding: 30px 0;">
          <img
            src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif"
            alt="No data found"
            class="empty-img"
          />
          <div class="empty-text">Belum ada riwayat kirim</div>
        </div>

        <!-- Cards -->
        <div v-else class="history-card-grid">
          <div v-for="item in sendStore.sendLogsData" :key="item.id" class="history-card">
            <div class="history-card-top">
              <span class="menu-badge">
                <font-awesome-icon :icon="item.channel === 'whatsapp' ? 'comment-sms' : 'envelope'" />
                {{ item.channel === 'whatsapp' ? 'WhatsApp' : 'Email' }}
              </span>
              <span
                class="status-badge"
                :class="item.status === 'sent' ? 'status-sent' : 'status-failed'"
                :title="item.status === 'failed' ? item.error_message : ''"
              >{{ item.status === 'sent' ? 'Terkirim' : 'Gagal' }}</span>
            </div>

            <div class="history-card-title">{{ item.product_name }}</div>
            <div v-if="item.catalog_title" class="history-card-media">
              <font-awesome-icon icon="photo-film" /> {{ item.catalog_title }}
            </div>

            <div class="history-card-footer">
              <span class="td-muted">
                <font-awesome-icon icon="paper-plane" /> {{ historyRecipient(item) || '-' }}
              </span>
              <span class="td-sub">{{ item.created_at }}</span>
            </div>
          </div>
        </div>

        <div class="pagination-card">
          <div class="pagination-nav">
            <button
              class="btn-prev-next"
              :disabled="!sendStore.pagination.prev_page_url || sendStore.loadingSendLogs"
              @click="sendStore.fetchSendLogs(sendStore.pagination.prev_page_url)"
            >
              <font-awesome-icon icon="circle-left" /> Prev
            </button>
            <button
              class="btn-prev-next"
              :disabled="!sendStore.pagination.next_page_url || sendStore.loadingSendLogs"
              @click="sendStore.fetchSendLogs(sendStore.pagination.next_page_url)"
            >
              Next <font-awesome-icon icon="circle-right" />
            </button>
          </div>
          <div class="page-badges">
            <span class="page-badge">
              {{ sendStore.sendLogsData.length }} DATA | ON PAGE {{ sendStore.pagination.current_page }}
            </span>
            <span class="page-badge">TOTAL: {{ sendStore.pagination.total }}</span>
          </div>
        </div>

      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeHistoryModal">Close</button>
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
.controls-card { background: var(--bg-card); border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color); }
.controls-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
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

/* ── VIEW TOGGLE ── */
.view-toggle { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; }
.view-toggle-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; background: var(--bg-input); border: none; color: var(--text-muted); cursor: pointer; font-size: 0.82rem; font-weight: 600; transition: all 0.15s; }
.view-toggle-btn:hover { color: #6366f1; }
.view-toggle-btn.active { background: #6366f1; color: #fff; }
.view-toggle-btn + .view-toggle-btn { border-left: 1px solid var(--border-main); }

/* ── DROPDOWN ── */
.drop-wrap { position: relative; }
.btn-select { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.83rem; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
.btn-select:hover { border-color: #6366f1; color: #6366f1; }
.drop-menu { position: absolute; top: calc(100% + 6px); left: 0; min-width: 180px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 10px; z-index: 300; opacity: 0; transform: translateY(-6px); pointer-events: none; transition: all 0.18s ease; max-height: 300px; overflow-y: auto; }
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

/* ── CARD GRID ── */
.card-grid-wrap { background: transparent; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; align-content: start; }
.product-card { background: var(--bg-card); border-radius: 12px; padding: 14px 16px; box-shadow: 0 1px 3px var(--shadow-color); display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--border-main); transition: box-shadow 0.15s ease; }
.product-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.1); }
.product-card-thumb { width: 100%; height: 140px; object-fit: cover; border-radius: 8px; background: var(--bg-input); }
.product-card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.product-card-title { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); line-height: 1.3; }
.product-card-desc { font-size: 0.8rem; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.product-card-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-top: 8px; border-top: 1px dashed var(--border-main); }
.product-card-price { font-size: 0.9rem; font-weight: 700; color: #16a34a; }
.product-card-actions { display: flex; justify-content: flex-end; gap: 4px; padding-top: 2px; }
.product-card-actions .act-btn { width: auto; padding: 6px 12px; gap: 6px; }

.td-sub { font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }
.mono { font-family: monospace; }

.menu-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 0.82rem; font-weight: 600; background: rgba(99,102,241,0.08); color: #4f46e5; border: 1px solid rgba(99,102,241,0.15); }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.empty-img   { width: 160px; opacity: 0.85; border-radius: 8px; }
.empty-text  { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }

.spinner-custom { width: 32px; height: 32px; border: 3px solid var(--border-main); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

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
.product-thumb { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; border: 1.5px solid var(--border-main); }

/* ── ACTION BUTTONS ── */
.act-btn { height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s ease; margin: 0 2px; background: transparent; }
.act-btn:disabled, .act-disabled { opacity: 0.35; cursor: not-allowed; }
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
.input-error { border-color: #ef4444 !important; }
.field-error { font-size: 0.75rem; color: #ef4444; margin-top: 2px; }
.photo-hint { font-size: 0.75rem; color: var(--text-muted); margin: 0; }

/* ── MODAL FOOTER BUTTONS ── */
.btn-cancel { padding: 8px 18px; background: var(--bg-main, #f1f5f9); color: var(--text-muted); border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
.btn-cancel:hover:not(:disabled) { background: var(--border-main); color: var(--text-primary); }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.18s; }
.btn-save:hover:not(:disabled) { background: #4f46e5; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── DETAIL MODAL ── */
.detail-header-product { display: flex; align-items: center; gap: 14px; }
.detail-product-thumb { width: 72px; height: 72px; border-radius: 10px; object-fit: cover; border: 1.5px solid var(--border-main); flex-shrink: 0; }
.detail-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.detail-value { font-size: 0.85rem; color: var(--text-primary); line-height: 1.5; }
.detail-badge { font-size: 0.82rem; font-weight: 600; padding: 3px 12px; border-radius: 6px; background: rgba(99,102,241,0.1); color: #6366f1; border: 1px solid rgba(99,102,241,0.2); }

.media-section-label { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); display: flex; align-items: center; gap: 6px; margin-top: 4px; }
.media-list { display: flex; flex-direction: column; gap: 8px; }
.media-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid var(--border-main); border-radius: 8px; background: var(--bg-input); }
.media-item-icon { font-size: 1.3rem; flex-shrink: 0; }
.media-item-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.media-item-title { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
.media-item-link { font-size: 0.78rem; color: #6366f1; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
.media-item-link:hover { text-decoration: underline; }

/* ── HISTORY MODAL (Riwayat Kirim) ── */
.history-modal-body { min-width: 0; }
.history-filter-row { display: flex; gap: 8px; flex-wrap: wrap; }
.history-filter-btn { padding: 7px 14px; border: 1px solid var(--border-main); border-radius: 8px; background: var(--bg-input); color: var(--text-muted); font-size: 0.82rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s; }
.history-filter-btn:hover { border-color: #6366f1; color: #6366f1; }
.history-filter-btn.active { background: #6366f1; border-color: #6366f1; color: #fff; }
.status-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }
.status-sent   { background: rgba(22,163,74,0.1); color: #16a34a; border: 1px solid rgba(22,163,74,0.2); }
.status-failed { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); cursor: help; }

.history-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; max-height: 420px; overflow-y: auto; padding: 2px; }
.history-card { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; transition: box-shadow 0.15s ease; }
.history-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.08); }
.history-card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.history-card-title { font-size: 0.88rem; font-weight: 700; color: var(--text-primary); line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.history-card-media { font-size: 0.78rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }
.history-card-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-top: 8px; border-top: 1px dashed var(--border-main); font-size: 0.76rem; }
.history-card-footer .td-muted { display: flex; align-items: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.history-card-footer .td-sub { white-space: nowrap; flex-shrink: 0; margin-top: 0; }

/* ── SEND MODAL ── */
.send-target-info { display: flex; align-items: center; gap: 8px; }
.channel-toggle { display: flex; border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; width: fit-content; }
.channel-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: var(--bg-input); border: none; color: var(--text-muted); cursor: pointer; font-size: 0.84rem; font-weight: 600; transition: all 0.15s; }
.channel-btn:hover { color: #6366f1; }
.channel-btn.active { background: #6366f1; color: #fff; }
.channel-btn + .channel-btn { border-left: 1px solid var(--border-main); }
</style>