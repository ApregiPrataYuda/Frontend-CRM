<script setup>
import { ref, computed, onMounted } from 'vue'
import AppModal from '@/components/AppModal.vue'
import { useConfirm } from '@/composables/useConfirm'
import { useProductCatalogStore } from '@/stores/productCatalogStore'
import { useCategoryProductCatalogStore } from '@/stores/categoryProductCatalogStore'
import { useCatalogMediaStore } from '@/stores/catalogMediaStore'
import { usePermissionStore } from '@/stores/PermissionStore'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'

const { confirm } = useConfirm()
const toast         = useToast()
const productStore   = useProductCatalogStore()
const categoryStore  = useCategoryProductCatalogStore()
const mediaStore     = useCatalogMediaStore()
const permission     = usePermissionStore()
const route          = useRoute()

// ── PERMISSIONS ────────────────────────────
const currentUrl = computed(() => route.path.replace('/app', ''))
const canCreate  = computed(() => permission.canCreate(currentUrl.value))
const canUpdate  = computed(() => permission.canUpdate(currentUrl.value))
const canDelete  = computed(() => permission.canDelete(currentUrl.value))
const canView    = computed(() => permission.canView(currentUrl.value))

// ── FETCH AWAL ─────────────────────────────
onMounted(() => {
  productStore.fetchProducts()
  categoryStore.fetchCategoryOptions()
})

// ── DROPDOWN TOGGLES ───────────────────────
const showPerPageMenu = ref(false)
const showSortByMenu  = ref(false)
const showSortDirMenu = ref(false)

// ── SORT OPTIONS ───────────────────────────
const sortByOptions = [
  { label: 'Created Date', value: 'created_at' },
  { label: 'Product Name', value: 'name' },
  { label: 'SKU',          value: 'sku' },
  { label: 'Price',        value: 'price' },
  { label: 'Stock',        value: 'stock' },
]
const sortByLabel = computed(
  () => sortByOptions.find(o => o.value === productStore.sort.column)?.label ?? 'Created Date'
)

// ── RESET ──────────────────────────────────
function handleReset() {
  showPerPageMenu.value = false
  showSortByMenu.value  = false
  showSortDirMenu.value = false
  productStore.resetFilters()
}

/* ─────────────────────────────────────────
 * THUMBNAIL UPLOAD (pola sama dengan UserManagement.vue)
 * ───────────────────────────────────────── */
const thumbnailFile    = ref(null)
const thumbnailPreview = ref(null)

function onChangeThumbnail(e) {
  const file = e.target.files[0]
  if (!file) return

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    toast.error('Format hanya JPG / PNG / WEBP')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    toast.error('Ukuran file maksimal 2MB')
    return
  }
  if (thumbnailFile.value && thumbnailPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(thumbnailPreview.value)
  }
  thumbnailFile.value    = file
  thumbnailPreview.value = URL.createObjectURL(file)
}

function resetThumbnail() {
  if (thumbnailPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(thumbnailPreview.value)
  }
  thumbnailFile.value    = null
  thumbnailPreview.value = null
}

/* ─────────────────────────────────────────
 * ADD / EDIT MODAL
 * ───────────────────────────────────────── */
const isProductModalVisible = ref(false)
const isEdit                = ref(false)
const selectedProduct       = ref(null)

const emptyForm = () => ({
  category_id: '',
  sku:         '',
  name:        '',
  description: '',
  price:       0,
  stock:       0,
})

const form = ref(emptyForm())

function openAddModal() {
  isEdit.value                = false
  selectedProduct.value       = null
  form.value                  = emptyForm()
  productStore.errorProduct   = null
  resetThumbnail()
  isProductModalVisible.value = true
}

function openEditModal(item) {
  isEdit.value              = true
  selectedProduct.value     = item
  productStore.errorProduct = null
  resetThumbnail()

  form.value = {
    category_id: item.category_id,
    sku:         item.sku,
    name:        item.name,
    description: item.description || '',
    price:       Number(item.price ?? 0),
    stock:       Number(item.stock ?? 0),
  }

  if (item.thumbnail_url) {
    thumbnailPreview.value = productStore.getThumbnailUrl(item.thumbnail_url)
  }

  isProductModalVisible.value = true
}

function closeProductModal() {
  isProductModalVisible.value = false
  productStore.errorProduct   = null
  resetThumbnail()
}

