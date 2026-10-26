import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'icons/icon.svg',
        'data.json',
        'map.jpg',
        'map_coords.json',
        'ogp.png'
      ],
      manifest: {
        name: 'VGGC 12th サークルリスト＆マップ',
        short_name: 'VGGC 12th',
        description: 'ぶいすぽっ！オンリー即売会「VGGC 12th」のサークル配置マップ、お品書き・商品管理、買い物リスト作成ツール（完全オフライン対応）',
        start_url: '/',
        scope: '/',
        theme_color: '#2563eb',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/ogp.png',
            sizes: '1200x630',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,json}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6MB (data.json & map.jpg 対応)
        runtimeCaching: [
          // 1. サークルお品書き画像 / 外部CDN画像 (CacheFirst)
          {
            urlPattern: ({ url }) =>
              url.origin.includes('weserv.nl') ||
              url.origin.includes('twimg.com') ||
              url.origin.includes('supabase.co') && url.pathname.includes('/storage/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'vggc-remote-images',
              expiration: {
                maxEntries: 400,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30日
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // 2. Supabase REST API (NetworkFirst / オフライン時キャッシュフォールバック)
          {
            urlPattern: ({ url }) =>
              url.origin.includes('supabase.co') && url.pathname.includes('/rest/v1/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'vggc-supabase-api',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7日
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
});
