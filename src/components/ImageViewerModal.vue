<template>
  <teleport to="body">
    <transition name="viewer-fade">
      <div v-if="show"
           class="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col select-none touch-none"
           @keydown.esc="onClose"
           tabindex="0"
           ref="viewerContainerRef">
        
        <!-- ビューアヘッダーバー (固定) -->
        <header class="p-3 md:p-4 bg-black/60 border-b border-white/10 flex items-center justify-between z-20 shrink-0">
          <!-- 左側: タイトル & 案内 -->
          <div class="min-w-0 pr-3">
            <h3 class="text-white text-xs md:text-sm font-bold truncate">{{ title || 'お品書き画像ビューア' }}</h3>
            <p class="text-[10px] md:text-xs text-gray-400 hidden sm:block">
              ピンチ / ダブルタップ / ドラッグで拡大・移動できます
            </p>
          </div>

          <!-- 右側: ズームコントロール & 閉じるボタン -->
          <div class="flex items-center gap-1.5 md:gap-2 shrink-0">
            <!-- 倍率インジケーター -->
            <span class="text-[11px] md:text-xs font-mono font-bold text-gray-300 bg-white/10 px-2 py-1 rounded-lg border border-white/10">
              {{ Math.round(scale * 100) }}%
            </span>

            <!-- ズームアウト -->
            <button @click="zoomOut"
                    :disabled="scale <= 1.0"
                    class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center font-bold text-base transition cursor-pointer"
                    title="縮小 (-)">
              −
            </button>

            <!-- 100%リセット -->
            <button @click="resetTransform"
                    class="h-8 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
                    title="原寸に戻す">
              リセット
            </button>

            <!-- ズームイン -->
            <button @click="zoomIn"
                    :disabled="scale >= 4.0"
                    class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center font-bold text-base transition cursor-pointer"
                    title="拡大 (+)">
              ＋
            </button>

            <!-- 元リンクを開く (Pixiv / X等) -->
            <a v-if="externalUrl"
               :href="externalUrl"
               target="_blank"
               rel="noopener noreferrer"
               class="h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 transition shadow-sm"
               title="元サイトで高画質・全ページを開く">
              <span>元ページ</span>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </a>

            <!-- 閉じるボタン -->
            <button @click="onClose"
                    class="w-8 h-8 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white flex items-center justify-center text-lg font-bold transition ml-1 cursor-pointer"
                    title="閉じる (Esc)">
              ×
            </button>
          </div>
        </header>

        <!-- メイン表示領域 (ジェスチャー操作可能) -->
        <main class="flex-1 relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
              ref="viewportRef"
              @pointerdown="handlePointerDown"
              @pointermove="handlePointerMove"
              @pointerup="handlePointerUp"
              @pointercancel="handlePointerUp"
              @wheel.prevent="handleWheel"
              @dblclick="handleDoubleClick">
          
          <!-- ローディングスピナー -->
          <div v-if="isLoading" class="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none text-white/70">
            <div class="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p class="text-xs font-bold animate-pulse">お品書き画像を読み込み中...</p>
          </div>

          <!-- 画像本体 -->
          <img ref="imageRef"
               :src="imageUrl"
               :alt="title || 'お品書き画像'"
               referrerpolicy="no-referrer"
               @load="onImageLoad"
               @error="onImageError"
               class="max-w-full max-h-full object-contain pointer-events-none transition-transform duration-75 will-change-transform"
               :style="imageTransformStyle" />

          <!-- 下部操作ヒント (モバイル用) -->
          <div class="absolute bottom-4 inset-x-4 flex justify-center pointer-events-none z-10 sm:hidden">
            <span class="bg-black/60 text-white/80 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold backdrop-blur-xs">
              ダブルタップで拡大 ⇄ 原寸 / ピンチで自由ズーム
            </span>
          </div>
        </main>

      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  externalUrl: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close']);

const viewerContainerRef = ref(null);
const viewportRef = ref(null);
const imageRef = ref(null);

const scale = ref(1.0);
const panX = ref(0);
const panY = ref(0);
const isLoading = ref(true);

const MIN_SCALE = 1.0;
const MAX_SCALE = 4.0;

// 画像トランスフォームスタイル
const imageTransformStyle = computed(() => {
  return {
    transform: `translate3d(${panX.value}px, ${panY.value}px, 0) scale(${scale.value})`
  };
});

