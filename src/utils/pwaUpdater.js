// src/utils/pwaUpdater.js
import { registerSW } from 'virtual:pwa-register';

// PWA更新ステート管理
let updateSWHandler = null;
let swRegistration = null;
let updateCheckTimer = null;

// 更新リスナー管理
const listeners = new Set();

export const pwaState = {
  needRefresh: false,
  offlineReady: false,
  isChecking: false,
  lastCheckedAt: null
};

function notifyListeners() {
  for (const listener of listeners) {
    try {
      listener({ ...pwaState });
    } catch (e) {
      console.error('[PWA] Listener error:', e);
    }
  }
}

/**
 * PWAの更新リスナーを購読
 * @param {Function} callback
 * @returns {Function} unsubscribe
 */
export function subscribePwaState(callback) {
  listeners.add(callback);
  callback({ ...pwaState });
  return () => listeners.delete(callback);
}

/**
 * PWA自動更新マネージャーの初期化
 * （即時登録、定期ポーリング、復帰時検知）
 */
export function initPwaAutoUpdater() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // 古いレガシーキャッシュ（手動vggc-cache-v1）を確実にパージ
  if ('caches' in window) {
    caches.delete('vggc-cache-v1').catch(() => {});
  }

  updateSWHandler = registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('[PWA] 🚀 新しいアセット/バージョンが配信されました！');
      pwaState.needRefresh = true;
      notifyListeners();
    },
    onOfflineReady() {
      console.log('[PWA] 📦 全アセットのオフライン準備が完了しました');
      pwaState.offlineReady = true;
      notifyListeners();
    },
    onRegisteredSW(swUrl, registration) {
      swRegistration = registration;
      console.log('[PWA] Service Worker 登録完了:', swUrl);

      if (registration) {
        // 1. 定期更新チェック (60秒間隔でサーバー側の変更有無をポーリング)
        if (updateCheckTimer) clearInterval(updateCheckTimer);
        updateCheckTimer = setInterval(() => {
          checkForAppUpdate(false);
        }, 60 * 1000);

        // 2. スマホでアプリ復帰時 (バックグラウンド -> フォアグラウンド) に即時更新チェック
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            console.log('[PWA] 📱 アプリ復帰を検知: 最新バージョンをチェック中...');
            checkForAppUpdate(false);
          }
        });

        window.addEventListener('focus', () => {
          checkForAppUpdate(false);
        });
      }
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker 登録エラー:', error);
    }
  });
}

/**
 * 手動または自動でサーバーの最新バージョンをチェックする
 * @param {boolean} notifyUser - ユーザーへのログ・通知を行うか
 */
export async function checkForAppUpdate(notifyUser = true) {
  if (!swRegistration || typeof navigator === 'undefined' || !navigator.onLine) {
    return false;
  }

  try {
    pwaState.isChecking = true;
    notifyListeners();

    if (notifyUser) {
      console.log('[PWA] 🔄 最新バージョンの問い合わせ中...');
    }

    await swRegistration.update();
    pwaState.lastCheckedAt = new Date();

    // waitingワーカーが存在するかチェック
    if (swRegistration.waiting) {
      pwaState.needRefresh = true;
      notifyListeners();
      return true;
    }

    return false;
  } catch (err) {
    console.warn('[PWA] 更新チェック失敗 (オフラインまたは通信不安定):', err);
    return false;
  } finally {
    pwaState.isChecking = false;
    notifyListeners();
  }
}

/**
 * 新しいバージョンへ即時切り替えてページをリロードする
 */
export async function applyAppUpdate() {
  console.log('[PWA] ⚡ 新バージョンを適用してリロードします...');
  if (updateSWHandler) {
    await updateSWHandler(true);
  } else {
    window.location.reload();
  }
}

// 画面検証・テスト用トリガー
if (typeof window !== 'undefined') {
  window.__triggerPwaUpdateForTest = () => {
    pwaState.needRefresh = true;
    notifyListeners();
  };
}
