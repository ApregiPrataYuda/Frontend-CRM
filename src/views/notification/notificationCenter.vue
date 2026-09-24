<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import AppModal from '@/components/AppModal.vue'
import { useConfirm } from '@/composables/useConfirm'
import { useNotificationStore } from '@/stores/notificationStore'
import { usePermissionStore } from '@/stores/PermissionStore'

// ── Halaman "Notification Center" -- 3 tab:
//   1. Notifikasi Saya  : inbox, semua role (recipient-side)
//   2. Reminder Saya    : kelola reminder personal, semua role
//   3. Kelola Notifikasi: buat Bulk/Reminder broadcast + lihat semua
//      histori, HANYA Admin/Manager (digate via canCreate, sama pola
//      dengan CategoryProductCatalogManagement.vue dkk)
//
// CATATAN: teks yang tampil ke user (label, tombol, placeholder, toast,
// dialog konfirmasi) sengaja dalam Bahasa Inggris atas permintaan user --
// komentar kode tetap Bahasa Indonesia mengikuti konvensi file lain. ──

const toast = useToast()
const { confirm } = useConfirm()
const notificationStore = useNotificationStore()
const permission = usePermissionStore()
const route = useRoute()

const currentUrl = computed(() => route.path.replace('/app', ''))
const canCreate = computed(() => permission.canCreate(currentUrl.value))

const activeTab = ref('inbox') // inbox | myReminders | manage

onMounted(() => {
  notificationStore.fetchMyNotifications()
  notificationStore.fetchUnreadCount()
})

function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'inbox') {
    notificationStore.myFilters.is_read = ''
    notificationStore.myPagination.current_page = 1
    notificationStore.fetchMyNotifications()
  } else if (tab === 'myReminders') {
    notificationStore.filters.category = 'reminder'
    notificationStore.filters.mine = true
    notificationStore.pagination.current_page = 1
    notificationStore.fetchNotifications()
  } else if (tab === 'manage') {
    notificationStore.filters.mine = false
    notificationStore.filters.category = ''
    notificationStore.pagination.current_page = 1
    notificationStore.fetchNotifications()
    notificationStore.fetchUserOptions()
    notificationStore.fetchCompanyOptions()
  }
}

const myReminders = computed(() =>
  notificationStore.notificationsData.filter((n) => n.reminder_scope === 'personal')
)

/* ═════════════════════════════════════════
 * TAB 1 -- Notifikasi Saya
 * ═════════════════════════════════════════ */
function filterInboxRead(val) {
  notificationStore.myFilters.is_read = val
  notificationStore.myPagination.current_page = 1
  notificationStore.fetchMyNotifications()
}

async function onClickInboxItem(item) {
  if (!item.is_read) await notificationStore.markAsRead(item.id)
}

/* ═════════════════════════════════════════
 * FORM (dipakai Tab 2 "Reminder Saya" & Tab 3 "Kelola Notifikasi")
 * ═════════════════════════════════════════ */
const isFormVisible = ref(false)
const formMode = ref('reminder') // 'reminder' (tab 2, selalu personal) | 'manage' (tab 3, bulk/reminder broadcast)

const emptyForm = () => ({
  category: 'reminder',
  title: '',
  message: '',
  target: 'all',
  recipient_ids: [],
  reminder_type: 'daily',
  reminder_scope: 'personal',
  day_of_week: 1,
  day_of_month: 1,
  time_of_day: '08:00',
  scheduled_at: '',
})
const form = ref(emptyForm())

function openReminderForm() {
  formMode.value = 'reminder'
  form.value = { ...emptyForm(), category: 'reminder', reminder_scope: 'personal' }
  notificationStore.errorNotification = null
  userSearch.value = ''
  notificationStore.selectedCompanyFilter = ''
  isFormVisible.value = true
}

function openManageForm() {
  formMode.value = 'manage'
  form.value = { ...emptyForm(), category: 'bulk', reminder_scope: 'broadcast' }
  notificationStore.errorNotification = null
  userSearch.value = ''
  notificationStore.selectedCompanyFilter = ''
  isFormVisible.value = true
}