const resetTransform = () => {
  scale.value = 1.0;
  panX.value = 0;
  panY.value = 0;
};

const zoomIn = () => {
  scale.value = Math.min(MAX_SCALE, Math.round((scale.value + 0.5) * 10) / 10);
};

const zoomOut = () => {
  scale.value = Math.max(MIN_SCALE, Math.round((scale.value - 0.5) * 10) / 10);
  if (scale.value === 1.0) {
    panX.value = 0;
    panY.value = 0;
  }
};

const onImageLoad = () => {
  isLoading.value = false;
};

const onImageError = () => {
  isLoading.value = false;
};

const onClose = () => {
  resetTransform();
  emit('close');
};

// =========================================
// タッチ＆マウス ジェスチャー処理 (ピンチズーム・パン移動)
// =========================================
const activePointers = new Map();
let initialPinchDistance = 0;
let initialScale = 1.0;
let lastPointerPos = { x: 0, y: 0 };
let lastTapTime = 0;

const getDistance = (p1, p2) => {
  return Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY);
};

const handlePointerDown = (e) => {
  // ダブルタップ判定 (モバイル用)
  const now = Date.now();
  if (now - lastTapTime < 300 && activePointers.size === 0) {
    handleDoubleClick(e);
    lastTapTime = 0;
    return;
  }
  lastTapTime = now;

  activePointers.set(e.pointerId, e);
  if (viewportRef.value) {
    viewportRef.value.setPointerCapture(e.pointerId);
  }

  if (activePointers.size === 1) {
    lastPointerPos = { x: e.clientX, y: e.clientY };
  } else if (activePointers.size === 2) {
    const [p1, p2] = Array.from(activePointers.values());
    initialPinchDistance = getDistance(p1, p2);
    initialScale = scale.value;
  }
};

const handlePointerMove = (e) => {
  if (!activePointers.has(e.pointerId)) return;
  activePointers.set(e.pointerId, e);

  // 2本指操作: ピンチズーム
  if (activePointers.size === 2) {
    const [p1, p2] = Array.from(activePointers.values());
    const currentDistance = getDistance(p1, p2);
    if (initialPinchDistance > 0) {
      const factor = currentDistance / initialPinchDistance;
      const targetScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, initialScale * factor));
      scale.value = Math.round(targetScale * 100) / 100;
      if (scale.value === 1.0) {
        panX.value = 0;
        panY.value = 0;
      }
    }
    return;
  }

  // 1本指/マウスクリック操作: パン移動 (拡大時のみ)
  if (activePointers.size === 1 && scale.value > 1.0) {
    const dx = e.clientX - lastPointerPos.x;
    const dy = e.clientY - lastPointerPos.y;
    panX.value += dx;
    panY.value += dy;
    lastPointerPos = { x: e.clientX, y: e.clientY };
  }
};

const handlePointerUp = (e) => {
  activePointers.delete(e.pointerId);
  if (viewportRef.value && viewportRef.value.hasPointerCapture(e.pointerId)) {
    viewportRef.value.releasePointerCapture(e.pointerId);
  }
  if (activePointers.size === 1) {
    const remaining = Array.from(activePointers.values())[0];
    lastPointerPos = { x: remaining.clientX, y: remaining.clientY };
  } else if (activePointers.size === 0) {
    initialPinchDistance = 0;
    if (scale.value <= 1.0) {
      panX.value = 0;
      panY.value = 0;
    }
  }
};

const handleDoubleClick = (e) => {
  if (scale.value > 1.0) {
    resetTransform();
  } else {
    scale.value = 2.2;
    panX.value = 0;
    panY.value = 0;
  }
};

const handleWheel = (e) => {
  const delta = e.deltaY < 0 ? 0.25 : -0.25;
  const target = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value + delta));
  scale.value = Math.round(target * 100) / 100;
  if (scale.value === 1.0) {
    panX.value = 0;
    panY.value = 0;
  }
};

// モーダルが開かれたときのフォーカスと状態初期化
watch(() => props.show, (newVal) => {
  if (newVal) {
    isLoading.value = true;
    resetTransform();
    nextTick(() => {
      viewerContainerRef.value?.focus();
    });
  }
});
</script>

<style scoped>
.viewer-fade-enter-active,
.viewer-fade-leave-active {
  transition: opacity 0.2s ease;
}
.viewer-fade-enter-from,
.viewer-fade-leave-to {
  opacity: 0;
}
</style>
