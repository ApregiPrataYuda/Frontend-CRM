<template>
  <div class="dim-chat-widget">
    <!-- ============ CHAT PANEL ============ -->
    <transition name="panel-pop">
      <div v-if="isOpen" class="chat-panel" role="dialog" aria-label="Asisten DIM">
        <!-- Header -->
        <header class="chat-header">
          <div class="chat-header__identity">
            <span class="chat-header__avatar" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 13v-1a8 8 0 0 1 16 0v1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <rect x="3" y="13" width="4" height="6" rx="1.6" fill="currentColor"/>
                <rect x="17" y="13" width="4" height="6" rx="1.6" fill="currentColor"/>
                <path d="M19 19.5v.5a3 3 0 0 1-3 3h-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </span>
            <div class="chat-header__text">
              <p class="chat-header__title">Asisten DIM</p>
              <p class="chat-header__status">
                <span class="status-dot" :class="{ 'status-dot--busy': isTyping }"></span>
                {{ isTyping ? 'Sedang mengetik…' : 'Online' }}
              </p>
            </div>
          </div>
          <button class="icon-btn" @click="closePanel" aria-label="Tutup chat">
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </header>

        <!-- Quick suggestion chips (shown only at start of conversation) -->
        <div v-if="messages.length <= 1" class="chip-row">
          <button
            v-for="chip in suggestionChips"
            :key="chip"
            class="chip"
            @click="sendMessage(chip)"
          >{{ chip }}</button>
        </div>

        <!-- Messages -->
        <div class="chat-body" ref="chatBodyRef">
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="msg-row"
            :class="msg.from === 'user' ? 'msg-row--user' : 'msg-row--bot'"
          >
            <div class="msg-bubble" :class="msg.from === 'user' ? 'msg-bubble--user' : 'msg-bubble--bot'">
              {{ msg.text }}
            </div>
          </div>

          <div v-if="isTyping" class="msg-row msg-row--bot">
            <div class="msg-bubble msg-bubble--bot msg-bubble--typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- Input -->
        <form class="chat-input" @submit.prevent="handleSubmit">
          <input
            v-model="draft"
            type="text"
            placeholder="Tulis pertanyaan kamu…"
            aria-label="Tulis pesan"
            autocomplete="off"
          />
          <button type="submit" class="send-btn" :disabled="!draft.trim()" aria-label="Kirim">
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M3 11l18-8-8 18-2.5-7.5L3 11Z" fill="currentColor"/></svg>
          </button>
        </form>
      </div>
    </transition>

    <!-- ============ FLOATING LAUNCHER BUTTON ============ -->
    <button
      class="launcher"
      :class="{ 'launcher--open': isOpen }"
      @click="togglePanel"
      :aria-label="isOpen ? 'Tutup asisten' : 'Buka asisten DIM'"
    >
      <span v-if="unreadCount > 0 && !isOpen" class="launcher__badge">{{ unreadCount }}</span>
      <svg v-if="!isOpen" viewBox="0 0 24 24" width="26" height="26" class="launcher__icon" fill="none">
        <path d="M4 13v-1a8 8 0 0 1 16 0v1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <rect x="3" y="13" width="4" height="6" rx="1.6" fill="currentColor"/>
        <rect x="17" y="13" width="4" height="6" rx="1.6" fill="currentColor"/>
        <path d="M19 19.5v.5a3 3 0 0 1-3 3h-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" width="24" height="24" class="launcher__icon">
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'

/**
 * DIM Chatbot Widget — floating launcher (bottom-right) + chat panel.
 *
 * Integration point:
 *   `getBotReply()` calls the n8n Webhook URL below. Just replace
 *   N8N_WEBHOOK_URL with your production webhook URL (must be POST),
 *   and make sure the workflow is Activated in n8n.
 *
 *   Expected response from n8n's "Respond to Webhook" node:
 *     { "reply": "teks balasan dari bot" }
 */

