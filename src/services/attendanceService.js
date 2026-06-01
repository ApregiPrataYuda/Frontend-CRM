import api from './api'

export const attendanceService = {

  // Check today's attendance status
  async checkToday() {
    const response = await api.get('/attendance/check-today')
    return response
  },

  // Submit attendance (IN / OUT)
  async store(payload) {
    const formData = new FormData()

    formData.append('attendance_type', payload.attendance_type)
    formData.append('latitude', payload.latitude)
    formData.append('longitude', payload.longitude)
    formData.append('accuracy', payload.accuracy)
    formData.append('location_name', payload.location_name)
    formData.append('device_type', payload.device_type)

    if (payload.photo_path) {
      formData.append('photo_path', payload.photo_path)
    }

    const response = await api.post('/attendance/process-free-location', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    return response
  },

  // Fetch attendance list by full URL
  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },

  // Get attendance detail by ID
  async show(id) {
    const response = await api.get(`/attendance/show/${id}`)
    return response
  },

  // Get all attendance data
  async getAll(params = {}) {
    const response = await api.get('/attendance-management', { params })
    return response
  },

  // Get my attendance report
  async getMyReport(params = {}) {
    const response = await api.get('/attendance/my-report', { params })
    return response
  },

  // // Get my attendance history
  async getMyHistory(params = {}) {
    const response = await api.get('/attendance/my-history', { params })
    return response
  },

  
}