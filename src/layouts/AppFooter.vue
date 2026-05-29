<script setup>
import { CFooter } from '@coreui/vue'
import { useSettingAppStore } from '@/stores/settingAppStore'
const settingStore = useSettingAppStore()
</script>

<template>
  <CFooter class="crm-footer">
    <div class="footer-inner">

      <div class="footer-left">
        <span class="footer-brand">
          <font-awesome-icon icon="gem" />
          <a href="https://instagram.com/kiresy234" target="_blank" class="footer-link">
            {{ settingStore.appShortName }}
          </a>
        </span>
        <span class="footer-divider">·</span>
        <span class="footer-copy">{{ settingStore.currentSetting?.footer_text ?? `© ${new Date().getFullYear()} ${settingStore.appName}` }}
          </span>
      </div>

      <div class="footer-right">
        <span class="footer-version">{{ settingStore.appVersion }}</span>
        <span class="footer-divider">·</span>
        <span class="footer-status">
          <span class="status-dot" />
          System Online
        </span>
      </div>

    </div>
  </CFooter>
</template>

<style scoped>
.crm-footer {
  background: var(--bg-card) !important;
  border-top: 1px solid var(--border-main) !important;
  padding: 0 !important;
  min-height: 48px;
}
.footer-inner {
  width: 100%;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.footer-left,
.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--text-muted);
}
.footer-brand {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: var(--text-primary);
  font-size: 0.85rem;
}
.footer-brand svg {
  color: #6366f1;
  font-size: 0.8rem;
}
.footer-link {
  color: var(--text-primary);
  text-decoration: none;
  font-weight: 700;
  transition: color 0.15s;
}
.footer-link:hover {
  color: #6366f1;
}
.footer-divider {
  color: var(--border-main);
}
.footer-copy {
  color: var(--text-muted);
  font-size: 0.78rem;
}
.footer-version {
  background: var(--bg-input);
  color: var(--text-muted);
  border: 1px solid var(--border-main);
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 99px;
}
.footer-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
  color: #03a526;
  font-size: 0.78rem;
}
.status-dot {
  width: 7px;
  height: 7px;
  background: #03a526;
  border-radius: 50%;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}
</style>