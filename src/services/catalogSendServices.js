import api from './api'

// ── Kirim Catalog (Email beneran via SMTP, atau catat log WhatsApp --
// pengiriman WA aktualnya lewat wa.me link di sisi client). Payload
// keduanya JSON biasa (tidak ada file), jadi tidak perlu multipart. ──
export const catalogSendServices = {

  async sendEmail(payload) {
    const response = await api.post('/send-catalog-email', payload)
    return response
  },

  async logWhatsapp(payload) {
    const response = await api.post('/log-catalog-whatsapp', payload)
    return response
  },

  async getByUrl(url) {
    const response = await api.get(url)
    return response
  },
}