function closeForm() {
  isFormVisible.value = false
  notificationStore.errorNotification = null
  userSearch.value = ''
  notificationStore.selectedCompanyFilter = ''
}

/* ═════════════════════════════════════════
 * PILIH USER -- checkbox list + search (ganti gaya <select multiple>
 * bawaan browser yang kurang enak dipakai -- di-scroll & ctrl+klik).
 * Dipakai di 2 tempat (form bulk & form reminder-broadcast), tapi
 * cuma satu yang pernah tampil bersamaan jadi aman pakai state sharing.
 * ═════════════════════════════════════════ */
const userSearch = ref('')

const filteredUserOptions = computed(() => {
  const q = userSearch.value.trim().toLowerCase()
  if (!q) return notificationStore.userOptions
  return notificationStore.userOptions.filter((u) => u.fullname.toLowerCase().includes(q))
})

function isUserSelected(id) {
  return form.value.recipient_ids.includes(id)
}

function toggleUserSelection(id) {
  const idx = form.value.recipient_ids.indexOf(id)
  if (idx === -1) {
    form.value.recipient_ids.push(id)
  } else {
    form.value.recipient_ids.splice(idx, 1)
  }
}

// ── Ganti company filter -> re-fetch userOptions dari backend dengan
// company_id baru (lihat notificationStore.fetchUserOptions(), yang
// baca selectedCompanyFilter langsung). User yang sudah kepilih
// sebelumnya (form.recipient_ids) sengaja TIDAK direset di sini --
// kalau sebelumnya sudah centang orang dari company lain lalu ganti
// filter, pilihannya tetap tersimpan walau sementara tidak kelihatan
// di list (baru search/filter, bukan submit). ──
function onChangeCompanyFilter() {
  notificationStore.fetchUserOptions()
}

