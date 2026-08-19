import api from './api'

/**
 * Service buat halaman "Target Penjualan Saya" (Sales) -- READ ONLY.
 *
 * Sengaja TETAP manggil endpoint /sales-targets yang sama kayak yang
 * dipakai Manager (BUKAN bikin endpoint baru kayak /sales/visit-targets),
 * soalnya SalesTargetController@index() SUDAH otomatis nge-scope hasilnya
 * ke sales_id = user yang login kalau role-nya bukan Admin/Manager (lihat
 * canManageTargets() di controller). Jadi ga perlu logic baru sama sekali --
 * tinggal panggil endpoint yang sudah ada.
 *
 * per_page digedein ke 100 (batas max di SalesTargetValidationIndex) biar
 * semua target 1 sales di 1 tahun ketarik sekali panggil, ga usah pagination
 * kayak di halaman Manager.
 */
export const mySalesTargetServices = {
  async getMyTargets(periodYear) {
    const response = await api.get('/sales-targets', {
      params: { period_year: periodYear, per_page: 100 },
    })
    return response
  },
}