async function submitProductForm() {
  if (!form.value.category_id) {
    toast.error('Kategori wajib dipilih!')
    return
  }
  if (!form.value.sku.trim()) {
    toast.error('SKU wajib diisi!')
    return
  }
  if (!form.value.name.trim()) {
    toast.error('Nama produk wajib diisi!')
    return
  }

  const payload = {
    category_id: form.value.category_id,
    sku:         form.value.sku.trim(),
    name:        form.value.name.trim(),
    description: form.value.description?.trim() || '',
    price:       form.value.price || 0,
    stock:       form.value.stock || 0,
  }
  if (thumbnailFile.value) payload.thumbnail = thumbnailFile.value

  if (isEdit.value && selectedProduct.value) {
    const ok = await productStore.updateProduct(selectedProduct.value.id, payload)
    if (ok) { toast.success('Produk berhasil diupdate'); closeProductModal() }
  } else {
    const ok = await productStore.saveProduct(payload)
    if (ok) { toast.success('Produk berhasil ditambahkan'); closeProductModal() }
  }
}

/* ─────────────────────────────────────────
 * DETAIL MODAL
 * ───────────────────────────────────────── */
const isDetailModalVisible = ref(false)

async function openDetailModal(item) {
  isDetailModalVisible.value = true
  await productStore.fetchProductDetail(item.id)
}
function closeDetailModal() {
  isDetailModalVisible.value = false
}

/* ─────────────────────────────────────────
 * DELETE
 * ───────────────────────────────────────── */
async function openDeleteModal(item) {
  const isConfirmed = await confirm({
    type:        'danger',
    title:       'Hapus Produk',
    message:     `Yakin ingin menghapus produk "${item.name}"?`,
    detail:      'Tindakan ini tidak bisa dibatalkan. Semua media (PDF/Video) milik produk ini akan ikut terhapus.',
    confirmText: 'Yes, Delete',
    cancelText:  'Cancel',
  })
  if (isConfirmed) {
    const result = await productStore.deleteProduct(item.id)
    if (result.ok) toast.success('Produk berhasil dihapus')
    else           toast.error(result.message || 'Gagal menghapus produk')
  }
}

/* ═════════════════════════════════════════
 * MODAL KELOLA MEDIA (PDF/Video)
 * ═════════════════════════════════════════ */
const isMediaModalVisible = ref(false)
const mediaTargetProduct  = ref(null)

const mediaTypeOptions = [
  { value: 'pdf',   label: 'PDF' },
  { value: 'video', label: 'Video' },
]
const sourceTypeOptions = [
  { value: 'upload',        label: 'Upload File' },
  { value: 'youtube',       label: 'YouTube' },
  { value: 'vimeo',         label: 'Vimeo' },
  { value: 'external_link', label: 'Link Eksternal' },
]

async function openMediaModal(item) {
  mediaTargetProduct.value = item
  isMediaModalVisible.value = true
  closeMediaForm()
  await mediaStore.fetchMediaByProduct(item.id)
}

function closeMediaModal() {
  isMediaModalVisible.value = false
  mediaTargetProduct.value  = null
  mediaStore.resetMediaState()
  closeMediaForm()
}

// ── form tambah/edit media (toggle) ──
const isMediaFormVisible = ref(false)
const isMediaEdit         = ref(false)
const selectedMedia       = ref(null)
const mediaFile           = ref(null)

const emptyMediaForm = () => ({
  media_type:  'pdf',
  source_type: 'upload',
  title:       '',
  sort_order:  0,
  url:         '',
})
const mediaForm = ref(emptyMediaForm())

function openAddMediaForm() {
  isMediaEdit.value          = false
  selectedMedia.value        = null
  mediaForm.value            = emptyMediaForm()
  mediaFile.value            = null
  mediaStore.errorMedia      = null
  isMediaFormVisible.value   = true
}

function openEditMediaForm(item) {
  isMediaEdit.value       = true
  selectedMedia.value     = item
  mediaForm.value = {
    media_type:  item.media_type,
    source_type: item.source_type,
    title:       item.title || '',
    sort_order:  item.sort_order ?? 0,
    url:         item.source_type === 'upload' ? '' : (item.url || ''),
  }
  mediaFile.value          = null
  mediaStore.errorMedia    = null
  isMediaFormVisible.value = true
}

