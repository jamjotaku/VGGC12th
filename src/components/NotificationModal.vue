<template>
  <teleport to="body">
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isOpen" 
           class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
           @click.self="close">
        
        <!-- モーダル本体 (スマホでは下部ドロワー、PCではセンターモーダル) -->
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-full sm:translate-y-4 sm:scale-95"
          enter-to-class="translate-y-0 sm:scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="translate-y-0 sm:scale-100"
          leave-to-class="translate-y-full sm:translate-y-4 sm:scale-95"
        >
          <div class="bg-white w-full sm:max-w-xl max-h-[88vh] sm:max-h-[82vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            
            <!-- 上部ヘッダー -->
            <div class="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base shadow-xs">
                  🔔
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h2 class="font-extrabold text-slate-900 text-base sm:text-lg">お知らせ・通知</h2>
                    <span v-if="unreadCount > 0" 
                          class="bg-rose-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                      {{ unreadCount }}件 未読
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-500">運営アナウンス＆当日のタイムラインリマインド</p>
                </div>
              </div>

              <!-- ヘッダー右側ボタン -->
              <div class="flex items-center gap-1.5">
                <button v-if="unreadCount > 0"
                        @click="markAllAsRead"
                        class="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition cursor-pointer">
                  すべて既読
                </button>
                <button @click="close"
                        class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition cursor-pointer">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            <!-- ブラウザ通知 (Web Notification) 許可バー -->
            <div v-if="canAskNotificationPermission" 
                 class="bg-blue-50/80 border-b border-blue-100 px-4 py-2.5 flex items-center justify-between text-xs text-blue-900 gap-2">
              <div class="flex items-center gap-2">
                <span>📲</span>
                <span class="font-medium text-[11px] sm:text-xs">
                  当日の予定リマインダーを画面外でも受信しますか？
                </span>
              </div>
              <button @click="requestNotificationPermission" 
                      class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg text-[11px] transition shrink-0 cursor-pointer shadow-xs">
                通知を許可
              </button>
            </div>

            <!-- カテゴリタブフィルター -->
            <div class="px-4 py-2 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs font-bold shrink-0 bg-white">
              <button @click="activeFilter = 'all'"
                      class="px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5"
                      :class="activeFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'">
                <span>すべて</span>
                <span class="text-[10px] opacity-75 font-mono">({{ filteredNotifications.length }})</span>
              </button>
              <button @click="activeFilter = 'timeline'"
                      class="px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5"
                      :class="activeFilter === 'timeline' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'">
                <span>⏰ タイムライン</span>
                <span class="text-[10px] opacity-75 font-mono">({{ timelineNotificationsCount }})</span>
              </button>
              <button @click="activeFilter = 'announcement'"
                      class="px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5"
                      :class="activeFilter === 'announcement' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'">
                <span>📢 運営アナウンス</span>
                <span class="text-[10px] opacity-75 font-mono">({{ announcementNotificationsCount }})</span>
              </button>
            </div>

            <!-- 通知リスト領域 -->
            <div class="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 min-h-[200px]">
              
              <!-- 通知が1件もない場合 -->
              <div v-if="filteredNotifications.length === 0" 
                   class="text-center py-12 px-4 space-y-3 text-slate-400">
                <div class="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-3xl shadow-inner">
                  📭
                </div>
                <div>
                  <p class="font-bold text-slate-700 text-sm">通知はありません</p>
                  <p class="text-xs text-slate-500 mt-0.5">
                    {{ activeFilter === 'timeline' ? 'タイムラインに予定を登録すると、当日にリマインドが届きます' : '新しいお知らせが届くとここに表示されます' }}
                  </p>
                </div>
              </div>

              <!-- 通知アイテムカード -->
              <div v-for="item in filteredNotifications" :key="item.id"
                   @click="handleItemClick(item)"
                   class="relative p-3.5 rounded-2xl border transition text-left cursor-pointer flex flex-col gap-1.5"
                   :class="[
                     isRead(item.id) 
                       ? 'bg-white border-slate-200/80 hover:border-slate-300' 
                       : 'bg-blue-50/40 border-blue-200 shadow-xs hover:border-blue-300',
                     item.is_pinned ? 'ring-1 ring-amber-400/50 bg-amber-50/20' : ''
                   ]">
                
                <!-- 未読インジケーター（青ドット） -->
                <div v-if="!isRead(item.id)" 
                     class="absolute top-3.5 right-3.5 w-2.5 h-2.5 rounded-full bg-blue-600 shadow-xs"></div>

                <!-- カードヘッダー (バッジ・時間) -->
                <div class="flex items-center gap-2 pr-4 flex-wrap">
                  <span v-if="item.is_pinned" 
                        class="text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    📌 ピン留め
                  </span>

                  <!-- タイプバッジ -->
                  <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1"
                        :class="getTypeBadgeClass(item)">
                    <span>{{ getTypeIcon(item) }}</span>
                    <span>{{ getTypeLabel(item) }}</span>
                  </span>

                  <!-- 時間 -->
                  <span class="text-[11px] font-medium text-slate-600 font-mono">
                    {{ formatTime(item.created_at) }}
                  </span>
                </div>

                <!-- タイトル -->
                <h3 class="font-bold text-sm text-slate-900 leading-snug"
                    :class="!isRead(item.id) ? 'font-black' : ''">
                  {{ item.title }}
                </h3>

                <!-- 本文 -->
                <p class="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {{ item.body }}
                </p>

                <!-- アクションボタン (リンクやサークル遷移がある場合) -->
                <div v-if="item.action || item.link_url" class="pt-1 flex items-center gap-2">
                  <button v-if="item.action" 
                          class="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1">
                    <span>{{ item.action.label || '詳細を見る' }}</span>
                    <span>→</span>
                  </button>
                  <a v-else-if="item.link_url" 
                     :href="item.link_url" 
                     target="_blank" 
                     @click.stop
                     class="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 underline">
                    <span>リンクを開く</span>
                    <span>↗</span>
                  </a>
                </div>

              </div>
            </div>

            <!-- フッター (当日テストシミュレーション ＆ 閉じる) -->
            <div class="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <button @click="runTimelineTest" 
                      class="text-[11px] text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
                      title="登録されているタイムライン予定からデモリマインド通知を生成します">
                <span>⚡ タイムライン通知テスト</span>
              </button>
              
              <button @click="close"
                      class="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition cursor-pointer">
                閉じる
              </button>
            </div>

          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  notifications: {
    type: Array,
    default: () => []
  },
  readNotificationIds: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'markAsRead', 'markAllAsRead', 'actionClick', 'testTimelineNotify']);

