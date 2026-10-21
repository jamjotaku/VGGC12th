import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { registerSW } from 'virtual:pwa-register';

// Service Worker 自動更新登録 (Vite PWA)
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New content available, reloading...');
  },
  onOfflineReady() {
    console.log('[PWA] App ready to work completely offline (即売会場完全オフライン対応)');
  }
});

createApp(App).mount('#app');
