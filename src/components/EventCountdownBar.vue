<template>
  <div class="relative z-10 transition-all duration-300">
    <!-- 常時表示トップバー -->
    <div 
      @click="toggleExpand" 
      class="px-3 py-2 cursor-pointer transition select-none flex items-center justify-between shadow-sm"
      :class="barStyle"
    >
      <div class="flex items-center gap-2 min-w-0 pr-2">
        <!-- 状態バッジ -->
        <span class="text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 shadow-sm" :class="badgeStyle">
          {{ countdown.badge }}
        </span>

        <!-- カウントダウンテキスト -->
        <span class="text-xs md:text-sm font-bold truncate">
          {{ countdown.text }}
        </span>
      </div>

      <!-- 開閉トグルボタン -->
      <button 
        type="button" 
        class="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg shrink-0 transition"
        :class="buttonStyle"
      >
        <span>タイム表</span>
        <svg 
          class="w-3.5 h-3.5 transition-transform duration-200" 
          :class="{'rotate-180': isExpanded}" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>

    <!-- アコーディオン展開：当日のタイムスケジュール詳細 -->
    <div 
      v-show="isExpanded" 
      class="bg-white border-b border-gray-200 shadow-md p-3 md:p-4 text-xs animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <div class="flex justify-between items-center mb-2 pb-1.5 border-b border-gray-100">
        <span class="font-bold text-gray-800 flex items-center gap-1.5">
          <span>🗓️ 11/14(土) 当日タイムテーブル</span>
        </span>
        <span class="text-[10px] text-gray-500">TRC第一展示場 (A-Dホール)</span>
      </div>

      <ul class="space-y-1.5">
        <li 
          class="flex items-center justify-between p-2 rounded-xl transition border" 
          :class="isCurrentSchedule('9:45') ? 'bg-blue-50 border-blue-200 font-bold' : 'bg-gray-50/50 border-gray-100'"
        >
          <div class="flex items-center gap-2">
            <span class="w-14 font-mono font-bold text-gray-700">09:45-</span>
            <span class="text-gray-800">一般参加者受付開始</span>
          </div>
          <span v-if="isCurrentSchedule('9:45')" class="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">NOW</span>
        </li>

        <li 
          class="flex items-center justify-between p-2 rounded-xl transition border" 
          :class="isCurrentSchedule('10:00') ? 'bg-blue-50 border-blue-200 font-bold' : 'bg-gray-50/50 border-gray-100'"
        >
          <div class="flex items-center gap-2">
            <span class="w-14 font-mono font-bold text-gray-700">10:00-</span>
            <span class="text-gray-800">サークル入場 (11:40迄) / 更衣室開場</span>
          </div>
          <span v-if="isCurrentSchedule('10:00')" class="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">NOW</span>
        </li>

        <li 
          class="flex items-center justify-between p-2 rounded-xl transition border" 
          :class="isCurrentSchedule('12:00') ? 'bg-pink-50 border-pink-300 ring-2 ring-pink-400 font-bold' : 'bg-blue-50/30 border-blue-100'"
        >
          <div class="flex items-center gap-2">
            <span class="w-14 font-mono font-bold text-blue-600">12:00</span>
            <span class="text-blue-800 font-bold">即売会開会（一般入場開始）</span>
          </div>
          <span v-if="isCurrentSchedule('12:00')" class="text-[10px] bg-pink-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">開催中🔥</span>
        </li>

        <li 
          class="flex items-center justify-between p-2 rounded-xl transition border" 
          :class="isCurrentSchedule('15:30') ? 'bg-red-50 border-red-200 font-bold' : 'bg-gray-50/50 border-gray-100'"
        >
          <div class="flex items-center gap-2">
            <span class="w-14 font-mono font-bold text-red-500">15:30</span>
            <span class="text-red-700 font-bold">即売会終了</span>
          </div>
          <span v-if="isCurrentSchedule('15:30')" class="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">終了</span>
        </li>

        <li 
          class="flex items-center justify-between p-2 rounded-xl transition border" 
          :class="isCurrentSchedule('15:45') ? 'bg-blue-50 border-blue-200 font-bold' : 'bg-gray-50/50 border-gray-100'"
        >
          <div class="flex items-center gap-2">
            <span class="w-14 font-mono font-bold text-gray-700">15:45-</span>
            <span class="text-gray-800">アフターイベント (17:00完全撤収)</span>
          </div>
          <span v-if="isCurrentSchedule('15:45')" class="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">NOW</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  countdown: {
    type: Object,
    required: true,
    default: () => ({ status: 'countdown', text: '', badge: '' })
  },
  isCurrentSchedule: {
    type: Function,
    required: true
  }
});

const isExpanded = ref(false);

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

// バナーの背景グラデーションスタイル
const barStyle = computed(() => {
  switch (props.countdown.status) {
    case 'running':
      return 'bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 text-white shadow-pink-200';
    case 'today_before':
      return 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-blue-200';
    case 'ended':
      return 'bg-gray-800 text-gray-200';
    default:
      // 事前カウントダウン（あと〇日）
      return 'bg-gradient-to-r from-blue-50 via-indigo-50 to-pink-50 text-blue-950 border-b border-indigo-100';
  }
});

// バッジのスタイル
const badgeStyle = computed(() => {
  switch (props.countdown.status) {
    case 'running':
      return 'bg-white/20 text-white border border-white/30 animate-pulse';
    case 'today_before':
      return 'bg-white/20 text-white border border-white/30';
    case 'ended':
      return 'bg-gray-700 text-gray-300';
    default:
      return 'bg-blue-600 text-white';
  }
});

// トグルボタンのスタイル
const buttonStyle = computed(() => {
  switch (props.countdown.status) {
    case 'running':
    case 'today_before':
      return 'bg-white/20 hover:bg-white/30 text-white';
    case 'ended':
      return 'bg-gray-700 hover:bg-gray-600 text-gray-300';
    default:
      return 'bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200';
  }
});
</script>