// フィルタータブ ('all' | 'timeline' | 'announcement')
const activeFilter = ref('all');

// Web Notification 権限状態
const notificationPermission = ref(typeof Notification !== 'undefined' ? Notification.permission : 'default');

const canAskNotificationPermission = computed(() => {
  return typeof Notification !== 'undefined' && notificationPermission.value === 'default';
});

const requestNotificationPermission = async () => {
  if (typeof Notification === 'undefined') return;
  try {
    const perm = await Notification.requestPermission();
    notificationPermission.value = perm;
    if (perm === 'granted') {
      new Notification('VGGC 12th', {
        body: '通知が有効になりました！当日のタイムスケジュール開始前にお知らせします。',
        icon: '/icons/icon-192.png'
      });
    }
  } catch (e) {
    console.error('Notification permission error:', e);
  }
};

const close = () => {
  emit('close');
};

const isRead = (id) => {
  return props.readNotificationIds.includes(id);
};

const markAllAsRead = () => {
  emit('markAllAsRead');
};

const handleItemClick = (item) => {
  if (!isRead(item.id)) {
    emit('markAsRead', item.id);
  }
  if (item.action) {
    emit('actionClick', item.action);
    close();
  }
};

const runTimelineTest = () => {
  emit('testTimelineNotify');
};

// フィルター済みリスト
const filteredNotifications = computed(() => {
  let list = [...props.notifications];

  if (activeFilter.value === 'timeline') {
    list = list.filter(n => n.category === 'timeline' || n.category === 'official');
  } else if (activeFilter.value === 'announcement') {
    list = list.filter(n => n.category !== 'timeline');
  }

  // ピン留め優先、次に日付降順
  return list.sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
});

const unreadCount = computed(() => {
  return props.notifications.filter(n => !props.readNotificationIds.includes(n.id)).length;
});

const timelineNotificationsCount = computed(() => {
  return props.notifications.filter(n => n.category === 'timeline' || n.category === 'official').length;
});

const announcementNotificationsCount = computed(() => {
  return props.notifications.filter(n => n.category !== 'timeline').length;
});

// バッジクラス
const getTypeBadgeClass = (item) => {
  if (item.category === 'timeline') return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
  switch (item.type) {
    case 'urgent': return 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse';
    case 'warning': return 'bg-amber-100 text-amber-800 border border-amber-300';
    case 'success': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    case 'feature': return 'bg-purple-100 text-purple-800 border border-purple-200';
    default: return 'bg-blue-100 text-blue-800 border border-blue-200';
  }
};

const getTypeIcon = (item) => {
  if (item.category === 'timeline') return '⏰';
  switch (item.type) {
    case 'urgent': return '🚨';
    case 'warning': return '⚠️';
    case 'success': return '🎉';
    case 'feature': return '⚡';
    default: return '📢';
  }
};

const getTypeLabel = (item) => {
  if (item.category === 'timeline') return 'タイムライン';
  switch (item.type) {
    case 'urgent': return '緊急';
    case 'warning': return '注意';
    case 'success': return '完了';
    case 'feature': return '新機能';
    default: return 'アナウンス';
  }
};

const formatTime = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'たった今';
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;

  const m = d.getMonth() + 1;
  const day = d.getDate();
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${m}/${day} ${h}:${min}`;
};
</script>