// TODO: ganti dengan Production URL webhook n8n kamu
// const N8N_WEBHOOK_URL = 'https://your-n8n-instance.com/webhook/dim-chatbot'
const N8N_WEBHOOK_URL = 'https://chemo-kissing-flakily.ngrok-free.dev/webhook/db1f390d-53a5-41d3-b28a-ebefb7457697/chat'

const isOpen = ref(false)
const isTyping = ref(false)
const draft = ref('')
const unreadCount = ref(1) // simulate 1 unread greeting badge on load
const chatBodyRef = ref(null)

// Persist a session id per browser tab so n8n can track conversation history
const sessionId =
  sessionStorage.getItem('dim-chat-session-id') ||
  (() => {
    const id = crypto.randomUUID()
    sessionStorage.setItem('dim-chat-session-id', id)
    return id
  })()

const suggestionChips = [
  'List product Pump Terbaru',
  'List product Mechanical Seals Terbaru',
]

const messages = ref([
  {
    id: crypto.randomUUID(),
    from: 'bot',
    text: 'Halo! Saya Asisten DIM. Ada yang bisa saya bantu terkait pencarian informasi Product Mechanical Seals Dan Pump',
  },
])

function togglePanel() {
  isOpen.value = !isOpen.value
  if (isOpen.value) unreadCount.value = 0
}

function closePanel() {
  isOpen.value = false
}

function handleSubmit() {
  const text = draft.value.trim()
  if (!text) return
  sendMessage(text)
  draft.value = ''
}

async function sendMessage(text) {
  messages.value.push({ id: crypto.randomUUID(), from: 'user', text })
  await scrollToBottom()

  isTyping.value = true
  const reply = await getBotReply(text)
  isTyping.value = false

  messages.value.push({ id: crypto.randomUUID(), from: 'bot', text: reply })
  await scrollToBottom()
}

// --- Calls the n8n webhook and returns the bot's reply text ---
async function getBotReply(userText) {
  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userText,
        sessionId,
        // sisipkan info tambahan kalau perlu, misal:
        // userId: currentUser?.id_user,
        // source: 'crm-dim',
      }),
    })

    if (!res.ok) {
      console.error('n8n webhook error:', res.status, res.statusText)
      return 'Maaf, terjadi kendala saat menghubungi asisten. Coba lagi dalam beberapa saat ya.'
    }

    const data = await res.json()
    return data?.reply ?? 'Maaf, saya belum punya jawaban untuk itu.'
  } catch (err) {
    console.error('Gagal menghubungi n8n webhook:', err)
    return 'Sepertinya koneksi ke asisten sedang bermasalah. Coba lagi sebentar lagi ya.'
  }
}

async function scrollToBottom() {
  await nextTick()
  if (chatBodyRef.value) {
    chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
  }
}

onMounted(() => {
  // e.g. fetch initial greeting / connection status from backend here
})
</script>

<style scoped>
.dim-chat-widget {
  --dim-primary: #5850ec;
  --dim-primary-dark: #4a3fd9;
  --dim-accent: #ffb020;
  --dim-bg: #ffffff;
  --dim-bg-soft: #f4f8f8;
  --dim-text: #12262b;
  --dim-text-muted: #6b7f83;
  --dim-border: #e2e9e9;
  --dim-radius: 16px;
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

/* ---------- Launcher button ---------- */
.launcher {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(155deg, var(--dim-primary), var(--dim-primary-dark));
  color: #fff;
  box-shadow: 0 10px 24px rgba(18, 57, 67, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.launcher:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(18, 57, 67, 0.4);
}
.launcher:active {
  transform: translateY(0) scale(0.96);
}
.launcher--open {
  background: var(--dim-bg-soft);
  color: var(--dim-primary-dark);
  box-shadow: 0 6px 16px rgba(18, 57, 67, 0.18);
}
.launcher__icon { display: block; }
.launcher__badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--dim-accent);
  color: #4a2c00;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
}

