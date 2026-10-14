<template>
  <div v-if="show" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div class="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h2 class="font-bold text-gray-800 flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          予算を設定
        </h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 p-1">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="p-5 flex-1 overflow-y-auto">
        <p class="text-sm text-gray-600 mb-4">イベント全体の購入予算を設定すると、残金が自動で計算されます。</p>
        <div class="mb-4">
          <label class="block text-xs font-bold text-gray-700 mb-1">予算額 (円)</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">¥</span>
            <input type="number" v-model="localBudget" class="w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold text-lg" placeholder="10000" @keyup.enter="handleSave">
          </div>
        </div>
      </div>
      <div class="p-4 border-t bg-gray-50 flex gap-2 justify-end shrink-0">
        <button @click="$emit('close')" class="px-4 py-2 rounded-lg font-bold text-gray-600 hover:bg-gray-200 transition">キャンセル</button>
        <button @click="handleSave" class="px-4 py-2 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 transition">保存する</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  initialBudget: {
    type: [Number, String],
    default: ''
  }
});

const emit = defineEmits(['close', 'save']);
const localBudget = ref(props.initialBudget);

watch(() => props.initialBudget, (newVal) => {
  localBudget.value = newVal;
});

const handleSave = () => {
  emit('save', localBudget.value);
};
</script>
