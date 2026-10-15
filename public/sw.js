const CACHE_NAME = 'vggc-cache-v2';

// 初回インストール時に確実に事前キャッシュするファイル群
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/data.json',
  '/map.jpg',
  '/manifest.json'
];

// インストール処理：事前キャッシュの取得と即時アクティブ化
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS).catch(err => {
        console.warn('[SW] Precache partially failed:', err);
      });
    })
  );
});

// アクティベーション処理：古いキャッシュの破棄とクライアントの即時制御
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// リクエスト捕捉処理（完全オフライン対応・Stale-While-Revalidate & Cache-First戦略）
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Supabase API や chrome-extension などの非HTTPリクエスト、POST等は除外
  if (
    url.origin.includes('supabase.co') ||
    !event.request.url.startsWith('http') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // 2. SPAの画面遷移（HTMLナビゲーション）
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(() => {
          // オフライン時はキャッシュされた index.html を返す
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // 3. Viteビルド成果物 (/assets/ ハッシュ付きファイル) -> Cache-First
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 4. その他のリソース (data.json, map.jpg 等) -> Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // オフライン時はキャッシュのみで静かに処理
        });

      return cachedResponse || fetchPromise;
    })
  );
});
