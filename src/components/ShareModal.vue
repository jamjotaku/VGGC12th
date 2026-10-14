<template>
  <transition name="modal">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" @click.self="$emit('close')">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <button @click="$emit('close')" class="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <h2 class="text-xl font-bold text-center mb-6">リストを共有する</h2>
        <div class="flex justify-between p-4 bg-gray-50 rounded-xl border mb-4">
          <span class="font-bold text-sm">公開設定</span>
          <input type="checkbox" :checked="isPublic" @change="onTogglePublic" class="w-6 h-6 accent-blue-600">
        </div>
        <div v-if="isPublic" class="flex gap-2">
          <input type="text" readonly :value="shareUrl" class="flex-1 bg-gray-100 px-3 py-3 rounded-lg text-xs select-all">
          <button @click="copyShareUrl" class="bg-gray-800 text-white px-4 py-3 rounded-lg text-sm font-bold active:scale-95 transition">コピー</button>
        </div>
        <p v-if="copySuccess" class="text-xs text-green-600 text-center mt-2 font-bold animate-pulse">コピーしました！</p>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  shareUrl: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close', 'togglePublic']);
const copySuccess = ref(false);

const onTogglePublic = (e) => {
  emit('togglePublic', e.target.checked);
};

const copyShareUrl = () => {
  if (!props.shareUrl) return;
  navigator.clipboard.writeText(props.shareUrl);
  copySuccess.value = true;
  setTimeout(() => copySuccess.value = false, 2000);
};
</script>
