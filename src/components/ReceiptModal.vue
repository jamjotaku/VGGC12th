<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
    <div class="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
      
      <!-- モーダルヘッダー -->
      <div class="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
            🏆
          </div>
          <div>
            <h3 class="text-sm md:text-base font-extrabold text-white">戦利品リザルトレシート</h3>
            <p class="text-[10px] text-slate-400">本日の買い回り成果を画像にして保存・シェア！</p>
          </div>
        </div>

        <button @click="$emit('close')" 
                class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer text-base">
          ✕
        </button>
      </div>

      <!-- モーダルボディ (スクロール可能) -->
      <div class="flex-1 overflow-y-auto p-4 flex flex-col items-center custom-scrollbar space-y-4">
        
        <!-- 集計サマリーピル -->
        <div class="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 flex items-center justify-around text-center">
          <div>
            <span class="text-[10px] text-slate-400 block">獲得サークル</span>
            <span class="text-base md:text-lg font-black text-white font-mono">{{ summary.itemCount }} <span class="text-xs font-normal">サークル</span></span>
          </div>
          <div class="h-8 w-px bg-slate-700"></div>
          <div>
            <span class="text-[10px] text-slate-400 block">戦利品総額</span>
            <span class="text-base md:text-lg font-black text-rose-400 font-mono">¥{{ summary.totalSpent.toLocaleString() }}</span>
          </div>
          <div v-if="summary.budget > 0" class="h-8 w-px bg-slate-700"></div>
          <div v-if="summary.budget > 0">
            <span class="text-[10px] text-slate-400 block">{{ summary.isOverBudget ? '予算超過' : '予算残り' }}</span>
            <span class="text-sm md:text-base font-black font-mono" :class="summary.isOverBudget ? 'text-amber-400' : 'text-emerald-400'">
              {{ summary.isOverBudget ? '+' : '¥' }}{{ Math.abs(summary.budgetDiff).toLocaleString() }}
            </span>
          </div>
        </div>

        <!-- レシートCanvasプレビュー (感熱紙風ドロップシャドウ) -->
        <div class="relative w-full max-w-[340px] flex justify-center py-2">
          <canvas ref="receiptCanvasRef" class="rounded-lg shadow-2xl border border-slate-700 max-w-full h-auto object-contain"></canvas>
          <div v-if="isGenerating" class="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center rounded-lg text-white text-xs font-bold gap-2">
            <svg class="animate-spin h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
            <span>レシート印字中...</span>
          </div>
        </div>

        <p class="text-[11px] text-slate-400 text-center leading-relaxed">
          ※ 端末内にのみ生成され、サーバーには送信されません。<br>電波が途切れやすい会場内でも安心してお使いいただけます。
        </p>
      </div>

      <!-- モーダルフッター (操作アクションボタングループ) -->
      <div class="p-3 md:p-4 bg-slate-900 border-t border-slate-800 space-y-2 shrink-0">
        
        <div class="grid grid-cols-2 gap-2">
          <!-- 📥 画像保存ボタン -->
          <button @click="downloadImage" 
                  class="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-98 text-white rounded-xl text-xs md:text-sm font-bold border border-slate-600 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
            <span>📥</span>
            <span>画像を保存</span>
          </button>

          <!-- 📲 ネイティブ画像シェア (Web Share API) -->
          <button v-if="canShareFiles" 
                  @click="shareNativeFile" 
                  class="w-full py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 text-white rounded-xl text-xs md:text-sm font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
            <span>📲</span>
            <span>画像付きシェア</span>
          </button>

          <!-- 📋 テキストコピー (Web Share API非対応環境用) -->
          <button v-else 
                  @click="copyShareText" 
                  class="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-98 text-white rounded-xl text-xs md:text-sm font-bold border border-slate-600 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
            <span>{{ isCopied ? '✓ コピー完了！' : '📋 テキストをコピー' }}</span>
          </button>
        </div>

        <!-- 𝕏 X (Twitter) で投稿 -->
        <a :href="xIntentUrl" 
           target="_blank" 
           rel="noopener noreferrer"
           class="w-full py-2.5 px-3 bg-black hover:bg-neutral-900 active:scale-98 text-white rounded-xl text-xs md:text-sm font-extrabold transition flex items-center justify-center gap-2 cursor-pointer shadow-md border border-neutral-700">
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          <span>戦利品レシートを 𝕏 でポスト</span>
        </a>

      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { calculateReceiptSummary, generateReceiptShareText } from '../domain/receipt/receiptCalculator.js';
import { drawReceiptToCanvas } from '../utils/receiptCanvasDrawer.js';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  savedList: {
    type: Object,
    default: () => ({})
  },
  circles: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close']);

const receiptCanvasRef = ref(null);
const isGenerating = ref(false);
const isCopied = ref(false);
const receiptDataUrl = ref('');

// 集計サマリー
const summary = computed(() => {
  return calculateReceiptSummary(props.savedList, props.circles);
});

// X (Twitter) 投稿インテントURL
const xIntentUrl = computed(() => {
  const text = generateReceiptShareText(summary.value);
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
});

// Web Share API (ファイル共有) が利用可能か判定
const canShareFiles = ref(false);

onMounted(() => {
  if (typeof navigator !== 'undefined' && navigator.canShare) {
    try {
      const dummyFile = new File(['test'], 'test.png', { type: 'image/png' });
      canShareFiles.value = navigator.canShare({ files: [dummyFile] });
    } catch (e) {
      canShareFiles.value = false;
    }
  }
});

// モーダルが開かれたらCanvas描画
watch(() => props.isOpen, async (open) => {
  if (open) {
    isGenerating.value = true;
    await nextTick();
    setTimeout(() => {
      if (receiptCanvasRef.value) {
        receiptDataUrl.value = drawReceiptToCanvas(receiptCanvasRef.value, summary.value);
      }
      isGenerating.value = false;
    }, 100);
  }
});

// 画像ダウンロード
const downloadImage = () => {
  if (!receiptDataUrl.value && receiptCanvasRef.value) {
    receiptDataUrl.value = receiptCanvasRef.value.toDataURL('image/png');
  }
  if (!receiptDataUrl.value) return;

  const a = document.createElement('a');
  a.href = receiptDataUrl.value;
  a.download = `VGGC12th_receipt_${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// ネイティブファイルシェア (iOS Safari / Android Chrome)
const shareNativeFile = async () => {
  if (!receiptCanvasRef.value) return;

  try {
    receiptCanvasRef.value.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `VGGC12th_receipt_${Date.now()}.png`, { type: 'image/png' });
      const text = generateReceiptShareText(summary.value);

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'VGGC 12th 戦利品レシート',
          text
        });
      } else {
        downloadImage();
      }
    }, 'image/png');
  } catch (err) {
    console.error('シェアエラー:', err);
    downloadImage();
  }
};

// テキストコピー
const copyShareText = async () => {
  try {
    const text = generateReceiptShareText(summary.value);
    await navigator.clipboard.writeText(text);
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2500);
  } catch (e) {
    console.error('コピー失敗:', e);
  }
};
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
</style>
