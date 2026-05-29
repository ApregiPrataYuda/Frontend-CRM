import api from './api'

export const authService = {

  // LOGIN
  async login(credentials) {

    const response = await api.post(
      '/signIn',
      credentials
    )

    return response.data
  },

  // LOGOUT
  async logout() {

    const response = await api.post(
      '/signOut'
    )

    return response.data
  },

  // PROFILE
  async me() {

    const response = await api.get(
      '/get-profile'
    )

    return response.data
  },

  // FORGOT PASSWORD
  async forgotPassword(payload) {

    const response = await api.post(
      '/forgot-password-request',
      payload
    )

    return response.data
  },

  // RESET PASSWORD
  async resetPassword(payload) {

    const response = await api.post(
      '/reset-password',
      payload
    )

    return response.data
  }
}