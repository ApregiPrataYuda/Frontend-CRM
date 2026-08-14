import api from "./api";

export const authService = {
  // LOGIN
  async login(credentials) {
    const response = await api.post("/signIn", credentials);

    return response.data;
  },

  // LOGOUT
  async logout() {
    const response = await api.post("/signOut");

    return response.data;
  },

  // PROFILE
  async me() {
    const response = await api.get("/get-profile");

    return response.data;
  },

  // FORGOT PASSWORD
  async forgotPassword(payload) {
    const response = await api.post("/forgot-password-request", payload);

    return response.data;
  },

  // RESET PASSWORD
  async resetPassword(payload) {
    const response = await api.post("/reset-password", payload);

    return response.data;
  },

  // UPDATE PROFILE
  async updateProfile(formData) {
    const response = await api.post("/update-profile", formData);
    return response;
  },

  // UPDATE PASSWORD
  async updatePassword(payload) {
    const response = await api.put("/update-password", payload);
    return response.data;
  },

  // SESSION
  getSessions() {
    return api.get("/sessions");
  },

  revokeSession(id) {
    return api.delete(`/sessions/${id}`);
  },
};
