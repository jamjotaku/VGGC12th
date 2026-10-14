<template>
  <div class="flex flex-col min-h-full pb-20 md:pb-6 p-3 md:p-6 space-y-4 md:space-y-6">
    <div class="flex flex-col md:grid md:grid-cols-12 md:gap-6 space-y-4 md:space-y-0">
      
      <!-- 左カラム: フリーメモ (md:col-span-6) -->
      <div class="md:col-span-6 bg-white rounded-2xl shadow-sm border border-green-100 p-4 md:p-5 flex flex-col min-h-[260px] md:min-h-[460px]">
        <div class="mb-3 flex items-center justify-between border-b border-green-50 pb-2.5">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 bg-green-100 text-green-700 rounded-lg flex items-center justify-center font-bold text-xs">
              ✍️
            </div>
            <h2 class="font-bold text-gray-800 text-sm md:text-base">フリーメモ</h2>
          </div>
          <span class="text-[10px] text-gray-400">自動保存されます</span>
        </div>
        <textarea :value="freeMemoText" 
                  @input="$emit('update:freeMemoText', $event.target.value)" 
                  :readonly="isReadOnly" 
                  placeholder="当日の待ち合わせ、手伝いの予定、気になることなどを自由にメモ..." 
                  class="flex-1 w-full p-3 text-sm rounded-xl border border-gray-100 focus:ring-2 focus:ring-green-400 resize-none bg-green-50/20 leading-relaxed outline-none"></textarea>
      </div>

      <!-- 右カラム: 両替計算 ＆ 持ち物チェックリスト (md:col-span-6) -->
      <div class="md:col-span-6 space-y-4">
        
        <!-- ★ 🪙 両替・金種計算ナビ (買い物リストから自動逆算) -->
        <div class="bg-white rounded-2xl shadow-sm border border-amber-200 p-4 md:p-5 space-y-3">
          <div class="flex items-center justify-between border-b border-amber-100 pb-2">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 bg-amber-100 text-amber-800 rounded-lg flex items-center justify-center font-bold text-xs">
                🪙
              </div>
              <h2 class="font-bold text-gray-900 text-sm md:text-base">両替・金種目安</h2>
            </div>
            <span class="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-bold">
              合計: ¥{{ (currencyBreakdown?.totalAmount || 0).toLocaleString() }}
            </span>
          </div>

          <p class="text-[11px] text-gray-500 leading-snug">
            買い物リストの登録金額から、お釣りなしでピッタリ払うための目安を自動逆算しています。
          </p>

          <div class="grid grid-cols-3 gap-2 pt-1">
            <div class="bg-amber-50/60 border border-amber-200 rounded-xl p-2.5 text-center">
              <span class="text-[10px] text-gray-500 font-bold block mb-0.5">千円札</span>
              <span class="text-base md:text-xl font-bold font-mono text-gray-900">{{ currencyBreakdown?.bills1000 || 0 }}</span>
              <span class="text-[10px] text-gray-500 font-normal"> 枚</span>
              <span class="text-[9px] text-gray-400 block mt-0.5 font-mono">¥{{ ((currencyBreakdown?.bills1000 || 0) * 1000).toLocaleString() }}</span>
            </div>

            <div class="bg-amber-50/60 border border-amber-200 rounded-xl p-2.5 text-center">
              <span class="text-[10px] text-gray-500 font-bold block mb-0.5">500円玉</span>
              <span class="text-base md:text-xl font-bold font-mono text-gray-900">{{ currencyBreakdown?.coins500 || 0 }}</span>
              <span class="text-[10px] text-gray-500 font-normal"> 枚</span>
              <span class="text-[9px] text-gray-400 block mt-0.5 font-mono">¥{{ ((currencyBreakdown?.coins500 || 0) * 500).toLocaleString() }}</span>
            </div>

            <div class="bg-amber-50/60 border border-amber-200 rounded-xl p-2.5 text-center">
              <span class="text-[10px] text-gray-500 font-bold block mb-0.5">100円玉</span>
              <span class="text-base md:text-xl font-bold font-mono text-gray-900">{{ currencyBreakdown?.coins100 || 0 }}</span>
              <span class="text-[10px] text-gray-500 font-normal"> 枚</span>
              <span class="text-[9px] text-gray-400 block mt-0.5 font-mono">¥{{ ((currencyBreakdown?.coins100 || 0) * 100).toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <!-- ★ 🎒 即売会 持ち物チェックリスト -->
        <div class="bg-white rounded-2xl shadow-sm border border-blue-100 p-4 md:p-5 space-y-3">
          <div class="flex items-center justify-between border-b border-blue-50 pb-2">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-xs">
                🎒
              </div>
              <h2 class="font-bold text-gray-900 text-sm md:text-base">持ち物チェック</h2>
            </div>
            <span class="text-[10px] text-blue-700 font-bold">
              {{ checklist.filter(i => i.done).length }} / {{ checklist.length }} 完了
            </span>
          </div>

          <!-- チェックリスト一覧 -->
          <div class="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
            <div v-for="(item, idx) in checklist" :key="idx"
                 @click="toggleCheckItem(idx)"
                 class="flex items-center justify-between p-2 rounded-xl border transition cursor-pointer select-none text-xs"
                 :class="item.done ? 'bg-gray-50 text-gray-400 border-gray-200 line-through' : 'bg-blue-50/30 text-gray-800 border-blue-100 hover:bg-blue-50/60'">
              <div class="flex items-center gap-2 min-w-0 pr-2">
                <div class="w-4 h-4 rounded flex items-center justify-center shrink-0 border transition"
                     :class="item.done ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'">
                  <svg v-if="item.done" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                </div>
                <span class="truncate font-medium">{{ item.text }}</span>
              </div>
              <button @click.stop="removeCheckItem(idx)" class="text-gray-300 hover:text-red-500 p-0.5 rounded transition" title="削除">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <!-- 持ち物追加入力 -->
          <div class="flex gap-2 pt-1">
            <input type="text" v-model="newCheckItemText" @keyup.enter="addCheckItem" placeholder="持ち物を追加 (例: ペン、羽織る上着)"
                   class="flex-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none">
            <button @click="addCheckItem" class="bg-blue-600 text-white px-3 py-1.5 rounded-xl font-bold text-xs hover:bg-blue-700 transition shrink-0 shadow-sm">
              ＋追加
            </button>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  freeMemoText: {
    type: String,
    default: ''
  },
  isReadOnly: {
    type: Boolean,
    default: false
  },
  currencyBreakdown: {
    type: Object,
    default: () => ({ totalAmount: 0, bills1000: 0, coins500: 0, coins100: 0 })
  }
});

