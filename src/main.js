import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { initPwaAutoUpdater } from './utils/pwaUpdater.js';

// PWA自動更新マネージャーの初期化（ポーリング・フォアグラウンド復帰検知・skipWaiting）
initPwaAutoUpdater();

createApp(App).mount('#app');
