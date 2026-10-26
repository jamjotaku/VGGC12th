import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { registerSW } from 'virtual:pwa-register';

// 過去の手動キャッシュ（vggc-cache-v1）のクリーンアップ
if (typeof window !== 'undefined' && 'caches' in window) {
  caches.delete('vggc-cache-v1').catch(() => {});
}

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
