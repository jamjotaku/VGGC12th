const CACHE_NAME = 'vggc-cache-v1';

// キャッシュするファイルのリスト
// （オフラインでも表示できるようにするファイル群）
const urlsToCache = [
  './',
  './index.html',
  './data.json',
  './map.jpg'
];

// インストール時にキャッシュを保存
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// 新しいバージョンがあれば古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ネットワークリクエストの処理 (Stale-While-Revalidate戦略)
self.addEventListener('fetch', event => {
  // SupabaseのAPIリクエストや、拡張機能のリクエストはキャッシュしない
  if (
    event.request.url.includes('supabase.co') || 
    !event.request.url.startsWith('http') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // 1. キャッシュがあれば即座に返す（爆速＆オフライン対応）
      // 2. 裏でネットワーク通信をして最新版を取得し、キャッシュを更新する
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // オフライン時はエラーを握りつぶす（キャッシュが返るため問題なし）
      });

      // キャッシュがあればそれを返し、なければネットワークからの結果を待つ
      return cachedResponse || fetchPromise;
    })
  );
});