/* ---------- Chat panel ---------- */
.chat-panel {
  width: min(360px, calc(100vw - 32px));
  height: min(520px, calc(100vh - 140px));
  margin-bottom: 14px;
  background: var(--dim-bg);
  border-radius: var(--dim-radius);
  box-shadow: 0 20px 48px rgba(18, 57, 67, 0.24);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--dim-border);
}

.panel-pop-enter-active { transition: opacity 0.18s ease, transform 0.22s cubic-bezier(0.2, 0.8, 0.3, 1.1); }
.panel-pop-leave-active { transition: opacity 0.12s ease, transform 0.14s ease; }
.panel-pop-enter-from,
.panel-pop-leave-to { opacity: 0; transform: translateY(12px) scale(0.97); }

/* Header */
.chat-header {
  background: linear-gradient(155deg, var(--dim-primary), var(--dim-primary-dark));
  color: #fff;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.chat-header__identity { display: flex; align-items: center; gap: 10px; }
.chat-header__avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
}
.chat-header__avatar svg { width: 18px; height: 18px; }
.chat-header__title { margin: 0; font-size: 14px; font-weight: 600; }
.chat-header__status {
  margin: 2px 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.78);
  display: flex;
  align-items: center;
  gap: 5px;
}
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--dim-accent);
  display: inline-block;
}
.status-dot--busy { background: #ff7a59; }
.icon-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  padding: 4px;
  display: flex;
}
.icon-btn:hover { color: #fff; }

/* Suggestion chips */
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 12px 14px 0;
  flex-shrink: 0;
}
.chip {
  border: 1px solid var(--dim-border);
  background: var(--dim-bg-soft);
  color: var(--dim-primary-dark);
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.chip:hover { background: #edeafd; border-color: var(--dim-accent); }

/* Message body */
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--dim-bg-soft);
}
.msg-row { display: flex; }
.msg-row--user { justify-content: flex-end; }
.msg-row--bot { justify-content: flex-start; }

.msg-bubble {
  max-width: 78%;
  padding: 9px 13px;
  border-radius: 14px;
  font-size: 13.5px;
  line-height: 1.45;
  word-break: break-word;
}
.msg-bubble--bot {
  background: #fff;
  color: var(--dim-text);
  border: 1px solid var(--dim-border);
  border-bottom-left-radius: 4px;
}
.msg-bubble--user {
  background: var(--dim-primary);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.msg-bubble--typing { display: flex; gap: 4px; align-items: center; padding: 12px 14px; }
.msg-bubble--typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dim-text-muted);
  animation: dim-typing 1.1s infinite ease-in-out;
}
.msg-bubble--typing span:nth-child(2) { animation-delay: 0.15s; }
.msg-bubble--typing span:nth-child(3) { animation-delay: 0.3s; }
@keyframes dim-typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
  30% { transform: translateY(-3px); opacity: 1; }
}

/* Input */
.chat-input {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid var(--dim-border);
  background: #fff;
  flex-shrink: 0;
}
.chat-input input {
  flex: 1;
  border: 1px solid var(--dim-border);
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 13.5px;
  outline: none;
  color: var(--dim-text);
}
.chat-input input:focus {
  border-color: var(--dim-primary);
  box-shadow: 0 0 0 3px rgba(28, 79, 91, 0.12);
}
.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: var(--dim-accent);
  color: #4a2c00;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.send-btn:not(:disabled):hover { transform: translateY(-1px); }

/* Mobile */
@media (max-width: 480px) {
  .dim-chat-widget { right: 12px; bottom: 12px; }
  .chat-panel { width: calc(100vw - 24px); height: calc(100vh - 120px); }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .launcher, .send-btn, .panel-pop-enter-active, .panel-pop-leave-active { transition: none !important; }
  .msg-bubble--typing span { animation: none !important; }
}
</style>