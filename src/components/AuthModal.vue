<template>
  <transition name="modal">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" @click.self="$emit('close')">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <button @click="$emit('close')" class="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <div class="text-center mb-6">
          <h2 class="text-xl font-bold">ログイン / 登録</h2>
        </div>
        <div v-if="authError" class="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">{{ authError }}</div>
        <div v-if="authMessage" class="bg-blue-50 text-blue-600 p-3 rounded-lg mb-4 text-sm font-medium">{{ authMessage }}</div>
        <form @submit.prevent="handleAuth" class="space-y-4">
          <input type="text" v-model="authId" placeholder="ユーザーID（半角英数字）" required class="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
          <input type="password" v-model="authPassword" minlength="6" placeholder="パスワード（6文字以上）" required class="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
          <div class="flex gap-3 pt-4">
            <button type="submit" @click="authMode = 'login'" class="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">ログイン</button>
            <button type="submit" @click="authMode = 'register'" class="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition">新規登録</button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue';
import { supabaseClient } from '../supabase';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  isOnline: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['close', 'authSuccess']);

const authId = ref('');
const authPassword = ref('');
const authMode = ref('login');
const authError = ref('');
const authMessage = ref('');

const handleAuth = async () => {
  if (!props.isOnline) {
    authError.value = 'オフライン状態ではログイン・登録できません。通信環境を確認してください。';
    return;
  }
  authError.value = '';
  authMessage.value = '';
  const dummyEmail = authId.value.trim() + '@vggc.dummy.local';
  try {
    if (authMode.value === 'register') {
      const { error } = await supabaseClient.auth.signUp({ email: dummyEmail, password: authPassword.value });
      if (error) throw error;
      authMessage.value = '登録成功！ログインします...';
      setTimeout(() => {
        emit('close');
        emit('authSuccess');
      }, 1000);
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({ email: dummyEmail, password: authPassword.value });
      if (error) throw error;
      emit('close');
      emit('authSuccess');
    }
  } catch (err) {
    authError.value = err.message === 'Invalid login credentials' ? 'IDまたはパスワードが間違っています。' : err.message;
  }
};
</script>