function closeMediaForm() {
  isMediaFormVisible.value = false
  isMediaEdit.value        = false
  selectedMedia.value      = null
  mediaForm.value          = emptyMediaForm()
  mediaFile.value          = null
  mediaStore.errorMedia    = null
}

function onChangeMediaFile(e) {
  const file = e.target.files[0]
  if (!file) return

  const isPdf = mediaForm.value.media_type === 'pdf'
  const allowedExt = isPdf ? ['pdf'] : ['mp4', 'mov', 'avi', 'mkv', 'webm']
  const ext = file.name.split('.').pop().toLowerCase()

  if (!allowedExt.includes(ext)) {
    toast.error(isPdf ? 'File harus berformat .pdf' : 'File harus berformat mp4/mov/avi/mkv/webm')
    return
  }
  if (file.size > 20 * 1024 * 1024) {
    toast.error('Ukuran file maksimal 20MB')
    return
  }
  mediaFile.value = file
}

async function submitMediaForm() {
  if (!mediaTargetProduct.value) return

  if (mediaForm.value.source_type === 'upload') {
    if (!isMediaEdit.value && !mediaFile.value) {
      toast.error('File wajib diupload untuk sumber Upload!')
      return
    }
  } else if (!mediaForm.value.url.trim()) {
    toast.error('URL wajib diisi untuk sumber media ini!')
    return
  }

  const payload = {
    product_id:  mediaTargetProduct.value.id,
    media_type:  mediaForm.value.media_type,
    source_type: mediaForm.value.source_type,
    title:       mediaForm.value.title?.trim() || '',
    sort_order:  mediaForm.value.sort_order || 0,
  }

  if (mediaForm.value.source_type === 'upload') {
    if (mediaFile.value) payload.file = mediaFile.value
  } else {
    payload.url = mediaForm.value.url.trim()
  }

  if (isMediaEdit.value && selectedMedia.value) {
    const ok = await mediaStore.updateMedia(selectedMedia.value.id, payload)
    if (ok) { toast.success('Media berhasil diupdate'); closeMediaForm() }
  } else {
    const ok = await mediaStore.saveMedia(payload)
    if (ok) { toast.success('Media berhasil ditambahkan'); closeMediaForm() }
  }
}

async function handleDeleteMedia(item) {
  const isConfirmed = await confirm({
    type:        'danger',
    title:       'Hapus Media',
    message:     `Yakin ingin menghapus media "${item.title || item.media_type}"?`,
    detail:      'Tindakan ini tidak bisa dibatalkan.',
    confirmText: 'Yes, Delete',
    cancelText:  'Cancel',
  })
  if (isConfirmed) {
    const result = await mediaStore.deleteMedia(item.id)
    if (result.ok) toast.success('Media berhasil dihapus')
    else           toast.error(result.message || 'Gagal menghapus media')
  }
}