defineEmits(['update:freeMemoText']);

const defaultChecklist = [
  { text: '小銭入れ（1万円札を崩したか？）', done: false },
  { text: '大きめのトートバッグ・エコバッグ', done: false },
  { text: 'クリアファイル / 硬質ケース（折れ防止）', done: false },
  { text: '身分証明書・入場チケット', done: false },
  { text: 'モバイルバッテリー・充電ケーブル', done: false },
  { text: '飲み物・軽食・塩分タブレット', done: false }
];

const checklist = ref([]);
const newCheckItemText = ref('');

// キャッシュ復元
try {
  const storedList = localStorage.getItem('vggc12th_checklist');
  if (storedList) {
    checklist.value = JSON.parse(storedList);
  } else {
    checklist.value = defaultChecklist;
  }
} catch (e) {
  checklist.value = defaultChecklist;
}

const saveChecklist = () => {
  try {
    localStorage.setItem('vggc12th_checklist', JSON.stringify(checklist.value));
  } catch (e) {}
};

const toggleCheckItem = (idx) => {
  checklist.value[idx].done = !checklist.value[idx].done;
  saveChecklist();
};

const addCheckItem = () => {
  const val = newCheckItemText.value.trim();
  if (!val) return;
  checklist.value.push({ text: val, done: false });
  newCheckItemText.value = '';
  saveChecklist();
};

const removeCheckItem = (idx) => {
  checklist.value.splice(idx, 1);
  saveChecklist();
};
</script>