const dayOfWeekOptions = [
  { value: 0, label: 'Sunday' }, { value: 1, label: 'Monday' }, { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' }, { value: 4, label: 'Thursday' }, { value: 5, label: 'Friday' }, { value: 6, label: 'Saturday' },
]

async function submitForm() {
  const payload = {
    category: form.value.category,
    title: form.value.title.trim(),
    message: form.value.message.trim(),
  }

  if (form.value.category === 'bulk' || (form.value.category === 'reminder' && form.value.reminder_scope === 'broadcast')) {
    payload.target = form.value.target
    if (form.value.target === 'specific') {
      payload.recipient_ids = form.value.recipient_ids
    }
  }

  if (form.value.category === 'reminder') {
    payload.reminder_type = form.value.reminder_type
    payload.reminder_scope = form.value.reminder_scope

    if (form.value.reminder_type === 'weekly') payload.day_of_week = form.value.day_of_week
    if (form.value.reminder_type === 'monthly') payload.day_of_month = form.value.day_of_month
    if (['daily', 'weekly', 'monthly'].includes(form.value.reminder_type)) payload.time_of_day = form.value.time_of_day
    if (form.value.reminder_type === 'scheduled') payload.scheduled_at = form.value.scheduled_at
  } else if (form.value.category === 'bulk' && form.value.scheduled_at) {
    payload.scheduled_at = form.value.scheduled_at
  }

  const ok = await notificationStore.saveNotification(payload)
  if (ok) {
    toast.success('Notification saved successfully')
    closeForm()
  }
}

/* ═════════════════════════════════════════
 * ACTIONS (toggle / delete)
 * ═════════════════════════════════════════ */
async function handleToggle(item) {
  const ok = await notificationStore.toggleReminderStatus(item.id)
  if (ok) toast.success('Reminder status updated')
  else toast.error('Failed to update reminder status')
}

async function handleDelete(item) {
  const isConfirmed = await confirm({
    type: 'danger',
    title: 'Delete Notification',
    message: `Are you sure you want to delete "${item.title}"?`,
    detail: item.category === 'reminder' ? 'This reminder will never fire again.' : 'This action cannot be undone.',
    confirmText: 'Yes, Delete',
    cancelText: 'Cancel',
  })
  if (isConfirmed) {
    const result = await notificationStore.deleteNotification(item.id)
    if (result.ok) toast.success('Notification deleted successfully')
    else toast.error(result.message || 'Failed to delete notification')
  }
}

function recurrenceSummary(item) {
  const t = item.time_of_day?.slice(0, 5) ?? ''
  if (item.reminder_type === 'daily') return `Every day, at ${t}`
  if (item.reminder_type === 'weekly') {
    const label = dayOfWeekOptions.find((d) => d.value === item.day_of_week)?.label ?? '-'
    return `Every ${label}, at ${t}`
  }
  if (item.reminder_type === 'monthly') return `Day ${item.day_of_month} of every month, at ${t}`
  if (item.reminder_type === 'scheduled') return `Once: ${item.scheduled_at ?? '-'}`
  return '-'
}

function categoryLabel(category) {
  if (category === 'bulk') return 'Bulk'
  if (category === 'reminder') return 'Reminder'
  if (category === 'agenda') return 'Agenda'
  return category
}
</script>

<template>
  <div class="h-100 d-flex flex-column">

    <!-- BREADCRUMB -->
    <div class="breadcrumb-card mb-2">
      <div class="breadcrumb-left">
        <h4 class="breadcrumb-title"><font-awesome-icon icon="bell" /> Notification Center</h4>
        <div class="breadcrumb-path">
          <span class="breadcrumb-item"><font-awesome-icon icon="house" /> Home</span>
          <font-awesome-icon icon="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-item active">Notification Center</span>
        </div>
      </div>
    </div>

    <!-- TABS -->
    <div class="notif-tabs">
      <button class="notif-tab-btn" :class="{ active: activeTab === 'inbox' }" @click="switchTab('inbox')">
        <font-awesome-icon icon="inbox" /> My Notifications
        <span v-if="notificationStore.unreadCount > 0" class="tab-badge">{{ notificationStore.unreadCount }}</span>
      </button>
      <button class="notif-tab-btn" :class="{ active: activeTab === 'myReminders' }" @click="switchTab('myReminders')">
        <font-awesome-icon icon="clock" /> My Reminders
      </button>
      <button v-if="canCreate" class="notif-tab-btn" :class="{ active: activeTab === 'manage' }" @click="switchTab('manage')">
        <font-awesome-icon icon="bullhorn" /> Manage Notifications
      </button>
    </div>

    <!-- ═══════════ TAB 1: NOTIFIKASI SAYA ═══════════ -->
    <div v-if="activeTab === 'inbox'" class="content-card flex-grow-1 overflow-auto">
      <div class="content-toolbar">
        <div class="drop-tabs-inline">
          <button class="inline-filter-btn" :class="{ active: notificationStore.myFilters.is_read === '' }" @click="filterInboxRead('')">All</button>
          <button class="inline-filter-btn" :class="{ active: notificationStore.myFilters.is_read === 'false' }" @click="filterInboxRead('false')">Unread</button>
        </div>
        <button v-if="notificationStore.unreadCount > 0" class="btn-toolbar btn-orange" @click="notificationStore.markAllAsRead()">
          <font-awesome-icon icon="check-double" /> Mark All as Read
        </button>
      </div>

      <div v-if="notificationStore.loadingMyNotifications" class="td-center"><div class="spinner-custom"></div></div>
      <div v-else-if="!notificationStore.myNotificationsData.length" class="empty-state">
        <div class="empty-text">No notifications yet</div>
      </div>
      <div v-else class="inbox-list">
        <div
          v-for="item in notificationStore.myNotificationsData" :key="item.id"
          class="inbox-item" :class="{ unread: !item.is_read }"
          @click="onClickInboxItem(item)"
        >
          <span class="menu-badge">{{ categoryLabel(item.category) }}</span>
          <div class="inbox-item-body">
            <div class="inbox-item-title">{{ item.title }}</div>
            <div class="inbox-item-message">{{ item.message }}</div>
            <div class="td-sub">{{ item.created_at }}</div>
          </div>
          <span v-if="!item.is_read" class="notif-dot"></span>
        </div>
      </div>

      <div class="pagination-card">
        <div class="pagination-nav">
          <button class="btn-prev-next" :disabled="!notificationStore.myPagination.prev_page_url" @click="notificationStore.fetchMyNotifications(notificationStore.myPagination.prev_page_url)">
            <font-awesome-icon icon="circle-left" /> Prev
          </button>
          <button class="btn-prev-next" :disabled="!notificationStore.myPagination.next_page_url" @click="notificationStore.fetchMyNotifications(notificationStore.myPagination.next_page_url)">
            Next <font-awesome-icon icon="circle-right" />
          </button>
        </div>
        <span class="page-badge">TOTAL: {{ notificationStore.myPagination.total }}</span>
      </div>
    </div>

    <!-- ═══════════ TAB 2: REMINDER SAYA ═══════════ -->
    <div v-if="activeTab === 'myReminders'" class="content-card flex-grow-1 overflow-auto">
      <div class="content-toolbar">
        <span class="toolbar-note"><font-awesome-icon icon="circle-info" /> Personal reminder, only notifies yourself.</span>
        <button class="btn-toolbar btn-purple" @click="openReminderForm">
          <font-awesome-icon icon="plus" /> Add Reminder
        </button>
      </div>

      <div v-if="notificationStore.loadingNotifications" class="td-center"><div class="spinner-custom"></div></div>
      <div v-else-if="!myReminders.length" class="empty-state"><div class="empty-text">No reminders yet</div></div>
      <div v-else class="reminder-list">
        <div v-for="item in myReminders" :key="item.id" class="reminder-item">
          <div class="reminder-item-body">
            <div class="inbox-item-title">{{ item.title }}</div>
            <div class="td-sub">{{ recurrenceSummary(item) }}</div>
          </div>
          <div class="reminder-item-actions">
            <span class="status-badge" :class="item.status === 'active' ? 'status-sent' : 'status-failed'">
              {{ item.status === 'active' ? 'Active' : 'Inactive' }}
            </span>
            <button class="act-btn act-info" title="Turn On/Off" @click="handleToggle(item)">
              <font-awesome-icon icon="power-off" />
            </button>
            <button class="act-btn act-danger" title="Delete" @click="handleDelete(item)">
              <font-awesome-icon icon="trash" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════ TAB 3: KELOLA NOTIFIKASI (Admin/Manager) ═══════════ -->
    <div v-if="activeTab === 'manage' && canCreate" class="content-card flex-grow-1 overflow-auto">
      <div class="content-toolbar">
        <div class="drop-tabs-inline">
          <button class="inline-filter-btn" :class="{ active: !notificationStore.filters.category }" @click="notificationStore.filters.category=''; notificationStore.changeFilters()">All</button>
          <button class="inline-filter-btn" :class="{ active: notificationStore.filters.category==='bulk' }" @click="notificationStore.filters.category='bulk'; notificationStore.changeFilters()">Bulk</button>
          <button class="inline-filter-btn" :class="{ active: notificationStore.filters.category==='reminder' }" @click="notificationStore.filters.category='reminder'; notificationStore.changeFilters()">Reminder</button>
        </div>
        <button class="btn-toolbar btn-purple" @click="openManageForm">
          <font-awesome-icon icon="plus" /> Create Notification
        </button>
      </div>

      <div v-if="notificationStore.loadingNotifications" class="td-center"><div class="spinner-custom"></div></div>
      <div v-else-if="!notificationStore.notificationsData.length" class="empty-state"><div class="empty-text">No notifications yet</div></div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>CATEGORY</th><th>TITLE</th><th>TARGET</th><th>STATUS</th><th style="text-align:center">#RECIPIENTS</th><th style="text-align:center">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in notificationStore.notificationsData" :key="item.id" class="data-row">
            <td><span class="menu-badge">{{ categoryLabel(item.category) }}</span></td>
            <td class="td-name">{{ item.title }}</td>
            <td class="td-muted">{{ item.target === 'all' ? 'All Users' : (item.target === 'specific' ? 'Manually Selected' : '-') }}</td>
            <td>
              <span class="status-badge" :class="['sent','active'].includes(item.status) ? 'status-sent' : 'status-failed'">
                {{ item.status }}
              </span>
            </td>
            <td style="text-align:center">{{ item.recipients_count ?? 0 }}</td>
            <td style="text-align:center">
              <button v-if="item.category === 'reminder'" class="act-btn act-info" title="Turn On/Off" @click="handleToggle(item)">
                <font-awesome-icon icon="power-off" />
              </button>
              <button class="act-btn act-danger" title="Delete" @click="handleDelete(item)">
                <font-awesome-icon icon="trash" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination-card">
        <div class="pagination-nav">
          <button class="btn-prev-next" :disabled="!notificationStore.pagination.prev_page_url" @click="notificationStore.fetchNotifications(notificationStore.pagination.prev_page_url)">
            <font-awesome-icon icon="circle-left" /> Prev
          </button>
          <button class="btn-prev-next" :disabled="!notificationStore.pagination.next_page_url" @click="notificationStore.fetchNotifications(notificationStore.pagination.next_page_url)">
            Next <font-awesome-icon icon="circle-right" />
          </button>
        </div>
        <span class="page-badge">TOTAL: {{ notificationStore.pagination.total }}</span>
      </div>
    </div>

    <!-- ══════════════ FORM MODAL (Reminder / Bulk) ══════════════ -->
    <AppModal
      :show="isFormVisible"
      :title="formMode === 'reminder' ? 'Add Reminder' : 'Create Notification'"
      :icon="formMode === 'reminder' ? 'clock' : 'bullhorn'"
      size="md"
      @close="closeForm"
    >
      <div class="form-container-gap">

          <div v-if="formMode === 'manage'" class="form-group">
            <label>Category</label>
            <select v-model="form.category" class="form-input form-select">
              <option value="bulk">Bulk Notification</option>
              <option value="reminder">Reminder (Broadcast)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Title</label>
            <input v-model="form.title" class="form-input" placeholder="e.g. Client Follow-up Reminder" />
            <span v-if="notificationStore.errorNotification?.title" class="field-error">{{ notificationStore.errorNotification.title[0] }}</span>
          </div>

          <div class="form-group">
            <label>Message</label>
            <textarea v-model="form.message" class="form-input" rows="3" placeholder="Notification message content"></textarea>
            <span v-if="notificationStore.errorNotification?.message" class="field-error">{{ notificationStore.errorNotification.message[0] }}</span>
          </div>

          <template v-if="formMode === 'manage' && form.category === 'bulk'">
            <div class="form-group">
              <label>Recipient Target</label>
              <select v-model="form.target" class="form-input form-select">
                <option value="all">All Users</option>
                <option value="specific">Manually Selected</option>
              </select>
            </div>
            <div v-if="form.target === 'specific'" class="form-group">
              <label>
                Select Users
                <span v-if="form.recipient_ids.length" class="user-selected-count">({{ form.recipient_ids.length }} selected)</span>
              </label>
              <div class="user-picker">
                <div class="user-picker-filters">
                  <select v-model="notificationStore.selectedCompanyFilter" class="user-picker-company-select" @change="onChangeCompanyFilter">
                    <option value="">All Companies</option>
                    <option v-for="c in notificationStore.companyOptions" :key="c.id_group" :value="c.id_group">{{ c.name_group }}</option>
                  </select>
                </div>
                <div class="user-picker-search">
                  <font-awesome-icon icon="magnifying-glass" />
                  <input v-model="userSearch" type="text" placeholder="Search user name..." />
                </div>
                <div class="user-picker-list">
                  <div v-if="notificationStore.loadingUserOptions" class="user-picker-empty">Loading...</div>
                  <template v-else>
                    <label v-for="u in filteredUserOptions" :key="u.id_user" class="user-picker-item">
                      <input type="checkbox" :checked="isUserSelected(u.id_user)" @change="toggleUserSelection(u.id_user)" />
                      <span>{{ u.fullname }}</span>
                    </label>
                    <div v-if="!filteredUserOptions.length" class="user-picker-empty">No matching users</div>
                  </template>
                </div>
              </div>
              <span v-if="notificationStore.errorNotification?.recipient_ids" class="field-error">{{ notificationStore.errorNotification.recipient_ids[0] }}</span>
            </div>
            <div class="form-group">
              <label>Schedule Send (optional)</label>
              <input v-model="form.scheduled_at" type="datetime-local" class="form-input" />
              <p class="photo-hint">Leave empty to send now.</p>
            </div>
          </template>

          <template v-if="form.category === 'reminder'">
            <div class="form-group">
              <label>Reminder Type</label>
              <select v-model="form.reminder_type" class="form-input form-select">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="scheduled">Scheduled (once)</option>
              </select>
            </div>

            <div v-if="form.reminder_type === 'weekly'" class="form-group">
              <label>Day</label>
              <select v-model.number="form.day_of_week" class="form-input form-select">
                <option v-for="d in dayOfWeekOptions" :key="d.value" :value="d.value">{{ d.label }}</option>
              </select>
            </div>

            <div v-if="form.reminder_type === 'monthly'" class="form-group">
              <label>Date</label>
              <input v-model.number="form.day_of_month" type="number" min="1" max="31" class="form-input" />
            </div>

            <div v-if="['daily','weekly','monthly'].includes(form.reminder_type)" class="form-group">
              <label>Time</label>
              <input v-model="form.time_of_day" type="time" class="form-input" />
            </div>

            <div v-if="form.reminder_type === 'scheduled'" class="form-group">
              <label>Date & Time</label>
              <input v-model="form.scheduled_at" type="datetime-local" class="form-input" />
              <span v-if="notificationStore.errorNotification?.scheduled_at" class="field-error">{{ notificationStore.errorNotification.scheduled_at[0] }}</span>
            </div>

            <template v-if="formMode === 'manage'">
              <div class="form-group">
                <label>Recipient Target</label>
                <select v-model="form.target" class="form-input form-select">
                  <option value="all">All Users</option>
                  <option value="specific">Manually Selected</option>
                </select>
              </div>
              <div v-if="form.target === 'specific'" class="form-group">
                <label>
                  Select Users
                  <span v-if="form.recipient_ids.length" class="user-selected-count">({{ form.recipient_ids.length }} selected)</span>
                </label>
                <div class="user-picker">
                  <div class="user-picker-filters">
                    <select v-model="notificationStore.selectedCompanyFilter" class="user-picker-company-select" @change="onChangeCompanyFilter">
                      <option value="">All Companies</option>
                      <option v-for="c in notificationStore.companyOptions" :key="c.id_group" :value="c.id_group">{{ c.name_group }}</option>
                    </select>
                  </div>
                  <div class="user-picker-search">
                    <font-awesome-icon icon="magnifying-glass" />
                    <input v-model="userSearch" type="text" placeholder="Search user name..." />
                  </div>
                  <div class="user-picker-list">
                    <div v-if="notificationStore.loadingUserOptions" class="user-picker-empty">Loading...</div>
                    <template v-else>
                      <label v-for="u in filteredUserOptions" :key="u.id_user" class="user-picker-item">
                        <input type="checkbox" :checked="isUserSelected(u.id_user)" @change="toggleUserSelection(u.id_user)" />
                        <span>{{ u.fullname }}</span>
                      </label>
                      <div v-if="!filteredUserOptions.length" class="user-picker-empty">No matching users</div>
                    </template>
                  </div>
                </div>
                <span v-if="notificationStore.errorNotification?.recipient_ids" class="field-error">{{ notificationStore.errorNotification.recipient_ids[0] }}</span>
              </div>
            </template>
          </template>

          <span v-if="notificationStore.errorNotification?._general" class="field-error">{{ notificationStore.errorNotification._general[0] }}</span>
      </div>

      <template #footer>
        <button class="btn-cancel" :disabled="notificationStore.savingNotification" @click="closeForm">Cancel</button>
        <button class="btn-save" :disabled="notificationStore.savingNotification" @click="submitForm">
          <font-awesome-icon v-if="notificationStore.savingNotification" icon="spinner" spin />
          <font-awesome-icon v-else icon="check" />
          {{ notificationStore.savingNotification ? 'Saving...' : 'Save' }}
        </button>
      </template>
    </AppModal>

  </div>
</template>

<style scoped>
.h-100 { --text-muted: #64748b; --primary-color: #6366f1; }
.form-container-gap { display: flex; flex-direction: column; gap: 14px; }

.breadcrumb-card { background: var(--bg-card); border-radius: 10px; padding: 16px 18px; box-shadow: 0 1px 3px var(--shadow-color); }
.breadcrumb-left { display: flex; flex-direction: column; gap: 6px; }
.breadcrumb-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.breadcrumb-title svg { color: #6366f1; }
.breadcrumb-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.breadcrumb-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
.breadcrumb-item.active { color: #6366f1; font-weight: 700; }
.breadcrumb-separator { font-size: 0.7rem; color: var(--text-muted); opacity: 0.6; }

.notif-tabs { display: flex; gap: 8px; margin: 12px 0; flex-wrap: wrap; }
.notif-tab-btn { display: inline-flex; align-items: center; gap: 8px; padding: 9px 16px; border-radius: 8px; border: 1px solid var(--border-main); background: var(--bg-card); color: var(--text-muted); font-size: 0.84rem; font-weight: 700; cursor: pointer; transition: all 0.15s; }
.notif-tab-btn:hover { border-color: #6366f1; color: #6366f1; }
.notif-tab-btn.active { background: #6366f1; border-color: #6366f1; color: #fff; }
.tab-badge { background: #ef4444; color: #fff; font-size: 0.65rem; font-weight: 800; border-radius: 999px; padding: 1px 6px; }

.content-card { background: var(--bg-card); border-radius: 10px; padding: 16px 18px; box-shadow: 0 1px 3px var(--shadow-color); }
.content-toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
.toolbar-note { font-size: 0.78rem; color: var(--text-muted); display: inline-flex; align-items: center; gap: 6px; }
.btn-toolbar { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: none; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; }
.btn-purple { background: #6366f1; color: #fff; }
.btn-purple:hover { background: #4f46e5; }
.btn-orange { background: #f59e0b; color: #fff; }
.btn-orange:hover { background: #d97706; }

.drop-tabs-inline { display: flex; gap: 6px; }
.inline-filter-btn { padding: 6px 12px; border: 1px solid var(--border-main); border-radius: 7px; background: var(--bg-input); color: var(--text-muted); font-size: 0.8rem; font-weight: 600; cursor: pointer; }
.inline-filter-btn.active { background: #6366f1; border-color: #6366f1; color: #fff; }

.menu-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; background: rgba(99,102,241,0.08); color: #4f46e5; border: 1px solid rgba(99,102,241,0.15); white-space: nowrap; }

.inbox-list, .reminder-list { display: flex; flex-direction: column; gap: 8px; }
.inbox-item, .reminder-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; border: 1px solid var(--border-main); border-radius: 8px; cursor: pointer; transition: background 0.15s; }
.reminder-item { cursor: default; align-items: center; }
.inbox-item:hover { background: var(--bg-nav-hover); }
.inbox-item.unread { background: rgba(99,102,241,0.05); border-color: rgba(99,102,241,0.25); }
.inbox-item-body, .reminder-item-body { flex: 1; min-width: 0; }
.inbox-item-title { font-size: 0.86rem; font-weight: 700; color: var(--text-primary); }
.inbox-item-message { font-size: 0.8rem; color: var(--text-muted); margin-top: 2px; }
.td-sub { font-size: 0.72rem; color: var(--text-muted); margin-top: 4px; }
.notif-dot { width: 8px; height: 8px; border-radius: 50%; background: #6366f1; margin-top: 4px; flex-shrink: 0; }
.reminder-item-actions { display: flex; align-items: center; gap: 6px; }

.status-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; }
.status-sent { background: rgba(22,163,74,0.1); color: #16a34a; border: 1px solid rgba(22,163,74,0.2); }
.status-failed { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }

.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.data-table thead tr { background: var(--bg-input); border-bottom: 2px solid var(--border-main); }
.data-table th { padding: 12px 16px; text-align: left; font-size: 0.72rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; }
.data-table td { padding: 12px 16px; vertical-align: middle; color: var(--text-primary); }
.data-row { border-bottom: 1px solid var(--border-main); }
.data-row:hover { background: var(--bg-nav-hover); }
.td-name { font-weight: 600; }
.td-muted { color: var(--text-muted); font-size: 0.84rem; }
.td-center { text-align: center; padding: 40px; color: var(--text-muted); }

.act-btn { height: 30px; width: 30px; border-radius: 6px; border: 1.5px solid; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center; margin: 0 2px; background: transparent; }
.act-info { color: #6366f1; border-color: #6366f1; }
.act-info:hover { background: #6366f1; color: #fff; }
.act-danger { color: #ef4444; border-color: #ef4444; }
.act-danger:hover { background: #ef4444; color: #fff; }

.empty-state { padding: 40px 0; text-align: center; }
.empty-text { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
.spinner-custom { width: 32px; height: 32px; margin: 30px auto; border: 3px solid var(--border-main); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.pagination-card { margin-top: 14px; background: var(--bg-input); border-radius: 10px; padding: 12px 16px; display: flex; flex-direction: row-reverse; align-items: center; justify-content: space-between; gap: 12px; }
.pagination-nav { display: flex; gap: 8px; }
.btn-prev-next { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.82rem; font-weight: 700; cursor: pointer; }
.btn-prev-next:disabled { opacity: 0.35; cursor: not-allowed; }
.page-badge { padding: 6px 12px; border: 1px solid var(--border-main); border-radius: 7px; font-size: 0.7rem; font-weight: 700; color: var(--text-muted); background: var(--bg-card); white-space: nowrap; }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.form-input { padding: 9px 12px; border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.875rem; background: var(--bg-input); color: var(--text-primary); outline: none; width: 100%; box-sizing: border-box; font-family: inherit; }
.form-input:focus { border-color: #6366f1; }
.field-error { font-size: 0.75rem; color: #ef4444; }
.photo-hint { font-size: 0.75rem; color: var(--text-muted); margin: 0; }

/* ── "Select Users" -- checkbox list + search, ganti gaya <select multiple> ── */
.user-selected-count { text-transform: none; font-weight: 600; color: #6366f1; letter-spacing: normal; }
.user-picker { border: 1px solid var(--border-main); border-radius: 8px; overflow: hidden; background: var(--bg-input); }
.user-picker-filters { padding: 8px 12px; border-bottom: 1px solid var(--border-main); }
.user-picker-company-select { width: 100%; padding: 6px 8px; border: 1px solid var(--border-main); border-radius: 6px; font-size: 0.8rem; background: var(--bg-card); color: var(--text-primary); font-family: inherit; }
.user-picker-search { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--border-main); color: var(--text-muted); font-size: 0.8rem; }
.user-picker-search input { flex: 1; border: none; background: transparent; outline: none; font-size: 0.85rem; color: var(--text-primary); font-family: inherit; }
.user-picker-list { max-height: 190px; overflow-y: auto; padding: 4px; }
.user-picker-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; font-size: 0.85rem; color: var(--text-primary); cursor: pointer; user-select: none; }
.user-picker-item:hover { background: var(--bg-nav-hover); }
.user-picker-item input[type="checkbox"] { width: 16px; height: 16px; accent-color: #6366f1; cursor: pointer; flex-shrink: 0; }
.user-picker-empty { padding: 16px 10px; text-align: center; font-size: 0.8rem; color: var(--text-muted); }

.btn-cancel { padding: 8px 18px; background: var(--bg-input); color: var(--text-muted); border: 1px solid var(--border-main); border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-save:disabled, .btn-cancel:disabled { opacity: 0.6; cursor: not-allowed; }
</style>