function mediaIcon(item) {
  return item.media_type === 'pdf' ? 'file-pdf' : 'file-video'
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <!-- ── BREADCRUMB ── -->
    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title">
          <font-awesome-icon icon="box-open" /> Product Catalog
        </h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item">
            <font-awesome-icon icon="house" /> Dashboard
          </span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item">Product Catalog</span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Produk</span>
        </div>
      </div>
    </div>

    <!-- ── TOOLBAR TOP ── -->
    <div class="toolbar-top">
      <div class="toolbar-left">
        <span class="toolbar-note">
          <font-awesome-icon icon="circle-info" /> Click <font-awesome-icon icon="photo-film" /> to manage product PDF/Video.
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
                {{ productStore.pagination.per_page }}
                <font-awesome-icon icon="chevron-down" class="btn-arrow" />
              </button>
              <div class="drop-menu" :class="{ show: showPerPageMenu }">
                <div class="drop-label">Per page</div>
                <div class="perpage-grid">
                  <button
                    v-for="opt in [5, 10, 25, 50]" :key="opt"
                    class="perpage-opt"
                    :class="{ active: productStore.pagination.per_page === opt }"
                    @click="productStore.pagination.per_page = opt; productStore.changePageSize(); showPerPageMenu = false"
                  >{{ opt }}</button>
                </div>
              </div>
            </div>
          </div>

          <div class="drop-wrap">
            <select
              v-model="productStore.filters.category_id"
              class="btn-select"
              style="appearance:auto;"
              @change="productStore.changeFilters()"
            >
              <option value="">-- All Categories --</option>
              <option v-for="opt in categoryStore.categoryOptions" :key="opt.id" :value="opt.id">
                {{ opt.name }}
              </option>
            </select>
          </div>

          <button v-if="canCreate" class="btn-toolbar btn-purple" @click="openAddModal">
            <font-awesome-icon icon="plus" /> Add Produk
          </button>
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

    <!-- ── TABLE ── -->
    <div class="table-card flex-grow-1 overflow-auto mb-3">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:60px">NO.</th>
            <th style="width:60px">THUMB</th>
            <th>SKU</th>
            <th>PRODUCT NAME</th>
            <th>CATEGORY</th>
            <th style="width:130px">PRICE</th>
            <th style="width:80px; text-align:center">STOCK</th>
            <th style="width:90px; text-align:center"># MEDIA</th>
            <th style="width:180px">CREATED</th>
            <th style="width:190px; text-align:center">ACTIONS</th>
          </tr>
        </thead>
        <tbody>

          <!-- Loading -->
          <tr v-if="productStore.loadingProducts">
            <td colspan="10" class="td-center">
              <div style="display:flex; justify-content:center;">
                <div class="spinner-custom"></div>
              </div>
            </td>
          </tr>

          <!-- Empty -->
          <tr v-else-if="!productStore.productsData.length">
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
            <td class="td-muted" style="text-align:center">{{ item.stock }}</td>
            <td class="td-muted" style="text-align:center">{{ item.catalogs_count ?? 0 }}</td>
            <td class="td-muted">{{ productStore.formatDate(item.created_at) }}</td>
            <td class="td-actions">
              <!-- Kelola Media -->
              <button
                class="act-btn act-media"
                title="Kelola Media (PDF/Video)"
                @click="openMediaModal(item)"
              >
                <font-awesome-icon icon="photo-film" />
              </button>

              <!-- Edit -->
              <button
                v-if="canUpdate"
                class="act-btn act-edit"
                title="Edit"
                @click="openEditModal(item)"
              >
                <font-awesome-icon icon="pen-to-square" />
              </button>

              <!-- Delete -->
              <button
                v-if="canDelete"
                class="act-btn act-delete"
                title="Delete"
                :disabled="productStore.deletingProduct"
                @click="openDeleteModal(item)"
              >
                <font-awesome-icon icon="trash-can" />
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

    <!-- ── MODAL ADD / EDIT PRODUK ── -->
    <AppModal
      :show="isProductModalVisible"
      :title="isEdit ? 'Edit Produk' : 'Add Produk'"
      :icon="isEdit ? 'pen' : 'plus'"
      size="lg"
      @close="closeProductModal"
    >
      <div class="form-container-gap">

        <div class="form-grid-2">
          <div class="form-group">
            <label>Category</label>
            <select
              v-model="form.category_id"
              class="form-input form-select"
              :class="{ 'input-error': productStore.errorProduct?.category_id }"
              @change="productStore.clearFieldError('category_id')"
            >
              <option value="" disabled>-- Pilih Kategori --</option>
              <option v-for="opt in categoryStore.categoryOptions" :key="opt.id" :value="opt.id">
                {{ opt.name }}
              </option>
            </select>
            <span v-if="productStore.errorProduct?.category_id" class="field-error">
              {{ productStore.errorProduct.category_id[0] }}
            </span>
          </div>

          <div class="form-group">
            <label>SKU</label>
            <input
              v-model="form.sku"
              class="form-input"
              :class="{ 'input-error': productStore.errorProduct?.sku }"
              placeholder="e.g. SKU-001"
              @input="productStore.clearFieldError('sku')"
            />
            <span v-if="productStore.errorProduct?.sku" class="field-error">
              {{ productStore.errorProduct.sku[0] }}
            </span>
          </div>
        </div>

        <div class="form-group">
          <label>Product Name</label>
          <input
            v-model="form.name"
            class="form-input"
            :class="{ 'input-error': productStore.errorProduct?.name }"
            placeholder="e.g. Laptop Asus X441"
            @input="productStore.clearFieldError('name')"
          />
          <span v-if="productStore.errorProduct?.name" class="field-error">
            {{ productStore.errorProduct.name[0] }}
          </span>
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea
            v-model="form.description"
            class="form-input form-textarea"
            rows="3"
            placeholder="Deskripsi produk (opsional)..."
          ></textarea>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label>Price (Rp)</label>
            <input
              v-model.number="form.price"
              type="number"
              min="0"
              class="form-input"
              :class="{ 'input-error': productStore.errorProduct?.price }"
              @input="productStore.clearFieldError('price')"
            />
            <span v-if="productStore.errorProduct?.price" class="field-error">
              {{ productStore.errorProduct.price[0] }}
            </span>
          </div>

          <div class="form-group">
            <label>Stock</label>
            <input
              v-model.number="form.stock"
              type="number"
              min="0"
              class="form-input"
              :class="{ 'input-error': productStore.errorProduct?.stock }"
              @input="productStore.clearFieldError('stock')"
            />
            <span v-if="productStore.errorProduct?.stock" class="field-error">
              {{ productStore.errorProduct.stock[0] }}
            </span>
          </div>
        </div>

        <!-- Thumbnail -->
        <div class="form-group">
          <label>Thumbnail</label>
          <div class="photo-upload-wrap">
            <img
              :src="thumbnailPreview || 'https://ui-avatars.com/api/?name=Product&background=6366f1&color=fff&size=80'"
              alt="Thumbnail preview"
              class="photo-preview"
            />
            <div class="photo-upload-info">
              <input
                type="file"
                id="product-thumbnail-input"
                accept="image/png,image/jpeg,image/webp"
                class="hidden-input"
                @change="onChangeThumbnail"
              />
              <label for="product-thumbnail-input" class="btn-toolbar btn-purple" style="cursor:pointer; font-size:0.8rem;">
                <font-awesome-icon icon="upload" /> Pilih Thumbnail
              </label>
              <p class="photo-hint">Format: JPG, PNG, WEBP — Max 2MB</p>
              <p v-if="thumbnailFile" class="photo-filename">
                <font-awesome-icon icon="check" style="color:#16a34a" /> {{ thumbnailFile.name }}
              </p>
              <span v-if="productStore.errorProduct?.thumbnail" class="field-error">
                {{ productStore.errorProduct.thumbnail[0] }}
              </span>
            </div>
          </div>
        </div>

        <span v-if="productStore.errorProduct?._general" class="field-error">
          {{ productStore.errorProduct._general[0] }}
        </span>
      </div>

      <template #footer>
        <button class="btn-cancel" :disabled="productStore.savingProduct || productStore.updatingProduct" @click="closeProductModal">
          Cancel
        </button>
        <button
          class="btn-save"
          :disabled="productStore.savingProduct || productStore.updatingProduct"
          @click="submitProductForm"
        >
          <font-awesome-icon v-if="productStore.savingProduct || productStore.updatingProduct" icon="spinner" spin />
          <font-awesome-icon v-else icon="check" />
          {{ isEdit
            ? (productStore.updatingProduct ? 'Updating...' : 'Update')
            : (productStore.savingProduct   ? 'Saving...'   : 'Save Data') }}
        </button>
      </template>
    </AppModal>

    <!-- ── MODAL DETAIL PRODUK ── -->
    <AppModal
      :show="isDetailModalVisible"
      title="Product Details"
      icon="circle-info"
      size="md"
      @close="closeDetailModal"
    >
      <div v-if="productStore.loadingDetail" class="td-center">
        <div class="spinner-custom" style="margin: 20px auto;"></div>
      </div>
      <div v-else-if="productStore.productDetail" class="detail-list">
        <div class="detail-row">
          <span class="detail-label">SKU</span>
          <span class="detail-value mono">{{ productStore.productDetail.sku }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Product Name</span>
          <span class="detail-badge">{{ productStore.productDetail.name }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Category</span>
          <span class="detail-value">{{ productStore.productDetail.category_name || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Description</span>
          <span class="detail-value">{{ productStore.productDetail.description || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Price</span>
          <span class="detail-value">{{ productStore.formatCurrency(productStore.productDetail.price) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Stock</span>
          <span class="detail-value">{{ productStore.productDetail.stock }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Media</span>
          <span class="detail-value">{{ productStore.productDetail.catalogs?.length ?? 0 }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Created At</span>
          <span class="detail-value">{{ productStore.formatDate(productStore.productDetail.created_at) }}</span>
        </div>
      </div>
      <div v-else class="td-center">Data not available</div>
      <template #footer>
        <button class="btn-cancel" @click="closeDetailModal">Close</button>
      </template>
    </AppModal>

    <!-- ══════════════════════════════════════════
         MODAL KELOLA MEDIA (PDF/Video)
    ══════════════════════════════════════════ -->
    <AppModal
      :show="isMediaModalVisible"
      :title="`Manage Media — ${mediaTargetProduct?.name ?? ''}`"
      icon="photo-film"
      size="lg"
      @close="closeMediaModal"
    >
      <div class="form-container-gap">

        <div class="d-flex justify-content-between align-items-center">
          <span class="toolbar-note">
            <font-awesome-icon icon="circle-info" /> Media with a smaller sort_order appears first on the Sales page.
          </span>
          <button v-if="!isMediaFormVisible" class="btn-toolbar btn-purple" @click="openAddMediaForm">
            <font-awesome-icon icon="plus" /> Add Media
          </button>
        </div>

        <!-- FORM TAMBAH/EDIT MEDIA -->
        <div v-if="isMediaFormVisible" class="media-form-box">
          <div class="form-grid-2">
            <div class="form-group">
              <label>Media Type</label>
              <select v-model="mediaForm.media_type" class="form-input form-select">
                <option v-for="opt in mediaTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Source</label>
              <select v-model="mediaForm.source_type" class="form-input form-select">
                <option v-for="opt in sourceTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label>Title (opsional)</label>
              <input v-model="mediaForm.title" class="form-input" placeholder="e.g. Brosur Produk" />
            </div>
            <div class="form-group">
              <label>Sort Order</label>
              <input v-model.number="mediaForm.sort_order" type="number" min="0" class="form-input" />
            </div>
          </div>

          <div v-if="mediaForm.source_type === 'upload'" class="form-group">
            <label>File</label>
            <input
              type="file"
              class="form-input"
              :accept="mediaForm.media_type === 'pdf' ? '.pdf' : '.mp4,.mov,.avi,.mkv,.webm'"
              @change="onChangeMediaFile"
            />
            <p class="photo-hint">
              {{ mediaForm.media_type === 'pdf' ? 'Format: PDF' : 'Format: mp4/mov/avi/mkv/webm' }} — Max 20MB
              <span v-if="isMediaEdit"> (kosongkan kalau tidak ingin ganti file)</span>
            </p>
            <p v-if="mediaFile" class="photo-filename">
              <font-awesome-icon icon="check" style="color:#16a34a" /> {{ mediaFile.name }}
            </p>
          </div>
          <div v-else class="form-group">
            <label>URL</label>
            <input v-model="mediaForm.url" class="form-input" placeholder="https://..." />
          </div>

          <span v-if="mediaStore.errorMedia?._general" class="field-error">
            {{ mediaStore.errorMedia._general[0] }}
          </span>

          <div class="media-form-actions">
            <button class="btn-cancel" @click="closeMediaForm">Cancel</button>
            <button
              class="btn-save"
              :disabled="mediaStore.savingMedia || mediaStore.updatingMedia"
              @click="submitMediaForm"
            >
              <font-awesome-icon v-if="mediaStore.savingMedia || mediaStore.updatingMedia" icon="spinner" spin />
              <font-awesome-icon v-else icon="check" />
              {{ isMediaEdit ? 'Update Media' : 'Save Media' }}
            </button>
          </div>
        </div>

        <!-- LIST MEDIA -->
        <div class="table-card" style="overflow:auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:50px; text-align:center">TYPE</th>
                <th>TITLE</th>
                <th style="width:110px">SOURCE</th>
                <th style="width:70px; text-align:center">ORDER</th>
                <th style="width:110px; text-align:center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="mediaStore.loadingMedia">
                <td colspan="5" class="td-center">
                  <div style="display:flex; justify-content:center;">
                    <div class="spinner-custom"></div>
                  </div>
                </td>
              </tr>
              <tr v-else-if="!mediaStore.mediaData.length">
                <td colspan="5" class="td-center">Belum ada media untuk produk ini</td>
              </tr>
              <tr v-else v-for="item in mediaStore.mediaData" :key="item.id" class="data-row">
                <td style="text-align:center">
                  <font-awesome-icon :icon="mediaIcon(item)" :style="{ color: item.media_type === 'pdf' ? '#ef4444' : '#6366f1' }" />
                </td>
                <td class="td-name">{{ item.title || '-' }}</td>
                <td class="td-muted">{{ sourceTypeOptions.find(o => o.value === item.source_type)?.label ?? item.source_type }}</td>
                <td class="td-muted" style="text-align:center">{{ item.sort_order }}</td>
                <td class="td-actions">
                  <a
                    v-if="mediaStore.getMediaUrl(item)"
                    :href="mediaStore.getMediaUrl(item)"
                    target="_blank"
                    class="act-btn act-info"
                    title="Lihat"
                  >
                    <font-awesome-icon icon="eye" />
                  </a>
                  <button class="act-btn act-edit" title="Edit" @click="openEditMediaForm(item)">
                    <font-awesome-icon icon="pen-to-square" />
                  </button>
                  <button
                    class="act-btn act-delete"
                    title="Delete"
                    :disabled="mediaStore.deletingMedia"
                    @click="handleDeleteMedia(item)"
                  >
                    <font-awesome-icon icon="trash-can" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeMediaModal">Close</button>
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
.btn-toolbar:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover:not(:disabled) { background: #4f46e5; }
.btn-orange { background: #f59e0b; color: #fff; }
.btn-orange:hover:not(:disabled) { background: #d97706; }
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

/* ── DROPDOWN ── */
.drop-wrap { position: relative; }
.btn-select { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.83rem; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
.btn-select:hover { border-color: #6366f1; color: #6366f1; }
.drop-menu { position: absolute; top: calc(100% + 6px); left: 0; min-width: 160px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 10px; z-index: 300; opacity: 0; transform: translateY(-6px); pointer-events: none; transition: all 0.18s ease; }
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
.mono { font-family: monospace; }

.product-thumb { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; border: 1.5px solid var(--border-main); }

.menu-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 0.82rem; font-weight: 600; background: rgba(99,102,241,0.08); color: #4f46e5; border: 1px solid rgba(99,102,241,0.15); }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.empty-img   { width: 160px; opacity: 0.85; border-radius: 8px; }
.empty-text  { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }

.spinner-custom { width: 32px; height: 32px; border: 3px solid var(--border-main); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── ACTION BUTTONS ── */
.act-btn { width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s ease; margin: 0 2px; background: transparent; text-decoration: none; }
.act-btn:disabled, .act-disabled { opacity: 0.35; cursor: not-allowed; }
.act-edit         { color: #f59e0b; border-color: #f59e0b; }
.act-edit:hover:not(:disabled)   { background: #f59e0b; color: #fff; }
.act-delete       { color: #ef4444; border-color: #ef4444; }
.act-delete:hover:not(:disabled) { background: #ef4444; color: #fff; }
.act-info         { color: #6366f1; border-color: #6366f1; }
.act-info:hover   { background: #6366f1; color: #fff; }
.act-media        { color: #0ea5e9; border-color: #0ea5e9; }
.act-media:hover  { background: #0ea5e9; color: #fff; }

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
.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 560px) { .form-grid-2 { grid-template-columns: 1fr; } }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.form-input { padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.875rem; background: var(--bg-input); color: var(--text-primary); outline: none; transition: border 0.18s; width: 100%; box-sizing: border-box; }
.form-input:focus { border-color: #6366f1; }
.form-textarea { resize: none; min-height: 80px; line-height: 1.5; }
.input-error { border-color: #ef4444 !important; }
.field-error { font-size: 0.75rem; color: #ef4444; margin-top: 2px; }
.form-select {
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 1.25rem;
  padding-right: 36px;
}

/* Photo upload */
.photo-upload-wrap { display: flex; align-items: center; gap: 16px; }
.photo-preview { width: 72px; height: 72px; border-radius: 12px; object-fit: cover; border: 2px solid var(--border-main); flex-shrink: 0; }
.photo-upload-info { display: flex; flex-direction: column; gap: 6px; }
.photo-hint { font-size: 0.75rem; color: var(--text-muted); margin: 0; }
.photo-filename { font-size: 0.75rem; color: #059669; margin: 0; font-weight: 500; }
.hidden-input { display: none; }

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
.detail-value { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); }
.detail-badge { font-size: 0.82rem; font-weight: 600; padding: 3px 12px; border-radius: 6px; background: rgba(99,102,241,0.1); color: #6366f1; border: 1px solid rgba(99,102,241,0.2); }

/* ── MEDIA FORM BOX ── */
.media-form-box { border: 1px solid var(--border-main); border-radius: 10px; padding: 14px; background: var(--bg-input); display: flex; flex-direction: column; gap: 12px; }
.media-form-actions { display: flex; justify-content: flex-end; gap: 8px; }
</style>