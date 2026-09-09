import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { odooSettingsServices } from '@/services/odooSettingsService'

export const useOdooSettingsStore = defineStore('odooSettings', () => {

  // ───────────────── GLOBAL CONNECTION ─────────────────
  const connection = reactive({
    url:                 '',
    db:                  '',
    username:            '',
    api_key:             '',
    default_company_id:  null,
    updated_at:          null,
  })

  const loading            = ref(false)
  const connectionDirty    = ref(false)
  const savingConnection   = ref(false)
  const testingConnection  = ref(false)
  const testStatus         = ref('idle') // idle | testing | success | error
  const lastTestedLabel    = ref('')
  const errorConnection    = ref(null)

  // ───────────────── COMPANY MAPPING ─────────────────
  const companies       = ref([])
  const savingMappingId  = ref(null) // id_group yang lagi disimpan (buat spinner per baris)

  // ───────────────── FETCH ─────────────────
  const fetchSettings = async () => {
    loading.value = true

    try {
      const response = await odooSettingsServices.getSettings()
      const result   = response.data?.data ?? response.data

      const conn = result?.connection ?? {}
      connection.url                = conn.url ?? ''
      connection.db                 = conn.db ?? ''
      connection.username           = conn.username ?? ''
      connection.api_key            = conn.api_key ?? ''
      connection.default_company_id = conn.default_company_id ?? null
      connection.updated_at         = conn.updated_at ?? null

      connectionDirty.value = false
      testStatus.value      = 'idle'

      const list = result?.companies ?? []
      companies.value.splice(0, companies.value.length, ...list.map((c) => ({
        id_group:         c.id_group,
        name_group:       c.name_group,
        odoo_company_id:  c.odoo_company_id,
        is_active:        c.is_active,
        // ── state UI lokal per baris (bukan dari API) ──
        editing: false,
        draft:   '',
        error:   false,
      })))

    } catch (error) {
      console.error('Gagal fetch Odoo settings:', error)
    } finally {
      loading.value = false
    }
  }

  // ───────────────── CONNECTION: DIRTY TRACKING ─────────────────
  const markConnectionDirty = () => {
    connectionDirty.value = true
    testStatus.value      = 'idle'
  }

  // ───────────────── CONNECTION: TEST ─────────────────
  const testConnection = async () => {
    if (testingConnection.value) return false

    testingConnection.value = true
    testStatus.value        = 'testing'
    errorConnection.value   = null

    try {
      await odooSettingsServices.testConnection({
        url:                 connection.url,
        db:                  connection.db,
        username:            connection.username,
        api_key:             connection.api_key,
        default_company_id:  connection.default_company_id,
      })

      testStatus.value      = 'success'
      lastTestedLabel.value = 'baru saja'

      return true

    } catch (error) {
      testStatus.value = 'error'
      errorConnection.value =
        error.response?.data?.errors ??
        error.response?.data?.message ??
        'Koneksi ke Odoo gagal'

      return false

    } finally {
      testingConnection.value = false
    }
  }

  // ───────────────── CONNECTION: SAVE ─────────────────
  const saveConnection = async () => {
    if (!connectionDirty.value || savingConnection.value) return false

    savingConnection.value = true
    errorConnection.value  = null

    try {
      const response = await odooSettingsServices.updateConnection({
        url:                 connection.url,
        db:                  connection.db,
        username:            connection.username,
        api_key:             connection.api_key,
        default_company_id:  connection.default_company_id,
      })

      const saved = response.data?.data ?? response.data
      connection.updated_at = saved?.updated_at ?? connection.updated_at
      connectionDirty.value = false

      return true

    } catch (error) {
      errorConnection.value =
        error.response?.data?.errors ??
        error.response?.data?.message ??
        'Gagal menyimpan pengaturan koneksi'

      return false

    } finally {
      savingConnection.value = false
    }
  }

  // ───────────────── COMPANY MAPPING: EDIT ─────────────────
  const startEditCompany = (row) => {
    row.draft = (row.odoo_company_id !== null && row.odoo_company_id !== undefined)
      ? String(row.odoo_company_id)
      : ''
    row.error   = false
    row.editing = true
  }

  const cancelEditCompany = (row) => {
    row.editing = false
    row.error   = false
  }

  // ───────────────── COMPANY MAPPING: SAVE ─────────────────
  const saveCompanyMapping = async (row) => {
    const trimmed = (row.draft || '').trim()
    const value   = trimmed === '' ? null : Number(trimmed)

    if (trimmed !== '' && (!Number.isInteger(value) || value < 1)) {
      row.error = true
      return false
    }

    savingMappingId.value = row.id_group

    try {
      const response = await odooSettingsServices.updateCompanyMapping(row.id_group, {
        odoo_company_id: value,
      })

      const saved = response.data?.data ?? response.data
      row.odoo_company_id = saved?.odoo_company_id ?? value
      row.editing = false
      row.error   = false

      return true

    } catch (error) {
      row.error = true
      console.error('Gagal simpan mapping company:', error)
      return false

    } finally {
      savingMappingId.value = null
    }
  }

  return {
    // state
    connection,
    loading,
    connectionDirty,
    savingConnection,
    testingConnection,
    testStatus,
    lastTestedLabel,
    errorConnection,

    companies,
    savingMappingId,

    // actions
    fetchSettings,
    markConnectionDirty,
    testConnection,
    saveConnection,

    startEditCompany,
    cancelEditCompany,
    saveCompanyMapping,
  }
})