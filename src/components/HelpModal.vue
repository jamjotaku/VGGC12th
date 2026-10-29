<template>
  <transition name="modal">
    <div v-if="show" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" @click.self="$emit('close')">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div class="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 class="font-bold text-lg text-gray-800">ℹ️ このアプリについて</h2>
          <button @click="$emit('close')" class="p-2 text-gray-400 hover:bg-gray-200 rounded-full cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div class="p-5 overflow-y-auto space-y-4 text-sm text-gray-700">
          <div>
            <h3 class="font-bold text-blue-600 mb-2 border-b-2 border-blue-100 inline-block">🚀 使い方</h3>
            <ul class="space-y-2 list-disc list-inside text-xs sm:text-sm">
              <li><span class="font-bold">サークル検索:</span> 気になるサークルを探してリストに追加！</li>
              <li><span class="font-bold">お品書き確認:</span> 「詳細」ボタンから公式Xのお品書きをチェック。</li>
              <li><span class="font-bold">クラウド同期:</span> 任意のIDでログインすれば、他の端末とも同期可能。</li>
              <li><span class="font-bold">オフライン利用:</span> 会場電波が途切れても自動キャッシュでそのまま動作。</li>
            </ul>
          </div>

          <!-- PWA自動更新＆バージョンステータス -->
          <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <span>⚡</span>
                <span>アプリのバージョン・更新状態</span>
              </h3>
              <span class="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono font-bold">
                PWA v1.2 (Auto-Update)
              </span>
            </div>
            <p class="text-[11px] text-slate-500 leading-relaxed">
              GitHubレポジトリの更新やお品書きの最新データは、アプリ起動時およびバックグラウンドで自動的にダウンロード・反映されます。
            </p>
            <div class="pt-1 flex items-center gap-2">
              <button @click="handleManualCheck" 
                      :disabled="isChecking"
                      class="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50">
                <svg class="w-3.5 h-3.5 text-blue-600" :class="isChecking ? 'animate-spin' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                <span>{{ isChecking ? '確認中...' : '最新バージョンを確認' }}</span>
              </button>
              <span v-if="checkStatusMsg" class="text-[11px] font-bold" :class="checkStatusMsg.includes('最新') ? 'text-emerald-600' : 'text-blue-600'">
                {{ checkStatusMsg }}
              </span>
            </div>
          </div>

          <div class="bg-red-50 p-3 rounded-lg border border-red-100">
            <h3 class="font-bold text-red-600 mb-1 flex items-center gap-1">⚠️ 免責事項（非公式ツールです）</h3>
            <p class="text-xs text-red-700 leading-relaxed">
              当アプリは有志が作成した<strong>非公式ツール</strong>です。<br>
              クリエイターの皆様の権利を尊重し、<strong>サークルカット等の画像データを独自のサーバーに保存・AI学習等へ利用することは一切ありません。</strong> お品書き等は全てX(Twitter)公式の機能を利用して埋め込んで表示しています。<br><br>
              イベント公式様や、データ元のサイト様へのお問い合わせは固くお断りいたします。
            </p>
          </div>
        </div>
        <div class="p-4 border-t bg-gray-50">
          <button @click="$emit('close')" class="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition cursor-pointer">確認してはじめる！</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue';
import { checkForAppUpdate, applyAppUpdate } from '../utils/pwaUpdater.js';

defineProps({
  show: {
    type: Boolean,
    default: false
  }
});
defineEmits(['close']);

const isChecking = ref(false);
const checkStatusMsg = ref('');

const handleManualCheck = async () => {
  isChecking.value = true;
  checkStatusMsg.value = '';
  try {
    const hasUpdate = await checkForAppUpdate(true);
    if (hasUpdate) {
      checkStatusMsg.value = '🆕 更新があります！';
    } else {
      checkStatusMsg.value = '✓ 最新版です';
    }
  } catch (e) {
    checkStatusMsg.value = '通信エラー';
  } finally {
    isChecking.value = false;
    setTimeout(() => {
      checkStatusMsg.value = '';
    }, 4000);
  }
};
</script>
