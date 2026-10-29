<template>
  <div class="flex flex-col min-h-full pb-28 md:pb-6 p-3 md:p-6 space-y-4 md:space-y-6">
    <div class="flex flex-col md:grid md:grid-cols-12 md:gap-6 space-y-4 md:space-y-0">
      
      <!-- 左カラム: 当日タイムスケジュール ＆ フリーメモ (md:col-span-7) -->
      <div class="md:col-span-7 space-y-4">
        
        <!-- ★ ⏰ 当日個人タイムスケジュール (実時間NOW連動・サークル連携) -->
        <PersonalTimeline
          ref="timelineRef"
          :timeline-events="timelineEvents"
          :circles="circles"
          :saved-list="savedList"
          :is-read-only="isReadOnly"
          @update:timeline-events="$emit('update:timelineEvents', $event)"
          @open-circle="$emit('openCircle', $event)"
          @jump-to-map="$emit('jumpToMap', $event)"
        />

        <!-- ★ ✍️ フリーメモ (自動保存) -->
        <div class="bg-white rounded-2xl shadow-sm border border-green-100 p-4 md:p-5 flex flex-col min-h-[220px]">
          <div class="mb-2.5 flex items-center justify-between border-b border-green-50 pb-2">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 bg-green-100 text-green-700 rounded-lg flex items-center justify-center font-bold text-xs">
                ✍️
              </div>
              <h2 class="font-bold text-gray-800 text-sm md:text-base">フリーメモ</h2>
            </div>
            <span class="text-[10px] text-gray-400">クラウド・端末に自動保存</span>
          </div>
          <textarea :value="freeMemoText" 
                    @input="$emit('update:freeMemoText', $event.target.value)" 
                    :readonly="isReadOnly" 
                    placeholder="当日の手伝いの予定、気になるサークルの合流連絡などを自由にメモ..." 
                    class="flex-1 w-full min-h-[140px] p-3 text-xs md:text-sm rounded-xl border border-gray-100 focus:ring-2 focus:ring-green-400 resize-none bg-green-50/20 leading-relaxed outline-none"></textarea>
        </div>

      </div>

      <!-- 右カラム: 両替計算 ＆ 持ち物チェックリスト (md:col-span-5) -->
      <div class="md:col-span-5 space-y-4">
        
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

        <!-- ★ 🏪 会場(TRC)周辺サバイバルガイド ＆ ATM・コンビニ情報 -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-5 space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2 cursor-pointer select-none"
               @click="isGuideOpen = !isGuideOpen">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-bold text-xs">
                🏪
              </div>
              <div class="flex items-center gap-2">
                <h2 class="font-bold text-gray-900 text-sm md:text-base">会場(TRC)周辺 ATM・コンビニ</h2>
                <span class="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  土曜営業情報
                </span>
              </div>
            </div>
            <button class="text-xs text-gray-400 hover:text-gray-600 font-bold transition">
              {{ isGuideOpen ? '▲ たたむ' : '▼ ひらく' }}
            </button>
          </div>

          <div v-show="isGuideOpen" class="space-y-3 pt-0.5">
            <!-- 🚨 最重要Tipsアラート -->
            <div class="bg-amber-50 border border-amber-300 rounded-xl p-2.5 space-y-1 text-xs text-amber-950">
              <div class="font-extrabold flex items-center gap-1.5 text-amber-900">
                <span>🚨</span>
                <span>現金は「乗換駅」で事前に下ろすのが絶対の鉄則！</span>
              </div>
              <p class="text-[11px] leading-relaxed text-amber-900/90">
                会場真下のローソンATMは開場前後に<strong>凄まじい長蛇の列</strong>になり、過去には<strong>千円札が一時枯渇</strong>した前例があります。<br>
                モノレール乗換駅の<strong>浜松町駅</strong>や、京急線<strong>平和島駅</strong>、JR<strong>大森駅</strong>で事前に十分な千円札・小銭をご用意ください。
              </p>
            </div>

            <!-- 土曜営業のATM・コンビニスポット一覧 -->
            <div class="space-y-2">
              <div class="text-[11px] font-bold text-gray-700 flex items-center justify-between">
                <span>📍 土曜日(11/14) 営業スポット</span>
                <span class="text-[10px] text-gray-400">TRC敷地内</span>
              </div>

              <!-- スポット1: ローソン 東京流通センター店 -->
              <div class="p-2.5 rounded-xl border border-blue-200 bg-blue-50/30 space-y-1 text-xs">
                <div class="flex items-center justify-between">
                  <span class="font-extrabold text-gray-900 flex items-center gap-1">
                    <span>🏪 ローソン 東京流通センター店</span>
                  </span>
                  <span class="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded">24時間営業</span>
                </div>
                <div class="flex items-center justify-between text-[11px] text-gray-600">
                  <span>場所: センタービル1F (展示場真下)</span>
                  <span class="font-bold text-blue-700">🏧 ローソン銀行ATM</span>
                </div>
                <p class="text-[10.5px] text-gray-500 bg-white/80 p-1.5 rounded-lg border border-gray-100">
                  ⚠️ 最も近いですが大混雑します。飲料水・軽食の調達はお早めに。
                </p>
              </div>

              <!-- スポット2: 東京流通センター内郵便局 -->
              <div class="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-1 text-xs">
                <div class="flex items-center justify-between">
                  <span class="font-extrabold text-gray-900 flex items-center gap-1">
                    <span>🏣 東京流通センター内郵便局</span>
                    <span class="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">穴場</span>
                  </span>
                  <span class="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded font-mono">土曜 9:00〜17:00</span>
                </div>
                <div class="flex items-center justify-between text-[11px] text-gray-600">
                  <span>場所: センタービル1F</span>
                  <span class="font-bold text-emerald-700">🏧 ゆうちょ銀行ATM</span>
                </div>
                <p class="text-[10.5px] text-gray-500 bg-white/80 p-1.5 rounded-lg border border-gray-100">
                  💡 土曜も稼働！ローソンATMが大行列の際、ゆうちょや提携都市銀行カードで引き出せます。
                </p>
              </div>

              <!-- スポット3: ローソン TRC物流ビルA棟店 -->
              <div class="p-2 rounded-xl border border-gray-200 bg-gray-50/60 flex items-center justify-between text-xs">
                <div>
                  <div class="font-bold text-gray-800">🏪 ローソン TRC物流ビルA棟店</div>
                  <div class="text-[10.5px] text-gray-500">駅から北東へ徒歩約3分 / 24時間 / 🏧 ローソン銀行</div>
                </div>
                <span class="text-[10px] text-gray-500 shrink-0 font-medium bg-white px-1.5 py-0.5 rounded border border-gray-200">迂回先</span>
              </div>

              <!-- スポット4: ローソン TRC 南B棟店 -->
              <div class="p-2 rounded-xl border border-gray-200 bg-gray-50/60 flex items-center justify-between text-xs">
                <div>
                  <div class="font-bold text-gray-800">🏪 ローソン TRC 南B棟店</div>
                  <div class="text-[10.5px] text-gray-500">物流ビルB棟南側1F (徒歩4〜5分) / 🏧 ローソン銀行</div>
                </div>
                <span class="text-[10px] text-gray-500 shrink-0 font-medium bg-white px-1.5 py-0.5 rounded border border-gray-200">奥の店舗</span>
              </div>
            </div>

            <!-- Googleマップ外部リンクボタン -->
            <a href="https://www.google.com/maps/search/東京流通センター+コンビニ+ATM/" target="_blank"
               class="w-full py-2 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs">
              <span>📍 Googleマップで周辺ATM・コンビニを開く</span>
              <span>↗</span>
            </a>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import PersonalTimeline from './PersonalTimeline.vue';

const props = defineProps({
  freeMemoText: {
    type: String,
    default: ''
  },
  timelineEvents: {
    type: Array,
    default: () => []
  },
  circles: {
    type: Array,
    default: () => []
  },
  savedList: {
    type: Object,
    default: () => ({})
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

defineEmits(['update:freeMemoText', 'update:timelineEvents', 'openCircle', 'jumpToMap']);

const timelineRef = ref(null);

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
const isGuideOpen = ref(true);

// 持ち物チェックリストのキャッシュ復元
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

// 外部からタイムライン追加モーダルを直接呼び出すためのメソッド
const openAddTimelineModal = (preset = {}) => {
  timelineRef.value?.openAddModal(preset);
};

defineExpose({
  openAddTimelineModal
});
</script>