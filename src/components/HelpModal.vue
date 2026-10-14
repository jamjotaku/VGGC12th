<template>
  <transition name="modal">
    <div v-if="show" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" @click.self="$emit('close')">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div class="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 class="font-bold text-lg text-gray-800">ℹ️ このアプリについて</h2>
          <button @click="$emit('close')" class="p-2 text-gray-400 hover:bg-gray-200 rounded-full">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div class="p-5 overflow-y-auto space-y-5 text-sm text-gray-700">
          <div>
            <h3 class="font-bold text-blue-600 mb-2 border-b-2 border-blue-100 inline-block">🚀 使い方</h3>
            <ul class="space-y-2 list-disc list-inside">
              <li><span class="font-bold">サークル検索:</span> 気になるサークルを探してリストに追加！</li>
              <li><span class="font-bold">お品書き確認:</span> 「詳細」ボタンから公式Xのお品書きをチェック。</li>
              <li><span class="font-bold">クラウド同期:</span> 任意のIDでログインすれば、他の端末とも同期可能。</li>
            </ul>
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
          <button @click="$emit('close')" class="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">確認してはじめる！</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false
  }
});
defineEmits(['close']);
</script>
