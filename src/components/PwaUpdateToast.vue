<template>
  <div class="fixed bottom-16 inset-x-3 md:bottom-4 md:right-4 md:left-auto z-40 flex flex-col gap-2 max-w-md pointer-events-none transition-all duration-300">
    
    <!-- ★ 🚀 新バージョン更新可能トースト (Need Refresh) -->
    <div v-if="state.needRefresh" 
         class="pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-blue-500/80 rounded-2xl p-3 md:p-3.5 shadow-[0_10px_30px_rgba(37,99,235,0.3)] text-white flex items-center justify-between gap-3 animate-slide-up">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-base shrink-0 shadow-md animate-pulse">
          ⚡
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-black tracking-wide">最新版が届きました！</span>
            <span class="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/40 text-[9px] font-extrabold uppercase">UPDATE</span>
          </div>
          <p class="text-[11px] text-slate-300 truncate mt-0.5">
            新機能やお品書きの最新データが利用可能です
          </p>
        </div>
      </div>

      <div class="flex items-center gap-1.5 shrink-0">
        <button @click="onApplyUpdate" 
                class="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white rounded-xl text-xs font-extrabold transition shadow-md flex items-center gap-1 cursor-pointer">
          <span>今すぐ更新</span>
        </button>
        <button @click="dismissRefreshToast" 
                class="w-7 h-7 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
                title="閉じる">
          ✕
        </button>
      </div>
    </div>

    <!-- ★ 📦 オフライン準備完了トースト (起動後数秒のみ優しく通知) -->
    <div v-if="showOfflineReadyToast" 
         class="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-emerald-500/60 rounded-xl px-3 py-2 shadow-lg text-white flex items-center justify-between gap-2 animate-fade-in">
      <div class="flex items-center gap-2 text-xs font-bold text-emerald-300">
        <span class="text-sm">📦</span>
        <span>完全オフライン対応完了（電波圏外でも安心）</span>
      </div>
      <button @click="showOfflineReadyToast = false" class="text-slate-400 hover:text-white text-xs px-1">✕</button>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { subscribePwaState, applyAppUpdate } from '../utils/pwaUpdater.js';

const state = ref({
  needRefresh: false,
  offlineReady: false,
  isChecking: false
});

const showOfflineReadyToast = ref(false);
let unsubscribe = null;
let offlineTimer = null;

onMounted(() => {
  unsubscribe = subscribePwaState((newState) => {
    state.value = newState;

    if (newState.offlineReady && !localStorage.getItem('vggc_offline_notified')) {
      showOfflineReadyToast.value = true;
      localStorage.setItem('vggc_offline_notified', 'true');
      if (offlineTimer) clearTimeout(offlineTimer);
      offlineTimer = setTimeout(() => {
        showOfflineReadyToast.value = false;
      }, 4000);
    }
  });
});

onBeforeUnmount(() => {
  if (unsubscribe) unsubscribe();
  if (offlineTimer) clearTimeout(offlineTimer);
});

const onApplyUpdate = () => {
  applyAppUpdate();
};

const dismissRefreshToast = () => {
  state.value.needRefresh = false;
};
</script>

<style scoped>
.animate-slide-up {
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.animate-fade-in {
  animation: fadeIn 0.25s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
