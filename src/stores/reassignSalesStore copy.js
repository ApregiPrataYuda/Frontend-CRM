import { defineStore } from 'pinia'
import { reassignSalesServices } from '@/services/reassignSalesServices'

export const useReassignSalesStore = defineStore('reassignSales', {
  state: () => ({
    customersData: [],
    loadingCustomers: false,
    errorCustomers: null,

    salesOptions: [],
    loadingSales: false,

    searchKeyword: '',
    searchTimer: null,

    reassigningCustomer: false,
    reassigningBranch: false,

    pagination: {
      current_page: 1,
      per_page: 10,
      last_page: 1,
      total: 0,
      next_page_url: null,
      prev_page_url: null,
    },
  }),

  actions: {
    // ── FETCH LIST CUSTOMER + BRANCH ──
    async fetchCustomers(url = null) {
      this.loadingCustomers = true
      this.errorCustomers = null
      try {
        const res = url
          ? await reassignSalesServices.getByUrl(url)
          : await reassignSalesServices.getAll({
              search: this.searchKeyword || undefined,
              per_page: this.pagination.per_page,
            })

        const payload = res.data.data

        this.customersData = payload.data

        this.pagination = {
          current_page: payload.current_page,
          per_page: payload.per_page,
          last_page: payload.last_page,
          total: payload.total,
          next_page_url: payload.next_page_url,
          prev_page_url: payload.prev_page_url,
        }
      } catch (e) {
        this.errorCustomers = e?.response?.data?.errors ?? null
        throw e
      } finally {
        this.loadingCustomers = false
      }
    },

    // ── FETCH SALES DROPDOWN ──
    async fetchSales(search = '') {
      this.loadingSales = true
      try {
        const res = await reassignSalesServices.getSales({ search: search || undefined })
        this.salesOptions = res.data.data
      } finally {
        this.loadingSales = false
      }
    },

    // ── SEARCH DEBOUNCE ──
    searchWithDelay(value) {
      this.searchKeyword = value
      if (this.searchTimer) clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => {
        this.fetchCustomers()
      }, 400)
    },

    // ── REASSIGN CUSTOMER ──
    async reassignCustomer(customerId, payload) {
      this.reassigningCustomer = true
      try {
        const res = await reassignSalesServices.reassignCustomer(customerId, payload)
        await this.fetchCustomers()
        return res.data.data
      } finally {
        this.reassigningCustomer = false
      }
    },

    // ── REASSIGN BRANCH ──
    async reassignBranch(branchId, payload) {
      this.reassigningBranch = true
      try {
        const res = await reassignSalesServices.reassignBranch(branchId, payload)
        await this.fetchCustomers()
        return res.data.data
      } finally {
        this.reassigningBranch = false
      }
    },
  },
})